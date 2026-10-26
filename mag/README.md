# Santhos IPTV · MAG/Stalker Compatibility Portal

**This is the classic television portal** for MAG-style clients and Smart-STB, not a standalone Netflix web application.

Portal URL (exact path, no redirects):

```text
https://santhos-iptv.vercel.app/stalker_portal/c/index.html
```

API aliases: `/stalker_portal/server/load.php`, `/server/load.php`, `/portal.php`.

The backend implements the basic Stalker protocol actions needed to browse channels: `handshake`, `get_profile`, `get_modules`, `get_main_info`, `get_genres`, `get_categories`, `get_all_channels`, `get_ordered_list`, `create_link`, `get_time`, `get_short_epg`, `get_fav_ids`, `set_fav`, and `get_account_info`.

The TV UI provides a **classic arrow-key menu**, Live TV, Tamil, Movies (live TV channels showing films), Sports, News, Music, Kids, search, and settings. It loads publicly accessible M3U entries from the existing playlist project. Video uses the device's built-in HTML video decoder: a feed that does not decode on your Samsung cannot be repaired merely by a new portal.

**Compatibility status:** This is an independently implemented partial MAG/Stalker-compatible prototype, *not* official Infomir/Ministra software and not certified on all Smart-STB devices. Proprietary portal clients may require additional protocol and player APIs. Its MAG HTTP API can be exercised by automated tests; actual TV playback and portal navigation require an on-device test.

**Movie/VOD status:** no licensed full-length movie stream catalogue is currently provided; the VOD API reports zero entries, rather than inventing movies. Movie TV channels are listed under Movies.

**Security and privacy:** this directory is intentionally public and guest-accessible. No MAC registration is required or stored. Handshake tokens are not account credentials. Do not add paid/private playlist links to public GitHub files.

Development: `npm test` for API tests. Deployment root: `mag/` on Vercel. Node 24 runtime, no paid database, no API keys necessary for guest view. Scheduled channel refreshes remain in the repo's existing GitHub Actions workflow.

The SNWD logo is the user's brand image. All other code MIT licensed.
