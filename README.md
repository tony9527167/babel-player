# About

Babel Player: A video player for English learners.

Downloads

- [Windows 10+](https://github.com/tony9527167/babel-player/releases/download/v2026.10.1-rc0/Babel.Player.Windows-amd64.zip)
- [macOS 11+ Apple Silicon](https://github.com/tony9527167/babel-player/releases/download/v2026.10.1-rc0/Babel.Player.macOS-arm64.zip)

Screenshot

![Babel Player screenshot](./screenshot.png)

NOTICE: I'm hosting the binaries on GitHub. The player source code won't be uploaded until it's stable.

## Website source license

The original website source in this directory is licensed under the [MIT License](./LICENSE), copyright (c) 2026 Babel Player Team. Third-party assets retain their own licenses; see [the player icon font license](./assets/player-icons-LICENSE.txt). This license applies only to the website source, not the Babel Player application or its binaries.

## Website deployment

Production: https://babel-player.pages.dev

Install Node.js LTS, then run `npm ci`. Use `npm run build` to copy public files into `dist/`, `npm run preview` to preview with Cloudflare locally, and `npm run deploy` to publish the production deployment. Run `npx wrangler login` first when deploying from a new computer.

The build sets canonical, language, social preview, and sitemap URLs to the production origin declared in `build.mjs`. Development files and dependencies are excluded from the upload.

The Cloudflare Pages project uses Direct Upload and production branch `2026.10`. Git pushes do not deploy automatically. Project settings are in `wrangler.toml`; `deploy.mjs` selects the account, overridable with `CLOUDFLARE_ACCOUNT_ID`. Account IDs are public identifiers, not credentials.

Validation: `npm test` runs the existing website checks and deployment tests; `npm run test:build` runs deployment tests alone. `npm run format:check` checks deployment tooling formatting. There is no TypeScript compilation step.

## Search and AI crawler access

The English (`/en`) and Simplified Chinese (`/zh-CN`) pages contain complete HTML content, self-referencing canonical URLs, reciprocal language links, social metadata, and SoftwareApplication structured data. Canonical URLs use Cloudflare Pages extensionless paths to avoid redirects. The root keeps browser language selection and supplies English HTML for clients without JavaScript. A top-level `404.html` makes Pages return HTTP 404 for missing URLs instead of treating the site as a single-page application.

`robots.txt` allows every crawler, including Googlebot, Bingbot, and AI search crawlers such as OAI-SearchBot. No separate bot rules are needed. This also permits training crawlers that follow robots.txt. Cloudflare account-level bot protection, managed robots rules, or challenges can still override access; check those settings if verified crawlers receive a challenge or HTTP 403.

After deployment, submit `https://babel-player.pages.dev/sitemap.xml` in Google Search Console and Bing Webmaster Tools for a verified property, then inspect `/en` and `/zh-CN`. Sitemap submission and crawler access make pages eligible for discovery; search engines and AI services decide whether and when to index or cite them. No indexing or AI citation is guaranteed.

Run `npm run typecheck`, `npm run test:build`, and `npm test` before deploying. Check that canonical pages, robots.txt, and sitemap.xml return HTTP 200, `.html` paths redirect to the canonical paths, and an unknown URL returns HTTP 404. Repeat access checks with Googlebot, Bingbot, and OAI-SearchBot user agents; a spoofed user agent is only a basic access check, not proof that verified bots bypass hosting protection.
