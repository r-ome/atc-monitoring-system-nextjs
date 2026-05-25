// Step 3 — Preview the final report as a stylized workbook simulation.
// 5 sheet tabs at the bottom, click to switch. Each sheet is ATC-themed
// (clean tables, no Excel chrome) but structurally mirrors what the
// supplier will receive in .xlsx.

const SHEETS = [
  { id:'items',   label:'25-41 · Sumitomo', accent:'#22863a' },
  { id:'final',   label:'FINAL COMPUTATION', accent:'#1f77b4' },
  { id:'encode',  label:'ENCODE',            accent:'#5f3dc4' },
  { id:'unsold',  label:'UNSOLD',            accent:'#d97706' },
  { id:'bill',    label:'BILL',              accent:'#6f42c1' },
];

// ─── Workbook frame ───────────────────────────────────────────────────
const WorkbookFrame = ({ active, setActive, children }) => (
  <div style={{
    background:'#fff', borderRadius:12, border:'1px solid var(--border)',
    boxShadow:'var(--shadow-sm)', overflow:'hidden',
    display:'flex', flexDirection:'column', minHeight: 0,
  }}>
    {/* Workbook title bar */}
    <div style={{
      padding:'10px 16px', borderBottom:'1px solid var(--border)',
      background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
        <div style={{
          width:22, height:22, borderRadius:4, background:'#22863a',
          color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:10, fontWeight:700, letterSpacing:'0.04em',
        }}>X</div>
        <span style={{ fontWeight:600, color:'var(--text)' }}>FinalReport_25-41_Sumitomo_PREVIEW.xlsx</span>
        <span style={{ fontSize:11.5, color:'var(--muted)' }}>· 5 sheets · preview only</span>
      </div>
      <div style={{ fontSize:11.5, color:'var(--muted)' }}>Read-only simulation</div>
    </div>

    {/* Sheet tab bar — now at the top */}
    <div style={{
      borderBottom:'1px solid var(--border)', background:'var(--surface-2)',
      padding:'0 10px', display:'flex', alignItems:'flex-end', gap:2,
      overflowX:'auto',
    }}>
      {SHEETS.map(s => {
        const isActive = s.id === active;
        return (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            border:0, borderBottom:'2px solid', borderBottomColor: isActive ? s.accent : 'transparent',
            background: isActive ? '#fff' : 'transparent',
            padding:'10px 16px 9px', cursor:'pointer',
            fontSize:11.5, fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--text)' : 'var(--muted)',
            letterSpacing:'0.02em',
            borderTop: isActive ? '1px solid var(--border)' : '1px solid transparent',
            borderLeft: isActive ? '1px solid var(--border)' : 0,
            borderRight: isActive ? '1px solid var(--border)' : 0,
            borderTopLeftRadius: 6, borderTopRightRadius: 6,
            position:'relative', bottom: -1,
            display:'inline-flex', alignItems:'center', gap:6,
            whiteSpace:'nowrap',
          }}>
            {s.label}
          </button>
        );
      })}
      <div style={{ flex:1 }}></div>
    </div>

    {/* Sheet body */}
    <div style={{ flex:1, overflow:'auto', background:'#fff', minHeight: 420 }}>
      {children}
    </div>
  </div>
);

// ─── Sheet header (top yellow strip in the originals) ────────────────
const SheetTitle = ({ title, sub }) => (
  <div style={{ padding:'18px 24px 8px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
    <div>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Sheet</div>
      <h2 style={{ fontSize:18, fontWeight:600, letterSpacing:'-0.01em', margin:'2px 0 0' }}>{title}</h2>
    </div>
    {sub && <div style={{ fontSize:12, color:'var(--muted)' }}>{sub}</div>}
  </div>
);

// ─── SHEET 1 — Items list (LOCAL MADE CO.,LTD. style) ────────────────
const ITEMS_PREVIEW = [
  { bc:'25-41-001', ctrl:'1402', desc:'WOODEN CABINET',       bidder:'0158', qty:'1',     price:8400 },
  { bc:'25-41-002', ctrl:'1403', desc:'OFFICE CHAIR',         bidder:'0158', qty:'1',     price:1200 },
  { bc:'25-41-003', ctrl:'1404', desc:'GLASS TABLE',          bidder:'0240', qty:'1',     price:9900 },
  { bc:'25-41-005', ctrl:'1406', desc:'BAG (LOT OF 12)',      bidder:'0040', qty:'1 LOT', price:1900 },
  { bc:'25-41-008', ctrl:'1409', desc:'STEEL SHELF',          bidder:'0252', qty:'1',     price:3400 },
  { bc:'25-41-009', ctrl:'1410', desc:'KITCHEN SET (5 PCS)',  bidder:'0040', qty:'1 LOT', price:2200 },
  { bc:'25-41-011', ctrl:'1412', desc:'BICYCLE',              bidder:'0319', qty:'1',     price:4800 },
  { bc:'25-41-014', ctrl:'1415', desc:'OFFICE CHAIR',         bidder:'0158', qty:'1',     price:1200 },
  { bc:'25-41-017', ctrl:'1418', desc:'BAG (SPLIT FROM LOT)', bidder:'0040', qty:'1/12',  price:146  },
  { bc:'25-41-020', ctrl:'1421', desc:'MARBLE IN BOX DI',     bidder:'0090', qty:'1',     price:3800 },
  { bc:'25-41-022', ctrl:'1423', desc:'KITCHEN UTENSILS',     bidder:'5013', qty:'1',     price:200  },
  { bc:'25-41-024', ctrl:'1425', desc:'PLAKA',                bidder:'0220', qty:'2',     price:3200 },
  { bc:'25-41-026', ctrl:'1427', desc:'KW IN BOX DI',         bidder:'0219', qty:'1',     price:3300 },
  { bc:'25-41-030', ctrl:'1431', desc:'D. CAB',               bidder:'0033', qty:'1',     price:3000 },
];

const ItemsSheet = () => (
  <>
    <SheetTitle title="Sumitomo · 25-41" sub="Sold items detail · BIÑAN branch" />
    {/* Excel-style summary header row */}
    <div style={{ padding:'4px 24px 14px' }}>
      <div style={{
        display:'grid', gridTemplateColumns:'minmax(160px, 1.2fr) 1fr minmax(160px, 1.2fr) 1fr',
        border:'1px solid var(--border-strong)', borderRadius:6, overflow:'hidden',
        fontSize:12.5,
      }}>
        <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:600 }}>TOTAL PRICE OF ITEMS</div>
        <div className="mono" style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, borderLeft:'1px solid var(--border)' }}>{peso(1284600)}</div>
        <div style={{ padding:'8px 12px', background:'#fef3c7', fontWeight:700, color:'#92400e', borderLeft:'1px solid var(--border-strong)' }}>
          HIGHEST PRICE <span style={{ fontWeight:500, fontSize:11, marginLeft:6 }}>(Monitoring)</span>
        </div>
        <div className="mono" style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, borderLeft:'1px solid var(--border)' }}>{peso(9900)}</div>
        <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:600, borderTop:'1px solid var(--border)' }}>NUMBER OF ITEMS</div>
        <div className="mono" style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, borderTop:'1px solid var(--border)', borderLeft:'1px solid var(--border)' }}>139</div>
        <div style={{ padding:'8px 12px', background:'var(--surface-2)', borderTop:'1px solid var(--border)', borderLeft:'1px solid var(--border-strong)' }}></div>
        <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)', borderLeft:'1px solid var(--border)' }}></div>
      </div>
    </div>

    {/* Item rows */}
    <div style={{ padding:'0 24px 18px' }}>
      <table className="data" style={{ width:'100%' }}>
        <thead>
          <tr style={{ background:'#cfe2f3' }}>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a' }}>BARCODE</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:90 }}>CONTROL</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a' }}>DESCRIPTION</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:90 }}>BIDDER #</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:80, textAlign:'center' }}>QTY</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:100, textAlign:'right' }}>PRICE</th>
          </tr>
        </thead>
        <tbody>
          {ITEMS_PREVIEW.map((r, i) => (
            <tr key={r.bc}>
              <td className="mono" style={{ fontWeight:500 }}>{r.bc}</td>
              <td className="mono" style={{ color:'var(--muted)' }}>{r.ctrl}</td>
              <td>{r.desc}</td>
              <td className="mono">{r.bidder}</td>
              <td className="mono" style={{ textAlign:'center' }}>{r.qty}</td>
              <td className="num mono" style={{ textAlign:'right' }}>{r.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:11.5, color:'var(--muted)', padding:'10px 0 0', textAlign:'center', fontStyle:'italic' }}>
        … showing 14 of 139 rows · the .xlsx file includes all
      </div>
    </div>
  </>
);

window.SHEETS = SHEETS;
window.WorkbookFrame = WorkbookFrame;
window.SheetTitle = SheetTitle;
window.ItemsSheet = ItemsSheet;
window.ITEMS_PREVIEW = ITEMS_PREVIEW;
