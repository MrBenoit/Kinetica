import { build, context } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2022",
  platform: "browser",
  outfile: "dist/main.js",
  minify: true,
  logLevel: "info",
};
await mkdir("dist", { recursive: true });
for (const file of ["manifest.json", "styles.css"])
  await copyFile(file, `dist/${file}`);
const webOptions = {
  ...options,
  entryPoints: ["src/embed.ts"],
  external: [],
  format: "iife",
  outfile: "dist/kinetica.js",
  loader: { ".css": "text" },
};
await copyFile("examples/embed.html", "dist/kinetica-example.html");
if (process.argv.includes("--watch")) {
  await (await context(options)).watch();
  await (await context(webOptions)).watch();
} else {
  await build(options);
  await build(webOptions);
}
