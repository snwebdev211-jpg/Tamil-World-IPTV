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
