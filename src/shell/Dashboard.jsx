// ============================================================
//  DASHBOARD.JSX — shown after a successful login (App.jsx
//  renders this whenever student !== null and no lesson is
//  active). Reads COURSE_CONFIG.modules to draw the full course
//  map, and uses `completedUnits` (passed down from App.jsx,
//  fetched via api.js → Code.gs "getProgress") to decide which
//  units show as done vs not-yet-done. Navigation is free — any
//  unit can be opened in any order, regardless of completion.
//
//  Shell file — never changes between courses. Adding/removing
//  units is done entirely in config/course.config.js; this file
//  just renders whatever that config contains.
// ============================================================

import COURSE_CONFIG from '../../config/course.config.js';

// Same dark palette as Login.jsx, repeated locally rather than
// imported from a shared file — keeps each shell component
// copy-paste portable with zero cross-file coupling.
const C = {
  bg: '#0D1117', surface: '#161B22', card: '#1C2333', border: '#30363D',
  blue: '#58A6FF', green: '#3FB950', muted: '#8B949E', text: '#E6EDF3', soft: '#C9D1D9',
};
// One accent color per module, cycling if there are more than 6
// modules — gives each module a distinct visual identity.
const MODULE_COLORS = ['#58A6FF','#BC8CFF','#3FB950','#E3B341','#F0883E','#39D5C4'];

// Props (all supplied by App.jsx):
//   student        — { rollNo, name, batch } from login
//   completedUnits — array of unitId strings already finished
//   onSelectUnit   — callback(unitId) to open a lesson
export default function Dashboard({ student, completedUnits, onSelectUnit }) {
  // Flatten modules→units to compute overall course completion %.
  const totalUnits = COURSE_CONFIG.modules.reduce((acc, m) => acc + m.units.length, 0);
  const pct = Math.round((completedUnits.length / totalUnits) * 100);

  // Free navigation: every unit is always clickable, in any order.
  // We no longer gate access on "previous unit completed" — students
  // can jump straight to whatever they want to read next. We still
  // track completedUnits (passed down from App.jsx) purely to show
  // progress (✅ done vs ▶️ not-yet-done) and the overall % bar;
  // there's no locked state left to compute.

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header bar: course branding (left) + logged-in student (right) */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>SRET E-Learning</div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>{COURSE_CONFIG.courseTitle}</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>{COURSE_CONFIG.subtitle}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: C.text, fontWeight: 600 }}>{student.name}</div>
          <div style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace' }}>{student.rollNo}</div>
        </div>
      </div>

      {/* Thin overall-progress bar directly under the header */}
      <div style={{ height: 4, background: C.border }}>
        <div style={{ height: '100%', width: `${pct}%`, background: C.green, transition: 'width 0.6s' }} />
      </div>

      {/* "X of Y units completed" summary card */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 32 }}>🎯</div>
          <div>
            <div style={{ color: C.text, fontWeight: 600 }}>{completedUnits.length} of {totalUnits} units completed</div>
            <div style={{ color: C.muted, fontSize: 13 }}>{pct}% through the course · Keep going!</div>
          </div>
        </div>
      </div>

      {/* Module → unit grid. Each module is a labeled section;
          every unit is always a clickable tile — the only visual
          distinction now is done (✅, green) vs not-yet-done (▶️). */}
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {COURSE_CONFIG.modules.map((mod, mIdx) => (
          <div key={mod.moduleId}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{mod.icon}</span>
              <h2 style={{ color: MODULE_COLORS[mIdx % MODULE_COLORS.length], fontSize: 16, fontWeight: 700, margin: 0 }}>{mod.moduleTitle}</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {mod.units.map((unit, uIdx) => {
                const done = completedUnits.includes(unit.unitId);
                const accent = MODULE_COLORS[mIdx % MODULE_COLORS.length];
                return (
                  <div key={unit.unitId} onClick={() => onSelectUnit(unit.unitId)}
                    style={{ background: done ? '#0D2818' : C.card, border: `1px solid ${done ? C.green : accent + '55'}`, borderRadius: 10, padding: '14px 18px', minWidth: 200, maxWidth: 260, cursor: 'pointer', transition: 'transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: C.muted, fontSize: 11, fontFamily: 'monospace' }}>{unit.unitId.replace('_', '.')}</span>
                      <span style={{ fontSize: 14 }}>{done ? '✅' : '▶️'}</span>
                    </div>
                    <div style={{ color: done ? C.green : C.text, fontSize: 14, fontWeight: 600, marginTop: 6 }}>{unit.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
