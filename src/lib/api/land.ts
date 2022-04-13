import { AxiosRequestConfig, AxiosError } from 'axios'
import { APIParam, BaseAPI } from '@beland/dapps/dist/lib/api'
import { HUB_SERVER_URL } from './builder'



export class LandAPI extends BaseAPI {

    constructor() {
        super(HUB_SERVER_URL)
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
        headers = {
            ...headers,
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

    fetchParcelsByOwner = async (_address: string) => {
        return await this.request('get', `/parcels?owner=${_address}`);
    }

    fetchEstatesOwnByOwner = async (_address: string) => {
        return await this.request('get', `/estates?include=parcels&owner=${_address}`);
    }
}