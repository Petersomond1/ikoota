// Run Converse Identity System Database Migration
import db from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';

async function runIdentityMigration() {
    console.log('🔐 Running Converse Identity System Database Migration...');
    
    try {
        // Read the migration file
        const migrationPath = path.join(process.cwd(), '..', 'database_migrations', 'enhance_converse_identity.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Split by semicolons and filter out empty statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📊 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`   ⏳ Executing statement ${i + 1}/${statements.length}...`);
            
            try {
                await db.query(statement);
                console.log(`   ✅ Statement ${i + 1} completed`);
            } catch (error) {
                if (error.message.includes('duplicate') || 
                    error.message.includes('already exists') ||
                    error.message.includes('Duplicate column name')) {
                    console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
                } else {
                    console.log(`   ❌ Statement ${i + 1} failed: ${error.message}`);
                }
            }
        }
        
        console.log('\n✅ Converse Identity System migration completed!');
        
        // Verify identity system tables
        console.log('\n📊 Verifying identity system tables...');
        const tables = [
            'user_profiles',
            'identity_masking_audit', 
            'avatar_configurations',
            'voice_presets',
            'masking_sessions',
            'user_privacy_settings',
            'emergency_unmask_requests'
        ];
        
        for (const tableName of tables) {
            try {
                const result = await db.query(`SHOW TABLES LIKE '${tableName}'`);
                if (result.length > 0) {
                    console.log(`   ✅ Table ${tableName} exists`);
                } else {
                    console.log(`   ❌ Table ${tableName} missing`);
                }
            } catch (error) {
                console.log(`   ❌ Error checking table ${tableName}: ${error.message}`);
            }
        }
        
        // Check if users table has identity columns
        console.log('\n📊 Verifying users table enhancements...');
        try {
            const columns = await db.query('DESCRIBE users');
            const identityColumns = ['is_identity_masked', 'identity_masked_at', 'avatar_config', 'voice_config'];
            
            for (const colName of identityColumns) {
                const hasColumn = columns.some(col => col.Field === colName);
                console.log(`   ${hasColumn ? '✅' : '❌'} Column ${colName} ${hasColumn ? 'exists' : 'missing'}`);
            }
        } catch (error) {
            console.log(`   ❌ Error checking users table: ${error.message}`);
        }
        
        console.log('\n🎉 Identity system verification completed!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
}

runIdentityMigration();