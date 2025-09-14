-- ========================================================================
-- SURVEYLOG OPTIMIZATION - PHASE 2: DATA MIGRATION
-- ========================================================================
-- This script migrates data to the new structure
-- RUN DURING LOW TRAFFIC PERIOD
-- Ensure Phase 1 completed successfully before running this

-- ========================================================================
-- PHASE 2A: POPULATE NEW TRACKING FIELDS IN SURVEYLOG
-- ========================================================================

-- Map approval_status to new_status
UPDATE surveylog 
SET new_status = CASE 
  WHEN approval_status = 'pending' THEN 'submitted'
  WHEN approval_status = 'under_review' THEN 'under_review'
  WHEN approval_status = 'approved' THEN 'approved'
  WHEN approval_status = 'granted' THEN 'approved'
  WHEN approval_status = 'declined' THEN 'declined'
  WHEN approval_status = 'rejected' THEN 'declined'
  ELSE 'submitted'
END;

-- Map application_type to new_survey_type
UPDATE surveylog 
SET new_survey_type = CASE 
  WHEN application_type = 'initial_application' THEN 'initial_application'
  WHEN application_type = 'full_membership' THEN 'full_membership'
  ELSE 'general_survey'
END;

-- Set startedAt to createdAt for existing records
UPDATE surveylog 
SET startedAt = createdAt 
WHERE startedAt IS NULL OR startedAt = '0000-00-00 00:00:00';

-- ========================================================================
-- PHASE 2B: LINK SURVEYLOG TO RESPONSE TABLES
-- ========================================================================

-- Link initial_membership_applications to surveylog
UPDATE initial_membership_applications ima
INNER JOIN surveylog sl ON ima.user_id = sl.user_id 
  AND sl.application_type = 'initial_application'
  AND sl.id = (
    SELECT MAX(sl2.id) FROM surveylog sl2 
    WHERE sl2.user_id = ima.user_id 
    AND sl2.application_type = 'initial_application'
  )
SET ima.survey_id = sl.new_survey_id;

-- Link full_membership_applications to surveylog
UPDATE full_membership_applications fma
INNER JOIN surveylog sl ON fma.user_id = sl.user_id 
  AND sl.application_type = 'full_membership'
  AND sl.id = (
    SELECT MAX(sl2.id) FROM surveylog sl2 
    WHERE sl2.user_id = fma.user_id 
    AND sl2.application_type = 'full_membership'
  )
SET fma.survey_id = sl.new_survey_id;

-- ========================================================================
-- PHASE 2C: MIGRATE DATA FROM SURVEYLOG TO RESPONSE TABLES
-- ========================================================================

-- Migrate data to initial_membership_applications
UPDATE initial_membership_applications ima
INNER JOIN surveylog sl ON ima.survey_id = sl.new_survey_id
SET 
  ima.survey_title = COALESCE(sl.survey_title, 'Initial Membership Application'),
  ima.completion_percentage = COALESCE(sl.completion_percentage, 100.00),
  ima.time_spent_minutes = COALESCE(sl.time_spent_minutes, 0),
  ima.mentor_assigned = sl.mentor_assigned,
  ima.class_assigned = sl.class_assigned,
  ima.converse_id_generated = sl.converse_id_generated,
  -- Merge admin_notes from surveylog if initial table admin_notes is empty
  ima.admin_notes = CASE 
    WHEN ima.admin_notes IS NULL OR ima.admin_notes = '' 
    THEN COALESCE(sl.admin_notes, sl.rating_remarks, sl.approval_decision_reason)
    ELSE ima.admin_notes
  END;

-- Migrate data to full_membership_applications
UPDATE full_membership_applications fma
INNER JOIN surveylog sl ON fma.survey_id = sl.new_survey_id
SET 
  fma.survey_title = COALESCE(sl.survey_title, 'Full Membership Application'),
  fma.completion_percentage = COALESCE(sl.completion_percentage, 100.00),
  fma.time_spent_minutes = COALESCE(sl.time_spent_minutes, 0),
  -- Merge admin_notes from surveylog if initial table admin_notes is empty
  fma.admin_notes = CASE 
    WHEN fma.admin_notes IS NULL OR fma.admin_notes = '' 
    THEN COALESCE(sl.admin_notes, sl.rating_remarks, sl.approval_decision_reason)
    ELSE fma.admin_notes
  END;

-- ========================================================================
-- PHASE 2D: UPDATE SURVEYLOG WITH RESPONSE TABLE REFERENCES
-- ========================================================================

-- Link surveylog to initial_membership_applications
UPDATE surveylog sl
INNER JOIN initial_membership_applications ima ON sl.new_survey_id = ima.survey_id
SET sl.response_table_id = ima.id
WHERE sl.new_survey_type = 'initial_application';

-- Link surveylog to full_membership_applications
UPDATE surveylog sl
INNER JOIN full_membership_applications fma ON sl.new_survey_id = fma.survey_id
SET sl.response_table_id = fma.id
WHERE sl.new_survey_type = 'full_membership';

-- ========================================================================
-- PHASE 2E: MIGRATE EXISTING SURVEY_RESPONSES (IF ANY)
-- ========================================================================

-- Check if old survey_responses has data that needs migration
SELECT 'Old survey_responses records to migrate' as info, COUNT(*) as count 
FROM survey_responses;

-- If there are existing survey responses, migrate them
-- Group by survey_log_id to create complete survey responses
INSERT INTO survey_responses_new (
  survey_id, 
  user_id, 
  questions_answers,
  survey_title,
  survey_category,
  submittedAt,
  createdAt
)
SELECT 
  sr.survey_log_id as survey_id,
  sl.user_id,
  JSON_OBJECT(
    'questions', JSON_ARRAYAGG(sr.question_text),
    'answers', JSON_ARRAYAGG(sr.answer_text)
  ) as questions_answers,
  COALESCE(sl.survey_title, 'General Survey') as survey_title,
  COALESCE(sl.survey_category, 'general') as survey_category,
  MIN(sr.createdAt) as submittedAt,
  MIN(sr.createdAt) as createdAt
FROM survey_responses sr
INNER JOIN surveylog sl ON sr.survey_log_id = sl.id
GROUP BY sr.survey_log_id, sl.user_id
HAVING COUNT(*) > 0;

-- Update surveylog with new survey_responses references
UPDATE surveylog sl
INNER JOIN survey_responses_new srn ON sl.new_survey_id = srn.survey_id
SET sl.response_table_id = srn.id
WHERE sl.new_survey_type = 'general_survey';

-- ========================================================================
-- PHASE 2F: DATA INTEGRITY CHECKS
-- ========================================================================

-- Verify survey_id linking
SELECT 'Initial applications with survey_id' as info, COUNT(*) as count 
FROM initial_membership_applications 
WHERE survey_id IS NOT NULL
UNION ALL
SELECT 'Full membership applications with survey_id', COUNT(*) 
FROM full_membership_applications 
WHERE survey_id IS NOT NULL
UNION ALL
SELECT 'Survey responses with survey_id', COUNT(*) 
FROM survey_responses_new 
WHERE survey_id IS NOT NULL;

-- Verify response_table_id linking in surveylog
SELECT 'Surveylog with response_table_id' as info, COUNT(*) as count 
FROM surveylog 
WHERE response_table_id IS NOT NULL
UNION ALL
SELECT 'Surveylog initial_application linked', COUNT(*) 
FROM surveylog 
WHERE new_survey_type = 'initial_application' AND response_table_id IS NOT NULL
UNION ALL
SELECT 'Surveylog full_membership linked', COUNT(*) 
FROM surveylog 
WHERE new_survey_type = 'full_membership' AND response_table_id IS NOT NULL;

-- Check for any missing links (these should be investigated)
SELECT 'Initial apps WITHOUT survey_id (needs investigation)' as warning, COUNT(*) as count 
FROM initial_membership_applications 
WHERE survey_id IS NULL
UNION ALL
SELECT 'Full apps WITHOUT survey_id (needs investigation)', COUNT(*) 
FROM full_membership_applications 
WHERE survey_id IS NULL;

-- Verify data migration
SELECT 
  'Data migration verification' as info,
  sl.new_survey_id,
  sl.new_survey_type,
  sl.response_table_id,
  CASE 
    WHEN sl.new_survey_type = 'initial_application' 
    THEN (SELECT COUNT(*) FROM initial_membership_applications WHERE survey_id = sl.new_survey_id)
    WHEN sl.new_survey_type = 'full_membership' 
    THEN (SELECT COUNT(*) FROM full_membership_applications WHERE survey_id = sl.new_survey_id)
    ELSE (SELECT COUNT(*) FROM survey_responses_new WHERE survey_id = sl.new_survey_id)
  END as response_exists
FROM surveylog sl
WHERE sl.new_survey_id IS NOT NULL
LIMIT 10;

-- ========================================================================
-- PHASE 2 COMPLETE
-- ========================================================================
-- All data migrated to new structure
-- surveylog now properly linked to response tables
-- Ready for Phase 3 (Deploy Updated Code)
-- ========================================================================