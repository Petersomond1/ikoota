import React from 'react'
import './userinfo.css'

const Userinfo = () => {
  return (
    <>
    <div className='userinfo'>
            <div className="user">
                <img src="./avatar.png" alt="" />
                    <h4>John Doe</h4>
             </div> 
            <div className="icons">
                <img src="./more.png" alt="" />
                <img src="./video.png" alt="" />
                <img src="./edit.png" alt="" />
            </div>
            
        </div>
        <p>Active 1h ago</p>
        </>
  )
}

export default Userinfo