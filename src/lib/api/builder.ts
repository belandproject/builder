import { AxiosRequestConfig, AxiosError } from 'axios'
import { env } from 'decentraland-commons'
import { BaseAPI, APIParam } from '@beland/dapps/dist/lib/api'
import { runMigrations } from 'modules/migrations/utils'
import { Project, Manifest } from 'modules/project/types'
import { Asset, AssetAction, AssetParameter } from 'modules/asset/types'
import { Scene } from 'modules/scene/types'
import { FullAssetPack } from 'modules/assetPack/types'
import { dataURLToBlob, isDataUrl, objectURLToBlob } from 'modules/media/utils'
import { Item, ItemType, ItemRarity, WearableData, Rarity, ItemApprovalData } from 'modules/item/types'
import { Collection } from 'modules/collection/types'
import { Cheque, ThirdParty } from 'modules/thirdParty/types'
import { ForumPost } from 'modules/forum/types'
import { ModelMetrics } from 'modules/models/types'
import { CollectionCuration } from 'modules/curations/collectionCuration/types'
import { CurationStatus } from 'modules/curations/types'
import { Authorization } from './auth'
import { ItemCuration } from 'modules/curations/itemCuration/types'
import { IPFS_GATEWAY } from './peer'

export const BUILDER_SERVER_URL = env.get('REACT_APP_BUILDER_SERVER_URL', '')
export const HUB_SERVER_URL = env.get('REACT_APP_HUB_SERVER_URL', '')
export const CONTENT_SERVER_URL =  env.get('REACT_CONTENT_SERVER_URL', 'https://beland-builder.sgp1.digitaloceanspaces.com');

export const getContentsStorageUrl = (hash: string = '') => `${!hash ? IPFS_GATEWAY: hash.replace('ipfs://', IPFS_GATEWAY)}`
export const getAssetPackStorageUrl = (hash: string = '') => `${!hash ? IPFS_GATEWAY: hash.replace('ipfs://', IPFS_GATEWAY)}`
export const getPreviewUrl = (projectId: string) => `${BUILDER_SERVER_URL}/projects/${projectId}/media/preview.png`

export type RemoteItem = {
  id: string // uuid
  name: string
  description: string
  thumbnail: string
  owner: string
  collection_id: string | null
  blockchain_item_id: string | null
  price: string | null
  urn: string | null
  beneficiary: string | null
  rarity: ItemRarity | null
  total_supply: number | null
  is_published: boolean
  is_approved: boolean
  in_catalyst: boolean
  type: ItemType
  data: WearableData
  metrics: ModelMetrics
  contents: Record<string, string>
  content_hash: string | null
  created_at: Date
  updated_at: Date
  local_content_hash: string | null
  catalyst_content_hash: string | null
}

export type RemoteCollection = {
  id: string // uuid
  name: string
  symbol: string
  owner: string
  salt: string | null
  contract_address: string | null
  urn: string
  is_published: boolean
  is_approved: boolean
  minters: string[]
  managers: string[]
  forum_link: string | null
  locked_at: Date | null
  created_at: Date
  updated_at: Date
}

export type RemoteProject = {
  id: string
  name: string
  description: string
  thumbnail: string
  is_public: boolean
  scene?: Scene
  owner: string
  rows: number
  cols: number
  created_at: string
  updated_at: string
}

export type RemotePoolGroup = {
  id: string
  name: string
  is_active: boolean
  active_from: string
  active_until: string
}

export type RemotePool = RemoteProject & {
  groups: string[]
  parcels: number | null
  transforms: number | null
  gltf_shapes: number | null
  nft_shapes: number | null
  scripts: number | null
  entities: number | null
  likes: number
  like: boolean
}

export type RemoteAssetPack = {
  id: string
  name: string
  url?: string
  thumbnail?: string
  owner: string
  assets: RemoteAsset[]
  created_at?: string
  updated_at?: string
}

export type RemoteAsset = {
  id: string
  legacy_id: string | null
  pack_id: string
  name: string
  model: string
  script: string | null
  thumbnail: string
  tags: string[]
  category: string
  contents: Record<string, string>
  metrics: ModelMetrics
  parameters: AssetParameter[]
  actions: AssetAction[]
}

export type RemoteWeeklyStats = {
  week: string
  title: string
  base: string
  users: number
  sessions: number
  median_session_time: number
  min_session_time: number
  average_session_time: number
  max_session_time: number
  direct_users: number
  direct_sessions: number
  max_concurrent_users: number
  max_concurrent_users_time: string
}

type BaseCuration = {
  id: string
  status: CollectionCuration['status']
  created_at: Date
  updated_at: Date
}

export type RemoteCollectionCuration = {
  collection_id: string
} & BaseCuration

export type RemoteItemCuration = {
  item_id: string
  content_hash: string
} & BaseCuration

/**
 * Transforms a Project into a RemoteProject for saving purposes only.
 * The `thumbnail` is omitted.
 */
function toRemoteProject(project: Project): Omit<RemoteProject, 'thumbnail'> {
  return {
    id: project.id,
    name: project.title,
    description: project.description,
    is_public: project.isPublic,
    owner: project.ethAddress!,
    rows: project.layout.rows,
    cols: project.layout.cols,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}

function fromRemoteProject(remoteProject: RemoteProject): Project {
  return {
    id: remoteProject.id,
    title: remoteProject.name,
    description: remoteProject.description,
    thumbnail: `${CONTENT_SERVER_URL}/projects/${remoteProject.id}/${remoteProject.thumbnail}`,
    isPublic: !!remoteProject.is_public,
    sceneId: remoteProject.id,
    ethAddress: remoteProject.owner,
    layout: {
      rows: remoteProject.rows,
      cols: remoteProject.cols
    },
    createdAt: remoteProject.created_at,
    updatedAt: remoteProject.updated_at
  }
}

function toRemoteAssetPack(assetPack: FullAssetPack): RemoteAssetPack {
  return {
    id: assetPack.id,
    name: assetPack.title,
    owner: assetPack.ethAddress!,
    assets: assetPack.assets.map(asset => toRemoteAsset(asset))
  }
}

function fromRemoteAssetPack(remoteAssetPack: RemoteAssetPack): FullAssetPack {
  return {
    id: remoteAssetPack.id,
    title: remoteAssetPack.name,
    thumbnail: `${CONTENT_SERVER_URL}/asset-packs/${remoteAssetPack.id}/${remoteAssetPack.thumbnail}`,
    ethAddress: remoteAssetPack.owner,
    assets: remoteAssetPack.assets.map(asset => fromRemoteAsset(asset)),
    createdAt: remoteAssetPack.created_at,
    updatedAt: remoteAssetPack.updated_at
  }
}

function toRemoteAsset(asset: Asset): RemoteAsset {
  return {
    id: asset.id,
    legacy_id: asset.legacyId || null,
    pack_id: asset.assetPackId,
    name: asset.name,
    model: asset.model.replace(`${asset.assetPackId}/`, ''),
    script: asset.script,
    thumbnail: asset.thumbnail.replace(getContentsStorageUrl(), 'ipfs://'),
    tags: asset.tags,
    category: asset.category,
    contents: asset.contents,
    metrics: asset.metrics,
    parameters: asset.parameters,
    actions: asset.actions
  }
}

function fromRemoteAsset(remoteAsset: RemoteAsset): Asset {
  return {
    id: remoteAsset.id,
    legacyId: remoteAsset.legacy_id,
    assetPackId: remoteAsset.pack_id,
    name: remoteAsset.name,
    model: remoteAsset.model,
    script: remoteAsset.script,
    thumbnail: getContentsStorageUrl(remoteAsset.thumbnail),
    tags: remoteAsset.tags,
    category: remoteAsset.category,
    contents: remoteAsset.contents,
    metrics: remoteAsset.metrics,
    parameters: remoteAsset.parameters,
    actions: remoteAsset.actions
  }
}

// function fromPoolGroup(poolGroup: RemotePoolGroup): PoolGroup {
//   return {
//     id: poolGroup.id,
//     name: poolGroup.name,
//     isActive: poolGroup.is_active,
//     activeFrom: new Date(Date.parse(poolGroup.active_from)),
//     activeUntil: new Date(Date.parse(poolGroup.active_until))
//   }
// }

function toRemoteItem(item: Item): RemoteItem {
  const remoteItem: RemoteItem = {
    id: item.id,
    name: item.name,
    description: item.description || '',
    thumbnail: item.thumbnail,
    owner: item.owner,
    collection_id: item.collectionId || null,
    blockchain_item_id: item.tokenId || null,
    price: item.price || null,
    urn: item.urn || null,
    beneficiary: item.beneficiary || null,
    rarity: item.rarity || null,
    total_supply: item.totalSupply === undefined ? null : item.totalSupply,
    is_published: false,
    is_approved: false,
    in_catalyst: item.inCatalyst || false,
    type: item.type,
    data: item.data,
    metrics: item.metrics,
    contents: item.contents,
    content_hash: item.blockchainContentHash,
    local_content_hash: item.currentContentHash,
    catalyst_content_hash: item.catalystContentHash,
    created_at: new Date(item.createdAt),
    updated_at: new Date(item.updatedAt)
  }
  return remoteItem
}

function fromRemoteItem(remoteItem: RemoteItem) {
  const item: Item = {
    id: remoteItem.id,
    name: remoteItem.name,
    thumbnail: remoteItem.thumbnail,
    owner: remoteItem.owner,
    description: remoteItem.description,
    isPublished: remoteItem.is_published,
    isApproved: remoteItem.is_approved,
    inCatalyst: remoteItem.in_catalyst,
    type: remoteItem.type,
    data: remoteItem.data,
    contents: remoteItem.contents,
    currentContentHash: remoteItem.local_content_hash,
    blockchainContentHash: remoteItem.content_hash,
    catalystContentHash: remoteItem.catalyst_content_hash,
    metrics: remoteItem.metrics,
    createdAt: +new Date(remoteItem.created_at),
    updatedAt: +new Date(remoteItem.created_at)
  }

  if (remoteItem.collection_id) item.collectionId = remoteItem.collection_id
  if (remoteItem.blockchain_item_id !== null) item.tokenId = remoteItem.blockchain_item_id
  if (remoteItem.price) item.price = remoteItem.price
  if (remoteItem.urn) item.urn = remoteItem.urn
  if (remoteItem.beneficiary) item.beneficiary = remoteItem.beneficiary
  if (remoteItem.rarity) item.rarity = remoteItem.rarity
  if (remoteItem.total_supply !== null) item.totalSupply = remoteItem.total_supply // 0 is false

  return item
}

function toRemoteCollection(collection: Collection): RemoteCollection {
  const remoteCollection: RemoteCollection = {
    id: collection.id,
    name: collection.name,
    symbol: collection.symbol,
    owner: collection.owner,
    salt: collection.salt || null,
    contract_address: collection.contractAddress || null,
    urn: collection.urn,
    is_published: false,
    is_approved: false,
    minters: collection.minters,
    managers: collection.managers,
    forum_link: collection.forumLink || null,
    locked_at: collection.lock ? new Date(collection.lock) : null,
    created_at: new Date(collection.createdAt),
    updated_at: new Date(collection.updatedAt)
  }

  return remoteCollection
}

function fromRemoteCollection(remoteCollection: RemoteCollection) {
  const collection: Collection = {
    id: remoteCollection.id,
    name: remoteCollection.name,
    symbol: remoteCollection.symbol,
    owner: remoteCollection.owner,
    urn: remoteCollection.urn,
    isPublished: remoteCollection.is_published,
    isApproved: remoteCollection.is_approved,
    minters: remoteCollection.minters || [],
    managers: remoteCollection.managers || [],
    forumLink: remoteCollection.forum_link || undefined,
    lock: remoteCollection.locked_at ? +new Date(remoteCollection.locked_at) : undefined,
    createdAt: +new Date(remoteCollection.created_at),
    updatedAt: +new Date(remoteCollection.updated_at)
  }

  if (remoteCollection.contract_address) collection.contractAddress = remoteCollection.contract_address

  return collection
}

function getBaseCurationFields(remoteCuration: RemoteCollectionCuration | RemoteItemCuration) {
  return {
    id: remoteCuration.id,
    status: remoteCuration.status,
    createdAt: +new Date(remoteCuration.created_at),
    updatedAt: +new Date(remoteCuration.updated_at)
  }
}

function fromRemoteItemCuration(remoteCuration: RemoteItemCuration): ItemCuration {
  return {
    ...getBaseCurationFields(remoteCuration),
    itemId: remoteCuration.item_id,
    contentHash: remoteCuration.content_hash
  }
}

export type PoolDeploymentAdditionalFields = {
  groups?: string[]
}

export type Sort = {
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export type Pagination = {
  limit?: number
  offset?: number
}

export type PoolFilters = {
  owner?: string
}

// API

export class BuilderAPI extends BaseAPI {
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
    const authHeaders = this.authorization.createAuthHeaders(method, path)
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

  async deployToPool(projectId: string, additionalInfo: PoolDeploymentAdditionalFields | null = null) {
    await this.request('put', `/projects/${projectId}/pool`, additionalInfo)
  }

  async uploadMedia(
    projectId: string,
    preview: Blob,
    shots: Record<string, Blob>,
    onUploadProgress?: (progress: { loaded: number; total: number }) => void
  ) {
    const formData = new FormData()
    formData.append('preview', preview)
    formData.append('north', shots.north)
    formData.append('east', shots.east)
    formData.append('south', shots.south)
    formData.append('west', shots.west)

    await this.request('post', `/projects/${projectId}/upload`, formData, {
      onUploadProgress
    })
  }

  async fetchProjects() {
    const { rows }: { rows: RemoteProject[]; total: number } = await this.request('get', `/projects`, {limit: 1000})
    return rows.map(fromRemoteProject)
  }

  async fetchPublicProject(projectId: string) {
    const project: RemotePool = await this.request('get', `/projects/${projectId}`)
    return fromRemoteProject(project)
  }

  async fetchPoolsPage(_filters: PoolFilters & Pagination & Sort) {
    const { rows, count }: { rows: RemoteProject[]; count: number } = await this.request('get', `/projects`, {..._filters, is_public: 1})
    return { items: rows.map(fromRemoteProject), total: count }
  }

  async fetchPoolGroups(_activeOnly: boolean = false) {
    return []
  }

  async saveProject(project: Project, scene?: Scene) {
    await this.request('post', `/projects/${project.id}`, {
      ...toRemoteProject(project),
      scene: scene
    })
  }

  async saveProjectThumbnail(project: Project) {
    const blob = dataURLToBlob(project.thumbnail)
    const formData = new FormData()
    if (blob) {
      formData.append('thumbnail', blob)
      await this.request('post', `/projects/${project.id}/upload`, formData)
    }
  }

  async deleteProject(id: string) {
    await this.request('delete', `/projects/${id}`)
  }

  async fetchManifest(id: string) {
    const remoteProject = await this.request('get', `/projects/${id}`)
    const manifest = {
      version: 1,
      scene: {
        ...remoteProject.scene,
        id: remoteProject.id,
      },
      project: fromRemoteProject(remoteProject)
    } as Manifest

    return runMigrations(manifest, {})
  }

  async saveAssetPack(assetPack: FullAssetPack) {
    const remotePack = toRemoteAssetPack(assetPack)
    await this.request('post', `/asset-packs/${remotePack.id}`, remotePack)
  }

  async saveAssetContents(
    asset: Asset,
    contents: Record<string, Blob>,
    onUploadProgress?: (progress: { loaded: number; total: number }) => void
  ) {
    const formData = new FormData()

    for (let path in contents) {
      formData.append(path, contents[path])
    }

    await this.request('post', `/assetPacks/${asset.assetPackId}/assets/${asset.id}/files`, formData, {
      onUploadProgress
    })
  }

  async saveAssetPackThumbnail(assetPack: FullAssetPack) {
    let blob: Blob | null = null

    if (isDataUrl(assetPack.thumbnail)) {
      blob = dataURLToBlob(assetPack.thumbnail)
    } else {
      blob = await objectURLToBlob(assetPack.thumbnail)
    }

    if (!blob) throw new Error('Invalid thumbnail')

    const formData = new FormData()
    if (blob) {
      formData.append('thumbnail', blob)
      await this.request('post', `/asset-packs/${assetPack.id}/upload`, formData)
    }
  }

  async fetchAssetPacks(address?: string): Promise<FullAssetPack[]> {
    const promisesOfRemoteAssetPacks: Array<Promise<RemoteAssetPack[]>> = [this.request('get', '/asset-packs', { owner: 'default',limit: 1000 }).then(res => res.rows)]
    if (address) {
      promisesOfRemoteAssetPacks.push(this.request('get', '/asset-packs', { owner: address, limit: 1000 }).then(res => res.rows))
    }

    const assetPacks: RemoteAssetPack[][] = await Promise.all(promisesOfRemoteAssetPacks)
    return assetPacks.reduce((acc, curr) => acc.concat(curr), []).map(fromRemoteAssetPack)
  }

  async deleteAssetPack(assetPack: FullAssetPack) {
    await this.request('delete', `/asset-packs/${assetPack.id}`)
  }

  likePool(pool: string, like: boolean = true) {
    const method = like ? 'put' : 'delete'
    return this.request(method, `/pools/${pool}/likes`)
  }

  async fetchItems(_address?: string) {
    const remoteItems: RemoteItem[] = await this.request('get', `/items`, { limit: 1000}).then(res => res.rows)
    return remoteItems.map(fromRemoteItem)
  }

  async fetchItem(id: string) {
    const remoteItem: RemoteItem = await this.request('get', `/items/${id}`)
    return fromRemoteItem(remoteItem)
  }

  async fetchCollectionItems(collection_id: string) {
    const res: {rows: RemoteItem[]} = await this.request('get', `/items`, { collection_id, limit: 1000})
    return res.rows.map(fromRemoteItem)
  }

  saveItem = async (item: Item) => {
    await this.request('post', `/items/${item.id}`, toRemoteItem(item))
  }

  async deleteItem(id: string) {
    await this.request('delete', `/items/${id}`, {})
  }

  async fetchCollections(_address?: string) {
    const remoteCollections: RemoteCollection[] = await this.request('get', '/collections', {limit: 1000}).then(res => res.rows)
    return remoteCollections.map(fromRemoteCollection)
  }

  async fetchCollection(id: string) {
    const remoteCollection: RemoteCollection = await this.request('get', `/collections/${id}`)
    return fromRemoteCollection(remoteCollection)
  }

  async publishStandardCollection(collectionId: string) {
    const { collection, items }: { collection: RemoteCollection; items: RemoteItem[] } = await this.request(
      'post',
      `/collections/${collectionId}/sync`
    )
    return {
      collection: fromRemoteCollection(collection),
      items: items.map(fromRemoteItem)
    }
  }

  async publishTPCollection(collectionId: string, itemIds: string[], cheque: Cheque) {
    const {
      collection,
      items,
      itemCurations
    }: { collection: RemoteCollection; items: RemoteItem[]; itemCurations: RemoteItemCuration[] } = await this.request(
      'post',
      `/collections/${collectionId}/publish`,
      {
        itemIds,
        cheque
      }
    )
    return {
      collection: fromRemoteCollection(collection),
      items: items.map(fromRemoteItem),
      itemCurations: itemCurations.map(fromRemoteItemCuration)
    }
  }

  async saveCollection(collection: Collection) {
    const remoteCollection = await this.request('post', `/collections/${collection.id}`, toRemoteCollection(collection))
    return fromRemoteCollection(remoteCollection)
  }

  saveTOS = async (collection: Collection, email: string): Promise<void> => {
    await this.request('post', `/collections/${collection.id}/tos`, { email, collection_address: collection.contractAddress })
  }

  lockCollection = (collection: Collection): Promise<string> => {
    return this.request('post', `/collections/${collection.id}/lock`)
  }

  async deleteCollection(id: string) {
    await this.request('delete', `/collections/${id}`, {})
  }

  async fetchCurations(): Promise<CollectionCuration[]> {
    return []
  }

  async fetchItemCurations(_collectionId: Collection['id']): Promise<ItemCuration[]> {
    return [];
  }

  async fetchCuration(_collectionId: string): Promise<CollectionCuration | undefined> {
    return
  }

  async pushCuration(_collectionId: string): Promise<void> {
    
  }

  async pushItemCuration(itemId: string): Promise<ItemCuration> {
    const curation: RemoteItemCuration = await this.request('post', `/items/${itemId}/curation`)

    return fromRemoteItemCuration(curation)
  }

  async fetchCommittee(): Promise<string[]> {
    return [];
  }

  async createCollectionForumPost(_collection: Collection, _forumPost: ForumPost): Promise<string> {
    return ''
  }

  fetchRarities(): Promise<Rarity[]> {
    return this.request('get', '/rarities')
  }

  async fetchThirdParties(_manager?: string): Promise<ThirdParty[]> {
    var items : ThirdParty[] = [];
    return items;
  }

  fetchThirdPartyAvailableSlots(thirdPartyId: string): Promise<number> {
    return this.request('get', `/thirdParties/${thirdPartyId}/slots`)
  }

  fetchApprovalData = (collectionId: string): Promise<ItemApprovalData> => {
    return this.request('get', `/collections/${collectionId}/approvalData`)
  }

  updateCurationStatus(collectionId: string, status: CurationStatus): Promise<void> {
    return this.request('patch', `/collections/${collectionId}/curation`, { curation: { status } })
  }

  async updateItemCurationStatus(itemId: string, status: CurationStatus): Promise<ItemCuration> {
    const curation: RemoteItemCuration = await this.request('patch', `/items/${itemId}/curation`, { curation: { status } })
    return fromRemoteItemCuration(curation)
  }

  async fetchContent(hash: string) {
    const url = getContentsStorageUrl(hash)
    const resp = await fetch(url)
    if (!resp.ok) {
      const message = await resp.text()
      throw new Error(message)
    }
    const blob = await resp.blob()
    return blob
  }

  async fetchContents(contents: Record<string, string>) {
    const blobs = new Map<string, Promise<Blob>>()
    const mappings: Promise<[string, Blob]>[] = []
    for (const path in contents) {
      const hash = contents[path]
      // avoid fetching the same hash more than once
      if (!blobs.has(hash)) {
        blobs.set(hash, this.fetchContent(hash))
      }
      const blob = blobs.get(hash)!
      mappings.push(blob.then(blob => [path, blob]))
    }
    return Promise.all(mappings).then(results =>
      results.reduce<Record<string, Blob>>((obj, [path, blob]) => {
        obj[path] = blob
        return obj
      }, {})
    )
  }

  isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError
  }
}
