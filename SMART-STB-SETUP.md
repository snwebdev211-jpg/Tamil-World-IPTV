# Santhos IPTV — Smart-STB and TV-box setup

This repository maintains M3U playlists for IPTV apps. **M3U can provide channel names, URLs, logos and `group-title` metadata, but it cannot replace a third-party app's menus, Video Club, or remote behavior.**

## Main link — unchanged

```text
https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u
```

The automatic updater now tests **actual HLS MPEG-TS media segments** before adding an entry to the original link. It still **cannot guarantee playback** on a particular TV, in Canada, or at a later time. Channel owners may apply IP-country restrictions, expire links, or prohibit redistribution. Do not promise every listed stream will play.

## Smart-STB on a 2014 Samsung TV

Original Smart-STB is not Smart-STB+. The legacy M3U interface can show one playlist under **PLAYLIST / ALL / BY NUMBER**, regardless of `group-title`. For a true TV/VOD/Movies Home menu, a working **Stalker-compatible IPTV portal server** and access to properly licensed VOD content are required. A GitHub Raw M3U URL is **not a Stalker portal URL**.

### Using Multiportal as a workaround

If your Smart-STB license/app version provides multiple portal slots:

1. Open Smart-STB. Press **OK/Center while "Loading Portal"** to enter the portal settings.
2. Select **System Settings → Portals**.
3. Enable **Multiportal mode** (if available) and choose as many portal slots as your license supports.
4. Enter the links below (each is an M3U playlist, not a Stalker portal).
5. Set a default portal, then save with the **Green button/F2**, or **Return/Back → OK** if you lack a green remote button. Restart the app.

| Portal slot (example) | Playlist URL | What it shows |
|---|---|---|
| 1 | `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u` | Main live channels |
| 2 | `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-tamil.m3u` | Tamil live TV only |
| 3 | `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-sports.m3u` | Sports live channels |
| 4 | `https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/legacy-movies.m3u` | Movie **TV channels**, not a full-film library |

Additional playlists: `legacy-news.m3u`, `legacy-music.m3u`, `legacy-entertainment.m3u`.

If Multiportal doesn't let you select those groups, the restriction is in the installed Smart-STB version. M3U files cannot override the app.

## Black screen: isolate the cause

**Temporary test playlist:**
```text
https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/diagnostic.m3u
```

It contains two openly accessible sample HLS test videos, **not TV channels**. Add it as a portal playlist temporarily:

- **If both sample videos also fail on the Samsung:** suspect TV/Smart-STB codec or HLS compatibility, app license/settings, or network connection; it does **not** prove thousands of external streams are down.
- **If the samples work but live TV fails:** suspect blocked/expired/geo-restricted broadcast feeds or incompatible codecs, not your original M3U formatting.
- **If video works on your phone but not the TV:** the old TV's decoder/app is a major compatibility suspect.

Smart-STB's own documentation recommends Ethernet when possible. If refreshing doesn't show new channels, restart the app/reselect the portal. **Do not clear application data** unless troubleshooting specifically requires it.

Official sources:
- [Smart-STB change Portal/M3U instructions](https://www.smart-stb.net/ssps-kb/how-to-add-or-change-a-portal-or-m3u-playlist/)
- [Smart-STB M3U limitations](https://www.smart-stb.net/m3u-playlists-are-now-supported/)
- [Smart-STB no-play error guide](https://www.smart-stb.net/ssps-kb/oops-this-can-not-be-played-now-more-info-smart-stb-tv-np/)
- [Smart-STB+ newer Samsung TV requirements](https://www.smart-stb.net/smart-stb-released-for-samsung-tvs/)

## Other IPTV apps

Paste **the original `all.m3u` link** into any IPTV player that supports a *remote HTTP(S) M3U URL*. Such support does **not** guarantee individual stream playback. Some applications can group via `group-title`; others display channels in one continuous list or do not support movie-on-demand menus for M3U inputs.

## What the GitHub checks mean

- `all.m3u`: smaller *segment-probed* channels aimed at older IPTV boxes
- `manifest-checked.m3u`: broader indexed HLS streams with manifest checks only
- `all-sources.m3u`: public index, **not verified**
- `status.json`: last checks, counts and timestamps
- `tamil-movies-on-demand.m3u`: licensed full-film streams if provided; currently empty

A successful probe confirms *a source media segment was reachable from a GitHub server and had MPEG-TS packet framing*. It does **not** confirm H.264/AAC on your specific hardware, unblocked segment access at home, legal redistribution, or playback.

**Premium networks (Sun TV, KTV, Star Vijay, etc.) and licensed Tamil films** require official authorized streams or subscription access; unauthorized copies, DRM keys and credential sharing are not included.

The code and GitHub scheduled updates remain available without a paid ChatGPT plan.
