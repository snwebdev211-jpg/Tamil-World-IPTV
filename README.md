# Tamil World IPTV 📺

A free, open-source **M3U playlist directory** with worldwide live TV, Tamil channels at the top, **Sports / Entertainment / Movies / News / Music / Kids** groups, and separate genre links. Bring your own IPTV player.

## Copy one link into your IPTV app

The **first link contains all channels**, arranged in `group-title` sections such as `Tamil | Entertainment`, `Tamil | Movies`, `Sports`, `Movies`, and `News`. Many IPTV apps show those sections in a **Groups / Categories** sidebar. If your app ignores `group-title`, it may still show one numbered list: no remote M3U file can modify your player’s Home button or force it to create tabs. In that case, choose one of these smaller genre lists as a separate playlist inside your app.

- **Everything (Tamil first; all categories)**: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u`
- Tamil TV (all Tamil categories): `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil.m3u`
- Tamil entertainment (includes indexed Sun TV HD): `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-entertainment.m3u`
- Tamil movie TV channels: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-movies.m3u`
- Tamil news: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-news.m3u`
- Tamil music: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-music.m3u`
- Worldwide sports: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/sports.m3u`
- Worldwide entertainment: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/entertainment.m3u`
- Worldwide movies: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/movies.m3u`
- Worldwide news: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/news.m3u`
- Worldwide music: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/music.m3u`
- Worldwide kids: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/kids.m3u`
- Worldwide documentaries: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/documentary.m3u`
- Worldwide series: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/series.m3u`
- Worldwide comedy: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/comedy.m3u`
- Religious: `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/religious.m3u`
- Authorized on-demand Tamil films (empty unless supplied): `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-movies-on-demand.m3u`

**If you're stuck in the numbered channel list:** back out to the IPTV app's playlist/library screen; open **Live TV → Groups/Categories** (wording differs by app), or add `tamil.m3u` / `movies.m3u` as a separate playlist. If there is no groups option, tell us the player app's exact name for app-specific steps. Remove and re-add the playlist or use **Refresh/Update playlist** to load the new groups.

**Sun TV HD:** the public IPTV-org index now includes a `SunTV.in@HD` entry, which the generator places under `Tamil | Entertainment`. This is **not a verified guarantee of playback, availability in your region, or redistribution rights**. KTV, Sun Music, Sun News, Adithya TV and Chutti TV are not guaranteed by this playlist. The official service for Sun Network live channels and Tamil films is [Sun NXT](https://www.sunnxt.com/).

**Streaming vs movie library:** `Tamil | Movies` groups movie **TV channels**; the optional Tamil on-demand playlist only lists direct, public video streams for films authorized for public distribution. It is initially empty.

The generator builds every playlist twice a day and on source changes. Open **Actions → Update IPTV playlists → Run workflow** for a manual update. See [generated channel counts](playlists/status.json).

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