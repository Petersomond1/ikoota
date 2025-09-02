// Fix Identity System Database Structure Issues
import db from '../config/db.js';

async function fixIdentityTables() {
    console.log('🔧 Fixing Identity System Database Structure...');
    
    try {
        // Fix 1: Check and add missing columns to existing tables
        console.log('\n📊 Checking table structures...');
        
        // Check user_profiles table
        try {
            const userProfileCols = await db.query('DESCRIBE user_profiles');
            const hasVaultId = userProfileCols.some(col => col.Field === 'vault_id');
            
            if (!hasVaultId) {
                console.log('   🔧 Adding vault_id column to user_profiles...');
                await db.query('ALTER TABLE user_profiles ADD COLUMN vault_id VARCHAR(32) AFTER user_id');
                await db.query('CREATE INDEX idx_vault_id ON user_profiles(vault_id)');
                console.log('   ✅ vault_id column added');
            } else {
                console.log('   ✅ user_profiles table structure correct');
            }
        } catch (error) {
            console.log('   ❌ Error checking user_profiles:', error.message);
        }
        
        // Check identity_masking_audit table
        try {
            const auditCols = await db.query('DESCRIBE identity_masking_audit');
            const hasOperationType = auditCols.some(col => col.Field === 'operation_type');
            
            if (!hasOperationType) {
                console.log('   🔧 Adding operation_type column to identity_masking_audit...');
                await db.query(`
                    ALTER TABLE identity_masking_audit 
                    ADD COLUMN operation_type ENUM('MASK', 'UNMASK', 'VIEW', 'UPDATE', 'EXPORT') NOT NULL DEFAULT 'VIEW' AFTER user_id
                `);
                console.log('   ✅ operation_type column added');
            } else {
                console.log('   ✅ identity_masking_audit table structure correct');
            }
        } catch (error) {
            console.log('   ❌ Error checking identity_masking_audit:', error.message);
        }
        
        // Fix 2: Add missing columns to users table (MySQL compatible)
        console.log('\n🔧 Enhancing users table...');
        try {
            const userCols = await db.query('DESCRIBE users');
            const missingCols = [];
            
            if (!userCols.some(col => col.Field === 'identity_masked_at')) missingCols.push('identity_masked_at');
            if (!userCols.some(col => col.Field === 'avatar_config')) missingCols.push('avatar_config');
            if (!userCols.some(col => col.Field === 'voice_config')) missingCols.push('voice_config');
            if (!userCols.some(col => col.Field === 'last_unmasked_by')) missingCols.push('last_unmasked_by');
            if (!userCols.some(col => col.Field === 'last_unmasked_at')) missingCols.push('last_unmasked_at');
            
            for (const colName of missingCols) {
                try {
                    let colDefinition = '';
                    switch (colName) {
                        case 'identity_masked_at':
                            colDefinition = 'ADD COLUMN identity_masked_at DATETIME NULL';
                            break;
                        case 'avatar_config':
                            colDefinition = 'ADD COLUMN avatar_config JSON NULL';
                            break;
                        case 'voice_config':
                            colDefinition = 'ADD COLUMN voice_config JSON NULL';
                            break;
                        case 'last_unmasked_by':
                            colDefinition = 'ADD COLUMN last_unmasked_by INT NULL';
                            break;
                        case 'last_unmasked_at':
                            colDefinition = 'ADD COLUMN last_unmasked_at DATETIME NULL';
                            break;
                    }
                    
                    await db.query(`ALTER TABLE users ${colDefinition}`);
                    console.log(`   ✅ Added column ${colName} to users table`);
                } catch (error) {
                    if (error.message.includes('Duplicate column')) {
                        console.log(`   ⚠️  Column ${colName} already exists`);
                    } else {
                        console.log(`   ❌ Failed to add ${colName}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.log('   ❌ Error enhancing users table:', error.message);
        }
        
        // Fix 3: Create indexes for performance
        console.log('\n📊 Creating performance indexes...');
        const indexes = [
            { table: 'users', index: 'idx_converse_id_masked', columns: '(converse_id, is_identity_masked)' },
            { table: 'identity_masking_audit', index: 'idx_user_operation', columns: '(user_id, operation_type)' },
            { table: 'user_profiles', index: 'idx_user_avatar', columns: '(user_id, avatar_type)' },
            { table: 'masking_sessions', index: 'idx_session_user', columns: '(session_id, user_id)' }
        ];
        
        for (const idx of indexes) {
            try {
                await db.query(`CREATE INDEX ${idx.index} ON ${idx.table}${idx.columns}`);
                console.log(`   ✅ Index ${idx.index} created`);
            } catch (error) {
                if (error.message.includes('Duplicate key name')) {
                    console.log(`   ⚠️  Index ${idx.index} already exists`);
                } else {
                    console.log(`   ❌ Failed to create index ${idx.index}:`, error.message);
                }
            }
        }
        
        console.log('\n🎉 Database structure fixes completed!');
        
        // Verification
        console.log('\n📊 Verification...');
        const tables = [
            'user_profiles',
            'identity_masking_audit',
            'avatar_configurations', 
            'voice_presets',
            'masking_sessions',
            'user_privacy_settings',
            'emergency_unmask_requests'
        ];
        
        let verifiedCount = 0;
        for (const tableName of tables) {
            try {
                const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`);
                console.log(`   ✅ ${tableName}: operational (${result[0].count} records)`);
                verifiedCount++;
            } catch (error) {
                console.log(`   ❌ ${tableName}: error - ${error.message}`);
            }
        }
        
        console.log(`\n🎯 Result: ${verifiedCount}/${tables.length} tables operational`);
        
    } catch (error) {
        console.error('❌ Database fix failed:', error.message);
    } finally {
        process.exit(0);
    }
}

fixIdentityTables();