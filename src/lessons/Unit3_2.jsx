// ============================================================================
//  UNIT 3.2 — "Colours, Fonts & Spacing"
//  Module: M3 — CSS Styling (second unit, follows Unit3_1 Selectors & Cascade)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx the same way as every sibling lesson: App.jsx
//    looks up "Unit3_2" in config/course.config.js, renders this component
//    with { student, onUnitComplete }, and waits for exactly one call to
//    onUnitComplete() — fired at the end of the quiz — before saving progress
//    and unlocking Unit3_3 (Flexbox).
//  - Never imports api.js or gas.config.js — only App.jsx talks to the
//    backend, by design (see ADDING_NEW_LESSON.md at the repo root).
//
//  TEACHING DESIGN — same six-stage shell as every other unit, so the
//  course feels consistent no matter which lesson a student is on:
//    Stage 0  SPARK      — curiosity question before any teaching.
//    Stage 1  BUILD      — five concepts: colour formats → typography →
//                           the box model → CSS units → why consistency
//                           matters — timer-gated, Plain⇄Tech toggle.
//    Stage 2  SEE IT     — the box model built up live, LAYER BY LAYER
//                           (content → padding → border → margin), with a
//                           real-looking nested-box diagram that grows as
//                           each layer is added — making "the box model" a
//                           visible structure instead of a memorized list.
//    Stage 3  TRY IT     — actual interactive sliders for padding, margin,
//                           border-width and font-size, with a live preview
//                           box that resizes in real time as the student
//                           drags — turning the box model into something
//                           they manipulate with their own hands.
//    Stage 4  CHALLENGE  — tag-matching (unit → best use case), then a
//                           "spot the bug" hunt where the bug is a wrong
//                           unit choice (e.g. a fixed px font-size that
//                           breaks responsive scaling).
//    Stage 5  QUIZ       — 10 questions. Wrong answers never reveal the
//                           correct option — an escalating hint shows
//                           instead, and the hint is ALWAYS visible on every
//                           wrong attempt (never disappears once the hint
//                           array runs out — it just stays pinned at the
//                           final, most specific hint).
//
//  MOBILE-FRIENDLINESS: no fixed pixel widths; %, flexWrap, clamp() are used
//  throughout so every stage works on a phone, matching the rest of the
//  course.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit3_2({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ────────────────────────────────────────────────────
  // Single source of truth for which of the six screens is showing.
  const [stage, setStage] = useState(0); // 0 Spark · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

  // ── SPARK stage state ──────────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD stage state ──────────────────────────────────────────────────────
  // Same pattern as Unit3_1: buildConcept selects which of the 5 concepts is
  // showing, conceptUnlocked gates later ones behind a countdown so students
  // can't speed-skip, buildMode toggles Plain-English vs Technical phrasing.
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT stage state ──────────────────────────────────────────────────────
  // seeitStep walks through the box model being assembled layer by layer
  // (content → padding → border → margin); seeitMode toggles narration text.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT stage state ──────────────────────────────────────────────────────
  // Four live sliders the student drags, each feeding directly into the
  // preview box's inline style further down — real cause-and-effect, not a
  // simulation. tryItInteracted counts how many sliders they've actually
  // moved away from their defaults, gating the "Take the Challenge" button
  // so students engage with the box model hands-on before moving on.
  const [padding, setPadding] = useState(16);
  const [margin, setMargin] = useState(12);
  const [borderWidth, setBorderWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [tryItTouched, setTryItTouched] = useState({ padding: false, margin: false, border: false, font: false });

  // ── CHALLENGE stage state ──────────────────────────────────────────────────
  const [challengePhase, setChallengePhase] = useState(0); // 0 = tag match, 1 = bug hunt
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ stage state ────────────────────────────────────────────────────────
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // ── shared timer ref + looping animation frame ─────────────────────────────
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: the five Build-stage concepts ─────────────────────────────────
  const concepts = [
    {
      title: "Colour Formats — Naming the Same Colour Different Ways",
      plain: "CSS lets you write a colour in several equivalent ways: a NAMED colour like \"tomato\", a HEX code like #ff6347, or RGB/HSL like rgb(255,99,71) or hsl(9,100%,64%). They're all just different ways of saying the exact same colour — pick whichever is easiest to reason about for the job at hand.",
      technical: "Named colours (147 keywords), hexadecimal (#RRGGBB or #RGB shorthand), rgb()/rgba() (red, green, blue 0-255, optional alpha), and hsl()/hsla() (hue 0-360°, saturation %, lightness %, optional alpha) are all interchangeable colour representations. HSL is often preferred for design work because lightness/saturation map directly to how humans perceive colour adjustments.",
      unlock: 8,
    },
    {
      title: "Typography — font-family, font-size, font-weight & line-height",
      plain: "font-family picks the TYPEFACE (always list a fallback in case the first font isn't installed). font-size is how BIG the text is. font-weight controls boldness (400 = normal, 700 = bold). line-height controls the vertical breathing room between lines — too tight and paragraphs feel cramped, too loose and they feel disconnected.",
      technical: "font-family accepts a comma-separated fallback stack, ending in a generic family (serif/sans-serif/monospace) as a final safety net. font-weight is numeric (100-900) in modern CSS, though 'normal'/'bold' keywords still work. line-height is unitless by best practice (a multiplier of font-size) so it scales correctly if font-size changes, rather than a fixed px value that wouldn't.",
      unlock: 9,
    },
    {
      title: "The Box Model — Content, Padding, Border & Margin",
      plain: "Every single HTML element is secretly a box made of four nested layers: the CONTENT itself, PADDING (space INSIDE the border, between the border and the content), the BORDER itself, and MARGIN (space OUTSIDE the border, pushing other elements away). Understanding these four layers explains almost every spacing mystery in CSS.",
      technical: "The CSS box model defines an element as four nested rectangles: content-box, padding-box, border-box, and margin-box (working outward). By default, width/height apply to the content-box only — padding and border ADD to the element's rendered size unless box-sizing: border-box is set, which instead makes width/height include padding and border.",
      unlock: 10,
    },
    {
      title: "Units — px, %, em, rem & viewport units",
      plain: "px is an absolute, fixed-size unit. % is relative to the parent's size. em is relative to the CURRENT element's own font-size (and compounds when nested!). rem is relative to the ROOT (<html>) font-size — which is why most professional CSS prefers rem for sizing, since it doesn't compound unexpectedly. vw/vh are relative to the browser viewport's width/height — useful for full-screen sections.",
      technical: "px is a fixed visual unit, unaffected by font-size context. Percentage (%) resolves against the relevant dimension of the containing block. em is relative to the computed font-size of the element it's used on (compounding through nested elements with their own em-based font-size). rem is relative ONLY to the root element's font-size, avoiding compounding — the most predictable unit for scalable, accessible sizing. vw/vh are 1% of the viewport's width/height respectively.",
      unlock: 10,
    },
    {
      title: "Why It Matters — Consistency & Responsive Design",
      plain: "Picking the right unit and a consistent colour/spacing system is what makes a site feel polished instead of randomly thrown together — and it's what makes a layout actually adapt gracefully to a phone screen instead of overflowing or becoming unreadably tiny.",
      technical: "A disciplined colour palette (often defined once as CSS custom properties), a deliberate type scale, and consistent use of relative units (rem/%/clamp()) together form the foundation of a maintainable, responsive design system — this is the groundwork every later topic in this module (Flexbox, Grid) builds visual layouts on top of.",
      unlock: 9,
    },
  ];

  // ── CONTENT: Quiz bank — 10 questions ──────────────────────────────────────
  const quizQuestions = [
    {
      q: "Which of these is NOT a valid way to express the same idea of \"a colour\" in CSS?",
      options: ["#ff6347", "rgb(255, 99, 71)", "hsl(9, 100%, 64%)", "color(tomato, bright)"],
      answer: 3,
      hints: [
        "Three of these four are real, standard CSS colour syntaxes covered in the lesson.",
        "Hex, rgb(), and hsl() are all real — but one option uses a made-up function name.",
        "color(tomato, bright) isn't real CSS syntax — valid formats are named colours, hex, rgb()/rgba(), and hsl()/hsla().",
      ],
      explanation: "Hex codes, rgb()/rgba(), hsl()/hsla(), and named colours are all valid CSS colour formats — color(tomato, bright) is not real CSS syntax.",
    },
    {
      q: "Why should you always list a fallback font after your preferred font-family?",
      options: [
        "It makes the page load faster",
        "It's required syntax — CSS errors without one",
        "If the first font isn't installed/available on the user's device, the browser falls back to the next one in the list",
        "It changes the font's colour automatically",
      ],
      answer: 2,
      hints: [
        "Think about what happens if a visitor's device simply doesn't have your first-choice font installed.",
        "The font-family value is really a PRIORITY LIST, not a single forced choice.",
        "Listing fallbacks (ending in a generic family like sans-serif) ensures text still renders sensibly even if the preferred font is unavailable.",
      ],
      explanation: "font-family is a fallback list: the browser tries each font in order until it finds one it can actually use, which is why ending the list with a generic family (serif/sans-serif/monospace) is best practice.",
    },
    {
      q: "In the box model, where does PADDING sit relative to the border?",
      options: ["Outside the border, pushing other elements away", "Inside the border, between the border and the content", "It replaces the border entirely", "Padding and border are the same thing"],
      answer: 1,
      hints: [
        "Picture the four nested layers in order, from the inside out: content, then padding, then border, then margin.",
        "Padding is one layer IN from the border — it cushions the content from the border, not the other way around.",
        "Padding sits between the content and the border — it's the inner cushioning, while margin is the outer spacer beyond the border.",
      ],
      explanation: "Working outward from the center, the box model layers are: content, padding, border, margin. Padding is the inner cushioning between the content and the border; margin is the space beyond the border, pushing neighbouring elements away.",
    },
    {
      q: "By default (without box-sizing: border-box), what happens to an element's RENDERED size when you add padding?",
      options: [
        "Nothing changes — width/height always include padding automatically",
        "The padding shrinks the content area but the overall box stays the declared width",
        "The padding ADDS to the declared width/height, making the box render bigger than you set",
        "Padding is visually invisible and has no effect on size at all",
      ],
      answer: 2,
      hints: [
        "By default, width/height only describe the CONTENT box — padding and border are extra, added on top.",
        "This is exactly the surprising behaviour that box-sizing: border-box exists to fix.",
        "Without border-box, padding and border ADD to your declared width/height — a 200px-wide box with 20px padding actually renders 240px wide (20px on each side).",
      ],
      explanation: "By default, width/height apply only to the content box. Padding and border add extra size on top of that — which is why box-sizing: border-box (making width/height include padding+border) is so commonly used.",
    },
    {
      q: "Which CSS unit is relative to the ROOT (<html>) element's font-size, and therefore does NOT compound when nested?",
      options: ["px", "em", "rem", "%"],
      answer: 2,
      hints: [
        "One of these units is famous for 'compounding' awkwardly the deeper you nest elements — this is NOT that unit.",
        "Think 'root em' — the name is almost literally a hint.",
        "rem is always relative to the root <html> element's font-size, no matter how deeply nested the element using it is — unlike em, which compounds through nested font-size values.",
      ],
      explanation: "rem is relative only to the root element's font-size, so it stays predictable no matter how deeply an element is nested — unlike em, which compounds through every ancestor's own font-size.",
    },
    {
      q: "What does the unit \"vh\" represent in CSS?",
      options: ["1% of the parent element's height", "1% of the root font-size", "1% of the viewport's (browser window's) height", "A fixed 1-pixel unit"],
      answer: 2,
      hints: [
        "The 'v' in vh and vw stands for 'viewport' — not 'value' or 'vertical'.",
        "This unit is about the visible BROWSER WINDOW, not any particular element on the page.",
        "1vh = 1% of the current viewport's height; similarly 1vw = 1% of the viewport's width. Useful for full-screen sections that should always fill the visible window.",
      ],
      explanation: "vh and vw are viewport-relative units: 1vh equals 1% of the browser viewport's height, 1vw equals 1% of its width — independent of any specific parent element.",
    },
    {
      q: "Why is line-height usually written as a unitless number (like 1.6) rather than a fixed px value?",
      options: [
        "Unitless values render faster in every browser",
        "A unitless value acts as a MULTIPLIER of the element's own font-size, so it scales correctly if font-size ever changes",
        "Fixed px line-height values are not supported by CSS at all",
        "There's no real difference, it's purely a style preference",
      ],
      answer: 1,
      hints: [
        "Think about what happens to a FIXED px line-height if you later increase the font-size on that same element or its children.",
        "A unitless line-height is computed as font-size × that number — it AUTOMATICALLY adjusts as font-size changes.",
        "Unitless line-height scales proportionally with font-size, which is exactly why it's the recommended approach — a fixed px value wouldn't keep up if font-size changes anywhere in the cascade.",
      ],
      explanation: "A unitless line-height value is a multiplier of the element's own font-size, so it automatically stays proportional even if font-size changes — a fixed px value would not adapt the same way.",
    },
    {
      q: "A design needs a colour that's easy to lighten or darken predictably for hover states. Which format makes that easiest to reason about?",
      options: ["Hex (#ff6347)", "Named colour (tomato)", "HSL (hsl(9, 100%, 64%))", "All formats are equally easy for this"],
      answer: 2,
      hints: [
        "Think about which format has a component that DIRECTLY represents how light or dark a colour is, as a simple percentage.",
        "Hex and rgb() require recalculating multiple numbers together to lighten/darken predictably; one format isolates lightness into a single, separate value.",
        "HSL separates Hue, Saturation, and Lightness — tweaking just the Lightness percentage lightens/darkens the colour predictably, without needing to recompute red/green/blue together.",
      ],
      explanation: "HSL's third value is Lightness as a direct percentage, making it the easiest format to predictably lighten or darken a colour (e.g. for hover states) without recalculating multiple interdependent numbers.",
    },
    {
      q: "Why does a disciplined, consistent spacing/colour system matter for a real website, beyond just looking nicer?",
      options: [
        "It has no real benefit beyond aesthetics",
        "It makes the page's CSS file smaller in every case",
        "It makes the design predictable and maintainable, and helps the layout adapt gracefully across screen sizes",
        "It is required by all web browsers to render at all",
      ],
      answer: 2,
      hints: [
        "Think beyond pure visual polish — what happens to a RANDOMLY-spaced layout when the screen size changes?",
        "Consistency is what makes a layout's behaviour PREDICTABLE, including how it should respond on a smaller screen.",
        "A consistent system (relative units, a defined colour palette, a deliberate type scale) is the foundation that responsive techniques like Flexbox and Grid (later units) build on top of — without it, layouts become fragile.",
      ],
      explanation: "Consistency in spacing, colour, and units isn't just aesthetic — it makes a layout predictable to maintain and gives it a solid foundation to adapt responsively, which later topics (Flexbox, Grid) depend on.",
    },
    {
      q: "An element has width: 200px and padding: 20px, with the default box-sizing (content-box). How wide does it actually render?",
      options: ["200px", "220px", "240px", "180px"],
      answer: 2,
      hints: [
        "Remember: with the DEFAULT box-sizing, padding adds to the declared width rather than being included inside it.",
        "Padding is applied on BOTH sides of the content — left and right — not just once.",
        "200px content + 20px padding on the left + 20px padding on the right = 240px total rendered width, since content-box doesn't include padding in the declared width.",
      ],
      explanation: "With the default box-sizing: content-box, padding adds to the declared width on both sides: 200px + 20px (left) + 20px (right) = 240px total rendered width.",
    },
  ];

  // ── Concept unlock timer (Build stage) ─────────────────────────────────────
  useEffect(() => {
    if (stage !== 1) return;
    const c = concepts[buildConcept];
    setConceptTimer(c.unlock);
    timerRef.current = setInterval(() => {
      setConceptTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setConceptUnlocked((prev) => {
            const next = [...prev];
            if (buildConcept + 1 < concepts.length) next[buildConcept + 1] = true;
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildConcept, stage]);

  // ── Looping animation frame (Build & See-It stages) ────────────────────────
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — the box model assembled layer by layer ──────────────
  // Each step adds ONE more layer to the nested-box diagram rendered in
  // renderSeeIt(); `layers` tells the diagram which of content/padding/
  // border/margin are currently "present" so far.
  const seeitSteps = [
    { plain: "Every box starts with its CONTENT — text, an image, whatever's inside.", tech: "Layer 1: content-box.", layers: ["content"] },
    { plain: "Add PADDING — breathing room INSIDE the border, around the content.", tech: "Layer 2: padding-box wraps content-box.", layers: ["content", "padding"] },
    { plain: "Add a BORDER — a visible line drawn around the padding.", tech: "Layer 3: border-box wraps padding-box.", layers: ["content", "padding", "border"] },
    { plain: "Add MARGIN — space OUTSIDE the border, pushing neighbouring elements away.", tech: "Layer 4: margin-box wraps border-box — the full, final footprint of the element.", layers: ["content", "padding", "border", "margin"] },
  ];

  // ── CONTENT: Challenge 1 — unit-to-use-case matching ───────────────────────
  const ch1Pairs = [
    { code: "rem", meaning: "Best default choice for font-size — scales predictably, doesn't compound" },
    { code: "%", meaning: "Sizes an element relative to its parent's dimension" },
    { code: "vh", meaning: "Makes a section always fill the full visible browser height" },
    { code: "px", meaning: "A fixed, absolute size that never changes with context" },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: a unit choice that breaks
  // accessibility/responsiveness. ────────────────────────────────────────────
  const bugLines = [
    { text: "h1 { font-size: 2.5rem; }", buggy: false },
    { text: "body { font-size: 16px; }", buggy: false },
    { text: "p { font-size: 14px; line-height: 22px; }", buggy: true, why: "Fixing both font-size AND line-height in raw px breaks the relationship between them — if anything upstream changes the effective text scale (browser zoom, user font-size preferences, accessibility settings), the line-height won't scale along with it, and lines can start overlapping or feel oddly cramped. Using rem for font-size and a unitless line-height (e.g. 1.6) keeps them proportional automatically." },
    { text: ".container { max-width: 1100px; width: 100%; }", buggy: false },
  ];

  // ── STYLES — kept visually identical to the rest of the course ────────────
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8 },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: (active, done) => ({
      padding: "3px 9px", borderRadius: 99, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none", whiteSpace: "nowrap",
    }),
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px 12px", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 130, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📦</div>
        <div style={s.h2}>You set width: 200px and padding: 20px on a box.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          No other CSS is applied. <strong style={{ color: "#f1f5f9" }}>How wide does that box actually render on screen?</strong>
        </div>
      </div>
      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["200px wide", "180px wide", "240px wide", "220px wide"].map((opt) => (
              <div key={opt} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>✅ Let's find out!</div>
          <div style={s.p}>
            {sparkGuess.startsWith("240")
              ? "🎯 Exactly right! By default, padding ADDS to your declared width — 20px on the left plus 20px on the right means the box actually renders 240px wide, not 200px."
              : "The real answer: 240px wide. By default (without box-sizing: border-box), padding adds to your declared width on both sides — 200px + 20px (left) + 20px (right) = 240px."}
          </div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD ─────────────────────────────────────────────────────────────────
  const renderBuild = () => (
    <div>
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "12px 12px 0" }}>
        {concepts.map((c, i) => (
          <button key={i} disabled={!conceptUnlocked[i]} onClick={() => { setBuildConcept(i); setBuildMode("plain"); }} style={{
            flexShrink: 0, padding: "6px 12px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: "0.72rem",
            cursor: conceptUnlocked[i] ? "pointer" : "not-allowed",
            background: buildConcept === i ? "#38bdf8" : conceptUnlocked[i] ? "#1e293b" : "#0f172a",
            color: buildConcept === i ? "#0f172a" : conceptUnlocked[i] ? "#e2e8f0" : "#334155",
          }}>{conceptUnlocked[i] ? `${i + 1}. ${c.title.split("—")[0].trim()}` : `🔒 Concept ${i + 1}`}</button>
        ))}
      </div>
      <div style={s.card}>
        <div style={s.h3}>{concepts[buildConcept].title}</div>
        <div style={s.animBox}><ConceptAnimation index={buildConcept} frame={animFrame} /></div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
        </div>
        <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
          {buildMode === "plain" && <div style={{ ...s.p, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
          {buildMode === "tech" && <div style={{ ...s.p, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          {conceptTimer > 0
            ? <div style={{ color: "#64748b", fontSize: "0.8rem" }}>⏳ Next concept unlocks in {conceptTimer}s…</div>
            : buildConcept < concepts.length - 1
              ? <button style={s.btn()} onClick={() => setBuildConcept(buildConcept + 1)}>Next Concept →</button>
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
          <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
        </div>
      </div>
    </div>
  );

  // ── SEE IT ────────────────────────────────────────────────────────────────
  // A real nested-box diagram grows one layer at a time, mirroring exactly
  // what `layers` says is present at this step — content/padding/border/
  // margin are drawn as actual nested colour-coded rectangles, not just text.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    const has = (layer) => step.layers.includes(layer);
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch the Box Model Get Built, Layer by Layer</div>
        <div style={s.p}>Step through each addition and watch the nested-box diagram grow to match.</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>

        {/* The actual nested-box diagram: margin (outermost) > border >
            padding > content (innermost) — each only rendered with real
            colour/border once its layer is present at this step. */}
        <div style={{
          background: has("margin") ? "#fb923c22" : "transparent", border: has("margin") ? "2px dashed #fb923c" : "none",
          borderRadius: 10, padding: has("margin") ? 14 : 0, margin: "16px 0", transition: "all 0.3s",
        }}>
          <div style={{
            background: has("border") ? "#1e293b" : "transparent", border: has("border") ? "4px solid #38bdf8" : "none",
            borderRadius: 8, padding: has("border") ? 0 : 0, transition: "all 0.3s",
          }}>
            <div style={{
              background: has("padding") ? "#a78bfa22" : "transparent", border: has("padding") ? "2px dashed #a78bfa" : "none",
              padding: has("padding") ? 16 : 0, transition: "all 0.3s",
            }}>
              <div style={{ background: "#4ade8033", border: "2px solid #4ade80", borderRadius: 4, padding: "14px", textAlign: "center", color: "#4ade80", fontWeight: 700, fontSize: "0.8rem" }}>
                content
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[["content", "#4ade80"], ["padding", "#a78bfa"], ["border", "#38bdf8"], ["margin", "#fb923c"]].map(([name, color]) => (
            <span key={name} style={s.tag(has(name) ? color : "#475569")}>{has(name) ? "✅ " : "⬜ "}{name}</span>
          ))}
        </div>

        <div style={{ ...s.p, color: "#e2e8f0" }}>{seeitMode === "plain" ? step.plain : step.tech}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {seeitStep < seeitSteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
          {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
        </div>
      </div>
    );
  };

  // ── TRY IT ────────────────────────────────────────────────────────────────
  // Four real sliders feed directly into the preview box's inline style
  // below — genuine hands-on cause-and-effect with the box model, not a
  // canned simulation. allTouched gates moving on, so the student has to
  // actually drag every slider at least once.
  const renderTryIt = () => {
    const allTouched = Object.values(tryItTouched).every(Boolean);
    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Drag the Sliders, Watch the Box Model Live</div>
        <div style={s.p}>Move every slider at least once. The preview box below updates in real time.</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={{ flex: "1 1 220px" }}>
            {[
              { key: "padding", label: "Padding", value: padding, set: setPadding, min: 0, max: 40, color: "#a78bfa" },
              { key: "margin", label: "Margin", value: margin, set: setMargin, min: 0, max: 40, color: "#fb923c" },
              { key: "border", label: "Border width", value: borderWidth, set: setBorderWidth, min: 0, max: 12, color: "#38bdf8" },
              { key: "font", label: "Font size", value: fontSize, set: setFontSize, min: 10, max: 32, color: "#4ade80" },
            ].map((ctrl) => (
              <div key={ctrl.key} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: ctrl.color, fontWeight: 700, marginBottom: 4 }}>
                  <span>{ctrl.label}</span><span>{ctrl.value}px</span>
                </div>
                <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.value}
                  onChange={(e) => { ctrl.set(Number(e.target.value)); setTryItTouched((t) => ({ ...t, [ctrl.key]: true })); }}
                  style={{ width: "100%" }} />
              </div>
            ))}
          </div>

          {/* Live preview box — margin is shown as outer dashed space,
              border/padding/content react instantly to every slider drag. */}
          <div style={{ flex: "1 1 200px", background: "#0f172a", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180 }}>
            <div style={{ background: "#fb923c11", border: `${margin}px dashed #fb923c44`, borderRadius: 8 }}>
              <div style={{
                background: "#1e293b", border: `${borderWidth}px solid #38bdf8`, borderRadius: 6,
                padding: `${padding}px`, transition: "all 0.15s",
              }}>
                <div style={{ background: "#4ade8022", border: "1px solid #4ade80", borderRadius: 4, padding: "8px", color: "#e2e8f0", fontSize: `${fontSize}px`, transition: "all 0.15s", textAlign: "center" }}>
                  content
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {allTouched
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Move every slider at least once to unlock the next stage.</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match Unit to Best Use Case</div>
          <div style={s.p}>Tap a unit, then tap the situation it's best suited for.</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Challenge 2: Spot the Unit Choice That Breaks Scaling</div>
          <div style={s.p}>Three of these four rules use units sensibly. One pairs font-size and line-height in a way that won't scale together properly. Tap it.</div>
          <BugHunt lines={bugLines} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>🏆</div>
          <div style={s.h2}>Unit 3.2 Complete!</div>
          <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You now understand colour formats, typography basics, the box model, and which CSS units to reach for — the toolkit every layout technique from here on depends on.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["Colour formats — hex, rgb, hsl, named", "Typography — font-family, size, weight, line-height", "The box model — content, padding, border, margin", "Units — px, %, em, rem, vw/vh", "Why consistency & responsive thinking matter"].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
    const hintIndex = Math.min(quizAttempts - 1, q.hints.length - 1);
    return (
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
          <div style={s.tag("#38bdf8")}>Question {quizQ + 1} of {quizQuestions.length}</div>
          {quizFeedback === "wrong" && <div style={s.tag("#fb923c")}>Attempt {quizAttempts + 1}</div>}
        </div>
        <div style={{ ...s.h3, color: "#f1f5f9", fontSize: "0.95rem", marginBottom: 14 }}>{q.q}</div>
        {q.options.map((opt, i) => {
          const isSelected = quizSelected === i;
          const isCorrect = quizFeedback === "correct" && isSelected;
          const isWrong = quizFeedback === "wrong" && isSelected;
          return (
            <div key={i} style={s.quizOption(isSelected, isCorrect, isWrong)} onClick={() => { if (!quizFeedback || quizFeedback === "wrong") { setQuizSelected(i); setQuizFeedback(null); } }}>
              {opt}
            </div>
          );
        })}
        {quizFeedback === "wrong" && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
            <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{q.hints[hintIndex]}</div>
          </div>
        )}
        {quizFeedback === "correct" && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✅ Correct!</div>
            <div style={{ color: "#86efac", fontSize: "0.82rem" }}>{q.explanation}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {quizFeedback !== "correct" && (
            <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
              if (quizSelected === q.answer) { setQuizFeedback("correct"); }
              else { setQuizAttempts((a) => a + 1); setQuizFeedback("wrong"); setQuizSelected(null); }
            }}>Check Answer</button>
          )}
          {quizFeedback === "correct" && (
            <button style={s.btn("#4ade80")} onClick={() => {
              if (quizQ + 1 < quizQuestions.length) { setQuizQ(quizQ + 1); setQuizSelected(null); setQuizFeedback(null); setQuizAttempts(0); }
              else { setQuizDone(true); }
            }}>{quizQ + 1 < quizQuestions.length ? "Next Question →" : "Finish Quiz 🎉"}</button>
          )}
        </div>
      </div>
    );
  };

  // ── TOP-LEVEL RENDER ──────────────────────────────────────────────────────
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 3.2 — Colours, Fonts & Spacing</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong>
        </div>
      )}
      {stage === 0 && renderSpark()}
      {stage === 1 && renderBuild()}
      {stage === 2 && renderSeeIt()}
      {stage === 3 && renderTryIt()}
      {stage === 4 && renderChallenge()}
      {stage === 5 && renderQuiz()}
      <style>{`
        @media (max-width: 420px) {
          .unit-topbar-title { font-size: 0.74rem !important; }
        }
      `}</style>
    </div>
  );
}

// ── CONCEPT ANIMATIONS — one tiny illustration per Build-stage concept ─────
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  // Concept 0 — Colour formats: the same swatch cycles through its four
  // equivalent representations.
  if (index === 0) {
    const formats = ["#ff6347", "rgb(255,99,71)", "hsl(9,100%,64%)", "tomato"];
    const which = Math.floor(pos * formats.length) % formats.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 10, background: "#ff6347", border: "2px solid #fff2" }} />
          <div style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#fdba74" }}>{formats[which]}</div>
        </div>
      </div>
    );
  }

  // Concept 1 — Typography: font-weight cycling normal → bold, with
  // line-height visualized as spacing between two text lines.
  if (index === 1) {
    const bold = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: bold ? 700 : 400, fontSize: "1.1rem", color: "#e2e8f0", transition: "font-weight 0.3s" }}>Aa Bb Cc</div>
          <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 4 }}>font-weight: {bold ? 700 : 400}</div>
        </div>
      </div>
    );
  }

  // Concept 2 — Box model: simple nested squares, static illustration with
  // a subtle pulsing margin ring.
  if (index === 2) {
    return (
      <div style={base}>
        <div style={{ background: "#fb923c" + (pos > 0.5 ? "33" : "22"), borderRadius: 8, padding: 10, transition: "background 0.3s" }}>
          <div style={{ background: "#1e293b", border: "3px solid #38bdf8", borderRadius: 6, padding: 8 }}>
            <div style={{ background: "#a78bfa22", border: "2px dashed #a78bfa", borderRadius: 4, padding: 8 }}>
              <div style={{ background: "#4ade8033", border: "1px solid #4ade80", borderRadius: 3, padding: "6px 16px", fontSize: "0.62rem", color: "#4ade80" }}>content</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Concept 3 — Units: rem stays the same size while em-based text grows
  // each nesting level, illustrating compounding vs non-compounding.
  if (index === 3) {
    const scale = 1 + pos * 0.3;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1rem", color: "#4ade80" }}>rem</div>
            <div style={{ fontSize: "0.6rem", color: "#64748b" }}>stays fixed</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: `${scale}rem`, color: "#fb923c", transition: "font-size 0.3s" }}>em</div>
            <div style={{ fontSize: "0.6rem", color: "#64748b" }}>compounds nested</div>
          </div>
        </div>
      </div>
    );
  }

  // Concept 4 — Why it matters: a chaotic palette settling into an
  // organized, consistent palette row.
  return (
    <div style={base}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ textAlign: "center", opacity: pos < 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.4rem" }}>🎨</div>
          <div style={{ fontSize: "0.58rem", color: "#94a3b8" }}>random sizes/colours</div>
        </div>
        <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>
        <div style={{ textAlign: "center", opacity: pos >= 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.4rem" }}>✨</div>
          <div style={{ fontSize: "0.58rem", color: "#94a3b8" }}>one consistent system</div>
        </div>
      </div>
    </div>
  );
}

// ── TAG MATCH (shared minigame pattern, reused across the course) ─────────
function TagMatch({ pairs, onDone }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [wrong, setWrong] = useState(null);
  const shuffledMeanings = useRef([...pairs].sort(() => Math.random() - 0.5)).current;

  const handleCode = (code) => { if (!matched[code]) setSelected({ type: "code", value: code }); };
  const handleMeaning = (meaning) => {
    if (selected?.type === "code") {
      const correct = pairs.find((p) => p.code === selected.value)?.meaning === meaning;
      if (correct) {
        const newMatched = { ...matched, [selected.value]: meaning };
        setMatched(newMatched);
        setSelected(null);
        if (Object.keys(newMatched).length === pairs.length) onDone();
      } else {
        setWrong(meaning);
        setTimeout(() => { setWrong(null); setSelected(null); }, 800);
      }
    } else {
      setSelected({ type: "meaning", value: meaning });
    }
  };

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 140px" }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>UNITS</div>
        {pairs.map((p) => (
          <div key={p.code} onClick={() => handleCode(p.code)} style={{
            background: matched[p.code] ? "#14532d33" : selected?.value === p.code ? "#0f2942" : "#0f172a",
            border: matched[p.code] ? "1px solid #4ade8044" : selected?.value === p.code ? "2px solid #38bdf8" : "1px solid #334155",
            borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: matched[p.code] ? "default" : "pointer",
            fontFamily: "monospace", fontSize: "0.76rem", color: matched[p.code] ? "#4ade80" : "#e2e8f0",
          }}>{matched[p.code] ? "✅ " : ""}{p.code}</div>
        ))}
      </div>
      <div style={{ flex: "1 1 140px" }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>BEST USE CASE</div>
        {shuffledMeanings.map((p) => {
          const isUsed = Object.values(matched).includes(p.meaning);
          return (
            <div key={p.meaning} onClick={() => !isUsed && handleMeaning(p.meaning)} style={{
              background: isUsed ? "#14532d33" : wrong === p.meaning ? "#450a0a" : "#0f172a",
              border: isUsed ? "1px solid #4ade8044" : wrong === p.meaning ? "2px solid #ef4444" : "1px solid #334155",
              borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: isUsed ? "default" : "pointer",
              fontSize: "0.78rem", color: isUsed ? "#4ade80" : "#e2e8f0",
            }}>{isUsed ? "✅ " : ""}{p.meaning}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── BUG HUNT (shared minigame pattern, reused across the course) ──────────
function BugHunt({ lines, onDone }) {
  const [revealed, setRevealed] = useState(false);
  const [wrongTap, setWrongTap] = useState(null);

  function tap(line, i) {
    if (revealed) return;
    if (line.buggy) { setRevealed(true); onDone(); }
    else { setWrongTap(i); setTimeout(() => setWrongTap(null), 600); }
  }

  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} onClick={() => tap(line, i)} style={{
          background: revealed && line.buggy ? "#14532d33" : wrongTap === i ? "#450a0a" : "#0f172a",
          border: revealed && line.buggy ? "1px solid #4ade8044" : wrongTap === i ? "2px solid #ef4444" : "1px solid #334155",
          borderRadius: 10, padding: "10px 14px", marginBottom: 8, cursor: revealed ? "default" : "pointer",
          fontFamily: "monospace", fontSize: "0.76rem", color: revealed && line.buggy ? "#4ade80" : "#e2e8f0",
        }}>
          {revealed && line.buggy ? "🐛 " : ""}{line.text}
        </div>
      ))}
      {revealed && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>Found it!</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{lines.find((l) => l.buggy)?.why}</div>
        </div>
      )}
    </div>
  );
}
