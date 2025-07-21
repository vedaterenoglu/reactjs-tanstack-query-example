import type { HttpClient, HttpRequestConfig, HttpResponse, HttpError } from '../interfaces/httpClient.interface'

/**
 * Fetch API adapter implementation of HttpClient interface
 * Follows Adapter Pattern to abstract HTTP implementation details
 * Enables easy switching to axios or other HTTP libraries in the future
 */
export class FetchAdapter implements HttpClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    const fullUrl = this.baseUrl + url
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })

    return `${fullUrl}?${searchParams.toString()}`
  }

  /**
   * Transform fetch response to HttpResponse format
   */
  private async transformResponse<T>(response: Response): Promise<HttpResponse<T>> {
    const data = await response.json() as T

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  }

  /**
   * Handle fetch errors and transform to HttpError format
   */
  private handleError(error: unknown, url: string): HttpError {
    if (error instanceof TypeError) {
      return {
        message: `Network error: ${error.message}`,
        code: 'NETWORK_ERROR',
        details: { url, originalError: error.message },
      }
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'FETCH_ERROR',
        details: { url, originalError: error.message },
      }
    }

    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      details: { url },
    }
  }

  /**
   * Make HTTP request using fetch API
   */
  private async makeRequest<T>(
    url: string,
    config: HttpRequestConfig = {}
  ): Promise<HttpResponse<T>> {
    try {
      const fullUrl = this.buildUrl(url, config.params)
      
      const requestInit: RequestInit = {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      }

      if (config.body) {
        requestInit.body = JSON.stringify(config.body)
      }

      const response = await fetch(fullUrl, requestInit)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await this.transformResponse<T>(response)
    } catch (error) {
      throw this.handleError(error, url)
    }
  }

  async get<T>(url: string, config?: Omit<HttpRequestConfig, 'method'>): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' })
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: Omit<HttpRequestConfig, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'POST', body: data })
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: Omit<HttpRequestConfig, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'PUT', body: data })
  }

  async delete<T>(url: string, config?: Omit<HttpRequestConfig, 'method'>): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' })
  }
}