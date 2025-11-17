# Kanban Board GraphQL API Documentation

This document describes the GraphQL API endpoints for the Kanban Board backend.
The API allows clients to fetch boards, manage tasks, and organize columns using GraphQL queries and mutations.

**Endpoint:** `http://localhost:8080/graphql`

---

## Schema

### Types

#### **Board**
```graphql
type Board {
  id: ID
  taskList: [Task!]!
  columns: [Column!]!
  order: [String!]!
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `ID` | Unique board identifier |
| `taskList` | `[Task!]!` | Array of all tasks in the board |
| `columns` | `[Column!]!` | Array of all columns |
| `order` | `[String!]!` | Ordered list of column IDs |

---

#### **Column**
```graphql
type Column {
  id: String!
  taskIds: [Int!]!
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String!` | Column identifier (e.g., "todo", "in-progress") |
| `taskIds` | `[Int!]!` | Array of task IDs in this column |

---

#### **Task**
```graphql
type Task {
  id: Int!
  title: String!
  description: String
  createdDate: String
  modifiedDate: String
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Int!` | Unique task identifier |
| `title` | `String!` | Task title (required) |
| `description` | `String` | Task description (optional) |
| `createdDate` | `String` | ISO 8601 timestamp |
| `modifiedDate` | `String` | ISO 8601 timestamp (updated on edit) |

---

### Input Types

#### **TaskInput**
```graphql
input TaskInput {
  id: Int
  title: String!
  description: String
  createdDate: String
  modifiedDate: String
}
```

Used for creating and editing tasks.

---

## Queries

### (1) Get Board
```graphql
query GetBoard {
  board {
    id
    taskList {
      id
      title
      description
      createdDate
      modifiedDate
    }
    columns {
      id
      taskIds
    }
    order
  }
}
```

### Description
Fetch the entire Kanban board including all tasks, columns, and column order.

### Response
```json
{
  "data": {
    "board": {
      "id": "1",
      "taskList": [
        {
          "id": 1,
          "title": "Setup project",
          "description": "Initialize repository",
          "createdDate": "2025-11-17T10:00:00.000Z",
          "modifiedDate": null
        }
      ],
      "columns": [
        {
          "id": "todo",
          "taskIds": [1]
        },
        {
          "id": "in-progress",
          "taskIds": []
        }
      ],
      "order": ["todo", "in-progress", "completed"]
    }
  }
}
```

---

## Mutations

### Task Operations

### (2) Add Task
```graphql
mutation AddTask($task: TaskInput!) {
  addTask(task: $task) {
    id
    title
    description
    createdDate
  }
}
```

### Description
Create a new task and add it to the first column.

### Variables
```json
{
  "task": {
    "id": 1,
    "title": "New Task",
    "description": "Task description",
    "createdDate": "2025-11-17T10:00:00.000Z"
  }
}
```

### Response
```json
{
  "data": {
    "addTask": {
      "id": 1,
      "title": "New Task",
      "description": "Task description",
      "createdDate": "2025-11-17T10:00:00.000Z"
    }
  }
}
```

---

### (3) Edit Task
```graphql
mutation EditTask($task: TaskInput!) {
  editTask(task: $task)
}
```

### Description
Update an existing task's title or description. The server automatically sets the modifiedDate field.

### Variables
```json
{
  "task": {
    "id": 1,
    "title": "Updated Title",
    "description": "Updated description"
  }
}
```

### Response
```json
{
  "data": {
    "editTask": true
  }
}
```

---

### (4) Move Task
```graphql
mutation RelocateTask(
  $taskId: Int!
  $index: Int!
  $currCol: String!
  $destCol: String!
) {
  relocateTask(
    taskId: $taskId
    index: $index
    currCol: $currCol
    destCol: $destCol
  )
}
```

### Description
Relocate a task to a different column and position when dragged and dropped.

### Variables
```json
{
  "taskId": 1,
  "index": 0,
  "currCol": "todo",
  "destCol": "in-progress"
}
```

### Response
```json
{
  "data": {
    "relocateTask": true
  }
}
```

---

### (5) Delete Task
```graphql
mutation RemoveTask($id: Int!, $column: String!) {
  removeTask(id: $id, column: $column)
}
```

### Description
Remove a task from a column.

### Variables
```json
{
  "id": 1,
  "column": "todo"
}
```

### Response
```json
{
  "data": {
    "removeTask": true
  }
}
```

---

### Column Operations

### (6) Add Column
```graphql
mutation AddColumn($name: String!) {
  addColumn(name: $name) {
    id
    taskList {
      id
      title
    }
    columns {
      id
      taskIds
    }
    order
  }
}
```

### Description
Create a new column and add it to the board.

### Variables
```json
{
  "name": "review"
}
```

### Response
```json
{
  "data": {
    "addColumn": {
      "id": "1",
      "taskList": [...],
      "columns": [
        { "id": "todo", "taskIds": [] },
        { "id": "in-progress", "taskIds": [] },
        { "id": "completed", "taskIds": [] },
        { "id": "review", "taskIds": [] }
      ],
      "order": ["todo", "in-progress", "completed", "review"]
    }
  }
}
```

---

### (7) Delete Column
```graphql
mutation RemoveColumn($name: String!) {
  removeColumn(name: $name)
}
```

### Description
Remove a column from the board. Tasks in the deleted column are moved to the first column.

### Variables
```json
{
  "name": "review"
}
```

### Response
```json
{
  "data": {
    "removeColumn": true
  }
}
```

---

### (8) Move Column
```graphql
mutation MoveColumn($name: String!, $destIndex: Int!) {
  moveColumn(name: $name, destIndex: $destIndex)
}
```

### Description
Reorder columns by moving one to a new position.

### Variables
```json
{
  "name": "completed",
  "destIndex": 0
}
```

### Response
```json
{
  "data": {
    "moveColumn": true
  }
}
```

---

## Error Handling

GraphQL errors are returned in the errors array with the response.

### Example Error Response
```json
{
  "errors": [
    {
      "message": "Task not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["removeTask"]
    }
  ],
  "data": null
}
```

### Common Error Types
```
| Error                          | Description                     |
|--------------------------------|---------------------------------|
| GRAPHQL_VALIDATION_FAILED      | Invalid query syntax            |
| BAD_USER_INPUT                 | Invalid arguments provided      |
| NOT_FOUND                      | Resource not found              |
| INTERNAL_SERVER_ERROR          | Server error occurred           |
```
