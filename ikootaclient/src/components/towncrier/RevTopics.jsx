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


