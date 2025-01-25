import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../admin/hooks/useUpload";
import EmojiPicker from 'emoji-picker-react';
import DOMPurify from 'dompurify';
import './chat.css';

const Chat = () => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");
  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [step, setStep] = useState(0); // Tracks current step in multi-input
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    audience: '',
    subjectMatter: '',
    message: '',
    media1: null,
    media2: null,
    media3: null,
  });

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleEmoji = (e) => {
    setFormData({ ...formData, message: formData.message + e.emoji });
    setOpenEmoji(false);
  };

  const sanitizeMessage = (message) => {
    return DOMPurify.sanitize(message, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'] });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("message", formData.message);

    ["media1", "media2", "media3"].forEach((file) => {
      if (formData[file]) {
        formDataToSend.append(file, formData[file]);
      }
    });

    chatMutation.mutate(formDataToSend, {
      onSuccess: () => {
        console.log("Message sent!");
        reset();
        setFormData({
          topic: '',
          description: '',
          audience: '',
          subjectMatter: '',
          message: '',
          media1: null,
          media2: null,
          media3: null,
        });
      },
      onError: (error) => {
        console.error("Error uploading chat message:", error);
      },
    });
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("message", formData.message);

    ["media1", "media2", "media3"].forEach((file) => {
      if (formData[file]) {
        formDataToSend.append(file, formData[file]);
      }
    });

    commentMutation.mutate(formDataToSend, {
      onSuccess: () => {
        console.log("Comment sent!");
        reset();
        setFormData({
          topic: '',
          description: '',
          audience: '',
          subjectMatter: '',
          message: '',
          media1: null,
          media2: null,
          media3: null,
        });
      },
      onError: (error) => {
        console.error("Error uploading comment:", error);
      },
    });
  };

  return (
    <div className="chat_container">
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
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit Velit maxime consectetur accusantium? Eligendi vel quos nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?</p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message Own">
          <div className="texts">
            <img src="https://ik.imagekit.io/amazonmondayp/Amazon_Ecommerce_Capstone_Prjt_row_1_Carousel/61yTkc3VJ1L._AC_SL1000_.jpg?updatedAt=1713057245841" alt="" />
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit Velit maxime consectetur accusantium? Eligendi vel quos nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?</p>
            <span>1 min ago</span>
          </div>
        </div>
      </div>

      <div className="bottom">
        <div className="toggle_buttons">
          <button className={!addMode ? 'active' : ''} onClick={() => setAddMode(false)}>Comment</button>
          <button className={addMode ? 'active' : ''} onClick={() => setAddMode(true)}>Start New Chat</button>
        </div>

        {!addMode ? (
          <form className="bottom_comment" onSubmit={handleSendComment}>
            <div className="icons">
              <img src="./img.png" alt="Upload" />
              <img src="./camera.png" alt="Camera" />
              <img src="./mic.png" alt="Mic" />
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
            />
            <div className="emoji">
              <img src="./emoji.png" alt="Emoji Picker" onClick={() => setOpenEmoji(!openEmoji)} />
              {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
            </div>
            <button className="SendButton" type="submit">Send</button>
          </form>
        ) : (
          <form className="bottom_presentation" onSubmit={handleSendMessage}>
            <h3>INPUT CHAT/PRESENTATION</h3>
            <div className="icons">
              <img src="./img.png" alt="Upload" />
              <img src="./camera.png" alt="Camera" />
              <img src="./mic.png" alt="Mic" />
            </div>
            {step === 0 && (
              <input
                type="text"
                placeholder="Enter Topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
              />
            )}
            {step === 1 && (
              <input
                type="text"
                placeholder="Enter Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            )}
            {step === 2 && (
              <select
                value={formData.audience}
                onChange={(e) => handleInputChange('audience', e.target.value)}
              >
                <option value="">Select Audience</option>
                <option value="General">General</option>
                <option value="Students">Students</option>
                <option value="Professionals">Professionals</option>
              </select>
            )}
            {step === 3 && (
              <select
                value={formData.subjectMatter}
                onChange={(e) => handleInputChange('subjectMatter', e.target.value)}
              >
                <option value="">Select Subject Matter</option>
                <option value="Eden">Eden</option>
                <option value="Math">Math</option>
                <option value="Science">Science</option>
              </select>
            )}
            {step === 4 && (
              <textarea
                placeholder="Enter Main Message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
              />
            )}
            <div className="input-buttons">
              {step < 4 && <button type="button" onClick={handleNextStep}>Next</button>}
              {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
            </div>
            <button className="SendButton" type="submit">Send</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;



// import React, { useState } from 'react';
// import './chat.css'
// import EmojiPicker from 'emoji-picker-react';
// import DOMPurify from 'dompurify';

// const Chat = () => {
//   const [openEmoji, setOpenEmoji] = React.useState(false);
//   const [text, setText] = React.useState('');
//   const [addMode, setAddMode] = React.useState(false);
//   const [step, setStep] = useState(0); // Tracks current step in multi-input
//   const [formData, setFormData] = useState({
//            topic: '',
//            description: '',
//            message: '',
//            audience: '',
//            subjectMatter: '',
//          });
  
//          const handleNextStep = () => {
//           if (step < 4) setStep(step + 1);
//         };
      
//         const handlePrevStep = () => {
//           if (step > 0) setStep(step - 1);
//         };
      
//         const handleInputChange = (field, value) => {
//           setFormData({ ...formData, [field]: value });
//         };
       


//   const handleEmoji = (e) => {
 
//       setText((prev)=> prev + e.emoji);   /* to set emoji into the text field*/ 
//       setOpenEmoji(false);  
//   }

//   const sanitizeMessage = (message) => {
//     return DOMPurify.sanitize(message, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'] });
//   };

//   const handleSendMessage = () => {
//     const sanitizedMessage = sanitizeMessage(text);
//     console.log(sanitizedMessage);
//     // Send the sanitized message to the server or handle it as needed
//   };

//   return (
//     <div className='chat_container'>
//         <div className="top">
//           <div className="user">
//             <img src="./avatar.png" alt="" />
//           </div>
//           <div className="texts">
//             <span>Jane Dee</span>
//             <p>Lorem ipsum dolor sit amet, </p>
//           </div>
//           <div className="icons">
//             <img src="./phone.png" alt="" />
//             <img src="./video.png" alt="" />
//             <img src="./info.png" alt="" />
//           </div>
//         </div>


//    <div className="center">
//           <div className="message">
//             <img src="./avatar.png" alt="" />
//             <div className="texts">
//               <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
//                Velit maxime consectetur accusantium? Eligendi vel quos 
//                nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
//                 Aspernatur accusantium nostrum fuga incidunt facere?
//               </p>
//               <span>i min ago </span>
//             </div>
//           </div>
//           <div className="message Own">
//             <div className="texts">
//               <img src="https://ik.imagekit.io/amazonmondayp/Amazon_Ecommerce_Capstone_Prjt_row_1_Carousel/61yTkc3VJ1L._AC_SL1000_.jpg?updatedAt=1713057245841" alt="" />
//               <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
//                Velit maxime consectetur accusantium? Eligendi vel quos 
//                nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
//                 Aspernatur accusantium nostrum fuga incidunt facere?
//               </p>
//               <span>i min ago </span>
//             </div>
//           </div>
          
//   </div>


        
//         <div className="bottom">
//         {/* Toggle Buttons */}
//         <div className="toggle_buttons">
//           <button
//             className={!addMode ? 'active' : ''}
//             onClick={() => setAddMode(false)}
//           >
//             Comment
//           </button>
//           <button
//             className={addMode ? 'active' : ''}
//             onClick={() => setAddMode(true)}
//           >
//             Start New Chat
//           </button>
//         </div>

//         {/* Conditional Input Rendering */}
//         {!addMode ? (
//           <div className="bottom_comment">
//             <div className="icons">
//               <img src="./img.png" alt="Upload" />
//               <img src="./camera.png" alt="Camera" />
//               <img src="./mic.png" alt="Mic" />
//             </div>
//             <input
//               type="text"
//               placeholder="Type a message..."
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//             />
//             <div className="emoji">
//               <img
//                 src="./emoji.png"
//                 alt="Emoji Picker"
//                 onClick={() => setOpenEmoji(!openEmoji)}
//               />
//               {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
//             </div>
//             <button className="SendButton" onClick={handleSendMessage}>Send</button>
//           </div>
//         ) : (
//           <div className="bottom_presentation">
//               <div className="icons">
//               <img src="./img.png" alt="Upload" />
//               <img src="./camera.png" alt="Camera" />
//               <img src="./mic.png" alt="Mic" />
//             </div>
//             {step === 0 && (
//               <input
//                 type="text"
//                 placeholder="Enter Topic"
//                 value={formData.topic}
//                 onChange={(e) => handleInputChange('topic', e.target.value)}
//               />
//             )}
//             {step === 1 && (
//               <input
//                 type="text"
//                 placeholder="Enter Description"
//                 value={formData.description}
//                 onChange={(e) => handleInputChange('description', e.target.value)}
//               />
//             )}
//             {step === 2 && (
//               <select
//                 value={formData.audience}
//                 onChange={(e) => handleInputChange('audience', e.target.value)}
//               >
//                 <option value="">Select Audience</option>
//                 <option value="General">General</option>
//                 <option value="Students">Students</option>
//                 <option value="Professionals">Professionals</option>
//               </select>
//             )}
//             {step === 3 && (
//               <select
//                 value={formData.subjectMatter}
//                 onChange={(e) => handleInputChange('subjectMatter', e.target.value)}
//               >
//                 <option value="">Select Subject Matter</option>
//                 <option value="Eden">Eden</option>
//                 <option value="Math">Math</option>
//                 <option value="Science">Science</option>
//               </select>
//             )}
//             {step === 4 && (
//               <textarea
//                 placeholder="Enter Main Message"
//                 value={formData.message}
//                 onChange={(e) => handleInputChange('message', e.target.value)}
//               />
//             )}
//             <div className="input-buttons">
//               {step > 0 && <button onClick={handlePrevStep}>Back</button>}
//               {step < 4 && <button onClick={handleNextStep}>Next</button>}
//             </div>
//             <button
//               className="SendButton"
//               onClick={() => console.log(formData)}
//             >
//               Send
//             </button>
//           </div>
//         )}
//       </div>

//         </div>
//   )
// }

// export default Chat