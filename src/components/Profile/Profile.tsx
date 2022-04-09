import * as React from 'react'
import { ProfileProps } from '@beland/uikit'
import { Profile as BaseProfile } from '@beland/dapps/dist/containers'
import { isEqual } from 'lib/address'
import { LAND_POOL_ADDRESS } from 'modules/land/utils'

export default class Profile extends React.PureComponent<ProfileProps> {
  render() {
    const newProps = { ...this.props }
    if (isEqual(newProps.address, LAND_POOL_ADDRESS)) {
      newProps.isBeland = true
    }

    return <BaseProfile {...newProps} />
  }
}
