/**
 * This function was previously in ./urn.ts
 * Had to be moved here because of circular dependency issues
 */
export function toLegacyURN(urn: string): string {
  return urn.replace('urn:beland:off-chain:base-avatars:', 'dcl://base-avatars/')
}
