import React, { useEffect, useState } from 'react';
import SearchControls from '../search/SearchControls';
import { jwtDecode } from 'jwt-decode';
import './listcomments.css';
import { useFetchParentChatsAndTeachingsWithComments } from '../service/useFetchComments';

const ListComments = ({ setActiveItem, activeItem = {} }) => {
  const [addMode, setAddMode] = useState(false);
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

  const { data: fetchedData, isLoading: isLoadingComments } = useFetchParentChatsAndTeachingsWithComments(user_id);
  console.log("this is the data from list comment component ", fetchedData )

  const handleSearch = (query) => {
    const filtered = fetchedData?.comments.filter(item =>
      (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
      (item.topic && item.topic.toLowerCase().includes(query.toLowerCase())) ||
      (item.summary && item.summary.toLowerCase().includes(query.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
      (item.comment && item.comment.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const sortedItems = fetchedData?.comments?.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.updatedAt);
    const dateB = new Date(b.updatedAt || b.updatedAt);
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
          <SearchControls onSearch={handleSearch} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
      </div>
      {sortedItems?.length === 0 && <p>No teachings nor chats</p>}
      {sortedItems?.map((item) => (
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
            <p>Date: {new Date(item.updatedAt || item.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListComments;