import React from 'react'
import './iko.css'
import List from './List'
import Chat from './Chat'
import Comments from './Comments'


const Iko = () => {
  return (
    <div className='iko_container'>
        <div className="nav">Navbar</div>
        <div className="iko_viewport">
        <Comments /> 
          <Chat />
          <List/>
        </div>
        <div className="footnote">Footnote</div>
    </div>
  )
}

export default Iko