export interface ApiRequest<T = any> {
  body: T;
  params?: Record<string, string>;
  query?: Record<string, string | undefined>;
}