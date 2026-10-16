# Stack: push and pop

```motion
{
  "version": 3,
  "type": "scene",
  "id": "911152ff-cc38-472d-b715-8ae02d2dc79b",
  "title": "Stack: push and pop",
  "description": "The last value pushed is the first one popped.",
  "duration": 1800,
  "steps": [
    {
      "title": "Push 10",
      "description": "The first value becomes the top.",
      "nodes": [
        {
          "id": "ten",
          "label": "Top",
          "value": "10",
          "x": 330,
          "y": 280,
          "color": "blue",
          "highlighted": false
        }
      ],
      "code": "stack = append(stack, 10)",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      }
    },
    {
      "title": "Push 20",
      "description": "20 is now on top of 10.",
      "nodes": [
        {
          "id": "ten",
          "label": "Bottom",
          "value": "10",
          "x": 330,
          "y": 280,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "twenty",
          "label": "Top",
          "value": "20",
          "x": 330,
          "y": 180,
          "color": "blue",
          "highlighted": false
        }
      ],
      "code": "stack = append(stack, 20)",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      },
      "question": {
        "prompt": "Which value will pop return?",
        "correct": 1,
        "options": [
          {
            "text": "10",
            "explanation": "10 was inserted first and is below 20."
          },
          {
            "text": "20",
            "explanation": "A stack returns the last inserted value first."
          }
        ]
      }
    },
    {
      "title": "Pop 20",
      "description": "Pop removes the last inserted value.",
      "nodes": [
        {
          "id": "ten",
          "label": "Top",
          "value": "10",
          "x": 330,
          "y": 280,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "twenty",
          "label": "Returned",
          "value": "20",
          "x": 570,
          "y": 180,
          "color": "green",
          "highlighted": false
        }
      ],
      "code": "value := stack[len(stack)-1]\nstack = stack[:len(stack)-1]",
      "edges": [],
      "timing": {
        "transition": 600,
        "hold": 1200,
        "easing": "ease-in-out"
      }
    },
    {
      "title": "Pop 10",
      "description": "The stack is empty after the second pop.",
      "nodes": [
        {
          "id": "ten",
          "label": "Returned",
          "value": "10",
          "x": 570,
          "y": 280,
          "color": "green",
          "highlighted": false
        }
      ],
      "code": "value = stack[len(stack)-1]\nstack = stack[:len(stack)-1]",
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
