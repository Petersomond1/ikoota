import React from 'react';
import './revtopic.css';

const RevTopic = ({ topics = [], onSelect }) => {
  const [addMode, setAddMode] = React.useState(false);

  return (
    <div className="revtopic-container">
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="Search Icon" />
          <input type="text" placeholder="Search" />
        </div>
        <img
          src={addMode ? './minus.png' : './plus.png'}
          alt="Toggle Add Mode"
          className="add"
          onClick={() => setAddMode(!addMode)}
        />
      </div>

      {topics.length > 0 ? (
        topics.map((topic) => (
          <div key={topic.id} className="topic-item">
            <div className="texts" onClick={() => onSelect(topic)}>
              <span>Topic: {topic.title}</span>
              <p>Description: {topic.description}</p>
              <p>Audience: {topic.audience}</p>
              <p>By: {topic.author}</p>
              <p>Date: {new Date(topic.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No topics available</p>
      )}
    </div>
  );
};

export default RevTopic;



//  import React from 'react';
// import './revtopic.css';

 
//  const RevTopic = ({ topics, onSelect }) => {
//     const [addMode, setAddMode] = React.useState(false);
//     return (
//       <div className="revtopic-container">
//          <div className="search">
//                <div className="searchbar">
//                    <img src="./search.png" alt="" />
//                    <input type="text" placeholder="Search" />
//                </div>
//        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
//            </div>
//         {topics?.map((topic) => (
//           <div key={topic.id} className="topic-item">
//             <div className="texts" onClick={() => onSelect(topic)}>
//               <span>Topic: {topic.title}</span>
//               <p>Description: {topic.description}</p>
//               <p>Audience: {topic.audience}</p>
//                 <p>By: {topic.author}</p>
//                 <p>Date: {new Date(topic.createdAt).toLocaleString()}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }
//   export default RevTopic

  





// import React, { useState } from 'react'
// import './revtopic.css'


// const RevTopic = () => {
//    const [addMode, setAddMode] = useState(false)
//     return (
//       <div className='revtopic_container'>
//           <div className="search">
//               <div className="searchbar">
//                   <img src="./search.png" alt="" />
//                   <input type="text" placeholder="Search" />
//               </div>
//       <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>Audience: General</p>
//                   <p>By: Admin</p>
//                    <p>Date: 1hr 30min ago</p>
//                    </div>
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>Audience: General</p>
//                   <p>By: Admin</p>
//                    <p>1hr 30min ago</p>
//                    </div>
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>By: Admin</p>
//                    <p>1hr 30min ago</p>
//                    </div>
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>By: Admin</p>
//                    <p>1hr 30min ago</p>
//                    </div>
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>By: Admin</p>
//                    <p>1hr 30min ago</p>
//                    </div>
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>By: Admin</p>
//                    <p>1hr 30min ago</p>
//                    </div>
//           </div>
//           <div className="item">
//               <div className="texts">
//                   <span>Topic: Greeting</span>
//                   <p>Description: Lorem, ipsum dolor sit
//                      amet consectetur adipisicing elit.
//                   </p>
//                   <p>Leasson#: 100001</p>
//                   <p>Subject Matter: Eden</p>
//                   <p>By: Admin</p>
//                    <p>1hr 30min ago</p>
//                    </div>
//           </div>
//        </div>
//     )
//   }
  
// export default RevTopic
