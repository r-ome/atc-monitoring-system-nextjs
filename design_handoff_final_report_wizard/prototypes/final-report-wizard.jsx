// Generate Final Report — Wizard redesign
// 4-step UX-friendly wizard mapped to the server-side flow:
//   1 Setup       → load container source data, apply options/policies
//   2 Review      → build base rows, apply draft virtually, show validation gates,
//                   user updates the draft only
//   3 Preview     → generate preview workbook from current preview
//   4 Finalize    → re-read draft, rebuild server-side, validate, apply DB effects,
//                   persist tax_deduction + final_report_changes, clear draft, files

const { useState, useMemo } = React;

// ─────────────────────────────── DATA ────────────────────────────────
const CONTAINER = {
  id: '25-41',
  supplier: 'Sumitomo',
  branch: 'BIÑAN',
  manifest: 'J21',
  arrived: 'May 12, 2026',
  auctionDate: 'May 16, 2026',
  totalItems: 142,
  encoder: 'Anna Cruz',
};

// Mix of states so the Review step shows validation gates clearly
const ROWS = [
  { id:'25-41-001', ctrl:'1402', desc:'WOODEN CABINET',          bidder:'0158', price:8400,  status:'PAID',   issue:null },
  { id:'25-41-002', ctrl:'1403', desc:'OFFICE CHAIR',            bidder:'0158', price:1200,  status:'PAID',   issue:null },
  { id:'25-41-003', ctrl:'1404', desc:'GLASS TABLE',             bidder:'0240', price:9900,  status:'PAID',   issue:null },
  { id:'25-41-004', ctrl:'1405', desc:'TV STAND',                bidder:'—',    price:null,  status:'UNSOLD', issue:'unsold' },
  { id:'25-41-005', ctrl:'1406', desc:'BAG (LOT OF 12)',         bidder:'0040', price:600,   status:'PAID',   issue:null },
  { id:'25-41-006', ctrl:'1407', desc:'MARBLE SIDE TABLE',       bidder:'0158', price:8800,  status:'UNPAID', issue:'unpaid' },
  { id:'25-41-007', ctrl:'1408', desc:'CERAMIC LAMP',            bidder:'—',    price:null,  status:'UNSOLD', issue:'unsold' },
  { id:'25-41-008', ctrl:'1409', desc:'STEEL SHELF',             bidder:'0252', price:3400,  status:'PAID',   issue:null },
  { id:'25-41-009', ctrl:'1410', desc:'KITCHEN SET (5 PCS)',     bidder:'0040', price:2200,  status:'PAID',   issue:null },
  { id:'25-41-010', ctrl:'1411', desc:'PLASTIC BIN',             bidder:'—',    price:null,  status:'UNSOLD', issue:'unsold' },
  { id:'25-41-011', ctrl:'1412', desc:'BICYCLE',                 bidder:'0319', price:4800,  status:'PAID',   issue:null },
  { id:'25-41-012', ctrl:'1413', desc:'D CAB (DAMAGED)',         bidder:'0252', price:6500,  status:'UNPAID', issue:'unpaid' },
];

const SUMMARY = {
  itemsSold:    128,
  itemsUnsold:  11,
  itemsUnpaid:  3,
  grossSales:   1284600,
  serviceCharge:128460,
  taxDeduction: 96345,
  netRemit:     1316785,
};

const peso = (n) => '₱' + (n == null ? '—' : n.toLocaleString(undefined, { minimumFractionDigits: 0 }));

// ─────────────────────────────── SHELL ───────────────────────────────
// A compact app shell so the wizard sits in context: 68px icon rail on
// the left (same as the homepage redesign), wizard takes the rest.
const RailIcon = ({ name, label, active }) => (
  <div title={label} style={{
    width: 44, height: 52, borderRadius: 8, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', gap: 4,
    color: active ? 'var(--accent)' : 'var(--muted)',
    background: active ? 'var(--surface-2)' : 'transparent',
    position:'relative', fontSize: 10, fontWeight: 600, cursor:'pointer',
  }}>
    {active && <span style={{ position:'absolute', left:-10, top:10, bottom:10, width:3, borderRadius:2, background:'var(--accent)' }}></span>}
    <Icon name={name} size={18} />
    <span>{label}</span>
  </div>
);

const Rail = () => (
  <aside style={{
    width: 68, flex:'none',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display:'flex', flexDirection:'column', alignItems:'center',
    padding: '14px 0', gap: 6,
  }}>
    <div style={{
      width:32, height:32, borderRadius:8, background:'var(--accent)',
      color:'var(--accent-fg)', display:'flex', alignItems:'center',
      justifyContent:'center', fontWeight:700, fontSize:13, marginBottom:6,
    }}>A</div>
    <RailIcon name="home"      label="Home" />
    <RailIcon name="gavel"     label="Auctions" />
    <RailIcon name="users"     label="Bidders" />
    <RailIcon name="package"   label="Bought" />
    <RailIcon name="building"  label="Branches" />
    <RailIcon name="container" label="Cntnrs" active />
    <RailIcon name="truck"     label="Suppliers" />
    <RailIcon name="chart"     label="Reports" />
    <div style={{ flex:1 }}></div>
    <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-2)',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600,
      color:'var(--text-2)' }}>MR</div>
  </aside>
);

// ─────────────────────────────── STEP RAIL ────────────────────────────
const STEPS = [
  { key:'setup',    n:1, title:'Setup',          sub:'Container info' },
  { key:'review',   n:2, title:'Resolve items',  sub:'Fix any issues' },
  { key:'tax',      n:3, title:'Container tax',  sub:'Deduct ₱30,000' },
  { key:'append',   n:4, title:'Append items',   sub:'Give new barcodes' },
  { key:'preview',  n:5, title:'Preview report', sub:'Check the file' },
  { key:'finalize', n:6, title:'Finalize',       sub:'Lock it in' },
];

const StepRail = ({ current }) => {
  const i = STEPS.findIndex(s => s.key === current);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 0,
      padding: '14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)',
    }}>
      {STEPS.map((s, idx) => {
        const done = idx < i, active = idx === i;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, opacity: idx > i ? 0.55 : 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? 'var(--accent)' : active ? 'var(--surface)' : 'var(--surface-2)',
                border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                color: done ? 'var(--accent-fg)' : active ? 'var(--accent)' : 'var(--muted)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: 12, fontWeight: 600, flex:'none',
              }}>
                {done ? <Icon name="chevronRight" size={14} /> : s.n}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: active ? 'var(--text)' : 'var(--text-2)', lineHeight:1.2 }}>{s.title}</div>
                <div style={{ fontSize:11.5, color:'var(--muted)' }}>{s.sub}</div>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ flex:1, height:1, background: idx < i ? 'var(--accent)' : 'var(--border)', margin:'0 18px' }}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────── WIZARD FRAME ─────────────────────────
const Header = ({ savedAgo = '12s' }) => (
  <header style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'12px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', height: 56,
  }}>
    <div style={{ display:'flex', alignItems:'center', gap: 8, fontSize:13, color:'var(--muted)' }}>
      <span style={{ cursor:'pointer' }}>Containers</span>
      <Icon name="chevronRight" size={12} />
      <span style={{ cursor:'pointer' }}>{CONTAINER.id} · {CONTAINER.supplier}</span>
      <Icon name="chevronRight" size={12} />
      <span style={{ color:'var(--text)', fontWeight:600 }}>Generate final report</span>
    </div>
    <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--muted)' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--success)' }}></span>
        Draft saved · {savedAgo} ago
      </div>
      <button className="btn btn-ghost"><Icon name="x" size={14}/> Close</button>
    </div>
  </header>
);

const Footer = ({ step, leftLabel='Back', rightLabel='Continue', rightDisabled=false, rightVariant='primary', warn=null }) => (
  <footer style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'12px 24px', borderTop:'1px solid var(--border)', background:'var(--surface)', height: 64,
  }}>
    <button className="btn" disabled={step===0} style={{ opacity: step===0 ? .5 : 1 }}>
      <Icon name="chevronLeft" size={14}/> {leftLabel}
    </button>
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      {warn && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--danger)', fontWeight:500 }}>
          <Icon name="alert" size={14}/> {warn}
        </div>
      )}
      <button className="btn">Save &amp; exit</button>
      <button className={`btn btn-${rightVariant}`} disabled={rightDisabled}
        style={{ height:36, padding:'0 16px', fontWeight:600, opacity: rightDisabled ? .55 : 1 }}>
        {rightLabel} <Icon name="arrowRight" size={14}/>
      </button>
    </div>
  </footer>
);

// Common containers ----------------------------------------------------
const Page = ({ children, maxWidth = 920 }) => (
  <div style={{ flex:1, overflow:'auto', padding:'28px 24px', background:'var(--bg)' }}>
    <div style={{ maxWidth, margin:'0 auto' }}>{children}</div>
  </div>
);

const StepHeading = ({ n, title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>
      Step {n} of 6
    </div>
    <h1 style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.015em', margin:'0 0 6px' }}>{title}</h1>
    <p style={{ fontSize:14, color:'var(--muted)', margin:0, maxWidth: 620 }}>{sub}</p>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:12, fontWeight:600, color:'var(--text-2)' }}>{label}</label>
    {children}
    {hint && <div style={{ fontSize:11.5, color:'var(--muted)' }}>{hint}</div>}
  </div>
);

// Toggle ---------------------------------------------------------------
const Toggle = ({ on=true, onChange }) => (
  <button onClick={onChange} style={{
    width: 34, height: 20, borderRadius: 999, border:0, padding:0,
    background: on ? 'var(--accent)' : 'var(--border-strong)',
    position:'relative', cursor:'pointer', transition:'background 120ms',
    flex:'none',
  }}>
    <span style={{
      position:'absolute', top:2, left: on ? 16 : 2, width:16, height:16,
      borderRadius:'50%', background:'#fff', transition:'left 120ms',
      boxShadow:'0 1px 2px rgba(0,0,0,.2)',
    }}></span>
  </button>
);

const OptionRow = ({ label, sub, on=true }) => (
  <label style={{
    display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px',
    border:'1px solid var(--border)', borderRadius: 10, background:'var(--surface)',
    cursor:'pointer',
  }}>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>{label}</div>
      {sub && <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:2 }}>{sub}</div>}
    </div>
    <Toggle on={on}/>
  </label>
);

// Status badge — matches the rest of the app
const Status = ({ s }) => {
  const map = {
    PAID:   { bg:'oklch(0.94 0.05 150)', fg:'oklch(0.4 0.13 150)' },
    UNPAID: { bg:'var(--danger-soft)',   fg:'var(--danger)' },
    UNSOLD: { bg:'oklch(0.96 0.05 85)',  fg:'oklch(0.45 0.1 80)' },
    APPEND: { bg:'var(--accent-soft)',   fg:'var(--accent)' },
  }[s] || { bg:'var(--surface-2)', fg:'var(--muted)' };
  return (
    <span style={{
      display:'inline-flex', padding:'2px 8px', borderRadius:4,
      background: map.bg, color: map.fg, fontSize:10.5, fontWeight:700, letterSpacing:'0.04em',
    }}>{s}</span>
  );
};

Object.assign(window, {
  CONTAINER, ROWS, SUMMARY, peso,
  Rail, StepRail, Header, Footer, Page, StepHeading,
  Field, Toggle, OptionRow, Status,
});
