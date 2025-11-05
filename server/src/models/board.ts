import { Task } from "./task";

export interface Board {
  taskList: Record<number, Task>;
  columns: Record<string, number[]>;
  order: string[];
}