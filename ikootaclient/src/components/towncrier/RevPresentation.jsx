const RevPresentation = ({ presentations, selectedTopic }) => {
  const filteredPresentations = selectedTopic
    ? presentations.filter((presentation) => presentation.topicId === selectedTopic.id)
    : presentations;

  return (
    <div className="revpresentation-container">
      {filteredPresentations?.map((presentation) => (
        <div key={presentation.id} className="presentation-item">
          <div className="top">
            <p>Summary: {presentation.summary}</p>
         <img src="./phone.png" alt="Phone icon" />
         <img src="./email.png" alt="Email icon" />
         <img src="./whatsapp.png" alt="WhatsApp icon" />
        </div>
        <div className="center">
          <div className="message">
            <img src="./avatar.png" alt="" />
            <div className="texts">
              <p>{presentation.message}</p>
              <video src={presentation.video} controls></video>
              <img src={presentation.img} alt="" />
             <p>{presentation.music} </p>
             <p>{presentation.emoji}</p>
              <span>{presentation.createdAt}</span>
            </div>
          </div>
        </div>
      </div>
      ))}
    </div>
  );
}
export default RevPresentation;



// import React from 'react';
// import './revpresentation.css'

// const RevPresentation = () => {


     
     
//        return (
//          <div className='revpresentation_container'>
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

// export default RevPresentation

