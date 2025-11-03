# 🗂️ Kanban Board API Documentation

This document describes the available REST API endpoints for the Kanban Board backend.
The API allows clients to fetch boards, add tasks, and move tasks between columns.


### 🟩 (1) Get Kanban Board
```
GET /api/board
```

### Description
>Fetch the entire Kanban board including all columns and tasks.

### Request Body
```
No body required
```

### Response
```
{
  "success": true,
  "message": string,
  "data": {
    "task-list": {
      "1": { "id": number, "content": string  },
      "2": { "id": number, "content": string  },
      "3": { "id": number, "content": string  },
      "4": { "id": number, "content": string  }
    },
    "columns": {
      "todo": array[number],
      "ongoing": array[number],
      "done": array[number] // [5]
    },
    "order": array[string] // todo, ongoing, done
  }
}
```

### Status Code
```
| Code  | Description                     |
|-------|---------------------------------|
| 200   | Board fetched successfully      |
| 204   | Board is empty, no content      |
| 500   | Internal server error occurred  |
```

---

### 🟦 (2) Add Task
```
POST /api/task
```
### Description
> Add a new task to the Kanban board. The backend receives a task object and returns the updated task list.

### Request Body
```
{
  "id": number,
  "title": string
}
```

### Response
```
{
  "success": true,
  "message": string,
  "tasks": [
    { "id": number, "title": string },
    { "id": number, "title": string }
  ]
}
```

### Status Code
```
| Code  | Description                     |
|-------|---------------------------------|
| 200   | Task added successfully         |
| 400   | Invalid task data provided      |
| 500   | Internal server error occurred  |
```

### 🟨 (3) Move Task
```
POST /api/task/move
```
### Description
> Moves a task to a new column and/or position when dragged and dropped in the frontend Kanban board.
The backend updates the column arrays accordingly and returns the updated board state.

### Request Body
```
{
    "id": number,
    "index": number,
    "arrayName": string
}
```

### Response
```
{
    success": true,
    "message": string
}
```

### Status Code
```
| Code  | Description                     |
|-------|---------------------------------|
| 200   | Task moved successfully         |
| 400   | Invalid request                 |
| 500   | Internal server error occurred  |
```