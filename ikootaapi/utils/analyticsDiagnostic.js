// // ikootaapi/utils/analyticsDiagnostic.js
// // ===============================================
// // ANALYTICS DIAGNOSTIC & REPAIR TOOL
// // Run this to identify and fix analytics issues
// // ===============================================

// import db from '../config/db.js';

// /**
//  * ✅ Comprehensive diagnostic to identify analytics issues
//  */
// export const runAnalyticsDiagnostic = async () => {
//   console.log('🔍 STARTING ANALYTICS DIAGNOSTIC...');
//   console.log('================================================================================');
  
//   const results = {
//     timestamp: new Date().toISOString(),
//     databaseConnection: false,
//     tableStructure: {},
//     dataIntegrity: {},
//     potentialIssues: [],
//     recommendations: []
//   };

//   try {
//     // 1. Test database connection
//     console.log('\n1. 🔌 Testing database connection...');
//     await db.query('SELECT 1 as test');
//     results.databaseConnection = true;
//     console.log('✅ Database connection: OK');

//     // 2. Check table structure
//     console.log('\n2. 📋 Checking table structure...');
    
//     // Check users table
//     const [usersStructure] = await db.query('DESCRIBE users');
//     results.tableStructure.users = usersStructure;
//     console.log(`✅ Users table: ${usersStructure.length} columns found`);
    
//     // Check surveylog table
//     const [surveylogStructure] = await db.query('DESCRIBE surveylog');
//     results.tableStructure.surveylog = surveylogStructure;
//     console.log(`✅ Surveylog table: ${surveylogStructure.length} columns found`);
    
//     // Check for reviewedAt vs reviewedAt
//     const hasReviewedAt = surveylogStructure.some(col => col.Field === 'reviewedAt');
//     const hasReviewedAtSnake = surveylogStructure.some(col => col.Field === 'reviewedAt');
    
//     if (!hasReviewedAt && hasReviewedAtSnake) {
//       results.potentialIssues.push('⚠️ Database uses reviewedAt instead of reviewedAt');
//       results.recommendations.push('Update analyticsService.js to use reviewedAt field name');
//     } else if (hasReviewedAt) {
//       console.log('✅ ReviewedAt field found (camelCase)');
//     } else {
//       results.potentialIssues.push('❌ No reviewedAt or reviewedAt field found');
//     }

//     // 3. Check data integrity
//     console.log('\n3. 🔍 Checking data integrity...');
    
//     // Check users count
//     const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
//     results.dataIntegrity.totalUsers = userCount[0].count;
//     console.log(`📊 Total users: ${userCount[0].count}`);
    
//     // Check surveylog count
//     const [surveyCount] = await db.query('SELECT COUNT(*) as count FROM surveylog');
//     results.dataIntegrity.totalSurveys = surveyCount[0].count;
//     console.log(`📊 Total survey records: ${surveyCount[0].count}`);
    
//     // Check for null application_type
//     const [nullAppType] = await db.query(`
//       SELECT COUNT(*) as count 
//       FROM surveylog 
//       WHERE application_type IS NULL
//     `);
//     if (nullAppType[0].count > 0) {
//       results.potentialIssues.push(`⚠️ ${nullAppType[0].count} surveylog records have NULL application_type`);
//       results.recommendations.push('Consider updating NULL application_type to "initial_application"');
//     }
    
//     // Check for processing issues
//     const fieldName = hasReviewedAt ? 'reviewedAt' : 'reviewedAt';
//     const [processingCheck] = await db.query(`
//       SELECT 
//         COUNT(*) as total,
//         COUNT(${fieldName}) as reviewed,
//         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending
//       FROM surveylog
//     `);
    
//     results.dataIntegrity.processing = processingCheck[0];
//     console.log(`📊 Processing stats: ${processingCheck[0].reviewed}/${processingCheck[0].total} reviewed, ${processingCheck[0].pending} pending`);

//     // 4. Test specific problematic queries
//     console.log('\n4. 🧪 Testing problematic queries...');
    
//     try {
//       // Test the applicationStats query
//       const [testAppStats] = await db.query(`
//         SELECT 
//           COALESCE(application_type, 'initial_application') as application_type,
//           COUNT(*) as total_applications
//         FROM surveylog
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//         GROUP BY application_type
//         LIMIT 5
//       `);
      
//       if (Array.isArray(testAppStats)) {
//         console.log(`✅ Application stats query: OK (${testAppStats.length} results)`);
//         results.dataIntegrity.applicationStatsWorking = true;
//       } else {
//         results.potentialIssues.push('❌ Application stats query returns non-array');
//       }
      
//     } catch (queryError) {
//       results.potentialIssues.push(`❌ Application stats query failed: ${queryError.message}`);
//     }
    
//     try {
//       // Test the processing stats query
//       const [testProcessingStats] = await db.query(`
//         SELECT 
//           COALESCE(application_type, 'initial_application') as application_type,
//           COUNT(*) as total_processed
//         FROM surveylog
//         WHERE ${fieldName} IS NOT NULL
//         GROUP BY application_type
//         LIMIT 5
//       `);
      
//       if (Array.isArray(testProcessingStats)) {
//         console.log(`✅ Processing stats query: OK (${testProcessingStats.length} results)`);
//         results.dataIntegrity.processingStatsWorking = true;
//       } else {
//         results.potentialIssues.push('❌ Processing stats query returns non-array');
//       }
      
//     } catch (queryError) {
//       results.potentialIssues.push(`❌ Processing stats query failed: ${queryError.message}`);
//     }

//     // 5. Check for common MySQL issues
//     console.log('\n5. ⚙️ Checking MySQL configuration...');
    
//     try {
//       const [sqlMode] = await db.query("SELECT @@sql_mode as mode");
//       console.log(`📋 SQL Mode: ${sqlMode[0].mode}`);
      
//       if (sqlMode[0].mode.includes('ONLY_FULL_GROUP_BY')) {
//         results.potentialIssues.push('⚠️ ONLY_FULL_GROUP_BY is enabled - may cause GROUP BY issues');
//         results.recommendations.push('Consider adjusting GROUP BY clauses or SQL mode');
//       }
//     } catch (error) {
//       console.log('⚠️ Could not check SQL mode');
//     }

//   } catch (error) {
//     console.error('❌ Diagnostic failed:', error);
//     results.potentialIssues.push(`Critical error: ${error.message}`);
//   }

//   // Generate report
//   console.log('\n================================================================================');
//   console.log('📋 DIAGNOSTIC SUMMARY');
//   console.log('================================================================================');
  
//   console.log(`🔌 Database Connection: ${results.databaseConnection ? '✅ OK' : '❌ FAILED'}`);
//   console.log(`👥 Total Users: ${results.dataIntegrity.totalUsers || 'Unknown'}`);
//   console.log(`📝 Total Surveys: ${results.dataIntegrity.totalSurveys || 'Unknown'}`);
  
//   if (results.potentialIssues.length > 0) {
//     console.log('\n🚨 ISSUES FOUND:');
//     results.potentialIssues.forEach((issue, index) => {
//       console.log(`   ${index + 1}. ${issue}`);
//     });
//   } else {
//     console.log('\n✅ No issues detected!');
//   }
  
//   if (results.recommendations.length > 0) {
//     console.log('\n💡 RECOMMENDATIONS:');
//     results.recommendations.forEach((rec, index) => {
//       console.log(`   ${index + 1}. ${rec}`);
//     });
//   }
  
//   console.log('\n================================================================================');
  
//   return results;
// };

// /**
//  * ✅ Generate fix script based on diagnostic results
//  */
// export const generateFixScript = async () => {
//   console.log('🔧 GENERATING FIX SCRIPT...');
  
//   const diagnostic = await runAnalyticsDiagnostic();
  
//   let fixScript = `-- ANALYTICS FIX SCRIPT
// -- Generated: ${new Date().toISOString()}
// -- Run these queries to fix common analytics issues

// `;

//   // Check for column name issues
//   const surveylogCols = diagnostic.tableStructure.surveylog || [];
//   const hasReviewedAt = surveylogCols.some(col => col.Field === 'reviewedAt');
//   const hasReviewedAtSnake = surveylogCols.some(col => col.Field === 'reviewedAt');
  
//   if (!hasReviewedAt && hasReviewedAtSnake) {
//     fixScript += `-- Fix 1: Add camelCase alias for reviewedAt
// -- The analytics service expects 'reviewedAt' but your database uses 'reviewedAt'
// -- Either update your service to use 'reviewedAt' or add this alias:

// `;
//   }
  
//   // Fix NULL application_type
//   fixScript += `-- Fix 2: Update NULL application_type values
// UPDATE surveylog 
// SET application_type = 'initial_application' 
// WHERE application_type IS NULL;

// -- Fix 3: Ensure approval_status has default values
// UPDATE surveylog 
// SET approval_status = 'pending' 
// WHERE approval_status IS NULL;

// -- Fix 4: Add indexes for better performance
// CREATE INDEX IF NOT EXISTS idx_surveylog_application_type ON surveylog(application_type);
// CREATE INDEX IF NOT EXISTS idx_surveylog_approval_status ON surveylog(approval_status);
// CREATE INDEX IF NOT EXISTS idx_surveylog_createdAt ON surveylog(createdAt);
// CREATE INDEX IF NOT EXISTS idx_users_membership_stage ON users(membership_stage);
// CREATE INDEX IF NOT EXISTS idx_users_is_member ON users(is_member);

// -- Fix 5: Verify data integrity
// SELECT 
//   'Users' as table_name,
//   COUNT(*) as total_records,
//   COUNT(CASE WHEN membership_stage IS NOT NULL THEN 1 END) as with_membership_stage,
//   COUNT(CASE WHEN is_member IS NOT NULL THEN 1 END) as with_is_member
// FROM users
// WHERE role = 'user'

// UNION ALL

// SELECT 
//   'Surveylog' as table_name,
//   COUNT(*) as total_records,
//   COUNT(CASE WHEN application_type IS NOT NULL THEN 1 END) as with_application_type,
//   COUNT(CASE WHEN approval_status IS NOT NULL THEN 1 END) as with_approval_status
// FROM surveylog;
// `;

//   console.log('✅ Fix script generated');
//   console.log('📝 Copy and run the following SQL:');
//   console.log('================================================================================');
//   console.log(fixScript);
//   console.log('================================================================================');
  
//   return {
//     diagnostic,
//     fixScript,
//     timestamp: new Date().toISOString()
//   };
// };

// /**
//  * ✅ Quick test of analytics endpoints
//  */
// export const testAnalyticsEndpoints = async () => {
//   console.log('🧪 TESTING ANALYTICS FUNCTIONS...');
  
//   try {
//     // Import the service functions
//     const { 
//       getMembershipAnalyticsData, 
//       getMembershipStatsData,
//       getMembershipOverviewData 
//     } = await import('../services/analyticsService.js');
    
//     // Test analytics
//     console.log('\n📊 Testing getMembershipAnalyticsData...');
//     try {
//       const analytics = await getMembershipAnalyticsData({ period: '30d', detailed: false });
//       console.log('✅ Analytics function: OK');
//       console.log(`   - Application stats: ${analytics.applicationStats?.length || 0} records`);
//       console.log(`   - Conversion funnel: ${JSON.stringify(analytics.conversionFunnel)}`);
//     } catch (error) {
//       console.log(`❌ Analytics function failed: ${error.message}`);
//     }
    
//     // Test stats
//     console.log('\n📈 Testing getMembershipStatsData...');
//     try {
//       const stats = await getMembershipStatsData();
//       console.log('✅ Stats function: OK');
//       console.log(`   - Processing stats: ${stats.processingStats?.length || 0} records`);
//       console.log(`   - Total users: ${stats.stats?.total_users || 0}`);
//     } catch (error) {
//       console.log(`❌ Stats function failed: ${error.message}`);
//     }
    
//     // Test overview
//     console.log('\n🔍 Testing getMembershipOverviewData...');
//     try {
//       const overview = await getMembershipOverviewData();
//       console.log('✅ Overview function: OK');
//       console.log(`   - Status distribution: ${overview.statusDistribution?.length || 0} records`);
//       console.log(`   - Recent activity: ${overview.recentActivity?.length || 0} records`);
//     } catch (error) {
//       console.log(`❌ Overview function failed: ${error.message}`);
//     }
    
//   } catch (importError) {
//     console.log(`❌ Could not import analytics service: ${importError.message}`);
//   }
  
//   console.log('\n✅ Analytics testing complete');
// };

// // Export for CLI usage
// if (import.meta.url === `file://${process.argv[1]}`) {
//   // Run diagnostic if called directly
//   generateFixScript().catch(console.error);
// }