<img src="mag/c/snwd-logo.jpg" alt="SNWD official company logo" width="120">

# Santhos IPTV — Powered by SNWD

**One public M3U IPTV link, hosted directly on GitHub. No website, Vercel deployment, paid subscription, or login required to read the playlist.**

## 📺 MAG / Stalker Portal — classic TV Home and Video Club

**Use this URL inside Smart-STB's Portal settings** (not its M3U playlist field):

```text
https://santhos-iptv.vercel.app/stalker_portal/c/index.html
```

The portal UI uses a classic blue MAG TV layout with the user-supplied SNWD company logo, a central **TV / VIDEO CLUB / MEDIA BROWSER** home row, Tamil and global channel categories, remote-key navigation, search, local favorites and history. It is hosted using Vercel solely to answer the MAG/Stalker portal requests and deliver the interactive TV portal; it is **not a separate Netflix-style product homepage**.

The backend is a **partial independent Stalker-compatible implementation**, not a certified Infomir/Ministra portal. The GitHub workflow tests the backend/API, menu behavior and deployed link; a real Smart-STB device test remains necessary. Some proprietary client firmware may reject an independent portal. Video Club currently offers live movie **channels** only; full on-demand film collections and program guide schedules have not been added because no authorized VOD/EPG source was supplied.

Use the exact `/stalker_portal/c/index.html` URL, not the base domain, to avoid redirects that some older Smart-STB devices do not support. See the [official Smart-STB portal guidance](https://www.smart-stb.net/ssps-kb/black-screen-after-loading-portal-on-some-portals/).

## 🎬 Original M3U playlist — for apps that accept M3U URL

```text
https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u
```

This **remains the original link**. It contains the smaller legacy-TV-focused list, with Tamil entries first, then other channels, grouped by M3U `group-title` metadata. GitHub Actions refreshes the directory automatically.

**IMPORTANT:** The GitHub Raw link is an **M3U playlist**, not the MAG/Stalker portal URL. Compatible IPTV players load the channel list; some show the categories in a sidebar, while older Smart-STB can remain stuck at `PLAYLIST / ALL / BY NUMBER`. **No GitHub M3U file can replace an IPTV app's Home, TV, or Video Club menu.** Our experimental MAG-compatible portal uses a separately running backend on Vercel and cannot be hosted solely by GitHub Raw or GitHub Pages. Do not paste this link into an app's **Stalker Portal** field; select **M3U URL / Playlist URL** instead.

## Choose a smaller IPTV list when an older app has no category menu

All links below are plain M3U playlists, not websites.

| Channel selection | Direct M3U URL |
|---|---|
| All channels | [all.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u) |
| Tamil TV | [legacy-tamil.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-tamil.m3u) |
| Tamil entertainment | [tamil-entertainment.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/tamil-entertainment.m3u) |
| Sports | [legacy-sports.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-sports.m3u) |
| Movie TV channels | [legacy-movies.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-movies.m3u) |
| News | [legacy-news.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-news.m3u) |
| Music | [legacy-music.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-music.m3u) |
| Entertainment | [legacy-entertainment.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-entertainment.m3u) |
| Diagnostic test videos | [diagnostic.m3u](https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/diagnostic.m3u) |

For players that support M3U channel groups, **the one original link is enough**. These smaller lists are useful when a player's interface does not expose grouped categories.

## Playback and movie limitations

The generator checks HLS playlists, then probes a sample MPEG-TS video segment for a smaller set of candidates. **Passing that network test does not prove that a stream plays on your particular TV, in your country, or at a later date.** Channel feeds can disappear or be geo-blocked; audio/video codecs may not be supported. Counts and latest network-check results: [playlists/status.json](playlists/status.json).

The Movies category contains **live television stations showing films**, not full-length on-demand movies. [Authorized on-demand Tamil movie streams](playlists/tamil-movies-on-demand.m3u) is empty until content with the necessary streaming rights is provided. Sun TV, KTV and other premium stations are not guaranteed, and unauthorized decryption or private feeds are not included.

## Setup and maintenance

- For older Samsung Smart-STB, [follow these M3U setup and playback diagnostic instructions](SMART-STB-SETUP.md).
- To refresh channels, use the IPTV app's **Update playlist** feature, or remove/re-add the URL if necessary.
- Playlist creation scripts: [tools/build.py](tools/build.py), [tools/smartstb_filter.py](tools/smartstb_filter.py), [tools/legacy_filter.py](tools/legacy_filter.py).
- Automatic updates: [GitHub Actions](../../actions) twice daily. No PC needs to be left on.
- Add only explicitly authorized streams in [custom/authorized.m3u](custom/authorized.m3u). Remove bad feeds in [custom/exclude.txt](custom/exclude.txt).
- Public source catalogue: [IPTV-org](https://github.com/iptv-org/iptv). This project indexes third-party links; it does not host or transmit the broadcasters' media.

**Project structure:** `mag/` is the deployed custom MAG/Stalker-style TV portal and API; `playlists/` contains M3U links for other IPTV players; `tools/` runs playlist validation and updates; `web/` is an older prototype not needed to use the MAG portal.

MIT-licensed generator code. SNWD name/logo are the property of their owner.
