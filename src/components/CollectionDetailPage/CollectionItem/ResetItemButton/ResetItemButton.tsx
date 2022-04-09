import React from 'react'
import { Dropdown } from '@beland/uikit'
import { t } from '@beland/dapps/dist/modules/translation/utils'
import { Props } from './ResetItemButton.types'

const ResetItemButton = ({ isEnabled, onClick }: Props) => {
  if (!isEnabled) {
    return null
  }

  return <Dropdown.Item text={t('collection_item.reset_item')} onClick={onClick} />
}

export default React.memo(ResetItemButton)
