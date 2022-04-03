import { Dispatch } from 'react'
import { DeleteItemRequestAction } from 'modules/item/actions'
import { Item } from 'modules/item/types'

export type Props = {
  item: Item
  onDeleteItem: () => ReturnType<Dispatch<DeleteItemRequestAction>>
}

export type MapDispatchProps = Pick<Props, 'onDeleteItem'>
export type MapDispatch = Dispatch<DeleteItemRequestAction>
export type OwnProps = Pick<Props, 'item'>
