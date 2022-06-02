import { Contract, ethers } from 'ethers'
import { push, replace } from 'connected-react-router'
import { select, take, takeEvery, call, put, takeLatest, race, retry } from 'redux-saga/effects'
import { getOpenModals } from '@beland/dapps/dist/modules/modal/selectors'
import { ModalState } from '@beland/dapps/dist/modules/modal/reducer'
import { t } from '@beland/dapps/dist/modules/translation/utils'
import { getAddress } from '@beland/dapps/dist/modules/wallet/selectors'
import { getChainIdByNetwork, getConnectedProvider } from '@beland/dapps/dist/lib/eth'
import { Network } from '@beland/schemas'
import BelandNFTFactoryABI from '../../contracts/BelandNFTFactory.json'
import BelandNFTABI from '../../contracts/BelandNFT.json'

import {
  FetchCollectionsRequestAction,
  fetchCollectionsRequest,
  fetchCollectionsSuccess,
  fetchCollectionsFailure,
  FETCH_COLLECTIONS_REQUEST,
  FETCH_COLLECTIONS_SUCCESS,
  FetchCollectionRequestAction,
  fetchCollectionSuccess,
  fetchCollectionFailure,
  FETCH_COLLECTION_REQUEST,
  SaveCollectionRequestAction,
  saveCollectionSuccess,
  saveCollectionFailure,
  SAVE_COLLECTION_REQUEST,
  DeleteCollectionRequestAction,
  deleteCollectionSuccess,
  deleteCollectionFailure,
  DELETE_COLLECTION_REQUEST,
  PublishCollectionRequestAction,
  publishCollectionFailure,
  PUBLISH_COLLECTION_REQUEST,
  SetCollectionMintersRequestAction,
  setCollectionMintersFailure,
  SET_COLLECTION_MINTERS_REQUEST,
  MintCollectionItemsRequestAction,
  mintCollectionItemsFailure,
  MINT_COLLECTION_ITEMS_REQUEST,
  saveCollectionRequest,
  SAVE_COLLECTION_SUCCESS,
  SAVE_COLLECTION_FAILURE,
  SaveCollectionFailureAction,
  SaveCollectionSuccessAction,
  publishCollectionSuccess,
  setCollectionMintersSuccess,
  mintCollectionItemsSuccess
} from './actions'
import { setItemsTokenIdRequest, FETCH_ITEMS_SUCCESS, SAVE_ITEM_SUCCESS, SaveItemSuccessAction } from 'modules/item/actions'
import { isValidText, toBodyShapeType } from 'modules/item/utils'
import { locations } from 'routing/locations'
import { getCollectionId } from 'modules/location/selectors'
import { BuilderAPI } from 'lib/api/builder'
import { closeModal } from 'modules/modal/actions'
import { InitializeItem, Item, ItemRarity, RARITY_MAX_SUPPLY } from 'modules/item/types'
import { getCollectionItems, getWalletItems } from 'modules/item/selectors'
import { LoginSuccessAction, LOGIN_SUCCESS } from 'modules/identity/actions'

import { getCollection, getWalletCollections } from './selectors'
import { Collection } from './types'
import { isOwner, isLocked, UNSYNCED_COLLECTION_ERROR_PREFIX, isTPCollection } from './utils'
import { HubAPI } from 'lib/api/hub'
import { ChainId } from '@beland/schemas'
import address from 'config/constants/contracts'

export function* collectionSaga(builder: BuilderAPI, _hub: HubAPI) {
  yield takeEvery(FETCH_COLLECTIONS_REQUEST, handleFetchCollectionsRequest)
  yield takeEvery(FETCH_COLLECTION_REQUEST, handleFetchCollectionRequest)
  yield takeLatest(FETCH_COLLECTIONS_SUCCESS, handleRequestCollectionSuccess)
  yield takeEvery(SAVE_COLLECTION_REQUEST, handleSaveCollectionRequest)
  yield takeLatest(SAVE_COLLECTION_SUCCESS, handleSaveCollectionSuccess)
  yield takeLatest(SAVE_ITEM_SUCCESS, handleSaveItemSuccess)
  yield takeEvery(DELETE_COLLECTION_REQUEST, handleDeleteCollectionRequest)
  yield takeEvery(PUBLISH_COLLECTION_REQUEST, handlePublishCollectionRequest)
  yield takeEvery(SET_COLLECTION_MINTERS_REQUEST, handleSetCollectionMintersRequest)
  yield takeEvery(MINT_COLLECTION_ITEMS_REQUEST, handleMintCollectionItemsRequest)
  yield takeLatest(LOGIN_SUCCESS, handleLoginSuccess)

  function* handleFetchCollectionsRequest(action: FetchCollectionsRequestAction) {
    const { address } = action.payload
    try {
      const collections: Collection[] = yield call(() => builder.fetchCollections(address))
      yield put(fetchCollectionsSuccess(collections))
    } catch (error) {
      yield put(fetchCollectionsFailure(error.message))
    }
  }

  function* handleFetchCollectionRequest(action: FetchCollectionRequestAction) {
    const { id } = action.payload
    try {
      const collection: Collection = yield call([builder, 'fetchCollection'], id)
      yield put(fetchCollectionSuccess(id, collection))
    } catch (error) {
      yield put(fetchCollectionFailure(id, error.message))
    }
  }

  function* handleSaveCollectionSuccess(action: SaveCollectionSuccessAction) {
    const openModals: ModalState = yield select(getOpenModals)

    if (openModals['CreateCollectionModal'] || openModals['CreateThirdPartyCollectionModal']) {
      // Redirect to the newly created collection detail
      const { collection } = action.payload
      const detailPageLocation = isTPCollection(collection) ? locations.thirdPartyCollectionDetail : locations.collectionDetail
      yield put(push(detailPageLocation(collection.id)))
    }

    // Close corresponding modals
    yield put(closeModal('CreateCollectionModal'))
    yield put(closeModal('CreateThirdPartyCollectionModal'))
    yield put(closeModal('EditCollectionURNModal'))
    yield put(closeModal('EditCollectionNameModal'))
  }

  function* handleSaveItemSuccess(action: SaveItemSuccessAction) {
    const { item } = action.payload
    if (item.collectionId && !item.isPublished) {
      const collection: Collection = yield select(state => getCollection(state, item.collectionId!))
      yield put(saveCollectionRequest(collection))
    }
  }

  function* handleSaveCollectionRequest(action: SaveCollectionRequestAction) {
    const { collection } = action.payload
    try {
      if (!isValidText(collection.name)) {
        throw new Error(yield call(t, 'sagas.collection.invalid_character'))
      }
      if (isLocked(collection)) {
        throw new Error(yield call(t, 'sagas.collection.collection_locked'))
      }
      const remoteCollection: Collection = yield call([builder, 'saveCollection'], collection)
      const newCollection = { ...collection, ...remoteCollection }

      yield put(saveCollectionSuccess(newCollection))
    } catch (error) {
      yield put(saveCollectionFailure(collection, error.message))
    }
  }

  function* handleDeleteCollectionRequest(action: DeleteCollectionRequestAction) {
    const { collection } = action.payload
    try {
      yield call(() => builder.deleteCollection(collection.id))
      yield put(deleteCollectionSuccess(collection))

      const collectionIdInUriParam: string = yield select(getCollectionId)
      if (collectionIdInUriParam === collection.id) {
        yield put(replace(locations.collections()))
      }
    } catch (error) {
      yield put(deleteCollectionFailure(collection, error.message))
    }
  }

  function* handlePublishCollectionRequest(action: PublishCollectionRequestAction) {
    let { collection, items } = action.payload
    try {
      if (!isLocked(collection)) {
        // To ensure the contract address of the collection is correct, we pre-emptively save it to the server and store the response.
        // This will re-generate the address and any other data generated on the server (like the salt) before actually publishing it.
        // We skip this step if the collection is locked to avoid an error from the server while trying to save the collection
        yield put(saveCollectionRequest(collection))

        const saveCollection: {
          success: SaveCollectionSuccessAction
          failure: SaveCollectionFailureAction
        } = yield race({
          success: take(SAVE_COLLECTION_SUCCESS),
          failure: take(SAVE_COLLECTION_FAILURE)
        })

        if (saveCollection.success) {
          collection = saveCollection.success.payload.collection
        } else {
          throw new Error(saveCollection.failure.payload.error)
        }
      }

      // Check that items currently in the builder match the items the user wants to publish
      // This will solve the issue were users could add items in different tabs and not see them in the tab
      // were the publish is being made, leaving the collection in a corrupted state.
      const serverItems: Item[] = yield call([builder, 'fetchCollectionItems'], collection.id)

      if (serverItems.length !== items.length) {
        throw new Error(`${UNSYNCED_COLLECTION_ERROR_PREFIX} Different items length`)
      }

      // TODO: Deeper comparison of browser and server items. Compare metadata for example.
      serverItems.forEach(serverItem => {
        const browserItem = items.find(item => item.id === serverItem.id)

        if (!browserItem) {
          throw new Error(`${UNSYNCED_COLLECTION_ERROR_PREFIX} Item found in the server but not in the browser`)
        }
      })
      const chainId: ChainId = yield call(getChainIdByNetwork, Network.KAI)
      const txHash: string = yield createCollection(collection, items, chainId)
      const { locked_at }: { locked_at: string } = yield retry(10, 500, builder.lockCollection, collection)
      collection = { ...collection, lock: +new Date(locked_at) }
      yield put(publishCollectionSuccess(collection, items, chainId, txHash))
      yield put(replace(locations.activity()))
    } catch (error) {
      yield put(publishCollectionFailure(collection, items, error.message))
    }
  }

  async function createCollection(collection: Collection, items: Item[], chainId: ChainId) {
    const provider = await getConnectedProvider()
    const web3 = new ethers.providers.Web3Provider(provider as any)
    const contract: Contract = new ethers.Contract(address.factory[chainId], BelandNFTFactoryABI, web3.getSigner())
    const initializeItems: InitializeItem[] = []
    for (let item of items) {
      const bodyShapes = item.data.representations.map(representation => toBodyShapeType(representation.bodyShapes[0]))
      const contents = await _hub.createMetadata({
        name: item.name,
        description: item.description,
        image: item.contents[item.thumbnail],
        representations: item.data.representations.map(representation => {
          return {
            ...representation,
            contents: representation.contents.map(content => {
              return {
                path: content,
                hash: item.contents[content]
              }
            })
          }
        }),
        attributes: [
          {
            trait_type: 'type',
            value: item.data.__type.toString()
          },
          {
            trait_type: 'category',
            value: item.data.category
          },
          {
            trait_type: 'rarity',
            value: item.rarity
          },
          ...item.data.tags.map(value => ({ trait_type: 'tags', value })),
          ...item.data.hides.map(value => ({ trait_type: 'hides', value })),
          ...item.data.replaces.map(value => ({ trait_type: 'replaces', value })),
          ...bodyShapes.map(value => ({ trait_type: 'body_shapes', value }))
        ]
      })
      initializeItems.push([
        RARITY_MAX_SUPPLY[item.rarity || ItemRarity.UNIQUE],
        contents.ipfs_uri,
        item.price || '0',
        item.beneficiary || '0x'
      ])
    }
    const tx = await contract.create(collection.name, collection.symbol, initializeItems, "")
    const reciept = await tx.wait()
    return reciept.transactionHash
  }

  function* handleSetCollectionMintersRequest(action: SetCollectionMintersRequestAction) {
    const { collection, accessList } = action.payload
    try {
      //const maticChainId = getChainIdByNetwork(Network.KAI)

      const addresses: string[] = []
      const values: boolean[] = []

      const newMinters = new Set(collection.minters)

      for (const { address, hasAccess } of accessList) {
        addresses.push(address)
        values.push(hasAccess)

        if (hasAccess) {
          newMinters.add(address)
        } else {
          newMinters.delete(address)
        }
      }
      let txHash: string = ''
      for (let i = 0; i < addresses.length; i++) {
        txHash = yield setMinter(collection, addresses[i], values[i])
      }

      const chainId = getChainIdByNetwork(Network.KAI)
      yield put(setCollectionMintersSuccess(collection, Array.from(newMinters), chainId, txHash))
      yield put(replace(locations.activity()))
    } catch (error) {
      yield put(setCollectionMintersFailure(collection, accessList, error.message))
    }
  }

  async function setMinter(collection: Collection, address: string, isMinter: boolean) {
    const provider = await getConnectedProvider()
    const web3 = new ethers.providers.Web3Provider(provider as any)
    const contract: Contract = new ethers.Contract(collection.contractAddress || '0x', BelandNFTABI, web3.getSigner())
    const tx = await contract.setMinter(address, isMinter)
    const reciept = await tx.wait()
    return reciept.transactionHash
  }

  function* handleMintCollectionItemsRequest(action: MintCollectionItemsRequestAction) {
    const { collection, mints } = action.payload
    try {
      const chainId = getChainIdByNetwork(Network.KAI)

      let txHash = ''
      for (const mint of mints) {
        txHash = yield mintNFT(collection, mint.address, mint.item.tokenId!, mint.amount)
      }

      yield put(mintCollectionItemsSuccess(collection, mints, chainId, txHash))
      yield put(closeModal('MintItemsModal'))
      yield put(replace(locations.activity()))
    } catch (error) {
      yield put(mintCollectionItemsFailure(collection, mints, error.message))
    }
  }

  async function mintNFT(collection: Collection, to: string, itemId: string, amount: number) {
    const provider = await getConnectedProvider()
    const web3 = new ethers.providers.Web3Provider(provider as any)
    const contract: Contract = new ethers.Contract(collection.contractAddress || '0x', BelandNFTABI, web3.getSigner())
    const tx = await contract.batchCreate(to, Number(itemId), Number(amount))
    const reciept = await tx.wait()
    return reciept.transactionHash
  }

  function* handleLoginSuccess(action: LoginSuccessAction) {
    const { wallet } = action.payload
    yield put(fetchCollectionsRequest(wallet.address))
  }

  function* handleRequestCollectionSuccess() {
    let allItems: Item[] = yield select(getWalletItems)
    if (allItems.length === 0) {
      yield take(FETCH_ITEMS_SUCCESS)
      allItems = yield select(getWalletItems)
    }

    try {
      const collections: Collection[] = yield select(getWalletCollections)

      for (const collection of collections) {
        if (!collection.isPublished) continue
        yield finishCollectionPublishing(collection)
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Proccesses a collection that was published to the blockchain by singaling the
   * builder server that the collecton has been published, setting the item ids,
   * deploys the item entities to the Catalyst server and creates the forum post.
   *
   * @param collection - The collection to post process.
   */
  function* finishCollectionPublishing(collection: Collection) {
    const items: Item[] = yield select(state => getCollectionItems(state, collection.id))
    yield publishCollection(collection, items)
  }

  /**
   * Publishes a collection, establishing ids for the items and their blockchain ids.
   *
   * @param collection - The collection that owns the items to be set as published.
   * @param items - The items to be set as published.
   */
  function* publishCollection(collection: Collection, items: Item[]) {
    const address: string | undefined = yield select(getAddress)
    if (!isOwner(collection, address)) {
      return
    }

    if (items.some(item => !item.tokenId)) {
      yield put(setItemsTokenIdRequest(collection, items))
    }
  }
}
