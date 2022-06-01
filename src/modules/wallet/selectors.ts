import { Network } from '@beland/schemas'
import { getNetworks } from '@beland/dapps/dist/modules/wallet/selectors'
import { RootState } from 'modules/common/types'

export function getBeanBalanceForNetwork(state: RootState, network: Network): number {
  const networks = getNetworks(state)
  return networks && networks[network] && networks[network].bean ? networks[network].bean : 0
}
