import * as React from 'react'
import { Center } from '@beland/uikit'
import { t } from '@beland/dapps/dist/modules/translation/utils'

export default function NotFound() {
  return (
    <Center>
      <span className="secondary-text">{t('global.not_found')}&hellip;</span>
    </Center>
  )
}
