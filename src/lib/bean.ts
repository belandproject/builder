import { ChainId } from '@beland/schemas'
import { Authorization, AuthorizationType } from '@beland/dapps/dist/modules/authorization/types'
import { ContractName, getContract } from '@beland/transactions'

const BEAN_SYMBOL = 'BEAN'

export function addSymbol(num: string | number) {
  return num > 0 ? `${BEAN_SYMBOL} ${num.toString()}` : ''
}

export function buildBeanAuthorization(address: string, chainId: ChainId, contractName: ContractName): Authorization {
  const manaContractAddress = getContract(ContractName.BEAN, chainId).address
  const toAuthorizeContractAddress = getContract(contractName, chainId).address

  return {
    type: AuthorizationType.ALLOWANCE,
    address: address,
    contractName: ContractName.BEAN,
    contractAddress: manaContractAddress,
    authorizedAddress: toAuthorizeContractAddress,
    chainId
  }
}
