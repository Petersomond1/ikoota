import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import './listcomments.css';
import api from '../service/api';

const ListComments = ({ setActiveItem, activeItem = {} }) => {
    const [addMode, setAddMode] = useState(false);
    const [data, setData] = useState([]);
    const [user_id, setUserId] = useState(null);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) {
        setUserId(jwtDecode(token).user_id);
      } else {
        const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
        if (tokenCookie) {
          setUserId(jwtDecode(tokenCookie.split("=")[1]).user_id);
        } else {
          throw new Error("Access token not found");
        }
      }
    }, []);
  
    useEffect(() => {
      if (!user_id) return;
  
      const fetchData = async () => {
        try {
          const [teachingsResponse, chatsResponse, commentsResponse] = await Promise.all([
            api.get(`/teachings/user?user_id=${user_id}`),
            api.get(`/chats/user?user_id=${user_id}`),
            api.get(`/comments?user_id=${user_id}`)
          ]);
  
          console.log("teachingRes @ fetch data", teachingsResponse.data);
          console.log("chatRes @ fetch data", chatsResponse.data);
          console.log("commentRes @ fetch data", commentsResponse.data);
  
          const comments = commentsResponse.data.comments;
          const parentComments = commentsResponse.data.parentComments;
          const commentedTeachings = commentsResponse.data.teachings;
          const commentedChats = commentsResponse.data.chats;
  
          setData([
            ...teachingsResponse.data,
            ...chatsResponse.data,
            ...commentedTeachings,
            ...commentedChats,
            ...parentComments
          ]);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      fetchData();
    }, [user_id]);
  
    const sortedItems = data.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.updatedAt);
      const dateB = new Date(b.updated_at || b.updatedAt);
      return dateB - dateA;
    });
  
    const handleItemClick = (id, type) => {
      setActiveItem({ id, type });
    };
  
    return (
      <div className='listcomments_container'>
        <div className="search">
          <div className="searchbar">
            <img src="./search.png" alt="" />
            <input type="text" placeholder="Search" />
          </div>
          <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
        </div>
        {sortedItems.length === 0 && <p>No teachings nor chats</p>}
        {sortedItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className={`item ${activeItem?.id === item.id && activeItem?.type === item.type ? 'active' : ''}`}
            onClick={() => handleItemClick(item.id, item.type)}
          >
            <div className="texts">
              <span>Topic: {item.title || item.topic}</span>
              <p>Description: {item.summary || item.description}</p>
              <p>Lesson#: {item.id}</p>
              <p>Audience: {item.audience}</p>
              <p>By: {item.created_by || 'Admin'}</p>
              <p>Date: {new Date(item.updated_at || item.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default ListComments;



// import React, { useEffect, useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import { jwtDecode } from 'jwt-decode';
// import './listcomments.css';
// import api from '../service/api';



// const ListComments = ({ setActiveItem, activeItem = {} }) => {
//   const [addMode, setAddMode] = useState(false);
//   const [data, setData] = useState([]);
  
//   };

//    useEffect(() => {
//     let user_id;
//     const token = localStorage.getItem("token");
//     if (token) {
//         user_id = jwtDecode(token).user_id;
//     } else {
//         const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//         if (tokenCookie) {
//         user_id = jwtDecode(tokenCookie.split("=")[1]).user_id;
//         } else {
//         throw new Error("Access token not found");
//         }
//     }

//     if (!user_id) {
//         throw new Error("User ID not found");
//     }

//     const fetchData = async () => {

//         const teachingsResponse = await api.get(`/teachings?user_id=${user_id}`);
//         console.log("teaching response", teachingsResponse.data)
//         const chatsResponse = await api.get(`/chats?user_id=${user_id}`);
//         console.log("chat response", chatsResponse.data)
//         const commentsResponse = await api.get(`/comments?user_id=${user_id}`) 
//         setData([...teachingsResponse.data, ...chatsResponse.data])
    
//     }
//     fetchData()
// }, [data])


// console.log("here is data", data)
  

//   // Ensure filtering only happens when comments exist
//   const userComments = comments?.filter(comment => comment.user_id === user_id);
//   const commentedTeachings = teachings?.filter(teaching => userComments.some(comment => comment.teaching_id === teaching.id));
//   const commentedChats = chats?.filter(chat => userComments?.some(comment => comment.chat_id === chat.id));

//   const allItems = [
//     ...(commentedTeachings || []).map(teaching => ({ ...teaching, type: 'teaching' })),
//     ...(commentedChats || []).map(chat => ({ ...chat, type: 'chat' })),
//     ...(teachings || []).map(teaching => ({ ...teaching, type: 'teaching' })),
//     ...(chats || []).map(chat => ({ ...chat, type: 'chat' }))
//   ];

//   const sortedItems = allItems.sort((a, b) => {
//     const dateA = new Date(a.created_at || a.createdAt);
//     const dateB = new Date(b.created_at || b.createdAt);
//     return dateB - dateA;
//   });

//   const handleItemClick = (id, type) => {
//     setActiveItem({ id, type });
//   };

//   return (
//     <div className='listcomments_container'>
//       <div className="search">
//         <div className="searchbar">
//           <img src="./search.png" alt="" />
//           <input type="text" placeholder="Search" />
//         </div>
//         <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
//       </div>
//       {sortedItems.length === 0 && <p>No teachings nor chats</p>}
//       {sortedItems.map((item) => (
//         <div
//           key={`${item.type}-${item.id}`}
//           className={`item ${activeItem?.id === item.id && activeItem?.type === item.type ? 'active' : ''}`}
//           onClick={() => handleItemClick(item.id, item.type)}
//         >
//           <div className="texts">
//             <span>Topic: {item.title || item.topic}</span>
//             <p>Description: {item.summary || item.description}</p>
//             <p>Lesson#: {item.id}</p>
//             <p>Audience: {item.audience}</p>
//             <p>By: {item.created_by || 'Admin'}</p>
//             <p>Date: {new Date(item.created_at || item.createdAt).toLocaleString()}</p>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default ListComments;





// import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import {jwtDecode} from 'jwt-decode';
// import './listcomments.css';

// const fetchUserCommentsAndPosts = async () => {
//   let user_id;
//   const token = localStorage.getItem("token");

//   if (token) {
//     user_id = jwtDecode(token).user_id;
//   } else {
//     const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
//     if (tokenCookie) {
//       user_id = jwtDecode(tokenCookie.split("=")[1]).user_id;
//     } else {
//       throw new Error("Access token not found");
//     }
//   }

//   if (!user_id) {
//     throw new Error("User ID not found in localStorage");
//   }

//   const [commentsResponse, teachingsResponse, chatsResponse] = await Promise.all([
//     axios.get(`/api/comments?user_id=${user_id}`),
//     axios.get(`/api/teachings?created_by=${user_id}`),
//     axios.get(`/api/chats?created_by=${user_id}`)
//   ]);

//   return {
//     user_id,
//     comments: commentsResponse.data || [],
//     teachings: Array.isArray(teachingsResponse.data) ? teachingsResponse.data : [],
//     chats: Array.isArray(chatsResponse.data) ? chatsResponse.data : []
//   };
// };

// const ListComments = ({ setActiveItem, activeItem = {} }) => {
//   const [addMode, setAddMode] = useState(false);
//   const { data, isLoading, error } = useQuery({
//     queryKey: ['userCommentsAndPosts'],
//     queryFn: fetchUserCommentsAndPosts
//   });

//   if (isLoading) return <p>Loading comments...</p>;
//   if (error) return <p>Error fetching comments: {error.message}</p>;

//   const { comments, teachings, chats } = data;

//   const commentedTeachings = teachings.filter(teaching => comments.some(comment => comment.teaching_id === teaching.id));
//   const commentedChats = chats.filter(chat => comments.some(comment => comment.chat_id === chat.id));

//   const allItems = [
//     ...teachings.map(teaching => ({ ...teaching, type: 'teaching' })),
//     ...chats.map(chat => ({ ...chat, type: 'chat' })),
//     ...commentedTeachings.map(teaching => ({ ...teaching, type: 'teaching' })),
//     ...commentedChats.map(chat => ({ ...chat, type: 'chat' }))
//   ];

//   const sortedItems = allItems.sort((a, b) => {
//     const dateA = new Date(a.updated_at || a.updatedAt);
//     const dateB = new Date(b.updated_at || b.updatedAt);
//     return dateB - dateA;
//   });

//   const handleItemClick = (id, type) => {
//     setActiveItem({ id, type });
//   };

//   const getCommentsForItem = (itemId, itemType) => {
//     return comments.filter(comment => comment[`${itemType}_id`] === itemId);
//   };

//   return (
//     <div className='listcomments_container'>
//       <div className="search">
//         <div className="searchbar">
//           <img src="./search.png" alt="" />
//           <input type="text" placeholder="Search" />
//         </div>
//         <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
//       </div>
//       {sortedItems.length === 0 && <p>No teachings nor chats</p>}
//       {sortedItems.map((item) => (
//         <div
//           key={`${item.type}-${item.id}`}
//           className={`item ${activeItem?.id === item.id && activeItem?.type === item.type ? 'active' : ''}`}
//           onClick={() => handleItemClick(item.id, item.type)}
//         >
//           <div className="texts">
//             <span>Topic: {item.title || item.topic}</span>
//             <p>Description: {item.summary || item.description}</p>
//             <p>Lesson#: {item.id}</p>
//             <p>Audience: {item.audience}</p>
//             <p>By: {item.created_by || 'Admin'}</p>
//             <p>Date: {new Date(item.updated_at || item.updatedAt).toLocaleString()}</p>
//           </div>
//           {getCommentsForItem(item.id, item.type).length === 0 && <p>No comments</p>}
//           {getCommentsForItem(item.id, item.type).map((comment) => (
//             <div key={comment.id} className="item">
//               <img src="./avatar.png" alt="" />
//               <div className="texts">
//                 <span>{comment.author}</span>
//                 <p>{comment.comment}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default ListComments;