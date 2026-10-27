# Santhos IPTV · MAG/Stalker Compatibility Portal

**This is the classic television portal** for MAG-style clients and Smart-STB, not a standalone Netflix web application.

Portal URL (exact path, no redirects):

```text
https://santhos-iptv.vercel.app/stalker_portal/c/index.html
```

API aliases: `/stalker_portal/server/load.php`, `/server/load.php`, `/portal.php`.

The backend implements the basic Stalker protocol actions needed to browse channels: `handshake`, `get_profile`, `get_modules`, `get_main_info`, `get_genres`, `get_categories`, `get_all_channels`, `get_ordered_list`, `create_link`, `get_time`, `get_short_epg`, `get_fav_ids`, `set_fav`, and `get_account_info`.

The TV UI uses the **user-provided SNWD company logo** with the original dark-blue/teal brand treatment and **Santhos IPTV** name. The classic remote menu includes Home, Live TV, Tamil, Movies (live movie channels), Sports, News, Music, Kids, Favorites, Recently Watched, Search, TV Guide status, and Settings. Favorites and recent channels are stored locally in a compatible player browser; they are not synced between devices. It loads publicly accessible M3U entries from the existing playlist project. Playback tries the MAG native `stb.Play` API first where available, then falls back to HTML video. Video availability still depends on the decoder: a feed that does not decode on your Samsung cannot be repaired merely by a new portal.

**Compatibility status:** This is an independently implemented partial MAG/Stalker-compatible prototype, *not* official Infomir/Ministra software and not certified on all Smart-STB devices. Proprietary portal clients may require additional protocol and player APIs. Its MAG HTTP API can be exercised by automated tests; actual TV playback and portal navigation require an on-device test.

**Movie/VOD status:** no licensed full-length movie stream catalogue is currently provided; the VOD API reports zero entries, rather than inventing movies. Movie TV channels are listed under Movies.

**Security and privacy:** this directory is intentionally public and guest-accessible. No MAC registration is required or stored. Handshake tokens are not account credentials. Do not add paid/private playlist links to public GitHub files.

Development: `npm test` for API tests; GitHub Actions also runs browser-simulated navigation tests and checks the deployed portal API. Channel IDs are deterministic across playlist reordering (although changed feed URLs may change the IDs). Deployment root: `mag/` on Vercel. Node 24 runtime, no paid database, no API keys necessary for guest view. Scheduled channel refreshes remain in the repo's existing GitHub Actions workflow.

The SNWD logo is the user's brand image. All other code MIT licensed.

## Status and known limitations (October 2026)

- Backend API tests, browser-simulated menu tests, and live-URL verification pass in GitHub Actions. **This does not certify compatibility with all proprietary MAG/Smart-STB builds.**
- No paid Tamil film catalogue is distributed. The Movies area lists linear TV movie channels. Video Club/VOD remains empty until authorized on-demand streams are supplied.
- Guide schedules are not available because reliable EPG program data hasn't been integrated. The guide page says this instead of inventing listings.
- The source of channels is the same segment-probed M3U file used by the original IPTV link. A stream's presence does not prove Canada/TV playback, legal access, codec compatibility or uptime.
- The MAG portal branding exists only on the **custom portal URL**, not inside third-party M3U mode. IPTV apps own their own menus.

### Install on original Smart-STB

Use the exact URL above in a portal slot under **System Settings → Portals**. Avoid entering the raw M3U link as a Stalker portal. If your old Smart-STB does not load the portal, test the URL on a phone/browser, then the app's embedded demo portal to isolate app/network/codec restrictions. See [official Smart-STB compatibility instructions](https://www.smart-stb.net/ssps-kb/how-to-make-your-portal-comatible-with-smart-stb-app/). The first diagnostic channel playback test must happen on the actual device.

## Live playback troubleshooting (October 26, 2026)

The TV directory returning channels does not prove the videos play. The custom portal now prefers native MAG HLS when a `stb.Play` API exists; ordinary browsers that have MediaSource but no native HLS use a lazily loaded, pinned hls.js library. Browsers without either decoder make a best-effort native video attempt and report a timeout or decoder error. Alternative URLs are retried on fatal media errors and rejected play promises. This cannot add codecs to an old Samsung Orsay/Smart-STB implementation or repair dead, geo-restricted, referer-protected or unauthorized upstream broadcasts.

In the Settings screen, **MP4 TEST** checks basic browser video playback and **HLS TEST** checks the live-stream format separately. If MP4 works but HLS does not, likely HLS/codec or cross-origin/TLS compatibility; if both work but channels fail, investigate broadcaster sources and regional access. GitHub Actions use simulated player behavior; real Samsung decoding remains unverified. No channel stream is proxied or transcoded by Vercel.

**Remote diagnostics:** From the classic Home press **0** (numeric zero) or Samsung BLUE to open the Settings/Stream Test screen. A visible STREAM TEST/SETTINGS button is also in the Home information area. RETURN closes it.

## MAG live TV preview and programme guide panel (October 26, 2026)

The custom TV screen now displays categories on the left, a 13-row channel list in the middle, and a picture-in-guide preview on the right with audio enabled by default. Press OK on a channel to attempt playback in the right panel; press OK again or RED to expand it fullscreen. RETURN restores preview and then exits TV to Home. Page Up/Page Down keys and PAGE buttons navigate 50-channel pages. A short debounce helps remote channel switching after preview starts. A separate HLS/MP4 Stream Test is in Settings.

**EPG:** Real programme titles and times are not available in the source catalogue. The interface explicitly reports that no verified EPG schedule is available instead of inventing shows. **Physical playback remains unverified.** The app cannot supply missing codecs, overcome geographic/source restrictions, or guarantee Smart-STB's proprietary native player can be embedded inside a web video element. Source URLs continue to play directly without Vercel media transcoding.

## Playback rejection diagnostics for Samsung legacy TVs (October 26, 2026)

The generic "player rejected this stream" error hid the browser's actual rejection reason. The portal now distinguishes `NotAllowedError` (autoplay permission), `NotSupportedError` (unsupported HLS/container/codec), `NetworkError`, and HTML video media error codes. A denied autoplay with audio receives exactly one muted retry. **If video starts muted**, the player labels it as muted and the GREEN remote key (Samsung key code 71 or 404, where exposed) or the on-screen AUDIO button attempts unmuting in a direct user action. The app does **not** claim muted playback has working audio.

Settings now displays the client's reported native MAG player availability, HLS support, MediaSource support, and H.264/AAC MP4 capability. These are detection hints, **not verified video decoding**. From Home press **0**, then run **TEST MP4**, **TEST HLS**, and read **CHECK TV PLAYER CAPABILITIES**. When `NotSupportedError` occurs on a TV with neither native MAG/HLS support nor MSE, HTML5 JavaScript alone cannot make that same HLS stream playable. The broadcaster must offer a compatible video/audio representation (commonly H.264 + LC-AAC), or the viewer must use a compatible authorized player/device. No unlicensed channels, DRM circumvention, server-side stream proxying, transcoding, or fictional successful TV checks are introduced.

A GitHub Actions green run proves mocked browser/player behavior and page structure only. Samsung UN65H6203 physical decoding, region access, source availability, picture and audio remain unverified until tested on the TV.
