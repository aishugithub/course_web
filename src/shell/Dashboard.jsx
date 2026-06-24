// ============================================================
//  DASHBOARD.JSX — shown after a successful login (App.jsx
//  renders this whenever student !== null and no lesson is
//  active). Reads COURSE_CONFIG.modules to draw the full course
//  map, and uses `completedUnits` (passed down from App.jsx,
//  fetched via api.js → Code.gs "getProgress") to decide what's
//  done, what's unlocked, and what's still locked.
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

  // Linear unlock rule: the very first unit of the course is
  // always open; every other unit unlocks only once the unit
  // immediately before it (in config order, across module
  // boundaries) has been completed. This enforces a strict
  // learning sequence without needing extra state anywhere else —
  // it's derived purely from COURSE_CONFIG + completedUnits.
  function isUnlocked(moduleIdx, unitIdx) {
    if (moduleIdx === 0 && unitIdx === 0) return true;
    let prevUnitId;
    if (unitIdx > 0) { prevUnitId = COURSE_CONFIG.modules[moduleIdx].units[unitIdx - 1].unitId; }
    else { const pm = COURSE_CONFIG.modules[moduleIdx - 1]; prevUnitId = pm.units[pm.units.length - 1].unitId; }
    return completedUnits.includes(prevUnitId);
  }

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
          each unit is a clickable tile whose look depends on
          done / unlocked / locked state computed above. */}
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
                const unlocked = isUnlocked(mIdx, uIdx);
                const accent = MODULE_COLORS[mIdx % MODULE_COLORS.length];
                return (
                  <div key={unit.unitId} onClick={() => unlocked && onSelectUnit(unit.unitId)}
                    style={{ background: done ? '#0D2818' : unlocked ? C.card : C.surface, border: `1px solid ${done ? C.green : unlocked ? accent + '55' : C.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 200, maxWidth: 260, cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.45, transition: 'transform 0.15s' }}
                    onMouseEnter={e => { if (unlocked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: C.muted, fontSize: 11, fontFamily: 'monospace' }}>{unit.unitId.replace('_', '.')}</span>
                      <span style={{ fontSize: 14 }}>{done ? '✅' : unlocked ? '▶️' : '🔒'}</span>
                    </div>
                    <div style={{ color: done ? C.green : unlocked ? C.text : C.muted, fontSize: 14, fontWeight: 600, marginTop: 6 }}>{unit.title}</div>
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
