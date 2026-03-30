// api/server.js - Backend API for Vercel deployment
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Root route for quick status check
app.get('/', (req, res) => {
    res.send('Inventory Management API is running. Try /api/deliveries or /api/users');
});

// Database connection configuration
// In production, these should be environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ==========================================
// DELIVERIES API
// ==========================================

app.get('/api/deliveries', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, type, 
                DATE_FORMAT(date, '%Y-%m-%d') AS date, 
                po_number AS poNumber, 
                DATE_FORMAT(po_date, '%Y-%m-%d') AS poDate, 
                supplier, 
                receipt_number AS receiptNumber, 
                item, 
                item_description AS itemDescription, 
                unit, quantity, 
                unit_price AS unitPrice, 
                total_price AS totalPrice, 
                remarks 
            FROM deliveries
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/deliveries', async (req, res) => {
    const { type, date, poNumber, poDate, supplier, receiptNumber, item, itemDescription, unit, quantity, unitPrice, totalPrice, remarks } = req.body;
    const id = Date.now().toString(); // Generate varchar ID
    
    try {
        const query = `
            INSERT INTO deliveries 
            (id, type, date, po_number, po_date, supplier, receipt_number, item, item_description, unit, quantity, unit_price, total_price, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await pool.query(query, [id, type, date, poNumber, poDate, supplier, receiptNumber, item, itemDescription || null, unit, quantity, unitPrice, totalPrice, remarks || null]);
        res.json({ message: 'Delivery added successfully!', id });
    } catch (error) {
        console.error('Error adding delivery:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/deliveries/:id', async (req, res) => {
    const { id } = req.params;
    const { type, date, poNumber, poDate, supplier, receiptNumber, item, itemDescription, unit, quantity, unitPrice, totalPrice, remarks } = req.body;
    
    try {
        const query = `
            UPDATE deliveries 
            SET type = ?, date = ?, po_number = ?, po_date = ?, supplier = ?, receipt_number = ?, 
                item = ?, item_description = ?, unit = ?, quantity = ?, unit_price = ?, 
                total_price = ?, remarks = ?
            WHERE id = ?
        `;
        await pool.query(query, [type, date, poNumber, poDate, supplier, receiptNumber, item, itemDescription || null, unit, quantity, unitPrice, totalPrice, remarks || null, id]);
        res.json({ message: 'Delivery updated successfully!' });
    } catch (error) {
        console.error('Error updating delivery:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/deliveries/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM deliveries WHERE id = ?', [id]);
        res.json({ message: 'Delivery deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// USERS API
// ==========================================

app.get('/api/users', async (req, res) => {
    try {
        const query = `SELECT id, username, full_name AS fullName, role, division, email FROM users`;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, fullName, role, division, email } = req.body;
    const id = Date.now().toString();
    try {
        const query = `INSERT INTO users (id, username, full_name, role, division, email) VALUES (?, ?, ?, ?, ?, ?)`;
        await pool.query(query, [id, username, fullName, role, division || null, email]);
        res.json({ message: 'User added successfully!', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, fullName, role, division, email } = req.body;
    try {
        const query = `UPDATE users SET username = ?, full_name = ?, role = ?, division = ?, email = ? WHERE id = ?`;
        await pool.query(query, [username, fullName, role, division || null, email, id]);
        res.json({ message: 'User updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// SSN ITEMS API
// ==========================================

app.get('/api/ssnItems', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, code, description, unit, category FROM ssn_items`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ssnItems', async (req, res) => {
    const { code, description, unit, category } = req.body;
    const id = Date.now().toString();
    try {
        await pool.query(`INSERT INTO ssn_items (id, code, description, unit, category) VALUES (?, ?, ?, ?, ?)`, [id, code, description, unit, category]);
        res.json({ message: 'SSN item added successfully!', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/ssnItems/:id', async (req, res) => {
    const { id } = req.params;
    const { code, description, unit, category } = req.body;
    try {
        await pool.query(`UPDATE ssn_items SET code = ?, description = ?, unit = ?, category = ? WHERE id = ?`, [code, description, unit, category, id]);
        res.json({ message: 'SSN item updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/ssnItems/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ssn_items WHERE id = ?', [id]);
        res.json({ message: 'SSN item deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RCC ITEMS API
// ==========================================

app.get('/api/rccItems', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, code, office_name AS officeName, division_name AS divisionName FROM rcc_items`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rccItems', async (req, res) => {
    const { code, officeName, divisionName } = req.body;
    const id = Date.now().toString();
    try {
        await pool.query(`INSERT INTO rcc_items (id, code, office_name, division_name) VALUES (?, ?, ?, ?)`, [id, code, officeName, divisionName]);
        res.json({ message: 'RCC item added successfully!', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/rccItems/:id', async (req, res) => {
    const { id } = req.params;
    const { code, officeName, divisionName } = req.body;
    try {
        await pool.query(`UPDATE rcc_items SET code = ?, office_name = ?, division_name = ? WHERE id = ?`, [code, officeName, divisionName, id]);
        res.json({ message: 'RCC item updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/rccItems/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM rcc_items WHERE id = ?', [id]);
        res.json({ message: 'RCC item deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// IAR RECORDS API
// ==========================================

app.get('/api/iarRecords', async (req, res) => {
    try {
        const [records] = await pool.query(`
            SELECT id, iar_no AS iarNo, po_number AS poNumber, supplier, 
            DATE_FORMAT(po_date, '%Y-%m-%d') AS poDate, invoice_no AS invoiceNo, 
            requisitioning_office AS requisitioningOffice, responsibility_center_code AS responsibilityCenterCode, 
            DATE_FORMAT(date, '%Y-%m-%d') AS date FROM iar_records
        `);
        const [items] = await pool.query(`SELECT * FROM iar_items`);

        const parsedRows = records.map(record => ({
            ...record,
            items: items.filter(i => i.iar_record_id === record.id).map(i => ({
                id: i.id, description: i.description, unit: i.unit, quantity: i.quantity, unitCost: i.unit_cost, totalCost: i.total_cost
            }))
        }));
        res.json(parsedRows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/iarRecords', async (req, res) => {
    const { iarNo, poNumber, supplier, poDate, invoiceNo, requisitioningOffice, responsibilityCenterCode, items, date } = req.body;
    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const parentQuery = `
            INSERT INTO iar_records (id, iar_no, po_number, supplier, po_date, invoice_no, requisitioning_office, responsibility_center_code, date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(parentQuery, [id, iarNo, poNumber, supplier, poDate, invoiceNo, requisitioningOffice, responsibilityCenterCode, date]);

        if (items && items.length > 0) {
            const childValues = items.map(item => [id, item.description, item.unit, item.quantity, item.unitCost, item.totalCost]);
            await connection.query(`INSERT INTO iar_items (iar_record_id, description, unit, quantity, unit_cost, total_cost) VALUES ?`, [childValues]);
        }
        await connection.commit();
        res.json({ message: 'IAR record added successfully!', id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/iarRecords/:id', async (req, res) => {
    const { id } = req.params;
    const { iarNo, poNumber, supplier, poDate, invoiceNo, requisitioningOffice, responsibilityCenterCode, items, date } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const query = `
            UPDATE iar_records SET iar_no = ?, po_number = ?, supplier = ?, po_date = ?, invoice_no = ?, 
            requisitioning_office = ?, responsibility_center_code = ?, date = ? WHERE id = ?
        `;
        await connection.query(query, [iarNo, poNumber, supplier, poDate, invoiceNo, requisitioningOffice, responsibilityCenterCode, date, id]);
        
        // Replace items
        await connection.query(`DELETE FROM iar_items WHERE iar_record_id = ?`, [id]);
        if (items && items.length > 0) {
            const childValues = items.map(item => [id, item.description, item.unit, item.quantity, item.unitCost, item.totalCost]);
            await connection.query(`INSERT INTO iar_items (iar_record_id, description, unit, quantity, unit_cost, total_cost) VALUES ?`, [childValues]);
        }

        await connection.commit();
        res.json({ message: 'IAR record updated successfully!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// RIS RECORDS API
// ==========================================

app.get('/api/risRecords', async (req, res) => {
    try {
        const [records] = await pool.query(`
            SELECT id, ris_no AS risNo, division, responsibility_center_code AS responsibilityCenterCode, 
            DATE_FORMAT(date, '%Y-%m-%d') AS date FROM ris_records
        `);
        const [items] = await pool.query(`SELECT * FROM ris_items`);

        const parsedRows = records.map(record => ({
            ...record,
            items: items.filter(i => i.ris_record_id === record.id).map(i => ({
                id: i.id, stockNo: i.stock_no, description: i.description, unit: i.unit, 
                quantityRequested: i.quantity_requested, quantityIssued: i.quantity_issued, remarks: i.remarks
            }))
        }));
        res.json(parsedRows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/risRecords', async (req, res) => {
    const { risNo, division, responsibilityCenterCode, date, items } = req.body;
    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        await connection.query(`INSERT INTO ris_records (id, ris_no, division, responsibility_center_code, date) VALUES (?, ?, ?, ?, ?)`, 
            [id, risNo, division, responsibilityCenterCode, date]);

        if (items && items.length > 0) {
            const childValues = items.map(i => [id, i.stockNo, i.description, i.unit, i.quantityRequested, i.quantityIssued, i.remarks || null]);
            await connection.query(`INSERT INTO ris_items (ris_record_id, stock_no, description, unit, quantity_requested, quantity_issued, remarks) VALUES ?`, [childValues]);
        }
        await connection.commit();
        res.json({ message: 'RIS record added successfully!', id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// RSMI RECORDS API
// ==========================================

app.get('/api/rsmiRecords', async (req, res) => {
    try {
        const [records] = await pool.query(`SELECT id, report_no AS reportNo, period FROM rsmi_records`);
        const [items] = await pool.query(`SELECT * FROM rsmi_items`);

        const parsedRows = records.map(record => ({
            ...record,
            items: items.filter(i => i.rsmi_record_id === record.id).map(i => ({
                id: i.id, stockNo: i.stock_no, description: i.description, unit: i.unit, 
                quantity: i.quantity, unitCost: i.unit_cost, totalCost: i.total_cost, office: i.office
            }))
        }));
        res.json(parsedRows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rsmiRecords', async (req, res) => {
    const { reportNo, period, items } = req.body;
    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        await connection.query(`INSERT INTO rsmi_records (id, report_no, period) VALUES (?, ?, ?)`, [id, reportNo, period]);

        if (items && items.length > 0) {
            const childValues = items.map(i => [id, i.stockNo, i.description, i.unit, i.quantity, i.unitCost, i.totalCost, i.office]);
            await connection.query(`INSERT INTO rsmi_items (rsmi_record_id, stock_no, description, unit, quantity, unit_cost, total_cost, office) VALUES ?`, [childValues]);
        }
        await connection.commit();
        res.json({ message: 'RSMI record added successfully!', id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// STOCK CARD RECORDS API
// ==========================================

app.get('/api/stockCards', async (req, res) => {
    try {
        const [records] = await pool.query(`SELECT id, stock_no AS stockNo, description, unit, reorder_point AS reorderPoint FROM stock_cards`);
        const [transactions] = await pool.query(`SELECT id, stock_card_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, reference, received, issued, balance, office FROM stock_card_transactions`);

        const parsedRows = records.map(record => ({
            ...record,
            transactions: transactions.filter(t => t.stock_card_id === record.id).map(t => ({
                id: t.id, date: t.date, reference: t.reference, received: t.received, 
                issued: t.issued, balance: t.balance, office: t.office
            }))
        }));
        res.json(parsedRows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stockCards', async (req, res) => {
    const { stockNo, description, unit, reorderPoint, transactions } = req.body;
    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        await connection.query(`INSERT INTO stock_cards (id, stock_no, description, unit, reorder_point) VALUES (?, ?, ?, ?, ?)`, [id, stockNo, description, unit, reorderPoint]);

        if (transactions && transactions.length > 0) {
            const childValues = transactions.map(t => [id, t.date, t.reference, t.received, t.issued, t.balance, t.office || null]);
            await connection.query(`INSERT INTO stock_card_transactions (stock_card_id, date, reference, received, issued, balance, office) VALUES ?`, [childValues]);
        }
        await connection.commit();
        res.json({ message: 'Stock card added successfully!', id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/stockCards/:id', async (req, res) => {
    const { id } = req.params;
    const { stockNo, description, unit, reorderPoint, transactions } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        await connection.query(`UPDATE stock_cards SET stock_no = ?, description = ?, unit = ?, reorder_point = ? WHERE id = ?`, [stockNo, description, unit, reorderPoint, id]);
        
        await connection.query(`DELETE FROM stock_card_transactions WHERE stock_card_id = ?`, [id]);
        if (transactions && transactions.length > 0) {
            const childValues = transactions.map(t => [id, t.date, t.reference, t.received, t.issued, t.balance, t.office || null]);
            await connection.query(`INSERT INTO stock_card_transactions (stock_card_id, date, reference, received, issued, balance, office) VALUES ?`, [childValues]);
        }
        await connection.commit();
        res.json({ message: 'Stock card updated successfully!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// RPCI RECORDS API
// ==========================================

app.get('/api/rpciRecords', async (req, res) => {
    try {
        const [records] = await pool.query(`SELECT id, report_no AS reportNo, DATE_FORMAT(count_date, '%Y-%m-%d') AS countDate FROM rpci_records`);
        const [items] = await pool.query(`SELECT * FROM rpci_items`);

        const parsedRows = records.map(record => ({
            ...record,
            items: items.filter(i => i.rpci_record_id === record.id).map(i => ({
                id: i.id, stockNo: i.stock_no, description: i.description, unit: i.unit, 
                bookBalance: i.book_balance, physicalCount: i.physical_count, variance: i.variance, remarks: i.remarks
            }))
        }));
        res.json(parsedRows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rpciRecords', async (req, res) => {
    const { reportNo, countDate, items } = req.body;
    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        await connection.query(`INSERT INTO rpci_records (id, report_no, count_date) VALUES (?, ?, ?)`, [id, reportNo, countDate]);

        if (items && items.length > 0) {
            const childValues = items.map(i => [id, i.stockNo, i.description, i.unit, i.bookBalance, i.physicalCount, i.variance, i.remarks || null]);
            await connection.query(`INSERT INTO rpci_items (rpci_record_id, stock_no, description, unit, book_balance, physical_count, variance, remarks) VALUES ?`, [childValues]);
        }
        await connection.commit();
        res.json({ message: 'RPCI record added successfully!', id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Export the app for Vercel
module.exports = app;