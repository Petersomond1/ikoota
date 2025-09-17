-- Setup Full-Length Teaching Video Classroom
-- Supports videos up to 1.5+ hours for comprehensive teaching sessions
-- mysql -h ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com -P 3306 -u Petersomond -p"TESTfree12" -D ikoota_db < setup_teaching_video_classroom.sql

-- 1. Create a comprehensive teaching video class
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
    'OTU#TEACH001',
    'Full Teaching Video Classroom',
    'Teaching Video Classroom',
    'A comprehensive video classroom designed for full-length teaching sessions. Supports live and recorded video content up to 1.5+ hours duration. Features include: live streaming, recorded video storage, multi-format video support, interactive classroom features, and comprehensive video management.',
    'subject',
    'Education Technology',
    'intermediate',
    1,
    50,
    90, -- 90 minutes estimated duration
    'Record full-length teaching videos, Stream live classroom sessions, Manage large video files in S3, Test video playback and quality, Validate classroom interaction features',
    'teaching,video,classroom,live,recording,education',
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
    'OTU#TEACH001',
    'moderator',
    'active',
    NOW()
) ON DUPLICATE KEY UPDATE
    role_in_class = 'moderator',
    membership_status = 'active';

-- 3. Create extended teaching session (1.5 hours)
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
    'OTU#TEACH001',
    'Full-Length Teaching Video Session',
    DATE_ADD(NOW(), INTERVAL 2 HOUR),
    90, -- 90 minutes = 1.5 hours
    'lecture',
    0,
    50,
    'Virtual Teaching Studio',
    'https://classroom.ikoota.com/OTU-TEACH001',
    2,
    1
);

-- 4. Add comprehensive teaching content
INSERT INTO class_content (
    class_id,
    title,
    content_type,
    content_text,
    media_url,
    media_type,
    estimated_duration,
    is_published,
    is_active,
    created_by
) VALUES (
    'OTU#TEACH001',
    'Welcome to Full Teaching Video Classroom',
    'announcement',
    'Welcome to our comprehensive teaching video classroom! This environment supports full-length educational content with the following capabilities:

📹 **Video Recording Features:**
- Support for videos up to 1.5+ hours duration
- Multiple format support: WebM, MP4, MOV
- High-quality recording: up to 1080p/4K
- Audio synchronization and quality optimization
- Automatic chapter markers for long videos

🎥 **Live Streaming Capabilities:**
- Real-time video streaming for live classes
- Interactive features: chat, polls, Q&A
- Screen sharing and presentation tools
- Multi-camera support for enhanced teaching
- Recording of live sessions for later viewing

☁️ **Storage & Management:**
- Large file upload to AWS S3 (up to 5GB per video)
- Efficient video compression and optimization
- Thumbnail generation and preview clips
- Video metadata management
- Progress tracking for long videos

This classroom is perfect for comprehensive lessons, lectures, workshops, and extended educational content.',
    NULL,
    'text',
    5, -- 5 minutes reading time
    1,
    1,
    2
),
(
    'OTU#TEACH001',
    'Teaching Video Guidelines & Best Practices',
    'lesson',
    'Guidelines for creating effective teaching videos:

**Technical Specifications:**
- **Duration**: No strict limit - record as long as needed for comprehensive teaching
- **Recommended Segments**: 15-30 minute chapters for easier navigation
- **Resolution**: 720p minimum, 1080p recommended, 4K supported
- **File Size**: Up to 5GB per video file
- **Formats**: WebM (recommended), MP4, MOV
- **Audio**: Clear audio recording, minimize background noise

**Content Structure:**
1. **Introduction** (2-3 minutes): Course overview and objectives
2. **Main Content** (60-80 minutes): Core teaching material with chapters
3. **Summary & Q&A** (5-10 minutes): Key takeaways and questions
4. **Additional Resources**: Supplementary materials and references

**Teaching Tips:**
- Use clear, engaging visuals and demonstrations
- Include interactive elements and pause points
- Provide downloadable resources and materials
- Add captions and transcripts for accessibility
- Create chapter markers for easy navigation

**Upload Process:**
- Videos are automatically processed and optimized
- Large files may take time to upload - progress indicators provided
- Thumbnails and previews generated automatically
- Videos available immediately after processing',
    NULL,
    'text',
    10, -- 10 minutes reading time
    1,
    1,
    2
),
(
    'OTU#TEACH001',
    'Sample Teaching Video - Introduction to Advanced Topics',
    'video',
    'This is a sample of a full-length teaching video from our library. Use this to test playback, quality, and classroom video features.',
    'https://ikoota.s3.us-east-1.amazonaws.com/a89ee803-a40d-4947-b46b-e656385bb47a-Backend of Ama Ecom prjt2 from ousamma 16mins.webm',
    'video',
    16, -- 16 minutes duration
    1,
    1,
    2
);

-- 5. Create additional session for workshop-style teaching
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
    'OTU#TEACH001',
    'Interactive Workshop Session',
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    120, -- 2 hours
    'workshop',
    0,
    30,
    'Interactive Learning Lab',
    'https://workshop.ikoota.com/OTU-TEACH001',
    2,
    1
);

-- Show confirmation
SELECT 'Full teaching video classroom setup completed!' as message;
SELECT class_id, class_name, estimated_duration, max_members FROM classes WHERE class_id = 'OTU#TEACH001';
SELECT user_id, role_in_class, membership_status FROM user_class_memberships WHERE class_id = 'OTU#TEACH001';
SELECT session_title, session_date, duration_minutes, session_type FROM class_sessions WHERE class_id = 'OTU#TEACH001';