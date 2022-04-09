import { Dispatch } from 'redux'
import { openModal, OpenModalAction } from '@beland/dapps/dist/modules/modal/actions'
import { ModalProps } from '@beland/dapps/dist/providers/ModalProvider/ModalProvider.types'
import { CreateMultipleItemsModalMetadata } from '../CreateMultipleItemsModal/CreateMultipleItemsModal.types'
import { CreateSingleItemModalMetadata } from '../CreateSingleItemModal/CreateSingleItemModal.types'

export type CreateItemsModalMetadata = CreateSingleItemModalMetadata | CreateMultipleItemsModalMetadata

export type Props = ModalProps & {
  metadata: CreateItemsModalMetadata
  onOpenModal: typeof openModal
}

export type MapDispatchProps = Pick<Props, 'onOpenModal'>
export type MapDispatch = Dispatch<OpenModalAction>
