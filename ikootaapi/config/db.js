import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const testDBConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to the MySQL database!");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Exit the process if the database connection fails
  }
};

export default { pool, testDBConnection };