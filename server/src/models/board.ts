import { Task } from "./task";

export interface Board {
  id?: number;
  taskList: Record<number, Task>;
  columns: Record<string, number[]>;
  order: string[];
}