# RIS Delete Feature - Complete Implementation Guide

## Overview

The RIS (Requisition and Issue Slip) Delete feature enables safe deletion of RIS records with **complete stock reversal** and **automatic module synchronization**.

## Features Implemented

### 1. **Safe Deletion with Confirmation Modal**
- User-friendly confirmation dialog with clear warnings
- Shows RIS record number being deleted
- Displays what will happen when deleting:
  - Stock deduction will be reversed
  - Auto-generated distribution report (RSMI) will be removed
  - Physical count report (RPCI) will auto-update

### 2. **Complete Stock Reversal**
- When RIS is deleted, all quantity deductions are reversed
- Creates reverse transactions for each item in the RIS
- Restores stock balance to pre-deletion state
- Maintains Stock Card as single source of truth

### 3. **Module Synchronization**
- **RSMI Auto-Cleanup:** Automatically deletes RSMI records created from the RIS
  - Identifies RSMI records by naming convention: `AUTO-RSMI-{risNo}`
  - Removes both RSMI parent record and all line items
- **RPCI Auto-Update:** Physical count balances update automatically
  - No direct RPCI modification needed
  - Balances re-calculate from Stock Card transactions

### 4. **Error Handling**
- Transactional operations ensure data consistency
- Rollback on any error to maintain integrity
- User-friendly error messages
- Logging for debugging purposes

### 5. **User Feedback**
- Loading state during deletion
- Success toast: "RIS {risNo} deleted successfully! Stock has been reversed."
- Error toast: "Failed to delete RIS record. Please try again."
- Real-time UI refresh after deletion

## Technical Architecture

### Backend Implementation

**Location:** `backend/server.js` - `app.delete('/api/risRecords/:id', ...)`

**Workflow:**

```
1. Fetch RIS Record
   └─ Get ris_no, division, date
   
2. Fetch RIS Items
   └─ Get all items with quantity_issued

3. Reverse Stock Transactions
   └─ For each item:
      ├─ Get current Stock Card info
      ├─ Calculate restored balance (current + quantity_issued)
      ├─ Create reverse transaction with:
      │  ├─ received = quantity_issued
      │  ├─ issued = 0
      │  ├─ reference = REVERSAL-RIS-{risNo}
      │  └─ balance = restored balance

4. Delete RSMI Records
   └─ Query by report_no = AUTO-RSMI-{risNo}
   └─ Delete rsmi_items first
   └─ Delete rsmi_records

5. Delete RIS Data
   └─ Delete ris_items
   └─ Delete ris_records

6. Commit Transaction
```

**Database Tables Modified:**
- `stock_card_transactions` - New reverse transaction added
- `rsmi_items` - Deleted
- `rsmi_records` - Deleted
- `ris_items` - Deleted
- `ris_records` - Deleted

**Response Format:**
```json
{
  "message": "RIS record deleted successfully! Stock has been reversed.",
  "stockReversed": true,
  "rsmiRecordsDeleted": 1
}
```

### Frontend Implementation

**Location:** `src/app/components/inventory/RISSubpage.tsx`

**State Management:**
```typescript
deleteConfirmation: {
  isOpen: boolean;           // Modal visibility
  recordId: string | null;   // RIS ID to delete
  risNo: string | null;      // RIS number for display
  isDeleting: boolean;       // Loading state during deletion
}
```

**Key Functions:**

1. **`handleDelete(id, risNo)`**
   - Triggered by Delete button click
   - Sets confirmation modal state
   - Does NOT perform deletion immediately

2. **`handleConfirmDelete()`**
   - Triggered by "Delete" button in modal
   - Calls `deleteRISRecord(recordId)`
   - Shows success/error toast
   - Refreshes UI automatically

3. **`handleCancelDelete()`**
   - Triggered by "Cancel" button or modal close
   - Closes confirmation modal
   - Clears deletion state

**UI Components:**
- Delete button in Actions column (with Trash2 icon)
- Confirmation Dialog with:
  - Title: "Delete RIS Record"
  - Body: Message and info about consequences
  - Cancel button (disabled during deletion)
  - Delete button (shows "Deleting..." when in progress)

## Workflow Examples

### Example 1: Single Item RIS Deletion

**Before Deletion:**
```
Stock Card (Item A):
  - Stock In (Delivery): +30 → Balance: 30
  - RIS-001 Issued: -20 → Balance: 10

RSMI Records:
  - AUTO-RSMI-RIS-001 with 20 units

RPCI (Latest Count):
  - Item A: 10 units
```

**Delete Action:**
```
User clicks Delete on RIS-001
↓
Confirmation Modal appears
↓
User confirms deletion
↓
Backend processes:
  - Creates reverse transaction: +20 → Balance: 30
  - Deletes AUTO-RSMI-RIS-001
  - Deletes RIS-001 record
↓
RPCI auto-updates to 30 units
```

**After Deletion:**
```
Stock Card (Item A):
  - Stock In (Delivery): +30 → Balance: 30
  - RIS-001 Issued: -20 → Balance: 10
  - REVERSAL-RIS-001: +20 → Balance: 30 ✓

RSMI Records:
  - No AUTO-RSMI-RIS-001 ✓

RPCI (Latest Count):
  - Item A: 30 units ✓

RIS Table:
  - RIS-001 removed from list ✓
```

### Example 2: Multi-Item RIS Deletion

**Before Deletion:**
```
RIS-002 contains:
  - Item A: -15 units (Balance: 25 → 10)
  - Item B: -50 units (Balance: 100 → 50)
  - Item C: -30 units (Balance: 75 → 45)
```

**After Deletion:**
```
RIS-002 is removed, all items reversed:
  - Item A: Reverse +15 → Balance: 25 ✓
  - Item B: Reverse +50 → Balance: 100 ✓
  - Item C: Reverse +30 → Balance: 75 ✓
```

## Error Scenarios

### Scenario 1: Stock Card Not Found
**Error Response:**
```json
{
  "error": "Failed to delete RIS record. Please try again.",
  "details": "[Stock Card ID not found error details]"
}
```
**User Sees:** Toast error message
**Database State:** Rolled back - no changes made

### Scenario 2: RSMI Deletion Fails
**Error Response:**
```json
{
  "error": "Failed to delete RIS record. Please try again.",
  "details": "[Database constraint error details]"
}
```
**User Sees:** Toast error message
**Database State:** Rolled back - no changes made

### Scenario 3: RIS Record Not Found
**Status:** 404
**Error Response:**
```json
{
  "error": "RIS record not found."
}
```
**User Sees:** Toast error message
**Database State:** No changes attempted

## Validation Rules

### Pre-Delete Checks
- ✓ RIS record exists (returns 404 if not)
- ✓ All required fields present
- ✓ Stock Card IDs valid for all items
- ✓ Transaction-based execution for atomicity

### Post-Delete Guarantees
- ✓ Stock balances correct and consistent
- ✓ No negative stock values
- ✓ RSMI records removed
- ✓ No orphaned data
- ✓ Stock Card transactions properly recorded
- ✓ RPCI auto-updates correctly

## Testing Checklist

### Unit Tests
- [ ] Delete with single item RIS
- [ ] Delete with multi-item RIS
- [ ] Delete non-existent RIS (404 error)
- [ ] Stock reversal calculation correct
- [ ] RSMI deletion successful
- [ ] Transaction rollback on error

### Integration Tests
- [ ] RIS deleted from UI list
- [ ] Stock Card balances verified
- [ ] RSMI records verified deleted
- [ ] RPCI balances updated
- [ ] No orphaned data in database

### User Experience Tests
- [ ] Confirmation modal appears
- [ ] Modal closes on cancel
- [ ] Loading state shown during deletion
- [ ] Success message displayed
- [ ] Error message displayed on failure
- [ ] Delete button re-enables after completion
- [ ] UI refreshes automatically

### Edge Cases
- [ ] Delete RIS with 0-quantity items
- [ ] Delete RIS created long ago
- [ ] Delete adjacent RIS records
- [ ] Delete with latest stock transaction
- [ ] Concurrent delete attempts (should be prevented by locking)

## Deployment Notes

### Database Requirements
- InnoDB storage engine (for transactions)
- Foreign key constraints intact
- Sufficient disk space for transaction logs

### API Requirements
- MySQL connection pool with transaction support
- Error logging enabled
- CORS configuration includes DELETE method

### Frontend Requirements
- React Context API updated
- Dialog component available (Radix UI)
- Toast notification system (Sonner)
- Lucide icons (Trash2 for delete button)

### Backward Compatibility
- ✓ No breaking changes to existing APIs
- ✓ RIS creation workflow unchanged
- ✓ RSMI creation still works for new RIS
- ✓ Stock Card transactions format unchanged
- ✓ RPCI calculations unchanged

## Future Enhancements

1. **Soft Delete Option**
   - Mark RIS as deleted instead of hard delete
   - Maintain audit trail
   - Allow undelete within grace period

2. **Deletion Auditing**
   - Log who deleted what and when
   - Store audit records separately
   - Generate deletion reports

3. **Batch Operations**
   - Delete multiple RIS records at once
   - Bulk reversal processing
   - Permission controls

4. **Scheduled Deletion**
   - Queue deletions for off-peak times
   - Batch process during low-traffic hours
   - Notification of pending deletions

5. **Advanced Permissions**
   - Role-based delete authorization
   - Division-specific deletion rights
   - Manager approval for deletion

## Support & Troubleshooting

### Common Issues

**Issue:** Delete button returns 409 error
**Solution:** Button now calls proper DELETE endpoint with stock reversal logic

**Issue:** Stock balance doesn't update after delete
**Solution:** Verify reverse transaction created in stock_card_transactions table

**Issue:** RSMI records still exist after delete
**Solution:** Check that rsmiReportNo matches naming convention AUTO-RSMI-{risNo}

### Debug Information

**Enable Debug Logging:**
1. Add `console.log()` statements in backend DELETE handler
2. Check browser console for API responses
3. Verify transaction commit messages

**Verify Stock Reversal:**
```sql
-- Check reverse transactions created
SELECT * FROM stock_card_transactions 
WHERE reference LIKE 'REVERSAL-RIS-%' 
ORDER BY date DESC;

-- Verify current balances
SELECT * FROM stock_cards 
WHERE id = '[stock_card_id]';
```

## Related Documentation

- [RIS Implementation Guide](RIS_IMPLEMENTATION_GUIDE.md)
- [Stock Card Management](STOCK_CARD_GUIDE.md)
- [RSMI Auto-Generation](RSMI_GUIDE.md)
- [RPCI Auto-Update](RPCI_ENHANCEMENT_GUIDE.md)
- [System Architecture](SYSTEM_DESIGN.md)

## Summary

The RIS Delete feature provides a **safe, reversible** way to remove RIS records while maintaining complete **stock integrity** and **module synchronization**. With transaction-based operations and comprehensive error handling, it ensures data consistency throughout the inventory management system.

**Key Benefits:**
- ✅ Safe deletion with confirmation
- ✅ Complete stock reversal
- ✅ Automatic RSMI cleanup
- ✅ RPCI auto-update
- ✅ Transactional consistency
- ✅ User feedback
- ✅ Error handling
- ✅ Real-time UI refresh
