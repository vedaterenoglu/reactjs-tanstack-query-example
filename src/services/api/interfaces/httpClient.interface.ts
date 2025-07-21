export interface HttpRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number | boolean>
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export interface HttpError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export interface HttpClient {
  get<T>(
    url: string,
    config?: Omit<HttpRequestConfig, 'method'>
  ): Promise<HttpResponse<T>>
  post<T>(
    url: string,
    data?: unknown,
    config?: Omit<HttpRequestConfig, 'method' | 'body'>
  ): Promise<HttpResponse<T>>
  put<T>(
    url: string,
    data?: unknown,
    config?: Omit<HttpRequestConfig, 'method' | 'body'>
  ): Promise<HttpResponse<T>>
  delete<T>(
    url: string,
    config?: Omit<HttpRequestConfig, 'method'>
  ): Promise<HttpResponse<T>>
}
