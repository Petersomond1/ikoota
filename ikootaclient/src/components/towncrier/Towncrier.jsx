<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import './towncrier.css';
import RevTopic from './RevTopic';
import RevPresentation from './RevPresentation';
import axios from 'axios';

const Towncrier = () => {
  const [topics, setTopics] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetchTopics();
    fetchPresentations();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await axios.get('/api/topics'); // Replace with actual API endpoint
      // setTopics(response.data || []);
      setTopics(Array.isArray(response.data) ? response.data : []); 
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]); // Fallback to an empty array in case of error
    }
  };

  const fetchPresentations = async () => {
    try {
      const response = await axios.get('/api/presentations'); // Replace with actual API endpoint
     /* setPresentations(response.data || []); */
      setPresentations(Array.isArray(response.data) ? response.data : []); // Ensure data is an array
    } catch (error) {
      console.error('Error fetching presentations:', error);
      setPresentations([]); // Fallback to an empty array in case of error
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
  };

  return (
    <div className="towncrier_container">
      <div className="nav">Navbar: Towncrier</div>
      <div className="towncrier_viewport">
        <RevTopic topics={topics} onSelect={handleSelectTopic} />
        <RevPresentation presentations={presentations} selectedTopic={selectedTopic} />
      </div>
      <div className="footnote">Footnote</div>
    </div>
  );
};

export default Towncrier;

// This Towncrier.jsx will fetch/receive only props of teachings from TowncrierControls.jsx,

=======
import React from 'react'
import './towncrier.css'
import RevTopic from './RevTopic'
import RevPresentation from './RevPresentation'

const Towncrier = () => {
  return (
    <div className='towncrier_container'>
        <div className="nav">Navbar: Towncrier</div>
        <div className="towncrier_viewport">
       <RevTopic />
       <RevPresentation />
        </div>
        <div className="footnote">Footnote</div>
    </div>
  )
}

export default Towncrier
>>>>>>> 563b1e17f07da08bf0db6fdc5129645eceaa3217
