// ============================================================================
//  UNIT 4.5 — "Waiting Without Freezing: Fetch & Promises"
//  Module: M4 — JavaScript Fundamentals (fifth and final unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly like every lesson: App.jsx looks
//    up "Unit4_5" in config/course.config.js, renders
//    <Unit4_5 student={...} onUnitComplete={...} />, and waits for
//    onUnitComplete() to fire exactly once, from the Quiz screen's final
//    button only. No api.js / gas.config.js imports here.
//
//  HOUSE STYLE (matches every other Unit4 file exactly):
//  - Build-stage blurbs are ONE short sentence; ConceptAnimation carries
//    the real teaching via labels/arrows/before-after states.
//  - Every wrong tap in TagMatch / BugHunt shows an explanatory hint.
//  - Quiz wrong answers never reveal the correct option — an escalating,
//    never-disappearing hint shows instead.
//
//  SIX-STAGE FLOW:
//    Stage 0 SPARK     — predict the print ORDER of a classic
//                         sync/setTimeout/sync puzzle, before any teaching.
//    Stage 1 BUILD     — 9 concepts: async code, what a Promise is,
//                         fetch() basics, .then() chaining, .catch(),
//                         async/await, try/catch with await, Promise.all,
//                         why async matters (not blocking the page).
//    Stage 2 SEE IT    — five real snippets evaluated step by step.
//    Stage 3 TRY IT    — preset async expressions, shown live.
//    Stage 4 CHALLENGE — tag-match (code → behavior) with hints, then a
//                         bug hunt (forgetting await) with escalating hints.
//    Stage 5 QUIZ      — 12 questions, escalating hints.
//
//  MOBILE-FRIENDLY: % widths, flexWrap, minmax()/clamp() — no fixed px.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit4_5({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ──────────────────────────────────────────────────
  const [stage, setStage] = useState(0);

  // ── SPARK ────────────────────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD ────────────────────────────────────────────────────────────────
  const [buildConcept, setBuildConcept] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT ───────────────────────────────────────────────────────────────
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT ───────────────────────────────────────────────────────────────
  const [exprPicked, setExprPicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0);

  // ── CHALLENGE ────────────────────────────────────────────────────────────
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // ── looping animation frame ──────────────────────────────────────────────
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: nine Build-stage concepts ──────────────────────────────────
  const concepts = [
    {
      title: "What Is Asynchronous Code?",
      plain: "Async code says 'start this, but don't wait — keep going, and I'll let you know when it's done.'",
      technical: "Async operations are non-blocking: the call returns immediately, and a callback/Promise resolves later when the work finishes.",
    },
    {
      title: "What Is a Promise?",
      plain: "A Promise is a placeholder for a value that isn't ready yet — pending, then fulfilled or rejected.",
      technical: "A Promise wraps an eventual value with exactly three states: pending → fulfilled or rejected, transitioning only once.",
    },
    {
      title: "fetch() Basics",
      plain: "fetch() asks a server for data over the network and gives back a Promise.",
      technical: "fetch(url) returns a Promise that resolves to a Response object once headers arrive (the body still needs to be read, e.g. via .json()).",
    },
    {
      title: ".then() Chaining",
      plain: ".then() says 'once that Promise resolves, do this next' — and you can chain several.",
      technical: "Each .then() returns a new Promise, allowing sequential chaining of asynchronous steps.",
    },
    {
      title: ".catch() for Errors",
      plain: ".catch() catches anything that went wrong anywhere earlier in the chain.",
      technical: ".catch() handles any rejection propagating through the Promise chain, regardless of which .then() it occurred in.",
    },
    {
      title: "async / await",
      plain: "await pauses JUST this function until the Promise settles — written like ordinary, top-to-bottom code.",
      technical: "await unwraps a Promise's resolved value inside an async function, without blocking the rest of the program.",
    },
    {
      title: "try / catch with await",
      plain: "Wrap awaited code in try/catch to handle a rejected Promise gracefully.",
      technical: "An awaited rejection throws inside the async function; try/catch intercepts it just like a synchronous exception.",
    },
    {
      title: "Promise.all — Running Things in Parallel",
      plain: "Promise.all runs several Promises at once and waits for ALL of them to finish.",
      technical: "Promise.all(iterable) resolves when every Promise resolves, or rejects immediately if any one rejects.",
    },
    {
      title: "Why Async Matters",
      plain: "Without async, a slow network request would freeze the entire page until it finished.",
      technical: "JS is single-threaded; async I/O keeps the main thread free to handle rendering and user input while waiting.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  const quizQuestions = [
    {
      q: "console.log('A'); setTimeout(()=>console.log('B'), 0); console.log('C'); — what order prints?",
      options: ["A, B, C", "A, C, B", "B, A, C", "C, B, A"],
      answer: 1,
      hints: [
        "setTimeout never runs immediately, even with a delay of 0ms.",
        "All the synchronous lines (A and C) run to completion BEFORE any timer callback gets a turn.",
        "Synchronous code (A, then C) always finishes first; the setTimeout callback (B) runs after, even with 0ms delay.",
      ],
      explanation: "setTimeout always defers its callback to the event queue, run only after all currently queued synchronous code finishes — so A and C print first, then B.",
    },
    {
      q: "What are the three possible states of a Promise?",
      options: [
        "true, false, null",
        "pending, fulfilled, rejected",
        "loading, success, error (but no in-between)",
        "started, running, finished",
      ],
      answer: 1,
      hints: [
        "These are the EXACT, specific terms the Promise spec uses — not generic everyday words.",
        "One of them describes 'still waiting'; the other two describe how it finally settled.",
        "A Promise starts pending, then settles into either fulfilled (succeeded) or rejected (failed) — and never changes again after that.",
      ],
      explanation: "A Promise starts pending, then transitions exactly once to either fulfilled (success) or rejected (failure) — it can never change state again afterward.",
    },
    {
      q: "fetch(\"/api/users\") — what does this immediately return?",
      options: [
        "The actual user data, ready to use right away",
        "A Promise that will eventually resolve to a Response object",
        "undefined, until the request finishes",
        "An error, because fetch always needs await",
      ],
      answer: 1,
      hints: [
        "fetch() never blocks and waits — it hands you something you can work with LATER.",
        "That 'something' is a specific, well-known JS object type covered in this unit's title.",
        "fetch() returns a Promise immediately; that Promise resolves to a Response object once the request completes.",
      ],
      explanation: "fetch() returns a Promise right away, without waiting for the network. That Promise eventually resolves to a Response object — you still need .json() (or similar) to read the actual body.",
    },
    {
      q: "fetch(url).then(res => res.json()).then(data => console.log(data));\nWhat does the SECOND .then() receive as its argument?",
      options: [
        "The raw Response object",
        "The parsed data returned by the FIRST .then()'s callback (res.json())",
        "Nothing — it always receives undefined",
        "The original url string",
      ],
      answer: 1,
      hints: [
        "Each .then() passes along whatever its callback function RETURNED.",
        "The first .then()'s callback returned the result of res.json() — itself a Promise that resolves to the parsed data.",
        "Chained .then()s receive the resolved return value of the PREVIOUS .then()'s callback — here, the parsed JSON data.",
      ],
      explanation: ".then() chains pass along whatever the previous callback returned (automatically unwrapping if it's a Promise). Here, the second .then() receives the parsed JSON data.",
    },
    {
      q: "fetch(url).then(res=>res.json()).then(data=>{...}).catch(err=>console.log(err));\nWhere does .catch() catch errors from?",
      options: [
        "Only from the very first .then()",
        "Only from the very last .then()",
        "From ANY rejection occurring anywhere earlier in the chain",
        ".catch() only works with async/await, not .then() chains",
      ],
      answer: 2,
      hints: [
        "A rejection anywhere in a .then() chain skips ahead, looking for the nearest .catch().",
        "It doesn't matter which specific step failed — the same single .catch() handles it.",
        ".catch() intercepts a rejection from ANY point earlier in the chain, no matter which .then() it originated from.",
      ],
      explanation: "A single .catch() at the end of a chain catches a rejection from any preceding .then(), since rejections skip remaining .then()s and jump straight to the nearest .catch().",
    },
    {
      q: "async function getData() { const data = await fetch(url); return data; }\nWhat does the 'await' keyword actually do here?",
      options: [
        "It pauses the ENTIRE program/browser until fetch finishes",
        "It pauses only THIS async function's execution until the Promise settles, without blocking anything else",
        "It cancels the fetch request",
        "It converts fetch into a synchronous function globally",
      ],
      answer: 1,
      hints: [
        "The pause is very LOCAL — scoped to just this one function's flow.",
        "The rest of the page (rendering, clicks, other code) keeps running normally.",
        "await only pauses the async function it's written in; the rest of the program is completely unaffected and keeps running.",
      ],
      explanation: "await pauses execution only within its own async function, waiting for the Promise to settle — it never blocks the rest of the JS engine or the browser's UI thread.",
    },
    {
      q: "async function getData() {\n  try { const res = await fetch(url); return await res.json(); }\n  catch (err) { console.log('failed:', err); }\n}\nWhat happens if the fetch fails (e.g. no network)?",
      options: [
        "The whole program crashes",
        "The catch block runs, logging the error, instead of the function crashing unhandled",
        "getData() returns the string 'failed'",
        "Nothing happens — failures are silently ignored by default",
      ],
      answer: 1,
      hints: [
        "An awaited rejection behaves just like a regular thrown exception inside that function.",
        "What's the standard JS construct for catching a thrown exception?",
        "try/catch around an await intercepts the rejection exactly like a thrown error — the catch block runs and logs it, rather than crashing unhandled.",
      ],
      explanation: "When an awaited Promise rejects, it throws inside the async function — exactly like a synchronous throw — so a surrounding try/catch can handle it gracefully.",
    },
    {
      q: "Promise.all([fetch(url1), fetch(url2)]) — when does this resolve?",
      options: [
        "As soon as the FIRST of the two requests finishes",
        "Only once ALL the requests have resolved (or it rejects immediately if any one fails)",
        "It never resolves with more than one Promise",
        "After exactly 1 second, regardless of the requests",
      ],
      answer: 1,
      hints: [
        "The name itself is a strong clue — think about what 'all' implies versus, say, 'race' or 'any'.",
        "It's designed for running several independent things in PARALLEL and waiting for the full set.",
        "Promise.all waits for every Promise in the list to resolve, resolving with an array of all the results — or it rejects immediately on the first failure.",
      ],
      explanation: "Promise.all resolves only once every Promise in the array resolves (giving an array of results in the same order), or rejects as soon as any single one rejects.",
    },
    {
      q: "Why does running a slow network request asynchronously matter for the user experience?",
      options: [
        "It doesn't matter — sync and async feel the same to users",
        "Without async, the slow request would freeze/block the whole page (no scrolling, no clicking) until it finished",
        "Async code runs the request faster over the network",
        "Async is only relevant for mobile devices",
      ],
      answer: 1,
      hints: [
        "JavaScript in the browser runs on a SINGLE thread shared with rendering and click handling.",
        "If that one thread is stuck waiting synchronously, nothing else — including the page itself — can respond.",
        "Async I/O keeps the single JS thread free to handle rendering/clicks while the network request happens in the background — without it, a slow request would freeze the entire page.",
      ],
      explanation: "Because JavaScript runs on a single main thread shared with the UI, a long synchronous wait would freeze the entire page. Async operations free that thread to keep handling rendering and input while waiting.",
    },
    {
      q: "const p = new Promise((resolve, reject) => { setTimeout(() => resolve(\"done\"), 1000); });\nWhat happens immediately when this line runs?",
      options: [
        "The program pauses for 1000ms right here",
        "The Promise is created in the pending state; resolve(\"done\") only happens later, after the timeout",
        "\"done\" is returned instantly",
        "This throws a syntax error",
      ],
      answer: 1,
      hints: [
        "Creating a Promise does not block anything — the function inside runs, but resolve/reject may happen much later.",
        "Right after this line, what STATE would the Promise be in, before the 1000ms has passed?",
        "The Promise starts pending immediately; only after the 1000ms timer fires does resolve(\"done\") run, transitioning it to fulfilled.",
      ],
      explanation: "Constructing a Promise runs its executor function synchronously, but resolve/reject can be called whenever the async work (here, after 1000ms) actually finishes — the Promise sits in 'pending' until then.",
    },
    {
      q: "What is the main practical advantage of async/await syntax over writing long .then() chains?",
      options: [
        "async/await runs strictly faster than .then() chains at runtime",
        "async/await reads top-to-bottom like ordinary synchronous code, which is often easier to follow than nested/chained .then() callbacks",
        ".then() chains cannot handle more than one asynchronous step",
        "async/await removes the need for fetch() entirely",
      ],
      answer: 1,
      hints: [
        "This is mostly a readability/style difference, not a performance difference — both compile down to Promises underneath.",
        "Look at how each piece of code visually FLOWS on the page.",
        "async/await is syntactic sugar over Promises — it lets asynchronous steps read like ordinary sequential code, often clearer than deeply chained or nested .then() calls.",
      ],
      explanation: "async/await and .then() chains are functionally equivalent (both use Promises underneath) — async/await is mainly valued for reading like ordinary sequential code, which is often easier to follow.",
    },
    {
      q: "async function load() { const res = fetch(url); console.log(res); }\nWhat will console.log(res) actually print here (notice: no await before fetch)?",
      options: [
        "The parsed JSON data from the response",
        "A pending Promise object — not the actual Response or data, because await was never used",
        "undefined",
        "This throws an error because fetch must always be awaited",
      ],
      answer: 1,
      hints: [
        "Forgetting await doesn't cause an error by itself — it just leaves you holding something other than what you expected.",
        "Without await, 'res' is still the raw, unresolved thing that fetch() returns directly.",
        "Without await, res is just the Promise object itself (likely still pending) — not the Response or any data. This is a very common bug.",
      ],
      explanation: "Omitting await on fetch(url) means res is the Promise itself, not its resolved value — a classic bug. The fix is const res = await fetch(url);",
    },
  ];

  // ── looping animation frame ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It steps ────────────────────────────────────────────────
  const seeitSteps = [
    { plain: "A Promise starts out pending — neither success nor failure yet.", tech: "new Promise(...) is synchronously pending until its executor calls resolve/reject.", code: "const p = new Promise((res)=>setTimeout(()=>res(42),1000));\np", result: "Promise {<pending>}", resultColor: "#94a3b8" },
    { plain: "Once the timer fires, the Promise settles to fulfilled with its value.", tech: "After resolve(42) runs, the Promise transitions permanently to fulfilled with value 42.", code: "// ...1000ms later\np", result: "Promise {<fulfilled>: 42}", resultColor: "#4ade80" },
    { plain: ".then() receives the resolved value once it's ready.", tech: "The .then() callback fires asynchronously with the fulfilled value as its argument.", code: "p.then(v => console.log(v))", result: "42", resultColor: "#38bdf8" },
    { plain: "await unwraps the resolved value directly, no .then() needed.", tech: "Inside an async function, await pauses until the Promise settles and yields its value.", code: "async function f(){ return await p; }\nf()", result: "Promise {<fulfilled>: 42}", resultColor: "#a78bfa" },
    { plain: "Forgetting await leaves you holding the raw, unresolved Promise.", tech: "Without await, the expression evaluates to the Promise object itself, not its value.", code: "async function f(){ const v = fetch(url); return v; }", result: "Promise {<pending>} (likely a bug)", resultColor: "#ef4444" },
  ];

  // ── CONTENT: Try-It presets ───────────────────────────────────────────────
  const exprPresets = [
    { expr: "new Promise(res=>res(1))", result: "Promise {<fulfilled>: 1}", resultType: "text", note: "resolve(1) runs immediately, so it's fulfilled right away." },
    { expr: "Promise.resolve(5).then(v=>v*2)", result: "Promise {<fulfilled>: 10}", resultType: "text", note: "The .then() callback's return value becomes the next Promise's value." },
    { expr: "Promise.reject('oops').catch(e=>e)", result: "Promise {<fulfilled>: 'oops'}", resultType: "text", note: ".catch() handles the rejection and turns the chain fulfilled again." },
    { expr: "await Promise.resolve(7)", result: "7", resultType: "number", note: "await unwraps the resolved value directly — no .then() needed." },
    { expr: "Promise.all([Promise.resolve(1), Promise.resolve(2)])", result: "Promise {<fulfilled>: [1, 2]}", resultType: "text", note: "Promise.all waits for every Promise, then resolves with all results in order." },
    { expr: "fetch(url) // no await", result: "Promise {<pending>}", resultType: "text", note: "Without await, you get the raw, unresolved Promise — a common bug." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch with hints ──────────────────────────
  const ch1Pairs = [
    { code: ".then(fn)", meaning: "Runs fn once the Promise resolves", hint: "It's the 'do this NEXT, once ready' step in a chain." },
    { code: ".catch(fn)", meaning: "Runs fn if anything earlier rejected", hint: "It catches failures from ANYWHERE earlier in the chain." },
    { code: "await p", meaning: "Pauses this function, unwraps the value", hint: "It only pauses the function it's written inside — nothing else." },
    { code: "Promise.all([...])", meaning: "Waits for every Promise to finish", hint: "Think 'all' as in ALL of them, run together." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: forgetting await ────────────────────
  const bugLines = [
    { text: "const res = await fetch(url);", buggy: false },
    { text: "const data = res.json();", buggy: true, why: "res.json() also returns a Promise! Without await, 'data' is a pending Promise, not the actual parsed object. Fix: await res.json();" },
    { text: "console.log(data.name);", buggy: false },
    { text: "} catch (err) { console.log(err); }", buggy: false },
  ];
  const bugHints = [
    "Three of these lines are fine — one is missing a keyword you'd expect right before it.",
    "Look at the line calling .json() — what does that method actually return?",
    "res.json() returns a Promise too, and it's missing its own await. Tap that line.",
  ];

  // ── shared style object — identical pattern to other units ──────────────
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
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>⏱️</div>
        <div style={s.h2}>In what order do these print?</div>
      </div>

      <div style={s.codeBox}>{`console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");`}</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["A, B, C", "A, C, B", "B, A, C", "C, B, A"].map((opt, i) => (
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
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>print order</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>A, C, B</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>{sparkGuess === "A, C, B" ? "🎯 Exactly right!" : "Not quite — the real order is A, C, B."}</div>
          <div style={s.line}>setTimeout always waits its turn, even with 0ms delay — sync code runs first.</div>
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
        <div style={s.codeBox}>{step.code}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", margin: "0 0 12px", fontFamily: "'Cascadia Code','Consolas',monospace", textAlign: "center" }}>
          <span style={{ color: step.resultColor, fontWeight: 700, fontSize: "0.92rem" }}>{step.result}</span>
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
    const colorFor = (type) => (type === "number" ? "#4ade80" : "#7dd3fc");

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run It, Watch It Evaluate</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {exprPresets.map((p) => (
            <button key={p.expr} onClick={() => { setExprPicked(p.expr); if (exprPicked !== p.expr) setTriedCount((c) => c + 1); }} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
              background: exprPicked === p.expr ? "#38bdf8" : "#0f172a", color: exprPicked === p.expr ? "#0f172a" : "#7dd3fc",
            }}>{p.expr}</button>
          ))}
        </div>

        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{active.expr}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: colorFor(active.resultType), fontWeight: 700, fontSize: "0.9rem" }}>{active.result}</div>
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
          <div style={s.h2}>🎯 Match Code → Behavior</div>
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
          <div style={s.h2}>Unit 4.5 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} That's all five units of Module 4 — JavaScript Fundamentals — done!</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What asynchronous code is",
              "What a Promise is (pending/fulfilled/rejected)",
              "fetch() basics",
              ".then() chaining",
              ".catch() for errors",
              "async/await",
              "try/catch with await",
              "Promise.all",
              "Why async matters for the page staying responsive",
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
        <div style={{ ...s.h3, color: "#f1f5f9", fontSize: "0.9rem", marginBottom: 14, whiteSpace: "pre-wrap" }}>{q.q}</div>
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
        <div style={s.topTitle}>Unit 4.5 — Fetch & Promises</div>
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

// ── CONCEPT ANIMATIONS — one illustration per Build-stage concept ─────────
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — Async: a request fires, the rest of the page keeps moving.
  if (index === 0) {
    const moving = Math.floor(pos * 6);
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>request sent, not waiting...</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 99, background: moving % 5 === i ? "#38bdf8" : "#334155" }} />
            ))}
          </div>
          <div style={{ fontSize: "0.62rem", color: "#4ade80" }}>page keeps responding ✅</div>
        </div>
      </div>
    );
  }

  // 1 — Promise: pending dot transitioning to fulfilled/rejected.
  if (index === 1) {
    const settled = pos > 0.5;
    const ok = pos < 0.75;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${!settled ? "#94a3b8" : ok ? "#4ade80" : "#ef4444"}`, fontSize: "0.6rem", fontWeight: 700,
            color: !settled ? "#94a3b8" : ok ? "#4ade80" : "#ef4444", transition: "all 0.2s",
          }}>{!settled ? "pending" : ok ? "✅" : "❌"}</div>
        </div>
      </div>
    );
  }

  // 2 — fetch(): arrow to a server, then a Response object comes back.
  if (index === 2) {
    const returned = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "0.66rem", color: "#94a3b8" }}>fetch(url)</div>
          {arrow}
          <div style={{ fontSize: "1.3rem" }}>🌐</div>
          {arrow}
          <div style={{ fontSize: "0.66rem", fontWeight: 700, color: returned ? "#4ade80" : "#475569" }}>{returned ? "Response" : "..."}</div>
        </div>
      </div>
    );
  }

  // 3 — .then() chain: boxes lighting up left to right in sequence.
  if (index === 3) {
    const step = Math.floor(pos * 3) % 3;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[".then(a)", ".then(b)", ".then(c)"].map((l, i) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ border: step === i ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 6, padding: "6px 8px", fontSize: "0.62rem", color: step === i ? "#38bdf8" : "#64748b", fontFamily: "monospace" }}>{l}</div>
              {i < 2 && <span style={{ color: "#475569" }}>→</span>}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // 4 — .catch(): an error jumping over .then()s straight to .catch().
  if (index === 4) {
    const jumping = pos > 0.4 && pos < 0.8;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
          <div style={{ border: "1px solid #ef4444", borderRadius: 6, padding: "6px 8px", fontSize: "0.62rem", color: "#ef4444" }}>❌ reject</div>
          <div style={{ fontSize: "0.9rem", color: jumping ? "#ef4444" : "#475569" }}>⤳</div>
          <div style={{ border: "1px dashed #334155", borderRadius: 6, padding: "6px 8px", fontSize: "0.6rem", color: "#475569", opacity: 0.4 }}>.then()</div>
          <div style={{ fontSize: "0.9rem", color: jumping ? "#ef4444" : "#475569" }}>⤳</div>
          <div style={{ border: jumping ? "2px solid #ef4444" : "1px solid #334155", borderRadius: 6, padding: "6px 8px", fontSize: "0.62rem", color: jumping ? "#ef4444" : "#64748b" }}>.catch()</div>
        </div>
      </div>
    );
  }

  // 5 — async/await: code reading top-to-bottom, pausing on await.
  if (index === 5) {
    const paused = Math.floor(pos * 3) % 3 === 1;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start", fontFamily: "monospace", fontSize: "0.66rem" }}>
          <div style={{ color: "#94a3b8" }}>const a = 1;</div>
          <div style={{ color: paused ? "#fb923c" : "#94a3b8", fontWeight: paused ? 700 : 400 }}>await fetch(url) {paused ? "⏸" : ""}</div>
          <div style={{ color: "#94a3b8" }}>console.log(a);</div>
        </div>
      </div>
    );
  }

  // 6 — try/catch: a thrown rejection being caught.
  if (index === 6) {
    const caught = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "1px dashed #475569", borderRadius: 8, padding: "8px 10px", fontSize: "0.62rem", color: "#94a3b8" }}>try {"{ await ... }"}</div>
          <div style={{ fontSize: "0.9rem", color: caught ? "#4ade80" : "#475569" }}>{caught ? "caught ✅" : "→"}</div>
          <div style={{ border: caught ? "2px solid #4ade80" : "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: "0.62rem", color: caught ? "#4ade80" : "#64748b" }}>catch (err)</div>
        </div>
      </div>
    );
  }

  // 7 — Promise.all: several dots all finishing before the group resolves.
  if (index === 7) {
    const allDone = pos > 0.7;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 99, background: allDone || pos > i * 0.25 ? "#4ade80" : "#334155", transition: "background 0.2s" }} />
            ))}
          </div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: allDone ? "#4ade80" : "#64748b" }}>{allDone ? "all resolved ✅" : "waiting on all..."}</div>
        </div>
      </div>
    );
  }

  // 8 — Why async matters: page UI staying responsive vs a frozen page.
  const frozen = pos > 0.5;
  return (
    <div style={base}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.4rem" }}>{frozen ? "🥶" : "🙂"}</div>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: frozen ? "#ef4444" : "#4ade80" }}>{frozen ? "page frozen (no async)" : "page responsive (async)"}</div>
      </div>
    </div>
  );
}

// ── TAG MATCH — wrong tap shows that pair's hint immediately ───────────────
function TagMatch({ pairs, onDone }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [flashWrong, setFlashWrong] = useState(null);
  const [hintMsg, setHintMsg] = useState(null);
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
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>CODE</div>
          {pairs.map((p) => (
            <div key={p.code} onClick={() => handleCode(p.code)} style={{
              background: matched[p.code] ? "#14532d33" : selected?.value === p.code ? "#0f2942" : "#0f172a",
              border: matched[p.code] ? "1px solid #4ade8044" : selected?.value === p.code ? "2px solid #38bdf8" : "1px solid #334155",
              borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: matched[p.code] ? "default" : "pointer",
              fontFamily: "monospace", fontSize: "0.72rem", color: matched[p.code] ? "#4ade80" : "#e2e8f0",
            }}>{matched[p.code] ? "✅ " : ""}{p.code}</div>
          ))}
        </div>
        <div style={{ flex: "1 1 140px" }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>BEHAVIOR</div>
          {shuffledMeanings.map((p) => {
            const isUsed = Object.values(matched).includes(p.meaning);
            return (
              <div key={p.meaning} onClick={() => !isUsed && handleMeaning(p.meaning)} style={{
                background: isUsed ? "#14532d33" : flashWrong === p.meaning ? "#450a0a" : "#0f172a",
                border: isUsed ? "1px solid #4ade8044" : flashWrong === p.meaning ? "2px solid #ef4444" : "1px solid #334155",
                borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: isUsed ? "default" : "pointer",
                fontSize: "0.74rem", color: isUsed ? "#4ade80" : "#e2e8f0",
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

// ── BUG HUNT — wrong tap shows an escalating hint, never silent ───────────
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
          fontFamily: "monospace", fontSize: "0.7rem", color: revealed && line.buggy ? "#4ade80" : "#e2e8f0",
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
