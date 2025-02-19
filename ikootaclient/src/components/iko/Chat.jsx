import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../hooks/useUpload";
import EmojiPicker from "emoji-picker-react";
import DOMPurify from "dompurify";
import ReactPlayer from "react-player";
import "./chat.css";
import { useFetchParentChatsAndTeachingsWithComments } from "../service/useFetchComments";
import { useFetchChats } from "../service/useFetchChats";
import { useFetchComments } from "../service/useFetchComments";
import { useFetchTeachings } from "../service/useFetchTeachings";
import { postComment } from "../service/commentServices";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import MediaGallery from "./MediaGallery"; // Import MediaGallery Component
import { useUploadCommentFiles } from "../../hooks/useUploadCommentFiles";


const Chat = ({ activeItem, chats, teachings }) => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");
  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");
  const uploadCommentFiles = useUploadCommentFiles(); // Use the hook

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  ///const { data: fetchedData, isLoading: isLoadingComments } = useFetchComments(user_id);

  const { data: fetchedComments, isLoading: isLoadingComments } = useFetchParentChatsAndTeachingsWithComments(activeItem?.user_id);
  console.log("this is the data we're looking for ", fetchedComments )
  const [formData, setFormData] = useState({});
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [step, setStep] = useState(0);
  const [playingMedia, setPlayingMedia] = useState(null);

  const activeContent =
    activeItem && activeItem.type === "chat"
      ? chats.find((chat) => chat.id === activeItem.id)
      : activeItem
      ? teachings.find((teaching) => teaching.id === activeItem.id)
      : null;

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
      onSuccess: () => {
        // console.log("Chat sent!");
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
      user_id = jwtDecode(token).user_id;
    } else {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (tokenCookie) {
        user_id = jwtDecode(tokenCookie.split("=")[1]).user_id;
      } else {
        console.error("Access token not found");
        return;
      }

      
    const files = [data.media1, data.media2, data.media3].filter(Boolean).flat();
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

  
  return (
    <div className="chat_container">
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="Avatar" />
        </div>
        <div className="texts">
          <span>{activeContent?.created_by || "Admin"}</span>
          <p>{activeContent?.title || activeContent?.topic}</p>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone" />
          <img src="./video.png" alt="Video" />
          <img src="./info.png" alt="Info" />
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
          fetchedComments?.comments
            ?.filter(
              (comment) =>
                (activeItem?.type === "chat" && comment.chat_id === activeItem?.id) ||
                (activeItem?.type === "teaching" && comment.teaching_id === activeItem?.id)
            )
            .map((comment) => (
              <div key={comment.id} className="message Own">
                <div className="texts">
                  <p>{sanitizeMessage(comment.comment)}</p>
                  <span>{new Date(comment.created_at).toLocaleString()}</span>
                  <MediaGallery
                    mediaFiles={[
                      { url: comment.media_url1, type: comment.media_type1 },
                      { url: comment.media_url2, type: comment.media_type2 },
                      { url: comment.media_url3, type: comment.media_type3 },
                    ].filter((media) => media.url)}
                  />
                </div>
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

