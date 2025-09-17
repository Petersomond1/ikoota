-- Enhanced Chat System Database Tables
-- Run these to support advanced chat features

-- Classroom chat reactions table
CREATE TABLE IF NOT EXISTS classroom_chat_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    messageId VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    converseId VARCHAR(255) NOT NULL,
    reaction VARCHAR(10) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_message_reaction (messageId, userId),
    INDEX idx_message_reactions (messageId),
    INDEX idx_user_reactions (userId),
    INDEX idx_converse_reactions (converseId)
);

-- Classroom pinned messages table
CREATE TABLE IF NOT EXISTS classroom_pinned_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classId VARCHAR(255) NOT NULL,
    messageId VARCHAR(255) NOT NULL,
    messageContent TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    pinnedBy INT NOT NULL,
    converseId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unpinnedAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT TRUE,
    INDEX idx_classroom_class_pinned (classId, isActive),
    INDEX idx_classroom_message_pinned (messageId),
    INDEX idx_classroom_pinned_by (pinnedBy),
    INDEX idx_classroom_converse_pinned (converseId)
);

-- Classroom chat file uploads table
CREATE TABLE IF NOT EXISTS classroom_chat_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    messageId VARCHAR(255) NOT NULL,
    classId VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    converseId VARCHAR(255) NOT NULL,
    originalFilename VARCHAR(255) NOT NULL,
    storedFilename VARCHAR(255) NOT NULL,
    filePath VARCHAR(500) NOT NULL,
    fileType VARCHAR(100) NOT NULL,
    fileSize BIGINT NOT NULL,
    uploadStatus ENUM('uploading', 'completed', 'failed') DEFAULT 'uploading',
    s3Url VARCHAR(500) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_classroom_message_files (messageId),
    INDEX idx_classroom_class_files (classId),
    INDEX idx_classroom_user_files (userId),
    INDEX idx_classroom_converse_files (converseId),
    INDEX idx_classroom_upload_status (uploadStatus)
);

-- Classroom chat moderation log
CREATE TABLE IF NOT EXISTS classroom_chat_moderation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    messageId VARCHAR(255) NOT NULL,
    classId VARCHAR(255) NOT NULL,
    actionType ENUM('delete', 'pin', 'unpin', 'warning', 'timeout') NOT NULL,
    moderatorId INT NOT NULL,
    targetUserId INT NULL,
    converseId VARCHAR(255) NOT NULL,
    reason TEXT NULL,
    actionData JSON NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_classroom_message_moderation (messageId),
    INDEX idx_classroom_class_moderation (classId),
    INDEX idx_classroom_moderator_actions (moderatorId),
    INDEX idx_classroom_converse_moderation (converseId),
    INDEX idx_classroom_moderation_type (actionType)
);

-- Enhanced content table updates (will skip if columns already exist)
-- ALTER TABLE content
-- ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE,
-- ADD COLUMN deletedBy INT NULL,
-- ADD COLUMN deletedAt TIMESTAMP NULL,
-- ADD COLUMN messageType ENUM('text', 'file', 'image', 'audio', 'video', 'announcement') DEFAULT 'text',
-- ADD COLUMN replyToId VARCHAR(255) NULL,
-- ADD COLUMN editCount INT DEFAULT 0,
-- ADD COLUMN lastEditedAt TIMESTAMP NULL;
--
-- ADD INDEX idx_content_deleted (isDeleted),
-- ADD INDEX idx_content_type (messageType),
-- ADD INDEX idx_reply_to (replyToId);

-- Classroom chat typing indicators (temporary/session data)
CREATE TABLE IF NOT EXISTS classroom_chat_typing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classId VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    converseId VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    lastTypingAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_classroom_user_class_typing (classId, userId),
    INDEX idx_classroom_class_typing (classId),
    INDEX idx_classroom_converse_typing (converseId),
    INDEX idx_classroom_last_typing (lastTypingAt)
);

-- Classroom session participants
CREATE TABLE IF NOT EXISTS classroom_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classId VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    converseId VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leftAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT TRUE,
    sessionDuration INT DEFAULT 0, -- in seconds
    messagesSent INT DEFAULT 0,
    INDEX idx_classroom_class_participants (classId, isActive),
    INDEX idx_classroom_user_sessions (userId),
    INDEX idx_classroom_converse_participants (converseId),
    INDEX idx_classroom_session_time (joinedAt, leftAt)
);

-- Classroom chat analytics and metrics
CREATE TABLE IF NOT EXISTS classroom_chat_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classId VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    totalMessages INT DEFAULT 0,
    uniqueParticipants INT DEFAULT 0,
    peakConcurrentUsers INT DEFAULT 0,
    averageSessionDuration INT DEFAULT 0, -- in seconds
    totalReactions INT DEFAULT 0,
    totalFilesShared INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_classroom_class_date (classId, date),
    INDEX idx_classroom_analytics_date (date),
    INDEX idx_classroom_analytics_class (classId)
);

-- Auto-cleanup old typing indicators (run periodically)
-- DELETE FROM classroom_chat_typing WHERE last_typing_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE);

-- Sample data for testing (optional)
/*
INSERT INTO classroom_pinned_messages (classId, messageId, messageContent, author, pinnedBy) VALUES
('OTU#004001', 'msg001', 'Welcome to our advanced mathematics class! Please review the syllabus.', 'instructor_pete', 1),
('OTU#222222', 'msg002', 'Remember to submit your assignments by Friday.', 'admin_user', 1);

INSERT INTO classroom_chat_reactions (messageId, userId, reaction) VALUES
('msg001', 2, '👍'),
('msg001', 3, '❤️'),
('msg002', 2, '📚');
*/

-- Create indexes for performance (commented out to avoid conflicts)
-- CREATE INDEX idx_content_class_type ON content (class_id, content_type, created_at DESC);
-- CREATE INDEX idx_content_author_class ON content (author_id, class_id, created_at DESC);

-- Views for easier querying (commented out until content table is updated)
-- CREATE OR REPLACE VIEW classroom_activity_summary AS
-- SELECT
--     c.classId,
--     COUNT(DISTINCT c.authorId) as uniqueParticipants,
--     COUNT(*) as totalMessages,
--     COUNT(CASE WHEN c.messageType = 'file' THEN 1 END) as filesShared,
--     COUNT(CASE WHEN c.messageType = 'image' THEN 1 END) as imagesShared,
--     COUNT(CASE WHEN c.messageType = 'announcement' THEN 1 END) as announcements,
--     MAX(c.createdAt) as lastActivity
-- FROM content c
-- WHERE c.contentType = 'chat_message'
--   AND c.isDeleted = FALSE
-- GROUP BY c.classId;

-- CREATE OR REPLACE VIEW classroom_pinned_messages_active AS
-- SELECT
--     pm.*,
--     u.username as pinnedByUsername
-- FROM classroom_pinned_messages pm
-- LEFT JOIN users u ON pm.pinnedBy = u.userId
-- WHERE pm.isActive = TRUE
-- ORDER BY pm.createdAt DESC;