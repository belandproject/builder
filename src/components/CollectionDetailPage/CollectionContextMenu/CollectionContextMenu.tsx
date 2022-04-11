import * as React from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Dropdown, Button, Icon, Popup } from '@beland/uikit'
import { t } from '@beland/dapps/dist/modules/translation/utils'
import { buildCollectionForumPost } from 'modules/forum/utils'
import { RoleType } from 'modules/collection/types'
import { getCollectionEditorURL, getExplorerURL, isOwner as isCollectionOwner, isLocked } from 'modules/collection/utils'
import ConfirmDelete from 'components/ConfirmDelete'
import { Props } from './CollectionContextMenu.types'
import styles from './CollectionContextMenu.module.css'

export default class CollectionContextMenu extends React.PureComponent<Props> {
  handleNavigateToForum = () => {
    const { collection } = this.props
    if (collection.isPublished && collection.forumLink) {
      this.navigateTo(collection.forumLink, '_blank')
    }
  }

  handleNavigateToExplorer = () => {
    const { collection } = this.props
    this.navigateTo(getExplorerURL(collection), '_blank')
  }

  handleNavigateToEditor = () => {
    const { collection, items, onNavigate } = this.props
    onNavigate(getCollectionEditorURL(collection, items))
  }

  handlePostToForum = () => {
    const { collection, items, name, onPostToForum } = this.props
    if (!collection.forumLink) {
      onPostToForum(collection, buildCollectionForumPost(collection, items, name))
    }
  }

  handleUpdateManagers = () => {
    const { collection, onOpenModal } = this.props
    onOpenModal('ManageCollectionRoleModal', { type: RoleType.MANAGER, collectionId: collection.id, roles: collection.managers })
  }

  handleUpdateMinters = () => {
    const { collection, onOpenModal } = this.props
    onOpenModal('ManageCollectionRoleModal', { type: RoleType.MINTER, collectionId: collection.id, roles: collection.minters })
  }

  handleAddExistingItem = () => {
    const { collection, onOpenModal } = this.props
    onOpenModal('AddExistingItemModal', { collectionId: collection.id })
  }

  handleDeleteCollection = () => {
    const { collection, onDelete } = this.props
    onDelete(collection)
  }

  navigateTo = (url: string, target: string = '') => {
    const newWindow = window.open(url, target)
    if (newWindow) {
      newWindow.focus()
    }
  }

  render() {
    const { collection, wallet } = this.props
    const isOwner = isCollectionOwner(collection, wallet.address)
    return (
      <Dropdown
        className={styles.dropdown}
        trigger={
          <Button basic>
            <Icon className={styles.ellipsis} name="ellipsis horizontal" />
          </Button>
        }
        inline
        direction="left"
      >
        <Dropdown.Menu>
          <Dropdown.Item text={t('collection_context_menu.see_in_world')} onClick={this.handleNavigateToExplorer} />
          <Dropdown.Item text={t('global.open_in_editor')} onClick={this.handleNavigateToEditor} />

          {collection.isPublished ? (
            isOwner ? (
              <>
                <Dropdown.Item text={t('collection_context_menu.minters')} onClick={this.handleUpdateMinters} />
              </>
            ) : null
          ) : !isLocked(collection) ? (
            <>
              <Dropdown.Item text={t('collection_context_menu.add_existing_item')} onClick={this.handleAddExistingItem} />
              <ConfirmDelete
                name={collection.name}
                onDelete={this.handleDeleteCollection}
                trigger={<Dropdown.Item text={t('global.delete')} />}
              />
            </>
          ) : null}

          {/* <CopyToClipboard text={collection.urn!}>
            <Dropdown.Item text={t('collection_context_menu.copy_urn')} />
          </CopyToClipboard> */}

          <Popup
            content={t('collection_context_menu.unpublished')}
            position="right center"
            disabled={collection.isPublished}
            trigger={
              <CopyToClipboard text={collection.contractAddress!}>
                <Dropdown.Item disabled={!collection.isPublished} text={t('collection_context_menu.copy_address')} />
              </CopyToClipboard>
            }
            hideOnScroll={true}
            on="hover"
            inverted
            flowing
          />
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}
