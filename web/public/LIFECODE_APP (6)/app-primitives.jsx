/* LIFECODE — primitives (light mode, brand colors) */

const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 1.5 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home": return <svg {...props}><path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case "track": return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3"/></svg>;
    case "chat": return <svg {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>;
    case "you": return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "send": return <svg {...props}><path d="M5 12l14-7-7 14-2-5-5-2z"/></svg>;
    case "spark": return <svg {...props}><path d="M12 2l1.8 6.5L20 10l-6.2 1.5L12 18l-1.8-6.5L4 10l6.2-1.5z"/></svg>;
    case "mic": return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case "arrow": return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    default: return null;
  }
};

const StatusBar = ({ time = "8:24", dark = false }) => {
  const c = dark ? "#fff" : "#0d0d0f";
  return (
    <div className="lc-status" style={{color: c}}>
      <span>{time}</span>
      <div className="icons">
        <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="6" width="2.5" height="4" rx="0.5" fill={c}/><rect x="4.5" y="4" width="2.5" height="6" rx="0.5" fill={c}/><rect x="9" y="2" width="2.5" height="8" rx="0.5" fill={c}/><rect x="13.5" y="0" width="2.5" height="10" rx="0.5" fill={c}/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke={c} strokeOpacity="0.5" fill="none"/><rect x="2" y="2" width="17" height="7" rx="1.2" fill={c}/><rect x="22" y="3.5" width="2" height="4" rx="0.5" fill={c} fillOpacity="0.5"/></svg>
      </div>
    </div>
  );
};

const TabBar = ({ active = "home", onChange = () => {} }) => {
  const tabs = [
    { id: "home", label: "Today" },
    { id: "track", label: "Track" },
    { id: "chat", label: "Ask" },
    { id: "you", label: "You" },
  ];
  return (
    <div className="lc-tabs">
      {tabs.map(t => (
        <div key={t.id} className={`tab ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
          <Icon name={t.id} size={20} />
          <span className="lbl">{t.label}</span>
        </div>
      ))}
    </div>
  );
};

const Phone = ({ children, time = "8:24", showTabs = true, activeTab = "home", setTab = () => {}, lockscreen = false }) => (
  <div className="lc-device">
    {!lockscreen && <div className="lc-notch"></div>}
    <StatusBar time={time}/>
    <div className="lc-screen" style={lockscreen ? {inset:0} : null}>
      {children}
    </div>
    {showTabs && <TabBar active={activeTab} onChange={setTab}/>}
  </div>
);

/* ─── MultiRing — Whoop-style concentric circles with brand gradient ─── */
const MultiRing = ({ size = 240, items = [], stroke = 8 }) => {
  // items: [{label, pct, color}]
  const cx = size / 2, cy = size / 2;
  const innerR = 38;
  const ringW = (size / 2 - innerR - 4) / items.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {items.map((it, i) => (
          <linearGradient key={i} id={`mring-${i}-${size}`} x1="0" y1="0" x2="1" y2="1">
            {it.gradient ? it.gradient.map((g, j) => (
              <stop key={j} offset={`${(j / (it.gradient.length - 1)) * 100}%`} stopColor={g}/>
            )) : <>
              <stop offset="0%" stopColor={it.color}/>
              <stop offset="100%" stopColor={it.color}/>
            </>}
          </linearGradient>
        ))}
      </defs>
      {items.map((it, i) => {
        const r = innerR + ringW * (i + 0.5);
        const C = 2 * Math.PI * r;
        const dash = (it.pct / 100) * C;
        const w = ringW - 3;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(13,13,15,0.06)" strokeWidth={w} />
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke={`url(#mring-${i}-${size})`}
              strokeWidth={w}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                transition: "stroke-dasharray 1.6s cubic-bezier(.2,.8,.2,1)"
              }}/>
          </g>
        );
      })}
    </svg>
  );
};

/* single arc ring with optional gradient */
const Ring = ({ size = 220, stroke = 8, pct = 60, gradient = null, color = "#0d0d0f", id = "ring" }) => {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;
  const gid = `${id}-${size}-${stroke}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gradient && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            {gradient.map((g, j) => (
              <stop key={j} offset={`${(j / (gradient.length - 1)) * 100}%`} stopColor={g}/>
            ))}
          </linearGradient>
        </defs>
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(13,13,15,0.08)" strokeWidth={stroke}/>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={gradient ? `url(#${gid})` : color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition: "stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1)"}}/>
    </svg>
  );
};

const Bar = ({ pct, kind = "ink" }) => (
  <div className={`bar ${kind === "ink" ? "" : kind}`}><i style={{width: `${pct}%`}}></i></div>
);

const Nut = ({ idx, name, sub, pct, kind = "morning" }) => (
  <div className="nut">
    <span className="idx">{String(idx).padStart(2, "0")}</span>
    <span className="name">{name}</span>
    <span className={`pct ${kind}`}>{pct}%</span>
    <span className="sub">{sub}</span>
    <Bar pct={pct} kind={kind}/>
  </div>
);

Object.assign(window, { Icon, StatusBar, TabBar, Phone, MultiRing, Ring, Bar, Nut });
