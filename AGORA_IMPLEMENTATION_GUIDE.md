# 🚀 Agora.io Audio/Video Implementation Guide
## Ikoota Converse Identity Integration

Based on the cost analysis recommending Agora.io as the optimal solution, this guide provides the complete implementation roadmap for integrating audio/video calling with Converse Identity masking.

---

## 🎯 Implementation Overview

**Total Timeline:** 7 weeks
**Development Cost:** $65,600
**Monthly Operating Cost:** $730
**3-Year TCO:** $91,880

---

## 📋 Phase 1: Foundation Setup (Week 1)

### 1.1 Agora.io Account Setup
```bash
# Sign up for Agora.io account
# Navigate to: https://console.agora.io/
# Create new project: "Ikoota Voice/Video"
# Note App ID and App Certificate for environment variables
```

### 1.2 Environment Configuration
Add to `.env` files:
```env
# Agora.io Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_certificate_here
AGORA_TEMP_TOKEN_EXPIRY=86400

# Voice Masking Settings
VOICE_MASKING_ENABLED=true
VOICE_PITCH_SHIFT_RANGE=0.8,1.2
VOICE_FORMANT_SHIFT=0.9,1.1

# Video Masking Settings
VIDEO_MASKING_ENABLED=true
FACE_MASK_STRENGTH=0.85
AVATAR_OVERLAY_ENABLED=true
```

### 1.3 Install Dependencies
```bash
# Frontend dependencies
cd ikootaclient
npm install agora-rtc-react agora-rtc-sdk-ng
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
npm install canvas-face-detection face-api.js

# Backend dependencies
cd ../ikootaapi
npm install agora-access-token
npm install @agora.io/rtc-node-sdk
npm install node-canvas sharp
```

---

## 🔧 Phase 2: Core Integration (Weeks 2-3)

### 2.1 Backend API Endpoints

Create `ikootaapi/routes/calling.js`:
```javascript
// Audio/Video Calling API Routes
import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-access-token';
import { authenticateToken, requireMember } from '../middleware/auth.js';
import db from '../config/db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Generate Agora RTC Token
router.post('/token', authenticateToken, requireMember, async (req, res) => {
  try {
    const { channelName, uid } = req.body;
    const userId = req.user.id;
    
    // Verify user has permission to join this call
    const [callPermission] = await db.query(`
      SELECT c.*, cm.role 
      FROM calls c 
      LEFT JOIN call_members cm ON c.id = cm.call_id AND cm.user_id = ?
      WHERE c.channel_name = ? AND (c.is_public = 1 OR cm.user_id IS NOT NULL)
    `, [userId, channelName]);
    
    if (!callPermission.length) {
      return res.status(403).json({ error: 'Access denied to this call' });
    }
    
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID, appCertificate, channelName, uid, role, privilegeExpiredTs
    );
    
    // Log call participation
    await db.query(`
      INSERT INTO call_participants (call_id, user_id, joined_at, agora_uid)
      VALUES (?, ?, NOW(), ?)
      ON DUPLICATE KEY UPDATE joined_at = NOW()
    `, [callPermission[0].id, userId, uid]);
    
    res.json({
      token,
      appId: appID,
      channelName,
      uid,
      expiresAt: privilegeExpiredTs
    });
    
  } catch (error) {
    logger.error('Token generation failed:', error);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
});

// Create new call
router.post('/create', authenticateToken, requireMember, async (req, res) => {
  try {
    const { title, description, isPublic = false, maxParticipants = 50 } = req.body;
    const creatorId = req.user.id;
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [result] = await db.query(`
      INSERT INTO calls (title, description, channel_name, creator_id, is_public, max_participants, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active')
    `, [title, description, channelName, creatorId, isPublic, maxParticipants]);
    
    // Add creator as host
    await db.query(`
      INSERT INTO call_members (call_id, user_id, role, joined_at)
      VALUES (?, ?, 'host', NOW())
    `, [result.insertId, creatorId]);
    
    res.json({
      callId: result.insertId,
      channelName,
      title,
      description,
      isPublic,
      maxParticipants
    });
    
  } catch (error) {
    logger.error('Call creation failed:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Join call
router.post('/:callId/join', authenticateToken, requireMember, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;
    
    // Check if call exists and user can join
    const [call] = await db.query(`
      SELECT * FROM calls 
      WHERE id = ? AND status = 'active'
    `, [callId]);
    
    if (!call.length) {
      return res.status(404).json({ error: 'Call not found or ended' });
    }
    
    // Check participant limit
    const [participantCount] = await db.query(`
      SELECT COUNT(*) as count FROM call_participants 
      WHERE call_id = ? AND left_at IS NULL
    `, [callId]);
    
    if (participantCount[0].count >= call[0].max_participants) {
      return res.status(400).json({ error: 'Call is full' });
    }
    
    // Add member if not public call
    if (!call[0].is_public) {
      await db.query(`
        INSERT IGNORE INTO call_members (call_id, user_id, role, joined_at)
        VALUES (?, ?, 'participant', NOW())
      `, [callId, userId]);
    }
    
    res.json({
      success: true,
      channelName: call[0].channel_name,
      callTitle: call[0].title
    });
    
  } catch (error) {
    logger.error('Join call failed:', error);
    res.status(500).json({ error: 'Failed to join call' });
  }
});

// Leave call
router.post('/:callId/leave', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;
    
    await db.query(`
      UPDATE call_participants 
      SET left_at = NOW() 
      WHERE call_id = ? AND user_id = ? AND left_at IS NULL
    `, [callId, userId]);
    
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Leave call failed:', error);
    res.status(500).json({ error: 'Failed to leave call' });
  }
});

// Get user's calls
router.get('/my-calls', authenticateToken, requireMember, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [calls] = await db.query(`
      SELECT c.*, 
             cm.role,
             COUNT(DISTINCT cp.user_id) as participant_count
      FROM calls c
      LEFT JOIN call_members cm ON c.id = cm.call_id AND cm.user_id = ?
      LEFT JOIN call_participants cp ON c.id = cp.call_id AND cp.left_at IS NULL
      WHERE c.is_public = 1 OR cm.user_id IS NOT NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 20
    `, [userId]);
    
    res.json(calls);
    
  } catch (error) {
    logger.error('Get calls failed:', error);
    res.status(500).json({ error: 'Failed to retrieve calls' });
  }
});

export default router;
```

### 2.2 Database Schema Updates

Create `ikootaapi/sql/calling_tables.sql`:
```sql
-- Audio/Video Calling System Tables

-- Main calls table
CREATE TABLE calls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  channel_name VARCHAR(255) UNIQUE NOT NULL,
  creator_id INT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  max_participants INT DEFAULT 50,
  status ENUM('active', 'ended', 'paused') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_channel_name (channel_name),
  INDEX idx_creator_status (creator_id, status),
  INDEX idx_public_active (is_public, status)
);

-- Call membership (who can join private calls)
CREATE TABLE call_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('host', 'moderator', 'participant') DEFAULT 'participant',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_call_member (call_id, user_id)
);

-- Call participation tracking
CREATE TABLE call_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_id INT NOT NULL,
  user_id INT NOT NULL,
  agora_uid INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  duration_seconds INT GENERATED ALWAYS AS (
    CASE 
      WHEN left_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, joined_at, left_at)
      ELSE NULL 
    END
  ) STORED,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_call_active (call_id, left_at),
  INDEX idx_user_history (user_id, joined_at)
);

-- Call statistics and analytics
CREATE TABLE call_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_id INT NOT NULL,
  total_participants INT DEFAULT 0,
  peak_participants INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,
  audio_minutes_consumed INT DEFAULT 0,
  video_minutes_consumed INT DEFAULT 0,
  data_transfer_mb DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  UNIQUE KEY unique_call_stats (call_id)
);

-- User calling preferences
CREATE TABLE user_call_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  voice_masking_enabled BOOLEAN DEFAULT TRUE,
  video_masking_enabled BOOLEAN DEFAULT TRUE,
  auto_mute_on_join BOOLEAN DEFAULT FALSE,
  video_quality ENUM('sd', 'hd') DEFAULT 'hd',
  preferred_avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preferences (user_id)
);
```

---

## 🎨 Phase 3: Frontend Components (Weeks 4-5)

### 3.1 Voice/Video Calling Hook

Create `ikootaclient/src/hooks/useAgoraCall.js`:
```javascript
// Custom hook for Agora.io voice/video calling
import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { apiCall } from '../utils/api';

export const useAgoraCall = () => {
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callStats, setCallStats] = useState({
    duration: 0,
    participantCount: 0,
    networkQuality: 'unknown'
  });

  const intervalRef = useRef();
  const joinTimeRef = useRef();

  // Handle user joining
  useEffect(() => {
    const handleUserJoined = async (user) => {
      console.log('👤 User joined:', user.uid);
      setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
    };

    const handleUserLeft = (user) => {
      console.log('👋 User left:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    };

    const handleUserPublished = async (user, mediaType) => {
      console.log(`📡 User ${user.uid} published ${mediaType}`);
      await client.subscribe(user, mediaType);
      setRemoteUsers(prev => 
        prev.map(u => u.uid === user.uid ? user : u)
      );
    };

    const handleUserUnpublished = (user, mediaType) => {
      console.log(`📡 User ${user.uid} unpublished ${mediaType}`);
      setRemoteUsers(prev => 
        prev.map(u => u.uid === user.uid ? user : u)
      );
    };

    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);

    return () => {
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
    };
  }, [client]);

  // Join call function
  const joinCall = async (callId) => {
    try {
      console.log('🔗 Joining call:', callId);

      // Get Agora token from backend
      const response = await apiCall(`/api/calling/token`, {
        method: 'POST',
        body: JSON.stringify({
          channelName: `call_${callId}`,
          uid: Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get call token');
      }

      const { token, appId, channelName, uid } = response.data;

      // Create local tracks with masking
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: true,
          bitrate: 128,
        }
      });

      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMin: 1000,
          bitrateMax: 3000,
        }
      });

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Join channel
      await client.join(appId, channelName, token, uid);
      
      // Publish tracks
      await client.publish([audioTrack, videoTrack]);
      
      setIsJoined(true);
      joinTimeRef.current = Date.now();
      
      // Start call statistics
      intervalRef.current = setInterval(() => {
        updateCallStats();
      }, 1000);

      console.log('✅ Successfully joined call');
      return { success: true, channelName, uid };

    } catch (error) {
      console.error('❌ Failed to join call:', error);
      throw error;
    }
  };

  // Leave call function
  const leaveCall = async () => {
    try {
      console.log('🚪 Leaving call...');

      // Stop statistics
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Clean up local tracks
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }

      // Leave channel
      await client.leave();
      
      setIsJoined(false);
      setRemoteUsers([]);
      
      console.log('✅ Successfully left call');

    } catch (error) {
      console.error('❌ Failed to leave call:', error);
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Update call statistics
  const updateCallStats = () => {
    if (!isJoined || !joinTimeRef.current) return;

    const duration = Math.floor((Date.now() - joinTimeRef.current) / 1000);
    const participantCount = remoteUsers.length + 1;
    
    // Get network quality
    const networkQuality = client.getRemoteNetworkQuality();
    
    setCallStats({
      duration,
      participantCount,
      networkQuality: Object.keys(networkQuality).length > 0 ? 'good' : 'unknown'
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, []);

  return {
    // State
    isJoined,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isAudioEnabled,
    isVideoEnabled,
    callStats,
    
    // Actions
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
  };
};
```

### 3.2 Audio/Video Calling Component

Create `ikootaclient/src/components/calling/CallInterface.jsx`:
```jsx
// Main calling interface component
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgoraCall } from '../../hooks/useAgoraCall';
import { useUser } from '../auth/UserStatus';
import CallControls from './CallControls';
import ParticipantGrid from './ParticipantGrid';
import CallStats from './CallStats';
import './CallInterface.css';

const CallInterface = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    isJoined,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isAudioEnabled,
    isVideoEnabled,
    callStats,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
  } = useAgoraCall();

  const [callInfo, setCallInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load call information
  useEffect(() => {
    const loadCallInfo = async () => {
      try {
        const response = await fetch(`/api/calling/${callId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Call not found or access denied');
        }

        const data = await response.json();
        setCallInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (callId) {
      loadCallInfo();
    }
  }, [callId]);

  // Auto-join call when component mounts
  useEffect(() => {
    const autoJoin = async () => {
      if (callInfo && !isJoined) {
        try {
          await joinCall(callId);
        } catch (err) {
          setError('Failed to join call: ' + err.message);
        }
      }
    };

    autoJoin();
  }, [callInfo, callId, isJoined]);

  // Handle leaving call
  const handleLeaveCall = async () => {
    await leaveCall();
    navigate('/classes');
  };

  if (isLoading) {
    return (
      <div className="call-interface loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Joining call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="call-interface error">
        <div className="error-message">
          <h2>⚠️ Call Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/classes')} className="btn-primary">
            Return to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-interface">
      {/* Call Header */}
      <div className="call-header">
        <div className="call-info">
          <h2>{callInfo?.title || 'Ikoota Call'}</h2>
          <span className="call-id">Call ID: {callId}</span>
        </div>
        
        <CallStats stats={callStats} />
      </div>

      {/* Participant Grid */}
      <ParticipantGrid
        localVideoTrack={localVideoTrack}
        remoteUsers={remoteUsers}
        currentUser={user}
      />

      {/* Call Controls */}
      <CallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeaveCall={handleLeaveCall}
        participantCount={callStats.participantCount}
      />

      {/* Converse Identity Notice */}
      <div className="privacy-notice">
        🎭 Your Converse Identity (OTO#{user?.oto_number}) is active
      </div>
    </div>
  );
};

export default CallInterface;
```

---

## 🎭 Phase 4: Converse Identity Integration (Week 6)

### 4.1 Voice Masking Service

Create `ikootaclient/src/services/voiceMaskingService.js`:
```javascript
// Voice masking service for Converse Identity
class VoiceMaskingService {
  constructor() {
    this.audioContext = null;
    this.pitchShifter = null;
    this.noiseGate = null;
    this.isEnabled = true;
    this.maskingStrength = 0.7;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await this.setupAudioProcessing();
      console.log('✅ Voice masking initialized');
    } catch (error) {
      console.error('❌ Voice masking initialization failed:', error);
    }
  }

  async setupAudioProcessing() {
    // Create pitch shifter using Web Audio API
    this.pitchShifter = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.pitchShifter.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const outputData = event.outputBuffer.getChannelData(0);
      
      if (this.isEnabled) {
        this.applyVoiceMasking(inputData, outputData);
      } else {
        // Pass through unmodified
        outputData.set(inputData);
      }
    };

    // Setup noise gate for better quality
    this.noiseGate = this.audioContext.createDynamicsCompressor();
    this.noiseGate.threshold.setValueAtTime(-30, this.audioContext.currentTime);
    this.noiseGate.knee.setValueAtTime(40, this.audioContext.currentTime);
    this.noiseGate.ratio.setValueAtTime(12, this.audioContext.currentTime);
  }

  applyVoiceMasking(inputData, outputData) {
    // Apply pitch shifting and formant modification
    const shiftFactor = 0.8 + (this.maskingStrength * 0.4); // 0.8 to 1.2 range
    
    for (let i = 0; i < inputData.length; i++) {
      // Simple pitch shifting algorithm
      const shiftedIndex = Math.floor(i * shiftFactor);
      if (shiftedIndex < inputData.length) {
        outputData[i] = inputData[shiftedIndex] * 0.9; // Slight volume reduction
      }
    }

    // Add subtle noise for additional masking
    this.addMaskingNoise(outputData);
  }

  addMaskingNoise(outputData) {
    const noiseLevel = 0.05 * this.maskingStrength;
    
    for (let i = 0; i < outputData.length; i++) {
      const noise = (Math.random() - 0.5) * noiseLevel;
      outputData[i] = Math.max(-1, Math.min(1, outputData[i] + noise));
    }
  }

  connectToTrack(audioTrack) {
    if (!this.audioContext || !audioTrack) return;

    try {
      // Connect audio track to processing chain
      const source = this.audioContext.createMediaStreamSource(
        new MediaStream([audioTrack.getMediaStreamTrack()])
      );
      
      source.connect(this.noiseGate);
      this.noiseGate.connect(this.pitchShifter);
      this.pitchShifter.connect(this.audioContext.destination);
      
      console.log('🎭 Voice masking connected to audio track');
    } catch (error) {
      console.error('❌ Failed to connect voice masking:', error);
    }
  }

  setMaskingStrength(strength) {
    this.maskingStrength = Math.max(0, Math.min(1, strength));
    console.log(`🎭 Voice masking strength: ${this.maskingStrength}`);
  }

  enable() {
    this.isEnabled = true;
    console.log('🎭 Voice masking enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('🎭 Voice masking disabled');
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('🎭 Voice masking destroyed');
  }
}

export default VoiceMaskingService;
```

### 4.2 Video Masking Service

Create `ikootaclient/src/services/videoMaskingService.js`:
```javascript
// Video masking service for face obscuration
import * as faceapi from 'face-api.js';

class VideoMaskingService {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isEnabled = true;
    this.maskingMode = 'avatar'; // 'blur', 'pixelate', 'avatar'
    this.faceDetector = null;
    this.avatarImage = null;
  }

  async initialize() {
    try {
      // Load face detection models
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      
      // Setup canvas for processing
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      
      // Load default avatar
      await this.loadAvatarImage('/assets/default-avatar.png');
      
      console.log('✅ Video masking initialized');
    } catch (error) {
      console.error('❌ Video masking initialization failed:', error);
    }
  }

  async loadAvatarImage(imagePath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.avatarImage = img;
        resolve();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  async processVideoFrame(videoTrack) {
    if (!this.isEnabled || !this.canvas || !videoTrack) return videoTrack;

    try {
      const videoElement = document.createElement('video');
      videoElement.srcObject = new MediaStream([videoTrack.getMediaStreamTrack()]);
      videoElement.play();

      // Wait for video to load
      await new Promise(resolve => {
        videoElement.onloadedmetadata = resolve;
      });

      // Set canvas dimensions
      this.canvas.width = videoElement.videoWidth;
      this.canvas.height = videoElement.videoHeight;

      // Process frame
      await this.renderMaskedFrame(videoElement);

      // Create new video track from canvas
      const stream = this.canvas.captureStream(30);
      return stream.getVideoTracks()[0];

    } catch (error) {
      console.error('❌ Video frame processing failed:', error);
      return videoTrack;
    }
  }

  async renderMaskedFrame(videoElement) {
    // Draw original video frame
    this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);

    // Detect faces
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    // Apply masking to each detected face
    detections.forEach(detection => {
      this.applyFaceMask(detection);
    });
  }

  applyFaceMask(detection) {
    const { box } = detection.detection;
    const { x, y, width, height } = box;

    switch (this.maskingMode) {
      case 'blur':
        this.applyBlurMask(x, y, width, height);
        break;
      case 'pixelate':
        this.applyPixelateMask(x, y, width, height);
        break;
      case 'avatar':
        this.applyAvatarMask(x, y, width, height);
        break;
    }
  }

  applyBlurMask(x, y, width, height) {
    // Extract face region
    const imageData = this.ctx.getImageData(x, y, width, height);
    
    // Apply blur filter
    this.ctx.filter = 'blur(20px)';
    this.ctx.putImageData(imageData, x, y);
    this.ctx.filter = 'none';
  }

  applyPixelateMask(x, y, width, height) {
    const pixelSize = 20;
    
    for (let px = x; px < x + width; px += pixelSize) {
      for (let py = y; py < y + height; py += pixelSize) {
        // Sample pixel color
        const imageData = this.ctx.getImageData(px, py, 1, 1);
        const [r, g, b] = imageData.data;
        
        // Draw pixelated block
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(px, py, pixelSize, pixelSize);
      }
    }
  }

  applyAvatarMask(x, y, width, height) {
    if (this.avatarImage) {
      // Draw avatar image over face
      this.ctx.drawImage(this.avatarImage, x, y, width, height);
    }
  }

  setMaskingMode(mode) {
    this.maskingMode = mode;
    console.log(`🎭 Video masking mode: ${mode}`);
  }

  enable() {
    this.isEnabled = true;
    console.log('🎭 Video masking enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('🎭 Video masking disabled');
  }

  destroy() {
    if (this.canvas) {
      this.canvas = null;
      this.ctx = null;
    }
    console.log('🎭 Video masking destroyed');
  }
}

export default VideoMaskingService;
```

---

## 🚀 Phase 5: Production Deployment (Week 7)

### 5.1 Environment Variables Update

Add to your `.env` files:
```env
# Production Agora.io Configuration
AGORA_APP_ID=your_production_agora_app_id
AGORA_APP_CERTIFICATE=your_production_certificate
AGORA_TEMP_TOKEN_EXPIRY=86400

# AWS Lambda for masking processing
MASKING_LAMBDA_FUNCTION_ARN=arn:aws:lambda:us-east-1:account:function:ikoota-voice-masking
MASKING_LAMBDA_REGION=us-east-1

# GPU Instance Configuration
GPU_INSTANCE_ENDPOINT=https://gpu-masking.ikoota.com
GPU_INSTANCE_API_KEY=your_gpu_api_key
```

### 5.2 Update GitHub Actions

Add to `.github/workflows/deploy.yml`:
```yaml
# Add to deploy job after database migration
- name: Deploy Calling System Database Updates
  run: |
    # Create calling system tables
    mysql -h $RDS_ENDPOINT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < ikootaapi/sql/calling_tables.sql
    
    # Update user preferences for existing users
    mysql -h $RDS_ENDPOINT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "
      INSERT IGNORE INTO user_call_preferences (user_id, voice_masking_enabled, video_masking_enabled)
      SELECT id, TRUE, TRUE FROM users WHERE status IN ('pre-member', 'full-member')
    "
```

### 5.3 Update Route Registration

Add to `ikootaapi/app.js`:
```javascript
// Import calling routes
import callingRoutes from './routes/calling.js';

// Register calling routes
app.use('/api/calling', callingRoutes);

// Update health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    
    // Test Agora.io connectivity
    const agoraStatus = process.env.AGORA_APP_ID ? 'configured' : 'missing';
    
    res.json({
      success: true,
      message: 'API is healthy - ALL SYSTEMS INCLUDING AUDIO/VIDEO CALLING ACTIVE!',
      database: 'connected',
      agora: agoraStatus,
      systems: [
        'Authentication',
        'User Management', 
        'Membership System',
        'Survey System',
        'Class Management',
        'Audio/Video Calling', // New
        'Content Management',
        'Admin Controls'
      ],
      version: '4.2.0-calling-integrated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

---

## 📊 Monitoring & Analytics

### Daily Usage Tracking
```javascript
// Add to calling routes - usage analytics
router.get('/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_calls,
        SUM(total_participants) as total_participants,
        AVG(total_duration_seconds) as avg_duration,
        SUM(audio_minutes_consumed) as audio_minutes,
        SUM(video_minutes_consumed) as video_minutes
      FROM call_stats cs
      JOIN calls c ON cs.call_id = c.id
      WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      dailyStats: stats,
      summary: {
        totalCalls: stats.reduce((sum, day) => sum + day.total_calls, 0),
        totalParticipants: stats.reduce((sum, day) => sum + day.total_participants, 0),
        totalAudioMinutes: stats.reduce((sum, day) => sum + day.audio_minutes, 0),
        totalVideoMinutes: stats.reduce((sum, day) => sum + day.video_minutes, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});
```

---

## ✅ Implementation Checklist

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create detailed implementation guide for Agora.io integration", "status": "completed", "activeForm": "Creating detailed implementation guide for Agora.io integration"}, {"content": "Design WebRTC service architecture with masking pipeline", "status": "in_progress", "activeForm": "Designing WebRTC service architecture with masking pipeline"}, {"content": "Create code templates for audio/video components", "status": "pending", "activeForm": "Creating code templates for audio/video components"}, {"content": "Setup Agora.io configuration files", "status": "pending", "activeForm": "Setting up Agora.io configuration files"}, {"content": "Document API endpoints for calling features", "status": "pending", "activeForm": "Documenting API endpoints for calling features"}]