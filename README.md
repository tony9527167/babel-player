# Babel Player website

Static bilingual product site with no build step. Preview with `npm run website:dev`, then open <http://localhost:8080>. Deploy the contents of `website/` to a static host.

The entry page includes the complete English product content for readers without JavaScript, then detects browser language preferences: English opens `en.html`, Simplified Chinese opens `zh-CN.html`, and other languages fall back to English. Traditional Chinese tags fall back to English. Explicit language pages stay in the selected language; the header links switch languages without automatic redirection.

The two illustrative players compare hidden and revealed subtitles; each highlighted button independently toggles its mask. Hover highlights the button; clicking changes the mask, matching the application. The controls follow `src/script-opts/uosc.conf`, including the separate timeline and video/control gap. The icon font comes from the pinned uosc source; its license is in `assets/player-icons-LICENSE.txt`.

Download URLs are the supplied S3 paths and must be populated before release. The page advertises downloads under 30 MB for both platforms. The local Windows executable compresses to about 18.8 MB; the macOS archive size still needs release verification. The codec note below the feature cards lists the minimum profile checked in `src/build/verify.py`; it is not an exhaustive codec list. The format examples include MP4, MKV, AVI, MOV, and WebM, confirmed against the generated Windows format reader list and the corresponding FFmpeg readers. macOS shares the base format configuration; macOS playback was not verified here.

Run `npm run website:test` and `npm run website:format:check` for regressions and formatting.

Website formatting uses `website/.prettierrc.yaml`, with the repository’s existing 160-column width and two-space indentation.

## Search, agents, and mobile browsers

Production metadata uses `https://babel-player.tony9527167.pages.dev/`, as the public website URL supplied for this deployment. If hosting changes, update canonical URLs, language alternates, social metadata, application JSON, `robots.txt`, and `sitemap.xml` together. The root is a full English fallback with a canonical link to `en.html`; automatic language routing runs only at the root. Both language pages remain directly accessible.

Product descriptions, platform requirements, and download links are plain HTML. The application JSON matches the visible product content and does not invent prices, ratings, or release versions. `robots.txt` permits crawling, including AI crawlers that honor it. No special AI file is needed for Google’s AI search features. Hosting access controls and crawler policies can still override these files.

The mobile layout supports zoom, safe area insets, dynamic browser height, reduced motion, and touch targets of at least 44 pixels for interactive demo buttons and language links. The Apple touch icon is generated from the application icon. The social image is a local 1280×640 JPEG.

Install Google Chrome and Python as prerequisites. Install test tools with `npm ci`, then `npx playwright install webkit`. Run `npm run website:test:browser` for the installed Google Chrome and an emulated iPhone in WebKit, including narrow screens, landscape, language routing, and JavaScript-disabled reading. These checks require Python on the command path. They do not replace tests on a physical iPhone or macOS Safari.

Before publishing, populate and verify the download URLs, serve public pages and metadata over HTTPS with successful responses and correct content types, check that the host does not add crawler blocks or `noindex` headers, and submit the sitemap in Google Search Console. Indexing and AI inclusion are not guaranteed by markup.
