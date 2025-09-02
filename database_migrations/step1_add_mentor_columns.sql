-- Step 1: Add pyramidal columns to existing mentors table
-- Safe incremental migration

-- Add new columns to mentors table
ALTER TABLE mentors 
ADD COLUMN mentor_level INT CHECK (mentor_level BETWEEN 1 AND 5) AFTER relationship_type,
ADD COLUMN hierarchy_path VARCHAR(50) COMMENT 'Dot notation path like 1.2.3.4' AFTER mentor_level,
ADD COLUMN direct_family_count INT DEFAULT 0 CHECK (direct_family_count <= 12) AFTER hierarchy_path,
ADD COLUMN community_size INT DEFAULT 0 CHECK (community_size <= 144) AFTER direct_family_count,
ADD COLUMN total_sphere_size INT AS (direct_family_count + community_size) STORED,
ADD COLUMN can_accept_mentees BOOLEAN DEFAULT TRUE AFTER total_sphere_size,
ADD COLUMN family_name VARCHAR(100) AFTER can_accept_mentees,
ADD COLUMN monthly_assignments INT DEFAULT 0 AFTER family_name,
ADD COLUMN last_assignment_date DATE AFTER monthly_assignments,
ADD COLUMN last_capacity_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes for performance
ALTER TABLE mentors
ADD INDEX idx_mentor_level (mentor_level),
ADD INDEX idx_hierarchy_path (hierarchy_path),
ADD INDEX idx_capacity (can_accept_mentees, direct_family_count, community_size);

SELECT 'Step 1 completed: Added pyramidal columns to mentors table' as status;