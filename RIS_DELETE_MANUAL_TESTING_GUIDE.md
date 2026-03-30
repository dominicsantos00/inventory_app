# RIS Delete Feature - Manual Testing Guide

## Quick Start Testing

### Prerequisites
- Application running on localhost:5173 (frontend) and localhost:5000 (backend)
- Database populated with sample data
- Browser developer tools open (optional)

---

## Test Scenarios

## Scenario 1: Basic Delete with Stock Reversal

### Setup
1. Create a Delivery record:
   - Item: Stock No: TEST001, Description: "Test Item"
   - Quantity: 100 units

2. Create a RIS record:
   - RIS No: RIS-TEST-001
   - Item: TEST001
   - Quantity Requested: 50
   - Quantity Issued: 50

3. Verify stock balance:
   - Expected: 50 (100 - 50)

### Execute Delete

**Step 1: Navigate to RIS Page**
- Click "Requisition and Issue Slip (RIS)" menu item
- See RIS-TEST-001 in the table

**Step 2: Click Delete Button**
- Find RIS-TEST-001 row
- Click red "Delete" button in Actions column
- Observe: Confirmation modal appears

**Step 3: Verify Modal Content**
- Modal title: "Delete RIS Record"
- Message: "Are you sure you want to delete RIS record RIS-TEST-001?"
- Shows consequences:
  - "Reverse the stock deduction"
  - "Remove distribution report (RSMI)"
  - "Update physical count (RPCI)"

**Step 4: Confirm Deletion**
- Click "Delete" button in modal
- Observe: Button shows "Deleting..." text
- Wait for success message

**Step 5: Verify Success**
- Toast notification: "RIS RIS-TEST-001 deleted successfully! Stock has been reversed."
- RIS-TEST-001 removed from table
- Modal closes automatically

### Verify Database Changes

**Check Stock Reversal:**
```sql
-- Open MySQL Workbench or command line
-- Run these queries:

-- 1. Check stock card balance
SELECT balance FROM stock_card_transactions 
WHERE stock_card_id = (
  SELECT id FROM stock_cards WHERE stock_no = 'TEST001'
) 
ORDER BY id DESC LIMIT 1;
-- Expected result: 100

-- 2. See transaction history
SELECT reference, received, issued, balance 
FROM stock_card_transactions 
WHERE stock_card_id = (
  SELECT id FROM stock_cards WHERE stock_no = 'TEST001'
) 
ORDER BY id DESC LIMIT 2;
-- Expected results:
-- | REVERSAL-RIS-RIS-TEST-001 | 50 | 0 | 100 |
-- | RIS-RIS-TEST-001          | 0  | 50 | 50  |

-- 3. Check RSMI deleted
SELECT * FROM rsmi_records WHERE report_no = 'AUTO-RSMI-RIS-TEST-001';
-- Expected result: empty (0 rows)

-- 4. Check RIS deleted
SELECT * FROM ris_records WHERE ris_no = 'RIS-TEST-001';
-- Expected result: empty (0 rows)
```

### Expected Result
**✅ PASS** if:
- Stock reversed to 100
- Reverse transaction recorded
- RSMI deleted
- RIS deleted
- Success message shown

---

## Scenario 2: Multi-Item RIS Deletion

### Setup
1. Create Delivery records:
   - Item A: 200 units
   - Item B: 300 units
   - Item C: 150 units

2. Create RIS-MULTI-001 with:
   - Item A: 60 units
   - Item B: 90 units
   - Item C: 45 units

3. Initial balances:
   - Item A: 140
   - Item B: 210
   - Item C: 105

### Execute Delete

**Same as Scenario 1, but with multi-item RIS**

### Verify Database Changes

```sql
-- Check all three items reversed
SELECT * FROM stock_card_transactions 
WHERE reference = 'REVERSAL-RIS-RIS-MULTI-001' 
OR reference LIKE '%RIS-MULTI-001%'
ORDER BY id DESC LIMIT 6;

-- Expected results:
-- Item A reverse +60: balance = 200
-- Item B reverse +90: balance = 300
-- Item C reverse +45: balance = 150
-- Item A issue -60: balance = 140
-- Item B issue -90: balance = 210
-- Item C issue -45: balance = 105
```

### Expected Result
**✅ PASS** if all three items reversed correctly

---

## Scenario 3: Cancel Deletion

### Setup
- Same as Scenario 1 with RIS-TEST-002

### Execute
1. Click Delete on RIS-TEST-002
2. Modal appears
3. Click "Cancel" button
4. Modal closes

### Verify
1. RIS-TEST-002 still in table
2. Stock hasn't changed
3. No new transactions in database

**Query:**
```sql
SELECT COUNT(*) FROM ris_records WHERE ris_no = 'RIS-TEST-002';
-- Expected: 1 (record still exists)
```

### Expected Result
**✅ PASS** if RIS not deleted, stock unchanged

---

## Scenario 4: Error Handling - Non-Existent RIS

### Setup
- No special setup needed

### Execute via Browser Console

```javascript
// Open browser console (F12)
// Go to Network tab

// Try to delete non-existent RIS ID
const response = await fetch('http://localhost:5000/api/risRecords/nonexistent-id-123', {
  method: 'DELETE'
});

const data = await response.json();
console.log(data);
```

### Expected Result
**✅ PASS** if:
- HTTP Status: 404
- Error message: "RIS record not found."
- No data modified

---

## Scenario 5: Modal Close Button

### Setup
- Create any RIS record

### Execute
1. Click Delete button
2. Modal appears
3. Click X button (top right of modal)
4. Or press Escape key

### Expected Result
**✅ PASS** if:
- Modal closes
- RIS not deleted
- No changes made

---

## Scenario 6: Button States During Deletion

### Setup
- Create RIS-BUTTON-TEST

### Execute
1. Click Delete
2. Modal appears
3. Click "Delete" button
4. Watch buttons while deleting

### Expected Observations
- "Delete" button shows "Deleting..." text
- "Delete" button is disabled (grayed out)
- "Cancel" button is disabled (grayed out)
- Modal cannot be closed (X button disabled)
- After completion, buttons re-enable

### Expected Result
**✅ PASS** if UI properly reflects loading state

---

## Scenario 7: RPCI Auto-Update

### Setup
1. Create Stock In (100 units of Item X)
2. Create RIS that issues 40 units
3. Create RPCI record with Item X = 60 units

### Execute
1. Delete the RIS
2. Go to RPCI page

### Expected Result
**✅ PASS** if:
- RPCI shows Item X = 100 (updated balance)
- No manual RPCI change needed
- RPCI auto-calculated from Stock Card

**Why:** RPCI calculates from latest stock_card_transactions balance

---

## Scenario 8: Toast Notification Colors

### Success Toast
- Background: Green
- Icon: White checkmark
- Text: White
- Message: "RIS {risNo} deleted successfully! Stock has been reversed."
- Duration: ~3 seconds

### Error Toast
- Background: Red
- Icon: White X
- Text: White
- Message: "Failed to delete RIS record. Please try again."
- Duration: Until dismissed

### Verification
- Take screenshots
- Compare with design specs
- Verify messages are user-friendly

---

## Performance Testing

### Single Item RIS
```
Time to delete: ~100-200ms
Expected: < 500ms
```

### Multi-Item RIS (50 items)
```
Time to delete: ~300-500ms
Expected: < 1000ms
```

### Measurement Method
```javascript
// In browser console:
const start = Date.now();
// Click Delete and confirm
// When toast appears:
const end = Date.now();
console.log(`Delete took ${end - start}ms`);
```

---

## Database Verification Commands

### Copy-Paste Ready SQL Queries

**1. Check latest stock balance:**
```sql
SELECT description, balance 
FROM stock_card_transactions 
WHERE stock_card_id = 'YOUR_STOCK_ID' 
ORDER BY id DESC LIMIT 1;
```

**2. View last 5 transactions for an item:**
```sql
SELECT DATE(date) as date, reference, received, issued, balance 
FROM stock_card_transactions 
WHERE stock_card_id = (
  SELECT id FROM stock_cards WHERE stock_no = 'STOCK_NO_HERE'
) 
ORDER BY id DESC LIMIT 5;
```

**3. Check if RSMI exists:**
```sql
SELECT report_no, created_at FROM rsmi_records 
WHERE report_no LIKE 'AUTO-RSMI-%' 
ORDER BY created_at DESC LIMIT 5;
```

**4. Verify RIS deleted:**
```sql
SELECT COUNT(*) as remaining_ris FROM ris_records 
WHERE ris_no = 'YOUR_RIS_NUMBER';
-- Expected: 0
```

**5. Check for orphaned data:**
```sql
-- Orphaned RIS items
SELECT COUNT(*) FROM ris_items 
WHERE ris_record_id NOT IN (
  SELECT id FROM ris_records
);

-- Orphaned RSMI items  
SELECT COUNT(*) FROM rsmi_items 
WHERE rsmi_record_id NOT IN (
  SELECT id FROM rsmi_records
);
-- Both expected: 0
```

---

## Browser Console Testing

### Check API Response

```javascript
// Delete a RIS via UI, then check Network call
// In Network tab:
// - Find DELETE request to /api/risRecords/{id}
// - Status: 200 OK
// - Response:
// {
//   "message": "RIS record deleted successfully! Stock has been reversed.",
//   "stockReversed": true,
//   "rsmiRecordsDeleted": 1
// }
```

### Inspect Element

Good candidates to inspect:
1. Delete button while loading (should have `disabled` attribute)
2. Modal during deletion (should show disabled buttons)
3. Toast notification (check CSS classes for styling)

---

## Troubleshooting During Testing

### Problem: Delete button doesn't open modal

**Solution:**
- Refresh page
- Check browser console for errors
- Verify RIS record ID is valid
- Check network request if using DevTools

### Problem: Modal opens but Delete button unresponsive

**Solution:**
- Check browser console for errors
- Verify backend is running on localhost:5000
- Check Network tab for API errors
- Try different RIS record

### Problem: Delete succeeds but stock not reversed

**Solution:**
- Run verification query above
- Check if reverse transaction exists
- Verify Stock Card ID is correct
- Check for database connection issues

### Problem: Success message but RIS still visible

**Solution:**
- Refresh RIS page
- Clear browser cache
- Check if deletion actually succeeded (query DB)
- Look for error in browser console

### Problem: RSMI not deleted

**Solution:**
- Run: `SELECT * FROM rsmi_records WHERE report_no LIKE 'AUTO-RSMI-YOUR-RIS%'`
- Verify naming convention matches
- Check for constraint violations
- Look for error in backend logs

---

## Sign-Off Checklist

After testing, sign off:

```
Basic Deletion
  [ ] Single item RIS deleted successfully
  [ ] Multi-item RIS deleted successfully
  [ ] Stock reversed correctly
  [ ] RSMI deleted via naming convention
  [ ] RIS removed from UI list

Confirmation Modal
  [ ] Modal appears on Delete click
  [ ] Shows RIS number being deleted
  [ ] Shows list of consequences
  [ ] Cancel button works
  [ ] Delete button works
  [ ] X button closes modal
  [ ] Escape key closes modal

Error Handling
  [ ] Non-existent RIS returns 404
  [ ] Database errors handled gracefully
  [ ] Error messages clear and helpful
  [ ] No partial data deleted on error
  
UI/UX
  [ ] Delete button visible in Actions
  [ ] Button styled as destructive (red)
  [ ] Loading state shown during deletion
  [ ] Success toast appears with correct message
  [ ] Error toast appears with correct message
  [ ] UI refreshes after deletion

Database
  [ ] Stock balance correct
  [ ] Reverse transaction recorded
  [ ] RSMI records deleted
  [ ] RIS records deleted
  [ ] No orphaned data
  [ ] RPCI auto-updated

Performance
  [ ] Single item RIS < 500ms
  [ ] Multi-item RIS < 1000ms
  [ ] No UI freezing
  [ ] No database locks

Documentation
  [ ] User guide clear and accurate
  [ ] API documentation complete
  [ ] Troubleshooting guide helpful
  [ ] Code comments adequate
```

---

## Test Report Template

```
TEST REPORT - RIS Delete Feature
Date: ___________
Tester: ___________
Environment: [ ] Development [ ] Staging [ ] Production

RESULTS:
✅ PASS / ❌ FAIL / ⚠️ PARTIAL

Test Case 1 - Single Item Delete: ___
Test Case 2 - Multi-Item Delete: ___
Test Case 3 - Cancel Delete: ___
Test Case 4 - Non-Existent RIS: ___
Test Case 5 - Modal Close: ___
Test Case 6 - Button States: ___
Test Case 7 - RPCI Auto-Update: ___
Test Case 8 - Toast Notifications: ___

OBSERVATIONS:
[Write any issues or unexpected behaviors]

RECOMMENDATIONS:
[Suggest improvements or fixes if needed]

SIGN-OFF:
✅ Ready for production / ❌ Issues found
```

---

## Next Steps After Testing

1. **All Tests Pass:**
   - ✅ Feature is production-ready
   - ✅ Deploy to production
   - ✅ Notify stakeholders

2. **Some Tests Fail:**
   - 🔧 Document issues
   - 🔧 Notify development team
   - 🔧 Fix and re-test

3. **Post-Deployment:**
   - 📊 Monitor error logs
   - 📊 Track usage patterns
   - 📊 Collect user feedback

---

## Quick Reference - Copy-Paste URLs

**Frontend (React App):**
```
http://localhost:5173
http://localhost:5173/inventory/ris
```

**Backend API:**
```
http://localhost:5000/api/risRecords (GET all)
http://localhost:5000/api/risRecords/{id} (DELETE)
```

**Database:**
```
Host: localhost
Port: 3306
Database: inventory_db
User: root
Password: (empty)
```

---

## Support During Testing

**Issues?**
- Check browser console (F12)
- Check backend logs
- Run verification SQL queries
- Refer to main documentation
- Contact development team

**Questions?**
- See RIS_DELETE_QUICK_REFERENCE.md
- See RIS_DELETE_IMPLEMENTATION.md
- See RIS_DELETE_GUIDE.md

---

**Happy Testing! 🚀**

This feature is designed to be safe, reliable, and user-friendly.

If you encounter any issues, document them and contact the development team with:
- What action you took
- What you expected
- What actually happened
- Steps to reproduce
- Browser/database screenshots if applicable

---

**Testing Date:** ___________
**Tester Name:** ___________
**Status:** ___________
