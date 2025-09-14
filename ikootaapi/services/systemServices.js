// ikootaapi/services/systemServices.js
// SYSTEM MANAGEMENT SERVICES
// Health monitoring, metrics collection, and system operations

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};

const calculatePerformanceScore = (responseTime) => {
    if (responseTime < 100) return 100;
    if (responseTime < 500) return 75;
    if (responseTime < 1000) return 50;
    return 25;
};

// ===============================================
// HEALTH CHECK SERVICES
// ===============================================

/**
 * Comprehensive system health check
 */
export const performHealthCheckService = async () => {
    try {
        console.log('🔍 performHealthCheckService called');
        
        const healthStatus = {
            status: 'healthy',
            checks: {},
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '3.0.0'
        };

        // Database connectivity and performance check
        try {
            const startTime = Date.now();
            const [dbResult] = await db.query(`
                SELECT 
                    1 as test, 
                    NOW() as current_time, 
                    CONNECTION_ID() as connection_id,
                    VERSION() as mysql_version,
                    DATABASE() as current_database
            `);
            const dbResponseTime = Date.now() - startTime;
            
            healthStatus.checks.database = {
                status: 'healthy',
                responseTime: `${dbResponseTime}ms`,
                performance: dbResponseTime < 100 ? 'excellent' : dbResponseTime < 500 ? 'good' : 'slow',
                performanceScore: calculatePerformanceScore(dbResponseTime),
                connectionId: dbResult[0].connection_id,
                mysqlVersion: dbResult[0].mysql_version,
                currentDatabase: dbResult[0].current_database,
                serverTime: dbResult[0].current_time
            };
        } catch (dbError) {
            healthStatus.status = 'unhealthy';
            healthStatus.checks.database = {
                status: 'unhealthy',
                error: dbError.message,
                lastAttempt: new Date().toISOString()
            };
        }

        // Memory usage analysis
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
        
        healthStatus.checks.memory = {
            status: memoryMB > 1000 ? 'warning' : memoryMB > 2000 ? 'critical' : 'healthy',
            usage: {
                rss: formatBytes(memoryUsage.rss),
                heapUsed: formatBytes(memoryUsage.heapUsed),
                heapTotal: formatBytes(memoryUsage.heapTotal),
                external: formatBytes(memoryUsage.external),
                arrayBuffers: formatBytes(memoryUsage.arrayBuffers || 0)
            },
            raw: memoryUsage,
            healthScore: memoryMB < 500 ? 100 : memoryMB < 1000 ? 75 : memoryMB < 2000 ? 50 : 25,
            warning: memoryMB > 1000 ? `High memory usage: ${formatBytes(memoryUsage.rss)}` : null
        };

        // System uptime and performance
        const uptime = process.uptime();
        healthStatus.checks.uptime = {
            status: 'healthy',
            seconds: Math.floor(uptime),
            formatted: formatUptime(uptime),
            startedAt: new Date(Date.now() - uptime * 1000).toISOString(),
            healthScore: uptime > 3600 ? 100 : uptime > 300 ? 75 : 50
        };

        // CPU usage information
        const cpuUsage = process.cpuUsage();
        healthStatus.checks.cpu = {
            status: 'healthy',
            user: cpuUsage.user,
            system: cpuUsage.system,
            userMs: Math.round(cpuUsage.user / 1000),
            systemMs: Math.round(cpuUsage.system / 1000)
        };

        // Critical database tables check
        const criticalTables = [
            'users', 'chats', 'teachings', 'comments', 'surveylog',
            'full_membership_applications', 'classes', 'user_class_memberships',
            'verification_codes', 'audit_logs'
        ];
        
        healthStatus.checks.tables = {};
        let tableErrors = 0;
        
        for (const table of criticalTables) {
            try {
                const [tableResult] = await db.query(`
                    SELECT 
                        COUNT(*) as count,
                        MAX(createdAt) as latest_record
                    FROM ${table}
                `);
                
                healthStatus.checks.tables[table] = {
                    status: 'accessible',
                    count: tableResult[0].count,
                    latestRecord: tableResult[0].latest_record,
                    healthScore: 100
                };
            } catch (tableError) {
                tableErrors++;
                healthStatus.checks.tables[table] = {
                    status: 'error',
                    error: tableError.message,
                    healthScore: 0
                };
            }
        }

        // Overall health score calculation
        const scores = [];
        if (healthStatus.checks.database.performanceScore) scores.push(healthStatus.checks.database.performanceScore);
        if (healthStatus.checks.memory.healthScore) scores.push(healthStatus.checks.memory.healthScore);
        if (healthStatus.checks.uptime.healthScore) scores.push(healthStatus.checks.uptime.healthScore);
        
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        
        // Determine overall status
        if (tableErrors > 0 || healthStatus.checks.database.status === 'unhealthy') {
            healthStatus.status = 'unhealthy';
        } else if (overallScore < 75 || healthStatus.checks.memory.status === 'warning') {
            healthStatus.status = 'degraded';
        }

        healthStatus.overallScore = overallScore;
        healthStatus.summary = {
            tablesAccessible: criticalTables.length - tableErrors,
            totalTables: criticalTables.length,
            memoryUsage: formatBytes(memoryUsage.rss),
            uptime: formatUptime(uptime),
            databasePerformance: healthStatus.checks.database.performance || 'unknown'
        };

        console.log('✅ Health check completed with status:', healthStatus.status);
        
        return healthStatus;
        
    } catch (error) {
        console.error('❌ performHealthCheckService error:', error);
        throw error;
    }
};

/**
 * Database-specific health check
 */
export const performDatabaseHealthCheckService = async () => {
    try {
        console.log('🔍 performDatabaseHealthCheckService called');
        
        const healthChecks = {
            timestamp: new Date().toISOString(),
            checks: {}
        };

        // Basic connectivity test
        const startTime = Date.now();
        const [basicTest] = await db.query('SELECT 1 as test, NOW() as current_time, USER() as current_user');
        const basicResponseTime = Date.now() - startTime;
        
        healthChecks.checks.basic = {
            status: 'passed',
            responseTime: `${basicResponseTime}ms`,
            performanceScore: calculatePerformanceScore(basicResponseTime),
            result: basicTest[0]
        };

        // Connection pool and server status
        try {
            const [serverStatus] = await db.query(`
                SHOW STATUS WHERE Variable_name IN (
                    'Connections', 'Max_used_connections', 'Threads_connected',
                    'Threads_running', 'Uptime', 'Queries', 'Questions',
                    'Innodb_buffer_pool_reads', 'Innodb_buffer_pool_read_requests'
                )
            `);
            
            healthChecks.checks.serverStatus = {};
            serverStatus.forEach(stat => {
                healthChecks.checks.serverStatus[stat.Variable_name] = stat.Value;
            });
        } catch (statusError) {
            console.warn('⚠️ Could not fetch server status:', statusError.message);
        }

        // Database and table information
        try {
            const [dbInfo] = await db.query(`
                SELECT 
                    SCHEMA_NAME as database_name,
                    DEFAULT_CHARACTER_SET_NAME as charset,
                    DEFAULT_COLLATION_NAME as collation
                FROM information_schema.SCHEMATA 
                WHERE SCHEMA_NAME = DATABASE()
            `);
            
            const [tableStats] = await db.query(`
                SELECT 
                    COUNT(*) as total_tables,
                    SUM(TABLE_ROWS) as total_rows,
                    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
                    ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) as data_size_mb,
                    ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) as index_size_mb
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
            `);
            
            healthChecks.checks.database = {
                info: dbInfo[0],
                statistics: tableStats[0]
            };
        } catch (dbInfoError) {
            console.warn('⚠️ Could not fetch database info:', dbInfoError.message);
        }

        // Critical tables accessibility
        const criticalTables = [
            'users', 'chats', 'teachings', 'comments', 'surveylog',
            'full_membership_applications', 'classes', 'user_class_memberships'
        ];
        
        healthChecks.checks.tables = {};
        
        for (const table of criticalTables) {
            try {
                const tableStart = Date.now();
                const [tableResult] = await db.query(`
                    SELECT 
                        COUNT(*) as row_count,
                        MAX(createdAt) as latest_record,
                        MIN(createdAt) as earliest_record
                    FROM ${table} 
                    LIMIT 1
                `);
                const tableResponseTime = Date.now() - tableStart;
                
                healthChecks.checks.tables[table] = {
                    status: 'accessible',
                    responseTime: `${tableResponseTime}ms`,
                    performanceScore: calculatePerformanceScore(tableResponseTime),
                    rowCount: tableResult[0].row_count,
                    latestRecord: tableResult[0].latest_record,
                    earliestRecord: tableResult[0].earliest_record
                };
            } catch (tableError) {
                healthChecks.checks.tables[table] = {
                    status: 'error',
                    error: tableError.message,
                    performanceScore: 0
                };
            }
        }

        const totalTime = Date.now() - startTime;
        const accessibleTables = Object.values(healthChecks.checks.tables).filter(t => t.status === 'accessible').length;
        
        healthChecks.summary = {
            totalResponseTime: `${totalTime}ms`,
            overallStatus: accessibleTables === criticalTables.length ? 'healthy' : 'degraded',
            accessibleTables: `${accessibleTables}/${criticalTables.length}`,
            averagePerformanceScore: Math.round(
                Object.values(healthChecks.checks.tables)
                    .map(t => t.performanceScore || 0)
                    .reduce((a, b) => a + b, 0) / criticalTables.length
            )
        };

        console.log('✅ Database health check completed');
        
        return healthChecks;
        
    } catch (error) {
        console.error('❌ performDatabaseHealthCheckService error:', error);
        throw error;
    }
};

// ===============================================
// METRICS COLLECTION SERVICES
// ===============================================

/**
 * Collect system performance metrics
 */
export const collectPerformanceMetricsService = async () => {
    try {
        console.log('🔍 collectPerformanceMetricsService called');
        
        const startTime = Date.now();
        
        // System metrics
        const systemMetrics = {
            uptime: process.uptime(),
            memory: {
                usage: process.memoryUsage(),
                formatted: {
                    rss: formatBytes(process.memoryUsage().rss),
                    heapUsed: formatBytes(process.memoryUsage().heapUsed),
                    heapTotal: formatBytes(process.memoryUsage().heapTotal),
                    external: formatBytes(process.memoryUsage().external),
                    arrayBuffers: formatBytes(process.memoryUsage().arrayBuffers || 0)
                },
                percentages: {
                    heapUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
                    rssUsage: Math.round((process.memoryUsage().rss / (process.memoryUsage().rss + 1024 * 1024 * 1024)) * 100) // Approximate
                }
            },
            cpu: {
                usage: process.cpuUsage(),
                formatted: {
                    user: Math.round(process.cpuUsage().user / 1000) + 'ms',
                    system: Math.round(process.cpuUsage().system / 1000) + 'ms'
                }
            },
            platform: {
                node: process.version,
                platform: process.platform,
                arch: process.arch,
                pid: process.pid,
                ppid: process.ppid
            }
        };

        // Database performance metrics
        let databaseMetrics = {
            status: 'unknown',
            responseTime: null,
            performance: null,
            connectionInfo: null
        };

        try {
            const dbStart = Date.now();
            const [dbResult] = await db.query(`
                SELECT 
                    CONNECTION_ID() as connection_id,
                    DATABASE() as current_database,
                    USER() as current_user,
                    VERSION() as mysql_version,
                    NOW() as server_time,
                    @@read_only as read_only_mode,
                    @@sql_mode as sql_mode
            `);
            const dbResponseTime = Date.now() - dbStart;
            
            databaseMetrics = {
                status: 'connected',
                responseTime: `${dbResponseTime}ms`,
                performance: dbResponseTime < 100 ? 'excellent' : dbResponseTime < 500 ? 'good' : 'slow',
                performanceScore: calculatePerformanceScore(dbResponseTime),
                connectionInfo: dbResult[0]
            };

            // Get database statistics
            try {
                const [dbStats] = await db.query(`
                    SELECT 
                        COUNT(*) as total_tables,
                        SUM(TABLE_ROWS) as total_rows,
                        ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
                        ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) as data_size_mb,
                        ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) as index_size_mb
                    FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = DATABASE()
                `);
                
                const [serverStats] = await db.query(`
                    SHOW STATUS WHERE Variable_name IN (
                        'Uptime', 'Queries', 'Questions', 'Connections',
                        'Threads_connected', 'Threads_running', 'Open_tables',
                        'Open_files', 'Innodb_buffer_pool_reads',
                        'Innodb_buffer_pool_read_requests'
                    )
                `);
                
                databaseMetrics.statistics = {
                    database: dbStats[0],
                    server: {}
                };
                
                serverStats.forEach(stat => {
                    databaseMetrics.statistics.server[stat.Variable_name] = stat.Value;
                });
                
                // Calculate buffer pool hit ratio
                const reads = parseInt(databaseMetrics.statistics.server.Innodb_buffer_pool_reads || 0);
                const requests = parseInt(databaseMetrics.statistics.server.Innodb_buffer_pool_read_requests || 0);
                
                if (requests > 0) {
                    databaseMetrics.statistics.bufferPoolHitRatio = Math.round(((requests - reads) / requests) * 100);
                }
                
            } catch (statsError) {
                console.warn('⚠️ Could not fetch database statistics:', statsError.message);
            }
            
        } catch (dbError) {
            databaseMetrics = {
                status: 'error',
                error: dbError.message,
                lastAttempt: new Date().toISOString(),
                performanceScore: 0
            };
        }

        // Application-specific metrics
        const applicationMetrics = {
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: Intl.DateTimeFormat().resolvedOptions().locale,
                port: process.env.PORT || 3000
            },
            configuration: {
                jwtConfigured: !!process.env.JWT_SECRET,
                emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER),
                smsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
                frontendUrl: process.env.FRONTEND_URL || 'not_configured'
            }
        };

        // Health score calculation
        const healthScores = {
            memory: systemMetrics.memory.percentages.heapUsage < 70 ? 100 : 
                   systemMetrics.memory.percentages.heapUsage < 85 ? 75 : 50,
            database: databaseMetrics.performanceScore || 0,
            uptime: systemMetrics.uptime > 3600 ? 100 : systemMetrics.uptime > 300 ? 75 : 50
        };
        
        const overallScore = Math.round(
            (healthScores.memory + healthScores.database + healthScores.uptime) / 3
        );

        const totalResponseTime = Date.now() - startTime;
        
        const metrics = {
            success: true,
            message: 'System performance metrics collected',
            timestamp: new Date().toISOString(),
            collectionTime: `${totalResponseTime}ms`,
            
            system: systemMetrics,
            database: databaseMetrics,
            application: applicationMetrics,
            
            healthScore: {
                overall: overallScore,
                components: healthScores,
                status: overallScore >= 85 ? 'excellent' : 
                       overallScore >= 70 ? 'good' : 
                       overallScore >= 50 ? 'fair' : 'poor'
            }
        };

        console.log('✅ Performance metrics collected with overall score:', overallScore);
        
        return metrics;
        
    } catch (error) {
        console.error('❌ collectPerformanceMetricsService error:', error);
        throw error;
    }
};

/**
 * Get comprehensive system diagnostics
 */
export const getSystemDiagnosticsService = async () => {
    try {
        console.log('🔍 getSystemDiagnosticsService called');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            version: '3.0.0',
            
            system: {
                process: {
                    pid: process.pid,
                    ppid: process.ppid,
                    platform: process.platform,
                    arch: process.arch,
                    nodeVersion: process.version,
                    execPath: process.execPath,
                    argv: process.argv,
                    cwd: process.cwd(),
                    uptime: {
                        seconds: Math.floor(process.uptime()),
                        formatted: formatUptime(process.uptime()),
                        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
                    }
                },
                memory: {
                    usage: process.memoryUsage(),
                    formatted: {
                        rss: formatBytes(process.memoryUsage().rss),
                        heapUsed: formatBytes(process.memoryUsage().heapUsed),
                        heapTotal: formatBytes(process.memoryUsage().heapTotal),
                        external: formatBytes(process.memoryUsage().external)
                    },
                    percentages: {
                        heapUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                    }
                },
                cpu: {
                    usage: process.cpuUsage(),
                    formatted: {
                        user: Math.round(process.cpuUsage().user / 1000) + 'ms',
                        system: Math.round(process.cpuUsage().system / 1000) + 'ms',
                        total: Math.round((process.cpuUsage().user + process.cpuUsage().system) / 1000) + 'ms'
                    }
                }
            },
            
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: Intl.DateTimeFormat().resolvedOptions().locale,
                
                configuration: {
                    port: process.env.PORT || 3000,
                    jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
                    frontendUrl: process.env.FRONTEND_URL || 'not_set',
                    
                    email: {
                        host: process.env.EMAIL_HOST ? 'configured' : 'missing',
                        user: process.env.EMAIL_USER ? 'configured' : 'missing',
                        port: process.env.EMAIL_PORT || 'default'
                    },
                    
                    sms: {
                        twilioSid: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing',
                        twilioToken: process.env.TWILIO_AUTH_TOKEN ? 'configured' : 'missing'
                    },
                    
                    database: {
                        host: process.env.DB_HOST || 'localhost',
                        port: process.env.DB_PORT || 3306,
                        database: process.env.DB_NAME || 'not_set',
                        user: process.env.DB_USER ? 'configured' : 'missing'
                    }
                }
            }
        };

        // Database diagnostics
        try {
            const [dbVersion] = await db.query('SELECT VERSION() as version, NOW() as current_time');
            
            const [dbStatus] = await db.query(`
                SHOW STATUS WHERE Variable_name IN (
                    'Uptime', 'Queries', 'Questions', 'Connections', 'Max_used_connections',
                    'Threads_connected', 'Threads_running', 'Open_tables', 'Open_files',
                    'Innodb_buffer_pool_size', 'Innodb_buffer_pool_reads',
                    'Innodb_buffer_pool_read_requests', 'Innodb_log_waits'
                )
            `);
            
            diagnostics.database = {
                version: dbVersion[0].version,
                serverTime: dbVersion[0].current_time,
                status: {}
            };
            
            dbStatus.forEach(stat => {
                diagnostics.database.status[stat.Variable_name] = stat.Value;
            });

            // Table analysis
            const [tableAnalysis] = await db.query(`
                SELECT 
                    TABLE_NAME as table_name,
                    TABLE_ROWS as row_count,
                    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb,
                    ENGINE as engine,
                    TABLE_COLLATION as collation,
                    CREATE_TIME as created_time,
                    UPDATE_TIME as updated_time
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()
                ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
                LIMIT 15
            `);
            
            diagnostics.database.topTables = tableAnalysis;

            // Index analysis
            const [indexAnalysis] = await db.query(`
                SELECT 
                    TABLE_NAME as table_name,
                    INDEX_NAME as index_name,
                    NON_UNIQUE as non_unique,
                    SEQ_IN_INDEX as seq_in_index,
                    COLUMN_NAME as column_name,
                    CARDINALITY as cardinality
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND INDEX_NAME != 'PRIMARY'
                ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
                LIMIT 20
            `);
            
            diagnostics.database.indexInfo = indexAnalysis;

        } catch (dbError) {
            diagnostics.database = {
                error: dbError.message,
                status: 'unavailable'
            };
        }

        // API and route information
        diagnostics.api = {
            version: '3.0.0',
            architecture: 'Domain-driven with admin separation',
            routeModules: 13,
            features: [
                'Enhanced authentication system',
                'Unified content management',
                'Admin route separation',
                'Comprehensive health monitoring',
                'Performance metrics collection',
                'Backward compatibility support'
            ]
        };

        console.log('✅ System diagnostics collected');
        
        return diagnostics;
        
    } catch (error) {
        console.error('❌ getSystemDiagnosticsService error:', error);
        throw error;
    }
};

// ===============================================
// SYSTEM MAINTENANCE SERVICES
// ===============================================

/**
 * Clean up expired verification codes and tokens
 */
export const performSystemCleanupService = async () => {
    try {
        console.log('🔍 performSystemCleanupService called');
        
        const cleanupResults = {
            timestamp: new Date().toISOString(),
            operations: []
        };

        // Clean up expired verification codes
        const [verificationCleanup] = await db.query(`
            DELETE FROM verification_codes 
            WHERE expiresAt < NOW()
        `);
        
        cleanupResults.operations.push({
            operation: 'cleanup_verification_codes',
            recordsDeleted: verificationCleanup.affectedRows,
            status: 'completed'
        });

        // Clean up expired reset tokens
        const [resetTokenCleanup] = await db.query(`
            UPDATE users 
            SET resetToken = NULL, resetTokenExpiry = NULL 
            WHERE resetTokenExpiry < ?
        `, [Date.now()]);
        
        cleanupResults.operations.push({
            operation: 'cleanup_reset_tokens',
            recordsUpdated: resetTokenCleanup.affectedRows,
            status: 'completed'
        });

        // Clean up old audit logs (older than 90 days)
        try {
            const [auditCleanup] = await db.query(`
                DELETE FROM audit_logs 
                WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)
            `);
            
            cleanupResults.operations.push({
                operation: 'cleanup_old_audit_logs',
                recordsDeleted: auditCleanup.affectedRows,
                status: 'completed'
            });
        } catch (auditError) {
            cleanupResults.operations.push({
                operation: 'cleanup_old_audit_logs',
                status: 'failed',
                error: auditError.message
            });
        }

        // Clean up old email logs (older than 30 days)
        try {
            const [emailCleanup] = await db.query(`
                DELETE FROM email_logs 
                WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND status = 'sent'
            `);
            
            cleanupResults.operations.push({
                operation: 'cleanup_old_email_logs',
                recordsDeleted: emailCleanup.affectedRows,
                status: 'completed'
            });
        } catch (emailError) {
            cleanupResults.operations.push({
                operation: 'cleanup_old_email_logs',
                status: 'failed',
                error: emailError.message
            });
        }

        const totalRecordsAffected = cleanupResults.operations.reduce((total, op) => {
            return total + (op.recordsDeleted || op.recordsUpdated || 0);
        }, 0);

        cleanupResults.summary = {
            totalOperations: cleanupResults.operations.length,
            successfulOperations: cleanupResults.operations.filter(op => op.status === 'completed').length,
            totalRecordsAffected,
            completedAt: new Date().toISOString()
        };

        console.log('✅ System cleanup completed, affected records:', totalRecordsAffected);
        
        return cleanupResults;
        
    } catch (error) {
        console.error('❌ performSystemCleanupService error:', error);
        throw error;
    }
};

/**
 * Optimize database tables
 */
export const optimizeDatabaseService = async () => {
    try {
        console.log('🔍 optimizeDatabaseService called');
        
        const optimizationResults = {
            timestamp: new Date().toISOString(),
            operations: []
        };

        // Get list of tables to optimize
        const [tables] = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND ENGINE = 'InnoDB'
        `);

        for (const table of tables) {
            try {
                const startTime = Date.now();
                await db.query(`OPTIMIZE TABLE ${table.TABLE_NAME}`);
                const duration = Date.now() - startTime;
                
                optimizationResults.operations.push({
                    table: table.TABLE_NAME,
                    status: 'optimized',
                    duration: `${duration}ms`
                });
            } catch (optimizeError) {
                optimizationResults.operations.push({
                    table: table.TABLE_NAME,
                    status: 'failed',
                    error: optimizeError.message
                });
            }
        }

        // Analyze tables for better query optimization
        for (const table of tables.slice(0, 5)) { // Limit to top 5 tables
            try {
                await db.query(`ANALYZE TABLE ${table.TABLE_NAME}`);
                
                const existingOp = optimizationResults.operations.find(op => op.table === table.TABLE_NAME);
                if (existingOp) {
                    existingOp.analyzed = true;
                }
            } catch (analyzeError) {
                console.warn(`⚠️ Failed to analyze table ${table.TABLE_NAME}:`, analyzeError.message);
            }
        }

        optimizationResults.summary = {
            tablesProcessed: tables.length,
            successful: optimizationResults.operations.filter(op => op.status === 'optimized').length,
            failed: optimizationResults.operations.filter(op => op.status === 'failed').length,
            completedAt: new Date().toISOString()
        };

        console.log('✅ Database optimization completed');
        
        return optimizationResults;
        
    } catch (error) {
        console.error('❌ optimizeDatabaseService error:', error);
        throw error;
    }
};

// ===============================================
// STATISTICS AND ANALYTICS SERVICES
// ===============================================

/**
 * Get comprehensive system statistics
 */
export const getSystemStatisticsService = async () => {
    try {
        console.log('🔍 getSystemStatisticsService called');
        
        const statistics = {
            timestamp: new Date().toISOString(),
            period: 'current'
        };

        // User statistics
        const [userStats] = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN role IN ('admin', 'super_admin') THEN 1 ELSE 0 END) as admin_users,
                SUM(CASE WHEN isbanned = 1 THEN 1 ELSE 0 END) as banned_users,
                SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as new_users_today,
                SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week,
                SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_month
            FROM users
        `);

        // Content statistics
        const [contentStats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM chats) as total_chats,
                (SELECT COUNT(*) FROM teachings) as total_teachings,
                (SELECT COUNT(*) FROM comments) as total_comments,
                (SELECT COUNT(*) FROM chats WHERE approval_status = 'pending') as pending_chats,
                (SELECT COUNT(*) FROM teachings WHERE approval_status = 'pending') as pending_teachings,
                (SELECT COUNT(*) FROM chats WHERE DATE(createdAt) = CURDATE()) as chats_today,
                (SELECT COUNT(*) FROM teachings WHERE DATE(createdAt) = CURDATE()) as teachings_today,
                (SELECT COUNT(*) FROM comments WHERE DATE(createdAt) = CURDATE()) as comments_today
        `);

        // Membership statistics
        const [membershipStats] = await db.query(`
            SELECT 
                SUM(CASE WHEN membership_stage = 'none' THEN 1 ELSE 0 END) as stage_none,
                SUM(CASE WHEN membership_stage = 'applicant' THEN 1 ELSE 0 END) as stage_applicant,
                SUM(CASE WHEN membership_stage = 'pre_member' THEN 1 ELSE 0 END) as stage_pre_member,
                SUM(CASE WHEN membership_stage = 'member' THEN 1 ELSE 0 END) as stage_member,
                (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full_applications,
                (SELECT COUNT(*) FROM surveylog WHERE new_status = 'pending') as pending_surveys
            FROM users
        `);

        // System activity statistics
        const [activityStats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM verification_codes WHERE expiresAt > NOW()) as active_verification_codes,
                (SELECT COUNT(*) FROM users WHERE resetToken IS NOT NULL AND resetTokenExpiry > ?) as active_reset_tokens,
                (SELECT COUNT(*) FROM audit_logs WHERE DATE(createdAt) = CURDATE()) as audit_entries_today,
                (SELECT COUNT(*) FROM email_logs WHERE DATE(createdAt) = CURDATE()) as emails_sent_today
        `, [Date.now()]);

        statistics.users = userStats[0];
        statistics.content = contentStats[0];
        statistics.membership = membershipStats[0];
        statistics.activity = activityStats[0];

        // Calculate derived statistics
        statistics.derived = {
            userGrowthRate: statistics.users.total_users > 0 ? 
                Math.round((statistics.users.new_users_month / statistics.users.total_users) * 100) : 0,
            verificationRate: statistics.users.total_users > 0 ? 
                Math.round((statistics.users.verified_users / statistics.users.total_users) * 100) : 0,
            contentEngagement: statistics.content.total_chats + statistics.content.total_teachings > 0 ? 
                Math.round((statistics.content.total_comments / (statistics.content.total_chats + statistics.content.total_teachings)) * 100) : 0,
            membershipConversionRate: statistics.users.total_users > 0 ? 
                Math.round((statistics.membership.stage_member / statistics.users.total_users) * 100) : 0
        };

        console.log('✅ System statistics collected');
        
        return statistics;
        
    } catch (error) {
        console.error('❌ getSystemStatisticsService error:', error);
        throw error;
    }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

export default {
    // Health and monitoring
    performHealthCheckService,
    performDatabaseHealthCheckService,
    collectPerformanceMetricsService,
    getSystemDiagnosticsService,
    
    // Maintenance and optimization
    performSystemCleanupService,
    optimizeDatabaseService,
    
    // Statistics and analytics
    getSystemStatisticsService,
    
    // Utility functions
    formatBytes,
    formatUptime,
    calculatePerformanceScore
};