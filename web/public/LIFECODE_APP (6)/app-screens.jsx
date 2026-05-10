/* LIFECODE — Track / Chat / You / Notifications / Lock / Login */

const MORNING_INGREDIENTS = [
  { name: "Vitamin A",   form: "Retinyl Palmitate",          amount: "800 μg" },
  { name: "Vitamin C",   form: "Calcium Ascorbate",          amount: "200 mg" },
  { name: "Vitamin D3",  form: "Cholecalciferol (Vegan)",    amount: "25 μg"  },
  { name: "Vitamin E",   form: "d-alpha-Tocopheryl",         amount: "12 mg"  },
  { name: "Vitamin K2",  form: "Menaquinone-7 (MK-7)",       amount: "50 μg"  },
  { name: "Vitamin B12", form: "Methylcobalamin",            amount: "100 μg" },
  { name: "B Complex",   form: "Methylated Premix",          amount: "100% RDA" },
  { name: "Zinc",        form: "Zinc Bisglycinate",          amount: "10 mg"  },
  { name: "Copper",      form: "Copper Bisglycinate",        amount: "0.5 mg" },
  { name: "Magnesium",   form: "Magnesium Citrate",          amount: "350 mg" },
  { name: "Selenium",    form: "Selenomethionine",           amount: "50 μg"  },
];

const ESSENTIALS_INGREDIENTS = [
  { name: "Iron",          form: "Bisglycinate",          amount: "18 mg"  },
  { name: "Calcium",       form: "Citrate-Malate",         amount: "500 mg" },
  { name: "Omega-3",       form: "EPA + DHA · Algal",      amount: "1 000 mg" },
  { name: "Potassium",     form: "Citrate",                amount: "400 mg" },
  { name: "Iodine",        form: "Potassium Iodide",       amount: "150 μg" },
  { name: "CoQ10",         form: "Ubiquinol",              amount: "100 mg" },
  { name: "Choline",       form: "Bitartrate",             amount: "275 mg" },
  { name: "Vitamin B6",    form: "P-5-P (active)",         amount: "5 mg"   },
  { name: "Folate",        form: "Methyl-Folate (5-MTHF)", amount: "400 μg" },
];

const RECOVERY_INGREDIENTS = [
  { name: "Maltodextrin (Low DE)",  form: "Carbohydrate Matrix",        amount: "20 000 mg" },
  { name: "EAA Complex",            form: "Full Spectrum (9 EAAs)",     amount: "7 000 mg"  },
  { name: "Creatine Monohydrate",   form: "Micronized Clinical",        amount: "5 000 mg"  },
  { name: "L-Glutamine",            form: "Free-Form",                  amount: "3 000 mg"  },
  { name: "HMB",                    form: "Calcium Salt",               amount: "1 500 mg" },
  { name: "Tart Cherry",            form: "Anthocyanin Extract",        amount: "500 mg"    },
  { name: "Himalayan Salt",         form: "84 Trace Minerals",          amount: "300 mg"    },
  { name: "Magnesium Bisglycinate", form: "Chelated",                   amount: "150 mg"    },
  { name: "L-Theanine",             form: "Free-Form",                  amount: "100 mg"    },
  { name: "AstraGin®",              form: "Astragalus + Panax",         amount: "50 mg"     },
];

/* DNA Helix logo — minimalist colored (orange + violet) */
const DNAHelix = ({ size = 36 }) => {
  const uid = React.useId ? React.useId() : Math.random().toString(36).slice(2);
  const ga = `helixA-${uid}`;
  const gb = `helixB-${uid}`;
  return (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <defs>
      <linearGradient id={ga} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c43d1f"/>
        <stop offset="100%" stopColor="#f5a623"/>
      </linearGradient>
      <linearGradient id={gb} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2a2a8e"/>
        <stop offset="100%" stopColor="#7a8fd9"/>
      </linearGradient>
    </defs>
    <line x1="20" y1="11" x2="36" y2="11" stroke="#c43d1f" strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
    <line x1="15" y1="20" x2="41" y2="20" stroke="#4a3aa8" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="13" y1="28" x2="43" y2="28" stroke="#e26a1f" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="15" y1="36" x2="41" y2="36" stroke="#2a2a8e" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="20" y1="45" x2="36" y2="45" stroke="#c43d1f" strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
    <path d="M14 8 C 14 22, 42 22, 42 28 C 42 34, 14 34, 14 48" stroke={`url(#${ga})`} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    <path d="M42 8 C 42 22, 14 22, 14 28 C 14 34, 42 34, 42 48" stroke={`url(#${gb})`} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
  </svg>
  );
};

const IngredientRow = ({ idx, item, kind, pct }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="ing-row" onClick={() => setOpen(!open)}>
      <div className="ing-row__head">
        <span className="ing-row__idx">{String(idx).padStart(2, "0")}</span>
        <div className="ing-row__body">
          <div className="ing-row__name">{item.name}</div>
          <div className="ing-row__form">{item.form} · {item.amount}</div>
        </div>
        <span className={`ing-row__pct ${kind}`}>{pct}%</span>
        <span className="ing-row__chev" style={{transform: open ? "rotate(180deg)" : "none"}}>›</span>
      </div>
      <div className="ing-row__bar"><Bar pct={pct} kind={kind}/></div>
    </div>
  );
};

const TrackScreen = () => {
  const [cat, setCat] = React.useState("morning");
  const list = cat === "morning" ? MORNING_INGREDIENTS
            : cat === "essentials" ? ESSENTIALS_INGREDIENTS
            : RECOVERY_INGREDIENTS;
  const baseMap = {
    morning:    [88, 70, 80, 93, 80, 75, 100, 70, 65, 42, 60],
    essentials: [62, 71, 48, 80, 58, 44, 55, 68, 73],
    recovery:   [40, 30, 45, 55, 35, 25, 70, 42, 30, 40],
  };
  const basePct = baseMap[cat];
  const overall = Math.round(basePct.reduce((a,b)=>a+b,0) / basePct.length);
  const gradMap = {
    morning:    ["#c43d1f","#e26a1f","#f5a623"],
    essentials: ["#0d0d0f","#3a3a3c"],
    recovery:   ["#2a2a8e","#4a3aa8","#7a8fd9"],
  };
  const labelMap = { morning: "Morning", essentials: "Essentials", recovery: "Recovery" };
  return (
    <div className="pb-bottom">
      <div className="greet">
        <div className="day">Today's protocol</div>
        <h1>Track</h1>
      </div>
      <div className="px-24">
        <div className="seg seg--3">
          <button className={`${cat==="morning"?"on morning":""}`} onClick={()=>setCat("morning")}>Morning</button>
          <button className={`${cat==="essentials"?"on":""}`} onClick={()=>setCat("essentials")}>Essentials</button>
          <button className={`${cat==="recovery"?"on recovery":""}`} onClick={()=>setCat("recovery")}>Recovery</button>
        </div>
      </div>
      <div className="px-24" style={{marginTop: 22, marginBottom: 18}}>
        <div className="ring-stage">
          <Ring size={170} stroke={6} pct={overall}
            gradient={gradMap[cat]}
            id={`ring-${cat}`}/>
          <div className="ring-center">
            <div className={`big ${cat}`}>{overall}<em>%</em></div>
            <div className="eyebrow" style={{marginTop: 6}}>{labelMap[cat]}</div>
          </div>
        </div>
      </div>
      <div className="px-24">
        <div className="ing-head">
          <span className="eyebrow">{cat === "morning" ? "Vitamins & Minerals" : cat === "essentials" ? "Daily essentials" : "Recovery compounds"}</span>
          <span className="muted-sm">{list.length} compounds</span>
        </div>
        <div className="ing-list">
          {list.map((it, i) => (
            <IngredientRow key={i} idx={i+1} item={it} kind={cat} pct={basePct[i] || 0}/>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatScreen = () => {
  const [val, setVal] = React.useState("");
  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column"}}>
      <div className="greet">
        <div className="day">Assistant</div>
        <h1>Ask <em>anything.</em></h1>
      </div>
      <div className="px-24 grow">
        <div className="chat-stream">
          <div className="bubble ai fade-in">Good morning, Mark. <b className="ink-morning">Morning Pack</b> taken ✓</div>
          <div className="bubble me fade-in delay-1">had 2 eggs and whole-grain bread</div>
          <div className="bubble ai fade-in delay-2">Logged. <b>+12g</b> protein · <b>+1.2μg</b> B12</div>
          <div className="bubble ai fade-in delay-3"><b className="ink-recovery">Magnesium</b> still at <b>42%</b>. Try spinach at lunch.</div>
        </div>
      </div>
      <div className="composer">
        <Icon name="mic" size={18} color="rgba(13,13,15,0.55)"/>
        <input placeholder="Ask or dictate…" value={val} onChange={(e)=>setVal(e.target.value)}/>
        <button><Icon name="send" size={15} color="#fff"/></button>
      </div>
    </div>
  );
};

/* ─── YOU — premium profile with subscription card ─── */
const YouScreen = () => {
  const heights = [72, 80, 68, 84, 76, 82, 79];
  const days = ["M","T","W","T","F","S","S"];
  return (
    <div className="pb-bottom">
      <div className="greet">
        <div className="row between center">
          <div style={{flex:"1 1 auto", minWidth:0}}>
            <div className="day">Profile</div>
            <h1 style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>Mark</h1>
          </div>
          <div className="avatar" style={{flex:"0 0 auto"}}>M</div>
        </div>
      </div>

      <div className="px-24 col gap-14">

        {/* Subscription card — premium hero shape */}
        <div className="sub-card">
          <div className="sub-card__bg"></div>
          <div className="sub-card__top">
            <div className="sub-card__brand">
              <DNAHelix size={28}/>
            </div>
            <span className="sub-card__pill">ACTIVE</span>
          </div>
          <div className="sub-card__lbl">Current subscription</div>
          <div className="sub-card__plan">Athlete <em>Pro</em></div>
          <div className="sub-card__price">€89<span>/month</span></div>
          <div className="sub-card__incl">
            <span>+</span> Morning Pack
            <span style={{marginLeft:14}}>+</span> Recovery Pack
            <span style={{marginLeft:14}}>+</span> AI tracking
          </div>
          <div className="sub-card__foot">
            <div>
              <div className="sub-card__foot-lbl">Next delivery</div>
              <div className="sub-card__foot-val">May 12 · 2026</div>
            </div>
            <div>
              <div className="sub-card__foot-lbl">Member since</div>
              <div className="sub-card__foot-val">Jan 2026</div>
            </div>
            <button className="sub-card__manage">Manage ›</button>
          </div>
        </div>

        {/* Weekly workout calendar */}
        <WorkoutCalendar/>

        {/* 7-day score */}
        <div className="card">
          <div className="row between center" style={{marginBottom: 14}}>
            <span className="eyebrow">7-day average</span>
            <span className="chip">+4 pts</span>
          </div>
          <div style={{
            fontFamily:"Instrument Serif", fontStyle:"italic", fontSize:64,
            color: "var(--morning-2)", marginBottom: 4, lineHeight: 1
          }}>79<span style={{fontSize:24, color:"var(--ink-3)", marginLeft:4, fontStyle:"normal"}}>/100</span></div>
          <div className="weekbars" style={{marginTop: 18}}>
            {heights.map((h, i) => (
              <div key={i} className="b" style={{
                height: `${h}%`,
                background: i===2 ? "rgba(13,13,15,0.18)" : (i % 2 ? "var(--recovery-2)" : "var(--morning-2)")
              }}></div>
            ))}
          </div>
          <div className="lbl-row">
            {days.map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-cell">
            <div className="stat-cell__num ink-morning">12</div>
            <div className="stat-cell__lbl">Day streak</div>
          </div>
          <div className="stat-cell">
            <div className="stat-cell__num ink-recovery">94</div>
            <div className="stat-cell__lbl">Recoveries logged</div>
          </div>
          <div className="stat-cell">
            <div className="stat-cell__num">86</div>
            <div className="stat-cell__lbl">Meals scanned</div>
          </div>
        </div>

        {/* Account list */}
        <div className="card" style={{padding: "0 22px"}}>
          <div className="list-row">
            <div className="grow">
              <div className="lbl">Athlete profile</div>
              <div className="sub">Sport · weight · training load</div>
            </div>
            <span className="arrow">›</span>
          </div>
          <div className="list-row">
            <div className="grow">
              <div className="lbl">Notifications</div>
              <div className="sub">Morning · Recovery · AI tips</div>
            </div>
            <span className="arrow">›</span>
          </div>
          <div className="list-row">
            <div className="grow">
              <div className="lbl">Connect blood test</div>
              <div className="sub">Personalize doses from biomarkers</div>
            </div>
            <span className="arrow">›</span>
          </div>
          <div className="list-row">
            <div className="grow">
              <div className="lbl">Privacy &amp; data</div>
              <div className="sub">Your numbers, your call</div>
            </div>
            <span className="arrow">›</span>
          </div>
          <div className="list-row">
            <div className="grow">
              <div className="lbl ink-recovery">Sign out</div>
            </div>
            <span className="arrow">›</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── NOTIFICATIONS (in-app screen, white BG, DNA helix logo) ─── */
const NotifCard = ({ time, kind, title, body, pct }) => (
  <div className={`notif-card ${kind || ""}`}>
    <div className="notif-card__head">
      <div className="notif-card__brand">
        <DNAHelix size={22}/>
      </div>
      <span className="notif-card__time">{time}</span>
    </div>
    <div className="notif-card__title">{title}</div>
    <div className="notif-card__sub">{body}</div>
    {typeof pct === "number" && (
      <div className="notif-card__bar">
        <div className="notif-card__row">
          <span>progress</span><span>{pct}%</span>
        </div>
        <div className="bar"><i style={{
          width: `${pct}%`,
          background: kind === "morning" ? "var(--morning-2)"
                   : kind === "recovery" ? "var(--recovery-2)"
                   : "var(--ink)"
        }}></i></div>
      </div>
    )}
  </div>
);

const NotificationsScreen = () => (
  <div className="pb-bottom notif-screen">
    <div className="greet">
      <div className="day">Today</div>
      <h1>Notifications</h1>
    </div>
    <div className="px-24 col gap-12">
      <NotifCard
        time="now" kind="morning"
        title={<>Time for <em className="ink-morning">Morning Pack</em></>}
        body="Activate. Focus. Perform." pct={100}/>
      <NotifCard
        time="11:00"
        title={<>An <em className="ink-morning">orange</em>?</>}
        body="Vitamin C is at 70%. Close the gap." pct={70}/>
      <NotifCard
        time="13:30" kind="diet"
        title={<>Pre-training fuel</>}
        body="500 ml water · pinch of salt · 1 banana."/>
      <NotifCard
        time="16:45"
        title={<>Iron still low.</>}
        body="Try lentils or red meat tonight." pct={62}/>
      <NotifCard
        time="20:00" kind="recovery"
        title={<>Time for <em className="ink-recovery">Recovery Pack</em></>}
        body="Recover. Restore. Reset." pct={0}/>
      <NotifCard
        time="22:00" kind="recovery"
        title={<>Magnesium <em>at 42%.</em></>}
        body="A handful of almonds will close the day." pct={42}/>
    </div>
  </div>
);

/* ─── LOCK ─── */
const LockNotif = ({ time, title, body, kind }) => {
  const [tapped, setTapped] = React.useState(false);
  const [pct, setPct] = React.useState(0);
  const tap = () => {
    setTapped(true); setPct(0);
    requestAnimationFrame(()=> setTimeout(()=> setPct(100), 60));
  };
  return (
    <div className="lc-notif" onClick={tap}>
      <div className="lc-notif__head">
        <div className="lc-notif__brand-row">
          <DNAHelix size={16}/>
        </div>
        <span>{time}</span>
      </div>
      <div className="lc-notif__title">{title}</div>
      <div className="lc-notif__sub">{body}</div>
      {tapped && (
        <div className="lc-notif__progress">
          <div className="lc-notif__row"><span>opening</span><span>{pct}%</span></div>
          <div className="bar"><i style={{
            width: `${pct}%`,
            background: kind === "morning" ? "var(--morning-2)" : kind === "recovery" ? "var(--recovery-2)" : "var(--ink)"
          }}></i></div>
        </div>
      )}
    </div>
  );
};

const Lockscreen = () => (
  <div className="lock">
    <div className="lock__time">
      <div className="day">Wed, April 26</div>
      <div className="clock">7:30</div>
    </div>
    <div className="lock__notifs">
      <LockNotif time="now" kind="morning"
        title={<>Time for <em className="ink-morning">Morning Pack</em></>}
        body="Activate. Focus. Perform."/>
      <LockNotif time="11:00"
        title={<>An <em className="ink-morning">orange</em>?</>}
        body="Vitamin C is at 70%. Close the gap."/>
      <LockNotif time="20:00" kind="recovery"
        title={<>Time for <em className="ink-recovery">Recovery Pack</em></>}
        body="Recover. Restore. Reset."/>
    </div>
  </div>
);

/* ─── LOGIN ─── */
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = React.useState("mark@lifecode.app");
  const [pw, setPw] = React.useState("");
  return (
    <div className="login">
      <div className="login__top">
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <DNAHelix size={32}/>
        </div>
        <div className="login__tag"><em>Code your life.</em></div>
      </div>
      <div className="login__hero">
        <h1>Welcome<br/><em>back.</em></h1>
        <div className="login__sub">Sign in to continue your protocol.</div>
      </div>
      <div className="login__form">
        <label className="login__lbl">Email</label>
        <input className="login__input" value={email} onChange={e=>setEmail(e.target.value)}/>
        <label className="login__lbl" style={{marginTop:14}}>Password</label>
        <input className="login__input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••"/>
        <button className="login__cta" onClick={onLogin}>Sign in →</button>
        <div className="login__alt"><span>New here?</span><a onClick={onLogin}>Create account</a></div>
      </div>
      <div className="login__foot">Face ID · Touch ID supported</div>
    </div>
  );
};

Object.assign(window, { TrackScreen, ChatScreen, YouScreen, NotificationsScreen, Lockscreen, LoginScreen, DNAHelix });
