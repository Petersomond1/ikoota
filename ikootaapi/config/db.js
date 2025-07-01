//ikootaapi/config/db.js
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // REMOVE these invalid options:
  // acquireTimeout: 60000,
  // timeout: 60000
});

// Test function to check if DB is connected
async function testDBConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    process.exit(1);
  }
}

// Call the test function when starting the server
testDBConnection();

// Enhanced export with backward compatibility
export default {
  // Direct pool access (for legacy code)
  pool,

 
  query: async (sql, params = []) => {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('Database query failed:', err);
      throw new Error(`Database query failed: ${err.message}`);
    }
  },

  // Get connection method (for identityMaskingService)
  getConnection: async () => {
    return await pool.getConnection();
  },

  // Transaction helper method
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Health check method
  healthCheck: async () => {
    try {
      const [rows] = await pool.execute('SELECT 1 as test');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  },

  // Close pool gracefully
  close: async () => {
    await pool.end();
  }
};

// Export the testDBConnection function for your test file
export { testDBConnection };