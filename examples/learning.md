```motion
{
  "version": 2,
  "id": "aeb3c428-4403-42b4-81dd-2f7d825f23aa",
  "title": "Append за пределами ёмкости",
  "description": "Когда ёмкость исчерпана, append создаёт новый базовый массив.",
  "type": "scene",
  "duration": 2600,
  "steps": [
    {
      "title": "До append",
      "description": "Слайс ссылается на заполненный массив.",
      "code": "s := []int{10, 20}\ns = append(s, 30)",
      "activeLines": [
        1
      ],
      "variables": [
        {
          "name": "len(s)",
          "value": "2"
        },
        {
          "name": "cap(s)",
          "value": "2"
        }
      ],
      "nodes": [
        {
          "id": "slice",
          "label": "slice",
          "value": "len=2, cap=2",
          "x": 55,
          "y": 70,
          "color": "purple",
          "highlighted": false
        },
        {
          "id": "array",
          "label": "Старый массив",
          "value": "[10, 20]",
          "x": 350,
          "y": 70,
          "color": "blue",
          "highlighted": false
        }
      ],
      "edges": [
        {
          "from": "slice",
          "to": "array",
          "label": "data"
        }
      ]
    },
    {
      "title": "Выделить и скопировать",
      "description": "Копируем элементы в больший массив и добавляем 30. Точная новая ёмкость зависит от реализации.",
      "code": "s := []int{10, 20}\ns = append(s, 30)",
      "activeLines": [
        2
      ],
      "variables": [
        {
          "name": "len(s)",
          "value": "3"
        },
        {
          "name": "cap(s)",
          "value": ">=3"
        }
      ],
      "nodes": [
        {
          "id": "slice",
          "label": "slice",
          "value": "len=3, cap>=3",
          "x": 55,
          "y": 70,
          "color": "purple",
          "highlighted": true
        },
        {
          "id": "array",
          "label": "Старый массив",
          "value": "[10, 20]",
          "x": 350,
          "y": 70,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "new",
          "label": "Новый массив",
          "value": "[10, 20, 30]",
          "x": 350,
          "y": 260,
          "color": "green",
          "highlighted": true
        }
      ],
      "edges": [
        {
          "from": "slice",
          "to": "new",
          "label": "data"
        },
        {
          "from": "array",
          "to": "new",
          "label": "копия"
        }
      ]
    }
  ]
}
```

```motion
{
  "version": 2,
  "id": "c40ebdfe-9b1b-4520-86d2-b38f8dfa78da",
  "title": "Append за пределами ёмкости",
  "description": "Когда ёмкость исчерпана, append создаёт новый базовый массив.",
  "type": "scene",
  "duration": 2600,
  "steps": [
    {
      "title": "До append",
      "description": "Слайс ссылается на заполненный массив.",
      "code": "s := []int{10, 20}\ns = append(s, 30)",
      "activeLines": [
        1
      ],
      "variables": [
        {
          "name": "len(s)",
          "value": "2"
        },
        {
          "name": "cap(s)",
          "value": "2"
        }
      ],
      "question": {
        "prompt": "Использует ли append прежний массив?",
        "options": [
          {
            "text": "Да",
            "explanation": "Массив заполнен. Свободной ёмкости нет."
          },
          {
            "text": "Нет",
            "explanation": "Для append нужна дополнительная ёмкость, поэтому создаётся новый массив."
          }
        ],
        "correct": 1
      },
      "nodes": [
        {
          "id": "slice",
          "label": "slice",
          "value": "len=2, cap=2",
          "x": 55,
          "y": 70,
          "color": "purple",
          "highlighted": false
        },
        {
          "id": "array",
          "label": "Старый массив",
          "value": "[10, 20]",
          "x": 350,
          "y": 70,
          "color": "blue",
          "highlighted": false
        }
      ],
      "edges": [
        {
          "from": "slice",
          "to": "array",
          "label": "data"
        }
      ]
    },
    {
      "title": "Выделить и скопировать",
      "description": "Копируем элементы в больший массив и добавляем 30. Точная новая ёмкость зависит от реализации.",
      "code": "s := []int{10, 20}\ns = append(s, 30)",
      "activeLines": [
        2
      ],
      "variables": [
        {
          "name": "len(s)",
          "value": "3"
        },
        {
          "name": "cap(s)",
          "value": ">=3"
        }
      ],
      "nodes": [
        {
          "id": "slice",
          "label": "slice",
          "value": "len=3, cap>=3",
          "x": 55,
          "y": 70,
          "color": "purple",
          "highlighted": true
        },
        {
          "id": "array",
          "label": "Старый массив",
          "value": "[10, 20]",
          "x": 350,
          "y": 70,
          "color": "blue",
          "highlighted": false
        },
        {
          "id": "new",
          "label": "Новый массив",
          "value": "[10, 20, 30]",
          "x": 350,
          "y": 260,
          "color": "green",
          "highlighted": true
        }
      ],
      "edges": [
        {
          "from": "slice",
          "to": "new",
          "label": "data"
        },
        {
          "from": "array",
          "to": "new",
          "label": "копия"
        }
      ]
    }
  ]
}
```

```motion
{
  "version": 2,
  "id": "0c450931-c852-4892-b3a7-b47b36504ef8",
  "title": "Лаборатория очереди",
  "description": "Исследуй блокировку отправителей, буферы и пул работников.",
  "type": "lab",
  "compare": false,
  "config": {
    "jobs": 24,
    "arrival": 2,
    "workers": 3,
    "capacity": 4,
    "service": 3
  }
}
```

```motion
{
  "version": 2,
  "id": "943c159d-0550-4a3c-a8f1-802e4d48d474",
  "title": "Лаборатория очереди",
  "description": "Исследуй блокировку отправителей, буферы и пул работников.",
  "type": "lab",
  "compare": true,
  "config": {
    "jobs": 24,
    "arrival": 2,
    "workers": 3,
    "capacity": 4,
    "service": 3
  }
}
```

```motion
{
  "version": 2,
  "id": "1ab7fbf8-b638-4fff-9b9a-2f5ca6cbeb9f",
  "title": "Сравнение append",
  "description": "",
  "type": "comparison",
  "scenes": [
    {
      "version": 1,
      "id": "813fe72b-149d-4788-ab95-057aa6f6c901",
      "title": "Append за пределами ёмкости",
      "description": "Когда ёмкость исчерпана, append создаёт новый базовый массив.",
      "type": "scene",
      "duration": 2600,
      "steps": [
        {
          "title": "До append",
          "description": "Слайс ссылается на заполненный массив.",
          "code": "s := []int{10, 20}",
          "nodes": [
            {
              "id": "slice",
              "label": "slice",
              "value": "len=2, cap=2",
              "x": 55,
              "y": 70,
              "color": "purple",
              "highlighted": false
            },
            {
              "id": "array",
              "label": "Старый массив",
              "value": "[10, 20]",
              "x": 350,
              "y": 70,
              "color": "blue",
              "highlighted": false
            }
          ],
          "edges": [
            {
              "from": "slice",
              "to": "array",
              "label": "data"
            }
          ]
        },
        {
          "title": "Выделить и скопировать",
          "description": "Копируем элементы в больший массив и добавляем 30. Точная новая ёмкость зависит от реализации.",
          "code": "s = append(s, 30)",
          "nodes": [
            {
              "id": "slice",
              "label": "slice",
              "value": "len=3, cap>=3",
              "x": 55,
              "y": 70,
              "color": "purple",
              "highlighted": true
            },
            {
              "id": "array",
              "label": "Старый массив",
              "value": "[10, 20]",
              "x": 350,
              "y": 70,
              "color": "blue",
              "highlighted": false
            },
            {
              "id": "new",
              "label": "Новый массив",
              "value": "[10, 20, 30]",
              "x": 350,
              "y": 260,
              "color": "green",
              "highlighted": true
            }
          ],
          "edges": [
            {
              "from": "slice",
              "to": "new",
              "label": "data"
            },
            {
              "from": "array",
              "to": "new",
              "label": "копия"
            }
          ]
        }
      ]
    },
    {
      "version": 1,
      "id": "67289526-54f1-4a43-98e5-bb76b34a5ec3",
      "title": "Append в пределах ёмкости",
      "description": "При достаточной ёмкости базовый массив остаётся прежним.",
      "type": "scene",
      "duration": 2600,
      "steps": [
        {
          "title": "До append",
          "description": "В базовом массиве остаются два свободных места.",
          "code": "s := make([]int, 2, 4)\ns[0], s[1] = 10, 20",
          "nodes": [
            {
              "id": "slice",
              "label": "slice",
              "value": "len=2, cap=4",
              "x": 55,
              "y": 70,
              "color": "purple",
              "highlighted": false
            },
            {
              "id": "array",
              "label": "Старый массив",
              "value": "[10, 20, 0, 0]",
              "x": 350,
              "y": 70,
              "color": "blue",
              "highlighted": false
            }
          ],
          "edges": [
            {
              "from": "slice",
              "to": "array",
              "label": "data"
            }
          ]
        },
        {
          "title": "Используем прежний массив",
          "description": "Записываем 30 в следующую ячейку. Новый массив не нужен.",
          "code": "s = append(s, 30)",
          "nodes": [
            {
              "id": "slice",
              "label": "slice",
              "value": "len=3, cap=4",
              "x": 55,
              "y": 70,
              "color": "purple",
              "highlighted": false
            },
            {
              "id": "array",
              "label": "Старый массив",
              "value": "[10, 20, 30, 0]",
              "x": 350,
              "y": 70,
              "color": "blue",
              "highlighted": false
            }
          ],
          "edges": [
            {
              "from": "slice",
              "to": "array",
              "label": "data"
            }
          ]
        }
      ]
    }
  ]
}
```

```motion
{
  "version": 2,
  "id": "python-figure",
  "title": "Plotly из Python",
  "description": "Локальный график с масштабированием и всплывающими значениями.",
  "type": "plotly",
  "figure": {
    "data": [
      {
        "mode": "lines+markers",
        "name": "sin(x)",
        "x": {
          "dtype": "f8",
          "bdata": "AAAAAAAAAACTZX6uOz2wP5Nlfq47PcA/XJi9hdlbyD+TZX6uOz3QP/j+HZqKTNQ/XJi9hdlb2D/BMV1xKGvcP5Nlfq47PeA/RTJOJONE4j/4/h2aikzkP6rL7Q8yVOY/XJi9hdlb6D8PZY37gGPqP8ExXXEoa+w/dP4s589y7j+TZX6uOz3wP+xLZmkPQfE/RTJOJONE8j+fGDbftkjzP/j+HZqKTPQ/UeUFVV5Q9T+qy+0PMlT2PwOy1coFWPc/XJi9hdlb+D+2fqVArV/5Pw9ljfuAY/o/aEt1tlRn+z/BMV1xKGv8PxoYRSz8bv0/dP4s589y/j/N5BSio3b/P5Nlfq47PQBAwFjyiyW/AEDsS2ZpD0EBQBk/2kb5wgFARTJOJONEAkByJcIBzcYCQJ8YNt+2SANAywuqvKDKA0D4/h2aikwEQCTykXd0zgRAUeUFVV5QBUB+2HkySNIFQKrL7Q8yVAZA175h7RvWBkADstXKBVgHQDClSajv2QdAXJi9hdlbCECJizFjw90IQLZ+pUCtXwlA4nEZHpfhCUAPZY37gGMKQDtYAdlq5QpAaEt1tlRnC0CVPumTPukLQMExXXEoawxA7iTRThLtDEAaGEUs/G4NQEcLuQnm8A1AdP4s589yDkCg8aDEufQOQM3kFKKjdg9A+deIf434D0CTZX6uOz0QQClfOJ0wfhBAwFjyiyW/EEBWUqx6GgARQOxLZmkPQRFAgkUgWASCEUAZP9pG+cIRQK84lDXuAxJARTJOJONEEkDcKwgT2IUSQHIlwgHNxhJACB988MEHE0CfGDbftkgTQDUS8M2riRNAywuqvKDKE0BhBWSrlQsUQPj+HZqKTBRAjvjXiH+NFEAk8pF3dM4UQLvrS2ZpDxVAUeUFVV5QFUDn3r9DU5EVQH7YeTJI0hVAFNIzIT0TFkCqy+0PMlQWQEDFp/4mlRZA175h7RvWFkBtuBvcEBcXQAOy1coFWBdAmquPufqYF0AwpUmo79kXQMaeA5fkGhhAXJi9hdlbGEDzkXd0zpwYQImLMWPD3RhAH4XrUbgeGUA="
        },
        "y": {
          "dtype": "f8",
          "bdata": "AAAAAAAAAADLPv0UcjqwP6UEaQEXMsA/PJXwa0c2yD9ezPp+xBDQP1RwIAza9dM/gWcml2HG1z9X93uEbX7bP3G5z24pGt8/2jVTDO9K4T/11PWf+vbiP3Xqxad+j+Q/r7KkddYS5j8QZhMpc3/nP/1U9End0+g/GDMxS7YO6j8jaLjzuS7rP4OpXay/Muw/kwpGsbsZ7T+B/6QlwOLtP9Nfrgj+jO4/SyvBCsYX7z95je9BiYLvP8k3Kr3ZzO8/0IR39Wr27z+7zsEcEv/vP7nR60nG5u8/C7b9gaCt7z+1TmGe21PvP/YUSBDU2e4/kEh5gQdA7j9XPOpSFIftPzIRpvm4r+w/J9OsOtO66z9R8JNGX6nqPy0207V2fOk/BsTJZk816D/Zj6U+OtXmP+0Wds6hXeU/snvP3QjQ4z8cjH7cCC7iP7jY5zxQeeA/OBaIcUFn3T+J5QMEm73ZP4ZgVsNy+dU/WNt1jake0j8Wbpobb2LMPzaInE1QasQ/opTqHle6uD/WPGmXLQ2hP7gFKHDE156/EshwS4jqt79na29RPwPEv9VZpK+e/Mu/fAjcC5bs0b+Rp1mHZ8jVv9YEvI7Kjdm/a5Lm/9w43b+dxvXo62LgvyBIcHyJGOK/lPXklIS747/lDl69LUrlv8PZu23qwua/ZzZ2sTYk6L9mgx63pmzpvwNpBkfomuq/g72JH8St679Z2ZQ1H6Tsv91JHdj7fO2/oLtgtXo37r81Ft3A29LuvzL4FPl+Tu+/eutUDOWp779epM/br+Tvvw5Iityi/u+/Peu0VaP3778UFS98uM/vv1rwG2sLh++/D8+N+eYd77+4l3Rtt5Tuv155HgwK7O2/mbe9iIwk7b+cXYlRDD/sv0wLMbx1POu/KrV9EtMd6r9U9RmAS+Tov+hPnOIhkee/fm0MfbMl5r/DrDmQdqPkv7NqVdn4C+O/quBd+N1g4b/2v/5/u0ffv9DOUeGErdu/6PVMwc3217+AYU4maSfUvy74TIBDQ9C/80H/PL2cyL9fvAQem5nAv/Az5LLBCrG/p/3w4A8Yar8="
        },
        "type": "scatter"
      }
    ],
    "layout": {
      "template": {
        "data": {
          "histogram2dcontour": [
            {
              "type": "histogram2dcontour",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              },
              "colorscale": [
                [
                  0,
                  "#0d0887"
                ],
                [
                  0.1111111111111111,
                  "#46039f"
                ],
                [
                  0.2222222222222222,
                  "#7201a8"
                ],
                [
                  0.3333333333333333,
                  "#9c179e"
                ],
                [
                  0.4444444444444444,
                  "#bd3786"
                ],
                [
                  0.5555555555555556,
                  "#d8576b"
                ],
                [
                  0.6666666666666666,
                  "#ed7953"
                ],
                [
                  0.7777777777777778,
                  "#fb9f3a"
                ],
                [
                  0.8888888888888888,
                  "#fdca26"
                ],
                [
                  1,
                  "#f0f921"
                ]
              ]
            }
          ],
          "histogram2d": [
            {
              "type": "histogram2d",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              },
              "colorscale": [
                [
                  0,
                  "#0d0887"
                ],
                [
                  0.1111111111111111,
                  "#46039f"
                ],
                [
                  0.2222222222222222,
                  "#7201a8"
                ],
                [
                  0.3333333333333333,
                  "#9c179e"
                ],
                [
                  0.4444444444444444,
                  "#bd3786"
                ],
                [
                  0.5555555555555556,
                  "#d8576b"
                ],
                [
                  0.6666666666666666,
                  "#ed7953"
                ],
                [
                  0.7777777777777778,
                  "#fb9f3a"
                ],
                [
                  0.8888888888888888,
                  "#fdca26"
                ],
                [
                  1,
                  "#f0f921"
                ]
              ]
            }
          ],
          "heatmap": [
            {
              "type": "heatmap",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              },
              "colorscale": [
                [
                  0,
                  "#0d0887"
                ],
                [
                  0.1111111111111111,
                  "#46039f"
                ],
                [
                  0.2222222222222222,
                  "#7201a8"
                ],
                [
                  0.3333333333333333,
                  "#9c179e"
                ],
                [
                  0.4444444444444444,
                  "#bd3786"
                ],
                [
                  0.5555555555555556,
                  "#d8576b"
                ],
                [
                  0.6666666666666666,
                  "#ed7953"
                ],
                [
                  0.7777777777777778,
                  "#fb9f3a"
                ],
                [
                  0.8888888888888888,
                  "#fdca26"
                ],
                [
                  1,
                  "#f0f921"
                ]
              ]
            }
          ],
          "contourcarpet": [
            {
              "type": "contourcarpet",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              }
            }
          ],
          "contour": [
            {
              "type": "contour",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              },
              "colorscale": [
                [
                  0,
                  "#0d0887"
                ],
                [
                  0.1111111111111111,
                  "#46039f"
                ],
                [
                  0.2222222222222222,
                  "#7201a8"
                ],
                [
                  0.3333333333333333,
                  "#9c179e"
                ],
                [
                  0.4444444444444444,
                  "#bd3786"
                ],
                [
                  0.5555555555555556,
                  "#d8576b"
                ],
                [
                  0.6666666666666666,
                  "#ed7953"
                ],
                [
                  0.7777777777777778,
                  "#fb9f3a"
                ],
                [
                  0.8888888888888888,
                  "#fdca26"
                ],
                [
                  1,
                  "#f0f921"
                ]
              ]
            }
          ],
          "surface": [
            {
              "type": "surface",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              },
              "colorscale": [
                [
                  0,
                  "#0d0887"
                ],
                [
                  0.1111111111111111,
                  "#46039f"
                ],
                [
                  0.2222222222222222,
                  "#7201a8"
                ],
                [
                  0.3333333333333333,
                  "#9c179e"
                ],
                [
                  0.4444444444444444,
                  "#bd3786"
                ],
                [
                  0.5555555555555556,
                  "#d8576b"
                ],
                [
                  0.6666666666666666,
                  "#ed7953"
                ],
                [
                  0.7777777777777778,
                  "#fb9f3a"
                ],
                [
                  0.8888888888888888,
                  "#fdca26"
                ],
                [
                  1,
                  "#f0f921"
                ]
              ]
            }
          ],
          "mesh3d": [
            {
              "type": "mesh3d",
              "colorbar": {
                "outlinewidth": 0,
                "ticks": ""
              }
            }
          ],
          "scatter": [
            {
              "fillpattern": {
                "fillmode": "overlay",
                "size": 10,
                "solidity": 0.2
              },
              "type": "scatter"
            }
          ],
          "parcoords": [
            {
              "type": "parcoords",
              "line": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "scatterpolargl": [
            {
              "type": "scatterpolargl",
              "marker": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "bar": [
            {
              "error_x": {
                "color": "#2a3f5f"
              },
              "error_y": {
                "color": "#2a3f5f"
              },
              "marker": {
                "line": {
                  "color": "#E5ECF6",
                  "width": 0.5
                },
                "pattern": {
                  "fillmode": "overlay",
                  "size": 10,
                  "solidity": 0.2
                }
              },
              "type": "bar"
            }
          ],
          "scatterpolar": [
            {
              "type": "scatterpolar",
              "marker": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "histogram": [
            {
              "marker": {
                "pattern": {
                  "fillmode": "overlay",
                  "size": 10,
                  "solidity": 0.2
                }
              },
              "type": "histogram"
            }
          ],
          "scattergl": [
            {
              "type": "scattergl",
              "marker": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "scatter3d": [
            {
              "type": "scatter3d",
              "line": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              },
              "marker": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "scatterternary": [
            {
              "type": "scatterternary",
              "marker": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "scattercarpet": [
            {
              "type": "scattercarpet",
              "marker": {
                "colorbar": {
                  "outlinewidth": 0,
                  "ticks": ""
                }
              }
            }
          ],
          "carpet": [
            {
              "aaxis": {
                "endlinecolor": "#2a3f5f",
                "gridcolor": "white",
                "linecolor": "white",
                "minorgridcolor": "white",
                "startlinecolor": "#2a3f5f"
              },
              "baxis": {
                "endlinecolor": "#2a3f5f",
                "gridcolor": "white",
                "linecolor": "white",
                "minorgridcolor": "white",
                "startlinecolor": "#2a3f5f"
              },
              "type": "carpet"
            }
          ],
          "table": [
            {
              "cells": {
                "fill": {
                  "color": "#EBF0F8"
                },
                "line": {
                  "color": "white"
                }
              },
              "header": {
                "fill": {
                  "color": "#C8D4E3"
                },
                "line": {
                  "color": "white"
                }
              },
              "type": "table"
            }
          ],
          "barpolar": [
            {
              "marker": {
                "line": {
                  "color": "#E5ECF6",
                  "width": 0.5
                },
                "pattern": {
                  "fillmode": "overlay",
                  "size": 10,
                  "solidity": 0.2
                }
              },
              "type": "barpolar"
            }
          ],
          "pie": [
            {
              "automargin": true,
              "type": "pie"
            }
          ]
        },
        "layout": {
          "autotypenumbers": "strict",
          "colorway": [
            "#636efa",
            "#EF553B",
            "#00cc96",
            "#ab63fa",
            "#FFA15A",
            "#19d3f3",
            "#FF6692",
            "#B6E880",
            "#FF97FF",
            "#FECB52"
          ],
          "font": {
            "color": "#2a3f5f"
          },
          "hovermode": "closest",
          "hoverlabel": {
            "align": "left"
          },
          "paper_bgcolor": "white",
          "plot_bgcolor": "#E5ECF6",
          "polar": {
            "bgcolor": "#E5ECF6",
            "angularaxis": {
              "gridcolor": "white",
              "linecolor": "white",
              "ticks": ""
            },
            "radialaxis": {
              "gridcolor": "white",
              "linecolor": "white",
              "ticks": ""
            }
          },
          "ternary": {
            "bgcolor": "#E5ECF6",
            "aaxis": {
              "gridcolor": "white",
              "linecolor": "white",
              "ticks": ""
            },
            "baxis": {
              "gridcolor": "white",
              "linecolor": "white",
              "ticks": ""
            },
            "caxis": {
              "gridcolor": "white",
              "linecolor": "white",
              "ticks": ""
            }
          },
          "coloraxis": {
            "colorbar": {
              "outlinewidth": 0,
              "ticks": ""
            }
          },
          "colorscale": {
            "sequential": [
              [
                0,
                "#0d0887"
              ],
              [
                0.1111111111111111,
                "#46039f"
              ],
              [
                0.2222222222222222,
                "#7201a8"
              ],
              [
                0.3333333333333333,
                "#9c179e"
              ],
              [
                0.4444444444444444,
                "#bd3786"
              ],
              [
                0.5555555555555556,
                "#d8576b"
              ],
              [
                0.6666666666666666,
                "#ed7953"
              ],
              [
                0.7777777777777778,
                "#fb9f3a"
              ],
              [
                0.8888888888888888,
                "#fdca26"
              ],
              [
                1,
                "#f0f921"
              ]
            ],
            "sequentialminus": [
              [
                0,
                "#0d0887"
              ],
              [
                0.1111111111111111,
                "#46039f"
              ],
              [
                0.2222222222222222,
                "#7201a8"
              ],
              [
                0.3333333333333333,
                "#9c179e"
              ],
              [
                0.4444444444444444,
                "#bd3786"
              ],
              [
                0.5555555555555556,
                "#d8576b"
              ],
              [
                0.6666666666666666,
                "#ed7953"
              ],
              [
                0.7777777777777778,
                "#fb9f3a"
              ],
              [
                0.8888888888888888,
                "#fdca26"
              ],
              [
                1,
                "#f0f921"
              ]
            ],
            "diverging": [
              [
                0,
                "#8e0152"
              ],
              [
                0.1,
                "#c51b7d"
              ],
              [
                0.2,
                "#de77ae"
              ],
              [
                0.3,
                "#f1b6da"
              ],
              [
                0.4,
                "#fde0ef"
              ],
              [
                0.5,
                "#f7f7f7"
              ],
              [
                0.6,
                "#e6f5d0"
              ],
              [
                0.7,
                "#b8e186"
              ],
              [
                0.8,
                "#7fbc41"
              ],
              [
                0.9,
                "#4d9221"
              ],
              [
                1,
                "#276419"
              ]
            ]
          },
          "xaxis": {
            "gridcolor": "white",
            "linecolor": "white",
            "ticks": "",
            "title": {
              "standoff": 15
            },
            "zerolinecolor": "white",
            "automargin": true,
            "zerolinewidth": 2
          },
          "yaxis": {
            "gridcolor": "white",
            "linecolor": "white",
            "ticks": "",
            "title": {
              "standoff": 15
            },
            "zerolinecolor": "white",
            "automargin": true,
            "zerolinewidth": 2
          },
          "scene": {
            "xaxis": {
              "backgroundcolor": "#E5ECF6",
              "gridcolor": "white",
              "linecolor": "white",
              "showbackground": true,
              "ticks": "",
              "zerolinecolor": "white",
              "gridwidth": 2
            },
            "yaxis": {
              "backgroundcolor": "#E5ECF6",
              "gridcolor": "white",
              "linecolor": "white",
              "showbackground": true,
              "ticks": "",
              "zerolinecolor": "white",
              "gridwidth": 2
            },
            "zaxis": {
              "backgroundcolor": "#E5ECF6",
              "gridcolor": "white",
              "linecolor": "white",
              "showbackground": true,
              "ticks": "",
              "zerolinecolor": "white",
              "gridwidth": 2
            }
          },
          "shapedefaults": {
            "line": {
              "color": "#2a3f5f"
            }
          },
          "annotationdefaults": {
            "arrowcolor": "#2a3f5f",
            "arrowhead": 0,
            "arrowwidth": 1
          },
          "title": {
            "x": 0.05
          }
        }
      },
      "title": {
        "text": "Python Plotly import"
      },
      "xaxis": {
        "title": {
          "text": "x"
        }
      },
      "yaxis": {
        "title": {
          "text": "sin(x)"
        }
      }
    },
    "frames": []
  }
}
```