-- Create class_content table for storing class learning materials
-- Media files are stored in AWS S3 and URLs saved in this table

CREATE TABLE IF NOT EXISTS class_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id VARCHAR(12) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('lesson', 'assignment', 'announcement', 'resource', 'quiz', 'video', 'document', 'image') DEFAULT 'lesson',
    content_text LONGTEXT,
    media_url VARCHAR(500), -- AWS S3 URL for media files
    media_type VARCHAR(50), -- e.g., 'video/mp4', 'application/pdf', 'image/jpeg'
    file_size_bytes BIGINT DEFAULT 0, -- Size of media file in bytes
    order_index INT DEFAULT 0, -- For ordering content within a class
    is_required TINYINT(1) DEFAULT 0, -- Whether this content is mandatory
    estimated_duration INT, -- Estimated time to complete in minutes
    points_value INT DEFAULT 0, -- Points awarded for completing this content
    prerequisites TEXT, -- JSON array of prerequisite content IDs
    learning_objectives TEXT, -- What students should learn from this content
    created_by INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_published TINYINT(1) DEFAULT 0, -- Whether content is visible to students
    publish_date DATETIME, -- When to make content visible
    due_date DATETIME, -- For assignments and quizzes
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_class_content_class_id (class_id),
    INDEX idx_class_content_type (content_type),
    INDEX idx_class_content_active (is_active),
    INDEX idx_class_content_published (is_published),
    INDEX idx_class_content_order (class_id, order_index),
    INDEX idx_class_content_created_by (created_by),
    
    -- Foreign key constraints
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Add some sample data for testing
INSERT INTO class_content (class_id, title, content_type, content_text, created_by, is_published) VALUES
('OTU#001001', 'Welcome to the Class', 'announcement', 'Welcome to this exciting learning journey! Please review the syllabus and prepare for our first session.', 1, 1),
('OTU#001001', 'Introduction Lesson', 'lesson', 'This is the first lesson covering the fundamentals of our subject matter.', 1, 1),
('OTU#001001', 'Assignment 1: Getting Started', 'assignment', 'Complete the introductory exercises to demonstrate your understanding.', 1, 1);