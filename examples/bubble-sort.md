# Bubble sort

```motion
{
  "version": 3,
  "type": "scene",
  "id": "d7c46387-e9d6-42a1-9df0-e0222875706e",
  "title": "Bubble sort",
  "description": "Follow adjacent swaps. Blocks keep their identity while changing places.",
  "duration": 1800,
  "steps": [
    {
      "title": "Compare 3 and 1",
      "description": "3 > 1",
      "nodes": [
        {
          "id": "n3",
          "label": "a[0]",
          "value": "3",
          "x": 100,
          "y": 180,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "n1",
          "label": "a[1]",
          "value": "1",
          "x": 320,
          "y": 180,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "n2",
          "label": "a[2]",
          "value": "2",
          "x": 540,
          "y": 180,
          "color": "blue",
          "highlighted": false
        }
      ],
      "code": "if a[0] > a[1] {\n  a[0], a[1] = a[1], a[0]\n}",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      }
    },
    {
      "title": "Swap, then compare 3 and 2",
      "description": "3 > 2",
      "nodes": [
        {
          "id": "n1",
          "label": "a[0]",
          "value": "1",
          "x": 100,
          "y": 180,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "n3",
          "label": "a[1]",
          "value": "3",
          "x": 320,
          "y": 180,
          "color": "blue",
          "highlighted": true
        },
        {
          "id": "n2",
          "label": "a[2]",
          "value": "2",
          "x": 540,
          "y": 180,
          "color": "blue",
          "highlighted": false
        }
      ],
      "code": "if a[1] > a[2] {\n  a[1], a[2] = a[2], a[1]\n}",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      }
    },
    {
      "title": "Largest value reaches the end",
      "description": "The next pass checks 1 and 2. No swap is needed.",
      "nodes": [
        {
          "id": "n1",
          "label": "a[0]",
          "value": "1",
          "x": 100,
          "y": 180,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "n2",
          "label": "a[1]",
          "value": "2",
          "x": 320,
          "y": 180,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "n3",
          "label": "a[2]",
          "value": "3",
          "x": 540,
          "y": 180,
          "color": "blue",
          "highlighted": true
        }
      ],
      "code": "// Next pass: 1 <= 2",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      }
    }
  ]
}
```
