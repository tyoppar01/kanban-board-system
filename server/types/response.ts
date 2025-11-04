export interface Response<T extends Object> {
  success: boolean;
  message: string;
  data: T;
}