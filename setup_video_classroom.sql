-- Setup Video Classroom Test Data
-- Remove existing SQL file first
-- mysql -h ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com -P 3306 -u Petersomond -p"TESTfree12" -D ikoota_db < setup_video_classroom.sql

-- 1. Create a test video class
INSERT INTO classes (
    class_id,
    class_name,
    public_name,
    description,
    class_type,
    category,
    difficulty_level,
    is_public,
    max_members,
    estimated_duration,
    learning_objectives,
    tags,
    privacy_level,
    created_by,
    is_active,
    allow_self_join,
    require_full_membership,
    auto_approve_members,
    allow_preview
) VALUES (
    'OTU#VID001',
    'Video Classroom Test Class',
    'Video Classroom Testing',
    'A comprehensive test class designed for testing video recording, live streaming, and classroom video functionality. This class includes 1-minute video recording capabilities, S3 bucket storage integration, and real-time video classroom features.',
    'subject',
    'Technology',
    'beginner',
    1,
    25,
    60,
    'Test video recording functionality, Validate S3 storage integration, Test live video streaming, Validate video playback in classroom',
    'video,testing,classroom,live,recording',
    'public',
    2, -- Super admin user ID
    1,
    1,
    0,
    1,
    1
);

-- 2. Add super admin as instructor
INSERT INTO user_class_memberships (
    user_id,
    class_id,
    role_in_class,
    membership_status,
    joinedAt
) VALUES (
    2, -- Super admin user ID
    'OTU#VID001',
    'moderator',
    'active',
    NOW()
) ON DUPLICATE KEY UPDATE
    role_in_class = 'moderator',
    membership_status = 'active';

-- 3. Create video test session
INSERT INTO class_sessions (
    class_id,
    session_title,
    session_date,
    duration_minutes,
    session_type,
    is_mandatory,
    max_participants,
    location,
    online_link,
    created_by,
    is_active
) VALUES (
    'OTU#VID001',
    '1-Minute Video Recording Test Session',
    DATE_ADD(NOW(), INTERVAL 1 HOUR),
    60,
    'workshop',
    0,
    25,
    'Virtual Classroom',
    'https://meet.ikoota.com/OTU-VID001',
    2,
    1
);

-- 4. Add initial class content for video testing
INSERT INTO class_content (
    class_id,
    title,
    content_type,
    content_text,
    media_url,
    media_type,
    is_published,
    is_active,
    created_by
) VALUES (
    'OTU#VID001',
    'Welcome to Video Classroom Testing',
    'announcement',
    'Welcome to our video classroom test environment! This class is specifically designed to test our video recording and streaming capabilities. Key features to test:

1. **1-Minute Video Recording**: Test short video recording functionality
2. **Live Video Streaming**: Test real-time video classroom features
3. **S3 Storage Integration**: Validate video upload and storage to AWS S3
4. **Video Playback**: Test video retrieval and playback in classroom
5. **Multi-format Support**: Test .webm, .mp4, and other video formats

Please use this environment to validate all video-related features before production deployment.',
    NULL,
    'text',
    1,
    'approved',
    1,
    2
),
(
    'OTU#VID001',
    'Video Recording Guidelines',
    'lesson',
    'Guidelines for testing 1-minute video recordings:

**Recording Requirements:**
- Maximum duration: 60 seconds
- Supported formats: WebM, MP4
- Maximum file size: 50MB
- Recommended resolution: 720p or 1080p

**Testing Scenarios:**
1. Record a 30-second introduction video
2. Record a 60-second lesson segment
3. Test with different devices (mobile, desktop, tablet)
4. Test with different browsers (Chrome, Firefox, Safari)
5. Validate upload progress and success feedback

**Storage Validation:**
- Verify video uploads to S3 bucket: s3://ikoota/content/
- Check video URL generation and accessibility
- Validate thumbnail generation (if implemented)
- Test video metadata storage in database',
    NULL,
    'text',
    1,
    'approved',
    1,
    2
);

-- 5. Create a test announcement with actual video from S3
INSERT INTO class_content (
    class_id,
    title,
    content_type,
    content,
    media_url,
    media_type,
    is_public,
    status,
    is_active,
    created_by
) VALUES (
    'OTU#VID001',
    'Sample Video Content',
    'video',
    'This is a sample video from our S3 bucket to test video playback functionality in the classroom.',
    'https://ikoota.s3.us-east-1.amazonaws.com/content/1756019615093-9af916d1-364f-4b89-9418-d838e2b53d3f.webm',
    'video',
    1,
    'approved',
    1,
    2
);

-- Show confirmation
SELECT 'Video classroom test setup completed!' as message;
SELECT class_id, class_name, is_active FROM classes WHERE class_id = 'OTU#VID001';
SELECT user_id, role_in_class, membership_status FROM user_class_memberships WHERE class_id = 'OTU#VID001';
SELECT session_title, session_date, session_type FROM class_sessions WHERE class_id = 'OTU#VID001';