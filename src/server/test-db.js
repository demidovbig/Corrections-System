const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('✅ Подключение к БД работает! Результат:', rows[0].solution);
    
    const [corrections] = await pool.query('SELECT * FROM corrections LIMIT 1');
    console.log('✅ Таблица corrections существует, записей:', corrections.length);
    
    process.exit();
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    process.exit(1);
  }
}

testConnection();