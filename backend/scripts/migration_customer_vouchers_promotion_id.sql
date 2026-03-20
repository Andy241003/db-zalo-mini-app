-- Migration: Simplify voucher flow - add promotion_id, make voucher_id nullable
-- Run this on production DB before deploying updated backend code
-- Date: 2026-03-20

-- Step 1: Add promotion_id column
ALTER TABLE tbl_customer_vouchers
    ADD COLUMN promotion_id INT NULL AFTER voucher_id;

-- Step 2: Make voucher_id nullable (was NOT NULL before)
ALTER TABLE tbl_customer_vouchers
    MODIFY COLUMN voucher_id INT NULL;

-- Step 3: Rename used_date -> used_at (if column still named used_date)
-- Run only if your DB still has used_date (check first with: DESCRIBE tbl_customer_vouchers;)
-- ALTER TABLE tbl_customer_vouchers CHANGE used_date used_at DATETIME NULL;

-- Step 4: Add is_used column (if not exists)
-- ALTER TABLE tbl_customer_vouchers ADD COLUMN is_used TINYINT(1) DEFAULT 0 AFTER used_at;

-- Step 5: Add indexes for performance
ALTER TABLE tbl_customer_vouchers
    ADD INDEX idx_promotion_id (promotion_id),
    ADD INDEX idx_customer_status (customer_id, status),
    ADD INDEX idx_assigned_date (assigned_date);

-- Verify
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'tbl_customer_vouchers' AND TABLE_SCHEMA = DATABASE();
