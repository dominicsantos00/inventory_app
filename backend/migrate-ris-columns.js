// Migration script to add missing RIS columns
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'inventory_db',
    });

    console.log('Connected to database...');

    // Add columns if they don't exist
    try {
      await connection.execute(
        'ALTER TABLE ris_records ADD COLUMN requested_by VARCHAR(255)'
      );
      console.log('✓ Added requested_by column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ requested_by column already exists');
      } else {
        throw err;
      }
    }

    try {
      await connection.execute(
        'ALTER TABLE ris_records ADD COLUMN requesting_office VARCHAR(255)'
      );
      console.log('✓ Added requesting_office column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ requesting_office column already exists');
      } else {
        throw err;
      }
    }

    try {
      await connection.execute(
        'ALTER TABLE ris_records ADD COLUMN request_date DATE'
      );
      console.log('✓ Added request_date column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ request_date column already exists');
      } else {
        throw err;
      }
    }

    // Verify columns exist
    const [columns] = await connection.execute('SHOW COLUMNS FROM ris_records');
    console.log('\nRIS Records table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
