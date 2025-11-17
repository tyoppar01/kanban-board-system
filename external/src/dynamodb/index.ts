import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Environment-based DynamoDB Configuration
const getDynamoConfig = () => {
  const isLocal = process.env.NODE_ENV === 'development' || process.env.DYNAMO_LOCAL === 'true';
  
  if (isLocal) {
    // Local DynamoDB configuration
    console.log('🔧 Using DynamoDB Local');
    return {
      region: 'localhost',
      endpoint: process.env.DYNAMO_ENDPOINT || 'http://localhost:8000',
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      }
    };
  } else {
    // AWS DynamoDB configuration
    console.log('☁️  Using AWS DynamoDB');
    return {
      region: process.env.AWS_REGION || 'us-east-1',
      // AWS credentials should be set via environment variables or IAM roles
      // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or IAM role
    };
  }
};

// Create DynamoDB Client with environment-based config
const client = new DynamoDBClient(getDynamoConfig());
const docClient = DynamoDBDocumentClient.from(client);

// Environment-based table names (allows different table names for different environments)
const getTableNames = () => {
  const prefix = process.env.DYNAMO_TABLE_PREFIX || '';
  const suffix = process.env.NODE_ENV === 'production' ? '_prod' : '';
  
  return {
    BOARDS: `${prefix}KanbanBoards${suffix}`,
    TASKS: `${prefix}KanbanTasks${suffix}`,
    COLUMNS: `${prefix}KanbanColumns${suffix}`
  };
};

const TABLES = getTableNames();

// Initialize DynamoDB tables
export const initializeDynamoDB = async () => {
  try {
    console.log('🔄 Initializing DynamoDB Local...');
    
    // Test connection
    await docClient.send(new ScanCommand({
      TableName: TABLES.BOARDS,
      Limit: 1
    }));
    
    console.log('✅ Connected to DynamoDB Local successfully');
    return true;
  } catch (error) {
    console.log('⚠️  DynamoDB tables may not exist yet. Please create them first.');
    console.error('Connection error:', error);
    return false;
  }
};

// Board operations
export const boardOperations = {
  // Get board with all tasks and columns
  async getBoard(boardId: string = '1') {
    try {
      const [board, tasks, columns] = await Promise.all([
        docClient.send(new GetCommand({
          TableName: TABLES.BOARDS,
          Key: { id: boardId }
        })),
        docClient.send(new ScanCommand({
          TableName: TABLES.TASKS,
          FilterExpression: 'board_id = :boardId',
          ExpressionAttributeValues: { ':boardId': boardId }
        })),
        docClient.send(new ScanCommand({
          TableName: TABLES.COLUMNS,
          FilterExpression: 'board_id = :boardId',
          ExpressionAttributeValues: { ':boardId': boardId }
        }))
      ]);

      // Transform to match your existing schema structure
      const taskList: { [key: string]: any } = {};
      tasks.Items?.forEach(task => {
        taskList[task.id] = task;
      });

      const columnsList: { [key: string]: number[] } = {};
      const columnOrder: string[] = [];
      
      columns.Items?.sort((a, b) => a.position - b.position).forEach(col => {
        columnsList[col.id] = col.task_ids || [];
        columnOrder.push(col.id);
      });

      return {
        id: boardId,
        taskList,
        columns: columnsList,
        order: columnOrder
      };
    } catch (error) {
      console.error('Error getting board:', error);
      throw error;
    }
  },

  // Create initial board setup
  async createDefaultBoard() {
    try {
      // Create board
      await docClient.send(new PutCommand({
        TableName: TABLES.BOARDS,
        Item: {
          id: '1',
          name: 'Main Kanban Board',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));

      // Create default columns
      const defaultColumns = [
        { id: 'todo', name: 'To Do', position: 0, task_ids: [] },
        { id: 'ongoing', name: 'Ongoing', position: 1, task_ids: [] },
        { id: 'completed', name: 'Completed', position: 2, task_ids: [] }
      ];

      for (const column of defaultColumns) {
        await docClient.send(new PutCommand({
          TableName: TABLES.COLUMNS,
          Item: {
            ...column,
            board_id: '1',
            created_at: new Date().toISOString()
          }
        }));
      }

      // Create sample tasks
      const sampleTasks = [
        { id: 1, title: 'Setup project structure', description: 'Initialize the kanban board project', column_id: 'todo' },
        { id: 2, title: 'Implement Express routes', description: 'Create REST API endpoints', column_id: 'todo' },
        { id: 3, title: 'Add service layer', description: 'Business logic implementation', column_id: 'ongoing' },
        { id: 4, title: 'Test API endpoints', description: 'Write unit and integration tests', column_id: 'completed' }
      ];

      for (const task of sampleTasks) {
        await docClient.send(new PutCommand({
          TableName: TABLES.TASKS,
          Item: {
            ...task,
            board_id: '1',
            created_date: new Date().toISOString(),
            modified_date: new Date().toISOString()
          }
        }));

        // Update column task_ids
        await docClient.send(new UpdateCommand({
          TableName: TABLES.COLUMNS,
          Key: { id: task.column_id },
          UpdateExpression: 'SET task_ids = list_append(if_not_exists(task_ids, :empty_list), :task_id)',
          ExpressionAttributeValues: {
            ':task_id': [task.id],
            ':empty_list': []
          }
        }));
      }

      console.log('✅ Default board created successfully');
    } catch (error) {
      console.error('Error creating default board:', error);
      throw error;
    }
  }
};

// Task operations
export const taskOperations = {
  // Add new task
  async addTask(task: { title: string; description?: string; column_id?: string }) {
    try {
      const taskId = Date.now(); // Simple ID generation
      const newTask = {
        id: taskId,
        title: task.title,
        description: task.description || '',
        board_id: '1',
        column_id: task.column_id || 'todo',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: TABLES.TASKS,
        Item: newTask
      }));

      // Update column task_ids
      await docClient.send(new UpdateCommand({
        TableName: TABLES.COLUMNS,
        Key: { id: newTask.column_id },
        UpdateExpression: 'SET task_ids = list_append(if_not_exists(task_ids, :empty_list), :task_id)',
        ExpressionAttributeValues: {
          ':task_id': [taskId],
          ':empty_list': []
        }
      }));

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  // Move task between columns
  async moveTask(taskId: number, fromColumn: string, toColumn: string, newPosition: number) {
    try {
      // Remove from old column
      const oldColumn = await docClient.send(new GetCommand({
        TableName: TABLES.COLUMNS,
        Key: { id: fromColumn }
      }));

      if (oldColumn.Item) {
        const updatedTaskIds = oldColumn.Item.task_ids.filter((id: number) => id !== taskId);
        await docClient.send(new UpdateCommand({
          TableName: TABLES.COLUMNS,
          Key: { id: fromColumn },
          UpdateExpression: 'SET task_ids = :task_ids',
          ExpressionAttributeValues: { ':task_ids': updatedTaskIds }
        }));
      }

      // Add to new column
      const newColumn = await docClient.send(new GetCommand({
        TableName: TABLES.COLUMNS,
        Key: { id: toColumn }
      }));

      if (newColumn.Item) {
        const taskIds = newColumn.Item.task_ids || [];
        taskIds.splice(newPosition, 0, taskId);
        await docClient.send(new UpdateCommand({
          TableName: TABLES.COLUMNS,
          Key: { id: toColumn },
          UpdateExpression: 'SET task_ids = :task_ids',
          ExpressionAttributeValues: { ':task_ids': taskIds }
        }));
      }

      // Update task's column_id
      await docClient.send(new UpdateCommand({
        TableName: TABLES.TASKS,
        Key: { id: taskId },
        UpdateExpression: 'SET column_id = :column_id, modified_date = :modified_date',
        ExpressionAttributeValues: {
          ':column_id': toColumn,
          ':modified_date': new Date().toISOString()
        }
      }));

      return true;
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  },

  // Delete task
  async deleteTask(taskId: number, columnId: string) {
    try {
      // Remove from tasks table
      await docClient.send(new DeleteCommand({
        TableName: TABLES.TASKS,
        Key: { id: taskId }
      }));

      // Remove from column
      const column = await docClient.send(new GetCommand({
        TableName: TABLES.COLUMNS,
        Key: { id: columnId }
      }));

      if (column.Item) {
        const updatedTaskIds = column.Item.task_ids.filter((id: number) => id !== taskId);
        await docClient.send(new UpdateCommand({
          TableName: TABLES.COLUMNS,
          Key: { id: columnId },
          UpdateExpression: 'SET task_ids = :task_ids',
          ExpressionAttributeValues: { ':task_ids': updatedTaskIds }
        }));
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};

// Column operations
export const columnOperations = {
  // Add new column
  async addColumn(name: string) {
    try {
      const columnId = name.toLowerCase().replace(/\s+/g, '_');
      
      // Get current columns to determine position
      const columns = await docClient.send(new ScanCommand({
        TableName: TABLES.COLUMNS,
        FilterExpression: 'board_id = :boardId',
        ExpressionAttributeValues: { ':boardId': '1' }
      }));

      const position = columns.Items?.length || 0;

      await docClient.send(new PutCommand({
        TableName: TABLES.COLUMNS,
        Item: {
          id: columnId,
          name: name,
          board_id: '1',
          position: position,
          task_ids: [],
          created_at: new Date().toISOString()
        }
      }));

      return { id: columnId, name, position, task_ids: [] };
    } catch (error) {
      console.error('Error adding column:', error);
      throw error;
    }
  }
};

// Export the document client for direct use
export { docClient, TABLES };

// Export connection function
export const connectDynamoDB = initializeDynamoDB;