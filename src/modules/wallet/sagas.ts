import { all, takeEvery, put } from 'redux-saga/effects'
import { ChainId } from '@beland/schemas'
import { env } from 'decentraland-commons'
import { createWalletSaga } from '@beland/dapps/dist/modules/wallet/sagas'
import {
  CHANGE_ACCOUNT,
  CHANGE_NETWORK,
  CONNECT_WALLET_SUCCESS,
  ChangeAccountAction,
  ChangeNetworkAction,
  ConnectWalletSuccessAction
} from '@beland/dapps/dist/modules/wallet/actions'
import { fetchAuthorizationsRequest } from '@beland/dapps/dist/modules/authorization/actions'
import { Authorization } from '@beland/dapps/dist/modules/authorization/types'
import { TRANSACTIONS_API_URL } from './utils'

const baseWalletSaga = createWalletSaga({
  CHAIN_ID: env.get('REACT_APP_CHAIN_ID') || ChainId.KAI_MAINNET,
  POLL_INTERVAL: 0,
  TRANSACTIONS_API_URL
})


export function* walletSaga() {
  yield all([baseWalletSaga(), customWalletSaga()])
}

function* customWalletSaga() {
  yield takeEvery(CONNECT_WALLET_SUCCESS, handleWalletChange) 
  yield takeEvery(CHANGE_ACCOUNT, handleWalletChange)
  yield takeEvery(CHANGE_NETWORK, handleWalletChange)
}

function* handleWalletChange(_action: ConnectWalletSuccessAction | ChangeAccountAction | ChangeNetworkAction) {
  // const { wallet } = action.payload
  // const chainId = wallet.networks.KAI.chainId
  // All authorizations to be fetched must be added to the following list
  const authorizations: Authorization[] = []

  try {
    // if (env.get('REACT_APP_FF_WEARABLES')) {
    //   authorizations.push(buildManaAuthorization(wallet.address, chainId, ContractName.CollectionManager))
    // }

    // if (env.get('REACT_APP_FF_THIRD_PARTY_WEARABLES')) {
    //   authorizations.push(buildManaAuthorization(wallet.address, chainId, ContractName.ThirdPartyRegistry))
    // }

    yield put(fetchAuthorizationsRequest(authorizations))
  } catch (error) {}
}
