-- =================================================================
-- PYRAMIDAL MENTORSHIP SYSTEM IMPLEMENTATION
-- Migration Script to Transform Existing Mentorship to Pyramid Structure
-- =================================================================

-- Step 1: Backup existing data
CREATE TABLE mentors_backup_20240901 AS SELECT * FROM mentors;

-- Verify backup
SELECT 
    (SELECT COUNT(*) FROM mentors) as current_mentors,
    (SELECT COUNT(*) FROM mentors_backup_20240901) as backup_mentors;

-- =================================================================
-- STEP 2: ENHANCE EXISTING MENTORS TABLE
-- =================================================================

-- Add pyramidal structure columns to existing mentors table
ALTER TABLE mentors 
ADD COLUMN mentor_level INT CHECK (mentor_level BETWEEN 1 AND 5) AFTER relationship_type,
ADD COLUMN hierarchy_path VARCHAR(50) COMMENT 'Dot notation path like 1.2.3.4' AFTER mentor_level,
ADD COLUMN direct_family_count INT DEFAULT 0 CHECK (direct_family_count <= 12) AFTER hierarchy_path,
ADD COLUMN community_size INT DEFAULT 0 CHECK (community_size <= 144) AFTER direct_family_count,
ADD COLUMN total_sphere_size INT GENERATED ALWAYS AS (direct_family_count + community_size) STORED,
ADD COLUMN can_accept_mentees BOOLEAN DEFAULT TRUE AFTER total_sphere_size,
ADD COLUMN family_name VARCHAR(100) AFTER can_accept_mentees,
ADD COLUMN monthly_assignments INT DEFAULT 0 AFTER family_name,
ADD COLUMN last_assignment_date DATE AFTER monthly_assignments,
ADD COLUMN last_capacity_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes for performance
ALTER TABLE mentors
ADD INDEX idx_mentor_level (mentor_level),
ADD INDEX idx_hierarchy_path (hierarchy_path),
ADD INDEX idx_capacity (can_accept_mentees, direct_family_count, community_size),
ADD INDEX idx_mentor_converse_active (mentor_converse_id, is_active);

-- Add constraint to prevent exceeding 156 total mentees
ALTER TABLE mentors 
ADD CONSTRAINT chk_total_sphere_limit CHECK (total_sphere_size <= 156);

-- =================================================================
-- STEP 3: CREATE NEW PYRAMIDAL TABLES
-- =================================================================

-- Mentorship hierarchy (detailed relationships)
CREATE TABLE mentorship_hierarchy (
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
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id) ON UPDATE CASCADE,
  FOREIGN KEY (mentee_converse_id) REFERENCES users(converse_id) ON UPDATE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(converse_id) ON UPDATE CASCADE,
  
  UNIQUE KEY unique_active_mentee (mentee_converse_id, is_active),
  INDEX idx_mentor_relationships (mentor_converse_id, relationship_type),
  INDEX idx_hierarchy_level (mentor_level, mentee_level),
  INDEX idx_family_group (family_group_id),
  INDEX idx_assigned_by (assigned_by, created_at),
  
  CHECK (
    (relationship_type = 'direct_family' AND family_position IS NOT NULL AND family_position <= 12) OR
    (relationship_type = 'extended_community' AND family_position IS NULL)
  )
);

-- Mentor capacity tracking
CREATE TABLE mentor_capacity_tracking (
  capacity_id INT PRIMARY KEY AUTO_INCREMENT,
  mentor_converse_id VARCHAR(12) NOT NULL UNIQUE,
  mentor_level INT NOT NULL,
  direct_slots_filled INT DEFAULT 0 CHECK (direct_slots_filled <= 12),
  direct_slots_available INT GENERATED ALWAYS AS (12 - direct_slots_filled) STORED,
  community_slots_filled INT DEFAULT 0 CHECK (community_slots_filled <= 144),
  community_slots_available INT GENERATED ALWAYS AS (144 - community_slots_filled) STORED,
  total_sphere_size INT GENERATED ALWAYS AS (direct_slots_filled + community_slots_filled) STORED,
  last_assignment_date DATE,
  is_accepting_direct BOOLEAN DEFAULT TRUE,
  is_accepting_community BOOLEAN DEFAULT TRUE,
  monthly_assignments INT DEFAULT 0,
  last_reset_month DATE,
  performance_score DECIMAL(3,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id) ON UPDATE CASCADE,
  INDEX idx_availability (is_accepting_direct, is_accepting_community, mentor_level),
  INDEX idx_capacity_status (direct_slots_available, community_slots_available),
  CHECK (total_sphere_size <= 156),
  CHECK (monthly_assignments <= 20)
);

-- Mentorship families (12-member family groups)
CREATE TABLE mentorship_families (
  family_id INT PRIMARY KEY AUTO_INCREMENT,
  family_identifier VARCHAR(30) UNIQUE NOT NULL,
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
  is_full BOOLEAN GENERATED ALWAYS AS (member_count >= 12) STORED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id),
  UNIQUE KEY unique_active_mentor_family (mentor_converse_id, is_active),
  INDEX idx_family_level (mentor_level),
  INDEX idx_family_capacity (is_full, is_active),
  INDEX idx_family_rank (family_rank)
);

-- Mentorship communities (144-member communities)
CREATE TABLE mentorship_communities (
  community_id INT PRIMARY KEY AUTO_INCREMENT,
  overseer_converse_id VARCHAR(12) NOT NULL,
  community_identifier VARCHAR(40) UNIQUE NOT NULL,
  community_name VARCHAR(150),
  overseer_level INT NOT NULL,
  
  -- Community structure
  sub_families JSON COMMENT 'Array of family_identifiers under this community',
  total_members INT DEFAULT 0 CHECK (total_members <= 144),
  active_families INT DEFAULT 0 CHECK (active_families <= 12),
  
  -- Community governance
  governance_rules JSON COMMENT 'Community-specific rules',
  knowledge_standards JSON COMMENT 'Learning benchmarks',
  quality_metrics JSON COMMENT 'Performance indicators',
  
  -- Community achievements
  collective_points INT DEFAULT 0,
  community_achievements JSON,
  community_rank INT,
  
  established_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (overseer_converse_id) REFERENCES users(converse_id),
  UNIQUE KEY unique_overseer_community (overseer_converse_id, is_active),
  INDEX idx_community_level (overseer_level),
  INDEX idx_community_size (total_members, active_families)
);

-- Mentorship assignment history (track all assignments and reassignments)
CREATE TABLE mentorship_assignment_history (
  history_id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_ref VARCHAR(25) UNIQUE NOT NULL,
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
  
  FOREIGN KEY (mentee_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (old_mentor_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (new_mentor_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (assigned_by) REFERENCES users(converse_id),
  FOREIGN KEY (approved_by) REFERENCES users(converse_id),
  
  INDEX idx_mentee_history (mentee_converse_id, assignment_date),
  INDEX idx_admin_assignments (assigned_by, assignment_date),
  INDEX idx_mentor_changes (old_mentor_converse_id, new_mentor_converse_id),
  INDEX idx_pending_approvals (approval_required, approved_by)
);

-- =================================================================
-- STEP 4: MIGRATE EXISTING DATA
-- =================================================================

-- Procedure to migrate existing mentorship data
DELIMITER //
CREATE PROCEDURE MigrateExistingMentorships()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_mentor_id VARCHAR(12);
  DECLARE v_mentee_id VARCHAR(12);
  DECLARE v_created_at TIMESTAMP;
  DECLARE v_relationship_type VARCHAR(10);
  
  DECLARE mentor_cursor CURSOR FOR 
    SELECT mentor_converse_id, mentee_converse_id, createdAt, relationship_type
    FROM mentors 
    WHERE is_active = 1;
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  START TRANSACTION;
  
  -- Step 1: Create capacity tracking for all existing mentors
  INSERT IGNORE INTO mentor_capacity_tracking (mentor_converse_id, mentor_level)
  SELECT DISTINCT 
    m.mentor_converse_id,
    CASE 
      WHEN COUNT(m.mentee_converse_id) >= 10 THEN 5  -- Grand Master
      WHEN COUNT(m.mentee_converse_id) >= 7 THEN 4   -- Master
      WHEN COUNT(m.mentee_converse_id) >= 4 THEN 3   -- Senior
      WHEN COUNT(m.mentee_converse_id) >= 2 THEN 2   -- Advanced
      ELSE 1                                         -- Foundation
    END as initial_level
  FROM mentors m
  WHERE m.is_active = 1 
  GROUP BY m.mentor_converse_id;
  
  -- Step 2: Update mentor levels in mentors table
  UPDATE mentors m
  JOIN mentor_capacity_tracking mct ON m.mentor_converse_id = mct.mentor_converse_id
  SET m.mentor_level = mct.mentor_level
  WHERE m.is_active = 1;
  
  -- Step 3: Create families for mentors
  INSERT INTO mentorship_families (
    family_identifier,
    mentor_converse_id,
    mentor_level,
    family_name,
    established_date
  )
  SELECT DISTINCT
    CONCAT('LEGACY_', m.mentor_converse_id, '_FAMILY'),
    m.mentor_converse_id,
    m.mentor_level,
    CONCAT('Legacy Family of ', SUBSTRING(m.mentor_converse_id, -4)),
    DATE(MIN(m.createdAt))
  FROM mentors m
  WHERE m.is_active = 1 AND m.mentor_level IS NOT NULL
  GROUP BY m.mentor_converse_id, m.mentor_level;
  
  -- Step 4: Migrate relationships to hierarchy
  OPEN mentor_cursor;
  read_loop: LOOP
    FETCH mentor_cursor INTO v_mentor_id, v_mentee_id, v_created_at, v_relationship_type;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Insert into hierarchy with proper structure
    INSERT INTO mentorship_hierarchy (
      mentor_converse_id,
      mentee_converse_id,
      mentor_level,
      mentee_level,
      relationship_type,
      family_position,
      hierarchy_path,
      chain_of_command,
      family_group_id,
      assignment_reason,
      assigned_by,
      established_date
    )
    SELECT 
      v_mentor_id,
      v_mentee_id,
      mct.mentor_level,
      0 as mentee_level,
      'direct_family' as relationship_type,
      ROW_NUMBER() OVER (PARTITION BY v_mentor_id ORDER BY v_created_at) as family_position,
      CONCAT('LEGACY.L', mct.mentor_level, '.', v_mentor_id, '.', v_mentee_id) as hierarchy_path,
      JSON_ARRAY(v_mentor_id) as chain_of_command,
      CONCAT('LEGACY_', v_mentor_id, '_FAMILY') as family_group_id,
      'Migrated from legacy mentorship system',
      'SYSTEM_MIGRATION',
      DATE(v_created_at)
    FROM mentor_capacity_tracking mct
    WHERE mct.mentor_converse_id = v_mentor_id;
    
  END LOOP;
  CLOSE mentor_cursor;
  
  -- Step 5: Update capacity counts
  UPDATE mentor_capacity_tracking mct
  SET direct_slots_filled = (
    SELECT COUNT(*)
    FROM mentorship_hierarchy mh
    WHERE mh.mentor_converse_id = mct.mentor_converse_id
      AND mh.relationship_type = 'direct_family'
      AND mh.is_active = 1
  ),
  last_assignment_date = (
    SELECT MAX(established_date)
    FROM mentorship_hierarchy mh
    WHERE mh.mentor_converse_id = mct.mentor_converse_id
  );
  
  -- Step 6: Update family member counts
  UPDATE mentorship_families mf
  SET member_count = (
    SELECT COUNT(*)
    FROM mentorship_hierarchy mh
    WHERE mh.family_group_id = mf.family_identifier
      AND mh.is_active = 1
  ),
  direct_members = (
    SELECT JSON_ARRAYAGG(mh.mentee_converse_id)
    FROM mentorship_hierarchy mh
    WHERE mh.family_group_id = mf.family_identifier
      AND mh.is_active = 1
  );
  
  COMMIT;
  
  -- Verification queries
  SELECT 'Migration Summary' as status;
  SELECT COUNT(*) as total_mentors FROM mentor_capacity_tracking;
  SELECT COUNT(*) as total_families FROM mentorship_families;
  SELECT COUNT(*) as total_relationships FROM mentorship_hierarchy;
  SELECT mentor_level, COUNT(*) as count FROM mentor_capacity_tracking GROUP BY mentor_level;
  
END //
DELIMITER ;

-- =================================================================
-- STEP 5: UTILITY PROCEDURES FOR ADMIN OPERATIONS
-- =================================================================

-- Procedure to find available mentor with capacity
DELIMITER //
CREATE PROCEDURE FindAvailableMentor(
  IN preferred_level INT,
  IN max_results INT
)
BEGIN
  SELECT 
    mct.mentor_converse_id,
    mct.mentor_level,
    mct.direct_slots_available,
    mct.community_slots_available,
    mf.family_name,
    mf.family_identifier,
    u.username as mentor_username,
    -- Calculate desirability score
    (
      (mct.direct_slots_available / 12.0) * 0.4 +
      (CASE WHEN mct.last_assignment_date IS NULL THEN 1.0 
            ELSE (DATEDIFF(NOW(), mct.last_assignment_date) / 30.0) END) * 0.3 +
      ((20 - mct.monthly_assignments) / 20.0) * 0.3
    ) as desirability_score,
    mct.performance_score
  FROM mentor_capacity_tracking mct
  JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id
  JOIN users u ON mct.mentor_converse_id = u.converse_id
  WHERE mct.is_accepting_direct = 1 
    AND mct.direct_slots_available > 0
    AND (preferred_level IS NULL OR mct.mentor_level = preferred_level)
    AND u.is_identity_masked = 1
    AND u.membership_stage IN ('member', 'full_member')
  ORDER BY desirability_score DESC, mct.direct_slots_available DESC
  LIMIT max_results;
END //
DELIMITER ;

-- Procedure to assign mentee to mentor
DELIMITER //
CREATE PROCEDURE AssignMenteeToMentor(
  IN p_mentor_converse_id VARCHAR(12),
  IN p_mentee_converse_id VARCHAR(12),
  IN p_assigned_by VARCHAR(12),
  IN p_assignment_reason TEXT,
  OUT p_success BOOLEAN,
  OUT p_message TEXT,
  OUT p_assignment_ref VARCHAR(25)
)
BEGIN
  DECLARE v_mentor_level INT;
  DECLARE v_slots_available INT;
  DECLARE v_family_id VARCHAR(30);
  DECLARE v_family_position INT;
  DECLARE v_existing_mentor VARCHAR(12) DEFAULT NULL;
  DECLARE v_assignment_ref VARCHAR(25);
  
  DECLARE exit handler for sqlexception
  BEGIN
    ROLLBACK;
    SET p_success = FALSE;
    SET p_message = 'Database error during assignment';
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Generate assignment reference
  SET v_assignment_ref = CONCAT('ASSIGN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 6));
  SET p_assignment_ref = v_assignment_ref;
  
  -- Check if mentee already has a mentor
  SELECT mh.mentor_converse_id INTO v_existing_mentor
  FROM mentorship_hierarchy mh
  WHERE mh.mentee_converse_id = p_mentee_converse_id AND mh.is_active = 1
  LIMIT 1;
  
  IF v_existing_mentor IS NOT NULL THEN
    SET p_success = FALSE;
    SET p_message = CONCAT('Mentee already assigned to mentor: ', v_existing_mentor);
    ROLLBACK;
  ELSE
    -- Verify mentor has capacity
    SELECT mct.mentor_level, mct.direct_slots_available, mf.family_identifier
    INTO v_mentor_level, v_slots_available, v_family_id
    FROM mentor_capacity_tracking mct
    JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id
    WHERE mct.mentor_converse_id = p_mentor_converse_id
      AND mct.is_accepting_direct = 1;
    
    IF v_slots_available <= 0 THEN
      SET p_success = FALSE;
      SET p_message = 'Mentor has no available capacity';
      ROLLBACK;
    ELSE
      -- Calculate next family position
      SELECT COALESCE(MAX(family_position), 0) + 1 INTO v_family_position
      FROM mentorship_hierarchy
      WHERE mentor_converse_id = p_mentor_converse_id 
        AND relationship_type = 'direct_family'
        AND is_active = 1;
      
      -- Create hierarchy entry
      INSERT INTO mentorship_hierarchy (
        mentor_converse_id, mentee_converse_id, mentor_level, mentee_level,
        relationship_type, family_position, hierarchy_path, chain_of_command,
        family_group_id, assignment_reason, assigned_by
      ) VALUES (
        p_mentor_converse_id, p_mentee_converse_id, v_mentor_level, 0,
        'direct_family', v_family_position,
        CONCAT('L', v_mentor_level, '.', p_mentor_converse_id, '.', p_mentee_converse_id),
        JSON_ARRAY(p_mentor_converse_id),
        v_family_id, p_assignment_reason, p_assigned_by
      );
      
      -- Update mentor capacity
      UPDATE mentor_capacity_tracking
      SET direct_slots_filled = direct_slots_filled + 1,
          last_assignment_date = CURRENT_DATE,
          monthly_assignments = monthly_assignments + 1
      WHERE mentor_converse_id = p_mentor_converse_id;
      
      -- Update family member count
      UPDATE mentorship_families
      SET member_count = member_count + 1,
          direct_members = JSON_ARRAY_APPEND(
            COALESCE(direct_members, JSON_ARRAY()), 
            '$', p_mentee_converse_id
          )
      WHERE family_identifier = v_family_id;
      
      -- Create assignment history record
      INSERT INTO mentorship_assignment_history (
        assignment_ref, mentee_converse_id, action_type,
        new_mentor_converse_id, assigned_by, assignment_reason,
        affected_family_id
      ) VALUES (
        v_assignment_ref, p_mentee_converse_id, 'initial_assignment',
        p_mentor_converse_id, p_assigned_by, p_assignment_reason,
        v_family_id
      );
      
      -- Add legacy mentors entry for backward compatibility
      INSERT INTO mentors (
        mentor_converse_id, mentee_converse_id, relationship_type,
        mentor_level, hierarchy_path, direct_family_count, family_name,
        createdAt, is_active
      ) VALUES (
        p_mentor_converse_id, p_mentee_converse_id, 'mentor',
        v_mentor_level, CONCAT('L', v_mentor_level, '.', p_mentor_converse_id),
        v_family_position, CONCAT('Family Position #', v_family_position),
        NOW(), 1
      );
      
      SET p_success = TRUE;
      SET p_message = CONCAT('Successfully assigned mentee to family position #', v_family_position);
      
      COMMIT;
    END IF;
  END IF;
END //
DELIMITER ;

-- =================================================================
-- STEP 6: EXECUTE MIGRATION
-- =================================================================

-- Run the migration
CALL MigrateExistingMentorships();

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Check migration results
SELECT 'POST-MIGRATION VERIFICATION' as status;

SELECT 
  'Mentor Levels Distribution' as metric,
  mentor_level,
  COUNT(*) as count,
  AVG(direct_slots_filled) as avg_mentees
FROM mentor_capacity_tracking 
GROUP BY mentor_level 
ORDER BY mentor_level DESC;

SELECT 
  'Family Size Distribution' as metric,
  member_count,
  COUNT(*) as families
FROM mentorship_families 
GROUP BY member_count 
ORDER BY member_count;

SELECT 
  'Capacity Overview' as metric,
  SUM(direct_slots_filled) as total_mentees,
  SUM(direct_slots_available) as available_slots,
  COUNT(*) as total_mentors
FROM mentor_capacity_tracking;

-- Check for any inconsistencies
SELECT 
  'Data Consistency Check' as check_type,
  CASE 
    WHEN legacy_count = hierarchy_count THEN 'PASS'
    ELSE 'FAIL'
  END as status,
  legacy_count,
  hierarchy_count
FROM (
  SELECT 
    (SELECT COUNT(*) FROM mentors WHERE is_active = 1) as legacy_count,
    (SELECT COUNT(*) FROM mentorship_hierarchy WHERE is_active = 1) as hierarchy_count
) as counts;

SELECT '=== MIGRATION COMPLETED ===' as final_status;