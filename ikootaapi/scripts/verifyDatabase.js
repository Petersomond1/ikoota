// ikootaapi/scripts/verifyDatabase.js
// ===============================================
// DATABASE VERIFICATION SCRIPT - COMPLETE VERSION
// Run this to verify your database setup
// ===============================================

import db from '../config/db.js';

const verifyDatabase = async () => {
  try {
    console.log('🔍 Verifying database setup...\n');

    // 1. Test basic connection
    console.log('1. Testing database connection...');
    const [connectionTest] = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log(`   Current time: ${connectionTest[0].current_time}\n`);

    // 2. Check full_membership_applications table
    console.log('2. Checking full_membership_applications table...');
    const [appCount] = await db.query('SELECT COUNT(*) as count FROM full_membership_applications');
    console.log(`✅ Table exists with ${appCount[0].count} records`);
    
    // Check table structure
    const [appStructure] = await db.query('DESCRIBE full_membership_applications');
    console.log('   Table structure:');
    appStructure.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });
    console.log('');

    // 3. Check users table
    console.log('3. Checking users table...');
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role IN ("admin", "super_admin")');
    console.log(`✅ Users table exists with ${userCount[0].count} admin users`);
    
    // Show sample admin users
    const [adminUsers] = await db.query('SELECT id, username, email, role FROM users WHERE role IN ("admin", "super_admin") LIMIT 3');
    if (adminUsers.length > 0) {
      console.log('   Admin users:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ID: ${user.id}`);
      });
    }
    console.log('');

    // 4. Check for sample data
    console.log('4. Checking for sample full membership applications...');
    const [sampleApps] = await db.query(`
      SELECT 
        fma.id, 
        fma.status, 
        fma.submittedAt,
        u.username,
        u.email
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      ORDER BY fma.submittedAt DESC
      LIMIT 5
    `);
    
    if (sampleApps.length > 0) {
      console.log(`✅ Found ${sampleApps.length} sample applications:`);
      sampleApps.forEach(app => {
        console.log(`   - ID: ${app.id}, User: ${app.username}, Status: ${app.status}, Submitted: ${app.submittedAt}`);
      });
    } else {
      console.log('⚠️  No full membership applications found');
      console.log('   You may want to create some test data');
    }
    console.log('');

    // 5. Status distribution
    console.log('5. Application status distribution...');
    const [statusDist] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM full_membership_applications 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    if (statusDist.length > 0) {
      console.log('✅ Status distribution:');
      statusDist.forEach(stat => {
        console.log(`   - ${stat.status}: ${stat.count}`);
      });
    } else {
      console.log('⚠️  No status data available');
    }
    console.log('');

    // 6. Check for potential issues
    console.log('6. Checking for potential issues...');
    
    // Check for orphaned applications (users that don't exist)
    const [orphaned] = await db.query(`
      SELECT COUNT(*) as count 
      FROM full_membership_applications fma
      LEFT JOIN users u ON fma.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    if (orphaned[0].count > 0) {
      console.log(`⚠️  Found ${orphaned[0].count} orphaned applications (user doesn't exist)`);
    } else {
      console.log('✅ No orphaned applications found');
    }

    // Check for users with membership_stage inconsistencies
    const [inconsistent] = await db.query(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.membership_stage = 'member' 
      AND (fma.status IS NULL OR fma.status != 'approved')
    `);
    
    if (inconsistent[0].count > 0) {
      console.log(`⚠️  Found ${inconsistent[0].count} users with inconsistent membership status`);
    } else {
      console.log('✅ No membership status inconsistencies found');
    }

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Database connection: ✅ Working`);
    console.log(`   - full_membership_applications table: ✅ Available`);
    console.log(`   - users table: ✅ Available`);
    console.log(`   - Admin users: ✅ ${userCount[0].count} found`);
    console.log(`   - Sample applications: ${sampleApps.length > 0 ? '✅' : '⚠️'} ${sampleApps.length} found`);

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check your database connection in config/db.js');
    console.error('   2. Ensure the database and tables exist');
    console.error('   3. Verify your database credentials');
    console.error('   4. Make sure MySQL server is running');
    throw error;
  }
};

// Create sample test data function
const createSampleData = async () => {
  try {
    console.log('🔧 Creating sample test data...\n');

    // Check if we already have sample data
    const [existing] = await db.query('SELECT COUNT(*) as count FROM full_membership_applications');
    if (existing[0].count > 5) {
      console.log(`⚠️  Found ${existing[0].count} existing applications. Skipping sample data creation.`);
      return;
    }

    // Find a pre_member user to create application for
    const [preMemberUsers] = await db.query(`
      SELECT id, username, email 
      FROM users 
      WHERE membership_stage = 'pre_member' 
      AND id NOT IN (SELECT user_id FROM full_membership_applications)
      LIMIT 3
    `);

    if (preMemberUsers.length === 0) {
      console.log('⚠️  No pre_member users found to create sample applications');
      console.log('   Creating a sample pre_member user first...');
      
      // Create a sample pre_member user
      const timestamp = Date.now();
      const sampleUser = {
        username: `test_premember_${timestamp}`,
        email: `test${timestamp}@example.com`,
        password_hash: '$2b$10$sample.hash.for.testing.purposes.only',
        membership_stage: 'pre_member',
        is_member: 'pre_member',
        role: 'user'
      };

      const [insertResult] = await db.query(`
        INSERT INTO users (
          username, email, password_hash, membership_stage, is_member, role, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        sampleUser.username,
        sampleUser.email, 
        sampleUser.password_hash,
        sampleUser.membership_stage,
        sampleUser.is_member,
        sampleUser.role
      ]);

      console.log(`✅ Created sample pre_member user: ${sampleUser.username} (ID: ${insertResult.insertId})`);
      
      // Add to our users array
      preMemberUsers.push({
        id: insertResult.insertId,
        username: sampleUser.username,
        email: sampleUser.email
      });
    }

    // Create sample applications
    const sampleAnswers = [
      {
        whyFullMembership: "I want to contribute more to the community and help other members grow.",
        contributionPlans: "I plan to mentor new members and share my expertise in web development.",
        educationalGoals: "To deepen my understanding of advanced programming concepts and leadership.",
        communityInvolvement: "I want to organize study groups and contribute to open source projects.",
        previousExperience: "I have 5 years of experience in software development and have mentored junior developers.",
        availability: "Available evenings and weekends for community activities.",
        specialSkills: "Full-stack development, project management, and technical writing.",
        mentorshipInterest: true,
        researchInterests: "Machine learning applications in web development",
        collaborationStyle: "I prefer collaborative approach with regular check-ins and feedback sessions."
      },
      {
        whyFullMembership: "I believe I can contribute significantly to the community's growth.",
        contributionPlans: "Organize workshops and help with technical documentation.",
        educationalGoals: "Learn advanced system design and architecture patterns.",
        communityInvolvement: "Active participation in code reviews and technical discussions.",
        previousExperience: "3 years in backend development with focus on API design.",
        availability: "Flexible schedule, can dedicate 10-15 hours per week.",
        specialSkills: "Database optimization, API development, and DevOps.",
        mentorshipInterest: true,
        researchInterests: "Microservices architecture and scalability",
        collaborationStyle: "Prefer structured approach with clear milestones."
      },
      {
        whyFullMembership: "Ready to take on more responsibility and leadership roles.",
        contributionPlans: "Lead technical initiatives and guide junior members.",
        educationalGoals: "Master distributed systems and cloud architecture.",
        communityInvolvement: "Host regular tech talks and organize hackathons.",
        previousExperience: "Senior developer with 7+ years, team lead experience.",
        availability: "Can commit 15-20 hours per week to community activities.",
        specialSkills: "System architecture, team leadership, and technical strategy.",
        mentorshipInterest: true,
        researchInterests: "Cloud computing and distributed systems",
        collaborationStyle: "Agile methodology with emphasis on continuous feedback."
      }
    ];

    for (let i = 0; i < Math.min(preMemberUsers.length, 3); i++) {
      const user = preMemberUsers[i];
      const ticketId = `FM-${Date.now()}-${user.id}`;
      const answers = sampleAnswers[i] || sampleAnswers[0];

      await db.query(`
        INSERT INTO full_membership_applications (
          user_id, 
          membership_ticket, 
          answers, 
          status, 
          submittedAt
        ) VALUES (?, ?, ?, 'pending', NOW())
      `, [user.id, ticketId, JSON.stringify(answers)]);

      console.log(`✅ Created sample application for user: ${user.username} (ID: ${user.id})`);
    }

    console.log(`\n🎉 Created ${Math.min(preMemberUsers.length, 3)} sample applications!`);

  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
    throw error;
  }
};

// Create admin user if none exists
const createAdminUser = async () => {
  try {
    console.log('🔧 Checking for admin users...\n');

    const [adminUsers] = await db.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role IN ('admin', 'super_admin')
    `);

    if (adminUsers[0].count > 0) {
      console.log(`✅ Found ${adminUsers[0].count} admin users. No need to create more.`);
      
      // Show existing admin users
      const [existing] = await db.query(`
        SELECT id, username, email, role 
        FROM users 
        WHERE role IN ('admin', 'super_admin') 
        LIMIT 5
      `);
      
      console.log('   Existing admin users:');
      existing.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ID: ${user.id}`);
      });
      
      return;
    }

    console.log('⚠️  No admin users found. Creating sample admin user...');

    const timestamp = Date.now();
    const adminUser = {
      username: `admin_${timestamp}`,
      email: `admin${timestamp}@example.com`,
      password_hash: '$2b$10$sampleAdminHashForTestingPurposesOnly.DoNotUseInProduction',
      membership_stage: 'member',
      is_member: 'member',
      role: 'super_admin'
    };

    const [insertResult] = await db.query(`
      INSERT INTO users (
        username, email, password_hash, membership_stage, is_member, role, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      adminUser.username,
      adminUser.email,
      adminUser.password_hash,
      adminUser.membership_stage,
      adminUser.is_member,
      adminUser.role
    ]);

    console.log(`✅ Created admin user: ${adminUser.username} (ID: ${insertResult.insertId})`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('\n⚠️  Remember to change the password before using in production!');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
};

// Full database setup (creates everything needed)
const fullSetup = async () => {
  try {
    console.log('🚀 Running full database setup...\n');
    
    console.log('Step 1: Database Verification');
    console.log('=============================');
    await verifyDatabase();
    
    console.log('\nStep 2: Admin User Setup');
    console.log('========================');
    await createAdminUser();
    
    console.log('\nStep 3: Sample Data Creation');
    console.log('============================');
    await createSampleData();
    
    console.log('\n🎉 Full database setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✅ Verified database connection and tables');
    console.log('   ✅ Ensured admin user exists (created if needed)');
    console.log('   ✅ Created sample pre_member users (if needed)');
    console.log('   ✅ Created sample full membership applications');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Test your admin endpoints: node scripts/testAdminEndpoints.js --quick');
    console.log('   2. Update your frontend to use the new API endpoints');
    console.log('   3. Test the full application review workflow');
    
    console.log('\n🔑 Admin Access:');
    console.log('   Use the admin user created above to test the endpoints');
    console.log('   Generate a JWT token for that user to use in API calls');

  } catch (error) {
    console.error('❌ Full setup failed:', error);
    throw error;
  }
};

// Cleanup test data
const cleanupTestData = async () => {
  try {
    console.log('🧹 Cleaning up test data...\n');
    
    console.log('⚠️  This will remove test users and applications created by this script');
    console.log('   Removing test applications...');
    
    // Remove test applications first (due to foreign key constraints)
    const [testApps] = await db.query(`
      DELETE fma FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE u.username LIKE 'test_%' 
      OR u.email LIKE 'test%@example.com'
      OR u.username LIKE 'admin_%'
    `);
    
    console.log(`   Removed ${testApps.affectedRows || 0} test applications`);
    
    // Remove test users
    console.log('   Removing test users...');
    const [testUsers] = await db.query(`
      DELETE FROM users 
      WHERE username LIKE 'test_%' 
      OR email LIKE 'test%@example.com'
      OR (username LIKE 'admin_%' AND email LIKE 'admin%@example.com')
    `);
    
    console.log(`   Removed ${testUsers.affectedRows || 0} test users`);
    
    console.log('\n✅ Test data cleanup completed');

  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
    throw error;
  }
};

// Validate table structure
const validateTableStructure = async () => {
  try {
    console.log('🔍 Validating table structures...\n');
    
    // Check full_membership_applications table structure
    console.log('Checking full_membership_applications table...');
    const [fmaColumns] = await db.query('DESCRIBE full_membership_applications');
    const requiredFmaColumns = [
      'id', 'user_id', 'membership_ticket', 'answers', 'status', 
      'submittedAt', 'reviewedAt', 'reviewed_by', 'admin_notes'
    ];
    
    const missingFmaColumns = requiredFmaColumns.filter(col => 
      !fmaColumns.some(dbCol => dbCol.Field === col)
    );
    
    if (missingFmaColumns.length > 0) {
      console.log('❌ Missing columns in full_membership_applications:', missingFmaColumns);
      console.log('   Run this SQL to add missing columns:');
      
      const alterStatements = {
        'reviewedAt': 'ALTER TABLE full_membership_applications ADD COLUMN reviewedAt TIMESTAMP NULL;',
        'reviewed_by': 'ALTER TABLE full_membership_applications ADD COLUMN reviewed_by INT NULL;',
        'admin_notes': 'ALTER TABLE full_membership_applications ADD COLUMN admin_notes TEXT NULL;'
      };
      
      missingFmaColumns.forEach(col => {
        if (alterStatements[col]) {
          console.log(`   ${alterStatements[col]}`);
        }
      });
    } else {
      console.log('✅ full_membership_applications table structure is correct');
    }
    
    // Check users table structure
    console.log('\nChecking users table...');
    const [userColumns] = await db.query('DESCRIBE users');
    const requiredUserColumns = [
      'id', 'username', 'email', 'role', 'membership_stage', 'is_member'
    ];
    
    const missingUserColumns = requiredUserColumns.filter(col => 
      !userColumns.some(dbCol => dbCol.Field === col)
    );
    
    if (missingUserColumns.length > 0) {
      console.log('❌ Missing required columns in users table:', missingUserColumns);
    } else {
      console.log('✅ users table structure is correct');
    }
    
    return missingFmaColumns.length === 0 && missingUserColumns.length === 0;
    
  } catch (error) {
    console.error('❌ Table structure validation failed:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--create-samples')) {
      await createSampleData();
    } else if (args.includes('--create-admin')) {
      await createAdminUser();
    } else if (args.includes('--full-setup')) {
      await fullSetup();
    } else if (args.includes('--cleanup')) {
      await cleanupTestData();
    } else if (args.includes('--validate')) {
      await validateTableStructure();
    } else {
      await verifyDatabase();
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

console.log('\n📚 Usage:');
console.log('  node verifyDatabase.js                 # Verify database setup');
console.log('  node verifyDatabase.js --create-samples # Create sample applications');
console.log('  node verifyDatabase.js --create-admin   # Create admin user');
console.log('  node verifyDatabase.js --full-setup     # Complete setup (recommended)');
console.log('  node verifyDatabase.js --validate       # Validate table structure');
console.log('  node verifyDatabase.js --cleanup        # Remove test data');

export { 
  verifyDatabase, 
  createSampleData, 
  createAdminUser, 
  fullSetup,
  validateTableStructure,
  cleanupTestData
};