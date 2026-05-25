// Step 3 — Container Tax.
// Reduce ₱30,000 from this container's prices for tax purposes.
// Bidder 0740 (FUKURO TAKATSUGU) items are pre-counted toward the target,
// so the "still needed" amount is sourced from manual price deductions on
// items in selected descriptions.
//
// Layout: description filter (left sidebar) + price table (center) + totals (right sidebar).

// Constants
const TAX_TARGET = 30000;
const HOUSE_BIDDER = '0740';
// 0740 items in this container (would come from server in production)
const BIDDER_0740_TOTAL = 5500;

// Item descriptions in this container — alphabetized, mirrors data.jsx codes
const TAX_DESCRIPTIONS = [
  '2D CLOSET/SLIM CAB','3D CAB','3L P DRAWER','4L DRAWER','5L DRAWER','5L SMALL DRAWER','6L DRAWER',
  'ACCESSORIES','ASSTD','B. BAG','B. CG','B. KW DI MIXED BRAND','BAG','BAG DI','BENTO IN BOX',
  'BICYCLE','CAB','CD','CG DI','CG IN BOX DI','CERAMIC LAMP','D CAB','D. CAB','D. CHAIR',
  'DASH BAG','DOLL DI','FIG IN BOX SI','FIG DI','FISHING DI','FRAME IN BOX DI',
  'GLASS TABLE','GW DI','KEYCHAIN DI','KITCHEN SET','KITCHEN UTENSILS','KW','KW IN BOX DI','KW2',
  'LUGGAGE','MARBLE IN BOX DI','MARBLE SIDE TABLE','MERCH DI','METAL VASE DI','NINTENDO/CD',
  'O. TABLE','OFFICE CHAIR','PILLOW SET','PINK CLEAR DI','PLAKA','PLASTIC BIN','POUCH DI',
  'S/F IN BOX DI','SHOES','SHOES DI','SHOES IN BOX DI','STEEL SHELF','STORAGE BIN','TABLE LAMP',
  'TOYS AS IS','TOYS DI','TV RACK AS IS','TV STAND','UMBRELLA','VASE DI','VASE IN BOX DI',
  'WALL CLOCK','WALLET','WALLET DI','WOOD','WOOD FIG DI','WOOD FIG DI AS IS','WOODEN CABINET',
];

// Items eligible for deduction (some sample rows that match the descriptions)
const TAX_ITEMS = [
  { ctrl:'0265', desc:'CW',              price:500,   bidder:'0158' },
  { ctrl:'0050', desc:'BENTO IN BOX',    price:1500,  bidder:'0240' },
  { ctrl:'0395', desc:'PINK CLEAR DI',   price:6300,  bidder:'0319' },
  { ctrl:'2131', desc:'D. CHAIR',        price:500,   bidder:'0033' },
  { ctrl:'2088', desc:'CAB',             price:2500,  bidder:'0252' },
  { ctrl:'1038', desc:'O. TABLE',        price:1000,  bidder:'0158' },
  { ctrl:'0319', desc:'GW DI',           price:400,   bidder:'0090' },
  { ctrl:'0360', desc:'DOLL DI',         price:500,   bidder:'0928' },
  { ctrl:'2465', desc:'TV RACK AS IS',   price:300,   bidder:'0220' },
  { ctrl:'1402', desc:'WOODEN CABINET',  price:8400,  bidder:'0158' },
  { ctrl:'1403', desc:'OFFICE CHAIR',    price:1200,  bidder:'0158' },
  { ctrl:'1404', desc:'GLASS TABLE',     price:9900,  bidder:'0240' },
  { ctrl:'1406', desc:'BAG (LOT OF 12)', price:1900,  bidder:'0040' },
  { ctrl:'1409', desc:'STEEL SHELF',     price:3400,  bidder:'0252' },
  { ctrl:'1411', desc:'BICYCLE',         price:4800,  bidder:'0319' },
  { ctrl:'1418', desc:'BAG',             price:146,   bidder:'0040' },
  { ctrl:'1421', desc:'MARBLE IN BOX DI',price:3800,  bidder:'0090' },
  { ctrl:'1425', desc:'PLAKA',           price:3200,  bidder:'0220' },
  { ctrl:'1427', desc:'KW IN BOX DI',    price:3300,  bidder:'0219' },
  { ctrl:'1431', desc:'D. CAB',          price:3000,  bidder:'0033' },
  { ctrl:'1433', desc:'STORAGE BIN',     price:550,   bidder:'0319' },
  { ctrl:'1441', desc:'PILLOW SET',      price:800,   bidder:'5013' },
];

window.TAX_TARGET = TAX_TARGET;
window.HOUSE_BIDDER = HOUSE_BIDDER;
window.BIDDER_0740_TOTAL = BIDDER_0740_TOTAL;
window.TAX_DESCRIPTIONS = TAX_DESCRIPTIONS;
window.TAX_ITEMS = TAX_ITEMS;
