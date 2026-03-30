const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory_db',
});

async function cleanup() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`DELETE FROM rsmi_items WHERE rsmi_record_id IN (SELECT id FROM rsmi_records WHERE report_no LIKE 'RSMI-2026-%')`);
    await conn.query(`DELETE FROM rsmi_records WHERE report_no LIKE 'RSMI-2026-%' OR report_no LIKE 'SUPPLY-REPORT-%'`);
    console.log('✅ Cleaned up test records');
  } finally {
    conn.release();
    await pool.end();
  }
}

cleanup();
