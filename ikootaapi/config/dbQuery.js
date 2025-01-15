import pool from './db.js';

const dbQuery = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params); // Using mysql2's `execute` method for query parameterization
    return results;
  } catch (err) {
    // Here you can throw a custom error or handle logging if necessary
    console.error('Database query failed:', err);
    throw new Error(`Database query failed: ${err.message}`);
  }
};

export default dbQuery;