import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../admin/hooks/useUpload";
import EmojiPicker from 'emoji-picker-react';
import DOMPurify from 'dompurify';
import './chat.css';
import { useFetchChats } from "../service/useFetchChats";
import { useFetchComments } from "../service/useFetchComments";
import { postComment } from '../service/commentServices';
import {jwtDecode} from 'jwt-decode';
 
  
  const Chat = () => {
    const { handleSubmit, register, reset } = useForm();
    const { validateFiles, mutation: chatMutation } = useUpload("/chats");
    const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");
    const { data: chats, isLoading: isLoadingChats, error: errorChats } = useFetchChats();
    const { data: comments, isLoading: isLoadingComments, error: errorComments } = useFetchComments();
    const [openEmoji, setOpenEmoji] = useState(false);
    const [addMode, setAddMode] = useState(false);
    const [step, setStep] = useState(0); // Tracks current step in multi-input
  
    const handleNextStep = () => {
      if (step < 6) setStep(step + 1);
    };
  
    const handlePrevStep = () => {
      if (step > 0) setStep(step - 1);
    };
  
    const handleEmoji = (e) => {
      setFormData({ ...formData, comment: formData.comment + e.emoji });
      setOpenEmoji(false);
    };
  
    const sanitizeMessage = (message) => {
      return DOMPurify.sanitize(message, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'] });
    };
  
    const handleSendChat = (data) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("audience", data.audience);
      formData.append("summary", data.summary);
      formData.append("text", data.text);
  
      ["media1", "media2", "media3"].forEach((file) => {
        if (data[file]?.[0]) {
          formData.append(file, data[file][0]);
        }
      });
  
      chatMutation.mutate(formData, {
        onSuccess: () => {
          console.log("Chat sent!");
          reset();
        },
        onError: (error) => {
          console.error("Error uploading chat:", error);
        },
      });
    };
  
    const handleSendComment = async (data) => {
      const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('access_token='));
      if (!tokenCookie) {
        console.error("Access token not found in cookies");
        return;
      }
      const token = tokenCookie.split('=')[1];
       const decodedToken = jwtDecode(token);
      // const decodedToken = decode(token);
      const userId = decodedToken.id;
  
      const formData = new FormData();
      formData.append("comment", data.comment);
      formData.append("chat_id", data.chatId);
      formData.append("user_id", userId);
  
      ["media1", "media2", "media3"].forEach((file) => {
        if (data[file]?.[0]) {
          formData.append(file, data[file][0]);
        }
      });
  
      commentMutation.mutate(formData, {
        onSuccess: async (uploadResponse) => {
          const { mediaUrls } = uploadResponse.data; // Ensure backend returns uploaded media URLs
          const mediaData = mediaUrls.map((url, index) => ({
            url,
            type: data[`media${index + 1}`]?.[0]?.type || "unknown",
          }));
  
          await postComment({
            chatId: data.chatId,
            userId,
            comment: data.comment,
            mediaData,
          });
          alert("Comment posted successfully!");
          reset();
        },
        onError: (error) => {
          console.error("Error uploading comment:", error);
        },
      });
    };
  // Loading and error states
  // if (isLoadingChats || isLoadingComments) return <p className="status loading">Loading...</p>;
  // if (errorChats || errorComments) return <p className="status error">Error loading data!</p>;

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
      {chats?.map((chat) => (
          <div key={chat.id} className="message">
            <img src="./avatar.png" alt="Chat Avatar" />
            <div className="texts">
              <p>{sanitizeMessage(chat.text)}</p>
              <span>1 min ago</span>
            </div>
          </div>
        ))}
        {comments?.map((comment) => (
          <div key={comment.id} className="message Own">
            <div className="texts">
              <p>{sanitizeMessage(comment.comment)}</p>
              <span>2 mins ago</span>
            </div>
          </div>
        ))}
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
          <form className="bottom_comment" onSubmit={handleSubmit(handleSendComment)} noValidate>
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
                {...register("media1", { validate: validateFiles })}
              />
            )}
            {step === 2 && (
              <input
                type="file"
                multiple
                {...register("media2", { validate: validateFiles })}
              />
            )}
            {step === 3 && (
              <input
                type="file"
                multiple
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
            <button className="SendButton" type="submit">Send</button>
          </form>
        ) : (
          <form className="bottom_presentation" onSubmit={handleSubmit(handleSendChat)} noValidate>
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
                {...register("text", { required: "Main text is required" })}
              />
            )}
            {step === 4 && (
              <input
                type="file"
                multiple
                {...register("media1", { validate: validateFiles })}
              />
            )}
            {step === 5 && (
              <input
                type="file"
                multiple
                {...register("media2", { validate: validateFiles })}
              />
            )}
            {step === 6 && (
              <input
                type="file"
                multiple
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
            <button className="SendButton" style={{ width: '10wv' }} type="submit">Send</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;