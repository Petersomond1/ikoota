// Check database structure for identity system
import db from '../config/db.js';

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking actual database tables and columns...');
    
    // Check what tables exist
    console.log('\n📋 Available tables:');
    const tables = await db.query('SHOW TABLES');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log('  -', tableName);
    });
    
    // Check specific tables we need for identity dashboard
    const identityTables = ['identity_masks', 'identity_masking_audit', 'users', 'user_profiles', 'masking_sessions'];
    
    for (const tableName of identityTables) {
      console.log('\n📊 Checking table:', tableName);
      try {
        const tableExists = await db.query('SHOW TABLES LIKE ?', [tableName]);
        if (tableExists.length > 0) {
          console.log('  ✅ Table exists');
          const columns = await db.query('DESCRIBE ??', [tableName]);
          console.log('  📝 Columns:');
          columns.forEach(col => {
            console.log(`    - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
          });
        } else {
          console.log('  ❌ Table does not exist');
        }
      } catch (error) {
        console.log('  ❌ Error checking table:', error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseStructure();