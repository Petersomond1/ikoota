
MySQL [ikoota_db]> show tables;
+-----------------------------------+
| Tables_in_ikoota_db               |
+-----------------------------------+
| admin_dashboard_cache             |
| admin_full_membership_overview    |
| admin_initial_membership_overview |
| admin_pending_summary             |
| announcements                     |
| audit_logs                        |
| bookmarks                         |
| bulk_operation_jobs               |
| chats                             |
| class_content_access              |
| class_content_access_backup       |
| class_feedback                    |
| class_member_counts               |
| class_sessions                    |
| classes                           |
| classes_backup                    |
| comments                          |
| content_audit_logs                |
| content_likes                     |
| content_moderation_queue          |
| content_reports                   |
| content_tags                      |
| content_views                     |
| current_membership_status         |
| daily_reports                     |
| email_activity_logs               |
| email_templates                   |
| full_membership_applications      |
| id_generation_log                 |
| identity_masking_audit            |
| identity_masks                    |
| initial_membership_applications   |
| membership_access_log             |
| membership_review_history         |
| membership_stats                  |
| mentors                           |
| notifications                     |
| pending_surveys_view              |
| question_labels                   |
| reports                           |
| sms_activity_logs                 |
| sms_templates                     |
| survey_analytics                  |
| survey_categories                 |
| survey_configurations             |
| survey_drafts                     |
| survey_questions                  |
| survey_responses                  |
| survey_stats_view                 |
| survey_templates                  |
| surveylog                         |
| system_configuration              |
| tags                              |
| teachings                         |
| user_chats                        |
| user_class_memberships            |
| user_class_memberships_backup     |
| user_communication_preferences    |
| user_deletion_log                 |
| user_management_overview          |
| user_profiles                     |
| user_survey_history_view          |
| users                             |
| verification_codes                |
+-----------------------------------+
64 rows in set (0.024 sec)

MySQL [ikoota_db]> describe admin_dashboard_cache ;
+-----------+--------------+------+-----+-------------------+-------------------+
| Field     | Type         | Null | Key | Default           | Extra             |
+-----------+--------------+------+-----+-------------------+-------------------+
| id        | int          | NO   | PRI | NULL              | auto_increment    |
| cacheKey  | varchar(100) | NO   | UNI | NULL              |                   |
| cacheData | json         | NO   |     | NULL              |                   |
| expiresAt | timestamp    | NO   |     | NULL              |                   |
| createdAt | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-----------+--------------+------+-----+-------------------+-------------------+
5 rows in set (0.024 sec)

MySQL [ikoota_db]> describe admin_full_membership_overview  ;
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                                              | Null | Key | Default           | Extra             |
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                               | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                               | NO   | UNI | NULL              |                   |
| username          | varchar(255)                                      | NO   | MUL | NULL              |                   |
| email             | varchar(255)                                      | NO   | MUL | NULL              |                   |
| ticket            | varchar(25)                                       | NO   | MUL | NULL              |                   |
| status            | enum('pending','suspended','approved','declined') | YES  | MUL | pending           |                   |
| submittedAt       | timestamp                                         | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reviewedAt        | timestamp                                         | YES  |     | NULL              |                   |
| reviewed_by       | int                                               | YES  | MUL | NULL              |                   |
| admin_notes       | text                                              | YES  |     | NULL              |                   |
| reviewer_name     | varchar(255)                                      | YES  |     | NULL              |                   |
| membership_ticket | varchar(25)                                       | YES  |     | NULL              |                   |
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
12 rows in set (0.021 sec)

MySQL [ikoota_db]> describe admin_initial_membership_overview ;
+-----------------------+---------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field                 | Type                                                                      | Null | Key | Default           | Extra             |
+-----------------------+---------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                    | int                                                                       | NO   | PRI | NULL              | auto_increment    |
| user_id               | int                                                                       | NO   | UNI | NULL              |                   |
| username              | varchar(255)                                                              | NO   | MUL | NULL              |                   |
| email                 | varchar(255)                                                              | NO   | MUL | NULL              |                   |
| ticket                | varchar(20)                                                               | YES  | MUL | NULL              |                   |
| status                | enum('pending','approved','rejected','under_review','granted','declined') | YES  | MUL | pending           |                   |
| createdAt             | timestamp                                                                 | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reviewedAt            | timestamp                                                                 | YES  |     | NULL              |                   |
| reviewed_by           | int                                                                       | YES  | MUL | NULL              |                   |
| admin_notes           | text                                                                      | YES  |     | NULL              |                   |
| reviewer_name         | varchar(255)                                                              | YES  |     | NULL              |                   |
| survey_id             | int                                                                       | YES  |     | 0                 |                   |
| completion_percentage | decimal(5,2)                                                              | YES  |     | 0.00              |                   |
+-----------------------+---------------------------------------------------------------------------+------+-----+-------------------+-------------------+
13 rows in set (0.022 sec)

MySQL [ikoota_db]> describe admin_pending_summary  ;
+----------------------+--------+------+-----+---------+-------+
| Field                | Type   | Null | Key | Default | Extra |
+----------------------+--------+------+-----+---------+-------+
| pending_applications | bigint | YES  |     | NULL    |       |
| pending_full_apps    | bigint | YES  |     | NULL    |       |
| pending_reports      | bigint | YES  |     | NULL    |       |
| queued_notifications | bigint | YES  |     | NULL    |       |
| unverified_users     | bigint | YES  |     | NULL    |       |
+----------------------+--------+------+-----+---------+-------+
5 rows in set (0.062 sec)

MySQL [ikoota_db]> describe announcements ;
+-------------------+-------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field             | Type                                | Null | Key | Default           | Extra                                         |
+-------------------+-------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                | int                                 | NO   | PRI | NULL              | auto_increment                                |
| class_id          | varchar(12)                         | NO   | MUL | NULL              |                                               |
| title             | varchar(255)                        | NO   |     | NULL              |                                               |
| content           | text                                | YES  |     | NULL              |                                               |
| announcement_type | enum('general','urgent','reminder') | YES  | MUL | general           |                                               |
| created_by        | int                                 | NO   | MUL | NULL              |                                               |
| is_active         | tinyint(1)                          | YES  | MUL | 1                 |                                               |
| scheduled_for     | timestamp                           | YES  |     | NULL              |                                               |
| createdAt         | timestamp                           | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt         | timestamp                           | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-------------------+-------------------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.022 sec)

MySQL [ikoota_db]> describe audit_logs ;
+------------+--------------+------+-----+-------------------+-------------------+
| Field      | Type         | Null | Key | Default           | Extra             |
+------------+--------------+------+-----+-------------------+-------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment    |
| user_id    | int          | NO   | MUL | NULL              |                   |
| action     | varchar(255) | NO   | MUL | NULL              |                   |
| resource   | varchar(255) | YES  |     | NULL              |                   |
| details    | json         | YES  |     | NULL              |                   |
| ip_address | varchar(45)  | YES  |     | NULL              |                   |
| user_agent | text         | YES  |     | NULL              |                   |
| createdAt  | timestamp    | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------+--------------+------+-----+-------------------+-------------------+
8 rows in set (0.022 sec)

-- Create admin_action_logs table for enhanced admin auditing
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adminId INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    targetType VARCHAR(100),
    targetId INT,
    actionData JSON,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (adminId),
    INDEX idx_action (action),
    INDEX idx_created_at (createdAt),
    INDEX idx_target (targetType, targetId)
);

MySQL [ikoota_db]> describe bookmarks ;
+--------------+-------------------------+------+-----+-------------------+-------------------+
| Field        | Type                    | Null | Key | Default           | Extra             |
+--------------+-------------------------+------+-----+-------------------+-------------------+
| id           | int                     | NO   | PRI | NULL              | auto_increment    |
| user_id      | char(10)                | NO   | MUL | NULL              |                   |
| content_type | enum('chat','teaching') | NO   | MUL | NULL              |                   |
| content_id   | int                     | NO   |     | NULL              |                   |
| folder       | varchar(100)            | YES  | MUL | default           |                   |
| notes        | text                    | YES  |     | NULL              |                   |
| createdAt    | datetime                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+-------------------------+------+-----+-------------------+-------------------+
7 rows in set (0.021 sec)

MySQL [ikoota_db]> describe bulk_operation_jobs;
+----------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| Field          | Type                                             | Null | Key | Default           | Extra             |
+----------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| id             | int                                              | NO   | PRI | NULL              | auto_increment    |
| jobType        | varchar(50)                                      | NO   |     | NULL              |                   |
| initiatedBy    | int                                              | NO   |     | NULL              |                   |
| totalItems     | int                                              | NO   |     | NULL              |                   |
| processedItems | int                                              | YES  |     | 0                 |                   |
| failedItems    | int                                              | YES  |     | 0                 |                   |
| status         | enum('queued','processing','completed','failed') | YES  |     | queued            |                   |
| resultData     | json                                             | YES  |     | NULL              |                   |
| createdAt      | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| completedAt    | timestamp                                        | YES  |     | NULL              |                   |
+----------------+--------------------------------------------------+------+-----+-------------------+-------------------+
10 rows in set (0.021 sec)

MySQL [ikoota_db]> describe chats    ;
+------------------+----------------------------------------------------------+------+-----+-------------------+-------------------+
| Field            | Type                                                     | Null | Key | Default           | Extra             |
+------------------+----------------------------------------------------------+------+-----+-------------------+-------------------+
| id               | int                                                      | NO   | PRI | NULL              | auto_increment    |
| title            | varchar(255)                                             | NO   |     | NULL              |                   |
| user_id          | char(10)                                                 | YES  | MUL | NULL              |                   |
| audience         | varchar(255)                                             | YES  |     | NULL              |                   |
| summary          | text                                                     | YES  |     | NULL              |                   |
| text             | text                                                     | YES  |     | NULL              |                   |
| content          | text                                                     | YES  |     | NULL              |                   |
| approval_status  | enum('pending','approved','rejected')                    | YES  | MUL | pending           |                   |
| status           | enum('draft','pending','approved','rejected','archived') | YES  | MUL | pending           |                   |
| approval_date    | datetime                                                 | YES  |     | NULL              |                   |
| approved_by      | int                                                      | YES  |     | NULL              |                   |
| rejection_reason | text                                                     | YES  |     | NULL              |                   |
| step_data        | json                                                     | YES  |     | NULL              |                   |
| metadata         | json                                                     | YES  |     | NULL              |                   |
| view_count       | int                                                      | YES  |     | 0                 |                   |
| like_count       | int                                                      | YES  |     | 0                 |                   |
| comment_count    | int                                                      | YES  |     | 0                 |                   |
| is_featured      | tinyint(1)                                               | YES  | MUL | 0                 |                   |
| is_public        | tinyint(1)                                               | YES  | MUL | 1                 |                   |
| tags             | varchar(500)                                             | YES  |     | NULL              |                   |
| media_urls       | json                                                     | YES  |     | NULL              |                   |
| media_url1       | varchar(255)                                             | YES  |     | NULL              |                   |
| media_type1      | enum('image','video','audio','file')                     | YES  |     | NULL              |                   |
| media_url2       | varchar(255)                                             | YES  |     | NULL              |                   |
| media_type2      | enum('image','video','audio','file')                     | YES  |     | NULL              |                   |
| media_url3       | varchar(255)                                             | YES  |     | NULL              |                   |
| is_flagged       | tinyint(1)                                               | YES  |     | 0                 |                   |
| media_type3      | enum('image','video','audio','file')                     | YES  |     | NULL              |                   |
| createdAt        | timestamp                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt        | timestamp                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| prefixed_id      | varchar(20)                                              | YES  | UNI | NULL              |                   |
| reviewed_by      | int                                                      | YES  |     | NULL              |                   |
| reviewedAt       | timestamp                                                | YES  |     | NULL              |                   |
| admin_notes      | text                                                     | YES  |     | NULL              |                   |
+------------------+----------------------------------------------------------+------+-----+-------------------+-------------------+
34 rows in set (0.022 sec)

MySQL [ikoota_db]> describe class_content_access ;
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
| Field        | Type                                   | Null | Key | Default           | Extra             |
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
| id           | int                                    | NO   | PRI | NULL              | auto_increment    |
| content_id   | int                                    | NO   | MUL | NULL              |                   |
| content_type | enum('chat','teaching','announcement') | NO   |     | NULL              |                   |
| class_id     | varchar(12)                            | NO   | MUL | NULL              |                   |
| access_level | enum('read','comment','contribute')    | YES  |     | read              |                   |
| createdAt    | timestamp                              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
6 rows in set (0.021 sec)

MySQL [ikoota_db]> describe class_feedback     ;
+---------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                                             | Null | Key | Default           | Extra                                         |
+---------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id            | int                                              | NO   | PRI | NULL              | auto_increment                                |
| class_id      | varchar(12)                                      | NO   | MUL | NULL              |                                               |
| user_id       | int                                              | NO   | MUL | NULL              |                                               |
| session_id    | int                                              | YES  | MUL | NULL              |                                               |
| rating        | int                                              | YES  | MUL | NULL              |                                               |
| feedback_text | text                                             | YES  |     | NULL              |                                               |
| feedback_type | enum('general','session','instructor','content') | YES  | MUL | general           |                                               |
| is_anonymous  | tinyint(1)                                       | YES  |     | 0                 |                                               |
| created_by    | int                                              | NO   |     | NULL              |                                               |
| createdAt     | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt     | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+---------------+--------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.022 sec)

MySQL [ikoota_db]> describe class_member_counts ;
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
| Field           | Type                                             | Null | Key | Default     | Extra |
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
| class_id        | varchar(12)                                      | NO   |     | NULL        |       |
| class_name      | varchar(255)                                     | NO   |     | NULL        |       |
| class_type      | enum('demographic','subject','public','special') | YES  |     | demographic |       |
| is_public       | tinyint(1)                                       | YES  |     | 0           |       |
| total_members   | bigint                                           | NO   |     | 0           |       |
| moderators      | bigint                                           | NO   |     | 0           |       |
| pending_members | bigint                                           | NO   |     | 0           |       |
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
7 rows in set (0.021 sec)

MySQL [ikoota_db]> describe class_sessions   ;
+------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                                           | Null | Key | Default           | Extra                                         |
+------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id               | int                                            | NO   | PRI | NULL              | auto_increment                                |
| class_id         | varchar(12)                                    | NO   | MUL | NULL              |                                               |
| session_title    | varchar(255)                                   | NO   |     | NULL              |                                               |
| session_date     | datetime                                       | NO   | MUL | NULL              |                                               |
| duration_minutes | int                                            | YES  |     | 60                |                                               |
| session_type     | enum('lecture','workshop','discussion','exam') | YES  | MUL | lecture           |                                               |
| is_mandatory     | tinyint(1)                                     | YES  |     | 1                 |                                               |
| max_participants | int                                            | YES  |     | NULL              |                                               |
| location         | varchar(255)                                   | YES  |     | NULL              |                                               |
| online_link      | varchar(500)                                   | YES  |     | NULL              |                                               |
| created_by       | int                                            | NO   | MUL | NULL              |                                               |
| is_active        | tinyint(1)                                     | YES  |     | 1                 |                                               |
| createdAt        | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.022 sec)

MySQL [ikoota_db]> describe classes ;
+-------------------------+-----------------------------------------------------+------+-----+-------------------+-------------------+
| Field                   | Type                                                | Null | Key | Default           | Extra             |
+-------------------------+-----------------------------------------------------+------+-----+-------------------+-------------------+
| id                      | int                                                 | NO   | PRI | NULL              | auto_increment    |
| class_id                | varchar(12)                                         | NO   | UNI | NULL              |                   |
| class_name              | varchar(255)                                        | NO   |     | NULL              |                   |
| public_name             | varchar(255)                                        | YES  |     | NULL              |                   |
| description             | text                                                | YES  |     | NULL              |                   |
| class_type              | enum('demographic','subject','public','special')    | YES  | MUL | demographic       |                   |
| category                | varchar(100)                                        | YES  | MUL | NULL              |                   |
| difficulty_level        | enum('beginner','intermediate','advanced','expert') | YES  | MUL | beginner          |                   |
| is_public               | tinyint(1)                                          | YES  | MUL | 0                 |                   |
| max_members             | int                                                 | YES  |     | 50                |                   |
| estimated_duration      | int                                                 | YES  | MUL | NULL              |                   |
| prerequisites           | text                                                | YES  |     | NULL              |                   |
| learning_objectives     | text                                                | YES  |     | NULL              |                   |
| tags                    | varchar(500)                                        | YES  |     | NULL              |                   |
| privacy_level           | enum('public','members_only','admin_only')          | YES  |     | members_only      |                   |
| created_by              | int                                                 | YES  | MUL | NULL              |                   |
| is_active               | tinyint(1)                                          | YES  | MUL | 1                 |                   |
| createdAt               | timestamp                                           | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt               | timestamp                                           | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| allow_self_join         | tinyint(1)                                          | YES  |     | 1                 |                   |
| require_full_membership | tinyint(1)                                          | YES  |     | 0                 |                   |
| auto_approve_members    | tinyint(1)                                          | YES  |     | 1                 |                   |
| require_approval        | tinyint(1)                                          | YES  |     | 0                 |                   |
| allow_preview           | tinyint(1)                                          | YES  |     | 1                 |                   |
+-------------------------+-----------------------------------------------------+------+-----+-------------------+-------------------+
24 rows in set (0.022 sec)

MySQL [ikoota_db]> describe comments  ;
+------------------+----------------------------------------------------------+------+-----+-------------------+-------------------+
| Field            | Type                                                     | Null | Key | Default           | Extra             |
+------------------+----------------------------------------------------------+------+-----+-------------------+-------------------+
| id               | int                                                      | NO   | PRI | NULL              | auto_increment    |
| user_id          | char(10)                                                 | YES  | MUL | NULL              |                   |
| chat_id          | int                                                      | YES  | MUL | NULL              |                   |
| teaching_id      | int                                                      | YES  | MUL | NULL              |                   |
| comment          | text                                                     | NO   |     | NULL              |                   |
| content          | text                                                     | YES  |     | NULL              |                   |
| status           | enum('draft','pending','approved','rejected','archived') | YES  | MUL | approved          |                   |
| approval_date    | datetime                                                 | YES  |     | NULL              |                   |
| approved_by      | int                                                      | YES  |     | NULL              |                   |
| rejection_reason | text                                                     | YES  |     | NULL              |                   |
| parentcomment_id | int                                                      | YES  | MUL | NULL              |                   |
| thread_level     | int                                                      | YES  |     | 0                 |                   |
| like_count       | int                                                      | YES  |     | 0                 |                   |
| reply_count      | int                                                      | YES  |     | 0                 |                   |
| is_pinned        | tinyint(1)                                               | YES  |     | 0                 |                   |
| media_urls       | json                                                     | YES  |     | NULL              |                   |
| metadata         | json                                                     | YES  |     | NULL              |                   |
| media_url1       | varchar(255)                                             | YES  |     | NULL              |                   |
| media_type1      | enum('image','video','audio','file')                     | YES  |     | NULL              |                   |
| media_url2       | varchar(255)                                             | YES  |     | NULL              |                   |
| media_type2      | enum('image','video','audio','file')                     | YES  |     | NULL              |                   |
| media_url3       | varchar(255)                                             | YES  |     | NULL              |                   |
| media_type3      | enum('image','video','audio','file')                     | YES  |     | NULL              |                   |
| createdAt        | timestamp                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt        | timestamp                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------------+----------------------------------------------------------+------+-----+-------------------+-------------------+
25 rows in set (0.021 sec)

MySQL [ikoota_db]> describe content_audit_logs   ;
+-------------+------------------------------------------------+------+-----+-------------------+-------------------+
| Field       | Type                                           | Null | Key | Default           | Extra             |
+-------------+------------------------------------------------+------+-----+-------------------+-------------------+
| id          | int                                            | NO   | PRI | NULL              | auto_increment    |
| admin_id    | int                                            | NO   | MUL | NULL              |                   |
| action      | varchar(50)                                    | NO   | MUL | NULL              |                   |
| target_type | enum('chat','teaching','comment','user','tag') | NO   | MUL | NULL              |                   |
| target_id   | int                                            | YES  |     | NULL              |                   |
| old_values  | json                                           | YES  |     | NULL              |                   |
| new_values  | json                                           | YES  |     | NULL              |                   |
| ip_address  | varchar(45)                                    | YES  |     | NULL              |                   |
| user_agent  | text                                           | YES  |     | NULL              |                   |
| createdAt   | datetime                                       | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------+------------------------------------------------+------+-----+-------------------+-------------------+
10 rows in set (0.021 sec)

MySQL [ikoota_db]> describe content_likes     ;
+--------------+-----------------------------------+------+-----+-------------------+-------------------+
| Field        | Type                              | Null | Key | Default           | Extra             |
+--------------+-----------------------------------+------+-----+-------------------+-------------------+
| id           | int                               | NO   | PRI | NULL              | auto_increment    |
| user_id      | char(10)                          | NO   | MUL | NULL              |                   |
| content_type | enum('chat','teaching','comment') | NO   | MUL | NULL              |                   |
| content_id   | int                               | NO   |     | NULL              |                   |
| createdAt    | datetime                          | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+-----------------------------------+------+-----+-------------------+-------------------+
5 rows in set (0.023 sec)

MySQL [ikoota_db]> describe content_moderation_queue ;
+-----------------+----------------------------------------+------+-----+-------------------+-------------------+
| Field           | Type                                   | Null | Key | Default           | Extra             |
+-----------------+----------------------------------------+------+-----+-------------------+-------------------+
| id              | int                                    | NO   | PRI | NULL              | auto_increment    |
| contentType     | enum('chat','teaching','comment')      | NO   |     | NULL              |                   |
| contentId       | int                                    | NO   |     | NULL              |                   |
| priority        | enum('low','medium','high','critical') | YES  |     | medium            |                   |
| assignedAdminId | int                                    | YES  |     | NULL              |                   |
| status          | enum('pending','in_review','resolved') | YES  |     | pending           |                   |
| createdAt       | timestamp                              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| resolvedAt      | timestamp                              | YES  |     | NULL              |                   |
+-----------------+----------------------------------------+------+-----+-------------------+-------------------+
8 rows in set (0.022 sec)

MySQL [ikoota_db]> describe content_reports   ;
+------------------+--------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field            | Type                                                                           | Null | Key | Default           | Extra             |
+------------------+--------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id               | int                                                                            | NO   | PRI | NULL              | auto_increment    |
| reporter_id      | char(10)                                                                       | NO   | MUL | NULL              |                   |
| content_type     | enum('chat','teaching','comment')                                              | NO   | MUL | NULL              |                   |
| content_id       | int                                                                            | NO   |     | NULL              |                   |
| reason           | enum('spam','inappropriate','copyright','harassment','misinformation','other') | NO   |     | NULL              |                   |
| description      | text                                                                           | YES  |     | NULL              |                   |
| status           | enum('pending','reviewed','resolved','dismissed')                              | YES  | MUL | pending           |                   |
| reviewed_by      | int                                                                            | YES  |     | NULL              |                   |
| reviewedAt       | datetime                                                                       | YES  |     | NULL              |                   |
| resolution_notes | text                                                                           | YES  |     | NULL              |                   |
| action_taken     | enum('content_removed','user_warned','user_suspended','no_action')             | YES  |     | NULL              |                   |
| createdAt        | datetime                                                                       | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------------+--------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
12 rows in set (0.021 sec)

MySQL [ikoota_db]> describe content_tags   ;
+--------------+-------------------------+------+-----+-------------------+-------------------+
| Field        | Type                    | Null | Key | Default           | Extra             |
+--------------+-------------------------+------+-----+-------------------+-------------------+
| id           | int                     | NO   | PRI | NULL              | auto_increment    |
| content_type | enum('chat','teaching') | NO   | MUL | NULL              |                   |
| content_id   | int                     | NO   |     | NULL              |                   |
| tag_id       | int                     | NO   | MUL | NULL              |                   |
| createdAt    | datetime                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+-------------------------+------+-----+-------------------+-------------------+
5 rows in set (0.021 sec)

MySQL [ikoota_db]> describe content_views    ;
+--------------+-------------------------+------+-----+-------------------+-------------------+
| Field        | Type                    | Null | Key | Default           | Extra             |
+--------------+-------------------------+------+-----+-------------------+-------------------+
| id           | int                     | NO   | PRI | NULL              | auto_increment    |
| user_id      | char(10)                | YES  | MUL | NULL              |                   |
| content_type | enum('chat','teaching') | NO   | MUL | NULL              |                   |
| content_id   | int                     | NO   |     | NULL              |                   |
| ip_address   | varchar(45)             | YES  |     | NULL              |                   |
| user_agent   | text                    | YES  |     | NULL              |                   |
| createdAt    | datetime                | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+-------------------------+------+-----+-------------------+-------------------+
7 rows in set (0.021 sec)

MySQL [ikoota_db]> describe current_membership_status ;
+------------------+---------------------------------------------------------------------------------------------+------+-----+---------+-------+
| Field            | Type                                                                                        | Null | Key | Default | Extra |
+------------------+---------------------------------------------------------------------------------------------+------+-----+---------+-------+
| id               | int                                                                                         | NO   |     | 0       |       |
| username         | varchar(255)                                                                                | NO   |     | NULL    |       |
| email            | varchar(255)                                                                                | NO   |     | NULL    |       |
| membership_stage | enum('none','applicant','pre_member','member')                                              | YES  |     | none    |       |
| is_member        | enum('applied','pending','suspended','granted','declined','pre_member','member','rejected') | YES  |     | applied |       |
| survey_status    | enum('pending','approved','rejected','under_review','granted','declined')                   | YES  |     | pending |       |
| full_status      | enum('pending','suspended','approved','declined')                                           | YES  |     | pending |       |
+------------------+---------------------------------------------------------------------------------------------+------+-----+---------+-------+
7 rows in set (0.022 sec)

MySQL [ikoota_db]> describe daily_reports         ;
+-------------+-----------+------+-----+-------------------+-------------------+
| Field       | Type      | Null | Key | Default           | Extra             |
+-------------+-----------+------+-----+-------------------+-------------------+
| id          | int       | NO   | PRI | NULL              | auto_increment    |
| report_date | date      | NO   | UNI | NULL              |                   |
| report_data | json      | NO   |     | NULL              |                   |
| generatedAt | timestamp | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------+-----------+------+-----+-------------------+-------------------+
4 rows in set (0.021 sec)

MySQL [ikoota_db]> describe email_activity_logs     ;
+------------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                            | Null | Key | Default           | Extra                                         |
+------------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| id               | int                             | NO   | PRI | NULL              | auto_increment                                |
| email_type       | enum('single','bulk')           | NO   | MUL | single            |                                               |
| recipient        | varchar(255)                    | NO   | MUL | NULL              |                                               |
| recipients_count | int                             | YES  |     | 1                 |                                               |
| subject          | varchar(500)                    | YES  |     | NULL              |                                               |
| template         | varchar(100)                    | YES  | MUL | NULL              |                                               |
| status           | enum('sent','failed','pending') | YES  | MUL | pending           |                                               |
| message_id       | varchar(255)                    | YES  |     | NULL              |                                               |
| error_message    | text                            | YES  |     | NULL              |                                               |
| successful_count | int                             | YES  |     | 0                 |                                               |
| failed_count     | int                             | YES  |     | 0                 |                                               |
| sender_id        | char(10)                        | YES  | MUL | NULL              |                                               |
| createdAt        | timestamp                       | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt      | timestamp                       | YES  |     | NULL              |                                               |
+------------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
15 rows in set (0.021 sec)

MySQL [ikoota_db]> describe email_templates         ;
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field      | Type         | Null | Key | Default           | Extra                                         |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment                                |
| name       | varchar(100) | NO   | UNI | NULL              |                                               |
| subject    | varchar(500) | NO   |     | NULL              |                                               |
| body_text  | text         | YES  |     | NULL              |                                               |
| body_html  | text         | YES  |     | NULL              |                                               |
| variables  | json         | YES  |     | NULL              |                                               |
| is_active  | tinyint(1)   | YES  | MUL | 1                 |                                               |
| created_by | char(10)     | YES  | MUL | NULL              |                                               |
| createdAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.021 sec)

MySQL [ikoota_db]> describe full_membership_applications  ;
+-------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field             | Type                                              | Null | Key | Default           | Extra                                         |
+-------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                | int                                               | NO   | PRI | NULL              | auto_increment                                |
| user_id           | int                                               | NO   | UNI | NULL              |                                               |
| membership_ticket | varchar(25)                                       | NO   | MUL | NULL              |                                               |
| answers           | json                                              | NO   |     | NULL              |                                               |
| status            | enum('pending','suspended','approved','declined') | YES  | MUL | pending           |                                               |
| submittedAt       | timestamp                                         | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| reviewedAt        | timestamp                                         | YES  |     | NULL              |                                               |
| reviewed_by       | int                                               | YES  | MUL | NULL              |                                               |
| admin_notes       | text                                              | YES  |     | NULL              |                                               |
| createdAt         | timestamp                                         | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt         | timestamp                                         | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.021 sec)

MySQL [ikoota_db]> describe id_generation_log          ;
+--------------+----------------------+------+-----+-------------------+-------------------+
| Field        | Type                 | Null | Key | Default           | Extra             |
+--------------+----------------------+------+-----+-------------------+-------------------+
| id           | int                  | NO   | PRI | NULL              | auto_increment    |
| generated_id | char(10)             | NO   | MUL | NULL              |                   |
| id_type      | enum('user','class') | NO   | MUL | NULL              |                   |
| generated_by | char(10)             | YES  | MUL | NULL              |                   |
| generatedAt  | timestamp            | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| purpose      | varchar(100)         | YES  |     | NULL              |                   |
+--------------+----------------------+------+-----+-------------------+-------------------+
6 rows in set (0.022 sec)

MySQL [ikoota_db]> describe identity_masking_audit ;
+--------------------+--------------+------+-----+-------------------+-------------------+
| Field              | Type         | Null | Key | Default           | Extra             |
+--------------------+--------------+------+-----+-------------------+-------------------+
| id                 | int          | NO   | PRI | NULL              | auto_increment    |
| user_id            | int          | NO   | MUL | NULL              |                   |
| converse_id        | varchar(12)  | YES  | MUL | NULL              |                   |
| masked_by_admin_id | varchar(12)  | YES  | MUL | NULL              |                   |
| original_username  | varchar(255) | YES  |     | NULL              |                   |
| createdAt          | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reason             | text         | YES  |     | NULL              |                   |
+--------------------+--------------+------+-----+-------------------+-------------------+
7 rows in set (0.023 sec)

MySQL [ikoota_db]> describe identity_masks        ;
+-------------------+------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                               | Null | Key | Default           | Extra             |
+-------------------+------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                | NO   | MUL | NULL              |                   |
| original_username | varchar(255)                       | NO   |     | NULL              |                   |
| original_email    | varchar(255)                       | NO   |     | NULL              |                   |
| masked_username   | varchar(255)                       | NO   |     | NULL              |                   |
| masked_email      | varchar(255)                       | NO   |     | NULL              |                   |
| masking_level     | enum('partial','full','temporary') | NO   |     | NULL              |                   |
| reason            | text                               | NO   |     | NULL              |                   |
| created_by        | int                                | NO   | MUL | NULL              |                   |
| expiresAt         | timestamp                          | YES  | MUL | NULL              |                   |
| is_active         | tinyint(1)                         | YES  | MUL | 1                 |                   |
| unmasked_by       | int                                | YES  | MUL | NULL              |                   |
| unmaskedAt        | timestamp                          | YES  |     | NULL              |                   |
| unmask_reason     | text                               | YES  |     | NULL              |                   |
| createdAt         | timestamp                          | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------------+------------------------------------+------+-----+-------------------+-------------------+
15 rows in set (0.022 sec)

MySQL [ikoota_db]> describe initial_membership_applications  ;
+-------------------+---------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field             | Type                                                                      | Null | Key | Default           | Extra                                         |
+-------------------+---------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                | int                                                                       | NO   | PRI | NULL              | auto_increment                                |
| user_id           | int                                                                       | NO   | UNI | NULL              |                                               |
| membership_ticket | varchar(20)                                                               | NO   |     | NULL              |                                               |
| answers           | json                                                                      | NO   |     | NULL              |                                               |
| status            | enum('pending','approved','rejected','under_review','granted','declined') | YES  | MUL | pending           |                                               |
| submittedAt       | timestamp                                                                 | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| reviewedAt        | timestamp                                                                 | YES  |     | NULL              |                                               |
| reviewed_by       | int                                                                       | YES  | MUL | NULL              |                                               |
| admin_notes       | text                                                                      | YES  |     | NULL              |                                               |
| createdAt         | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt         | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-------------------+---------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.021 sec)

MySQL [ikoota_db]> describe membership_access_log   ;
+-------------------+------------------------+------+-----+-------------------+-----------------------------------------------+
| Field             | Type                   | Null | Key | Default           | Extra                                         |
+-------------------+------------------------+------+-----+-------------------+-----------------------------------------------+
| id                | int                    | NO   | PRI | NULL              | auto_increment                                |
| user_id           | int                    | NO   | MUL | NULL              |                                               |
| membership_type   | enum('initial','full') | NO   | MUL | NULL              |                                               |
| first_accessed_at | timestamp              | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| last_accessed_at  | timestamp              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| total_accesses    | int                    | YES  |     | 1                 |                                               |
| ip_address        | varchar(45)            | YES  |     | NULL              |                                               |
| user_agent        | text                   | YES  |     | NULL              |                                               |
| createdAt         | timestamp              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt         | timestamp              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-------------------+------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.022 sec)

MySQL [ikoota_db]> describe membership_review_history ;
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                                                        | Null | Key | Default           | Extra             |
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                                         | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                                         | NO   | MUL | NULL              |                   |
| application_type  | enum('initial_application','full_membership')               | NO   | MUL | NULL              |                   |
| application_id    | int                                                         | YES  |     | NULL              |                   |
| reviewer_id       | int                                                         | YES  | MUL | NULL              |                   |
| previous_status   | enum('pending','suspended','approved','declined')           | YES  |     | NULL              |                   |
| new_status        | enum('pending','suspended','approved','declined')           | YES  |     | NULL              |                   |
| review_notes      | text                                                        | YES  |     | NULL              |                   |
| action_taken      | enum('approve','decline','suspend','request_info','reopen') | NO   |     | NULL              |                   |
| reviewedAt        | timestamp                                                   | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| notification_sent | tinyint(1)                                                  | YES  |     | 0                 |                   |
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
11 rows in set (0.022 sec)

MySQL [ikoota_db]> describe membership_stats     ;
+------------------------------+--------+------+-----+---------+-------+
| Field                        | Type   | Null | Key | Default | Extra |
+------------------------------+--------+------+-----+---------+-------+
| pre_members_count            | bigint | NO   |     | 0       |       |
| full_members_count           | bigint | NO   |     | 0       |       |
| pending_full_applications    | bigint | NO   |     | 0       |       |
| pending_initial_applications | bigint | NO   |     | 0       |       |
| total_users                  | bigint | NO   |     | 0       |       |
+------------------------------+--------+------+-----+---------+-------+
5 rows in set (0.021 sec)

MySQL [ikoota_db]> describe mentors         ;
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
6 rows in set (0.021 sec)

MySQL [ikoota_db]> describe notifications       ;
+-----------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                 | Type                                              | Null | Key | Default           | Extra                                         |
+-----------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                    | int                                               | NO   | PRI | NULL              | auto_increment                                |
| template_name         | varchar(50)                                       | YES  |     | NULL              |                                               |
| template_type         | enum('approval','decline','admin_notification')   | YES  |     | NULL              |                                               |
| recipients            | json                                              | NO   |     | NULL              |                                               |
| subject               | varchar(255)                                      | NO   |     | NULL              |                                               |
| message               | text                                              | NO   |     | NULL              |                                               |
| type                  | enum('email','sms','push')                        | YES  | MUL | email             |                                               |
| status                | enum('queued','sending','sent','failed')          | YES  | MUL | queued            |                                               |
| scheduled_for         | timestamp                                         | YES  | MUL | NULL              |                                               |
| error_message         | text                                              | YES  |     | NULL              |                                               |
| created_by            | int                                               | YES  | MUL | NULL              |                                               |
| sent_count            | int                                               | YES  |     | 0                 |                                               |
| failed_count          | int                                               | YES  |     | 0                 |                                               |
| user_id               | int                                               | YES  | MUL | NULL              |                                               |
| notification_category | enum('system','application','content','security') | YES  |     | system            |                                               |
| priority              | enum('low','medium','high','urgent')              | YES  | MUL | medium            |                                               |
| is_read               | tinyint(1)                                        | YES  |     | 0                 |                                               |
| read_at               | timestamp                                         | YES  |     | NULL              |                                               |
| expires_at            | timestamp                                         | YES  |     | NULL              |                                               |
| createdAt             | timestamp                                         | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt             | timestamp                                         | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| sentAt                | timestamp                                         | YES  |     | NULL              |                                               |
| processedAt           | timestamp                                         | YES  |     | NULL              |                                               |
+-----------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
23 rows in set (0.022 sec)

MySQL [ikoota_db]> describe pending_surveys_view    ;
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field                 | Type                                                                                                  | Null | Key | Default           | Extra             |
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                    | int                                                                                                   | NO   |     | 0                 |                   |
| user_id               | int                                                                                                   | NO   |     | NULL              |                   |
| username              | varchar(255)                                                                                          | NO   |     | NULL              |                   |
| email                 | varchar(255)                                                                                          | NO   |     | NULL              |                   |
| survey_type           | enum('membership_application','general_survey','feedback_form','assessment','questionnaire','custom') | YES  |     | general_survey    |                   |
| survey_category       | varchar(100)                                                                                          | YES  |     | general           |                   |
| survey_title          | varchar(255)                                                                                          | YES  |     | NULL              |                   |
| completion_percentage | decimal(5,2)                                                                                          | YES  |     | 0.00              |                   |
| submitted_at          | timestamp                                                                                             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| days_pending          | int                                                                                                   | YES  |     | NULL              |                   |
| priority              | varchar(6)                                                                                            | NO   |     |                   |                   |
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
11 rows in set (0.022 sec)

MySQL [ikoota_db]> describe question_labels       ;
+------------------+----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                                                           | Null | Key | Default           | Extra                                         |
+------------------+----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id               | int                                                            | NO   | PRI | NULL              | auto_increment                                |
| field_name       | varchar(100)                                                   | NO   | UNI | NULL              |                                               |
| label_text       | varchar(500)                                                   | NO   |     | NULL              |                                               |
| application_type | enum('initial_application','full_membership','general_survey') | YES  | MUL | general_survey    |                                               |
| display_order    | int                                                            | YES  |     | 0                 |                                               |
| is_active        | tinyint(1)                                                     | YES  | MUL | 1                 |                                               |
| createdAt        | timestamp                                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------------+----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
8 rows in set (0.021 sec)

MySQL [ikoota_db]> describe reports    ;
+-------------+---------------------------------------+------+-----+-------------------+-------------------+
| Field       | Type                                  | Null | Key | Default           | Extra             |
+-------------+---------------------------------------+------+-----+-------------------+-------------------+
| id          | int                                   | NO   | PRI | NULL              | auto_increment    |
| reporter_id | char(10)                              | NO   | MUL | NULL              |                   |
| reported_id | char(10)                              | YES  | MUL | NULL              |                   |
| reason      | text                                  | NO   |     | NULL              |                   |
| status      | enum('pending','reviewed','resolved') | YES  |     | pending           |                   |
| createdAt   | timestamp                             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------+---------------------------------------+------+-----+-------------------+-------------------+
6 rows in set (0.021 sec)

MySQL [ikoota_db]> describe sms_activity_logs  ;
+------------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                            | Null | Key | Default           | Extra                                         |
+------------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| id               | int                             | NO   | PRI | NULL              | auto_increment                                |
| sms_type         | enum('single','bulk')           | NO   | MUL | single            |                                               |
| recipient        | varchar(20)                     | NO   | MUL | NULL              |                                               |
| recipients_count | int                             | YES  |     | 1                 |                                               |
| message          | text                            | YES  |     | NULL              |                                               |
| template         | varchar(100)                    | YES  | MUL | NULL              |                                               |
| status           | enum('sent','failed','pending') | YES  | MUL | pending           |                                               |
| sid              | varchar(100)                    | YES  |     | NULL              |                                               |
| error_message    | text                            | YES  |     | NULL              |                                               |
| successful_count | int                             | YES  |     | 0                 |                                               |
| failed_count     | int                             | YES  |     | 0                 |                                               |
| sender_id        | char(10)                        | YES  | MUL | NULL              |                                               |
| createdAt        | timestamp                       | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt      | timestamp                       | YES  |     | NULL              |                                               |
+------------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
15 rows in set (0.021 sec)

MySQL [ikoota_db]> describe sms_templates    ;
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field      | Type         | Null | Key | Default           | Extra                                         |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment                                |
| name       | varchar(100) | NO   | UNI | NULL              |                                               |
| message    | text         | NO   |     | NULL              |                                               |
| variables  | json         | YES  |     | NULL              |                                               |
| is_active  | tinyint(1)   | YES  | MUL | 1                 |                                               |
| created_by | char(10)     | YES  | MUL | NULL              |                                               |
| createdAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
8 rows in set (0.021 sec)

MySQL [ikoota_db]> describe survey_analytics   ;
+---------------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field                     | Type         | Null | Key | Default           | Extra                                         |
+---------------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id                        | int          | NO   | PRI | NULL              | auto_increment                                |
| date_key                  | date         | NO   | MUL | NULL              |                                               |
| survey_type               | varchar(100) | YES  | MUL | general_survey    |                                               |
| survey_category           | varchar(100) | YES  | MUL | general           |                                               |
| total_submissions         | int          | YES  |     | 0                 |                                               |
| completed_submissions     | int          | YES  |     | 0                 |                                               |
| pending_submissions       | int          | YES  |     | 0                 |                                               |
| approved_submissions      | int          | YES  |     | 0                 |                                               |
| rejected_submissions      | int          | YES  |     | 0                 |                                               |
| avg_completion_time       | decimal(8,2) | YES  |     | 0.00              |                                               |
| avg_completion_percentage | decimal(5,2) | YES  |     | 0.00              |                                               |
| unique_users              | int          | YES  |     | 0                 |                                               |
| createdAt                 | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt                 | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+---------------------------+--------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.021 sec)

MySQL [ikoota_db]> describe survey_categories   ;
+----------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field                | Type         | Null | Key | Default           | Extra                                         |
+----------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id                   | int          | NO   | PRI | NULL              | auto_increment                                |
| category_name        | varchar(100) | NO   | UNI | NULL              |                                               |
| category_description | text         | YES  |     | NULL              |                                               |
| icon                 | varchar(100) | YES  |     | NULL              |                                               |
| color                | varchar(7)   | YES  |     | #3498db           |                                               |
| display_order        | int          | YES  | MUL | 0                 |                                               |
| is_active            | tinyint(1)   | YES  | MUL | 1                 |                                               |
| created_by           | int          | YES  |     | NULL              |                                               |
| createdAt            | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt            | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+----------------------+--------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.021 sec)

MySQL [ikoota_db]> describe survey_configurations   ;
+--------------------+------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                                     | Null | Key | Default           | Extra                                         |
+--------------------+------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                 | int                                      | NO   | PRI | NULL              | auto_increment                                |
| config_key         | varchar(100)                             | NO   | UNI | NULL              |                                               |
| config_value       | text                                     | YES  |     | NULL              |                                               |
| config_type        | enum('string','number','boolean','json') | YES  |     | string            |                                               |
| config_description | text                                     | YES  |     | NULL              |                                               |
| is_active          | tinyint(1)                               | YES  | MUL | 1                 |                                               |
| updated_by         | int                                      | YES  | MUL | NULL              |                                               |
| createdAt          | timestamp                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt          | timestamp                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+--------------------+------------------------------------------+------+-----+-------------------+-----------------------------------------------+
9 rows in set (0.022 sec)

MySQL [ikoota_db]> describe survey_drafts            ;
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| Field                 | Type                                                                                                  | Null | Key | Default             | Extra                                         |
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| id                    | int                                                                                                   | NO   | PRI | NULL                | auto_increment                                |
| user_id               | int                                                                                                   | NO   | MUL | NULL                |                                               |
| answers               | text                                                                                                  | YES  |     | NULL                |                                               |
| application_type      | enum('initial_application','full_membership')                                                         | YES  | MUL | initial_application |                                               |
| survey_type           | enum('membership_application','general_survey','feedback_form','assessment','questionnaire','custom') | YES  | MUL | general_survey      |                                               |
| survey_title          | varchar(255)                                                                                          | YES  |     | NULL                |                                               |
| survey_category       | varchar(100)                                                                                          | YES  | MUL | general             |                                               |
| completion_percentage | decimal(5,2)                                                                                          | YES  |     | 0.00                |                                               |
| auto_saved            | tinyint(1)                                                                                            | YES  | MUL | 0                   |                                               |
| draft_name            | varchar(255)                                                                                          | YES  |     | NULL                |                                               |
| expires_at            | timestamp                                                                                             | YES  | MUL | NULL                |                                               |
| admin_notes           | text                                                                                                  | YES  |     | NULL                |                                               |
| saved_by_admin_id     | int                                                                                                   | YES  | MUL | NULL                |                                               |
| createdAt             | timestamp                                                                                             | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| updatedAt             | timestamp                                                                                             | YES  | MUL | CURRENT_TIMESTAMP   | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
15 rows in set (0.022 sec)

MySQL [ikoota_db]> describe survey_questions     ;
+------------------+------------------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                                                                                     | Null | Key | Default           | Extra                                         |
+------------------+------------------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id               | int                                                                                      | NO   | PRI | NULL              | auto_increment                                |
| question         | text                                                                                     | NO   |     | NULL              |                                               |
| question_type    | enum('text','textarea','select','checkbox','radio','number','date','email','url','file') | YES  |     | text              |                                               |
| category         | varchar(100)                                                                             | YES  | MUL | general           |                                               |
| validation_rules | json                                                                                     | YES  |     | NULL              |                                               |
| options          | json                                                                                     | YES  |     | NULL              |                                               |
| is_required      | tinyint(1)                                                                               | YES  |     | 0                 |                                               |
| created_by       | int                                                                                      | YES  | MUL | NULL              |                                               |
| updated_by       | int                                                                                      | YES  | MUL | NULL              |                                               |
| deleted_by       | int                                                                                      | YES  | MUL | NULL              |                                               |
| deletedAt        | timestamp                                                                                | YES  |     | NULL              |                                               |
| createdAt        | timestamp                                                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                                                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| is_active        | tinyint(1)                                                                               | YES  | MUL | 1                 |                                               |
| question_order   | int                                                                                      | YES  | MUL | 0                 |                                               |
+------------------+------------------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
15 rows in set (0.022 sec)

MySQL [ikoota_db]> describe survey_responses    ;
+----------------+-----------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field          | Type                                                                              | Null | Key | Default           | Extra             |
+----------------+-----------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id             | int                                                                               | NO   | PRI | NULL              | auto_increment    |
| survey_log_id  | int                                                                               | NO   | MUL | NULL              |                   |
| question_id    | int                                                                               | YES  | MUL | NULL              |                   |
| question_text  | text                                                                              | YES  |     | NULL              |                   |
| answer_text    | text                                                                              | YES  |     | NULL              |                   |
| answer_value   | varchar(500)                                                                      | YES  |     | NULL              |                   |
| response_type  | enum('text','number','boolean','date','file','multiple_choice','multiple_select') | YES  | MUL | text              |                   |
| response_order | int                                                                               | YES  | MUL | 0                 |                   |
| createdAt      | timestamp                                                                         | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+----------------+-----------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
9 rows in set (0.022 sec)

MySQL [ikoota_db]> describe survey_stats_view   ;
+------------------+-------------------------------------------------------------------------------------------------------+------+-----+----------------+-------+
| Field            | Type                                                                                                  | Null | Key | Default        | Extra |
+------------------+-------------------------------------------------------------------------------------------------------+------+-----+----------------+-------+
| survey_type      | enum('membership_application','general_survey','feedback_form','assessment','questionnaire','custom') | YES  |     | general_survey |       |
| survey_category  | varchar(100)                                                                                          | YES  |     | general        |       |
| approval_status  | enum('pending','approved','rejected','under_review','granted','declined')                             | YES  |     | pending        |       |
| count            | bigint                                                                                                | NO   |     | 0              |       |
| avg_completion   | decimal(9,6)                                                                                          | YES  |     | NULL           |       |
| avg_time_minutes | decimal(14,4)                                                                                         | YES  |     | NULL           |       |
| submission_date  | date                                                                                                  | YES  |     | NULL           |       |
+------------------+-------------------------------------------------------------------------------------------------------+------+-----+----------------+-------+
7 rows in set (0.021 sec)

MySQL [ikoota_db]> describe survey_templates ;
+----------------------+----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                | Type                                                           | Null | Key | Default           | Extra                                         |
+----------------------+----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                   | int                                                            | NO   | PRI | NULL              | auto_increment                                |
| template_name        | varchar(255)                                                   | NO   | MUL | NULL              |                                               |
| template_version     | varchar(10)                                                    | YES  |     | 1.0               |                                               |
| template_description | text                                                           | YES  |     | NULL              |                                               |
| category             | varchar(100)                                                   | YES  | MUL | general           |                                               |
| application_type     | enum('initial_application','full_membership','general_survey') | YES  | MUL | general_survey    |                                               |
| questions            | json                                                           | NO   |     | NULL              |                                               |
| settings             | json                                                           | YES  |     | NULL              |                                               |
| is_public            | tinyint(1)                                                     | YES  | MUL | 0                 |                                               |
| is_active            | tinyint(1)                                                     | YES  | MUL | 1                 |                                               |
| created_by           | int                                                            | NO   | MUL | NULL              |                                               |
| usage_count          | int                                                            | YES  | MUL | 0                 |                                               |
| createdAt            | timestamp                                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt            | timestamp                                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+----------------------+----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.022 sec)

MySQL [ikoota_db]> describe surveylog    ;
+--------------------------+-------------------------------------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| Field                    | Type                                                                                                  | Null | Key | Default             | Extra                                         |
+--------------------------+-------------------------------------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| id                       | int                                                                                                   | NO   | PRI | NULL                | auto_increment                                |
| user_id                  | int                                                                                                   | NO   | MUL | NULL                |                                               |
| answers                  | text                                                                                                  | YES  |     | NULL                |                                               |
| verified_by              | char(10)                                                                                              | NO   | MUL | NULL                |                                               |
| rating_remarks           | varchar(255)                                                                                          | NO   |     | NULL                |                                               |
| approval_status          | enum('pending','approved','rejected','under_review','granted','declined')                             | YES  | MUL | pending             |                                               |
| priority                 | enum('low','medium','high')                                                                           | YES  | MUL | medium              |                                               |
| createdAt                | timestamp                                                                                             | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| updatedAt                | timestamp                                                                                             | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt              | timestamp                                                                                             | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| admin_notes              | text                                                                                                  | YES  |     | NULL                |                                               |
| application_type         | enum('initial_application','full_membership')                                                         | YES  | MUL | initial_application |                                               |
| survey_type              | enum('membership_application','general_survey','feedback_form','assessment','questionnaire','custom') | YES  | MUL | general_survey      |                                               |
| survey_title             | varchar(255)                                                                                          | YES  |     | NULL                |                                               |
| survey_category          | varchar(100)                                                                                          | YES  | MUL | general             |                                               |
| completion_percentage    | decimal(5,2)                                                                                          | YES  | MUL | 0.00                |                                               |
| time_spent_minutes       | int                                                                                                   | YES  |     | 0                   |                                               |
| ip_address               | varchar(45)                                                                                           | YES  |     | NULL                |                                               |
| user_agent               | text                                                                                                  | YES  |     | NULL                |                                               |
| browser_info             | json                                                                                                  | YES  |     | NULL                |                                               |
| submission_source        | enum('web','mobile','api','admin')                                                                    | YES  | MUL | web                 |                                               |
| reviewedAt               | timestamp                                                                                             | YES  | MUL | NULL                |                                               |
| reviewed_by              | int                                                                                                   | YES  | MUL | NULL                |                                               |
| assigned_to              | int                                                                                                   | YES  | MUL | NULL                |                                               |
| application_ticket       | varchar(255)                                                                                          | YES  |     | NULL                |                                               |
| mentor_assigned          | varchar(12)                                                                                           | YES  | MUL | NULL                |                                               |
| class_assigned           | varchar(12)                                                                                           | YES  | MUL | NULL                |                                               |
| converse_id_generated    | varchar(12)                                                                                           | YES  |     | NULL                |                                               |
| approval_decision_reason | text                                                                                                  | YES  |     | NULL                |                                               |
| notification_sent        | tinyint(1)                                                                                            | YES  |     | 0                   |                                               |
+--------------------------+-------------------------------------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
30 rows in set (0.021 sec)

MySQL [ikoota_db]> describe system_configuration;
+-------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field       | Type         | Null | Key | Default           | Extra                                         |
+-------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id          | int          | NO   | PRI | NULL              | auto_increment                                |
| config_key  | varchar(100) | NO   | UNI | NULL              |                                               |
| config_data | json         | NO   |     | NULL              |                                               |
| updated_by  | int          | YES  | MUL | NULL              |                                               |
| createdAt   | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt   | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-------------+--------------+------+-----+-------------------+-----------------------------------------------+
6 rows in set (0.021 sec)

MySQL [ikoota_db]> describe tags          ;
+-------------+-------------+------+-----+-------------------+-----------------------------------------------+
| Field       | Type        | Null | Key | Default           | Extra                                         |
+-------------+-------------+------+-----+-------------------+-----------------------------------------------+
| id          | int         | NO   | PRI | NULL              | auto_increment                                |
| name        | varchar(50) | NO   | UNI | NULL              |                                               |
| slug        | varchar(50) | NO   | UNI | NULL              |                                               |
| description | text        | YES  |     | NULL              |                                               |
| color       | varchar(7)  | YES  |     | NULL              |                                               |
| usage_count | int         | YES  | MUL | 0                 |                                               |
| createdAt   | datetime    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt   | datetime    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-------------+-------------+------+-----+-------------------+-----------------------------------------------+
8 rows in set (0.022 sec)

MySQL [ikoota_db]> describe teachings   ;
+---------------------+----------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field               | Type                                                     | Null | Key | Default           | Extra                                         |
+---------------------+----------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                  | int                                                      | NO   | PRI | NULL              | auto_increment                                |
| topic               | varchar(255)                                             | NO   |     | NULL              |                                               |
| description         | text                                                     | YES  |     | NULL              |                                               |
| lessonNumber        | varchar(255)                                             | NO   |     | NULL              |                                               |
| subjectMatter       | varchar(255)                                             | YES  |     | NULL              |                                               |
| audience            | varchar(255)                                             | YES  |     | NULL              |                                               |
| content             | text                                                     | YES  |     | NULL              |                                               |
| approval_status     | enum('pending','approved','rejected','deleted')          | YES  | MUL | pending           |                                               |
| status              | enum('draft','pending','approved','rejected','archived') | YES  | MUL | pending           |                                               |
| approval_date       | datetime                                                 | YES  |     | NULL              |                                               |
| approved_by         | int                                                      | YES  |     | NULL              |                                               |
| rejection_reason    | text                                                     | YES  |     | NULL              |                                               |
| step_data           | json                                                     | YES  |     | NULL              |                                               |
| metadata            | json                                                     | YES  |     | NULL              |                                               |
| view_count          | int                                                      | YES  |     | 0                 |                                               |
| like_count          | int                                                      | YES  |     | 0                 |                                               |
| comment_count       | int                                                      | YES  |     | 0                 |                                               |
| is_featured         | tinyint(1)                                               | YES  | MUL | 0                 |                                               |
| is_public           | tinyint(1)                                               | YES  | MUL | 1                 |                                               |
| difficulty_level    | enum('beginner','intermediate','advanced','expert')      | YES  | MUL | beginner          |                                               |
| estimated_duration  | int                                                      | YES  |     | NULL              |                                               |
| prerequisites       | text                                                     | YES  |     | NULL              |                                               |
| learning_objectives | text                                                     | YES  |     | NULL              |                                               |
| tags                | varchar(500)                                             | YES  |     | NULL              |                                               |
| media_urls          | json                                                     | YES  |     | NULL              |                                               |
| resources           | json                                                     | YES  |     | NULL              |                                               |
| quiz_data           | json                                                     | YES  |     | NULL              |                                               |
| media_url1          | varchar(255)                                             | YES  |     | NULL              |                                               |
| media_type1         | enum('image','video','audio','file')                     | YES  |     | NULL              |                                               |
| media_url2          | varchar(255)                                             | YES  |     | NULL              |                                               |
| media_type2         | enum('image','video','audio','file')                     | YES  |     | NULL              |                                               |
| media_url3          | varchar(255)                                             | YES  |     | NULL              |                                               |
| media_type3         | enum('image','video','audio','file')                     | YES  |     | NULL              |                                               |
| createdAt           | timestamp                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt           | timestamp                                                | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| user_id             | int                                                      | NO   | MUL | NULL              |                                               |
| prefixed_id         | varchar(20)                                              | YES  | UNI | NULL              |                                               |
| reviewed_by         | int                                                      | YES  |     | NULL              |                                               |
| reviewedAt          | timestamp                                                | YES  |     | NULL              |                                               |
| admin_notes         | text                                                     | YES  |     | NULL              |                                               |
+---------------------+----------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
40 rows in set (0.021 sec)

MySQL [ikoota_db]> describe user_chats    ;
+----------------------+--------------------------------+------+-----+-------------------+-------------------+
| Field                | Type                           | Null | Key | Default           | Extra             |
+----------------------+--------------------------------+------+-----+-------------------+-------------------+
| id                   | int                            | NO   | PRI | NULL              | auto_increment    |
| user_id              | char(10)                       | NO   | MUL | NULL              |                   |
| chat_id              | char(10)                       | NO   |     | NULL              |                   |
| last_message         | varchar(255)                   | YES  |     | NULL              |                   |
| is_seen              | tinyint(1)                     | YES  |     | 0                 |                   |
| role                 | enum('admin','member','owner') | NO   |     | NULL              |                   |
| is_muted             | tinyint(1)                     | YES  |     | 0                 |                   |
| last_read_message_id | varchar(36)                    | YES  |     | NULL              |                   |
| joinedAt             | datetime                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt            | timestamp                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+----------------------+--------------------------------+------+-----+-------------------+-------------------+
10 rows in set (0.022 sec)

MySQL [ikoota_db]> describe user_class_memberships  ;
+-----------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                 | Type                                           | Null | Key | Default           | Extra                                         |
+-----------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                    | int                                            | NO   | PRI | NULL              | auto_increment                                |
| user_id               | int                                            | NO   | MUL | NULL              |                                               |
| class_id              | varchar(12)                                    | NO   | MUL | NULL              |                                               |
| membership_status     | enum('active','pending','suspended','expired') | YES  | MUL | active            |                                               |
| role_in_class         | enum('member','moderator','assistant')         | YES  | MUL | member            |                                               |
| joinedAt              | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| assigned_by           | int                                            | YES  | MUL | NULL              |                                               |
| expiresAt             | timestamp                                      | YES  |     | NULL              |                                               |
| can_see_class_name    | tinyint(1)                                     | YES  |     | 1                 |                                               |
| receive_notifications | tinyint(1)                                     | YES  |     | 1                 |                                               |
| createdAt             | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt             | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-----------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
12 rows in set (0.021 sec)

MySQL [ikoota_db]> describe user_communication_preferences ;
+-----------------------+-------------+------+-----+-------------------+-----------------------------------------------+
| Field                 | Type        | Null | Key | Default           | Extra                                         |
+-----------------------+-------------+------+-----+-------------------+-----------------------------------------------+
| id                    | int         | NO   | PRI | NULL              | auto_increment                                |
| user_id               | int         | NO   | UNI | NULL              |                                               |
| email_notifications   | tinyint(1)  | YES  |     | 1                 |                                               |
| sms_notifications     | tinyint(1)  | YES  |     | 0                 |                                               |
| marketing_emails      | tinyint(1)  | YES  |     | 1                 |                                               |
| marketing_sms         | tinyint(1)  | YES  |     | 0                 |                                               |
| survey_notifications  | tinyint(1)  | YES  |     | 1                 |                                               |
| content_notifications | tinyint(1)  | YES  |     | 1                 |                                               |
| admin_notifications   | tinyint(1)  | YES  |     | 1                 |                                               |
| preferred_language    | varchar(10) | YES  |     | en                |                                               |
| timezone              | varchar(50) | YES  |     | UTC               |                                               |
| createdAt             | timestamp   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt             | timestamp   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| converse_id           | char(10)    | YES  | MUL | NULL              |                                               |
+-----------------------+-------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.022 sec)

MySQL [ikoota_db]> describe user_deletion_log   ;
+------------+--------------+------+-----+-------------------+-------------------+
| Field      | Type         | Null | Key | Default           | Extra             |
+------------+--------------+------+-----+-------------------+-------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment    |
| user_id    | int          | NO   |     | NULL              |                   |
| username   | varchar(255) | NO   |     | NULL              |                   |
| email      | varchar(255) | NO   |     | NULL              |                   |
| reason     | text         | YES  |     | NULL              |                   |
| deleted_by | int          | NO   |     | NULL              |                   |
| deletedAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------+--------------+------+-----+-------------------+-------------------+
7 rows in set (0.022 sec)

MySQL [ikoota_db]> describe user_management_overview ;
+--------------------+------------------------------------------------+------+-----+-------------------+-------------------+
| Field              | Type                                           | Null | Key | Default           | Extra             |
+--------------------+------------------------------------------------+------+-----+-------------------+-------------------+
| id                 | int                                            | NO   |     | 0                 |                   |
| username           | varchar(255)                                   | NO   |     | NULL              |                   |
| email              | varchar(255)                                   | NO   |     | NULL              |                   |
| converse_id        | varchar(12)                                    | YES  |     | NULL              |                   |
| membership_stage   | enum('none','applicant','pre_member','member') | YES  |     | none              |                   |
| role               | enum('super_admin','admin','user')             | YES  |     | user              |                   |
| is_verified        | tinyint(1)                                     | YES  |     | 0                 |                   |
| isbanned           | tinyint(1)                                     | YES  |     | 0                 |                   |
| is_identity_masked | tinyint(1)                                     | YES  |     | 0                 |                   |
| createdAt          | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| lastLogin          | timestamp                                      | YES  |     | NULL              |                   |
| canPost            | tinyint(1)                                     | YES  |     | 1                 |                   |
| canMentor          | tinyint(1)                                     | YES  |     | 0                 |                   |
| mentor_id          | char(10)                                       | YES  |     | NULL              |                   |
| primary_class_id   | varchar(12)                                    | YES  |     | NULL              |                   |
| class_count        | bigint                                         | NO   |     | 0                 |                   |
| chat_count         | bigint                                         | YES  |     | NULL              |                   |
| teaching_count     | bigint                                         | YES  |     | NULL              |                   |
+--------------------+------------------------------------------------+------+-----+-------------------+-------------------+
18 rows in set (0.028 sec)

MySQL [ikoota_db]> describe user_profiles      ;
+--------------------+--------------+------+-----+-------------------+-------------------+
| Field              | Type         | Null | Key | Default           | Extra             |
+--------------------+--------------+------+-----+-------------------+-------------------+
| id                 | int          | NO   | PRI | NULL              | auto_increment    |
| user_id            | int          | NO   | UNI | NULL              |                   |
| encrypted_username | text         | NO   |     | NULL              |                   |
| encrypted_email    | text         | NO   |     | NULL              |                   |
| encrypted_phone    | text         | YES  |     | NULL              |                   |
| encryption_key     | varchar(255) | YES  |     | NULL              |                   |
| createdAt          | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt          | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------------+--------------+------+-----+-------------------+-------------------+
8 rows in set (0.026 sec)

MySQL [ikoota_db]> describe user_survey_history_view ;
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field                 | Type                                                                                                  | Null | Key | Default           | Extra             |
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| user_id               | int                                                                                                   | NO   |     | 0                 |                   |
| username              | varchar(255)                                                                                          | NO   |     | NULL              |                   |
| email                 | varchar(255)                                                                                          | NO   |     | NULL              |                   |
| survey_id             | int                                                                                                   | YES  |     | 0                 |                   |
| survey_type           | enum('membership_application','general_survey','feedback_form','assessment','questionnaire','custom') | YES  |     | general_survey    |                   |
| survey_category       | varchar(100)                                                                                          | YES  |     | general           |                   |
| survey_title          | varchar(255)                                                                                          | YES  |     | NULL              |                   |
| approval_status       | enum('pending','approved','rejected','under_review','granted','declined')                             | YES  |     | pending           |                   |
| completion_percentage | decimal(5,2)                                                                                          | YES  |     | 0.00              |                   |
| submitted_at          | timestamp                                                                                             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reviewed_at           | timestamp                                                                                             | YES  |     | NULL              |                   |
| processing_days       | int                                                                                                   | YES  |     | NULL              |                   |
+-----------------------+-------------------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
12 rows in set (0.022 sec)

MySQL [ikoota_db]> describe users             ;
+---------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field                     | Type                                                                                        | Null | Key | Default           | Extra             |
+---------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                        | int                                                                                         | NO   | PRI | NULL              | auto_increment    |
| username                  | varchar(255)                                                                                | NO   | MUL | NULL              |                   |
| email                     | varchar(255)                                                                                | NO   | MUL | NULL              |                   |
| phone                     | varchar(15)                                                                                 | YES  |     | NULL              |                   |
| avatar                    | varchar(255)                                                                                | YES  |     | NULL              |                   |
| password_hash             | varchar(255)                                                                                | NO   |     | NULL              |                   |
| converse_id               | varchar(12)                                                                                 | YES  | UNI | NULL              |                   |
| application_ticket        | varchar(20)                                                                                 | YES  | MUL | NULL              |                   |
| mentor_id                 | char(10)                                                                                    | YES  | MUL | NULL              |                   |
| primary_class_id          | varchar(12)                                                                                 | YES  | MUL | NULL              |                   |
| is_member                 | enum('applied','pending','suspended','granted','declined','pre_member','member','rejected') | YES  | MUL | applied           |                   |
| membership_stage          | enum('none','applicant','pre_member','member')                                              | YES  | MUL | none              |                   |
| full_membership_ticket    | varchar(25)                                                                                 | YES  |     | NULL              |                   |
| full_membership_status    | enum('not_applied','applied','pending','suspended','approved','declined')                   | YES  | MUL | not_applied       |                   |
| fullMembershipAppliedAt   | timestamp                                                                                   | YES  | MUL | NULL              |                   |
| fullMembershipReviewedAt  | timestamp                                                                                   | YES  |     | NULL              |                   |
| role                      | enum('super_admin','admin','user')                                                          | YES  |     | user              |                   |
| isblocked                 | json                                                                                        | YES  |     | NULL              |                   |
| isbanned                  | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| canPost                   | tinyint(1)                                                                                  | YES  | MUL | 1                 |                   |
| canMentor                 | tinyint(1)                                                                                  | YES  | MUL | 0                 |                   |
| createdAt                 | timestamp                                                                                   | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt                 | timestamp                                                                                   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| resetToken                | varchar(255)                                                                                | YES  |     | NULL              |                   |
| resetTokenExpiry          | bigint                                                                                      | YES  |     | NULL              |                   |
| verification_method       | enum('email','phone')                                                                       | YES  |     | NULL              |                   |
| verification_code         | varchar(10)                                                                                 | YES  |     | NULL              |                   |
| is_verified               | tinyint(1)                                                                                  | YES  | MUL | 0                 |                   |
| codeExpiry                | bigint                                                                                      | YES  |     | NULL              |                   |
| converse_avatar           | varchar(255)                                                                                | YES  |     | NULL              |                   |
| is_identity_masked        | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| isDeleted                 | tinyint(1)                                                                                  | YES  | MUL | 0                 |                   |
| deletedAt                 | timestamp                                                                                   | YES  |     | NULL              |                   |
| total_classes             | int                                                                                         | YES  |     | 0                 |                   |
| application_status        | enum('not_submitted','submitted','under_review','approved','declined')                      | YES  | MUL | not_submitted     |                   |
| applicationSubmittedAt    | timestamp                                                                                   | YES  | MUL | NULL              |                   |
| applicationReviewedAt     | timestamp                                                                                   | YES  |     | NULL              |                   |
| reviewed_by               | int                                                                                         | YES  | MUL | NULL              |                   |
| decline_reason            | text                                                                                        | YES  |     | NULL              |                   |
| decline_notification_sent | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| lastLogin                 | timestamp                                                                                   | YES  |     | NULL              |                   |
| ban_reason                | text                                                                                        | YES  |     | NULL              |                   |
| bannedAt                  | timestamp                                                                                   | YES  |     | NULL              |                   |
| unbanDate                 | timestamp                                                                                   | YES  |     | NULL              |                   |
| unbannedAt                | timestamp                                                                                   | YES  |     | NULL              |                   |
+---------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
45 rows in set (0.024 sec)

MySQL [ikoota_db]> describe verification_codes  ;
+-----------+-----------------------+------+-----+-------------------+-------------------+
| Field     | Type                  | Null | Key | Default           | Extra             |
+-----------+-----------------------+------+-----+-------------------+-------------------+
| id        | int                   | NO   | PRI | NULL              | auto_increment    |
| email     | varchar(255)          | NO   | MUL | NULL              |                   |
| phone     | varchar(15)           | YES  |     | NULL              |                   |
| code      | varchar(10)           | NO   |     | NULL              |                   |
| method    | enum('email','phone') | NO   |     | NULL              |                   |
| expiresAt | timestamp             | NO   | MUL | NULL              |                   |
| createdAt | timestamp             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-----------+-----------------------+------+-----+-------------------+-------------------+
7 rows in set (0.022 sec)

MySQL [ikoota_db]>