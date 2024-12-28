import React from 'react'
import './chat.css'
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const [openEmoji, setOpenEmoji] = React.useState(false);
  const [text, setText] = React.useState('');


  const handleEmoji = (e) => {
 
      setText((prev)=> prev + e.emoji);   /* to set emoji into the text field*/ 
      setOpenEmoji(false);  
  }

  console.log(text);

  return (
    <div className='chat_container'>
        <div className="top">
          <div className="user">
            <img src="./avatar.png" alt="" />
          </div>
          <div className="texts">
            <span>Jane Dee</span>
            <p>Lorem ipsum dolor sit amet, </p>
          </div>
          <div className="icons">
            <img src="./phone.png" alt="" />
            <img src="./video.png" alt="" />
            <img src="./info.png" alt="" />
          </div>
        </div>
        <div className="center"></div>
        <div className="bottom">
          <div className="icons">
            <img src="./img.png" alt="" />
            <img src="./camera.png" alt="" />
            <img src="./mic.png" alt="" />
          </div>
          <input type="text" placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)}/>
          <div className="emoji">
            <img src="./emoji.png" alt="" onClick={() => setOpenEmoji(!openEmoji)} />
            <div className="picker">
            {openEmoji && <EmojiPicker onEmojiClick={handleEmoji}/>}
          </div>
          </div>
          <button className='SendButton'>Send</button>
        </div>
        </div>
  )
}

export default Chat