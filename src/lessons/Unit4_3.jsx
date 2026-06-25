// ============================================================================
//  UNIT 4.3 — "Lists & Labels: Arrays & Objects"
//  Module: M4 — JavaScript Fundamentals (third unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly like every lesson: App.jsx looks
//    up "Unit4_3" in config/course.config.js, renders
//    <Unit4_3 student={...} onUnitComplete={...} />, and waits for
//    onUnitComplete() to fire exactly once, from the Quiz screen's final
//    button only. No api.js / gas.config.js imports here.
//
//  HOUSE STYLE (matches Unit4_1.jsx / Unit4_2.jsx exactly):
//  - Build-stage blurbs are ONE short sentence; ConceptAnimation carries
//    the real teaching via labels/arrows/before-after states.
//  - Every wrong tap in TagMatch / BugHunt shows an explanatory hint.
//  - Quiz wrong answers never reveal the correct option — an escalating,
//    never-disappearing hint shows instead.
//
//  SIX-STAGE FLOW:
//    Stage 0 SPARK     — predict the result of an array .map() call.
//    Stage 1 BUILD     — 9 concepts: arrays, objects, accessing items,
//                         array methods (push/pop), iteration (map/filter),
//                         object methods (keys/values/entries),
//                         destructuring, spread, arrays of objects.
//    Stage 2 SEE IT    — five real snippets evaluated step by step.
//    Stage 3 TRY IT    — preset expressions run live.
//    Stage 4 CHALLENGE — tag-match (method → behavior) with hints, then a
//                         bug hunt (off-by-one / mutation bug) with hints.
//    Stage 5 QUIZ      — 12 questions, escalating hints.
//
//  MOBILE-FRIENDLY: % widths, flexWrap, minmax()/clamp() — no fixed px.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit4_3({ student, onUnitComplete }) {
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
      title: "What Is an Array?",
      plain: "An array is an ordered list of values, each with a numbered position.",
      technical: "An array is an indexed, ordered collection; indices start at 0.",
    },
    {
      title: "What Is an Object?",
      plain: "An object is a set of labeled values — each value has a name, not a number.",
      technical: "An object stores key-value pairs; keys are strings (or Symbols), unordered conceptually.",
    },
    {
      title: "Accessing Items — [ ] vs .",
      plain: "Arrays use a number in [ ]. Objects use a dot, or a string in [ ].",
      technical: "arr[i] indexes by position; obj.key or obj[\"key\"] accesses by property name.",
    },
    {
      title: "Array Methods — push/pop/shift/unshift",
      plain: "push/pop add or remove from the END. shift/unshift add or remove from the START.",
      technical: "push/pop mutate the array's end (O(1)); shift/unshift mutate the start (O(n), re-indexing).",
    },
    {
      title: "Iterating — map() and filter()",
      plain: "map() transforms every item into a new array. filter() keeps only the items that pass a test.",
      technical: "map() returns a new array of the same length; filter() returns a new array of matching items only.",
    },
    {
      title: "Object Methods — keys, values, entries",
      plain: "Object.keys gives the labels. Object.values gives the values. Object.entries gives both, paired.",
      technical: "Object.keys/values/entries return arrays for iterating over an object's own enumerable properties.",
    },
    {
      title: "Destructuring",
      plain: "Destructuring unpacks array items or object properties straight into named variables.",
      technical: "const [a,b] = arr; const {x,y} = obj; — pattern-matches structure into bindings in one step.",
    },
    {
      title: "The Spread Operator (...)",
      plain: "... copies all items out of an array or object — great for copying or merging.",
      technical: "Spread expands an iterable's elements (or an object's own properties) in place, without mutating the original.",
    },
    {
      title: "Arrays of Objects",
      plain: "Real data is usually a list of objects — like rows in a table.",
      technical: "An array of objects models tabular/record data: each element is one record with named fields.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  const quizQuestions = [
    {
      q: "const arr = [10, 20, 30]; What is arr[0]?",
      options: ["30", "undefined", "10", "1"],
      answer: 2,
      hints: [
        "Array positions (indices) start counting from a specific number — not 1.",
        "Index 0 means the very FIRST item, not the first index number itself.",
        "Arrays are zero-indexed: arr[0] is the first element, which is 10.",
      ],
      explanation: "Arrays are zero-indexed — arr[0] is always the first element. Here, that's 10.",
    },
    {
      q: "const user = { name: \"Asha\", age: 21 }; Which is the correct way to read the name?",
      options: ["user[0]", "user.name", "user(name)", "user->name"],
      answer: 1,
      hints: [
        "Objects use labels (keys), not numbered positions.",
        "Two syntaxes work for this in JS — one uses a dot.",
        "user.name (or user[\"name\"]) reads the property by its key name.",
      ],
      explanation: "Object properties are accessed by key, using dot notation (user.name) or bracket notation (user[\"name\"]) — never by numeric index like an array.",
    },
    {
      q: "const arr = [1,2,3]; arr.push(4); What is arr now?",
      options: ["[1,2,3]", "[4,1,2,3]", "[1,2,3,4]", "[1,2,3,[4]]"],
      answer: 2,
      hints: [
        "push adds to one specific END of the array.",
        "It's the END you'd naturally write last when listing the array.",
        "push() appends to the end: [1,2,3] becomes [1,2,3,4].",
      ],
      explanation: "push() adds an element to the end of the array, mutating it in place. unshift() would add to the start instead.",
    },
    {
      q: "[1,2,3].map(n => n * 2) returns what?",
      options: ["6", "[1,2,3]", "[2,4,6]", "undefined"],
      answer: 2,
      hints: [
        "map() always returns an array of the SAME LENGTH as the original.",
        "Each number is being doubled, one at a time.",
        "map() transforms every item: 1→2, 2→4, 3→6, giving [2,4,6].",
      ],
      explanation: "map() builds a brand-new array by applying the function to every element. Here it doubles each number, giving [2, 4, 6].",
    },
    {
      q: "[1,2,3,4].filter(n => n % 2 === 0) returns what?",
      options: ["[1,3]", "[2,4]", "[1,2,3,4]", "true"],
      answer: 1,
      hints: [
        "filter() only KEEPS items where the test function returns true.",
        "n % 2 === 0 is true only for even numbers.",
        "filter() keeps only items passing the test: [2,4] are the even ones.",
      ],
      explanation: "filter() returns a new array containing only the elements for which the callback returned true — here, the even numbers 2 and 4.",
    },
    {
      q: "const obj = { a: 1, b: 2 }; What does Object.keys(obj) return?",
      options: ["[1, 2]", "['a', 'b']", "{a: 1, b: 2}", "2"],
      answer: 1,
      hints: [
        "'keys' specifically means the LABELS, not the values stored under them.",
        "The result is an array of strings.",
        "Object.keys returns an array of the property names: ['a', 'b'].",
      ],
      explanation: "Object.keys() returns an array of the object's own property names (labels), not their values.",
    },
    {
      q: "const [first, second] = [10, 20, 30]; What is the value of second?",
      options: ["10", "20", "30", "undefined"],
      answer: 1,
      hints: [
        "Array destructuring matches variables to positions, left to right.",
        "'second' lines up with the array's SECOND position (index 1).",
        "Destructuring assigns by position: first=10, second=20 (the array's 3rd item, 30, is unused here).",
      ],
      explanation: "Array destructuring assigns variables by position, in order. first gets index 0 (10), second gets index 1 (20).",
    },
    {
      q: "const obj1 = {a:1}; const obj2 = {...obj1, b:2}; What does obj2 contain?",
      options: ["{a:1}", "{b:2}", "{a:1, b:2}", "An error — spread doesn't work on objects"],
      answer: 2,
      hints: [
        "Spread (...) copies every property OUT of obj1 into the new object first.",
        "Then any additional properties listed after it are added on top.",
        "{...obj1, b:2} copies a:1 from obj1, then adds b:2, giving {a:1, b:2}.",
      ],
      explanation: "Spreading an object copies all of its own enumerable properties into the new object literal; later keys can add to or override that.",
    },
    {
      q: "const users = [{name:\"A\"}, {name:\"B\"}]; What does users[1].name return?",
      options: ["\"A\"", "\"B\"", "undefined", "{name:\"B\"}"],
      answer: 1,
      hints: [
        "First resolve users[1] — which object does that give you?",
        "Then read the .name property off THAT object.",
        "users[1] is {name:\"B\"}, so users[1].name is \"B\".",
      ],
      explanation: "users[1] selects the second object in the array ({name:\"B\"}), and .name then reads its name property.",
    },
    {
      q: "const arr = [1,2,3]; arr.shift(); What does shift() do here?",
      options: [
        "Removes and returns the last item (3)",
        "Removes and returns the first item (1), shifting the rest down",
        "Adds a new item to the start",
        "Sorts the array",
      ],
      answer: 1,
      hints: [
        "shift() works on the OPPOSITE end of the array from push()/pop().",
        "Removing the first item means every remaining item's index moves down by one.",
        "shift() removes the first element (1) and re-indexes the rest, leaving [2,3].",
      ],
      explanation: "shift() removes and returns the first element, shifting all remaining elements down by one index. (unshift() is the reverse: adding to the start.)",
    },
    {
      q: "const obj = {a:1, b:2}; for (const [key, val] of Object.entries(obj)) { ... } — what does Object.entries(obj) give per iteration?",
      options: [
        "Just the keys, one at a time",
        "Just the values, one at a time",
        "A [key, value] pair for each property",
        "The whole object every time",
      ],
      answer: 2,
      hints: [
        "'entries' suggests something more complete than just keys or just values alone.",
        "Each item in the returned array is itself a small 2-item array.",
        "Object.entries gives [key, value] pairs — perfect for destructuring in a for...of loop.",
      ],
      explanation: "Object.entries() returns an array of [key, value] pairs, one per property — ideal for destructuring directly in a loop.",
    },
    {
      q: "Why is modeling data as 'an array of objects' (like a list of user records) so common in real apps?",
      options: [
        "It runs faster than any other data structure",
        "Each object can hold multiple named fields (like a row), and the array lets you have many of them (like a table)",
        "JavaScript requires all data to be structured this way",
        "It avoids needing to use any array methods",
      ],
      answer: 1,
      hints: [
        "Think of a spreadsheet: rows and columns. Which JS structure maps to a 'row'? Which maps to the whole 'sheet'?",
        "An object naturally models ONE record's multiple named fields; an array naturally models MANY of something.",
        "An array of objects = a list of records, each with named fields — exactly like rows in a table, which is why it's everywhere in real apps (API responses, databases, etc.).",
      ],
      explanation: "Objects model a single record's named fields; arrays model an ordered collection. Combined, 'array of objects' models tabular data — the most common shape for real-world data (API results, database rows, etc.).",
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
    { plain: "Index 0 is the first item — counting starts at zero.", tech: "Array indices are zero-based; arr[0] addresses the first element.", code: "const arr=[10,20,30];\narr[0]", result: "10", resultColor: "#4ade80" },
    { plain: "push() appends one item to the end of the array.", tech: "push() mutates the array in place, appending to the end and returning the new length.", code: "const a=[1,2]; a.push(3); a", result: "[1, 2, 3]", resultColor: "#38bdf8" },
    { plain: "map() doubles every item, building a brand-new array.", tech: "map() applies the callback to each element, returning a new array of equal length.", code: "[1,2,3].map(n=>n*2)", result: "[2, 4, 6]", resultColor: "#fb923c" },
    { plain: "filter() keeps only the items that pass the test.", tech: "filter() returns a new array containing only elements for which the predicate returned true.", code: "[1,2,3,4].filter(n=>n>2)", result: "[3, 4]", resultColor: "#a78bfa" },
    { plain: "Destructuring pulls properties straight into named variables.", tech: "Object destructuring binds obj.name and obj.age directly to local identifiers.", code: "const {name,age}={name:\"Liu\",age:20};\nname", result: '"Liu"', resultColor: "#4ade80" },
  ];

  // ── CONTENT: Try-It presets ───────────────────────────────────────────────
  const exprPresets = [
    { expr: "[5,10,15][1]", result: "10", resultType: "number", note: "Index 1 is the SECOND item (zero-based counting)." },
    { expr: "[1,2,3].length", result: "3", resultType: "number", note: ".length counts the items, it's not zero-based." },
    { expr: '({a:1,b:2}).b', result: "2", resultType: "number", note: "Dot notation reads the value stored under key b." },
    { expr: "[1,2,3].filter(n=>n>1)", result: "[2, 3]", resultType: "array", note: "Only items passing n>1 survive into the new array." },
    { expr: "Object.keys({x:1,y:2})", result: "['x', 'y']", resultType: "array", note: "Object.keys returns the property names as an array." },
    { expr: "[...[1,2], ...[3,4]]", result: "[1, 2, 3, 4]", resultType: "array", note: "Spread unpacks both arrays into one new combined array." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch with hints ──────────────────────────
  const ch1Pairs = [
    { code: "arr.push(x)", meaning: "Adds x to the end", hint: "Picture adding to the back of a line — that's the END." },
    { code: "arr.shift()", meaning: "Removes the first item", hint: "This is the OPPOSITE end from push/pop." },
    { code: "arr.map(fn)", meaning: "Transforms every item into a new array", hint: "The result is always the SAME LENGTH as the original." },
    { code: "arr.filter(fn)", meaning: "Keeps only items passing a test", hint: "Some items survive, some get dropped — length usually shrinks." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: off-by-one / wrong index ────────────
  const bugLines = [
    { text: "const last = arr[arr.length - 1];", buggy: false },
    { text: "const first = arr[1];", buggy: true, why: "Array indices start at 0, so arr[1] grabs the SECOND item, not the first! Fix: arr[0]." },
    { text: "const doubled = arr.map(n => n * 2);", buggy: false },
    { text: "const evens = arr.filter(n => n % 2 === 0);", buggy: false },
  ];
  const bugHints = [
    "Three of these correctly target the item they claim to — one is off by one position.",
    "It's the line trying to grab the FIRST item of the array.",
    "Remember: arrays are zero-indexed, so the first item is at index 0, not 1. Tap that line.",
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
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📦</div>
        <div style={s.h2}>What does this print?</div>
      </div>

      <div style={s.codeBox}>{`const prices = [10, 20, 30];
const taxed = prices.map(p => p * 1.1);
console.log(taxed);`}</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["[10, 20, 30]", "[11, 22, 33]", "60", "An error"].map((opt, i) => (
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
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>taxed</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>[11, 22, 33]</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>{sparkGuess === "[11, 22, 33]" ? "🎯 Exactly right!" : "Not quite — the real answer is [11, 22, 33]."}</div>
          <div style={s.line}>map() builds a NEW array, transforming every item — the original prices array is untouched.</div>
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
    const colorFor = (type) => (type === "array" ? "#fb923c" : "#7dd3fc");

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run It, Watch It Evaluate</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {exprPresets.map((p) => (
            <button key={p.expr} onClick={() => { setExprPicked(p.expr); if (exprPicked !== p.expr) setTriedCount((c) => c + 1); }} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer",
              background: exprPicked === p.expr ? "#38bdf8" : "#0f172a", color: exprPicked === p.expr ? "#0f172a" : "#7dd3fc",
            }}>{p.expr}</button>
          ))}
        </div>

        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.74rem" }}>{active.expr}</div>
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
          <div style={s.h2}>🎯 Match Method → Behavior</div>
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
          <div style={s.h2}>Unit 4.3 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now model and reshape real data with arrays and objects.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What arrays and objects are",
              "Accessing items with [ ] and .",
              "push/pop/shift/unshift",
              "map() and filter()",
              "Object.keys/values/entries",
              "Destructuring",
              "The spread operator (...)",
              "Arrays of objects (tabular data)",
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
        <div style={{ ...s.h3, color: "#f1f5f9", fontSize: "0.92rem", marginBottom: 14 }}>{q.q}</div>
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
        <div style={s.topTitle}>Unit 4.3 — Arrays & Objects</div>
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

  // 0 — Array: numbered boxes in a row, one highlighted in sequence.
  if (index === 0) {
    const values = [10, 20, 30];
    const which = Math.floor(pos * values.length) % values.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 6 }}>
          {values.map((v, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                background: which === i ? "#38bdf833" : "#1e293b", border: which === i ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 8, width: 44, padding: "10px 0", fontWeight: 700, color: "#f1f5f9", fontSize: "0.85rem",
              }}>{v}</div>
              <div style={{ fontSize: "0.58rem", color: "#64748b", marginTop: 3 }}>[{i}]</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 1 — Object: labeled key-value cards.
  if (index === 1) {
    const entries = [["name", '"Asha"'], ["age", "21"]];
    const which = Math.floor(pos * entries.length) % entries.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 8 }}>
          {entries.map(([k, v], i) => (
            <div key={k} style={{
              opacity: which === i ? 1 : 0.4, transition: "opacity 0.2s",
              border: "1px solid #4ade80", borderRadius: 8, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: "0.62rem", color: "#4ade80", fontWeight: 700 }}>{k}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#f1f5f9" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2 — [ ] vs . access, arrow into the right item.
  if (index === 2) {
    const isArr = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#e2e8f0" }}>{isArr ? "arr[1]" : "obj.name"}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, color: isArr ? "#38bdf8" : "#4ade80" }}>{isArr ? "20" : '"Asha"'}</div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: isArr ? "#38bdf8" : "#4ade80" }}>{isArr ? "by position" : "by name"}</div>
        </div>
      </div>
    );
  }

  // 3 — push/pop at the end, shift/unshift at the start, arrows showing
  // which end is affected.
  if (index === 3) {
    const which = Math.floor(pos * 2) % 2;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {which === 0 && <div style={{ fontSize: "0.95rem", color: "#4ade80" }}>+ ←</div>}
          {["a", "b", "c"].map((v) => (
            <div key={v} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", fontFamily: "monospace", fontSize: "0.76rem" }}>{v}</div>
          ))}
          {which === 1 && <div style={{ fontSize: "0.95rem", color: "#fb923c" }}>→ +</div>}
        </div>
        <div style={{ position: "absolute", bottom: 6, fontSize: "0.6rem", color: which === 0 ? "#4ade80" : "#fb923c", fontWeight: 700 }}>{which === 0 ? "unshift: add to start" : "push: add to end"}</div>
      </div>
    );
  }

  // 4 — map vs filter: items flowing through, transformed vs kept/dropped.
  if (index === 4) {
    const isMap = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map((n) => <div key={n} style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#94a3b8" }}>{n}</div>)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓ {isMap ? "map" : "filter"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {isMap
              ? [2, 4, 6].map((n) => <div key={n} style={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, color: "#fb923c" }}>{n}</div>)
              : [1, 2, 3].map((n, i) => <div key={n} style={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, color: n > 1 ? "#a78bfa" : "#334155", opacity: n > 1 ? 1 : 0.3, textDecoration: n > 1 ? "none" : "line-through" }}>{n}</div>)}
          </div>
        </div>
      </div>
    );
  }

  // 5 — Object.keys/values/entries cycling.
  if (index === 5) {
    const modes = [
      { label: "Object.keys", out: "['a','b']" },
      { label: "Object.values", out: "[1, 2]" },
      { label: "Object.entries", out: "[['a',1],['b',2]]" },
    ];
    const which = Math.floor(pos * modes.length) % modes.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#38bdf8", fontWeight: 700 }}>{modes[which].label}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#4ade80" }}>{modes[which].out}</div>
        </div>
      </div>
    );
  }

  // 6 — Destructuring: object pattern unpacking into separate boxes.
  if (index === 6) {
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontSize: "0.7rem", color: "#94a3b8" }}>{"{x:1,y:2}"}</div>
          {arrow}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ border: "1px solid #38bdf8", borderRadius: 6, padding: "5px 8px", fontFamily: "monospace", fontSize: "0.7rem", color: "#38bdf8" }}>x=1</div>
            <div style={{ border: "1px solid #4ade80", borderRadius: 6, padding: "5px 8px", fontFamily: "monospace", fontSize: "0.7rem", color: "#4ade80" }}>y=2</div>
          </div>
        </div>
      </div>
    );
  }

  // 7 — Spread: two arrays merging into one via ...
  if (index === 7) {
    const merged = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2].map((n) => <div key={n} style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: 5, padding: "4px 7px" }}>{n}</div>)}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#94a3b8" }}>...</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[3, 4].map((n) => <div key={n} style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#fb923c", border: "1px solid #fb923c", borderRadius: 5, padding: "4px 7px" }}>{n}</div>)}
          </div>
          {merged && <div style={{ fontSize: "0.6rem", color: "#4ade80", fontWeight: 700, marginLeft: 4 }}>→ one new array</div>}
        </div>
      </div>
    );
  }

  // 8 — Arrays of objects: a stack of record cards.
  const which8 = Math.floor(pos * 2) % 2;
  return (
    <div style={base}>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{
            opacity: which8 === i ? 1 : 0.4, transition: "opacity 0.2s",
            border: "1px solid #4ade80", borderRadius: 8, padding: "8px 10px", fontSize: "0.66rem", color: "#4ade80",
          }}>{`{ name: "${i === 0 ? "A" : "B"}" }`}</div>
        ))}
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
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>METHOD</div>
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
                fontSize: "0.76rem", color: isUsed ? "#4ade80" : "#e2e8f0",
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
          fontFamily: "monospace", fontSize: "0.72rem", color: revealed && line.buggy ? "#4ade80" : "#e2e8f0",
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
