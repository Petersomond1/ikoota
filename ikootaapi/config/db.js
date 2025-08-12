// config/db.js - MYSQL ONLY VERSION
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ikoota_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timeout: 15000,
  acquireTimeout: 15000
});

// Test connection
async function testDBConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ MySQL Database connected successfully!');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
}

testDBConnection();

// SIMPLE MySQL export
export default {
  pool,
  
  query: async (sql, params = []) => {
    try {
      console.log('🔍 MySQL Query:', sql.substring(0, 80) + '...');
      console.log('🔍 Params:', params);
      
      const [rows] = await pool.execute(sql, params);
      
      console.log('✅ MySQL Query success, rows:', Array.isArray(rows) ? rows.length : 1);
      
      // Return in format your code expects
      return { rows: Array.isArray(rows) ? rows : [rows] };
    } catch (err) {
      console.error('❌ MySQL Error:', err.message);
      console.error('❌ Failed SQL:', sql);
      throw new Error(`MySQL query failed: ${err.message}`);
    }
  },

  close: async () => {
    await pool.end();
  }
};

export { testDBConnection };