# Scene tools

These tools are in the development build. The Obsidian plugin and HTML viewer share the same version 3 scene format. Version 1 and 2 documents still load. Older viewers reject version 3, so distribute a fresh standalone HTML export or update the viewer alongside your notes.

## Gallery

Open **Create visualization**. Search by title or description, or choose Code and algorithms, Mathematics, Systems and queues, Physics, or Start from scratch. Selecting a card opens a working preview. **Use this example** creates an independent editable copy with a new document ID.

The 14 choices include channels, append, stack push/pop, bubble sort, motion, waves, exponential growth, queues, comparisons and blank documents. Preview controls do not change the saved example. The stack example also demonstrates a prediction question before pop.

## Timing

Select a step on the editor timeline. Each step shows its total time in seconds. **Current step timing** has three controls:

- **Transition (ms)** controls movement into this step, from 0 to 10,000 ms. Zero changes positions immediately.
- **Hold (ms)** keeps the completed step visible, from 0 to 30,000 ms. Transition plus hold must be at least 100 ms.
- **Easing** selects linear motion, acceleration, deceleration, or both.

The first step starts fully drawn and remains visible for its total interval. Later steps spend their interval moving and then holding. Speed scales both parts. Manual Next/Back uses the target step's transition. Questions stop automatic advancement until answered or revealed. Reduced-motion mode skips movement while preserving the reading interval.

**Use default timing** removes the step override. The scene's default duration is used for steps without an override, with up to 350 ms for the transition. Existing scenes retain their original total intervals. Scene comparison still synchronizes by step number at its existing 1.5-second interval.

## Shared parameters

Expand **Shared parameters and graph** and enable shared parameters. Add sliders with unique names, labels, bounds, increments and initial values. Parameter rules match graph parameters, with at most 12 sliders.

Select a block. Set **X formula** or **Y formula** to an expression such as `50 + speed * time * 12`. An empty formula uses the block's ordinary coordinate. Bound positions are clamped to the canvas. The editing canvas shows base coordinates and source text; Playback preview shows the computed result. Dragging changes the base coordinate, so clear its formula to use that coordinate during playback.

Use `{{speed * time}}` in block labels, values, arrow labels, step titles or explanations. Text uses five significant digits. Undefined values display `?`; an undefined position falls back to the base coordinate. Unknown parameter names and malformed templates block saving. Formulas use the existing restricted parser and cannot execute JavaScript.

**Add linked graph** adds curves and axes under the scene. Its curves use the same parameters and the graph variable `x`. Scene formulas use parameter names rather than `x`. For example, a `speed` slider can move a block with `50 + speed * time * 12`, update `s = {{speed * time}} m`, and redraw `speed * x` in the graph.

Playback sliders are temporary and isolated per player. **Reset parameters** restores saved initial values. To change what readers see first, edit **Initial value**. Renaming or deleting a parameter requires updating formulas that refer to it; the editor reports invalid references before saving.

## Portable fields

Version 3 scenes add optional `parameters` and `plot` fields. The plot stores axes and curves and shares the scene's parameter list. A step may have `timing: { transition, hold, easing }`. A node may have `bindings: { x, y }`, where each present coordinate contains a formula string. Text interpolation is enabled only for version 3 scenes.

See [motion](../examples/motion.md), [stack](../examples/stack.md) and [bubble sort](../examples/bubble-sort.md) for complete editable documents. Export HTML includes these fields and the viewer, so playback works offline without Obsidian.
