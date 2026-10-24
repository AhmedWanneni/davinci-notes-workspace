import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(appRoot, "node_modules/emojibase-data/en");
const destination = resolve(appRoot, "public/emoji-data/en");

await rm(destination, { force: true, recursive: true });
await mkdir(destination, { recursive: true });
await Promise.all(
  ["data.json", "messages.json"].map((file) =>
    cp(resolve(source, file), resolve(destination, file)),
  ),
);
