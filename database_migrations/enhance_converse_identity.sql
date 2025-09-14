-- Enhanced Converse Identity System Database Schema
-- Complete privacy protection with video/audio masking support

-- 1. Enhance users table with identity masking fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_identity_masked TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS identity_masked_at DATETIME,
ADD COLUMN IF NOT EXISTS avatar_config JSON,
ADD COLUMN IF NOT EXISTS voice_config JSON,
ADD COLUMN IF NOT EXISTS last_unmasked_by INT,
ADD COLUMN IF NOT EXISTS last_unmasked_at DATETIME,
ADD INDEX idx_converse_id (converse_id),
ADD INDEX idx_identity_masked (is_identity_masked);

-- 2. Create user_profiles table for encrypted data storage
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    vault_id VARCHAR(32),
    encrypted_username JSON,
    encrypted_email JSON,
    encrypted_phone JSON,
    encrypted_real_name JSON,
    encrypted_address JSON,
    avatar_type VARCHAR(50),
    voice_modifier VARCHAR(50),
    video_filter_config JSON,
    audio_preset_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_vault_id (vault_id)
);

-- 3. Enhanced identity masking audit table
CREATE TABLE IF NOT EXISTS identity_masking_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    operation_type ENUM('MASK', 'UNMASK', 'VIEW', 'UPDATE', 'EXPORT') NOT NULL,
    converse_id VARCHAR(10),
    performed_by VARCHAR(50) NOT NULL,
    admin_user_id INT,
    reason TEXT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_performed_by (performed_by),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Avatar configurations table
CREATE TABLE IF NOT EXISTS avatar_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    avatar_type ENUM('cartoon', 'abstract', 'animal', 'robot', 'geometric') NOT NULL,
    color_scheme VARCHAR(7),
    pattern VARCHAR(100),
    custom_features JSON,
    animation_settings JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_avatar_type (avatar_type)
);

-- 5. Voice modification presets
CREATE TABLE IF NOT EXISTS voice_presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    preset_name VARCHAR(100),
    pitch_shift INT DEFAULT 0,
    formant_shift DECIMAL(5,2) DEFAULT 0,
    reverb_settings JSON,
    effects_chain JSON,
    voice_synthesis_config JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Live stream masking sessions
CREATE TABLE IF NOT EXISTS masking_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(32) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    converse_id VARCHAR(10) NOT NULL,
    session_type ENUM('video', 'audio', 'both') NOT NULL,
    masking_config JSON,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_seconds INT,
    quality_metrics JSON,
    error_logs JSON,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_type (session_type),
    INDEX idx_start_time (start_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Identity vault references
CREATE TABLE IF NOT EXISTS identity_vault_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    vault_id VARCHAR(32) NOT NULL UNIQUE,
    vault_path VARCHAR(500),
    encryption_version VARCHAR(10) DEFAULT 'v1',
    last_accessed TIMESTAMP NULL,
    access_count INT DEFAULT 0,
    is_archived TINYINT(1) DEFAULT 0,
    archived_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_vault_id (vault_id),
    INDEX idx_is_archived (is_archived)
);

-- 8. Converse ID usage tracking
CREATE TABLE IF NOT EXISTS converse_id_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    converse_id VARCHAR(10) NOT NULL,
    user_id INT NOT NULL,
    context ENUM('chat', 'teaching', 'comment', 'class', 'survey', 'general') NOT NULL,
    reference_id VARCHAR(50),
    action VARCHAR(100),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_converse_id (converse_id),
    INDEX idx_user_id (user_id),
    INDEX idx_context (context),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Privacy settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    allow_unmask_requests TINYINT(1) DEFAULT 0,
    require_unmask_reason TINYINT(1) DEFAULT 1,
    unmask_notification TINYINT(1) DEFAULT 1,
    auto_mask_new_content TINYINT(1) DEFAULT 1,
    hide_online_status TINYINT(1) DEFAULT 1,
    hide_last_seen TINYINT(1) DEFAULT 1,
    hide_typing_indicator TINYINT(1) DEFAULT 1,
    anonymous_reactions TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Emergency unmask requests
CREATE TABLE IF NOT EXISTS emergency_unmask_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(32) UNIQUE NOT NULL,
    target_user_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason TEXT NOT NULL,
    urgency_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
   expiresAt TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_request_id (request_id),
    INDEX idx_status (status),
    INDEX idx_urgency_level (urgency_level),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Create stored procedures for identity operations

DELIMITER $$

-- Procedure to mask user identity
CREATE PROCEDURE IF NOT EXISTS mask_user_identity(
    IN p_user_id INT,
    IN p_converse_id VARCHAR(10)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to mask user identity';
    END;
    
    START TRANSACTION;
    
    -- Update user table
    UPDATE users 
    SET 
        converse_id = p_converse_id,
        is_identity_masked = 1,
        identity_masked_at = NOW()
    WHERE id = p_user_id;
    
    -- Log the operation
    INSERT INTO identity_masking_audit (
        user_id, operation_type, converse_id, performed_by, details
    ) VALUES (
        p_user_id, 'MASK', p_converse_id, 'SYSTEM', 
        JSON_OBJECT('action', 'identity_masked', 'timestamp', NOW())
    );
    
    COMMIT;
END$$

-- Procedure to get masked user count
CREATE PROCEDURE IF NOT EXISTS get_identity_stats()
BEGIN
    SELECT 
        COUNT(*) as total_users,
        SUM(is_identity_masked) as masked_users,
        SUM(is_identity_masked = 0) as unmasked_users,
        COUNT(DISTINCT converse_id) as unique_converse_ids,
        (SUM(is_identity_masked) / COUNT(*) * 100) as masking_percentage
    FROM users;
END$$

DELIMITER ;

-- 12. Create views for reporting

-- View for active masked users
CREATE OR REPLACE VIEW masked_users_view AS
SELECT 
    u.id,
    u.converse_id,
    u.membership_stage,
    u.is_member,
    u.identity_masked_at,
    ac.avatar_type,
    vp.preset_name as voice_preset,
    ups.allow_unmask_requests
FROM users u
LEFT JOIN avatar_configurations ac ON u.id = ac.user_id
LEFT JOIN voice_presets vp ON u.id = vp.user_id
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id
WHERE u.is_identity_masked = 1;

-- View for identity audit summary
CREATE OR REPLACE VIEW identity_audit_summary AS
SELECT 
    DATE(created_at) as audit_date,
    operation_type,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT performed_by) as unique_performers
FROM identity_masking_audit
GROUP BY DATE(created_at), operation_type;

-- 13. Insert default privacy settings for existing users
INSERT INTO user_privacy_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings);

-- 14. Add triggers for automatic operations

DELIMITER $$

-- Trigger to create privacy settings for new users
CREATE TRIGGER IF NOT EXISTS create_privacy_settings_for_new_user
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_privacy_settings (user_id) VALUES (NEW.id);
END$$

-- Trigger to log converse ID usage
CREATE TRIGGER IF NOT EXISTS log_converse_id_usage
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.converse_id IS NOT NULL AND OLD.converse_id IS NULL THEN
        INSERT INTO converse_id_usage (
            converse_id, user_id, context, action
        ) VALUES (
            NEW.converse_id, NEW.id, 'general', 'converse_id_assigned'
        );
    END IF;
END$$

DELIMITER ;

-- 15. Create indexes for performance
CREATE INDEX idx_users_masked_status ON users(is_identity_masked, converse_id);
CREATE INDEX idx_audit_user_operation ON identity_masking_audit(user_id, operation_type, created_at);
CREATE INDEX idx_sessions_active ON masking_sessions(user_id, end_time);

-- 16. Sample data for testing (optional)
-- INSERT INTO avatar_configurations (user_id, avatar_type, color_scheme, pattern)
-- SELECT id, 
--     ELT(FLOOR(RAND() * 5) + 1, 'cartoon', 'abstract', 'animal', 'robot', 'geometric'),
--     CONCAT('#', LPAD(HEX(FLOOR(RAND() * 16777215)), 6, '0')),
--     MD5(CONCAT(id, NOW()))
-- FROM users 
-- WHERE is_identity_masked = 1
-- LIMIT 10;