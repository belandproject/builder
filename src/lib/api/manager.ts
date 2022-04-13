import { Land, LandType, RoleType } from 'modules/land/types'
import { coordsToId } from 'modules/land/utils'
import { isZero } from 'lib/address'
import { LandAPI } from './land'

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

const fromEstate = (estate: any, role: RoleType) => {
  const id = estate.id || ''
  const result: Land = {
    id,
    name: estate.name || `Estate ${id}`,
    type: LandType.ESTATE,
    role,
    description: (estate.description) || null,
    size: estate.parcels.length,
    parcels: estate.parcels.map((parcel: any) => ({
      x: parseInt(parcel.x, 10),
      y: parseInt(parcel.y, 10),
      id: coordsToId(parcel.x, parcel.y)
    })),
    owner: estate.owner,
    operators: []
  }
  return result
}
export class ManagerAPI {

  fetchLand = async (_address: string): Promise<[Land[]]> => {
    const address = _address ? _address.toLowerCase() : _address
    const landAPI = new LandAPI()
    const parcels = await landAPI.fetchParcelsByOwner(address);  
    const estates = await landAPI.fetchEstatesOwnByOwner(address); 
    const lands: Land[] = []
    if (parcels && parcels.rows && parcels.rows.length > 0) {
      parcels.rows.forEach((item: any) => {
        lands.push(fromParcel(item, RoleType.OWNER))
      });
    }
    if (estates && estates.rows && estates.rows.length > 0) {
      estates.rows.forEach((item: any) => {
        lands.push(fromEstate(item, RoleType.OWNER))
      });
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
