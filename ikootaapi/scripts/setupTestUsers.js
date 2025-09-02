// Setup test users for pyramidal mentorship system
import db from '../config/db.js';

async function setupTestUsers() {
    console.log('🔧 Setting up test users with identity masking (simple approach)...');
    
    try {
        // Get some non-mentor users first
        const regularUsers = await db.query(`
            SELECT converse_id, username, role 
            FROM users 
            WHERE role IN ('user', 'admin') 
            AND is_identity_masked = 0 
            LIMIT 5
        `);

        console.log(`📊 Found ${regularUsers.length} users to update:`);
        
        // Update each user individually to avoid collation issues
        for (const user of regularUsers) {
            await db.query('UPDATE users SET is_identity_masked = 1 WHERE converse_id = ?', [user.converse_id]);
            console.log(`   ✅ Updated ${user.converse_id} (${user.username})`);
        }

        // Verify the changes
        const maskedUsers = await db.query('SELECT converse_id, username, role FROM users WHERE is_identity_masked = 1');
        console.log(`\n📊 Now have ${maskedUsers.length} users with identity masking enabled`);

        console.log('\n✅ Test user setup completed!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        process.exit(0);
    }
}

setupTestUsers();
