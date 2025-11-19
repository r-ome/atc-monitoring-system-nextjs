/*
  Warnings:

  - Made the column `auction_date` on table `auctions_inventories` required. This step will fail if there are existing NULL values in that column.

*/
-- 1) backfill all NULLs
UPDATE auctions_inventories AS ai
JOIN auctions_bidders AS ab ON ab.auction_bidder_id = ai.auction_bidder_id
JOIN auctions AS a ON a.auction_id = ab.auction_id
SET ai.auction_date = COALESCE(
  ai.auction_date,
  TIMESTAMP(DATE(a.created_at), TIME(ai.created_at))
)
WHERE ai.auction_date IS NULL;

-- 2) now enforce NOT NULL
ALTER TABLE auctions_inventories
  MODIFY auction_date DATETIME(3) NOT NULL;