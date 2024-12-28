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


   <div className="center">
          <div className="message">
            <img src="./avatar.png" alt="" />
            <div className="texts">
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
               Velit maxime consectetur accusantium? Eligendi vel quos 
               nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
                Aspernatur accusantium nostrum fuga incidunt facere?
              </p>
              <span>i min ago </span>
            </div>
          </div>
          <div className="message Own">
            <div className="texts">
              <img src="https://ik.imagekit.io/amazonmondayp/Amazon_Ecommerce_Capstone_Prjt_row_1_Carousel/61yTkc3VJ1L._AC_SL1000_.jpg?updatedAt=1713057245841" alt="" />
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
               Velit maxime consectetur accusantium? Eligendi vel quos 
               nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
                Aspernatur accusantium nostrum fuga incidunt facere?
              </p>
              <span>i min ago </span>
            </div>
          </div>
          <div className="message">
            <img src="./avatar.png" alt="" />
            <div className="texts">
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
               Velit maxime consectetur accusantium? Eligendi vel quos 
               nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
                Aspernatur accusantium nostrum fuga incidunt facere?
              </p>
              <span>i min ago </span>
            </div>
          </div>
          <div className="message Own">
            <div className="texts">
              <video src="https://ik.imagekit.io/amazonmondayp/database%20video%20Folder/fathersMoms.webm?updatedAt=1717894510536" controls></video>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
               Velit maxime consectetur accusantium? Eligendi vel quos 
               nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
                Aspernatur accusantium nostrum fuga incidunt facere?
              </p>
              <span>i min ago </span>
            </div>
          </div>
          <div className="message">
            <img src="./avatar.png" alt="" />
            <div className="texts">
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?
              </p>
              <span>i min ago </span>
            </div>
          </div>
          <div className="message Own">
            <div className="texts">
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit Velit maxime consectetur accusantium? Eligendi vel quos  nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?
              </p>
              <span>i min ago </span>
            </div>
          </div>
          
  </div>


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