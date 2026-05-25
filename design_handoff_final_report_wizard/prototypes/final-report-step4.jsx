// Step 4 — Finalize: confirmation page that explains exactly what will
// happen, requires a typed/checked confirmation, then triggers the
// server-side finalize.

const ActionListItem = ({ icon, title, sub }) => (
  <div style={{
    display:'flex', gap:14, padding:'12px 14px', borderRadius:8,
    background:'var(--surface-2)', alignItems:'flex-start',
  }}>
    <div style={{
      width:28, height:28, borderRadius:6, background:'var(--surface)',
      border:'1px solid var(--border)', flex:'none',
      display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)',
    }}>
      <Icon name={icon} size={14}/>
    </div>
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{title}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>{sub}</div>
    </div>
  </div>
);

const Step4Finalize = ({ confirmed=false }) => (
  <Page maxWidth={760}>
    <StepHeading n={6} title="Ready to finalize"
      sub="One last check. When you finalize, the actions below run together and can't be undone — but everything you reviewed is saved exactly as you saw it." />

    {/* What will happen */}
    <div className="card" style={{ padding:18, marginBottom:16 }}>
      <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>What happens when you click "Finalize"</div>
      <div style={{ fontSize:12.5, color:'var(--muted)', marginBottom:14 }}>
        We'll run these in order. If anything fails, we stop and nothing is saved.
      </div>
      <div style={{ display:'grid', gap:8 }}>
        <ActionListItem icon="chevronRight"
          title="Lock in the items you reviewed"
          sub="128 sold, 11 moving to next auction, 3 unpaid bidders flagged."/>
        <ActionListItem icon="receipt"
          title={`Save ${peso(SUMMARY.taxDeduction)} as tax withheld`}
          sub="Goes to the tax records under Container 25-41."/>
        <ActionListItem icon="package"
          title="Add 11 unsold items to next container"
          sub="They'll show up in Sumitomo's next manifest, ready for re-auction."/>
        <ActionListItem icon="download"
          title="Generate & upload the final spreadsheet"
          sub="Saved under Reports → May 2026 → Container 25-41. Supplier gets an email."/>
        <ActionListItem icon="chart"
          title="Log a full change history"
          sub="Every edit you made in Review is kept so we can answer questions later."/>
      </div>
    </div>

    {/* Confirmation */}
    <div style={{
      padding:'14px 16px', borderRadius:10,
      background: confirmed ? 'oklch(0.97 0.04 150)' : 'oklch(0.985 0.025 25)',
      border: confirmed ? '1px solid oklch(0.85 0.1 150)' : '1px solid oklch(0.88 0.08 25)',
      display:'flex', gap:12, alignItems:'flex-start', marginBottom: 4,
    }}>
      <div style={{
        width:18, height:18, borderRadius:4, marginTop:1, flex:'none',
        background: confirmed ? 'var(--success)' : 'transparent',
        border: confirmed ? '1.5px solid var(--success)' : '1.5px solid var(--danger)',
        color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {confirmed && <Icon name="chevronRight" size={11}/>}
      </div>
      <div style={{ fontSize:13, lineHeight:1.5 }}>
        <div style={{ fontWeight:600, color: confirmed ? 'var(--success)' : 'var(--danger)' }}>
          I've reviewed everything and I'm ready to finalize.
        </div>
        <div style={{ color:'var(--text-2)', marginTop:2 }}>
          Finalizing is permanent. To make changes after, you'd have to ask an admin to reopen the container.
        </div>
      </div>
    </div>
  </Page>
);

// Success state — shown right after finalize completes
const Step4Success = () => (
  <Page maxWidth={620}>
    <div style={{ textAlign:'center', paddingTop: 32 }}>
      <div style={{
        width: 64, height: 64, borderRadius:'50%',
        background:'oklch(0.94 0.05 150)', color:'oklch(0.4 0.13 150)',
        display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:20,
      }}>
        <Icon name="chevronRight" size={32}/>
      </div>
      <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.015em', margin:'0 0 8px' }}>
        Container 25-41 is finalized
      </h1>
      <p style={{ fontSize:14.5, color:'var(--muted)', margin:'0 auto 24px', maxWidth:460 }}>
        Final report sent to Sumitomo. Tax record saved. 11 unsold items are queued for the next auction.
      </p>

      <div className="card" style={{ padding:18, textAlign:'left', marginBottom:18 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>
          Receipt
        </div>
        {[
          ['Report file',     'FinalReport_25-41.xlsx · sent to supplier'],
          ['Net to supplier', peso(SUMMARY.netRemit)],
          ['Tax withheld',    peso(SUMMARY.taxDeduction) + ' · saved'],
          ['Finalized by',    'Maria Reyes · May 23, 2026 · 4:18 PM'],
        ].map(([k,v], i) => (
          <div key={k} style={{
            display:'flex', justifyContent:'space-between', padding:'10px 0',
            borderTop: i===0 ? 0 : '1px solid var(--border)', gap:12,
          }}>
            <span style={{ fontSize:12.5, color:'var(--muted)' }}>{k}</span>
            <span style={{ fontSize:12.5, color:'var(--text)', fontWeight:500, textAlign:'right' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button className="btn"><Icon name="download" size={13}/> Download report</button>
        <button className="btn btn-primary" style={{ fontWeight:600, padding:'0 16px' }}>
          Back to monitoring <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  </Page>
);

window.Step4Finalize = Step4Finalize;
window.Step4Success = Step4Success;
window.ActionListItem = ActionListItem;
