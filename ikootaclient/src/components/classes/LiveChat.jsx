// LiveChat.jsx - Advanced classroom chat with reactions, file sharing, and moderation
// Designed to work seamlessly with existing ClassroomVideoViewer

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Smile, Paperclip, Image, Mic, Video,
  ThumbsUp, Heart, Star, Flag, MoreVertical,
  Download, Trash2, Edit, Pin, Reply
} from 'lucide-react';
import { useUser } from '../auth/UserStatus';
import { getSecureDisplayName, getFullConverseId, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';
import './LiveChat.css';

const LiveChat = ({
  socket,
  classId,
  messages = [],
  onSendMessage,
  isConnected = false,
  isLoading = false,
  currentUser,
  isLiveSession = false
}) => {
  // Use currentUser passed as prop, fallback to useUser hook
  const { user: authUser } = useUser();
  const user = currentUser || authUser;

  // Determine user role based on user data
  const userRole = user?.role || user?.user_role || 'student';
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emoji reactions
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

  // Enhanced message types
  const messageTypes = {
    TEXT: 'text',
    FILE: 'file',
    IMAGE: 'image',
    AUDIO: 'audio',
    ANNOUNCEMENT: 'announcement',
    SYSTEM: 'system'
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data) => {
      if (data.classId === classId && data.from !== user?.user_id) {
        setTypingUsers(prev => new Set([...prev, data.fromUsername]));

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.fromUsername);
            return newSet;
          });
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.classId === classId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.fromUsername);
          return newSet;
        });
      }
    };

    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket, classId, user]);

  // Handle typing indicators
  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);

    if (!socket || !isConnected) return;

    // Send typing indicator
    socket.emit('typing', {
      room: `classroom_${classId}`,
      classId,
      from: user?.user_id,
      fromConverseId: getFullConverseId(user)
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        room: `classroom_${classId}`,
        classId,
        from: user?.user_id,
        fromConverseId: getFullConverseId(user)
      });
    }, 1000);
  }, [socket, isConnected, classId, user]);

  // Send message with enhancements
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();

    if ((!message.trim() && !selectedFile) || !isConnected) return;

    const messageData = {
      id: Date.now().toString(),
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? messageTypes.IMAGE : messageTypes.FILE) : messageTypes.TEXT,
      message: message.trim(),
      classId,
      room: `classroom_${classId}`,
      timestamp: new Date().toISOString(),
      file: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: null // Will be set after upload
      } : null,
      replyTo: replyToMessage?.id || null,
      editId: editingMessage?.id || null
    };

    try {
      // Handle file upload if present
      if (selectedFile) {
        await handleFileUpload(selectedFile, messageData);
      }

      // Send via callback or socket
      if (onSendMessage) {
        await onSendMessage(messageData);
      } else if (socket) {
        socket.emit('sendMessage', messageData);
      }

      // Reset form
      setMessage('');
      setSelectedFile(null);
      setReplyToMessage(null);
      setEditingMessage(null);

      // Clear typing indicator
      if (socket) {
        socket.emit('stopTyping', {
          room: `classroom_${classId}`,
          classId
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  }, [message, selectedFile, isConnected, classId, replyToMessage, editingMessage, onSendMessage, socket]);

  // File upload handler
  const handleFileUpload = async (file, messageData) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat_attachment');
    formData.append('classId', classId);

    try {
      // Upload to server (using existing API)
      const response = await fetch(`/api/classes/${classId}/chat/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        messageData.file.url = result.fileUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  };

  // Audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (error) {
      console.error('Audio recording failed:', error);
      alert('Failed to start audio recording');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  // Message reactions
  const handleReaction = (messageId, reaction) => {
    if (!socket || !isConnected) return;

    socket.emit('messageReaction', {
      messageId,
      reaction,
      classId,
      room: `classroom_${classId}`,
      userId: user?.user_id,
      converseId: getFullConverseId(user)
    });
  };

  // Message moderation
  const handleDeleteMessage = (messageId) => {
    if (!socket || !isConnected) return;

    socket.emit('deleteMessage', {
      messageId,
      classId,
      room: `classroom_${classId}`,
      moderatorId: user?.user_id
    });
  };

  const handlePinMessage = (message) => {
    if (!socket || !isConnected) return;

    socket.emit('pinMessage', {
      messageId: message.id,
      classId,
      room: `classroom_${classId}`,
      message: message.message,
      author: message.author
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render message content based on type
  const renderMessageContent = (msg) => {
    switch (msg.type) {
      case messageTypes.FILE:
        return (
          <div className="file-message">
            <div className="file-info">
              <Paperclip size={16} />
              <span className="file-name">{msg.file?.name}</span>
              <span className="file-size">({formatFileSize(msg.file?.size || 0)})</span>
            </div>
            {msg.file?.url && (
              <a href={msg.file.url} download className="download-btn">
                <Download size={14} /> Download
              </a>
            )}
          </div>
        );

      case messageTypes.IMAGE:
        return (
          <div className="image-message">
            {msg.file?.url && (
              <img
                src={msg.file.url}
                alt={msg.file?.name}
                className="chat-image"
                loading="lazy"
              />
            )}
            {msg.message && <p className="image-caption">{msg.message}</p>}
          </div>
        );

      case messageTypes.AUDIO:
        return (
          <div className="audio-message">
            <audio controls src={msg.file?.url} className="chat-audio">
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case messageTypes.ANNOUNCEMENT:
        return (
          <div className="announcement-message">
            📢 {msg.message}
          </div>
        );

      default:
        return <div className="text-message">{msg.message}</div>;
    }
  };

  return (
    <div className="live-chat">
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="pinned-messages">
          <h4>📌 Pinned Messages</h4>
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="pinned-message">
              <span className="pinned-author">{msg.author}:</span>
              <span className="pinned-content">{msg.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {isLoading && messages.length === 0 ? (
          <div className="chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <span className="empty-icon">💬</span>
            <p>No messages yet</p>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.type || 'text'} ${msg.isRealtime ? 'realtime' : ''}`}>
              {/* Reply indicator */}
              {msg.replyTo && (
                <div className="reply-indicator">
                  <Reply size={12} />
                  Replying to message
                </div>
              )}

              <div className="message-header">
                <span className="message-author">
                  {msg.author_converse_id || msg.author || 'Unknown'}
                </span>
                <span className="message-time">
                  {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}
                </span>
                {msg.isRealtime && <span className="realtime-badge">🔴</span>}

                {/* Message actions */}
                {(userRole === 'admin' || userRole === 'instructor' || msg.author === getFullConverseId(user)) && (
                  <div className="message-actions">
                    <button onClick={() => setReplyToMessage(msg)} title="Reply">
                      <Reply size={12} />
                    </button>
                    {userRole === 'admin' || userRole === 'instructor' ? (
                      <>
                        <button onClick={() => handlePinMessage(msg)} title="Pin">
                          <Pin size={12} />
                        </button>
                        <button onClick={() => handleDeleteMessage(msg.id)} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : msg.author === getFullConverseId(user) && (
                      <button onClick={() => setEditingMessage(msg)} title="Edit">
                        <Edit size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="message-content">
                {renderMessageContent(msg)}
              </div>

              {/* Message reactions */}
              <div className="message-reactions">
                {reactions.map(reaction => (
                  <button
                    key={reaction}
                    className="reaction-btn"
                    onClick={() => handleReaction(msg.id, reaction)}
                  >
                    {reaction}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div className="typing-indicators">
            <span className="typing-text">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Reply/Edit indicator */}
      {(replyToMessage || editingMessage) && (
        <div className="reply-edit-indicator">
          <span>
            {replyToMessage ? 'Replying to' : 'Editing'}: {(replyToMessage || editingMessage)?.message}
          </span>
          <button onClick={() => { setReplyToMessage(null); setEditingMessage(null); }}>
            ✕
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="file-preview">
          <div className="file-info">
            {selectedFile.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="preview-image" />
            ) : (
              <div className="file-icon">
                <Paperclip />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
          <button onClick={() => setSelectedFile(null)} className="remove-file">✕</button>
        </div>
      )}

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="input-toolbar">
          {/* File attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          {/* Image attachment */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!isConnected}
            title="Attach image"
          >
            <Image size={18} />
          </button>

          {/* Audio recording */}
          <button
            type="button"
            onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
            disabled={!isConnected}
            className={isRecordingAudio ? 'recording' : ''}
            title={isRecordingAudio ? 'Stop recording' : 'Record audio'}
          >
            <Mic size={18} />
          </button>

          {/* Emoji picker toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!isConnected}
            title="Add emoji"
          >
            <Smile size={18} />
          </button>
        </div>

        <div className="input-container">
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={handleInputChange}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            rows="1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || !isConnected}
            className="send-btn"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Connection status */}
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ display: 'none' }}
          accept="*/*"
        />
        <input
          ref={imageInputRef}
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ display: 'none' }}
          accept="image/*"
        />
      </form>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          {reactions.map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                setMessage(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveChat;