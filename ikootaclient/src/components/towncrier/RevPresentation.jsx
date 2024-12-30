import React,{ useState } from 'react';
import './revpresentation.css'
import EmojiPicker from 'emoji-picker-react';

const RevPresentation = () => {

  
     
       const [openEmoji, setOpenEmoji] = React.useState(false);
       const [text, setText] = React.useState('');
       const [step, setStep] = useState(0); // Tracks current step in multi-input
       const [formData, setFormData] = useState({
         topic: '',
         description: '',
         message: '',
         audience: '',
         subjectMatter: '',
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
     
     
       const handleEmoji = (e) => {
      
           setText((prev)=> prev + e.emoji);   /* to set emoji into the text field*/ 
           setOpenEmoji(false);  
       }
     
     
       return (
         <div className='revpresentation_container'>
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
          <img src="./img.png" alt="Upload" />
          <img src="./camera.png" alt="Camera" />
          <img src="./mic.png" alt="Mic" />
        </div>

        {step === 0 && (
          <div className='input_div'>
            <input
              type="text"
              placeholder="Enter Topic"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
            />
          </div>
        )}
        {step === 1 && (
          <div className='input_div'>
            <input
              type="text"
              placeholder="Enter Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
        )}
        {step === 2 && (
          <div className='input_div'>
            <select
              value={formData.audience}
              onChange={(e) => handleInputChange('audience', e.target.value)}
            >
              <option value="">Select Audience</option>
              <option value="General">General</option>
              <option value="Students">Students</option>
              <option value="Professionals">Professionals</option>
            </select>
          </div>
        )}
        {step === 3 && (
          <div className='input_div'>
            <select
              value={formData.subjectMatter}
              onChange={(e) => handleInputChange('subjectMatter', e.target.value)}
            >
              <option value="">Select Subject Matter</option>
              <option value="Eden">Eden</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
            </select>
          </div>
        )}
          {step === 4 && (
          <div className='input_div'>
            <textarea
              placeholder="Enter Main Message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
            />
          </div>
        )}

      

        <div className="input-buttons">
          {step > 0 && <button onClick={handlePrevStep}>Back</button>}
          {step < 4 && <button onClick={handleNextStep}>Next</button>}
        </div>

       
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji"
            onClick={() => setOpenEmoji(!openEmoji)}
          />
          <div className="picker">
            {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
          </div>
        </div>
        <button className="SendButton" onClick={() => console.log(formData)}>
          Send
        </button>
      </div>
             
             </div>
  )
}

export default RevPresentation

