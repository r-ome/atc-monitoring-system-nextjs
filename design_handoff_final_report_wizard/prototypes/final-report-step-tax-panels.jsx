// Step 3 — Container Tax: price table + totals + page

// ─── Price row ──────────────────────────────────────────────────────
const PriceRow = ({ item, newPrice, onChange }) => {
  const deducted = Math.max(0, item.price - (newPrice ?? item.price));
  const isAdjusted = newPrice != null && newPrice < item.price;
  const isInvalid = newPrice != null && newPrice > item.price;
  return (
    <tr style={{ background: isAdjusted ? 'oklch(0.985 0.015 150)' : 'transparent' }}>
      <td className="mono" style={{ color:'var(--muted)' }}>{item.ctrl}</td>
      <td style={{ fontWeight:500 }}>{item.desc}</td>
      <td className="mono" style={{ color:'var(--muted)' }}>{item.bidder}</td>
      <td className="num mono" style={{ textAlign:'right' }}>{item.price.toLocaleString()}</td>
      <td>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:4,
            border:`1px solid ${isInvalid ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius:6, padding:'0 8px', height:28, background:'#fff',
            width: 110, justifyContent:'flex-end',
          }}>
            <span style={{ fontSize:11, color:'var(--muted)' }}>₱</span>
            <input
              type="number"
              max={item.price}
              min={0}
              value={newPrice ?? item.price}
              onChange={e => onChange(Number(e.target.value))}
              className="mono"
              style={{ width:80, border:0, outline:'none', fontSize:12.5, textAlign:'right',
                background:'transparent', fontFamily:'inherit', color: isInvalid ? 'var(--danger)' : 'var(--text)' }}
            />
          </div>
        </div>
      </td>
      <td className="num mono" style={{ textAlign:'right', color: deducted > 0 ? 'var(--success)' : 'var(--muted)', fontWeight: deducted > 0 ? 600 : 400 }}>
        {deducted > 0 ? `−${deducted.toLocaleString()}` : '0'}
      </td>
    </tr>
  );
};

// ─── Totals panel ───────────────────────────────────────────────────
const TotalsPanel = ({ deducted, itemPriceTotal, hasHouseBidder }) => {
  const targetRemaining = Math.max(0, TAX_TARGET - BIDDER_0740_TOTAL - deducted);
  const totalApplied = BIDDER_0740_TOTAL + deducted;
  const netTotal = itemPriceTotal - deducted;
  const isMet = targetRemaining === 0;
  return (
    <aside style={{
      width: 280, flex:'none', borderLeft:'1px solid var(--border)',
      background:'var(--surface)', display:'flex', flexDirection:'column', minHeight:0,
    }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Totals</div>
      </div>

      {/* Big progress block */}
      <div style={{ padding:'18px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.04em', textTransform:'uppercase' }}>Container tax target</span>
        </div>
        <div className="mono" style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.02em' }}>
          {peso(totalApplied)}
          <span style={{ fontSize:13, fontWeight:500, color:'var(--muted)', marginLeft:6 }}>/ {peso(TAX_TARGET)}</span>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop:10, background:'var(--surface-2)', borderRadius:999, height:8, overflow:'hidden' }}>
          <div style={{
            width: `${Math.min(100, (totalApplied / TAX_TARGET) * 100)}%`,
            height:'100%',
            background: isMet ? 'var(--success)' : 'var(--accent)',
            transition:'width 200ms ease',
          }}></div>
        </div>
        {!isMet ? (
          <div style={{
            display:'flex', alignItems:'center', gap:6, marginTop:10,
            fontSize:12, color:'var(--danger)', fontWeight:600,
          }}>
            <Icon name="alert" size={12}/> Still needed <span className="mono" style={{ marginLeft:'auto' }}>{peso(targetRemaining)}</span>
          </div>
        ) : (
          <div style={{
            display:'flex', alignItems:'center', gap:6, marginTop:10,
            fontSize:12, color:'var(--success)', fontWeight:600,
          }}>
            <Icon name="chevronRight" size={12}/> Target met
          </div>
        )}
      </div>

      {/* Detail rows */}
      <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:0, fontSize:12.5 }}>
        {hasHouseBidder && (
          <TotalRow
            label={`Bidder ${HOUSE_BIDDER}`}
            sub="Pre-counted toward target"
            value={peso(BIDDER_0740_TOTAL)}
            valueClass="mono"
          />
        )}
        <TotalRow
          label="Items deducted"
          sub="Sum of all price reductions"
          value={deducted > 0 ? `−${peso(deducted)}` : peso(0)}
          valueClass="mono"
          tone={deducted > 0 ? 'success' : 'neutral'}
        />
        <div style={{ height:1, background:'var(--border)', margin:'10px 0' }}></div>
        <TotalRow
          label="Item price total"
          sub="Original auction prices"
          value={peso(itemPriceTotal)}
          valueClass="mono"
        />
        <TotalRow
          label="Net total"
          sub="After deductions"
          value={peso(netTotal)}
          valueClass="mono"
          tone="strong"
          info
        />
      </div>
    </aside>
  );
};

const TotalRow = ({ label, sub, value, valueClass='', tone='neutral', info }) => {
  const fg = tone === 'success' ? 'var(--success)' :
             tone === 'danger'  ? 'var(--danger)' :
             tone === 'strong'  ? 'var(--text)' : 'var(--text)';
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', gap:10 }}>
      <div style={{ minWidth:0 }}>
        <div style={{
          fontSize:11.5, fontWeight:600, color:'var(--text-2)', letterSpacing:'0.04em', textTransform:'uppercase',
          display:'inline-flex', alignItems:'center', gap:4,
        }}>
          {label}
          {info && <span title="Final amount that appears on the report" style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:13, height:13, borderRadius:'50%', border:'1px solid var(--border-strong)',
            color:'var(--muted)', fontSize:9, fontWeight:600, cursor:'help',
          }}>i</span>}
        </div>
        {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{sub}</div>}
      </div>
      <div className={valueClass} style={{
        fontSize: tone === 'strong' ? 14 : 13,
        fontWeight: tone === 'strong' ? 700 : 600,
        color: fg, whiteSpace:'nowrap',
        letterSpacing: tone === 'strong' ? '-0.01em' : 0,
      }}>{value}</div>
    </div>
  );
};

window.PriceRow = PriceRow;
window.TotalsPanel = TotalsPanel;
window.TotalRow = TotalRow;
