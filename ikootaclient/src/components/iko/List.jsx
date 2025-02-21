import React from 'react';
import './list.css';
import Userinfo from './Userinfo';
import ListComments from './ListComments';

const List = ({ teachings = [], chats = [], comments = [], setActiveItem }) => {
  return (
    <div className='list_container' style={{border:"3px solid black"}}>
      <Userinfo />
      <ListComments teachings={teachings} chats={chats} comments={comments} setActiveItem={setActiveItem} />
    </div>
  );
};

export default List;


// import React from 'react';
// import './list.css';
// import Userinfo from './Userinfo';
// import ListComments from './ListComments';

// const List = ({ teachings, chats, comments, setActiveItem }) => {
//   return (
//     <div className='list_container'>
//       <Userinfo />
//       <ListComments teachings={teachings} chats={chats} comments={comments} setActiveItem={setActiveItem} />
//     </div>
//   );
// };

// export default List;