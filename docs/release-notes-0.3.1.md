# Kinetica 0.3.1

Fixes the community review findings from 0.3.0.

- Share one full Plotly payload between the plugin and HTML exporter. The plugin is now below the 5 MB Obsidian Sync Standard limit.
- Use Obsidian DOM helpers in the plugin and native DOM methods in the standalone viewer.
- Normalize import failures as Error objects and remove redundant type assertions.
- Hide embedded comparison controls without CSS importance overrides.
- Check review rules locally and update development dependencies to resolve audit findings.

The numbered release contains main.js, manifest.json and styles.css. Download the standalone viewer from the matching HTML prerelease. Full Plotly and offline HTML export remain available.

Desktop verification covers macOS. Other operating systems and mobile devices have not been tested.
