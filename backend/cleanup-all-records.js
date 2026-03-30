#!/usr/bin/env node
/**
 * System-Wide Data Cleanup Script
 * Safely deletes all records from IAR, RIS, RSMI, and Stock Card tables
 * Respects foreign key constraints and maintains referential integrity
 */

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
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SYSTEM-WIDE DATA CLEANUP');
    console.log('═══════════════════════════════════════════════════════════\n');

    await connection.beginTransaction();

    // Deletion order respects foreign key constraints
    // Child tables first, then parent tables

    // =====================================================
    // 1. RSMI CLEANUP
    // =====================================================
    console.log('🗑️  Clearing RSMI (Report of Supplies and Materials Issued)...');
    
    const [rsmiItemsResult] = await connection.query('DELETE FROM rsmi_items');
    console.log(`   ✓ Deleted ${rsmiItemsResult.affectedRows} RSMI items`);
    
    const [rsmiRecordsResult] = await connection.query('DELETE FROM rsmi_records');
    console.log(`   ✓ Deleted ${rsmiRecordsResult.affectedRows} RSMI records\n`);

    // =====================================================
    // 2. RIS CLEANUP
    // =====================================================
    console.log('🗑️  Clearing RIS (Requisition and Issue Slip)...');
    
    const [risItemsResult] = await connection.query('DELETE FROM ris_items');
    console.log(`   ✓ Deleted ${risItemsResult.affectedRows} RIS items`);
    
    const [risRecordsResult] = await connection.query('DELETE FROM ris_records');
    console.log(`   ✓ Deleted ${risRecordsResult.affectedRows} RIS records\n`);

    // =====================================================
    // 3. STOCK CARD CLEANUP
    // =====================================================
    console.log('🗑️  Clearing Stock Card records...');
    
    const [stockTxResult] = await connection.query('DELETE FROM stock_card_transactions');
    console.log(`   ✓ Deleted ${stockTxResult.affectedRows} stock card transactions`);
    
    const [stockCardResult] = await connection.query('DELETE FROM stock_cards');
    console.log(`   ✓ Deleted ${stockCardResult.affectedRows} stock cards\n`);

    // =====================================================
    // 4. IAR CLEANUP
    // =====================================================
    console.log('🗑️  Clearing IAR (Inspection and Acceptance Report)...');
    
    const [iarItemsResult] = await connection.query('DELETE FROM iar_items');
    console.log(`   ✓ Deleted ${iarItemsResult.affectedRows} IAR items`);
    
    const [iarRecordsResult] = await connection.query('DELETE FROM iar_records');
    console.log(`   ✓ Deleted ${iarRecordsResult.affectedRows} IAR records\n`);

    // =====================================================
    // 5. EQUIPMENT CLEANUP
    // =====================================================
    console.log('🗑️  Clearing Equipment records...');
    
    const [equipmentResult] = await connection.query('DELETE FROM deliveries WHERE type = ?', ['Equipment']);
    console.log(`   ✓ Deleted ${equipmentResult.affectedRows} equipment records\n`);

    // =====================================================
    // VERIFY CLEANUP
    // =====================================================
    console.log('Verifying cleanup...\n');

    const [rsmiCount] = await connection.query('SELECT COUNT(*) as count FROM rsmi_records');
    const [risCount] = await connection.query('SELECT COUNT(*) as count FROM ris_records');
    const [scCount] = await connection.query('SELECT COUNT(*) as count FROM stock_cards');
    const [iarCount] = await connection.query('SELECT COUNT(*) as count FROM iar_records');
    const [equipmentCount] = await connection.query('SELECT COUNT(*) as count FROM deliveries WHERE type = ?', ['Equipment']);

    console.log('Remaining records after cleanup:');
    console.log(`  • RSMI Records: ${rsmiCount[0].count}`);
    console.log(`  • RIS Records: ${risCount[0].count}`);
    console.log(`  • Stock Cards: ${scCount[0].count}`);
    console.log(`  • IAR Records: ${iarCount[0].count}`);
    console.log(`  • Equipment Records: ${equipmentCount[0].count}\n`);

    // Check for orphaned items
    const [orphanedRsmiItems] = await connection.query(`
      SELECT COUNT(*) as count FROM rsmi_items 
      WHERE rsmi_record_id NOT IN (SELECT id FROM rsmi_records)
    `);
    const [orphanedRisItems] = await connection.query(`
      SELECT COUNT(*) as count FROM ris_items 
      WHERE ris_record_id NOT IN (SELECT id FROM ris_records)
    `);
    const [orphanedIarItems] = await connection.query(`
      SELECT COUNT(*) as count FROM iar_items 
      WHERE iar_record_id NOT IN (SELECT id FROM iar_records)
    `);

    console.log('Orphaned records check:');
    console.log(`  • RSMI orphans: ${orphanedRsmiItems[0].count}`);
    console.log(`  • RIS orphans: ${orphanedRisItems[0].count}`);
    console.log(`  • IAR orphans: ${orphanedIarItems[0].count}\n`);

    // =====================================================
    // SUMMARY
    // =====================================================
    await connection.commit();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Total records deleted:');
    console.log(`  • RSMI Records: ${rsmiRecordsResult.affectedRows}`);
    console.log(`  • RSMI Items: ${rsmiItemsResult.affectedRows}`);
    console.log(`  • RIS Records: ${risRecordsResult.affectedRows}`);
    console.log(`  • RIS Items: ${risItemsResult.affectedRows}`);
    console.log(`  • Stock Cards: ${stockCardResult.affectedRows}`);
    console.log(`  • Stock Transactions: ${stockTxResult.affectedRows}`);
    console.log(`  • IAR Records: ${iarRecordsResult.affectedRows}`);
    console.log(`  • IAR Items: ${iarItemsResult.affectedRows}`);
    console.log(`  • Equipment Records: ${equipmentResult.affectedRows}`);

    const totalDeleted = 
      rsmiRecordsResult.affectedRows + rsmiItemsResult.affectedRows +
      risRecordsResult.affectedRows + risItemsResult.affectedRows +
      stockCardResult.affectedRows + stockTxResult.affectedRows +
      iarRecordsResult.affectedRows + iarItemsResult.affectedRows +
      equipmentResult.affectedRows;

    console.log(`\n  TOTAL: ${totalDeleted} records removed\n`);

    console.log('🎯 All modules now show empty state');
    console.log('🔄 System is ready for new entries\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Cleanup failed:', error.message);
    console.error('\nRollback completed - no changes were committed');
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
})();
