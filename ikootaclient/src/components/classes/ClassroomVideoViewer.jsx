// ikootaclient/src/components/classes/ClassroomVideoViewer.jsx
// CLASSROOM VIDEO PRESENTATION SYSTEM FOR LIVE AND RECORDED TEACHING
// Provides video streaming, live chat, attendance tracking, and interactive features

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import VideoRecorder from './VideoRecorder';
import ClassroomVideoPlayer from './ClassroomVideoPlayer';
import LiveChat from './LiveChat';
import { io } from 'socket.io-client';
import './ClassroomVideoViewer.css';

const ClassroomVideoViewer = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Refs
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

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

  // Real-time state
  const [realtimeMessages, setRealtimeMessages] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineParticipants, setOnlineParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Video management state
  const [currentView, setCurrentView] = useState('player'); // 'player', 'recorder', 'videos'
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});

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
  const encodedClassId = encodeURIComponent(apiClassId || '');

  // Fetch classroom session data
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['classroomSession', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${encodedClassId}/classroom/session`);
      return data?.data || data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 30 * 1000, // Refresh every 30 seconds for live sessions
    refetchInterval: 30 * 1000
  });

  // Fetch initial chat messages (for history)
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['classroomChat', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${encodedClassId}/classroom/chat`);
      return data?.data || data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 60 * 1000, // Longer stale time since we use real-time updates
    refetchOnWindowFocus: false // Disable auto-refetch since we have real-time updates
  });

  // Fetch participants list
  const { data: participantsData } = useQuery({
    queryKey: ['classroomParticipants', apiClassId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${encodedClassId}/members`);
      return data?.data || data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000
  });

  // Send chat message via Socket.io
  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      // Send via Socket.io for real-time delivery
      if (socketRef.current && isSocketConnected) {
        const messageData = {
          id: Date.now().toString(),
          message,
          room: `classroom_${apiClassId}`,
          classId: apiClassId,
          timestamp: new Date().toISOString()
        };

        socketRef.current.emit('sendMessage', messageData);
        return { success: true, data: messageData };
      } else {
        // Fallback to HTTP if socket not available
        return await api.post(`/classes/${encodedClassId}/classroom/chat`, {
          message,
          timestamp: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      setChatMessage('');
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/classes/${encodedClassId}/classroom/attendance`, {
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

  // Socket.io connection setup
  useEffect(() => {
    if (!apiClassId || !isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to Socket.io server
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

    socketRef.current = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('💬 Connected to live chat');
      setIsSocketConnected(true);

      // Join classroom room
      socket.emit('joinRoom', `classroom_${apiClassId}`);
    });

    socket.on('disconnect', () => {
      console.log('💬 Disconnected from live chat');
      setIsSocketConnected(false);
    });

    // Chat message events
    socket.on('receiveMessage', (messageData) => {
      // Only show messages for this classroom
      if (messageData.room === `classroom_${apiClassId}` || messageData.classId === apiClassId) {
        setRealtimeMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg.id === messageData.id);
          if (exists) return prev;

          return [...prev, {
            id: messageData.id || Date.now(),
            message: messageData.message,
            author_converse_id: messageData.fromUsername || messageData.from,
            author: messageData.fromUsername || messageData.from,
            timestamp: messageData.timestamp,
            createdAt: messageData.timestamp,
            isRealtime: true
          }];
        });
      }
    });

    // Typing indicators
    socket.on('userTyping', (typingData) => {
      if (typingData.isTyping) {
        setTypingUsers(prev => new Set([...prev, typingData.fromUsername]));
        // Clear typing after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(typingData.fromUsername);
            return newSet;
          });
        }, 3000);
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(typingData.fromUsername);
          return newSet;
        });
      }
    });

    // User status updates
    socket.on('userStatusUpdate', (statusData) => {
      setOnlineParticipants(prev => {
        const updated = prev.filter(p => p.id !== statusData.userId);
        return [...updated, {
          id: statusData.userId,
          name: statusData.username,
          status: statusData.status,
          is_online: statusData.status === 'online'
        }];
      });
    });

    return () => {
      if (socket) {
        socket.emit('leaveRoom', `classroom_${apiClassId}`);
        socket.disconnect();
      }
    };
  }, [apiClassId, isAuthenticated]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [realtimeMessages, chatData]);

  // Merge historical and real-time messages
  const allMessages = React.useMemo(() => {
    const historical = chatData || [];
    const combined = [...historical, ...realtimeMessages];

    // Remove duplicates and sort by timestamp
    const unique = combined.filter((msg, index, arr) =>
      index === arr.findIndex(m => m.id === msg.id ||
        (m.message === msg.message && m.timestamp === msg.timestamp)
      )
    );

    return unique.sort((a, b) =>
      new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
    );
  }, [chatData, realtimeMessages]);

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

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit('typing', {
        isTyping,
        room: `classroom_${apiClassId}`
      });
    }
  };

  // Typing timeout
  const typingTimeoutRef = useRef(null);
  const handleChatInputChange = (e) => {
    setChatMessage(e.target.value);

    // Send typing indicator
    handleTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 1000);
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
  const messages = allMessages || [];
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
              {isSocketConnected && (
                <span className="live-indicator">🟢 Live Chat</span>
              )}
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

          {/* Live Chat Panel */}
          {showChat && (
            <LiveChat
              socket={socketRef.current}
              classId={apiClassId}
              messages={messages}
              onSendMessage={handleSendMessage}
              isConnected={isSocketConnected}
              isLoading={chatLoading || sendMessageMutation.isLoading}
              currentUser={user}
              isLiveSession={isLiveSession}
            />
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