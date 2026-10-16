# Build size

Kinetica bundles Plotly locally for offline playback and HTML export. The plugin stores one copy of that payload. The production build produces about 3.29 MB for `main.js`, including the new scene tools, down from 4,941,572 bytes with the full Plotly distribution.

## Module policy

`src/plotly-policy.json` lists geographic trace types already rejected by the document validator. `scripts/plotly-bundle.mjs` registers every other trace from the pinned Plotly schema, plus calendars and the Russian locale. Plotly 4.1.2 supplies 42 supported trace types after this filter. Legacy map names remain in the rejection policy too.

The build uses Plotly source modules, its GLSL and CSS build plugins and browser shims. It does not modify vendor source, load a CDN or unpack compressed code at runtime. Its input graph must include every supported trace and must exclude geographic traces and map engines.

## Compatibility checks

Every build loads the trusted full and custom Plotly bundles into separate test DOMs and compares their schemas. Trace attributes, non-map layout, frames, animation and configuration must match. Documentation metadata omitted by the official minified bundle is ignored. This test never evaluates content from a note.

Schema equality is not rendering proof. Test scatter, heatmap, a WebGL surface, frame controls and a real Obsidian HTML export after changing the bundler or Plotly version. Also check ordinary scenes, linked playback and sliders. WebGL availability depends on the browser and device.

## Size budget

`npm run build` fails at 3,500,000 bytes for `main.js`, before the project's 5,000,000-byte sync size target. This leaves room to investigate growth while the plugin still fits. Raising the development budget requires a measured reason, not an automatic response to a failing build.

`dist/build-report.json` records the version, supported trace list, measured bytes and remaining space. It is a local and CI build report, not a plugin release asset. The single-payload check also rejects accidental duplication of Plotly in the plugin.

## Updating dependencies

1. Update the exact Plotly and locale versions together, then regenerate the lockfile.
2. Run `npm ci --ignore-scripts` and `npm run check`.
3. Inspect the report and any schema or input-graph failures. Check new trace types for offline compatibility before accepting them.
4. Run the rendering checks above on the built files. Repeat the build and compare hashes before a release.

Keep `main.js`, `styles.css` and `manifest.json` as the only plugin release assets. Browser files belong to the separate HTML release.
