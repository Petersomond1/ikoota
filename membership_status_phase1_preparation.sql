-- ========================================================================
-- MEMBERSHIP STATUS OPTIMIZATION - PHASE 1: SAFE PREPARATION
-- ========================================================================
-- This script adds new columns alongside existing ones - COMPLETELY SAFE
-- No existing functionality is broken - only adding new fields
-- Run this anytime - no downtime required

USE ikoota_db;

-- ========================================================================
-- PHASE 1A: CREATE BACKUP BEFORE ANY CHANGES
-- ========================================================================

-- Create backup of users table before migration
DROP TABLE IF EXISTS users_backup_membership_migration;
CREATE TABLE users_backup_membership_migration AS SELECT * FROM users;

-- Verify backup
SELECT 'Backup Verification' as section, 
       CONCAT('Backed up ', COUNT(*), ' user records') as details
FROM users_backup_membership_migration;

-- ========================================================================  
-- PHASE 1B: ADD NEW COLUMNS (SAFE - NO DATA LOSS)
-- ========================================================================

-- Add new standardized membership status columns
ALTER TABLE users 
  ADD COLUMN initial_application_status ENUM(
    'not_applied',
    'submitted', 
    'under_review',
    'pending',
    'suspended',
    'approved',
    'declined'
  ) DEFAULT 'not_applied' COMMENT 'Replaces application_status with standardized values',
  
  ADD COLUMN full_membership_appl_status ENUM(
    'not_applied',
    'submitted',
    'under_review', 
    'pending',
    'suspended',
    'approved',
    'declined'
  ) DEFAULT 'not_applied' COMMENT 'Replaces full_membership_status with standardized values';

-- Add indexes for performance
CREATE INDEX idx_users_initial_app_status ON users (initial_application_status);
CREATE INDEX idx_users_full_membership_status ON users (full_membership_appl_status);
CREATE INDEX idx_users_membership_stage_combo ON users (membership_stage, initial_application_status, full_membership_appl_status);

-- ========================================================================
-- PHASE 1C: CREATE MIGRATION TRACKING TABLE
-- ========================================================================

-- Create table to track migration progress and enable rollback
DROP TABLE IF EXISTS membership_status_migration_log;
CREATE TABLE membership_status_migration_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  old_is_member VARCHAR(50),
  old_application_status VARCHAR(50),
  old_full_membership_status VARCHAR(50),
  new_initial_application_status VARCHAR(50),
  new_full_membership_appl_status VARCHAR(50),
  migration_phase VARCHAR(20) DEFAULT 'phase1',
  migratedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rollback_data JSON COMMENT 'Complete old record for emergency rollback',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_migration_user (user_id),
  INDEX idx_migration_phase (migration_phase)
) ENGINE=InnoDB COMMENT 'Tracks membership status migration for audit and rollback';

-- ========================================================================
-- PHASE 1D: CREATE COMPATIBILITY FUNCTIONS  
-- ========================================================================

-- Create function to derive is_member value from new fields (for compatibility)
DELIMITER //

CREATE FUNCTION DeriveIsMemberStatus(
  p_membership_stage VARCHAR(50),
  p_initial_app_status VARCHAR(50),
  p_full_membership_status VARCHAR(50)
) RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
  -- Return derived is_member value based on new field logic
  
  IF p_membership_stage = 'member' THEN
    RETURN 'member';
  END IF;
  
  IF p_membership_stage = 'pre_member' THEN
    RETURN 'pre_member';
  END IF;
  
  IF p_initial_app_status = 'approved' THEN
    RETURN 'granted';
  END IF;
  
  IF p_initial_app_status IN ('submitted', 'under_review') THEN
    RETURN 'applied';
  END IF;
  
  IF p_initial_app_status = 'pending' THEN
    RETURN 'pending';
  END IF;
  
  IF p_initial_app_status = 'declined' THEN
    RETURN 'declined';
  END IF;
  
  RETURN 'none';
END //

DELIMITER ;

-- Test the compatibility function
SELECT 
  'Compatibility Function Test' as test_section,
  DeriveIsMemberStatus('pre_member', 'approved', 'not_applied') as test_result_should_be_granted,
  DeriveIsMemberStatus('member', 'approved', 'approved') as test_result_should_be_member;

-- ========================================================================
-- PHASE 1E: CREATE VERIFICATION VIEWS
-- ========================================================================

-- Create view to verify data consistency during migration
CREATE OR REPLACE VIEW membership_status_verification AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.membership_stage,
  u.is_member as old_is_member,
  u.application_status as old_application_status,
  u.full_membership_status as old_full_membership_status,
  u.initial_application_status as new_initial_status,
  u.full_membership_appl_status as new_full_status,
  DeriveIsMemberStatus(u.membership_stage, u.initial_application_status, u.full_membership_appl_status) as derived_is_member,
  CASE 
    WHEN u.is_member = DeriveIsMemberStatus(u.membership_stage, u.initial_application_status, u.full_membership_appl_status) 
    THEN 'CONSISTENT' 
    ELSE 'INCONSISTENT' 
  END as consistency_check
FROM users u
ORDER BY u.id;

-- ========================================================================
-- PHASE 1F: VERIFICATION AND SAFETY CHECKS
-- ========================================================================

-- Verify new columns were added successfully
SELECT 'Phase 1 Verification' as section, '' as details
UNION ALL
SELECT 'users table columns', 
       CONCAT('Found ', COUNT(*), ' columns') as details
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = DATABASE()
UNION ALL
SELECT 'initial_application_status column', 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'users' AND column_name = 'initial_application_status'
       ) THEN 'ADDED ✅' ELSE 'MISSING ❌' END
UNION ALL
SELECT 'full_membership_appl_status column', 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'users' AND column_name = 'full_membership_appl_status'
       ) THEN 'ADDED ✅' ELSE 'MISSING ❌' END
UNION ALL
SELECT 'backup table created', 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'users_backup_membership_migration'
       ) THEN 'CREATED ✅' ELSE 'MISSING ❌' END
UNION ALL
SELECT 'migration log table created', 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'membership_status_migration_log'
       ) THEN 'CREATED ✅' ELSE 'MISSING ❌' END;

-- Show current structure
DESCRIBE users;

-- ========================================================================
-- PHASE 1 COMPLETE - SYSTEM READY FOR PHASE 2
-- ========================================================================

SELECT 
  '🎉 PHASE 1 COMPLETE - SAFE PREPARATION FINISHED! 🎉' as status,
  NOW() as completedAt
UNION ALL
SELECT 'Next Step', 'Run membership_status_phase2_data_migration.sql'
UNION ALL
SELECT 'Safety Note', 'All existing functionality preserved - no breaking changes'
UNION ALL
SELECT 'Rollback Ready', 'Backup table and migration log created for safety';

-- ========================================================================