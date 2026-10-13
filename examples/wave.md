```motion
{
  "version": 1,
  "id": "96a6efd1-6b47-40f8-a7c3-01d1c2c17ad3",
  "title": "Explore a wave",
  "description": "Move the sliders to see how each parameter changes the curve.",
  "type": "plot",
  "xMin": -6.3,
  "xMax": 6.3,
  "yMin": -5,
  "yMax": 5,
  "xLabel": "x",
  "yLabel": "y",
  "parameters": [
    {
      "name": "a",
      "label": "Amplitude",
      "min": 0,
      "max": 4,
      "step": 0.1,
      "value": 2
    },
    {
      "name": "b",
      "label": "Frequency",
      "min": 0.2,
      "max": 4,
      "step": 0.1,
      "value": 1
    }
  ],
  "curves": [
    {
      "label": "a * sin(b * x)",
      "formula": "a * sin(b * x)",
      "color": "blue"
    }
  ]
}
```
