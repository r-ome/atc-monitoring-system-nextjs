-- Data-only migration: re-run of 20260730000000 against a UTC server.
--
-- That migration matched rows with literal timestamps ('2026-07-28 14:40:58')
-- read from a database whose session time zone is Asia/Manila. created_at is a
-- TIMESTAMP column, which MySQL stores in UTC and renders in the session time
-- zone, so on the UTC production server those literals matched nothing. The
-- migration completed successfully and changed not one row.
--
-- Matching on UNIX_TIMESTAMP() instead compares absolute instants, so it holds
-- whatever time zone the server runs in.
--
-- Everything else is unchanged from 20260730000000: each receipt's payments go
-- back to the amounts actually transferred, the fee moves onto
-- receipt_records.storage_fee, and the fabricated STORAGE_FEE receipt is
-- dropped. Totals do not change.
--
-- Safe to re-run and safe where 20260730000000 already applied: each block
-- probes the receipt's payment total first and guards every UPDATE on it, so a
-- receipt is fully converted, already converted, or left completely alone.

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 0112-1 @ 2026-06-10 -- P1,000 fee, gross P216,400 (5 BDO transfers)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0112-1'
                AND UNIX_TIMESTAMP(r.created_at) = 1781051395);
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 50000
 WHERE r.receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1781051395
   AND p.amount_paid = 49769
   AND @net = 215400;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 35400
 WHERE r.receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1781051395
   AND p.amount_paid = 35236
   AND @net = 215400;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 31000
 WHERE r.receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1781051395
   AND p.amount_paid = 30857
   AND @net = 215400;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0112-1'
                  AND UNIX_TIMESTAMP(r.created_at) = 1781051395);

UPDATE receipt_records SET storage_fee = 1000
 WHERE receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(created_at) = 1781051395
   AND @gross = 216400;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0112-1SF1'
   AND UNIX_TIMESTAMP(sf.created_at) = 1781051395
   AND @gross = 216400;
DELETE FROM receipt_records
 WHERE receipt_number = '0112-1SF1'
   AND UNIX_TIMESTAMP(created_at) = 1781051395
   AND @gross = 216400;

-- ---------------------------------------------------------------------------
-- 0112-1 @ 2026-07-07 -- P1,000 fee, gross P158,230 (BDO + CASH)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0112-1'
                AND UNIX_TIMESTAMP(r.created_at) = 1783394601);
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 61000
 WHERE r.receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1783394601
   AND p.amount_paid = 60614
   AND @net = 157230;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 97230
 WHERE r.receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1783394601
   AND p.amount_paid = 96616
   AND @net = 157230;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0112-1'
                  AND UNIX_TIMESTAMP(r.created_at) = 1783394601);

UPDATE receipt_records SET storage_fee = 1000
 WHERE receipt_number = '0112-1'
   AND UNIX_TIMESTAMP(created_at) = 1783394601
   AND @gross = 158230;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0112-1SF2'
   AND UNIX_TIMESTAMP(sf.created_at) = 1783394601
   AND @gross = 158230;
DELETE FROM receipt_records
 WHERE receipt_number = '0112-1SF2'
   AND UNIX_TIMESTAMP(created_at) = 1783394601
   AND @gross = 158230;

-- ---------------------------------------------------------------------------
-- 0158-1 @ 2026-05-29 -- P1,000 fee, gross P31,110 (GCASH + BPI)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0158-1'
                AND UNIX_TIMESTAMP(r.created_at) = 1780020153);
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 21110
 WHERE r.receipt_number = '0158-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1780020153
   AND p.amount_paid = 20431
   AND @net = 30110;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 10000
 WHERE r.receipt_number = '0158-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1780020153
   AND p.amount_paid = 9679
   AND @net = 30110;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0158-1'
                  AND UNIX_TIMESTAMP(r.created_at) = 1780020153);

UPDATE receipt_records SET storage_fee = 1000
 WHERE receipt_number = '0158-1'
   AND UNIX_TIMESTAMP(created_at) = 1780020153
   AND @gross = 31110;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0158-1SF1'
   AND UNIX_TIMESTAMP(sf.created_at) = 1780020153
   AND @gross = 31110;
DELETE FROM receipt_records
 WHERE receipt_number = '0158-1SF1'
   AND UNIX_TIMESTAMP(created_at) = 1780020153
   AND @gross = 31110;

-- ---------------------------------------------------------------------------
-- 0158-1 @ 2026-07-24 -- P600 fee, gross P15,200 (GCASH)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0158-1'
                AND UNIX_TIMESTAMP(r.created_at) = 1784851591);
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 15200
 WHERE r.receipt_number = '0158-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1784851591
   AND p.amount_paid = 14600
   AND @net = 14600;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0158-1'
                  AND UNIX_TIMESTAMP(r.created_at) = 1784851591);

UPDATE receipt_records SET storage_fee = 600
 WHERE receipt_number = '0158-1'
   AND UNIX_TIMESTAMP(created_at) = 1784851591
   AND @gross = 15200;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0158-1SF2'
   AND UNIX_TIMESTAMP(sf.created_at) = 1784851591
   AND @gross = 15200;
DELETE FROM receipt_records
 WHERE receipt_number = '0158-1SF2'
   AND UNIX_TIMESTAMP(created_at) = 1784851591
   AND @gross = 15200;

-- ---------------------------------------------------------------------------
-- 0930-1 @ 2026-07-28 -- P400 fee, gross P55,772 (2 NEW BDO transfers)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0930-1'
                AND UNIX_TIMESTAMP(r.created_at) = 1785220858);
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 50000
 WHERE r.receipt_number = '0930-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1785220858
   AND p.amount_paid = 49641
   AND @net = 55372;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 5772
 WHERE r.receipt_number = '0930-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1785220858
   AND p.amount_paid = 5731
   AND @net = 55372;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0930-1'
                  AND UNIX_TIMESTAMP(r.created_at) = 1785220858);

UPDATE receipt_records SET storage_fee = 400
 WHERE receipt_number = '0930-1'
   AND UNIX_TIMESTAMP(created_at) = 1785220858
   AND @gross = 55772;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0930-1SF1'
   AND UNIX_TIMESTAMP(sf.created_at) = 1785220858
   AND @gross = 55772;
DELETE FROM receipt_records
 WHERE receipt_number = '0930-1SF1'
   AND UNIX_TIMESTAMP(created_at) = 1785220858
   AND @gross = 55772;

-- ---------------------------------------------------------------------------
-- 0954-1 @ 2026-07-22 -- P400 fee, gross P57,440 (GCASH + NEW BDO)
-- ---------------------------------------------------------------------------
SET @net := (SELECT SUM(p.amount_paid) FROM payments p
               JOIN receipt_records r ON r.receipt_id = p.receipt_id
              WHERE r.receipt_number = '0954-1'
                AND UNIX_TIMESTAMP(r.created_at) = 1784697106);
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 7440
 WHERE r.receipt_number = '0954-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1784697106
   AND p.amount_paid = 7388
   AND @net = 57040;
UPDATE payments p JOIN receipt_records r ON r.receipt_id = p.receipt_id
   SET p.amount_paid = 50000
 WHERE r.receipt_number = '0954-1'
   AND UNIX_TIMESTAMP(r.created_at) = 1784697106
   AND p.amount_paid = 49652
   AND @net = 57040;

SET @gross := (SELECT SUM(p.amount_paid) FROM payments p
                 JOIN receipt_records r ON r.receipt_id = p.receipt_id
                WHERE r.receipt_number = '0954-1'
                  AND UNIX_TIMESTAMP(r.created_at) = 1784697106);

UPDATE receipt_records SET storage_fee = 400
 WHERE receipt_number = '0954-1'
   AND UNIX_TIMESTAMP(created_at) = 1784697106
   AND @gross = 57440;
DELETE p FROM payments p JOIN receipt_records sf ON sf.receipt_id = p.receipt_id
 WHERE sf.receipt_number = '0954-1SF1'
   AND UNIX_TIMESTAMP(sf.created_at) = 1784697106
   AND @gross = 57440;
DELETE FROM receipt_records
 WHERE receipt_number = '0954-1SF1'
   AND UNIX_TIMESTAMP(created_at) = 1784697106
   AND @gross = 57440;

COMMIT;
