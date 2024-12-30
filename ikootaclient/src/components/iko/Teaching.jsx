import React, {useState} from 'react'
import './teaching.css'

const Teaching = () => {
  const [addMode, setAddMode] = useState(false)
     return (
       <div className='teaching_container'>
           <div className="search">
               <div className="searchbar">
                   <img src="./search.png" alt="" />
                   <input type="text" placeholder="Search" />
               </div>
       <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>Audience: General</p>
                   <p>By: Admin</p>
                    <p>Date: 1hr 30min ago</p>
                    </div>
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>Audience: General</p>
                   <p>By: Admin</p>
                    <p>1hr 30min ago</p>
                    </div>
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>By: Admin</p>
                    <p>1hr 30min ago</p>
                    </div>
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>By: Admin</p>
                    <p>1hr 30min ago</p>
                    </div>
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>By: Admin</p>
                    <p>1hr 30min ago</p>
                    </div>
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>By: Admin</p>
                    <p>1hr 30min ago</p>
                    </div>
           </div>
           <div className="item">
               <div className="texts">
                   <span>Topic: Greeting</span>
                   <p>Description: Lorem, ipsum dolor sit
                      amet consectetur adipisicing elit.
                   </p>
                   <p>Leasson#: 100001</p>
                   <p>Subject Matter: Eden</p>
                   <p>By: Admin</p>
                    <p>1hr 30min ago</p>
                    </div>
           </div>
        </div>
     )
   }
export default Teaching