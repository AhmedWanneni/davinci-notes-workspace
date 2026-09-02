import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("manifest.json", "dist/manifest.json");
await cp("versions.json", "dist/versions.json");
await cp(".build/main.js", "dist/main.js");
console.log("Built installable plugin files in dist/");
