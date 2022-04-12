import { gql } from 'apollo-boost'
import { createClient } from './graph'
import { parcelFields, estateFields, ParcelFields, Land, LandType, RoleType, EstateFields } from 'modules/land/types'
import { coordsToId } from 'modules/land/utils'
import { isZero } from 'lib/address'
import { LandAPI } from './land'

// export const LAND_MANAGER_URL = env.get('REACT_APP_LAND_MANAGER_URL', '')
export const LAND_MANAGER_URL = "https://api.thegraph.com/subgraphs/name/decentraland/land-manager"

const auth = createClient(LAND_MANAGER_URL)

const getLandQuery = () => gql`
  query Land($address: Bytes) {
    ownerParcels: parcels(first: 10, where: { estate: null }) {
      ...parcelFields
    }
    ownerEstates: estates(first: 10) {
      ...estateFields
    }
    updateOperatorParcels: parcels(first: 10) {
      ...parcelFields
    }
    updateOperatorEstates: estates(first: 10) {
      ...estateFields
    }
    ownerAuthorizations: authorizations(first: 10, where: { owner: $address, type: "UpdateManager" }) {
      operator
      isApproved
      tokenAddress
    }
    operatorAuthorizations: authorizations(first: 10, where: { operator: $address, type: "UpdateManager" }) {
      owner {
        address
        parcels(where: { estate: null }) {
          ...parcelFields
        }
        estates {
          ...estateFields
        }
      }
      isApproved
      tokenAddress
    }
  }
  ${parcelFields()}
  ${estateFields()}
`

type LandQueryResult = {
  ownerParcels: ParcelFields[]
  ownerEstates: EstateFields[]
  updateOperatorParcels: ParcelFields[]
  updateOperatorEstates: EstateFields[]
  ownerAuthorizations: { operator: string; isApproved: boolean; tokenAddress: string }[]
  operatorAuthorizations: {
    owner: { address: string; parcels: ParcelFields[]; estates: EstateFields[] }
    isApproved: boolean
    tokenAddress: string
  }[]
}

const fromParcel = (parcel: any, role: RoleType) => {
  const id = coordsToId(parcel.x, parcel.y)
  const result: Land = {
    id,
    name: parcel.name || `Parcel ${id}`,
    type: LandType.PARCEL,
    role,
    description: parcel.description || "",
    x: parseInt(parcel.x, 10),
    y: parseInt(parcel.y, 10),
    owner: parcel.owner,
    operators: []
  }
  return result
}

const fromEstate = (estate: EstateFields, role: RoleType) => {
  const id = estate.id

  const result: Land = {
    id,
    name: (estate.data && estate.data.name) || `Estate ${id}`,
    type: LandType.ESTATE,
    role,
    description: (estate.data && estate.data.description) || null,
    size: estate.size,
    parcels: estate.parcels.map(parcel => ({
      x: parseInt(parcel.x, 10),
      y: parseInt(parcel.y, 10),
      id: coordsToId(parcel.x, parcel.y)
    })),
    owner: estate.owner.address,
    operators: []
  }

  if (estate.updateOperator) {
    result.operators.push(estate.updateOperator)
  }

  return result
}
export class ManagerAPI {

  fetchLand = async (_address: string): Promise<[Land[]]> => {
    const address = _address ? _address.toLowerCase() : _address
    const landAPI = new LandAPI()
    const parcels = await landAPI.fetchParcels();  
    // const estates = await landAPI.fetchEstates(); 
    const { data } = await auth.query<LandQueryResult>({
      query: getLandQuery(),
      variables: {
        address
      }
    })
    const lands: Land[] = []
    if (parcels && parcels.rows && parcels.rows.length > 0) {
      parcels.rows.forEach((item: any) => {
        lands.push(fromParcel(item, RoleType.OWNER))
      });
    }
    for (const estate of data.ownerEstates) {
      lands.push(fromEstate(estate, RoleType.OWNER))
    }
    return [
      lands
        // remove empty estates
        .filter(land => land.type === LandType.PARCEL || land.parcels!.length > 0)
        // remove duplicated and zero address operators
        .map(land => {
          land.operators = Array.from(new Set(land.operators)).filter(address => !isZero(address))
          return land
        })
    ]
  }
}

export const manager = new ManagerAPI()
