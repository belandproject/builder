import { replace } from 'connected-react-router'
import { takeEvery, call, put, takeLatest, select, take, delay, fork, cancelled } from 'redux-saga/effects'
import { t } from '@beland/dapps/dist/modules/translation/utils'
import { closeModal } from '@beland/dapps/dist/modules/modal/actions'
import { BuilderClient, RemoteItem } from '@dcl/builder-client'
import { EntityType } from 'dcl-catalyst-commons'
import BelandNFT from '../../contracts/BelandNFT.json'

import {
  FetchItemsRequestAction,
  fetchItemsSuccess,
  fetchItemsFailure,
  FETCH_ITEMS_REQUEST,
  FetchItemRequestAction,
  fetchItemSuccess,
  fetchItemFailure,
  FETCH_ITEM_REQUEST,
  SaveItemRequestAction,
  saveItemRequest,
  saveItemSuccess,
  saveItemFailure,
  SAVE_ITEM_REQUEST,
  SAVE_ITEM_SUCCESS,
  SetPriceAndBeneficiaryRequestAction,
  setPriceAndBeneficiaryFailure,
  SET_PRICE_AND_BENEFICIARY_REQUEST,
  DeleteItemRequestAction,
  deleteItemSuccess,
  deleteItemFailure,
  DELETE_ITEM_REQUEST,
  SET_COLLECTION,
  SetCollectionAction,
  SET_ITEMS_TOKEN_ID_REQUEST,
  SET_ITEMS_TOKEN_ID_FAILURE,
  setItemsTokenIdRequest,
  setItemsTokenIdSuccess,
  setItemsTokenIdFailure,
  SetItemsTokenIdRequestAction,
  SetItemsTokenIdFailureAction,
  FETCH_COLLECTION_ITEMS_REQUEST,
  FetchCollectionItemsRequestAction,
  fetchCollectionItemsSuccess,
  fetchCollectionItemsFailure,
  fetchCollectionItemsRequest,
  fetchRaritiesSuccess,
  fetchRaritiesFailure,
  FETCH_RARITIES_REQUEST,
  FETCH_ITEMS_SUCCESS,
  DOWNLOAD_ITEM_REQUEST,
  DownloadItemRequestAction,
  downloadItemFailure,
  downloadItemSuccess,
  SaveMultipleItemsRequestAction,
  SAVE_MULTIPLE_ITEMS_REQUEST,
  saveMultipleItemsSuccess,
  CANCEL_SAVE_MULTIPLE_ITEMS,
  saveMultipleItemsCancelled,
  saveMultipleItemsFailure,
  FETCH_COLLECTION_ITEMS_SUCCESS,
  FetchItemsSuccessAction,
  FetchCollectionItemsSuccessAction,
  fetchItemsRequest,
  setPriceAndBeneficiarySuccess
} from './actions'
import { FetchCollectionRequestAction, FETCH_COLLECTION_REQUEST } from 'modules/collection/actions'
import { fromRemoteItem } from 'lib/api/transformations'
import { updateProgressSaveMultipleItems } from 'modules/ui/createMultipleItems/action'
import { isLocked} from 'modules/collection/utils'
import { locations } from 'routing/locations'
import { BuilderAPI as LegacyBuilderAPI } from 'lib/api/builder'
import { getCollection, getCollections } from 'modules/collection/selectors'
import { getItemId } from 'modules/location/selectors'
import { Collection } from 'modules/collection/types'
import { fetchEntitiesByPointersRequest } from 'modules/entity/actions'
import { takeLatestCancellable } from 'modules/common/utils'
import { downloadZip } from 'lib/zip'
import { calculateFinalSize } from './export'
import { Item, Rarity, BodyShapeType, IMAGE_PATH, THUMBNAIL_PATH } from './types'
import { getData as getItemsById, getItems, getCollectionItems, getItem } from './selectors'
import { ItemTooBigError } from './errors'
import { buildZipContents, isValidText, generateCatalystImage, MAX_FILE_SIZE } from './utils'

import { LoginSuccessAction, LOGIN_SUCCESS } from 'modules/identity/actions'
import { HubAPI } from 'lib/api/hub'
import { getChainIdByNetwork, getConnectedProvider } from '@beland/dapps/dist/lib/eth'
import { Contract, ethers } from 'ethers'
import { Network } from '@beland/schemas'

export function* itemSaga(legacyBuilder: LegacyBuilderAPI, builder: BuilderClient, hub: HubAPI) {
  yield takeEvery(FETCH_ITEMS_REQUEST, handleFetchItemsRequest)
  yield takeEvery(FETCH_ITEM_REQUEST, handleFetchItemRequest)
  yield takeEvery(FETCH_COLLECTION_ITEMS_REQUEST, handleFetchCollectionItemsRequest)
  yield takeEvery(SAVE_ITEM_REQUEST, handleSaveItemRequest)
  yield takeEvery(SAVE_ITEM_SUCCESS, handleSaveItemSuccess)
  yield takeEvery(SET_PRICE_AND_BENEFICIARY_REQUEST, handleSetPriceAndBeneficiaryRequest)
  yield takeEvery(DELETE_ITEM_REQUEST, handleDeleteItemRequest)
  yield takeLatest(LOGIN_SUCCESS, handleLoginSuccess)
  yield takeLatest(SET_COLLECTION, handleSetCollection)
  yield takeLatest(SET_ITEMS_TOKEN_ID_REQUEST, handleSetItemsTokenIdRequest)
  yield takeEvery(FETCH_COLLECTION_REQUEST, handleFetchCollectionRequest)
  yield takeEvery(SET_ITEMS_TOKEN_ID_FAILURE, handleRetrySetItemsTokenId)
  yield takeEvery(FETCH_RARITIES_REQUEST, handleFetchRaritiesRequest)
  yield takeEvery(DOWNLOAD_ITEM_REQUEST, handleDownloadItemRequest)
  yield takeLatestCancellable(
    { initializer: SAVE_MULTIPLE_ITEMS_REQUEST, cancellable: CANCEL_SAVE_MULTIPLE_ITEMS },
    handleSaveMultipleItemsRequest
  )
  yield fork(fetchItemEntities)

  function* handleFetchRaritiesRequest() {
    try {
      const rarities: Rarity[] = yield call([legacyBuilder, 'fetchRarities'])
      yield put(fetchRaritiesSuccess(rarities))
    } catch (error) {
      yield put(fetchRaritiesFailure(error.message))
    }
  }

  function* handleFetchItemsRequest(action: FetchItemsRequestAction) {
    const { address } = action.payload
    try {
      const items: Item[] = yield call([legacyBuilder, 'fetchItems'], address)
      yield put(fetchItemsSuccess(items))
    } catch (error) {
      yield put(fetchItemsFailure(error.message))
    }
  }

  function* handleFetchItemRequest(action: FetchItemRequestAction) {
    const { id } = action.payload
    try {
      const item: Item = yield call(() => legacyBuilder.fetchItem(id))
      yield put(fetchItemSuccess(id, item))
    } catch (error) {
      yield put(fetchItemFailure(id, error.message))
    }
  }

  function* handleFetchCollectionItemsRequest(action: FetchCollectionItemsRequestAction) {
    const { collectionId } = action.payload
    try {
      const items: Item[] = yield call(() => legacyBuilder.fetchCollectionItems(collectionId))
      yield put(fetchCollectionItemsSuccess(collectionId, items))
    } catch (error) {
      yield put(fetchCollectionItemsFailure(collectionId, error.message))
    }
  }

  function* handleSaveMultipleItemsRequest(action: SaveMultipleItemsRequestAction) {
    const { builtFiles } = action.payload
    const remoteItems: RemoteItem[] = []
    const fileNames: string[] = []

    // Upload files sequentially to avoid DoSing the server
    try {
      for (const [index, builtFile] of builtFiles.entries()) {
        const remoteItem: RemoteItem = yield call([builder, 'upsertItem'], builtFile.item, builtFile.newContent)
        remoteItems.push(remoteItem)
        fileNames.push(builtFile.fileName)
        yield put(updateProgressSaveMultipleItems(Math.round(((index + 1) / builtFiles.length) * 100)))
      }

      yield put(
        saveMultipleItemsSuccess(
          remoteItems.map(remoteItem => fromRemoteItem(remoteItem)),
          fileNames
        )
      )
    } catch (error) {
      yield put(
        saveMultipleItemsFailure(
          error.message,
          remoteItems.map(remoteItem => fromRemoteItem(remoteItem)),
          fileNames
        )
      )
    } finally {
      const wasCancelled: boolean = yield cancelled()
      if (wasCancelled) {
        yield put(
          saveMultipleItemsCancelled(
            remoteItems.map(remoteItem => fromRemoteItem(remoteItem)),
            fileNames
          )
        )
      }
    }
  }

  function* handleSaveItemRequest(action: SaveItemRequestAction) {
    const { item: actionItem, contents } = action.payload
    try {
      const item = { ...actionItem, updatedAt: Date.now() }
      const oldItem: Item | undefined = yield select(getItem, actionItem.id)
      const rarityChanged = oldItem && oldItem.rarity !== item.rarity

      if (!isValidText(item.name) || !isValidText(item.description)) {
        throw new Error(t('sagas.item.invalid_character'))
      }

      const collection: Collection | undefined = item.collectionId ? yield select(getCollection, item.collectionId!) : undefined

      if (collection && isLocked(collection)) {
        throw new Error(t('sagas.collection.collection_locked'))
      }

      // If there's a new thumbnail image or the item doesn't have a catalyst image, create it and add it to the item
      if (contents[THUMBNAIL_PATH] || !item.contents[IMAGE_PATH] || rarityChanged) {
        const catalystImage: { content: Blob; hash: string } = yield call(generateCatalystImage, item, {
          thumbnail: contents[THUMBNAIL_PATH]
        })
        contents[IMAGE_PATH] = catalystImage.content
        item.contents[IMAGE_PATH] = catalystImage.hash
      }

      if (Object.keys(contents).length > 0) {
        const finalSize: number = yield call(calculateFinalSize, item, contents)
        if (finalSize > MAX_FILE_SIZE) {
          throw new ItemTooBigError()
        }
      }

      for (let path in contents) {
        const res: any[] = yield call([hub, 'uploadMedia'], contents[path], path)
        item.contents[path] = res[0].hash
      }

      yield call([legacyBuilder, 'saveItem'], item)

      yield put(saveItemSuccess(item, contents))
    } catch (error) {
      yield put(saveItemFailure(actionItem, contents, error.message))
    }
  }

  function* handleSaveItemSuccess() {
    yield put(closeModal('EditItemURNModal'))
  }

  async function setItem(collection: Collection, itemId: string, price: string, beneficiary: string): Promise<string> {
    const provider = await getConnectedProvider()
    const web3 = new ethers.providers.Web3Provider(provider as any)
    const contract: Contract = new ethers.Contract(collection.contractAddress as string, BelandNFT, web3.getSigner())
    const item = await contract.items(itemId)
    item[3] = price;
    item[4] = beneficiary;
    const tx = await contract.editItems([itemId], [item])
    const reciept = await tx.wait()
    return reciept.transactionHash
  }

  function* handleSetPriceAndBeneficiaryRequest(action: SetPriceAndBeneficiaryRequestAction) {
    const { itemId, price, beneficiary } = action.payload
    try {
      const items: ReturnType<typeof getItems> = yield select(getItems)
      const item = items.find(item => item.id === itemId)
      const collections: ReturnType<typeof getCollections> = yield select(getCollections)
      const collection = collections.find(_collection => item && _collection.id === item.collectionId)

      if (!item || !collection) {
        throw new Error(yield call(t, 'sagas.item.not_found'))
      }

      if (!item.isPublished) {
        throw new Error(yield call(t, 'sagas.item.not_published'))
      }

      const newItem = { ...item, price, beneficiary, updatedAt: Date.now() }
      const txHash: string = yield setItem(collection, item.tokenId as string, price, beneficiary)
      const chainId = getChainIdByNetwork(Network.KAI)
      yield put(setPriceAndBeneficiarySuccess(newItem, chainId, txHash))
    } catch (error) {
      yield put(setPriceAndBeneficiaryFailure(itemId, price, beneficiary, error.message))
    }
  }

  function* handleDeleteItemRequest(action: DeleteItemRequestAction) {
    const { item } = action.payload
    try {
      yield call(() => legacyBuilder.deleteItem(item.id))
      yield put(deleteItemSuccess(item))
      const itemIdInUriParam: string = yield select(getItemId)
      if (itemIdInUriParam === item.id) {
        yield put(replace(locations.collections()))
      }
    } catch (error) {
      yield put(deleteItemFailure(item, error.message))
    }
  }

  function* handleLoginSuccess(action: LoginSuccessAction) {
    const { wallet } = action.payload
    yield put(fetchItemsRequest(wallet.address))
  }

  function* handleSetCollection(action: SetCollectionAction) {
    const { item, collectionId } = action.payload
    const newItem = { ...item }
    if (collectionId === null) {
      delete newItem.collectionId
    } else {
      newItem.collectionId = collectionId
    }
    yield put(saveItemRequest(newItem, {}))
    yield take(SAVE_ITEM_SUCCESS)
    yield put(closeModal('AddExistingItemModal'))
  }

  function* handleSetItemsTokenIdRequest(action: SetItemsTokenIdRequestAction) {
    const { collection, items } = action.payload

    try {
      const { items: newItems }: { items: Item[] } = yield call(() => legacyBuilder.publishStandardCollection(collection.id))
      yield put(setItemsTokenIdSuccess(newItems))
    } catch (error) {
      yield put(setItemsTokenIdFailure(collection, items, error.message))
    }
  }

  function* handleRetrySetItemsTokenId(action: SetItemsTokenIdFailureAction) {
    const { collection } = action.payload

    yield delay(5000) // wait five seconds

    // Refresh data from state
    const newCollection: Collection = yield select(state => getCollection(state, collection.id))
    const newItems: Item[] = yield select(state => getCollectionItems(state, collection.id))
    yield put(setItemsTokenIdRequest(newCollection, newItems))
  }

  function* handleFetchCollectionRequest(action: FetchCollectionRequestAction) {
    const { id } = action.payload
    yield put(fetchCollectionItemsRequest(id))
  }

  function* fetchItemEntities() {
    while (true) {
      const result: FetchItemsSuccessAction | FetchCollectionItemsSuccessAction = yield take([
        FETCH_ITEMS_SUCCESS,
        FETCH_COLLECTION_ITEMS_SUCCESS
      ])

      const { items } = result.payload
      const pointers = items.filter(item => item.isPublished).map(item => item.urn!)

      if (pointers.length > 0) {
        yield put(fetchEntitiesByPointersRequest(EntityType.WEARABLE, pointers))
      }
    }
  }

  function* handleDownloadItemRequest(action: DownloadItemRequestAction) {
    const { itemId } = action.payload

    try {
      // find item
      const items: ReturnType<typeof getItemsById> = yield select(getItemsById)
      const item = items[itemId]
      if (!item) {
        throw new Error(`Item not found for itemId="${itemId}"`)
      }

      // download blobs
      const files: Record<string, Blob> = yield call([legacyBuilder, 'fetchContents'], item.contents)

      // check if both representations are equal
      const maleHashes: string[] = []
      const femaleHashes: string[] = []
      for (const path of Object.keys(item.contents)) {
        const hash = item.contents[path]
        if (path.startsWith(BodyShapeType.MALE)) {
          maleHashes.push(hash)
        } else if (path.startsWith(BodyShapeType.FEMALE)) {
          femaleHashes.push(hash)
        }
      }
      const areRepresentationsEqual = maleHashes.length === femaleHashes.length && maleHashes.every(hash => femaleHashes.includes(hash))

      // build zip files, if both representations are equal, the /male and /female directories can be merged
      const zip: Record<string, Blob> = yield call(buildZipContents, files, areRepresentationsEqual)

      // download zip
      const name = item.name.replace(/\s/g, '_')
      yield call(downloadZip, name, zip)

      // success ????
      yield put(downloadItemSuccess(itemId))
    } catch (error) {
      yield put(downloadItemFailure(itemId, error.message))
    }
  }
}
