# 🗂️ Kanban Board API Documentation

# 🟥 Deprecated due to tech shift from REST API to GraphQL 🟥

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
      "1": { "id": number, "title": string  },
      "2": { "id": number, "title": string  },
      "3": { "id": number, "title": string  },
      "4": { "id": number, "title": string  }
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
The backend updates the column arrays accordingly and return a boolean

### Request Body
```
{
    "id": number,
    "index": number,
    "currentColumn": string,
    "newColumn": string
}
```

### Response
```
{
    "success": true,
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

### 🟥 (4) Remove Task
```
DELETE /api/task/delete
```
### Description
> Deletes a task from the specified column in the Kanban board.
The backend removes the task ID from the column’s list but retains the task in memory for potential recovery or auditing.
Returns the deleted task details upon success.

### Request Body
```
{
    "id": number,
    "column": string
}
```

### Response
```
{
    "success": true,
    "message": string,
    "data" : task
}
```

### Status Code
```
| Code  | Description                     |
|-------|---------------------------------|
| 200   | Task deleted successfully       |
| 400   | Invalid request                 |
| 500   | Internal server error occurred  |
```


### 🟨 (5) Update Task
```
DELETE /api/task/update
```
### Description
> Update a task and return a boolean

### Request Body
```
{
  "task" : TaskObject
}
```

### Response
```
{
    "success": true,
    "message": string
}
```

### Status Code
```
| Code  | Description                     |
|-------|---------------------------------|
| 200   | Task updated successfully       |
| 400   | Invalid request                 |
| 500   | Internal server error occurred  |
```