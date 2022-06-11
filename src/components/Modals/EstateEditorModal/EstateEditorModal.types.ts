import { Dispatch } from 'redux'
import { Coord } from '@beland/uikit'
import { ModalProps } from '@beland/dapps/dist/providers/ModalProvider/ModalProvider.types'
import { Land, LandTile } from 'modules/land/types'
import { createEstateRequest, editEstateRequest, CreateEstateRequestAction, EditEstateRequestAction } from 'modules/land/actions'
import { Authorization } from '@beland/dapps/dist/modules/authorization/types'
import { Wallet } from '@beland/dapps/dist/modules/wallet/types'

export type Props = ModalProps & {
  landTiles: Record<string, LandTile>
  metadata: EstateEditorModalMetadata
  wallet: Wallet
  authorizations: Authorization[]
  onCreateEstate: typeof createEstateRequest
  onEditEstate: typeof editEstateRequest
}

export type State = {
  selection: Coord[]
  name: string
  description: string
  showCreationForm: boolean
  isAuthModalOpen: boolean
}

export type EstateEditorModalMetadata = {
  land: Land
}

export type MapStateProps = Pick<Props, 'landTiles' | 'wallet' | 'authorizations'>
export type MapDispatchProps = Pick<Props, 'onCreateEstate' | 'onEditEstate'>
export type MapDispatch = Dispatch<CreateEstateRequestAction | EditEstateRequestAction>
export type OwnProps = {}
