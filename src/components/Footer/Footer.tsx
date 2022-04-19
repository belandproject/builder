import * as React from 'react'
import { FooterProps, Footer as BuilderFooter } from '@beland/uikit'
import './Footer.css'

export default class Footer extends React.PureComponent<FooterProps> {
  render() {
    return (
      <div className='be-footer'>
        <BuilderFooter/>
      </div>
    ) 
  }
}
