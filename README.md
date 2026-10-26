# Tamil World IPTV 📺

A free, open-source **M3U playlist directory** with worldwide live TV, Tamil channels at the top, **Sports / Entertainment / Movies / News / Music / Kids** groups, and separate genre links. Bring your own IPTV player.

## Smart-STB (older Samsung TVs)

**Current problem:** Classic Smart-STB reads an M3U URL as a *flat playlist*. The remote M3U file cannot replace Smart-STB's Home screen or create a Video Club / VOD tab. A Stalker-compatible **portal service** is required for those portal features; GitHub Raw is a file host, not a Stalker portal. Smart-STB+ improves M3U categorization but isn't available on older Samsung TV models such as the UN65H6203AF.

**Keep using the original M3U URL**:
`https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u`

We now build a **stream-checked TV list** for that same URL: the workflow takes public TV channel indexes, prioritizes Tamil and category groups, probes up to 2,500 HLS manifests, and only publishes the ones with reachable HLS manifests that do not explicitly advertise incompatible HEVC-only playback. All other public source listings are preserved at `playlists/all-sources.m3u` (large, **not tested**). We do **not** guarantee streams play in Canada or on any particular Samsung model, because a reachable manifest does not guarantee that its media segments or codec work on that device. For those with stronger IPTV players, category-specific playlists are also generated from the filtered list.

For a simple playback diagnostic, add `playlists/diagnostic.m3u` as a temporary playlist. It contains two publicly available HLS video test clips (not TV channels). If neither sample plays, channel selection alone will not fix Smart-STB playback on your TV. If the clips play but TV stations fail, suspect geo restrictions, source blocking, or broken streams.

**Reload the playlist:** fully exit and relaunch Smart-STB or re-select the Portal after GitHub Actions completes; the app may cache an older playlist. When Smart-STB is at the `Loading Portal` screen, press **OK** and then **System Settings → Portals** to change playlists. See the [Smart-STB official instructions](https://www.smart-stb.net/ssps-kb/how-to-add-or-change-a-portal-or-m3u-playlist/). Don't reset or clear user data just to refresh a playlist.

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