// ikootaapi/utils/checkDatabaseSchema.js
// DATABASE SCHEMA CHECKER - RUN THIS TO IDENTIFY ACTUAL TABLE STRUCTURE

import db from '../config/db.js';

const checkDatabaseSchema = async () => {
  try {
    console.log('🔍 CHECKING DATABASE SCHEMA...\n');

    // Check classes table structure
    console.log('=== CLASSES TABLE STRUCTURE ===');
    try {
      const classesColumns = await db.query('DESCRIBE classes');
      console.log('Classes table columns:');
      classesColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ Classes table not found or error:', error.message);
    }

    console.log('\n=== USER_CLASS_MEMBERSHIPS TABLE STRUCTURE ===');
    try {
      const membershipColumns = await db.query('DESCRIBE user_class_memberships');
      console.log('User class memberships table columns:');
      membershipColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ User class memberships table not found or error:', error.message);
    }

    console.log('\n=== CLASS_MEMBER_COUNTS TABLE STRUCTURE ===');
    try {
      const countsColumns = await db.query('DESCRIBE class_member_counts');
      console.log('Class member counts table columns:');
      countsColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ Class member counts table not found or error:', error.message);
    }

    // Check for sample data
    console.log('\n=== SAMPLE DATA CHECK ===');
    try {
      const classCount = await db.query('SELECT COUNT(*) as count FROM classes');
      console.log(`Total classes in database: ${classCount[0]?.count || 0}`);
      
      if (classCount[0]?.count > 0) {
        const sampleClasses = await db.query('SELECT class_id, class_name, class_type, is_public, is_active FROM classes LIMIT 3');
        console.log('Sample classes:');
        sampleClasses.forEach(cls => {
          console.log(`  - ${cls.class_id}: ${cls.class_name} (${cls.class_type}) ${cls.is_public ? 'PUBLIC' : 'PRIVATE'} ${cls.is_active ? 'ACTIVE' : 'INACTIVE'}`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking sample data:', error.message);
    }

    // Check for memberships
    try {
      const membershipCount = await db.query('SELECT COUNT(*) as count FROM user_class_memberships');
      console.log(`Total memberships in database: ${membershipCount[0]?.count || 0}`);
    } catch (error) {
      console.log('❌ Error checking memberships:', error.message);
    }

    console.log('\n=== RECOMMENDED FIXES ===');
    console.log('Based on the errors, here are the issues to fix:');
    console.log('1. ❌ Column "allow_self_join" does not exist - remove from queries');
    console.log('2. ❌ Column "require_full_membership" does not exist - remove from queries');
    console.log('3. ❌ Column "auto_approve_members" does not exist - remove from queries');
    console.log('4. ❌ Column "require_approval" does not exist - remove from queries');
    console.log('5. ❌ Array destructuring issues - fix result handling');

    console.log('\n✅ Schema check complete!\n');

  } catch (error) {
    console.error('❌ Database schema check failed:', error);
  }
};

// Export for use in startup or as utility
export default checkDatabaseSchema;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseSchema().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}