// ikootaapi/controllers/analyticsController.js
// ===============================================
// ANALYTICS CONTROLLER - FIXED ERROR HANDLING
// Handles all analytics and reporting endpoints with robust error handling
// ===============================================

import {
  getMembershipAnalyticsData,
  getMembershipOverviewData, 
  getMembershipStatsData,
  exportMembershipDataCSV,
  convertToCSV,
  getAnalyticsHealthCheck
} from '../services/analyticsService.js';

/**
 * ✅ FIXED: Get membership analytics with comprehensive error handling
 * @route GET /api/membership/admin/analytics
 */
export const getMembershipAnalytics = async (req, res) => {
  try {
    console.log('🔍 Fetching membership analytics...');
    
    const { period = '30d', detailed = false } = req.query;
    
    // Validate period parameter
    const validPeriods = ['7d', '30d', '90d', '1y'];
    const safePeriod = validPeriods.includes(period) ? period : '30d';
    
    // Convert detailed string to boolean
    const isDetailed = detailed === 'true' || detailed === true;
    
    console.log(`📊 Analytics request: period=${safePeriod}, detailed=${isDetailed}`);
    
    const analyticsData = await getMembershipAnalyticsData({ 
      period: safePeriod, 
      detailed: isDetailed 
    });
    
    // ✅ ENHANCED: Add metadata and validation
    const response = {
      success: true,
      data: analyticsData,
      metadata: {
        requestedPeriod: period,
        usedPeriod: safePeriod,
        detailed: isDetailed,
        generatedAt: new Date().toISOString(),
        recordCounts: {
          applicationStats: analyticsData.applicationStats?.length || 0,
          timeSeries: analyticsData.timeSeries?.length || 0
        }
      },
      summary: {
        totalApplications: analyticsData.conversionFunnel?.started_application || 0,
        totalRegistrations: analyticsData.conversionFunnel?.total_registrations || 0,
        conversionRate: analyticsData.summary?.conversionRate || 0,
        avgProcessingDays: analyticsData.summary?.avgProcessingDays || 0
      }
    };
    
    console.log('✅ Analytics data retrieved successfully');
    console.log('📈 Summary:', response.summary);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in getMembershipAnalytics:', error);
    console.error('Stack trace:', error.stack);
    
    // Enhanced error response
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined,
      fallbackData: {
        applicationStats: [],
        conversionFunnel: {
          total_registrations: 0,
          started_application: 0,
          approved_initial: 0,
          full_members: 0
        },
        timeSeries: [],
        summary: {
          totalApplications: 0,
          conversionRate: 0,
          avgProcessingDays: 0
        }
      }
    });
  }
};

/**
 * ✅ FIXED: Get membership overview with better error handling
 * @route GET /api/membership/admin/membership-overview
 */
export const getMembershipOverview = async (req, res) => {
  try {
    console.log('🔍 Fetching membership overview...');
    
    const overviewData = await getMembershipOverviewData();
    
    // ✅ ENHANCED: Add computed metrics
    const response = {
      success: true,
      data: overviewData,
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCounts: {
          statusDistribution: overviewData.statusDistribution?.length || 0,
          recentActivity: overviewData.recentActivity?.length || 0,
          pendingItems: overviewData.pendingItems?.length || 0
        }
      },
      computed: {
        totalPendingItems: overviewData.pendingItems?.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0) || 0,
        totalActiveUsers: overviewData.statusDistribution?.reduce((sum, status) => sum + (parseInt(status.count) || 0), 0) || 0,
        recentActivityCount: overviewData.recentActivity?.reduce((sum, activity) => sum + (parseInt(activity.count) || 0), 0) || 0
      }
    };
    
    console.log('✅ Overview data retrieved successfully');
    console.log('📊 Computed metrics:', response.computed);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in getMembershipOverview:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined,
      fallbackData: {
        statusDistribution: [],
        recentActivity: [],
        pendingItems: [],
        computed: {
          totalPendingItems: 0,
          totalActiveUsers: 0,
          recentActivityCount: 0
        }
      }
    });
  }
};

/**
 * ✅ FIXED: Get membership statistics with comprehensive error handling
 * @route GET /api/membership/admin/membership-stats
 */
export const getMembershipStats = async (req, res) => {
  try {
    console.log('🔍 Fetching membership stats...');
    
    const statsData = await getMembershipStatsData();
    
    // ✅ ENHANCED: Add additional computed metrics
    const response = {
      success: true,
      data: statsData,
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCounts: {
          processingStats: statsData.processingStats?.length || 0
        }
      },
      computed: {
        membershipGrowthRate: statsData.stats?.new_registrations && statsData.stats?.total_users 
          ? ((statsData.stats.new_registrations / statsData.stats.total_users) * 100).toFixed(2)
          : 0,
        memberToPreMemberRatio: statsData.stats?.pre_members > 0 && statsData.stats?.full_members >= 0
          ? (statsData.stats.full_members / statsData.stats.pre_members).toFixed(2)
          : 0,
        totalProcessedApplications: statsData.processingStats?.reduce((sum, stat) => sum + (parseInt(stat.total_processed) || 0), 0) || 0
      }
    };
    
    console.log('✅ Stats data retrieved successfully');
    console.log('📈 Stats summary:', response.data.stats);
    console.log('🧮 Computed metrics:', response.computed);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in getMembershipStats:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined,
      fallbackData: {
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
        computed: {
          membershipGrowthRate: 0,
          memberToPreMemberRatio: 0,
          totalProcessedApplications: 0
        }
      }
    });
  }
};

/**
 * ✅ ENHANCED: Export membership data with multiple format support
 * @route GET /api/membership/admin/export-membership-data
 */
export const exportMembershipData = async (req, res) => {
  try {
    console.log('📥 Exporting membership data...');
    
    const { format = 'json', filters = {} } = req.query;
    
    // Parse filters if they're JSON string
    let parsedFilters = {};
    try {
      parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    } catch (parseError) {
      console.warn('⚠️ Could not parse filters, using defaults:', parseError.message);
    }
    
    const exportData = await exportMembershipDataCSV(parsedFilters);
    
    if (format === 'csv') {
      const csvContent = convertToCSV(exportData.data);
      
      if (!csvContent) {
        throw new Error('Failed to convert data to CSV format');
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="membership-export-${Date.now()}.csv"`);
      res.status(200).send(csvContent);
      
    } else {
      // JSON format (default)
      const response = {
        success: true,
        data: exportData.data,
        metadata: {
          recordCount: exportData.recordCount,
          generatedAt: exportData.timestamp,
          format: 'json',
          filters: parsedFilters
        }
      };
      
      res.status(200).json(response);
    }
    
    console.log(`✅ Membership data exported successfully (${format.toUpperCase()}, ${exportData.recordCount} records)`);
    
  } catch (error) {
    console.error('❌ Error in exportMembershipData:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to export membership data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
};

/**
 * ✅ NEW: Analytics health check endpoint
 * @route GET /api/membership/admin/analytics/health
 */
export const getAnalyticsHealth = async (req, res) => {
  try {
    console.log('🏥 Checking analytics health...');
    
    const healthData = await getAnalyticsHealthCheck();
    
    const response = {
      success: true,
      health: healthData,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Analytics health check completed:', healthData.status);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in analytics health check:', error);
    
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ✅ NEW: Quick analytics summary endpoint (lighter weight)
 * @route GET /api/membership/admin/analytics/summary
 */
export const getAnalyticsSummary = async (req, res) => {
  try {
    console.log('📋 Fetching analytics summary...');
    
    // Get just the essential metrics without detailed data
    const [statsData, overviewData] = await Promise.allSettled([
      getMembershipStatsData(),
      getMembershipOverviewData()
    ]);
    
    const stats = statsData.status === 'fulfilled' ? statsData.value : null;
    const overview = overviewData.status === 'fulfilled' ? overviewData.value : null;
    
    const summary = {
      success: true,
      summary: {
        totalUsers: stats?.stats?.total_users || 0,
        preMembers: stats?.stats?.pre_members || 0,
        fullMembers: stats?.stats?.full_members || 0,
        applicants: stats?.stats?.applicants || 0,
        newRegistrations: stats?.stats?.new_registrations || 0,
        pendingItems: overview?.pendingItems?.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0) || 0,
        conversionRate: stats?.stats?.conversion_to_pre_member || 0,
        avgProcessingDays: stats?.stats?.avg_approval_days || 0
      },
      status: {
        statsAvailable: statsData.status === 'fulfilled',
        overviewAvailable: overviewData.status === 'fulfilled'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Analytics summary retrieved successfully');
    
    res.status(200).json(summary);
    
  } catch (error) {
    console.error('❌ Error in analytics summary:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics summary',
      message: error.message,
      fallbackSummary: {
        totalUsers: 0,
        preMembers: 0,
        fullMembers: 0,
        applicants: 0,
        newRegistrations: 0,
        pendingItems: 0,
        conversionRate: 0,
        avgProcessingDays: 0
      }
    });
  }
};