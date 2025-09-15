// ikootaclient/src/components/classes/ClassroomVideoViewer.jsx
// CLASSROOM VIDEO PRESENTATION SYSTEM FOR LIVE AND RECORDED TEACHING
// Provides video streaming, live chat, attendance tracking, and interactive features

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './ClassroomVideoViewer.css';

const ClassroomVideoViewer = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Refs
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  // State
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [hasMarkedAttendance, setHasMarkedAttendance] = useState(false);

  // Helper function to normalize class ID
  const normalizeClassId = (id) => {
    if (!id) return null;
    try {
      let decoded = decodeURIComponent(id);
      if (decoded.includes('#')) {
        return decoded;
      } else if (decoded.length > 3) {
        const prefix = decoded.substring(0, 3);
        const suffix = decoded.substring(3);
        return `${prefix}#${suffix}`;
      }
      return decoded;
    } catch (error) {
      return id;
    }
  };

  const apiClassId = normalizeClassId(classId);

  // Fetch classroom session data
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['classroomSession', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${apiClassId}/classroom/session`);
      return data?.data || data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 30 * 1000, // Refresh every 30 seconds for live sessions
    refetchInterval: 30 * 1000
  });

  // Fetch live chat messages
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['classroomChat', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${apiClassId}/classroom/chat`);
      return data?.data || data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 5 * 1000, // Refresh every 5 seconds for chat
    refetchInterval: 5 * 1000
  });

  // Fetch participants list
  const { data: participantsData } = useQuery({
    queryKey: ['classroomParticipants', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${apiClassId}/classroom/participants`);
      return data?.data || data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      return await api.post(`/classes/${apiClassId}/classroom/chat`, {
        message,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries(['classroomChat']);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/classes/${apiClassId}/classroom/attendance`, {
        session_id: sessionData?.session_id || `session_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setHasMarkedAttendance(true);
      alert('Attendance marked successfully!');
    },
    onError: (error) => {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance');
    }
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatData]);

  // Video event handlers
  const handleVideoPlay = () => setIsVideoPlaying(true);
  const handleVideoPause = () => setIsVideoPlaying(false);
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Chat handlers
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendMessageMutation.mutate(chatMessage.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Video controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process data
  const session = sessionData || {};
  const messages = chatData || [];
  const participants = participantsData || [];
  const isLiveSession = session.is_live || session.status === 'live';
  const videoUrl = session.video_url || session.stream_url;

  // Loading state
  if (sessionLoading) {
    return (
      <div className="classroom-loading">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <h3>Loading classroom...</h3>
          <p>Preparing your learning environment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError || !session) {
    return (
      <div className="classroom-error">
        <div className="error-container">
          <div className="error-icon">📺</div>
          <h3>Classroom Not Available</h3>
          <p>{sessionError?.message || 'No active session found for this classroom'}</p>
          <button onClick={() => navigate(`/classes/${encodeURIComponent(apiClassId)}`)} className="btn-back">
            Back to Class
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-video-viewer">
      {/* Header */}
      <div className="classroom-header">
        <div className="header-left">
          <button onClick={() => navigate(`/classes/${encodeURIComponent(apiClassId)}`)} className="btn-back">
            ← Back to Class
          </button>
          <div className="session-info">
            <h1>{session.title || session.class_name || 'Classroom Session'}</h1>
            <div className="session-meta">
              <span className={`session-status ${isLiveSession ? 'live' : 'recorded'}`}>
                {isLiveSession ? '🔴 LIVE' : '📹 RECORDED'}
              </span>
              <span className="session-id">ID: {apiClassId}</span>
              <span className="participants-count">👥 {participants.length} online</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {!hasMarkedAttendance && (
            <button
              onClick={() => markAttendanceMutation.mutate()}
              className="btn-attendance"
              disabled={markAttendanceMutation.isLoading}
            >
              📅 Mark Attendance
            </button>
          )}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="btn-participants"
          >
            👥 Participants ({participants.length})
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="btn-toggle-chat"
          >
            💬 {showChat ? 'Hide' : 'Show'} Chat
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="classroom-main">
        {/* Video Area */}
        <div className="video-area">
          <div className="video-container">
            {videoUrl ? (
              <div className="video-wrapper">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="main-video"
                  poster={session.thumbnail_url}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Video Controls */}
                <div className="video-controls">
                  <button onClick={togglePlayPause} className="btn-play">
                    {isVideoPlaying ? '⏸️' : '▶️'}
                  </button>

                  <div className="progress-bar" onClick={handleSeek}>
                    <div
                      className="progress-fill"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    />
                  </div>

                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      setVolume(e.target.value);
                      if (videoRef.current) {
                        videoRef.current.volume = e.target.value;
                      }
                    }}
                    className="volume-slider"
                  />

                  <button onClick={toggleFullscreen} className="btn-fullscreen">
                    {isFullscreen ? '🗗' : '⛶'}
                  </button>
                </div>
              </div>
            ) : isLiveSession ? (
              <div className="stream-placeholder">
                <div className="stream-waiting">
                  <div className="waiting-icon">📡</div>
                  <h3>Waiting for live stream...</h3>
                  <p>The instructor will start the session shortly</p>
                  <div className="waiting-animation"></div>
                </div>
              </div>
            ) : (
              <div className="no-video">
                <div className="no-video-content">
                  <div className="no-video-icon">📺</div>
                  <h3>No video available</h3>
                  <p>This session doesn't have a video recording</p>
                </div>
              </div>
            )}
          </div>

          {/* Session Description */}
          {/* Session Description */}
          {session.description && (
            <div className="session-description">
              <h3>About this session</h3>
              <p>{session.description}</p>
            </div>
          )}

          {/* Session Announcements */}
          <div className="session-announcements">
            <div className="announcements-header">
              <h3>📢 Session Announcements</h3>
              {user?.role === 'admin' || user?.role === 'instructor' ? (
                <button
                  onClick={() => {
                    const announcement = prompt('Enter announcement:');
                    if (announcement) {
                      sendMessageMutation.mutate(`📢 ANNOUNCEMENT: ${announcement}`);
                    }
                  }}
                  className="btn-quick-announcement"
                >
                  ➕ Quick Announce
                </button>
              ) : null}
            </div>

            <div className="recent-announcements">
              {messages
                .filter(msg => msg.message?.startsWith('📢 ANNOUNCEMENT:'))
                .slice(-3)
                .map(announcement => (
                  <div key={announcement.id} className="announcement-banner">
                    <div className="announcement-content">
                      <span className="announcement-text">
                        {announcement.message?.replace('📢 ANNOUNCEMENT: ', '')}
                      </span>
                      <span className="announcement-time">
                        {new Date(announcement.timestamp || announcement.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}

              {!messages.some(msg => msg.message?.startsWith('📢 ANNOUNCEMENT:')) && (
                <div className="no-announcements">
                  <p>No announcements for this session yet.</p>
                  {user?.role === 'admin' || user?.role === 'instructor' ? (
                    <p>Use "Quick Announce" to share important updates with participants.</p>
                  ) : (
                    <p>Important updates will appear here during the session.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`classroom-sidebar ${showChat ? 'show-chat' : 'hide-chat'}`}>
          {/* Participants Panel */}
          {showParticipants && (
            <div className="participants-panel">
              <div className="panel-header">
                <h3>👥 Participants ({participants.length})</h3>
                <button onClick={() => setShowParticipants(false)} className="btn-close">✕</button>
              </div>
              <div className="participants-list">
                {participants.map(participant => (
                  <div key={participant.id} className="participant-item">
                    <div className="participant-avatar">
                      {participant.avatar_url && !participant.avatar_url.includes('avatar.png') ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="avatar-fallback" style={{ display: participant.avatar_url && !participant.avatar_url.includes('avatar.png') ? 'none' : 'flex' }}>
                        {(participant.converse_id || participant.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">
                        {participant.converse_id || participant.name || 'Unknown'}
                      </div>
                      <div className="participant-role">
                        {participant.role_in_class || 'Student'}
                      </div>
                    </div>
                    <div className={`participant-status ${participant.is_online ? 'online' : 'offline'}`}>
                      {participant.is_online ? '🟢' : '⚫'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="chat-panel">
              <div className="panel-header">
                <h3>💬 Live Chat</h3>
                {isLiveSession && <span className="live-indicator">🔴 LIVE</span>}
              </div>

              <div className="chat-messages">
                {chatLoading ? (
                  <div className="chat-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-chat">
                    <span className="empty-icon">💬</span>
                    <p>No messages yet</p>
                    <p>Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className="chat-message">
                      <div className="message-header">
                        <span className="message-author">
                          {message.author_converse_id || message.author || 'Unknown'}
                        </span>
                        <span className="message-time">
                          {new Date(message.timestamp || message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="message-content">
                        {message.message || message.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <div className="chat-input-container">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isLiveSession ? "Type a message..." : "Chat is available during live sessions"}
                    className="chat-input"
                    disabled={!isLiveSession || sendMessageMutation.isLoading}
                    rows="2"
                  />
                  <button
                    type="submit"
                    className="btn-send"
                    disabled={!chatMessage.trim() || !isLiveSession || sendMessageMutation.isLoading}
                  >
                    {sendMessageMutation.isLoading ? '⏳' : '📤'}
                  </button>
                </div>
                {!isLiveSession && (
                  <div className="chat-disabled-notice">
                    💡 Chat is only available during live sessions
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="classroom-footer">
        <div className="session-stats">
          <span>📊 Session: {session.session_number || 1}</span>
          <span>⏱️ Duration: {session.duration ? `${Math.round(session.duration / 60)} min` : 'Ongoing'}</span>
          <span>👥 Participants: {participants.length}</span>
          {hasMarkedAttendance && <span>✅ Attendance Marked</span>}
        </div>

        <div className="quick-actions">
          <button
            onClick={() => navigate(`/classes/${encodeURIComponent(apiClassId)}`)}
            className="btn-class-content"
          >
            📚 Class Content
          </button>
          <button
            onClick={() => window.print()}
            className="btn-notes"
          >
            📝 Print Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassroomVideoViewer;