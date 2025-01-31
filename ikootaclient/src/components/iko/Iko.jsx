// ikootaclient/src/components/iko/Iko.jsx
import React, { useState } from 'react';
import './iko.css';
import ListChats from './ListChats';
import List from './List';
import Chat from './Chat';
import { useFetchChats } from '../service/useFetchChats';
import { useFetchComments } from '../service/useFetchComments';
import { useFetchTeachings } from '../service/useFetchTeachings';


const Iko = ({ isNested = false }) => {
  const { data: chats, isLoading: isLoadingChats, error: errorChats } = useFetchChats();
  const { data: teachings, isLoading: isLoadingTeachings, error: errorTeachings } = useFetchTeachings();
  const { data: comments, isLoading: isLoadingComments, error: errorComments } = useFetchComments();
  const [activeItem, setActiveItem] = useState(null);

 if (isLoadingChats || isLoadingComments || isLoadingTeachings) return <p className="status loading">Loading...</p>;
  if (errorChats || errorComments || errorTeachings) return <p className="status error">Error loading data!</p>;



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
      <ListChats chats={chats} teachings={teachings} setActiveItem={setActiveItem} />
      <Chat activeItem={activeItem} chats={chats} teachings={teachings} />
      <List chats={chats} teachings={teachings} />
      </div>
      <div className="footnote">Footnote</div>
    </div>
  );
};

export default Iko;

//NOTE: Iko.jsx will fetch/receive props of both teachings from TowncrierControls.jsx,
//as well as messages from IkoControls.jsx that's the primary conetent for Chat.jsx
