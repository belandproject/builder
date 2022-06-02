import { getContractName } from '@beland/transactions'

export function getContractSymbol(address: string) {
  const contractName = getContractName(address)
  const symbols: Partial<Record<any, string>> = {
    '0x5cCA45303CE50Bf71B507fB80Afb951B165Bb829': 'BEAN'
  }

  const symbol = symbols[contractName]
  if (!symbol) {
    throw new Error(`Could not find a valid symbol for contract ${contractName} using address ${address}`)
  }
  return symbol
}
