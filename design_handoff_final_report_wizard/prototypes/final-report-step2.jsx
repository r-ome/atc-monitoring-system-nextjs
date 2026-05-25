// Step 2 — Resolve items that need attention.
// Lists UNSOLD + REFUNDED items. Each has 4 resolutions (strictly one):
//   • Merge      (1 UNSOLD → 1 SOLD, opens SOLD picker pane)
//   • Buy        (assigns to house bidder 5013, inline)
//   • Void       (removes from final report, inline, no reason)
//   • Qty Split  (absorbs into a SOLD multi-qty lot, opens pane with auto/override)
// Adaptive layout: pane appears only for Merge / Split.

// ─── Source data ──────────────────────────────────────────────────────
// Items that need attention (UNSOLD + REFUNDED)
const ATTENTION_ITEMS = [
  { id: '25-41-04',  ctrl:'1405', desc:'TV STAND',            qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-07',  ctrl:'1408', desc:'CERAMIC LAMP',        qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-10',  ctrl:'1411', desc:'PLASTIC BIN',         qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-14',  ctrl:'1415', desc:'OFFICE CHAIR',        qty:1, price:null, status:'UNSOLD',   note:'Possibly same as 25-41-115' },
  { id: '25-41-17',  ctrl:'1418', desc:'BAG',                 qty:1, price:null, status:'UNSOLD',   note:'Lot of 12 was sold' },
  { id: '25-41-22',  ctrl:'1422', desc:'KITCHEN UTENSILS',    qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-29',  ctrl:'1429', desc:'GLASS VASE',          qty:1, price:null, status:'UNSOLD',   note:'Broken on inspection' },
  { id: '25-41-33',  ctrl:'1433', desc:'STORAGE BIN',         qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-41',  ctrl:'1441', desc:'PILLOW SET',          qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-58',  ctrl:'1458', desc:'TABLE LAMP',          qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '25-41-66',  ctrl:'1466', desc:'WALL CLOCK',          qty:1, price:null, status:'UNSOLD',   note:null },
  { id: '98-45-414', ctrl:'1515', desc:'GW',                  qty:1, price:3400, status:'REFUNDED', note:'Bidder 0998 refunded' },
];

// SOLD items eligible to receive a merge or absorb a qty split
const SOLD_CANDIDATES = [
  { id: '25-41-115', ctrl:'1402', desc:'OFFICE CHAIR',     qty:1,  unitPrice:1200, totalPrice:1200, bidder:'0158' },
  { id: '25-41-118', ctrl:'1405', desc:'BAG (LOT OF 12)',  qty:12, unitPrice:158,  totalPrice:1900, bidder:'0040' },
  { id: '25-41-203', ctrl:'1408', desc:'WOODEN CABINET',   qty:1,  unitPrice:8400, totalPrice:8400, bidder:'0158' },
  { id: '25-41-211', ctrl:'1410', desc:'GLASS TABLE',      qty:1,  unitPrice:9900, totalPrice:9900, bidder:'0240' },
  { id: '25-41-302', ctrl:'1412', desc:'STORAGE BIN SET',  qty:4,  unitPrice:550,  totalPrice:2200, bidder:'0319' },
];

window.ATTENTION_ITEMS = ATTENTION_ITEMS;
window.SOLD_CANDIDATES = SOLD_CANDIDATES;

// ─── Action pills (per-row resolver) ──────────────────────────────────
const ACTION_DEFS = {
  merge: { label:'Merge',   icon:'arrowRight', tone:'accent' },
  buy:   { label:'Buy',     icon:'package',    tone:'success' },
  split: { label:'Split',   icon:'filter',     tone:'accent' },
  void:  { label:'Void',    icon:'x',          tone:'danger'  },
};

const TONE = {
  accent:  { bg:'var(--accent-soft)',     fg:'var(--accent)',   border:'transparent' },
  success: { bg:'oklch(0.94 0.05 150)',   fg:'oklch(0.4 0.13 150)', border:'transparent' },
  danger:  { bg:'var(--danger-soft)',     fg:'var(--danger)',   border:'transparent' },
  neutral: { bg:'var(--surface-2)',       fg:'var(--text-2)',   border:'transparent' },
};

const ActionPill = ({ kind, onClick, active }) => {
  const def = ACTION_DEFS[kind], t = TONE[def.tone];
  return (
    <button onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
      borderRadius:6,
      background: active ? t.fg : t.bg,
      color: active ? '#fff' : t.fg,
      border:0, cursor:'pointer',
      fontSize:11.5, fontWeight:600, letterSpacing:'-0.005em',
      transition:'background 120ms, color 120ms',
    }}>
      <Icon name={def.icon} size={11}/> {def.label}
    </button>
  );
};

// ─── Resolved-state summary on a row ──────────────────────────────────
const ResolvedTag = ({ resolution, onUndo }) => {
  const map = {
    merge: { label:`Merged into ${resolution.targetId}`, icon:'arrowRight', tone:'accent' },
    buy:   { label:'Bought to bidder 5013',              icon:'package',    tone:'success' },
    split: { label:`Split from ${resolution.targetId} · ${peso(resolution.amount)}`, icon:'filter', tone:'accent' },
    void:  { label:'Voided · not in report',             icon:'x',          tone:'danger' },
  }[resolution.kind];
  const t = TONE[map.tone];
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap:5,
        padding:'3px 9px', borderRadius:6,
        background:t.bg, color:t.fg, fontSize:11.5, fontWeight:600,
      }}>
        <Icon name={map.icon} size={11}/> {map.label}
      </span>
      <button onClick={onUndo} className="btn btn-ghost" style={{
        height:24, padding:'0 8px', fontSize:11.5,
      }}>Undo</button>
    </div>
  );
};

// ─── Attention row ────────────────────────────────────────────────────
const AttentionRow = ({ r, resolution, onPickAction, onUndo, openKind }) => {
  const isResolved = !!resolution;
  return (
    <tr style={{
      background: isResolved ? 'oklch(0.985 0.015 150)' : 'transparent',
    }}>
      <td className="mono" style={{ fontWeight:600 }}>{r.id}</td>
      <td className="mono" style={{ color:'var(--muted)' }}>{r.ctrl}</td>
      <td>
        <div style={{ fontSize:13, color: isResolved ? 'var(--muted)' : 'var(--text)', textDecoration: isResolved && resolution.kind === 'void' ? 'line-through' : 'none' }}>{r.desc}</div>
        {r.note && !isResolved && (
          <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2, display:'inline-flex', alignItems:'center', gap:4 }}>
            <Icon name="sparkles" size={10}/> {r.note}
          </div>
        )}
      </td>
      <td className="mono" style={{ textAlign:'center' }}>{r.qty}</td>
      <td><Status s={r.status}/></td>
      <td>
        {isResolved ? (
          <ResolvedTag resolution={resolution} onUndo={onUndo}/>
        ) : (
          <div style={{ display:'inline-flex', gap:6 }}>
            <ActionPill kind="merge" active={openKind === 'merge'} onClick={() => onPickAction('merge')}/>
            <ActionPill kind="buy"   active={openKind === 'buy'}   onClick={() => onPickAction('buy')}/>
            <ActionPill kind="split" active={openKind === 'split'} onClick={() => onPickAction('split')}/>
            <ActionPill kind="void"  active={openKind === 'void'}  onClick={() => onPickAction('void')}/>
          </div>
        )}
      </td>
    </tr>
  );
};

// ─── Validation bar ───────────────────────────────────────────────────
const ValidationBar = ({ remaining, total, onPrint, showResolved, setShowResolved }) => {
  const isClear = remaining === 0;
  return (
    <div className="card" style={{
      padding:'12px 16px', marginBottom:14,
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{
          width:32, height:32, borderRadius:8,
          background: isClear ? 'oklch(0.94 0.05 150)' : 'var(--danger-soft)',
          color: isClear ? 'oklch(0.4 0.13 150)' : 'var(--danger)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name={isClear ? 'chevronRight' : 'alert'} size={18}/>
        </div>
        <div>
          <div style={{ fontSize:13.5, fontWeight:600 }}>
            {isClear
              ? `All ${total} items resolved`
              : `${remaining} of ${total} items still need a decision`}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>
            {isClear
              ? 'You can preview the final report.'
              : 'Choose Merge, Buy, Split, or Void for each. You can continue once everything is decided.'}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <label style={{
          display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-2)',
          padding:'4px 10px', borderRadius:6, cursor:'pointer', userSelect:'none',
        }}>
          <input type="checkbox" checked={showResolved} onChange={() => setShowResolved(!showResolved)} style={{ accentColor:'var(--accent)' }}/>
          Show resolved
        </label>
        <button className="btn" onClick={onPrint}>
          <Icon name="download" size={13}/> Print remaining unresolved
        </button>
      </div>
    </div>
  );
};

// ─── SOLD picker pane (Merge + Split) ────────────────────────────────
const SoldPickerPane = ({ kind, sourceItem, onClose, onConfirm }) => {
  const [pickedId, setPickedId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  // For split: per-target overrides
  const [splitAmount, setSplitAmount] = useState(null);

  const candidates = SOLD_CANDIDATES.filter(c =>
    !searchQ ||
    c.id.includes(searchQ) ||
    c.desc.toLowerCase().includes(searchQ.toLowerCase())
  );
  const picked = candidates.find(c => c.id === pickedId);

  // Auto-suggest equal-share for split
  const suggestedSplit = picked && picked.qty > 1
    ? Math.round(picked.totalPrice / (picked.qty + 1))
    : (picked ? picked.unitPrice : 0);
  const amount = splitAmount != null ? splitAmount : suggestedSplit;

  const isSplit = kind === 'split';
  const titleVerb = isSplit ? 'Split from' : 'Merge into';
  const subline = isSplit
    ? 'Pick a SOLD lot with multiple quantity. We\'ll move one unit from it to this UNSOLD item.'
    : 'Pick the SOLD record that this UNSOLD item should be attached to. Strictly 1:1.';

  return (
    <aside style={{
      width: 420, flex:'none', borderLeft:'1px solid var(--border)',
      background:'var(--surface)', display:'flex', flexDirection:'column', height:'100%', minHeight:0,
    }}>
      {/* Pane header */}
      <div style={{
        padding:'14px 18px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10,
      }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            {titleVerb}
          </div>
          <div style={{ fontSize:15, fontWeight:600, marginTop:2, letterSpacing:'-0.005em' }}>
            <span className="mono">{sourceItem.id}</span> · {sourceItem.desc}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4, lineHeight:1.4 }}>{subline}</div>
        </div>
        <button onClick={onClose} className="btn btn-ghost" style={{ height:28, width:28, padding:0, justifyContent:'center' }}>
          <Icon name="x" size={14}/>
        </button>
      </div>

      {/* Search */}
      <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
        <div className="search-input" style={{ height:32 }}>
          <Icon name="search" size={13}/>
          <input
            placeholder={isSplit ? 'Find a multi-qty SOLD lot…' : 'Find a SOLD record (barcode or desc)…'}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
      </div>

      {/* Candidate list */}
      <div style={{ flex:1, overflow:'auto', padding:'8px 10px' }}>
        {candidates.map(c => {
          const eligible = !isSplit || c.qty > 1;
          const isPicked = c.id === pickedId;
          return (
            <button key={c.id}
              disabled={!eligible}
              onClick={() => { setPickedId(c.id); setSplitAmount(null); }}
              style={{
                display:'flex', alignItems:'center', gap:12, width:'100%',
                padding:'10px 12px', borderRadius:8,
                background: isPicked ? 'var(--accent-soft)' : 'transparent',
                border: isPicked ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                opacity: eligible ? 1 : 0.45,
                cursor: eligible ? 'pointer' : 'not-allowed', textAlign:'left',
                marginBottom:4,
              }}>
              <div style={{
                width:18, height:18, borderRadius:'50%', flex:'none',
                border: isPicked ? '5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                background:'#fff',
              }}></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                  <span className="mono" style={{ fontSize:13, fontWeight:600 }}>{c.id}</span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>· {c.desc}</span>
                </div>
                <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>
                  Bidder {c.bidder} · Qty {c.qty} · {peso(c.totalPrice)}
                  {isSplit && c.qty > 1 && <> · Suggest {peso(Math.round(c.totalPrice/(c.qty+1)))} each</>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Split price override + confirm */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'14px 18px', background:'var(--surface-2)' }}>
        {isSplit && picked && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11.5, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>
              Price for this absorbed item
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                display:'flex', alignItems:'center',
                border:'1px solid var(--border)', borderRadius:7, background:'#fff', padding:'0 10px', height:34, flex:1,
              }}>
                <span style={{ color:'var(--muted)', fontSize:13 }}>₱</span>
                <input
                  className="mono"
                  type="number"
                  value={amount}
                  onChange={e => setSplitAmount(Number(e.target.value))}
                  style={{ flex:1, border:0, outline:'none', fontSize:13, padding:'0 8px', background:'transparent', fontFamily:'inherit' }}
                />
                <button onClick={() => setSplitAmount(null)} style={{
                  fontSize:11, color:'var(--muted)', background:'transparent', border:0, cursor:'pointer',
                }}>Reset to auto</button>
              </div>
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4 }}>
              Auto: {peso(suggestedSplit)} (₱{picked.totalPrice.toLocaleString()} ÷ {picked.qty + 1} units after split). This only changes the final report — the original SOLD record stays the same in the database.
            </div>
          </div>
        )}
        <button
          disabled={!picked}
          onClick={() => onConfirm({ kind, targetId: picked?.id, amount })}
          className="btn btn-primary"
          style={{
            width:'100%', justifyContent:'center', height:38, fontWeight:600,
            opacity: picked ? 1 : 0.5,
          }}>
          {isSplit
            ? <>Apply split · move {peso(amount)} from {picked?.id || '—'}</>
            : <>Merge into {picked?.id || 'selected record'}</>}
        </button>
      </div>
    </aside>
  );
};

// ─── Step 2 page ──────────────────────────────────────────────────────
// Variant prop lets us pre-seed pane / resolutions for the artboards.
const Step2Review = ({ variant = 'fresh' }) => {
  const [showResolved, setShowResolved] = useState(true);
  const [open, setOpen] = useState(null); // { rowId, kind }
  const [resolutions, setResolutions] = useState(() => {
    if (variant === 'fresh') return {};
    if (variant === 'split-open') return {
      '25-41-04': { kind:'buy' },
      '25-41-29': { kind:'void' },
    };
    if (variant === 'merge-open') return {};
    if (variant === 'all-clear') return {
      '25-41-04': { kind:'buy' },
      '25-41-07': { kind:'void' },
      '25-41-10': { kind:'merge', targetId:'25-41-302' },
      '25-41-14': { kind:'merge', targetId:'25-41-115' },
      '25-41-17': { kind:'split', targetId:'25-41-118', amount:146 },
      '25-41-22': { kind:'buy' },
      '25-41-29': { kind:'void' },
      '25-41-33': { kind:'merge', targetId:'25-41-302' },
      '25-41-41': { kind:'buy' },
      '25-41-58': { kind:'void' },
      '25-41-66': { kind:'buy' },
      '98-45-414': { kind:'void' },
    };
    return {};
  });
  // Pre-seed open pane for the artboard variants
  React.useEffect(() => {
    if (variant === 'merge-open') setOpen({ rowId:'25-41-14', kind:'merge' });
    if (variant === 'split-open') setOpen({ rowId:'25-41-17', kind:'split' });
  }, [variant]);

  const handlePick = (row, kind) => {
    if (kind === 'merge' || kind === 'split') {
      setOpen({ rowId: row.id, kind });
    } else if (kind === 'buy') {
      setResolutions(r => ({ ...r, [row.id]: { kind:'buy' } }));
    } else if (kind === 'void') {
      setResolutions(r => ({ ...r, [row.id]: { kind:'void' } }));
    }
  };

  const handleConfirm = (rowId, res) => {
    setResolutions(r => ({ ...r, [rowId]: res }));
    setOpen(null);
  };

  const visibleRows = ATTENTION_ITEMS.filter(r => showResolved || !resolutions[r.id]);
  const remaining = ATTENTION_ITEMS.filter(r => !resolutions[r.id]).length;
  const sourceItem = open ? ATTENTION_ITEMS.find(r => r.id === open.rowId) : null;

  return (
    <div style={{ display:'flex', flex:1, minHeight:0 }}>
      {/* Main */}
      <div style={{ flex:1, overflow:'auto', padding:'24px 24px', background:'var(--bg)' }}>
        <div style={{ maxWidth: 1180, margin:'0 auto' }}>
          <StepHeading n={2} title="Resolve items that need attention"
            sub="These are the items that didn't sell cleanly. Pick one action per item — Merge, Buy, Split, or Void — until everything is decided." />

          <ValidationBar
            remaining={remaining}
            total={ATTENTION_ITEMS.length}
            showResolved={showResolved}
            setShowResolved={setShowResolved}
            onPrint={() => alert('Printing remaining unresolved items…')}
          />

          {/* Filter tabs + count */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div className="tabs">
              <button className="active">All to resolve ({ATTENTION_ITEMS.length})</button>
              <button>UNSOLD (11)</button>
              <button>REFUNDED (1)</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className="search-input" style={{ height:32, width:220 }}>
                <Icon name="search" size={13}/>
                <input placeholder="Search items…"/>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding:0 }}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width:110 }}>Barcode</th>
                  <th style={{ width:80 }}>Control</th>
                  <th>Description</th>
                  <th style={{ width:50, textAlign:'center' }}>Qty</th>
                  <th style={{ width:100 }}>Status</th>
                  <th style={{ width:320 }}>What to do</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(r => (
                  <AttentionRow key={r.id}
                    r={r}
                    resolution={resolutions[r.id]}
                    openKind={open && open.rowId === r.id ? open.kind : null}
                    onPickAction={(kind) => handlePick(r, kind)}
                    onUndo={() => {
                      const { [r.id]:_, ...rest } = resolutions;
                      setResolutions(rest);
                    }}
                  />
                ))}
              </tbody>
            </table>
            <div style={{
              padding:'10px 16px', borderTop:'1px solid var(--border)',
              fontSize:12, color:'var(--muted)', display:'flex', justifyContent:'space-between',
            }}>
              <span>Showing {visibleRows.length} of {ATTENTION_ITEMS.length} items</span>
              <span>Your changes save automatically as you work.</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
            {[
              { k:'merge', title:'Merge', desc:'Attach this UNSOLD to a similar SOLD record (1:1).' },
              { k:'buy',   title:'Buy',   desc:'Sell it to the house bidder 5013 at a chosen price.' },
              { k:'split', title:'Split', desc:'Absorb into a multi-qty SOLD lot. Original DB row untouched.' },
              { k:'void',  title:'Void',  desc:'Remove from the final report. Use for missing or broken items.' },
            ].map(b => (
              <div key={b.k} style={{
                padding:'10px 12px', border:'1px solid var(--border)', borderRadius:8, background:'var(--surface)',
              }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <ActionPill kind={b.k} onClick={() => {}}/>
                </div>
                <div style={{ fontSize:11.5, color:'var(--muted)', lineHeight:1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adaptive: pane only for Merge / Split */}
      {open && sourceItem && (open.kind === 'merge' || open.kind === 'split') && (
        <SoldPickerPane
          kind={open.kind}
          sourceItem={sourceItem}
          onClose={() => setOpen(null)}
          onConfirm={(res) => handleConfirm(open.rowId, res)}
        />
      )}
    </div>
  );
};

window.Step2Review = Step2Review;
