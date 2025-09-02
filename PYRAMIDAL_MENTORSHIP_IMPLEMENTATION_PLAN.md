# **Pyramidal Mentorship System - Implementation Plan**

## **Current System Analysis**

### **Existing `mentors` Table Structure:**
```sql
+--------------------+-------------------------------+------+-----+-------------------+-------------------+
| Field              | Type                          | Null | Key | Default           | Extra             |
+--------------------+-------------------------------+------+-----+-------------------+-------------------+
| id                 | int                           | NO   | PRI | NULL              | auto_increment    |
| mentor_converse_id | varchar(12)                   | YES  | MUL | NULL              |                   |
| mentee_converse_id | varchar(12)                   | YES  | MUL | NULL              |                   |
| relationship_type  | enum('mentor','peer','admin') | YES  |     | mentor            |                   |
| createdAt          | timestamp                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| is_active          | tinyint(1)                    | YES  |     | 1                 |                   |
+--------------------+-------------------------------+------+-----+-------------------+-------------------+
```

### **Issues with Current Structure:**
1. ❌ No hierarchical levels (1-5 pyramid structure)
2. ❌ No family/community organization (12+144 rule)
3. ❌ No asymmetric identity revelation system
4. ❌ Simple 1:1 mentor-mentee relationships only
5. ❌ No chain of command tracking

---

## **🔄 Migration Strategy**

### **Phase 1: Database Schema Enhancement**

#### **Step 1.1: Backup Current Data**
```sql
-- Create backup of existing mentors table
CREATE TABLE mentors_backup_20240901 AS SELECT * FROM mentors;

-- Verify backup
SELECT COUNT(*) as current_mentors FROM mentors;
SELECT COUNT(*) as backup_mentors FROM mentors_backup_20240901;
```

#### **Step 1.2: Add New Columns to Existing Tables**
```sql
-- Add pyramidal structure columns to mentors table
ALTER TABLE mentors 
ADD COLUMN mentor_level INT CHECK (mentor_level BETWEEN 1 AND 5) AFTER relationship_type,
ADD COLUMN hierarchy_path VARCHAR(50) COMMENT 'Dot notation path like 1.2.3.4' AFTER mentor_level,
ADD COLUMN direct_family_count INT DEFAULT 0 CHECK (direct_family_count <= 12) AFTER hierarchy_path,
ADD COLUMN community_size INT DEFAULT 0 CHECK (community_size <= 144) AFTER direct_family_count,
ADD COLUMN total_sphere_size INT GENERATED ALWAYS AS (direct_family_count + community_size) STORED,
ADD COLUMN can_accept_mentees BOOLEAN DEFAULT TRUE AFTER total_sphere_size,
ADD COLUMN family_name VARCHAR(100) AFTER can_accept_mentees,
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
```

#### **Step 1.3: Create New Pyramidal Tables**
```sql
-- Mentorship hierarchy (replaces the simple mentors table relationships)
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
  family_group_id VARCHAR(20) COMMENT 'Family identifier like GrandMaster1.Family3',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id) ON UPDATE CASCADE,
  FOREIGN KEY (mentee_converse_id) REFERENCES users(converse_id) ON UPDATE CASCADE,
  
  UNIQUE KEY unique_mentee (mentee_converse_id, is_active),
  INDEX idx_mentor_relationships (mentor_converse_id, relationship_type),
  INDEX idx_hierarchy_level (mentor_level, mentee_level),
  INDEX idx_family_group (family_group_id),
  
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id) ON UPDATE CASCADE,
  INDEX idx_availability (is_accepting_direct, is_accepting_community, mentor_level),
  CHECK (total_sphere_size <= 156),
  CHECK (monthly_assignments <= 20) -- Prevent overloading mentors
);

-- Asymmetric identity revelation system
CREATE TABLE mentee_identity_revelations (
  revelation_id INT PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(20) UNIQUE NOT NULL,
  mentor_converse_id VARCHAR(12) NOT NULL,
  mentee_converse_id VARCHAR(12) NOT NULL,
  relationship_type ENUM('direct_family', 'extended_community') NOT NULL,
  request_reason ENUM(
    'performance_concern', 'exceptional_talent', 'safety_issue', 
    'graduation_assessment', 'disciplinary_action', 'personal_guidance'
  ) NOT NULL,
  detailed_justification TEXT NOT NULL,
  supporting_evidence JSON,
  
  -- Request workflow
  request_status ENUM('pending', 'approved', 'denied', 'expired', 'revoked') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(12) COMMENT 'Super admin converse ID',
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT,
  
  -- Access control
  access_granted_at TIMESTAMP NULL,
  access_expires_at TIMESTAMP NULL,
  access_revoked_at TIMESTAMP NULL,
  revocation_reason TEXT,
  
  -- Audit trail
  identity_data_hash VARCHAR(64) COMMENT 'SHA256 hash of revealed data',
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMP NULL,
  access_ip_addresses JSON COMMENT 'Track where accessed from',
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (mentee_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (reviewed_by) REFERENCES users(converse_id),
  
  INDEX idx_mentor_requests (mentor_converse_id, request_status),
  INDEX idx_pending_reviews (request_status, requested_at),
  INDEX idx_active_revelations (mentor_converse_id, access_expires_at),
  INDEX idx_mentee_privacy (mentee_converse_id, request_status)
);

-- Family and community structure
CREATE TABLE mentorship_families (
  family_id INT PRIMARY KEY AUTO_INCREMENT,
  family_identifier VARCHAR(30) UNIQUE NOT NULL, -- e.g., "GM1_L4M2_L3M7_L2M3"
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
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mentor_converse_id) REFERENCES users(converse_id),
  UNIQUE KEY unique_active_mentor_family (mentor_converse_id, is_active),
  INDEX idx_family_level (mentor_level),
  INDEX idx_family_rank (family_rank)
);

-- Community oversight (144 mentees under a mentor)
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

-- Knowledge transmission tracking
CREATE TABLE knowledge_transmissions (
  transmission_id INT PRIMARY KEY AUTO_INCREMENT,
  transmission_ref VARCHAR(25) UNIQUE NOT NULL,
  source_mentor_converse_id VARCHAR(12) NOT NULL,
  target_mentee_converse_id VARCHAR(12) NOT NULL,
  transmission_level INT NOT NULL COMMENT 'Level at which knowledge was transmitted',
  
  -- Knowledge classification
  knowledge_type ENUM('principle', 'technique', 'wisdom', 'practice', 'theory', 'experience') NOT NULL,
  knowledge_category VARCHAR(50),
  knowledge_level INT CHECK (knowledge_level BETWEEN 1 AND 10),
  content_hash VARCHAR(64) COMMENT 'SHA256 of transmitted content',
  
  -- Transmission method
  transmission_method ENUM(
    'direct_teaching', 'demonstration', 'guided_practice', 
    'assignment', 'osmosis', 'group_session', 'mentorship_circle'
  ) NOT NULL,
  
  -- Verification and impact
  requires_verification BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(12) COMMENT 'Verifying mentor converse ID',
  verification_date TIMESTAMP NULL,
  impact_score DECIMAL(3,2) CHECK (impact_score BETWEEN 0 AND 10),
  
  -- Tracking
  transmission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  followup_required BOOLEAN DEFAULT FALSE,
  followup_date DATE,
  
  FOREIGN KEY (source_mentor_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (target_mentee_converse_id) REFERENCES users(converse_id),
  FOREIGN KEY (verified_by) REFERENCES users(converse_id),
  
  INDEX idx_mentor_transmissions (source_mentor_converse_id, transmission_date),
  INDEX idx_mentee_learning (target_mentee_converse_id, knowledge_type),
  INDEX idx_verification_queue (requires_verification, verified_by),
  INDEX idx_knowledge_flow (transmission_level, knowledge_type)
);
```

---

## **📊 Data Migration Strategy**

### **Step 2.1: Analyze Current Mentor-Mentee Relationships**
```sql
-- Get current mentorship overview
SELECT 
  mentor_converse_id,
  COUNT(mentee_converse_id) as current_mentees,
  GROUP_CONCAT(mentee_converse_id) as mentee_list
FROM mentors 
WHERE is_active = 1 
GROUP BY mentor_converse_id
ORDER BY current_mentees DESC;

-- Identify users who could be promoted to mentors
SELECT 
  u.converse_id,
  u.username,
  u.membership_stage,
  u.createdAt,
  DATEDIFF(NOW(), u.createdAt) as days_as_member,
  COUNT(DISTINCT m.mentor_converse_id) as has_mentor,
  -- Check if they're being mentored
  CASE WHEN COUNT(DISTINCT m.mentor_converse_id) > 0 THEN 'Has Mentor' ELSE 'No Mentor' END as mentorship_status
FROM users u
LEFT JOIN mentors m ON u.converse_id = m.mentee_converse_id AND m.is_active = 1
WHERE u.is_identity_masked = 1 
  AND u.membership_stage IN ('member', 'full_member')
  AND DATEDIFF(NOW(), u.createdAt) >= 90 -- At least 3 months as member
GROUP BY u.converse_id, u.username, u.membership_stage, u.createdAt
ORDER BY days_as_member DESC;
```

### **Step 2.2: Create Initial Pyramid Structure**
```sql
-- Migration procedure to establish pyramid
DELIMITER //
CREATE PROCEDURE EstablishInitialPyramid()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_mentor_id VARCHAR(12);
  DECLARE v_mentee_count INT;
  DECLARE mentor_cursor CURSOR FOR 
    SELECT mentor_converse_id, COUNT(mentee_converse_id) as mentees
    FROM mentors 
    WHERE is_active = 1 
    GROUP BY mentor_converse_id 
    ORDER BY mentees DESC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  START TRANSACTION;
  
  -- Step 1: Identify potential Grand Masters (mentors with most mentees)
  INSERT INTO mentor_capacity_tracking (mentor_converse_id, mentor_level)
  SELECT 
    mentor_converse_id,
    CASE 
      WHEN COUNT(mentee_converse_id) >= 10 THEN 5  -- Grand Master
      WHEN COUNT(mentee_converse_id) >= 7 THEN 4   -- Master
      WHEN COUNT(mentee_converse_id) >= 4 THEN 3   -- Senior
      WHEN COUNT(mentee_converse_id) >= 2 THEN 2   -- Advanced
      ELSE 1                                       -- Foundation
    END as initial_level
  FROM mentors 
  WHERE is_active = 1 
  GROUP BY mentor_converse_id;
  
  -- Step 2: Create initial family structures for current mentors
  OPEN mentor_cursor;
  read_loop: LOOP
    FETCH mentor_cursor INTO v_mentor_id, v_mentee_count;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Create family for each mentor
    INSERT INTO mentorship_families (
      family_identifier,
      mentor_converse_id,
      mentor_level,
      family_name,
      direct_members,
      member_count
    )
    SELECT 
      CONCAT('LEGACY_', v_mentor_id, '_FAMILY'),
      v_mentor_id,
      mct.mentor_level,
      CONCAT('Legacy Family of ', v_mentor_id),
      JSON_ARRAY(), -- Will populate in next step
      LEAST(v_mentee_count, 12) -- Cap at 12 for direct family
    FROM mentor_capacity_tracking mct 
    WHERE mct.mentor_converse_id = v_mentor_id;
    
  END LOOP;
  CLOSE mentor_cursor;
  
  -- Step 3: Migrate existing relationships to hierarchy
  INSERT INTO mentorship_hierarchy (
    mentor_converse_id,
    mentee_converse_id,
    mentor_level,
    mentee_level,
    relationship_type,
    family_position,
    hierarchy_path,
    chain_of_command,
    family_group_id
  )
  SELECT 
    m.mentor_converse_id,
    m.mentee_converse_id,
    mct.mentor_level,
    0 as mentee_level, -- All current mentees start as level 0
    'direct_family' as relationship_type,
    ROW_NUMBER() OVER (PARTITION BY m.mentor_converse_id ORDER BY m.createdAt) as family_position,
    CONCAT('LEGACY.', m.mentor_converse_id) as hierarchy_path,
    JSON_ARRAY(m.mentor_converse_id) as chain_of_command,
    CONCAT('LEGACY_', m.mentor_converse_id, '_FAMILY') as family_group_id
  FROM mentors m
  JOIN mentor_capacity_tracking mct ON m.mentor_converse_id = mct.mentor_converse_id
  WHERE m.is_active = 1;
  
  COMMIT;
END //
DELIMITER ;

-- Execute the migration
CALL EstablishInitialPyramid();
```

---

## **🔧 Backend Service Updates**

### **Step 3.1: Enhanced MentorIdServices**
```javascript
// ikootaapi/services/pyramidalMentorshipServices.js
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import crypto from 'crypto';

class PyramidalMentorshipServices {
    
    /**
     * Get mentor's complete pyramidal status
     */
    async getMentorPyramidStatus(mentorConverseId) {
        try {
            // Get mentor's capacity and level
            const mentorData = await db.query(`
                SELECT 
                    mct.*,
                    mf.family_name,
                    mf.family_identifier,
                    mf.member_count,
                    mc.community_name,
                    mc.total_members as community_size
                FROM mentor_capacity_tracking mct
                LEFT JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id
                LEFT JOIN mentorship_communities mc ON mct.mentor_converse_id = mc.overseer_converse_id
                WHERE mct.mentor_converse_id = ?
            `, [mentorConverseId]);

            if (!mentorData.length) {
                throw new CustomError('Mentor not found in pyramidal system', 404);
            }

            const mentor = mentorData[0];

            // Get direct family members
            const directFamily = await db.query(`
                SELECT 
                    mh.mentee_converse_id,
                    mh.family_position,
                    mh.established_date,
                    u.username as mentee_masked_name
                FROM mentorship_hierarchy mh
                LEFT JOIN users u ON mh.mentee_converse_id = u.converse_id
                WHERE mh.mentor_converse_id = ? 
                  AND mh.relationship_type = 'direct_family'
                  AND mh.is_active = 1
                ORDER BY mh.family_position
            `, [mentorConverseId]);

            // Get extended community overview
            const communityOverview = await db.query(`
                SELECT 
                    COUNT(DISTINCT mh.mentee_converse_id) as total_community_mentees,
                    COUNT(DISTINCT mh2.mentor_converse_id) as sub_mentors
                FROM mentorship_hierarchy mh
                LEFT JOIN mentorship_hierarchy mh2 ON mh.mentee_converse_id = mh2.mentor_converse_id
                WHERE JSON_CONTAINS(mh.chain_of_command, JSON_QUOTE(?))
                  AND mh.is_active = 1
            `, [mentorConverseId]);

            return {
                mentorLevel: mentor.mentor_level,
                capacity: {
                    directFamily: {
                        filled: mentor.direct_slots_filled,
                        available: mentor.direct_slots_available,
                        members: directFamily
                    },
                    community: {
                        filled: mentor.community_slots_filled,
                        available: mentor.community_slots_available,
                        totalMentees: communityOverview[0]?.total_community_mentees || 0,
                        subMentors: communityOverview[0]?.sub_mentors || 0
                    }
                },
                family: {
                    name: mentor.family_name,
                    identifier: mentor.family_identifier,
                    memberCount: mentor.member_count
                },
                community: {
                    name: mentor.community_name,
                    size: mentor.community_size
                },
                canAcceptMentees: mentor.is_accepting_direct && mentor.direct_slots_available > 0
            };
        } catch (error) {
            throw new CustomError(`Failed to get pyramid status: ${error.message}`, 500);
        }
    }

    /**
     * Find available mentor with capacity in the pyramid
     */
    async findAvailableMentor(preferredLevel = null) {
        try {
            const levelCondition = preferredLevel ? 'AND mct.mentor_level = ?' : '';
            const params = preferredLevel ? [preferredLevel] : [];

            const availableMentors = await db.query(`
                SELECT 
                    mct.mentor_converse_id,
                    mct.mentor_level,
                    mct.direct_slots_available,
                    mf.family_name,
                    mf.family_identifier,
                    -- Calculate mentor desirability score
                    (
                        (mct.direct_slots_available / 12.0) * 0.4 +  -- Availability weight
                        (DATEDIFF(NOW(), mct.last_assignment_date) / 30.0) * 0.3 +  -- Recency weight
                        ((12 - mct.monthly_assignments) / 12.0) * 0.3  -- Workload weight
                    ) as desirability_score
                FROM mentor_capacity_tracking mct
                LEFT JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id
                WHERE mct.is_accepting_direct = 1 
                  AND mct.direct_slots_available > 0
                  ${levelCondition}
                ORDER BY desirability_score DESC, mct.direct_slots_available DESC
                LIMIT 5
            `, params);

            return availableMentors;
        } catch (error) {
            throw new CustomError(`Failed to find available mentor: ${error.message}`, 500);
        }
    }

    /**
     * Assign mentee to mentor following pyramidal rules
     */
    async assignMenteeToMentor(mentorConverseId, menteeConverseId, assignedBy) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Verify mentor has capacity
            const capacity = await connection.query(`
                SELECT * FROM mentor_capacity_tracking 
                WHERE mentor_converse_id = ? AND direct_slots_available > 0
            `, [mentorConverseId]);

            if (!capacity.length) {
                throw new CustomError('Mentor has no available capacity', 400);
            }

            const mentor = capacity[0];

            // Check if mentee is already assigned
            const existing = await connection.query(`
                SELECT id FROM mentorship_hierarchy 
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            if (existing.length) {
                throw new CustomError('Mentee already has a mentor', 409);
            }

            // Get mentor's family info
            const familyData = await connection.query(`
                SELECT * FROM mentorship_families 
                WHERE mentor_converse_id = ?
            `, [mentorConverseId]);

            if (!familyData.length) {
                // Create family if doesn't exist
                await connection.query(`
                    INSERT INTO mentorship_families (
                        family_identifier, mentor_converse_id, mentor_level,
                        family_name, established_date
                    ) VALUES (?, ?, ?, ?, CURRENT_DATE)
                `, [
                    `L${mentor.mentor_level}_${mentorConverseId}_FAMILY`,
                    mentorConverseId,
                    mentor.mentor_level,
                    `Level ${mentor.mentor_level} Family`
                ]);
            }

            // Calculate family position
            const nextPosition = await connection.query(`
                SELECT COALESCE(MAX(family_position), 0) + 1 as next_pos
                FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND relationship_type = 'direct_family'
            `, [mentorConverseId]);

            const familyPosition = nextPosition[0].next_pos;

            // Create hierarchy entry
            await connection.query(`
                INSERT INTO mentorship_hierarchy (
                    mentor_converse_id, mentee_converse_id, mentor_level, mentee_level,
                    relationship_type, family_position, hierarchy_path, chain_of_command,
                    family_group_id
                ) VALUES (?, ?, ?, 0, 'direct_family', ?, ?, ?, ?)
            `, [
                mentorConverseId, menteeConverseId, mentor.mentor_level,
                familyPosition,
                `L${mentor.mentor_level}.${mentorConverseId}.${menteeConverseId}`,
                JSON.stringify([mentorConverseId]),
                `L${mentor.mentor_level}_${mentorConverseId}_FAMILY`
            ]);

            // Update mentor capacity
            await connection.query(`
                UPDATE mentor_capacity_tracking 
                SET direct_slots_filled = direct_slots_filled + 1,
                    last_assignment_date = CURRENT_DATE,
                    monthly_assignments = monthly_assignments + 1
                WHERE mentor_converse_id = ?
            `, [mentorConverseId]);

            // Update family member count
            await connection.query(`
                UPDATE mentorship_families 
                SET member_count = member_count + 1
                WHERE mentor_converse_id = ?
            `, [mentorConverseId]);

            await connection.commit();

            return {
                success: true,
                mentorConverseId,
                menteeConverseId,
                familyPosition,
                relationshipType: 'direct_family'
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Request mentee identity revelation (Asymmetric system)
     */
    async requestMenteeIdentityRevelation(mentorConverseId, menteeConverseId, requestData) {
        try {
            // Verify mentor-mentee relationship
            const relationship = await db.query(`
                SELECT mh.*, mct.mentor_level
                FROM mentorship_hierarchy mh
                JOIN mentor_capacity_tracking mct ON mh.mentor_converse_id = mct.mentor_converse_id
                WHERE mh.mentor_converse_id = ? 
                  AND mh.mentee_converse_id = ? 
                  AND mh.is_active = 1
            `, [mentorConverseId, menteeConverseId]);

            if (!relationship.length) {
                throw new CustomError('No valid mentor-mentee relationship found', 404);
            }

            // Check monthly request limit (max 3 per month)
            const monthlyRequests = await db.query(`
                SELECT COUNT(*) as request_count
                FROM mentee_identity_revelations 
                WHERE mentor_converse_id = ? 
                  AND MONTH(requested_at) = MONTH(NOW())
                  AND YEAR(requested_at) = YEAR(NOW())
            `, [mentorConverseId]);

            if (monthlyRequests[0].request_count >= 3) {
                throw new CustomError('Monthly revelation request limit exceeded (3 max)', 429);
            }

            // Generate unique request ID
            const requestId = `REV_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            // Create revelation request
            await db.query(`
                INSERT INTO mentee_identity_revelations (
                    request_id, mentor_converse_id, mentee_converse_id,
                    relationship_type, request_reason, detailed_justification,
                    supporting_evidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                requestId, mentorConverseId, menteeConverseId,
                relationship[0].relationship_type, requestData.reason,
                requestData.justification, JSON.stringify(requestData.evidence || {})
            ]);

            // Notify mentee about the request
            await this.notifyMenteeOfRevelationRequest(menteeConverseId, requestId);

            return {
                requestId,
                status: 'pending_admin_review',
                estimatedReviewTime: '24-48 hours',
                canAppeal: true
            };

        } catch (error) {
            throw new CustomError(`Failed to request identity revelation: ${error.message}`, 500);
        }
    }

    /**
     * CRITICAL: Ensure mentors can NEVER be revealed to mentees
     */
    async getMenteeView(menteeConverseId) {
        try {
            // Get mentee's position in pyramid (but NO mentor identity info)
            const menteeInfo = await db.query(`
                SELECT 
                    mh.hierarchy_path,
                    mh.family_position,
                    mh.established_date,
                    mf.family_name,
                    mf.family_motto,
                    -- CRITICAL: NO mentor_converse_id exposed
                    'MENTOR_HIDDEN' as mentor_alias,
                    CONCAT('Position ', mh.family_position, ' in ', mf.family_name) as family_status
                FROM mentorship_hierarchy mh
                LEFT JOIN mentorship_families mf ON mh.family_group_id = mf.family_identifier
                WHERE mh.mentee_converse_id = ? AND mh.is_active = 1
            `, [menteeConverseId]);

            // Get family peers (other mentees in same family - no mentor info)
            const familyPeers = await db.query(`
                SELECT 
                    mh2.mentee_converse_id,
                    mh2.family_position,
                    -- Use masked identities only
                    CONCAT('Family Member #', mh2.family_position) as peer_alias
                FROM mentorship_hierarchy mh1
                JOIN mentorship_hierarchy mh2 ON mh1.family_group_id = mh2.family_group_id
                WHERE mh1.mentee_converse_id = ? 
                  AND mh2.mentee_converse_id != ?
                  AND mh1.is_active = 1 AND mh2.is_active = 1
                ORDER BY mh2.family_position
            `, [menteeConverseId, menteeConverseId]);

            return {
                menteePosition: menteeInfo[0] || null,
                familyPeers: familyPeers,
                // CRITICAL: Never include mentor identity information
                mentorInfo: 'PROTECTED_IDENTITY'
            };

        } catch (error) {
            throw new CustomError(`Failed to get mentee view: ${error.message}`, 500);
        }
    }

    /**
     * Notify mentee of identity revelation request
     */
    async notifyMenteeOfRevelationRequest(menteeConverseId, requestId) {
        // Implementation would integrate with your notification system
        console.log(`🔔 Identity revelation requested for ${menteeConverseId}, Request: ${requestId}`);
        
        // This would typically create a notification record
        await db.query(`
            INSERT INTO notifications (
                user_converse_id, type, title, message, metadata, created_at
            ) VALUES (?, 'identity_revelation', 'Identity Access Request', 
                'Your mentor has requested access to your identity for guidance purposes. Request ID: ?',
                JSON_OBJECT('request_id', ?, 'can_appeal', true), NOW())
        `, [menteeConverseId, requestId, requestId]);
    }
}

export default new PyramidalMentorshipServices();
```

### **Step 3.2: Identity Revelation Admin Controller**
```javascript
// ikootaapi/controllers/identityRevelationControllers.js
import PyramidalMentorshipServices from '../services/pyramidalMentorshipServices.js';
import CustomError from '../utils/CustomError.js';

/**
 * Process identity revelation request (Super Admin only)
 * POST /api/admin/identity-revelations/review
 */
export const reviewIdentityRevelationRequest = async (req, res) => {
    try {
        // CRITICAL: Only Super Admins can process these requests
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Access denied: Super Admin privileges required', 403);
        }

        const { requestId, decision, reviewNotes, durationDays = 7 } = req.body;

        if (!requestId || !decision) {
            throw new CustomError('Request ID and decision are required', 400);
        }

        // Get the revelation request
        const request = await db.query(`
            SELECT * FROM mentee_identity_revelations 
            WHERE request_id = ? AND request_status = 'pending'
        `, [requestId]);

        if (!request.length) {
            throw new CustomError('Revelation request not found or already processed', 404);
        }

        const revelationRequest = request[0];

        if (decision === 'approved') {
            // Calculate expiry date
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);

            // Update request with approval
            await db.query(`
                UPDATE mentee_identity_revelations 
                SET request_status = 'approved',
                    reviewed_by = ?,
                    reviewed_at = NOW(),
                    review_notes = ?,
                    access_granted_at = NOW(),
                    access_expires_at = ?
                WHERE request_id = ?
            `, [req.user.converse_id, reviewNotes, expiryDate, requestId]);

            // Get mentee's real identity (encrypted)
            const menteeIdentity = await db.query(`
                SELECT 
                    u.id, u.username, u.email, u.phone, u.real_name,
                    u.address, u.date_of_birth, u.emergency_contact,
                    -- Create audit trail hash
                    SHA2(CONCAT(u.id, u.username, u.email, NOW()), 256) as identity_hash
                FROM users u
                WHERE u.converse_id = ?
            `, [revelationRequest.mentee_converse_id]);

            if (menteeIdentity.length) {
                // Store identity hash for audit
                await db.query(`
                    UPDATE mentee_identity_revelations 
                    SET identity_data_hash = ?
                    WHERE request_id = ?
                `, [menteeIdentity[0].identity_hash, requestId]);

                // Create secure access token for mentor
                const accessToken = crypto.randomBytes(32).toString('hex');
                
                // Store temporary access (expires automatically)
                await db.query(`
                    INSERT INTO temporary_identity_access (
                        access_token, request_id, mentor_converse_id, 
                        mentee_data, expires_at
                    ) VALUES (?, ?, ?, ?, ?)
                `, [
                    accessToken, requestId, revelationRequest.mentor_converse_id,
                    JSON.stringify({
                        ...menteeIdentity[0],
                        watermark: `CONFIDENTIAL - Expires ${expiryDate.toISOString()}`,
                        restrictions: ['NO_DOWNLOAD', 'NO_SCREENSHOT', 'AUDIT_LOGGED']
                    }),
                    expiryDate
                ]);

                res.status(200).json({
                    success: true,
                    message: 'Identity revelation approved',
                    requestId,
                    accessToken: accessToken.substring(0, 8) + '...', // Truncated for security
                    expiresAt: expiryDate,
                    restrictions: [
                        'Time-limited access',
                        'View only - no downloads',
                        'All access is logged',
                        'Watermarked display'
                    ]
                });
            }
        } else if (decision === 'denied') {
            await db.query(`
                UPDATE mentee_identity_revelations 
                SET request_status = 'denied',
                    reviewed_by = ?,
                    reviewed_at = NOW(),
                    review_notes = ?
                WHERE request_id = ?
            `, [req.user.converse_id, reviewNotes, requestId]);

            res.status(200).json({
                success: true,
                message: 'Identity revelation denied',
                requestId,
                reason: reviewNotes
            });
        }

        // Audit log the admin decision
        await db.query(`
            INSERT INTO admin_action_logs (
                admin_user_id, action_type, target_entity, entity_id,
                action_details, ip_address
            ) VALUES (?, 'IDENTITY_REVELATION_REVIEW', 'revelation_request', ?, ?, ?)
        `, [
            req.user.id, 'mentee_identity_revelations', requestId,
            JSON.stringify({ decision, reviewNotes }), req.ip
        ]);

    } catch (error) {
        console.error('❌ Error reviewing identity revelation:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to review identity revelation request'
        });
    }
};
```

---

## **🎨 Frontend Component Updates**

### **Step 4.1: Pyramidal Mentorship Dashboard**
```javascript
// ikootaclient/src/components/mentorship/PyramidalMentorshipDashboard.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';

const PyramidalMentorshipDashboard = () => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('overview');

    // Get user's mentorship status in the pyramid
    const { data: pyramidStatus, isLoading } = useQuery({
        queryKey: ['pyramidStatus', user?.converse_id],
        queryFn: async () => {
            const { data } = await api.get('/api/mentorship/pyramid/status');
            return data;
        },
        enabled: !!user?.converse_id
    });

    if (isLoading) {
        return <div className="pyramid-loading">Loading pyramid status...</div>;
    }

    const isMentor = pyramidStatus?.isMentor;
    const isMentee = pyramidStatus?.isMentee;

    return (
        <div className="pyramidal-mentorship-dashboard">
            <div className="pyramid-header">
                <h1>🏛️ Pyramidal Mentorship System</h1>
                <div className="user-pyramid-position">
                    {isMentor && (
                        <div className="mentor-badge">
                            <span className="level">Level {pyramidStatus.mentorLevel}</span>
                            <span className="title">{getMentorTitle(pyramidStatus.mentorLevel)}</span>
                        </div>
                    )}
                    {isMentee && (
                        <div className="mentee-position">
                            <span className="family">Family Member #{pyramidStatus.familyPosition}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="pyramid-tabs">
                <button 
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                {isMentor && (
                    <>
                        <button 
                            className={activeTab === 'family' ? 'active' : ''}
                            onClick={() => setActiveTab('family')}
                        >
                            My Family ({pyramidStatus.capacity?.directFamily?.filled}/12)
                        </button>
                        <button 
                            className={activeTab === 'community' ? 'active' : ''}
                            onClick={() => setActiveTab('community')}
                        >
                            My Community ({pyramidStatus.capacity?.community?.filled}/144)
                        </button>
                        <button 
                            className={activeTab === 'identity' ? 'active' : ''}
                            onClick={() => setActiveTab('identity')}
                        >
                            Identity Requests
                        </button>
                    </>
                )}
                {isMentee && (
                    <button 
                        className={activeTab === 'learning' ? 'active' : ''}
                        onClick={() => setActiveTab('learning')}
                    >
                        My Learning Journey
                    </button>
                )}
            </div>

            <div className="pyramid-content">
                {activeTab === 'overview' && (
                    <PyramidOverview status={pyramidStatus} />
                )}
                {activeTab === 'family' && isMentor && (
                    <FamilyManagement family={pyramidStatus.capacity.directFamily} />
                )}
                {activeTab === 'community' && isMentor && (
                    <CommunityOversight community={pyramidStatus.capacity.community} />
                )}
                {activeTab === 'identity' && isMentor && (
                    <IdentityRequestPanel mentorId={user.converse_id} />
                )}
                {activeTab === 'learning' && isMentee && (
                    <LearningJourney menteeData={pyramidStatus} />
                )}
            </div>
        </div>
    );
};

const getMentorTitle = (level) => {
    const titles = {
        5: 'Grand Master',
        4: 'Master Mentor', 
        3: 'Senior Mentor',
        2: 'Advanced Mentor',
        1: 'Foundation Mentor'
    };
    return titles[level] || 'Mentor';
};

// Family Management Component
const FamilyManagement = ({ family }) => {
    return (
        <div className="family-management">
            <div className="family-header">
                <h2>👨‍👩‍👧‍👦 Your Direct Family</h2>
                <div className="capacity-indicator">
                    <span className="filled">{family.filled}</span>
                    <span className="separator">/</span>
                    <span className="total">12</span>
                    <span className="available">({family.available} slots available)</span>
                </div>
            </div>

            <div className="family-members">
                {family.members.map(member => (
                    <div key={member.mentee_converse_id} className="family-member-card">
                        <div className="member-position">#{member.family_position}</div>
                        <div className="member-info">
                            <div className="member-id">{member.mentee_converse_id}</div>
                            <div className="joined-date">
                                Joined: {new Date(member.established_date).toLocaleDateString()}
                            </div>
                            {/* CRITICAL: Never show real names to protect mentee identity in reverse */}
                        </div>
                        <div className="member-actions">
                            <button className="btn-guidance">Provide Guidance</button>
                            <button className="btn-identity">Request Identity</button>
                        </div>
                    </div>
                ))}
            </div>

            {family.available > 0 && (
                <div className="recruit-mentee">
                    <button className="btn-recruit">Accept New Family Member</button>
                </div>
            )}
        </div>
    );
};

// Identity Request Panel (For Mentors Only)
const IdentityRequestPanel = ({ mentorId }) => {
    const [requestForm, setRequestForm] = useState({
        menteeId: '',
        reason: '',
        justification: '',
        evidence: ''
    });

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        
        try {
            const response = await api.post('/api/mentorship/identity/request', {
                mentee_converse_id: requestForm.menteeId,
                reason: requestForm.reason,
                justification: requestForm.justification,
                evidence: requestForm.evidence
            });

            alert(`Identity request submitted. Request ID: ${response.data.requestId}`);
            setRequestForm({ menteeId: '', reason: '', justification: '', evidence: '' });
        } catch (error) {
            alert(`Failed to submit request: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div className="identity-request-panel">
            <div className="panel-warning">
                <h3>⚠️ Mentee Identity Revelation</h3>
                <p>Requesting access to a mentee's real identity is a serious responsibility. 
                   Only request when necessary for their guidance and development.</p>
            </div>

            <form onSubmit={handleSubmitRequest} className="request-form">
                <div className="form-group">
                    <label>Mentee Converse ID</label>
                    <input
                        type="text"
                        value={requestForm.menteeId}
                        onChange={(e) => setRequestForm({...requestForm, menteeId: e.target.value})}
                        placeholder="OTO#XXXXXX"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Reason Category</label>
                    <select
                        value={requestForm.reason}
                        onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                        required
                    >
                        <option value="">Select reason...</option>
                        <option value="performance_concern">Performance Concern</option>
                        <option value="exceptional_talent">Exceptional Talent Recognition</option>
                        <option value="safety_issue">Safety/Wellbeing Issue</option>
                        <option value="graduation_assessment">Graduation Assessment</option>
                        <option value="personal_guidance">Personal Guidance Need</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Detailed Justification</label>
                    <textarea
                        value={requestForm.justification}
                        onChange={(e) => setRequestForm({...requestForm, justification: e.target.value})}
                        placeholder="Explain why identity revelation is necessary..."
                        rows={4}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Supporting Evidence</label>
                    <textarea
                        value={requestForm.evidence}
                        onChange={(e) => setRequestForm({...requestForm, evidence: e.target.value})}
                        placeholder="Any supporting documentation or context..."
                        rows={3}
                    />
                </div>

                <button type="submit" className="btn-submit-request">
                    Submit Identity Request
                </button>
            </form>

            <div className="request-limits">
                <p>📋 Monthly limit: 3 requests per mentor</p>
                <p>⏱️ Review time: 24-48 hours</p>
                <p>🔒 Access duration: 7 days (default)</p>
            </div>
        </div>
    );
};

export default PyramidalMentorshipDashboard;
```

---

## **🚀 Implementation Timeline**

### **Week 1-2: Database Foundation**
- [ ] Create database migrations
- [ ] Test migration on development data
- [ ] Establish initial pyramid structure
- [ ] Migrate existing relationships

### **Week 3-4: Backend Services**
- [ ] Implement PyramidalMentorshipServices
- [ ] Create identity revelation system
- [ ] Add admin review controllers
- [ ] Build capacity management logic

### **Week 5-6: Frontend Components**
- [ ] Update existing mentorship views
- [ ] Create pyramidal dashboard
- [ ] Implement identity request UI
- [ ] Add family/community management

### **Week 7-8: Testing & Security**
- [ ] Test asymmetric identity protection
- [ ] Verify mentor anonymity is preserved
- [ ] Test capacity limits (12+144 rule)
- [ ] Security audit of revelation system

---

## **📊 Success Metrics**

### **System Health Indicators**
- Pyramid structure integrity (no orphaned mentees)
- Capacity compliance (no mentor exceeds 156 total)
- Identity protection effectiveness (zero mentor revelations to mentees)
- Admin review efficiency (under 48 hours average)

### **User Experience Metrics**
- Mentor satisfaction with family management
- Mentee progress within pyramid structure
- Identity request approval rate and rationale
- System adoption rate vs. legacy mentorship

This implementation plan transforms your existing mentorship system into the pyramidal structure while maintaining all privacy protections and adding the asymmetric identity revelation feature you requested.