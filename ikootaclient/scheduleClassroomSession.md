
 Before we start, i want you to know a little about the class system. The class system is to create a groupings of users into some smaller sub-divisions amongst the general body for ease of management and interaction between each other within the general body. It is used in two sense, first as a grouping of users like demograpgic grouping, and secondly, as a separation for users into different grades or classrooms of students in a learning institution. So, know that when we say class, it could class as a group of users or it could be class as a classroom. By this, a user is placed in a special demographic class (like classroom with  differing subjects of study in a regular school system). Both of these class usage can then be used as an 'audience' or target users class, with each grouping having something that differentiates them from the other numerous classes of users groupings. And as a unit of class, the users within can have internal communication/chats with each other within that class/group and also can have interaction as a class/group against another class/group and when it is will all classes interacting it becomes the general communication class which will feature in 'audience' for posting content/chat/messages. so, users make up classes which is used as an audience for messages/chats. users will have a demographic sub-division to be known as classes. This classes will create opportunity for messages/chats to have specific audiences within the body of users and general/public as audience for all.

 As a user is added into the app system, such a user is given an individual user class identity number known as class_id or class id for short, which is a single unit of a group/class. Also in like vain, when we add up more than one or many users together to form a grouping we also call that grouping a class and issue that class (like classroom or audience) an identity number that we also call class identity number or class_id for short, which is same as that already issued the idividual that constitute this plural grouping. So as a one person/user we have a class_id and as a gropupings of this individuals to make a group we also have a class_id. So as in all case, the class made of different numberings of individual of class users (each with his/her own class identity number ) is still seen as a class. The class identification number known as class_id or class id is a 10 figure alphanumeric system that have as part of it a prefix of OTU# (4-digits) and a suffix of 6-random alphanumeric letters XXXXXX making it look as OTU#ABC123 . 
 Now let us see how we organise, put to use and manage this class system.


 At the backend, we have two class routes mounted into the index.js main router; 
// ✅ Class management routes
import classRoutes from './classRoutes.js';
import classAdminRoutes from './classAdminRoutes.js';

ikootaapi\routes\classAdminRoutes.js  and  ikootaapi\routes\classRoutes.js , ikootaapi\controllers\classTestController.js  ikootaapi\services\classAdminServices.js  ikootaapi\services\classServices.js  ikootaapi\middleware\classValidation.js  or   ikootaapi\middlewares\classValidation.js  ikootaapi\utils\testClassParameters.js


At the frontend, we have the following class system related components amongst others not here listed;

ikootaclient\src\components\classes
ikootaclient\src\components\classes\ClassContentViewer.css
ikootaclient\src\components\classes\ClassContentViewer.jsx
ikootaclient\src\components\classes\ClassListPage.css
ikootaclient\src\components\classes\ClassListPage.jsx
ikootaclient\src\components\classes\ClassMentorshipView.css
ikootaclient\src\components\classes\ClassMentorshipView.jsx
ikootaclient\src\components\classes\ClassPreview.css
ikootaclient\src\components\classes\ClassPreview.jsx
ikootaclient\src\components\classes\ClassroomVideoPlayer.jsx
ikootaclient\src\components\classes\ClassroomVideoViewer.css
ikootaclient\src\components\classes\ClassroomVideoViewer.jsx
ikootaclient\src\components\classes\EnhancedClassDashboard.css
ikootaclient\src\components\classes\EnhancedClassDashboard.jsx
ikootaclient\src\components\classes\LiveChat.css
ikootaclient\src\components\classes\LiveChat.jsx
ikootaclient\src\components\classes\MyClassesPage.css
ikootaclient\src\components\classes\MyClassesPage.jsx
ikootaclient\src\components\classes\VideoMaskingSystem.jsx
ikootaclient\src\components\classes\VideoRecorder.jsx
ikootaclient\src\services\videoSessionService.js
ikootaclient\src\components\admin\LiveClassManagement.jsx
ikootaclient\src\components\admin\AudienceClassMgr.jsx

ikootaclient\src\components\auth\UserStatus.jsx
ikootaclient\src\components\config\accessMatrix.js

lso to be aAttached will be a listing and describe of related database tables from ikootaapi\config\db.js

As in the use of class for classroom purposes, note that we have three types of classrooms all encapsulated into the;
# IKOOTA Class Teaching Sessions - Complete Blueprint
 WE must strictly and compulsory follow this steps and procedure and only amend that step or process when we can't find any other headway, and must update the amendment as an update into this blueprint herein below;

🎯 **OVERVIEW: THREE DISTINCT CLASS SESSION TYPES**

The IKOOTA system supports three completely different types of class sessions. Each has its own workflow and endpoints:

## 📝 **TYPE 1: TRADITIONAL CLASS SESSIONS**
- **Purpose:** Regular class material exchange (texts, documents, images, audio files, video files)
- **NOT live teaching:** No instructor teaching sessions
- **Workflow:** Standard class enrollment and content sharing
- **Endpoints:** `/api/classes/*` (basic class system)

## 🔴 **TYPE 2: LIVE TEACHING SESSIONS**
- **Purpose:** Real-time instructor teaching with WebRTC streaming
- **Live interaction:** Students join live classroom during teaching
- **Workflow:** Schedule → Admin Approve → Notify → Start Live → Students Join → Interact
- **Endpoints:** `/api/classes/live/*` (live teaching system)

## 🔵 **TYPE 3: RECORDED TEACHING SESSIONS**
- **Purpose:** Pre-recorded instructor teaching videos with approval workflow
- **Upload & Approve:** Videos uploaded → Admin approval → Students access
- **Workflow:** Upload → Admin Review → Approve → Available → Students Access
- **Endpoints:** `/api/classes/:id/videos` + `/api/classes/admin/content/*` (recorded teaching system)

# 📝 TYPE 1: TRADITIONAL CLASS SESSIONS WORKFLOW

## Overview
Traditional classes for material exchange - texts, documents, images, audio, video files (NOT instructor teaching sessions).

### STEP 1: BROWSE AVAILABLE CLASSES
**Role:** Any User
**Endpoint:** `GET /api/classes`

```bash
curl -H "Authorization: Bearer USER_JWT_TOKEN" \
  http://localhost:3333/api/classes
```

### STEP 2: JOIN A CLASS
**Role:** Member
**Endpoint:** `POST /api/classes/:classId/join`

```bash
curl -X POST http://localhost:3333/api/classes/OTU%23004001/join \
  -H "Authorization: Bearer MEMBER_JWT_TOKEN"
```

### STEP 3: ACCESS CLASS MEMBERS
**Role:** Class Member
**Endpoint:** `GET /api/classes/:classId/members`

```bash
curl -H "Authorization: Bearer MEMBER_JWT_TOKEN" \
  http://localhost:3333/api/classes/OTU%23004001/members
```

### STEP 4: PARTICIPATE IN CLASS ACTIVITIES
**Role:** Class Member
**Available Actions:**
- Share materials, documents, images, audio files
- Chat with class members
- Access shared content
- Standard class interactions

---

# 🔴 TYPE 2: LIVE TEACHING SESSIONS WORKFLOW

## Overview
Real-time instructor teaching with WebRTC streaming and live classroom interaction.

### STEP 1: INSTRUCTOR SCHEDULES LIVE TEACHING SESSION
**Role:** Instructor (Member level required)
**Endpoint:** `POST /api/classes/live/schedule`
  Endpoint: POST /api/classes/live/schedule

  curl -X POST http://localhost:3333/api/classes/live/schedule \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Advanced Mathematics Session",
      "description": "Live session covering calculus fundamentals",
      "class_type": "video",
      "scheduled_start_time": "2025-09-20T15:00:00Z",
      "estimated_duration": 90,
      "target_audience": "members",
      "target_class_id": "OTU#004001",
      "notification_preferences": {
        "email": true,
        "sms": true
      },
      "streaming_settings": {
        "video_quality": "HD",
        "audio_quality": "high"
      }
    }'

  STEP 2: ADMIN REVIEWS AND APPROVES

  Role: Admin
  Endpoints:
  1. View Pending: GET /api/classes/live/admin/pending
  2. Review/Approve: PUT /api/classes/live/admin/review/:scheduleId

  # Check pending approvals
  curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
    http://localhost:3333/api/classes/live/admin/pending

  # Approve the session
  curl -X PUT http://localhost:3333/api/classes/live/admin/review/SESSION_ID \
    -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "action": "approve",
      "admin_notes": "Session approved for technical content"
    }'

  STEP 3: SYSTEM NOTIFIES ATTENDEES

  Role: System (Automated)
  Endpoint: POST /api/classes/live/admin/notify/:scheduleId

  # Admin can manually trigger notifications if needed
  curl -X POST http://localhost:3333/api/classes/live/admin/notify/SESSION_ID \
    -H "Authorization: Bearer ADMIN_JWT_TOKEN"

  STEP 4: INSTRUCTOR STARTS LIVE SESSION

  Role: Instructor
  Endpoint: POST /api/classes/live/start/:sessionId

  curl -X POST http://localhost:3333/api/classes/live/start/SESSION_ID \
    -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN"

  STEP 5: STUDENTS JOIN LIVE SESSION

  Role: Students/Attendees
  Endpoints:
  1. Join Session: POST /api/classes/:classId/classroom/sessions/:sessionId/join
  2. View Session: GET /api/classes/:classId/classroom/session

  # Join the live session
  curl -X POST http://localhost:3333/api/classes/OTU#004001/classroom/sessions/SESSION_ID/join \
    -H "Authorization: Bearer STUDENT_JWT_TOKEN"

  # Get session details
  curl -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
    http://localhost:3333/api/classes/OTU#004001/classroom/session

  STEP 6: INTERACTION DURING SESSION

  Available Actions (TESTED & WORKING ✅):
  - Get Chat Messages: GET /api/classes/:id/classroom/chat
  - Send Chat Message: POST /api/classes/:id/classroom/chat
  - View Participants: GET /api/classes/:id/classroom/participants
  - Mark Attendance: POST /api/classes/:id/classroom/attendance

  # CHAT SYSTEM - TESTED ENDPOINTS ✅

  ## Get Chat Messages
  curl -H "Authorization: Bearer JWT_TOKEN" \
    http://localhost:3333/api/classes/OTU%23001001/classroom/chat

  Response: {
    "success": true,
    "data": {
      "messages": [
        {
          "id": 24,
          "message": "Welcome to our live mathematics session!",
          "author_converse_id": "OTO#C002O2",
          "username": "pet",
          "timestamp": "2025-09-17T04:53:57.336Z",
          "message_type": "announcement"
        }
      ],
      "participants": [
        {
          "userId": 2,
          "converseId": "OTO#C002O2",
          "username": "pet",
          "isActive": 1
        }
      ],
      "total_messages": 1,
      "class_id": "OTU#001001"
    }
  }

  ## Send Chat Message
  curl -X POST http://localhost:3333/api/classes/OTU%23001001/classroom/chat \
    -H "Authorization: Bearer JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Great question about derivatives!",
      "message_type": "chat"
    }'

  Response: {
    "success": true,
    "data": {
      "id": 25,
      "message": "Great question about derivatives!",
      "author_converse_id": "OTO#D003V3",
      "username": "yahoomond",
      "timestamp": "2025-09-17T04:54:22.198Z",
      "message_type": "chat"
    }
  }

  ## Message Types Supported:
  - "chat" - Regular student/instructor messages
  - "announcement" - Instructor announcements
  - "instruction" - Teaching directives

  ## Database Storage:
  - Messages stored in class_content table with content_type = 'chat_message'
  - Real-time delivery via Socket.IO (classroom_${classId} rooms)
  - Persistent storage for message history and offline access

---

# 🎯 **COMPREHENSIVE CLASSROOM INTERACTIONS GUIDE**

## **TESTED & VERIFIED INTERACTION PROCEDURES** ✅

### **📋 STUDENT PROCEDURES**

#### **1. ATTENDANCE MARKING** ✅ **WORKING**
**Purpose**: Track participation in live and recorded sessions
**Endpoint**: `POST /api/classes/:id/attendance`

```bash
# Mark attendance for current session
curl -X POST http://localhost:3333/api/classes/OTU%23001001/attendance \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "present",
    "session_type": "live_session"
  }'

# Response: {"success":true,"attendance_id":2,"status":"present","check_in_time":"2025-09-17T05:26:56Z"}
```

**Student Action Steps:**
1. Join live session or access recorded content
2. Use attendance endpoint to mark presence
3. System automatically records timestamp and session details

#### **2. SUBMITTING FEEDBACK** ✅ **WORKING**
**Purpose**: Provide course evaluation and lesson feedback
**Endpoint**: `POST /api/classes/:id/feedback`

```bash
# Submit lesson feedback with rating
curl -X POST http://localhost:3333/api/classes/OTU%23001001/feedback \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "feedback_text": "Excellent calculus session! The instructor explained derivatives very clearly.",
    "feedback_type": "lesson_feedback",
    "lesson_id": 26
  }'

# Response: {"success":true,"feedback_id":2,"rating":5,"submitted_at":"2025-09-17T05:28:04Z"}
```

**Student Action Steps:**
1. Complete lesson or session
2. Rate experience (1-5 stars)
3. Provide detailed feedback text
4. Submit for instructor and admin review

#### **3. UPLOADING MATERIALS** ✅ **WORKING**
**Purpose**: Share projects, assignments, and study materials
**Endpoint**: `POST /api/classes/:id/videos` (handles all content types)
**Status**: **Requires Admin Approval**

```bash
# Upload student project or assignment
curl -X POST http://localhost:3333/api/classes/OTU%23001001/videos \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -F "title=Student Project - Calculus Research" \
  -F "description=Research paper on advanced calculus applications" \
  -F "content_type=document" \
  -F "tags=research,calculus,student-project"

# Response: {
#   "success":true,
#   "content_id":27,
#   "is_published":false,
#   "next_step":"Admin review required before content becomes available"
# }
```

**Student Action Steps:**
1. Prepare assignment/project materials
2. Upload using content endpoint
3. Content goes to **pending approval** (`is_published = 0`)
4. Wait for admin review and approval
5. Once approved, content becomes visible to class

#### **4. PEER INTERACTIONS** ✅ **WORKING**
**Purpose**: Student-to-student discussions and collaboration
**Endpoints**: Classroom chat system

```bash
# Participate in classroom discussions
curl -X POST http://localhost:3333/api/classes/OTU%23001001/classroom/chat \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi everyone! Does anyone have notes from yesterday lesson on integration by parts?",
    "message_type": "chat"
  }'

# Response: {"success":true,"id":28,"message_type":"chat","created_by":3}
```

**Student Action Steps:**
1. Join classroom chat during live sessions
2. Ask questions and share insights with peers
3. Collaborate on assignments and study groups
4. Messages are stored and searchable

#### **5. LEAVING CLASS** ✅ **WORKING**
**Purpose**: Withdraw from class enrollment
**Endpoint**: `POST /api/classes/:id/leave`

```bash
# Leave class enrollment
curl -X POST http://localhost:3333/api/classes/OTU%23001001/leave \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Completed the course objectives"
  }'

# Response: {"success":true,"left_at":"2025-09-17T05:31:29Z"}
```

**Student Action Steps:**
1. Consider withdrawal carefully
2. Provide reason for leaving
3. System removes class membership
4. Lose access to class materials and discussions

### **🎓 INSTRUCTOR PROCEDURES**

#### **1. CONTENT MANAGEMENT** ✅ **WORKING**
**Purpose**: Upload and manage teaching materials
**Endpoints**: Same upload system with instructor privileges

```bash
# Upload teaching content (published immediately for instructors)
curl -X POST http://localhost:3333/api/classes/OTU%23001001/videos \
  -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  -F "title=Advanced Calculus Lesson 1" \
  -F "description=Introduction to limits and derivatives" \
  -F "content_type=video" \
  -F "duration=3600"

# Instructor content may be auto-approved or require admin review based on settings
```

#### **2. STUDENT MONITORING** ✅ **WORKING**
**Purpose**: Track attendance and participation

```bash
# View class attendance records
curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/attendance/reports"

# Response: Comprehensive attendance analytics
{
  "success": true,
  "message": "Attendance reports retrieved successfully",
  "data": {
    "class_id": "OTU#004001",
    "summary": {
      "total_students": 2,
      "total_attendance_records": 3,
      "days_with_attendance": 1
    },
    "daily_stats": [
      {
        "total_students_attended": 1,
        "total_attendance_records": 3,
        "attendance_date": "2025-09-17T00:00:00.000Z",
        "daily_attendance": 3
      }
    ],
    "student_attendance": [
      {
        "student_id": 2,
        "username": "pet",
        "converse_id": "OTO#C002O2",
        "sessions_attended": 3,
        "last_attendance": "2025-09-17T05:59:46.000Z",
        "first_attendance": "2025-09-17T05:47:10.000Z"
      }
    ],
    "recent_records": [
      {
        "id": 5,
        "user_id": 2,
        "username": "pet",
        "check_in_time": "2025-09-17T05:59:46.000Z",
        "status": "present",
        "notes": "Testing attendance",
        "location": "Test Location"
      }
    ]
  }
}

# Monitor classroom discussions and moderate chat
curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/classroom/chat"
```

#### **3. FEEDBACK ANALYSIS** ✅ **WORKING**
**Purpose**: Review student feedback for course improvement

```bash
# View student feedback and ratings
curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/feedback/summary"

# Response: Complete feedback analytics
{
  "success": true,
  "message": "Feedback summary retrieved successfully",
  "data": {
    "class_id": "OTU#004001",
    "summary": {
      "total_feedback": 1,
      "average_rating": "5.00",
      "positive_feedback": 1,
      "negative_feedback": 0
    },
    "feedback_by_type": [
      {
        "total_feedback_count": 1,
        "average_rating": "5.00",
        "positive_feedback": 1,
        "negative_feedback": 0,
        "feedback_type": "course"
      }
    ],
    "rating_distribution": [
      {
        "rating": 5,
        "count": 1
      }
    ],
    "detailed_feedback": [
      {
        "id": 3,
        "user_id": 2,
        "username": "pet",
        "rating": 5,
        "feedback_text": "Excellent class! Very informative.",
        "feedback_type": "course",
        "createdAt": "2025-09-17T06:00:10.000Z"
      }
    ]
  }
}
```

### **🔐 ADMIN PROCEDURES**

#### **1. CONTENT APPROVAL WORKFLOW** ✅ **FULLY TESTED**

**STEP 1: View Pending Content**
```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3333/api/classes/admin/pending-approvals?type=videos"

# Response: Array of pending student and instructor uploads
```

**STEP 2: Review Content Details**
```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3333/api/classes/admin/OTU#001001/content/27"

# Review student upload details before approval
```

**STEP 3: Approve or Reject Content**
```bash
curl -X PUT http://localhost:3333/api/classes/admin/content/27/review \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "admin_notes": "Excellent student research project - approved"
  }'

# Result: Content becomes available to students (is_published = 1)
```

#### **2. CLASS OVERSIGHT** ✅ **WORKING**
**Purpose**: Monitor all classroom activities and interactions

```bash
# View all class activities across sessions
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3333/api/classes/admin/dashboard"

# Monitor attendance patterns
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3333/api/classes/admin/attendance/analytics"
```

## **🔄 COMPLETE WORKFLOW DIAGRAMS**

### **📈 STUDENT JOURNEY FLOW**
```
1. JOIN CLASS
   ↓
2. ACCESS CONTENT (Live/Recorded)
   ↓
3. MARK ATTENDANCE → Database: class_attendance table
   ↓
4. PARTICIPATE IN CHAT → Real-time via Socket.IO
   ↓
5. UPLOAD MATERIALS → Status: pending_approval
   ↓
6. SUBMIT FEEDBACK → Database: class_feedback table
   ↓
7. LEAVE CLASS (Optional) → Remove membership
```

### **🎓 INSTRUCTOR WORKFLOW**
```
1. UPLOAD CONTENT → Status: published OR pending_approval
   ↓
2. START LIVE SESSION → Students can join
   ↓
3. MODERATE CHAT → Real-time classroom management
   ↓
4. MONITOR ATTENDANCE → View participation reports
   ↓
5. REVIEW FEEDBACK → Improve course content
```

### **🔐 ADMIN APPROVAL CYCLE**
```
CONTENT UPLOADED (Student/Instructor)
   ↓
PENDING REVIEW (is_published = 0)
   ↓
ADMIN REVIEW → View content details
   ↓
DECISION:
├── APPROVE → is_published = 1 → Visible to students
└── REJECT → Content remains hidden
```

### **💬 REAL-TIME CHAT FLOW**
```
STUDENT/INSTRUCTOR SENDS MESSAGE
   ↓ (Dual Path)
1. Socket.IO → Real-time delivery to classroom_${classId}
2. Database → Stored in class_content (content_type = 'chat_message')
   ↓
MESSAGE APPEARS IN CHAT UI
   ↓
PERSISTENT STORAGE for history and search
```

## **📋 DATABASE INTERACTION SUMMARY**

### **Key Tables Used:**
- **`class_content`**: All content (videos, documents, chat messages)
- **`class_attendance`**: Student participation tracking
- **`class_feedback`**: Course evaluations and ratings
- **`user_class_memberships`**: Class enrollment management
- **`classroom_participants`**: Live session tracking

### **Content States:**
- **`is_published = 0`**: Pending approval (student uploads)
- **`is_published = 1`**: Approved and visible (instructor/approved content)
- **`content_type = 'chat_message'`**: Real-time chat messages
- **`content_type = 'video'`**: Video lessons and recordings
- **`content_type = 'document'`**: PDFs, assignments, projects

---


  (Upload pre-recorded content with approval process)

  ---
  🔵 UPDATED RECORDED SESSION WORKFLOW

  STEP 1: INSTRUCTOR UPLOADS VIDEO/AUDIO CONTENT

  Role: Instructor (Member level required)Endpoint: POST
  /api/classes/:id/videosStatus: Content uploaded but NOT LIVE (pending
  approval)

  curl -X POST http://localhost:3333/api/classes/OTU#004001/videos \
    -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
    -F "video=@/path/to/your/teaching_video.mp4" \
    -F "title=Advanced Calculus Lesson 1" \
    -F "description=Introduction to limits and derivatives" \
    -F "duration=3600" \
    -F "tags=calculus,mathematics,advanced"

  Result: Video uploaded with status pending_approval - NOT visible to 
  students yet

  ---
  STEP 2: ADMIN REVIEWS UPLOADED CONTENT

  Role: AdminEndpoints:
  1. View Pending Content: GET /api/classes/admin/pending-approvals
  2. Review Content Details: GET
  /api/classes/admin/:classId/content/:contentId

  # Get all pending content for approval
  curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \

  "http://localhost:3333/api/classes/admin/pending-approvals?type=videos"

  # Review specific video content
  curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
    "http://localhost:3333/api/classes/admin/OTU#004001/content/VIDEO_ID"

  ---
  STEP 3: ADMIN APPROVES OR REJECTS CONTENT

  Role: AdminEndpoint: PUT /api/classes/admin/content/:contentId/review

  # APPROVE the content
  curl -X PUT
  http://localhost:3333/api/classes/admin/content/VIDEO_ID/review \
    -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "action": "approve",
      "admin_notes": "Content approved - high quality educational
  material",
      "visibility": "public",
      "featured": false
    }'

  # OR REJECT the content
  curl -X PUT
  http://localhost:3333/api/classes/admin/content/VIDEO_ID/review \
    -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "action": "reject",
      "admin_notes": "Content needs improvement in audio quality",
      "feedback_for_instructor": "Please re-record with better audio
  equipment"
    }'

  ---
  STEP 4: SYSTEM MAKES APPROVED CONTENT AVAILABLE

  Role: System (Automated after approval)Actions:
  - Content status changes from pending_approval → approved
  - Content becomes visible to students
  - Notifications sent to instructor about approval
  - Content appears in class video listings

  ---
  STEP 5: INSTRUCTOR CREATES CLASSROOM SESSION (OPTIONAL)

  Role: InstructorEndpoint: POST /api/classes/:id/classroom/sessions
  Note: This step is optional - students can access videos directly or
  instructor can create guided sessions

  curl -X POST
  http://localhost:3333/api/classes/OTU#004001/classroom/sessions \
    -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "session_type": "recorded",
      "video_id": "APPROVED_VIDEO_ID",
      "title": "Guided Study: Calculus Fundamentals",
      "description": "Self-paced learning with discussion",
      "availability": "immediate",
      "allow_chat": true,
      "require_attendance": true
    }'

  ---
  STEP 6: STUDENTS ACCESS APPROVED CONTENT

  Role: StudentsEndpoints:
  1. View Available Videos: GET /api/classes/:id/videos (only shows
  approved content)
  2. Access Session: GET /api/classes/:id/classroom/session

  # Get list of approved videos (students only see approved content)
  curl -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
    "http://localhost:3333/api/classes/OTU#004001/videos?status=approved"

  # Access the classroom session
  curl -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
    "http://localhost:3333/api/classes/OTU#004001/classroom/session"

  ---
  🔄 KEY WORKFLOW DIFFERENCES

  LIVE SESSIONS:

  1. ✅ Pre-scheduling required
  2. ✅ Admin pre-approval required
  3. ✅ Scheduled time enforcement
  4. ✅ Real-time interaction

  RECORDED SESSIONS:

  1. ❌ NO pre-scheduling needed
  2. ✅ Content approval AFTER upload required
  3. ❌ NO time restrictions
  4. ✅ Immediate availability after approval

  ---
  📊 CONTENT APPROVAL ADMIN ENDPOINTS

  # Admin dashboard for content management
  GET    /api/classes/admin/pending-approvals?type=videos

  # Review specific content
  GET    /api/classes/admin/:classId/content/:contentId
  PUT    /api/classes/admin/content/:contentId/review

  # Batch approval operations
  POST   /api/classes/admin/content/batch-approve
  POST   /api/classes/admin/content/batch-reject

  # Content analytics
  GET    /api/classes/admin/content/analytics
  GET    /api/classes/admin/content/reports

  ---
  🎯 SUMMARY OF CORRECTED WORKFLOW

  For Recorded Content:
  1. Instructor uploads → Content is pending_approval (not visible)
  2. Admin reviews → Checks quality, appropriateness, compliance
  3. Admin approves/rejects → Content becomes available or gets feedback
  4. Students access → Only approved content is visible to students
  5. Optional guided sessions → Instructor can create structured learning
   sessions

  This ensures quality control while allowing flexibility for recorded
  content without unnecessary scheduling overhead.

  ---

# 🌐 FRONTEND USER ACCESS PATHS & COMPONENT MAPPING

## 📱 USER ACCESS PATHS (Students/Instructors)

### **CLASS DISCOVERY & ACCESS**
- **URL:** `/classes`
- **Component:** `ClassListPage.jsx`
- **Features:** Browse all public classes, search & filter
- **API Calls:**
  - `GET /classes?search=&type=&status=` - Fetch all classes with filters

### **MY CLASSES DASHBOARD**
- **URL:** `/classes/my-classes`
- **Component:** `MyClassesPage.jsx`
- **Features:** View enrolled classes, progress, schedule live sessions
- **API Calls:**
  - `GET /classes/my-classes` - Get user's enrolled classes
  - `GET /classes/my-progress` - Get user progress
  - `POST /classes/${classId}/leave` - Leave a class
  - `POST /classes/live/schedule` - Schedule live teaching session

### **CLASS PREVIEW/OVERVIEW**
- **URL:** `/classes/:classId`
- **Component:** `ClassPreview.jsx`
- **Features:** Class details, "Enter Classroom" button, join/leave actions
- **API Calls:**
  - `GET /classes/${classId}` - Get class details
  - `GET /classes/${classId}/stats` - Get class statistics
  - `GET /classes/${classId}/content?limit=3&type=announcement` - Get recent announcements
  - `POST /classes/${classId}/join` - Join the class

### **CLASSROOM CONTENT HUB**
- **URL:** `/classes/:classId/classroom`
- **Component:** `ClassContentViewer.jsx`
- **Features:** Class materials, member interactions, content creation
- **API Calls:**
  - `GET /classes/${classId}` - Get class info
  - `GET /classes/${classId}/content` - Get class content
  - `GET /classes/${classId}/members` - Get class members
  - `POST /classes/${classId}/feedback` - Submit feedback
  - `POST /classes/${classId}/attendance` - Mark attendance
  - `POST /classes/${classId}/content` - Create content
  - `DELETE /classes/${classId}/content/${contentId}` - Delete content

### **VIDEO TEACHING CLASSROOM**
- **URL:** `/classes/:classId/video`
- **Component:** `ClassroomVideoViewer.jsx`
- **Features:** Live/recorded video sessions, chat, attendance
- **API Calls:**
  - `GET /classes/${classId}/classroom/session` - Get session info
  - `GET /classes/${classId}/classroom/chat` - Get chat messages
  - `GET /classes/${classId}/members` - Get participants
  - `POST /classes/${classId}/classroom/chat` - Send chat message
  - `POST /classes/${classId}/classroom/attendance` - Mark attendance

### **CLASS MENTORSHIP**
- **URL:** `/classes/:classId` (integrated feature)
- **Component:** `ClassMentorshipView.jsx`
- **Features:** Mentor-student pairing within classes
- **API Calls:**
  - `GET /classes/${classId}/mentorship-pairs` - Get mentorship pairs
  - `GET /classes/${classId}/my-mentorship-status` - Get mentorship status
  - `POST /classes/${classId}/request-mentor` - Request mentor
  - `POST /classes/${classId}/accept-mentorship` - Accept mentorship

---

## 🔐 ADMIN ACCESS PATHS (Super Admin)

### **CLASS ADMINISTRATION DASHBOARD**
- **URL:** `/admin/audienceclassmgr`
- **Component:** `AudienceClassMgr.jsx`
- **Features:** Complete class management, CRUD operations, analytics
- **Key API Calls:**
  - `GET /classes/admin/dashboard` - Admin dashboard data
  - `GET /classes/admin/stats` - System statistics
  - `GET /classes/admin` - Get all classes (admin view)
  - `POST /classes/admin` - Create new class
  - `PUT /classes/admin/${classId}` - Update class
  - `DELETE /classes/admin/${classId}` - Delete class
  - `GET /classes/admin/pending-approvals` - Get pending approvals
  - `GET /classes/admin/audit-logs` - Get audit logs
  - `GET /classes/admin/analytics` - Get analytics data
  - `PUT /classes/admin/settings` - Update system settings

### **LIVE CLASS MANAGEMENT**
- **URL:** `/admin/liveclassmanagement`
- **Component:** `LiveClassManagement.jsx`
- **Features:** Manage live teaching sessions, approvals, monitoring
- **Key API Calls:**
  - `GET /classes/live/admin/dashboard` - Live class dashboard
  - `GET /classes/live/admin/pending` - Pending live sessions
  - `PUT /classes/live/admin/review/${scheduleId}` - Approve/reject sessions
  - `GET /classes/live/admin/stats/${classId}` - Live session stats

### **PARTICIPANT MANAGEMENT**
- **Accessed via:** `AudienceClassMgr.jsx` (Participant Manager Modal)
- **Features:** Add/remove participants, role management, bulk operations
- **Key API Calls:**
  - `GET /classes/admin/${classId}/participants` - Get participants
  - `PUT /classes/admin/${classId}/participants/${userId}` - Manage participant
  - `POST /classes/admin/${classId}/participants/add` - Add participants
  - `POST /classes/admin/${classId}/participants/bulk` - Bulk operations

### **CONTENT APPROVAL SYSTEM**
- **Accessed via:** `AudienceClassMgr.jsx` (Content Manager Modal)
- **Features:** Review and approve uploaded videos/content
- **Key API Calls:**
  - `GET /classes/admin/${classId}/content` - Get class content
  - `PUT /classes/admin/content/${contentId}/review` - Approve/reject content

### **BULK OPERATIONS**
- **Accessed via:** `AudienceClassMgr.jsx` (Bulk Operations Modal)
- **Features:** Mass operations on multiple classes
- **Key API Calls:**
  - `DELETE /classes/admin/bulk-delete` - Bulk delete classes
  - `PUT /classes/admin/bulk-update` - Bulk update classes
  - `POST /classes/admin/approve-batch` - Batch approve items

### **ANALYTICS & REPORTING**
- **Accessed via:** `AudienceClassMgr.jsx` (Analytics Tab)
- **Features:** Comprehensive analytics, custom reports, data export
- **Key API Calls:**
  - `GET /classes/admin/analytics` - Get analytics
  - `GET /classes/admin/export` - Export class data
  - `POST /classes/admin/reports` - Generate custom reports

---

## 🔒 ACCESS CONTROL SUMMARY

### **ROLE-BASED ACCESS**
- **Public Routes:** `/`, `/login`, `/signup` - No authentication required
- **Pre-Member Routes:** `/classes/*` - Requires `requirePreMember={true}` protection
- **Admin Routes:** `/admin/*` - Requires admin role authentication

### **AUTHENTICATION MIDDLEWARE**
- **Frontend:** `ProtectedRoute` component with role checking
- **Backend:** JWT token authentication with role validation
- **Roles:** `visitor`, `applicant`, `pre_member`, `member`, `admin`, `super_admin`

### **COMPONENT PROTECTION LEVELS**
1. **ClassListPage, MyClassesPage, ClassPreview:** Pre-member required
2. **ClassContentViewer, ClassroomVideoViewer:** Pre-member required
3. **AudienceClassMgr, LiveClassManagement:** Admin required
4. **Admin content management:** Super admin required

---
  👥 ROLE-BASED ACCESS SUMMARY

  INSTRUCTOR CAPABILITIES:

  - ✅ Schedule live sessions
  - ✅ Upload recorded videos
  - ✅ Start live sessions
  - ✅ Create classroom sessions
  - ✅ View session participants
  - ✅ Manage session content

  STUDENT/ATTENDEE CAPABILITIES:

  - ✅ View upcoming sessions
  - ✅ Join live/recorded sessions
  - ✅ Mark attendance
  - ✅ Participate in chat
  - ✅ Access recorded content

  ADMIN CAPABILITIES:

  - ✅ View all pending live sessions
  - ✅ Approve/reject live sessions
  - ✅ Force start sessions
  - ✅ Control live sessions
  - ✅ View analytics dashboard
  - ✅ Manage all content

  ---
  🎯 COMPLETE WORKFLOW ENDPOINTS REFERENCE

  Live Session Management:

  POST   /api/classes/live/schedule           - Schedule live session (Instructor)
  GET    /api/classes/live/my-sessions        - Get my sessions (Instructor)
  POST   /api/classes/live/start/:sessionId   - Start session (Instructor)
  GET    /api/classes/live/admin/pending      - Pending approvals (Admin)
  PUT    /api/classes/live/admin/review/:id   - Approve/reject (Admin)
  POST   /api/classes/live/admin/notify/:id   - Send notifications (Admin)

  Video/Audio Management:

  POST   /api/classes/:id/videos              - Upload video/audio (Instructor)
  GET    /api/classes/:id/videos              - Get class videos (All)
  DELETE /api/classes/:id/videos/:videoId     - Delete video (Instructor/Admin)

  Classroom Sessions:

  POST   /api/classes/:id/classroom/sessions           - Create session (Instructor)
  GET    /api/classes/:id/classroom/session            - Get session info (All)
  POST   /api/classes/:id/classroom/sessions/:id/join  - Join session (Students)

  Interactive Features - TESTED & WORKING ✅:

  POST   /api/classes/:id/attendance                   - Mark attendance (All) ✅
  POST   /api/classes/:id/feedback                     - Submit feedback (Students) ✅
  GET    /api/classes/:id/classroom/chat               - Get chat messages (All) ✅
  POST   /api/classes/:id/classroom/chat               - Send chat message (All) ✅
  GET    /api/classes/:id/classroom/participants       - View participants (All) ✅
  POST   /api/classes/:id/leave                        - Leave class (Students) ✅

  Content Management:

  POST   /api/classes/:id/videos                       - Upload materials (Students/Instructors) ✅
  GET    /api/classes/admin/pending-approvals          - View pending content (Admin) ✅
  PUT    /api/classes/admin/content/:id/review         - Approve/reject content (Admin) ✅
  GET    /api/classes/:id/videos?status=approved       - Access approved content (Students) ✅

  Student Discussion System:

  POST   /api/content/comments                         - Comment on lessons (Students)
  GET    /api/content/comments/search                  - Search discussions (All)

  This comprehensive system ensures proper classroom interaction management with content approval
  workflows, real-time communication, and robust participation tracking.

---

# 🧪 COMPREHENSIVE TESTING STATUS - SEPTEMBER 2025

## ✅ **FULLY TESTED & WORKING SYSTEMS**

### **TYPE 2: LIVE TEACHING SESSIONS** ✅ **100% FUNCTIONAL**
- ✅ **Chat System**: Both REST endpoints and Socket.IO messaging tested
- ✅ **Database Integration**: Messages persist in `class_content` table
- ✅ **Authentication**: JWT validation and role-based access working
- ✅ **Live Sessions**: Session creation, joining, and management functional

### **TYPE 3: RECORDED TEACHING SESSIONS** ✅ **100% FUNCTIONAL**
- ✅ **Upload Workflow**: Content uploaded with pending approval status
- ✅ **Admin Review**: Approval/rejection workflow tested
- ✅ **Student Access**: Approved content properly accessible
- ✅ **Database Integration**: Content states managed correctly

### **CLASSROOM INTERACTIONS** ✅ **100% FUNCTIONAL**
- ✅ **Attendance System**: Students mark attendance with timestamp tracking
- ✅ **Feedback System**: Course evaluation with ratings and comments
- ✅ **Student Uploads**: Material sharing with admin approval workflow
- ✅ **Peer Interactions**: Student-to-student chat and discussions
- ✅ **Class Management**: Join/leave functionality with membership tracking
- ✅ **NEW: Instructor Analytics**: Attendance reports and feedback summaries for instructors

#### **TESTED ENDPOINTS WITH EXAMPLES:**

**Chat Messaging:**
```bash
# Send Message (TESTED ✅)
curl -X POST http://localhost:3333/api/classes/OTU%23001001/classroom/chat \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Welcome to our live session!", "message_type": "announcement"}'

# Result: {"success":true,"data":{"id":24,"message":"Welcome to our live session!"}}
```

**Get Chat History:**
```bash
# Get Messages (TESTED ✅)
curl -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3333/api/classes/OTU%23001001/classroom/chat

# Result: Returns messages array with participants list
```

**NEW: Instructor Attendance Reports:**
```bash
# Get Attendance Analytics (TESTED ✅)
curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/attendance/reports"

# Result: {"success":true,"data":{"summary":{"total_students":2,"total_attendance_records":3}}}
```

**NEW: Instructor Feedback Summary:**
```bash
# Get Feedback Analytics (TESTED ✅)
curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/feedback/summary"

# Result: {"success":true,"data":{"summary":{"total_feedback":1,"average_rating":"5.00"}}}
```

### **VERIFIED DATABASE INTEGRATION** ✅
- Chat messages stored with `content_type = 'chat_message'`
- User authentication validated against `user_class_memberships`
- Active participants tracked in `classroom_participants`
- Message persistence confirmed in production database

### **SOCKET.IO REAL-TIME SYSTEM** ✅
- **Classroom Rooms**: `classroom_${classId}` (e.g., `classroom_OTU#001001`)
- **Real-time Message Delivery**: <50ms latency
- **Automatic Database Storage**: Messages saved on send
- **Typing Indicators**: Real-time "user is typing" functionality
- **Participant Management**: Join/leave notifications

#### **Socket.IO Implementation Details:**
```javascript
// Client Side - Send Message
socket.emit('sendMessage', {
  room: 'classroom_OTU#001001',
  message: 'Hello everyone!',
  classId: 'OTU#001001',
  message_type: 'chat'
});

// Client Side - Receive Messages
socket.on('receiveMessage', (messageData) => {
  // Display message in chat UI
  displayMessage(messageData);
});

// Server Side - Room Management (ikootaapi/socket.js)
socket.join(`classroom_${classId}`);
socket.to(`classroom_${classId}`).emit('receiveMessage', messageData);
```

#### **Database Integration:**
- **Storage Table**: `class_content` with `content_type = 'chat_message'`
- **Real-time + Persistence**: Messages stored while being delivered live
- **Participant Tracking**: `classroom_participants` table updated on join/leave

## 🔧 **IMPLEMENTATION ARCHITECTURE**

### **Hybrid Chat System:**
- **Primary**: Socket.IO for real-time messaging
- **Secondary**: REST API for message history/reliability
- **Storage**: MySQL database with enhanced chat tables
- **Authentication**: JWT with role hierarchy validation

### **Message Types Supported:**
- `chat` - Student/instructor regular messages
- `announcement` - Instructor announcements
- `instruction` - Teaching directives

### **Security Features:**
- Class membership validation before chat access
- Role-based message type restrictions
- JWT authentication required for all endpoints
- Proper error handling and user feedback

## 📊 **PRODUCTION READINESS STATUS**

### **Server Configuration:** ✅ **OPERATIONAL**
- **Port**: 3333 (all documentation updated)
- **Database**: AWS RDS MySQL (ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com)
- **File Storage**: AWS S3 (ikoota-videos bucket)
- **Real-time**: Socket.IO with WebSocket transport

### **Test Users Verified:**
- **Instructor**: petersomond@gmail.com (super_admin role)
- **Student**: peters_o_mond@yahoo.com (admin role)
- **Both users**: Successfully joined classroom sessions and exchanged messages

### **Performance Metrics:**
- **Message Latency**: <100ms via Socket.IO
- **Database Response**: <200ms for chat history
- **Concurrent Users**: Supports multiple participants per session
- **Message Persistence**: 100% reliable storage

---

class_attendance 
 class_content                                   
 class_content_access                            
 class_feedback                                  
 class_member_counts                             
 class_sessions                                  
 classes                                         
 classes_backup                                  
 classroom_chat_analytics                        
 classroom_chat_files                            
 classroom_chat_moderation_log                   
 classroom_chat_reactions                        
 classroom_chat_typing                           
 classroom_participants                          
 classroom_pinned_messages 
  live_class_audit_log                            
 live_class_schedules                            
 live_class_sessions       
user_class_memberships 
video_session_chat                              
 video_session_participants                      
 video_sessions                                  
 voice_presets   


# 🛠️ CRITICAL SYSTEM FIXES & UPDATES (Latest - September 2025)

## 🔧 **PERMANENT FIXES APPLIED TO PRODUCTION SYSTEM**

### **1. ROLE HIERARCHY AUTHORIZATION BUG - FIXED** ✅
**File:** `ikootaapi/middleware/auth.js:318-320`
**Issue:** `super_admin` users couldn't access `admin`-required endpoints due to exact string matching
**Solution:** Implemented hierarchical role checking:
```javascript
// BEFORE (BROKEN):
if (!roles.includes(userRole)) {
  // Exact match only - super_admin couldn't access admin endpoints
}

// AFTER (FIXED):
const hasPermission = roles.includes(userRole) ||
                     (userRole === 'super_admin' && roles.includes('admin'));
```
**Impact:** Super admins now have full admin access permanently

### **2. MEMBERSHIP HIERARCHY MIDDLEWARE - VERIFIED** ✅
**File:** `ikootaapi/middleware/auth.js:508-530`
**Status:** Already implemented correctly with level-based checking:
```javascript
const membershipHierarchy = {
  'none': 0,
  'pre_member': 1,
  'member': 2,
  'full_member': 3,
  'senior_member': 4
};
```

### **3. ROUTE ORDERING FIXED** ✅
**File:** `ikootaapi/routes/classRoutes.js:77-105`
**Issue:** `/my-classes` route was being caught by `/:classId` parameter route
**Solution:** Moved specific routes before parameterized routes:
```javascript
// Specific routes FIRST
router.get('/my-classes', ...)
router.get('/my-progress', ...)

// Parameterized routes AFTER
router.get('/:classId', ...)
```

### **4. DATABASE SCHEMA FIXES** ✅
**File:** `ikootaapi/services/classContentService.js:joinClassroomSession`
**Issue:** `createdAt` field didn't exist in `classroom_participants` table
**Solution:** Removed non-existent field from INSERT query:
```sql
-- BEFORE (BROKEN):
INSERT INTO classroom_participants (
  classId, userId, converseId, username, joinedAt, isActive, createdAt
) VALUES (?, ?, ?, ?, NOW(), 1, NOW())

-- AFTER (FIXED):
INSERT INTO classroom_participants (
  classId, userId, converseId, username, joinedAt, isActive
) VALUES (?, ?, ?, ?, NOW(), 1)
```

### **5. LIVE SESSION SQL SYNTAX FIXED** ✅
**File:** `ikootaapi/services/liveClassService.js:334-346`
**Issue:** Missing JSON.stringify for streaming_settings parameter
**Solution:** Added proper JSON handling:
```javascript
// FIXED: Proper JSON handling for streaming_settings
JSON.stringify(schedule.streaming_settings || {})
```

---

## 📊 **COMPREHENSIVE TESTING RESULTS - ALL SYSTEMS VERIFIED**

### ✅ **TYPE 1: Traditional Class Sessions** - FULLY FUNCTIONAL
- ✅ Class browsing and filtering
- ✅ Class joining/leaving mechanisms
- ✅ Member management and role assignment
- ✅ Attendance tracking system
- ✅ Feedback collection system
- ✅ Content sharing (documents, images, videos)

### ✅ **TYPE 2: Live Teaching Sessions** - FULLY FUNCTIONAL
- ✅ Session scheduling by instructors
- ✅ Admin approval workflow
- ✅ Email/SMS notification system (Twilio)
- ✅ Live session start/stop controls
- ✅ Student joining mechanisms
- ✅ Real-time chat functionality

### ✅ **TYPE 3: Recorded Teaching Sessions** - FULLY FUNCTIONAL
- ✅ **File Upload System:** Documents, Videos, Audio, Mixed files
- ✅ **S3 Storage Integration:** AWS S3 with public-read ACL
- ✅ **Admin Approval Workflow:** Content review before student access
- ✅ **Student Access Control:** Only approved content visible
- ✅ **Classroom Sessions:** Optional guided learning sessions

### ✅ **INFRASTRUCTURE SYSTEMS** - VERIFIED OPERATIONAL
- ✅ **Socket.IO Real-time Features:** WebSocket transport enabled
- ✅ **Database Connectivity:** MySQL with 94 tables accessible
- ✅ **Authentication System:** JWT with corrected role hierarchy
- ✅ **File Upload Limits:** 5GB video files, 100MB documents
- ✅ **Email System:** Gmail SMTP verified
- ✅ **SMS System:** Twilio integration verified
- ✅ **Chat System:** 17 active chats with rich media support

---

## 🎯 **UPDATED API ENDPOINTS WITH FIXES**

### **CLASS CONTENT ADMIN APPROVAL** ✅
```bash
# WORKING ENDPOINT: Admin content approval (super_admin access fixed)
PUT /api/classes/admin/content/:contentId/review

curl -X PUT http://localhost:3333/api/classes/admin/content/22/review \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "admin_notes": "Content approved - meets quality standards"
  }'
```

### **FILE UPLOAD SYSTEM** ✅
```bash
# WORKING ENDPOINT: Multi-file upload with S3 storage
POST /api/classes/:classId/videos

curl -X POST http://localhost:3333/api/classes/OTU%23001001/videos \
  -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Multi-File Teaching Content" \
  -F "description=Mixed media teaching materials" \
  -F "content_type=mixed" \
  -F "video=@teaching_video.mp4;type=video/mp4" \
  -F "attachment=@lesson_notes.pdf;type=application/pdf"
```

### **CLASSROOM SESSION JOIN** ✅
```bash
# WORKING ENDPOINT: Join classroom session (route ordering fixed)
POST /api/classes/:classId/classroom/sessions/:sessionId/join

curl -X POST http://localhost:3333/api/classes/OTU%23001001/classroom/sessions/1/join \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"
```

### **INSTRUCTOR ATTENDANCE REPORTS** ✅ **NEW**
```bash
# WORKING ENDPOINT: Get comprehensive attendance analytics
GET /api/classes/:classId/attendance/reports

curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/attendance/reports"

# Access: Instructors, Moderators, Class Creators, Admins
# Returns: Student attendance records, daily stats, recent activity
```

### **INSTRUCTOR FEEDBACK SUMMARY** ✅ **NEW**
```bash
# WORKING ENDPOINT: Get detailed feedback analytics
GET /api/classes/:classId/feedback/summary

curl -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  "http://localhost:3333/api/classes/OTU%23004001/feedback/summary"

# Access: Instructors, Moderators, Class Creators, Admins
# Returns: Rating distribution, feedback analysis, detailed comments
```

---

## 🔐 **UPDATED ROLE-BASED ACCESS CONTROL**

### **CORRECTED ROLE HIERARCHY:**
1. **super_admin** → Has ALL permissions (including admin)
2. **admin** → Administrative permissions
3. **member** → Can create content, schedule sessions
4. **pre_member** → Can join classes, access content
5. **user** → Basic access

### **FIXED PERMISSION MATRIX:**
| Endpoint Type | super_admin | admin | member | pre_member |
|---------------|-------------|-------|--------|------------|
| Content Approval | ✅ | ✅ | ❌ | ❌ |
| Live Session Admin | ✅ | ✅ | ❌ | ❌ |
| Upload Content | ✅ | ✅ | ✅ | ❌ |
| Join Classes | ✅ | ✅ | ✅ | ✅ |
| View Content | ✅ | ✅ | ✅ | ✅ |

---

## 📈 **PRODUCTION READINESS STATUS**

### **SYSTEM STABILITY: 100% OPERATIONAL** ✅
- ✅ All database connections stable
- ✅ All API endpoints responding correctly
- ✅ File upload system handling large files (5GB tested)
- ✅ Real-time features (Socket.IO) operational
- ✅ Email/SMS notifications working
- ✅ Admin approval workflows functional

### **TESTING COVERAGE: COMPREHENSIVE** ✅
- ✅ End-to-end workflow testing for all 3 session types
- ✅ File upload testing (documents, videos, mixed)
- ✅ Admin approval testing with role hierarchy
- ✅ Student access verification
- ✅ Real-time communication testing
- ✅ Database integrity verification

### **ERROR HANDLING: ROBUST** ✅
- ✅ JWT token validation with proper error messages
- ✅ File size limit enforcement
- ✅ Database connection error handling
- ✅ Role permission error handling
- ✅ Upload failure recovery mechanisms

---

## 🚀 **DEPLOYMENT NOTES**

### **Environment Configuration Verified:**
- ✅ **Database:** MySQL on AWS RDS (ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com)
- ✅ **File Storage:** AWS S3 (ikoota-videos bucket)
- ✅ **Email Service:** Gmail SMTP
- ✅ **SMS Service:** Twilio
- ✅ **Server Port:** 3333 (configurable)

### **Performance Metrics:**
- ✅ **Database Response:** <100ms average
- ✅ **File Upload:** 5GB files supported
- ✅ **Concurrent Users:** Socket.IO ready for scale
- ✅ **Memory Usage:** Optimized with connection pooling

### **Security Measures:**
- ✅ **JWT Authentication:** Secure token validation
- ✅ **Role Hierarchy:** Properly implemented
- ✅ **File Validation:** Type and size checking
- ✅ **SQL Injection Protection:** Parameterized queries
- ✅ **CORS Configuration:** Proper origin handling

---

THe Class system related database tables schema already existing are as follows,

 MySQL [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| ikoota_db          |
| information_schema |
| mysql              |
| performance_schema |
| phpmyadmin         |
| sys                |
+--------------------+
6 rows in set (0.072 sec)

MySQL [(none)]> use ikoota_db;
Database changed
MySQL [ikoota_db]> show tables;
+-------------------------------------------------+
| Tables_in_ikoota_db                             |
+-------------------------------------------------+
| admin_action_logs                               |
| admin_dashboard_cache                           |
| admin_full_membership_overview                  |
| admin_initial_membership_overview               |
| admin_pending_summary                           |
| announcements                                   |
| audit_logs                                      |
| avatar_configurations                           |
| bookmarks                                       |
| bulk_operation_jobs                             |
| chats                                           |
| class_attendance                                |
| class_content                                   |
| class_content_access                            |
| class_feedback                                  |
| class_member_counts                             |
| class_sessions                                  |
| classes                                         |
| classes_backup                                  |
| classroom_chat_analytics                        |
| classroom_chat_files                            |
| classroom_chat_moderation_log                   |
| classroom_chat_reactions                        |
| classroom_chat_typing                           |
| classroom_participants                          |
| classroom_pinned_messages                       |
| comments                                        |
| content_audit_logs                              |
| content_likes                                   |
| content_moderation_queue                        |
| content_reports                                 |
| content_tags                                    |
| content_views                                   |
| current_membership_status                       |
| daily_reports                                   |
| email_activity_logs                             |
| email_templates                                 |
| emergency_unmask_requests                       |
| full_membership_applications                    |
| full_membership_applications_backup_20250113    |
| id_generation_log                               |
| identity_masking_audit                          |
| identity_masks                                  |
| initial_membership_applications                 |
| initial_membership_applications_backup_20250113 |
| live_class_audit_log                            |
| live_class_schedules                            |
| live_class_sessions                             |
| masking_sessions                                |
| membership_access_log                           |
| membership_review_history                       |
| membership_stats                                |
| membership_status_migration_log                 |
| mentor_capacity_tracking                        |
| mentors                                         |
| mentorship_families                             |
| mentorship_hierarchy                            |
| notifications                                   |
| pending_surveys_view                            |
| question_labels                                 |
| reports                                         |
| sms_activity_logs                               |
| sms_templates                                   |
| survey_analytics                                |
| survey_categories                               |
| survey_configurations                           |
| survey_drafts                                   |
| survey_questions                                |
| survey_responses                                |
| survey_responses_backup_20250113                |
| survey_stats_view                               |
| survey_templates                                |
| surveylog                                       |
| surveylog_backup_20250113                       |
| surveylog_legacy_view                           |
| system_configuration                            |
| tags                                            |
| teachings                                       |
| user_chats                                      |
| user_class_memberships                          |
| user_communication_preferences                  |
| user_deletion_log                               |
| user_management_overview                        |
| user_masking_preferences                        |
| user_privacy_settings                           |
| user_profiles                                   |
| user_survey_history_view                        |
| users                                           |
| users_backup_membership_migration               |
| verification_codes                              |
| video_session_chat                              |
| video_session_participants                      |
| video_sessions                                  |
| voice_presets                                   |
+-------------------------------------------------+
94 rows in set (0.038 sec)

MySQL [ikoota_db]> describe class_sessions;
+------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                                           | Null | Key | Default           | Extra                                         |
+------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id               | int                                            | NO   | PRI | NULL              | auto_increment                                |
| class_id         | varchar(12)                                    | NO   | MUL | NULL              |                                               |
| session_title    | varchar(255)                                   | NO   |     | NULL              |                                               |
| session_date     | datetime                                       | NO   | MUL | NULL              |                                               |
| duration_minutes | int                                            | YES  |     | 60                |                                               |
| session_type     | enum('lecture','workshop','discussion','exam') | YES  | MUL | lecture           |                                               |
| is_mandatory     | tinyint(1)                                     | YES  |     | 1                 |                                               |
| max_participants | int                                            | YES  |     | NULL              |                                               |
| location         | varchar(255)                                   | YES  |     | NULL              |                                               |
| online_link      | varchar(500)                                   | YES  |     | NULL              |                                               |
| created_by       | int                                            | NO   | MUL | NULL              |                                               |
| is_active        | tinyint(1)                                     | YES  |     | 1                 |                                               |
| createdAt        | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.045 sec)

MySQL [ikoota_db]> describe video_sessions;
+------------------+-----------------------------------------------+------+-----+-------------------+-------------------+
| Field            | Type                                          | Null | Key | Default           | Extra             |
+------------------+-----------------------------------------------+------+-----+-------------------+-------------------+
| id               | int                                           | NO   | PRI | NULL              | auto_increment    |
| session_id       | varchar(50)                                   | NO   | UNI | NULL              |                   |
| class_id         | varchar(12)                                   | NO   |     | NULL              |                   |
| title            | varchar(255)                                  | NO   |     | NULL              |                   |
| description      | text                                          | YES  |     | NULL              |                   |
| instructor_id    | int                                           | NO   |     | NULL              |                   |
| video_url        | varchar(500)                                  | YES  |     | NULL              |                   |
| thumbnail_url    | varchar(500)                                  | YES  |     | NULL              |                   |
| duration_seconds | int                                           | YES  |     | 0                 |                   |
| session_type     | enum('live','recorded','test')                | YES  |     | recorded          |                   |
| status           | enum('scheduled','active','ended','archived') | YES  |     | scheduled         |                   |
| created_by       | int                                           | NO   |     | NULL              |                   |
| createdAt        | timestamp                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------------+-----------------------------------------------+------+-----+-------------------+-------------------+
13 rows in set (0.076 sec)

MySQL [ikoota_db]> describe live_class_sessions;
+------------------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                  | Type                                             | Null | Key | Default           | Extra                                         |
+------------------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                     | int                                              | NO   | PRI | NULL              | auto_increment                                |
| schedule_id            | int                                              | NO   | MUL | NULL              |                                               |
| session_id             | varchar(100)                                     | NO   | MUL | NULL              |                                               |
| instructor_id          | int                                              | NO   | MUL | NULL              |                                               |
| title                  | varchar(255)                                     | NO   |     | NULL              |                                               |
| class_type             | enum('video','audio','mixed')                    | YES  |     | video             |                                               |
| streaming_settings     | json                                             | YES  |     | NULL              |                                               |
| started_at             | datetime                                         | NO   | MUL | NULL              |                                               |
| ended_at               | datetime                                         | YES  |     | NULL              |                                               |
| duration_minutes       | int                                              | YES  |     | NULL              |                                               |
| status                 | enum('active','paused','completed','terminated') | YES  | MUL | active            |                                               |
| max_concurrent_viewers | int                                              | YES  |     | 0                 |                                               |
| total_unique_viewers   | int                                              | YES  |     | 0                 |                                               |
| total_messages         | int                                              | YES  |     | 0                 |                                               |
| createdAt              | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt              | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
16 rows in set (0.074 sec)

MySQL [ikoota_db]> describe  live_class_schedules;
+--------------------------+-------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                    | Type                                                                          | Null | Key | Default           | Extra                                         |
+--------------------------+-------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                       | int                                                                           | NO   | PRI | NULL              | auto_increment                                |
| session_id               | varchar(100)                                                                  | NO   | UNI | NULL              |                                               |
| requested_by             | int                                                                           | NO   | MUL | NULL              |                                               |
| title                    | varchar(255)                                                                  | NO   |     | NULL              |                                               |
| description              | text                                                                          | YES  |     | NULL              |                                               |
| class_type               | enum('video','audio','mixed')                                                 | YES  |     | video             |                                               |
| scheduled_start_time     | datetime                                                                      | NO   | MUL | NULL              |                                               |
| estimated_duration       | int                                                                           | NO   |     | 60                |                                               |
| target_audience          | enum('all','members','specific_class')                                        | YES  | MUL | members           |                                               |
| target_class_id          | varchar(50)                                                                   | YES  |     | NULL              |                                               |
| notification_preferences | json                                                                          | YES  |     | NULL              |                                               |
| streaming_settings       | json                                                                          | YES  |     | NULL              |                                               |
| special_instructions     | text                                                                          | YES  |     | NULL              |                                               |
| status                   | enum('pending_approval','approved','rejected','scheduled','live','completed') | YES  | MUL | pending_approval  |                                               |
| reviewed_by              | int                                                                           | YES  | MUL | NULL              |                                               |
| reviewed_at              | datetime                                                                      | YES  |     | NULL              |                                               |
| admin_notes              | text                                                                          | YES  |     | NULL              |                                               |
| notifications_sent       | tinyint(1)                                                                    | YES  |     | 0                 |                                               |
| notifications_sent_at    | datetime                                                                      | YES  |     | NULL              |                                               |
| actual_start_time        | datetime                                                                      | YES  |     | NULL              |                                               |
| actual_end_time          | datetime                                                                      | YES  |     | NULL              |                                               |
| instructor_id            | int                                                                           | YES  | MUL | NULL              |                                               |
| createdAt                | timestamp                                                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt                | timestamp                                                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+--------------------------+-------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
24 rows in set (0.040 sec)

MySQL [ikoota_db]> describe class_member_counts;
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
| Field           | Type                                             | Null | Key | Default     | Extra |
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
| class_id        | varchar(12)                                      | NO   |     | NULL        |       |
| class_name      | varchar(255)                                     | NO   |     | NULL        |       |
| class_type      | enum('demographic','subject','public','special') | YES  |     | demographic |       |
| is_public       | tinyint(1)                                       | YES  |     | 0           |       |
| total_members   | bigint                                           | NO   |     | 0           |       |
| moderators      | bigint                                           | NO   |     | 0           |       |
| pending_members | bigint                                           | NO   |     | 0           |       |
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
7 rows in set (0.041 sec)

MySQL [ikoota_db]> describe class_attendance;
ERROR 2006 (HY000): MySQL server has gone away
No connection. Trying to reconnect...
Connection id:    79298
Current database: ikoota_db

+---------------+-------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                                      | Null | Key | Default           | Extra                                         |
+---------------+-------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id            | int                                       | NO   | PRI | NULL              | auto_increment                                |
| user_id       | int                                       | NO   | MUL | NULL              |                                               |
| class_id      | varchar(50)                               | NO   | MUL | NULL              |                                               |
| session_id    | varchar(100)                              | YES  | MUL | NULL              |                                               |
| status        | enum('present','late','absent','excused') | YES  | MUL | present           |                                               |
| notes         | text                                      | YES  |     | NULL              |                                               |
| check_in_time | datetime                                  | YES  | MUL | NULL              |                                               |
| location      | varchar(100)                              | YES  |     | NULL              |                                               |
| createdAt     | timestamp                                 | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt     | timestamp                                 | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+---------------+-------------------------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (2.202 sec)

MySQL [ikoota_db]> describe class_content;
+---------------------+-------------------------------------------------------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field               | Type                                                                                                                          | Null | Key | Default           | Extra                                         |
+---------------------+-------------------------------------------------------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                  | int                                                                                                                           | NO   | PRI | NULL              | auto_increment                                |
| class_id            | varchar(12)                                                                                                                   | NO   | MUL | NULL              |                                               |
| target_audience     | enum('current_class','all_classes','specific_classes')                                                                        | YES  |     | current_class     |                                               |
| target_class_ids    | json                                                                                                                          | YES  |     | NULL              |                                               |
| cross_class_access  | tinyint(1)                                                                                                                    | YES  |     | 0                 |                                               |
| title               | varchar(255)                                                                                                                  | NO   |     | NULL              |                                               |
| content_type        | enum('lesson','assignment','announcement','resource','quiz','video','document','image','live_session','audio','chat_message') | YES  | MUL | lesson            |                                               |
| content_text        | longtext                                                                                                                      | YES  |     | NULL              |                                               |
| media_url           | varchar(500)                                                                                                                  | YES  |     | NULL              |                                               |
| media_type          | varchar(50)                                                                                                                   | YES  |     | NULL              |                                               |
| file_size_bytes     | bigint                                                                                                                        | YES  |     | 0                 |                                               |
| order_index         | int                                                                                                                           | YES  |     | 0                 |                                               |
| is_required         | tinyint(1)                                                                                                                    | YES  |     | 0                 |                                               |
| estimated_duration  | int                                                                                                                           | YES  |     | NULL              |                                               |
| points_value        | int                                                                                                                           | YES  |     | 0                 |                                               |
| prerequisites       | text                                                                                                                          | YES  |     | NULL              |                                               |
| learning_objectives | text                                                                                                                          | YES  |     | NULL              |                                               |
| created_by          | int                                                                                                                           | NO   | MUL | NULL              |                                               |
| is_active           | tinyint(1)                                                                                                                    | YES  | MUL | 1                 |                                               |
| is_published        | tinyint(1)                                                                                                                    | YES  | MUL | 0                 |                                               |
| publish_date        | datetime                                                                                                                      | YES  |     | NULL              |                                               |
| due_date            | datetime                                                                                                                      | YES  |     | NULL              |                                               |
| createdAt           | timestamp                                                                                                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt           | timestamp                                                                                                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| is_masked           | tinyint(1)                                                                                                                    | YES  |     | 0                 |                                               |
| masking_settings    | json                                                                                                                          | YES  |     | NULL              |                                               |
| voice_altered       | tinyint(1)                                                                                                                    | YES  |     | 0                 |                                               |
| masking_style       | enum('none','blur','pixelate','artistic','clown')                                                                             | YES  |     | none              |                                               |
+---------------------+-------------------------------------------------------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
28 rows in set (0.052 sec)

MySQL [ikoota_db]> describe class_content_access;
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
| Field        | Type                                   | Null | Key | Default           | Extra             |
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
| id           | int                                    | NO   | PRI | NULL              | auto_increment    |
| content_id   | int                                    | NO   | MUL | NULL              |                   |
| content_type | enum('chat','teaching','announcement') | NO   |     | NULL              |                   |
| class_id     | varchar(12)                            | NO   | MUL | NULL              |                   |
| access_level | enum('read','comment','contribute')    | YES  |     | read              |                   |
| createdAt    | timestamp                              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
6 rows in set (0.120 sec)

MySQL [ikoota_db]> describe class_feedback;
+---------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                                             | Null | Key | Default           | Extra                                         |
+---------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id            | int                                              | NO   | PRI | NULL              | auto_increment                                |
| class_id      | varchar(12)                                      | NO   | MUL | NULL              |                                               |
| user_id       | int                                              | NO   | MUL | NULL              |                                               |
| session_id    | int                                              | YES  | MUL | NULL              |                                               |
| rating        | int                                              | YES  | MUL | NULL              |                                               |
| feedback_text | text                                             | YES  |     | NULL              |                                               |
| feedback_type | enum('general','session','instructor','content') | YES  | MUL | general           |                                               |
| is_anonymous  | tinyint(1)                                       | YES  |     | 0                 |                                               |
| created_by    | int                                              | NO   |     | NULL              |                                               |
| createdAt     | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt     | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+---------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.062 sec)

MySQL [ikoota_db]> describe classes;
+-------------------------+-----------------------------------------------------+------+-----+-------------------+-------------------+
| Field                   | Type                                                | Null | Key | Default           | Extra             |
+-------------------------+-----------------------------------------------------+------+-----+-------------------+-------------------+
| id                      | int                                                 | NO   | PRI | NULL              | auto_increment    |
| class_id                | varchar(12)                                         | NO   | UNI | NULL              |                   |
| class_name              | varchar(255)                                        | NO   |     | NULL              |                   |
| public_name             | varchar(255)                                        | YES  |     | NULL              |                   |
| description             | text                                                | YES  |     | NULL              |                   |
| class_type              | enum('demographic','subject','public','special')    | YES  | MUL | demographic       |                   |
| category                | varchar(100)                                        | YES  | MUL | NULL              |                   |
| difficulty_level        | enum('beginner','intermediate','advanced','expert') | YES  | MUL | beginner          |                   |
| is_public               | tinyint(1)                                          | YES  | MUL | 0                 |                   |
| max_members             | int                                                 | YES  |     | 50                |                   |
| estimated_duration      | int                                                 | YES  | MUL | NULL              |                   |
| prerequisites           | text                                                | YES  |     | NULL              |                   |
| learning_objectives     | text                                                | YES  |     | NULL              |                   |
| tags                    | varchar(500)                                        | YES  |     | NULL              |                   |
| privacy_level           | enum('public','members_only','admin_only')          | YES  |     | members_only      |                   |
| created_by              | int                                                 | YES  | MUL | NULL              |                   |
| is_active               | tinyint(1)                                          | YES  | MUL | 1                 |                   |
| createdAt               | timestamp                                           | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt               | timestamp                                           | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| allow_self_join         | tinyint(1)                                          | YES  |     | 1                 |                   |
| require_full_membership | tinyint(1)                                          | YES  |     | 0                 |                   |
| auto_approve_members    | tinyint(1)                                          | YES  |     | 1                 |                   |
| require_approval        | tinyint(1)                                          | YES  |     | 0                 |                   |
| allow_preview           | tinyint(1)                                          | YES  |     | 1                 |                   |
+-------------------------+-----------------------------------------------------+------+-----+-------------------+-------------------+
24 rows in set (0.053 sec)

MySQL [ikoota_db]> describe  classroom_chat_analytics;
+------------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field                  | Type         | Null | Key | Default           | Extra                                         |
+------------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id                     | int          | NO   | PRI | NULL              | auto_increment                                |
| classId                | varchar(255) | NO   | MUL | NULL              |                                               |
| date                   | date         | NO   | MUL | NULL              |                                               |
| totalMessages          | int          | YES  |     | 0                 |                                               |
| uniqueParticipants     | int          | YES  |     | 0                 |                                               |
| peakConcurrentUsers    | int          | YES  |     | 0                 |                                               |
| averageSessionDuration | int          | YES  |     | 0                 |                                               |
| totalReactions         | int          | YES  |     | 0                 |                                               |
| totalFilesShared       | int          | YES  |     | 0                 |                                               |
| createdAt              | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt              | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------------------+--------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.053 sec)

MySQL [ikoota_db]> describe  classroom_chat_files;
+------------------+----------------------------------------+------+-----+-------------------+-------------------+
| Field            | Type                                   | Null | Key | Default           | Extra             |
+------------------+----------------------------------------+------+-----+-------------------+-------------------+
| id               | int                                    | NO   | PRI | NULL              | auto_increment    |
| messageId        | varchar(255)                           | NO   | MUL | NULL              |                   |
| classId          | varchar(255)                           | NO   | MUL | NULL              |                   |
| userId           | int                                    | NO   | MUL | NULL              |                   |
| converseId       | varchar(255)                           | NO   | MUL | NULL              |                   |
| originalFilename | varchar(255)                           | NO   |     | NULL              |                   |
| storedFilename   | varchar(255)                           | NO   |     | NULL              |                   |
| filePath         | varchar(500)                           | NO   |     | NULL              |                   |
| fileType         | varchar(100)                           | NO   |     | NULL              |                   |
| fileSize         | bigint                                 | NO   |     | NULL              |                   |
| uploadStatus     | enum('uploading','completed','failed') | YES  | MUL | uploading         |                   |
| s3Url            | varchar(500)                           | YES  |     | NULL              |                   |
| createdAt        | timestamp                              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------------+----------------------------------------+------+-----+-------------------+-------------------+
13 rows in set (0.042 sec)

MySQL [ikoota_db]> describe  classroom_chat_moderation_log;
+--------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| Field        | Type                                             | Null | Key | Default           | Extra             |
+--------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| id           | int                                              | NO   | PRI | NULL              | auto_increment    |
| messageId    | varchar(255)                                     | NO   | MUL | NULL              |                   |
| classId      | varchar(255)                                     | NO   | MUL | NULL              |                   |
| actionType   | enum('delete','pin','unpin','warning','timeout') | NO   | MUL | NULL              |                   |
| moderatorId  | int                                              | NO   | MUL | NULL              |                   |
| targetUserId | int                                              | YES  |     | NULL              |                   |
| converseId   | varchar(255)                                     | NO   | MUL | NULL              |                   |
| reason       | text                                             | YES  |     | NULL              |                   |
| actionData   | json                                             | YES  |     | NULL              |                   |
| createdAt    | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+--------------------------------------------------+------+-----+-------------------+-------------------+
10 rows in set (0.076 sec)

MySQL [ikoota_db]> describe  classroom_chat_reactions;
+------------+--------------+------+-----+-------------------+-------------------+
| Field      | Type         | Null | Key | Default           | Extra             |
+------------+--------------+------+-----+-------------------+-------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment    |
| messageId  | varchar(255) | NO   | MUL | NULL              |                   |
| userId     | int          | NO   | MUL | NULL              |                   |
| converseId | varchar(255) | NO   | MUL | NULL              |                   |
| reaction   | varchar(10)  | NO   |     | NULL              |                   |
| createdAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------+--------------+------+-----+-------------------+-------------------+
6 rows in set (0.057 sec)

MySQL [ikoota_db]> describe classroom_chat_typing;
+--------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field        | Type         | Null | Key | Default           | Extra                                         |
+--------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id           | int          | NO   | PRI | NULL              | auto_increment                                |
| classId      | varchar(255) | NO   | MUL | NULL              |                                               |
| userId       | int          | NO   |     | NULL              |                                               |
| converseId   | varchar(255) | NO   | MUL | NULL              |                                               |
| username     | varchar(255) | NO   |     | NULL              |                                               |
| lastTypingAt | timestamp    | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+--------------+--------------+------+-----+-------------------+-----------------------------------------------+
6 rows in set (0.090 sec)

MySQL [ikoota_db]> describe  classroom_participants;
+-----------------+--------------+------+-----+-------------------+-------------------+
| Field           | Type         | Null | Key | Default           | Extra             |
+-----------------+--------------+------+-----+-------------------+-------------------+
| id              | int          | NO   | PRI | NULL              | auto_increment    |
| classId         | varchar(255) | NO   | MUL | NULL              |                   |
| userId          | int          | NO   | MUL | NULL              |                   |
| converseId      | varchar(255) | NO   | MUL | NULL              |                   |
| username        | varchar(255) | NO   |     | NULL              |                   |
| joinedAt        | timestamp    | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| leftAt          | timestamp    | YES  |     | NULL              |                   |
| isActive        | tinyint(1)   | YES  |     | 1                 |                   |
| sessionDuration | int          | YES  |     | 0                 |                   |
| messagesSent    | int          | YES  |     | 0                 |                   |
+-----------------+--------------+------+-----+-------------------+-------------------+
10 rows in set (0.590 sec)

MySQL [ikoota_db]> describe  classroom_pinned_messages;
+----------------+--------------+------+-----+-------------------+-------------------+
| Field          | Type         | Null | Key | Default           | Extra             |
+----------------+--------------+------+-----+-------------------+-------------------+
| id             | int          | NO   | PRI | NULL              | auto_increment    |
| classId        | varchar(255) | NO   | MUL | NULL              |                   |
| messageId      | varchar(255) | NO   | MUL | NULL              |                   |
| messageContent | text         | NO   |     | NULL              |                   |
| author         | varchar(255) | NO   |     | NULL              |                   |
| pinnedBy       | int          | NO   | MUL | NULL              |                   |
| converseId     | varchar(255) | NO   | MUL | NULL              |                   |
| createdAt      | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| unpinnedAt     | timestamp    | YES  |     | NULL              |                   |
| isActive       | tinyint(1)   | YES  |     | 1                 |                   |
+----------------+--------------+------+-----+-------------------+-------------------+
10 rows in set (0.379 sec)

MySQL [ikoota_db]> describe live_class_audit_log;
+----------------+-------------+------+-----+-------------------+-------------------+
| Field          | Type        | Null | Key | Default           | Extra             |
+----------------+-------------+------+-----+-------------------+-------------------+
| id             | int         | NO   | PRI | NULL              | auto_increment    |
| schedule_id    | int         | YES  | MUL | NULL              |                   |
| action_type    | varchar(50) | NO   | MUL | NULL              |                   |
| performed_by   | int         | YES  | MUL | NULL              |                   |
| action_details | json        | YES  |     | NULL              |                   |
| createdAt      | timestamp   | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+----------------+-------------+------+-----+-------------------+-------------------+
6 rows in set (0.914 sec)

MySQL [ikoota_db]> describe  live_class_schedules;
+--------------------------+-------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                    | Type                                                                          | Null | Key | Default           | Extra                                         |
+--------------------------+-------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                       | int                                                                           | NO   | PRI | NULL              | auto_increment                                |
| session_id               | varchar(100)                                                                  | NO   | UNI | NULL              |                                               |
| requested_by             | int                                                                           | NO   | MUL | NULL              |                                               |
| title                    | varchar(255)                                                                  | NO   |     | NULL              |                                               |
| description              | text                                                                          | YES  |     | NULL              |                                               |
| class_type               | enum('video','audio','mixed')                                                 | YES  |     | video             |                                               |
| scheduled_start_time     | datetime                                                                      | NO   | MUL | NULL              |                                               |
| estimated_duration       | int                                                                           | NO   |     | 60                |                                               |
| target_audience          | enum('all','members','specific_class')                                        | YES  | MUL | members           |                                               |
| target_class_id          | varchar(50)                                                                   | YES  |     | NULL              |                                               |
| notification_preferences | json                                                                          | YES  |     | NULL              |                                               |
| streaming_settings       | json                                                                          | YES  |     | NULL              |                                               |
| special_instructions     | text                                                                          | YES  |     | NULL              |                                               |
| status                   | enum('pending_approval','approved','rejected','scheduled','live','completed') | YES  | MUL | pending_approval  |                                               |
| reviewed_by              | int                                                                           | YES  | MUL | NULL              |                                               |
| reviewed_at              | datetime                                                                      | YES  |     | NULL              |                                               |
| admin_notes              | text                                                                          | YES  |     | NULL              |                                               |
| notifications_sent       | tinyint(1)                                                                    | YES  |     | 0                 |                                               |
| notifications_sent_at    | datetime                                                                      | YES  |     | NULL              |                                               |
| actual_start_time        | datetime                                                                      | YES  |     | NULL              |                                               |
| actual_end_time          | datetime                                                                      | YES  |     | NULL              |                                               |
| instructor_id            | int                                                                           | YES  | MUL | NULL              |                                               |
| createdAt                | timestamp                                                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt                | timestamp                                                                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+--------------------------+-------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
24 rows in set (0.538 sec)

MySQL [ikoota_db]> describe user_class_memberships;
+-------------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                   | Type                                           | Null | Key | Default           | Extra                                         |
+-------------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                      | int                                            | NO   | PRI | NULL              | auto_increment                                |
| user_id                 | int                                            | NO   | MUL | NULL              |                                               |
| class_id                | varchar(12)                                    | NO   | MUL | NULL              |                                               |
| membership_status       | enum('active','pending','suspended','expired') | YES  | MUL | active            |                                               |
| role_in_class           | enum('member','moderator','assistant')         | YES  | MUL | member            |                                               |
| joinedAt                | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| assigned_by             | int                                            | YES  | MUL | NULL              |                                               |
| expiresAt               | timestamp                                      | YES  |     | NULL              |                                               |
| can_see_class_name      | tinyint(1)                                     | YES  |     | 1                 |                                               |
| receive_notifications   | tinyint(1)                                     | YES  |     | 1                 |                                               |
| createdAt               | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt               | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| total_sessions_attended | int                                            | YES  |     | 0                 |                                               |
| last_attendance         | timestamp                                      | YES  |     | NULL              |                                               |
+-------------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.055 sec)

MySQL [ikoota_db]> describe video_session_chat;
+--------------+------------------------------------+------+-----+-------------------+-------------------+
| Field        | Type                               | Null | Key | Default           | Extra             |
+--------------+------------------------------------+------+-----+-------------------+-------------------+
| id           | int                                | NO   | PRI | NULL              | auto_increment    |
| session_id   | varchar(50)                        | NO   | MUL | NULL              |                   |
| user_id      | int                                | NO   | MUL | NULL              |                   |
| username     | varchar(100)                       | NO   |     | NULL              |                   |
| message      | text                               | NO   |     | NULL              |                   |
| message_type | enum('user','system','instructor') | YES  |     | user              |                   |
| createdAt    | timestamp                          | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+------------------------------------+------+-----+-------------------+-------------------+
7 rows in set (0.073 sec)

MySQL [ikoota_db]> describe  video_session_participants;
+-------------------+---------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                            | Null | Key | Default           | Extra             |
+-------------------+---------------------------------+------+-----+-------------------+-------------------+
| id                | int                             | NO   | PRI | NULL              | auto_increment    |
| session_id        | varchar(50)                     | NO   | MUL | NULL              |                   |
| user_id           | int                             | NO   | MUL | NULL              |                   |
| joined_at         | timestamp                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| left_at           | timestamp                       | YES  |     | NULL              |                   |
| status            | enum('active','left','kicked')  | YES  |     | active            |                   |
| attendance_status | enum('present','late','absent') | YES  |     | present           |                   |
| createdAt         | timestamp                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------------+---------------------------------+------+-----+-------------------+-------------------+
8 rows in set (0.063 sec)

MySQL [ikoota_db]> describe voice_presets;
+------------------------+--------------+------+-----+---------+----------------+
| Field                  | Type         | Null | Key | Default | Extra          |
+------------------------+--------------+------+-----+---------+----------------+
| id                     | int          | NO   | PRI | NULL    | auto_increment |
| user_id                | int          | NO   | UNI | NULL    |                |
| preset_name            | varchar(100) | YES  |     | NULL    |                |
| pitch_shift            | int          | YES  |     | 0       |                |
| formant_shift          | decimal(5,2) | YES  |     | 0.00    |                |
| reverb_settings        | json         | YES  |     | NULL    |                |
| effects_chain          | json         | YES  |     | NULL    |                |
| voice_synthesis_config | json         | YES  |     | NULL    |                |
| is_active              | tinyint(1)   | YES  |     | 1       |                |
| createdAt              | timestamp    | YES  |     | NULL    |                |
| updatedAt              | timestamp    | YES  |     | NULL    |                |
+------------------------+--------------+------+-----+---------+----------------+
11 rows in set (0.056 sec)

MySQL [ikoota_db]>