import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../admin/hooks/useUpload";
import EmojiPicker from 'emoji-picker-react';
import DOMPurify from 'dompurify';
import './chat.css';
import { useFetchChats } from "../service/useFetchChats";
import { useFetchComments } from "../service/useFetchComments";
import { useFetchTeachings } from "../service/useFetchTeachings";
import { postComment } from '../service/commentServices';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const Chat = ({ activeItem, chats, teachings }) => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");
  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");

  const { data: comments, isLoading: isLoadingComments } = useFetchComments(activeItem);

  const [formData, setFormData] = useState({});
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [step, setStep] = useState(0); // Tracks current step in multi-input

  const activeContent = activeItem && activeItem.type === 'chat'
    ? chats.find(chat => chat.id === activeItem.id)
    : activeItem && teachings.find(teaching => teaching.id === activeItem.id);

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
    let user_id;

    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      user_id = decodedToken.user_id;
    } else {
      const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('access_token='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        const decodedToken = jwtDecode(token);
        user_id = decodedToken.user_id;
      } else {
        console.error("Access token not found in localStorage or cookies");
        return;
      }
      console.log('user_id@chat', user_id);
    }

    const formData = new FormData();
    formData.append("comment", data.comment);
    formData.append(activeItem.type === 'chat' ? "chat_id" : "teaching_id", activeItem.id);
    formData.append("user_id", user_id);
    console.log('data at formdat@chat', data);
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
          chat_id: activeItem.type === 'chat' ? activeItem.id : null,
          teaching_id: activeItem.type === 'teaching' ? activeItem.id : null,
          user_id,
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

  return (
    <div className="chat_container">
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="" />
        </div>
        <div className="texts">
          <span>{activeContent?.created_by || 'Admin'}</span>
          <p>{activeContent?.title || activeContent?.topic}</p>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">
        <div className="message">
          <img src="./avatar.png" alt="Chat Avatar" />
          <div className="texts">
            <p>{sanitizeMessage(activeContent?.text || activeContent?.content)}</p>
            <span>{new Date(activeContent?.created_at || activeContent?.createdAt).toLocaleString()}</span>
          </div>
        </div>
        {isLoadingComments ? (
        <p>Loading comments...</p>
      ) : (
        comments?.filter(comment => comment.chat_id === activeItem.id || comment.teaching_id === activeItem.id).map((comment) => (
          <div key={comment.id} className="message Own">
            <div className="texts">
              <p>{sanitizeMessage(comment.comment)}</p>
              <span>{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <div>comment.media_url1</div>
          {comment.media_url1 && comment.media_type1.startsWith('image') && (
            <img src={comment.media_url1} alt="comment media" />
          )}
          {comment.media_url1 && comment.media_type1.startsWith('video') && (
            <video controls>
              <source src={comment.media_url1} type={comment.media_type1} />
              Your browser does not support the video tag.
            </video>
          )}
          {comment.media_url1 && comment.media_type1.startsWith('audio') && (
            <audio controls>
              <source src={comment.media_url1} type={comment.media_type1} />
              Your browser does not support the audio element.
            </audio>
          )}

          {comment.media_url2 && comment.media_type2.startsWith('image') && (
            <img src={comment.media_url2} alt="comment media" />
          )}
          {comment.media_url2 && comment.media_type2.startsWith('video') && (
            <video controls>
              <source src={comment.media_url2} type={comment.media_type2} />
              Your browser does not support the video tag.
            </video>
          )}
          {comment.media_url2 && comment.media_type2.startsWith('audio') && (
            <audio controls>
              <source src={comment.media_url2} type={comment.media_type2} />
              Your browser does not support the audio element.
            </audio>
          )}

          {comment.media_url3 && comment.media_type3.startsWith('image') && (
            <img src={comment.media_url3} alt="comment media" />
          )}
          {comment.media_url3 && comment.media_type3.startsWith('video') && (
            <video controls>
              <source src={comment.media_url3} type={comment.media_type3} />
              Your browser does not support the video tag.
            </video>
          )}
          {comment.media_url3 && comment.media_type3.startsWith('audio') && (
            <audio controls>
              <source src={comment.media_url3} type={comment.media_type3} />
              Your browser does not support the audio element.
            </audio>
          )}
          </div>
        ))
      )}
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