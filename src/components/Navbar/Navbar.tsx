import * as React from 'react'
import { Navbar as BaseNavbar } from '@beland/dapps/dist/containers'
import UserMenu from 'components/UserMenu'
import { Props } from './Navbar.types'
import './Navbar.css'
export default class Navbar extends React.PureComponent<Props> {
  render() {
    let props = this.props
    if (props.isConnected) {
      props = { ...props, rightMenu: <UserMenu /> }
    }
    return (
      <div className='be-nav-container'>
        <BaseNavbar isFullscreen activePage="builder" {...props} />
      </div>
    ) 
  }
}