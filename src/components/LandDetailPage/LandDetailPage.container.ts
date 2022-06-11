import { connect } from 'react-redux'
import { push, replace } from 'connected-react-router'
import { RootState } from 'modules/common/types'
import { getLandId } from 'modules/location/selectors'
import { openModal } from 'modules/modal/actions'
import { getParcelsAvailableToBuildEstates, getDeploymentsByCoord, getLandTiles } from 'modules/land/selectors'
import { getENSForLand } from 'modules/ens/selectors'
import { getData as getProjects } from 'modules/project/selectors'
import { MapStateProps, MapDispatchProps, MapDispatch } from './LandDetailPage.types'
import LandDetailPage from './LandDetailPage'
import { getData as getWallet } from '@beland/dapps/dist/modules/wallet/selectors'
import { getData as getAuthorizations } from '@beland/dapps/dist/modules/authorization/selectors'

const mapState = (state: RootState): MapStateProps => {
  const landId = getLandId(state) || ''
  return {
    ensList: getENSForLand(state, landId),
    parcelsAvailableToBuildEstates: getParcelsAvailableToBuildEstates(state),
    deploymentsByCoord: getDeploymentsByCoord(state),
    landTiles: getLandTiles(state),
    projects: getProjects(state),
    authorizations: getAuthorizations(state),
    wallet: getWallet(state)!,
  }
}

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onNavigate: path => dispatch(push(path)),
  onReplace: path => dispatch(replace(path)),
  onOpenModal: (name, metadata) => dispatch(openModal(name, metadata))
})

export default connect(mapState, mapDispatch)(LandDetailPage)
