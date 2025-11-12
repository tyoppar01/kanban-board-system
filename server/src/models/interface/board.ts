import { ITask } from "./task";

export interface IBoard extends Document {
  id?: number;
  taskList: Record<number, ITask>;
  columns: Record<string, number[]>;
  order: string[];
}