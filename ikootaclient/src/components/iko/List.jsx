import React from 'react';
import './list.css';
import Userinfo from './Userinfo';
import Chatlist from './Chatlist';

const List = () => {
  return (
    <div className='list_container'>
        <Userinfo/>
        <Chatlist/>
    </div>
  )
}

export default List