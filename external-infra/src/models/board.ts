import { ITask } from "./task";

export interface IBoard {
  id?: number;
  taskList: Record<number, ITask>;
  columns: Record<string, number[]>;
  order: string[];
}