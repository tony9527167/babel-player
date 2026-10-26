import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const routing = await read("language.js");
for (const [languages, expected] of [
  [["en-US"], "en.html"],
  [["zh-CN"], "zh-CN.html"],
  [["zh-Hans-SG"], "zh-CN.html"],
  [["zh"], "zh-CN.html"],
  [["zh-TW"], "en.html"],
  [["zh-Hant-CN"], "en.html"],
  [["fr", "zh-CN", "en"], "zh-CN.html"],
  [["en", "zh-CN"], "en.html"],
  [["fr"], "en.html"],
]) {
  test(`browser preferences ${languages} route to ${expected}`, () => {
    let destination;
    runInNewContext(routing, { navigator: { languages }, location: { replace: (value) => (destination = value) } });
    assert.equal(destination, expected);
  });
}
test("routing supports the single language API and missing preferences", () => {
  for (const [navigator, expected] of [
    [{ language: "zh-CN" }, "zh-CN.html"],
    [{}, "en.html"],
  ]) {
    let destination;
    runInNewContext(routing, { navigator, location: { replace: (value) => (destination = value) } });
    assert.equal(destination, expected);
  }
});
for (const language of ["en", "zh-CN"]) {
  const html = await read(`${language}.html`);
  test(`${language}: sections, bilingual navigation and downloads`, async () => {
    assert.match(html, new RegExp(`<html lang="${language}">`));
    assert.equal((html.match(/<section\b/g) || []).length, 3);
    assert.match(html, /class="button" href="#downloads"/);
    assert.match(html, new RegExp(`href="${language}.html"[^>]*aria-current="page"`));
    assert.doesNotMatch(html, /language.js|Listen first\. Reveal/);
    assert.match(html, /href="https:\/\/[^" ]+\/babel-player.windows.amd64.zip"/);
    assert.match(html, /href="https:\/\/[^" ]+\/babel-player.macOS.arm64.zip"/);
    assert.match(html, /H\.264/);
    assert.match(html, /<b>20 MB<\/b>/);
    assert.doesNotMatch(html, /state-caption|section-intro|availability|Focus on what you hear|Check what you heard|Choose your platform/);
    const details = html.match(/<section class="details wrap"[\s\S]*?<\/section>/)[0];
    assert.match(details, /MP4/);
    assert.match(details, /MKV/);
    const features = details.split('<div class="codec-note">')[0];
    assert.doesNotMatch(html, /feature-number|class="demo-note"|(?:01|02) \/ /);
    assert.equal((details.match(/<article>/g) || []).length, 3);
    assert.match(html, /class="hero-feature"/);
    assert.match(html, /data-demo="revealed"[\s\S]*data-demo="masked"/);
    const articles = [...details.matchAll(/<article>([\s\S]*?)<\/article>/g)];
    assert.match(articles[1][1], /class="codec-note"/);
    assert.doesNotMatch(articles[2][1], /<p>/);
    for (const format of ["MP4", "MKV", "AVI", "MOV", "WebM"]) assert.ok(features.includes(format));
    assert.match(details, /class="codec-note">[\s\S]*H\.264[\s\S]*<br \/>[^<]*AAC/);
    assert.ok(details.includes(language === "en" ? "Supported codecs may vary by operating system." : "支持的编码可能因操作系统而异。"));
    assert.doesNotMatch(html.match(/<footer[\s\S]*?<\/footer>/)[0], /codec-note|H\.264|AAC/);
    assert.doesNotMatch(html, /A player for listening closer|一款让你更仔细聆听的播放器|navigation-slogan/);
    const identifiers = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(identifiers.length, new Set(identifiers).size);
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (reference.startsWith("https:") || reference === "#") continue;
      if (reference.startsWith("#")) assert.ok(identifiers.includes(reference.slice(1)), reference);
      else await access(new URL(reference, import.meta.url));
    }
  });
  test(`${language}: both demos match the shipped control order and show opposite states`, async () => {
    const configuration = await read("../src/script-opts/uosc.conf");
    const expected = configuration
      .match(/^controls=(.+)$/m)[1]
      .trim()
      .split(",")
      .filter((item) => !["gap", "space"].includes(item));
    for (const [, player] of html.matchAll(/data-demo="(?:masked|revealed)"([\s\S]*?)class="player-timeline"/g)) {
      assert.deepEqual(
        [...player.matchAll(/data-control="([^"]+)"/g)].map((match) => match[1]),
        expected,
      );
    }
    assert.equal((html.match(/data-demo=/g) || []).length, 2);
    assert.equal((html.match(/class="subtitle-mask" hidden/g) || []).length, 1);
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 1);
    assert.match(html, /class="pointer-figure"/);
  });
  test(`${language}: demo buttons independently toggle both states`, async () => {
    const players = [false, true].map((enabled) => {
      const attributes = { "aria-pressed": String(enabled) };
      const mask = { hidden: !enabled };
      const label = { textContent: `${enabled ? "Subtitles hidden" : "Subtitles revealed"}`, setAttribute() {} };
      const button = {
        getAttribute: (key) => attributes[key],
        setAttribute: (key, value) => (attributes[key] = value),
        addEventListener: (event, callback) => {
          assert.equal(event, "click");
          button.click = callback;
        },
      };
      return {
        attributes,
        mask,
        button,
        label,
        querySelector: (selector) => (selector === "button" ? button : mask),
        closest: () => ({ querySelector: () => label }),
      };
    });
    runInNewContext(await read("demo.js"), { document: { documentElement: { lang: language }, querySelectorAll: () => players } });
    players[0].button.click();
    assert.equal(players[0].mask.hidden, false);
    assert.equal(players[0].attributes["aria-pressed"], "true");
    assert.equal(players[0].label.textContent, `${language === "en" ? "Subtitles hidden" : "字幕已隐藏"}`);
    assert.equal(players[1].mask.hidden, false);
    players[0].button.click();
    assert.equal(players[0].mask.hidden, true);
    players[1].button.click();
    assert.equal(players[1].mask.hidden, true);
    assert.match(players[1].label.textContent, language === "en" ? /^Subtitles revealed$/ : /^字幕已显示$/);
  });
}
test("demo icons match the pinned upstream font", async () => {
  assert.deepEqual(
    await readFile(new URL("assets/player-icons.otf", import.meta.url)),
    await readFile(new URL("../third_party/uosc/src/fonts/uosc_icons.otf", import.meta.url)),
  );
});

test("website has an explicit two-space Prettier configuration", async () => {
  const configuration = await read(".prettierrc.yaml");
  assert.match(configuration, /printWidth: 160/);
  assert.match(configuration, /tabWidth: 2/);
  assert.match(configuration, /useTabs: false/);
});

for (const file of ["index.html", "en.html", "zh-CN.html"]) {
  test(`${file}: indexable product, canonical metadata and machine-readable application`, async () => {
    const html = await read(file);
    const language = file === "zh-CN.html" ? "zh-CN" : "en";
    assert.match(html, /<h1[\s\S]*?<\/h1>/);
    assert.match(html, /class="download-card"/);
    assert.ok(html.includes(`rel="canonical" href="https://babel-player.tony9527167.pages.dev/${language}.html"`));
    for (const alternate of ["en", "zh-CN", "x-default"]) {
      assert.ok(html.includes(`hreflang="${alternate}" href="https://babel-player.tony9527167.pages.dev/`));
    }
    assert.match(html, /property="og:image" content="https:\/\/[^" ]+social-preview.jpg"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(html, /noindex|maximum-scale|user-scalable=no/);
    assert.match(html, /viewport-fit=cover/);
    const application = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(application["@type"], "SoftwareApplication");
    assert.equal(application.name, "Babel Player");
    assert.equal(application.inLanguage, language);
    assert.equal(application.operatingSystem.length, 2);
  });
}

test("crawler discovery points to both canonical language pages", async () => {
  const robots = await read("robots.txt");
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/babel-player.tony9527167.pages.dev\/sitemap.xml/);
  const sitemap = await read("sitemap.xml");
  for (const language of ["en", "zh-CN"]) assert.ok(sitemap.includes(`https://babel-player.tony9527167.pages.dev/${language}.html`));
  await access(new URL("assets/apple-touch-icon.png", import.meta.url));
  await access(new URL("assets/social-preview.jpg", import.meta.url));
});
