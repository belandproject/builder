import { ChainId } from '@beland/schemas'
import { Authorization, AuthorizationType } from '@beland/dapps/dist/modules/authorization/types'
import { ContractName } from '@beland/transactions'

const MANA_SYMBOL = '⏣'

export function addSymbol(num: string | number) {
  return num > 0 ? `${MANA_SYMBOL} ${num.toString()}` : ''
}

export function buildManaAuthorization(address: string, chainId: ChainId, _contractName: ContractName): Authorization {
  const manaContractAddress = '0xAF984E23EAA3E7967F3C5E007fbe397D8566D23d'
  const toAuthorizeContractAddress = '0xAF984E23EAA3E7967F3C5E007fbe397D8566D23d'

  return {
    type: AuthorizationType.ALLOWANCE,
    address: address,
    contractName: '' as any,
    contractAddress: manaContractAddress,
    authorizedAddress: toAuthorizeContractAddress,
    chainId
  }
}
