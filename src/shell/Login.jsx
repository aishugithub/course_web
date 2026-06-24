// ============================================================
//  LOGIN.JSX — the sign-in screen. This is the very first thing
//  a student sees (App.jsx renders this whenever `student` state
//  is null). On success it calls onLogin(studentObject), which
//  App.jsx uses to switch to the Dashboard.
//
//  This file is part of the "shell" — it never changes between
//  courses except automatically, via COURSE_CONFIG (the title/
//  subtitle shown on screen come from config/course.config.js,
//  not hardcoded here).
// ============================================================

import { useState } from 'react';
import { loginStudent } from './api.js';                       // network call → Code.gs "login" action
import COURSE_CONFIG from '../../config/course.config.js';     // course title/subtitle shown in the header

// Shared color palette (dark theme). Kept local to this file so
// each shell component is self-contained and easy to copy/reason
// about in isolation — there's no shared theme file to hunt for.
const C = {
  bg: '#0D1117', surface: '#161B22', card: '#1C2333', border: '#30363D',
  blue: '#58A6FF', green: '#3FB950', red: '#F85149', muted: '#8B949E',
  text: '#E6EDF3', soft: '#C9D1D9',
};

// onLogin: callback supplied by App.jsx — receives the student
// object { rollNo, name, batch, email } once login succeeds.
export default function Login({ onLogin }) {
  // Controlled form state — React owns the input values rather
  // than the DOM, which is the standard React form pattern.
  const [rollNo, setRollNo]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');     // shown in the red error box below the form
  const [loading, setLoading]   = useState(false);  // disables the button + shows "Signing in…" while waiting on the network

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default full-page form submit/reload
    if (!rollNo.trim() || !password.trim()) { setError('Please enter both roll number and password.'); return; }
    setLoading(true); setError('');
    const result = await loginStudent(rollNo.trim(), password.trim()); // → api.js → Code.gs
    setLoading(false);
    if (result.success) { onLogin(result.student); }                   // bubble up to App.jsx
    else { setError(result.message || 'Invalid credentials. Please try again.'); }
  }

  return (
    // Full-viewport flex container centers the login card both
    // horizontally and vertically regardless of screen size.
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        {/* Header: branding is generic (SRET), but the course name
            and tagline come from COURSE_CONFIG so this file never
            needs to be touched when spinning up a new course. */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>SRET E-Learning</h1>
          <p style={{ color: C.blue, fontSize: 16, fontWeight: 600, margin: '6px 0 2px' }}>{COURSE_CONFIG.courseTitle}</p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Sri Ramachandra Faculty of Engineering and Technology</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: C.soft, fontSize: 13, display: 'block', marginBottom: 6 }}>Roll Number</label>
            <input type="text" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g. 2024CS001"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: C.soft, fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {/* Conditionally rendered error banner — only appears once
              the user has submitted bad/empty credentials. */}
          {error && <div style={{ background: '#2D1117', border: `1px solid ${C.red}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.red, fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 8, background: loading ? C.muted : C.blue, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 24 }}>Contact your professor if you don't have a password.</p>
      </div>
    </div>
  );
}
