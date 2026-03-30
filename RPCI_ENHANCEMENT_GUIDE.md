# Enhanced RPCI (Report on Physical Count of Inventory) Module

## Overview

The RPCI module has been **enhanced to automatically retrieve ALL items from the Stock Card** with their latest remaining balances. This ensures the RPCI always reflects the complete and accurate inventory status.

---

## System Architecture

### Data Flow

```
Delivery (Stock In)
    ↓
Stock Card Created (per item)
    ↓
RIS Creation (Stock Validation)
    ↓
Stock Deduction (Auto-update Stock Card balance)
    ↓
RPCI Auto-Load Items (fetch all Stock Card items)
    ↓
User Enters Physical Counts
    ↓
RPCI Report Generated (with variances)
```

---

## Key Features

### 1. **Automatic Item Retrieval from Stock Card**

- **Endpoint:** `GET /api/rpciRecords/fetch-stock-items`
- **Purpose:** Fetches all items in Stock Card with their latest balances
- **Returns:**
  ```json
  {
    "message": "Stock card items fetched successfully",
    "itemCount": 5,
    "items": [
      {
        "stockNo": "BALLPEN",
        "description": "Blue Ballpen",
        "unit": "BOX",
        "bookBalance": 15,
        "physicalCount": 0,
        "variance": 0,
        "remarks": ""
      },
      ...
    ]
  }
  ```

### 2. **Complete Inventory Capture**

Every item that has ever passed through the Stock Card appears in RPCI:

- **Stock-In Items:** Items received through Delivery
- **Stock-Out Items:** Items issued through RIS
- **Running Balance:** Latest balance after all transactions
- **Automatic Calculation:** Remaining Balance = Total Received - Total Issued

### 3. **User-Friendly Flow**

```
┌─────────────────────────────────────────┐
│ Step 1: Select Count Date               │
│ [Enter date for physical count]         │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Step 2: Auto-Load Items                 │
│ [Click "Auto-Load Items" button]        │
│ System fetches all Stock Card items     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Step 3: Review Items                    │
│ Display all items with:                 │
│ • Stock Number                          │
│ • Description                           │
│ • Unit                                  │
│ • Book Balance (from Stock Card)        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Step 4: Enter Physical Counts           │
│ For each item:                          │
│ • User enters Physical Count            │
│ • System auto-calculates Variance       │
│ Variance = Physical Count - Book Balance│
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Step 5: Review Variances               │
│ • Positive: Surplus (found extra)      │
│ • Negative: Shortage (missing items)   │
│ • Zero: Perfect Match                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Step 6: Save RPCI                      │
│ [Click "Save RPCI (n items)"]          │
│ Report Number auto-generated if needed │
└─────────────────────────────────────────┘
```

---

## Required System Behavior

### 1. Automatic Stock Card Item Retrieval ✅

```javascript
// When user clicks "Auto-Load Items":
1. Fetch all items from Stock Card
2. Get latest balance for each item via:
   SELECT balance FROM stock_card_transactions
   WHERE stock_card_id = ?
   ORDER BY date DESC LIMIT 1
3. Return items with:
   • stock_no (Stock Number)
   • description (Item Description)
   • unit (Unit of Measure)
   • bookBalance (Latest running balance)
   • physicalCount: 0 (User will enter)
   • variance: 0 (Will calculate)
   • remarks: "" (User can add)
```

### 2. Latest Running Balance Retrieval ✅

```javascript
// For each Stock Card item:
Remaining Balance = Latest Stock Card Transaction Balance

Example Scenario:
┌─────────────────────────────────────┐
│ Item: BALLPEN                       │
├─────────────────────────────────────┤
│ Transaction 1: Delivery             │
│   Received: +20                     │
│   Balance: 20                       │
├─────────────────────────────────────┤
│ Transaction 2: RIS-001              │
│   Issued: -10                       │
│   Balance: 10                       │
├─────────────────────────────────────┤
│ Transaction 3: RIS-002              │
│   Issued: -5                        │
│   Balance: 5                        │
├─────────────────────────────────────┤
│ → RPCI Shows: 5 (latest balance)   │
└─────────────────────────────────────┘
```

### 3. Complete Item Coverage ✅

```javascript
// All items in Stock Card appear in RPCI:

IF item has stock_no IN stock_cards
THEN item must appear in RPCI with its latest balance
```

**Example Inventory Status:**
```
Stock Card Items:
├─ BALLPEN: 20 received, 10 issued → balance: 10
├─ PAPER: 100 received, 50 issued → balance: 50
└─ FOLDERS: 200 received, 100 issued → balance: 100

RPCI Display:
├─ BALLPEN — Book: 10 — Physical: [user enters] — Variance: [auto-calc]
├─ PAPER — Book: 50 — Physical: [user enters] — Variance: [auto-calc]
└─ FOLDERS — Book: 100 — Physical: [user enters] — Variance: [auto-calc]
```

### 4. Variance Calculation ✅

```javascript
// Auto-calculated when user enters physical count:

variance = physicalCount - bookBalance

Results:
• +5 = 5 extra items found (surplus)
• -3 = 3 items missing (shortage)
• 0 = Perfect match
```

### 5. No Manual Entry for Balances ✅

```
Book Balance: AUTOMATICALLY POPULATED from Stock Card
↓ (NOT entered by user)

Physical Count: MANUALLY ENTERED by user during physical count
↓ (User must physically verify)

Variance: AUTOMATICALLY CALCULATED by system
↓ (physicalCount - bookBalance)
```

---

## Implementation Details

### Backend Endpoint

**`GET /api/rpciRecords/fetch-stock-items`**

Fetches all Stock Card items with their latest balances without creating an RPCI record yet.

```javascript
// Query Structure:
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
ORDER BY sc.stock_no ASC
```

**Response:**
```json
{
  "message": "Stock card items fetched successfully",
  "itemCount": 3,
  "items": [
    {
      "stockNo": "BALLPEN",
      "description": "Blue Ballpen",
      "unit": "BOX",
      "bookBalance": 15,
      "physicalCount": 0,
      "variance": 0,
      "remarks": ""
    },
    {
      "stockNo": "FOLDERS",
      "description": "Beige Folders",
      "unit": "PKT",
      "bookBalance": 100,
      "physicalCount": 0,
      "variance": 0,
      "remarks": ""
    },
    {
      "stockNo": "PAPER",
      "description": "A4 Bond Paper",
      "unit": "REAM",
      "bookBalance": 50,
      "physicalCount": 0,
      "variance": 0,
      "remarks": ""
    }
  ]
}
```

### Frontend Function

**`fetchStockCardItemsForRPCI()`**

In `DataContext.tsx`:
```javascript
const fetchStockCardItemsForRPCI = async () => {
  const response = await apiRequest('rpciRecords/fetch-stock-items', 'GET');
  return response.items || [];
};
```

### Frontend Component Flow

In `RPCISubpage.tsx`:

**Step 1: User selects count date**
```javascript
<Input
  type="date"
  value={formData.countDate}
  onChange={(e) => setFormData({ ...formData, countDate: e.target.value })}
/>
```

**Step 2: User clicks "Auto-Load Items"**
```javascript
const handleAutoGenerate = async () => {
  // Validation
  if (!formData.countDate) return error;
  
  // Fetch items from Stock Card
  const items = await fetchStockCardItemsForRPCI();
  
  // Populate form
  setFormData(prev => ({
    ...prev,
    items: items
  }));
  
  // Show success
  toast.success(`${items.length} items loaded!`);
};
```

**Step 3: User enters physical counts**
```javascript
const handlePhysicalCountChange = (index: number, value: number) => {
  const newItems = [...formData.items];
  newItems[index].physicalCount = value;
  newItems[index].variance = value - newItems[index].bookBalance;
  setFormData({ ...formData, items: newItems });
};
```

**Step 4: User saves RPCI**
```javascript
const handleSave = async () => {
  const dataToSave = {
    reportNo: formData.reportNo || `RPCI-${date}`,
    countDate: formData.countDate,
    items: formData.items // All items with physical counts and variances
  };
  
  await addRPCIRecord(dataToSave);
};
```

---

## Database Schema

### Stock Cards Table
```sql
CREATE TABLE stock_cards (
  id VARCHAR(255) PRIMARY KEY,
  stock_no VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  reorder_point INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Stock Card Transactions Table
```sql
CREATE TABLE stock_card_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stock_card_id VARCHAR(255) NOT NULL,
  date DATE,
  reference VARCHAR(255),
  received INT DEFAULT 0,
  issued INT DEFAULT 0,
  balance INT NOT NULL,
  office VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_card_id) REFERENCES stock_cards(id)
);
```

### RPCI Records Table
```sql
CREATE TABLE rpci_records (
  id VARCHAR(255) PRIMARY KEY,
  report_no VARCHAR(255) NOT NULL,
  count_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### RPCI Items Table
```sql
CREATE TABLE rpci_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rpci_record_id VARCHAR(255) NOT NULL,
  stock_no VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  book_balance INT NOT NULL,
  physical_count INT,
  variance INT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rpci_record_id) REFERENCES rpci_records(id)
);
```

---

## Usage Example

### Complete Scenario

**Setup:**
```
1. Delivery: Ballpen (20 units) → Stock Card balance: 20
2. RIS-001: Issue 10 ballpens to Finance → Stock Card balance: 10
3. RIS-002: Issue 5 ballpens to Admin → Stock Card balance: 5
```

**RPCI Process:**

1. **User navigates to RPCI page**
   - Clicks "New RPCI"
   - Dialog opens

2. **Select Count Date**
   - Chooses: 2026-03-24

3. **Auto-Load Items**
   - Clicks "Auto-Load Items" button
   - System fetches all Stock Card items:
     ```
     BALLPEN — balance: 5
     ```
   - Dialog shows: "1 items loaded!"

4. **Enter Physical Counts**
   - User physically counts: Found 5 ballpens
   - Enters: 5 in Physical Count field
   - System calculates:
     ```
     Variance = 5 - 5 = 0 (Perfect match!)
     ```

5. **Save RPCI**
   - Clicks "Save RPCI (1 items)"
   - System creates RPCI record with:
     ```
     Report No: RPCI-2026-03-24
     Count Date: 2026-03-24
     Items: [
       {
         stockNo: BALLPEN,
         description: Blue Ballpen,
         unit: BOX,
         bookBalance: 5,
         physicalCount: 5,
         variance: 0
       }
     ]
     ```

6. **View and Export**
   - RPCI appears in table
   - User can expand to see details
   - Can export to Excel for records

---

## Computation Rule

### Formula: Remaining Balance = Total Received - Total Issued

For every item in Stock Card:

```
Let:
  • TotalReceived = Sum of all "received" in stock_card_transactions
  • TotalIssued = Sum of all "issued" in stock_card_transactions

Then:
  Remaining Balance = TotalReceived - TotalIssued

// This is also the latest "balance" field in the most recent transaction
```

**Example:**
```
Item: BALLPEN

Transaction History:
├─ DEL-001: Received +20 → Balance = 20
├─ RIS-PMD: Issued -10 → Balance = 10
├─ RIS-ORED: Issued -5 → Balance = 5

Formula Verification:
  Remaining = 20 - (10 + 5) = 5 ✓ (Matches latest balance)

RPCI Display:
  Book Balance: 5 (from Stock Card)
```

---

## Data Consistency Guarantees

### 1. **All Stock Card Items Appear in RPCI** ✅
- No items are skipped
- No manual filtering required
- RPCI is complete inventory summary

### 2. **Latest Balances Are Used** ✅
- Takes most recent transaction balance
- Reflects all stock movements
- Current as of query time

### 3. **No Manual Balance Entry** ✅
- Book Balance: Automatic from Stock Card
- Physical Count: User enters from physical inventory
- Variance: System calculates

### 4. **Immutable Audit Trail** ✅
- All Stock Card transactions are permanent
- RPCI records cannot be deleted
- Change history maintained

---

## Features

### ✅ Fully Integrated Workflow

```
Delivery → RIS → Stock Deduction → RPCI Summary

Every step feeds into the next:
1. Delivery creates Stock Card
2. RIS validates against Stock Card
3. RIS deducts from Stock Card
4. RPCI reads current Stock Card balance
```

### ✅ Real-Time Accuracy

```
Stock Card Updated → Immediately reflected in RPCI
(No manual sync needed)
```

### ✅ Complete Transparency

```
User sees:
• What was received (book balance origin)
• What was issued (all RIS records)
• What remains (calculated balance)
• What was counted (physical count)
• Discrepancies (variance)
```

### ✅ Government-Compliant Reporting

```
RPCI Report includes:
• Stock Number
• Description
• Unit of Measure
• Book Balance (auditable)
• Physical Count (verifiable)
• Variance (discrepancy analysis)
• Remarks (notes)
```

---

## Benefits

1. **Automatic Item Discovery**
   - No need to manually list items
   - All Stock Card items automatically appear

2. **Real-Time Balances**
   - Always shows current balance
   - Updated when RIS is approved

3. **Prevention of Missing Items**
   - Every item is captured
   - Variance analysis is complete

4. **Simplified User Flow**
   - One-click auto-load
   - Minimal data entry
   - Clear visual feedback

5. **Audit Trail Integrity**
   - All sources are traceable
   - Stock movements are documented
   - Discrepancies are identified

---

## Testing Checklist

- [ ] **Auto-Load Items**
  - [ ] No Stock Card items → Shows "No items found"
  - [ ] 5 Stock Card items → Loads all 5 items
  - [ ] Items have correct book balances
  - [ ] Item counts show in button text

- [ ] **Data Population**
  - [ ] Stock Number populated correctly
  - [ ] Description populated correctly
  - [ ] Unit populated correctly
  - [ ] Book Balance shows correct value

- [ ] **Physical Count Entry**
  - [ ] Can enter physical count
  - [ ] Variance calculates correctly
  - [ ] Colors show (red for shortage, green for surplus)

- [ ] **Save Function**
  - [ ] Creates RPCI with all items
  - [ ] Report Number auto-generates if blank
  - [ ] All items saved with counts and variances
  - [ ] Appears in records list

- [ ] **Excel Export**
  - [ ] All items included
  - [ ] Book Balance shows
  - [ ] Physical Count shows
  - [ ] Variance shows
  - [ ] Formatting is correct

- [ ] **Edit Function**
  - [ ] Can edit existing RPCI
  - [ ] Items pre-loaded from database
  - [ ] Physical counts editable
  - [ ] Variances update correctly

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "No items found" | No Stock Cards exist | Create deliveries first to establish Stock Card |
| Empty items list | Count date not selected | Select a count date before clicking Auto-Load |
| Wrong book balance | Stock Card not updated | Ensure RIS was approved (stock deduction happens on approval) |
| Variance not calculated | Physical count not entered | Enter a number in the Physical Count field |
| RPCI won't save | No items loaded | Click "Auto-Load Items" first |

---

## Summary

The enhanced RPCI module ensures:

✅ **Automatic retrieval** of all Stock Card items
✅ **Latest balances** always used
✅ **Complete inventory** representation
✅ **User-friendly** auto-load process
✅ **Accurate variance** calculations
✅ **Government-compliant** reporting
✅ **Full audit trail** of all transactions

**Result:** RPCI becomes a reliable, complete, and accurate final inventory summary based on actual Stock Card data and physical counts.
