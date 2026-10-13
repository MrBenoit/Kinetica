# Kinetica 0.1.0 beta

Create interactive explanations directly in Obsidian notes.

- Build scenes with blocks, arrows, code excerpts and animated steps
- Plot mathematical functions and explore parameters with sliders
- Start from four templates or import a document as JSON
- Edit visually with undo and redo
- Keep the full visualization inside a portable `motion` block
- Use the interface in English or Russian

The plugin works offline and does not execute JavaScript from notes.

## Install

Download `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/kinetica/`. Reload Obsidian and enable Kinetica in Community plugins. Run **Kinetica: Create visualization** from the command palette.

## Limits

This is an early beta tested on macOS with Obsidian 1.14.4. Mobile devices and other desktop operating systems still need testing. The scene editor supports rectangular blocks and straight arrows. Plots use a fixed sample count and are intended for explanations, not numerical analysis.

If you used the local Motion Notes prototype, disable it before enabling Kinetica. Existing `motion` blocks are compatible.
