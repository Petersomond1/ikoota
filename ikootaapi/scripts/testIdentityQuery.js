// Test identity dashboard query
import db from '../config/db.js';

async function testIdentityQuery() {
  try {
    console.log('🔍 Testing identity dashboard query...');
    
    const result = await db.query(`
      SELECT 
        (SELECT COUNT(DISTINCT user_id) FROM identity_masks WHERE is_active = 1) as totalMaskedUsers,
        (SELECT COUNT(*) FROM identity_masks WHERE is_active = 1) as activeMasks,
        (SELECT COUNT(*) FROM identity_masks WHERE expiresAt IS NOT NULL AND expiresAt < NOW()) as expiredMasks,
        (SELECT COUNT(DISTINCT created_by) FROM identity_masks WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as adminsInvolved,
        (SELECT COUNT(*) FROM identity_masking_audit WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recentActions
    `);
    
    console.log('✅ Query executed successfully');
    console.log('Result:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('❌ Error code:', error.code);
    process.exit(1);
  }
}

testIdentityQuery();