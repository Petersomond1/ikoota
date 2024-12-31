import React, { useState } from 'react';
import './revtopic.css';

const RevTopic = () => {
  const [addMode, setAddMode] = useState(false)
  const [activeItem, setActiveItem] = useState(null);

  const handleMouseEnter = (index) => {
   setActiveItem(index);
  };

  const handleMouseLeave = () => {
   setActiveItem(null);
  };

  return (
   <div className='revtopic_container'>
    <div className="search">
      <div className="searchbar">
       <img src="./search.png" alt="" />
       <input type="text" placeholder="Search" />
      </div>
      <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
    </div>


    <div
      className={`item ${activeItem === 1 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(1)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 2 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(2)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: History</span>
      <p>Description: A brief look at events in history.</p>
      <p>Lesson#: 100002</p>
      <p>Subject Matter: Ancient Times</p>
      <p>Audience: Scholars</p>
      <p>By: Professor</p>
      <p>Date: 2hrs ago</p>
    </div>

    <div
      className={`item ${activeItem === 3 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(3)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Science</span>
      <p>Description: Exploring scientific concepts.</p>
      <p>Lesson#: 100003</p>
      <p>Subject Matter: Physics</p>
      <p>Audience: Students</p>
      <p>By: Scientist</p>
      <p>Date: 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 4 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(4)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 5 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(5)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 6 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(6)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 7 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(7)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 8 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(8)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 9 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(9)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 10 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(10)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 11 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(11)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: History</span>
      <p>Description: A brief look at events in history.</p>
      <p>Lesson#: 100002</p>
      <p>Subject Matter: Ancient Times</p>
      <p>Audience: Scholars</p>
      <p>By: Professor</p>
      <p>Date: 2hrs ago</p>
    </div>

    <div
      className={`item ${activeItem === 12 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(12)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Science</span>
      <p>Description: Exploring scientific concepts.</p>
      <p>Lesson#: 100003</p>
      <p>Subject Matter: Physics</p>
      <p>Audience: Students</p>
      <p>By: Scientist</p>
      <p>Date: 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 13 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(13)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 14 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(14)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 15 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(15)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 16 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(16)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 17 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(17)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 18 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(18)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 19 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(19)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 20 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(20)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: History</span>
      <p>Description: A brief look at events in history.</p>
      <p>Lesson#: 100002</p>
      <p>Subject Matter: Ancient Times</p>
      <p>Audience: Scholars</p>
      <p>By: Professor</p>
      <p>Date: 2hrs ago</p>
    </div>

    <div
      className={`item ${activeItem === 21 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(21)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Science</span>
      <p>Description: Exploring scientific concepts.</p>
      <p>Lesson#: 100003</p>
      <p>Subject Matter: Physics</p>
      <p>Audience: Students</p>
      <p>By: Scientist</p>
      <p>Date: 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 22 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(22)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 23 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(23)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 24 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(24)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 25 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(25)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 26 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(26)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 27 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(27)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 28 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(28)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 29 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(29)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: History</span>
      <p>Description: A brief look at events in history.</p>
      <p>Lesson#: 100002</p>
      <p>Subject Matter: Ancient Times</p>
      <p>Audience: Scholars</p>
      <p>By: Professor</p>
      <p>Date: 2hrs ago</p>
    </div>

    <div
      className={`item ${activeItem === 30 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(30)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Science</span>
      <p>Description: Exploring scientific concepts.</p>
      <p>Lesson#: 100003</p>
      <p>Subject Matter: Physics</p>
      <p>Audience: Students</p>
      <p>By: Scientist</p>
      <p>Date: 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 31 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(31)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 32 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(32)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 33 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(33)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 34 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(34)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 35 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(35)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>

    <div
      className={`item ${activeItem === 36 ? 'active' : ''}`}
      onMouseEnter={() => handleMouseEnter(36)}
      onMouseLeave={handleMouseLeave}
    >
      <span>Topic: Greeting</span>
      <p>Description: Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
      <p>Lesson#: 100001</p>
      <p>Subject Matter: Eden</p>
      <p>Audience: General</p>
      <p>By: Admin</p>
      <p>Date: 1hr 30min ago</p>
    </div>
   </div>
  );
}

export default RevTopic;
