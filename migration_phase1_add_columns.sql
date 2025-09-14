-- ========================================================================
-- SURVEYLOG OPTIMIZATION - PHASE 1: ADD NEW COLUMNS (SAFE - NO BREAKING)
-- ========================================================================
-- This script adds new columns without removing anything
-- Safe to run in production - won't break existing functionality

-- BACKUP FIRST! (Run these before making any changes)
-- ========================================================================
CREATE TABLE surveylog_backup_20250113 AS SELECT * FROM surveylog;
CREATE TABLE initial_membership_applications_backup_20250113 AS SELECT * FROM initial_membership_applications;
CREATE TABLE full_membership_applications_backup_20250113 AS SELECT * FROM full_membership_applications;
CREATE TABLE survey_responses_backup_20250113 AS SELECT * FROM survey_responses;

-- Verify backups
SELECT 'surveylog_backup' as table_name, COUNT(*) as record_count FROM surveylog_backup_20250113
UNION ALL
SELECT 'initial_membership_applications_backup', COUNT(*) FROM initial_membership_applications_backup_20250113
UNION ALL  
SELECT 'full_membership_applications_backup', COUNT(*) FROM full_membership_applications_backup_20250113
UNION ALL
SELECT 'survey_responses_backup', COUNT(*) FROM survey_responses_backup_20250113;

-- ========================================================================
-- PHASE 1A: ADD NEW TRACKING FIELDS TO SURVEYLOG
-- ========================================================================

-- Add new survey_id as primary tracker (keeping old id for compatibility)
ALTER TABLE surveylog 
  ADD COLUMN new_survey_id INT AUTO_INCREMENT UNIQUE FIRST,
  ADD KEY idx_new_survey_id (new_survey_id);

-- Add new status field (will replace approval_status)
ALTER TABLE surveylog 
  ADD COLUMN new_status ENUM('started','draft','submitted','under_review','pending','approved','declined','suspended') DEFAULT 'submitted' AFTER user_id;

-- Add response table reference
ALTER TABLE surveylog 
  ADD COLUMN response_table_id INT AFTER new_status,
  ADD KEY idx_response_table_id (response_table_id);

-- Add started timestamp
ALTER TABLE surveylog 
  ADD COLUMN startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER response_table_id;

-- Add survey type (will replace application_type)
ALTER TABLE surveylog 
  ADD COLUMN new_survey_type ENUM('initial_application','full_membership','general_survey') AFTER startedAt;

-- ========================================================================
-- PHASE 1B: ADD SURVEY_ID LINKS TO RESPONSE TABLES
-- ========================================================================

-- Add survey_id to initial_membership_applications
ALTER TABLE initial_membership_applications 
  ADD COLUMN survey_id INT AFTER id,
  ADD KEY idx_survey_id (survey_id);

-- Add survey_id to full_membership_applications  
ALTER TABLE full_membership_applications 
  ADD COLUMN survey_id INT AFTER id,
  ADD KEY idx_survey_id (survey_id);

-- ========================================================================
-- PHASE 1C: ADD MISSING FIELDS TO RESPONSE TABLES (FROM SURVEYLOG)
-- ========================================================================

-- Add fields to initial_membership_applications (moved from surveylog)
ALTER TABLE initial_membership_applications 
  ADD COLUMN survey_title VARCHAR(255) AFTER answers,
  ADD COLUMN completion_percentage DECIMAL(5,2) DEFAULT 0.00 AFTER survey_title,
  ADD COLUMN time_spent_minutes INT DEFAULT 0 AFTER completion_percentage,
  ADD COLUMN mentor_assigned VARCHAR(12) AFTER admin_notes,
  ADD COLUMN class_assigned VARCHAR(12) AFTER mentor_assigned,
  ADD COLUMN converse_id_generated VARCHAR(12) AFTER class_assigned;

-- Add fields to full_membership_applications (moved from surveylog)
ALTER TABLE full_membership_applications 
  ADD COLUMN survey_title VARCHAR(255) AFTER answers,
  ADD COLUMN completion_percentage DECIMAL(5,2) DEFAULT 0.00 AFTER survey_title,
  ADD COLUMN time_spent_minutes INT DEFAULT 0 AFTER completion_percentage,
  ADD COLUMN mentor_recommendation TEXT AFTER admin_notes;

-- ========================================================================
-- PHASE 1D: CREATE NEW SURVEY_RESPONSES TABLE STRUCTURE
-- ========================================================================

-- Current survey_responses has wrong structure (individual Q&A pairs)
-- Create new structure for complete survey responses
CREATE TABLE survey_responses_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  survey_id INT UNIQUE NOT NULL,
  user_id INT NOT NULL,
  survey_template_id INT,
  questions_answers JSON NOT NULL,
  survey_title VARCHAR(255),
  survey_category VARCHAR(100) DEFAULT 'general',
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  time_spent_minutes INT DEFAULT 0,
  admin_notes TEXT,
  status ENUM('pending','approved','rejected','under_review','granted','declined') DEFAULT 'pending',
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewedAt TIMESTAMP NULL,
  reviewed_by INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_survey_user (survey_id, user_id),
  KEY idx_user_status (user_id, status),
  KEY idx_submitted (submittedAt),
  KEY idx_survey_template (survey_template_id)
);

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Verify new columns were added
DESCRIBE surveylog;
DESCRIBE initial_membership_applications;
DESCRIBE full_membership_applications;
DESCRIBE survey_responses_new;

-- Check current data counts
SELECT 'Current surveylog records' as info, COUNT(*) as count FROM surveylog
UNION ALL
SELECT 'Current initial_membership_applications records', COUNT(*) FROM initial_membership_applications
UNION ALL
SELECT 'Current full_membership_applications records', COUNT(*) FROM full_membership_applications
UNION ALL
SELECT 'Current survey_responses records', COUNT(*) FROM survey_responses;

-- ========================================================================
-- PHASE 1 COMPLETE
-- ========================================================================
-- All new columns added safely
-- No existing functionality broken
-- Ready for Phase 2 (Data Migration)
-- ========================================================================