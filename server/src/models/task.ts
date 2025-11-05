export interface Task {
  id: number;
  title: string;
  description?: string;
  createdDate?:Date;
  modifiedDate?:Date;
}