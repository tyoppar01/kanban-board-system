// to be aligned with new mutations from apollo server

import { gql }  from '@apollo/client';
import client from './apolloClient';
import type { Board, Task } from '@/types/kanban.types';

const GET_BOARD = gql`
  query GetBoard {
    board {
      columns {
        id
        title
        taskIds
      }
      tasks {
        id
        content
      }
    }
  }
`;

const ADD_TASK = gql`
  mutation AddTask($columnId: ID!, $content: String!) {
    addTask(columnId: $columnId, content: $content) {
      id
      content
    }
  }
`;

const MOVE_TASK = gql`
  mutation MoveTask($taskId: ID!, $fromColumnId: ID!, $toColumnId: ID!, $index: Int!) {
    moveTask(taskId: $taskId, fromColumnId: $fromColumnId, toColumnId: $toColumnId, index: $index)
  }
`; 

const UPDATE_TASK = gql`
  mutation UpdateTask($taskId: ID!, $content: String!) {
    updateTask(taskId: $taskId, content: $content) {
      id
      content
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($taskId: ID!) {
    deleteTask(taskId: $taskId)
  }
`;  

export const boardApi = {
  async getBoard() {
    const { data } = await client.query<Board>({ query: GET_BOARD });
    if (!data) {
        throw new Error('No board data returned from server');
    }
    return data;
  }
};

export const taskApi = {
    async createTask(columnId: string, content: string) {
        const { data } = await client.mutate<Task>({
            mutation: ADD_TASK, // GraphQL mutation for adding a task
            variables: { columnId, content },
        });
        if (!data) {
            throw new Error('No task data returned from server');
        }
        return data;
    },

    async moveTask(taskId: string, fromColumnId: string, toColumnId: string, index: number) {
        // Implement the GraphQL mutation for moving a task here
        const { data } = await client.mutate<{ moveTask: boolean }>({
            mutation: MOVE_TASK,
            variables: { taskId, fromColumnId, toColumnId, index },
        });
        if (!data || !data.moveTask) {
            throw new Error('Failed to move task');
        }
        return data.moveTask; // returns true if successful
    },

    async updateTask(taskId: string, content: string) {
        const { data } = await client.mutate<Task>({
            mutation: UPDATE_TASK,
            variables: { taskId, content },
        });
        if (!data) {
            throw new Error('No task data returned from server');
        }
        return data;
    },

    async deleteTask(taskId: string) {
        const { data } = await client.mutate<{ deleteTask: boolean }>({
            mutation: DELETE_TASK,
            variables: { taskId },
        });
        if (!data || !data.deleteTask) {
            throw new Error('Failed to delete task');
        }
        return data.deleteTask; // returns true if successful
    }
}
