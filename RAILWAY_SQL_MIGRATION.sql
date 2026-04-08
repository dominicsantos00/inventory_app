-- SQL Migration for RIS Records - division to division_id
-- Run these commands on your Railway database

-- Step 1: Check if ris_records table exists
SHOW TABLES LIKE 'ris_records';

-- Step 2: Check current table structure
DESCRIBE ris_records;

-- Step 3: Migrate data (choose ONE option based on your current column):

-- OPTION A: If you have a 'division' column with text values like 'Finance', 'Operations'
-- This will rename the column
ALTER TABLE ris_records 
RENAME COLUMN division TO division_id;

-- Then update the values to use numeric IDs instead of names:
UPDATE ris_records SET division_id = 
  CASE 
    WHEN division_id = 'Finance' THEN '1'
    WHEN division_id = 'Operations' THEN '2'
    WHEN division_id = 'Environmental' THEN '3'
    ELSE NULL
  END;

-- Verify the update worked
SELECT * FROM ris_records LIMIT 5;

-- ---OR---

-- OPTION B: If the 'division' column doesn't exist yet
-- Add the new column:
ALTER TABLE ris_records 
ADD COLUMN division_id VARCHAR(255) AFTER ris_no;

-- Set default values:
UPDATE ris_records SET division_id = '1' WHERE division_id IS NULL;

-- Verify
SELECT * FROM ris_records LIMIT 5;

-- Step 4: Verify all RIS records have division_id
SELECT COUNT(*) as total_records, 
       COUNT(division_id) as records_with_division_id,
       COUNT(*) - COUNT(division_id) as records_missing_division_id
FROM ris_records;

-- Step 5: Test query
SELECT id, ris_no, division_id, responsibility_center_code, date 
FROM ris_records 
LIMIT 10;

-- If everything looks good, you're done! ✅
-- Your RIS creation should now work without the "Unknown column" error.
