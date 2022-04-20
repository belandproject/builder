import { env } from 'decentraland-commons'
import queryString from 'query-string';

export const MARKETPLACE_URL = env.get('REACT_APP_HUB_SERVER_URL', '')

export class MarketplaceAPI {
  fetchENSList = async (address: string | undefined): Promise<string[]> => {
    if (!address) {
      return []
    }
    return []
  }
  

  fetchNfts(params: any) {
    return fetch(`${MARKETPLACE_URL}/nfts?${queryString.stringify(params)}`).then(res => res.json());
  }
}

export const marketplace = new MarketplaceAPI()
