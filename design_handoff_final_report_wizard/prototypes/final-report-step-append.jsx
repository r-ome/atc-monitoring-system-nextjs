// Step 4 — Append Inventories.
// Shows SOLD two-part items that weren't merged in Step 2.
// Each gets a new three-part barcode auto-incremented from the container's
// last existing three-part. User just confirms — no edits, no skipping.

// In production: server returns these from the draft + the inventory's last barcode.
const CONTAINER_LAST_BARCODE = '25-41-333';
const NEXT_SEQUENCE_START = 334;

// SOLD two-parts still in this container that weren't merged in Step 2.
const TWO_PART_ITEMS = [
  { id:'98-45-014', desc:'WOOD',       bidder:'0740', qty:1, price:500,  control:'1822', encoded:'09:23 AM' },
  { id:'98-45-015', desc:'KW/CW',      bidder:'0740', qty:1, price:1500, control:'1821', encoded:'09:23 AM' },
  { id:'98-45-016', desc:'KW',         bidder:'0740', qty:1, price:1000, control:'1820', encoded:'09:22 AM' },
  { id:'98-45-017', desc:'KW',         bidder:'0740', qty:1, price:1500, control:'1819', encoded:'09:22 AM' },
  { id:'98-45-018', desc:'KW',         bidder:'0740', qty:1, price:1200, control:'1818', encoded:'09:21 AM' },
  { id:'98-45-022', desc:'ACCESSORIES',bidder:'0158', qty:1, price:7000, control:'0579', encoded:'09:42 AM' },
  { id:'00-05-095', desc:'EI',         bidder:'0012', qty:1, price:300,  control:'1355', encoded:'04:23 PM' },
  { id:'20-04-299', desc:'SPEAKER',    bidder:'0028', qty:1, price:2800, control:'2900', encoded:'05:09 PM' },
];

window.CONTAINER_LAST_BARCODE = CONTAINER_LAST_BARCODE;
window.NEXT_SEQUENCE_START = NEXT_SEQUENCE_START;
window.TWO_PART_ITEMS = TWO_PART_ITEMS;

// ─── Append summary card ──────────────────────────────────────────────
const AppendSummary = ({ count }) => (
  <div className="card" style={{ padding:'14px 18px', marginBottom:14 }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          width:38, height:38, borderRadius:8,
          background:'var(--accent-soft)', color:'var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name="container" size={18}/>
        </div>
        <div>
          <div style={{ fontSize:13.5, fontWeight:600 }}>
            {count} two-part item{count===1?'':'s'} will be appended to this container
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>
            Each one gets the next available three-part barcode, in the order shown below.
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:18, fontSize:12 }}>
        <div>
          <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Last barcode</div>
          <div className="mono" style={{ fontWeight:600, marginTop:2 }}>{CONTAINER_LAST_BARCODE}</div>
        </div>
        <div style={{ width:1, background:'var(--border)' }}></div>
        <div>
          <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Next assigned</div>
          <div className="mono" style={{ fontWeight:600, marginTop:2, color:'var(--accent)' }}>
            25-41-{String(NEXT_SEQUENCE_START).padStart(3,'0')}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Append row ──────────────────────────────────────────────────────
const AppendRow = ({ item, newBarcode }) => (
  <tr>
    <td className="mono" style={{ color:'var(--muted)' }}>{item.id}</td>
    <td className="mono" style={{ color:'var(--muted)' }}>{item.control}</td>
    <td>{item.desc}</td>
    <td className="mono">{item.bidder}</td>
    <td className="mono" style={{ textAlign:'center' }}>{item.qty}</td>
    <td className="num mono" style={{ textAlign:'right' }}>{item.price.toLocaleString()}</td>
    <td style={{ textAlign:'center', color:'var(--muted)' }}>
      <Icon name="arrowRight" size={14}/>
    </td>
    <td className="mono" style={{ fontWeight:600, color:'var(--accent)' }}>{newBarcode}</td>
  </tr>
);

// ─── Empty state ─────────────────────────────────────────────────────
const AppendEmpty = () => (
  <div className="card" style={{
    padding: '48px 24px', textAlign:'center', maxWidth: 520, margin: '24px auto',
  }}>
    <div style={{
      width:56, height:56, borderRadius:'50%',
      background:'oklch(0.94 0.05 150)', color:'oklch(0.4 0.13 150)',
      display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14,
    }}>
      <Icon name="chevronRight" size={26}/>
    </div>
    <h2 style={{ fontSize:18, fontWeight:600, margin:'0 0 6px', letterSpacing:'-0.01em' }}>
      No items to append
    </h2>
    <p style={{ fontSize:13, color:'var(--muted)', margin:'0 auto 18px', maxWidth: 380, lineHeight:1.5 }}>
      Every sold item in this container already has a proper three-part barcode. You can skip ahead to preview the final report.
    </p>
    <div style={{ fontSize:11.5, color:'var(--muted)', display:'inline-flex', alignItems:'center', gap:6 }}>
      <Icon name="container" size={12}/> Last barcode in container: <span className="mono" style={{ color:'var(--text-2)', fontWeight:600 }}>{CONTAINER_LAST_BARCODE}</span>
    </div>
  </div>
);

// ─── Step 4 page ─────────────────────────────────────────────────────
const StepAppendPage = ({ variant = 'list' }) => {
  const isEmpty = variant === 'empty';
  return (
    <Page maxWidth={1100}>
      <StepHeading n={4} title="Append remaining items into this container"
        sub="These items were sold at auction but were encoded as two-part barcodes. We'll give each one a new three-part barcode so they're tracked under this container." />

      {isEmpty ? (
        <AppendEmpty/>
      ) : (
        <>
          <AppendSummary count={TWO_PART_ITEMS.length}/>

          <div className="card" style={{ padding:0 }}>
            <table className="data" style={{ width:'100%' }}>
              <thead>
                <tr>
                  <th style={{ width:110 }}>Old barcode</th>
                  <th style={{ width:90 }}>Control</th>
                  <th>Description</th>
                  <th style={{ width:80 }}>Bidder</th>
                  <th style={{ width:50, textAlign:'center' }}>Qty</th>
                  <th style={{ width:100, textAlign:'right' }}>Price</th>
                  <th style={{ width:30 }}></th>
                  <th style={{ width:130 }}>New barcode</th>
                </tr>
              </thead>
              <tbody>
                {TWO_PART_ITEMS.map((it, i) => (
                  <AppendRow
                    key={it.id}
                    item={it}
                    newBarcode={`25-41-${String(NEXT_SEQUENCE_START + i).padStart(3,'0')}`}
                  />
                ))}
              </tbody>
            </table>
            <div style={{
              padding:'10px 16px', borderTop:'1px solid var(--border)',
              fontSize:12, color:'var(--muted)', display:'flex', justifyContent:'space-between',
            }}>
              <span>
                Appending {TWO_PART_ITEMS.length} items as {' '}
                <span className="mono" style={{ color:'var(--text-2)', fontWeight:500 }}>25-41-{String(NEXT_SEQUENCE_START).padStart(3,'0')}</span>
                {' → '}
                <span className="mono" style={{ color:'var(--text-2)', fontWeight:500 }}>25-41-{String(NEXT_SEQUENCE_START + TWO_PART_ITEMS.length - 1).padStart(3,'0')}</span>
              </span>
              <span>Numbering is automatic, in encode order.</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, padding:'14px 16px', borderRadius:10, background:'var(--accent-soft)', alignItems:'flex-start', marginTop:14 }}>
            <Icon name="sparkles" size={16} style={{ color:'var(--accent)', flex:'none', marginTop:2 }}/>
            <div style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.5 }}>
              These new barcodes only exist once you finalize. The original two-part records stay in the auction log for traceability.
            </div>
          </div>
        </>
      )}
    </Page>
  );
};

window.StepAppendPage = StepAppendPage;
window.AppendSummary = AppendSummary;
window.AppendRow = AppendRow;
window.AppendEmpty = AppendEmpty;
