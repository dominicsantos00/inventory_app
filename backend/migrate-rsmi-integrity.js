const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory_db'
});

(async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to database...\n');

    // Add tracking columns to rsmi_records table
    console.log('Adding tracking columns to rsmi_records table...');

    const [result1] = await connection.query(`
      ALTER TABLE rsmi_records 
      ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added is_auto_generated column');

    const [result2] = await connection.query(`
      ALTER TABLE rsmi_records 
      ADD COLUMN IF NOT EXISTS source_ris_number VARCHAR(255)
    `);
    console.log('✓ Added source_ris_number column');

    // Add indexes for performance
    console.log('\nAdding indexes...');
    try {
      await connection.query(`
        ALTER TABLE rsmi_records 
        ADD INDEX IF NOT EXISTS idx_rsmi_auto_gen (is_auto_generated)
      `);
      console.log('✓ Added index on is_auto_generated');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEY_NAME') throw e;
    }

    try {
      await connection.query(`
        ALTER TABLE rsmi_records 
        ADD INDEX IF NOT EXISTS idx_rsmi_source_ris (source_ris_number)
      `);
      console.log('✓ Added index on source_ris_number');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEY_NAME') throw e;
    }

    // Verify columns exist
    console.log('\nVerifying rsmi_records table structure...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM rsmi_records');
    console.log('\nRSMI Records table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
})();
