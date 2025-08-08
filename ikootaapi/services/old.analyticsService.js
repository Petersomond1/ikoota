// ikootaapi/services/analyticsService.js
// ===============================================
// UNIVERSAL ANALYTICS SERVICE - WORKS WITH ANY COLUMN NAMING
// Auto-detects your database column names and adapts queries
// ===============================================

import db from '../config/db.js';

// Cache for column names to avoid repeated DESCRIBE queries
let columnCache = null;

/**
 * ✅ AUTO-DETECT: Get the correct column names for your database
 */
const getColumnNames = async () => {
  if (columnCache) {
    return columnCache;
  }

  try {
    console.log('🔍 Auto-detecting database column names...');
    
    const [surveylogCols] = await db.query('DESCRIBE surveylog');
    const [usersCols] = await db.query('DESCRIBE users');
    
    const surveylogFields = surveylogCols.map(col => col.Field);
    const usersFields = usersCols.map(col => col.Field);
    
    // Detect reviewed date column
    let reviewedField = null;
    if (surveylogFields.includes('reviewedAt')) {
      reviewedField = 'reviewedAt';
    } else if (surveylogFields.includes('reviewedAt')) {
      reviewedField = 'reviewedAt';
    } else if (surveylogFields.includes('reviewed')) {
      reviewedField = 'reviewed';
    } else if (surveylogFields.includes('review_date')) {
      reviewedField = 'review_date';
    }
    
    // Detect created date column
    let createdField = null;
    if (surveylogFields.includes('createdAt')) {
      createdField = 'createdAt';
    } else if (surveylogFields.includes('createdAt')) {
      createdField = 'createdAt';
    } else if (surveylogFields.includes('created')) {
      createdField = 'created';
    } else if (surveylogFields.includes('date_created')) {
      createdField = 'date_created';
    }
    
    // Detect users created date column
    let usersCreatedField = null;
    if (usersFields.includes('createdAt')) {
      usersCreatedField = 'createdAt';
    } else if (usersFields.includes('createdAt')) {
      usersCreatedField = 'createdAt';
    } else if (usersFields.includes('created')) {
      usersCreatedField = 'created';
    } else if (usersFields.includes('date_created')) {
      usersCreatedField = 'date_created';
    }
    
    columnCache = {
      surveylog: {
        reviewed: reviewedField,
        created: createdField,
        allFields: surveylogFields
      },
      users: {
        created: usersCreatedField,
        allFields: usersFields
      }
    };
    
    console.log('✅ Column detection complete:', {
      surveylogReviewed: reviewedField || 'NOT FOUND',
      surveylogCreated: createdField || 'NOT FOUND',
      usersCreated: usersCreatedField || 'NOT FOUND'
    });
    
    return columnCache;
    
  } catch (error) {
    console.error('❌ Error detecting column names:', error);
    // Fallback to common names
    columnCache = {
      surveylog: {
        reviewed: 'reviewedAt',
        created: 'createdAt'
      },
      users: {
        created: 'createdAt'
      }
    };
    return columnCache;
  }
};

/**
 * ✅ SAFE QUERY EXECUTOR: Always returns arrays and handles errors
 */
const executeQuery = async (query, params = []) => {
  try {
    console.log('🔍 Executing query...');
    const result = await db.query(query, params);
    
    // Ensure we always return an array
    let resultArray;
    if (Array.isArray(result)) {
      resultArray = result[0] || [];
    } else if (result && Array.isArray(result[0])) {
      resultArray = result[0];
    } else {
      console.warn('⚠️ Query result is not in expected format, forcing to array');
      resultArray = [];
    }
    
    // Ensure the result is actually an array
    if (!Array.isArray(resultArray)) {
      console.warn('⚠️ Result is still not an array, converting...');
      resultArray = resultArray ? [resultArray] : [];
    }
    
    console.log(`✅ Query executed successfully, returned ${resultArray.length} records`);
    return resultArray;
    
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    return []; // Always return empty array on error
  }
};

/**
 * ✅ UNIVERSAL: Get comprehensive membership analytics data
 */
export const getMembershipAnalyticsData = async ({ period = '30d', detailed = false }) => {
  try {
    console.log('🔍 Fetching membership analytics data...');
    
    const columns = await getColumnNames();
    const reviewedField = columns.surveylog.reviewed;
    const createdField = columns.surveylog.created;
    const usersCreatedField = columns.users.created;
    
    if (!createdField) {
      throw new Error('Cannot find created date column in surveylog table');
    }
    
    // Calculate date range based on period
    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = `AND ${createdField} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
        break;
      case '30d':
        dateFilter = `AND ${createdField} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
        break;
      case '90d':
        dateFilter = `AND ${createdField} >= DATE_SUB(NOW(), INTERVAL 90 DAY)`;
        break;
      case '1y':
        dateFilter = `AND ${createdField} >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`;
        break;
      default:
        dateFilter = `AND ${createdField} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }

    // Build application stats query with proper column names
    let avgProcessingDays = '0';
    if (reviewedField) {
      avgProcessingDays = `AVG(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END)`;
    }
    
    const applicationStatsQuery = `
      SELECT 
        COALESCE(application_type, 'initial_application') as application_type,
        COUNT(*) as total_applications,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
        ${avgProcessingDays} as avg_processing_days
      FROM surveylog
      WHERE 1=1 ${dateFilter}
      GROUP BY application_type
    `;

    const applicationStats = await executeQuery(applicationStatsQuery);
    console.log('📊 Application stats retrieved:', applicationStats.length, 'records');

    // Get conversion funnel data
    const usersDateFilter = usersCreatedField ? 
      dateFilter.replace(createdField, usersCreatedField) : 
      dateFilter.replace(createdField, 'createdAt'); // fallback

    const conversionQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN is_member IN ('pre_member', 'member') THEN 1 END) as approved_initial,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
      FROM users
      WHERE role = 'user' ${usersDateFilter}
    `;

    const conversionData = await executeQuery(conversionQuery);
    const safeConversionData = conversionData.length > 0 ? conversionData[0] : {
      total_registrations: 0,
      approved_initial: 0,
      full_members: 0
    };

    // Get time series data if detailed
    let timeSeries = [];
    if (detailed && usersCreatedField) {
      const timeSeriesQuery = `
        SELECT 
          DATE(${usersCreatedField}) as date,
          COUNT(*) as registrations,
          COUNT(CASE WHEN is_member IN ('pre_member', 'member') THEN 1 END) as approvals
        FROM users
        WHERE role = 'user' ${usersDateFilter}
        GROUP BY DATE(${usersCreatedField})
        ORDER BY date DESC
        LIMIT 30
      `;
      
      timeSeries = await executeQuery(timeSeriesQuery);
    }

    // ✅ SAFE: Calculate totals with proper array handling
    const totalApplications = Array.isArray(applicationStats) && applicationStats.length > 0 
      ? applicationStats.reduce((sum, app) => sum + (parseInt(app.total_applications) || 0), 0)
      : 0;

    const analytics = {
      applicationStats: Array.isArray(applicationStats) ? applicationStats : [],
      conversionFunnel: {
        total_registrations: parseInt(safeConversionData.total_registrations) || 0,
        started_application: totalApplications,
        approved_initial: parseInt(safeConversionData.approved_initial) || 0,
        full_members: parseInt(safeConversionData.full_members) || 0
      },
      timeSeries: Array.isArray(timeSeries) ? timeSeries : [],
      period,
      timestamp: new Date().toISOString(),
      metadata: {
        columnsUsed: {
          reviewedField: reviewedField || 'none',
          createdField,
          usersCreatedField: usersCreatedField || 'unknown'
        },
        totalApplications,
        hasDetailedData: detailed && timeSeries.length > 0
      }
    };

    console.log('✅ Analytics data fetched successfully');
    return analytics;

  } catch (error) {
    console.error('❌ Error in getMembershipAnalyticsData:', error);
    
    // Return safe fallback data
    return {
      applicationStats: [],
      conversionFunnel: {
        total_registrations: 0,
        started_application: 0,
        approved_initial: 0,
        full_members: 0
      },
      timeSeries: [],
      period,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * ✅ UNIVERSAL: Get membership overview data
 */
export const getMembershipOverviewData = async () => {
  try {
    console.log('🔍 Fetching membership overview data...');

    const columns = await getColumnNames();
    const reviewedField = columns.surveylog.reviewed;
    const createdField = columns.surveylog.created;

    // Get current status distribution
    const statusQuery = `
      SELECT 
        COALESCE(membership_stage, 'none') as membership_stage,
        COALESCE(is_member, 'not_applied') as is_member,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY membership_stage, is_member
    `;
    
    const statusDistribution = await executeQuery(statusQuery);

    // Get recent activity
    let recentActivity = [];
    if (createdField) {
      const recentActivityQuery = `
        SELECT 
          COALESCE(application_type, 'unknown') as application_type,
          COALESCE(approval_status, 'pending') as approval_status,
          COUNT(*) as count,
          ${reviewedField ? `MAX(${reviewedField})` : 'NULL'} as latest_review
        FROM surveylog
        WHERE ${createdField} >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY application_type, approval_status
      `;
      
      recentActivity = await executeQuery(recentActivityQuery);
    }

    // Get pending items
    const pendingQuery = `
      SELECT 
        'initial_application' as type,
        COUNT(*) as count
      FROM surveylog
      WHERE approval_status = 'pending' 
        AND COALESCE(application_type, 'initial_application') = 'initial_application'
      
      UNION ALL
      
      SELECT 
        'full_membership' as type,
        COALESCE(COUNT(*), 0) as count
      FROM full_membership_applications
      WHERE status = 'pending'
    `;

    const pendingItems = await executeQuery(pendingQuery);

    const overview = {
      statusDistribution: Array.isArray(statusDistribution) ? statusDistribution : [],
      recentActivity: Array.isArray(recentActivity) ? recentActivity : [],
      pendingItems: Array.isArray(pendingItems) ? pendingItems : [],
      timestamp: new Date().toISOString(),
      metadata: {
        columnsUsed: columns.surveylog
      }
    };

    console.log('✅ Overview data fetched successfully');
    return overview;

  } catch (error) {
    console.error('❌ Error in getMembershipOverviewData:', error);
    
    return {
      statusDistribution: [],
      recentActivity: [],
      pendingItems: [],
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * ✅ UNIVERSAL: Get detailed membership statistics
 */
export const getMembershipStatsData = async () => {
  try {
    console.log('🔍 Fetching membership stats data...');

    const columns = await getColumnNames();
    const reviewedField = columns.surveylog.reviewed;
    const createdField = columns.surveylog.created;
    const usersCreatedField = columns.users.created;

    // Get overall statistics
    const overallQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN is_member = 'applied' THEN 1 END) as applicants,
        COUNT(CASE WHEN ${usersCreatedField || 'createdAt'} >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_registrations
      FROM users
      WHERE role = 'user'
    `;

    const overallStats = await executeQuery(overallQuery);
    const safeOverallStats = overallStats.length > 0 ? overallStats[0] : {
      total_users: 0,
      pre_members: 0,
      full_members: 0,
      applicants: 0,
      new_registrations: 0
    };

    // Get processing statistics (only if we have the reviewed field)
    let processingStats = [];
    if (reviewedField && createdField) {
      const processingQuery = `
        SELECT 
          COALESCE(application_type, 'initial_application') as application_type,
          AVG(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as avg_processing_days,
          MIN(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as min_processing_days,
          MAX(CASE WHEN ${reviewedField} IS NOT NULL THEN DATEDIFF(${reviewedField}, ${createdField}) END) as max_processing_days,
          COUNT(*) as total_processed
        FROM surveylog
        WHERE ${reviewedField} IS NOT NULL
        GROUP BY application_type
      `;
      
      processingStats = await executeQuery(processingQuery);
    }

    // Get conversion rates
    const conversionQuery = `
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN is_member IN ('pre_member', 'member') THEN 1 END) / COUNT(*) * 100)
          ELSE 0 
        END as conversion_to_pre_member,
        CASE 
          WHEN COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) > 0 
          THEN (COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) / COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) * 100)
          ELSE 0 
        END as conversion_to_full_member
      FROM users
      WHERE role = 'user' AND ${usersCreatedField || 'createdAt'} >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    `;

    const conversionStats = await executeQuery(conversionQuery);
    const safeConversionStats = conversionStats.length > 0 ? conversionStats[0] : {
      conversion_to_pre_member: 0,
      conversion_to_full_member: 0
    };

    // ✅ SAFE: Find processing stats with array validation
    const initialAppStats = Array.isArray(processingStats) 
      ? processingStats.find(p => p.application_type === 'initial_application')
      : null;
    const avgApprovalDays = initialAppStats ? parseFloat(initialAppStats.avg_processing_days) || 0 : 0;

    const stats = {
      stats: {
        total_users: parseInt(safeOverallStats.total_users) || 0,
        pre_members: parseInt(safeOverallStats.pre_members) || 0,
        full_members: parseInt(safeOverallStats.full_members) || 0,
        applicants: parseInt(safeOverallStats.applicants) || 0,
        new_registrations: parseInt(safeOverallStats.new_registrations) || 0,
        conversion_to_pre_member: parseFloat(safeConversionStats.conversion_to_pre_member) || 0,
        conversion_to_full_member: parseFloat(safeConversionStats.conversion_to_full_member) || 0,
        avg_approval_days: avgApprovalDays
      },
      processingStats: Array.isArray(processingStats) ? processingStats : [],
      timestamp: new Date().toISOString(),
      metadata: {
        columnsUsed: columns,
        hasProcessingData: processingStats.length > 0
      }
    };

    console.log('✅ Stats data fetched successfully');
    return stats;

  } catch (error) {
    console.error('❌ Error in getMembershipStatsData:', error);
    
    return {
      stats: {
        total_users: 0,
        pre_members: 0,
        full_members: 0,
        applicants: 0,
        new_registrations: 0,
        conversion_to_pre_member: 0,
        conversion_to_full_member: 0,
        avg_approval_days: 0
      },
      processingStats: [],
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * ✅ UNIVERSAL: Export membership data as CSV
 */
export const exportMembershipDataCSV = async (filters = {}) => {
  try {
    console.log('🔍 Exporting membership data...');

    const columns = await getColumnNames();
    const reviewedField = columns.surveylog.reviewed;
    const createdField = columns.surveylog.created;
    const usersCreatedField = columns.users.created;

    const exportQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        COALESCE(u.membership_stage, 'none') as membership_stage,
        COALESCE(u.is_member, 'not_applied') as is_member,
        u.${usersCreatedField || 'createdAt'} as registration_date,
        COALESCE(sl.approval_status, 'not_submitted') as approval_status,
        sl.${createdField || 'createdAt'} as application_date,
        ${reviewedField ? `sl.${reviewedField}` : 'NULL'} as review_date,
        COALESCE(reviewer.username, 'Not reviewed') as reviewed_by
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id 
        AND COALESCE(sl.application_type, 'initial_application') = 'initial_application'
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE u.role = 'user'
      ORDER BY u.${usersCreatedField || 'createdAt'} DESC
    `;

    const membershipData = await executeQuery(exportQuery);

    console.log('✅ Membership data exported successfully');
    return {
      data: Array.isArray(membershipData) ? membershipData : [],
      timestamp: new Date().toISOString(),
      recordCount: Array.isArray(membershipData) ? membershipData.length : 0,
      metadata: {
        columnsUsed: columns
      }
    };

  } catch (error) {
    console.error('❌ Error in exportMembershipDataCSV:', error);
    
    return {
      data: [],
      timestamp: new Date().toISOString(),
      recordCount: 0,
      error: error.message
    };
  }
};

/**
 * ✅ Helper function to convert data to CSV format
 */
export const convertToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('⚠️ No data provided for CSV conversion');
    return '';
  }
  
  try {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }
        return String(value);
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  } catch (error) {
    console.error('❌ Error converting to CSV:', error);
    return '';
  }
};

/**
 * ✅ Health check for analytics system
 */
export const getAnalyticsHealthCheck = async () => {
  try {
    const columns = await getColumnNames();
    const userCount = await executeQuery('SELECT COUNT(*) as count FROM users');
    const surveyCount = await executeQuery('SELECT COUNT(*) as count FROM surveylog');
    
    return {
      status: 'healthy',
      userCount: userCount[0]?.count || 0,
      surveyCount: surveyCount[0]?.count || 0,
      columnsDetected: columns,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};


