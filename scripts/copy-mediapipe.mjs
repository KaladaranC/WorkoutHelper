// The pose model runs entirely in the browser. Its WASM runtime ships inside
// the npm package; copy it into public/ so Vercel serves it from our own
// origin instead of a third-party CDN, and the version always matches the JS.
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = join(root, "public", "mediapipe", "wasm");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("Copied MediaPipe WASM runtime to public/mediapipe/wasm");
