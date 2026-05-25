// Step 1 — Setup: show what we're about to report on.
// Read-only summary of the container's auction performance + the
// breakdown that will appear on the final report.

// ─── Top — container header (no "Change container" action) ───
const ContainerHeader = () => (
  <div className="card" style={{ padding: 18, marginBottom: 16 }}>
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div style={{
        width:46, height:46, borderRadius:10, background:'var(--event-container-soft)',
        color:'var(--event-container)', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon name="container" size={22}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:17, fontWeight:600, letterSpacing:'-0.01em' }}>
          Container <span className="mono">{CONTAINER.id}</span> · {CONTAINER.supplier}
        </div>
        <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:1 }}>
          {CONTAINER.branch} branch
        </div>
      </div>
      <Status s="READY"/>
    </div>
  </div>
);

// ─── Auction performance — at-a-glance KPI strip ───
const PerfTile = ({ label, value, sub, tone='neutral' }) => {
  const fg = tone==='danger' ? 'var(--danger)' :
             tone==='success'? 'var(--success)' :
             tone==='warn'   ? 'oklch(0.5 0.12 75)' : 'var(--text)';
  return (
    <div style={{
      padding:'14px 16px', background:'var(--surface)',
      border:'1px solid var(--border)', borderRadius:10,
      display:'flex', flexDirection:'column', gap:4, minWidth:0,
    }}>
      <span style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</span>
      <span className="mono" style={{ fontSize:20, fontWeight:600, color: fg, letterSpacing:'-0.02em', lineHeight:1.15 }}>{value}</span>
      {sub && <span style={{ fontSize:11.5, color:'var(--muted)' }}>{sub}</span>}
    </div>
  );
};

const AuctionPerformance = () => (
  <section style={{ marginBottom: 18 }}>
    <SectionLabel
      title="Auction performance"
      sub="What happened across the auction days for this container."
    />
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
      <PerfTile
        label="Auctioned on"
        value="May 16 – 18, 2026"
        sub="3 auction days"
      />
      <PerfTile
        label="Report due"
        value="Jun 15, 2026"
        sub="23 days from today"
      />
      <PerfTile
        label="Sold items"
        value="128"
        sub="11 unsold · 3 unpaid pending"
        tone="warn"
      />
      <PerfTile
        label="Total item sales"
        value={peso(1284600)}
        sub="paid + unpaid hammer price"
      />
    </div>
  </section>
);

// ─── Section header with tiny label + sub ───
const SectionLabel = ({ title, sub, right }) => (
  <div style={{
    display:'flex', alignItems:'flex-end', justifyContent:'space-between',
    marginBottom:10, gap:14,
  }}>
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.005em' }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

// ─── Duties & taxes card ───
const DutiesCard = () => (
  <div className="card" style={{ padding:'14px 18px', marginBottom:18 }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{
          width:34, height:34, borderRadius:8, background:'var(--surface-2)',
          color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name="receipt" size={16}/>
        </div>
        <div>
          <div style={{ fontSize:13.5, fontWeight:600 }}>Duties &amp; taxes paid on this container</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>BOC clearance, customs, brokerage · already deducted before sales calc</div>
        </div>
      </div>
      <span className="mono" style={{ fontSize:18, fontWeight:600, letterSpacing:'-0.01em' }}>{peso(182400)}</span>
    </div>
  </div>
);

// ─── Container Sales Report breakdown ───
// Grouped exactly like the reference image:
//  · Total Item Sales              (alone)
//  · Container/Group/Sorting/Royalty (4)
//  · ATC Sales + Service Charge    (2)
//  · Total Profit + ATC Allocated  (2)
const BREAKDOWN_GROUPS = [
  {
    rows: [
      { k:'Total Item Sales', v: 1284600, info:'Sum of every sold item at hammer price, before charges.', strong:true, big:true },
    ],
  },
  {
    rows: [
      { k:'Container Sales Commission',  v: -77076, info:"ATC's commission on this container's gross sales.", sign:'sub' },
      { k:'ATC Group Commission',        v: -25692, info:'Cross-branch share allocated to the ATC group.',     sign:'sub' },
      { k:'Sorting / Preparation Fee',   v: -18000, info:'Fixed fee for sorting and lotting before auction.',   sign:'sub' },
      { k:'Royalty',                     v: -12846, info:'Supplier royalty on top of commission.',              sign:'sub' },
    ],
  },
  {
    rows: [
      { k:'ATC Sales',        v: 133614, info:"Subtotal of ATC's revenue from this container.", muted:true },
      { k:'Service Charge',   v:  128460, info:'10% buyer service charge collected at checkout.', sign:'add' },
    ],
  },
  {
    rows: [
      { k:'Total Profit',                v: 262074, info:'ATC Sales + Service Charge.',     strong:true },
      { k:'ATC Allocated Item Sales',    v: 1022526, info:"What's remitted back to the supplier.", strong:true, accent:true },
    ],
  },
];

const InfoDot = () => (
  <span title="More info" style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:14, height:14, borderRadius:'50%', border:'1px solid var(--border-strong)',
    color:'var(--muted)', fontSize:9, fontWeight:600, cursor:'help',
    marginLeft:6, verticalAlign:'middle',
  }}>i</span>
);

const BreakdownRow = ({ row, isLast }) => {
  const sign = row.sign === 'sub' ? '−' : row.sign === 'add' ? '+' : '';
  const amt = Math.abs(row.v);
  const labelColor = row.muted ? 'var(--muted)' : 'var(--text)';
  const valueColor =
    row.accent ? 'var(--accent)' :
    row.sign === 'sub' ? 'var(--danger)' :
    row.sign === 'add' ? 'var(--success)' :
    'var(--text)';
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'baseline',
      padding:'11px 0', borderBottom: isLast ? 0 : '1px dashed var(--border)',
    }}>
      <div style={{
        fontSize: row.big ? 14 : 13,
        fontWeight: row.strong ? 600 : 500,
        color: labelColor,
        display:'inline-flex', alignItems:'center',
      }}>
        {row.k}
        <InfoDot/>
      </div>
      <div className="mono" style={{
        fontSize: row.big ? 18 : row.strong ? 15 : 14,
        fontWeight: row.strong ? 600 : 500,
        color: valueColor,
        letterSpacing:'-0.01em',
      }}>
        {sign && <span style={{ marginRight: 4 }}>{sign}</span>}
        {peso(amt)}
      </div>
    </div>
  );
};

const ContainerSalesReport = () => (
  <section style={{ marginBottom: 18 }}>
    <SectionLabel
      title="Container Sales Report"
      sub="This is how the totals on the final report will be calculated. Hover any row for details."
      right={<button className="btn btn-ghost" style={{ height:28, fontSize:11.5 }}>
        <Icon name="receipt" size={12}/> Breakdown
      </button>}
    />
    <div className="card" style={{ padding:'4px 20px' }}>
      {BREAKDOWN_GROUPS.map((grp, gi) => (
        <div key={gi} style={{
          padding: '8px 0',
          borderBottom: gi < BREAKDOWN_GROUPS.length - 1 ? '1px solid var(--border)' : 0,
        }}>
          {grp.rows.map((row, ri) => (
            <BreakdownRow key={row.k} row={row} isLast={ri === grp.rows.length - 1}/>
          ))}
        </div>
      ))}
    </div>
  </section>
);

// ─── Step 1 page ───
const Step1Setup = () => (
  <>
    <StepHeading
      n={1}
      title="Generate the final report for this container"
      sub="Review the numbers below before we build the report. The next step lets you fix unsold items and check every row."
    />

    <ContainerHeader/>
    <AuctionPerformance/>
    <DutiesCard/>
    <ContainerSalesReport/>

    <div style={{
      display:'flex', gap:12, padding:'14px 16px', borderRadius:10,
      background:'var(--accent-soft)', alignItems:'flex-start', marginTop:4,
    }}>
      <Icon name="sparkles" size={18} style={{ color:'var(--accent)', flex:'none', marginTop:1 }}/>
      <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.5 }}>
        <strong style={{ color:'var(--text)' }}>Heads up:</strong> Nothing is final yet. Continue to review every item — including the <strong>11 unsold</strong> ones that still need a decision.
      </div>
    </div>
  </>
);

window.Step1Setup = Step1Setup;
