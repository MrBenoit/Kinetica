# Embed Kinetica in HTML

Download `kinetica.js` and `kinetica-example.html` from the same GitHub release. Keep them in one folder and open the HTML file in a browser. It also works from a local `file://` URL. No server, Obsidian installation or build tool is required.

To add a player to an existing page, load the script once and add a custom element for each visualization:

```html
<script src="./kinetica.js" defer></script>
<kinetica-player theme="dark" lang="en">
  <script type="application/json">
    {
      "version": 1,
      "id": "parabola",
      "type": "plot",
      "title": "Explore a parabola",
      "description": "Change a to adjust the curve.",
      "xLabel": "x", "yLabel": "y",
      "xMin": -5, "xMax": 5, "yMin": -5, "yMax": 25,
      "parameters": [{"name":"a","label":"Scale","min":-1,"max":1,"step":0.1,"value":1}],
      "curves": [{"label":"a * x^2","formula":"a * x^2","color":"blue"}]
    }
  </script>
</kinetica-player>
```

Copy only the JSON inside an Obsidian `motion` block, without the Markdown fences. All five document types use the same versioned format in both environments. See [Learning tools](learning.md) for version 2 scenes, laboratories, comparisons and Plotly.

When generating HTML from JSON, serialize it with `JSON.stringify(document).replace(/</g, "\\u003c")`. A literal `</script>` inside a JSON string closes the HTML script element before the JSON parser can read it. Escaping `<` prevents that. Never concatenate untrusted text into an HTML page.

## Russian interface

Use `<html lang="ru">` and omit `lang` on the player, or set `<kinetica-player lang="ru">` for an individual player. Regional values such as `ru-RU` are accepted. Buttons, hints and validation errors use Russian. The example page includes an English/Russian switch.

Your JSON supplies titles, explanations and slider labels. Write those in Russian yourself. Switching the interface language does not translate authored content. If your page changes its language at runtime, call `refresh()` on its players, or update each player's `lang` attribute.

## Options

- `theme="dark"` or `theme="light"` sets a fixed theme. `theme="auto"` or an omitted theme follows the system preference.
- `lang="en"` or `lang="ru"` selects controls and errors. With no language attribute, the player uses the page's `<html lang>` value and falls back to English. Document titles and explanations keep their original language.
- Multiple players work independently. Give the element a width through normal page CSS, such as `kinetica-player { max-width: 900px; }`.
- The internal styles use Shadow DOM so page selectors do not change player controls. Set font and color variables on the host only if you want to customize them.
- After replacing the JSON script's `textContent`, call `element.refresh()`. A language change also refreshes the player and resets playback. An explicit theme change also refreshes playback, including the isolated Plotly frame.
- Removing the element stops its timers and observers. Reattaching it starts at the first step.

Invalid data appears as a readable error inside the widget and emits a bubbling `kinetica-error` event with `event.detail.message`. It does not execute HTML or JavaScript from the document. Formula evaluation uses the same restricted parser as the plugin.

This bundle is a viewer. Create and edit visualizations in Obsidian, or author the JSON yourself. The file contains its CSS and has no runtime dependencies or network requests. Pages with a strict Content Security Policy must allow the local script and the player's inline shadow styles. The player does not change your page's policy.

If your HTML reader disables JavaScript or custom elements, it cannot run this viewer. Simply storing an HTML file in an Obsidian vault does not enable script execution; use a browser or an HTML viewer that supports it.

For a single file, use **Export HTML** in Obsidian. Plotly runs in a sandboxed iframe. Host CSP must permit this local frame, inline scripts and shader compilation inside it; a stricter host policy may prevent Plotly from loading. The plugin never weakens the host policy.
