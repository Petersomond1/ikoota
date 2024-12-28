import React from 'react'
import './towncrier.css'
import RevTopic from './RevTopic'
import RevPresentation from './RevPresentation'

const Towncrier = () => {
  return (
    <div className='towncrier_container'>
        <div className="nav">Navbar</div>
        <div className="towncrier_viewport">
       <RevTopic />
       <RevPresentation />
        </div>
        <div className="footnote">Footnote</div>
    </div>
  )
}

export default Towncrier