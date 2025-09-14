-- ========================================================================
-- SURVEYLOG OPTIMIZATION - PHASE 3: DEPLOYMENT PREPARATION
-- ========================================================================
-- This script prepares for deployment of updated code
-- Run AFTER Phase 2 data migration is complete and verified

-- ========================================================================
-- PHASE 3A: VERIFY PHASE 2 COMPLETION
-- ========================================================================

-- Check that Phase 2 data migration completed successfully
SELECT 
  'Phase 2 Verification Report' as report_section,
  '' as details
UNION ALL
SELECT 'surveylog records with new_survey_id', CAST(COUNT(*) as CHAR) 
FROM surveylog WHERE new_survey_id IS NOT NULL
UNION ALL
SELECT 'initial apps with survey_id', CAST(COUNT(*) as CHAR) 
FROM initial_membership_applications WHERE survey_id IS NOT NULL
UNION ALL
SELECT 'full membership apps with survey_id', CAST(COUNT(*) as CHAR) 
FROM full_membership_applications WHERE survey_id IS NOT NULL
UNION ALL
SELECT 'surveylog with response_table_id', CAST(COUNT(*) as CHAR) 
FROM surveylog WHERE response_table_id IS NOT NULL;

-- Check for any data integrity issues
SELECT 
  'Data Integrity Check' as report_section,
  '' as details
UNION ALL
SELECT 'Initial apps WITHOUT survey_id (ERROR)', CAST(COUNT(*) as CHAR) 
FROM initial_membership_applications WHERE survey_id IS NULL
UNION ALL
SELECT 'Full apps WITHOUT survey_id (ERROR)', CAST(COUNT(*) as CHAR) 
FROM full_membership_applications WHERE survey_id IS NULL
UNION ALL
SELECT 'Orphaned surveylog records (WARNING)', CAST(COUNT(*) as CHAR) 
FROM surveylog WHERE new_survey_id IS NOT NULL AND response_table_id IS NULL;

-- ========================================================================
-- PHASE 3B: CREATE FOREIGN KEY CONSTRAINTS (SAFE)
-- ========================================================================

-- Add foreign key constraints to ensure data integrity
-- These are safe to add during deployment

-- Add foreign key from initial_membership_applications to surveylog
ALTER TABLE initial_membership_applications 
  ADD CONSTRAINT fk_ima_survey_id 
  FOREIGN KEY (survey_id) REFERENCES surveylog (new_survey_id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key from full_membership_applications to surveylog
ALTER TABLE full_membership_applications 
  ADD CONSTRAINT fk_fma_survey_id 
  FOREIGN KEY (survey_id) REFERENCES surveylog (new_survey_id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key from survey_responses_new to surveylog (if created in Phase 1)
ALTER TABLE survey_responses_new 
  ADD CONSTRAINT fk_sr_survey_id 
  FOREIGN KEY (survey_id) REFERENCES surveylog (new_survey_id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ========================================================================
-- PHASE 3C: CREATE OPTIMIZED INDEXES FOR PERFORMANCE
-- ========================================================================

-- Add indexes for the new structure to ensure optimal query performance

-- Composite indexes for common query patterns
CREATE INDEX idx_surveylog_user_type_status ON surveylog (user_id, new_survey_type, new_status);
CREATE INDEX idx_surveylog_type_status_date ON surveylog (new_survey_type, new_status, createdAt);
CREATE INDEX idx_surveylog_response_ref ON surveylog (response_table_id, new_survey_type);

-- Response table indexes
CREATE INDEX idx_ima_survey_user ON initial_membership_applications (survey_id, user_id);
CREATE INDEX idx_ima_status_date ON initial_membership_applications (status, submittedAt);

CREATE INDEX idx_fma_survey_user ON full_membership_applications (survey_id, user_id);
CREATE INDEX idx_fma_status_date ON full_membership_applications (status, submittedAt);

-- ========================================================================
-- PHASE 3D: CREATE VIEWS FOR BACKWARD COMPATIBILITY
-- ========================================================================

-- Create views that maintain backward compatibility during transition
-- These allow old queries to work while new code is being deployed

-- Compatibility view for old surveylog queries
CREATE OR REPLACE VIEW surveylog_legacy_view AS
SELECT 
  sl.id as old_id,
  sl.new_survey_id as id,
  sl.user_id,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.questions_answers
    WHEN sl.new_survey_type = 'full_membership' THEN fma.questions_answers
    ELSE NULL
  END as answers,
  sl.verified_by,
  sl.rating_remarks,
  CASE 
    WHEN sl.new_status IN ('approved', 'declined') THEN sl.new_status
    WHEN sl.new_status = 'submitted' THEN 'pending'
    ELSE sl.new_status
  END as approval_status,
  sl.priority,
  sl.createdAt,
  sl.updatedAt,
  sl.processedAt,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
    WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
    ELSE NULL
  END as admin_notes,
  sl.new_survey_type as application_type,
  sl.survey_type as old_survey_type,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.survey_title
    WHEN sl.new_survey_type = 'full_membership' THEN fma.survey_title
    ELSE NULL
  END as survey_title,
  sl.survey_category,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.completion_percentage
    WHEN sl.new_survey_type = 'full_membership' THEN fma.completion_percentage
    ELSE 0.00
  END as completion_percentage,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.time_spent_minutes
    WHEN sl.new_survey_type = 'full_membership' THEN fma.time_spent_minutes
    ELSE 0
  END as time_spent_minutes,
  sl.ip_address,
  sl.user_agent,
  sl.browser_info,
  sl.submission_source,
  sl.reviewedAt,
  sl.reviewed_by,
  sl.assigned_to,
  sl.application_ticket,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.mentor_assigned
    ELSE NULL
  END as mentor_assigned,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.class_assigned
    ELSE NULL
  END as class_assigned,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' THEN ima.converse_id_generated
    ELSE NULL
  END as converse_id_generated,
  sl.approval_decision_reason,
  sl.notification_sent
FROM surveylog sl
LEFT JOIN initial_membership_applications ima ON sl.new_survey_id = ima.survey_id
LEFT JOIN full_membership_applications fma ON sl.new_survey_id = fma.survey_id
WHERE sl.new_survey_id IS NOT NULL;

-- ========================================================================
-- PHASE 3E: CREATE DEPLOYMENT VERIFICATION SCRIPT
-- ========================================================================

-- Script to verify deployment is working correctly
DELIMITER //

CREATE PROCEDURE VerifyOptimizedStructure()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE test_result VARCHAR(500);
  
  -- Test 1: Check new structure is working
  SELECT 'Testing new structure availability...' as test_status;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'surveylog' AND column_name = 'new_survey_id') THEN
    SELECT 'PASS: New structure columns exist' as test_result;
  ELSE
    SELECT 'FAIL: New structure columns missing' as test_result;
  END IF;
  
  -- Test 2: Check data linking
  SELECT 'Testing data linking...' as test_status;
  
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN CONCAT('PASS: ', COUNT(*), ' records properly linked')
      ELSE 'FAIL: No linked records found'
    END as test_result
  FROM surveylog sl
  INNER JOIN initial_membership_applications ima ON sl.new_survey_id = ima.survey_id
  WHERE sl.new_survey_type = 'initial_application';
  
  -- Test 3: Check foreign key constraints
  SELECT 'Testing foreign key constraints...' as test_status;
  
  SELECT 
    CASE 
      WHEN COUNT(*) >= 2 THEN 'PASS: Foreign key constraints created'
      ELSE 'FAIL: Foreign key constraints missing'
    END as test_result
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' 
  AND table_name IN ('initial_membership_applications', 'full_membership_applications')
  AND constraint_name LIKE '%survey_id%';
  
  SELECT 'Deployment verification complete!' as final_status;
  
END //

DELIMITER ;

-- ========================================================================
-- PHASE 3F: PERFORMANCE BASELINE MEASUREMENT
-- ========================================================================

-- Measure query performance before and after optimization
-- Run these queries to establish baseline metrics

SELECT 'Performance Test: Survey Data Retrieval' as test_name;

-- Old structure query (for comparison)
SET @start_time = NOW(6);
SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application';
SET @old_query_time = TIMESTAMPDIFF(MICROSECOND, @start_time, NOW(6));

-- New structure query
SET @start_time = NOW(6);
SELECT COUNT(*) 
FROM surveylog sl 
INNER JOIN initial_membership_applications ima ON sl.new_survey_id = ima.survey_id
WHERE sl.new_survey_type = 'initial_application';
SET @new_query_time = TIMESTAMPDIFF(MICROSECOND, @start_time, NOW(6));

-- Performance comparison
SELECT 
  'Performance Comparison' as metric,
  CONCAT(@old_query_time, ' microseconds') as old_structure_time,
  CONCAT(@new_query_time, ' microseconds') as new_structure_time,
  CONCAT(ROUND(((@old_query_time - @new_query_time) / @old_query_time) * 100, 2), '%') as improvement_percentage;

-- ========================================================================
-- PHASE 3 COMPLETE
-- ========================================================================
-- Database is ready for optimized code deployment
-- Foreign keys and indexes created
-- Compatibility views in place
-- Performance baseline established
-- Ready to deploy updated services and controllers
-- ========================================================================