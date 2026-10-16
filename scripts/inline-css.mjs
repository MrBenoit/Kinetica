import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function inlineCSS() {
  return {
    name: "kinetica-inline-css",
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
        const css = await readFile(path, "utf8");
        const id = `kinetica-css-${createHash("sha256").update(css).digest("hex")}`;
        return {
          loader: "js",
          contents: `if (!document.getElementById(${JSON.stringify(id)})) {
  const style = document.createElement("style");
  style.id = ${JSON.stringify(id)};
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
}`,
        };
      });
    },
  };
}
