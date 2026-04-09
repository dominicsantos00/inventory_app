// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
// === 1. ADD THIS MOCK AUTH MIDDLEWARE ===
app.use((req, res, next) => {
    req.user = {
        id: 'mock-user-1',
        email: 'admin@system.com',
        division_id: 'DIV-001', 
        division_code: 'ADMIN'
    };
    next();
});
// ========================================

// Serve static files from the dist directory (built frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// Root route for quick status check
app.get('/', (req, res) => {
    res.send('Inventory Management API is running. Try /api/deliveries or /api/users');
});

// ============ REAL AUTH LOGIN ENDPOINT ============
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const connection = await pool.getConnection();
        
        // Search for the user by username OR email
        const [users] = await connection.query(
            'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', 
            [username, username]
        );
        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];

        // Compare the password typed in React with the bcrypt hash in Railway
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Remove the password from the object before sending it back to React for security
        delete user.password;

        // Send success response back to React AuthContext
        res.status(200).json({
            user: user,
            token: 'valid-token' // Placeholder token to satisfy React's login function
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ AUTH VERIFY ENDPOINT (DISABLED) ============
app.get('/api/auth/verify', (req, res) => {
    res.json({
        success: true,
        message: 'Mock authentication is enabled'
    });
});

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'ballast.proxy.rlwy.net',
    user: process.env.MYSQLUSER || 'root',
    port: process.env.MYSQLPORT || 10627,
    password: process.env.MYSQLPASSWORD || 'VZbbuqKfMDwqoMtzFmygbDwBNSlVSfVw',
    database: process.env.MYSQLDATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toPositiveInt = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
};

async function getOrCreateStockCard(connection, { stockNo, description, unit }) {
    // Normalize stock number: trim, uppercase for case-insensitive matching
    const normalizedStockNo = (stockNo || '').trim().toUpperCase();
    
    // Case-insensitive lookup: compare UPPER(stock_no) values
    const [existing] = await connection.query(
        `SELECT id, description, unit FROM stock_cards WHERE UPPER(stock_no) = UPPER(?) LIMIT 1`,
        [normalizedStockNo]
    );
    
    if (existing.length > 0) {
        console.log(`[Stock Card] Found existing card for: ${normalizedStockNo}`);
        return existing[0].id;
    }

    const stockCardId = generateId();
    console.log(`[Stock Card] Creating new card for: ${normalizedStockNo}, desc: ${description || normalizedStockNo}, unit: ${unit}`);
    
    await connection.query(
        `INSERT INTO stock_cards (id, stock_no, description, unit, reorder_point) VALUES (?, ?, ?, ?, ?)`,
        [stockCardId, normalizedStockNo, description || normalizedStockNo, unit || null, 0]
    );
    return stockCardId;
}

async function getLatestBalanceByStockCardId(connection, stockCardId) {
    const [rows] = await connection.query(
        `SELECT balance FROM stock_card_transactions WHERE stock_card_id = ? ORDER BY date DESC, id DESC LIMIT 1`,
        [stockCardId]
    );
    return rows.length > 0 ? Number(rows[0].balance) : 0;
}

async function getStockInfoByStockNo(connection, stockNo) {
    // Normalize and lookup case-insensitively
    const normalizedStockNo = (stockNo || '').trim().toUpperCase();
    
    const [rows] = await connection.query(
        `SELECT id, stock_no AS stockNo, description, unit FROM stock_cards WHERE UPPER(stock_no) = UPPER(?) LIMIT 1`,
        [normalizedStockNo]
    );

    if (rows.length === 0) {
        return { stockCardId: null, stockNo: normalizedStockNo, description: null, unit: null, balance: 0 };
    }

    const row = rows[0];
    const balance = await getLatestBalanceByStockCardId(connection, row.id);
    return { stockCardId: row.id, stockNo: row.stockNo, description: row.description, unit: row.unit, balance };
}

async function insertStockTransaction(connection, { stockCardId, date, reference, received, issued, balance, office }) {
    const id = generateId();
    await connection.query(
        `INSERT INTO stock_card_transactions (id, stock_card_id, date, reference, received, issued, balance, office) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, stockCardId, date, reference, received, issued, balance, office || null]
    );
}

async function createRsmiFromRis(connection, { risNo, period, division, items }) {
    const reportNo = `RSMI-${risNo}`;
    const rsmiId = generateId();

    await connection.query(
        `INSERT INTO rsmi_records (id, report_no, period, is_auto_generated, source_ris_number) VALUES (?, ?, ?, ?, ?)`,
        [rsmiId, reportNo, period, true, risNo]
    );

    if (items.length > 0) {
        // First, debug: get all deliveries to see what's available
        const [allDeliveries] = await connection.query(
            `SELECT id, item, item_description, unit_price FROM deliveries ORDER BY date DESC`
        );
        console.log(`[DEBUG] All deliveries in DB:`, allDeliveries);

        const rsmiValues = [];
        
        for (const item of items) {
            let unitPrice = 0;
            
            console.log(`[RSMI] Processing item: stockNo="${item.stockNo}", description="${item.description}", qty=${item.quantityIssued}`);
            
            // Try 1: Exact match by item field (stock code)
            const [result1] = await connection.query(
                `SELECT unit_price FROM deliveries WHERE item = ? ORDER BY date DESC LIMIT 1`,
                [item.stockNo]
            );
            
            console.log(`[RSMI] Query 1 (item='${item.stockNo}'): found ${result1.length} records`);
            if (result1.length > 0) {
                unitPrice = parseFloat(result1[0].unit_price) || 0;
                console.log(`[RSMI] Matched! Unit Price: ${unitPrice}`);
            }
            
            // Try 2: Match by item_description if no match yet
            if (!unitPrice || unitPrice === 0) {
                const [result2] = await connection.query(
                    `SELECT unit_price FROM deliveries WHERE item_description LIKE ? ORDER BY date DESC LIMIT 1`,
                    [`%${item.description}%`]
                );
                console.log(`[RSMI] Query 2 (item_description LIKE '%${item.description}%'): found ${result2.length} records`);
                if (result2.length > 0) {
                    unitPrice = parseFloat(result2[0].unit_price) || 0;
                    console.log(`[RSMI] Matched! Unit Price: ${unitPrice}`);
                }
            }
            
            // Try 3: Get latest delivery if still no match
            if (!unitPrice || unitPrice === 0) {
                const [result3] = await connection.query(
                    `SELECT unit_price FROM deliveries ORDER BY date DESC LIMIT 1`
                );
                console.log(`[RSMI] Query 3 (latest delivery): found ${result3.length} records`);
                if (result3.length > 0) {
                    unitPrice = parseFloat(result3[0].unit_price) || 0;
                    console.log(`[RSMI] Using latest delivery. Unit Price: ${unitPrice}`);
                }
            }
            
            // Ensure unitPrice is a valid number
            if (!unitPrice || isNaN(unitPrice)) {
                console.log(`[RSMI] No valid unit price found, defaulting to 800`);
                unitPrice = 800;
            }
            
            const totalCost = parseFloat(item.quantityIssued) * unitPrice;
            
            console.log(`[RSMI] FINAL: Stock=${item.stockNo}, Qty=${item.quantityIssued}, UnitPrice=${unitPrice}, Total=${totalCost}`);

            rsmiValues.push([
                rsmiId,
                item.stockNo,
                item.description,
                item.unit,
                item.quantityIssued,
                unitPrice,
                totalCost,
                division || null,
            ]);
        }

        await connection.query(
            `INSERT INTO rsmi_items (rsmi_record_id, stock_no, description, unit, quantity, unit_cost, total_cost, office) VALUES ?`,
            [rsmiValues]
        );
    }

    return { rsmiId, reportNo };
}

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
    const id = generateId();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Normalize item code: trim and uppercase for consistent matching
        const stockNo = (item || '').trim().toUpperCase();
        const deliveredQty = toPositiveInt(quantity);
        if (!stockNo || deliveredQty <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Delivery requires a valid item code and quantity.' });
        }
        
        console.log(`[Delivery POST] Processing: ${stockNo}, Qty: ${deliveredQty}, Desc: ${itemDescription}`);

        const query = `
            INSERT INTO deliveries 
            (id, type, date, po_number, po_date, supplier, receipt_number, item, item_description, unit, quantity, unit_price, total_price, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [id, type, date, poNumber, poDate, supplier, receiptNumber, item, itemDescription || null, unit, quantity, unitPrice, totalPrice, remarks || null]);

        const stockCardId = await getOrCreateStockCard(connection, {
            stockNo,
            description: itemDescription || stockNo,
            unit,
        });

        const currentBalance = await getLatestBalanceByStockCardId(connection, stockCardId);
        const newBalance = currentBalance + deliveredQty;

        console.log(`[Delivery POST] Stock Card: ${stockCardId}, Current Balance: ${currentBalance}, Adding: ${deliveredQty}, New Balance: ${newBalance}`);

        await insertStockTransaction(connection, {
            stockCardId,
            date,
            reference: `DEL-${receiptNumber || id}`,
            received: deliveredQty,
            issued: 0,
            balance: newBalance,
            office: null,
        });

        await connection.commit();
        console.log(`[Delivery POST] SUCCESS - Item: ${stockNo}, Qty: ${deliveredQty}, New Balance: ${newBalance}`);
        res.json({ message: 'Delivery added successfully!', id, stockCardId, balance: newBalance });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding delivery:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/deliveries/:id', async (req, res) => {
    const { id } = req.params;
    const { type, date, poNumber, poDate, supplier, receiptNumber, item, itemDescription, unit, quantity, unitPrice, totalPrice, remarks } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Get the original delivery to compare quantities
        const [existingDeliveries] = await connection.query('SELECT item, quantity FROM deliveries WHERE id = ?', [id]);
        if (existingDeliveries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Delivery not found' });
        }

        const oldDelivery = existingDeliveries[0];
        const oldQuantity = toPositiveInt(oldDelivery.quantity);
        const newQuantity = toPositiveInt(quantity);
        const quantityDifference = newQuantity - oldQuantity;

        console.log(`[Delivery PUT] ID: ${id}, Old Qty: ${oldQuantity}, New Qty: ${newQuantity}, Diff: ${quantityDifference}`);

        // Normalize item code for consistent matching
        const stockNo = (item || '').trim().toUpperCase();

        // Update the delivery record (store normalized item code)
        const updateQuery = `
            UPDATE deliveries 
            SET type = ?, date = ?, po_number = ?, po_date = ?, supplier = ?, receipt_number = ?, 
                item = ?, item_description = ?, unit = ?, quantity = ?, unit_price = ?, 
                total_price = ?, remarks = ?
            WHERE id = ?
        `;
        await connection.query(updateQuery, [type, date, poNumber, poDate, supplier, receiptNumber, stockNo, itemDescription || null, unit, quantity, unitPrice, totalPrice, remarks || null, id]);
        if (!stockNo || newQuantity <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Delivery requires a valid item code and quantity.' });
        }

        // Only update stock card if quantity changed
        if (quantityDifference !== 0) {
            console.log(`[Delivery PUT] Updating stock card for: ${stockNo}, Difference: ${quantityDifference}`);
            
            const stockCardId = await getOrCreateStockCard(connection, {
                stockNo,
                description: itemDescription || stockNo,
                unit,
            });

            const currentBalance = await getLatestBalanceByStockCardId(connection, stockCardId);
            const newBalance = currentBalance + quantityDifference;

            console.log(`[Delivery PUT] Stock Card: ${stockCardId}, Current: ${currentBalance}, Adjustment: ${quantityDifference}, New Balance: ${newBalance}`);

            // Create adjustment transaction
            await insertStockTransaction(connection, {
                stockCardId,
                date,
                reference: `DEL-ADJUST-${id}`,
                received: Math.max(0, quantityDifference),  // Only record positive receives
                issued: quantityDifference < 0 ? Math.abs(quantityDifference) : 0,  // Only record positive issues for reversals
                balance: newBalance,
                office: null,
            });
        }

        await connection.commit();
        console.log(`[Delivery PUT] SUCCESS - Item: ${stockNo}, New Qty: ${newQuantity}`);
        res.json({ message: 'Delivery updated successfully and stock adjusted!' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating delivery:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/deliveries/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get the delivery details
        const [deliveries] = await connection.query('SELECT id, item AS stockNo, quantity FROM deliveries WHERE id = ?', [id]);
        
        if (deliveries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Delivery not found' });
        }
        
        console.log(`[Delivery DELETE] ID: ${id}`);
        
        // Reverse stock transactions for each item in this delivery
        for (const delivery of deliveries) {
            const normalizedStockNo = (delivery.stockNo || '').trim().toUpperCase();
            
            const [stockCards] = await connection.query(
                'SELECT id FROM stock_cards WHERE UPPER(stock_no) = UPPER(?) LIMIT 1',
                [normalizedStockNo]
            );
            
            if (stockCards.length > 0) {
                const stockCardId = stockCards[0].id;
                
                console.log(`[Delivery DELETE] Reversing stock for: ${normalizedStockNo}, Qty: ${delivery.quantity}`);
                
                // Get the latest balance before reversing
                const [latestTx] = await connection.query(
                    'SELECT balance FROM stock_card_transactions WHERE stock_card_id = ? ORDER BY date DESC, id DESC LIMIT 1',
                    [stockCardId]
                );
                
                const currentBalance = latestTx.length > 0 ? latestTx[0].balance : 0;
                const reversedBalance = currentBalance - delivery.quantity;
                
                console.log(`[Delivery DELETE] Stock Card: ${stockCardId}, Current: ${currentBalance}, Reversing: ${delivery.quantity}, New Balance: ${reversedBalance}`);
                
                // Create reverse transaction
                const reversalId = generateId();
                await connection.query(
                    `INSERT INTO stock_card_transactions (id, stock_card_id, date, reference, received, issued, balance) 
                     VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
                    [reversalId, stockCardId, `DELIVERY-REVERSAL-${id}`, 0, delivery.quantity, reversedBalance]
                );
            } else {
                console.warn(`[Delivery DELETE] No stock card found for item: ${normalizedStockNo}`);
            }
        }
        
        // Delete the delivery
        await connection.query('DELETE FROM deliveries WHERE id = ?', [id]);
        
        await connection.commit();
        console.log(`[Delivery DELETE] SUCCESS - ID: ${id}`);
        res.json({ message: 'Delivery deleted successfully and stock quantities reversed!' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete Delivery Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// USERS API
// ==========================================

app.get('/api/users', async (req, res) => {
    try {
        const query = `SELECT id, username, full_name AS fullName, role, division_id AS division, email FROM users`;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, fullName, role, division, email } = req.body;
    
    // Validation
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }
    if (!fullName || !fullName.trim()) {
        return res.status(400).json({ error: 'Full name is required' });
    }
    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }
    if (role === 'end-user' && (!division || !division.trim())) {
        return res.status(400).json({ error: 'Division is required for End Users' });
    }

    const id = Date.now().toString();
    try {
        const trimmedUsername = username.trim();
        const trimmedFullName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedDivision = division ? division.trim() : null;
        
        const query = `INSERT INTO users (id, username, full_name, role, division_id, email) VALUES (?, ?, ?, ?, ?, ?)`;
        await pool.query(query, [id, trimmedUsername, trimmedFullName, role, trimmedDivision, trimmedEmail]);
        
        // Return complete user object with all fields - 201 Created status
        const newUser = {
            id,
            username: trimmedUsername,
            fullName: trimmedFullName,
            role,
            division: trimmedDivision,
            email: trimmedEmail
        };
        
        console.log('[User Created]', newUser);
        res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        console.error('[User Creation Error]', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, fullName, role, division, email } = req.body;
    try {
        const query = `UPDATE users SET username = ?, full_name = ?, role = ?, division_id = ?, email = ? WHERE id = ?`;
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
                id: i.id, stockNo: i.stock_no, description: i.description, unit: i.unit, quantity: i.quantity, unitCost: i.unit_cost, totalCost: i.total_cost
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
            const childValues = items.map(item => [id, item.stockNo || null, item.description, item.unit, item.quantity, item.unitCost, item.totalCost]);
            await connection.query(`INSERT INTO iar_items (iar_record_id, stock_no, description, unit, quantity, unit_cost, total_cost) VALUES ?`, [childValues]);
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
        
        await connection.query(`DELETE FROM iar_items WHERE iar_record_id = ?`, [id]);
        if (items && items.length > 0) {
            const childValues = items.map(item => [id, item.stockNo || null, item.description, item.unit, item.quantity, item.unitCost, item.totalCost]);
            await connection.query(`INSERT INTO iar_items (iar_record_id, stock_no, description, unit, quantity, unit_cost, total_cost) VALUES ?`, [childValues]);
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

// ADDED: DELETE route to remove IAR records
app.delete('/api/iarRecords/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM iar_items WHERE iar_record_id = ?', [id]);
        await connection.query('DELETE FROM iar_records WHERE id = ?', [id]);
        await connection.commit();
        res.json({ message: 'IAR record deleted successfully!' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete IAR Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// RIS RECORDS API
// ==========================================

// Get RIS records for the authenticated user's division only
app.get('/api/risRecords', async (req, res) => {
    try {
        const userDivisionId = req.user.division_id;
        
        // Get RIS records for user's division only
        const [records] = await pool.query(`
            SELECT id, ris_no AS risNo, division, responsibility_center_code AS responsibilityCenterCode, 
            DATE_FORMAT(date, '%Y-%m-%d') AS date, requested_by AS requestedBy, requesting_office AS requestingOffice,
            DATE_FORMAT(request_date, '%Y-%m-%d') AS requestDate 
            FROM ris_records 
            WHERE division_id = ? OR division_id IS NULL
            ORDER BY date DESC
        `, [userDivisionId]);
        
        const [items] = await pool.query(`SELECT * FROM ris_items`);

        const parsedRows = records.map(record => ({
            ...record,
            divisionId: userDivisionId,
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
    const { risNo, division, responsibilityCenterCode, date, requestedBy, requestingOffice, requestDate, items } = req.body;
    const id = generateId();
    const userDivisionId = req.user.division_id;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        if (!Array.isArray(items) || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'RIS requires at least one item.' });
        }

        const normalizedItems = [];
        const stockState = new Map();
        const insufficient = [];

        for (const item of items) {
            const stockNo = (item.stockNo || '').trim();
            const quantityRequested = toPositiveInt(item.quantityRequested);
            const quantityIssued = toPositiveInt(item.quantityIssued || item.quantityRequested);

            if (!stockNo || quantityRequested <= 0 || quantityIssued <= 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Every RIS item must have stock number and positive quantity.' });
            }

            if (!stockState.has(stockNo)) {
                const stockInfo = await getStockInfoByStockNo(connection, stockNo);
                stockState.set(stockNo, {
                    stockCardId: stockInfo.stockCardId,
                    remaining: stockInfo.balance,
                });
            }

            const stockInfo = stockState.get(stockNo);
            if (!stockInfo.stockCardId || quantityRequested > stockInfo.remaining) {
                insufficient.push({
                    stockNo,
                    requested: quantityRequested,
                    available: stockInfo.remaining,
                });
            } else {
                stockInfo.remaining -= quantityRequested;
            }

            normalizedItems.push({
                stockNo,
                description: item.description,
                unit: item.unit,
                quantityRequested,
                quantityIssued,
                remarks: item.remarks || null,
            });
        }

        if (insufficient.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                error: 'Insufficient Stock',
                details: insufficient,
            });
        }

        // Save RIS record with division_id
        await connection.query(
            `INSERT INTO ris_records (id, ris_no, division, responsibility_center_code, date, requested_by, requesting_office, request_date, division_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, risNo, division, responsibilityCenterCode, date, requestedBy || null, requestingOffice || null, requestDate || null, userDivisionId]
        );

        const childValues = normalizedItems.map((i) => [id, i.stockNo, i.description, i.unit, i.quantityRequested, i.quantityIssued, i.remarks]);
        await connection.query(`INSERT INTO ris_items (ris_record_id, stock_no, description, unit, quantity_requested, quantity_issued, remarks) VALUES ?`, [childValues]);

        const stockDeductionState = new Map();
        for (const item of normalizedItems) {
            const stockInfo = await getStockInfoByStockNo(connection, item.stockNo);
            const currentBalance = stockDeductionState.has(item.stockNo)
                ? stockDeductionState.get(item.stockNo)
                : stockInfo.balance;

            const newBalance = currentBalance - item.quantityIssued;
            await insertStockTransaction(connection, {
                stockCardId: stockInfo.stockCardId,
                date,
                reference: `RIS-${risNo}`,
                received: 0,
                issued: item.quantityIssued,
                balance: newBalance,
                office: division || null,
            });

            stockDeductionState.set(item.stockNo, newBalance);
        }

        const period = typeof date === 'string' && date.length >= 7 ? date.slice(0, 7) : null;
        const { rsmiId } = await createRsmiFromRis(connection, {
            risNo,
            period,
            division,
            items: normalizedItems,
        });

        // Update RSMI with division_id
        await connection.query(
            `UPDATE rsmi_records SET division_id = ? WHERE id = ?`,
            [userDivisionId, rsmiId]
        );

        await connection.commit();
        
        // Send notification to user
        console.log(`[NOTIFICATION] RIS created for ${req.user.email} - Division: ${req.user.division_code}`);
        
        res.json({ 
            message: 'RIS record added successfully!', 
            id, 
            rsmiId,
            notification: 'Your RIS request has been created successfully.'
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/risRecords/:id', async (req, res) => {
    const { id } = req.params;
    const { requestedBy, requestingOffice, requestDate } = req.body;
    const userDivisionId = req.user.division_id;
    const connection = await pool.getConnection();

    try {
        // Verify user owns this RIS record
        const [ris] = await connection.query(
            'SELECT division_id FROM ris_records WHERE id = ?',
            [id]
        );
        
        if (ris.length === 0) {
            return res.status(404).json({ error: 'RIS record not found' });
        }
        
        if (ris[0].division_id !== userDivisionId) {
            return res.status(403).json({ error: 'You can only update your own RIS records' });
        }

        // Only allow updating these fields to maintain stock-card audit integrity
        await connection.query(
            `UPDATE ris_records SET requested_by = ?, requesting_office = ?, request_date = ? WHERE id = ?`,
            [requestedBy || null, requestingOffice || null, requestDate || null, id]
        );

        res.json({ message: 'RIS record updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/risRecords/:id', async (req, res) => {
    const { id } = req.params;
    const userDivisionId = req.user.division_id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Fetch RIS record
        const [risRecords] = await connection.query(
            `SELECT id, ris_no, division, date, division_id FROM ris_records WHERE id = ?`,
            [id]
        );

        if (risRecords.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'RIS record not found.' });
        }

        const risRecord = risRecords[0];
        
        // Verify user owns this RIS record
        if (risRecord.division_id !== userDivisionId) {
            await connection.rollback();
            return res.status(403).json({ error: 'You can only delete your own RIS records' });
        }

        // 2. Fetch all RIS items
        const [risItems] = await connection.query(
            `SELECT stock_no, quantity_issued FROM ris_items WHERE ris_record_id = ?`,
            [id]
        );

        // 3. Reverse stock transactions for each item
        for (const item of risItems) {
            const stockInfo = await getStockInfoByStockNo(connection, item.stock_no);

            if (stockInfo.stockCardId) {
                // Get the current balance before the RIS was issued
                const restoredBalance = stockInfo.balance + item.quantity_issued;

                // Create reverse transaction (received = quantity_issued, issued = 0)
                await insertStockTransaction(connection, {
                    stockCardId: stockInfo.stockCardId,
                    date: risRecord.date,
                    reference: `REVERSAL-RIS-${risRecord.ris_no}`,
                    received: item.quantity_issued,
                    issued: 0,
                    balance: restoredBalance,
                    office: risRecord.division || null,
                });
            }
        }

        // 4. Delete related RSMI records
        // RSMI records are auto-generated with report_no = RSMI-{risNo}
        const rsmiReportNo = `RSMI-${risRecord.ris_no}`;
        const [rsmiRecords] = await connection.query(
            `SELECT id FROM rsmi_records WHERE report_no = ?`,
            [rsmiReportNo]
        );

        for (const rsmiRecord of rsmiRecords) {
            await connection.query(
                `DELETE FROM rsmi_items WHERE rsmi_record_id = ?`,
                [rsmiRecord.id]
            );
            await connection.query(
                `DELETE FROM rsmi_records WHERE id = ?`,
                [rsmiRecord.id]
            );
        }

        // 5. Delete RIS items
        await connection.query(
            `DELETE FROM ris_items WHERE ris_record_id = ?`,
            [id]
        );

        // 6. Delete RIS record
        await connection.query(
            `DELETE FROM ris_records WHERE id = ?`,
            [id]
        );

        await connection.commit();
        res.json({ 
            message: 'RIS record deleted successfully! Stock has been reversed.',
            stockReversed: true,
            rsmiRecordsDeleted: rsmiRecords.length 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Delete RIS Error:', error);
        res.status(500).json({ error: 'Failed to delete RIS record. Please try again.', details: error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// RSMI RECORDS API
// ==========================================

// Get RSMI records for the authenticated user's division only
app.get('/api/rsmiRecords', async (req, res) => {
    try {
        const userDivisionId = req.user.division_id;
        
        // Get RSMI records for user's division only
        const [records] = await pool.query(`
            SELECT id, report_no AS reportNo, period, division_id 
            FROM rsmi_records 
            WHERE division_id = ? OR division_id IS NULL
            ORDER BY period DESC
        `, [userDivisionId]);
        
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
    
    // Validate report number is not empty
    if (!reportNo || reportNo.trim() === '') {
        return res.status(400).json({ 
            error: 'Report Number is required and cannot be empty.' 
        });
    }
    
    const id = Date.now().toString();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Determine if this is auto-generated (starts with RSMI-) or manually created
        const isAutoGenerated = reportNo.startsWith('RSMI-');
        const sourceRisNumber = isAutoGenerated ? reportNo.replace('RSMI-', '') : null;
        
        await connection.query(`INSERT INTO rsmi_records (id, report_no, period, is_auto_generated, source_ris_number) VALUES (?, ?, ?, ?, ?)`, 
            [id, reportNo, period, isAutoGenerated, sourceRisNumber]);

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

// ADDED: PUT route to update existing RSMI records
app.put('/api/rsmiRecords/:id', async (req, res) => {
    const { id } = req.params;
    const { reportNo, period, items } = req.body;
    const connection = await pool.getConnection();

    try {
        // Check if RSMI is auto-generated and prevent editing
        const [rsmiRecords] = await connection.query('SELECT is_auto_generated FROM rsmi_records WHERE id = ?', [id]);
        
        if (rsmiRecords.length === 0) {
            return res.status(404).json({ error: 'RSMI record not found' });
        }
        
        if (rsmiRecords[0].is_auto_generated) {
            return res.status(403).json({ 
                error: 'Auto-generated RSMI records cannot be edited. This record was automatically created from an approved RIS transaction.' 
            });
        }
        
        await connection.beginTransaction();
        
        await connection.query(`UPDATE rsmi_records SET report_no = ?, period = ? WHERE id = ?`, [reportNo, period, id]);
        
        await connection.query(`DELETE FROM rsmi_items WHERE rsmi_record_id = ?`, [id]);
        
        if (items && items.length > 0) {
            const childValues = items.map(i => [id, i.stockNo, i.description, i.unit, i.quantity, i.unitCost, i.totalCost, i.office]);
            await connection.query(`INSERT INTO rsmi_items (rsmi_record_id, stock_no, description, unit, quantity, unit_cost, total_cost, office) VALUES ?`, [childValues]);
        }

        await connection.commit();
        res.json({ message: 'RSMI record updated successfully!' });
    } catch (error) {
        await connection.rollback();
        console.error('Update RSMI Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ADDED: DELETE route to remove RSMI records
app.delete('/api/rsmiRecords/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        // Check if RSMI is auto-generated and prevent deletion
        const [rsmiRecords] = await connection.query('SELECT is_auto_generated, source_ris_number FROM rsmi_records WHERE id = ?', [id]);
        
        if (rsmiRecords.length === 0) {
            return res.status(404).json({ error: 'RSMI record not found' });
        }
        
        if (rsmiRecords[0].is_auto_generated) {
            return res.status(403).json({ 
                error: `Auto-generated RSMI records cannot be deleted. This record was automatically created from RIS #${rsmiRecords[0].source_ris_number}. Please delete the source RIS to remove this RSMI.` 
            });
        }
        
        await connection.beginTransaction();
        await connection.query('DELETE FROM rsmi_items WHERE rsmi_record_id = ?', [id]);
        await connection.query('DELETE FROM rsmi_records WHERE id = ?', [id]);
        await connection.commit();
        res.json({ message: 'RSMI record deleted successfully!' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete RSMI Error:', error);
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
        const [transactions] = await pool.query(`SELECT id, stock_card_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, reference, received, issued, balance, office FROM stock_card_transactions ORDER BY stock_card_id, date, id`);

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

app.get('/api/stockCards/balance/:stockNo', async (req, res) => {
    const { stockNo } = req.params;
    try {
        const stockInfo = await getStockInfoByStockNo(pool, stockNo);
        if (!stockInfo.stockCardId) {
            return res.status(404).json({ error: 'Stock item not found.' });
        }

        res.json({
            stockNo: stockInfo.stockNo,
            description: stockInfo.description,
            unit: stockInfo.unit,
            available: stockInfo.balance,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/rpciSummary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                sc.id,
                sc.stock_no AS stockNo,
                sc.description,
                sc.unit,
                COALESCE((
                    SELECT sct.balance
                    FROM stock_card_transactions sct
                    WHERE sct.stock_card_id = sc.id
                    ORDER BY sct.date DESC, sct.id DESC
                    LIMIT 1
                ), 0) AS remaining
            FROM stock_cards sc
            ORDER BY sc.stock_no
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

app.delete('/api/stockCards/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Delete transactions first
        await connection.query(`DELETE FROM stock_card_transactions WHERE stock_card_id = ?`, [id]);
        
        // Delete stock card
        await connection.query(`DELETE FROM stock_cards WHERE id = ?`, [id]);
        
        await connection.commit();
        res.json({ message: 'Stock card deleted successfully!' });
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

// ==========================================
// PURCHASE ORDER (PO) RECORDS API
// ==========================================

app.get('/api/poRecords', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, po_no AS poNo, supplier, DATE_FORMAT(po_date, '%Y-%m-%d') AS poDate, 
            invoice_no AS invoiceNo, remarks, status 
            FROM po_records ORDER BY po_date DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/poRecords', async (req, res) => {
    const { poNo, supplier, poDate, invoiceNo, remarks, status } = req.body;
    const id = generateId();
    try {
        await pool.query(
            `INSERT INTO po_records (id, po_no, supplier, po_date, invoice_no, remarks, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, poNo, supplier, poDate, invoiceNo, remarks || null, status || 'pending']
        );
        res.json({ message: 'PO record added successfully!', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/poRecords/:id', async (req, res) => {
    const { id } = req.params;
    const { poNo, supplier, poDate, invoiceNo, remarks, status } = req.body;
    try {
        await pool.query(
            `UPDATE po_records SET po_no = ?, supplier = ?, po_date = ?, invoice_no = ?, remarks = ?, status = ? WHERE id = ?`,
            [poNo, supplier, poDate, invoiceNo, remarks || null, status, id]
        );
        res.json({ message: 'PO record updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/poRecords/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM po_records WHERE id = ?', [id]);
        res.json({ message: 'PO record deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RPCI AUTO-GENERATION AND MANAGEMENT
// ==========================================

// Get all stock card items with latest balances for RPCI generation
app.get('/api/rpciRecords/fetch-stock-items', async (req, res) => {
    try {
        // Fetch all stock cards with their complete transaction history
        const [stockCards] = await pool.query(`
            SELECT 
                sc.id,
                sc.stock_no,
                sc.description,
                sc.unit,
                COALESCE((
                    SELECT sct.balance
                    FROM stock_card_transactions sct
                    WHERE sct.stock_card_id = sc.id
                    ORDER BY sct.date DESC, sct.id DESC
                    LIMIT 1
                ), 0) AS bookBalance,
                COALESCE((
                    SELECT SUM(sct.received)
                    FROM stock_card_transactions sct
                    WHERE sct.stock_card_id = sc.id
                ), 0) AS totalDelivered,
                COALESCE((
                    SELECT SUM(sct.issued)
                    FROM stock_card_transactions sct
                    WHERE sct.stock_card_id = sc.id
                ), 0) AS totalIssued,
                COALESCE((
                    SELECT d.unit_price
                    FROM deliveries d
                    WHERE UPPER(d.item) = UPPER(sc.stock_no)
                    ORDER BY d.date DESC
                    LIMIT 1
                ), 0) AS unitPrice
            FROM stock_cards sc
            ORDER BY sc.stock_no ASC
        `);

        if (stockCards.length === 0) {
            return res.status(200).json({ 
                message: 'No stock cards available. Create deliveries to populate RPCI.',
                items: [],
                grandTotal: 0,
                totalDeliveredSum: 0,
                totalIssuedSum: 0
            });
        }

        // Transform for RPCI items format with calculated totals
        const items = stockCards.map(sc => {
            const totalCost = sc.bookBalance * sc.unitPrice;
            return {
                stockNo: sc.stock_no,
                description: sc.description,
                unit: sc.unit,
                bookBalance: sc.bookBalance,  // Source of truth: Stock Card final balance
                totalDelivered: sc.totalDelivered,  // Total received quantity
                totalIssued: sc.totalIssued,  // Total issued quantity
                unitPrice: sc.unitPrice,      // Latest unit price from deliveries
                totalCost: totalCost,         // Remaining Qty × Unit Price
                physicalCount: 0,
                variance: 0,
                remarks: ''
            };
        });

        // Calculate Grand Total from remaining balances
        const grandTotal = items.reduce((sum, item) => sum + item.totalCost, 0);
        const totalDeliveredSum = items.reduce((sum, item) => sum + item.totalDelivered, 0);
        const totalIssuedSum = items.reduce((sum, item) => sum + item.totalIssued, 0);

        res.json({ 
            message: `Stock Card auto-derived: ${items.length} unique items. Grand Total based on remaining balances.`,
            itemCount: items.length,
            items,
            grandTotal,
            totalDeliveredSum,
            totalIssuedSum,
            computationDetails: {
                formula: 'Remaining Balance = Total Delivered - Total Issued',
                source: 'stock_card_transactions (auto-updated from Delivery/RIS)',
                refreshedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching stock items for RPCI:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rpciRecords/auto-generate', async (req, res) => {
    const { countDate } = req.body;
    const reportNo = `RPCI-${Date.now()}`;
    const id = generateId();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Get latest stock card balances
        const [stockCards] = await connection.query(`
            SELECT 
                sc.id,
                sc.stock_no,
                sc.description,
                sc.unit,
                COALESCE((
                    SELECT sct.balance
                    FROM stock_card_transactions sct
                    WHERE sct.stock_card_id = sc.id
                    ORDER BY sct.date DESC, sct.id DESC
                    LIMIT 1
                ), 0) AS bookBalance
            FROM stock_cards sc
        `);

        if (stockCards.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'No stock cards found to generate RPCI.' });
        }

        // Create RPCI record
        await connection.query(
            `INSERT INTO rpci_records (id, report_no, count_date) VALUES (?, ?, ?)`,
            [id, reportNo, countDate]
        );

        // Add items to RPCI (all items get bookBalance from stock card)
        const rpciItems = stockCards.map(sc => [
            id,
            sc.stock_no,
            sc.description,
            sc.unit,
            sc.bookBalance,
            0, // physical_count to be filled manually
            0, // variance
            null // remarks
        ]);

        await connection.query(
            `INSERT INTO rpci_items (rpci_record_id, stock_no, description, unit, book_balance, physical_count, variance, remarks) VALUES ?`,
            [rpciItems]
        );

        await connection.commit();
        res.json({ message: 'RPCI generated successfully!', id, reportNo, itemCount: stockCards.length });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/rpciRecords/:id', async (req, res) => {
    const { id } = req.params;
    const { reportNo, countDate, items } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `UPDATE rpci_records SET report_no = ?, count_date = ? WHERE id = ?`,
            [reportNo, countDate, id]
        );

        await connection.query(`DELETE FROM rpci_items WHERE rpci_record_id = ?`, [id]);

        if (items && items.length > 0) {
            const childValues = items.map(i => [
                id,
                i.stockNo,
                i.description,
                i.unit,
                i.bookBalance,
                i.physicalCount,
                i.variance || (i.physicalCount - i.bookBalance),
                i.remarks || null
            ]);
            await connection.query(
                `INSERT INTO rpci_items (rpci_record_id, stock_no, description, unit, book_balance, physical_count, variance, remarks) VALUES ?`,
                [childValues]
            );
        }

        await connection.commit();
        res.json({ message: 'RPCI record updated successfully!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/rpciRecords/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM rpci_items WHERE rpci_record_id = ?', [id]);
        await connection.query('DELETE FROM rpci_records WHERE id = ?', [id]);
        await connection.commit();
        res.json({ message: 'RPCI record deleted successfully!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// SPA fallback: serve index.html for any unmatched routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Not found' });
        }
    });
});

// Initialize sample data
async function initializeDatabase() {
    const connection = await pool.getConnection();
    try {
        // Check if deliveries table is empty
        const [deliveries] = await connection.query('SELECT COUNT(*) as count FROM deliveries');
        if (deliveries[0].count === 0) {
            console.log('Loading sample data...');
            
            // Insert sample data
            const sampleDeliveries = [
                ['DEL-001', 'Office Supplies', '2026-03-15', 'PO-2026-001', '2026-03-10', 'ABC Supplies Co.', 'REC-001', 'OS-001', 'Bond Paper A4', 'ream', 50, 120.00, 6000.00, null],
                ['DEL-002', 'Office Supplies', '2026-03-16', 'PO-2026-002', '2026-03-11', 'XYZ Trading', 'REC-002', 'OS-003', 'Ballpen Black', 'piece', 200, 12.00, 2400.00, null],
                ['DEL-003', 'Office Supplies', '2026-03-17', 'PO-2026-003', '2026-03-12', 'ABC Supplies Co.', 'REC-003', 'OS-004', 'Neon Highlighter', 'Set (3 piece/Set)', 100, 85.00, 8500.00, null],
                ['DEL-004', 'Equipment', '2026-03-18', 'PO-2026-004', '2026-03-13', 'Tech Solutions', 'REC-004', 'EQ-001', 'Desktop Computer', 'unit', 5, 35000.00, 175000.00, null],
                ['DEL-005', 'Office Supplies', '2026-03-19', 'PO-2026-005', '2026-03-14', 'XYZ Trading', 'REC-005', 'OS-005', 'Manila Folder', 'piece', 300, 8.00, 2400.00, null]
            ];
            
            for (const delivery of sampleDeliveries) {
                await connection.query(
                    'INSERT IGNORE INTO deliveries (id, type, date, po_number, po_date, supplier, receipt_number, item, item_description, unit, quantity, unit_price, total_price, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    delivery
                );
            }
            
            console.log('Sample data loaded successfully!');
        }
    } catch (error) {
        console.error('Error initializing database:', error.message);
    } finally {
        connection.release();
    }
}

// === 2. VERCEL SERVERLESS EXPORT ===
// Only use app.listen if running locally
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, async () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
        try {
            await initializeDatabase();
        } catch (error) {
            console.error('Database initialization failed:', error.message);
        }
    });
}

// Export the app for Vercel Serverless deployment
module.exports = app;
// ===================================