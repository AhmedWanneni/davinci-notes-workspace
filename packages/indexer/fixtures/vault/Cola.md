---
database: table
columns:
  - name: Name
    type: text
  - name: Status
    type: select
    options:
      - value: Todo
        color: blue
      - value: Done
        color: green
  - name: Done
    type: checkbox
  - name: Column 4
    type: checkbox
  - name: Bb
    type: text
---

| Name | Status | Done | Column 4 | Bb |
| --- | --- | --- | --- | --- |
| Hello world | Todo | true | High | Hoi |
| Bb |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
---
database: table
columns:
  - name: Name
    type: text
  - name: Status
    type: select
    options:
      - { value: Todo, color: blue }
      - { value: In Progress, color: orange }
      - { value: Done, color: green }
  - name: Done
    type: checkbox
---

| Name | Status | Done |
|---|---|---|
|  | Todo | false |
