# RPCI Enhancement - Quick Reference Guide

## What's Changed?

The RPCI module now **automatically loads ALL items from Stock Card** instead of requiring manual entry.

---

## Old Flow vs New Flow

### ❌ Old Flow
```
1. User creates empty RPCI
2. User manually adds items one by one
3. User manually enters book balance for each item
4. Time-consuming and error-prone
```

### ✅ New Flow
```
1. User opens "New RPCI" dialog
2. User selects count date
3. User clicks "Auto-Load Items"
4. System fetches ALL Stock Card items (auto-populated!)
5. User enters physical counts
6. System calculates variances automatically
7. User saves → Done!
```

---

## Step-by-Step Usage

### Step 1: Open New RPCI Dialog
```
Click: Inventory > RPCI > "New RPCI" button
Opens: Create RPCI dialog
```

### Step 2: Enter Count Date ✓
```
Select: Date field
Action: Choose the physical count date (today's date recommended)
```

### Step 3: Auto-Load All Items
```
Click: "Auto-Load Items" button
System: Fetches all Stock Card items with latest balances
Result: Items appear in the list below
Message: "X items loaded from Stock Card!"
```

### Step 4: Enter Physical Counts
```
For each item:
  • Book Balance: Shows automatically (from Stock Card) ← READ ONLY
  • Physical Count: Enter what you counted (user input)
  • Variance: Auto-calculated (Physical - Book)
  
Colors:
  • Red variance: Items are missing (shortage)
  • Green variance: Extra items found (surplus)
  • No color: Perfect match
```

### Step 5: Save RPCI
```
Click: "Save RPCI (X items)"
System: 
  • Creates RPCI record
  • Saves all items with physical counts
  • Generates report number if not entered
Result: "RPCI created successfully with X items!"
```

### Step 6: View Results
```
RPCI appears in table:
  • Report Number
  • Count Date
  • Item Count
  • Action buttons (Edit/Delete)
  
Click row to expand and see all item details:
  • Stock Number
  • Description
  • Unit
  • Book Balance
  • Physical Count
  • Variance
  • Remarks
```

### Step 7: Export (Optional)
```
Click: "Export" button
Action: Downloads RPCI report(s) as Excel file
Format: Professional report with header and all data
```

---

## What Gets Automatically Populated

| Field | Source | User Action |
|-------|--------|-------------|
| Stock Number | Stock Card | ← Auto |
| Description | Stock Card | ← Auto |
| Unit | Stock Card | ← Auto |
| **Book Balance** | Latest Stock Card transaction | ← Auto (READ ONLY) |
| **Physical Count** | User enters | ← **User enters** |
| **Variance** | Physical Count - Book Balance | ← Auto-calculated |
| Report Number | Auto-generated if blank | ← Auto (can override) |
| Count Date | User selects | ← User selects |

---

## Key Computation

```
For each item:

Book Balance    = Latest balance from Stock Card
Physical Count  = What user counted during physical inventory
Variance        = Physical Count - Book Balance

Examples:
• Book: 10, Physical: 10 → Variance: 0 (Perfect!)
• Book: 10, Physical: 12 → Variance: +2 (Found 2 extra)
• Book: 10, Physical: 8  → Variance: -2 (Missing 2 items)
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│ DELIVERY (Stock In) │
└──────────┬──────────┘
           ↓
┌─────────────────────────────────────┐
│ Stock Card Created (auto per item)  │
│ Transaction: +20 items              │
│ Balance: 20                         │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ RIS (Issue Supplies)                │
│ Stock Validation: 20 available?     │
└──────────┬──────────────────────────┘
           ↓ (if approved)
┌─────────────────────────────────────┐
│ Stock Deducted                      │
│ Transaction: -10 items              │
│ Balance: 10                         │
│ RSMI Auto-created                   │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ RPCI Creation                       │
│ "Auto-Load Items" button            │
│ ↓                                   │
│ Fetch from Stock Card:              │
│ • Stock No: same                    │
│ • Description: same                 │
│ • Unit: same                        │
│ • Book Balance: 10 (latest)        │
│ ↓                                   │
│ User enters Physical Count: 10      │
│ System calculates Variance: 0       │
│ ↓                                   │
│ Save → RPCI Report Complete        │
└─────────────────────────────────────┘
```

---

## Important Notes

### ✅ DO's

- ✅ Do select count date before clicking Auto-Load
- ✅ Do Enter physical count for every item
- ✅ Do save RPCI with all items
- ✅ Do use the auto-generated report number
- ✅ Do export RPCI for official records

### ❌ DON'Ts

- ❌ Don't manually enter book balance (it's auto-populated)
- ❌ Don't delete Stock Card while RPCI is being created
- ❌ Don't skip physical count for any item
- ❌ Don't manually calculate variances (system does it)

---

## Common Issues

| Problem | Solution |
|---------|----------|
| "No items found" | Create deliveries first to establish Stock Card items |
| Auto-Load button disabled | Select a count date first |
| Wrong book balance | Ensure RIS approvals processed (stock deduction happens then) |
| Can't save | Make sure at least one item is loaded via Auto-Load |
| Physical count not saved | Re-enter count before saving |

---

## Workflow Integration

### Complete Inventory Cycle

```
1. DELIVERY
   └─ Creates Stock Card entries

2. RIS (Requisition & Issue Slip)
   ├─ Validates against Stock Card balance
   ├─ Issues items on approval
   └─ Updates Stock Card balance

3. Stock Card
   ├─ Maintains running balance
   └─ Shows all transactions

4. RSMI (Report of Supplies & Materials Issued)
   ├─ Auto-generated from RIS
   └─ Shows distribution by division

5. RPCI (Report on Physical Count)  ← YOU ARE HERE
   ├─ Auto-loads all Stock Card items
   ├─ User enters physical count
   ├─ System calculates variances
   └─ Creates final inventory report
```

---

## Reports Available

### RPCI Report Contents
```
Header:
├─ Report Title: "REPORT ON PHYSICAL COUNT OF INVENTORY (RPCI)"
├─ Report Number: RPCI-2026-03-24
└─ Count Date: 2026-03-24

Details:
├─ Stock No | Description | Unit | Book | Physical | Variance | Remarks
└─ [all items with their counts]

Summary:
├─ Total items counted: X
├─ Perfect matches: Y
├─ Shortages: Z
└─ Surpluses: W
```

### Export to Excel
```
File: rpci_report_YYYY-MM-DD.xlsx
Sheets: One sheet per RPCI record
Format: Professional with header, borders, formatting
Content: All items with counts and variances
```

---

## Success Criteria

✅ System should:
- [x] Automatically fetch all Stock Card items
- [x] Show correct book balances
- [x] Auto-calculate variances
- [x] Create RPCI with all items
- [x] Export to professional Excel format

✅ User should:
- [x] Load all items with one click
- [x] See all items from Stock Card
- [x] Enter only physical counts (book balance is read-only)
- [x] Get instant variance calculation

---

## Support

### For Backend Issues
- Check: `/api/rpciRecords/fetch-stock-items` endpoint
- Verify: Stock Card has transactions
- Check: Database connectivity

### For Frontend Issues
- Check: "Auto-Load Items" button state
- Verify: Items appear after clicking button
- Check: Variance calculation is correct

### For Data Issues
- Verify Stock Card: Check balances are correct
- Verify RIS: All approvals processed
- Verify Deliveries: Initial stock was recorded
- Check: No manual database modifications

---

## Summary

The **Enhanced RPCI Module** provides:

✅ **Automatic item discovery** — No manual entry
✅ **Complete inventory capture** — All Stock Card items included
✅ **Real-time accuracy** — Latest balances from Stock Card
✅ **Simple user flow** — Click Auto-Load, enter counts, save
✅ **Variance analysis** — Instant calculation of discrepancies
✅ **Professional reporting** — Excel-ready output

**Result:** Creating an RPCI report is now **fast, accurate, and complete!**
