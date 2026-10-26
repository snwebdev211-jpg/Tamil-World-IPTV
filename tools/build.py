#!/usr/bin/env python3
"""Build public IPTV M3U indexes; never fetch, host or decrypt actual video."""
import datetime as dt
import ipaddress
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORLD = 'https://iptv-org.github.io/iptv/index.category.m3u'
TAMIL = 'https://iptv-org.github.io/iptv/languages/tam.m3u'
BLOCKED = 'https://iptv-org.github.io/api/blocklist.json'
HEAD = '#EXTM3U\n'
ATTR = re.compile(r'([\w-]+)="([^"]*)"')
SECRET = {'token', 'key', 'api_key', 'apikey', 'auth', 'signature', 'sig', 'expires',
          'exp', 'password', 'user', 'username', 'session', 'jwt', 'access_token'}

# Group order keeps Tamil channels first even when the app shows only a numbered list.
CATEGORY_ORDER = ('Entertainment', 'Movies', 'Sports', 'News', 'Music', 'Kids',
                  'Series', 'Comedy', 'Documentary', 'Education', 'Religious',
                  'Culture', 'Lifestyle', 'Family', 'Business', 'Travel', 'General', 'Other')
CATEGORY_ALIASES = {'film': 'Movies', 'movie': 'Movies', 'movies': 'Movies',
                    'sport': 'Sports', 'sports': 'Sports',
                    'children': 'Kids', 'kids': 'Kids',
                    'series': 'Series', 'animation': 'Kids',
                    'religious': 'Religious', 'relax': 'Lifestyle',
                    'undefined': 'Other', 'shop': 'Lifestyle',
                    'auto': 'Lifestyle', 'weather': 'News',
                    'legislative': 'News', 'public': 'General',
                    'outdoor': 'Lifestyle', 'classic': 'Entertainment',
                    'cooking': 'Lifestyle', 'science': 'Documentary',
                    'interactive': 'Entertainment'}

def category(c):
    raw = c['group'].strip().casefold()
    if raw in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[raw]
    match = next((name for name in CATEGORY_ORDER if raw == name.casefold()), None)
    if match:
        return match
    if re.search(r'\b(movies?|cinema|films?)\b', c['title'], re.I):
        return 'Movies'
    if re.search(r'\b(sports?|cricket|football)\b', c['title'], re.I):
        return 'Sports'
    if re.search(r'\bnews\b', c['title'], re.I):
        return 'News'
    if re.search(r'\b(music|hits|radio)\b', c['title'], re.I):
        return 'Music'
    return 'Other' if not raw or raw in ('tamil', 'unknown') else raw.title()


def order(c, groups):
    group = groups[key(c)]
    tamil = group.startswith('Tamil | ')
    label = group.split(' | ', 1)[-1]
    return (0 if tamil else 1,
            CATEGORY_ORDER.index(label) if label in CATEGORY_ORDER else len(CATEGORY_ORDER),
            c['title'].casefold(), c['url'])


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'TamilWorldIPTV/1.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read(20_000_001)
    if len(data) > 20_000_000:
        raise ValueError('Upstream source is too large')
    return data.decode('utf-8-sig', errors='replace')


def safe(url):
    try:
        x = urllib.parse.urlsplit(url)
        if x.scheme not in ('http', 'https') or not x.hostname or x.username or x.password:
            return False
        host = x.hostname.lower().rstrip('.')
        if host in ('localhost',) or host.endswith(('.local', '.internal')):
            return False
        try:
            if not ipaddress.ip_address(host).is_global:
                return False
        except ValueError:
            pass
        return len(url) < 4096 and not any(k.lower() in SECRET for k, _ in urllib.parse.parse_qsl(x.query))
    except ValueError:
        return False


def parse(data):
    if not data.lstrip().startswith('#EXTM3U'):
        raise ValueError('Invalid upstream playlist')
    entries, meta, opts = [], None, []
    for line in data.splitlines():
        line = line.strip()
        if line.startswith('#EXTINF:'):
            meta, opts = line, []
        elif meta and line.startswith(('#EXTVLCOPT:', '#KODIPROP:')):
            opts.append(line)
        elif meta and line and not line.startswith('#'):
            if safe(line):
                attrs = dict(ATTR.findall(meta))
                title = meta.split(',', 1)[-1].strip()
                entries.append({'meta': meta, 'url': line, 'opts': opts,
                                'id': attrs.get('tvg-id', ''), 'title': title,
                                'group': attrs.get('group-title', '')})
            meta, opts = None, []
    return entries


def blocked_entries():
    return {item['channel'].casefold() for item in json.loads(get(BLOCKED))
            if isinstance(item, dict) and isinstance(item.get('channel'), str)}


def exclusions():
    output = set()
    for raw in (ROOT / 'custom/exclude.txt').read_text().splitlines():
        s = raw.strip()
        if s and not s.startswith('#'):
            if not s.startswith(('id:', 'name:', 'url:')):
                raise ValueError('Invalid exclude rule: ' + s)
            output.add(s.casefold())
    return output


def key(c):
    return (c['id'].casefold() or c['title'].casefold(), c['url'])


def is_movie(c):
    return category(c) == 'Movies'


def put_category(c, category):
    ext = re.sub(r'\s+group-title="[^"]*"', '', c['meta'])
    prefix, delim, suffix = ext.partition(',')
    return prefix + ' group-title="' + category + '"' + delim + suffix


def playlist(items, groups):
    data = [HEAD.rstrip()]
    for c in items:
        data.append(put_category(c, groups[key(c)]))
        data.extend(c['opts'])
        data.append(c['url'])
    return '\n'.join(data) + '\n'


def main():
    world = parse(get(WORLD))
    tamil = parse(get(TAMIL))
    additions = parse((ROOT / 'custom/authorized.m3u').read_text())
    vod = parse((ROOT / 'custom/authorized-tamil-movies.m3u').read_text())
    if len(world) < 100 or not tamil:
        raise ValueError('Source appears empty; preserving previously generated playlists')
    blocked, excluded = blocked_entries(), exclusions()

    def permitted(c):
        channel_id = c['id'].split('@', 1)[0].casefold()
        return (channel_id not in blocked and c['id'].casefold() not in blocked
                and ('id:' + c['id']).casefold() not in excluded
                and ('id:' + channel_id) not in excluded
                and ('name:' + c['title']).casefold() not in excluded
                and ('url:' + c['url']).casefold() not in excluded)

    tamil_keys = {key(c) for c in tamil if permitted(c)}
    tamil_ids = {c['id'].split('@', 1)[0].casefold() for c in tamil if permitted(c) and c['id']}
    records = {}
    vod_keys = set()
    for c in world + tamil + additions:
        if not permitted(c):
            continue
        k = key(c)
        records.setdefault(k, c)
        if (k in tamil_keys
                or any(term in (c['title'] + c['group']).casefold() for term in ('tamil', 'தமிழ்', 'tamizh'))
                or (c['id'] and c['id'].split('@', 1)[0].casefold() in tamil_ids)):
            tamil_keys.add(k)
    for c in vod:
        if permitted(c):
            records[key(c)] = c
            tamil_keys.add(key(c))
            vod_keys.add(key(c))

    def group(c):
        k = key(c)
        if k in vod_keys:
            return 'Tamil Movies - On Demand'
        label = category(c)
        return 'Tamil | ' + label if k in tamil_keys else label

    groups = {k: group(c) for k, c in records.items()}
    all_items = sorted(records.values(), key=lambda c: order(c, groups))
    tamil_items = [c for c in all_items if key(c) in tamil_keys]
    movie_items = [c for c in all_items if is_movie(c) and key(c) not in vod_keys]
    tamil_movie_items = [c for c in movie_items if key(c) in tamil_keys]
    vod_items = [c for c in all_items if key(c) in vod_keys]
    outputs = {'all.m3u': all_items, 'tamil.m3u': tamil_items,
               'movies.m3u': movie_items, 'tamil-movies.m3u': tamil_movie_items,
               'tamil-movies-on-demand.m3u': vod_items}
    for section in ('Sports', 'Entertainment', 'News', 'Music', 'Kids', 'Movies',
                    'Documentary', 'Religious', 'Series', 'Comedy'):
        outputs[section.lower() + '.m3u'] = [
            c for c in all_items if groups[key(c)].split(' | ')[-1] == section
            and key(c) not in vod_keys]
    outputs['tamil-entertainment.m3u'] = [
        c for c in tamil_items if groups[key(c)] == 'Tamil | Entertainment']
    outputs['tamil-news.m3u'] = [
        c for c in tamil_items if groups[key(c)] == 'Tamil | News']
    outputs['tamil-music.m3u'] = [
        c for c in tamil_items if groups[key(c)] == 'Tamil | Music']
    output = ROOT / 'playlists'
    output.mkdir(exist_ok=True)
    for name, items in outputs.items():
        (output / name).write_text(playlist(items, groups), encoding='utf-8')
    status = {'updated_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
              'total': len(all_items), 'tamil': len(tamil_items),
              'movie_channels': len(movie_items), 'tamil_movie_channels': len(tamil_movie_items),
              'authorized_tamil_on_demand_films': len(vod_items),
              'categories': {name: len(items) for name, items in outputs.items() if name.endswith('.m3u')},
              'source': 'iptv-org public directory; custom channels require authorization'}
    (output / 'status.json').write_text(json.dumps(status, indent=2) + '\n', encoding='utf-8')
    print(status)


if __name__ == '__main__':
    main()
