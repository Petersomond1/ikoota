// Test identity audit trail query
import db from '../config/db.js';

async function testAuditTrailQuery() {
  try {
    console.log('🔍 Testing identity audit trail query...');
    
    const result = await db.query(`
      SELECT 
        iam.*,
        u.username as target_username,
        admin.username as admin_username
      FROM identity_masking_audit iam
      LEFT JOIN users u ON iam.user_id = u.id
      LEFT JOIN users admin ON iam.masked_by_admin_id COLLATE utf8mb4_general_ci = admin.converse_id COLLATE utf8mb4_general_ci
      WHERE 1=1
      ORDER BY iam.createdAt DESC
      LIMIT 10 OFFSET 0
    `);
    
    console.log('✅ Query executed successfully');
    console.log('Results count:', result.length);
    if (result.length > 0) {
      console.log('First result:', result[0]);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('❌ Error code:', error.code);
    process.exit(1);
  }
}

testAuditTrailQuery();