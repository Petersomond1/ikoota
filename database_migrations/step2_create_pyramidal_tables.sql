-- Step 2: Create new pyramidal mentorship tables
-- Create tables one by one to avoid dependency issues

-- Mentor capacity tracking table
CREATE TABLE IF NOT EXISTS mentor_capacity_tracking (
  capacity_id INT PRIMARY KEY AUTO_INCREMENT,
  mentor_converse_id VARCHAR(12) NOT NULL,
  mentor_level INT NOT NULL CHECK (mentor_level BETWEEN 1 AND 5),
  direct_slots_filled INT DEFAULT 0 CHECK (direct_slots_filled <= 12),
  direct_slots_available INT AS (12 - direct_slots_filled) STORED,
  community_slots_filled INT DEFAULT 0 CHECK (community_slots_filled <= 144),
  community_slots_available INT AS (144 - community_slots_filled) STORED,
  total_sphere_size INT AS (direct_slots_filled + community_slots_filled) STORED,
  last_assignment_date DATE,
  is_accepting_direct BOOLEAN DEFAULT TRUE,
  is_accepting_community BOOLEAN DEFAULT TRUE,
  monthly_assignments INT DEFAULT 0,
  last_reset_month DATE,
  performance_score DECIMAL(3,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_mentor_converse (mentor_converse_id),
  INDEX idx_availability (is_accepting_direct, is_accepting_community, mentor_level),
  INDEX idx_capacity_status (direct_slots_available, community_slots_available),
  CHECK (total_sphere_size <= 156),
  CHECK (monthly_assignments <= 20)
);

-- Mentorship hierarchy table
CREATE TABLE IF NOT EXISTS mentorship_hierarchy (
  hierarchy_id INT PRIMARY KEY AUTO_INCREMENT,
  mentor_converse_id VARCHAR(12) NOT NULL,
  mentee_converse_id VARCHAR(12) NOT NULL,
  mentor_level INT NOT NULL CHECK (mentor_level BETWEEN 1 AND 5),
  mentee_level INT NOT NULL CHECK (mentee_level BETWEEN 0 AND 4),
  relationship_type ENUM('direct_family', 'extended_community') NOT NULL,
  family_position INT CHECK (family_position BETWEEN 1 AND 12),
  hierarchy_path VARCHAR(100) NOT NULL COMMENT 'Full path from Grand Master down',
  chain_of_command JSON COMMENT 'Array of mentor converse IDs up to Grand Master',
  established_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  family_group_id VARCHAR(20) COMMENT 'Family identifier',
  assignment_reason TEXT COMMENT 'Why this assignment was made',
  assigned_by VARCHAR(12) COMMENT 'Admin who made assignment',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_mentor_relationships (mentor_converse_id, relationship_type),
  INDEX idx_mentee_active (mentee_converse_id, is_active),
  INDEX idx_hierarchy_level (mentor_level, mentee_level),
  INDEX idx_family_group (family_group_id),
  INDEX idx_assigned_by (assigned_by, created_at),
  
  CHECK (
    (relationship_type = 'direct_family' AND family_position IS NOT NULL AND family_position <= 12) OR
    (relationship_type = 'extended_community' AND family_position IS NULL)
  )
);

-- Mentorship families table
CREATE TABLE IF NOT EXISTS mentorship_families (
  family_id INT PRIMARY KEY AUTO_INCREMENT,
  family_identifier VARCHAR(30) NOT NULL,
  mentor_converse_id VARCHAR(12) NOT NULL,
  mentor_level INT NOT NULL,
  family_name VARCHAR(100),
  family_motto TEXT,
  family_values JSON,
  established_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  
  -- Family composition
  direct_members JSON COMMENT 'Array of 12 mentee converse IDs',
  member_count INT DEFAULT 0 CHECK (member_count <= 12),
  
  -- Family culture and traditions
  meeting_schedule JSON COMMENT 'When family meets',
  tradition_records JSON COMMENT 'Family customs and history',
  achievement_points INT DEFAULT 0,
  family_rank INT COMMENT 'Ranking among peer families',
  
  -- Family status
  is_full BOOLEAN AS (member_count >= 12) STORED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family_identifier (family_identifier),
  INDEX idx_mentor_converse (mentor_converse_id),
  INDEX idx_family_level (mentor_level),
  INDEX idx_family_capacity (is_full, is_active),
  INDEX idx_family_rank (family_rank)
);

-- Mentorship assignment history table
CREATE TABLE IF NOT EXISTS mentorship_assignment_history (
  history_id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_ref VARCHAR(25) NOT NULL,
  mentee_converse_id VARCHAR(12) NOT NULL,
  
  -- Assignment details
  action_type ENUM('initial_assignment', 'reassignment', 'promotion', 'graduation', 'removal') NOT NULL,
  old_mentor_converse_id VARCHAR(12) COMMENT 'Previous mentor (for reassignments)',
  new_mentor_converse_id VARCHAR(12) COMMENT 'New mentor',
  
  -- Administrative details
  assigned_by VARCHAR(12) NOT NULL COMMENT 'Admin who made the change',
  assignment_reason TEXT NOT NULL,
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(12) COMMENT 'Super admin approval if required',
  approved_at TIMESTAMP NULL,
  
  -- Impact tracking
  affected_family_id VARCHAR(30),
  affected_community_id VARCHAR(40),
  cascade_changes JSON COMMENT 'Other changes triggered by this assignment',
  
  assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effective_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  
  INDEX idx_assignment_ref (assignment_ref),
  INDEX idx_mentee_history (mentee_converse_id, assignment_date),
  INDEX idx_admin_assignments (assigned_by, assignment_date),
  INDEX idx_mentor_changes (old_mentor_converse_id, new_mentor_converse_id),
  INDEX idx_pending_approvals (approval_required, approved_by)
);

-- Create test data procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateTestMentors()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_user_id VARCHAR(12);
  DECLARE user_cursor CURSOR FOR 
    SELECT converse_id 
    FROM users 
    WHERE role IN ('admin', 'super_admin') 
    AND is_identity_masked = 1 
    LIMIT 5;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  START TRANSACTION;

  -- Open cursor and create test mentors
  OPEN user_cursor;
  read_loop: LOOP
    FETCH user_cursor INTO v_user_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Insert mentor capacity record
    INSERT IGNORE INTO mentor_capacity_tracking (mentor_converse_id, mentor_level)
    VALUES (v_user_id, FLOOR(1 + RAND() * 5));
    
    -- Create family
    INSERT IGNORE INTO mentorship_families (
      family_identifier, mentor_converse_id, mentor_level, 
      family_name, established_date
    )
    SELECT 
      CONCAT('INIT_', v_user_id, '_FAMILY'),
      v_user_id,
      mentor_level,
      CONCAT('Initial Family of ', v_user_id),
      CURRENT_DATE
    FROM mentor_capacity_tracking 
    WHERE mentor_converse_id = v_user_id;
    
  END LOOP;
  CLOSE user_cursor;

  COMMIT;
  
  SELECT 'Test mentors created successfully' as status;
END //
DELIMITER ;

SELECT 'Step 2 completed: Created pyramidal mentorship tables' as status;