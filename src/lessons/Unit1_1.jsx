// ════════════════════════════════════════════════════════════════
// src/components/Unit1_1_Redesign.jsx — Module 1, Unit 1.1 lesson
// "What is the Internet?" — an interactive, 6-stage lesson
// ────────────────────────────────────────────────────────────────
// How this fits into the app: App.jsx renders this component (as
// <Unit1_1 student={student}/>) only AFTER a student has logged in.
// This file is entirely self-contained: it owns its own lesson-flow
// state (which of the 6 stages the student is on) and renders a
// different sub-component for each stage. Nothing in here talks to
// the backend yet — `student` is accepted as a prop so a future
// version can POST progress/quiz scores to the Google Apps Script
// backend (see Code.gs) tagged with this student's roll number.
//
// The 6 pedagogical stages (top progress bar) are:
//   1. Hook       — a relatable scenario (sending a WhatsApp message)
//   2. Concepts   — 5 core ideas, one canvas-animated slide each
//   3. See It     — a narrated step-by-step replay of the same journey
//   4. Try It     — an interactive "be the router" mini-game
//   5. Challenge  — drag-and-drop + diagnostic challenges
//   6. Quiz       — 4 scored multiple-choice questions with explanations
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME ───────────────────────────────────────────────────────
// One shared color palette object used by every stage below, so the
// whole lesson stays visually consistent and easy to re-theme later.
const C = {
  bg:      "#0D1117", surface: "#161B22", card: "#1C2333",
  border:  "#30363D", blue: "#58A6FF",   purple: "#BC8CFF",
  green:   "#3FB950", yellow: "#E3B341", red: "#F85149",
  orange:  "#F0883E", muted: "#8B949E",  text: "#E6EDF3",
  soft:    "#C9D1D9", teal: "#39D5C4",
};

// ─── SHARED UI ───────────────────────────────────────────────────
// Small reusable building blocks (button, pill tag, callout box) used
// across every stage component further down this file. Keeping these
// at the top avoids duplicating the same inline styles six times.

// A styled <button> that supports a solid or "outline" look, a
// disabled state, a custom accent color, and a "small" compact size.
const Btn = ({ onClick, children, color = C.blue, disabled, outline, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? "transparent" : disabled ? "#30363D" : color,
    color: outline ? color : disabled ? C.muted : "#000",
    border: outline ? `1.5px solid ${color}` : "none",
    borderRadius: 8, padding: small ? "7px 16px" : "11px 26px",
    fontSize: small ? 13 : 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", transition: "all 0.18s", opacity: disabled ? 0.5 : 1,
    letterSpacing: 0.2,
  }}>{children}</button>
);

// A small rounded pill label, e.g. "CONCEPT 3" or "Router" — used as
// a lightweight visual tag throughout the lesson.
const Tag = ({ children, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
    fontFamily: "monospace", letterSpacing: 1,
  }}>{children}</span>
);

// A colored callout/info box with an icon + title + body — used for
// "you got it right" / "here's a summary" style messages.
const Bubble = ({ color, icon, title, children }) => (
  <div style={{
    background: color + "12", border: `1px solid ${color}30`,
    borderLeft: `4px solid ${color}`, borderRadius: 10,
    padding: "16px 20px", margin: "16px 0",
  }}>
    <div style={{ color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{icon} {title}</div>
    <div style={{ color: C.soft, fontSize: 14, lineHeight: 1.75 }}>{children}</div>
  </div>
);

// ─── JOURNEY PATH (top progress stepper) ────────────────────────
// The 6 named stages shown as a horizontal stepper at the top of the
// lesson, with their own per-stage accent colors.
const STAGES = ["Hook", "Concepts", "See It", "Try It", "Challenge", "Quiz"];
const STAGE_COLORS = [C.teal, C.blue, C.purple, C.orange, C.yellow, C.green];

// Renders the circles-and-connecting-lines progress stepper. `current`
// is the index of the stage the student is on right now; `completed`
// is a Set of stage indices already finished (drawn filled-in/checked).
const JourneyPath = ({ current, completed }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "16px 24px", overflowX: "auto" }}>
    {STAGES.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? 1 : 0 }}>
        <div
          onClick={() => completed.has(i) && null}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 52 }}
        >
          {/* The circular step marker: filled solid once completed, glowing
              while active, hollow/grey if not yet reached. */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: completed.has(i) ? STAGE_COLORS[i] : i === current ? STAGE_COLORS[i] + "33" : C.card,
            border: `2px solid ${i <= current ? STAGE_COLORS[i] : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700,
            color: completed.has(i) ? "#000" : i === current ? STAGE_COLORS[i] : C.muted,
            boxShadow: i === current ? `0 0 14px ${STAGE_COLORS[i]}66` : "none",
            transition: "all 0.4s",
            animation: i === current ? "pulse 2s infinite" : "none",
          }}>
            {completed.has(i) ? "✓" : i + 1}
          </div>
          <div style={{ fontSize: 10, color: i === current ? STAGE_COLORS[i] : C.muted, fontWeight: i === current ? 700 : 400, whiteSpace: "nowrap" }}>
            {s}
          </div>
        </div>
        {/* Connecting line segment between this step and the next one. */}
        {i < STAGES.length - 1 && (
          <div style={{ flex: 1, height: 2, background: completed.has(i) ? STAGE_COLORS[i] : C.border, margin: "0 4px", marginBottom: 18, transition: "background 0.4s" }} />
        )}
      </div>
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════
//  STAGE 1 — HOOK
// ────────────────────────────────────────────────────────────────
// Goal: open with something the student does every day (sending a
// WhatsApp message) so the rest of the lesson has an anchor analogy
// to keep returning to. Ends by asking the student to write a guess
// about how it works, BEFORE we teach anything — a classic
// "predict, then learn" retrieval-practice technique.
// ════════════════════════════════════════════════════════════════
const Stage1Hook = ({ onDone }) => {
  // `phase` walks through: 0 = intro pause, 1 = "press send" prompt,
  // 2 = packet travelling animation playing, 3 = reflection + guess box.
  const [phase, setPhase] = useState(0);
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // The 4 "hops" the message visually travels through on the canvas
  // world-map sketch: Chennai → Mumbai → Dubai → Frankfurt. Coordinates
  // are fractions (0–1) of the canvas width/height so the drawing
  // automatically rescales to any screen size.
  const cities = [
    { x: 0.72, y: 0.55, name: "Chennai", flag: "🇮🇳" },
    { x: 0.67, y: 0.48, name: "Mumbai",  flag: "🇮🇳" },
    { x: 0.57, y: 0.32, name: "Dubai",   flag: "🇦🇪" },
    { x: 0.50, y: 0.28, name: "Frankfurt", flag: "🇩🇪" },
  ];

  // Mutable animation state that does NOT need to trigger React
  // re-renders on every change (it changes every animation frame, far
  // too fast for setState) — so it lives in a ref instead of useState.
  // seg: which city-to-city segment we're currently animating along.
  // t: 0→1 progress along that segment. trail: fading dot history.
  const packetRef = useRef({ seg: 0, t: 0, active: false, trail: [] });

  // Draws one full frame of the world-map canvas: background, dashed
  // cable routes, the fading trail, the glowing travelling packet dot,
  // and the city markers/labels. Called on every animation tick AND
  // whenever `phase` changes (so the canvas reflects the right state
  // even when nothing is actively animating).
  function drawFrame() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // Base fill, then a soft radial "ocean" gradient on top for depth.
    ctx.fillStyle = "#1C2333";
    ctx.fillRect(0, 0, W, H);
    const grd = ctx.createRadialGradient(W*0.5,H*0.5,10,W*0.5,H*0.5,W*0.6);
    grd.addColorStop(0, "#0D1F33"); grd.addColorStop(1, "#0D1117");
    ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);
    // Faint latitude/longitude-style grid lines purely for visual texture.
    ctx.strokeStyle = "#FFFFFF08"; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(0, H*i/8); ctx.lineTo(W, H*i/8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*i/8, 0); ctx.lineTo(W*i/8, H); ctx.stroke();
    }
    // Dashed lines connecting each city to the next — the "cable route".
    for (let i = 0; i < cities.length - 1; i++) {
      const a = cities[i], b = cities[i+1];
      ctx.beginPath(); ctx.moveTo(W*a.x, H*a.y); ctx.lineTo(W*b.x, H*b.y);
      ctx.strokeStyle = C.blue + "33"; ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
    // Fading trail of small dots behind the travelling packet, giving
    // a sense of motion/speed without needing a video file.
    const p = packetRef.current;
    p.trail.forEach((pt, i) => {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 3 * (i/p.trail.length), 0, Math.PI*2);
      ctx.fillStyle = C.teal + Math.floor(180 * i/p.trail.length).toString(16).padStart(2,"0");
      ctx.fill();
    });
    // The glowing packet dot itself, only drawn while actively travelling
    // between two cities (interpolated position based on p.t, 0 to 1).
    if (p.active && p.seg < cities.length - 1) {
      const a = cities[p.seg], b = cities[p.seg+1];
      const px = W * (a.x + (b.x-a.x)*p.t);
      const py = H * (a.y + (b.y-a.y)*p.t);
      p.trail.push({ x: px, y: py });
      if (p.trail.length > 18) p.trail.shift();
      const g = ctx.createRadialGradient(px,py,0,px,py,18);
      g.addColorStop(0, C.teal + "ff"); g.addColorStop(1, C.teal + "00");
      ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2);
      ctx.fillStyle = C.teal; ctx.fill();
    }
    // City markers: a glowing ring once "reached" by the packet, a
    // plain dot before that, plus a flag+name label.
    cities.forEach((c, i) => {
      const x = W*c.x, y = H*c.y;
      const reached = p.active && p.seg > i || (p.seg === cities.length-1 && p.t >= 1);
      ctx.beginPath(); ctx.arc(x, y, reached ? 16 : 10, 0, Math.PI*2);
      ctx.strokeStyle = reached ? C.teal : C.blue + "66";
      ctx.lineWidth = reached ? 2 : 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2);
      ctx.fillStyle = reached ? C.teal : C.blue; ctx.fill();
      ctx.fillStyle = C.text; ctx.font = "bold 12px 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${c.flag} ${c.name}`, x + 12, y + 4);
    });
  }

  // Kicks off the actual travelling-packet animation when the student
  // clicks "Send the message". Uses requestAnimationFrame for a smooth
  // 60fps loop; advances to the next city-to-city segment once t
  // reaches 1, and moves to phase 3 (reflection) once the final city
  // (Frankfurt) is reached.
  function sendPacket() {
    if (phase !== 1) return;
    setPhase(2);
    packetRef.current = { seg: 0, t: 0, active: true, trail: [] };
    let lastTime = null;
    function loop(ts) {
      if (!lastTime) lastTime = ts;
      const dt = (ts - lastTime) / 1000; lastTime = ts;
      const p = packetRef.current;
      p.t += dt * 0.9; // animation speed multiplier
      if (p.t >= 1) {
        p.t = 0; p.seg++;
        if (p.seg >= cities.length - 1) {
          p.active = false; p.seg = cities.length - 1; p.t = 1;
          drawFrame();
          setTimeout(() => setPhase(3), 600);
          return;
        }
      }
      drawFrame();
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
  }

  // On first mount: size the canvas to match its actual rendered
  // width (canvas pixel buffers don't auto-follow CSS size), draw the
  // initial frame, and keep it responsive on window resize. Cleans up
  // the resize listener and any in-flight animation frame on unmount.
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = 300; drawFrame(); };
    resize();
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, []);
  // Re-draw whenever the phase changes (e.g. so the "reached" glow
  // state on Frankfurt shows correctly once phase becomes 3).
  useEffect(() => { drawFrame(); }, [phase]);
  // Auto-advance from the silent intro (phase 0) to the prompt (phase 1)
  // after a short 1.2s pause, purely for pacing/drama.
  useEffect(() => { if (phase === 0) setTimeout(() => setPhase(1), 1200); }, []);

  return (
    <div>
      {/* A small WhatsApp-style chat bubble mockup that "ticks" to
          double-check (✓✓) once the message has been sent, and gets a
          green checkmark badge once phase 3 (delivered) is reached. */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          display: "inline-block", background: C.card,
          border: `2px solid ${C.border}`, borderRadius: 32,
          padding: "16px 20px", minWidth: 220, position: "relative",
        }}>
          <div style={{ background: "#000", borderRadius: 20, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, textAlign: "left" }}>WhatsApp · now</div>
            <div style={{
              background: C.green + "22", border: `1px solid ${C.green}44`,
              borderRadius: "16px 16px 4px 16px", padding: "10px 14px",
              fontSize: 14, color: C.text, textAlign: "left", marginBottom: 4,
            }}>
              Hey, coming for lunch? 🍛
              {phase >= 1 && <span style={{ marginLeft: 8, fontSize: 11, color: C.teal }}>✓✓</span>}
            </div>
            <div style={{ fontSize: 10, color: C.muted, textAlign: "right" }}>2:47 PM</div>
          </div>
          {phase >= 3 && (
            <div style={{
              position: "absolute", top: -12, right: -12,
              background: C.teal, color: "#000", borderRadius: "50%",
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14, fontWeight: 700,
            }}>✓</div>
          )}
        </div>
      </div>

      {/* The animated world-map canvas, in a little browser-chrome-style
          frame (red/yellow/green dots) to make it feel like a live tool. */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.red, display: "inline-block" }}/>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.yellow, display: "inline-block" }}/>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, display: "inline-block" }}/>
          <span style={{ color: C.muted, fontSize: 12, fontFamily: "monospace", marginLeft: 8 }}>
            Chennai → Frankfurt · real-time signal path
          </span>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", height: 300, display: "block" }} />
      </div>

      {/* Phase-specific content below the visuals: a call-to-action
          button, a "travelling..." status line, or the final
          reflection + free-text guess box, depending on `phase`. */}
      {phase === 1 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            You press Send. Your friend in Frankfurt gets it instantly.
          </div>
          <div style={{ color: C.muted, fontSize: 15, marginBottom: 24 }}>
            How does a message travel 8,000 km in under a second?
          </div>
          <Btn onClick={sendPacket} color={C.teal}>▶ Send the message →</Btn>
        </div>
      )}
      {phase === 2 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, color: C.teal, fontWeight: 600 }}>
            Travelling through Chennai → Mumbai → Dubai → Frankfurt...
          </div>
        </div>
      )}
      {phase === 3 && (
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, textAlign: "center" }}>
            Your message hopped through <span style={{ color: C.teal }}>3 countries</span> in under a second.
          </div>
          <div style={{ color: C.muted, fontSize: 15, marginBottom: 20, textAlign: "center" }}>
            You've done this ten thousand times. Today you'll finally see what's happening inside.
          </div>
          {/* Predict-before-you-learn box: the student must type a real
              guess (5+ characters) before the "next" button unlocks. */}
          <div style={{ background: C.card, border: `1px solid ${C.teal}33`, borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ color: C.teal, fontWeight: 700, marginBottom: 10 }}>✏️ Before we start — what do you think happens?</div>
            <div style={{ color: C.soft, fontSize: 14, marginBottom: 12 }}>
              Write your best guess. There's no wrong answer — this is just to get you thinking.
            </div>
            <textarea
              value={guess} onChange={e => setGuess(e.target.value)}
              placeholder="I think what happens is..."
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: 12, color: C.text, fontSize: 14,
                fontFamily: "inherit", resize: "vertical", minHeight: 80,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={onDone} color={C.teal} disabled={guess.trim().length < 5}>
              Save my guess & start learning →
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  STAGE 2 — BUILD (5 concepts, taught one at a time)
// ────────────────────────────────────────────────────────────────
// Each concept follows the same teaching pattern: a canvas animation
// or mini-interaction first (so the student SEES the idea before
// being told it), then a plain-English analogy, then a short
// explanation, then the formal technical term revealed last. This
// "concrete before abstract" ordering is deliberate.
// ════════════════════════════════════════════════════════════════

// ConceptSlide is the generic "shell" used for all 5 concepts below —
// it doesn't know anything domain-specific itself; everything content
// related (title, analogy, explanation, term, and the canvas-drawing
// function) is passed in via the `concept` object (see CONCEPTS array
// further down). This means adding a 6th concept later only requires
// adding one more object to that array, not writing a new component.
const ConceptSlide = ({ concept, onNext, isLast }) => {
  // `ready` gates the "next" button so students can't rapid-click
  // through without at least pausing to read (unlocks automatically
  // after `concept.readyAfter` milliseconds).
  const [ready, setReady] = useState(false);
  // `interacted` tracks whether the student has actually engaged with
  // the canvas (clicked, watched the animation finish, etc.) — some
  // concepts use this to show a hint until they do.
  const [interacted, setInteracted] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Runs every time `concept` changes (i.e. every time we move to a
  // new concept slide): resets the gating flags, starts the "ready"
  // timer, and kicks off that concept's own canvas animation function.
  useEffect(() => {
    setReady(false); setInteracted(false);
    const t = setTimeout(() => setReady(true), concept.readyAfter || 3000);
    if (concept.animate) concept.animate(canvasRef, animRef, setInteracted);
    return () => { clearTimeout(t); cancelAnimationFrame(animRef.current); };
  }, [concept]);

  return (
    <div>
      {/* Mini progress dots showing "concept 3 of 5" at a glance. */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center" }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            height: 4, flex: 1, borderRadius: 2,
            background: i <= concept.index ? concept.color : C.border,
            transition: "background 0.4s",
          }}/>
        ))}
        <span style={{ color: C.muted, fontSize: 12, marginLeft: 8, whiteSpace: "nowrap" }}>
          {concept.index + 1} / 5
        </span>
      </div>
      {/* Concept number tag + big headline title. */}
      <div style={{ marginBottom: 16 }}>
        <Tag color={concept.color}>CONCEPT {concept.index + 1}</Tag>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 10, lineHeight: 1.2 }}>
          {concept.title}
        </div>
      </div>
      {/* The canvas where each concept's custom animation/interaction
          draws itself. Clicking forwards to the concept's own onClick
          handler if it defines one (e.g. "click each device to reveal
          its IP"). */}
      <div style={{
        background: C.surface, border: `1px solid ${concept.color}44`,
        borderRadius: 12, overflow: "hidden", marginBottom: 18,
      }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: 260, display: "block" }}
          onClick={() => { if (concept.onClick) { concept.onClick(canvasRef, setInteracted); }}}
        />
        {concept.canvasHint && !interacted && (
          <div style={{ padding: "8px 16px", borderTop: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 12, color: C.muted }}>
            👆 {concept.canvasHint}
          </div>
        )}
      </div>
      {/* Plain-English analogy + fuller explanation, BEFORE the jargon. */}
      <div style={{
        background: concept.color + "0E", border: `1px solid ${concept.color}30`,
        borderRadius: 10, padding: "16px 20px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: concept.color, marginBottom: 6 }}>
          {concept.analogy}
        </div>
        <div style={{ fontSize: 14, color: C.soft, lineHeight: 1.8 }}>
          {concept.explain}
        </div>
      </div>
      {/* The formal technical term, revealed last — deliberately the
          very last thing the student sees for this concept. */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ color: C.muted, fontSize: 13 }}>The technical term for this is:</span>
        <Tag color={concept.color}>{concept.term}</Tag>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={onNext} color={concept.color} disabled={!ready}>
          {!ready ? "Read for a moment..." : isLast ? "I understand all 5 concepts →" : "Got it, next concept →"}
        </Btn>
      </div>
    </div>
  );
};

// ── Concept Animations ──────────────────────────────────────────
// Each of these 5 functions draws directly onto a <canvas> using the
// raw 2D Canvas API (no chart library needed — keeps the bundle tiny
// and gives full control over custom shapes/animation timing). Every
// function receives the same trio of arguments:
//   canvasRef     — React ref to the actual <canvas> DOM element
//   animRef       — React ref used to store the current
//                   requestAnimationFrame/setTimeout id, so ConceptSlide's
//                   cleanup effect can cancel it when the student moves on
//   setInteracted — callback to flag "the student has engaged with this"
//                   (unlocks/removes the canvasHint tooltip)

// CONCEPT 1 — "The internet is just computers talking to each other."
// Animates 10 device nodes appearing one by one and connecting with
// dashed lines, visually building up "a network" from nothing.
function animNetworkGrow(canvasRef, animRef, setInteracted) {
  const canvas = canvasRef.current; if (!canvas) return;
  canvas.width = canvas.offsetWidth; canvas.height = 260;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  const nodes = [];
  let step = 0;
  // Fractional (0–1) positions for up to 10 device nodes, hand-placed
  // so they spread out nicely across the canvas as they appear.
  const positions = [
    [0.5,0.5],[0.25,0.3],[0.75,0.3],[0.2,0.65],[0.8,0.65],
    [0.5,0.15],[0.1,0.45],[0.9,0.45],[0.5,0.82],[0.35,0.55],
  ];
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,W,H);
    // Connect each new node to the previous one (and to one node back
    // again after the 3rd) so the graph looks organically meshed
    // rather than a single straight chain.
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i], b = nodes[Math.max(0,i-1)];
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      ctx.strokeStyle = C.blue + "55"; ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      if (i > 2) {
        const c = nodes[Math.max(0,i-3)];
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y);
        ctx.strokeStyle = C.blue + "33"; ctx.lineWidth = 1;
        ctx.setLineDash([3,6]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // Draw every node placed so far as a labelled circle ("PC 1", "PC 2"...).
    nodes.forEach((n, i) => {
      ctx.beginPath(); ctx.arc(n.x,n.y,12,0,Math.PI*2);
      ctx.fillStyle = C.blue+"22"; ctx.fill();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = "10px monospace";
      ctx.textAlign = "center"; ctx.fillText(`PC ${i+1}`, n.x, n.y+3);
    });
    // Running device-count readout in the corner, growing as nodes appear.
    if (nodes.length > 0) {
      ctx.fillStyle = C.blue + "99";
      ctx.font = "bold 36px 'Segoe UI'"; ctx.textAlign = "right";
      ctx.fillText(nodes.length, W-20, H-20);
      ctx.font = "12px monospace"; ctx.fillStyle = C.muted;
      ctx.fillText("devices", W-20, H-4);
    }
  }
  // Adds one node every 800ms for the first 3, then speeds up to every
  // 400ms — gives an initial deliberate pace, then a satisfying "network
  // effect" acceleration. Flags interaction complete once all nodes are placed.
  function addNode() {
    if (step >= positions.length) { setInteracted(true); return; }
    const [rx,ry] = positions[step];
    nodes.push({ x: W*rx + (Math.random()-0.5)*30, y: H*ry + (Math.random()-0.5)*20 });
    step++; draw();
    if (step < positions.length) animRef.current = setTimeout(addNode, step < 3 ? 800 : 400);
    else setInteracted(true);
  }
  setTimeout(addNode, 600);
}

// CONCEPT 2 — "Every device has a unique address."
// Phase 0 shows a confused postman with no addresses to deliver to;
// after 1.8s it reveals 5 labelled devices the student can click one
// by one to reveal each device's IP address, until all are revealed.
function animIPAddress(canvasRef, animRef, setInteracted) {
  const canvas = canvasRef.current; if (!canvas) return;
  canvas.width = canvas.offsetWidth; canvas.height = 260;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  const nodes = [
    { x:W*0.15,y:H*0.4, ip:"192.168.1.1",  label:"Your Phone",    color:C.blue },
    { x:W*0.4, y:H*0.2, ip:"192.168.1.2",  label:"Laptop",        color:C.purple },
    { x:W*0.65,y:H*0.5, ip:"203.0.113.10", label:"ISP Server",    color:C.orange },
    { x:W*0.85,y:H*0.3, ip:"142.250.195.1",label:"Google Server", color:C.green },
    { x:W*0.3, y:H*0.7, ip:"192.168.1.5",  label:"Smart TV",      color:C.teal },
  ];
  let revealed = [];   // indices into `nodes` whose IP the student has revealed
  let phase = 0;        // 0 = "no addresses" confusion, 1 = clickable devices
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,W,H);
    if (phase === 0) {
      // The "confused postman" framing device for why addresses matter.
      ctx.fillStyle = C.muted; ctx.font = "48px serif";
      ctx.textAlign = "center"; ctx.fillText("📮", W*0.5, H*0.38);
      ctx.font = "bold 16px 'Segoe UI'"; ctx.fillStyle = C.muted;
      ctx.fillText("Who do I deliver to?", W*0.5, H*0.58);
      ctx.font = "13px monospace"; ctx.fillStyle = C.red+"99";
      ctx.fillText("No addresses found!", W*0.5, H*0.72);
      return;
    }
    // Static connection lines between devices and the "ISP Server" hub.
    [[0,2],[1,2],[2,3],[4,2]].forEach(([a,b]) => {
      ctx.beginPath(); ctx.moveTo(nodes[a].x,nodes[a].y); ctx.lineTo(nodes[b].x,nodes[b].y);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.stroke();
    });
    // Each device: a circle that fills in with color once its IP has
    // been revealed by a click, and shows the IP text underneath it.
    nodes.forEach((n, i) => {
      const isRevealed = revealed.includes(i);
      ctx.beginPath(); ctx.arc(n.x,n.y,18,0,Math.PI*2);
      ctx.fillStyle = isRevealed ? n.color+"33" : C.card; ctx.fill();
      ctx.strokeStyle = isRevealed ? n.color : C.border; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = "10px monospace";
      ctx.textAlign = "center"; ctx.fillText(n.label.split(" ")[0], n.x, n.y+3);
      if (isRevealed) {
        ctx.fillStyle = n.color;
        ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
        ctx.fillText(n.ip, n.x, n.y+36);
      }
    });
    // Once every device's IP has been revealed, show a success message.
    if (revealed.length === nodes.length) {
      ctx.fillStyle = C.green+"cc"; ctx.font = "bold 13px 'Segoe UI'";
      ctx.textAlign = "center";
      ctx.fillText("✓ Every device has a unique address — now delivery works!", W*0.5, H-12);
    }
  }
  setTimeout(() => { draw(); }, 100);
  // After 1.8s, flip from the "confused postman" phase to the
  // clickable-devices phase, and redraw.
  setTimeout(() => { phase = 1; draw(); setInteracted(false); }, 1800);
  // Clicking the canvas reveals the next not-yet-revealed device's IP
  // address, one at a time, left-to-right through the `nodes` array.
  canvas.onclick = () => {
    const next = nodes.findIndex((_, i) => !revealed.includes(i));
    if (next >= 0) { revealed.push(next); draw(); }
    if (revealed.length === nodes.length) setInteracted(true);
  };
  draw();
}

// Small shared helper: draws a rounded rectangle path (used by several
// of the canvas animations below for packet/card shapes). Note this
// duplicates the logic of the newer built-in ctx.roundRect in some
// browsers, but is kept explicit here for maximum compatibility.
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

// CONCEPT 3 — "Data travels in small pieces, not as one whole file."
// Phase 0: shows the original file as one big "newspaper" that's too
// big to send. Phase 1: it visibly breaks into 4 numbered packets that
// scatter to different points (representing different routes). Phase 2:
// the packets fly back together and reassemble into a confirmed whole.
function animPackets(canvasRef, animRef, setInteracted) {
  const canvas = canvasRef.current; if (!canvas) return;
  canvas.width = canvas.offsetWidth; canvas.height = 260;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  let phase = 0;
  // Each piece's starting position (x,y) and scatter target (tx,ty),
  // all as fractions of canvas size, plus its own accent color.
  const pieces = [
    { n:1, x:0.48,y:0.3, tx:0.15,ty:0.25, color:C.blue },
    { n:2, x:0.5, y:0.3, tx:0.38,ty:0.65, color:C.purple },
    { n:3, x:0.52,y:0.3, tx:0.62,ty:0.2,  color:C.green },
    { n:4, x:0.5, y:0.32,tx:0.82,ty:0.55, color:C.orange },
  ];
  let t = 0;            // 0→1 animation progress within the current phase
  let assembled = false; // guards against firing setInteracted more than once
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,W,H);
    if (phase === 0) {
      // The whole un-split file, framed as a single newspaper that's
      // explicitly labelled "too big to send as-is".
      ctx.fillStyle = C.card; ctx.strokeStyle = C.yellow+"88"; ctx.lineWidth = 2;
      roundRectPath(ctx, W*0.3, H*0.15, W*0.4, H*0.55, 8);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.yellow; ctx.font = "bold 15px 'Segoe UI'"; ctx.textAlign="center";
      ctx.fillText("📰 Your 5 MB File", W*0.5, H*0.37);
      ctx.fillStyle = C.muted; ctx.font = "12px monospace";
      ctx.fillText("One big piece", W*0.5, H*0.52);
      ctx.fillStyle = C.red+"cc"; ctx.font = "bold 13px 'Segoe UI'";
      ctx.fillText("❌ Too big to send as-is!", W*0.5, H*0.82);
    } else if (phase === 1) {
      // The 4 pieces animate outward from the centre to their scatter
      // targets, each drawing a faint dashed "route" line behind it.
      pieces.forEach(p => {
        const cx = W*(p.x + (p.tx-p.x)*t);
        const cy = H*(p.y + (p.ty-p.y)*t);
        ctx.fillStyle = p.color+"33"; ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        roundRectPath(ctx, cx-26, cy-18, 52, 36, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = "bold 12px monospace"; ctx.textAlign="center";
        ctx.fillText(`PKT ${p.n}`, cx, cy+4);
        ctx.strokeStyle = p.color+"44"; ctx.lineWidth=1; ctx.setLineDash([3,4]);
        ctx.beginPath(); ctx.moveTo(W*p.x,H*p.y); ctx.lineTo(cx,cy); ctx.stroke();
        ctx.setLineDash([]);
      });
      if (t < 1) { t += 0.018; animRef.current = requestAnimationFrame(draw); }
      else {
        ctx.fillStyle = C.green; ctx.font = "bold 13px 'Segoe UI'"; ctx.textAlign="center";
        ctx.fillText("📩 Arriving at destination...", W*0.5, H*0.88);
        // Pause briefly on the "arrived, scattered" frame, then begin
        // the reassembly phase from scratch.
        setTimeout(() => { phase = 2; t = 0; assembled = false; requestAnimationFrame(draw); }, 800);
      }
      return;
    } else if (phase === 2) {
      // The 4 pieces fly back together from 4 fixed offset positions
      // around a shared centre point, shrinking that offset as t→1.
      const cx = W*0.5, cy = H*0.45;
      const offsets = [[-70,-30],[70,-30],[-70,30],[70,30]];
      pieces.forEach((p, i) => {
        const [ox,oy] = offsets[i];
        const px = cx + ox*(1-t), py = cy + oy*(1-t);
        ctx.fillStyle = p.color+"33"; ctx.strokeStyle = p.color; ctx.lineWidth=2;
        roundRectPath(ctx, px-26, py-18, 52, 36, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = "bold 12px monospace"; ctx.textAlign="center";
        ctx.fillText(`PKT ${p.n}`, px, py+4);
      });
      if (t < 1) { t += 0.022; animRef.current = requestAnimationFrame(draw); }
      else {
        // Final state: a single reassembled "file" card replaces the
        // 4 separate pieces, confirming successful reassembly.
        ctx.fillStyle = C.card; ctx.strokeStyle = C.green; ctx.lineWidth=3;
        roundRectPath(ctx, cx-90, cy-40, 180, 80, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.green; ctx.font = "bold 15px 'Segoe UI'"; ctx.textAlign="center";
        ctx.fillText("✓ File Reassembled!", cx, cy+6);
        ctx.fillStyle = C.muted; ctx.font = "12px monospace";
        ctx.fillText("All 4 packets arrived", cx, cy+22);
        if (!assembled) { assembled = true; setInteracted(true); }
        return;
      }
    }
  }
  draw();
  // After showing the intact file for 1.5s, start the scatter phase.
  setTimeout(() => { phase = 1; t = 0; requestAnimationFrame(draw); }, 1500);
}

// CONCEPT 4 — "Routers decide which road each packet takes."
// An interactive mini-quiz drawn directly on canvas: for each of 2
// rounds, an incoming packet (with a destination IP) needs the student
// to click the correct one of 3 "roads" out of a router. Clicking the
// right/wrong road gives immediate color-coded feedback, then advances.
function animRouter(canvasRef, animRef, setInteracted) {
  const canvas = canvasRef.current; if (!canvas) return;
  canvas.width = canvas.offsetWidth; canvas.height = 260;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  let round = 0, chosen = null, correct = null, feedback = "";
  // Two practice rounds, each with a destination IP and 3 candidate
  // routes (only one of which is actually correct for that destination).
  const rounds = [
    { dest: "192.168.1.5", routes: [
        { label:"Road A → Home Network",  ip:"192.168.x.x", correct:true,  color:C.green },
        { label:"Road B → Internet",      ip:"203.0.x.x",   correct:false, color:C.orange },
        { label:"Road C → ISP Server",    ip:"10.0.x.x",    correct:false, color:C.purple },
    ]},
    { dest: "8.8.8.8", routes: [
        { label:"Road A → Local Network", ip:"192.168.x.x", correct:false, color:C.blue },
        { label:"Road B → Google DNS",    ip:"8.8.x.x",     correct:true,  color:C.green },
        { label:"Road C → ISP Cache",     ip:"203.0.x.x",   correct:false, color:C.orange },
    ]},
  ];
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,W,H);
    const r = rounds[round];
    // The router box itself, drawn at the top centre.
    ctx.fillStyle = C.card; ctx.strokeStyle = C.orange; ctx.lineWidth=2;
    roundRectPath(ctx, W*0.38,H*0.1,W*0.24,H*0.25,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.orange; ctx.font = "22px serif"; ctx.textAlign="center";
    ctx.fillText("🔀", W*0.5, H*0.27);
    ctx.fillStyle = C.text; ctx.font = "bold 11px monospace";
    ctx.fillText("ROUTER", W*0.5, H*0.37);
    // The incoming packet, labelled with the round's destination IP,
    // with a dashed arrow pointing into the router box.
    ctx.fillStyle = C.yellow+"33"; ctx.strokeStyle = C.yellow; ctx.lineWidth=2;
    roundRectPath(ctx, W*0.05,H*0.15,W*0.25,H*0.18,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.font = "bold 11px monospace"; ctx.textAlign="center";
    ctx.fillText("📦 PACKET", W*0.175, H*0.22);
    ctx.fillStyle = C.text; ctx.font = "10px monospace";
    ctx.fillText(`TO: ${r.dest}`, W*0.175, H*0.3);
    ctx.strokeStyle = C.yellow+"66"; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(W*0.3,H*0.24); ctx.lineTo(W*0.38,H*0.24); ctx.stroke();
    ctx.setLineDash([]);
    // The 3 candidate roads, drawn as clickable-looking rows. Once
    // chosen, the row turns green (correct) or red (wrong) and shows
    // a ✓/✗ instead of the default arrow.
    r.routes.forEach((rt, i) => {
      const y = H*(0.52 + i*0.17);
      const isChosen = chosen === i;
      const isCorrect = rt.correct;
      let bg = C.card, border = C.border;
      if (isChosen) { bg = isCorrect ? C.green+"22" : C.red+"22"; border = isCorrect ? C.green : C.red; }
      ctx.fillStyle = bg; ctx.strokeStyle = border; ctx.lineWidth=2;
      roundRectPath(ctx, W*0.12,y-16,W*0.76,32,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isChosen ? (isCorrect ? C.green : C.red) : C.text;
      ctx.font = "13px 'Segoe UI'"; ctx.textAlign="left";
      ctx.fillText(`${isChosen ? (isCorrect?"✓":"✗") : "→"} ${rt.label}`, W*0.16, y+4);
      ctx.fillStyle = C.muted; ctx.font = "11px monospace"; ctx.textAlign="right";
      ctx.fillText(rt.ip, W*0.86, y+4);
      // Stash this row's vertical center on the route object itself so
      // the click handler below can hit-test against it.
      rt._y = y;
    });
    if (feedback) {
      ctx.fillStyle = chosen !== null && r.routes[chosen].correct ? C.green : C.red;
      ctx.font = "bold 12px 'Segoe UI'"; ctx.textAlign="center";
      ctx.fillText(feedback, W*0.5, H*0.95);
    }
  }
  // Hit-tests the click's Y coordinate against each route row's stored
  // `_y` center (within a 16px tolerance band), determines correctness,
  // shows feedback, then either advances to round 2 or finishes.
  canvas.onclick = (e) => {
    if (chosen !== null) return;
    const rect = canvas.getBoundingClientRect();
    const my = (e.clientY - rect.top) * (canvas.height/rect.height);
    const r = rounds[round];
    r.routes.forEach((rt, i) => {
      if (rt._y && Math.abs(my - rt._y) < 16) {
        chosen = i; correct = rt.correct;
        feedback = rt.correct ? "✓ Correct! The router chose the right road." : "✗ Wrong road — the router checks the IP prefix to decide.";
        draw();
        setTimeout(() => {
          if (round < rounds.length-1) { round++; chosen=null; correct=null; feedback=""; draw(); }
          else { setInteracted(true); feedback="✓ You understand how routers make decisions!"; draw(); }
        }, 1400);
      }
    });
  };
  draw();
}

// CONCEPT 5 — "All devices speak the same agreed language (protocol)."
// Phase 0: two figures surrounded by mismatched scripts/greetings,
// illustrating "no shared language = no communication". Phase 1: a
// shared "TCP/IP rulebook" appears between them. Phase 2: a sequence
// of labelled request/response messages flows back and forth using
// that shared protocol, proving communication now works.
function animProtocol(canvasRef, animRef, setInteracted) {
  const canvas = canvasRef.current; if (!canvas) return;
  canvas.width = canvas.offsetWidth; canvas.height = 260;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  let phase = 0;
  // The 4 request/response messages exchanged once a shared protocol
  // is established — alternating direction, each with its own color.
  const messages = [
    { from:"Phone", to:"Server", text:"GET /page", color:C.blue },
    { from:"Server", to:"Phone", text:"200 OK + HTML", color:C.green },
    { from:"Phone", to:"Server", text:"GET /style.css", color:C.blue },
    { from:"Server", to:"Phone", text:"200 OK + CSS", color:C.green },
  ];
  let msgStep = 0, arrowT = 0;
  let chaosAngle = 0; // drives the slow rotation of the "chaos" phase-0 text bubbles
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,W,H);
    if (phase === 0) {
      // Two figures with random mismatched greetings orbiting between
      // them — nobody understands anybody, illustrating "no protocol".
      ctx.font="40px serif"; ctx.textAlign="center";
      ctx.fillText("🧑",W*0.2,H*0.45); ctx.fillText("🖥",W*0.8,H*0.45);
      const chaos = ["???","வணக்கம்","Hello?","Guten Tag!","01010?"];
      chaos.forEach((t,i) => {
        const angle = chaosAngle + i*1.25;
        const r = 45 + Math.sin(angle)*8;
        ctx.fillStyle = [C.red,C.orange,C.yellow,C.purple,C.blue][i]+"cc";
        ctx.font = "12px monospace"; ctx.textAlign="center";
        ctx.fillText(t, W*0.5 + Math.cos(angle)*r, H*0.4 + Math.sin(angle)*r*0.6);
      });
      ctx.fillStyle = C.muted; ctx.font="13px 'Segoe UI'"; ctx.textAlign="center";
      ctx.fillText("No shared language — no communication", W*0.5, H*0.78);
      chaosAngle += 0.04;
      animRef.current = requestAnimationFrame(draw);
    } else if (phase === 1) {
      // A "TCP/IP rulebook" card appears between the two figures, with
      // dashed arrows showing both sides now referring to the same rules.
      ctx.font="38px serif"; ctx.textAlign="center";
      ctx.fillText("🧑",W*0.15,H*0.4); ctx.fillText("🖥",W*0.85,H*0.4);
      ctx.fillStyle=C.card; ctx.strokeStyle=C.blue; ctx.lineWidth=2;
      roundRectPath(ctx, W*0.37,H*0.15,W*0.26,H*0.42,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=C.blue; ctx.font="bold 12px 'Segoe UI'"; ctx.textAlign="center";
      ctx.fillText("📋 TCP/IP", W*0.5, H*0.3);
      const lines=["Rules for all","devices","Same language","everywhere!"];
      const lineColors=[C.muted,C.muted,C.green,C.green];
      lines.forEach((line,i) => {
        ctx.fillStyle=lineColors[i]; ctx.font="11px monospace";
        ctx.fillText(line, W*0.5, H*(0.38+i*0.06));
      });
      [W*0.22,W*0.78].forEach(x => {
        ctx.strokeStyle=C.blue+"88"; ctx.lineWidth=1.5; ctx.setLineDash([3,4]);
        ctx.beginPath(); ctx.moveTo(x,H*0.38); ctx.lineTo(W*0.5+(x<W*0.5?-1:1)*W*0.13,H*0.35);
        ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.fillStyle=C.green; ctx.font="bold 13px 'Segoe UI'"; ctx.textAlign="center";
      ctx.fillText("Both agree on the same rules ✓", W*0.5, H*0.78);
      // After a short pause showing the agreed rulebook, move to the
      // live request/response exchange phase.
      setTimeout(() => { phase=2; msgStep=0; arrowT=0; cancelAnimationFrame(animRef.current); requestAnimationFrame(draw); }, 1000);
    } else {
      // Two labelled device boxes (Phone, Server) with each completed
      // message drawn as a permanent arrow + label between them, plus
      // the currently-in-flight message animating across in real time.
      ctx.font="32px serif"; ctx.textAlign="center";
      ctx.fillText("📱",W*0.1,H*0.3); ctx.fillText("🖥",W*0.9,H*0.3);
      [[W*0.03,"Phone",C.blue],[W*0.76,"Server",C.green]].forEach(([x,lbl,col]) => {
        ctx.fillStyle=col+"22"; ctx.strokeStyle=col; ctx.lineWidth=1.5;
        roundRectPath(ctx, x,H*0.12,W*0.18,H*0.26,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font="11px monospace"; ctx.textAlign="center";
        ctx.fillText(lbl, x+W*0.09, H*0.42);
      });
      // Draw every message that has already fully completed travelling.
      messages.slice(0,msgStep).forEach((m,i) => {
        const y = H*(0.55+i*0.11);
        const fromX = m.from==="Phone"?W*0.21:W*0.76;
        const toX   = m.from==="Phone"?W*0.76:W*0.21;
        ctx.strokeStyle=m.color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(fromX,y); ctx.lineTo(toX,y); ctx.stroke();
        const tipDir = m.from==="Phone"?1:-1;
        ctx.beginPath(); ctx.moveTo(toX,y); ctx.lineTo(toX-tipDir*10,y-5); ctx.lineTo(toX-tipDir*10,y+5); ctx.fillStyle=m.color; ctx.fill();
        ctx.fillStyle=m.color; ctx.font="11px monospace"; ctx.textAlign="center";
        ctx.fillText(m.text,(fromX+toX)/2,y-6);
      });
      // Animate the currently in-flight message as a moving dot along
      // its line, advancing msgStep once it fully arrives.
      if (arrowT > 0 && msgStep < messages.length) {
        const m=messages[msgStep];
        const fromX=m.from==="Phone"?W*0.21:W*0.76;
        const toX=m.from==="Phone"?W*0.76:W*0.21;
        const y=H*(0.55+msgStep*0.11);
        const cx=fromX+(toX-fromX)*arrowT;
        ctx.strokeStyle=m.color; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(fromX,y); ctx.lineTo(cx,y); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx,y,4,0,Math.PI*2); ctx.fillStyle=m.color; ctx.fill();
        arrowT+=0.04;
        if(arrowT>=1){ msgStep++; arrowT=0; if(msgStep>=messages.length){ setInteracted(true); return; }}
        animRef.current=requestAnimationFrame(draw);
        return;
      }
      // Brief pause between each message before launching the next one.
      if(msgStep<messages.length && arrowT===0){ setTimeout(()=>{arrowT=0.01; requestAnimationFrame(draw);},500); }
    }
  }
  draw();
  // After 2.2s of "chaos", move on to revealing the shared rulebook.
  setTimeout(()=>{ cancelAnimationFrame(animRef.current); phase=1; draw(); },2200);
}

// The single source of truth for all 5 concept slides: each object
// bundles together everything ConceptSlide needs to render one
// concept — its index/title/color/term, the plain-English analogy and
// explanation text, which animation function drives its canvas, and
// how long (ms) before the "next" button unlocks.
const CONCEPTS = [
  {
    index:0, title:"The Internet is just computers talking to each other", color:C.blue, term:"Network",
    analogy:"🏘️ Think of it like a neighbourhood where every house has a telephone.",
    explain:"Two computers connected = a network. A million computers connected = the Internet. It started with just 4 computers in 1969. Today it's over 5 billion devices — all connected by cables, Wi-Fi, and satellites.",
    animate: animNetworkGrow, canvasHint:"Watch the network grow automatically",
    readyAfter:5000,
  },
  {
    index:1, title:"Every device has a unique address", color:C.purple, term:"IP Address",
    analogy:"📮 Like your home's door number — without it, no one knows where to deliver.",
    explain:"Every device online has a unique number called an IP address (e.g. 192.168.1.1). When you send a message, your device stamps this address on it so the reply knows where to come back to.",
    animate: animIPAddress, canvasHint:"Click each device to reveal its IP address",
    readyAfter:5000,
  },
  {
    index:2, title:"Data travels in small pieces, not whole", color:C.green, term:"Packets",
    analogy:"📰 Like tearing a newspaper into pages and mailing each page separately — faster, smarter.",
    explain:"Your 5 MB photo doesn't travel as one chunk. The internet breaks it into hundreds of tiny packets (each ~1,500 bytes), sends them separately — possibly through different routes — and reassembles them at the other end.",
    animate: animPackets, canvasHint:"Watch your file break apart and travel",
    readyAfter:6000,
  },
  {
    index:3, title:"Routers decide which road each packet takes", color:C.orange, term:"Router",
    analogy:"🚦 Like a traffic officer at a junction — reads the destination address and points the way.",
    explain:"Every packet passes through multiple routers on its journey. Each router reads the destination IP and decides the best next hop. If one road is blocked, it finds another — automatically.",
    animate: animRouter, canvasHint:"Click the correct road for each packet",
    readyAfter:8000,
  },
  {
    index:4, title:"All devices speak the same agreed language", color:C.teal, term:"Protocol (TCP/IP)",
    analogy:"🤝 Like agreeing to speak English in an international meeting — everyone understands everyone.",
    explain:"Without agreed rules, a Samsung phone couldn't talk to an Apple server. TCP/IP is the universal rulebook — every device on Earth follows it. TCP handles reliable delivery. IP handles addressing. Together they make the Internet work.",
    animate: animProtocol, canvasHint:"Watch what happens without and with shared rules",
    readyAfter:7000,
  },
];

// Stage2Build is the thin "page" wrapper around ConceptSlide: it just
// tracks which of the 5 CONCEPTS the student is currently viewing and
// advances through them, calling the stage's own onDone (passed down
// from the root component) once the 5th concept's "next" is clicked.
const Stage2Build = ({ onDone }) => {
  const [conceptIdx, setConceptIdx] = useState(0);
  const concept = CONCEPTS[conceptIdx];
  return (
    // `key={conceptIdx}` forces React to fully remount ConceptSlide on
    // every concept change, guaranteeing its internal `ready`/`interacted`
    // state and canvas animation are reset cleanly rather than reused.
    <ConceptSlide
      key={conceptIdx}
      concept={concept}
      onNext={() => {
        if (conceptIdx < CONCEPTS.length - 1) setConceptIdx(conceptIdx + 1);
        else onDone();
      }}
      isLast={conceptIdx === CONCEPTS.length - 1}
    />
  );
};

// ════════════════════════════════════════════════════════════════
//  STAGE 3 — SEE IT (Narrated replay of the Stage-1 WhatsApp journey)
// ────────────────────────────────────────────────────────────────
// This stage deliberately revisits the SAME WhatsApp scenario from
// Stage 1, but now slowed down into 7 discrete, narrated steps, with
// a toggle between "Plain English" and "Technical Terms" explanations
// for each step. This is the "now that you know the 5 concepts,
// here's how they all combine in the real journey" payoff stage.
// ════════════════════════════════════════════════════════════════

// The 7 steps of the journey, each with a plain-English explanation
// (for first-time intuition) and a technical explanation (revealed
// when the student toggles to "Technical Terms" view).
const JOURNEY_STEPS = [
  { id:0, label:"You press Send",        actor:"📱 Your Phone",    tech:"Application Layer",  color:C.blue,
    plain:"Your phone takes your WhatsApp message and prepares it to send.",
    tech_exp:"The app passes the message to the operating system's network stack." },
  { id:1, label:"Message cut into packets", actor:"📦 Packetiser", tech:"TCP — Segmentation", color:C.purple,
    plain:"The message is sliced into 3 small pieces. Each piece gets a number so they can be put back together.",
    tech_exp:"TCP breaks the data into segments, each with a sequence number for reassembly." },
  { id:2, label:"Your Wi-Fi router",      actor:"🔀 Home Router",  tech:"IP — Local Network", color:C.orange,
    plain:"Your home router gets the packets and sends them toward the internet.",
    tech_exp:"The router checks the destination IP and forwards packets to your ISP's gateway." },
  { id:3, label:"ISP receives packets",   actor:"🏢 ISP Server",   tech:"IP — Routing",       color:C.yellow,
    plain:"Your internet provider's server receives the packets and looks up the best path to WhatsApp's server.",
    tech_exp:"The ISP's backbone router uses BGP routing tables to find the optimal path." },
  { id:4, label:"Travelling undersea",   actor:"🌊 Undersea Cable", tech:"Physical Layer",    color:C.teal,
    plain:"Your packets travel as pulses of light through a fibre-optic cable under the ocean floor.",
    tech_exp:"Light travels at 200,000 km/s through glass fibre — reaching Frankfurt in ~40ms." },
  { id:5, label:"WhatsApp's server",     actor:"🖥 WA Data Centre", tech:"TCP — Reassembly",  color:C.green,
    plain:"All 3 packets arrive and are reassembled in order. WhatsApp now has your full message.",
    tech_exp:"TCP checks sequence numbers, requests any missing packets, then delivers to the app." },
  { id:6, label:"Friend's phone lights up", actor:"📱 Friend's Phone", tech:"Push Notification", color:C.blue,
    plain:"WhatsApp pushes the message to your friend's phone. Their screen lights up. ✓",
    tech_exp:"A push notification via Firebase wakes the app even if it's in the background." },
];

// Fixed (x,y) fractional positions for each of the 7 journey nodes,
// laid out in a gentle zig-zag left-to-right so the path reads
// naturally across the canvas width.
const NODE_POS = [
  {x:0.08,y:0.5},{x:0.25,y:0.25},{x:0.42,y:0.6},{x:0.58,y:0.35},{x:0.72,y:0.6},{x:0.85,y:0.3},{x:0.93,y:0.6},
];

const Stage3SeeIt = ({ onDone }) => {
  // step: index of the journey node currently highlighted (-1 = not
  // started yet). showTech: toggles plain-English vs technical text.
  // playing: whether the auto-advancing animation is currently running.
  // done: true once the packet has reached the final (7th) node.
  const [step, setStep] = useState(-1);
  const [showTech, setShowTech] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  // Holds the travelling packet's current pixel (x,y) — a ref because
  // it updates every animation frame and shouldn't trigger re-renders.
  const packetPos = useRef({ x: 0, y: 0 });
  // A separate boolean flag (not React state) that lets `pause()`
  // immediately halt the chained setTimeout/requestAnimationFrame
  // calls inside animateStep, even mid-flight.
  const animating = useRef(false);

  // Draws one frame of the node-and-path diagram: dashed/solid edges
  // depending on whether that segment has already been "visited",
  // each of the 7 nodes (grown/glowing if active, filled if past,
  // plain if upcoming), and the glowing travelling packet dot if one
  // is currently mid-flight (`pkt` argument).
  function drawScene(currentStep, pkt) {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,W,H);
    for (let i=0; i<NODE_POS.length-1; i++) {
      const a=NODE_POS[i], b=NODE_POS[i+1];
      ctx.beginPath(); ctx.moveTo(W*a.x,H*a.y); ctx.lineTo(W*b.x,H*b.y);
      ctx.strokeStyle = i < currentStep ? JOURNEY_STEPS[i].color+"88" : C.border;
      ctx.lineWidth = i < currentStep ? 2 : 1.5;
      ctx.setLineDash(i < currentStep ? [] : [4,4]);
      ctx.stroke(); ctx.setLineDash([]);
    }
    JOURNEY_STEPS.forEach((s, i) => {
      const n = NODE_POS[i]; const x=W*n.x, y=H*n.y;
      const active = i === currentStep;
      const past = i < currentStep;
      ctx.beginPath(); ctx.arc(x,y,active?22:16,0,Math.PI*2);
      ctx.fillStyle = active ? s.color+"44" : past ? s.color+"22" : C.card;
      ctx.fill();
      ctx.strokeStyle = active ? s.color : past ? s.color+"66" : C.border;
      ctx.lineWidth = active ? 3 : 1.5; ctx.stroke();
      ctx.font = active?"16px serif":"14px serif"; ctx.textAlign="center";
      ctx.fillText(s.actor.split(" ")[0], x, y+6);
      if (active || past) {
        ctx.fillStyle = s.color; ctx.font="bold 10px monospace"; ctx.textAlign="center";
        ctx.fillText(s.label.split(" ").slice(0,2).join(" "), x, y+(active?36:30));
      }
    });
    if (pkt && currentStep >= 0) {
      const g = ctx.createRadialGradient(pkt.x,pkt.y,0,pkt.x,pkt.y,14);
      g.addColorStop(0, C.yellow+"ff"); g.addColorStop(1, C.yellow+"00");
      ctx.beginPath(); ctx.arc(pkt.x,pkt.y,14,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      ctx.beginPath(); ctx.arc(pkt.x,pkt.y,5,0,Math.PI*2); ctx.fillStyle=C.yellow; ctx.fill();
      ctx.fillStyle=C.yellow; ctx.font="bold 9px monospace"; ctx.textAlign="center";
      ctx.fillText("PKT",pkt.x,pkt.y+18);
    }
  }

  // Recursively animates the packet travelling from the previous node
  // to `stepIdx`'s node (smoothly interpolated over ~33 frames), then
  // pauses 1.8s on arrival before calling itself again for the next
  // step — unless `animating.current` was flipped false by pause(),
  // in which case the chain simply stops.
  function animateStep(stepIdx) {
    if (stepIdx >= JOURNEY_STEPS.length) {
      setDone(true); setPlaying(false); animating.current=false; return;
    }
    setStep(stepIdx);
    animating.current = true;
    const from = stepIdx > 0 ? NODE_POS[stepIdx-1] : NODE_POS[0];
    const to   = NODE_POS[stepIdx];
    const canvas = canvasRef.current; if (!canvas) return;
    const W=canvas.width, H=canvas.height;
    let t=0;
    function tick() {
      t+=0.03;
      packetPos.current = { x: W*(from.x+(to.x-from.x)*Math.min(t,1)), y: H*(from.y+(to.y-from.y)*Math.min(t,1)) };
      drawScene(stepIdx, packetPos.current);
      if (t<1) animRef.current=requestAnimationFrame(tick);
      else {
        setTimeout(()=>{ if(animating.current) animateStep(stepIdx+1); }, 1800);
      }
    }
    requestAnimationFrame(tick);
  }

  // On first mount, size the canvas and draw the empty/unstarted state.
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = canvas.offsetWidth; canvas.height = 220;
    drawScene(-1, null);
  }, []);

  // "Play" button handler — starts (or resumes-from-scratch) the
  // 7-step animated journey.
  function play() {
    if (playing) return;
    setPlaying(true); setStep(0); setDone(false);
    animateStep(0);
  }
  // "Pause" stops the animation chain immediately (mid-flight if needed)
  // by flipping the `animating` ref flag and cancelling any pending frame.
  function pause() { animating.current=false; setPlaying(false); cancelAnimationFrame(animRef.current); }
  // "Replay" fully resets back to the unstarted state, ready for play() again.
  function replay() { cancelAnimationFrame(animRef.current); animating.current=false; setStep(-1); setDone(false); setPlaying(false); const canvas=canvasRef.current; if(canvas){canvas.width=canvas.offsetWidth; canvas.height=220; drawScene(-1,null);} }

  const current = step >= 0 && step < JOURNEY_STEPS.length ? JOURNEY_STEPS[step] : null;
  return (
    <div>
      <div style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:16}}>
        Remember the WhatsApp message from Stage 1? Let's slow it down and watch <em>exactly</em> what happens — step by step. Press Play and follow the yellow packet.
      </div>
      {/* Plain-English vs Technical-Terms toggle, applies to the
          narrator panel text on the right. */}
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <span style={{color:C.muted,fontSize:13}}>View:</span>
        <button onClick={()=>setShowTech(false)} style={{background:!showTech?C.blue+"22":"transparent",border:`1px solid ${!showTech?C.blue:C.border}`,color:!showTech?C.blue:C.muted,borderRadius:6,padding:"5px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Plain English</button>
        <button onClick={()=>setShowTech(true)}  style={{background:showTech?C.purple+"22":"transparent",border:`1px solid ${showTech?C.purple:C.border}`,color:showTech?C.purple:C.muted,borderRadius:6,padding:"5px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Technical Terms</button>
      </div>
      {/* Two-column layout: animated canvas (left, wider) + live
          narrator panel and step checklist (right). */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
          <canvas ref={canvasRef} style={{width:"100%",height:220,display:"block"}}/>
          <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            {!playing && !done && <Btn onClick={play} color={C.blue} small>▶ Play</Btn>}
            {playing && <Btn onClick={pause} color={C.orange} small outline>⏸ Pause</Btn>}
            <Btn onClick={replay} color={C.muted} small outline>↺ Replay</Btn>
          </div>
        </div>
        {/* Narrator panel: explains whatever step is currently active,
            in the selected (plain/technical) language. */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {step < 0 && !done && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
              <div style={{fontSize:32}}>📱</div>
              <div style={{color:C.muted,fontSize:13,textAlign:"center"}}>Press Play to follow your message's journey across the world</div>
            </div>
          )}
          {current && (
            <div style={{background:current.color+"0E",border:`1px solid ${current.color}44`,borderRadius:10,padding:16,flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:current.color}}/>
                <Tag color={current.color}>{showTech ? current.tech : `Step ${step+1} / ${JOURNEY_STEPS.length}`}</Tag>
              </div>
              <div style={{fontSize:22,marginBottom:8}}>{current.actor}</div>
              <div style={{fontSize:14,color:C.text,lineHeight:1.7,fontWeight:600,marginBottom:8}}>
                {current.label}
              </div>
              <div style={{fontSize:13,color:C.soft,lineHeight:1.7}}>
                {showTech ? current.tech_exp : current.plain}
              </div>
            </div>
          )}
          {/* Compact scrollable list of all 7 steps with their own
              individual completion state — gives a sense of "how much
              is left" beyond just the canvas animation. */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,maxHeight:160,overflowY:"auto"}}>
            {JOURNEY_STEPS.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0",borderBottom:i<JOURNEY_STEPS.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:i<step?s.color:i===step?s.color+"44":C.border,border:`1.5px solid ${i<=step?s.color:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:i<step?"#000":C.muted,flexShrink:0}}>
                  {i<step?"✓":i+1}
                </div>
                <span style={{fontSize:11,color:i===step?s.color:i<step?C.soft:C.muted}}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Summary callout + "next stage" button, only shown once the
          full 7-step journey has played through. */}
      {done && (
        <Bubble color={C.green} icon="✓" title="Full journey complete!">
          Your WhatsApp message travelled from Chennai through Mumbai, Dubai and Frankfurt —
          crossing an undersea cable — in about <strong>80 milliseconds</strong>.
          That's faster than a human blink (150ms). Now you know why.
        </Bubble>
      )}
      {done && (
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
          <Btn onClick={onDone} color={C.green}>I saw the full journey →</Btn>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  STAGE 4 — TRY IT ("Be the Router" mini-game)
// ────────────────────────────────────────────────────────────────
// Having WATCHED the journey in Stage 3, the student now actively
// routes a packet themselves across a small simulated network of
// cities, including a "sabotage" feature that breaks a link mid-game
// — forcing the student to notice the break and find an alternative
// path, which is the core intuition behind real-world internet
// routing resilience (packets can be re-routed if a link goes down).
// ════════════════════════════════════════════════════════════════

// The "map" for this mini-game: 6 city-nodes with fixed canvas
// positions (fractions of width/height, same pattern as Stage 3).
const CITY_NODES = [
  { id:"chennai",  label:"Chennai",  x:0.10, y:0.50 },
  { id:"mumbai",   label:"Mumbai",   x:0.30, y:0.20 },
  { id:"delhi",    label:"Delhi",    x:0.30, y:0.80 },
  { id:"dubai",    label:"Dubai",    x:0.55, y:0.50 },
  { id:"frankfurt",label:"Frankfurt",x:0.80, y:0.25 },
  { id:"london",   label:"London",   x:0.80, y:0.75 },
];
// Undirected edges between cities — this is the "network topology"
// the student can route through. Multiple paths exist on purpose
// (e.g. chennai→dubai→frankfurt AND chennai→mumbai→dubai→frankfurt)
// so that breaking one link still leaves an alternative route.
const CITY_EDGES = [
  ["chennai","mumbai"], ["chennai","delhi"], ["mumbai","dubai"],
  ["delhi","dubai"], ["dubai","frankfurt"], ["dubai","london"],
  ["frankfurt","london"],
];

const Stage4TryIt = ({ onDone }) => {
  const canvasRef = useRef(null);
  // path: the ordered list of city-ids the student has clicked so far,
  // always starting at "chennai" (the fixed source) and ending, once
  // complete, at "frankfurt" (the fixed destination).
  const [path, setPath] = useState(["chennai"]);
  // brokenEdge: a single [cityA,cityB] pair that has been disabled —
  // null until the "Simulate Outage" button is pressed.
  const [brokenEdge, setBrokenEdge] = useState(null);
  const [message, setMessage] = useState("Click Mumbai or Delhi to start routing your packet from Chennai.");
  const [success, setSuccess] = useState(false);
  const [usedRerouted, setUsedRerouted] = useState(false);

  // Checks whether an edge between two city ids exists in CITY_EDGES
  // AND is not the currently-broken edge.
  function edgeExists(a, b) {
    const isBroken = brokenEdge && ((brokenEdge[0]===a&&brokenEdge[1]===b)||(brokenEdge[0]===b&&brokenEdge[1]===a));
    if (isBroken) return false;
    return CITY_EDGES.some(([x,y])=> (x===a&&y===b)||(x===b&&y===a));
  }

  // Draws the current state of the mini-game: all edges (red-dashed
  // if broken, highlighted green if part of the student's chosen
  // path, grey otherwise), then all city nodes (highlighted if
  // visited, double-ringed for source/destination).
  function draw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle=C.surface; ctx.fillRect(0,0,W,H);
    const pos = id => { const n=CITY_NODES.find(c=>c.id===id); return {x:W*n.x,y:H*n.y}; };
    CITY_EDGES.forEach(([a,b])=>{
      const pa=pos(a), pb=pos(b);
      const broken = brokenEdge && ((brokenEdge[0]===a&&brokenEdge[1]===b)||(brokenEdge[0]===b&&brokenEdge[1]===a));
      const inPath = path.some((c,i)=> i<path.length-1 && ((path[i]===a&&path[i+1]===b)||(path[i]===b&&path[i+1]===a)));
      ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y);
      if (broken) { ctx.strokeStyle=C.red; ctx.setLineDash([5,5]); ctx.lineWidth=2; }
      else if (inPath) { ctx.strokeStyle=C.green; ctx.setLineDash([]); ctx.lineWidth=3; }
      else { ctx.strokeStyle=C.border; ctx.setLineDash([]); ctx.lineWidth=1.5; }
      ctx.stroke(); ctx.setLineDash([]);
      if (broken) {
        const mx=(pa.x+pb.x)/2, my=(pa.y+pb.y)/2;
        ctx.font="16px serif"; ctx.textAlign="center"; ctx.fillText("✕",mx,my);
      }
    });
    CITY_NODES.forEach(n=>{
      const p=pos(n.id);
      const visited = path.includes(n.id);
      const isSrc = n.id==="chennai", isDst = n.id==="frankfurt";
      ctx.beginPath(); ctx.arc(p.x,p.y,isSrc||isDst?20:16,0,Math.PI*2);
      ctx.fillStyle = visited ? (isDst?C.green:C.blue)+"33" : C.card;
      ctx.fill();
      ctx.strokeStyle = visited ? (isDst?C.green:C.blue) : C.border;
      ctx.lineWidth = isSrc||isDst?3:1.5; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font="bold 10px monospace"; ctx.textAlign="center";
      ctx.fillText(n.label, p.x, p.y+(isSrc||isDst?34:30));
      if (isSrc) { ctx.fillStyle=C.blue; ctx.font="9px monospace"; ctx.fillText("SOURCE",p.x,p.y-26); }
      if (isDst) { ctx.fillStyle=C.green; ctx.font="9px monospace"; ctx.fillText("DESTINATION",p.x,p.y-26); }
    });
  }

  useEffect(()=>{ const c=canvasRef.current; if(c){c.width=c.offsetWidth; c.height=260; draw();} }, [path, brokenEdge]);

  // Click handler: figures out which city (if any) was clicked, and
  // if it's validly reachable from the current path's last city
  // (i.e. an edge exists and isn't broken), extends the path. Reaching
  // "frankfurt" ends the game successfully.
  function handleClick(e) {
    if (success) return;
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const mx = e.clientX-rect.left, my = e.clientY-rect.top;
    const hit = CITY_NODES.find(n => Math.hypot(mx-canvas.width*n.x, my-canvas.height*n.y) < 22);
    if (!hit) return;
    const last = path[path.length-1];
    if (hit.id === last) return;
    if (!edgeExists(last, hit.id)) {
      setMessage(`🚫 No direct link from ${CITY_NODES.find(c=>c.id===last).label} to ${hit.label} right now. Try another city.`);
      return;
    }
    if (path.includes(hit.id)) { setMessage("You've already routed through there — try a city you haven't visited."); return; }
    const newPath = [...path, hit.id];
    setPath(newPath);
    if (hit.id === "frankfurt") {
      setSuccess(true);
      setMessage(`🎉 Packet delivered to Frankfurt via ${newPath.map(id=>CITY_NODES.find(c=>c.id===id).label).join(" → ")}!`);
    } else {
      setMessage(`Routed to ${hit.label}. Where next?`);
    }
  }

  // "Simulate Outage" button: picks the edge connecting Dubai and
  // Frankfurt (the most "obvious" direct route) and disables it,
  // forcing the student to discover the dubai→london→frankfurt detour
  // if they've already routed through (or are about to route through)
  // Dubai. Resets their path back to just the source so they must
  // re-route around the new outage from scratch.
  function simulateOutage() {
    setBrokenEdge(["dubai","frankfurt"]);
    setPath(["chennai"]);
    setSuccess(false);
    setUsedRerouted(true);
    setMessage("⚠️ Outage! The Dubai → Frankfurt link just went down. Find another way to deliver the packet.");
  }
  function reset() {
    setBrokenEdge(null); setPath(["chennai"]); setSuccess(false);
    setMessage("Click Mumbai or Delhi to start routing your packet from Chennai.");
  }

  return (
    <div>
      <div style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:16}}>
        Now <strong>you</strong> are the router. Click cities in order to route a packet from <span style={{color:C.blue}}>Chennai</span> to <span style={{color:C.green}}>Frankfurt</span>. You can only move along existing links (the grey lines).
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",marginBottom:12}}>
        <canvas ref={canvasRef} onClick={handleClick} style={{width:"100%",height:260,display:"block",cursor:success?"default":"pointer"}}/>
      </div>
      <Bubble color={success?C.green:usedRerouted?C.orange:C.blue} icon={success?"🎉":usedRerouted?"⚠️":"🧭"}>{message}</Bubble>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        {!brokenEdge && !success && <Btn onClick={simulateOutage} color={C.orange} outline small>⚡ Simulate an Outage</Btn>}
        <Btn onClick={reset} color={C.muted} outline small>↺ Reset</Btn>
      </div>
      {success && usedRerouted && (
        <Bubble color={C.purple} icon="💡" title="That's resilience!" style={{marginTop:12}}>
          Notice that even after the direct Dubai → Frankfurt link broke, your packet still got through —
          because the internet has <em>multiple paths</em> between most points. Real routers do this
          automatically, in milliseconds, without you ever noticing.
        </Bubble>
      )}
      {success && (
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
          <Btn onClick={onDone} color={C.green}>Great, I routed it →</Btn>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  STAGE 5 — CHALLENGE (two scored mini-challenges)
// ────────────────────────────────────────────────────────────────
// Challenge A: drag-and-drop vocabulary onto the correct slot in a
// sentence describing the WhatsApp journey, testing whether the
// student can map the 5 technical terms (Network, IP Address,
// Packets, Router, Protocol) onto their real role in the story.
// Challenge B: a short "find the broken node" diagnostic, testing
// whether the student understands what symptom a failure produces.
// Both challenges contribute to a single combined score shown at
// the end of Stage 5, before the student moves on to the Stage 6 quiz.
// ════════════════════════════════════════════════════════════════

// The 5 draggable vocabulary terms used in Challenge A, plus the
// sentence-with-blanks they need to be dropped into (`slotId` links
// each blank to the term that correctly fills it).
const CHALLENGE_A_TERMS = [
  { id:"network",  label:"Network" },
  { id:"ip",        label:"IP Address" },
  { id:"packets",   label:"Packets" },
  { id:"router",    label:"Router" },
  { id:"protocol",  label:"Protocol" },
];
const CHALLENGE_A_SLOTS = [
  { slotId:"network", before:"Your phone and your friend's phone are connected through a",          after:"of computers all over the world." },
  { slotId:"ip",        before:"Every device on that network has a unique address called an",         after:"so data knows where to go." },
  { slotId:"packets",   before:"Your message gets broken into small pieces called",                    after:"before it travels." },
  { slotId:"router",    before:"A device called a",                                                     after:"decides which path each piece should take." },
  { slotId:"protocol",  before:"Both ends agree to follow the same set of rules, called a",             after:"so the pieces can be understood and reassembled." },
];

const Stage5Challenge = ({ onDone }) => {
  // sub: which half of Stage 5 we're on — "a" (drag-drop) or "b" (diagnostic).
  const [sub, setSub] = useState("a");
  // placements: maps slotId -> the term id the student dropped there
  // (or undefined if that slot is still empty).
  const [placements, setPlacements] = useState({});
  // draggedId: which term chip is currently mid-drag (native HTML5 DnD).
  const [draggedId, setDraggedId] = useState(null);
  const [checkedA, setCheckedA] = useState(false);
  const [scoreA, setScoreA] = useState(0);

  function onDragStart(id) { setDraggedId(id); }
  function onDrop(slotId) {
    if (!draggedId) return;
    setPlacements(p => ({ ...p, [slotId]: draggedId }));
    setDraggedId(null);
  }
  // Tallies how many of the 5 slots currently hold the CORRECT term
  // (i.e. placements[slot.slotId] === slot.slotId, since slotId and
  // the correct term's id are deliberately the same string).
  function checkA() {
    let s = 0;
    CHALLENGE_A_SLOTS.forEach(slot => { if (placements[slot.slotId] === slot.slotId) s++; });
    setScoreA(s); setCheckedA(true);
  }
  // Which term ids have already been placed somewhere (so we can grey
  // them out / remove them from the "available chips" tray).
  const placedIds = Object.values(placements);

  // ── Challenge B state: a simple 4-option diagnostic question ──
  const [answerB, setAnswerB] = useState(null);
  const [checkedB, setCheckedB] = useState(false);
  const CORRECT_B = "router_down";
  const OPTIONS_B = [
    { id:"router_down", text:"A router along the path has gone offline — try an alternate route." },
    { id:"wrong_pw",     text:"The Wi-Fi password was typed incorrectly." },
    { id:"low_battery",  text:"The sender's phone battery is below 20%." },
    { id:"wrong_time",   text:"The clock on the sender's phone is set to the wrong time zone." },
  ];

  return (
    <div>
      {sub === "a" && (
        <>
          <div style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:16}}>
            <strong>Challenge A —</strong> Drag each term below into the blank where it belongs.
          </div>
          {/* Tray of draggable term chips — only shows terms not yet placed. */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20,minHeight:40}}>
            {CHALLENGE_A_TERMS.filter(t=>!placedIds.includes(t.id)).map(t=>(
              <div key={t.id} draggable onDragStart={()=>onDragStart(t.id)}
                style={{background:C.blue+"22",border:`1.5px solid ${C.blue}`,borderRadius:8,padding:"8px 14px",color:C.blue,fontSize:13,fontWeight:600,cursor:"grab"}}>
                {t.label}
              </div>
            ))}
            {placedIds.length === CHALLENGE_A_TERMS.length && !checkedA && (
              <div style={{color:C.muted,fontSize:13,fontStyle:"italic",padding:"8px 0"}}>All terms placed — click Check below.</div>
            )}
          </div>
          {/* The 5 fill-in-the-blank sentences, each blank being a
              drop target (onDragOver must preventDefault for onDrop
              to fire — standard HTML5 drag-and-drop requirement). */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {CHALLENGE_A_SLOTS.map(slot => {
              const filledId = placements[slot.slotId];
              const filledTerm = CHALLENGE_A_TERMS.find(t=>t.id===filledId);
              const correct = checkedA && filledId === slot.slotId;
              const wrong = checkedA && filledId && filledId !== slot.slotId;
              return (
                <div key={slot.slotId} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(slot.slotId)}
                  style={{background:C.card,border:`1.5px solid ${correct?C.green:wrong?C.red:C.border}`,borderRadius:8,padding:"12px 16px",fontSize:14,color:C.text,lineHeight:1.8}}>
                  {slot.before}{" "}
                  <span style={{display:"inline-block",minWidth:90,padding:"2px 10px",margin:"0 4px",borderRadius:6,background:filledTerm?C.blue+"33":C.bg,border:`1px dashed ${C.border}`,color:filledTerm?C.blue:C.muted,fontWeight:600,textAlign:"center"}}>
                    {filledTerm ? filledTerm.label : "_____"}
                  </span>{" "}
                  {slot.after}
                  {correct && <span style={{color:C.green,marginLeft:6}}>✓</span>}
                  {wrong && <span style={{color:C.red,marginLeft:6}}>✗</span>}
                </div>
              );
            })}
          </div>
          {!checkedA && (
            <Btn onClick={checkA} color={C.blue} disabled={placedIds.length < CHALLENGE_A_TERMS.length}>Check My Answers</Btn>
          )}
          {checkedA && (
            <>
              <Bubble color={scoreA===5?C.green:C.orange} icon={scoreA===5?"🎉":"📝"}>
                You got <strong>{scoreA} / 5</strong> correct{scoreA===5?" — perfect!":". Review the ✗ items above, then continue."}
              </Bubble>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
                <Btn onClick={()=>setSub("b")} color={C.blue}>Next: Challenge B →</Btn>
              </div>
            </>
          )}
        </>
      )}
      {sub === "b" && (
        <>
          <div style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:16}}>
            <strong>Challenge B —</strong> Your WhatsApp message is stuck "sending..." for 30 seconds and then fails.
            Everything else on your phone (browsing, other apps) works fine. What's the <em>most likely</em> cause?
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {OPTIONS_B.map(opt => {
              const picked = answerB === opt.id;
              const correct = checkedB && opt.id === CORRECT_B;
              const wrong = checkedB && picked && opt.id !== CORRECT_B;
              return (
                <button key={opt.id} onClick={()=>!checkedB && setAnswerB(opt.id)}
                  style={{textAlign:"left",background:picked?C.blue+"1A":C.card,border:`1.5px solid ${correct?C.green:wrong?C.red:picked?C.blue:C.border}`,borderRadius:8,padding:"12px 16px",color:C.text,fontSize:13.5,cursor:checkedB?"default":"pointer",fontFamily:"inherit"}}>
                  {opt.text}{correct&&" ✓"}{wrong&&" ✗"}
                </button>
              );
            })}
          </div>
          {!checkedB && <Btn onClick={()=>setCheckedB(true)} color={C.blue} disabled={!answerB}>Check Answer</Btn>}
          {checkedB && (
            <>
              <Bubble color={answerB===CORRECT_B?C.green:C.orange} icon={answerB===CORRECT_B?"✓":"💡"}>
                {answerB===CORRECT_B
                  ? "Correct! Since other internet-using apps work fine, the local network/Wi-Fi is fine — the failure is further along the path, most likely a routing problem."
                  : "Not quite. Since other apps that also need the internet are working, your Wi-Fi and local network are fine. The likely cause is a router failure somewhere further along the path."}
              </Bubble>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
                <Btn onClick={onDone} color={C.green}>Continue to Quiz →</Btn>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  STAGE 6 — QUIZ (4 scored multiple-choice questions + results)
// ────────────────────────────────────────────────────────────────
// The final, graded checkpoint for this lesson. Each question stores
// its own correct-option id and a short explanation shown after the
// student answers (regardless of right/wrong), reinforcing the concept
// either way. The results screen at the end shows per-question circles
// (green=correct, red=wrong) plus an overall score out of 4.
// ════════════════════════════════════════════════════════════════
const QUIZ = [
  { q:"What is the main job of a router?",
    options:[
      {id:"a",text:"To store all the world's websites"},
      {id:"b",text:"To decide which path a packet should take next"},
      {id:"c",text:"To translate text between languages"},
      {id:"d",text:"To charge your phone over Wi-Fi"},
    ], correct:"b",
    explain:"A router reads a packet's destination IP address and forwards it along the best available path — like a postal sorting office deciding which truck a parcel goes on." },
  { q:"Why is a message broken into multiple packets instead of being sent as one big piece?",
    options:[
      {id:"a",text:"It makes the message more secure from hackers"},
      {id:"b",text:"Smaller pieces can travel via different routes and be error-checked individually, making delivery faster and more reliable"},
      {id:"c",text:"Phones cannot store large messages"},
      {id:"d",text:"It is required by law in most countries"},
    ], correct:"b",
    explain:"Packet-switching lets pieces of data travel independently and be reassembled at the destination — if one packet is lost or delayed, only that piece needs to be resent, not the whole message." },
  { q:"What does an IP address do?",
    options:[
      {id:"a",text:"Uniquely identifies a device on a network so data knows where to go"},
      {id:"b",text:"Encrypts your messages"},
      {id:"c",text:"Speeds up your internet connection"},
      {id:"d",text:"Stores your contacts"},
    ], correct:"a",
    explain:"Just like a street address tells a postal worker exactly which house to deliver to, an IP address tells routers exactly which device on the network a packet is meant for." },
  { q:"Why do both ends of a connection need to agree on the same protocol (e.g. TCP/IP)?",
    options:[
      {id:"a",text:"So the government can monitor traffic"},
      {id:"b",text:"It's only a tradition, not a technical necessity"},
      {id:"c",text:"So both sides interpret the data the same way and can request missing pieces"},
      {id:"d",text:"To make websites load with nicer fonts"},
    ], correct:"c",
    explain:"A protocol is a shared rulebook — without it, one device might send data in a structure the other device can't parse, the same way two people speaking different languages can't understand each other." },
];

const Stage6Quiz = ({ onDone }) => {
  // idx: which quiz question is currently shown (0..3).
  const [idx, setIdx] = useState(0);
  // answers: ordered list of the option-id the student picked for
  // each question answered so far (grows as they progress).
  const [answers, setAnswers] = useState([]);
  // picked: the option currently selected for the *current* question,
  // before "Check" is pressed (kept separate from `answers` so we can
  // show the right/wrong highlight before committing it).
  const [picked, setPicked] = useState(null);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = QUIZ[idx];

  function check() { setChecked(true); }
  function next() {
    const newAnswers = [...answers, picked];
    setAnswers(newAnswers);
    setPicked(null); setChecked(false);
    if (idx + 1 < QUIZ.length) setIdx(idx+1);
    else setFinished(true);
  }

  // Score is simply how many of the recorded answers match each
  // question's `correct` id, computed once the quiz is finished.
  const score = answers.reduce((s,a,i)=> s + (a===QUIZ[i].correct?1:0), 0);

  if (finished) {
    return (
      <div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:42,marginBottom:8}}>{score===QUIZ.length?"🏆":score>=QUIZ.length/2?"👍":"📚"}</div>
          <div style={{fontSize:26,fontWeight:700,color:C.text}}>{score} / {QUIZ.length}</div>
          <div style={{color:C.muted,fontSize:14,marginTop:4}}>
            {score===QUIZ.length ? "Perfect score — you've mastered this unit!" : score>=QUIZ.length/2 ? "Good work — review the explanations below for anything you missed." : "Worth a second look — re-read the explanations below, then revisit the lesson if needed."}
          </div>
        </div>
        {/* Per-question recap: shows the question, the student's pick,
            the correct answer (if they got it wrong), and the explanation —
            so the quiz doubles as a final teaching moment, not just a score. */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {QUIZ.map((q,i) => {
            const correct = answers[i] === q.correct;
            return (
              <div key={i} style={{background:C.card,border:`1px solid ${correct?C.green+"55":C.red+"55"}`,borderRadius:10,padding:14}}>
                <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:correct?C.green:C.red,color:"#000",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {correct?"✓":"✗"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:C.text,fontWeight:600,marginBottom:4}}>{q.q}</div>
                    <div style={{fontSize:12.5,color:C.muted,lineHeight:1.6}}>{q.explain}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
          <Btn onClick={onDone} color={C.green}>Finish Unit 1.1 →</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator across the 4 questions. */}
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {QUIZ.map((_,i)=>(
          <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<idx?C.green:i===idx?C.blue:C.border}}/>
        ))}
      </div>
      <div style={{color:C.muted,fontSize:12,fontFamily:"monospace",marginBottom:6}}>QUESTION {idx+1} OF {QUIZ.length}</div>
      <div style={{fontSize:16,color:C.text,fontWeight:600,marginBottom:16,lineHeight:1.6}}>{current.q}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {current.options.map(opt => {
          const isPicked = picked === opt.id;
          const isCorrect = checked && opt.id === current.correct;
          const isWrong = checked && isPicked && opt.id !== current.correct;
          return (
            <button key={opt.id} onClick={()=>!checked && setPicked(opt.id)}
              style={{textAlign:"left",background:isPicked?C.blue+"1A":C.card,border:`1.5px solid ${isCorrect?C.green:isWrong?C.red:isPicked?C.blue:C.border}`,borderRadius:8,padding:"12px 16px",color:C.text,fontSize:13.5,cursor:checked?"default":"pointer",fontFamily:"inherit"}}>
              {opt.text}{isCorrect&&" ✓"}{isWrong&&" ✗"}
            </button>
          );
        })}
      </div>
      {!checked && <Btn onClick={check} color={C.blue} disabled={!picked}>Check Answer</Btn>}
      {checked && (
        <>
          <Bubble color={picked===current.correct?C.green:C.orange} icon={picked===current.correct?"✓":"💡"}>
            {current.explain}
          </Bubble>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
            <Btn onClick={next} color={C.blue}>{idx+1<QUIZ.length?"Next Question →":"See Results →"}</Btn>
          </div>
        </>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  ROOT COMPONENT — export default function Unit1_1()
// ────────────────────────────────────────────────────────────────
// This is the component App.jsx imports and renders once a student
// is logged in: `import Unit1_1 from './components/Unit1_1_Redesign'`
// followed by `<Unit1_1 student={student}/>`. It owns the master
// "which of the 6 stages are we on" state and renders the JourneyPath
// stepper (imported from earlier in this file) plus whichever stage
// component is currently active, wiring each stage's `onDone` callback
// to advance to the next stage.
// ════════════════════════════════════════════════════════════════
export default function Unit1_1({ student, onUnitComplete }) {
  // stage: 0=Hook, 1=Build, 2=SeeIt, 3=TryIt, 4=Challenge, 5=Quiz,
  // 6=fully completed (shows the final "lesson complete" screen).
  const [stage, setStage] = useState(0);
  // completed: a Set of stage indices the student has already finished —
  // drives the checkmarks in JourneyPath.
  const [completed, setCompleted] = useState(new Set());
  // calledRef + the effect below fire onUnitComplete exactly once, the
  // moment `stage` crosses past the last real stage (i.e. quiz done).
  //
  // BUG FIX (see /docs note in ADDING_NEW_LESSON.md "Rules of Hooks"
  // section): this useRef/useEffect pair used to live INSIDE the
  // `if (stage >= STAGE_TITLES.length) {...}` block below, which broke
  // React's Rules of Hooks — hooks must run in the exact same order on
  // every render, never inside a conditional. Because this component
  // calls 2 hooks (useState x2) on every normal-stage render but would
  // have called 4 hooks (+useRef +useEffect) only once stage reached 6,
  // React detected a mismatched hook count the instant the student
  // finished the quiz and threw "Rendering more hooks than during the
  // previous render" — crashing to a blank screen with no error
  // boundary to catch it. That crash is exactly why finishing Unit1_1
  // never returned to the Dashboard: the component never got to call
  // onUnitComplete() or render anything else. Moving both hooks to the
  // top level (unconditional) and putting the "only fire once, only
  // past the last stage" logic INSIDE the effect body instead fixes it.
  const calledRef = useRef(false);
  useEffect(() => {
    if (stage >= STAGE_TITLES.length && !calledRef.current) {
      calledRef.current = true;
      onUnitComplete?.();
    }
  }, [stage]);

function advanceFrom(stageIdx) {
  setCompleted(c => {
    const next = new Set(c);
    next.add(stageIdx);
    return next;
  });
  setStage(stageIdx + 1);
}
  // Renders whichever stage component matches the current `stage`
  // index, each wired to call advanceFrom(<its own index>) on completion.
  function renderStage() {
    switch (stage) {
      case 0: return <Stage1Hook onDone={()=>advanceFrom(0)} />;
      case 1: return <Stage2Build onDone={()=>advanceFrom(1)} />;
      case 2: return <Stage3SeeIt onDone={()=>advanceFrom(2)} />;
      case 3: return <Stage4TryIt onDone={()=>advanceFrom(3)} />;
      case 4: return <Stage5Challenge onDone={()=>advanceFrom(4)} />;
      case 5: return <Stage6Quiz onDone={()=>advanceFrom(5)} />;
      default: return null;
    }
  }

  const STAGE_TITLES = [
    "Hook — A Message Across the World",
    "Build — The 5 Core Concepts",
    "See It — The Full Journey, Narrated",
    "Try It — Be the Router",
    "Challenge — Test Your Understanding",
    "Quiz — Final Checkpoint",
  ];

  // Once stage advances past index 5 (the quiz), show the lesson's
  // completion screen instead of any stage component.
  if (stage >= STAGE_TITLES.length) {
    // onUnitComplete() is now fired by the top-level useEffect declared
    // earlier in this component (right after useState) — NOT here. See
    // the long comment up there for why it had to move: this used to be
    // a useRef+useEffect pair called only inside this if-block, which
    // violated React's Rules of Hooks and crashed the app the instant a
    // student reached this screen (a blank page, no navigation back to
    // Dashboard — exactly the bug being fixed).
    return (
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI', system-ui, sans-serif",padding:24}}>
        <div style={{textAlign:"center",maxWidth:480}}>
          <div style={{fontSize:64,marginBottom:16}}>🎓</div>
          <div style={{fontSize:26,fontWeight:700,color:C.text,marginBottom:8}}>Unit 1.1 Complete!</div>
          <div style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:24}}>
            {student?.name ? `Nice work, ${student.name}.` : "Nice work."} You now understand how the
            internet moves data using networks, IP addresses, packets, routers, and protocols —
            and you've practiced it hands-on. This progress can be reported back to your instructor automatically.
          </div>
          <Btn onClick={()=>{ setStage(0); setCompleted(new Set()); }} color={C.blue} outline>↺ Replay This Unit</Btn>
        </div>
      </div>
    );
  }

  return (
    // Outer page wrapper: dark theme background filling the full
    // viewport height, with a sticky header (progress bar + stepper)
    // that stays visible while the student scrolls through long stage
    // content below it, then the stage card itself.
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI', system-ui, sans-serif",color:C.text}}>
      {/* ── Sticky header: title, overall progress bar, JourneyPath stepper ── */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.bg+"F2",backdropFilter:"blur(6px)",borderBottom:`1px solid ${C.border}`,padding:"16px 24px"}}>
        <div style={{maxWidth:980,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",letterSpacing:1}}>MODULE 1 · UNIT 1.1</div>
            <div style={{fontSize:12,color:C.muted}}>Stage {stage+1} of {STAGE_TITLES.length}</div>
          </div>
          {/* Overall progress bar: fraction of stages completed so far. */}
            <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden",marginBottom:14}}>
            <div style={{height:"100%",width:`${(completed.size/STAGE_TITLES.length)*100}%`,background:`linear-gradient(90deg, ${C.blue}, ${C.green})`,transition:"width 0.4s"}}/>
          </div>
          <JourneyPath current={stage} completed={completed} />
        </div>
      </div>
      {/* ── Main stage content area ── */}
      <div style={{maxWidth:980,margin:"0 auto",padding:"28px 24px 60px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          {/* "Back" button: only usable once past stage 0, lets the
              student revisit an earlier (already-completed) stage. */}
          {stage > 0 && (
            <button onClick={()=>setStage(s=>Math.max(0,s-1))}
              style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              ← Back
            </button>
          )}
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>{STAGE_TITLES[stage]}</div>
        </div>
        {/* ── Card containing the current stage's component ── */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:28}}>
          {renderStage()}
        </div>
      </div>
    </div>
  );
}
