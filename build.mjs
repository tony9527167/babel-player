import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const websiteOrigin = "https://babel-player.pages.dev";
const sourceOrigin = "https://babel-player.tony9527167.pages.dev";
const publicExtensions = /\.(html|css|js|txt|xml)$/;

export async function buildWebsite(destination = new URL("./dist/", import.meta.url)) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(new URL("./", import.meta.url), { withFileTypes: true })) {
    if (!entry.isFile() || !publicExtensions.test(entry.name)) continue;
    const source = await readFile(new URL(entry.name, import.meta.url), "utf8");
    await writeFile(new URL(entry.name, destination), source.replaceAll(sourceOrigin, websiteOrigin));
  }
  await cp(new URL("./assets/", import.meta.url), new URL("assets/", destination), { recursive: true });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildWebsite();
  console.log("Static website built in dist/");
}
