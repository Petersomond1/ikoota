// Video Session Service - Local Testing System
// Creates and manages local video sessions for testing

// Mock video data for testing
const mockVideos = [
  {
    id: 'sacred-geometry-intro',
    title: 'Sacred Geometry - Introduction',
    description: 'An introduction to sacred geometry principles',
    duration: '10:30',
    thumbnail: '/videos/thumbnails/sacred-geometry-thumb.jpg',
    videoUrl: '/videos/sacred-geometry-intro.mp4',
    type: 'lesson',
    classId: 'OTU#004001',
    created: new Date('2024-01-15'),
    instructor: 'Peter Somond'
  },
  {
    id: 'meditation-basics',
    title: 'Meditation Fundamentals',
    description: 'Basic meditation techniques and practices',
    duration: '15:45',
    thumbnail: '/videos/thumbnails/meditation-thumb.jpg',
    videoUrl: '/videos/meditation-basics.mp4',
    type: 'practice',
    classId: 'OTU#222222',
    created: new Date('2024-01-20'),
    instructor: 'Peter Somond'
  },
  {
    id: 'wisdom-teachings-01',
    title: 'Ancient Wisdom Teachings - Part 1',
    description: 'Exploring ancient wisdom traditions',
    duration: '22:10',
    thumbnail: '/videos/thumbnails/wisdom-thumb.jpg',
    videoUrl: '/videos/wisdom-teachings-01.mp4',
    type: 'teaching',
    classId: 'OTU#333333',
    created: new Date('2024-01-25'),
    instructor: 'Peter Somond'
  }
];

// Generate a simple colored video data URL for testing
const generateTestVideo = (title, color = '#4F46E5', duration = 10) => {
  // Create a simple SVG-based "video" for testing
  const svg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <circle cx="640" cy="360" r="100" fill="white" opacity="0.3">
        <animate attributeName="r" values="100;120;100" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="640" y="300" text-anchor="middle" fill="white" font-size="48" font-family="Arial">
        ${title}
      </text>
      <text x="640" y="360" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        🎥 Test Video Session
      </text>
      <text x="640" y="420" text-anchor="middle" fill="white" font-size="20" font-family="Arial">
        Duration: ${duration} minutes
      </text>
      <text x="640" y="460" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
        Click to play • Local Testing Mode
      </text>
    </svg>
  `;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
};

// Generate thumbnail image
const generateThumbnail = (title, color = '#4F46E5') => {
  const svg = `
    <svg width="720" height="480" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="thumbBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}aa;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#thumbBg)" />
      <circle cx="360" cy="240" r="60" fill="white" opacity="0.8"/>
      <polygon points="340,220 340,260 380,240" fill="${color}"/>
      <text x="360" y="320" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        ${title}
      </text>
      <text x="360" y="350" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
        🎬 Local Test Video
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export class VideoSessionService {
  constructor() {
    this.videos = mockVideos.map(video => ({
      ...video,
      thumbnail: generateThumbnail(video.title),
      videoUrl: generateTestVideo(video.title, this.getColorForType(video.type))
    }));
    this.currentSession = null;
    this.sessionId = null;
  }

  getColorForType(type) {
    const colors = {
      'lesson': '#4F46E5',    // Indigo
      'practice': '#059669',  // Green
      'teaching': '#DC2626',  // Red
      'meditation': '#7C3AED', // Purple
      'discussion': '#EA580C'  // Orange
    };
    return colors[type] || '#6B7280';
  }

  // Get all videos for a class
  getClassVideos(classId) {
    return this.videos.filter(video => video.classId === classId);
  }

  // Get a specific video
  getVideo(videoId) {
    return this.videos.find(video => video.id === videoId);
  }

  // Create a new video session
  createSession(classId, videoId, userId) {
    const video = this.getVideo(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = {
      sessionId: this.sessionId,
      classId,
      videoId,
      userId,
      video,
      startTime: new Date(),
      status: 'active',
      participants: [{ userId, joinedAt: new Date(), status: 'active' }],
      chatMessages: [],
      attendanceMarked: false
    };

    console.log('🎥 Created video session:', this.sessionId);
    return this.currentSession;
  }

  // Get current session
  getCurrentSession() {
    return this.currentSession;
  }

  // Join an existing session
  joinSession(sessionId, userId) {
    if (this.sessionId === sessionId && this.currentSession) {
      const existingParticipant = this.currentSession.participants.find(p => p.userId === userId);

      if (!existingParticipant) {
        this.currentSession.participants.push({
          userId,
          joinedAt: new Date(),
          status: 'active'
        });
      }

      console.log('👤 User joined session:', userId);
      return this.currentSession;
    }

    throw new Error('Session not found');
  }

  // Mark attendance for session
  markAttendance(sessionId, userId, status = 'present') {
    if (this.sessionId === sessionId && this.currentSession) {
      this.currentSession.attendanceMarked = true;
      this.currentSession.attendanceStatus = status;

      console.log('✅ Attendance marked:', userId, status);
      return {
        success: true,
        message: 'Attendance marked successfully',
        status,
        sessionId,
        timestamp: new Date()
      };
    }

    throw new Error('Session not found');
  }

  // Add chat message
  addChatMessage(sessionId, userId, message, username = 'User') {
    if (this.sessionId === sessionId && this.currentSession) {
      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        username,
        message,
        timestamp: new Date(),
        type: 'user'
      };

      this.currentSession.chatMessages.push(chatMessage);
      console.log('💬 Chat message added:', message);
      return chatMessage;
    }

    throw new Error('Session not found');
  }

  // Get chat messages
  getChatMessages(sessionId) {
    if (this.sessionId === sessionId && this.currentSession) {
      return this.currentSession.chatMessages;
    }
    return [];
  }

  // End session
  endSession(sessionId) {
    if (this.sessionId === sessionId && this.currentSession) {
      this.currentSession.status = 'ended';
      this.currentSession.endTime = new Date();

      console.log('🔚 Session ended:', sessionId);
      return this.currentSession;
    }

    throw new Error('Session not found');
  }

  // Get session stats
  getSessionStats(sessionId) {
    if (this.sessionId === sessionId && this.currentSession) {
      const duration = new Date() - this.currentSession.startTime;

      return {
        sessionId,
        duration: Math.floor(duration / 1000 / 60), // minutes
        participantCount: this.currentSession.participants.length,
        chatMessageCount: this.currentSession.chatMessages.length,
        attendanceMarked: this.currentSession.attendanceMarked,
        status: this.currentSession.status
      };
    }

    return null;
  }

  // Simulate live streaming data
  getLiveStreamData(classId) {
    return {
      isLive: Math.random() > 0.5, // Randomly simulate live status
      streamUrl: generateTestVideo(`Live Stream - ${classId}`, '#DC2626'),
      viewerCount: Math.floor(Math.random() * 50) + 1,
      startTime: new Date(Date.now() - Math.random() * 3600000), // Random start time within last hour
      title: `Live Teaching Session - ${classId}`,
      instructor: 'Peter Somond'
    };
  }
}

// Create a singleton instance
export const videoSessionService = new VideoSessionService();

// Export utility functions
export const createTestVideoSession = (classId, userId) => {
  const videos = videoSessionService.getClassVideos(classId);
  const randomVideo = videos[Math.floor(Math.random() * videos.length)] || {
    id: 'default-test',
    title: `Test Video for ${classId}`,
    type: 'lesson'
  };

  return videoSessionService.createSession(classId, randomVideo.id, userId);
};

export const getLocalVideoUrl = (videoId) => {
  const video = videoSessionService.getVideo(videoId);
  return video ? video.videoUrl : generateTestVideo('Default Video');
};

export const getLocalThumbnail = (title, type = 'lesson') => {
  const color = videoSessionService.getColorForType(type);
  return generateThumbnail(title, color);
};

export default videoSessionService;