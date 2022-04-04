import { call, put, takeLatest, select } from 'redux-saga/effects'
import {
  LoadCollectiblesRequestAction,
  LOAD_COLLECTIBLES_REQUEST,
  loadCollectiblesSuccess,
  loadCollectiblesRequest,
  loadCollectiblesFailure
} from './actions'
import { Asset } from './types'
import { COLLECTIBLE_ASSET_PACK_ID } from 'modules/ui/sidebar/utils'
import { CONNECT_WALLET_SUCCESS } from 'decentraland-dapps/dist/modules/wallet/actions'
import { getAddress } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { TRANSPARENT_PIXEL } from 'lib/getModelData'
import { BuilderClient, NFT } from '@dcl/builder-client'
import { marketplace } from 'lib/api/marketplace'

export function* assetSaga(_client: BuilderClient) {
  yield takeLatest(LOAD_COLLECTIBLES_REQUEST, handleLoadCollectibles)
  yield takeLatest(CONNECT_WALLET_SUCCESS, handleConnectWallet)

  function* handleConnectWallet() {
    yield put(loadCollectiblesRequest())
  }

  function* handleLoadCollectibles(_: LoadCollectiblesRequestAction) {
    const address: string | null = yield select(getAddress)

    try {
      if (!address) {
        throw new Error(`Invalid address: ${address}`)
      }
      const assets: Asset[] = []
      const serverNFTs: any[] = yield call(getNFTs, address, 0)
      for (const openseaAsset of serverNFTs) {
        const uri = `ethereum://${openseaAsset.tokenAddress}/${openseaAsset.tokenId}`
        assets.push({
          assetPackId: COLLECTIBLE_ASSET_PACK_ID,
          id: uri,
          tags: [],
          category: openseaAsset.contract.name,
          contents: {},
          name: openseaAsset.name || '',
          model: uri,
          script: null,
          thumbnail: openseaAsset.image || TRANSPARENT_PIXEL,
          metrics: {
            triangles: 0,
            materials: 0,
            meshes: 0,
            bodies: 0,
            entities: 0,
            textures: 0
          },
          parameters: [],
          actions: []
        })
      }
      yield put(loadCollectiblesSuccess(assets))
    } catch (error) {
      yield put(loadCollectiblesFailure(error.message))
    }
  }

  async function getNFTs(owner: string, offset: number): Promise<NFT[]> {
    const limit = 1000
    const { rows } = await marketplace.fetchNfts({ owner, offset, limit })

    if (rows.length > 0) {
      const nextNFTs = await getNFTs(owner, offset + limit)
      return [...rows, ...nextNFTs]
    }

    return rows
  }
}
