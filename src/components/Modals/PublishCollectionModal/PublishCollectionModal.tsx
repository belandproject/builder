import * as React from 'react'
import { ModalNavigation, Button, Form } from '@beland/uikit'
import Modal from '@beland/dapps/dist/containers/Modal'
import { t, T } from '@beland/dapps/dist/modules/translation/utils'

import { Props, State } from './PublishCollectionModal.types'
import './PublishCollectionModal.css'

export default class PublishCollectionModal extends React.PureComponent<Props, State> {

  handlePublish = () => {
    const { collection, items, onPublish } = this.props
    onPublish(collection!, items, "")
  }


  renderForm = () => {
    const { isPublishLoading, unsyncedCollectionError, onClose } = this.props
    return (
      <Form onSubmit={this.handlePublish}>
        <ModalNavigation title={t('publish_collection_modal.title_tos')} onClose={onClose} />
        <Modal.Content className="third-step">
          <div className="tos">
            <p>{t('publish_collection_modal.tos_title')}</p>
            <p>
              <T
                id="publish_collection_modal.tos_first_condition"
                values={{
                  terms_of_use: (
                    <a href="https://beland.io/terms/" rel="noopener noreferrer" target="_blank">
                      {t('publish_collection_modal.terms_of_use')}
                    </a>
                  ),
                  content_policy: (
                    <a href="https://beland.io/content/" rel="noopener noreferrer" target="_blank">
                      {t('publish_collection_modal.content_policy')}
                    </a>
                  )
                }}
              />
            </p>
            <p>{t('publish_collection_modal.tos_second_condition')}</p>
            <p>{t('publish_collection_modal.tos_third_condition')}</p>
          </div>
        </Modal.Content>
        <Modal.Actions className="third-step-footer">
          <Button primary fluid disabled={isPublishLoading || !!unsyncedCollectionError} loading={isPublishLoading}>
            {t('global.publish')}
          </Button>
          <p>{t('publish_collection_modal.accept_by_publishing')}</p>
          {unsyncedCollectionError && <p className="error">{t('publish_collection_modal.unsynced_collection')}</p>}
        </Modal.Actions>
      </Form>
    )
  }



  render() {
    const { onClose } = this.props
    return (
      <Modal className="PublishCollectionModal" size="tiny" onClose={onClose}>
        {this.renderForm()}
      </Modal>
    )
  }
}
