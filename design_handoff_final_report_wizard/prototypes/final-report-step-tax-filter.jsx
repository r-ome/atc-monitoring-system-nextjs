// Step 3 — Container Tax view.

// ─── Description filter sidebar ─────────────────────────────────────
const DescriptionFilter = ({ selected, setSelected, query, setQuery }) => {
  const filtered = TAX_DESCRIPTIONS.filter(d =>
    !query || d.toLowerCase().includes(query.toLowerCase())
  );
  const allSelected = selected.size === TAX_DESCRIPTIONS.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(TAX_DESCRIPTIONS));
  const toggle = (d) => {
    const next = new Set(selected);
    if (next.has(d)) next.delete(d); else next.add(d);
    setSelected(next);
  };
  return (
    <aside style={{
      width: 260, flex:'none', display:'flex', flexDirection:'column',
      borderRight:'1px solid var(--border)', background:'var(--surface)', minHeight:0,
    }}>
      <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>
          Filter by description
        </div>
        <div className="search-input" style={{ height:32 }}>
          <Icon name="search" size={13}/>
          <input
            placeholder="Search descriptions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>
      <label style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'10px 16px', borderBottom:'1px solid var(--border)',
        cursor:'pointer', fontSize:12.5, fontWeight:600,
      }}>
        <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor:'var(--accent)' }}/>
        <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
        <span style={{ marginLeft:'auto', color:'var(--muted)', fontWeight:500, fontSize:11.5 }}>
          {selected.size}/{TAX_DESCRIPTIONS.length}
        </span>
      </label>
      <div style={{ flex:1, overflow:'auto', padding:'4px 0' }}>
        {filtered.map(d => (
          <label key={d} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'7px 16px', cursor:'pointer', fontSize:12.5,
            background: selected.has(d) ? 'var(--accent-soft)' : 'transparent',
            color: selected.has(d) ? 'var(--text)' : 'var(--text-2)',
          }}>
            <input type="checkbox" checked={selected.has(d)} onChange={() => toggle(d)} style={{ accentColor:'var(--accent)', flex:'none' }}/>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding:'24px 16px', textAlign:'center', fontSize:12, color:'var(--muted)' }}>
            No descriptions match.
          </div>
        )}
      </div>
    </aside>
  );
};

window.DescriptionFilter = DescriptionFilter;
