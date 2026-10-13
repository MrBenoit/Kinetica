# Learning tools

Kinetica 0.3.0 adds learning documents with `version: 2`. Existing version 1 scenes and formula plots still work. See [example documents](../examples/learning.md).

## Code and questions

Open **Code highlights, variables and questions** below the code field in a scene. Enter active line numbers separated by commas, then add named variables with their values for that step. Duplicate the step before changing values. The player highlights the active lines and changed values. Code is displayed, never executed.

Add a question, two to six answers and explanations, then select the correct answer. Readers must answer correctly or choose **Show answer** before continuing. Jumping ahead and automatic playback respect the question. Restart clears answers. Answers stay in memory and are not tracked or stored.

## Queue laboratory

Choose **Queue laboratory** or **Compare worker pools**. Set the saved defaults in the editor. Reader sliders change the current session only.

Each tick completes running work, creates up to the arrival limit, assigns idle workers from waiting work, and fills the buffer. When the buffer fills, producers wait. A zero-capacity buffer hands work directly to an available worker. Jobs are never dropped. All workers take the same configured number of ticks per job. This is a deterministic teaching model, not a trace of the Go scheduler.

The diagram, completion chart, counts and timeline all read the same simulation state. Comparison holds arrivals, job count, buffer capacity and service time constant, changing only the worker count. The faster side remains at its completed state while the slower side finishes.

Limits: 60 jobs, 8 workers, 20 buffer slots, 6 arrivals per tick and 10 ticks per job. These bounds keep playback responsive on a note page. The laboratory is a built-in model; it does not run custom simulation code.

## Scene comparison

Choose **Compare two scenes** and edit each side. Both scenes advance by step number. A shorter scene holds its final state. The shared player uses 1.5 seconds per step. Questions are supported in individual scenes, not inside comparison documents.

## Import from Python and Plotly

Create the figure outside Obsidian and export its data:

```python
import plotly.graph_objects as go

figure = go.Figure(go.Bar(x=["A", "B", "C"], y=[2, 5, 3]))
figure.write_json("figure.json")
```

In **Create visualization**, expand **Import Plotly / Python**. Choose the JSON file or paste its contents, then click **Import figure**. Edit the title and save. To change a figure later, replace its Plotly JSON in the editor.

The full Plotly.js distribution is bundled locally. Supported offline figures include scatter, bars, heatmaps, scientific plots and 3D traces. Plotly frames, sliders and update menus from the imported figure are kept. Some 3D plots need browser WebGL support. The import also accepts NumPy binary arrays in Python exports.

Python itself is not installed or executed by the plugin. Import a figure's JSON, not a Python script or an HTML export. The plugin ignores root-level Plotly configuration and supplies its own offline configuration. Imported HTML formatting in labels is reduced to text.

Geographic traces, remote images, remote data references and URL-bearing fields are rejected. Unused geographic defaults in Python templates are removed. The figure runs in an iframe with scripts allowed but without same-origin access, navigation permissions or network connections. Its CSP blocks outbound requests. The local trusted Plotly bundle needs inline scripts and dynamic shader compilation inside this isolated frame. A 20-second load timeout removes a frame that fails to initialize. Removing the player destroys the frame and listeners.

Documents remain limited to 500,000 serialized characters. Plotly input is additionally bounded to 100 traces, 100 frames, 100,000 JSON values and 24 nesting levels. Reduce data or split large figures before importing.

## Export a single HTML file

Click **Export HTML** in a player or editor, or run **Export visualization as HTML** from the command palette. The file is saved beside the source note. Existing files are preserved by adding a numeric suffix. A notice shows the saved path.

The file contains the document, styles and entire browser runtime, including Plotly. It works without a CDN, Obsidian or Python. It is about 5 MB even for a small scene because the runtime includes full Plotly. The plugin bundle is below 5 MB by sharing one Plotly payload between playback and export. Language and theme are captured at export time. Sharing this file shares the visualization's content.
