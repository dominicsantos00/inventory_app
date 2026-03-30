## Procurement & Inventory Management Workflow - Validation Flow Diagram

### 1. Complete Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROCUREMENT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: GOODS RECEIPT
═════════════════════════════════════════════════════════════════

  PO Created
      ↓
  Delivery Arrives
      ├─ Item Code ✓
      ├─ Quantity > 0 ✓
      └─ Validates: NOT NULL checks
      ↓
  Stock Card Created (auto) ✓
      ├─ Per-item basis
      └─ If new item, create record
      ↓
  Transaction Recorded
      ├─ Type: RECEIVED
      ├─ Amount: +DeliveryQuantity
      ├─ Balance: CurrentBalance + Delivery
      └─ Reference: DEL-{receiptNo}
      ↓
  RESULT: Stock Available = 20 units


PHASE 2: REQUISITION & VALIDATION (STRICT)
═════════════════════════════════════════════════════════════════

  RIS Created (User Form)
  ├─ Stock No: BALLPEN
  ├─ Description: Blue Ballpen
  ├─ Unit: BOX
  ├─ Quantity Requested: 30
  └─ Division: Finance Office
      ↓
  ✓✓✓ VALIDATION BEGINS ✓✓✓
      ↓
  VALIDATION RULE 1: Stock Exists?
      ├─ Query: SELECT balance FROM stock_card_transactions
      │          WHERE stock_card_id = ? ORDER BY date DESC LIMIT 1
      ├─ Result: balance = 20
      └─ Status: PASS ✓
      ↓
  VALIDATION RULE 2: Sufficient Quantity?
      ├─ Check: RequestedQty (30) > AvailableBalance (20)?
      ├─ Result: YES, 30 > 20
      └─ Status: FAIL ✗
      ↓
  ✗✗✗ VALIDATION FAILED ✗✗✗
      ↓
  REJECTION RESPONSE:
  ┌──────────────────────────────────────────────┐
  │ Error: "Insufficient Stock"                  │
  │                                              │
  │ Details:                                     │
  │ ├─ Item: BALLPEN                            │
  │ ├─ Requested: 30 units                      │
  │ ├─ Available: 20 units                      │
  │ └─ Shortage: 10 units                       │
  └──────────────────────────────────────────────┘
      ↓
  DATABASE: ROLLBACK ALL CHANGES
      ├─ No RIS record created
      ├─ No Stock Card transaction
      ├─ No RSMI generated
      └─ Stock remains: 20 units
      ↓
  USER GETS: Clear error with available qty
      ↓
  RESULT: RIS REJECTED ❌ - Stock unchanged


PHASE 2 (ALTERNATIVE): VALID REQUEST
═════════════════════════════════════════════════════════════════

  RIS Created (User Form)
  ├─ Stock No: BALLPEN
  ├─ Quantity Requested: 15
  ├─ Quantity to Issue: 15
  └─ Division: Finance Office
      ↓
  ✓✓✓ VALIDATION BEGINS ✓✓✓
      ↓
  VALIDATION RULE 1: Stock Exists?
      ├─ Query: SELECT balance
      ├─ Result: 20 units
      └─ Status: PASS ✓
      ↓
  VALIDATION RULE 2: Sufficient Quantity?
      ├─ Check: RequestedQty (15) > AvailableBalance (20)?
      ├─ Result: NO, 15 ≤ 20
      └─ Status: PASS ✓
      ↓
  ✓✓✓ VALIDATION SUCCEEDED ✓✓✓
      ↓
  DATABASE TRANSACTION BEGINS
      │
      ├─ Step 1: INSERT RIS Record
      │           (id, ris_no, division, date, ...)
      │
      ├─ Step 2: INSERT RIS Items
      │           (ris_id, stock_no, qty_requested, qty_issued, ...)
      │
      ├─ Step 3: AUTO-DEDUCT STOCK
      │           NewBalance = 20 - 15 = 5
      │           INSERT stock_card_transaction
      │           (stock_card_id, issued: 15, balance: 5)
      │
      ├─ Step 4: AUTO-GENERATE RSMI
      │           INSERT rsmi_records (AUTO-RSMI-RIS-001)
      │           INSERT rsmi_items (Finance Office: 15 units)
      │
      └─ TRANSACTION COMMITTED ✓
      ↓
  RESULT: RIS APPROVED ✅
      ├─ RIS Record: Created
      ├─ Stock Balance: 20 → 5 (updated)
      ├─ RSMI Record: AUTO-CREATED
      └─ Stock Card Transaction: RECORDED


PHASE 3: DISTRIBUTION TRACKING (RSMI)
═════════════════════════════════════════════════════════════════

  RSMI Auto-Generated:
  ├─ Report No: AUTO-RSMI-RIS-001
  ├─ Period: 2026-03
  ├─ Items:
  │  ├─ BALLPEN (Finance Office): 15 units
  │  │  ├─ Source: RIS-001
  │  │  ├─ Timestamp: 2026-03-24
  │  │  └─ Status: ISSUED
  │  └─ [Auto-populated from RIS]
  └─ Action: Distribution audit trail created


PHASE 4: STOCK CARD TRACKING
═════════════════════════════════════════════════════════════════

  Stock Card for BALLPEN:
  ├─ Stock No: BALLPEN
  ├─ Item Description: Blue Ballpen
  ├─ Unit: BOX
  │
  └─ Transactions:
      ├─ [1] Type: RECEIVED
      │   ├─ Date: 2026-03-20
      │   ├─ Reference: DEL-RECV-001
      │   ├─ Quantity In: +20
      │   ├─ Quantity Out: -
      │   └─ Balance: 20
      │
      └─ [2] Type: ISSUED
          ├─ Date: 2026-03-24
          ├─ Reference: RIS-001
          ├─ Quantity In: -
          ├─ Quantity Out: -15
          └─ Balance: 5 ← CURRENT


PHASE 5: INVENTORY AUDIT (RPCI)
═════════════════════════════════════════════════════════════════

  RPCI Auto-Generated from Stock Card:
  ├─ Report Date: 2026-03-24
  ├─ Count Date: 2026-03-24
  │
  └─ Items:
      ├─ Stock No: BALLPEN
      ├─ Description: Blue Ballpen
      ├─ Unit: BOX
      ├─ Book Balance: 5 ← FROM STOCK CARD
      ├─ Physical Count: [User inputs during count]
      │   ├─ Example: User counts 4 (not 5)
      │   └─ Variance: -1 (shortage)
      └─ Remarks: Additional remarks...
```

---

### 2. Stock Validation Decision Tree

```
RIS SUBMISSION FLOW
═══════════════════════════════════════════════════════════════

                         RIS Submitted
                              │
                              ▼
              ┌─────────────────────────────┐
              │ Has stock_no in system?     │
              └─────────────┬───────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
        YES                                    NO
         │                                     │
         ▼                                     ▼
    Stock Card                          REJECT: Create
    Exists                              Stock Card first
         │
         ▼
    ┌─────────────────────────────┐
    │ Get latest balance          │
    │ SELECT balance FROM         │
    │ stock_card_transactions     │
    │ WHERE stock_card_id = ?     │
    └──────────┬──────────────────┘
               │
               ▼
        ┌──────────────────────────┐
        │ GET: availableBalance    │
        │ qty_requested ≤ Balance? │
        └──────┬──────────┬────────┘
               │          │
             YES          NO
              │            │
              ▼            ▼
         APPROVE      REJECT with
            │        detailed error
            ▼            │
         BEGIN TX        │
            │            │
            ├─ Insert    │
            │  RIS      │
            │           │
            ├─ Insert    │
            │  Items    │
            │           │
            ├─ Send to  │
            │  Stock    │
            │  Deduct   │
            │           │
            ├─ Insert    │
            │  TX       │
            │           │
            ├─ Create    │
            │  RSMI     │
            │           │
            ▼           │
         COMMIT         │
            │           │
         Success        │
            │           ▼
            ▼        ROLLBACK
         SUCCESS      (All changes
         RIS Created   undone)
         Stock Updated │
         RSMI Created  ▼
                    FAIL
                    Nothing changed
                    User informed
```

---

### 3. Stock Deduction Timing

```
USER ACTION TIMELINE
═══════════════════════════════════════════════════════════════

T1: USER FILLS RIS FORM
    └─ Status: Form only (no database changes)

T2: USER CLICKS "CREATE RIS"
    └─ Status: Request sent to backend

T3: BACKEND VALIDATES
    ├─ Check stock availability
    ├─ Results: OK or FAIL
    └─ Status: Validation only (no changes yet)

    ├─ IF FAIL:
    │  ROLLBACK ✗
    │  Response: Error with details
    │  Stock: UNCHANGED
    │
    └─ IF OK:
       T4: BEGIN TRANSACTION
           ├─ Save RIS Record
           ├─ Save RIS Items
           ├─ Calculate new balance
           ├─ Save Stock Transaction
           ├─ Generate RSMI
           └─ ALL-OR-NOTHING

       T5: COMMIT TRANSACTION
           └─ ALL CHANGES PERMANENT

T6: USER SEES SUCCESS MESSAGE
    ├─ Stock Card updated
    ├─ RSMI created
    ├─ Balance shown
    └─ Status: COMPLETED


KEY PRINCIPLE: Stock is deducted ONLY at T5 (commit)
              Not before, not conditionally
              Cannot be reversed (immutable)
              Guaranteed atomicity
```

---

### 4. Validation Rules Matrix

```
VALIDATION LAYER 1: Request Acceptance
═══════════════════════════════════════════════════════════════

Rule 1.1: Stock Number Validation
├─ Must exist in system
├─ Must have corresponding Stock Card
└─ Fail → Error: "Stock not found"

Rule 1.2: Quantity Validation
├─ Must be positive integer > 0
├─ Must be numeric
└─ Fail → Error: "Invalid quantity"

Rule 1.3: Division Validation
├─ Must be valid RCC (Responsibility Center Code)
├─ Must exist in system
└─ Fail → Error: "Invalid division"


VALIDATION LAYER 2: Stock Availability Check
═══════════════════════════════════════════════════════════════

Rule 2.1: Get Current Balance
├─ Query latest stock_card_transactions
├─ Join with stock_cards
└─ Result: availableBalance (single value)

Rule 2.2: Compare Quantities
├─ IF requestedQty > availableBalance
│  THEN insufficient = TRUE
│  STORE: item details for error response
├─ IF requestedQty ≤ availableBalance
│  THEN sufficient = TRUE
│  STORE: for deduction
└─ Continue for all items

Rule 2.3: Aggregate Checks
├─ IF any item insufficient
│  THEN REJECT ALL items
│  RETURN: detailed insufficient array
├─ IF all items sufficient
│  THEN APPROVE ALL items
│  BEGIN: Transaction
└─ No partial approval


VALIDATION LAYER 3: Transaction Integrity
═══════════════════════════════════════════════════════════════

Rule 3.1: Atomicity
├─ BEGIN TRANSACTION
├─ All steps succeed or none succeed
└─ COMMIT or ROLLBACK (never partial)

Rule 3.2: Consistency
├─ No duplicates created
├─ Foreign keys maintained
├─ Balance calculations verified
└─ Timestamps consistent

Rule 3.3: Isolation
├─ Lock stock_cards row during deduction
├─ Prevent concurrent RIS for same item
└─ Queue if necessary

Rule 3.4: Durability
├─ Once COMMIT, changes permanent
├─ Cannot be edited or deleted
└─ Audit trail immutable
```

---

### 5. Error Response Examples

```
ERROR 1: NO STOCK CARD
═════════════════════════════════════════════════════════════════

Request:
{
  "risNo": "RIS-001",
  "division": "Finance",
  "items": [
    {
      "stockNo": "UNKNOWN",
      "quantityRequested": 10
    }
  ]
}

Response:
{
  "error": "Stock card not found for item",
  "details": {
    "stockNo": "UNKNOWN",
    "message": "Create Stock Card first via Delivery"
  }
}

Action: REJECT - No RIS created


ERROR 2: INSUFFICIENT STOCK
═════════════════════════════════════════════════════════════════

Request:
{
  "risNo": "RIS-002",
  "division": "Finance",
  "items": [
    {
      "stockNo": "BALLPEN",
      "quantityRequested": 30,
      "quantityIssued": 30
    }
  ]
}

Stock Status: Only 20 available

Response:
{
  "error": "Insufficient Stock",
  "details": [
    {
      "stockNo": "BALLPEN",
      "requested": 30,
      "available": 20,
      "shortage": 10
    }
  ]
}

Action: REJECT - No RIS created, Stock unchanged (20)


ERROR 3: MULTI-ITEM PARTIAL FAILURE
═════════════════════════════════════════════════════════════════

Request:
{
  "risNo": "RIS-003",
  "items": [
    { "stockNo": "BALLPEN", "quantityRequested": 20 }, ✓ OK
    { "stockNo": "PAPER", "quantityRequested": 60 }    ✗ FAIL (only 40)
  ]
}

Response:
{
  "error": "Insufficient Stock",
  "details": [
    {
      "stockNo": "PAPER",
      "requested": 60,
      "available": 40,
      "shortage": 20
    }
  ]
}

Action: REJECT ALL items
Result: Neither BALLPEN nor PAPER deducted
        Both remain at original stock levels
```

---

### 6. Success Sequence

```
SUCCESS SCENARIO: Valid RIS Creation
═════════════════════════════════════════════════════════════════

Initial State:
├─ BALLPEN: 100 in stock
├─ PAPER: 50 in stock
└─ FOLDERS: 200 in stock

RIS Request:
├─ BALLPEN: 30 ✓ (30 < 100)
├─ PAPER: 20 ✓ (20 < 50)
└─ FOLDERS: 100 ✓ (100 < 200)

Validation Result: ALL PASS ✓

Database Operations (in transaction):
├─ [1] INSERT ris_records (RIS-004)
├─ [2] INSERT ris_items (3 rows)
├─ [3] INSERT stock_card_transactions (3 rows deducting)
├─ [4] INSERT rsmi_records (AUTO-RSMI-RIS-004)
├─ [5] INSERT rsmi_items (3 rows)
└─ COMMIT ✓

Final State:
├─ BALLPEN: 100 → 70 ✓
├─ PAPER: 50 → 30 ✓
└─ FOLDERS: 200 → 100 ✓

Records Created:
├─ RIS: 1 record
├─ RIS Items: 3 records
├─ Stock Card Transactions: 3 records
├─ RSMI: 1 record
└─ RSMI Items: 3 records

Result: SUCCESS - All data consistent
```

---

**Validation Framework Status: ✅ PRODUCTION READY**

All constraints enforced, all edge cases handled, all transactions atomic.
