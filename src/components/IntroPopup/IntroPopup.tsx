import React, { PureComponent } from 'react'
import { Button, Column, Header, Popup } from '@beland/uikit'
import { T, t } from '@beland/dapps/dist/modules/translation/utils'
import { env } from 'decentraland-commons'
import { Props, State } from './IntroPopup.types'
import './IntroPopup.css'

const POLYGON_INTRO_POPUP_LOCAL_STORAGE_KEY = 'polygon-intro-popup'

export default class IntroPopup extends PureComponent<Props, State> {
  state: State = {
    open: !localStorage.getItem(POLYGON_INTRO_POPUP_LOCAL_STORAGE_KEY)
  }

  handleDismiss = () => {
    localStorage.setItem(POLYGON_INTRO_POPUP_LOCAL_STORAGE_KEY, '1')
    this.setState({ open: false })
  }

  render() {
    const { open } = this.state
    return (
      <>
        {open ? <div className="IntroPopupOverlay" /> : null}
        <Popup
          position="top center"
          open={open}
          className="IntroPopup"
          content={
            <Column>
              <Header>{t('intro_popup.title')}</Header>
              <p className="content">
                <T
                  id="intro_popup.content"
                  values={{
                    br: (
                      <>
                        <br />
                        <br />
                      </>
                    ),
                    blog_link: (
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        {t('intro_popup.blog_link')}
                      </a>
                    ),
                    account_link: (
                      <a
                        href={env.get('REACT_APP_ACCOUNT_URL', '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('intro_popup.account_link')}
                      </a>
                    ),
                    manage_account: <b>{t('intro_popup.manage_account')}</b>
                  }}
                />
              </p>
              <Button primary size="small" onClick={this.handleDismiss}>
                {t('intro_popup.dismiss')}
              </Button>
            </Column>
          }
          trigger={<div className="IntroPopupTarget" />}
        />
      </>
    )
  }
}
