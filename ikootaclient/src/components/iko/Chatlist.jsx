import React from 'react'
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
     </div>
  )
}

export default Chatlist