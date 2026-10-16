# Motion and distance

```motion
{
  "version": 3,
  "type": "scene",
  "id": "6d60c511-8201-4675-bc26-d692c230b4bd",
  "title": "Motion and distance",
  "description": "Change speed to update the body, distance label and graph together.",
  "duration": 1800,
  "steps": [
    {
      "title": "Uniform motion",
      "description": "After {{time}} s, distance is {{speed * time}} m.",
      "nodes": [
        {
          "id": "body",
          "label": "Moving body",
          "value": "s = {{speed * time}} m",
          "x": 50,
          "y": 180,
          "color": "blue",
          "highlighted": false,
          "bindings": {
            "x": "50 + speed * time * 12"
          }
        }
      ],
      "code": "",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      }
    }
  ],
  "parameters": [
    {
      "name": "speed",
      "label": "Speed (m/s)",
      "min": 0,
      "max": 5,
      "step": 0.1,
      "value": 2
    },
    {
      "name": "time",
      "label": "Time (s)",
      "min": 0,
      "max": 10,
      "step": 0.1,
      "value": 2
    }
  ],
  "plot": {
    "xMin": 0,
    "xMax": 10,
    "yMin": 0,
    "yMax": 50,
    "xLabel": "Time (s)",
    "yLabel": "Distance (m)",
    "curves": [
      {
        "label": "s = v * t",
        "formula": "speed * x",
        "color": "blue"
      }
    ]
  }
}
```
