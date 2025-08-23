// ikootaapi/controllers/classTestController.js
// DIAGNOSTIC CONTROLLERS FOR CLASS SYSTEM

import db from '../config/db.js';

/**
 * Test basic database connection and class system
 */
export const testClassSystemConnection = async (req, res) => {
  try {
    console.log('🔍 Testing class system connection...');
    
    const tests = [];
    
    // Test 1: Basic database connection
    try {
      await db.query('SELECT 1 as test');
      tests.push({ test: 'database_connection', status: 'PASS', message: 'Connected' });
    } catch (error) {
      tests.push({ test: 'database_connection', status: 'FAIL', message: error.message });
    }

    // Test 2: Classes table exists
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM classes LIMIT 1');
      const count = Array.isArray(result) ? result[0]?.count : result?.count;
      tests.push({ test: 'classes_table', status: 'PASS', message: `Table accessible, found ${count || 0} classes` });
    } catch (error) {
      tests.push({ test: 'classes_table', status: 'FAIL', message: error.message });
    }

    // Test 3: User_class_memberships table exists
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM user_class_memberships LIMIT 1');
      const count = Array.isArray(result) ? result[0]?.count : result?.count;
      tests.push({ test: 'memberships_table', status: 'PASS', message: `Table accessible, found ${count || 0} memberships` });
    } catch (error) {
      tests.push({ test: 'memberships_table', status: 'FAIL', message: error.message });
    }

    // Test 4: Check for OTU# classes
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM classes WHERE class_id LIKE ?', ['OTU#%']);
      const count = Array.isArray(result) ? result[0]?.count : result?.count;
      tests.push({ test: 'otu_classes', status: 'PASS', message: `Found ${count || 0} OTU# format classes` });
    } catch (error) {
      tests.push({ test: 'otu_classes', status: 'FAIL', message: error.message });
    }

    const allPassed = tests.every(test => test.status === 'PASS');
    const statusCode = allPassed ? 200 : 500;

    res.status(statusCode).json({
      success: allPassed,
      message: 'Class system connection test completed',
      overall_status: allPassed ? 'HEALTHY' : 'ISSUES_DETECTED',
      tests,
      timestamp: new Date().toISOString(),
      database_info: {
        query_method: 'mysql2',
        result_format: 'detected_automatically'
      }
    });

  } catch (error) {
    console.error('❌ Class system connection test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Class system connection test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Test specific class queries to diagnose parameter issues
 */
export const testSpecificClassQueries = async (req, res) => {
  try {
    console.log('🔍 Testing specific class queries...');
    
    const tests = [];
    
    // Test 1: Simple SELECT with no parameters
    try {
      const result = await db.query('SELECT class_id, class_name FROM classes LIMIT 3');
      const rows = Array.isArray(result) ? result : [result];
      tests.push({ 
        test: 'simple_select_no_params', 
        status: 'PASS', 
        message: `Retrieved ${rows.length} classes`,
        sample_data: rows.slice(0, 2)
      });
    } catch (error) {
      tests.push({ test: 'simple_select_no_params', status: 'FAIL', message: error.message });
    }

    // Test 2: SELECT with single parameter
    try {
      const result = await db.query('SELECT class_id, class_name FROM classes WHERE is_active = ? LIMIT 2', [1]);
      const rows = Array.isArray(result) ? result : [result];
      tests.push({ 
        test: 'single_parameter', 
        status: 'PASS', 
        message: `Retrieved ${rows.length} active classes`,
        sql: 'WHERE is_active = ?',
        params: [1]
      });
    } catch (error) {
      tests.push({ test: 'single_parameter', status: 'FAIL', message: error.message });
    }

    // Test 3: SELECT with multiple parameters
    try {
      const result = await db.query(
        'SELECT class_id, class_name FROM classes WHERE is_active = ? AND class_id LIKE ? LIMIT 2', 
        [1, 'OTU#%']
      );
      const rows = Array.isArray(result) ? result : [result];
      tests.push({ 
        test: 'multiple_parameters', 
        status: 'PASS', 
        message: `Retrieved ${rows.length} active OTU# classes`,
        sql: 'WHERE is_active = ? AND class_id LIKE ?',
        params: [1, 'OTU#%']
      });
    } catch (error) {
      tests.push({ test: 'multiple_parameters', status: 'FAIL', message: error.message });
    }

    // Test 4: COUNT query with parameters
    try {
      const result = await db.query(
        'SELECT COUNT(*) as total FROM classes WHERE is_active = ? AND class_id LIKE ?', 
        [1, 'OTU#%']
      );
      const count = Array.isArray(result) ? result[0]?.total : result?.total;
      tests.push({ 
        test: 'count_with_parameters', 
        status: 'PASS', 
        message: `Found ${count || 0} matching classes`,
        result_type: Array.isArray(result) ? 'array' : 'object'
      });
    } catch (error) {
      tests.push({ test: 'count_with_parameters', status: 'FAIL', message: error.message });
    }

    // Test 5: JOIN query (the problematic one)
    try {
      const result = await db.query(`
        SELECT c.class_id, c.class_name, COUNT(ucm.id) as member_count
        FROM classes c
        LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id
        WHERE c.is_active = ? AND c.class_id LIKE ?
        GROUP BY c.class_id, c.class_name
        LIMIT 2
      `, [1, 'OTU#%']);
      
      const rows = Array.isArray(result) ? result : [result];
      tests.push({ 
        test: 'join_with_parameters', 
        status: 'PASS', 
        message: `JOIN query successful, ${rows.length} results`,
        note: 'This was the problematic query type'
      });
    } catch (error) {
      tests.push({ test: 'join_with_parameters', status: 'FAIL', message: error.message, note: 'This is likely the source of the parameter mismatch' });
    }

    // Test 6: Complex dynamic query simulation
    try {
      const conditions = ['c.is_active = ?'];
      const params = [1];
      
      conditions.push('c.class_id LIKE ?');
      params.push('OTU#%');
      
      const whereClause = 'WHERE ' + conditions.join(' AND ');
      const sql = `SELECT class_id, class_name FROM classes c ${whereClause} LIMIT 1`;
      
      console.log('Testing dynamic query:', { sql, params });
      
      const result = await db.query(sql, params);
      const rows = Array.isArray(result) ? result : [result];
      
      tests.push({ 
        test: 'dynamic_query_simulation', 
        status: 'PASS', 
        message: `Dynamic query successful, ${rows.length} results`,
        generated_sql: sql,
        final_params: params
      });
    } catch (error) {
      tests.push({ test: 'dynamic_query_simulation', status: 'FAIL', message: error.message });
    }

    const allPassed = tests.every(test => test.status === 'PASS');
    const statusCode = allPassed ? 200 : 500;

    res.status(statusCode).json({
      success: allPassed,
      message: 'Specific class queries test completed',
      overall_status: allPassed ? 'ALL_QUERIES_WORKING' : 'SOME_QUERIES_FAILED',
      tests,
      recommendations: allPassed ? [
        'All basic queries are working',
        'Parameter binding is functioning correctly',
        'Ready for full class system deployment'
      ] : [
        'Check failed tests above',
        'Parameter mismatch likely in complex dynamic queries',
        'Consider simplifying query building approach'
      ],
      timestamp: new Date().toISOString(),
      mysql_info: {
        version: 'MariaDB 10.4.32',
        driver: 'mysql2',
        parameter_style: '? placeholders'
      }
    });

  } catch (error) {
    console.error('❌ Specific class queries test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Specific class queries test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};