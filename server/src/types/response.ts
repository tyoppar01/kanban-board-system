export interface ApiResponse<T extends Object> {
  success: boolean;
  message: string;
  data?: T;
}