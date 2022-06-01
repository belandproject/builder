import { Dispatch } from 'redux'
import { ModalProps } from '@beland/dapps/dist/providers/ModalProvider/ModalProvider.types'
import { ThirdParty } from 'modules/thirdParty/types'
import { fetchThirdPartyItemSlotPriceRequest } from 'modules/thirdParty/actions'
import {
  buyThirdPartyItemSlotRequest,
  BuyThirdPartyItemSlotRequestAction,
  FetchThirdPartyItemSlotPriceRequestAction
} from 'modules/thirdParty/actions'

export type Props = ModalProps & {
  isBuyingItemSlots: boolean
  beanBalance: number
  isFetchingSlotPrice: boolean
  slotPrice: number | null
  metadata: BuyItemSlotsModalMetadata
  error: string | null
  onBuyItemSlots: typeof buyThirdPartyItemSlotRequest
  onFetchThirdPartyItemSlotPrice: typeof fetchThirdPartyItemSlotPriceRequest
}

export type State = {
  slotsToBuy: string
}

export type BuyItemSlotsModalMetadata = {
  thirdParty: ThirdParty
}

export type MapStateProps = Pick<Props, 'isBuyingItemSlots' | 'isFetchingSlotPrice' | 'beanBalance' | 'slotPrice' | 'error'>
export type MapDispatchProps = Pick<Props, 'onBuyItemSlots' | 'onFetchThirdPartyItemSlotPrice'>
export type MapDispatch = Dispatch<FetchThirdPartyItemSlotPriceRequestAction | BuyThirdPartyItemSlotRequestAction>
