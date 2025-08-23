// config/db.js - AWS RDS MySQL Configuration
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ===============================================
// AWS RDS MYSQL CONNECTION CONFIGURATION
// ===============================================

const dbConfig = {
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    
    // Connection pool settings
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false,
    dateStrings: false,
    debug: false,
    
    // SSL configuration for AWS RDS
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false,
    
    // Timezone handling
    timezone: '+00:00'
};

// Log connection config (without password) for debugging
console.log('🔗 Initializing MySQL connection pool...');
console.log('📊 Database Config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    hasPassword: !!dbConfig.password,
    ssl: dbConfig.ssl
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// ===============================================
// CONNECTION TEST FUNCTION
// ===============================================

const testConnection = async () => {
    try {
        console.log('🔍 Testing MySQL connection...');
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1 as test');
        connection.release();
        console.log('✅ MySQL connection successful');
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });
        
        // Provide specific error guidance
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 SOLUTION: Check if MySQL server is running');
            console.error('   • For AWS RDS: Check security groups and endpoint');
            console.error('   • Verify DB_HOST in .env file');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 SOLUTION: Check database credentials');
            console.error('   • Verify DB_USER and DB_PASSWORD in .env file');
            console.error('   • Make sure user has proper permissions');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 SOLUTION: Database does not exist');
            console.error('   • Verify DB_NAME in .env file');
            console.error('   • Create database if it doesn\'t exist');
        } else if (error.code === 'ENOTFOUND') {
            console.error('💡 SOLUTION: Cannot resolve hostname');
            console.error('   • Check DB_HOST in .env file');
            console.error('   • Verify network connectivity to AWS RDS');
        }
        
        return false;
    }
};

// ===============================================
// ENHANCED QUERY FUNCTION
// ===============================================

const query = async (sql, params = []) => {
    const startTime = Date.now();
    let connection;
    
    try {
        // Log query in development
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 MySQL Query: \n     ', sql.replace(/\s+/g, ' ').substring(0, 100) + '...');
            console.log('🔍 Params:', params);
        }
        
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Execute query
        const [rows, fields] = await connection.query(sql, params);

        // Log success
        const duration = Date.now() - startTime;
        console.log(`✅ MySQL Query success, rows: ${Array.isArray(rows) ? rows.length : 'N/A'}, duration: ${duration}ms`);
        
        // Return rows directly
        return rows;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('❌ MySQL Query failed:', {
            sql: sql.substring(0, 100) + '...',
            params,
            error: error.message,
            code: error.code,
            duration: `${duration}ms`
        });
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ===============================================
// GRACEFUL SHUTDOWN
// ===============================================

const closePool = async () => {
    try {
        console.log('🔄 Closing MySQL connection pool...');
        await pool.end();
        console.log('✅ MySQL connection pool closed');
    } catch (error) {
        console.error('❌ Error closing MySQL pool:', error.message);
    }
};

// Handle shutdown signals
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down MySQL connections...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down MySQL connections...');
    await closePool();
    process.exit(0);
});

// ===============================================
// INITIALIZATION
// ===============================================

const initializeConnection = async () => {
    const isConnected = await testConnection();
    
    if (isConnected) {
        console.log('✅ MySQL connection pool ready');
        
        // Start periodic health checks (every 5 minutes)
        setInterval(async () => {
            try {
                await query('SELECT 1 as health_check');
                console.log('💓 MySQL health check passed');
            } catch (error) {
                console.error('💔 MySQL health check failed:', error.message);
            }
        }, 300000);
        
    } else {
        console.warn('⚠️ MySQL connection failed - server will continue but database features won\'t work');
        
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ Cannot start in production without database');
            process.exit(1);
        }
    }
};

// Initialize connection
initializeConnection();

// ===============================================
// EXPORTS
// ===============================================

export default {
    query,
    pool,
    testConnection,
    closePool
};

export { query };