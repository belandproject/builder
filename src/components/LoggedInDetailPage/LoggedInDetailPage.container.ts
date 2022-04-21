import { connect } from 'react-redux'
import { RootState } from 'modules/common/types'
import { isLoggedIn, isLoggingIn } from 'modules/identity/selectors'
import { MapDispatch, MapDispatchProps, MapStateProps } from './LoggedInDetailPage.types'
import LoggedInDetailPage from './LoggedInDetailPage'
import { openModal } from 'modules/modal/actions'

const mapState = (state: RootState): MapStateProps => ({
  isLoggingIn: isLoggingIn(state),
  isLoggedIn: isLoggedIn(state)
})

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onOpenModal: (name, metadata) => dispatch(openModal(name, metadata))
})

export default connect(mapState, mapDispatch)(LoggedInDetailPage)
