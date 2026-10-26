#!/usr/bin/env python3
"""Build a smaller legacy-TV M3U after checking HLS MPEG-TS media segments.

This is a best-effort HEADLESS NETWORK check, not a TV device test or legal
distribution-rights audit. No streams are hosted, proxied, unlocked or decrypted.
Only known public streams from the existing directory are examined.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
import datetime as dt
import json
import os
import re
import urllib.parse
import urllib.request

try:
    from tools.build import ROOT, parse, key, playlist, safe
except ModuleNotFoundError:
    from build import ROOT, parse, key, playlist, safe

DIR = ROOT / 'playlists'
TIMEOUT = float(os.getenv('LEGACY_CHECK_TIMEOUT', '6'))
WORKERS = int(os.getenv('LEGACY_CHECK_WORKERS', '24'))
MAX_CHECKS = int(os.getenv('LEGACY_CHECK_LIMIT', '650'))
MIN_GOOD = int(os.getenv('LEGACY_MIN_GOOD', '12'))
MAX_REDIRECTS = 5
HEADERS = {'User-Agent': 'Mozilla/5.0 (SmartTV; LegacyIPTV/1.0)',
           'Accept': '*/*'}


def fetch(url, length=110000):
    if not safe(url):
        raise ValueError('Unsafe URL')
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        if not safe(response.url):
            raise ValueError('Redirect to an invalid URL')
        if response.status not in (200, 206):
            raise ValueError('Server did not return stream bytes')
        return response.read(length)


def select_variant(manifest, base):
    """Prefer an advertised AVC/H.264 variant at SD/720p for an older TV."""
    lines = [x.strip() for x in manifest.splitlines() if x.strip()]
    variants = []
    for i, line in enumerate(lines):
        if not line.startswith('#EXT-X-STREAM-INF:'):
            continue
        if i+1 >= len(lines) or lines[i+1].startswith('#'):
            continue
        codec_match = re.search(r'CODECS="([^"]+)"',line,re.I)
        codecs = codec_match.group(1).lower() if codec_match else ''
        if any(c in codecs for c in ('hvc1','hev1','av01','dvh1','dvhe')) and 'avc1' not in codecs:
            continue
        if codecs and ('avc1' not in codecs or 'mp4a' not in codecs):
            continue
        res_match = re.search(r'RESOLUTION=(\d+)x(\d+)',line,re.I)
        height = int(res_match.group(2)) if res_match else 0
        if height>1080:
            continue
        bw_match = re.search(r'BANDWIDTH=(\d+)',line,re.I)
        bw = int(bw_match.group(1)) if bw_match else 0
        u=urllib.parse.urljoin(base,lines[i+1])
        if not safe(u):
            continue
        # Favor 360-720p streams within older hardware throughput.
        variants.append((int(height>720),int(bw>4200000),abs((height or 576)-576), bw,u))
    variants.sort()
    return [x[-1] for x in variants[:3]]


def segment_candidate(manifest, base):
    """Return the latest unencrypted MPEG TS segment of a media playlist."""
    if '#EXT-X-TARGETDURATION:' not in manifest or '#EXTINF:' not in manifest:
        return None
    if '#EXT-X-MAP:' in manifest or '#EXT-X-BYTERANGE:' in manifest:
        return None
    for line in manifest.splitlines():
        if line.startswith('#EXT-X-KEY:') and not re.search(r'METHOD=NONE\b',line):
            return None
    lines = [s.strip() for s in manifest.splitlines() if s.strip()]
    media = []
    for i,line in enumerate(lines):
        if line.startswith('#EXTINF:') and i+1 < len(lines):
            x=lines[i+1]
            if not x.startswith('#'):
                u=urllib.parse.urljoin(base,x)
                if safe(u) and urllib.parse.urlsplit(u).path.lower().endswith('.ts'):
                    media.append(u)
    # Last live segment might not yet be on CDN. Try two near-tail segments.
    return media[-3:-1] or media[-1:]


def valid_ts(data):
    # Many TV players require MPEG-TS, whereas fMP4/CMAF is less predictable.
    # Verify consecutive 188-byte TS sync headers, not just an HTTP 200.
    return len(data)>=564 and any(
        data[o]==71 and data[o+188]==71 and data[o+376]==71
        for o in range(min(188,max(0,len(data)-376))))


def inspect_stream(item):
    try:
        raw=fetch(item['url'])
        text=raw.decode('utf-8-sig',errors='replace')
        if not text.startswith('#EXTM3U'):
            return False
        if '#EXT-X-STREAM-INF:' in text:
            urls=select_variant(text,item['url'])
            if not urls:
                return False
        else:
            urls=[item['url']]
        for variant in urls:
            try:
                inner=text if variant==item['url'] else fetch(variant).decode('utf-8-sig',errors='replace')
                segments=segment_candidate(inner,variant)
                if not segments:
                    continue
                for seg in segments:
                    try:
                        if valid_ts(fetch(seg,length=1316)):
                            return True
                    except Exception:
                        continue
            except Exception:
                continue
    except Exception:
        pass
    return False


def candidates_for_legacy(channels):
    tamil=[c for c in channels if c['group'].startswith('Tamil |')]
    bycat=defaultdict(list)
    for c in channels:
        if not c['group'].startswith('Tamil |'):
            bycat[c['group'].strip()].append(c)
    chosen=tamil[:MAX_CHECKS]
    keys={key(c) for c in chosen}
    priorities=['Entertainment','Movies','Sports','News','Music','Kids',
                'Documentary','Religious','Series','Comedy','Other']
    while len(chosen)<MAX_CHECKS and any(bycat.values()):
        for cat in priorities+sorted(k for k in bycat if k not in priorities):
            if not bycat[cat] or len(chosen)>=MAX_CHECKS:
                continue
            c=bycat[cat].pop(0)
            if key(c) not in keys:
                chosen.append(c)
                keys.add(key(c))
    return chosen


def group_name(item):
    return item['group']


def write_m3u(filename, items):
    group={key(c):group_name(c) for c in items}
    (DIR/filename).write_text(playlist(items,group),encoding='utf-8')


def main():
    sources=DIR/'all.m3u'
    existing=parse(sources.read_text(encoding='utf-8'))
    if len(existing)<100:
        raise RuntimeError('Upstream playlist is missing: original link left unchanged')
    # Preserve previously manifest-checked streams before narrowing legacy list.
    write_m3u('manifest-checked.m3u',existing)
    selection=candidates_for_legacy(existing)
    print('Checking MPEG-TS segments for',len(selection),'candidate streams',flush=True)
    results={}
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        future={pool.submit(inspect_stream,c):c for c in selection}
        for job in as_completed(future):
            c=future[job]
            try:
                results[key(c)]=bool(job.result())
            except Exception:
                results[key(c)]=False
    good=[c for c in selection if results.get(key(c))]
    print('Passed media segment probe:',len(good),flush=True)
    if len(good)<MIN_GOOD:
        raise RuntimeError('Not enough media segments passed; original playlist preserved')
    # Display Tamil first, then category, then channel title in old M3U players.
    write_m3u('all.m3u',good)
    write_m3u('smart-stb.m3u',good)
    subsets={
        'legacy-tamil.m3u':[c for c in good if c['group'].startswith('Tamil |')],
        'legacy-sports.m3u':[c for c in good if c['group'].endswith('Sports')],
        'legacy-movies.m3u':[c for c in good if c['group'].endswith('Movies')],
        'legacy-news.m3u':[c for c in good if c['group'].endswith('News')],
        'legacy-entertainment.m3u':[c for c in good if c['group'].endswith('Entertainment')],
        'legacy-music.m3u':[c for c in good if c['group'].endswith('Music')],
    }
    for name,items in subsets.items():
        write_m3u(name,items)
    path=DIR/'status.json'
    status=json.loads(path.read_text(encoding='utf-8'))
    status.update({
        'legacy_segment_checked_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
        'legacy_candidates_checked':len(selection),
        'legacy_mpegts_segments_passed':len(good),
        'legacy_tamil':len(subsets['legacy-tamil.m3u']),
        'legacy_categories':{name:len(items) for name,items in subsets.items()},
        'legacy_proof':'A public media .ts segment responded with MPEG-TS sync packets from GitHub runner. Codec, rights, geo-access and playback on Samsung in Canada remain unverified.',
        'total':len(good)
    })
    status['categories']['all.m3u']=len(good)
    status['categories']['smart-stb.m3u']=len(good)
    status['categories']['manifest-checked.m3u']=len(existing)
    status['categories'].update({name:len(items) for name,items in subsets.items()})
    path.write_text(json.dumps(status,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:status[k] for k in ('total','legacy_tamil','legacy_categories')},indent=2),flush=True)


if __name__=='__main__':
    main()
