import * as React from 'react'
import { Page, Loader } from '@beland/uikit'

import Navigation from 'components/Navigation'
import Navbar from 'components/Navbar'
import Footer from 'components/Footer'
import { Props } from './LoggedInDetailPage.types'
import SignInRequired from '../SignInRequired'
import './LoggedInDetailPage.css'

export default class LoggedInDetailPage extends React.PureComponent<Props> {
  static defaultProps = {
    className: '',
    isPageFullscreen: false,
    isFooterFullscreen: false,
    isNavigationFullscreen: false,
    hasNavigation: true,
    isLoading: false
  }

  renderLogin() {
    return <SignInRequired />
  }

  renderLoading() {
    return <Loader size="large" active />
  }

  handleOpenCreateModal = () => {
    this.props.onOpenModal('CustomLayoutModal')
  }

  render() {
    const {
      activeTab,
      className,
      hasNavigation,
      isPageFullscreen,
      isFooterFullscreen,
      isNavigationFullscreen,
      isLoggedIn,
      isLoggingIn,
      children
    } = this.props
    const isLoading = isLoggingIn || this.props.isLoading

    return (
      <>
        <Navbar isFullscreen />
        <Page className={`LoggedInDetailPage ${className}`} isFullscreen={isPageFullscreen}>
          <div className='builder-header'>
            <div className='title'>Builder</div>
          </div>
          {hasNavigation ? <Navigation activeTab={activeTab} isFullscreen={isNavigationFullscreen} /> : null}
          {isLoading ? this.renderLoading() : null}
          {!isLoggedIn && !isLoading ? this.renderLogin() : null}
          {isLoggedIn && !isLoading ? children : null}
        </Page>
        <Footer isFullscreen={isFooterFullscreen} />
      </>
    )
  }
}
