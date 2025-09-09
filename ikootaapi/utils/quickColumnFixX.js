// // ikootaapi/utils/quickColumnFix.js
// // ===============================================
// // QUICK FIX FOR COLUMN NAMING ISSUES
// // Run this to identify and fix the reviewedAt vs reviewedAt issue
// // ===============================================

// import db from '../config/db.js';

// /**
//  * ✅ Check what column names your database actually uses
//  */
// export const checkColumnNames = async () => {
//   try {
//     console.log('🔍 Checking database column names...');
    
//     // Check surveylog table structure
//     const [surveylogCols] = await db.query('DESCRIBE surveylog');
    
//     console.log('\n📋 SURVEYLOG TABLE COLUMNS:');
//     surveylogCols.forEach(col => {
//       console.log(`   - ${col.Field} (${col.Type})`);
//     });
    
//     // Check for specific columns
//     const hasReviewedAt = surveylogCols.some(col => col.Field === 'reviewedAt');
//     const hasReviewedAtSnake = surveylogCols.some(col => col.Field === 'reviewedAt');
//     const hasCreatedAt = surveylogCols.some(col => col.Field === 'createdAt');
//     const hasCreatedAtSnake = surveylogCols.some(col => col.Field === 'createdAt');
    
//     console.log('\n🔍 COLUMN NAME ANALYSIS:');
//     console.log(`   reviewedAt (camelCase): ${hasReviewedAt ? '✅ Found' : '❌ Not found'}`);
//     console.log(`   reviewedAt (snake_case): ${hasReviewedAtSnake ? '✅ Found' : '❌ Not found'}`);
//     console.log(`   createdAt (camelCase): ${hasCreatedAt ? '✅ Found' : '❌ Not found'}`);
//     console.log(`   createdAt (snake_case): ${hasCreatedAtSnake ? '✅ Found' : '❌ Not found'}`);
    
//     // Determine the correct field names to use
//     const correctReviewedField = hasReviewedAt ? 'reviewedAt' : hasReviewedAtSnake ? 'reviewedAt' : null;
//     const correctCreatedField = hasCreatedAt ? 'createdAt' : hasCreatedAtSnake ? 'createdAt' : null;
    
//     console.log('\n💡 RECOMMENDED FIELD NAMES FOR YOUR DATABASE:');
//     console.log(`   Reviewed field: ${correctReviewedField || 'NOT FOUND!'}`);
//     console.log(`   Created field: ${correctCreatedField || 'NOT FOUND!'}`);
    
//     if (!correctReviewedField) {
//       console.log('\n❌ CRITICAL ISSUE: No reviewed date field found!');
//       console.log('   You may need to add this column or check your table structure.');
//     }
    
//     return {
//       hasReviewedAt,
//       hasReviewedAtSnake,
//       hasCreatedAt,
//       hasCreatedAtSnake,
//       correctReviewedField,
//       correctCreatedField,
//       allColumns: surveylogCols
//     };
    
//   } catch (error) {
//     console.error('❌ Error checking column names:', error);
//     throw error;
//   }
// };

// /**
//  * ✅ Generate the correct analytics service based on your column names
//  */
// export const generateCorrectAnalyticsService = async () => {
//   const columnInfo = await checkColumnNames();
  
//   if (!columnInfo.correctReviewedField || !columnInfo.correctCreatedField) {
//     console.log('❌ Cannot generate service - missing required columns');
//     return null;
//   }
  
//   const reviewedField = columnInfo.correctReviewedField;
//   const createdField = columnInfo.correctCreatedField;
  
//   console.log(`\n🔧 GENERATING ANALYTICS SERVICE FOR YOUR DATABASE...`);
//   console.log(`   Using reviewed field: ${reviewedField}`);
//   console.log(`   Using created field: ${createdField}`);
  
//   // Generate the corrected query examples
//   const correctedQueries = {
//     applicationStats: `
//       SELECT 
//         COALESCE(application_type, 'initial_application') as application_type,
//         COUNT(*) as total_applications,
//         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
//         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
//         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
//         AVG(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as avg_processing_days
//       FROM surveylog
//       WHERE 1=1 AND ${createdField} >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY application_type
//     `,
    
//     processingStats: `
//       SELECT 
//         COALESCE(application_type, 'initial_application') as application_type,
//         AVG(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as avg_processing_days,
//         MIN(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as min_processing_days,
//         MAX(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as max_processing_days,
//         COUNT(*) as total_processed
//       FROM surveylog
//       WHERE ${reviewedField} IS NOT NULL
//       GROUP BY application_type
//     `,
    
//     recentActivity: `
//       SELECT 
//         COALESCE(application_type, 'unknown') as application_type,
//         COALESCE(approval_status, 'pending') as approval_status,
//         COUNT(*) as count,
//         MAX(${reviewedField}) as latest_review
//       FROM surveylog
//       WHERE ${createdField} >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//       GROUP BY application_type, approval_status
//     `
//   };
  
//   console.log('\n📝 CORRECTED QUERIES FOR YOUR DATABASE:');
//   console.log('================================================================================');
  
//   Object.entries(correctedQueries).forEach(([queryName, query]) => {
//     console.log(`\n-- ${queryName}:`);
//     console.log(query);
//   });
  
//   console.log('\n================================================================================');
//   console.log('💡 UPDATE YOUR analyticsService.js:');
//   console.log(`   1. Replace all instances of "reviewedAt" with "${reviewedField}"`);
//   console.log(`   2. Replace all instances of "createdAt" with "${createdField}"`);
//   console.log('   3. Test the queries above to ensure they work');
  
//   return {
//     columnInfo,
//     correctedQueries,
//     replacements: {
//       reviewedAt: reviewedField,
//       createdAt: createdField
//     }
//   };
// };

// /**
//  * ✅ Test a specific query to see if it works
//  */
// export const testQuery = async (queryName) => {
//   try {
//     const columnInfo = await checkColumnNames();
//     const reviewedField = columnInfo.correctReviewedField;
//     const createdField = columnInfo.correctCreatedField;
    
//     if (!reviewedField || !createdField) {
//       console.log('❌ Cannot test - missing required columns');
//       return;
//     }
    
//     console.log(`\n🧪 Testing ${queryName} query...`);
    
//     let testQuery;
//     switch (queryName) {
//       case 'applicationStats':
//         testQuery = `
//           SELECT 
//             COALESCE(application_type, 'initial_application') as application_type,
//             COUNT(*) as total_applications
//           FROM surveylog
//           WHERE ${createdField} >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//           GROUP BY application_type
//           LIMIT 5
//         `;
//         break;
        
//       case 'processingStats':
//         testQuery = `
//           SELECT 
//             COALESCE(application_type, 'initial_application') as application_type,
//             COUNT(*) as total_processed
//           FROM surveylog
//           WHERE ${reviewedField} IS NOT NULL
//           GROUP BY application_type
//           LIMIT 5
//         `;
//         break;
        
//       default:
//         console.log('❌ Unknown query name');
//         return;
//     }
    
//     const [results] = await db.query(testQuery);
    
//     console.log(`✅ Query executed successfully!`);
//     console.log(`📊 Results: ${Array.isArray(results) ? results.length : 'Not an array!'} records`);
    
//     if (Array.isArray(results) && results.length > 0) {
//       console.log('📋 Sample data:');
//       results.slice(0, 3).forEach((row, index) => {
//         console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
//       });
//     }
    
//     return results;
    
//   } catch (error) {
//     console.error(`❌ Query test failed:`, error.message);
//     return null;
//   }
// };

// // CLI interface
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const command = process.argv[2];
  
//   switch (command) {
//     case 'check':
//       checkColumnNames().catch(console.error);
//       break;
//     case 'generate':
//       generateCorrectAnalyticsService().catch(console.error);
//       break;
//     case 'test':
//       const queryName = process.argv[3] || 'applicationStats';
//       testQuery(queryName).catch(console.error);
//       break;
//     default:
//       console.log('Usage:');
//       console.log('  node quickColumnFix.js check     - Check column names');
//       console.log('  node quickColumnFix.js generate  - Generate correct queries');
//       console.log('  node quickColumnFix.js test [queryName] - Test a specific query');
//   }
// }