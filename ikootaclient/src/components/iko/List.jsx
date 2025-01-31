import React from 'react';
import './list.css';
import Userinfo from './Userinfo';
import ListComments from './ListComments';

const List = ({teachings, chats, comments }) => {
  return (
    <div className='list_container'>
        <Userinfo/>
        <ListComments/>
    </div>
  )
}

export default List