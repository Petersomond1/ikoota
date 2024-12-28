import React from 'react'
import './iko.css'
import List from './List'
import Chat from './Chat'
import Detail from './Detail'


const Iko = () => {
  return (
    <div className='iko_container'>
        <div className="nav">Navbar</div>
        <div className="iko_viewport">
          <List/>
          <Chat />
          <Detail />
        </div>
        <div className="footnote">Footnote</div>
    </div>
  )
}

export default Iko