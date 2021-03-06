import * as React from 'react'
import { Loader, Page } from '@beland/uikit'
// import Ad from 'decentraland-ad/lib/Ad/Ad'

import Navbar from 'components/Navbar'
import Footer from 'components/Footer'

export default class LoadingPage extends React.PureComponent {
  render() {
    return (
      <>
        {/* <Ad slot="BUILDER_TOP_BANNER" type="full" /> */}
        <Page isFullscreen>
          <Navbar isFullscreen />
          <Loader active size="huge" />
        </Page>
        <Footer isFullscreen />
      </>
    )
  }
}
