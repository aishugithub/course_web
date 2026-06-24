// ============================================================
//  APP.JSX — the traffic controller of the whole app. This is
//  the single place that decides WHICH screen is on display:
//    no student logged in       → <Login />
//    student logged in, no unit → <Dashboard />
//    a unit is open             → the lesson component itself
//
//  It also owns all cross-cutting state (who's logged in, which
//  units are done, which lesson is currently loaded) and is the
//  only file that wires Login + Dashboard + lessons + api.js
//  together. Shell file — never changes between courses.
// ============================================================

import { useState, Suspense } from 'react';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import { getProgress, saveProgress } from './api.js';
import COURSE_CONFIG from '../../config/course.config.js';

const C = { bg: '#0D1117', muted: '#8B949E' };

// Small full-screen spinner shown during async waits (fetching
// progress after login, lazy-loading a lesson's JS bundle).
function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚡</div>
      <div style={{ color: C.muted, fontSize: 15 }}>{message}</div>
    </div>
  );
}

// import.meta.glob is a Vite build-time feature: it scans the
// ../lessons/ folder at build time and creates a map of
// { './Unit1_1.jsx': () => import('./Unit1_1.jsx'), ... } for
// EVERY .jsx file found there — without listing them by hand.
// This is *why* adding a lesson only needs "drop the file in" —
// Vite automatically picks it up next time the app builds/runs.
// Each value is a lazy loader function (code-split per lesson),
// so the browser only downloads a lesson's JS when it's opened.
const LESSONS = import.meta.glob('../lessons/*.jsx');

export default function App() {
  const [student, setStudent]                 = useState(null);   // null = not logged in
  const [completedUnits, setCompletedUnits]   = useState([]);      // unitIds finished, from getProgress()
  const [activeUnit, setActiveUnit]           = useState(null);    // unitId currently open, or null
  const [LessonComponent, setLessonComponent] = useState(null);    // the actual React component for activeUnit
  const [loadingLesson, setLoadingLesson]     = useState(false);   // true while a lesson's JS is being fetched

  // Called by Login.jsx on success. Stores the student, then asks
  // the backend (via api.js → Code.gs) which units this student
  // has already completed, so Dashboard can show the right state.
  async function handleLogin(studentData) {
    setStudent(studentData);
    const completed = await getProgress(studentData.rollNo, COURSE_CONFIG.courseId);
    setCompletedUnits(completed);
  }

  // Called by Dashboard.jsx when the student clicks an unlocked
  // unit tile. Looks up the matching lazy loader in LESSONS,
  // awaits it (triggers the dynamic import/code-split chunk),
  // and stores the resulting component so it can be rendered below.
  async function handleSelectUnit(unitId) {
    setLoadingLesson(true);
    setActiveUnit(unitId);
    try {
      const path = `../lessons/${unitId}.jsx`;   // must exactly match a key in LESSONS
      const loader = LESSONS[path];
      if (!loader) throw new Error('No lesson file found: ' + unitId);
      const mod = await loader();                // actually fetches/executes the lesson module
      setLessonComponent(() => mod.default);     // store the component itself (not an instance)
    } catch (err) {
      console.error('Could not load lesson:', unitId, err);
      setLessonComponent(null);
      setActiveUnit(null);
    }
    setLoadingLesson(false);
  }

  // Called by the active lesson via its onUnitComplete prop, once
  // the student finishes the lesson's quiz/activity. Persists the
  // completion to the backend, updates local state so the
  // Dashboard reflects it immediately, then returns to Dashboard.
  async function handleUnitComplete() {
    if (!activeUnit) return;
    await saveProgress(student.rollNo, COURSE_CONFIG.courseId, activeUnit);
    setCompletedUnits(prev => [...new Set([...prev, activeUnit])]); // de-dupe with Set just in case
    setActiveUnit(null); setLessonComponent(null);
  }

  // "← Dashboard" button handler — lets a student bail out of a
  // lesson without completing it (progress for that unit is simply
  // not saved, so it stays locked-as-incomplete next time).
  function handleBackToDashboard() { setActiveUnit(null); setLessonComponent(null); }

  // ---- render logic: exactly one of these four branches fires ----
  if (!student) return <Login onLogin={handleLogin} />;
  if (loadingLesson) return <LoadingScreen message="Loading lesson…" />;

  if (activeUnit && LessonComponent) {
    return (
      <div>
        {/* Floating back button overlays every lesson — lessons
            never need to implement their own "back" navigation. */}
        <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 1000 }}>
          <button onClick={handleBackToDashboard} style={{ background: '#1C2333', border: '1px solid #30363D', color: '#8B949E', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>← Dashboard</button>
        </div>
        {/* Suspense catches the brief moment between "component
            reference is set" and "component has actually painted" —
            mostly a safety net since handleSelectUnit already awaits
            the import before getting here. */}
        <Suspense fallback={<LoadingScreen message="Preparing lesson…" />}>
          <LessonComponent student={student} onUnitComplete={handleUnitComplete} />
        </Suspense>
      </div>
    );
  }

  return <Dashboard student={student} completedUnits={completedUnits} onSelectUnit={handleSelectUnit} />;
}
