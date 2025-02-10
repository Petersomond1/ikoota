import React, { useState, useEffect } from 'react';
import SearchControls from '../search/SearchControls';
import './revtopics.css';
import api from '../service/api';

const RevTopics = ({ teachings: initialTeachings = [], onSelect }) => {

  const [teachings, setTeachings] = useState([]);
  const [filteredTeachings, setFilteredTeachings] = useState([]);

  useEffect(() => {
    const fetchTeachings = async () => {
      try {
        const response = await api.get('/teachings');
        setTeachings(response.data);
        setFilteredTeachings(response.data);
      } catch (error) {
        console.error('Error fetching teachings:', error);
      }
    };

    fetchTeachings();
  }, []);

  const handleSearch = (query) => {
    const filtered = teachings.filter(teaching =>
      teaching.topic?.toLowerCase().includes(query.toLowerCase()) ||
      teaching.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTeachings(filtered);
  };

  return (
    <div className="revtopic-container">
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="Search Icon" />
          {/* <input type="text" placeholder="Search teachings..." /> */}
          <SearchControls onSearch={handleSearch} />
        </div>
      </div>

      {filteredTeachings.length > 0 ? (
        filteredTeachings.map((teaching) => (
          <div key={teaching.id} className="topic-item" onClick={() => onSelect(teaching)}>
            <div className="texts">
              <span>Topic: {teaching.topic}</span>
              <p>Description: {teaching.description}</p>
              <p>Audience: {teaching.audience}</p>
              <p>By: {teaching.author}</p>
              <p>Date: {new Date(teaching.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No teachings available</p>
      )}
    </div>
  );
};

export default RevTopics;




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
