# 📞 Ikoota Audio/Video Calling API Documentation

## Overview
Complete API reference for the Agora.io-powered audio/video calling system with Converse Identity masking integration.

---

## 🔐 Authentication
All calling endpoints require JWT authentication via `Authorization: Bearer <token>` header and pre-member or full-member status.

---

## 📋 Core Endpoints

### 1. Generate Call Token
**POST** `/api/calling/token`

Generate Agora.io RTC token for joining a specific call.

**Request Body:**
```json
{
  "channelName": "call_123456",
  "uid": 789012
}
```

**Response:**
```json
{
  "token": "agora_rtc_token_here",
  "appId": "agora_app_id",
  "channelName": "call_123456", 
  "uid": 789012,
  "expiresAt": 1672531200
}
```

**Error Responses:**
- `403` - Access denied to this call
- `500` - Token generation failed

---

### 2. Create New Call
**POST** `/api/calling/create`

Create a new audio/video call session.

**Request Body:**
```json
{
  "title": "Weekly Team Meeting",
  "description": "Discuss project progress and next steps",
  "isPublic": false,
  "maxParticipants": 25
}
```

**Response:**
```json
{
  "callId": 12345,
  "channelName": "call_1672531200_abc123xyz",
  "title": "Weekly Team Meeting",
  "description": "Discuss project progress and next steps", 
  "isPublic": false,
  "maxParticipants": 25
}
```

**Error Responses:**
- `400` - Invalid request parameters
- `500` - Call creation failed

---

### 3. Join Call
**POST** `/api/calling/:callId/join`

Join an existing call session.

**URL Parameters:**
- `callId` - The ID of the call to join

**Response:**
```json
{
  "success": true,
  "channelName": "call_1672531200_abc123xyz",
  "callTitle": "Weekly Team Meeting"
}
```

**Error Responses:**
- `404` - Call not found or ended
- `400` - Call is full (reached max participants)
- `403` - Access denied to private call

---

### 4. Leave Call
**POST** `/api/calling/:callId/leave`

Leave a call session and update participation records.

**URL Parameters:**
- `callId` - The ID of the call to leave

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- `500` - Failed to leave call

---

### 5. Get User's Calls
**GET** `/api/calling/my-calls`

Retrieve list of calls the authenticated user can access.

**Query Parameters:**
- `limit` (optional) - Number of calls to return (default: 20)
- `status` (optional) - Filter by call status ('active', 'ended', 'paused')

**Response:**
```json
[
  {
    "id": 12345,
    "title": "Weekly Team Meeting",
    "description": "Discuss project progress",
    "channel_name": "call_1672531200_abc123xyz",
    "creator_id": 456,
    "is_public": false,
    "max_participants": 25,
    "status": "active",
    "created_at": "2023-12-01T10:00:00Z",
    "role": "host",
    "participant_count": 8
  }
]
```

---

## 📊 Analytics & Statistics

### 6. Get Call Analytics (Admin)
**GET** `/api/calling/admin/analytics`

Retrieve comprehensive calling system analytics.

**Query Parameters:**
- `days` (optional) - Number of days to include (default: 30)
- `groupBy` (optional) - Group results by 'day', 'week', or 'month'

**Response:**
```json
{
  "dailyStats": [
    {
      "date": "2023-12-01",
      "total_calls": 45,
      "total_participants": 320,
      "avg_duration": 1845,
      "audio_minutes": 2150,
      "video_minutes": 1890
    }
  ],
  "summary": {
    "totalCalls": 1350,
    "totalParticipants": 9600,
    "totalAudioMinutes": 64500,
    "totalVideoMinutes": 58200,
    "averageCallDuration": 1672,
    "peakParticipants": 150
  }
}
```

---

### 7. Get Call Details (Admin)
**GET** `/api/calling/admin/:callId/details`

Get detailed information about a specific call.

**Response:**
```json
{
  "call": {
    "id": 12345,
    "title": "Weekly Team Meeting",
    "description": "Discuss project progress",
    "channel_name": "call_1672531200_abc123xyz",
    "creator_id": 456,
    "status": "ended",
    "created_at": "2023-12-01T10:00:00Z",
    "ended_at": "2023-12-01T11:30:00Z"
  },
  "participants": [
    {
      "user_id": 456,
      "oto_number": "OTO#78901",
      "role": "host",
      "joined_at": "2023-12-01T10:00:00Z",
      "left_at": "2023-12-01T11:30:00Z",
      "duration_seconds": 5400
    }
  ],
  "stats": {
    "total_participants": 12,
    "peak_participants": 8,
    "total_duration_seconds": 5400,
    "audio_minutes_consumed": 850,
    "video_minutes_consumed": 720
  }
}
```

---

## 🎭 Masking & Preferences

### 8. Get User Call Preferences
**GET** `/api/calling/preferences`

Retrieve user's audio/video calling preferences.

**Response:**
```json
{
  "voice_masking_enabled": true,
  "video_masking_enabled": true,
  "auto_mute_on_join": false,
  "video_quality": "hd",
  "preferred_avatar": "avatar_001.png",
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T15:30:00Z"
}
```

---

### 9. Update User Call Preferences
**PUT** `/api/calling/preferences`

Update user's audio/video calling preferences.

**Request Body:**
```json
{
  "voice_masking_enabled": true,
  "video_masking_enabled": false,
  "auto_mute_on_join": true,
  "video_quality": "sd",
  "preferred_avatar": "avatar_002.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "voice_masking_enabled": true,
    "video_masking_enabled": false,
    "auto_mute_on_join": true,
    "video_quality": "sd", 
    "preferred_avatar": "avatar_002.png"
  }
}
```

---

## 🔧 Administrative Endpoints

### 10. End Call (Admin)
**POST** `/api/calling/admin/:callId/end`

Force end a call session.

**Response:**
```json
{
  "success": true,
  "message": "Call ended successfully",
  "endedAt": "2023-12-01T11:30:00Z"
}
```

---

### 11. Remove Participant (Admin)
**DELETE** `/api/calling/admin/:callId/participants/:userId`

Remove a specific participant from a call.

**Response:**
```json
{
  "success": true,
  "message": "Participant removed from call"
}
```

---

## 💡 Usage Examples

### Frontend Integration
```javascript
// Join a call
const joinCall = async (callId) => {
  try {
    // First join the call
    const joinResponse = await fetch(`/api/calling/${callId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!joinResponse.ok) throw new Error('Failed to join call');
    
    const { channelName } = await joinResponse.json();
    
    // Get Agora token
    const tokenResponse = await fetch('/api/calling/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelName,
        uid: Math.floor(Math.random() * 1000000)
      })
    });
    
    const agoraConfig = await tokenResponse.json();
    
    // Initialize Agora client with returned config
    await agoraClient.join(
      agoraConfig.appId, 
      agoraConfig.channelName, 
      agoraConfig.token, 
      agoraConfig.uid
    );
    
    console.log('Successfully joined call');
  } catch (error) {
    console.error('Failed to join call:', error);
  }
};
```

### Backend Integration
```javascript
// Create a call programmatically
const createSystemCall = async (title, description) => {
  try {
    const response = await fetch('/api/calling/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        isPublic: false,
        maxParticipants: 50
      })
    });
    
    return await response.json();
  } catch (error) {
    throw new Error('Failed to create call: ' + error.message);
  }
};
```

---

## 🚨 Error Codes Reference

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Invalid parameters, call full |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions, private call access denied |
| 404 | Not Found | Call doesn't exist or has ended |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Database error, Agora.io service unavailable |

---

## 📈 Rate Limits

- **Token Generation**: 60 requests per minute per user
- **Call Creation**: 10 calls per hour per user
- **Call Join**: 100 requests per minute per user
- **Analytics**: 20 requests per minute (admin only)

---

## 🔒 Security Notes

1. **Token Expiry**: Agora tokens expire after 24 hours by default
2. **Channel Names**: Auto-generated to prevent unauthorized access
3. **Participant Validation**: All participants verified against call membership
4. **Converse Identity**: OTO# numbers used in all logging and analytics
5. **Data Retention**: Call records retained for 90 days, recordings for 30 days

---

## 📞 Support & Troubleshooting

**Common Issues:**
- Token expired: Regenerate token via `/api/calling/token`
- Call full: Check `maxParticipants` limit
- Access denied: Verify user has pre-member+ status
- Network issues: Check Agora.io service status

**Monitoring Endpoints:**
- `/api/health` - Overall system health including Agora status
- `/api/calling/admin/analytics` - Call system performance metrics