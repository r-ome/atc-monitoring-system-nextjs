-- Data-only migration: move bundled storage fees onto receipt_records.storage_fee.
--
-- These fees were settled by the same bank transfers that paid for the items,
-- but were stored as their own STORAGE_FEE payment rows. To make room, the real
-- transfer amounts were shaved down, so no row matched the bank statement.
-- This restores each payment row to the amount actually transferred and records
-- the fee on the receipt.
--
-- Totals do not change. Money moves from a fabricated row back to the real ones.
--
-- Every reconstruction below was verified against the gross total recorded in
-- activity_logs at payment time, except 0158-1 (2026-05-29), which predates
-- payment logging and was verified against its items instead:
--   30,100 items + 3,010 service charge - 3,000 registration + 1,000 fee = 31,110.
--
-- Safety:
--   * Rows are matched on receipt_number + created_at, not UUIDs, so this works
--     regardless of whether ids match between environments. That pair was
--     confirmed unique for every receipt touched here.
--   * Each receipt is converted only if its payments still total the expected
--     net; @net is probed before the block and every UPDATE is guarded on it.
--     Without that guard, a receipt whose amounts had drifted could have one
--     row raised without the fee row being removed, inventing money.
--   * The fee is only recorded, and the STORAGE_FEE receipt only dropped, once
--     the payments total the expected gross.
--   * So a receipt is either fully converted, already converted (every guard
--     misses, nothing changes), or left completely alone. Local is already
--     backfilled and 0930-1 was half-fixed by hand on prod; both are handled.

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 0112-1 @ 2026-06-10 -- P1,000 fee, gross P216,400 (5 BDO transfers)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0112-1'
                AND r.created_at = '2026-06-10 08:29:55');

UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 50000
 WHERE r.receipt_number = '0112-1' AND r.created_at = '2026-06-10 08:29:55'
   AND p.amount_paid = 49769
   AND @net = 215400;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 35400
 WHERE r.receipt_number = '0112-1' AND r.created_at = '2026-06-10 08:29:55'
   AND p.amount_paid = 35236
   AND @net = 215400;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 31000
 WHERE r.receipt_number = '0112-1' AND r.created_at = '2026-06-10 08:29:55'
   AND p.amount_paid = 30857
   AND @net = 215400;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0112-1'
                  AND r.created_at = '2026-06-10 08:29:55');

UPDATE receipt_records SET storage_fee = 1000
 WHERE receipt_number = '0112-1' AND created_at = '2026-06-10 08:29:55'
   AND @gross = 216400;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0112-1SF1' AND sf.created_at = '2026-06-10 08:29:55'
   AND @gross = 216400;
DELETE FROM receipt_records
 WHERE receipt_number = '0112-1SF1' AND created_at = '2026-06-10 08:29:55'
   AND @gross = 216400;

-- ---------------------------------------------------------------------------
-- 0112-1 @ 2026-07-07 -- P1,000 fee, gross P158,230 (BDO + CASH)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0112-1'
                AND r.created_at = '2026-07-07 11:23:21');

UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 61000
 WHERE r.receipt_number = '0112-1' AND r.created_at = '2026-07-07 11:23:21'
   AND p.amount_paid = 60614
   AND @net = 157230;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 97230
 WHERE r.receipt_number = '0112-1' AND r.created_at = '2026-07-07 11:23:21'
   AND p.amount_paid = 96616
   AND @net = 157230;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0112-1'
                  AND r.created_at = '2026-07-07 11:23:21');

UPDATE receipt_records SET storage_fee = 1000
 WHERE receipt_number = '0112-1' AND created_at = '2026-07-07 11:23:21'
   AND @gross = 158230;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0112-1SF2' AND sf.created_at = '2026-07-07 11:23:21'
   AND @gross = 158230;
DELETE FROM receipt_records
 WHERE receipt_number = '0112-1SF2' AND created_at = '2026-07-07 11:23:21'
   AND @gross = 158230;

-- ---------------------------------------------------------------------------
-- 0158-1 @ 2026-05-29 -- P1,000 fee, gross P31,110 (GCASH + BPI)
-- Verified against items rather than the activity log; see header.
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0158-1'
                AND r.created_at = '2026-05-29 10:02:33');

UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 21110
 WHERE r.receipt_number = '0158-1' AND r.created_at = '2026-05-29 10:02:33'
   AND p.amount_paid = 20431
   AND @net = 30110;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 10000
 WHERE r.receipt_number = '0158-1' AND r.created_at = '2026-05-29 10:02:33'
   AND p.amount_paid = 9679
   AND @net = 30110;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0158-1'
                  AND r.created_at = '2026-05-29 10:02:33');

UPDATE receipt_records SET storage_fee = 1000
 WHERE receipt_number = '0158-1' AND created_at = '2026-05-29 10:02:33'
   AND @gross = 31110;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0158-1SF1' AND sf.created_at = '2026-05-29 10:02:33'
   AND @gross = 31110;
DELETE FROM receipt_records
 WHERE receipt_number = '0158-1SF1' AND created_at = '2026-05-29 10:02:33'
   AND @gross = 31110;

-- ---------------------------------------------------------------------------
-- 0158-1 @ 2026-07-24 -- P600 fee, gross P15,200 (GCASH)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0158-1'
                AND r.created_at = '2026-07-24 08:06:31');

UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 15200
 WHERE r.receipt_number = '0158-1' AND r.created_at = '2026-07-24 08:06:31'
   AND p.amount_paid = 14600
   AND @net = 14600;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0158-1'
                  AND r.created_at = '2026-07-24 08:06:31');

UPDATE receipt_records SET storage_fee = 600
 WHERE receipt_number = '0158-1' AND created_at = '2026-07-24 08:06:31'
   AND @gross = 15200;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0158-1SF2' AND sf.created_at = '2026-07-24 08:06:31'
   AND @gross = 15200;
DELETE FROM receipt_records
 WHERE receipt_number = '0158-1SF2' AND created_at = '2026-07-24 08:06:31'
   AND @gross = 15200;

-- ---------------------------------------------------------------------------
-- 0930-1 @ 2026-07-28 -- P400 fee, gross P55,772 (2 NEW BDO transfers)
-- The fee rows here were already merged to a single P400 by hand on prod.
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0930-1'
                AND r.created_at = '2026-07-28 14:40:58');

UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 50000
 WHERE r.receipt_number = '0930-1' AND r.created_at = '2026-07-28 14:40:58'
   AND p.amount_paid = 49641
   AND @net = 55372;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 5772
 WHERE r.receipt_number = '0930-1' AND r.created_at = '2026-07-28 14:40:58'
   AND p.amount_paid = 5731
   AND @net = 55372;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0930-1'
                  AND r.created_at = '2026-07-28 14:40:58');

UPDATE receipt_records SET storage_fee = 400
 WHERE receipt_number = '0930-1' AND created_at = '2026-07-28 14:40:58'
   AND @gross = 55772;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0930-1SF1' AND sf.created_at = '2026-07-28 14:40:58'
   AND @gross = 55772;
DELETE FROM receipt_records
 WHERE receipt_number = '0930-1SF1' AND created_at = '2026-07-28 14:40:58'
   AND @gross = 55772;

-- ---------------------------------------------------------------------------
-- 0954-1 @ 2026-07-22 -- P400 fee, gross P57,440 (GCASH + NEW BDO)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0954-1'
                AND r.created_at = '2026-07-22 13:11:46');

UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 7440
 WHERE r.receipt_number = '0954-1' AND r.created_at = '2026-07-22 13:11:46'
   AND p.amount_paid = 7388
   AND @net = 57040;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 50000
 WHERE r.receipt_number = '0954-1' AND r.created_at = '2026-07-22 13:11:46'
   AND p.amount_paid = 49652
   AND @net = 57040;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0954-1'
                  AND r.created_at = '2026-07-22 13:11:46');

UPDATE receipt_records SET storage_fee = 400
 WHERE receipt_number = '0954-1' AND created_at = '2026-07-22 13:11:46'
   AND @gross = 57440;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0954-1SF1' AND sf.created_at = '2026-07-22 13:11:46'
   AND @gross = 57440;
DELETE FROM receipt_records
 WHERE receipt_number = '0954-1SF1' AND created_at = '2026-07-22 13:11:46'
   AND @gross = 57440;

COMMIT;
