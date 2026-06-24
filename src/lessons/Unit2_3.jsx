// ============================================================================
//  UNIT 2.3 — "Lists, Tables & Forms"
//  Module: M2 — HTML Foundations
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Same loading contract as every other lesson: App.jsx (src/shell/App.jsx)
//    finds "Unit2_3" in config/course.config.js and renders this component
//    with { student, onUnitComplete }. We call onUnitComplete() exactly once,
//    when the quiz finishes, so App.jsx can save progress and unlock Unit2_4.
//  - No api.js / gas.config.js imports here — by design, per the lesson
//    contract documented in ADDING_NEW_LESSON.md.
//
//  TEACHING DESIGN — identical six-stage shell to Unit2_1.jsx / Unit2_2.jsx:
//    Stage 0  SPARK      — curiosity question before the explanation.
//    Stage 1  BUILD      — five concepts, timed unlocks, Plain⇄Tech toggle.
//    Stage 2  SEE IT     — a real student-marks table built live, step by step.
//    Stage 3  TRY IT     — student assembles a REAL working feedback form —
//                           the live preview renders actual <input>/<textarea>
//                           elements (via normal React JSX), so for the very
//                           first time in the course the "preview" isn't just
//                           a styled mock-up, it's a genuinely usable form.
//    Stage 4  CHALLENGE  — tag-matching, then an ordering game that
//                           reassembles a shuffled table's correct tag order.
//    Stage 5  QUIZ       — wrong answers never reveal the correct option;
//                           escalating hints + repeat attempts instead.
//
//  MOBILE-FRIENDLINESS: same approach as the rest of the module — flexible
//  widths (%, flex-wrap, minmax(), clamp()), and the live-preview form below
//  uses width:100% inputs so it never overflows a phone screen.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit2_3({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ──────────────────────────────────────────────────
  const [stage, setStage] = useState(0); // 0=Spark 1=Build 2=SeeIt 3=TryIt 4=Challenge 5=Quiz

  // ── SPARK ───────────────────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState("");
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD ───────────────────────────────────────────────────────────────
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT ──────────────────────────────────────────────────────────────
  const [seeitMode, setSeeitMode] = useState("plain");
  const [seeitStep, setSeeitStep] = useState(0);

  // ── TRY IT ──────────────────────────────────────────────────────────────
  // Assembling a real feedback form, one field at a time, in order.
  const [tryitState, setTryitState] = useState({
    nameField: false, emailField: false, messageField: false, submitBtn: false,
  });
  // Actual values the student can type into the live-rendered preview form —
  // purely cosmetic/demo state, never sent anywhere (no backend call here).
  const [previewValues, setPreviewValues] = useState({ name: "", email: "", message: "" });

  // ── CHALLENGE ───────────────────────────────────────────────────────────
  const [challengePhase, setChallengePhase] = useState(0); // 0 = tag match, 1 = ordering
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ ────────────────────────────────────────────────────────────────
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);

  // ── shared timers ───────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: five core concepts for Build stage ──────────────────────────
  const concepts = [
    {
      title: "Unordered Lists <ul>/<li> — When Order Doesn't Matter",
      plain: "A bulleted shopping list — milk, eggs, bread — the order doesn't matter, you just need all of them. <ul> is the list 'box', and each <li> is one bullet item inside it.",
      technical: "<ul> (unordered list) renders bullet points by default. Each item is wrapped in <li> (list item). Use <ul> when sequence carries no meaning — e.g. a set of features, ingredients, or tags.",
      animation: "ul",
      unlock: 7,
    },
    {
      title: "Ordered Lists <ol>/<li> — When Sequence Matters",
      plain: "A recipe's steps — first mix, then bake, then cool — the ORDER matters here. <ol> automatically numbers each <li> for you: 1, 2, 3...",
      technical: "<ol> (ordered list) renders auto-incrementing numbers. Same <li> children as <ul>, but semantically signals sequence-dependence — useful for instructions, rankings, or step-by-step processes.",
      animation: "ol",
      unlock: 7,
    },
    {
      title: "Tables <table>/<tr>/<th>/<td> — Rows & Columns of Data",
      plain: "A table is like a printed mark-sheet: rows going across, columns going down. <table> is the whole grid, <tr> is one row, <th> is a header cell (like 'Name' or 'Marks'), <td> is a normal data cell (like 'Aishu' or '92').",
      technical: "<table> wraps the grid. <tr> defines a table row. <th> defines a header cell (bold, centered by default, and announced as a header by screen readers). <td> defines a standard data cell. Rows of <th> usually sit inside an optional <thead>; data rows inside <tbody>.",
      animation: "table",
      unlock: 9,
    },
    {
      title: "Forms <form>/<input>/<label> — Collecting Information",
      plain: "A form is how a webpage asks YOU for information — your name, email, a message. <form> is the container, <input> is a single fill-in box, and <label> is the text describing what that box is for.",
      technical: "<form> groups related controls and defines how/where data is submitted (action, method). <input type=\"text|email|password|...\"> creates different kinds of fill-in fields. <label for=\"id\"> must reference the matching input's id — this pairing is required for accessibility, not optional styling.",
      animation: "form",
      unlock: 9,
    },
    {
      title: "Buttons & Submission — <button>, type=\"submit\"",
      plain: "Once someone fills a form, something has to actually SEND it. A <button type=\"submit\"> (or <input type=\"submit\">) does exactly that — it's the 'go' button for the whole form.",
      technical: "<button type=\"submit\"> inside a <form> triggers form submission (a POST/GET request per the form's method/action). type=\"button\" does NOT submit — it's for custom JS-driven actions. Omitting type defaults to \"submit\" inside a form, which surprises many beginners.",
      animation: "submit",
      unlock: 8,
    },
  ];

  // ── CONTENT: Quiz bank ───────────────────────────────────────────────────
  const quizQuestions = [
    {
      q: "You're listing the steps to log into a website (1. open browser, 2. type URL, 3. enter password...). Which list type fits best?",
      options: ["<ul>", "<ol>", "<table>", "<form>"],
      answer: 1,
      hints: [
        "Ask yourself: does the ORDER of these steps actually matter, or could you do them in any order?",
        "Steps performed in sequence need a list that shows that sequence — usually with numbers.",
        "<ol> (ordered list) auto-numbers items — perfect for sequence-dependent steps.",
      ],
      explanation: "<ol> automatically numbers its <li> items, which is exactly right for sequence-dependent content like step-by-step instructions. <ul> would be for an unordered set, like a list of ingredients with no required order.",
    },
    {
      q: "In a marks table, which tag should hold the column titles like 'Name' and 'Marks'?",
      options: ["<td>", "<th>", "<tr>", "<table>"],
      answer: 1,
      hints: [
        "One of these tags is specifically for HEADER cells, not regular data cells.",
        "Screen readers announce this tag differently from a normal data cell — it signals 'this labels a column or row.'",
        "<th> (table header) is for header cells like 'Name' or 'Marks'; <td> is for the actual data underneath them.",
      ],
      explanation: "<th> marks a header cell — it's bold and centered by default, and importantly, screen readers announce it as a header, which helps users understand the table's structure.",
    },
    {
      q: "Why must a <label for=\"email\"> match an <input id=\"email\">?",
      options: [
        "It's just a styling convention with no real effect",
        "It links the label to its input so clicking the label focuses the input, and screen readers announce them as a pair",
        "It makes the input required",
        "It changes the input's colour to match the label",
      ],
      answer: 1,
      hints: [
        "Try clicking directly on a label text on a real website sometime — what happens to the nearby input box?",
        "This connection matters most for people using screen readers or anyone with limited fine motor control tapping a small input on a phone.",
        "for/id pairing creates a true programmatic association — clicking the label focuses the input, and assistive tech announces them together.",
      ],
      explanation: "The for/id pairing creates a real, accessible link between label and input — clicking the label text focuses the input (great on small touchscreens), and screen readers announce the label when the input receives focus.",
    },
    {
      q: "Inside a <form>, what does a <button type=\"submit\"> actually do?",
      options: [
        "Nothing unless you write JavaScript for it",
        "It clears all the form's fields",
        "It triggers the form to submit its data",
        "It only works if the form has no <input> fields",
      ],
      answer: 2,
      hints: [
        "This button's whole job description is built into its `type` attribute — read it literally.",
        "It's the 'go' button — the one action that actually sends the filled-in data somewhere.",
        "type=\"submit\" tells the browser: collect this form's data and submit it, per the form's action/method — no extra JavaScript required for the basic submission itself.",
      ],
      explanation: "type=\"submit\" makes the button trigger the form's submission behaviour automatically — the browser handles collecting field values and sending the request, no JavaScript strictly required for that basic action.",
    },
    {
      q: "What's the difference between <td> and <th> in terms of accessibility, not just appearance?",
      options: [
        "There is no accessibility difference, only colour",
        "<th> is announced by screen readers as a header describing the row/column, <td> is just announced as a data value",
        "<td> can only hold numbers",
        "<th> cells cannot be styled with CSS",
      ],
      answer: 1,
      hints: [
        "Think beyond how it LOOKS (bold vs normal) — think about what a screen reader says out loud as it moves through the table.",
        "One of these tags carries semantic meaning as a 'label for this row/column'; the other is just plain content.",
        "<th> is announced as a header, helping screen-reader users understand which column or row a value belongs to — purely visual bold styling alone wouldn't do that.",
      ],
      explanation: "Beyond visual bolding, <th> carries real semantic meaning: screen readers announce it as a header describing the data around it, which is essential for anyone navigating a table non-visually.",
    },
  ];

  // ── Concept unlock timer ─────────────────────────────────────────────────
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
  }, [buildConcept, stage]);

  // ── Looping animation frame ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — building a marks table live ───────────────────────
  const seeitSteps = [
    { plain: "We start with an empty table box.", tech: "Empty <table></table>.", code: "<table>\n\n</table>" },
    { plain: "Add the first row — this one holds headers.", tech: "Add <tr> with <th> cells.", code: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Marks</th>\n  </tr>\n</table>" },
    { plain: "Add a real student's data as a new row.", tech: "Add a <tr> with <td> cells.", code: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Marks</th>\n  </tr>\n  <tr>\n    <td>Aishu</td>\n    <td>92</td>\n  </tr>\n</table>" },
    { plain: "Add one more student's row.", tech: "Add another <tr>.", code: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Marks</th>\n  </tr>\n  <tr>\n    <td>Aishu</td>\n    <td>92</td>\n  </tr>\n  <tr>\n    <td>Ravi</td>\n    <td>88</td>\n  </tr>\n</table>" },
    { plain: "Done! A real two-student marks table.", tech: "A complete, valid HTML table.", code: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Marks</th>\n  </tr>\n  <tr>\n    <td>Aishu</td>\n    <td>92</td>\n  </tr>\n  <tr>\n    <td>Ravi</td>\n    <td>88</td>\n  </tr>\n</table>" },
  ];

  // ── CONTENT: Challenge 1 — tag-to-job matching ───────────────────────────
  const ch1Pairs = [
    { code: "<ol>", meaning: "Auto-numbers items where sequence matters" },
    { code: "<th>", meaning: "A header cell, announced specially to screen readers" },
    { code: "<label for>", meaning: "Connects descriptive text to its input field" },
    { code: "button type=\"submit\"", meaning: "Sends the form's data when clicked" },
  ];

  // ── CONTENT: Challenge 2 — rebuild correct table tag order ───────────────
  const ch2Steps = ["<table>", "<tr>", "<th>Name</th>", "</tr>", "<tr>", "<td>Aishu</td>"];
  const ch2Correct = [0, 1, 2, 3, 4, 5];

  // ── STYLES (kept identical across the module for visual consistency) ───
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
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.78rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    checkRow: (done) => ({ background: done ? "#14532d33" : "#1e293b", border: done ? "1px solid #4ade8044" : "1px solid #334155", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s" }),
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
    // Live preview form inputs need their own style — width:100% keeps them
    // from ever overflowing the card on a narrow phone screen.
    previewInput: { width: "100%", boxSizing: "border-box", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "8px 10px", fontSize: "0.8rem", marginBottom: 8 },
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📋📊📨</div>
        <div style={s.h2}>A shopping list. A marks table. A sign-up form.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          All three are just "organized text" — but each one is organized completely differently. How does HTML know to show one as bullets, one as a grid, and one as fill-in boxes?
        </div>
      </div>
      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "The browser detects what kind of content it is automatically",
              "Different tag families — list tags, table tags, and form tags — each have their own structure",
              "It's all the same tag, just with different CSS colours",
              "You need three separate apps, not one webpage",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
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
            {sparkGuess.includes("tag families")
              ? "🎯 Exactly! <ul>/<ol>/<li> build lists, <table>/<tr>/<th>/<td> build grids, and <form>/<input>/<label> build interactive forms. Three different jobs, three different tag families."
              : "The real answer: HTML has dedicated tag families for each job — list tags, table tags, and form tags. Let's build a real example of all three."}
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
        <div style={s.animBox}><ConceptAnimation type={concepts[buildConcept].animation} frame={animFrame} /></div>
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
  const renderSeeIt = () => (
    <div style={s.card}>
      <div style={s.h2}>📽️ Watch a Marks Table Get Built</div>
      <div style={s.p}>Step through each addition. Toggle between plain English and technical terms.</div>
      <div style={s.toggleRow}>
        <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
        <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
      </div>
      <div style={s.codeBox}>{seeitSteps[seeitStep].code}</div>

      {/* A genuine live-rendered HTML <table> mirroring the code above —
          students see the real visual result, not just markup text. */}
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px", margin: "12px 0", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <tbody>
            {seeitStep >= 1 && (
              <tr>
                <th style={{ border: "1px solid #334155", padding: "6px 10px", color: "#38bdf8" }}>Name</th>
                <th style={{ border: "1px solid #334155", padding: "6px 10px", color: "#38bdf8" }}>Marks</th>
              </tr>
            )}
            {seeitStep >= 2 && (
              <tr>
                <td style={{ border: "1px solid #334155", padding: "6px 10px", color: "#e2e8f0" }}>Aishu</td>
                <td style={{ border: "1px solid #334155", padding: "6px 10px", color: "#e2e8f0" }}>92</td>
              </tr>
            )}
            {seeitStep >= 3 && (
              <tr>
                <td style={{ border: "1px solid #334155", padding: "6px 10px", color: "#e2e8f0" }}>Ravi</td>
                <td style={{ border: "1px solid #334155", padding: "6px 10px", color: "#e2e8f0" }}>88</td>
              </tr>
            )}
          </tbody>
        </table>
        {seeitStep === 0 && <div style={{ color: "#475569", fontSize: "0.76rem" }}>(table is empty so far)</div>}
      </div>

      <div style={{ margin: "14px 0" }}>
        {seeitSteps.map((step, i) => (
          <div key={i} onClick={() => setSeeitStep(i)} style={{
            background: seeitStep === i ? "#0f2942" : i < seeitStep ? "#14532d22" : "#0f172a",
            border: seeitStep === i ? "2px solid #38bdf8" : i < seeitStep ? "1px solid #4ade8044" : "1px solid #334155",
            borderRadius: 10, padding: "11px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: "0.75rem", color: i < seeitStep ? "#4ade80" : seeitStep === i ? "#38bdf8" : "#475569", fontWeight: 700 }}>
                {i < seeitStep ? "✅" : seeitStep === i ? "▶" : `${i + 1}.`}
              </span>
              <span style={{ fontSize: "0.83rem", color: seeitStep === i ? "#f1f5f9" : "#94a3b8" }}>{seeitMode === "plain" ? step.plain : step.tech}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {seeitStep < seeitSteps.length - 1
          ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
          : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
        {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
      </div>
    </div>
  );

  // ── TRY IT ────────────────────────────────────────────────────────────────
  const renderTryIt = () => {
    const steps = [
      { key: "nameField", label: "Add a labelled Name field", action: "Add <label>+<input>", icon: "👤" },
      { key: "emailField", label: "Add a labelled Email field", action: "Add <label>+<input type=email>", icon: "📧" },
      { key: "messageField", label: "Add a Message textarea", action: "Add <label>+<textarea>", icon: "💬" },
      { key: "submitBtn", label: "Add the Submit button", action: "Add <button type=submit>", icon: "📨" },
    ];
    const doneCount = Object.values(tryitState).filter(Boolean).length;
    const allDone = doneCount === steps.length;

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Assemble a Real, Working Feedback Form</div>
        <div style={s.p}>Click each step in order. Unlike earlier lessons, this live preview is an actual working form — try typing into it once it appears!</div>
        <div style={{ height: 6, background: "#1e293b", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(doneCount / steps.length) * 100}%`, background: "linear-gradient(90deg,#38bdf8,#4ade80)", transition: "width 0.4s", borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px" }}>
            {steps.map((step) => (
              <div key={step.key} style={s.checkRow(tryitState[step.key])}>
                <span style={{ fontSize: "1rem" }}>{tryitState[step.key] ? "✅" : step.icon}</span>
                <span style={{ fontSize: "0.8rem", color: tryitState[step.key] ? "#4ade80" : "#94a3b8" }}>{step.label}</span>
              </div>
            ))}
          </div>

          {/* Genuinely functional live preview form — every field below is a
              real React-controlled input, demonstrating that this is the
              same underlying idea (label+input pairs, a textarea, a submit
              button) the student is learning, just rendered for real. */}
          <div style={{ flex: "1 1 220px", background: "#f8fafc", borderRadius: 12, padding: "16px", color: "#0f172a" }}>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 700, marginBottom: 8 }}>LIVE WORKING PREVIEW</div>
            {doneCount === 0 && <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>(form is empty — add a field to begin)</div>}
            {tryitState.nameField && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.74rem", fontWeight: 600, display: "block", marginBottom: 3 }}>Name</label>
                <input style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                  value={previewValues.name} onChange={(e) => setPreviewValues((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" />
              </div>
            )}
            {tryitState.emailField && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.74rem", fontWeight: 600, display: "block", marginBottom: 3 }}>Email</label>
                <input type="email" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                  value={previewValues.email} onChange={(e) => setPreviewValues((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
              </div>
            )}
            {tryitState.messageField && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.74rem", fontWeight: 600, display: "block", marginBottom: 3 }}>Message</label>
                <textarea rows={2} style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem", resize: "vertical" }}
                  value={previewValues.message} onChange={(e) => setPreviewValues((p) => ({ ...p, message: e.target.value }))} placeholder="Type something…" />
              </div>
            )}
            {tryitState.submitBtn && (
              <button type="button" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                onClick={() => alert(`(Demo only) Would submit:\nName: ${previewValues.name}\nEmail: ${previewValues.email}\nMessage: ${previewValues.message}`)}>
                Submit
              </button>
            )}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {steps.map((step, i) => {
            const prevDone = i === 0 ? true : tryitState[steps[i - 1].key];
            if (tryitState[step.key] || !prevDone) return null;
            return <button key={step.key} style={s.btn()} onClick={() => setTryitState((p) => ({ ...p, [step.key]: true }))}>{step.icon} {step.action}</button>;
          })}
        </div>
        {allDone && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8044", borderRadius: 12, padding: "14px", marginTop: 14 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>🎉 You just assembled a real, working form!</div>
            <div style={s.p}>Every contact form, login page, and sign-up screen on the web is built from exactly this same label+input+submit pattern.</div>
            <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
          </div>
        )}
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match Tag to Job</div>
          <div style={s.p}>Tap a tag, then tap the job it performs.</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 2: Rebuild the Correct Table Order</div>
          <div style={s.p}>These table tags got shuffled! Tap them back into the correct order, top to bottom.</div>
          <OrderingChallenge steps={ch2Steps} correct={ch2Correct} onDone={() => setCh2Done(true)} />
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
          <div style={s.h2}>Unit 2.3 Complete!</div>
          <div style={s.p}>You can now organize content with lists, present data with tables, and collect input with forms.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["<ul>/<li> — unordered lists", "<ol>/<li> — ordered, numbered lists", "<table>/<tr>/<th>/<td> — rows & columns", "<form>/<input>/<label> — collecting input", "Buttons & submission — sending form data"].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
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
        {quizFeedback === "wrong" && hintsShown < q.hints.length && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint {hintsShown}:</div>
            <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{q.hints[hintsShown - 1]}</div>
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
              else {
                const newAttempts = quizAttempts + 1;
                setQuizAttempts(newAttempts);
                setQuizFeedback("wrong");
                setHintsShown(Math.min(newAttempts, q.hints.length));
                setQuizSelected(null);
              }
            }}>Check Answer</button>
          )}
          {quizFeedback === "correct" && (
            <button style={s.btn("#4ade80")} onClick={() => {
              if (quizQ + 1 < quizQuestions.length) { setQuizQ(quizQ + 1); setQuizSelected(null); setQuizFeedback(null); setQuizAttempts(0); setHintsShown(0); }
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
        <div style={s.topTitle}>Unit 2.3 — Lists, Tables & Forms</div>
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
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (max-width: 420px) {
          .unit-topbar-title { font-size: 0.74rem !important; }
        }
      `}</style>
    </div>
  );
}

// ── CONCEPT ANIMATIONS ────────────────────────────────────────────────────
function ConceptAnimation({ type, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  if (type === "ul") {
    const items = ["Milk", "Eggs", "Bread"];
    const shown = Math.min(items.length, Math.floor(pos * (items.length + 1)));
    return (
      <div style={base}>
        <ul style={{ color: "#e2e8f0", fontSize: "0.82rem", paddingLeft: 18, margin: 0 }}>
          {items.slice(0, shown).map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>
    );
  }

  if (type === "ol") {
    const items = ["Mix batter", "Bake 20 min", "Let it cool"];
    const shown = Math.min(items.length, Math.floor(pos * (items.length + 1)));
    return (
      <div style={base}>
        <ol style={{ color: "#e2e8f0", fontSize: "0.82rem", paddingLeft: 18, margin: 0 }}>
          {items.slice(0, shown).map((it, i) => <li key={i}>{it}</li>)}
        </ol>
      </div>
    );
  }

  if (type === "table") {
    const showRow2 = pos > 0.5;
    return (
      <div style={base}>
        <table style={{ borderCollapse: "collapse", fontSize: "0.74rem" }}>
          <tbody>
            <tr><th style={{ border: "1px solid #334155", padding: "4px 10px", color: "#38bdf8" }}>Name</th><th style={{ border: "1px solid #334155", padding: "4px 10px", color: "#38bdf8" }}>Marks</th></tr>
            {showRow2 && <tr><td style={{ border: "1px solid #334155", padding: "4px 10px", color: "#e2e8f0" }}>Aishu</td><td style={{ border: "1px solid #334155", padding: "4px 10px", color: "#e2e8f0" }}>92</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "form") return (
    <div style={base}>
      <div style={{ background: "#1a2535", borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Email</div>
        <div style={{ background: "#0f172a", border: `1px solid ${pos > 0.5 ? "#38bdf8" : "#334155"}`, borderRadius: 6, padding: "4px 8px", fontSize: "0.7rem", color: "#7dd3fc", minWidth: 100 }}>
          {pos > 0.5 ? "you@example.com" : "|"}
        </div>
      </div>
    </div>
  );

  if (type === "submit") return (
    <div style={base}>
      <div style={{
        background: pos > 0.5 ? "#1a3320" : "#1e3a5f", color: pos > 0.5 ? "#4ade80" : "#38bdf8",
        borderRadius: 8, padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, transition: "all 0.2s",
        transform: pos > 0.5 ? "scale(0.95)" : "scale(1)",
      }}>
        {pos > 0.5 ? "✅ Sent!" : "Submit"}
      </div>
    </div>
  );

  return <div style={{ color: "#64748b" }}>Animation</div>;
}

// ── TAG MATCH (shared game pattern, reused across the module) ───────────
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>TAGS</div>
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>JOBS</div>
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

// ── ORDERING CHALLENGE (shared game pattern, reused across the module) ──
function OrderingChallenge({ steps, correct, onDone }) {
  const shuffled = useRef([...steps].map((s, i) => ({ s, origIndex: i })).sort(() => Math.random() - 0.5)).current;
  const [placed, setPlaced] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);

  function tap(item) {
    if (placed.includes(item.origIndex)) return;
    const expectedNext = correct[placed.length];
    if (item.origIndex === expectedNext) {
      const next = [...placed, item.origIndex];
      setPlaced(next);
      if (next.length === steps.length) onDone();
    } else {
      setWrongFlash(item.origIndex);
      setTimeout(() => setWrongFlash(null), 500);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        {correct.map((origIdx, slot) => (
          <div key={slot} style={{
            background: placed.length > slot ? "#14532d33" : "#0f172a",
            border: placed.length > slot ? "1px solid #4ade8044" : "1px dashed #334155",
            borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontFamily: "monospace", fontSize: "0.78rem",
            color: placed.length > slot ? "#4ade80" : "#475569",
          }}>
            {placed.length > slot ? `${slot + 1}. ${steps[placed[slot]]}` : `${slot + 1}. ___`}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {shuffled.filter((item) => !placed.includes(item.origIndex)).map((item) => (
          <div key={item.origIndex} onClick={() => tap(item)} style={{
            background: wrongFlash === item.origIndex ? "#450a0a" : "#1e293b",
            border: wrongFlash === item.origIndex ? "2px solid #ef4444" : "1px solid #334155",
            borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace",
            fontSize: "0.78rem", color: "#e2e8f0",
          }}>{item.s}</div>
        ))}
      </div>
    </div>
  );
}
