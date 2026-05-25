// Step 3 — Container Tax: full page

const StepTaxPage = ({ variant = 'fresh' }) => {
  const [selected, setSelected] = useState(() => {
    if (variant === 'fresh' || variant === 'unmet') return new Set(TAX_DESCRIPTIONS);
    return new Set(TAX_DESCRIPTIONS);
  });
  const [query, setQuery] = useState('');
  const [tableQuery, setTableQuery] = useState('');
  const [newPrices, setNewPrices] = useState(() => {
    if (variant === 'partial') return {
      '1402': 6400,   // WOODEN CABINET 8400→6400 (deduct 2000)
      '1404': 7900,   // GLASS TABLE 9900→7900 (deduct 2000)
      '1421': 2800,   // MARBLE IN BOX DI 3800→2800 (deduct 1000)
    };
    if (variant === 'met') return {
      '1402': 0,      // WOODEN CABINET 8400→0 (deduct 8400)
      '1404': 0,      // GLASS TABLE 9900→0 (deduct 9900)
      '1411': 0,      // BICYCLE 4800→0 (deduct 4800)
      '1421': 1800,   // MARBLE 3800→1800 (deduct 2000)
    };
    return {};
  });

  // Filter table items by selected descriptions + search
  const visibleItems = TAX_ITEMS.filter(it =>
    selected.has(it.desc) &&
    (!tableQuery ||
      it.ctrl.includes(tableQuery) ||
      it.desc.toLowerCase().includes(tableQuery.toLowerCase()) ||
      String(it.price).includes(tableQuery))
  );

  const totalDeducted = TAX_ITEMS.reduce((sum, it) => {
    const np = newPrices[it.ctrl];
    if (np == null || np >= it.price) return sum;
    return sum + (it.price - np);
  }, 0);

  // Item price total is the sum across all items in the container (regardless of filter)
  const itemPriceTotal = 1284600; // matches Setup KPI

  const hasInvalid = TAX_ITEMS.some(it => {
    const np = newPrices[it.ctrl];
    return np != null && np > it.price;
  });
  const targetRemaining = Math.max(0, TAX_TARGET - BIDDER_0740_TOTAL - totalDeducted);

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, background:'var(--surface)' }}>
      <DescriptionFilter
        selected={selected}
        setSelected={setSelected}
        query={query}
        setQuery={setQuery}
      />

      {/* Center — heading + price table */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'var(--bg)' }}>
        <div style={{ padding:'24px 28px 14px' }}>
          <StepHeading n={3} title="Apply the container tax deduction"
            sub={`We need to reduce ${peso(TAX_TARGET)} from this container for tax purposes. Pick descriptions on the left, then lower prices below until the target is met.`} />
        </div>

        <div style={{
          padding:'0 28px 14px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
        }}>
          <div className="search-input" style={{ height:32, flex:1, maxWidth: 360 }}>
            <Icon name="search" size={13}/>
            <input
              placeholder="Search control, description, or price…"
              value={tableQuery}
              onChange={e => setTableQuery(e.target.value)}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:12, color:'var(--muted)' }}>
              {visibleItems.length} of {TAX_ITEMS.length} items shown
              {selected.size < TAX_DESCRIPTIONS.length && <> · {selected.size} descriptions selected</>}
            </span>
            <button className="btn" disabled={Object.keys(newPrices).length === 0}
              onClick={() => setNewPrices({})}
              style={{ opacity: Object.keys(newPrices).length ? 1 : 0.5 }}>
              <Icon name="x" size={12}/> Clear deductions
            </button>
          </div>
        </div>

        {/* Price table */}
        <div style={{ flex:1, overflow:'auto', padding:'0 28px 24px' }}>
          <div className="card" style={{ padding:0 }}>
            <table className="data" style={{ width:'100%' }}>
              <thead>
                <tr>
                  <th style={{ width:80 }}>Ctrl</th>
                  <th>Description</th>
                  <th style={{ width:80 }}>Bidder</th>
                  <th style={{ width:90, textAlign:'right' }}>Price</th>
                  <th style={{ width:130, textAlign:'right' }}>New Price</th>
                  <th style={{ width:100, textAlign:'right' }}>Deducted</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      textAlign:'center', padding:'36px 0',
                      color:'var(--muted)', fontStyle:'italic', fontSize:13,
                    }}>
                      {selected.size === 0
                        ? 'Pick at least one description in the sidebar to see items here.'
                        : 'No items match your search.'}
                    </td>
                  </tr>
                ) : visibleItems.map(it => (
                  <PriceRow
                    key={it.ctrl}
                    item={it}
                    newPrice={newPrices[it.ctrl]}
                    onChange={(v) => {
                      const next = { ...newPrices };
                      if (v >= it.price) delete next[it.ctrl];
                      else next[it.ctrl] = v;
                      setNewPrices(next);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {hasInvalid && (
            <div style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 14px', marginTop:12,
              background:'var(--danger-soft)', color:'var(--danger)', borderRadius:8, fontSize:12.5, fontWeight:500,
            }}>
              <Icon name="alert" size={14}/> New price can't be higher than the original. Lower or reset the highlighted rows.
            </div>
          )}
        </div>
      </div>

      {/* Right — totals */}
      <TotalsPanel
        deducted={totalDeducted}
        itemPriceTotal={itemPriceTotal}
        hasHouseBidder={true}
      />
    </div>
  );
};

window.StepTaxPage = StepTaxPage;
