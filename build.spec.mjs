import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { buildWebsite, websiteOrigin } from "./build.mjs";

test("deployment contains public assets and uses the production origin", async () => {
  const directory = await mkdtemp(join(tmpdir(), "babel-website-"));
  try {
    const destination = pathToFileURL(`${directory}/`);
    await buildWebsite(destination);
    assert.deepEqual((await readdir(destination)).sort(), [
      "404.html",
      "assets",
      "demo.js",
      "en.html",
      "index.html",
      "language.js",
      "player.css",
      "responsive.css",
      "robots.txt",
      "sitemap.xml",
      "styles.css",
      "zh-CN.html",
    ]);
    for (const file of ["index.html", "en.html", "zh-CN.html", "robots.txt", "sitemap.xml"]) {
      const content = await readFile(new URL(file, destination), "utf8");
      assert.ok(content.includes(websiteOrigin));
      assert.ok(!content.includes("babel-player.tony9527167.pages.dev"));
    }
    assert.ok((await readFile(new URL("assets/social-preview.jpg", destination))).length > 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("canonical pages are discoverable without JavaScript and match the sitemap", async () => {
  const sitemap = await readFile(new URL("./sitemap.xml", import.meta.url), "utf8");
  const robots = await readFile(new URL("./robots.txt", import.meta.url), "utf8");
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.ok(robots.includes(`Sitemap: ${websiteOrigin}/sitemap.xml`));
  assert.doesNotMatch(robots, /Disallow:\s*\//);
  for (const language of ["en", "zh-CN"]) {
    const html = await readFile(new URL(`./${language}.html`, import.meta.url), "utf8");
    const canonical = `${websiteOrigin}/${language}`;
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
    assert.ok(html.includes(`property="og:url" content="${canonical}"`));
    assert.match(html, /name="robots" content="index, follow, max-image-preview:large"/);
    assert.doesNotMatch(html, /noindex|language.js/);
    const application = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(application.url, canonical);
    assert.match(html, /<h1[\s\S]*?<\/h1>/);
    for (const alternate of ["en", "zh-CN"]) {
      assert.ok(html.includes(`hreflang="${alternate}" href="${websiteOrigin}/${alternate}"`));
    }
  }
  const missing = await readFile(new URL("./404.html", import.meta.url), "utf8");
  assert.match(missing, /name="robots" content="noindex, follow"/);
  assert.ok(missing.includes('href="/en"'));
  assert.ok(missing.includes('href="/zh-CN"'));
});
