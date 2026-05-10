/* LIFECODE — Weekly workout calendar (You screen) */

const WORKOUT_TYPES = [
  { id: "strength", label: "Strength", sub: "Lift · push · pull" },
  { id: "cardio",   label: "Cardio",   sub: "Run · bike · row" },
  { id: "mobility", label: "Mobility", sub: "Yoga · stretch"   },
  { id: "class",    label: "Class",    sub: "HIIT · group"     },
];
const TYPE_BY_ID = Object.fromEntries(WORKOUT_TYPES.map(t => [t.id, t]));

const WEEK_LETTERS = ["M","T","W","T","F","S","S"];
const FULL_DAY     = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmtKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseKey = (key) => {
  const [y,m,d] = key.split("-").map(Number);
  return new Date(y, m-1, d);
};
const startOfWeek = (date) => {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow);
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
};

const TODAY = new Date(2026, 4, 13); // Wed · May 13 · 2026

const typeAccent = (t) => ({
  strength: "#e26a1f",
  cardio:   "#4a3aa8",
  mobility: "#0d0d0f",
  class:    "#7a8fd9",
}[t] || "#0d0d0f");

const SEED_WORKOUTS = {
  [fmtKey(new Date(2026,4,11))]: [
    { id: "w1", type: "strength", name: "Upper · push", time: "07:00", duration: 60 },
  ],
  [fmtKey(new Date(2026,4,12))]: [
    { id: "w2", type: "cardio",   name: "Zone 2 run",    time: "06:30", duration: 45 },
    { id: "w3", type: "mobility", name: "Evening flow",  time: "21:00", duration: 20 },
  ],
  [fmtKey(new Date(2026,4,13))]: [
    { id: "w4", type: "strength", name: "Lower · power", time: "07:00", duration: 75 },
  ],
  [fmtKey(new Date(2026,4,15))]: [
    { id: "w5", type: "class",    name: "HIIT class",    time: "18:30", duration: 50 },
  ],
  [fmtKey(new Date(2026,4,17))]: [
    { id: "w6", type: "cardio",   name: "Long run",      time: "08:00", duration: 90 },
  ],
};

const WorkoutRow = ({ workout, onClick }) => {
  const t = TYPE_BY_ID[workout.type];
  return (
    <div className="wk-item" onClick={onClick}>
      <span className={`wk-item__accent ${workout.type}`}></span>
      <div className="wk-item__timecol">
        <div className="wk-item__time">{workout.time}</div>
        <div className="wk-item__time-sub">{workout.duration} min</div>
      </div>
      <div className="wk-item__main">
        <div className="wk-item__name">{workout.name}</div>
        <div className={`wk-item__type ${workout.type}`}>{t.label}</div>
      </div>
      <span className="wk-item__chev">›</span>
    </div>
  );
};

const WorkoutSheet = ({ date, initial, onClose, onSave, onDelete }) => {
  const [type, setType]         = React.useState(initial?.type     || "strength");
  const [name, setName]         = React.useState(initial?.name     || "");
  const [time, setTime]         = React.useState(initial?.time     || "07:00");
  const [duration, setDuration] = React.useState(initial?.duration || 60);

  const [h, m] = time.split(":").map(Number);
  const setHour = (delta) => {
    const nh = (h + delta + 24) % 24;
    setTime(`${String(nh).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  };
  const setMin = (delta) => {
    let total = h*60 + m + delta*5;
    total = (total + 24*60) % (24*60);
    const nh = Math.floor(total/60), nm = total % 60;
    setTime(`${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`);
  };

  const dateObj = parseKey(date);
  const placeholders = {
    strength: "e.g. Lower · power",
    cardio:   "e.g. Zone 2 run",
    mobility: "e.g. Evening flow",
    class:    "e.g. HIIT class",
  };

  const submit = () => {
    onSave({
      id: initial?.id,
      type, time, duration,
      name: (name || "").trim() || TYPE_BY_ID[type].label,
    });
  };

  return (
    <React.Fragment>
      <div className="wk-backdrop" onClick={onClose}></div>
      <div className="wk-sheet" onClick={(e)=>e.stopPropagation()}>
        <div className="wk-sheet__handle"></div>

        <div className="wk-sheet__head">
          <div>
            <div className="wk-sheet__title">
              {initial ? <>Edit <em>workout</em></> : <>New <em>workout</em></>}
            </div>
            <div className="wk-sheet__sub">
              {FULL_DAY[dateObj.getDay()]} · {MONTHS_SHORT[dateObj.getMonth()]} {dateObj.getDate()}
            </div>
          </div>
          <button className="wk-sheet__close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
          </button>
        </div>

        <div className="wk-field">
          <div className="wk-field__lbl">Type</div>
          <div className="wk-types">
            {WORKOUT_TYPES.map(t => (
              <button key={t.id} className={`wk-type ${type===t.id?"on":""}`} onClick={()=>setType(t.id)}>
                <span className={`wk-type__sw ${t.id}`}></span>
                <div className="wk-type__body">
                  <div className="wk-type__lbl">{t.label}</div>
                  <div className="wk-type__sub">{t.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="wk-field">
          <div className="wk-field__lbl">Name</div>
          <input
            className="wk-name"
            value={name}
            placeholder={placeholders[type]}
            onChange={(e)=>setName(e.target.value)}
          />
        </div>

        <div className="wk-row2">
          <div className="wk-field" style={{flex:1}}>
            <div className="wk-field__lbl">Start time</div>
            <div className="wk-time">
              <div className="wk-time__seg">
                <button className="wk-time__btn" onClick={()=>setHour(-1)} aria-label="Hour down">−</button>
                <span className="wk-time__val">{String(h).padStart(2,"0")}</span>
                <button className="wk-time__btn" onClick={()=>setHour(1)} aria-label="Hour up">+</button>
              </div>
              <span className="wk-time__sep">:</span>
              <div className="wk-time__seg">
                <button className="wk-time__btn" onClick={()=>setMin(-1)} aria-label="Min down">−</button>
                <span className="wk-time__val">{String(m).padStart(2,"0")}</span>
                <button className="wk-time__btn" onClick={()=>setMin(1)} aria-label="Min up">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="wk-field">
          <div className="wk-field__lbl">Duration</div>
          <div className="wk-dur">
            {[20,30,45,60,75,90,120].map(d => (
              <button key={d} className={duration===d?"on":""} onClick={()=>setDuration(d)}>{d}m</button>
            ))}
          </div>
        </div>

        <div className="wk-actions">
          {initial && (
            <button className="wk-del" onClick={()=>onDelete(initial.id)}>Delete</button>
          )}
          <button className="wk-save" onClick={submit}>
            {initial ? "Save changes" : "Add to calendar"}
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

const WorkoutCalendar = () => {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(TODAY));
  const [selected,  setSelected]  = React.useState(fmtKey(TODAY));
  const [workouts,  setWorkouts]  = React.useState(SEED_WORKOUTS);
  const [editing,   setEditing]   = React.useState(null);

  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekTotal = days.reduce((s,d) => s + (workouts[fmtKey(d)] || []).reduce((a,w)=>a+w.duration, 0), 0);
  const weekCount = days.reduce((s,d) => s + (workouts[fmtKey(d)] || []).length, 0);

  const navWeek = (delta) => {
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() + delta*7);
    setWeekStart(ws);
  };

  const selectedDate = parseKey(selected);
  const selectedWorkouts = workouts[selected] || [];
  const selectedDuration = selectedWorkouts.reduce((a,w)=>a+w.duration, 0);

  const saveWorkout = (workout) => {
    setWorkouts(prev => {
      const key = editing.date;
      const list = prev[key] ? [...prev[key]] : [];
      if (workout.id) {
        const i = list.findIndex(w => w.id === workout.id);
        if (i >= 0) list[i] = workout; else list.push(workout);
      } else {
        list.push({ ...workout, id: "w" + Date.now() });
      }
      list.sort((a,b) => a.time.localeCompare(b.time));
      return { ...prev, [key]: list };
    });
    setEditing(null);
  };

  const deleteWorkout = (id) => {
    setWorkouts(prev => {
      const key = editing.date;
      const list = (prev[key] || []).filter(w => w.id !== id);
      return { ...prev, [key]: list };
    });
    setEditing(null);
  };

  const weekHours = Math.round(weekTotal/60 * 10) / 10;
  const monthLbl = `${MONTHS_FULL[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  const todayKey = fmtKey(TODAY);

  return (
    <div className="card wk-card">
      <div className="wk-card__title-row">
        <div>
          <div className="wk-card__title">Training <em>week</em></div>
          <div className="wk-card__meta">
            {monthLbl} · {weekCount} workouts · {weekHours}h
          </div>
        </div>
        <div className="wk-card__nav">
          <button onClick={()=>navWeek(-1)} aria-label="Previous week">‹</button>
          <button onClick={()=>navWeek(1)}  aria-label="Next week">›</button>
        </div>
      </div>

      <div className="wk-week-wrap">
        <div className="wk-week">
          {days.map((d, i) => {
            const key = fmtKey(d);
            const isSel = key === selected;
            const isToday = key === todayKey;
            const list = workouts[key] || [];
            return (
              <button
                key={key}
                className={`wk-day ${isSel?"selected":""} ${isToday?"today":""}`}
                onClick={()=>setSelected(key)}
              >
                <span className="wk-day__lbl">{WEEK_LETTERS[i]}</span>
                <span className="wk-day__num">{d.getDate()}</span>
                <span className="wk-day__dots">
                  {list.length === 0 ? (
                    <i className="wk-day__dot wk-day__dot--empty"></i>
                  ) : list.slice(0,3).map((w,j) => (
                    <i key={j} className="wk-day__dot" style={{background: isSel ? "rgba(255,255,255,0.8)" : typeAccent(w.type)}}></i>
                  ))}
                </span>
                {isToday && !isSel && <span className="wk-day__today-mark"></span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="wk-day-detail">
        <div className="wk-header">
          <div className="wk-header__date">
            {FULL_DAY[selectedDate.getDay()]} <em>· {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}</em>
          </div>
          <div className="wk-header__meta">
            {selectedWorkouts.length
              ? `${selectedWorkouts.length} · ${selectedDuration} min`
              : "Rest day"}
          </div>
        </div>

        <div className="wk-list">
          {selectedWorkouts.map(w => (
            <WorkoutRow key={w.id} workout={w} onClick={()=>setEditing({date: selected, workout: w})}/>
          ))}
          <button className="wk-add" onClick={()=>setEditing({date: selected})}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add workout
          </button>
        </div>
      </div>

      {editing && typeof document !== "undefined" && document.querySelector(".lc-device") &&
        ReactDOM.createPortal(
          <WorkoutSheet
            date={editing.date}
            initial={editing.workout}
            onClose={()=>setEditing(null)}
            onSave={saveWorkout}
            onDelete={deleteWorkout}
          />,
          document.querySelector(".lc-device")
        )
      }
    </div>
  );
};

Object.assign(window, { WorkoutCalendar, WorkoutRow, WorkoutSheet });
