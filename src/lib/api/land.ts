import { AxiosRequestConfig, AxiosError } from 'axios'
import { APIParam, BaseAPI } from '@beland/dapps/dist/lib/api'
import { HUB_SERVER_URL } from './builder'
import { ethers } from 'ethers'



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
        return await this.request('get', `/parcels?owner=${ethers.utils.getAddress(_address)}&limit=1000&orderBy=updatedAt`);
    }

    fetchEstatesOwnByOwner = async (_address: string) => {
        return await this.request('get', `/estates?include=parcels&owner=${ethers.utils.getAddress(_address)}&limit=1000&orderBy=updatedAt`);
    }
}
