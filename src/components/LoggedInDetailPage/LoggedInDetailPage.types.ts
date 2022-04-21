import React from 'react'
import { NavigationTab } from 'components/Navigation/Navigation.types'
import { openModal, OpenModalAction } from 'modules/modal/actions'
import { Dispatch } from 'redux'
import { CallHistoryMethodAction } from 'connected-react-router'
import { LoadPoolsRequestAction } from 'modules/pool/actions'

export type Props = {
  children: React.ReactNode
  activeTab?: NavigationTab
  className?: string
  hasNavigation?: boolean
  isPageFullscreen?: boolean
  isFooterFullscreen?: boolean
  isNavigationFullscreen?: boolean
  isLoading?: boolean
  isLoggingIn: boolean
  isLoggedIn: boolean
  onOpenModal: typeof openModal
}

export type MapStateProps = Pick<Props, 'isLoggingIn' | 'isLoggedIn'>
export type MapDispatchProps = Pick<Props, 'onOpenModal'>
export type MapDispatch = Dispatch<CallHistoryMethodAction | OpenModalAction | LoadPoolsRequestAction>
