<img src="mag/c/snwd-logo.jpg" alt="SNWD official company logo" width="120">

# Santhos IPTV — Powered by SNWD

**One public M3U IPTV link, hosted directly on GitHub. No website, Vercel deployment, paid subscription, or login required to read the playlist.**

## 📺 Main IPTV playlist (paste into your IPTV player)

```text
https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u
```

This **remains the original link**. It contains the smaller legacy-TV-focused list, with Tamil entries first, then other channels, grouped by M3U `group-title` metadata. GitHub Actions refreshes the directory automatically.

**IMPORTANT:** This is an **M3U playlist**, not a MAG/Stalker portal. Compatible IPTV players load the channel list; some show the categories in a sidebar, while older Smart-STB can remain stuck at `PLAYLIST / ALL / BY NUMBER`. **No GitHub M3U file can replace an IPTV app's Home, TV, or Video Club menu.** A real MAG/Stalker portal requires a separately running backend and cannot be hosted solely by GitHub Raw or GitHub Pages. Do not paste this link into an app's **Stalker Portal** field; select **M3U URL / Playlist URL** instead.

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

**Old experiments:** `web/` and `mag/` contain earlier experimental interface/backend work. **Neither is required for this GitHub-only M3U playlist**, and the experimental MAG backend cannot be served by GitHub itself. This project’s supported distribution method is the M3U URLs above.

MIT-licensed generator code. SNWD name/logo are the property of their owner.
