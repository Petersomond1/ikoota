// // checkColumns.js - Save this file in your ikootaapi directory and run it
// import db from '../config/db.js';

// async function checkColumns() {
//   try {
//     console.log('🔍 Checking database columns...\n');
    
//     // Check surveylog table
//     console.log('📋 SURVEYLOG TABLE COLUMNS:');
//     const [surveylogCols] = await db.query('DESCRIBE surveylog');
//     surveylogCols.forEach((col, index) => {
//       console.log(`  ${index + 1}. ${col.Field} (${col.Type}) ${col.Null === 'YES' ? '- nullable' : '- not null'}`);
//     });
    
//     // Check users table  
//     console.log('\n📋 USERS TABLE COLUMNS:');
//     const [usersCols] = await db.query('DESCRIBE users');
//     usersCols.forEach((col, index) => {
//       console.log(`  ${index + 1}. ${col.Field} (${col.Type}) ${col.Null === 'YES' ? '- nullable' : '- not null'}`);
//     });
    
//     // Check for specific problematic columns
//     console.log('\n🔍 CRITICAL COLUMN ANALYSIS:');
    
//     const hasReviewedAt = surveylogCols.some(col => col.Field === 'reviewedAt');
//     const hasReviewedAtSnake = surveylogCols.some(col => col.Field === 'reviewedAt');
//     const hasCreatedAt = surveylogCols.some(col => col.Field === 'createdAt');
//     const hasCreatedAtSnake = surveylogCols.some(col => col.Field === 'createdAt');
    
//     console.log(`  reviewedAt (camelCase): ${hasReviewedAt ? '✅ FOUND' : '❌ NOT FOUND'}`);
//     console.log(`  reviewedAt (snake_case): ${hasReviewedAtSnake ? '✅ FOUND' : '❌ NOT FOUND'}`);
//     console.log(`  createdAt (camelCase): ${hasCreatedAt ? '✅ FOUND' : '❌ NOT FOUND'}`);
//     console.log(`  createdAt (snake_case): ${hasCreatedAtSnake ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
//     // Test a simple query to see what happens
//     console.log('\n🧪 TESTING SIMPLE QUERY:');
//     try {
//       const [testResults] = await db.query('SELECT COUNT(*) as count FROM surveylog LIMIT 1');
//       console.log(`  Query result type: ${Array.isArray(testResults) ? 'Array' : typeof testResults}`);
//       console.log(`  Query result: ${JSON.stringify(testResults)}`);
      
//       if (Array.isArray(testResults) && testResults.length > 0) {
//         console.log('  ✅ Database returns arrays correctly');
//       } else {
//         console.log('  ⚠️ Database result format may be causing issues');
//       }
//     } catch (queryError) {
//       console.log(`  ❌ Test query failed: ${queryError.message}`);
//     }
    
//     // Test the problematic analytics query
//     console.log('\n🧪 TESTING ANALYTICS QUERY:');
//     try {
//       const dateField = hasCreatedAt ? 'createdAt' : hasCreatedAtSnake ? 'createdAt' : 'createdAt';
//       const testQuery = `
//         SELECT 
//           COALESCE(application_type, 'initial_application') as application_type,
//           COUNT(*) as total_applications
//         FROM surveylog
//         WHERE ${dateField} >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//         GROUP BY application_type
//       `;
      
//       console.log(`  Using date field: ${dateField}`);
//       const [analyticsResults] = await db.query(testQuery);
      
//       console.log(`  Result type: ${Array.isArray(analyticsResults) ? 'Array' : typeof analyticsResults}`);
//       console.log(`  Result count: ${Array.isArray(analyticsResults) ? analyticsResults.length : 'N/A'}`);
      
//       if (Array.isArray(analyticsResults)) {
//         console.log('  ✅ Analytics query returns array');
//         if (analyticsResults.length > 0) {
//           console.log(`  Sample result: ${JSON.stringify(analyticsResults[0])}`);
//         } else {
//           console.log('  ⚠️ Analytics query returns empty array');
//         }
//       } else {
//         console.log('  ❌ Analytics query does NOT return array - THIS IS THE PROBLEM!');
//       }
      
//     } catch (analyticsError) {
//       console.log(`  ❌ Analytics test query failed: ${analyticsError.message}`);
//     }
    
//     // Test the specific survey query that's failing
//     console.log('\n🧪 TESTING SURVEY QUERY (THE FAILING ONE):');
//     try {
//       const reviewField = hasReviewedAt ? 'reviewedAt' : hasReviewedAtSnake ? 'reviewedAt' : null;
      
//       if (!reviewField) {
//         console.log('  ❌ NO REVIEWED FIELD FOUND - This is why your survey is failing!');
//         console.log('  💡 SOLUTION: Add reviewedAt column or update your code to not use it');
//       } else {
//         const surveyTestQuery = `
//           SELECT 
//             sl.id,
//             sl.user_id,
//             sl.approval_status,
//             sl.createdAt,
//             sl.${reviewField},
//             u.username
//           FROM surveylog sl
//           INNER JOIN users u ON sl.user_id = u.id
//           ORDER BY sl.createdAt DESC
//           LIMIT 5
//         `;
        
//         console.log(`  Using reviewed field: ${reviewField}`);
//         const [surveyResults] = await db.query(surveyTestQuery);
        
//         console.log(`  ✅ Survey query works! Found ${surveyResults.length} records`);
//         if (surveyResults.length > 0) {
//           console.log(`  Sample: ${JSON.stringify(surveyResults[0])}`);
//         }
//       }
      
//     } catch (surveyError) {
//       console.log(`  ❌ Survey test query failed: ${surveyError.message}`);
//     }
    
//     // Provide fix recommendations
//     console.log('\n💡 RECOMMENDATIONS:');
    
//     if (!hasReviewedAt && !hasReviewedAtSnake) {
//       console.log('  ❌ CRITICAL: No reviewed date column found!');
//       console.log('     SOLUTION 1: Add the column with:');
//       console.log('     ALTER TABLE surveylog ADD COLUMN reviewedAt DATETIME NULL;');
//       console.log('     SOLUTION 2: Update your code to not use reviewed date');
//     } else {
//       const reviewField = hasReviewedAt ? 'reviewedAt' : 'reviewedAt';
//       console.log(`  ✅ Use "${reviewField}" for reviewed date queries`);
//     }
    
//     if (!hasCreatedAt && !hasCreatedAtSnake) {
//       console.log('  ❌ CRITICAL: No created date column found!');
//     } else {
//       const createField = hasCreatedAt ? 'createdAt' : 'createdAt';
//       console.log(`  ✅ Use "${createField}" for created date queries`);
//     }
    
//     console.log('\n📝 NEXT STEPS:');
//     console.log('  1. If reviewedAt column is missing, add it to your database');
//     console.log('  2. Update your surveyServices.js to use the correct column names');
//     console.log('  3. Replace your analyticsService.js with the universal version');
//     console.log('  4. Test your endpoints again');
    
//     process.exit(0);
    
//   } catch (error) {
//     console.error('❌ Error checking columns:', error);
//     process.exit(1);
//   }
// }

// checkColumns();