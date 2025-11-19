export interface ITask {
  id: number;
  title: string;
  description?: string;
  createdDate?: Date;
  modifiedDate?: Date;
}