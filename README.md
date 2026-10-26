# Tamil World IPTV 📺

A free, open-source **M3U playlist directory** with worldwide live TV, Tamil channels at the top, **Sports / Entertainment / Movies / News / Music / Kids** groups, and separate genre links. Bring your own IPTV player.

## IMPORTANT: For Smart-STB on older Samsung TVs

The original Santhos IPTV link is `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u`.

**Current builds are MPEG-TS media-segment checked (best effort)**. This verifies the video transport stream, rather than just a reachable M3U playlist. It still cannot certify every channel on old hardware or in every country.

**Full setup, genre links, and black-screen troubleshooting:** [SMART-STB-SETUP.md](SMART-STB-SETUP.md).

For 2014 Samsung Smart-STB, an M3U file cannot create a Video Club or Movies app tab. When supported, enable the app's **Multiportal** mode and set the genre-specific M3U URLs as separate portal slots. Those are live channel lists, not a Stalker portal.

### Playlist families

- `all.m3u`: original link — small legacy compatibility list with TS segment probing
- `legacy-tamil.m3u`, `legacy-sports.m3u`, `legacy-movies.m3u`, `legacy-news.m3u`: TV-oriented separate categories
- `manifest-checked.m3u`: wider list that only passed HLS manifest check
- `all-sources.m3u`: **unverified** upstream directory
- `diagnostic.m3u`: public test videos to distinguish channel failures from decoder failures
- `status.json`: real counts and testing notes

## Available M3U links

All paths below use the base URL:
`https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/`

- `all.m3u` — **original link**, currently compatible HLS-manifest-checked live channels, Tamil first
- `smart-stb.m3u` — identical compatibility list
- `tamil.m3u` — Tamil channels only
- `tamil-entertainment.m3u`, `tamil-news.m3u`, `tamil-music.m3u`, `tamil-movies.m3u`
- `sports.m3u`, `entertainment.m3u`, `movies.m3u`, `news.m3u`, `music.m3u`, `kids.m3u`, `documentary.m3u`, `religious.m3u`, `series.m3u`, `comedy.m3u`
- `all-sources.m3u` — full upstream index, **unfiltered**, may contain unusable links
- `tamil-movies-on-demand.m3u` — user-supplied, explicitly authorized full movies only, empty unless added
- `diagnostic.m3u` — known public HLS test clips to troubleshoot playback
- `status.json` — current stream check counts and update time

**Sun TV HD** appears in upstream public listings, but that isn't proof that its feed works in your region or on your TV. Official Sun TV, KTV, Sun Music, etc. are available through [Sun NXT](https://www.sunnxt.com/), subject to its subscription and rights restrictions. No unlicensed feeds or encryption bypasses are supplied.

**Important:** The GitHub workflow must finish successfully after an update before the checked playlist goes live. Open the [GitHub Actions tab](https://github.com/snwebdev211-jpg/Tamil-World-IPTV/actions) for updates. If testing fails, the workflow leaves the previously published playlist unchanged.

## What this project does

An automatic GitHub Actions job fetches worldwide IPTV-org public channel indexes twice daily, removes duplicate entries, prioritizes Tamil streams, and checks HLS manifests before publishing filtered genre playlists. No streaming server, subscription or API key is required.

**Movie channels** are linear/live TV stations that show movies, **not** a library of individual films. The optional **on-demand** playlist can include full films *only when an owner has expressly authorized distribution through a public direct playback URL*. Add them to `custom/authorized-tamil-movies.m3u`. The on-demand list may initially be empty.

**Sun TV, KTV, Sun Music and other premium channels are not guaranteed.** Sun Network content is available from its official Sun NXT service. Public indexing or a URL being reachable does not prove permission to redistribute, so do not add unlicensed premium feeds, DRM workarounds, access tokens or private IPTV subscriptions.

### Customize

- `custom/authorized.m3u`: permitted public TV stream entries.
- `custom/authorized-tamil-movies.m3u`: permitted public on-demand film streams; use direct HTTP(S) links, not web-page URLs.
- `custom/exclude.txt`: remove entries via `id:ChannelID`, `name:Exact Name` or `url:ExactURL`.
- `tools/build.py`: the standard-library-only Python generator.
- `.github/workflows/update.yml`: scheduled updates.

Local generation: `python tools/build.py` (requires internet access).

Channel data attribution: [iptv-org/iptv](https://github.com/iptv-org/iptv). IPTV streams belong to their individual operators and may be unavailable due to geo-blocking, outages or rights restrictions. This repository neither hosts, proxies nor decrypts protected broadcasts. Copyright or removal requests are welcome via Issues; add affected entries to `custom/exclude.txt`.

Generator code licensed under MIT.