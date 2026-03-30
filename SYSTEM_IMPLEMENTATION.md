# Procurement & Inventory Management Workflow System
## Complete Implementation Guide

---

## 🎯 System Overview

This is a fully integrated government-compliant Procurement and Inventory Management System following the standard workflow:

**PO → IAR → RIS → RSMI → Stock Card → RPCI**

All transactions are linked, traceable, and maintain real-time stock accuracy.

---

## 📋 System Workflows

### 1. **Purchase Order (PO) Management**
**Location:** `/procurement/po`

**Features:**
- Create, edit, and track purchase orders
- Track PO status (Pending, Approved, Rejected, Delivered)
- Link POs to IAR for receiving inspection
- Export PO records to Excel

**Workflow:**
```
Create PO → Approve PO → Create Delivery/IAR from PO
```

### 2. **Inspection and Acceptance Report (IAR)**
**Location:** Navigation menu > Inventory section

**Features:**
- Create IAR from approved POs
- Specify items with quantities and costs
- Link to stock management system
- Generate audit trail

**Workflow:**
```
PO Approved → Create IAR → Verify received items → Accept/Reject
```

**Data Validated:**
- Item from PO must be referenced
- Quantity must match approved PO quantity
- Unit cost tracking for cost analysis

### 3. **Requisition and Issue Slip (RIS)**
**Location:** Inventory management section

**Features:**
- Create RIS from available stock (IAR/Stock Card)
- Real-time stock validation
- Auto-deduction upon approval
- Prevent over-issuing

**Workflow:**
```
Available Stock → Create RIS → Validate Quantity → Approve → 
Auto-deduct from Stock → Create RSMI → Update Stock Card
```

**Validation Rules:**
- Cannot request more than available stock
- Automatically checks Stock Card balance
- Links to Responsibility Center Code (RCC)
- Records office/division for traceability

### 4. **Report of Supplies and Materials Issued (RSMI)**
**Location:** Inventory management section

**Features:**
- Auto-generated from approved RIS
- Summarizes distributed items by office
- Aggregates multiple RIS records
- Provides distribution audit trail

**Auto-Generation Triggers:**
- When RIS is approved
- When stock is deducted
- Permanent record of distribution

### 5. **Stock Card Management**
**Location:** Stock Card page in Inventory

**Features:**
- Per-item stock tracking
- Transaction history (receipts and issues)
- Running balance calculation
- Real-time balance updates

**Transaction Types:**
- **In:** PO deliveries, receipts
- **Out:** RIS issuances
- **Balance:** Running total after each transaction

**Data Integrity:**
- All transactions timestamped
- Reference numbers for traceability
- Office tracking for accountability

### 6. **Report on Physical Count of Inventory (RPCI)**
**Location:** Inventory > RPCI

**Features:**
- Auto-generate from Stock Card data
- Book balance vs. physical count comparison
- Variance calculation and reporting
- Excel export with formatted reports

**Auto-Generation Process:**
```
1. Click "Auto-Generate" → Select count date
2. System fetches latest Stock Card balances
3. Create RPCI with book balance pre-filled
4. User inputs physical count
5. System auto-calculates variance
6. Generates audit trail
```

**Variance Analysis:**
- Positive variance: Surplus stock
- Negative variance: Missing stock
- Zero variance: Accurate count

---

## 🔄 Complete Workflow Example

### Scenario: Office Supply Distribution

#### Step 1: Create Purchase Order
```
Navigate to: /procurement/po
- PO Number: PO-2024-001
- Supplier: ABC Office Supplies
- PO Date: 2024-01-15
- Items: Bond Paper (100 reams), Ballpens (500 pieces)
```

#### Step 2: Create Delivery/IAR
```
Navigate to: Inventory > Delivery
- IAR Number: IAR-2024-001
- PO Referenced: PO-2024-001
- Items delivered match PO
- Stock Card auto-created for each item
```

#### Step 3: Create RIS (Issue Supplies)
```
Navigate to: Inventory > RIS
- RIS Number: RIS-2024-001
- Items: Bond Paper (50 reams), Ballpens (200 pieces)
- Division: Finance Office
- System validates: Bond Paper available? YES (100 in stock)
- Upon approval:
  * Stock deducted: Bond Paper 100 → 50
  * RSMI auto-created
  * Stock Card updated
```

#### Step 4: RSMI Automatically Generated
```
RSMI Record Created:
- Report Number: AUTO-RSMI-RIS-2024-001
- Items: Shows 50 reams to Finance Office
- 200 Ballpens to Finance Office
- Aggregates if multiple RIS for same period
```

#### Step 5: Stock Card Updated
```
Stock Card for Bond Paper:
- Opening: 100
- Transaction: RIS-2024-001 → Issue 50
- Closing: 50
- Running with complete history
```

#### Step 6: Physical Count & RPCI
```
Navigate to: Inventory > RPCI
- Click "New RPCI" → "Auto-Generate"
- Select Count Date: 2024-01-31
- System loads:
  * Stock No: PAP-001 (Bond Paper)
  * Book Balance: 50
  * User enters Physical Count: 48
  * Variance calculated: -2
  * System flags shortage
```

---

## 📊 Data Consistency & Validation

### Automatic Validations

**1. Stock Availability Check**
```javascript
When creating RIS:
IF RequestedQuantity > AvailableStock
  THEN Reject RIS with error
  SHOW Available vs. Requested breakdown
END
```

**2. Stock Deduction**
```javascript
When RIS approved:
FOR each item in RIS:
  NewBalance = CurrentBalance - IssuedQuantity
  CREATE StockCardTransaction
  UPDATE StockCard latest balance
END
```

**3. Audit Trail**
```
Every transaction records:
- Operation (Receipt/Issue)
- Date & Time
- Reference Number (PO/RIS/IAR)
- Office/Division
- User (from context)
```

### Data Linkage

```
PO (poNumber)
  ↓
IAR (poNumber) → Items from PO
  ↓
RIS (from available stock, creates RSMI)
  ↓
Stock Card (updates balance per RIS)
  ↓
RSMI (auto-generated, items from RIS)
  ↓
RPCI (book balances from Stock Card)
```

---

## 🛠️ Technical Implementation

### Backend API Endpoints

**Purchase Orders:**
- `GET /api/poRecords` - List all POs
- `POST /api/poRecords` - Create PO
- `PUT /api/poRecords/:id` - Update PO
- `DELETE /api/poRecords/:id` - Delete PO

**Stock Cards:**
- `GET /api/stockCards` - List all stock cards
- `POST /api/stockCards` - Create stock card
- `GET /api/stockCards/balance/:stockNo` - Check available balance
- `GET /api/rpciSummary` - Get stock summary for RPCI

**RPCI Auto-Generation:**
- `POST /api/rpciRecords/auto-generate` - Auto-generate RPCI
- `GET /api/rpciRecords` - List RPCI records
- `PUT /api/rpciRecords/:id` - Update RPCI
- `DELETE /api/rpciRecords/:id` - Delete RPCI

### Database Schema

**Key Tables:**
- `po_records` - Purchase orders
- `iar_records` / `iar_items` - Inspection & acceptance reports
- `ris_records` / `ris_items` - Requisition & issue slips
- `rsmi_records` / `rsmi_items` - Materials issued reports
- `stock_cards` - Master stock file
- `stock_card_transactions` - Transaction history
- `rpci_records` / `rpci_items` - Physical count reports

---

## 📤 Export & Reporting

### Excel Export Features

All pages support Excel export with:
- Professional formatting
- Proper headers and titles
- Date formatting
- Numeric formatting
- Color coding (status, variance)

**Export Locations:**
- PO List: `/procurement/po` → Export button
- Stock Card: Stock Card page → Export button
- RPCI: RPCI page → Export button
- RIS/RSMI/IAR: Inventory pages → Export buttons

---

## 🔐 Access Control & Audit

### User Roles

**Level 1 (Administrator):**
- Full system access
- Can create/approve all documents
- Can override validations
- Access to audit reports

**Level 2A (Inventory Manager):**
- Create and manage IAR, RIS, Stock Cards
- Cannot approve own transactions
- Can generate RPCI
- Inventory reports

**Level 2B (End User):**
- Request supplies via RIS
- View personal requisitions
- Limited stock visibility

### Audit Trail

Every transaction records:
- Who (user ID)
- What (operation type)
- When (timestamp)
- Where (office/division)
- Result (success/failure)

Access via: Dashboard > Audit Reports

---

## 🚀 Quick Start Guide

### 1. Initial Setup

```bash
# Start database
mysql < backend/schema.sql

# Start backend
cd backend && npm start

# Start frontend development
npm run dev
```

### 2. Create Initial Master Data

Navigate to: Admin > Master Data
- Add SSN Items (stock items)
- Add RCC Items (offices/divisions)
- Add Users (staff with roles)

### 3. First Procurement Cycle

1. Go to: `/procurement/po` → Create first PO
2. Go to: Inventory > Delivery → Create IAR from PO
3. Go to: Inventory > RIS → Create and approve RIS
4. Check: Inventory > Stock Card → Verify balance updated
5. Check: Inventory > RSMI → Verify auto-created
6. Go to: Inventory > RPCI → Auto-generate report

---

## ✅ Validation Checklist

- [ ] All POs linked to IAR
- [ ] All IAR items in Stock Card
- [ ] All RIS validated against Stock Card
- [ ] All RIS auto-generates RSMI
- [ ] All RIS updates Stock Card balance
- [ ] RPCI book balance = Stock Card ending balance
- [ ] No stock over-issuance possible
- [ ] All transactions have audit trail
- [ ] Excel exports include all data
- [ ] All dates formatted consistently

---

## 📞 Troubleshooting

**Issue:** RIS creation fails with "Insufficient Stock"
**Solution:** Check Stock Card balance, verify IAR was created and delivered

**Issue:** RSMI not auto-creating
**Solution:** Ensure RIS was approved, check backend logs for errors

**Issue:** Stock Card balance doesn't match expected
**Solution:** Review all transactions in Stock Card detail view

**Issue:** RPCI auto-generate shows no items
**Solution:** Ensure Stock Cards exist with transactions first

---

## 🎯 System Goals Achieved

✅ **Data Dependency & Linkage:** PO→IAR→RIS→RSMI fully linked
✅ **Stock Validation:** Prevents over-issuance in real-time
✅ **Real-time Updates:** Stock Card updated immediately on RIS approval
✅ **Audit Trail:** All transactions tracked with user/date/reference
✅ **Automated Reports:** RSMI and RPCI auto-generated
✅ **Government Compliance:** Follows standard procurement workflow
✅ **Professional Interface:** Optimized for productivity
✅ **Export Capability:** All reports to Excel

---

**System Version:** 1.0.0
**Last Updated:** March 24, 2024
