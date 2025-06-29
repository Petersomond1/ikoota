import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../hooks/useUpload";
import EmojiPicker from "emoji-picker-react";
import DOMPurify from "dompurify";
import ReactPlayer from "react-player";
import "./chat.css";
import { useFetchParentChatsAndTeachingsWithComments } from "../service/useFetchComments";
import { jwtDecode } from "jwt-decode";
import MediaGallery from "./MediaGallery"; // Import MediaGallery Component
import { useUploadCommentFiles } from "../../hooks/useUploadCommentFiles";
import { postComment } from "../service/commentServices";
import { useQueries, Mutation } from "@tanstack/react-query"

const Chat = ({ activeItem, chats, teachings }) => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");
  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");
  const uploadCommentFiles = useUploadCommentFiles(); // Use the hook

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  const { data: fetchedComments, isLoading: isLoadingComments } = useFetchParentChatsAndTeachingsWithComments(activeItem?.user_id);
  //console.log("this is the data we're looking for ", fetchedComments);
  const [formData, setFormData] = useState({});
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [step, setStep] = useState(0);
  const [playingMedia, setPlayingMedia] = useState(null);


    // Enhanced activeContent finder with prefixed ID support
  const findActiveContent = () => {
    if (!activeItem) return null;

    // First try to find by prefixed_id (new way)
    if (activeItem.prefixed_id) {
      if (activeItem.prefixed_id.startsWith('c') || activeItem.type === "chat") {
        return chats.find((chat) => 
          chat.prefixed_id === activeItem.prefixed_id || 
          chat.id === activeItem.id ||
          chat.updatedAt === activeItem.updatedAt
        );
      } else if (activeItem.prefixed_id.startsWith('t') || activeItem.type === "teaching") {
        return teachings.find((teaching) => 
          teaching.prefixed_id === activeItem.prefixed_id || 
          teaching.id === activeItem.id ||
          teaching.updatedAt === activeItem.updatedAt
        );
      }
    }

  // const activeContent =
  //   activeItem && activeItem.type === "chat"
  //     ? chats.find((chat) => chat.updatedAt === activeItem.updatedAt)
  //     : activeItem && activeItem.type === "teaching"
  //     ? teachings.find((teaching) => teaching.updatedAt === activeItem.updatedAt)
  //     : activeItem;
  // console.log("here are the active content", activeContent);

  // if (!activeItem) {
  //   return <p className="status">Select a chat or teaching to start.</p>;
  // }


  
    // Fallback to old method for backward compatibility
    if (activeItem.type === "chat") {
      return chats.find((chat) => 
        chat.updatedAt === activeItem.updatedAt || 
        chat.id === activeItem.id
      );
    } else if (activeItem.type === "teaching") {
      return teachings.find((teaching) => 
        teaching.updatedAt === activeItem.updatedAt || 
        teaching.id === activeItem.id
      );
    }

    return activeItem;
  };

  const activeContent = findActiveContent();

  console.log("Active item:", activeItem);
  console.log("Active content:", activeContent);

  if (!activeItem) {
    return <p className="status">Select a chat or teaching to start.</p>;
  }

  const handleNextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleEmoji = (e) => {
    setFormData({ ...formData, comment: (formData.comment || "") + e.emoji });
    setOpenEmoji(false);
  };

  const sanitizeMessage = (message) => {
    return DOMPurify.sanitize(message, { ALLOWED_TAGS: ["b", "i", "em", "strong", "a"] });
  };

  const handleSendChat = (data) => {
    const formData = new FormData();
    formData.append("created_by", data.user_id);
    formData.append("title", data.title);
    formData.append("audience", data.audience);
    formData.append("summary", data.summary);
    formData.append("text", data.text);
    formData.append("is_flagged", false);

    ["media1", "media2", "media3"].forEach((file) => {
      if (data[file]?.[0]) {
        formData.append(file, data[file][0]);
      }
    });

    chatMutation.mutate(formData, {
      onSuccess: (response) => {
        console.log("Chat created with prefixed ID:", response.data?.prefixed_id);
        reset();
        setStep(0); // Reset step after successful submission
      },
      onError: (error) => {
        console.error("Error uploading chat:", error);
      },
    });
  };

  const handleSendComment = async (data) => {
    let user_id;
    const token = localStorage.getItem("token");

    if (token) {
      user_id = jwtDecode(token).user_id;
    } else {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (tokenCookie) {
        user_id = jwtDecode(tokenCookie.split("=")[1]).user_id;
      } else {
        console.error("Access token not found");
        return;
      }
    }

     // Get the correct ID to use for the comment
      const contentId = activeContent?.id || activeItem?.id;
      const contentType = activeContent?.content_type || activeItem?.type;

      if (!contentId || !contentType) {
        console.error("Missing content ID or type");
        return;
      }

    const files = [data.media1, data.media2, data.media3].filter(Boolean).flat();
     let mediaData = [];
    
      if (files.length > 0) {
    const uploadResponse = await uploadCommentFiles.mutateAsync(files);

    const mediaData = uploadResponse.map((file, index) => ({
      url: file.url,
      type: file.type,
    }));
  }

    const formData = new FormData();
    formData.append("comment", data.comment);
    formData.append(activeItem.type === "chat" ? "chat_id" : "teaching_id", activeItem.id);
    formData.append("user_id", user_id);

    ["media1", "media2", "media3"].forEach((file) => {
      if (data[file]?.[0]) {
        formData.append(file, data[file][0]);
      }
    });

    commentMutation.mutate(formData, {
      onSuccess: async (uploadResponse) => {
        const { mediaUrls } = uploadResponse.data;
        console.log("Media URLs:", mediaUrls);
        const mediaData = mediaUrls.map((url, index) => ({
          url,
          type: data[`media${index + 1}`]?.[0]?.type || "unknown",
        }));

         // Add the appropriate ID based on content type
      if (contentType === "chat") {
        commentData.chat_id = contentId;
      } else if (contentType === "teaching") {
        commentData.teaching_id = contentId;
      }

        await postComment({
          chat_id: activeItem.type === "chat" ? activeItem.id : null,
          teaching_id: activeItem.type === "teaching" ? activeItem.id : null,
          user_id,
          comment: data.comment,
          media: mediaData,
        });

        alert("Comment posted successfully!");
        reset();
      },
      onError: (error) => console.error("Error uploading comment:", error),
    });
  };

  const handleMediaClick = (url) => {
    setPlayingMedia(url);
  };


  
  // Helper function to render media based on type and URL
  const renderMedia = (url, type, alt = "media") => {
    if (!url || !type) return null;

    switch (type) {
      case "image":
        return <img src={url} alt={alt} width="100%" style={{ maxHeight: "300px", objectFit: "contain" }} />;
      case "video":
        return <ReactPlayer url={url} controls width="100%" height="200px" />;
      case "audio":
        return (
          <audio controls style={{ width: "100%" }}>
            <source src={url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        );
      default:
        return <p>Unsupported media type: {type}</p>;
    }
  };

  // Helper function to get content identifier
  const getContentIdentifier = (content) => {
    return content?.prefixed_id || `${content?.content_type || 'item'}${content?.id}` || 'Unknown';
  };



//   return (
//     <div className="chat_container" style={{border:"3px solid red"}}>
//       <div className="top">
//         <div className="user">
//           <img src="./avatar.png" alt="Avatar" />
//         </div>
//         <div className="texts">
//           <span>{activeContent?.user_id || "Admin"}</span>
//           <p>{activeContent?.title || activeContent?.topic}</p>
//         </div>
//         <div className="icons">
//           <img src="./phone.png" alt="Phone" />
//           <img src="./video.png" alt="Video" />
//           <img src="./info.png" alt="Info" />
//         </div>
//       </div>

//       <div className="center" style={{border:"3px solid yellow"}}>
//       <div className="message-heading" style={{border:"5px solid brown"}}>
//         <h3>Topic: {activeContent?.topic || activeContent?.title}</h3>
//         <p>Descr: {activeContent?.description || activeContent?.summary}</p>
//         <p>Subject: {activeContent?.subjectMatter}</p>
//         <div style={{border:"5px solid blue", display:"flex", direction:"row", gap:"10px"}}>
//         <p>Lesson #: {activeContent?.lessonNumber}</p>
//         <p>Audience: {activeContent?.audience}</p>
//         <p>Created By: { activeContent?.user_id}</p>
//         </div>
//         <p>Posted: {new Date(activeContent?.createdAt || Date.now()).toLocaleString()}</p>
//       </div>
//           <div className="texts"    style={{border:"5px solid green"}}>
        
//             <p>{sanitizeMessage(activeContent?.text || activeContent?.content)}</p>
//             <span>Updated:{new Date(activeContent?.updatedAt || activeContent?.createdAt).toLocaleString()}</span>
//            </div>
          
//           <div className="media-container"   style={{border:"5px solid gray"}}>
//             { activeContent?.media_type1 === "image" && (
//               <img src={activeContent?.media_url1} alt="media" width="100%" />
//             )}
//             { activeContent?.media_type1 === "video" && (
//               <ReactPlayer url={activeContent?.media_url1} controls width="100%" />
//             )}
//             { activeContent?.media_type1 === "audio" && (
//              <audio controls>
//              <source src={activeContent?.media_url3} type="audio/mpeg" />
//              Your browser does not support the audio element.
//            </audio>
//             )}
//               { activeContent?.media_type2 === "image" && (
//               <img src={activeContent?.media_url2} alt="media" width="100%" />
//             )}
//             { activeContent?.media_type2 === "video" && (
//               <ReactPlayer url={activeContent?.media_url1} controls width="100%" />
//             )}
//             { activeContent?.media_type2 === "audio" && (
//              <audio controls>
//              <source src={activeContent?.media_url3} type="audio/mpeg" />
//              Your browser does not support the audio element.
//            </audio>
//             )}

//             { activeContent?.media_type3 === "image" && (
//               <img src={activeContent?.media_url1} alt="media" width="100%" />
//             )}
//             { activeContent?.media_type3 === "video" && (
//               <ReactPlayer url={activeContent?.media_url1} controls width="100%" />
//             )}
//             { activeContent?.media_type3 === "audio" && (
//              <audio controls>
//              <source src={activeContent?.media_url3} type="audio/mpeg" />
//              Your browser does not support the audio element.
//            </audio>
//             )}

//         </div>

//         {isLoadingComments ? (
//           <p>Loading comments...</p>
//         ) : (
//           fetchedComments?.comments
//             ?.filter(
//               (comment) =>
//                 (activeItem?.type === "chat" && comment.chat_id === activeItem?.id) ||
//                 (activeItem?.type === "teaching" && comment.teaching_id === activeItem?.id)
//             )
//             .map((comment) => (
//               <div key={comment.id} className="message Own" style={{border:"5px solid pink"}}>
//                 <div className="texts" style={{border:"5px solid magenta"}}>
//                   <p>{sanitizeMessage(comment.comment)}</p>
                  
//                   <span>{new Date(comment.createdAt).toLocaleString()}</span>
//                 </div>


//                   <div className="media-container-comments" style={{border:"5px solid orange"}}>
//                     {comment.media_url1 && comment.media_type1 === "video" && (
//                       <ReactPlayer url={comment.media_url1} controls width="100%" />
//                     )}
//                     {comment.media_url2 && comment.media_type2 === "image" && (
//                       <img src={comment.media_url2} alt="comment Image" />
//                     )}
//                     {comment.media_url3 && comment.media_type3 === "audio" && (
//                       <audio controls>
//                         <source src={comment.media_url3} type="audio/mpeg" />
//                         Your browser does not support the audio element.
//                       </audio>
//                     )}
//                   </div>
//               </div>
//             ))
//         )}
       
//       </div>

//       <div className="bottom">
//         <div className="toggle_buttons">
//           <button className={!addMode ? 'active' : ''} onClick={() => setAddMode(false)}>Comment</button>
//           <button className={addMode ? 'active' : ''} onClick={() => setAddMode(true)}>Start New Chat</button>
//         </div>

//         {!addMode ? (
//           <form className="bottom_comment" onSubmit={handleSubmit(handleSendComment)} noValidate>
//             <div className="icons">
//               <img src="./img.png" alt="Upload" />
//               <img src="./camera.png" alt="Camera" />
//               <img src="./mic.png" alt="Mic" />
//             </div>
//             {step === 0 && (
//               <input
//                 type="text"
//                 placeholder="Type a message..."
//                 {...register("comment", { required: "Comment is required" })}
//               />
//             )}
//             {step === 1 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media1", { validate: validateFiles })}
//               />
//             )}
//             {step === 2 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media2", { validate: validateFiles })}
//               />
//             )}
//             {step === 3 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media3", { validate: validateFiles })}
//               />
//             )}
//             <div className="emoji">
//               <img src="./emoji.png" alt="Emoji Picker" onClick={() => setOpenEmoji(!openEmoji)} />
//               {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
//             </div>
//             <div className="input-buttons">
//               {step < 3 && <button type="button" onClick={handleNextStep}>Next</button>}
//               {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
//             </div>
//             <button className="SendButton" type="submit">Send</button>
//           </form>
//         ) : (
//           <form className="bottom_presentation" onSubmit={handleSubmit(handleSendChat)} noValidate>
//             {step === 0 && (
//               <input
//                 type="text"
//                 placeholder="Enter Title"
//                 {...register("title", { required: "Title is required" })}
//               />
//             )}
//             {step === 1 && (
//               <input
//                 type="text"
//                 placeholder="Enter Summary"
//                 {...register("summary", { required: "Summary is required" })}
//               />
//             )}
//             {step === 2 && (
//               <input
//                 type="text"
//                 placeholder="Enter Audience"
//                 {...register("audience", { required: "Audience is required" })}
//               />
//             )}
//             {step === 3 && (
//               <textarea
//                 placeholder="Enter Main Text"
//                 {...register("text", { required: "Main text is required" })}
//               />
//             )}
//             {step === 4 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media1", { validate: validateFiles })}
//               />
//             )}
//             {step === 5 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media2", { validate: validateFiles })}
//               />
//             )}
//             {step === 6 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media3", { validate: validateFiles })}
//               />
//             )}
//             <div className="icons">
//               <img src="./img.png" alt="Upload" />
//               <img src="./camera.png" alt="Camera" />
//               <img src="./mic.png" alt="Mic" />
//             </div>
//             <div className="input-buttons">
//               {step < 6 && <button type="button" onClick={handleNextStep}>Next</button>}
//               {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
//             </div>
//             <button className="SendButton" style={{ width: '10wv' }} type="submit">Send</button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Chat;




  return (
    <div className="chat_container" style={{border:"3px solid red"}}>
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="Avatar" />
        </div>
        <div className="texts">
          <span>{activeContent?.user_id || "Admin"}</span>
          <p>{activeContent?.title || activeContent?.topic}</p>
          <span className="content-id">ID: {getContentIdentifier(activeContent)}</span>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone" />
          <img src="./video.png" alt="Video" />
          <img src="./info.png" alt="Info" />
        </div>
      </div>

      <div className="center" style={{border:"3px solid yellow"}}>
        <div className="message-heading" style={{border:"5px solid brown"}}>
          <div className="content-header">
            <span className="content-type-badge">
              {activeContent?.content_type || activeItem?.type || 'content'}
            </span>
            <span className="content-id-display">
              {getContentIdentifier(activeContent)}
            </span>
          </div>
          
          <h3>Topic: {activeContent?.topic || activeContent?.title}</h3>
          <p>Descr: {activeContent?.description || activeContent?.summary}</p>
          <p>Subject: {activeContent?.subjectMatter}</p>
          
          <div style={{border:"5px solid blue", display:"flex", direction:"row", gap:"10px"}}>
            <p>Lesson #: {activeContent?.lessonNumber || activeContent?.id}</p>
            <p>Audience: {activeContent?.audience}</p>
            <p>Created By: {activeContent?.user_id}</p>
          </div>
          <p>Posted: {new Date(activeContent?.createdAt || activeContent?.createdAt || Date.now()).toLocaleString()}</p>
        </div>

        <div className="texts" style={{border:"5px solid green"}}>
          <p>{sanitizeMessage(activeContent?.text || activeContent?.content || "No content available")}</p>
          <span>Updated: {new Date(activeContent?.updatedAt || activeContent?.createdAt || activeContent?.createdAt).toLocaleString()}</span>
        </div>
          
        <div className="media-container" style={{border:"5px solid gray"}}>
          {/* Render all media for the active content */}
          {renderMedia(activeContent?.media_url1, activeContent?.media_type1, "Media 1")}
          {renderMedia(activeContent?.media_url2, activeContent?.media_type2, "Media 2")}
          {renderMedia(activeContent?.media_url3, activeContent?.media_type3, "Media 3")}
        </div>

        {/* Comments Section */}
        <div className="comments-section" style={{border:"5px solid purple"}}>
          <h4>Comments</h4>
          {isLoadingComments ? (
            <p>Loading comments...</p>
          ) : (
            fetchedComments?.comments
              ?.filter((comment) => {
                // Filter comments based on both prefixed_id and numeric id
                const contentId = activeContent?.id || activeItem?.id;
                const contentType = activeContent?.content_type || activeItem?.type;
                
                if (contentType === "chat") {
                  return comment.chat_id === contentId;
                } else if (contentType === "teaching") {
                  return comment.teaching_id === contentId;
                }
                return false;
              })
              .map((comment) => (
                <div key={comment.id} className="message Own" style={{border:"5px solid pink"}}>
                  <div className="texts" style={{border:"5px solid magenta"}}>
                    <p>{sanitizeMessage(comment.comment)}</p>
                    <span>By: {comment.user_id}</span>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="media-container-comments" style={{border:"5px solid orange"}}>
                    {renderMedia(comment.media_url1, comment.media_type1, "Comment Media 1")}
                    {renderMedia(comment.media_url2, comment.media_type2, "Comment Media 2")}
                    {renderMedia(comment.media_url3, comment.media_type3, "Comment Media 3")}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="bottom">
        <div className="toggle_buttons">
          <button className={!addMode ? 'active' : ''} onClick={() => setAddMode(false)}>Comment</button>
          <button className={addMode ? 'active' : ''} onClick={() => setAddMode(true)}>Start New Chat</button>
        </div>

        {!addMode ? (
          <form className="bottom_comment" onSubmit={handleSubmit(handleSendComment)} noValidate>
            <div className="step-indicator">
              Step {step + 1} of 4: {['Comment', 'Media 1', 'Media 2', 'Media 3'][step]}
            </div>
            
            <div className="icons">
              <img src="./img.png" alt="Upload" />
              <img src="./camera.png" alt="Camera" />
              <img src="./mic.png" alt="Mic" />
            </div>
            
            {step === 0 && (
              <input
                type="text"
                placeholder="Type a message..."
                {...register("comment", { required: "Comment is required" })}
              />
            )}
            {step === 1 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media1", { validate: validateFiles })}
              />
            )}
            {step === 2 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media2", { validate: validateFiles })}
              />
            )}
            {step === 3 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media3", { validate: validateFiles })}
              />
            )}
            
            <div className="emoji">
              <img src="./emoji.png" alt="Emoji Picker" onClick={() => setOpenEmoji(!openEmoji)} />
              {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
            </div>
            
            <div className="input-buttons">
              {step < 3 && <button type="button" onClick={handleNextStep}>Next</button>}
              {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
            </div>
            <button className="SendButton" type="submit">Send Comment</button>
          </form>
        ) : (
          <form className="bottom_presentation" onSubmit={handleSubmit(handleSendChat)} noValidate>
            <div className="step-indicator">
              Step {step + 1} of 7: {['Title', 'Summary', 'Audience', 'Content', 'Media 1', 'Media 2', 'Media 3'][step]}
            </div>
            
            {step === 0 && (
              <input
                type="text"
                placeholder="Enter Title"
                {...register("title", { required: "Title is required" })}
              />
            )}
            {step === 1 && (
              <input
                type="text"
                placeholder="Enter Summary"
                {...register("summary", { required: "Summary is required" })}
              />
            )}
            {step === 2 && (
              <input
                type="text"
                placeholder="Enter Audience"
                {...register("audience", { required: "Audience is required" })}
              />
            )}
            {step === 3 && (
              <textarea
                placeholder="Enter Main Text"
                rows="4"
                {...register("text", { required: "Main text is required" })}
              />
            )}
            {step === 4 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media1", { validate: validateFiles })}
              />
            )}
            {step === 5 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media2", { validate: validateFiles })}
              />
            )}
            {step === 6 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media3", { validate: validateFiles })}
              />
            )}
            
            <div className="icons">
              <img src="./img.png" alt="Upload" />
              <img src="./camera.png" alt="Camera" />
              <img src="./mic.png" alt="Mic" />
            </div>
            
            <div className="input-buttons">
              {step < 6 && <button type="button" onClick={handleNextStep}>Next</button>}
              {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
            </div>
            <button className="SendButton" type="submit">Create Chat</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;