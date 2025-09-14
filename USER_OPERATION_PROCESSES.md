# 📋 Ikoota Institution User Operation Processes
## Complete Technical Documentation

This document outlines the 14 core user operation processes in the Ikoota Institution app, detailing the step-by-step actions, technical components, database interactions, and system changes for each process.

---

## 1. 🔐 Signup Operation

### Step-by-Step Actions:
1. User visits landing page and clicks "Sign Up"
2. User fills registration form (username, email, password, phone)
3. User submits form
4. System validates input and creates account
5. System sends SMS verification code
6. User enters verification code
7. System activates account and logs user in
8. User is redirected to application survey (which application survey ?) |
X Is application survey not filled & submitted back?
X Is picture or govt issued Id picture not taken/scanned?

### Prerequisites & Authorization:
- **None** - Open to all visitors
- Valid email address and phone number required
- Must not already have account with same email/phone
X - Important: Must have been a Guest follower for minimum period (to be configured)

### System Feedback:
- Form validation errors in real-time
- "Account created successfully" message
- SMS with verification code
- "Phone verified successfully" notification
- Automatic login and redirect

### User Status/Privilege Changes:
- **Before**: Anonymous visitor
- **After**: Authenticated user with `applicant` status
- Gains access to application survey process
- Can view pending verification pages |
X- Can open and view Notification and Publication links through landing page

### Database Changes:
```sql
-- Insert new user record
INSERT INTO users (username, email, phone, password_hash, status, created_at) 
VALUES (?, ?, ?, ?, 'applicant', NOW());

-- Create user profile
INSERT INTO user_profiles (user_id, created_at) 
VALUES (?, NOW());

-- Log signup activity
INSERT INTO user_activities (user_id, activity_type, description) 
VALUES (?, 'signup', 'User registered successfully');
```

### Technical Components:
**Frontend:**
- `components/auth/LandingPage.jsx` - Landing page with signup button
- `components/auth/Signup.jsx` - Registration form component
- `hooks/useAuth.js` - Authentication state management
- `utils/validation.js` - Form validation utilities

**Backend:**
- `routes/auth.js` - `/api/auth/register` endpoint
- `controllers/authController.js` - `register()` function
- `middleware/validation.js` - Input validation middleware
- `services/twilioService.js` - SMS verification service
- `utils/encryption.js` - Password hashing utilities

**Database Tables:**
- `users` - Main user record
- `user_profiles` - Extended user information
- `user_activities` - Activity logging

**Third-Party Services:**
- Twilio SMS API for phone verification
- bcrypt for password hashing
- JWT for session tokens

---

## 2. 📝 Initial (Pre-Member) Membership Application Process

### Step-by-Step Actions:
1. User (applicant status) is automatically redirected to application survey
2. User reads application instructions and requirements
3. User fills out comprehensive application form (16 questions)
4. System auto-saves draft every 30 seconds
5. User submits completed application
6. System validates and stores application
7. Admin receives notification of new application
8. Admin reviews application and makes decision
9. User receives notification of decision
10. If approved, user status changes to pre-member

### Prerequisites & Authorization:
- Must have `applicant` status
- Must have completed phone verification
- Can only submit one initial application
X - Important: Must have been a follower/Applicant for minimum period (if configured)

### System Feedback:
- Auto-save confirmation every 30 seconds
- Form validation messages
- "Application submitted successfully" notification
- Email confirmation of submission
- Status update notifications (pending, approved, suspended)

### User Status/Privilege Changes:
- **Before**: `applicant` status
- **After**: `pre-member` status (if approved)
X Issued Converse Id and primary Class Id 
X Soon assigned a Mentor & you're informed that henceforth you'll be a mentee to a Mentor
- Gains access to Towncrier content
- Can apply for full membership
- Can join and follow introductory classes and discussions |
X Cannot participate in creating or query any post nor join in 
X policy making, indepth and sensitive discussion classes/chats/teachings
X channel to direct all enquiry and questions to your mentor will open

### Database Changes:
```sql
-- Insert membership application
INSERT INTO membership_applications (
    user_id, application_data, status, submitted_at
) VALUES (?, ?, 'pending', NOW());

-- Update user status when approved
UPDATE users SET status = 'pre-member', updated_at = NOW() 
WHERE id = ? AND status = 'applicant';

-- Create pre-member profile
INSERT INTO member_profiles (user_id, membership_type, approved_at) 
VALUES (?, 'pre-member', NOW());
```

### Technical Components:
**Frontend:**
- `components/auth/Applicationsurvey.jsx` - Main application form
- `components/info/ApplicationThankYou.jsx` - Submission confirmation
- `components/info/Pendverifyinfo.jsx` - Pending status page
- `components/info/Approveverifyinfo.jsx` - Approval notification
- `hooks/useAutoSave.js` - Draft auto-save functionality

**Backend:**
- `routes/membership.js` - Application submission endpoints
- `controllers/membershipController.js` - Application processing
- `services/emailService.js` - Notification emails
- `middleware/membershipValidation.js` - Application validation

**Database Tables:**
- `membership_applications` - Application data
- `users` - Status updates
- `member_profiles` - Membership information
- `application_drafts` - Auto-saved drafts

**Third-Party Services:**
- SMTP email service for notifications
- Cron jobs for draft cleanup

---

## 3. 🏆 Full-Membership Application Process

### Step-by-Step Actions:
1. Pre-member user navigates to full membership info page
2. User reads full membership requirements and benefits
3. User clicks "Apply for Full Membership"
4. System presents enhanced application form 
X   (which application form or survey is used here ?)
5. User completes additional questions and requirements
6. User uploads required documents (if any)
7. User submits full membership application
8. System processes and stores application
9. Admin reviews application with additional scrutiny (possible converse physical verification) |
X - Mentor recommendation is requested and recieved
10. Minimum of three Admin final evaluation, and decision is made and user is notified

### Prerequisites & Authorization:
- Must have `pre-member` status
- Important: Must have been pre-member for minimum period (if configured)
- Cannot have pending full membership application

### System Feedback:
- Requirements checklist with completion status
- File upload progress indicators
- Application submission confirmation
- Email notifications at each stage
- Status dashboard updates

### User Status/Privilege Changes:
- **Before**: `pre-member` status
- **After**: `full-member` status (if approved)
- Gains access to all premium features
- Can create classes, chats and conduct meetings
- involve in policy discussion and making (voting) for the Institution  |
- Full admin panel access (if admin role)

### Database Changes:
```sql
-- Insert full membership application
INSERT INTO full_membership_applications (
    user_id, application_data, documents, status, submitted_at
) VALUES (?, ?, ?, 'pending', NOW());

-- Update user status when approved
UPDATE users SET status = 'full-member', updated_at = NOW() 
WHERE id = ? AND status = 'pre-member';

-- Update member profile
UPDATE member_profiles SET 
    membership_type = 'full-member',
    full_member_approved_at = NOW()
WHERE user_id = ?;
```

### Technical Components:
**Frontend:**
- `components/membership/FullMembershipInfo.jsx` - Information page
- `components/membership/FullMembershipSurvey.jsx` - Application form
- `components/membership/FullMembershipSubmitted.jsx` - Confirmation page
- `components/admin/FullMembershipReviewControls.jsx` - Admin review panel

**Backend:**
- `routes/membership.js` - Full membership endpoints
- `controllers/fullMembershipController.js` - Application processing
- `services/fileUploadService.js` - Document handling
- `services/reviewService.js` - Admin review workflow

**Database Tables:**
- `full_membership_applications` - Full membership data
- `application_documents` - Uploaded files
- `membership_reviews` - Admin review records

**Third-Party Services:**
- AWS S3 for document storage
- File type validation services

---

## 4. 📊 Conducting a Survey Process

### Step-by-Step Actions:
1. User (pre-member+) navigates to survey section
2. System displays available surveys
3. User selects survey to complete
4. System presents survey questions dynamically
5. User answers questions with auto-save
6. User can save draft and return later
7. User submits completed survey
8. System validates and stores responses
9. Survey is queued for admin approval
10. Admin reviews and approves survey responses

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Survey must be active and available
- User cannot submit duplicate responses

### System Feedback:
- Progress indicator showing completion percentage
- Auto-save notifications
- Validation errors for required fields
- Submission confirmation message
- Status updates on review process

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Same status with survey completion record
- May unlock access to survey-specific features
- Contributes to user engagement metrics

### Database Changes:
```sql
-- Insert survey response
INSERT INTO survey_responses (
    user_id, survey_id, responses, status, submitted_at
) VALUES (?, ?, ?, 'pending', NOW());

-- Save draft responses
INSERT INTO survey_drafts (user_id, survey_id, draft_data, saved_at)
VALUES (?, ?, ?, NOW())
ON DUPLICATE KEY UPDATE draft_data = VALUES(draft_data), saved_at = NOW();

-- Update survey statistics
UPDATE surveys SET response_count = response_count + 1 WHERE id = ?;
```

### Technical Components:
**Frontend:**
- `components/survey/SurveyForm.jsx` - Dynamic survey form
- `components/survey/SurveyList.jsx` - Available surveys
- `components/admin/SurveyControls.jsx` - Admin management
- `hooks/useSurveyAutoSave.js` - Auto-save functionality

**Backend:**
- `routes/survey.js` - Survey endpoints
- `controllers/surveyController.js` - Survey processing
- `services/surveyValidation.js` - Response validation
- `services/draftService.js` - Draft management

**Database Tables:**
- `surveys` - Survey definitions
- `survey_responses` - User responses
- `survey_drafts` - Auto-saved drafts
- `survey_questions` - Dynamic questions

**Third-Party Services:**
- Cron jobs for draft cleanup
- Analytics services for survey insights

---

## 5. 📚 Creating and Posting a Teaching in Towncrier

### Step-by-Step Actions:
1. Pre-member+ user navigates to Towncrier section
2. User clicks "Create New Teaching" button
3. System opens teaching creation form
4. User enters title, content, and selects category
5. User can add media files (images, videos)
6. User sets visibility and discussion permissions
7. User previews teaching content
8. User submits teaching for publication through Mentor
X The teaching is routed to the admins board for another admin user (not 
initial mentor) to vet & approve before publication
X with creator having member status, it just routes through mentor vet and published
9. System processes and stores teaching
10. Teaching appears in Towncrier feed

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Must pass content moderation checks
- Teaching must meet minimum content requirements

### System Feedback:
- Rich text editor with formatting options
- Media upload progress indicators
- Content preview functionality
- Character/word count displays
- Publication success confirmation

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Becomes teaching author
- Gains reputation points for content creation
- May unlock teaching-specific privileges

### Database Changes:
```sql
-- Insert new teaching
INSERT INTO teachings (
    user_id, title, content, category, visibility, status, created_at
) VALUES (?, ?, ?, ?, ?, 'published', NOW());

-- Insert media attachments
INSERT INTO teaching_media (teaching_id, file_path, file_type, uploaded_at)
VALUES (?, ?, ?, NOW());

-- Update user content statistics
UPDATE user_profiles SET teaching_count = teaching_count + 1 WHERE user_id = ?;
```

### Technical Components:
**Frontend:**
- `components/towncrier/Towncrier.jsx` - Main Towncrier interface
- `components/towncrier/TeachingEditor.jsx` - Content creation form
- `components/common/MediaUploader.jsx` - File upload component
- `components/common/RichTextEditor.jsx` - Content editor

**Backend:**
- `routes/content.js` - Content management endpoints
- `controllers/teachingController.js` - Teaching operations
- `services/contentModeration.js` - Content validation
- `services/mediaProcessor.js` - File processing

**Database Tables:**
- `teachings` - Teaching content
- `teaching_media` - Attached files
- `content_categories` - Category definitions
- `user_content_stats` - Author statistics

**Third-Party Services:**
- AWS S3 for media storage
- Content moderation APIs
- Image/video processing services

---

## 6. 💬 Creating and Posting a Teaching in Iko

### Step-by-Step Actions:
1. Pre-member+ or member user accesses Iko through authentication wrapper |
2. System verifies Converse Identity (OTO# assignment)
3. User clicks "Create Teaching" in Iko interface
4. User enters teaching content with identity masking
5. System applies Converse Identity formatting
6. User selects audience and privacy settings
7. User submits teaching with masked identity
8. System processes and stores with OTO# identifier
9. Teaching appears in Iko feed with masked identity

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Must have active Converse Identity (OTO# assigned)
- Must pass Iko-specific content guidelines

### System Feedback:
- Converse Identity confirmation display
- Real-time identity masking preview
- Content guideline reminders
- Publication success with OTO# confirmation

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Enhanced Converse Identity reputation
- Increased activity score in identity system
- May unlock advanced Iko features

### Database Changes:
```sql
-- Insert Iko teaching with masked identity
INSERT INTO iko_teachings (
    user_id, oto_number, title, content, masked_content, created_at
) VALUES (?, ?, ?, ?, ?, NOW());

-- Update Converse Identity activity
UPDATE converse_identities SET 
    activity_count = activity_count + 1,
    last_activity = NOW()
WHERE user_id = ?;
```

### Technical Components:
**Frontend:**
- `components/iko/IkoAuthWrapper.jsx` - Authentication and routing
- `components/iko/TeachingCreator.jsx` - Teaching creation interface
- `services/converseIdentityService.js` - Identity masking
- `hooks/useConverseIdentity.js` - Identity management

**Backend:**
- `routes/iko.js` - Iko-specific endpoints
- `controllers/ikoController.js` - Iko operations
- `services/identityMasking.js` - Content masking service
- `middleware/ikoAuth.js` - Iko authorization

**Database Tables:**
- `iko_teachings` - Iko teaching content
- `converse_identities` - User identity records
- `iko_activities` - Activity tracking
- `identity_settings` - User preferences

**Third-Party Services:**
- Identity encryption services
- Content anonymization tools

---

## 7. 💭 Creating and Posting a Chat (at Iko)

### Step-by-Step Actions:
1. User in Iko interface clicks "Start Chat"
2. System presents chat creation options
3. User enters chat message with identity masking
4. User selects chat visibility (public/private)
5. User can add media or links
6. System applies real-time Converse Identity masking
7. User confirms chat with masked preview
8. System publishes chat to Iko feed
9. Other users can see and respond to chat

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Must have active Converse Identity
- Must comply with chat guidelines

### System Feedback:
- Live character count and masking preview
- Media upload status indicators
- Chat visibility confirmation
- Publication success notification

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Increased chat activity score
- Enhanced Converse Identity engagement
- May unlock chat moderation tools

### Database Changes:
```sql
-- Insert chat message
INSERT INTO iko_chats (
    user_id, oto_number, content, masked_content, visibility, created_at
) VALUES (?, ?, ?, ?, ?, NOW());

-- Insert chat media if present
INSERT INTO iko_chat_media (chat_id, file_path, file_type)
VALUES (?, ?, ?);
```

### Technical Components:
**Frontend:**
- `components/iko/ChatCreator.jsx` - Chat creation interface
- `components/iko/ChatPreview.jsx` - Masked content preview
- `components/common/MediaAttachment.jsx` - Media handling
- `hooks/useRealtimeChat.js` - Real-time functionality

**Backend:**
- `routes/iko.js` - Chat endpoints
- `controllers/chatController.js` - Chat operations
- `services/realtimeMasking.js` - Live masking service
- `socket.js` - Real-time updates

**Database Tables:**
- `iko_chats` - Chat messages
- `iko_chat_media` - Attached media
- `chat_participants` - Chat engagement
- `real_time_sessions` - Active sessions

**Third-Party Services:**
- Socket.io for real-time communication
- Media processing APIs

---

## 8. 📝 Creating and Posting a Comment (Iko)

### Step-by-Step Actions:
1. User viewing Iko content clicks "Add Comment"
2. System opens comment interface with identity masking
3. User types comment with live masking preview
4. System validates comment against content policies
5. User can mention other OTO# identities
6. User submits comment with masked identity
7. System processes and links to parent content
8. Comment appears with OTO# identifier
9. Original content author gets notification

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Must have active Converse Identity
- Parent content must allow comments

### System Feedback:
- Real-time masking as user types
- Mention suggestions for other OTO# users
- Comment validation messages
- Successful posting confirmation

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Increased comment activity score
- Enhanced engagement metrics
- May gain comment moderation privileges

### Database Changes:
```sql
-- Insert comment with masked identity
INSERT INTO iko_comments (
    user_id, oto_number, parent_id, parent_type, content, masked_content, created_at
) VALUES (?, ?, ?, ?, ?, ?, NOW());

-- Update parent content engagement stats
UPDATE iko_teachings SET comment_count = comment_count + 1 WHERE id = ?;
```

### Technical Components:
**Frontend:**
- `components/iko/CommentCreator.jsx` - Comment interface
- `components/iko/MentionSelector.jsx` - OTO# mention system
- `components/common/LiveMasking.jsx` - Real-time masking
- `hooks/useCommentThread.js` - Thread management

**Backend:**
- `routes/iko.js` - Comment endpoints
- `controllers/commentController.js` - Comment processing
- `services/mentionService.js` - Mention handling
- `services/notificationService.js` - User notifications

**Database Tables:**
- `iko_comments` - Comment data
- `comment_mentions` - OTO# mentions
- `content_engagement` - Engagement metrics
- `user_notifications` - Comment notifications

**Third-Party Services:**
- Real-time notification services
- Content moderation APIs

---

## 9. 🎓 Creating and Conducting Classroom Teaching

### Step-by-Step Actions:
1. Full member clicks "Create Class" in admin or class section
2. System presents class creation wizard
3. User enters class details (title, description, schedule)
4. User sets enrollment limits and prerequisites
5. User uploads class materials and resources
6. User configures audio/video settings
7. System creates class and enrollment system
8. Class appears in class listings
9. At scheduled time, teacher starts live session
10. Students join and participate in real-time

### Prerequisites & Authorization:
- Must have `full-member` status
- Must have teaching permissions
- May require admin approval for class creation

### System Feedback:
- Class creation progress wizard
- Material upload confirmation
- Enrollment notifications
- Live session status updates

### User Status/Privilege Changes:
- **Before**: Full member
- **After**: Class instructor with teaching privileges
- Gains access to class analytics
- May earn teaching reputation points

### Database Changes:
```sql
-- Create new class
INSERT INTO classes (
    instructor_id, title, description, max_participants, 
    schedule_time, status, created_at
) VALUES (?, ?, ?, ?, ?, 'active', NOW());

-- Create class materials
INSERT INTO class_materials (class_id, material_type, file_path, title)
VALUES (?, ?, ?, ?);

-- Initialize class statistics
INSERT INTO class_stats (class_id, total_participants, created_at)
VALUES (?, 0, NOW());
```

### Technical Components:
**Frontend:**
- `components/classes/ClassCreator.jsx` - Class creation wizard
- `components/classes/ClassContentViewer.jsx` - Live classroom
- `components/admin/AudienceClassMgr.jsx` - Class management
- `hooks/useClassSession.js` - Session management

**Backend:**
- `routes/classes.js` - Class management endpoints
- `controllers/classController.js` - Class operations
- `services/scheduleService.js` - Class scheduling
- `services/liveSessionService.js` - Real-time sessions

**Database Tables:**
- `classes` - Class definitions
- `class_materials` - Teaching resources
- `class_schedules` - Timing information
- `class_stats` - Performance metrics

**Third-Party Services:**
- Agora.io for live audio/video
- Calendar integration services
- File storage for materials

---

## 10. 📚 Enrolling for Classroom Class

### Step-by-Step Actions:
1. Pre-member+ user browses available classes
2. User clicks on class to view details
3. System displays class information and requirements
4. User clicks "Enroll" button
5. System validates enrollment eligibility
6. User confirms enrollment
7. System processes enrollment and sends confirmation
8. User receives class access credentials
9. User gets calendar reminders for class sessions
10. User can access class materials and join sessions

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Class must have available spots
- User must meet class prerequisites

### System Feedback:
- Class details and enrollment status
- Eligibility validation messages
- Enrollment confirmation
- Access credentials delivery
- Calendar integration notifications

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Enrolled student with class access
- Gains access to class materials
- Can participate in class discussions

### Database Changes:
```sql
-- Insert class enrollment
INSERT INTO user_class_memberships (
    user_id, class_id, role, enrolled_at, status
) VALUES (?, ?, 'student', NOW(), 'active');

-- Update class statistics
UPDATE classes SET current_participants = current_participants + 1 WHERE id = ?;

-- Log enrollment activity
INSERT INTO class_activities (
    class_id, user_id, activity_type, description, created_at
) VALUES (?, ?, 'enrollment', 'User enrolled in class', NOW());
```

### Technical Components:
**Frontend:**
- `components/classes/ClassListPage.jsx` - Available classes
- `components/classes/ClassPreview.jsx` - Class details
- `components/classes/MyClassesPage.jsx` - User's classes
- `hooks/useClassEnrollment.js` - Enrollment management

**Backend:**
- `routes/classes.js` - Enrollment endpoints
- `controllers/enrollmentController.js` - Enrollment processing
- `services/eligibilityService.js` - Prerequisite checking
- `services/calendarService.js` - Schedule integration

**Database Tables:**
- `user_class_memberships` - Enrollment records
- `class_prerequisites` - Requirements
- `enrollment_history` - Historical data
- `class_notifications` - Reminders

**Third-Party Services:**
- Email services for confirmations
- Calendar APIs for scheduling
- SMS for class reminders

---

## 11. 🗣️ Conduct a Conversation

### Step-by-Step Actions:
1. Pre-member+ user initiates conversation (1-on-1 chat)
2. System creates conversation thread with Converse Identity
3. User sends initial message with identity masking
4. Recipient receives notification with OTO# identity
5. Recipient responds maintaining identity privacy
6. Messages are exchanged with real-time masking
7. System maintains conversation history
8. Users can end conversation or continue
9. Conversation analytics are recorded
10. Privacy protection is maintained throughout

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Both participants must have active Converse Identities
- Must follow conversation guidelines

### System Feedback:
- Conversation initiation confirmation
- Real-time message delivery status
- Identity masking status indicators
- Conversation history access

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Enhanced conversation activity score
- Improved Converse Identity reputation
- Access to conversation history

### Database Changes:
```sql
-- Create conversation thread
INSERT INTO conversations (
    initiator_id, participant_id, status, created_at
) VALUES (?, ?, 'active', NOW());

-- Insert messages with identity masking
INSERT INTO conversation_messages (
    conversation_id, sender_id, sender_oto, content, masked_content, sent_at
) VALUES (?, ?, ?, ?, ?, NOW());

-- Update conversation activity
UPDATE converse_identities SET 
    conversation_count = conversation_count + 1
WHERE user_id IN (?, ?);
```

### Technical Components:
**Frontend:**
- `components/conversations/ConversationStarter.jsx` - Initiate chat
- `components/conversations/MessageInterface.jsx` - Chat interface
- `components/conversations/ConversationHistory.jsx` - Message history
- `hooks/useRealtimeConversation.js` - Real-time messaging

**Backend:**
- `routes/conversations.js` - Conversation endpoints
- `controllers/conversationController.js` - Chat processing
- `services/realtimeMessaging.js` - Live messaging
- `middleware/conversationAuth.js` - Privacy protection

**Database Tables:**
- `conversations` - Conversation threads
- `conversation_messages` - Messages with masking
- `conversation_participants` - Participant records
- `message_encryption` - Privacy keys

**Third-Party Services:**
- Socket.io for real-time messaging
- Encryption services for privacy
- Message queuing systems

---

## 12. 🔑 Forgot-Password or Password Reset Process

### Step-by-Step Actions:
1. User clicks "Forgot Password" on login page
2. System presents email/phone input form
3. User enters registered email or phone number
4. System validates user existence and sends reset code
5. User receives reset code via email/SMS
6. User enters reset code on verification page
7. System validates code and presents new password form
8. User enters new password twice for confirmation
9. System updates password and confirms change
10. User can log in with new password

### Prerequisites & Authorization:
- Must have existing account
- Must have access to registered email/phone
- Account must not be suspended

### System Feedback:
- "Reset code sent" confirmation
- Code validation status
- Password strength indicators
- "Password updated successfully" notification

### User Status/Privilege Changes:
- **Before**: Locked out user
- **After**: Restored access to account
- Same membership status and privileges
- Security alert logged for account

### Database Changes:
```sql
-- Create password reset token
INSERT INTO password_reset_tokens (
    user_id, token,expiresAt, created_at
) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW());

-- Update user password when reset
UPDATE users SET 
    password_hash = ?, 
    updated_at = NOW() 
WHERE id = ?;

-- Log security activity
INSERT INTO user_security_logs (
    user_id, activity_type, ip_address, user_agent, created_at
) VALUES (?, 'password_reset', ?, ?, NOW());
```

### Technical Components:
**Frontend:**
- `components/auth/ForgotPassword.jsx` - Reset request form
- `components/auth/ResetPassword.jsx` - New password form
- `components/auth/ResetConfirmation.jsx` - Success page
- `hooks/usePasswordReset.js` - Reset flow management

**Backend:**
- `routes/auth.js` - Password reset endpoints
- `controllers/passwordResetController.js` - Reset processing
- `services/tokenService.js` - Secure token generation
- `services/securityService.js` - Security logging

**Database Tables:**
- `password_reset_tokens` - Reset tokens
- `user_security_logs` - Security activities
- `users` - Password updates
- `failed_reset_attempts` - Abuse prevention

**Third-Party Services:**
- Email SMTP for reset emails
- Twilio SMS for mobile reset
- Security monitoring services

---

## 13. 🎤 Conducting Audio Chat

### Step-by-Step Actions:
1. Pre-member+ user navigates to audio chat section
2. User creates new audio room or joins existing
3. System initializes Agora.io audio-only session
4. User's Converse Identity voice masking activates
5. System applies real-time voice modification
6. Other participants join with masked voices
7. Audio conversation proceeds with privacy protection
8. System monitors call quality and participation
9. Users can mute/unmute with masking maintained
10. Session ends with activity logging

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Must have active Converse Identity
- Audio permissions granted in browser
- Call room must have available capacity

### System Feedback:
- Audio device detection and setup
- Voice masking activation confirmation
- Call quality indicators
- Participant join/leave notifications

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Enhanced audio communication activity
- Improved Converse Identity engagement
- Access to call history and recordings

### Database Changes:
```sql
-- Create audio call session
INSERT INTO calls (
    title, channel_name, creator_id, is_public, max_participants, 
    call_type, status, created_at
) VALUES (?, ?, ?, ?, ?, 'audio', 'active', NOW());

-- Track participant with voice masking
INSERT INTO call_participants (
    call_id, user_id, agora_uid, joined_at, masking_enabled
) VALUES (?, ?, ?, NOW(), TRUE);

-- Log voice masking usage
INSERT INTO masking_activities (
    user_id, activity_type, session_id, created_at
) VALUES (?, 'voice_masking', ?, NOW());
```

### Technical Components:
**Frontend:**
- `components/calling/AudioCallInterface.jsx` - Audio call UI
- `components/calling/VoiceMaskingControls.jsx` - Masking controls
- `services/voiceMaskingService.js` - Voice modification
- `hooks/useAgoraCall.js` - Audio session management

**Backend:**
- `routes/calling.js` - Audio call endpoints
- `controllers/audioCallController.js` - Audio session management
- `services/voiceMaskingBackend.js` - Server-side masking
- `services/agoraTokenService.js` - Token generation

**Database Tables:**
- `calls` - Call sessions (type: audio)
- `call_participants` - Participant records
- `masking_activities` - Privacy feature usage
- `call_stats` - Audio quality metrics

**Third-Party Services:**
- Agora.io RTC SDK for audio
- Voice processing APIs
- Real-time masking algorithms

---

## 14. 📹 Conducting Video Chat

### Step-by-Step Actions:
1. Pre-member+ user initiates video chat session
2. System requests camera and microphone permissions
3. User's face masking and voice modification activate
4. System applies real-time video processing with avatar overlay
5. Other participants join with their identity masking
6. Video conversation proceeds with full privacy protection
7. System monitors video quality and bandwidth
8. Users can toggle video/audio while maintaining masking
9. Screen sharing available with content filtering
10. Session ends with comprehensive activity logging

### Prerequisites & Authorization:
- Must have `pre-member` or `full-member` status
- Must have active Converse Identity
- Camera and microphone permissions required
- Sufficient bandwidth for video streaming

### System Feedback:
- Camera setup and masking preview
- Video quality and connection indicators
- Participant video status updates
- Masking effectiveness notifications

### User Status/Privilege Changes:
- **Before**: Same membership status
- **After**: Enhanced video communication activity
- Advanced Converse Identity usage metrics
- Access to video call analytics

### Database Changes:
```sql
-- Create video call session
INSERT INTO calls (
    title, channel_name, creator_id, is_public, max_participants,
    call_type, status, created_at
) VALUES (?, ?, ?, ?, ?, 'video', 'active', NOW());

-- Track participant with full masking
INSERT INTO call_participants (
    call_id, user_id, agora_uid, joined_at, 
    voice_masking_enabled, video_masking_enabled
) VALUES (?, ?, ?, NOW(), TRUE, TRUE);

-- Log comprehensive masking usage
INSERT INTO masking_activities (
    user_id, activity_type, session_id, masking_features, created_at
) VALUES (?, 'full_masking', ?, 'voice,video,avatar', NOW());
```

### Technical Components:
**Frontend:**
- `components/calling/CallInterface.jsx` - Full video call UI
- `components/calling/ParticipantGrid.jsx` - Video participant layout
- `services/videoMaskingService.js` - Face masking and avatar overlay
- `services/voiceMaskingService.js` - Voice modification
- `hooks/useAgoraCall.js` - Complete call management

**Backend:**
- `routes/calling.js` - Video call endpoints
- `controllers/videoCallController.js` - Video session management
- `services/videoProcessingService.js` - Real-time video masking
- `services/bandwidthOptimization.js` - Quality adaptation

**Database Tables:**
- `calls` - Call sessions (type: video)
- `call_participants` - Full participant records
- `video_masking_logs` - Face masking activities
- `call_stats` - Video quality and usage metrics

**Third-Party Services:**
- Agora.io RTC SDK for video/audio
- Face detection APIs (face-api.js)
- Real-time video processing
- GPU-accelerated masking services

---

## 📊 System Integration Summary

### Cross-Process Components:
- **Authentication System**: Used in all processes requiring login
- **Converse Identity Service**: Central to all masked interactions
- **Database Connection Pool**: Shared across all operations
- **Real-time Socket Service**: Powers live interactions
- **File Upload Service**: Handles media in multiple processes
- **Notification Service**: Sends alerts across all processes

### Security & Privacy:
- All processes maintain Converse Identity protection
- Database operations use prepared statements
- File uploads are validated and sanitized
- Real-time communications are encrypted
- Activity logging for audit trails

### Performance Considerations:
- Auto-save functionality prevents data loss
- Real-time masking optimized for low latency
- Database queries optimized with proper indexing
- Caching implemented for frequently accessed data
- Load balancing for high-traffic operations

This comprehensive documentation provides the technical foundation for understanding and implementing all user operation processes in the Ikoota Institution application.