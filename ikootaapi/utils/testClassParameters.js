// ikootaapi/utils/testClassParameters.js
// PARAMETER TEST UTILITY - VERIFY MYSQL QUERY FIXES

import db from '../config/db.js';

// Test all the problematic queries individually
const testClassParameters = async () => {
  console.log('🧪 TESTING CLASS SERVICE PARAMETER FIXES...\n');

  try {
    // Test 1: Basic classes count query
    console.log('Test 1: Basic classes count query...');
    const countSql = `SELECT COUNT(*) as total FROM classes c WHERE c.is_active = ? AND c.class_id LIKE ?`;
    const countParams = [1, 'OTU#%'];
    console.log('SQL:', countSql);
    console.log('Params:', countParams);
    
    const countResult = await db.query(countSql, countParams);
    console.log('✅ Result:', countResult[0]);

    // Test 2: Classes with joins query
    console.log('\nTest 2: Classes with joins query...');
    const joinSql = `
      SELECT 
        c.class_id,
        c.class_name,
        c.is_active,
        COALESCE(cmc.total_members, 0) as total_members
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.is_active = ? AND c.class_id LIKE ?
      LIMIT ? OFFSET ?
    `;
    const joinParams = [1, 'OTU#%', 5, 0];
    console.log('SQL:', joinSql);
    console.log('Params:', joinParams);
    
    const joinResult = await db.query(joinSql, joinParams);
    console.log('✅ Result count:', joinResult.length);

    // Test 3: User classes query
    console.log('\nTest 3: User classes query...');
    const userClassSql = `
      SELECT COUNT(*) as total 
      FROM user_class_memberships ucm 
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.membership_status = ? AND c.class_id LIKE ?
    `;
    const userClassParams = [2, 'active', 'OTU#%'];
    console.log('SQL:', userClassSql);
    console.log('Params:', userClassParams);
    
    const userClassResult = await db.query(userClassSql, userClassParams);
    console.log('✅ Result:', userClassResult[0]);

    // Test 4: Available classes query (the problematic one)
    console.log('\nTest 4: Available classes query...');
    const availableSql = `
      SELECT COUNT(*) as total 
      FROM classes c 
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id 
      WHERE c.is_active = ? 
      AND c.class_id LIKE ?
      AND c.allow_self_join = ?
      AND c.class_id NOT IN (
        SELECT class_id 
        FROM user_class_memberships 
        WHERE user_id = ? AND membership_status IN ('active', 'pending')
      )
      AND (c.max_members > COALESCE(cmc.total_members, 0))
    `;
    const availableParams = [1, 'OTU#%', 1, 2];
    console.log('SQL:', availableSql);
    console.log('Params:', availableParams);
    
    const availableResult = await db.query(availableSql, availableParams);
    console.log('✅ Result:', availableResult[0]);

    // Test 5: User classes with LIMIT/OFFSET
    console.log('\nTest 5: User classes with LIMIT/OFFSET...');
    const userClassMainSql = `
      SELECT 
        c.class_id,
        c.class_name,
        ucm.role_in_class,
        ucm.membership_status
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.membership_status = ? AND c.class_id LIKE ?
      ORDER BY ucm.joinedAt DESC
      LIMIT ? OFFSET ?
    `;
    const userClassMainParams = [2, 'active', 'OTU#%', 10, 0];
    console.log('SQL:', userClassMainSql);
    console.log('Params:', userClassMainParams);
    
    const userClassMainResult = await db.query(userClassMainSql, userClassMainParams);
    console.log('✅ Result count:', userClassMainResult.length);

    console.log('\n🎉 ALL PARAMETER TESTS PASSED!');
    console.log('✅ No parameter mismatch errors detected');
    console.log('✅ MySQL queries are working correctly');
    
    return {
      success: true,
      message: 'All parameter tests passed',
      test_results: {
        basic_count: countResult[0]?.total || 0,
        classes_with_joins: joinResult.length,
        user_classes_count: userClassResult[0]?.total || 0,
        available_classes: availableResult[0]?.total || 0,
        user_classes_with_pagination: userClassMainResult.length
      }
    };

  } catch (error) {
    console.error('❌ Parameter test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sql: error.sql?.substring(0, 200) + '...',
      params: error.params || 'N/A'
    });
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      test_failed_at: 'Parameter mismatch detected'
    };
  }
};

// Simple endpoint version for testing
export const testClassParametersEndpoint = async (req, res) => {
  try {
    const results = await testClassParameters();
    
    if (results.success) {
      res.json({
        success: true,
        message: 'Parameter tests completed successfully',
        ...results,
        timestamp: new Date().toISOString(),
        next_steps: [
          'Replace your classServices.js file with the fixed version',
          'Test the class endpoints',
          'Verify the frontend loads without 500 errors'
        ]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Parameter tests failed',
        ...results,
        timestamp: new Date().toISOString(),
        suggestions: [
          'Check MySQL version compatibility',
          'Verify database schema matches expected structure',
          'Review parameter order in SQL queries',
          'Check for missing columns in database'
        ]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test execution failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Direct execution for command line testing
if (import.meta.url === `file://${process.argv[1]}`) {
  testClassParameters().then((results) => {
    console.log('\nFinal Results:', results);
    process.exit(results.success ? 0 : 1);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default testClassParameters;