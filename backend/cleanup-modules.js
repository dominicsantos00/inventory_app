// Cleanup script to remove all records from IAR, RIS, RSMI, Stock Card, and RPCI modules
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'inventory_db'
});

async function cleanupAllModules() {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        console.log('Starting cleanup of all records...\n');

        // 1. Delete RPCI items and records
        console.log('Deleting RPCI items...');
        await connection.query('DELETE FROM rpci_items');
        console.log('✓ RPCI items deleted');

        console.log('Deleting RPCI records...');
        await connection.query('DELETE FROM rpci_records');
        console.log('✓ RPCI records deleted\n');

        // 2. Delete RIS items (must delete before ris_records due to FK)
        console.log('Deleting RIS items...');
        await connection.query('DELETE FROM ris_items');
        console.log('✓ RIS items deleted');

        console.log('Deleting RIS records...');
        await connection.query('DELETE FROM ris_records');
        console.log('✓ RIS records deleted\n');

        // 3. Delete RSMI items (must delete before rsmi_records due to FK)
        console.log('Deleting RSMI items...');
        await connection.query('DELETE FROM rsmi_items');
        console.log('✓ RSMI items deleted');

        console.log('Deleting RSMI records...');
        await connection.query('DELETE FROM rsmi_records');
        console.log('✓ RSMI records deleted\n');

        // 4. Delete Stock Card transactions (must delete before stock_cards due to FK)
        console.log('Deleting stock card transactions...');
        await connection.query('DELETE FROM stock_card_transactions');
        console.log('✓ Stock card transactions deleted');

        console.log('Deleting stock cards...');
        await connection.query('DELETE FROM stock_cards');
        console.log('✓ Stock cards deleted\n');

        // 5. Delete IAR records
        console.log('Deleting IAR records...');
        await connection.query('DELETE FROM iar_records');
        console.log('✓ IAR records deleted\n');

        // Verify counts
        console.log('Verifying deletion:\n');
        
        const [iarCount] = await connection.query('SELECT COUNT(*) as count FROM iar_records');
        console.log(`IAR Records: ${iarCount[0].count}`);

        const [risCount] = await connection.query('SELECT COUNT(*) as count FROM ris_records');
        console.log(`RIS Records: ${risCount[0].count}`);

        const [rsmiCount] = await connection.query('SELECT COUNT(*) as count FROM rsmi_records');
        console.log(`RSMI Records: ${rsmiCount[0].count}`);

        const [scCount] = await connection.query('SELECT COUNT(*) as count FROM stock_cards');
        console.log(`Stock Cards: ${scCount[0].count}`);

        const [rpciCount] = await connection.query('SELECT COUNT(*) as count FROM rpci_records');
        console.log(`RPCI Records: ${rpciCount[0].count}`);

        await connection.commit();
        console.log('\n✅ All records deleted successfully!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error during cleanup:', error.message);
        process.exit(1);
    } finally {
        connection.release();
        await pool.end();
        process.exit(0);
    }
}

cleanupAllModules();
