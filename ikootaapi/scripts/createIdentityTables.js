// Create Identity System Tables - Simplified Migration
import db from '../config/db.js';

async function createIdentityTables() {
    console.log('🔐 Creating Converse Identity System Tables...');
    
    try {
        // 1. Enhance users table with identity masking fields
        console.log('\n📊 Enhancing users table...');
        try {
            await db.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS identity_masked_at DATETIME,
                ADD COLUMN IF NOT EXISTS avatar_config JSON,
                ADD COLUMN IF NOT EXISTS voice_config JSON,
                ADD COLUMN IF NOT EXISTS last_unmasked_by INT,
                ADD COLUMN IF NOT EXISTS last_unmasked_at DATETIME
            `);
            console.log('   ✅ Users table enhanced');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('   ⚠️  Users table already enhanced');
            } else {
                console.log('   ❌ Users table enhancement failed:', error.message);
            }
        }
        
        // Add indexes
        try {
            await db.query('CREATE INDEX IF NOT EXISTS idx_converse_id ON users(converse_id)');
            await db.query('CREATE INDEX IF NOT EXISTS idx_identity_masked ON users(is_identity_masked)');
            console.log('   ✅ Users table indexes added');
        } catch (error) {
            console.log('   ⚠️  Index creation warnings:', error.message);
        }

        // 2. Create user_profiles table for encrypted data storage
        console.log('\n📊 Creating user_profiles table...');
        await db.query(`
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
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_vault_id (vault_id)
            )
        `);
        console.log('   ✅ user_profiles table created');

        // 3. Create identity_masking_audit table
        console.log('\n📊 Creating identity_masking_audit table...');
        await db.query(`
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
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_operation_type (operation_type),
                INDEX idx_performed_by (performed_by),
                INDEX idx_created_at (createdAt),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('   ✅ identity_masking_audit table created');

        // 4. Create avatar_configurations table
        console.log('\n📊 Creating avatar_configurations table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS avatar_configurations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                avatar_type ENUM('cartoon', 'abstract', 'animal', 'robot', 'geometric') NOT NULL,
                color_scheme VARCHAR(7),
                pattern VARCHAR(100),
                custom_features JSON,
                animation_settings JSON,
                is_active TINYINT(1) DEFAULT 1,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_avatar_type (avatar_type)
            )
        `);
        console.log('   ✅ avatar_configurations table created');

        // 5. Create voice_presets table
        console.log('\n📊 Creating voice_presets table...');
        await db.query(`
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
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('   ✅ voice_presets table created');

        // 6. Create masking_sessions table
        console.log('\n📊 Creating masking_sessions table...');
        await db.query(`
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
                INDEX idx_converse_id (converse_id),
                INDEX idx_session_type (session_type),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('   ✅ masking_sessions table created');

        // 7. Create user_privacy_settings table
        console.log('\n📊 Creating user_privacy_settings table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_privacy_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                allow_mentor_unmask TINYINT(1) DEFAULT 0,
                auto_mask_video TINYINT(1) DEFAULT 1,
                auto_mask_audio TINYINT(1) DEFAULT 1,
                sharing_preferences JSON,
                notification_settings JSON,
                emergency_contact_encrypted JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('   ✅ user_privacy_settings table created');

        // 8. Create emergency_unmask_requests table
        console.log('\n📊 Creating emergency_unmask_requests table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS emergency_unmask_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_id VARCHAR(32) UNIQUE NOT NULL,
                target_user_id INT NOT NULL,
                requesting_admin_id INT NOT NULL,
                request_reason TEXT NOT NULL,
                legal_justification TEXT,
                approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                approved_by_admin_id INT,
                approval_reason TEXT,
                expiry_date DATETIME,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_request_id (request_id),
                INDEX idx_target_user (target_user_id),
                INDEX idx_requesting_admin (requesting_admin_id),
                INDEX idx_approval_status (approval_status),
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (requesting_admin_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('   ✅ emergency_unmask_requests table created');

        console.log('\n🎉 All Identity System tables created successfully!');
        
        // Final verification
        console.log('\n📊 Final verification...');
        const tables = [
            'user_profiles',
            'identity_masking_audit', 
            'avatar_configurations',
            'voice_presets',
            'masking_sessions',
            'user_privacy_settings',
            'emergency_unmask_requests'
        ];
        
        let successCount = 0;
        for (const tableName of tables) {
            try {
                const result = await db.query(`SHOW TABLES LIKE '${tableName}'`);
                if (result.length > 0) {
                    console.log(`   ✅ ${tableName}`);
                    successCount++;
                } else {
                    console.log(`   ❌ ${tableName} missing`);
                }
            } catch (error) {
                console.log(`   ❌ Error checking ${tableName}: ${error.message}`);
            }
        }
        
        console.log(`\n🎯 Result: ${successCount}/${tables.length} tables created successfully`);
        
    } catch (error) {
        console.error('❌ Identity system setup failed:', error.message);
    } finally {
        process.exit(0);
    }
}

createIdentityTables();