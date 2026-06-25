// ============================================================================
//  UNIT 4.1 — "Boxes, Labels & Surprising Math: Variables, Types & Operators"
//  Module: M4 — JavaScript Fundamentals (first unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly the same way every other lesson is:
//    App.jsx looks up "Unit4_1" in config/course.config.js, renders
//    <Unit4_1 student={...} onUnitComplete={...} />, and then waits for
//    exactly one event — onUnitComplete() being called once, at the very
//    end of the quiz, never automatically. App.jsx does not know or care
//    HOW this lesson teaches JS variables/types/operators.
//  - This file deliberately never imports api.js or config/gas.config.js.
//    Only App.jsx is allowed to talk to the backend (saving progress,
//    unlocking the next unit). That boundary means this lesson file can be
//    read, edited, and tested completely in isolation.
//
//  REVISION NOTE (content-only rework, same shell/state machine):
//  Student feedback on the first draft: no "what is JS" intro before diving
//  into variables; the variable-box animation switched TYPES (number→string)
//  instead of showing the same type holding different values; every stage
//  leaned on long paragraphs that were hard to read; coercion needed to be
//  shown IN the animation, not explained in prose next to it; and wrong
//  answers in the Challenge minigames gave no hint at all (just a red
//  flash). This version fixes all five: added a "What is JavaScript?" intro
//  concept; the variable animation now cycles 5 → 12 → 7, all Numbers,
//  with an explicit "same type, different value" callout; every plain/
//  technical blurb is now ONE short sentence (the teaching now happens
//  visually, inside each ConceptAnimation, using arrows and labels — see
//  the big comment block above that function); and both TagMatch and
//  BugHunt now surface a hint on every wrong tap, never just a silent red
//  flash. Stage flow, state variables, and the onUnitComplete contract are
//  all unchanged from the original.
//
//  TEACHING DESIGN — same six-stage shell used in every unit in this course:
//    Stage 0  SPARK      — predict the result of "5" + 3 vs 5 + 3 BEFORE
//                           any teaching happens (predict-then-learn).
//    Stage 1  BUILD      — 9 concepts, freely navigable, each just 1-2
//                           sentences of text + a self-explanatory animation
//                           carrying the real teaching weight (arrows,
//                           labels, before/after states):
//                             0. What is JavaScript, anyway?
//                             1. What is a variable? (same type, new value)
//                             2. Declaring variables — var vs let vs const
//                             3. Primitive data types
//                             4. The typeof operator (and its one famous lie)
//                             5. Coercion vs conversion
//                             6. Arithmetic operators (+ is secretly two ops)
//                             7. Comparison operators — == vs ===
//                             8. Logical operators & truthy/falsy values
//    Stage 2  SEE IT     — five real expressions evaluated one at a time in
//                           a mock console, one line of "why" per step.
//    Stage 3  TRY IT     — student picks an expression, watches it evaluate
//                           live, reads a one-line note on why.
//    Stage 4  CHALLENGE  — tag-matching (expression → result) WITH a hint on
//                           every wrong match, then a "spot the bug" hunt
//                           (the classic == NaN mistake) WITH an escalating
//                           hint on every wrong tap.
//    Stage 5  QUIZ       — 12 questions. Wrong answers never reveal the
//                           correct option — an escalating hint shows
//                           instead, and it never disappears even after many
//                           wrong attempts (pinned at the final hint).
//
//  MOBILE-FRIENDLINESS: no fixed pixel widths anywhere. Layout uses %,
//  flexWrap, minmax()/clamp() so every stage is fully usable on a phone.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit4_1({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ────────────────────────────────────────────────────
  // `stage` is the single source of truth for which of the six screens is
  // currently on screen. Kept as ONE flat, unconditional useState call
  // (never moved inside an if/loop) so React's Rules of Hooks are never
  // violated, per the lesson template's #1 rule.
  const [stage, setStage] = useState(0); // 0 Spark · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

  // ── SPARK stage state ───────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD stage state ───────────────────────────────────────────────────
  // buildConcept = index into the `concepts` array below. Navigation is
  // completely free — every pill is clickable any time, any order.
  // buildMode toggles Plain-English vs Technical phrasing.
  const [buildConcept, setBuildConcept] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT stage state ──────────────────────────────────────────────────
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT stage state ──────────────────────────────────────────────────
  const [exprPicked, setExprPicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0);

  // ── CHALLENGE stage state ────────────────────────────────────────────────
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ stage state ─────────────────────────────────────────────────────
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // ── looping animation frame ──────────────────────────────────────────────
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: the nine Build-stage concepts ──────────────────────────────
  // Per student feedback, plain/technical are now ONE short sentence each —
  // the actual teaching happens inside ConceptAnimation (arrows, labels,
  // before/after states), not in paragraph text.
  const concepts = [
    {
      title: "What Is JavaScript, Anyway?",
      plain: "HTML = structure. CSS = style. JS = behavior — it makes the page DO things.",
      technical: "JS is the browser's logic layer: it runs code, reacts to clicks/input, and updates the page live.",
    },
    {
      title: "What Is a Variable?",
      plain: "A variable is a labeled box that holds a value.",
      technical: "A named binding to a value in memory — the label stays, the value inside can change.",
    },
    {
      title: "Declaring Variables — var vs let vs const",
      plain: "const = never reassigned. let = can change. var = old & leaky — avoid it.",
      technical: "let/const are block-scoped { }; var is function-scoped and leaks past block boundaries.",
    },
    {
      title: "Primitive Data Types",
      plain: "Every value has a type: Number, String, Boolean, undefined, or null.",
      technical: "JS has 7 primitives total (+ BigInt, Symbol); everything else is a reference type.",
    },
    {
      title: "The typeof Operator (and Its One Famous Lie)",
      plain: "typeof tells you a value's type — except typeof null, which lies.",
      technical: "typeof null === \"object\" is a 1995 bug kept forever for backward compatibility.",
    },
    {
      title: "Coercion vs Conversion",
      plain: "Coercion = JS converts the type for you. Conversion = you convert it yourself.",
      technical: "Coercion is implicit (ToNumber/ToString); conversion is explicit — Number(), String().",
    },
    {
      title: "Arithmetic Operators — + Is Secretly Two Operators",
      plain: "+ joins text if either side is a string. Otherwise it adds numbers.",
      technical: "-, *, /, %, ** always convert both sides to numbers first — only + can concatenate.",
    },
    {
      title: "Comparison Operators — == vs ===",
      plain: "== converts types before comparing. === never does.",
      technical: "== uses Abstract Equality (coercion allowed); === uses Strict Equality (none).",
    },
    {
      title: "Logical Operators & Truthy / Falsy Values",
      plain: "Only 6 values are falsy: false, 0, \"\", null, undefined, NaN. Everything else is truthy.",
      technical: "&&/|| return an actual operand value, not strictly true/false — they short-circuit.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions, escalating hints, never reveals
  // the answer outright. ───────────────────────────────────────────────────
  const quizQuestions = [
    {
      q: "Which keyword should you reach for BY DEFAULT when declaring a new variable whose value will never be reassigned?",
      options: ["var", "let", "const", "It doesn't matter, they're identical"],
      answer: 2,
      hints: [
        "Think about which keyword's name literally hints at \"this never changes\".",
        "Modern style guides recommend this one first, switching only if reassignment is actually needed.",
        "const is the modern default — it blocks reassignment and signals intent clearly.",
      ],
      explanation: "const is the recommended default: it prevents accidental reassignment. let is for values that genuinely change; var is avoided due to its leaky scoping.",
    },
    {
      q: "What is the key scoping difference between let/const and var?",
      options: [
        "There is no difference — they all behave identically",
        "let/const are confined to the nearest { } block; var ignores block boundaries and is function-scoped",
        "var is newer and safer than let/const",
        "let/const can only be used inside functions",
      ],
      answer: 1,
      hints: [
        "Picture a variable declared inside an if { } block — does it \"leak out\" once the block ends?",
        "One of these respects { } boundaries; the other only respects function boundaries.",
        "let/const are block-scoped. var is function-scoped — it leaks out of any block.",
      ],
      explanation: "let/const exist only inside the { } they're declared in. var ignores block boundaries entirely and stays visible through the whole function.",
    },
    {
      q: "What does typeof \"hello\" evaluate to?",
      options: ["\"text\"", "\"string\"", "\"hello\"", "\"char\""],
      answer: 1,
      hints: [
        "typeof returns the NAME of the type as a string, not the value itself.",
        "JavaScript's category for quoted text is one specific lowercase word.",
        "typeof always returns a fixed type-name string — for text, that word is \"string\".",
      ],
      explanation: "typeof returns the type's name. For any text value, that's exactly \"string\" — never \"text\" or \"char\".",
    },
    {
      q: "What does typeof null famously (and confusingly) return?",
      options: ["\"null\"", "\"undefined\"", "\"object\"", "\"none\""],
      answer: 2,
      hints: [
        "This is one of JavaScript's oldest, most well-known bugs — kept for backward compatibility.",
        "It is NOT the word you'd logically expect.",
        "typeof null returns \"object\" — a known quirk from JS's original 1995 implementation.",
      ],
      explanation: "typeof null === \"object\" is a language bug, not a design choice. To check for null, compare value === null directly.",
    },
    {
      q: "What does the expression \"5\" + 3 evaluate to?",
      options: ["8", "\"53\"", "\"8\"", "NaN"],
      answer: 1,
      hints: [
        "Check which operator this is, and whether EITHER side is a string.",
        "+ concatenates the moment either operand is a string.",
        "3 becomes the text \"3\", joined with \"5\", giving the STRING \"53\".",
      ],
      explanation: "+ concatenates whenever either operand is a string. Only when BOTH operands are numbers does + perform addition.",
    },
    {
      q: "What does the expression \"5\" - 3 evaluate to?",
      options: ["\"5-3\"", "NaN", "2", "\"2\""],
      answer: 2,
      hints: [
        "Unlike +, this operator has only ONE job.",
        "- always forces both sides into numbers first.",
        "\"5\" becomes the number 5, then 5 - 3 = 2 (a number, not a string).",
      ],
      explanation: "Every operator except + always converts both operands to numbers before computing. \"5\" - 3 becomes 5 - 3 = 2.",
    },
    {
      q: "What is the main difference between == and ===?",
      options: [
        "=== is just a typo of ==, they behave the same",
        "== compares value only (with type coercion allowed); === compares both value AND type (no coercion)",
        "== is faster but less accurate; === is slower but more accurate",
        "=== only works on numbers",
      ],
      answer: 1,
      hints: [
        "Try comparing 5 == \"5\" versus 5 === \"5\" in your head — same answer?",
        "One operator converts types to make the comparison succeed; the other refuses to.",
        "== allows coercion (5 == \"5\" → true). === requires matching type AND value (5 === \"5\" → false).",
      ],
      explanation: "== coerces operands before comparing. === requires identical type and value with zero coercion — which is why it's the recommended default.",
    },
    {
      q: "What does NaN === NaN evaluate to?",
      options: ["true", "false", "NaN", "It throws an error"],
      answer: 1,
      hints: [
        "NaN literally means \"Not a Number\" — it breaks the rule that a value equals itself.",
        "No comparison involving NaN ever returns true, not even against itself.",
        "NaN is defined as never equal to anything. Use Number.isNaN(value) instead of ==/===.",
      ],
      explanation: "NaN never equals anything, including another NaN. To check for it, use Number.isNaN(value).",
    },
    {
      q: "Which of these is a FALSY value in JavaScript (treated as false in a condition)?",
      options: ["\"0\" (the string zero)", "[] (an empty array)", "0 (the number zero)", "{} (an empty object)"],
      answer: 2,
      hints: [
        "There are only six falsy values in all of JavaScript.",
        "An empty array/object are objects under the hood — objects are always truthy.",
        "0 is one of the six falsy values (false, 0, \"\", null, undefined, NaN). [] and {} are truthy.",
      ],
      explanation: "Exactly six values are falsy: false, 0, \"\", null, undefined, NaN. Everything else — including \"0\", [], {} — is truthy.",
    },
    {
      q: "What does the expression true + true evaluate to?",
      options: ["true", "\"truetrue\"", "2", "NaN"],
      answer: 2,
      hints: [
        "Neither side is a string, so concatenation doesn't apply here.",
        "Booleans convert to numbers for arithmetic: true → 1, false → 0.",
        "true + true → 1 + 1 = 2.",
      ],
      explanation: "When neither operand is a string, + adds numerically. Booleans convert as true→1, false→0, so true + true = 2.",
    },
    {
      q: "In const name = input || \"Guest\";  what does || actually do?",
      options: [
        "It only works with true/false values, so this code is broken",
        "It returns input if input is truthy, otherwise it falls back to \"Guest\"",
        "It always returns \"Guest\", ignoring input completely",
        "It throws an error because input isn't a boolean",
      ],
      answer: 1,
      hints: [
        "|| doesn't strictly return a boolean — it returns one of its actual operand values.",
        "|| returns the first TRUTHY operand, scanning left to right.",
        "If input is truthy, || returns it as-is; if falsy, || falls through to \"Guest\".",
      ],
      explanation: "|| short-circuits, returning the first truthy operand (or the last one if all are falsy) — a common default-value idiom.",
    },
    {
      q: "Why does modern JavaScript style generally avoid using var for new code?",
      options: [
        "var is deprecated and browsers will soon stop supporting it",
        "var's function-scoping (instead of block-scoping) lets variables leak unexpectedly outside the block they were declared in",
        "var only works with numbers, not strings",
        "var is slower to execute than let or const",
      ],
      answer: 1,
      hints: [
        "Think back to the scoping comparison — what happens to a var declared inside an if { } once that block ends?",
        "It's about where the variable remains VISIBLE after you'd expect it to disappear.",
        "var ignores block boundaries and stays visible through the whole function — exactly the bug let/const fix.",
      ],
      explanation: "var leaks out of blocks (if/for/while) into the whole enclosing function, causing accidental reuse bugs — which is why let/const are preferred.",
    },
  ];

  // ── Looping animation frame — drives the small CSS animations in Build &
  // See-It. Cleans up on stage change/unmount so no stray intervals run. ───
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — five expressions, evaluated one at a time, one
  // short line of "why" each. ──────────────────────────────────────────────
  const seeitSteps = [
    { plain: "Both numbers → ordinary addition.", tech: "Both operands are Number → numeric addition.", code: "5 + 3", result: "8", resultColor: "#4ade80" },
    { plain: "A string is present → + switches to joining text.", tech: "ToPrimitive sees a string → both sides ToString'd, then joined.", code: '"5" + 3', result: '"53"', resultColor: "#fb923c" },
    { plain: "Minus only does math → string converts back to a number.", tech: "- always applies ToNumber to both sides.", code: '"5" - 3', result: "2", resultColor: "#38bdf8" },
    { plain: "Booleans convert to numbers for math: true → 1.", tech: "ToNumber(true) = 1, so this is 1 + 1.", code: "true + 1", result: "2", resultColor: "#38bdf8" },
    { plain: "NaN never equals anything — not even itself.", tech: "Per IEEE-754, NaN compares unequal to every value, including NaN.", code: "NaN === NaN", result: "false", resultColor: "#ef4444" },
  ];

  // ── CONTENT: Try-It — preset expressions run in a mock console ─────────
  const exprPresets = [
    { expr: '"5" + 3', result: '"53"', resultType: "string", note: "+ joins text — one side is a string." },
    { expr: '"10" * "2"', result: "20", resultType: "number", note: "* never joins text — both sides become numbers." },
    { expr: "true + true", result: "2", resultType: "number", note: "true → 1, so this is 1 + 1." },
    { expr: "null + 1", result: "1", resultType: "number", note: "null → 0 in arithmetic." },
    { expr: "undefined + 1", result: "NaN", resultType: "nan", note: "undefined → NaN (not 0!) in arithmetic." },
    { expr: "[] + []", result: '""', resultType: "string", note: "Empty arrays → \"\", so \"\" + \"\" is \"\"." },
  ];

  // ── CONTENT: Challenge 1 — expression-to-result matching, each pair now
  // carries its own `hint`, shown the moment a wrong meaning is tapped. ───
  const ch1Pairs = [
    { code: '"5" + 3', meaning: 'String "53"', hint: "Check: is either side text? + joins text when it is." },
    { code: '"5" - 3', meaning: "Number 2", hint: "Minus only ever does math — it never joins text." },
    { code: "typeof null", meaning: '"object"', hint: "This one's the famous JS bug, not the logical answer." },
    { code: '5 === "5"', meaning: "false", hint: "=== never converts types — different types means not equal." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: the classic NaN comparison bug,
  // plus an escalating hint array shown on every wrong tap. ──────────────
  const bugLines = [
    { text: "const PI = 3.14;", buggy: false },
    { text: "if (result == NaN) { /* handle invalid input */ }", buggy: true, why: "NaN is never equal to ANYTHING — not even another NaN — so this condition can NEVER run. Fix: Number.isNaN(result)." },
    { text: "let total = price * quantity;", buggy: false },
    { text: "let isAdult = age >= 18;", buggy: false },
  ];
  const bugHints = [
    "Three of these lines are totally fine — look for one comparing against a special numeric value.",
    "It's the line using == against NaN.",
    "NaN is never equal to anything, even itself — that comparison can never be true. Tap that line.",
  ];

  // ── shared style object — kept visually identical to every other unit. ──
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: (active, done) => ({
      padding: "3px 9px", borderRadius: 99, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none", whiteSpace: "nowrap",
    }),
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px auto", maxWidth: 760, width: "calc(100% - 24px)", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: 10 },
    line: { color: "#cbd5e1", fontSize: "0.88rem", fontWeight: 600, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.84rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
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
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🧮</div>
        <div style={s.h2}>What does this line print?</div>
      </div>

      <div style={s.codeBox}>console.log("5" + 3);</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["8 (the number)", '"53" (the text)', "An error", '"5" (ignores the 3)'].map((opt, i) => (
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>"5" + 3</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.1rem" }}>"53"</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>{sparkGuess.startsWith('"53"') ? "🎯 Exactly right!" : "Not quite — the real answer is \"53\"."}</div>
          <div style={s.line}>+ sees a string → switches to "join text" mode.</div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD ─────────────────────────────────────────────────────────────────
  const renderBuild = () => {
    const nextTitle = buildConcept < concepts.length - 1
      ? concepts[buildConcept + 1].title.split("—")[0].trim()
      : null;
    return (
      <div>
        <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "12px 12px 0" }}>
          {concepts.map((c, i) => (
            <button key={i} onClick={() => { setBuildConcept(i); setBuildMode("plain"); }} style={{
              flexShrink: 0, padding: "6px 12px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: "0.72rem",
              cursor: "pointer",
              background: buildConcept === i ? "#38bdf8" : "#1e293b",
              color: buildConcept === i ? "#0f172a" : "#e2e8f0",
            }}>{`${i + 1}. ${c.title.split("—")[0].trim()}`}</button>
          ))}
        </div>
        <div style={s.card}>
          <div style={s.h3}>{concepts[buildConcept].title}</div>
          <div style={s.animBox}><ConceptAnimation index={buildConcept} frame={animFrame} /></div>
          <div style={s.toggleRow}>
            <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
            <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            {buildMode === "plain" && <div style={{ ...s.line, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
            {buildMode === "tech" && <div style={{ ...s.line, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            {nextTitle
              ? <button style={s.btn()} onClick={() => { setBuildConcept(buildConcept + 1); setBuildMode("plain"); }}>Next: {nextTitle} →</button>
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
            <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── SEE IT ────────────────────────────────────────────────────────────────
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch JavaScript Decide</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>console.log({step.code});</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", margin: "0 0 12px", fontFamily: "'Cascadia Code','Consolas',monospace", textAlign: "center" }}>
          <span style={{ color: step.resultColor, fontWeight: 700, fontSize: "1.05rem" }}>{step.result}</span>
        </div>
        <div style={{ ...s.line, color: "#e2e8f0", textAlign: "center" }}>{seeitMode === "plain" ? step.plain : step.tech}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
          {seeitStep < seeitSteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
          {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
        </div>
      </div>
    );
  };

  // ── TRY IT ────────────────────────────────────────────────────────────────
  const renderTryIt = () => {
    const active = exprPresets.find((p) => p.expr === exprPicked);
    const colorFor = (type) => (type === "string" ? "#fb923c" : type === "nan" ? "#ef4444" : "#7dd3fc");

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run It, Watch It Evaluate</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {exprPresets.map((p) => (
            <button key={p.expr} onClick={() => { setExprPicked(p.expr); if (exprPicked !== p.expr) setTriedCount((c) => c + 1); }} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              background: exprPicked === p.expr ? "#38bdf8" : "#0f172a", color: exprPicked === p.expr ? "#0f172a" : "#7dd3fc",
            }}>{p.expr}</button>
          ))}
        </div>

        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.76rem" }}>{active.expr}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: colorFor(active.resultType), fontWeight: 700, fontSize: "1rem" }}>{active.result}</div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "0.8rem" }}>Tap an expression above ↑</div>
          )}
        </div>

        {active && (
          <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginTop: 12, textAlign: "center" }}>
            <div style={{ ...s.line, color: "#94a3b8", marginBottom: 0 }}>{active.note}</div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 expressions to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Match Expression → Result</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Spot the Classic Bug</div>
          <div style={{ ...s.line, marginBottom: 14 }}>Tap the one line with the bug.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
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
          <div style={s.h2}>Unit 4.1 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now predict any +, -, ==, or === result.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What JavaScript actually is",
              "What a variable is, and how to declare one",
              "var vs let vs const",
              "The primitive data types",
              "typeof — and its famous typeof null quirk",
              "Coercion vs conversion",
              "Arithmetic operators — why + is different",
              "== vs ===, and the six falsy values",
            ].map((l, i) => (
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
        <div style={s.topTitle}>Unit 4.1 — Variables, Types & Operators</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
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
// `index` picks which of the 9 concepts to illustrate; `frame` (0-59,
// looping) drives oscillation. These animations now carry the TEACHING
// itself (arrows connecting cause→effect, before/after states, explicit
// labels) since the text beside them is deliberately just one sentence.
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40; // 0→1 sawtooth, reused by every animation below
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // Concept 0 — What is JavaScript: three stacked layers, HTML/CSS dimmed,
  // JS glowing + an arrow pointing at a button that "reacts" on a loop —
  // visually shows JS is the BEHAVIOR layer, not structure or style.
  if (index === 0) {
    const clicked = pos > 0.7;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "5px 10px", fontSize: "0.62rem", color: "#64748b" }}>HTML: structure</div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "5px 10px", fontSize: "0.62rem", color: "#64748b" }}>CSS: style</div>
          </div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓</div>
          <div style={{ background: "#38bdf833", border: "2px solid #38bdf8", borderRadius: 8, padding: "8px 14px", fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8" }}>JS: behavior</div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓ click</div>
          <button style={{
            background: clicked ? "#4ade80" : "#0f172a", color: clicked ? "#0f172a" : "#94a3b8",
            border: "1px solid #38bdf8", borderRadius: 8, padding: "6px 14px", fontSize: "0.74rem", fontWeight: 700, transition: "all 0.2s",
          }}>{clicked ? "Done! ✅" : "Click Me"}</button>
        </div>
      </div>
    );
  }

  // Concept 1 — What is a variable: SAME type (Number), value cycling
  // 5 → 12 → 7, label "score" fixed beside it via an arrow. Fixes the
  // earlier version, which wrongly switched types.
  if (index === 1) {
    const values = [5, 12, 7];
    const which = Math.floor(pos * values.length) % values.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#38bdf8", fontWeight: 700 }}>score</div>
          {arrow}
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "#1e293b", border: "2px solid #38bdf8", borderRadius: 10, width: 70, padding: "12px 0", fontSize: "1.3rem", fontWeight: 800, color: "#f1f5f9" }}>{values[which]}</div>
            <div style={{ marginTop: 6, fontSize: "0.6rem", color: "#4ade80", fontWeight: 700 }}>Number, every time</div>
          </div>
        </div>
      </div>
    );
  }

  // Concept 2 — var/let/const: var's box visibly escapes a dashed block
  // boundary; let/const stay trapped inside it.
  if (index === 2) {
    const highlight = Math.floor(pos * 3) % 3;
    const items = [
      { label: "var", color: "#fb923c", escapes: true },
      { label: "let", color: "#38bdf8", escapes: false },
      { label: "const", color: "#4ade80", escapes: false },
    ];
    return (
      <div style={base}>
        <div style={{ border: "2px dashed #334155", borderRadius: 10, padding: "10px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: -10, left: 8, background: "#0f172a", fontSize: "0.56rem", color: "#475569", padding: "0 4px" }}>{ "{ block }" }</div>
          <div style={{ display: "flex", gap: 10 }}>
            {items.map((it, i) => (
              <div key={it.label} style={{
                textAlign: "center", opacity: highlight === i ? 1 : 0.4, transition: "all 0.3s",
                transform: it.escapes && highlight === i ? "translateY(28px)" : "none",
              }}>
                <div style={{ background: it.color + "22", border: `2px solid ${it.color}`, borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontWeight: 700, color: it.color, fontSize: "0.76rem" }}>{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Concept 3 — Primitive types: label → arrow → example value, cycling.
  if (index === 3) {
    const types = [
      { label: "Number", val: "5", color: "#38bdf8" },
      { label: "String", val: '"hi"', color: "#fb923c" },
      { label: "Boolean", val: "true", color: "#4ade80" },
      { label: "undefined", val: "undefined", color: "#a78bfa" },
      { label: "null", val: "null", color: "#ef4444" },
    ];
    const which = Math.floor(pos * types.length) % types.length;
    const cur = types[which];
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: cur.color }}>{cur.label}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 800, color: cur.color }}>{cur.val}</div>
        </div>
      </div>
    );
  }

  // Concept 4 — typeof and its lie: typeof 5 (correct) vs typeof null
  // (the lie), each with an arrow to its returned string.
  if (index === 4) {
    const isLie = pos >= 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#e2e8f0" }}>{isLie ? "typeof null" : "typeof 5"}</div>
          {arrow}
          <div style={{ fontSize: "1rem", fontWeight: 800, color: isLie ? "#ef4444" : "#4ade80" }}>"{isLie ? "object" : "number"}"</div>
          {isLie && <div style={{ fontSize: "1.1rem" }}>⚠️</div>}
        </div>
      </div>
    );
  }

  // Concept 5 — Coercion vs conversion: two side-by-side arrows, one
  // labeled "implicit" (JS did it), one "explicit" (you did it).
  if (index === 5) {
    const implicit = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#94a3b8" }}>{implicit ? '"5" - 0' : 'Number("5")'}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, color: "#38bdf8" }}>5</div>
          <div style={{
            fontSize: "0.6rem", fontWeight: 700, color: implicit ? "#fb923c" : "#4ade80",
            border: `1px solid ${implicit ? "#fb923c" : "#4ade80"}`, borderRadius: 99, padding: "2px 8px",
          }}>{implicit ? "implicit" : "explicit"}</div>
        </div>
      </div>
    );
  }

  // Concept 6 — Arithmetic: + flips between "join" mode and "add" mode,
  // arrow + a coloured tag naming which mode is active.
  if (index === 6) {
    const joinMode = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#e2e8f0" }}>{joinMode ? '"5" + 3' : "5 + 3"}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 800, color: joinMode ? "#fb923c" : "#4ade80" }}>{joinMode ? '"53"' : "8"}</div>
          <div style={{
            fontSize: "0.6rem", fontWeight: 700, color: joinMode ? "#fb923c" : "#4ade80",
            border: `1px solid ${joinMode ? "#fb923c" : "#4ade80"}`, borderRadius: 99, padding: "2px 8px",
          }}>{joinMode ? "join" : "add"}</div>
        </div>
      </div>
    );
  }

  // Concept 7 — Comparison: flips between == (coerces) and === (doesn't)
  // for the same comparison, arrow to the boolean result.
  if (index === 7) {
    const loose = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#e2e8f0" }}>5 {loose ? "==" : "==="} "5"</div>
          {arrow}
          <div style={{ fontSize: "1rem", fontWeight: 800, color: loose ? "#4ade80" : "#ef4444" }}>{loose ? "true" : "false"}</div>
        </div>
      </div>
    );
  }

  // Concept 8 — Logical/truthy-falsy: cycles a value with a ✅/❌ tag.
  const samples = [
    { val: "0", truthy: false },
    { val: '"0"', truthy: true },
    { val: "[]", truthy: true },
    { val: "null", truthy: false },
  ];
  const which = Math.floor(pos * samples.length) % samples.length;
  const cur = samples[which];
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 800, color: "#e2e8f0" }}>{cur.val}</div>
        {arrow}
        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: cur.truthy ? "#4ade80" : "#ef4444" }}>{cur.truthy ? "✅ truthy" : "❌ falsy"}</div>
      </div>
    </div>
  );
}

// ── TAG MATCH (shared minigame pattern, reused across the course) ─────────
// Student taps a "code" item, then a "meaning" item. Correct pairs lock in
// green. A WRONG tap now shows that pair's `hint` immediately (per student
// feedback — silence on a wrong tap was the original problem), staying
// visible until the student selects a new code item.
function TagMatch({ pairs, onDone }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [flashWrong, setFlashWrong] = useState(null); // meaning that briefly flashes red
  const [hintMsg, setHintMsg] = useState(null); // persistent hint text after a wrong tap
  const shuffledMeanings = useRef([...pairs].sort(() => Math.random() - 0.5)).current;

  const handleCode = (code) => { if (!matched[code]) { setSelected({ type: "code", value: code }); setHintMsg(null); } };
  const handleMeaning = (meaning) => {
    if (selected?.type === "code") {
      const pair = pairs.find((p) => p.code === selected.value);
      const correct = pair?.meaning === meaning;
      if (correct) {
        const newMatched = { ...matched, [selected.value]: meaning };
        setMatched(newMatched);
        setSelected(null);
        setHintMsg(null);
        if (Object.keys(newMatched).length === pairs.length) onDone();
      } else {
        setFlashWrong(meaning);
        setHintMsg(pair?.hint || "Not quite — look at the code again.");
        setTimeout(() => { setFlashWrong(null); setSelected(null); }, 700);
      }
    } else {
      setSelected({ type: "meaning", value: meaning });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 140px" }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>EXPRESSIONS</div>
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
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>RESULT</div>
          {shuffledMeanings.map((p) => {
            const isUsed = Object.values(matched).includes(p.meaning);
            return (
              <div key={p.meaning} onClick={() => !isUsed && handleMeaning(p.meaning)} style={{
                background: isUsed ? "#14532d33" : flashWrong === p.meaning ? "#450a0a" : "#0f172a",
                border: isUsed ? "1px solid #4ade8044" : flashWrong === p.meaning ? "2px solid #ef4444" : "1px solid #334155",
                borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: isUsed ? "default" : "pointer",
                fontSize: "0.78rem", color: isUsed ? "#4ade80" : "#e2e8f0",
              }}>{isUsed ? "✅ " : ""}{p.meaning}</div>
            );
          })}
        </div>
      </div>
      {hintMsg && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
          <span style={{ color: "#fde68a", fontSize: "0.78rem" }}>💡 {hintMsg}</span>
        </div>
      )}
    </div>
  );
}

// ── BUG HUNT (shared minigame pattern, reused across the course) ──────────
// Student taps lines until they tap the one flagged `buggy: true`. Every
// WRONG tap now increments wrongAttempts and shows the matching escalating
// hint from the `hints` prop (per student feedback) — never just a silent
// red flash. The correct tap reveals the "why" explanation.
function BugHunt({ lines, hints, onDone }) {
  const [revealed, setRevealed] = useState(false);
  const [wrongTap, setWrongTap] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  function tap(line, i) {
    if (revealed) return;
    if (line.buggy) { setRevealed(true); onDone(); }
    else { setWrongTap(i); setWrongAttempts((a) => a + 1); setTimeout(() => setWrongTap(null), 600); }
  }

  const hintIndex = Math.min(wrongAttempts - 1, (hints?.length || 1) - 1);

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
      {!revealed && wrongAttempts > 0 && hints?.length > 0 && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{hints[hintIndex]}</div>
        </div>
      )}
      {revealed && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>Found it!</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{lines.find((l) => l.buggy)?.why}</div>
        </div>
      )}
    </div>
  );
}
