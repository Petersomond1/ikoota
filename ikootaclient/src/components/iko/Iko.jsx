import React, { useState, useEffect } from 'react';
import './iko.css';
import ListChats from './ListChats';
import List from './List';
import Chat from './Chat';
import ListComments from './ListComments';
import { useFetchChats } from '../service/useFetchChats';
import { useFetchComments } from '../service/useFetchComments';
import { useFetchTeachings } from '../service/useFetchTeachings';

const Iko = ({ isNested = false }) => {
  const { data: chats = [], isLoading: isLoadingChats, error: errorChats } = useFetchChats();
  const { data: teachings = [], isLoading: isLoadingTeachings, error: errorTeachings } = useFetchTeachings();
  const { data: comments = [], isLoading: isLoadingComments, error: errorComments } = useFetchComments();
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    if (!activeItem && chats.length > 0) {
      setActiveItem({ type: "chat", id: chats[0]?.id });
    }
  }, [chats, activeItem]);

  if (isLoadingChats || isLoadingComments || isLoadingTeachings) return <p className="status loading">Loading...</p>;
  if (errorChats || errorComments || errorTeachings) return <p className="status error">Error loading data!</p>;

  //console.log("this fetchchats", chats);
  //console.log("this fetchteachings", teachings);
  //console.log("this fetchcomments", comments);
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
        <ListChats  setActiveItem={setActiveItem} />
        <Chat activeItem={activeItem} chats={chats} teachings={teachings} />
        <List chats={chats} teachings={teachings} comments={comments} setActiveItem={setActiveItem} />
      </div>
      <div className="footnote">Footnote</div>
    </div>
  );
};

export default Iko;
