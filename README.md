# Tamil World IPTV 📺

A free, open-source **M3U playlist directory** with worldwide live TV, Tamil channels at the top, and dedicated Tamil movie-channel playlists. Bring your own IPTV player.

## Copy a playlist into your IPTV app

- **All TV (Tamil first):** https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u
- **Tamil TV:** https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil.m3u
- **Tamil movie channels:** https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-movies.m3u
- **Worldwide movie channels:** https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/movies.m3u
- **Authorized Tamil on-demand movies (if any):** https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-movies-on-demand.m3u
- **Generation statistics:** https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/status.json

Generated playlists appear after the first successful GitHub Actions workflow run. Open **Actions → Update IPTV playlists → Run workflow** if you need to build them manually.

## What this project does

An automatic GitHub Actions job refreshes the worldwide IPTV-org public channel index and its Tamil-language list twice daily. It removes duplicate feed entries, prioritizes Tamil streams, labels known Tamil movie channels, and generates separate movie and Tamil playlists. No streaming server, subscription or API key is required.

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