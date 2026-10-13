```motion
{
  "version": 1,
  "id": "2f4f1294-5461-4579-bc44-346da4cffef6",
  "title": "Message delivery",
  "description": "Step through the delivery, then edit the scene to tell your own story.",
  "type": "scene",
  "duration": 2200,
  "steps": [
    {
      "title": "Prepare",
      "description": "The sender prepares a value.",
      "code": "value := 42",
      "nodes": [
        {
          "id": "sender",
          "label": "Sender",
          "value": "Ready",
          "x": 60,
          "y": 155,
          "color": "blue",
          "highlighted": true
        },
        {
          "id": "message",
          "label": "Message",
          "value": "42",
          "x": 275,
          "y": 155,
          "color": "orange",
          "highlighted": false
        },
        {
          "id": "receiver",
          "label": "Receiver",
          "value": "Waiting",
          "x": 570,
          "y": 155,
          "color": "green",
          "highlighted": false
        }
      ],
      "edges": []
    },
    {
      "title": "Send",
      "description": "The value travels to the receiver.",
      "code": "ch <- value",
      "nodes": [
        {
          "id": "sender",
          "label": "Sender",
          "value": "Ready",
          "x": 60,
          "y": 155,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "message",
          "label": "Message",
          "value": "42",
          "x": 385,
          "y": 260,
          "color": "orange",
          "highlighted": true
        },
        {
          "id": "receiver",
          "label": "Receiver",
          "value": "Waiting",
          "x": 570,
          "y": 155,
          "color": "green",
          "highlighted": false
        }
      ],
      "edges": [
        {
          "from": "sender",
          "to": "receiver",
          "label": "channel"
        }
      ]
    },
    {
      "title": "Receive",
      "description": "The receiver reads the value.",
      "code": "value := <-ch",
      "nodes": [
        {
          "id": "sender",
          "label": "Sender",
          "value": "Ready",
          "x": 60,
          "y": 155,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "message",
          "label": "Message",
          "value": "42",
          "x": 570,
          "y": 275,
          "color": "orange",
          "highlighted": false
        },
        {
          "id": "receiver",
          "label": "Receiver",
          "value": "42",
          "x": 570,
          "y": 155,
          "color": "green",
          "highlighted": true
        }
      ],
      "edges": [
        {
          "from": "sender",
          "to": "receiver",
          "label": "delivered"
        }
      ]
    }
  ]
}
```
