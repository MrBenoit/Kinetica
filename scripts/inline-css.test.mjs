import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { inlineCSS } from "./inline-css.mjs";

test("CSS bundles are independent of checkout paths and insert styles once", async () => {
  const root = await mkdtemp(join(tmpdir(), "kinetica-css-"));
  const css = '.example::after { content: "` ${literal} \\\\ text"; }\n';
  try {
    const outputs = [];
    for (const name of ["first", "second"]) {
      const dir = join(root, name);
      await mkdir(dir);
      await writeFile(join(dir, "style.css"), css);
      const result = await build({
        absWorkingDir: dir,
        stdin: { contents: 'import "./style.css"', resolveDir: dir },
        bundle: true,
        write: false,
        minify: true,
        plugins: [inlineCSS()],
      });
      outputs.push(result.outputFiles[0].text);
    }
    assert.equal(outputs[0], outputs[1]);
    const dom = new JSDOM(
      "<!doctype html><html><head></head><body></body></html>",
      {
        runScripts: "outside-only",
      },
    );
    try {
      dom.window.eval(outputs[0]);
      dom.window.eval(outputs[1]);
      const styles = dom.window.document.querySelectorAll("style");
      assert.equal(styles.length, 1);
      assert.equal(styles[0].textContent, css);
    } finally {
      dom.window.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
