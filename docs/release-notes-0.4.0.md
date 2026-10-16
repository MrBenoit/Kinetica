# Kinetica 0.4.0

Create scenes with shared parameters, tune the timing of each step and browse examples before adding them to a note.

- Set transition duration, hold time and easing for each scene step.
- Bind node positions and labels to sliders, with an optional linked function plot.
- Browse 14 examples with search, categories and a live preview. New examples cover motion, stacks and bubble sort.
- Reduce main.js from 4.94 MB to 3.29 MB while keeping all 42 supported offline Plotly trace types.
- Make bundled CSS identifiers independent of checkout paths for reproducible builds.
- Keep older version 1 and 2 documents readable. New scene features use document version 3 and require Kinetica 0.4.0 or later.

The numbered release contains main.js, manifest.json and styles.css. Download kinetica.js and kinetica-example.html from the matching [HTML release](https://github.com/MrBenoit/Kinetica/releases/tag/html-0.4.0).

The player remains offline. Geographic maps and remote Plotly resources remain unsupported. Python scripts are not executed.

Verification covers macOS Obsidian, standalone HTML, 107 application tests and 6 build checks. Windows, Linux and mobile devices have not been tested.

Before downgrading to 0.3.2, keep backups of notes that use the new version 3 scene features. Older versions cannot read those documents.
