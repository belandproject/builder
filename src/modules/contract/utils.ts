import { getContractName } from '@beland/transactions'

export function getContractSymbol(address: string) {
  const contractName = getContractName(address)
  const symbols: Partial<Record<any, string>> = {
    '0xAF984E23EAA3E7967F3C5E007fbe397D8566D23d': 'MANA'
  }

  const symbol = symbols[contractName]
  if (!symbol) {
    throw new Error(`Could not find a valid symbol for contract ${contractName} using address ${address}`)
  }
  return symbol
}
