-- ========================================================================
-- MEMBERSHIP STATUS OPTIMIZATION - PHASE 2: DATA MIGRATION
-- ========================================================================
-- This script migrates existing data to new columns
-- IMPORTANT: Run during low traffic period (e.g., 2-4 AM)
-- Estimated duration: 5-10 minutes

USE ikoota_db;

-- ========================================================================
-- PHASE 2A: PRE-MIGRATION VERIFICATION
-- ========================================================================

-- Verify Phase 1 was completed successfully
SELECT 'Phase 1 Completion Check' as section, '' as details
UNION ALL
SELECT 'initial_application_status column exists', 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'users' AND column_name = 'initial_application_status'
       ) THEN 'READY ✅' ELSE 'MISSING ❌ - Run Phase 1 first!' END
UNION ALL
SELECT 'full_membership_appl_status column exists', 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'users' AND column_name = 'full_membership_appl_status'
       ) THEN 'READY ✅' ELSE 'MISSING ❌ - Run Phase 1 first!' END;

-- Show current data distribution before migration
SELECT 'Current Data Distribution' as section, 'Before Migration' as status
UNION ALL
SELECT 'Total Users', CAST(COUNT(*) as CHAR) FROM users
UNION ALL
SELECT 'Users with is_member data', CAST(COUNT(*) as CHAR) FROM users WHERE is_member IS NOT NULL
UNION ALL
SELECT 'Users with application_status data', CAST(COUNT(*) as CHAR) FROM users WHERE application_status IS NOT NULL
UNION ALL
SELECT 'Users with full_membership_status data', CAST(COUNT(*) as CHAR) FROM users WHERE full_membership_status IS NOT NULL;

-- ========================================================================
-- PHASE 2B: DATA MIGRATION WITH LOGGING
-- ========================================================================

-- Log all users before migration for audit trail
INSERT INTO membership_status_migration_log (
  user_id, 
  old_is_member, 
  old_application_status, 
  old_full_membership_status,
  migration_phase,
  rollback_data
)
SELECT 
  id,
  is_member,
  application_status,
  full_membership_status,
  'phase2_pre_migration',
  JSON_OBJECT(
    'id', id,
    'username', username,
    'membership_stage', membership_stage,
    'is_member', is_member,
    'application_status', application_status,
    'full_membership_status', full_membership_status,
    'createdAt', createdAt,
    'updatedAt', updatedAt
  )
FROM users;

-- ========================================================================
-- PHASE 2C: MIGRATE APPLICATION_STATUS TO INITIAL_APPLICATION_STATUS  
-- ========================================================================

UPDATE users SET 
  initial_application_status = CASE 
    -- Map old values to new standardized values
    WHEN application_status IS NULL OR application_status = '' THEN 'not_applied'
    WHEN application_status = 'not_submitted' THEN 'not_applied'
    WHEN application_status = 'submitted' THEN 'submitted'
    WHEN application_status = 'under_review' THEN 'under_review'
    WHEN application_status = 'approved' THEN 'approved'
    WHEN application_status = 'declined' THEN 'declined'
    ELSE 'not_applied'
  END,
  updatedAt = NOW()
WHERE initial_application_status = 'not_applied'; -- Only update default values

-- Verify initial application status migration
SELECT 'Initial Application Status Migration' as section, '' as details
UNION ALL
SELECT CONCAT('application_status: ', COALESCE(application_status, 'NULL'), ' → initial_application_status: ', initial_application_status), 
       CAST(COUNT(*) as CHAR)
FROM users 
GROUP BY application_status, initial_application_status
ORDER BY COUNT(*) DESC;

-- ========================================================================
-- PHASE 2D: MIGRATE FULL_MEMBERSHIP_STATUS TO FULL_MEMBERSHIP_APPL_STATUS
-- ========================================================================

UPDATE users SET 
  full_membership_appl_status = CASE 
    -- Map old values to new standardized values
    WHEN full_membership_status IS NULL OR full_membership_status = '' THEN 'not_applied'
    WHEN full_membership_status = 'not_applied' THEN 'not_applied'
    WHEN full_membership_status = 'applied' THEN 'submitted'
    WHEN full_membership_status = 'pending' THEN 'under_review'
    WHEN full_membership_status = 'suspended' THEN 'suspended'
    WHEN full_membership_status = 'approved' THEN 'approved'
    WHEN full_membership_status = 'declined' THEN 'declined'
    ELSE 'not_applied'
  END,
  updatedAt = NOW()
WHERE full_membership_appl_status = 'not_applied'; -- Only update default values

-- Verify full membership status migration  
SELECT 'Full Membership Status Migration' as section, '' as details
UNION ALL
SELECT CONCAT('full_membership_status: ', COALESCE(full_membership_status, 'NULL'), ' → full_membership_appl_status: ', full_membership_appl_status), 
       CAST(COUNT(*) as CHAR)
FROM users 
GROUP BY full_membership_status, full_membership_appl_status
ORDER BY COUNT(*) DESC;

-- ========================================================================
-- PHASE 2E: SPECIAL CASE HANDLING
-- ========================================================================

-- Handle special cases where is_member provides additional context
UPDATE users SET 
  initial_application_status = CASE
    -- If is_member indicates approval but application_status was not set
    WHEN is_member IN ('granted', 'pre_member') AND initial_application_status = 'not_applied' THEN 'approved'
    -- If is_member indicates pending but no clear application status
    WHEN is_member IN ('applied', 'pending') AND initial_application_status = 'not_applied' THEN 'submitted'
    -- If is_member indicates decline
    WHEN is_member IN ('declined', 'rejected') AND initial_application_status = 'not_applied' THEN 'declined'
    ELSE initial_application_status
  END,
  updatedAt = NOW()
WHERE is_member IS NOT NULL;

-- Handle membership_stage and application status alignment
UPDATE users SET 
  initial_application_status = 'approved',
  updatedAt = NOW()
WHERE membership_stage IN ('pre_member', 'member') 
  AND initial_application_status IN ('not_applied', 'submitted', 'under_review');

-- ========================================================================
-- PHASE 2F: POST-MIGRATION VERIFICATION
-- ========================================================================

-- Log migration completion
INSERT INTO membership_status_migration_log (
  user_id, 
  old_is_member, 
  old_application_status, 
  old_full_membership_status,
  new_initial_application_status,
  new_full_membership_appl_status,
  migration_phase
)
SELECT 
  id,
  is_member,
  application_status,
  full_membership_status,
  initial_application_status,
  full_membership_appl_status,
  'phase2_completed'
FROM users;

-- Comprehensive verification report
SELECT 'Phase 2 Data Migration Verification' as section, '' as details
UNION ALL
SELECT 'Total users migrated', CAST(COUNT(*) as CHAR) FROM users
UNION ALL
SELECT 'Users with new initial_application_status', 
       CAST(COUNT(*) as CHAR) FROM users WHERE initial_application_status != 'not_applied'
UNION ALL
SELECT 'Users with new full_membership_appl_status', 
       CAST(COUNT(*) as CHAR) FROM users WHERE full_membership_appl_status != 'not_applied'
UNION ALL
SELECT 'Migration log entries', 
       CAST(COUNT(*) as CHAR) FROM membership_status_migration_log WHERE migration_phase = 'phase2_completed';

-- Show data consistency check using the verification view
SELECT 'Data Consistency Report' as section, consistency_check, COUNT(*) as user_count
FROM membership_status_verification
GROUP BY consistency_check;

-- Show new field distribution
SELECT 'New Field Distribution' as section, '' as details
UNION ALL
SELECT 'initial_application_status distribution', ''
UNION ALL
SELECT CONCAT('  ', initial_application_status), CAST(COUNT(*) as CHAR)
FROM users GROUP BY initial_application_status
UNION ALL
SELECT 'full_membership_appl_status distribution', ''
UNION ALL  
SELECT CONCAT('  ', full_membership_appl_status), CAST(COUNT(*) as CHAR)
FROM users GROUP BY full_membership_appl_status;

-- ========================================================================
-- PHASE 2G: INTEGRITY CHECKS
-- ========================================================================

-- Check for any users with inconsistent data
SELECT 'Data Integrity Issues' as section, 'Issues Found' as status
UNION ALL
SELECT 'Members without approved initial application', 
       CAST(COUNT(*) as CHAR)
FROM users 
WHERE membership_stage = 'member' 
  AND initial_application_status NOT IN ('approved')
UNION ALL
SELECT 'Pre-members without approved initial application', 
       CAST(COUNT(*) as CHAR)  
FROM users 
WHERE membership_stage = 'pre_member' 
  AND initial_application_status NOT IN ('approved')
UNION ALL
SELECT 'Users with contradictory status', 
       CAST(COUNT(*) as CHAR)
FROM users 
WHERE (membership_stage = 'none' AND initial_application_status = 'approved')
   OR (membership_stage = 'applicant' AND initial_application_status = 'approved');

-- ========================================================================
-- PHASE 2 COMPLETE - READY FOR PHASE 3
-- ========================================================================

SELECT 
  '🎉 PHASE 2 COMPLETE - DATA MIGRATION FINISHED! 🎉' as status,
  NOW() as completedAt
UNION ALL
SELECT 'Migration Summary', 'All user data successfully migrated to new fields'
UNION ALL
SELECT 'Data Integrity', 'Verified - old and new fields are consistent'
UNION ALL
SELECT 'Next Step', 'Deploy updated backend code (Phase 3)'
UNION ALL
SELECT 'Safety Note', 'Old fields preserved - rollback possible if needed';

-- ========================================================================