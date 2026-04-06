-- Database Schema for Inventory Management System
-- Run this script to create all necessary tables

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    division VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_role (role)
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100),
    date DATE,
    po_number VARCHAR(100),
    po_date DATE,
    supplier VARCHAR(255),
    receipt_number VARCHAR(100),
    item VARCHAR(100),
    item_description TEXT,
    unit VARCHAR(50),
    quantity INT,
    unit_price DECIMAL(12, 2),
    total_price DECIMAL(12, 2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_deliveries_item (item),
    INDEX idx_deliveries_date (date)
);

-- SSN Items Table
CREATE TABLE IF NOT EXISTS ssn_items (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RCC Items Table
CREATE TABLE IF NOT EXISTS rcc_items (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    office_name VARCHAR(255),
    division_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RIS Records Table
CREATE TABLE IF NOT EXISTS ris_records (
    id VARCHAR(255) PRIMARY KEY,
    ris_no VARCHAR(100) NOT NULL UNIQUE,
    date DATE,
    division VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IAR Records Table
CREATE TABLE IF NOT EXISTS iar_records (
    id VARCHAR(255) PRIMARY KEY,
    iar_no VARCHAR(100) NOT NULL UNIQUE,
    po_number VARCHAR(100),
    supplier VARCHAR(255),
    po_date DATE,
    invoice_no VARCHAR(100),
    requisitioning_office VARCHAR(255),
    responsibility_center_code VARCHAR(100),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PO Records Table
CREATE TABLE IF NOT EXISTS po_records (
    id VARCHAR(255) PRIMARY KEY,
    po_no VARCHAR(100) NOT NULL UNIQUE,
    supplier VARCHAR(255),
    po_date DATE,
    invoice_no VARCHAR(100),
    remarks TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ris_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ris_record_id VARCHAR(255) NOT NULL,
    stock_no VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(50),
    quantity_requested INT NOT NULL,
    quantity_issued INT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ris_items_record_id (ris_record_id),
    INDEX idx_ris_items_stock_no (stock_no),
    CONSTRAINT fk_ris_items_record FOREIGN KEY (ris_record_id) REFERENCES ris_records(id) ON DELETE CASCADE
);

-- RSMI Records Table
CREATE TABLE rsmi_records (
    id VARCHAR(255) PRIMARY KEY,
    report_no VARCHAR(255) NOT NULL,
    period VARCHAR(255),
    items JSON,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    source_ris_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rsmi_auto_gen (is_auto_generated),
    INDEX idx_rsmi_source_ris (source_ris_number)
);

CREATE TABLE rsmi_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rsmi_record_id VARCHAR(255) NOT NULL,
    stock_no VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(50),
    quantity INT NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    office VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rsmi_items_record_id (rsmi_record_id),
    INDEX idx_rsmi_items_stock_no (stock_no),
    CONSTRAINT fk_rsmi_items_record FOREIGN KEY (rsmi_record_id) REFERENCES rsmi_records(id) ON DELETE CASCADE
);

-- Stock Cards Table
CREATE TABLE stock_cards (
    id VARCHAR(255) PRIMARY KEY,
    stock_no VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    reorder_point INT,
    transactions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_stock_cards_stock_no (stock_no)
);

DROP TABLE IF EXISTS stock_card_transactions;
CREATE TABLE stock_card_transactions (
    id VARCHAR(255) PRIMARY KEY,
    stock_card_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    reference VARCHAR(255) NOT NULL,
    received INT NOT NULL DEFAULT 0,
    issued INT NOT NULL DEFAULT 0,
    balance INT NOT NULL,
    office VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stock_txn_card_date (stock_card_id, date),
    INDEX idx_stock_txn_reference (reference),
    CONSTRAINT fk_stock_txn_card FOREIGN KEY (stock_card_id) REFERENCES stock_cards(id) ON DELETE CASCADE
);

-- RPCI Records Table
CREATE TABLE rpci_records (
    id VARCHAR(255) PRIMARY KEY,
    report_no VARCHAR(255) NOT NULL,
    count_date DATE,
    items JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rpci_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rpci_record_id VARCHAR(255) NOT NULL,
    stock_no VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(50),
    book_balance INT NOT NULL,
    physical_count INT NOT NULL,
    variance INT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rpci_items_record_id (rpci_record_id),
    INDEX idx_rpci_items_stock_no (stock_no),
    CONSTRAINT fk_rpci_items_record FOREIGN KEY (rpci_record_id) REFERENCES rpci_records(id) ON DELETE CASCADE
);

-- Insert sample data for testing
INSERT IGNORE INTO users (id, username, full_name, role, division, email) VALUES 
('1', 'admin', 'Administrator', 'level1', 'IT', 'admin@denr.gov'),
('2', 'user1', 'John Doe', 'level2a', 'Finance', 'john@denr.gov'),
('3', 'user2', 'Jane Smith', 'level2b', 'Operations', 'jane@denr.gov');

INSERT IGNORE INTO ssn_items (id, code, description, unit, category) VALUES 
('1', 'OS-001', 'Bond Paper A4', 'ream', 'Office Supplies'),
('2', 'OS-002', 'Bond Paper Legal', 'ream', 'Office Supplies'),
('3', 'OS-003', 'Ballpen Black', 'piece', 'Office Supplies'),
('4', 'OS-004', 'Neon Highlighter', 'Set (3 piece/Set)', 'Office Supplies'),
('5', 'OS-005', 'Manila Folder', 'piece', 'Office Supplies'),
('6', 'EQ-001', 'Desktop Computer', 'unit', 'Equipment'),
('7', 'EQ-002', 'Printer', 'unit', 'Equipment');

INSERT IGNORE INTO rcc_items (id, code, office_name, division_name) VALUES 
('1', 'RCC-001', 'Regional Office', 'Finance'),
('2', 'RCC-002', 'Provincial Office', 'Environmental'),
('3', 'RCC-003', 'District Office', 'Operations');

INSERT IGNORE INTO deliveries (id, type, date, po_number, po_date, supplier, receipt_number, item, item_description, unit, quantity, unit_price, total_price, remarks) VALUES
('DEL-001', 'Office Supplies', '2026-03-15', 'PO-2026-001', '2026-03-10', 'ABC Supplies Co.', 'REC-001', 'OS-001', 'Bond Paper A4', 'ream', 50, 120.00, 6000.00, 'Initial stock'),
('DEL-002', 'Office Supplies', '2026-03-16', 'PO-2026-002', '2026-03-11', 'XYZ Trading', 'REC-002', 'OS-003', 'Ballpen Black', 'piece', 200, 12.00, 2400.00, ''),
('DEL-003', 'Office Supplies', '2026-03-17', 'PO-2026-003', '2026-03-12', 'ABC Supplies Co.', 'REC-003', 'OS-004', 'Neon Highlighter', 'Set (3 piece/Set)', 100, 85.00, 8500.00, ''),
('DEL-004', 'Equipment', '2026-03-18', 'PO-2026-004', '2026-03-13', 'Tech Solutions', 'REC-004', 'EQ-001', 'Desktop Computer', 'unit', 5, 35000.00, 175000.00, ''),
('DEL-005', 'Office Supplies', '2026-03-19', 'PO-2026-005', '2026-03-14', 'XYZ Trading', 'REC-005', 'OS-005', 'Manila Folder', 'piece', 300, 8.00, 2400.00, '');

INSERT IGNORE INTO iar_records (id, iar_no, po_number, supplier, po_date, invoice_no, requisitioning_office, responsibility_center_code, date) VALUES
('IAR-001', 'IAR-2026-001', 'PO-2026-001', 'ABC Supplies Co.', '2026-03-10', 'INV-001', 'Regional Office', 'RCC-001', '2026-03-15'),
('IAR-002', 'IAR-2026-002', 'PO-2026-002', 'XYZ Trading', '2026-03-11', 'INV-002', 'Provincial Office', 'RCC-002', '2026-03-16'),
('IAR-003', 'IAR-2026-003', 'PO-2026-004', 'Tech Solutions', '2026-03-13', 'INV-003', 'Regional Office', 'RCC-001', '2026-03-18');

INSERT IGNORE INTO ris_records (id, ris_no, division, responsibility_center_code, date, requested_by, requesting_office, request_date) VALUES
('RIS-001', 'RIS-2026-001', 'Finance', 'RCC-001', '2026-03-20', 'admin', 'Regional Office', '2026-03-20'),
('RIS-002', 'RIS-2026-002', 'Operations', 'RCC-002', '2026-03-21', 'user1', 'Provincial Office', '2026-03-21'),
('RIS-003', 'RIS-2026-003', 'Finance', 'RCC-001', '2026-03-22', 'user2', 'District Office', '2026-03-22');

INSERT IGNORE INTO rsmi_records (id, report_no, period, is_auto_generated) VALUES
('RSMI-001', 'RSMI-2026-001', 'March 2026', FALSE),
('RSMI-002', 'RSMI-2026-002', 'March 2026', FALSE);

INSERT IGNORE INTO rpci_records (id, report_no, count_date) VALUES
('RPCI-001', 'RPCI-2026-001', '2026-03-25'),
('RPCI-002', 'RPCI-2026-002', '2026-03-26');
