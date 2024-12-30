import React from 'react'
import './iko.css'
import Teaching from './Teaching'
import List from './List'
import Chat from './Chat'


const Iko = () => {
  return (
    <div className='iko_container'>
        <div className="nav">Navbar</div>
        <div className="iko_viewport">
        <Teaching /> 
          <Chat />
          <List/>
        </div>
        <div className="footnote">Footnote</div>
    </div>
  )
}

export default Iko