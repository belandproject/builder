import { Eth } from 'web3x/eth'
import {
  CONNECT_WALLET_SUCCESS,
  CHANGE_ACCOUNT,
  ConnectWalletSuccessAction,
  ChangeAccountAction
} from '@beland/dapps/dist/modules/wallet/actions'
import { Wallet } from '@beland/dapps/dist/modules/wallet/types'
import { takeLatest, call, put, takeEvery } from 'redux-saga/effects'
import {
  FETCH_LANDS_REQUEST,
  FetchLandsRequestAction,
  fetchLandsFailure,
  fetchLandsSuccess,
  fetchLandsRequest,
  TRANSFER_LAND_REQUEST,
  TransferLandRequestAction,
  transferLandSuccess,
  transferLandFailure,
  EDIT_LAND_REQUEST,
  EditLandRequestAction,
  editLandSuccess,
  editLandFailure,
  CREATE_ESTATE_REQUEST,
  CreateEstateRequestAction,
  createEstateSuccess,
  createEstateFailure,
  EditEstateRequestAction,
  editEstateSuccess,
  editEstateFailure,
  EDIT_ESTATE_REQUEST,
  dissolveEstateSuccess,
  dissolveEstateFailure,
  DissolveEstateRequestAction,
  DISSOLVE_ESTATE_REQUEST
} from './actions'
import { manager } from 'lib/api/manager'
import { push } from 'connected-react-router'
import { locations } from 'routing/locations'
import { closeModal } from 'modules/modal/actions'
import { getWallet } from 'modules/wallet/utils'
import { buildMetadata, coordsToLandIds } from './utils'
import { Land, LandType, Authorization } from './types'
import { getConnectedProvider } from '@beland/dapps/dist/lib/eth'
import { Contract, ethers } from 'ethers'
import { ContractName, getContract } from '@beland/transactions'

export function* landSaga() {
  yield takeEvery(EDIT_ESTATE_REQUEST, handleEditEstateRequest)
  yield takeEvery(CREATE_ESTATE_REQUEST, handleCreateEstateRequest)
  yield takeEvery(EDIT_LAND_REQUEST, handleEditLandRequest)
  yield takeEvery(TRANSFER_LAND_REQUEST, handleTransferLandRequest)
  yield takeEvery(FETCH_LANDS_REQUEST, handleFetchLandRequest)
  yield takeLatest(CONNECT_WALLET_SUCCESS, handleWallet)
  yield takeLatest(CHANGE_ACCOUNT, handleWallet)
  yield takeEvery(DISSOLVE_ESTATE_REQUEST, handleDissolveEstateRequest)
}

function* handleCreateEstateRequest(action: CreateEstateRequestAction) {
  const { name, description, coords } = action.payload
  try {
    const [wallet]: [Wallet] = yield getWallet()
    const metadata = buildMetadata(name, description)
    const txHash: string = yield call(createEstate, wallet, coordsToLandIds(coords), metadata)

    yield put(createEstateSuccess(name, description, coords, wallet.chainId, txHash))
    yield put(closeModal('EstateEditorModal'))
    yield put(push(locations.activity()))
  } catch (error) {
    yield put(createEstateFailure(name, description, coords, error.message))
  }
}

async function createEstate(wallet: Wallet, landIds: number[], metadata: string) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const estateContract = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(estateContract.address, estateContract.abi, web3.getSigner())
  const tx = await contract.createBundle(landIds, metadata)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

function* handleEditEstateRequest(action: EditEstateRequestAction) {
  const { land, toAdd, toRemove } = action.payload
  try {
    const [wallet]: [Wallet] = yield getWallet()

    if (toAdd.length > 0) {
      const txHash: string = yield call(addLandIds, wallet, land.id, coordsToLandIds(toAdd))
      yield put(editEstateSuccess(land, toAdd, 'add', wallet.chainId, txHash))
    }

    if (toRemove.length > 0) {
      const txHash: string = yield call(removeLandIds, wallet, land.id, coordsToLandIds(toRemove))
      yield put(editEstateSuccess(land, toRemove, 'remove', wallet.chainId, txHash))
    }
    yield put(closeModal('EstateEditorModal'))
    yield put(push(locations.activity()))
  } catch (error) {
    yield put(editEstateFailure(land, toAdd, toRemove, error.message))
  }
}

function* handleDissolveEstateRequest(action: DissolveEstateRequestAction) {
  const { land } = action.payload

  try {
    if (land.type !== LandType.ESTATE) {
      throw new Error(`Invalid LandType: "${land.type}"`)
    }
    const [wallet]: [Wallet] = yield getWallet()
    const txHash: string = yield call(removeEstate, wallet, land.id)
    yield put(dissolveEstateSuccess(land, wallet.chainId, txHash))
    yield put(closeModal('DissolveModal'))
    yield put(push(locations.activity()))
  } catch (error) {
    yield put(dissolveEstateFailure(land, error.message))
  }
}

async function removeEstate(wallet: Wallet, estateId: string) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const estateContract = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(estateContract.address, estateContract.abi, web3.getSigner())
  const tx = await contract.removeAllItems(estateId)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

async function removeLandIds(wallet: Wallet, estateId: string, landIds: number[]) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const estateContract = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(estateContract.address, estateContract.abi, web3.getSigner())
  const tx = await contract.removeItems(estateId, landIds)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

async function addLandIds(wallet: Wallet, estateId: string, landIds: number[]) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const estateContract = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(estateContract.address, estateContract.abi, web3.getSigner())
  const tx = await contract.addItems(estateId, landIds)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

function* handleEditLandRequest(action: EditLandRequestAction) {
  const { land, name, description } = action.payload

  const metadata = buildMetadata(name, description)

  try {
    const [wallet]: [Wallet, Eth] = yield getWallet()
    switch (land.type) {
      case LandType.PARCEL: {
        const txHash: string = yield parcelUpdateMetaData(wallet, land.landId, metadata)
        yield put(editLandSuccess(land, name, description, wallet.chainId, txHash))
        break
      }
      case LandType.ESTATE: {
        const txHash: string = yield estateUpdateMetaData(wallet, land.landId, metadata)
        yield put(editLandSuccess(land, name, description, wallet.chainId, txHash))
        break
      }
      default:
        throw new Error(`Unknown Land Type: ${land.type}`)
    }
    yield put(push(locations.activity()))
  } catch (error) {
    yield put(editLandFailure(land, name, description, error.message))
  }
}

async function parcelUpdateMetaData(wallet: Wallet, landId: number | string, metadata: string) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const parcelContract = getContract(ContractName.PARCEL, wallet.chainId)
  const contract: Contract = new ethers.Contract(parcelContract.address, parcelContract.abi, web3.getSigner())
  const tx = await contract.setMetadata(landId, metadata)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

async function estateUpdateMetaData(wallet: Wallet, landId: number | string, metadata: string) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const estateContract = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(estateContract.address, estateContract.abi, web3.getSigner())
  const tx = await contract.updateMetadata(landId, metadata)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

function* handleTransferLandRequest(action: TransferLandRequestAction) {
  const { land, address } = action.payload

  try {
    const [wallet]: [Wallet, Eth] = yield getWallet()
    const from = wallet.address
    const to = address

    switch (land.type) {
      case LandType.PARCEL: {
        const txHash: string = yield estateTransfers(wallet, from, to, land.landId)
        yield put(transferLandSuccess(land, address, wallet.chainId, txHash))
        break
      }
      case LandType.ESTATE: {
        const txHash: string = yield parcelTransfers(wallet, from, to, land.landId)
        yield put(transferLandSuccess(land, address, wallet.chainId, txHash))
        break
      }
      default:
        throw new Error(`Unknown Land Type: ${land.type}`)
    }
    yield put(push(locations.activity()))
  } catch (error) {
    yield put(transferLandFailure(land, address, error.message))
  }
}

async function estateTransfers(wallet: Wallet, from: string, to: string, landId: number | string) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const estateContract = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(estateContract.address, estateContract.abi, web3.getSigner())
  const tx = await contract.transferFrom(from, to, landId)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

async function parcelTransfers(wallet: Wallet, from: string, to: string, landId: number | string) {
  const provider = await getConnectedProvider()
  const web3 = new ethers.providers.Web3Provider(provider as any)
  const parcel = getContract(ContractName.ESTATE, wallet.chainId)
  const contract: Contract = new ethers.Contract(parcel.address, parcel.abi, web3.getSigner())
  const tx = await contract.transferFrom(from, to, landId)
  const reciept = await tx.wait()
  return reciept.transactionHash
}

function* handleFetchLandRequest(action: FetchLandsRequestAction) {
  const { address } = action.payload
  try {
    const [land, authorizations]: [Land[], Authorization[]] = yield call(() => manager.fetchLand(address))
    yield put(fetchLandsSuccess(address, land, authorizations))
  } catch (error) {
    yield put(fetchLandsFailure(address, error.message))
  }
}

function* handleWallet(action: ConnectWalletSuccessAction | ChangeAccountAction) {
  const { address } = action.payload.wallet
  yield put(fetchLandsRequest(address))
}
