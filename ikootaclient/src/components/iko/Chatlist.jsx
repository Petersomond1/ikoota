import React, {useState} from 'react'
import './chatlist.css'

const Chatlist = () => {
    const [addMode, setAddMode] = React.useState(false)
  return (
    <div className='chatlist'>
        <div className="search">
            <div className="searchbar">
                <img src="./search.png" alt="" />
                <input type="text" placeholder="Search" />
            </div>
    <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
        </div>
        <div className="item">
            <img src="./avatar.png" alt="" />
            <div className="texts">
                <span>John Doe</span>
                <p>Topic: Greeting</p>
                <p>Hi, how are you?</p>
            </div>
        </div>
        <div className="item">
            <img src="./avatar.png" alt="" />
            <div className="texts">
                <span>John Doe</span>
                <p>Topic: Greeting</p>
                <p>Hi, how are you?</p>
            </div>
        </div>
        <div className="item">
            <img src="./avatar.png" alt="" />
            <div className="texts">
                <span>John Doe</span>
                <p>Topic: Greeting</p>
                <p>Hi, how are you?</p>
            </div>
        </div>
     </div>
  )
}

export default Chatlist