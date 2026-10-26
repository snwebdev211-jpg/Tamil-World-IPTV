# Santhos IPTV Web Portal

This folder is a static web app branded with the SNWD company mark provided by the project owner. It is designed for web browsers, mobile devices, and televisions with modern web engines. The logo in `assets/snwd-logo.svg` is a clean vector tracing of the exact image supplied in chat.

Features: Home, Live TV, Tamil, Movies (live movie channels), Sports, News, Music, Kids, search, favourites, recent channels, theme selection, remote keyboard navigation, HLS.js/native HLS playback, error messages, and source-refresh settings.

No subscription videos, DRM circumvention, piracy feeds, or invented film titles are included. **Reachable HLS manifest does not guarantee playback on any specific device.** An app such as original Smart-STB will keep its own interface: the web portal cannot be injected into that app by M3U.

Playlist data is fetched from `./playlists/all.m3u` when the site is hosted alongside playlists, falling back to the public GitHub Raw source. The service worker caches app UI files only, not copyrighted content or HLS segments. It is not an offline-TV downloader.

Deploy this folder as a static website (Vercel: Root Directory `web`, framework `Other`). GitHub Pages workflow is at `.github/workflows/portal-pages.yml`. If GitHub Pages is disabled, enable **Settings → Pages → Build and deployment → GitHub Actions**. The site would then be `https://snwebdev211-jpg.github.io/Tamil-World-IPTV/`.

Remote control: Arrow keys move focus, Enter/OK activates, Esc/Back closes player, / focuses search.

MIT-licensed UI source. SNWD logo remains the trademark/identity of its owner.
