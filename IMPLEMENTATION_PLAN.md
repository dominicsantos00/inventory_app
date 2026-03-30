# Stock Card to RPCI Data Flow Integration - Implementation Plan

## Current State Analysis

### ✅ Already Implemented
1. **Stock Card Balance Tracking**: Uses `stock_card_transactions.balance` as source of truth
2. **RIS Stock Deduction**: When RIS is created, it:
   - Validates requested quantity ≤ available balance
   - Creates stock transaction with deducted quantity
   - Updates running balance
3. **RPCI Data Source**: Fetches `bookBalance` from latest stock card transaction
4. **Data Flow Path**: Delivery → Stock Card → RIS (deduction) → Stock Card (updated) → RPCI

### ⚠️ Areas to Enhance
1. **RPCI Grand Total**: Currently displays individual items but no Grand Total calculation
2. **Unit Cost Tracking**: RPCI needs to calculate totals based on remaining quantities
3. **Real-time Synchronization**: Need to ensure all modules refresh correctly
4. **Detailed Verification**: Display bookBalance with remaining quantities prominently

## Implementation Requirements

### 1. RPCI Module Enhancements
**Goal**: Display Grand Total based on remaining stock from Stock Card

**Changes Needed**:
- Add unit pricing to RPCI items (fetch from deliveries or stock card)
- Calculate: Total Cost = Book Balance × Unit Price
- Display Grand Total in RPCI view and export
- Ensure bookBalance is prominently displayed as "Remaining Quantity"

### 2. Backend API Updates
**Endpoint**: `GET /api/rpciRecords/fetch-stock-items`

**Enhancement**: 
- Include unit price from the most recent delivery
- Calculate total cost for remaining quantity
- Ensure all data is current

### 3. Data Synchronization
**Ensure**:
- When RIS is created → Stock Card updates → RPCI reflects change
- When RIS is deleted → Stock Card reverses → RPCI reflects change
- When Delivery is added → Stock Card updates → RPCI reflects change

### 4. UI Display Updates
**RPCI Component Changes**:
- Show "Remaining Quantity" (bookBalance) clearly
- Calculate and display "Unit Cost"
- Calculate and display "Total Cost" per item (Remaining × Unit Cost)
- Add "Grand Total" at bottom of items list
- Include these in Excel export

## Expected Data Flow

```
1. Delivery Created
   └─> Stock Card Transaction (received)
       └─> Balance updated

2. RIS Created
   └─> Validates against Stock Card balance
   └─> Stock Card Transaction (issued)
       └─> Balance updated
   └─> Auto-generates RSMI

3. RPCI Accessed
   └─> Fetches all Stock Card items
   └─> Gets latest balance (bookBalance)
   └─> Gets unit price from deliveries
   └─> Calculates remaining stock total
   └─> Displays: Item | Remaining Qty | Unit Cost | Total Cost | Grand Total

4. Delete RIS
   └─> Reverses Stock Card transaction
   └─> Deletes related RSMI
   └─> RPCI automatically reflects new balance
```

## Success Criteria

- [ ] RPCI displays bookBalance as "Remaining Quantity"
- [ ] RPCI includes unit cost per item from most recent delivery
- [ ] RPCI calculates and displays Grand Total
- [ ] Grand Total = SUM(Remaining Quantity × Unit Cost) for all items
- [ ] All modules update dynamically after create/edit/delete
- [ ] Excel export includes all calculated fields
- [ ] No duplicate or inconsistent computations
- [ ] Current UI design preserved
