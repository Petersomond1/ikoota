import React from 'react'
import './iko.css'
import ListChats from './ListChats'
import List from './List'
import Chat from './Chat'




const Iko = ({ isNested = false }) => {
  return (
    <div
      className="iko_container"
      style={{
        '--iko-width': isNested ? '100%' : '90vw',
        '--iko-height': isNested ? '100%' : '90vh',
      }}
    >
      <div className="nav">Navbar Iko Elde-nde-Me-Eden</div>
      <div className="iko_viewport">
        <ListChats />
        <Chat />
        <List />
      </div>
      <div className="footnote">Footnote</div>
    </div>
  );
};

export default Iko;




//NOTE: Iko.jsx will fetch/receive props of both teachings from TowncrierControls.jsx,
//as well as messages from IkoControls.jsx that's the primary conetent for Chat.jsx
