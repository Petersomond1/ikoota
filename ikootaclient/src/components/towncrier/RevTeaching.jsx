import React from "react";
import ReactPlayer from "react-player";
import "./revteaching.css";

const RevTeaching = ({ teaching }) => {
  if (!teaching) return <p>Select a teaching to view details.</p>;

  return (
    <div className="revTeaching-container">
      <div className="teaching-item">
        <h2>{teaching.topic}</h2>
        <p>{teaching.description}</p>
        <p>Lesson #: {teaching.lessonNumber}</p>
        <p>Subject Matter: {teaching.subjectMatter}</p>
        <p>Audience: {teaching.audience}</p>
        <p>By: {teaching.author}</p>
        <p>Date: {new Date(teaching.createdAt).toLocaleString()}</p>

        {/* Display media content dynamically */}
        <div className="media-container">
          {teaching.media_url1 && teaching.media_type1 === "video" && (
            <ReactPlayer url={teaching.media_url1} controls width="100%" />
          )}
          {teaching.media_url2 && teaching.media_type2 === "image" && (
            <img src={teaching.media_url2} alt="Teaching Image" />
          )}
          {teaching.media_url3 && teaching.media_type3 === "audio" && (
            <audio controls>
              <source src={teaching.media_url3} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevTeaching;




// import React from 'react';
// import './revTeaching.css'

// const RevTeaching = () => {


     
     
//        return (
//          <div className='revTeaching_container'>
//              <div className="top">
//                  <p>Summary:</p><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur, optio delectus ipsa vero veniam odit eveniet fuga repellendus dicta impedit officiis! Harum ratione aliquam in impedit fugit omnis labore excepturi.</p><p>You feel misinformed by this? Contact the Ogha-nMoo Elden</p>
//                  <img src="./phone.png" alt="Phone icon" />
//                  <img src="./email.png" alt="Email icon" />
//                  <img src="./whatsapp.png" alt="WhatsApp icon" />
//              </div>
     
     
//         <div className="center">
//                <div className="message">
//                  <img src="./avatar.png" alt="" />
//                  <div className="texts">
//                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
//                     Velit maxime consectetur accusantium? Eligendi vel quos 
//                     nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
//                      Aspernatur accusantium nostrum fuga incidunt facere?
//                    </p>
//                    <span>i min ago </span>
//                  </div>
//                </div>
//                <div className="message Own">
//                  <div className="texts">
//                    <img src="https://ik.imagekit.io/amazonmondayp/Amazon_Ecommerce_Capstone_Prjt_row_1_Carousel/61yTkc3VJ1L._AC_SL1000_.jpg?updatedAt=1713057245841" alt="" />
//                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
//                     Velit maxime consectetur accusantium? Eligendi vel quos 
//                     nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
//                      Aspernatur accusantium nostrum fuga incidunt facere?
//                    </p>
//                    <span>i min ago </span>
//                  </div>
//                </div>
//                <div className="message">
//                  <img src="./avatar.png" alt="" />
//                  <div className="texts">
//                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
//                     Velit maxime consectetur accusantium? Eligendi vel quos 
//                     nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
//                      Aspernatur accusantium nostrum fuga incidunt facere?
//                    </p>
//                    <span>i min ago </span>
//                  </div>
//                </div>
//                <div className="message Own">
//                  <div className="texts">
//                    <video src="https://ik.imagekit.io/amazonmondayp/database%20video%20Folder/fathersMoms.webm?updatedAt=1717894510536" controls></video>
//                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit
//                     Velit maxime consectetur accusantium? Eligendi vel quos 
//                     nisi et dolorem quaerat quidem itaque vero ducimus aspernatur!
//                      Aspernatur accusantium nostrum fuga incidunt facere?
//                    </p>
//                    <span>i min ago </span>
//                  </div>
//                </div>
//                <div className="message">
//                  <img src="./avatar.png" alt="" />
//                  <div className="texts">
//                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?
//                    </p>
//                    <span>i min ago </span>
//                  </div>
//                </div>
//                <div className="message Own">
//                  <div className="texts">
//                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit Velit maxime consectetur accusantium? Eligendi vel quos  nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?
//                    </p>
//                    <span>i min ago </span>
//                  </div>
//                </div>
               
//        </div>
             
//              </div>
//   )
// }

// export default RevTeaching

