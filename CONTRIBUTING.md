# Contributing

For bugs, include the plugin version, Obsidian version, operating system and steps to reproduce. Attach a small example note with private content removed. For feature requests, describe what you want to explain and where the current editor gets in the way.

Use Node.js 22 and run `npm ci --ignore-scripts`, then `npm run check`. Copy the three files from `dist/` into a test vault's `.obsidian/plugins/kinetica/` directory and reload the plugin.

Keep changes focused. Add a behavior test when changing document validation, formulas, editing or playback. Keep English and Russian UI text in sync. Document format changes need a migration plan because users keep these files in their notes.

Runtime code must work offline. Do not add telemetry, remote scripts or JavaScript evaluation from documents. Keep the player independent of the Obsidian adapter.
