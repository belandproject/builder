import { env } from 'decentraland-commons'
import { BaseAPI } from 'decentraland-dapps/dist/lib/api'
import { ContentServiceScene } from 'modules/deployment/types'

export const PEER_URL = env.get('REACT_APP_HUB_URL', '')
export const IPFS_GATEWAY = env.get('IPFS_GATEWAY', '')

export const getCatalystContentUrl = (hash: string = '') => `${IPFS_GATEWAY}/${hash}`

export class PeerAPI extends BaseAPI {
  fetchScene = async (x: number, y: number) => {
    const req = await fetch(`${this.url}/v1/scenes?pointer=${x},${y}`)
    const res = await req.json()
    return res as ContentServiceScene
  }
}

export const content = new PeerAPI(PEER_URL)
