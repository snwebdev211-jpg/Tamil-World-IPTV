#!/usr/bin/env python3
"""Produce Smart-STB-friendly, HLS-only, connectivity-tested public stream lists.

A positive check proves the HLS manifest is reachable from GitHub's runner.
It does not prove H264/AAC decoding or Canadian playback.
"""
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import datetime as dt
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

try:
    from tools.build import ROOT, parse, key, playlist, safe
except ModuleNotFoundError:
    from build import ROOT, parse, key, playlist, safe

PLAYLIST_DIR = ROOT / 'playlists'
MAX_CHECKS = int(os.getenv('MAX_STREAM_CHECKS', '2500'))
MIN_GOOD = int(os.getenv('MIN_STREAMS_REQUIRED', '10'))
TIMEOUT = float(os.getenv('CHECK_TIMEOUT', '5'))
WORKERS = int(os.getenv('CHECK_WORKERS', '32'))


def is_hls_url(c):
    """Only HLS is considered. MPEG-DASH and bare transport stream URLs are skipped."""
    if not safe(c['url']):
        return False
    path = urllib.parse.urlsplit(c['url']).path.lower()
    if path.endswith(('.mpd', '.mp4', '.mkv', '.ts', '.flv', '.webm')):
        return False
    return path.endswith('.m3u8')


def manifest_looks_compatible(text):
    if not text.lstrip('\ufeff \t\r\n').startswith('#EXTM3U'):
        return False
    if not re.search(r'#EXT-X-(STREAM-INF|TARGETDURATION)', text):
        return False
    codecs = re.findall(r'CODECS="([^"]+)"', text, re.I)
    if codecs:
        # HEVC/H265, AV1, Dolby Vision and HDR10-only variants are not safe
        # defaults for older Samsung Smart TVs. Mixed AVC+HEVC masters are
        # accepted only if AVC is advertised, although the player's ability
        # to pick the AVC variant still requires device testing.
        all_codecs = ','.join(codecs).lower()
        forbidden = ('hvc1', 'hev1', 'av01', 'dvh1', 'dvhe')
        if any(c in all_codecs for c in forbidden) and 'avc1' not in all_codecs:
            return False
    return True


def check(c):
    """Check manifest header, not segment decode. Redirects may be geo-limited."""
    url = c['url']
    if not is_hls_url(c):
        return False
    try:
        req = urllib.request.Request(
            url, headers={'User-Agent': 'Mozilla/5.0 (compatible; TamilWorldIPTV/2.0)',
                          'Accept': 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*'})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            if resp.status != 200:
                return False
            data = resp.read(65536)
        text = data.decode('utf-8-sig', errors='replace')
        return manifest_looks_compatible(text)
    except (OSError, ValueError, TimeoutError, urllib.error.URLError):
        return False


def choose_candidates(entries):
    """Fair selection by category; test Tamil channels first before other genres."""
    buckets = defaultdict(list)
    for c in entries:
        if is_hls_url(c):
            bucket = c['group']
            buckets[bucket].append(c)
    tamil = []
    other = []
    for group, items in buckets.items():
        # Stable preference for HTTPS, avoiding playlist churn.
        items.sort(key=lambda x: (not x['url'].startswith('https://'), x['title'].casefold()))
        if group.startswith('Tamil |'):
            tamil.extend(items)
        else:
            other.append(items)
    tamil.sort(key=lambda x: (not x['url'].startswith('https://'), x['title'].casefold()))
    selected = tamil[:MAX_CHECKS]
    # Round robin by category so sports/movies/news don't get pushed out.
    while other and len(selected) < MAX_CHECKS:
        still = []
        for group in other:
            if group and len(selected) < MAX_CHECKS:
                selected.append(group.pop(0))
            if group:
                still.append(group)
        other = still
    return selected


def main():
    all_file = PLAYLIST_DIR / 'all.m3u'
    original = all_file.read_text(encoding='utf-8')
    entries = parse(original)
    if len(entries) < 100:
        raise ValueError('Not enough upstream channels: refusing to overwrite playlists')
    source = PLAYLIST_DIR / 'all-sources.m3u'
    source.write_text(original, encoding='utf-8')
    candidates = choose_candidates(entries)
    print(f'Checking {len(candidates)} candidate HLS streams with {WORKERS} workers.', flush=True)
    checked = {}
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(check, c): c for c in candidates}
        for future in as_completed(futures):
            item = futures[future]
            try:
                checked[key(item)] = bool(future.result())
            except Exception:
                checked[key(item)] = False
    good = {k for k, v in checked.items() if v}
    print(f'Reachable compatible HLS manifests: {len(good)}', flush=True)
    if len(good) < MIN_GOOD:
        raise RuntimeError('Too few accessible HLS streams; preserve published playlist and retry later')
    compatible = [c for c in entries if key(c) in good]
    groups = {key(c): c['group'] for c in compatible}
    all_file.write_text(playlist(compatible, groups), encoding='utf-8')
    (PLAYLIST_DIR / 'smart-stb.m3u').write_text(playlist(compatible, groups), encoding='utf-8')
    # Rebuild each existing category list using exactly the streams that passed
    # the compatible-manifest check. Do not change authorized VOD content.
    counts = {}
    for path in sorted(PLAYLIST_DIR.glob('*.m3u')):
        if path.name in ('all.m3u', 'all-sources.m3u', 'smart-stb.m3u',
                         'tamil-movies-on-demand.m3u'):
            continue
        subset = [c for c in parse(path.read_text(encoding='utf-8')) if key(c) in good]
        local_groups = {key(c): c['group'] for c in subset}
        path.write_text(playlist(subset, local_groups), encoding='utf-8')
        counts[path.name] = len(subset)
    status_file = PLAYLIST_DIR / 'status.json'
    status = json.loads(status_file.read_text(encoding='utf-8'))
    status['compatible_check_utc'] = dt.datetime.now(dt.timezone.utc).isoformat()
    status['all_public_sources'] = len(entries)
    status['hls_candidates_checked'] = len(candidates)
    status['reachable_hls_manifests'] = len(compatible)
    status['total'] = len(compatible)
    status['tamil'] = len([c for c in compatible if c['group'].startswith('Tamil |')])
    status['movie_channels'] = counts.get('movies.m3u', 0)
    status['tamil_movie_channels'] = counts.get('tamil-movies.m3u', 0)
    status['categories'] = {'all.m3u': len(compatible), 'smart-stb.m3u': len(compatible),
                            'all-sources.m3u': len(entries), **counts,
                            'tamil-movies-on-demand.m3u': status.get('authorized_tamil_on_demand_films', 0)}
    status['compatibility_note'] = ('Checked: public HLS manifest responds from GitHub Actions runner. '
                                    'NOT tested: video/audio decoding on Samsung, geoblocking in Canada, '
                                    'segment availability or distribution rights. Not all channels work.')
    status_file.write_text(json.dumps(status, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(status, indent=2), flush=True)


if __name__ == '__main__':
    main()
