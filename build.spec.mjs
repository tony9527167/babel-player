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
