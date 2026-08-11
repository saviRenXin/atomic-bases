import esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname);
const dist = resolve(root, "dist");
const watch = process.argv.includes("--watch");

mkdirSync(dist, { recursive: true });

const options = {
  entryPoints: [resolve(root, "src/main.ts")],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2020",
  external: ["obsidian"],
  outfile: resolve(dist, "main.js"),
  sourcemap: false,
  logLevel: "info"
};

async function copyStaticFiles() {
  copyFileSync(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
  copyFileSync(resolve(root, "styles.css"), resolve(dist, "styles.css"));
}

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
  await copyStaticFiles();
  console.log(`Watching ${dirname(options.outfile)}`);
} else {
  await esbuild.build(options);
  await copyStaticFiles();
}
