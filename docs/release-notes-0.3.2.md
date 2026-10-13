# Kinetica 0.3.2

Remove the inline lint suppression rejected by the community review.

The Obsidian player uses createEl and createSvg. The standalone browser adapter uses native DOM methods because ordinary HTML pages do not provide Obsidian helpers. Local Obsidian-specific lint rules apply to the plugin sources, while shared TypeScript checks cover both adapters.

This changes review configuration only. The single Plotly payload, offline viewer and HTML export from 0.3.1 remain unchanged.
