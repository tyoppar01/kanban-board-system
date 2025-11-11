// GraphQL client for backend communication
import client from '../graphql/apolloClient';
import { gql } from '@apollo/client';

interface BackendTask {
  id: number;
  title: string;
  description?: string;
  createdDate?: Date;
}

interface BackendBoard {
  taskList: Record<number, BackendTask>;
  columns: Record<string, number[]>;
  order: string[];
}

// GraphQL Queries and Mutations
const GET_BOARD = gql`
  query GetBoard {
    board {
      taskList {
        id
        title
        description
        createdDate
      }
      columns {
        id
        taskIds
      }
      order
    }
  }
`;

const ADD_TASK = gql`
  mutation AddTask($task: TaskInput!) {
    addTask(task: $task) {
      id
      title
      description
      createdDate
    }
  }
`;

const MOVE_TASK = gql`
  mutation RelocateTask($taskId: Int!, $index: Int!, $currCol: String!, $destCol: String!) {
    relocateTask(taskId: $taskId, index: $index, currCol: $currCol, destCol: $destCol)
  }
`;

const DELETE_TASK = gql`
  mutation RemoveTask($id: Int!, $column: String!) {
    removeTask(id: $id, column: $column) {
      id
      title
    }
  }
`;

const EDIT_TASK = gql`
  mutation EditTask($task: TaskInput!) {
    editTask(task: $task)
  }
`;

export const boardApi = {
  // Fetch the entire board using GraphQL
  async getBoard(): Promise<BackendBoard> {
    const { data } = await client.query<{ board: { taskList: any[], columns: any[], order: string[] } }>({
      query: GET_BOARD,
      fetchPolicy: 'network-only', // Always fetch fresh data
    });
    
    if (!data || !data.board) {
      throw new Error('Failed to fetch board from GraphQL');
    }

    // Transform GraphQL response to BackendBoard format
    const taskList: Record<number, BackendTask> = {};
    data.board.taskList.forEach((task: any) => {
      taskList[task.id] = {
        id: task.id,
        title: task.title,
        description: task.description,
        createdDate: task.createdDate ? new Date(task.createdDate) : undefined,
      };
    });

    const columns: Record<string, number[]> = {};
    data.board.columns.forEach((col: any) => {
      columns[col.id] = col.taskIds;
    });

    return {
      taskList,
      columns,
      order: data.board.order,
    };
  }
};

export const taskApi = {
  // Create a new task using GraphQL
  async createTask(task: BackendTask): Promise<BackendBoard> {
    
    const taskInput = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      createdDate: new Date().toISOString(),
    };
        
    const { data } = await client.mutate<{ addTask: { id: number, title: string, description?: string } }>({
      mutation: ADD_TASK,
      variables: { task: taskInput }
    });

    if (!data || !data.addTask) {
      throw new Error('Failed to create task via GraphQL');
    }
    
    // After creating task, fetch the updated board
    return await boardApi.getBoard();
  },

  // Move a task using GraphQL
  async moveTask(taskId: number, index: number, currentColumn: string, newColumn: string): Promise<BackendTask> {
    const { data } = await client.mutate<{ relocateTask: boolean }>({
      mutation: MOVE_TASK,
      variables: {
        taskId,
        index,
        currCol: currentColumn,
        destCol: newColumn,
      }
    });

    if (!data || data.relocateTask !== true) {
      throw new Error('Failed to move task via GraphQL');
    }

    // Return a placeholder task (GraphQL only returns boolean)
    return { id: taskId, title: '', description: '' };
  },
  
  // Delete a task using GraphQL
  async deleteTask(taskId: number, column: string): Promise<BackendTask> {
    const { data } = await client.mutate<{ removeTask: { id: number, title: string } }>({
      mutation: DELETE_TASK,
      variables: {
        id: taskId,
        column,
      }
    });

    if (!data || !data.removeTask) {
      throw new Error('Failed to delete task via GraphQL');
    }

    return {
      id: data.removeTask.id,
      title: data.removeTask.title,
      description: '',
    };
  },

  // Edit/Update a task using GraphQL
  async editTask(task: BackendTask): Promise<boolean> {
    const { data } = await client.mutate<{ editTask: boolean }>({
      mutation: EDIT_TASK,
      variables: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description || '',
          modifiedDate: new Date().toISOString(),
        }
      }
    });

    if (!data || data.editTask !== true) {
      throw new Error('Failed to edit task via GraphQL');
    }

    return true;
  }
};

// Export types for use in components
export type { BackendTask, BackendBoard };

