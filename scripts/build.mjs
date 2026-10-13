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
if (process.argv.includes("--watch")) await (await context(options)).watch();
else await build(options);
