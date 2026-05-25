// Step 3 — sheets 2..5

// ─── SHEET 2 — FINAL COMPUTATION ─────────────────────────────────────
// Mirrors the JP charges-breakdown sheet. Bilingual labels.
const BiLabel = ({ en, jp }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
    <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text)' }}>{en}</span>
    <span style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'Hiragino Sans, sans-serif' }}>{jp}</span>
  </div>
);

const TERMS = [
  ['ASIS(ASI)', 'DAMAGE',           'Damaged · broken · dirty · imitations'],
  ['ASSTD',     'ASSORTED',         'Mixed assortment'],
  ['CONDEMN',   'JUNK',             'Junk items'],
  ['DI',        'DISPLAY ITEMS',    'Showcase / display items'],
  ['CG',        'CLOTHES & GARMENTS','Used clothing'],
  ['PW',        'PLASTICWARE',      'Plastic products'],
  ['CW',        'COOKINGWARE',      'Pans, woks, pots'],
  ['KW',        'KITCHEN WARE',     'Dishware, ceramics'],
  ['EI',        'ELECTRONIC ITEMS', 'Electronics'],
  ['GW',        'GLASSWARE',        'Glass products'],
  ['WI',        'WOOD ITEMS',       'Wood products'],
];

const FinalComputationSheet = () => (
  <>
    <SheetTitle title="Final Computation" sub="支払明細 · payment breakdown for the supplier" />

    {/* Container header */}
    <div style={{ padding:'4px 24px 14px' }}>
      <div style={{ textAlign:'center', fontSize:13, fontWeight:700, padding:'8px 0', borderBottom:'2px solid var(--text)', marginBottom:10 }}>
        SUMITOMO CO., LTD.
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div style={{ fontSize:13 }}>
          <span className="mono" style={{ fontWeight:600 }}>25-41</span>
          <span style={{ color:'var(--muted)', marginLeft:8, fontSize:11.5 }}>本目コンテナ · Container reference</span>
        </div>
        <div style={{ fontSize:11.5, color:'var(--muted)' }}>単位ペソ · Unit: PHP</div>
      </div>

      {/* Charges table */}
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5, marginBottom:18 }}>
        <thead>
          <tr style={{ background:'var(--surface-2)' }}>
            <th style={chCell}><BiLabel en="Arrival date"      jp="入荷日"/></th>
            <th style={chCell}><BiLabel en="Payment due"       jp="支払予定日"/></th>
            <th style={chCell}><BiLabel en="Item sales"        jp="支払予定日"/></th>
            <th style={chRed}><BiLabel  en="Import charges"    jp="輸入諸費用"/></th>
            <th style={chRed}><BiLabel  en="Extra charge"      jp="EXTRA CHARGE"/></th>
            <th style={chRed}><BiLabel  en="Sales commission 15%" jp="販売手数料15%"/></th>
            <th style={chRed}><BiLabel  en="Sorting fee"       jp="仕分け費用"/></th>
            <th style={chCell}><BiLabel en="Payment amount"    jp="支払い金額"/></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono" style={cell}>05/12/26</td>
            <td className="mono" style={cell}>06/15/26</td>
            <td className="mono numRed" style={{ ...cell, textAlign:'right', fontWeight:600 }}>1,284,600</td>
            <td className="mono numRed" style={{ ...cell, textAlign:'right', color:'#c0392b' }}>182,400</td>
            <td className="mono" style={{ ...cell, textAlign:'right', color:'#c0392b' }}>0</td>
            <td className="mono" style={{ ...cell, textAlign:'right', color:'#c0392b' }}>192,690</td>
            <td className="mono" style={{ ...cell, textAlign:'right', color:'#c0392b' }}>64,230</td>
            <td className="mono" style={{ ...cell, textAlign:'right', fontWeight:700 }}>845,280</td>
          </tr>
        </tbody>
      </table>

      {/* Transfer info block */}
      <div style={{
        display:'grid', gridTemplateColumns:'1.1fr 0.8fr 1.4fr', gap:0,
        border:'1px solid var(--border-strong)', borderRadius:6, overflow:'hidden', marginBottom:18, fontSize:12.5,
      }}>
        {/* Left labels column */}
        <div>
          {[
            ['SENDER',         'ATC JAPAN AUCTION PRODUCT TRADING'],
            ['SUPPLIER',       'Sumitomo Co., Ltd.'],
            ['BARCODE',        '25-41'],
            ['NET SALES',      '845,280.00'],
            ['BANK RECEIVER',  'ATCGROUP, LLC'],
            ['BANK ACCOUNT',   '547-11819088'],
            ['BANK ADDRESS',   '25-1 Matsugaecho, Minami-ku, Sagamihara-shi'],
          ].map(([k,v], i) => (
            <div key={k} style={{
              display:'grid', gridTemplateColumns:'130px 1fr', padding:'7px 12px',
              borderTop: i ? '1px solid var(--border)' : 0, fontSize:12,
            }}>
              <span style={{ fontWeight:600, color:'var(--text-2)' }}>{k}</span>
              <span style={{ color:'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Charges middle column */}
        <div style={{ borderLeft:'1px solid var(--border-strong)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:600, textAlign:'center' }}>CHARGES</div>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:600, padding:'14px 0' }}>1.2%</div>
          <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:600, textAlign:'center', borderTop:'1px solid var(--border-strong)' }}>TOTAL CHARGE</div>
          <div className="mono" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#c0392b', fontWeight:600, padding:'10px 0' }}>
            Php 10,143.36
          </div>
        </div>
        {/* Transfer column */}
        <div style={{ borderLeft:'1px solid var(--border-strong)' }}>
          <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:700, textAlign:'center' }}>TOTAL TO BE TRANSFERRED THRU BANK</div>
          <div className="mono" style={{ padding:'12px 0', fontSize:20, fontWeight:700, textAlign:'center' }}>835,136.64</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'1px solid var(--border-strong)' }}>
            <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:600, textAlign:'center', borderRight:'1px solid var(--border)' }}>
              <BiLabel en="JPY RATE" jp="割合"/>
            </div>
            <div style={{ padding:'8px 12px', background:'var(--surface-2)', fontWeight:600, textAlign:'center' }}>
              <BiLabel en="TOTAL IN YEN" jp="合計円"/>
            </div>
            <div className="mono" style={{ padding:'12px 0', textAlign:'center', fontSize:14, fontWeight:600, borderRight:'1px solid var(--border)', borderTop:'1px solid var(--border)' }}>0.3925</div>
            <div className="mono" style={{ padding:'12px 0', textAlign:'center', fontSize:14, fontWeight:700, color:'#c0392b', borderTop:'1px solid var(--border)' }}>2,127,873</div>
          </div>
        </div>
      </div>

      {/* JP footer note */}
      <div style={{ fontSize:11.5, color:'var(--text-2)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18, lineHeight:1.5 }}>
        <div>
          <div style={{ fontWeight:600, color:'var(--text)' }}>備考 · Remarks</div>
          <div>日本円送金の場合、送金手数料 1.2% がかかります。</div>
          <div style={{ color:'var(--muted)' }}>JPY remittance incurs a 1.2% transfer fee.</div>
          <div style={{ marginTop:6 }}>0000と0000のナンバーは、オークション不成立のため ATC JAPAN AUCTION の買取分です</div>
          <div style={{ color:'var(--muted)' }}>Numbers 0000/0000 are ATC Japan Auction's buy-in for unsold items.</div>
        </div>
        <div>
          <div style={{ fontWeight:600, color:'var(--text)' }}>佐々木 アイリン</div>
          <div style={{ color:'var(--muted)' }}>Sasaki Eileen · approver</div>
        </div>
      </div>

      {/* Terminology table */}
      <div>
        <div style={{ fontSize:12.5, fontWeight:600, marginBottom:6 }}>売り上げレポート用語説明 · Sales report terminology</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
          <thead>
            <tr style={{ background:'#cfe2f3' }}>
              <th style={chCell}>表記 · Code</th>
              <th style={chCell}>英文説明 · English</th>
              <th style={chCell}>日本語説明 · Japanese</th>
            </tr>
          </thead>
          <tbody>
            {TERMS.map(([code, en, jp]) => (
              <tr key={code}>
                <td className="mono" style={{ ...cell, fontWeight:600 }}>{code}</td>
                <td style={cell}>{en}</td>
                <td style={cell}>{jp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const cell = { padding:'6px 10px', border:'1px solid var(--border)' };
const chCell = { ...cell, background:'var(--surface-2)', fontWeight:600, textAlign:'left' };
const chRed = { ...chCell, background:'#fde8e8', color:'#9b1c1c' };

// ─── SHEET 3 — ENCODE ────────────────────────────────────────────────
const ENCODE_PREVIEW = [
  ['25-41-001','1402','WOODEN CABINET','SOLD'],
  ['25-41-002','1403','OFFICE CHAIR','SOLD'],
  ['25-41-003','1404','GLASS TABLE','SOLD'],
  ['25-41-004','1405','TV STAND','SOLD'],     // was UNSOLD, bought to 5013
  ['25-41-005','1406','BAG (LOT OF 12)','SOLD'],
  ['25-41-006','1407','MARBLE SIDE TABLE','SOLD'],
  ['25-41-007','1408','CERAMIC LAMP','VOID'],
  ['25-41-008','1409','STEEL SHELF','SOLD'],
  ['25-41-009','1410','KITCHEN SET (5 PCS)','SOLD'],
  ['25-41-010','1411','PLASTIC BIN','SOLD'],  // merged → 25-41-302
  ['25-41-011','1412','BICYCLE','SOLD'],
  ['25-41-014','1415','OFFICE CHAIR','SOLD'], // merged → 25-41-115
  ['25-41-017','1418','BAG (SPLIT)','SOLD'],
  ['25-41-029','1429','GLASS VASE','VOID'],
];

const StatusInk = ({ s }) => {
  const map = {
    SOLD: { fg:'#0c2c4a' },
    UNSOLD: { fg:'#c0392b', bold:true },
    VOID: { fg:'var(--muted)', italic:true },
  }[s] || { fg:'var(--text)' };
  return <span style={{ color: map.fg, fontWeight: map.bold ? 700 : 500, fontStyle: map.italic ? 'italic' : 'normal', textDecoration: map.italic ? 'line-through' : 'none' }}>{s}</span>;
};

const EncodeSheet = () => (
  <>
    <SheetTitle title="Encode" sub="Item-by-item sold status used by encoders" />
    <div style={{ padding:'4px 24px 18px', maxWidth: 720 }}>
      <table className="data" style={{ width:'100%' }}>
        <thead>
          <tr style={{ background:'#cfe2f3' }}>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a' }}>Barcode</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:80 }}>CTRL #</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a' }}>Description</th>
            <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:130, textAlign:'center' }}>SOLD / UNSOLD</th>
          </tr>
        </thead>
        <tbody>
          {ENCODE_PREVIEW.map(([bc, ctrl, desc, s]) => (
            <tr key={bc}>
              <td className="mono">{bc}</td>
              <td className="mono" style={{ color:'var(--muted)' }}>{ctrl}</td>
              <td>{desc}</td>
              <td style={{ textAlign:'center' }}><StatusInk s={s}/></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:11.5, color:'var(--muted)', padding:'10px 0 0', textAlign:'center', fontStyle:'italic' }}>
        … showing 14 of 142 rows
      </div>
    </div>
  </>
);

// ─── SHEET 4 — UNSOLD (summary with big stat boxes) ─────────────────
const StatBox = ({ label, value, bg, fg='#fff' }) => (
  <div style={{
    border:'1px solid var(--border-strong)', borderRadius:6, overflow:'hidden',
    background:'#fff', minWidth: 280,
  }}>
    <div style={{ background:bg, color:fg, padding:'8px 14px', fontSize:12, fontWeight:700, letterSpacing:'0.06em', textAlign:'center' }}>
      {label}
    </div>
    <div className="mono" style={{ padding:'24px 16px', textAlign:'center', fontSize:38, fontWeight:700, letterSpacing:'-0.02em' }}>
      {value}
    </div>
  </div>
);

const UnsoldSheet = () => (
  <>
    <SheetTitle title="Unsold summary" sub="Stat-box overview at the time of finalization" />
    <div style={{ padding:'4px 24px 24px' }}>
      <div style={{ textAlign:'center', padding:'10px 0 20px', borderBottom:'2px solid var(--text)', marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.01em' }}>SUMITOMO CO., LTD.</div>
        <div className="mono" style={{ fontSize:14, fontWeight:600, marginTop:6 }}>25-41</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(260px, 1fr) minmax(280px, 1.2fr)', gap:24, alignItems:'flex-start' }}>
        {/* Left column — empty barcode column simulating the template */}
        <div>
          <table className="data" style={{ width:'100%' }}>
            <thead>
              <tr style={{ background:'#cfe2f3' }}>
                <th style={{ background:'#cfe2f3', color:'#0c2c4a' }}>BARCODE</th>
                <th style={{ background:'#cfe2f3', color:'#0c2c4a', width:80 }}>CONTROL</th>
                <th style={{ background:'#cfe2f3', color:'#0c2c4a' }}>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={3} style={{ textAlign:'center', color:'var(--muted)', padding:'24px 0', fontStyle:'italic' }}>
                No items remaining as unsold after resolution
              </td></tr>
            </tbody>
          </table>
        </div>
        {/* Right column — stat boxes */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <StatBox label="UNSOLD ITEMS"  value="0"             bg="#dc2626"/>
          <StatBox label="SOLD ITEMS"    value="139"           bg="#fde047" fg="#1f2937"/>
          <StatBox label="TOTAL SALE"    value="PHP 1,284,600" bg="#3b82f6"/>
        </div>
      </div>
    </div>
  </>
);

// ─── SHEET 5 — BILL ─────────────────────────────────────────────────
const BillSheet = () => (
  <>
    <SheetTitle title="Bill" sub="Invoice the supplier will receive" />
    <div style={{ padding:'4px 32px 24px', maxWidth: 720 }}>
      <div style={{
        background:'#e6e0f8', textAlign:'center', padding:'14px 0', fontSize:30, fontWeight:700,
        letterSpacing:'0.04em', border:'1px solid var(--border-strong)', marginBottom:14,
      }}>BILL</div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600 }}>ATC JAPAN AUCTION PRODUCT TRADING</div>
        </div>
        <div style={{ fontSize:12.5 }}><span style={{ borderBottom:'1px solid var(--text)' }}>Date:</span> <span className="mono">May 23, 2026</span></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:24, marginBottom:18 }}>
        {/* Total */}
        <div>
          <div style={{ display:'flex', gap:14, alignItems:'baseline' }}>
            <span style={{ fontSize:11.5, fontWeight:700 }}>TOTAL</span>
            <span className="mono" style={{ fontSize:14, fontWeight:600 }}>PHP 1,284,600.00</span>
          </div>
        </div>
        {/* Supplier */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Sumitomo Co., Ltd.</div>
          <div style={{ fontSize:11, color:'var(--text-2)' }}>9583-1 Tana, Chuo-ku, Sagamihara-shi</div>
          <div style={{ fontSize:11, color:'var(--text-2)' }}>Kanagawa-ken, 252-0244, Japan</div>
          <div style={{ fontSize:11, color:'var(--text-2)' }}>TEL +81-(0)42-7 11-4057</div>
        </div>
      </div>

      <div style={{ fontSize:11.5, marginBottom:8 }}>Please transfer the payment to below account.</div>

      <table style={{ width:'60%', marginBottom:18, borderCollapse:'collapse', fontSize:11.5 }}>
        <tbody>
          {[
            ['Account name:', 'Millennium Co., Ltd.'],
            ['Bank name:',    'MIZUHO BANK, LTD.'],
            ['Bank address:', '25-1 Matsugaecho, Minami-ku, Sagamihara-shi, Kanagawa-ken, 252-0313, Japan'],
            ['Branch:',       'Odakyu Sagamihara branch'],
            ['Account No:',   '547-1181988'],
            ['Swift code:',   'MHCBJPJT'],
          ].map(([k,v]) => (
            <tr key={k}>
              <td style={{ ...cell, width:130 }}>{k}</td>
              <td style={cell}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr>
            <th style={{ ...cell, background:'var(--surface-2)', textAlign:'center' }}>Description</th>
            <th style={{ ...cell, background:'var(--surface-2)', textAlign:'center', width:160 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cell}>
              <div>Second Hand Goods Container 25-41 【Sumitomo Co., Ltd.】 May 16 2026</div>
              <div className="mono" style={{ marginTop:4 }}>BL NO. NSSLAKNMN26Q0029</div>
            </td>
            <td className="mono" style={{ ...cell, textAlign:'right' }}>1,284,600.00</td>
          </tr>
          {Array.from({ length: 4 }).map((_,i) => (
            <tr key={i}>
              <td style={{ ...cell, height:22 }}></td>
              <td style={{ ...cell, height:22 }}></td>
            </tr>
          ))}
          <tr>
            <td style={{ ...cell, textAlign:'right', fontWeight:700 }}>TOTAL</td>
            <td className="mono" style={{ ...cell, textAlign:'right', fontWeight:700 }}>PHP 1,284,600.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  </>
);

// ─── Step 3 page ────────────────────────────────────────────────────
const Step3Preview = ({ initialSheet = 'items' }) => {
  const [active, setActive] = useState(initialSheet);
  const ActiveSheet = {
    items:  ItemsSheet,
    final:  FinalComputationSheet,
    encode: EncodeSheet,
    unsold: UnsoldSheet,
    bill:   BillSheet,
  }[active];

  return (
    <Page maxWidth={1180}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, marginBottom:18 }}>
        <div>
          <div style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>Step 5 of 6</div>
          <h1 style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.015em', margin:'0 0 6px' }}>
            Preview the final report
          </h1>
          <p style={{ fontSize:14, color:'var(--muted)', margin:0, maxWidth: 640 }}>
            This is a simulation of what the supplier will receive. Click any tab below to see how that sheet looks. Download the preview file to inspect it in Excel before finalizing.
          </p>
        </div>
        <button className="btn btn-primary" style={{ height:38, padding:'0 16px', fontWeight:600 }}>
          <Icon name="download" size={14}/> Download preview .xlsx
        </button>
      </div>

      <WorkbookFrame active={active} setActive={setActive}>
        <ActiveSheet/>
      </WorkbookFrame>

      <div style={{ display:'flex', gap:10, padding:'14px 16px', borderRadius:10, background:'var(--accent-soft)', alignItems:'flex-start', marginTop:14 }}>
        <Icon name="sparkles" size={16} style={{ color:'var(--accent)', flex:'none', marginTop:2 }}/>
        <div style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.5 }}>
          The downloaded file matches this preview exactly. Once you finalize in the next step, the same file is sent to <strong>Sumitomo</strong> and saved under Reports → May 2026.
        </div>
      </div>
    </Page>
  );
};

window.FinalComputationSheet = FinalComputationSheet;
window.EncodeSheet = EncodeSheet;
window.UnsoldSheet = UnsoldSheet;
window.BillSheet = BillSheet;
window.Step3Preview = Step3Preview;
