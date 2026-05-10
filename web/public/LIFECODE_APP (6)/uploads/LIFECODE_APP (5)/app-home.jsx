/* LIFECODE — Today (Home): main rings + scan + 2 packs (Morning + Recovery) */

const HomeScreen = () => {
  const [animate, setAnimate] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanned, setScanned] = React.useState(null);

  React.useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const overall = 78;
  const morningPct = 88;
  const recoveryPct = 0;

  const triggerScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned({
        meal: "Chicken bowl · spinach · brown rice",
        gains: [
          { n: "Iron", v: "+18%", k: "essentials" },
          { n: "Vit C", v: "+9%", k: "morning" },
          { n: "K+", v: "+12%", k: "essentials" },
        ]
      });
    }, 1800);
  };

  return (
    <div className="pb-bottom">
      <div className="greet">
        <div className="day">Wed · April 26</div>
        <h1>Good morning,<br/><span className="ink-morning">Mark.</span></h1>
      </div>

      <div className="px-24 col gap-14">
        {/* Big multi-ring summary */}
        <div className="card hero-card">
          <div className="row between center" style={{marginBottom: 14}}>
            <span className="eyebrow">Nutrient load</span>
            <span className="chip">+6 vs yesterday</span>
          </div>
          <div className="ring-stage" style={{margin: "4px 0 14px"}}>
            <MultiRing size={210} items={[
              {label: "Morning",    pct: morningPct, gradient: ["#c43d1f", "#e26a1f", "#f5a623"]},
              {label: "Essentials", pct: 62,         gradient: ["#0d0d0f", "#3a3a3c"]},
              {label: "Recovery",   pct: recoveryPct,gradient: ["#2a2a8e", "#4a3aa8", "#7a8fd9"]},
            ]}/>
            <div className="ring-center">
              <div className="ring-center__num">{overall}<em>%</em></div>
              <div className="ring-center__lbl">covered</div>
            </div>
          </div>

          <div className="row" style={{padding: "0 4px", justifyContent: "space-between"}}>
            <div className="legend-cell">
              <span className="dot dot--morning"></span>
              <span className="legend-cell__lbl">Morning</span>
              <span className="legend-cell__pct ink-morning">{morningPct}%</span>
            </div>
            <div className="legend-cell">
              <span className="dot dot--diet"></span>
              <span className="legend-cell__lbl">Essentials</span>
              <span className="legend-cell__pct">62%</span>
            </div>
            <div className="legend-cell">
              <span className="dot dot--recovery"></span>
              <span className="legend-cell__lbl">Recovery</span>
              <span className="legend-cell__pct ink-recovery">{recoveryPct}%</span>
            </div>
          </div>
        </div>

        {/* Camera scan CTA */}
        <button className={`scan-cta ${scanning ? "scan-cta--active" : ""}`} onClick={triggerScan}>
          <div className="scan-cta__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h3l2-3h8l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div className="scan-cta__body">
            <div className="scan-cta__title">{scanning ? "Analyzing meal…" : "Scan a meal"}</div>
            <div className="scan-cta__sub">{scanning ? "Recognizing micronutrients" : "AI reads the photo · updates your rings"}</div>
          </div>
          <span className="scan-cta__arrow">{scanning ? "···" : "+"}</span>
        </button>

        {scanned && (
          <div className="card scan-result fade-in">
            <div className="row between center" style={{marginBottom: 8}}>
              <span className="eyebrow">Just logged</span>
              <span className="muted-sm">just now</span>
            </div>
            <div className="scan-result__meal">{scanned.meal}</div>
            <div className="scan-result__chips">
              {scanned.gains.map((g, i) => (
                <span key={i} className={`gain-chip gain-chip--${g.k}`}>
                  <b>{g.v}</b> {g.n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Two packs only — Morning + Recovery */}
        <div className="prod morning">
          <div className="row between center">
            <span className="prod__time done">Taken at 7:30</span>
            <span className="eyebrow morning">Morning</span>
          </div>
          <div className="prod__title" style={{marginTop: 12}}>Morning Pack <em>—</em></div>
          <div className="prod__sub">Activate. Focus. Perform.</div>
          <div style={{marginTop: 16}}><Bar pct={100} kind="morning thick"/></div>
        </div>

        <div className="prod recovery">
          <div className="row between center">
            <span className="prod__time">Tonight · 20:00</span>
            <span className="eyebrow recovery">Recovery</span>
          </div>
          <div className="prod__title" style={{marginTop: 12}}>Recovery Pack <em>—</em></div>
          <div className="prod__sub">Recover. Restore. Reset.</div>
          <div style={{marginTop: 16}}><Bar pct={0} kind="recovery thick"/></div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreen });
