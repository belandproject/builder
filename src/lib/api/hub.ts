import { AxiosRequestConfig, AxiosError } from 'axios'
import { APIParam, BaseAPI } from '@beland/dapps/dist/lib/api'
import { Authorization } from './auth'

export class HubAPI extends BaseAPI {
  private authorization: Authorization

  constructor(url: string, authorization: Authorization) {
    super(url)
    this.authorization = authorization
  }

  async request(method: AxiosRequestConfig['method'], path: string, params?: APIParam | null, config?: AxiosRequestConfig) {
    let authConfig = {}
    let headers = {}
    if (config) {
      authConfig = { ...config }
      if (config.headers) {
        headers = { ...config.headers }
      }
    }
    const authHeaders = this.authorization.createAuthBearerToken(method, path)
    headers = {
      ...headers,
      ...authHeaders
    }
    authConfig = { ...authConfig, headers }

    try {
      const response = await super.request(method, path, params, authConfig)
      return response
    } catch (error) {
      if (this.isAxiosError(error) && error.response) {
        error.message = error.response.data.error
      }
      throw error
    }
  }

  isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError
  }

  async uploadMedia(fileContent: Blob, filename: string, onUploadProgress?: (progress: { loaded: number; total: number }) => void) {
    const formData = new FormData()
    formData.append('file', fileContent, filename)
    return await this.request('post', `/upload`, formData, {
      onUploadProgress
    });
  }
}


