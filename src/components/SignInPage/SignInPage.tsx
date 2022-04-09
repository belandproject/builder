import React from 'react'
import Navbar from 'components/Navbar'
import { Page } from '@beland/uikit'
import { ProviderType } from '@beland/schemas'
import Footer from 'components/Footer'
import { default as SignIn } from '@beland/dapps/dist/containers/SignInPage'
import { Props } from './SignInPage.types'

export default class SignInPage extends React.PureComponent<Props> {
  handleOnConnect = (providerType: ProviderType) => {
    this.props.onConnect(providerType)
  }

  render() {
    const { isConnected } = this.props
    return (
      <>
        <Navbar isSignIn />
        <Page>
          <SignIn isConnected={isConnected} onConnect={this.handleOnConnect} />
        </Page>
        <Footer />
      </>
    )
  }
}
