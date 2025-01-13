import React from 'react'
import './iko.css'
import ListChats from './ListChats'
import List from './List'
import Chat from './Chat'


const Iko = () => {
  return (
    <div className='iko_container'>
        <div className="nav">Navbar Iko Elde-nde-Me-Eden</div>
        <div className="iko_viewport">
        <ListChats /> 
          <Chat />
          <List/>
        </div>
        <div className="footnote">Footnote</div>
    </div>
  )
}
 
export default Iko


//NOTE: Iko.jsx will fetch/receive props of both teachings from TowncrierControls.jsx,
//as well as messages from IkoControls.jsx that's the primary conetent for Chat.jsx