//ikootaclient\src\components\iko\Chat.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../hooks/useUpload";
import EmojiPicker from "emoji-picker-react";
import DOMPurify from "dompurify";
import ReactPlayer from "react-player";
import "./chat.css";
import { useFetchParentChatsAndTeachingsWithComments } from "../service/useFetchComments";
import { jwtDecode } from "jwt-decode";
import MediaGallery from "./MediaGallery";
import { useUploadCommentFiles } from "../../hooks/useUploadCommentFiles";
import { postComment } from "../service/commentServices";
import { useQueries, Mutation } from "@tanstack/react-query"

const Chat = ({ activeItem, chats = [], teachings = [] }) => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");
  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");
  const uploadCommentFiles = useUploadCommentFiles();

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  const { data: fetchedComments, isLoading: isLoadingComments } = useFetchParentChatsAndTeachingsWithComments(activeItem?.user_id);
  
  const [formData, setFormData] = useState({});
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [step, setStep] = useState(0);
  const [playingMedia, setPlayingMedia] = useState(null);

  // Simple activeContent finder with proper error handling
  const findActiveContent = () => {
    if (!activeItem) {
      console.log('No active item provided');
      return null;
    }

    try {
      // Make sure chats and teachings are arrays
      const chatsArray = Array.isArray(chats) ? chats : [];
      const teachingsArray = Array.isArray(teachings) ? teachings : [];

      console.log('Finding content for:', activeItem);
      console.log('Chats available:', chatsArray.length);
      console.log('Teachings available:', teachingsArray.length);

      // Try to find by prefixed_id first
      if (activeItem.prefixed_id) {
        if (activeItem.prefixed_id.startsWith('c') || activeItem.type === "chat") {
          const foundChat = chatsArray.find((chat) => 
            chat.prefixed_id === activeItem.prefixed_id || 
            chat.id === activeItem.id ||
            chat.updatedAt === activeItem.updatedAt
          );
          if (foundChat) {
            console.log('Found chat:', foundChat);
            return foundChat;
          }
        } else if (activeItem.prefixed_id.startsWith('t') || activeItem.type === "teaching") {
          const foundTeaching = teachingsArray.find((teaching) => 
            teaching.prefixed_id === activeItem.prefixed_id || 
            teaching.id === activeItem.id ||
            teaching.updatedAt === activeItem.updatedAt
          );
          if (foundTeaching) {
            console.log('Found teaching:', foundTeaching);
            return foundTeaching;
          }
        }
      }

      // Fallback to original method
      if (activeItem.type === "chat") {
        const foundChat = chatsArray.find((chat) => 
          chat.updatedAt === activeItem.updatedAt || 
          chat.id === activeItem.id
        );
        if (foundChat) {
          console.log('Found chat by fallback:', foundChat);
          return foundChat;
        }
      } else if (activeItem.type === "teaching") {
        const foundTeaching = teachingsArray.find((teaching) => 
          teaching.updatedAt === activeItem.updatedAt || 
          teaching.id === activeItem.id
        );
        if (foundTeaching) {
          console.log('Found teaching by fallback:', foundTeaching);
          return foundTeaching;
        }
      }

      // Last resort - return activeItem itself if it has content
      if (activeItem.title || activeItem.topic || activeItem.content || activeItem.text) {
        console.log('Using activeItem as content:', activeItem);
        return activeItem;
      }

      console.log('No content found for activeItem:', activeItem);
      return null;

    } catch (error) {
      console.error('Error in findActiveContent:', error);
      return null;
    }
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
    if (!message) return "";
    return DOMPurify.sanitize(message, { ALLOWED_TAGS: ["b", "i", "em", "strong", "a"] });
  };

  const handleSendChat = (data) => {
    const formData = new FormData();
    formData.append("created_by", user_id || "anonymous");
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
        setStep(0);
        alert("Chat created successfully!");
      },
      onError: (error) => {
        console.error("Error uploading chat:", error);
        alert("Error creating chat. Please try again.");
      },
    });
  };

  const handleSendComment = async (data) => {
    try {
      if (!user_id) {
        alert("Please log in to comment");
        return;
      }

      const contentId = activeContent?.id || activeItem?.id;
      const contentType = activeContent?.content_type || activeContent?.type || activeItem?.type;

      if (!contentId || !contentType) {
        console.error("Missing content ID or type");
        alert("Error: Unable to identify content");
        return;
      }

      const files = [data.media1, data.media2, data.media3].filter(Boolean).flat();
      let mediaData = [];
      
      if (files.length > 0) {
        try {
          const uploadResponse = await uploadCommentFiles.mutateAsync(files);
          mediaData = uploadResponse.map((file) => ({
            url: file.url,
            type: file.type,
          }));
        } catch (error) {
          console.error("Error uploading media:", error);
        }
      }

      const formData = new FormData();
      formData.append("comment", data.comment);
      formData.append(contentType === "chat" ? "chat_id" : "teaching_id", contentId);
      formData.append("user_id", user_id);

      ["media1", "media2", "media3"].forEach((file) => {
        if (data[file]?.[0]) {
          formData.append(file, data[file][0]);
        }
      });

      const uploadResponse = await commentMutation.mutateAsync(formData);
      
      const commentData = {
        user_id,
        comment: data.comment,
        media: mediaData,
      };

      if (contentType === "chat") {
        commentData.chat_id = contentId;
      } else if (contentType === "teaching") {
        commentData.teaching_id = contentId;
      }

      await postComment(commentData);
      
      reset();
      setStep(0);
      alert("Comment posted successfully!");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Error posting comment. Please try again.");
    }
  };

  const handleMediaClick = (url) => {
    setPlayingMedia(url);
  };

  // Helper function to render media based on type and URL
  const renderMedia = (url, type, alt = "media") => {
    if (!url || !type) return null;

    switch (type) {
      case "image":
        return <img src={url} alt={alt} width="100%" style={{ maxHeight: "300px", objectFit: "contain" }} onClick={() => handleMediaClick(url)} />;
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
    if (!content) return 'Unknown';
    return content.prefixed_id || `${content.content_type || content.type || 'item'}${content.id}` || 'Unknown';
  };

  return (
    <div className="chat_container" style={{border:"3px solid red"}}>
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="Avatar" />
        </div>
        <div className="texts">
          <span>{activeContent?.user_id || activeContent?.created_by || "Admin"}</span>
          <p>{activeContent?.title || activeContent?.topic || "No title"}</p>
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
              {activeContent?.content_type || activeContent?.type || activeItem?.type || 'content'}
            </span>
            <span className="content-id-display">
              {getContentIdentifier(activeContent)}
            </span>
          </div>
          
          <h3>Topic: {activeContent?.topic || activeContent?.title || "No topic"}</h3>
          <p>Descr: {activeContent?.description || activeContent?.summary || "No description"}</p>
          {activeContent?.subjectMatter && <p>Subject: {activeContent.subjectMatter}</p>}
          
          <div style={{border:"5px solid blue", display:"flex", flexDirection:"row", gap:"10px"}}>
            <p>Lesson #: {activeContent?.lessonNumber || activeContent?.id}</p>
            <p>Audience: {activeContent?.audience || "General"}</p>
            <p>Created By: {activeContent?.user_id || activeContent?.created_by || "Admin"}</p>
          </div>
          <p>Posted: {activeContent?.createdAt ? new Date(activeContent.createdAt).toLocaleString() : "Unknown date"}</p>
        </div>

        <div className="texts" style={{border:"5px solid green"}}>
          <p>{sanitizeMessage(activeContent?.text || activeContent?.content || "No content available")}</p>
          <span>Updated: {activeContent?.updatedAt ? new Date(activeContent.updatedAt).toLocaleString() : "Unknown date"}</span>
        </div>
          
        <div className="media-container" style={{border:"5px solid gray"}}>
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
            fetchedComments?.comments && Array.isArray(fetchedComments.comments) ? (
              fetchedComments.comments
                .filter((comment) => {
                  const contentId = activeContent?.id || activeItem?.id;
                  const contentType = activeContent?.content_type || activeContent?.type || activeItem?.type;
                  
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
                      <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown date"}</span>
                    </div>
                    <div className="media-container-comments" style={{border:"5px solid orange"}}>
                      {renderMedia(comment.media_url1, comment.media_type1, "Comment Media 1")}
                      {renderMedia(comment.media_url2, comment.media_type2, "Comment Media 2")}
                      {renderMedia(comment.media_url3, comment.media_type3, "Comment Media 3")}
                    </div>
                  </div>
                ))
            ) : (
              <p>No comments available</p>
            )
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