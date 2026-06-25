// ============================================================================
//  UNIT 4.2 — "Recipes That Remember: Functions & Scope"
//  Module: M4 — JavaScript Fundamentals (second unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly the same way as every lesson:
//    App.jsx looks up "Unit4_2" in config/course.config.js, renders
//    <Unit4_2 student={...} onUnitComplete={...} />, and waits for
//    onUnitComplete() to fire exactly once, only from the Quiz screen's
//    final button. App.jsx never inspects HOW this lesson teaches.
//  - No api.js / gas.config.js imports here — only App.jsx talks to the
//    backend. This file is self-contained and testable in isolation.
//
//  HOUSE STYLE (matches the reworked Unit4_1.jsx exactly):
//  - Every Build-stage blurb is ONE short sentence. The real teaching
//    happens inside ConceptAnimation — labels, arrows, before/after states.
//  - Every wrong tap in TagMatch / BugHunt shows an explanatory hint
//    instead of a silent red flash.
//  - Quiz wrong answers never reveal the correct option — an escalating
//    hint shows instead and never disappears (pinned at the final hint).
//
//  SIX-STAGE FLOW:
//    Stage 0 SPARK     — predict the output of a closure counter BEFORE
//                         any teaching (predict-then-learn).
//    Stage 1 BUILD     — 9 concepts: what a function is, the three ways to
//                         write one, parameters vs arguments, return values,
//                         scope (global/local/block), closures, default
//                         parameters, arrow functions, higher-order functions.
//    Stage 2 SEE IT    — five real snippets evaluated one at a time.
//    Stage 3 TRY IT    — student runs preset function calls, reads a
//                         one-line note on why.
//    Stage 4 CHALLENGE — tag-match (snippet → behavior) with hints, then a
//                         bug hunt (missing return) with escalating hints.
//    Stage 5 QUIZ      — 12 questions with escalating, never-disappearing
//                         hints.
//
//  MOBILE-FRIENDLY: % widths, flexWrap, minmax()/clamp() — no fixed px.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit4_2({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE — one flat useState, unconditional, top of
  // component, exactly like every other unit (Rules of Hooks). ───────────
  const [stage, setStage] = useState(0); // 0 Spark · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

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

  // ── CONTENT: nine Build-stage concepts — one sentence each, teaching
  // weight lives in ConceptAnimation. ─────────────────────────────────────
  const concepts = [
    {
      title: "What Is a Function?",
      plain: "A function is a reusable recipe: give it ingredients (inputs), it hands back a dish (output).",
      technical: "A function is a callable block of code that can accept parameters and optionally return a value.",
    },
    {
      title: "Three Ways to Write One",
      plain: "Declaration, expression, and arrow function — three syntaxes, same idea.",
      technical: "function f(){} (declaration) · const f=function(){} (expression) · const f=()=>{} (arrow).",
    },
    {
      title: "Parameters vs Arguments",
      plain: "Parameters are the named placeholders. Arguments are the real values you pass in.",
      technical: "Parameters are declared in the function signature; arguments are supplied at call time.",
    },
    {
      title: "Return Values",
      plain: "return hands a value back. No return? The function quietly gives back undefined.",
      technical: "Execution stops at return; omitting it makes the call evaluate to undefined.",
    },
    {
      title: "Scope — Global, Local, Block",
      plain: "A variable is only visible inside the { } it was born in (and anything nested deeper).",
      technical: "Identifiers resolve via the scope chain: block → function → global, innermost first.",
    },
    {
      title: "Closures — Functions That Remember",
      plain: "A function remembers the variables from where it was CREATED, not where it's called.",
      technical: "A closure is a function bundled with references to its lexical scope, persisting after the outer function returns.",
    },
    {
      title: "Default Parameters",
      plain: "Give a parameter a fallback value for when no argument is passed.",
      technical: "function f(x = 10) uses 10 only when the argument is undefined (or omitted).",
    },
    {
      title: "Arrow Functions — Shorter, but Watch 'this'",
      plain: "Arrow functions are shorter and borrow 'this' from their surroundings instead of having their own.",
      technical: "Arrow functions have no own 'this', 'arguments', or prototype — they close over the enclosing 'this'.",
    },
    {
      title: "Higher-Order Functions",
      plain: "A function that takes another function as input, or returns one, is 'higher-order'.",
      technical: "Functions are first-class values in JS — they can be passed as arguments or returned from other functions.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  const quizQuestions = [
    {
      q: "What does a function return if it has no return statement at all?",
      options: ["null", "0", "undefined", "An error is thrown"],
      answer: 2,
      hints: [
        "The function still finishes and the call still evaluates to SOMETHING.",
        "This is the same 'empty box' value you'd get from an uninitialized variable.",
        "No return statement → the call evaluates to undefined, always.",
      ],
      explanation: "A function without return implicitly returns undefined — not null, not an error.",
    },
    {
      q: "What is the difference between a parameter and an argument?",
      options: [
        "There is no difference, they're the same thing",
        "Parameters are placeholders in the function definition; arguments are the actual values passed at call time",
        "Arguments are placeholders; parameters are the actual values",
        "Parameters only exist in arrow functions",
      ],
      answer: 1,
      hints: [
        "One word describes the function's SIGNATURE; the other describes the actual CALL.",
        "function greet(name) — \"name\" is one of these; greet(\"Asha\") — \"Asha\" is the other.",
        "Parameters live in the definition (name); arguments are the real values supplied when calling (\"Asha\").",
      ],
      explanation: "Parameters are named placeholders in the function definition. Arguments are the concrete values passed in at the call site.",
    },
    {
      q: "function makeCounter() { let count = 0; return function() { count++; return count; }; }\nconst counter = makeCounter();\nconsole.log(counter()); console.log(counter());\nWhat prints?",
      options: ["1, 1", "1, 2", "undefined, undefined", "Error: count is not defined"],
      answer: 1,
      hints: [
        "The inner function keeps a private reference to 'count' — it doesn't reset on every call.",
        "Each call to counter() reuses the SAME remembered count from last time.",
        "This is a closure: count persists between calls, so it goes 0→1, then 1→2: prints 1, then 2.",
      ],
      explanation: "The returned inner function closes over count. Each call increments the same remembered variable, producing 1, then 2.",
    },
    {
      q: "What does 'block scope' mean for a variable declared with let inside an if { } block?",
      options: [
        "It's visible everywhere in the file",
        "It's visible only inside that if block and any blocks nested within it",
        "It's only visible inside functions, never inside if blocks",
        "Block scope doesn't apply to let, only to const",
      ],
      answer: 1,
      hints: [
        "Think of the { } around the if statement as a wall.",
        "let respects that wall — it cannot be seen from outside it.",
        "let is confined to the nearest enclosing { } block, including nested blocks inside it.",
      ],
      explanation: "let (and const) are block-scoped: visible only within the { } they're declared in, plus any nested blocks.",
    },
    {
      q: "function greet(name = \"Guest\") { return \"Hi \" + name; }\ngreet();\nWhat does this return?",
      options: ["\"Hi undefined\"", "\"Hi Guest\"", "An error, because no argument was passed", "\"Hi \""],
      answer: 1,
      hints: [
        "A default parameter kicks in specifically when the argument is missing (undefined).",
        "Calling greet() with nothing passed means name is undefined — which triggers the fallback.",
        "Default parameters apply when no argument is given: name becomes \"Guest\", so it returns \"Hi Guest\".",
      ],
      explanation: "Default parameters supply a fallback only when the argument is undefined or omitted — here, name becomes \"Guest\".",
    },
    {
      q: "What is special about how arrow functions handle 'this'?",
      options: [
        "Arrow functions create their own brand-new 'this', just like regular functions",
        "Arrow functions have no 'this' of their own — they use 'this' from their surrounding (enclosing) scope",
        "Arrow functions cannot use 'this' at all, ever",
        "'this' always refers to the global window object inside arrow functions",
      ],
      answer: 1,
      hints: [
        "Arrow functions are missing several things regular functions have — 'this' is one of them.",
        "Whatever 'this' meant just outside the arrow function is what it means INSIDE it too.",
        "Arrow functions don't bind their own 'this' — they inherit it lexically from the enclosing scope.",
      ],
      explanation: "Arrow functions have no own 'this' binding; they use 'this' from wherever they were written (lexical scoping).",
    },
    {
      q: "What makes a function a 'higher-order function'?",
      options: [
        "It runs faster than other functions",
        "It takes another function as an argument, OR returns a function as its result (or both)",
        "It is declared at the top of the file",
        "It has more than 3 parameters",
      ],
      answer: 1,
      hints: [
        "It's about what the function ACCEPTS or PRODUCES, not how it's written or where it lives.",
        "Array methods like map() and filter() are classic examples — why?",
        "A higher-order function treats functions as data: taking one in, or handing one back out.",
      ],
      explanation: "Higher-order functions operate on other functions — accepting them as arguments and/or returning them. map(), filter(), and makeCounter() above are all examples.",
    },
    {
      q: "let x = 10;\nfunction show() { let x = 20; console.log(x); }\nshow();\nWhat prints?",
      options: ["10", "20", "undefined", "Error: x already declared"],
      answer: 1,
      hints: [
        "There are TWO separate variables named x here, in two different scopes.",
        "Inside show(), JavaScript looks for x in the closest scope FIRST.",
        "The inner, function-scoped x (20) shadows the outer one — console.log(x) prints 20.",
      ],
      explanation: "The inner let x = 20 creates a separate variable that shadows the outer x within show()'s scope. The outer x (10) is untouched.",
    },
    {
      q: "Which syntax below is a function EXPRESSION (not a declaration)?",
      options: [
        "function greet() { return \"hi\"; }",
        "const greet = function() { return \"hi\"; };",
        "Both are expressions",
        "Neither is a function at all",
      ],
      answer: 1,
      hints: [
        "A declaration starts the statement with the word 'function'. An expression assigns a function to something.",
        "Look at which one is being stored into a variable using '='.",
        "const greet = function(){} is a function expression — the function is assigned to a variable.",
      ],
      explanation: "function greet(){} is a declaration (hoisted, named at the top level). const greet = function(){} is an expression, assigning an anonymous function to a variable.",
    },
    {
      q: "function add(a, b) { return a + b; }\nadd(2, 3, 999);\nWhat happens to the extra argument 999?",
      options: [
        "It causes a runtime error",
        "It is silently ignored — only a and b are used",
        "It gets automatically added to the result",
        "It overwrites the value of a",
      ],
      answer: 1,
      hints: [
        "JavaScript does not enforce that the number of arguments must match the number of parameters.",
        "Extra arguments beyond the declared parameters simply have no parameter name to bind to.",
        "JS silently ignores extra arguments — add(2,3,999) still just returns 2+3=5.",
      ],
      explanation: "JavaScript never errors on argument-count mismatches. Extra arguments are simply unused; missing ones become undefined.",
    },
    {
      q: "Why are closures useful for something like a counter or a 'private' variable?",
      options: [
        "They make code run faster",
        "They let an inner function keep access to a variable from its outer function, even after that outer function has finished running",
        "They prevent the function from ever being called twice",
        "They convert variables into constants automatically",
      ],
      answer: 1,
      hints: [
        "Normally, a function's local variables disappear once the function returns. Closures break that rule for ONE specific case.",
        "It's about variables surviving past the lifetime of the function that created them.",
        "A closure keeps the inner function's reference to the outer variable alive — even after the outer function has returned.",
      ],
      explanation: "Closures let an inner function retain access to its outer function's variables after the outer function returns — the basis for counters, private state, and memoization.",
    },
    {
      q: "const double = (n) => n * 2;\nWhat kind of function syntax is this?",
      options: ["Function declaration", "Function expression using the arrow syntax", "A higher-order function", "An invalid syntax — arrow functions need curly braces"],
      answer: 1,
      hints: [
        "It's assigned to a variable using '=', and it uses the => symbol.",
        "No curly braces are required when the body is a single expression that's implicitly returned.",
        "This is an arrow function expression — n * 2 is implicitly returned without needing { return ... }.",
      ],
      explanation: "Arrow functions are a form of function expression. Single-expression bodies (like n * 2) are implicitly returned without braces or the return keyword.",
    },
  ];

  // ── looping animation frame ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — five snippets evaluated one at a time ─────────────
  const seeitSteps = [
    { plain: "Three values go in as arguments, matched to three parameters.", tech: "Arguments bind positionally to parameters in declaration order.", code: "function add(a,b,c){ return a+b+c; }\nadd(2,3,4)", result: "9", resultColor: "#4ade80" },
    { plain: "No return statement → the call quietly gives back undefined.", tech: "Falling off the end of a function body returns undefined implicitly.", code: "function noop(){ }\nnoop()", result: "undefined", resultColor: "#94a3b8" },
    { plain: "The inner x shadows the outer one inside this function only.", tech: "Block/function-scoped declarations shadow outer identifiers of the same name.", code: "let x=1;\nfunction f(){ let x=2; return x; }\nf()", result: "2", resultColor: "#38bdf8" },
    { plain: "The returned function still remembers 'count' after make() has finished.", tech: "The closure retains a live reference to count in its enclosing lexical scope.", code: "function make(){ let c=0; return ()=>++c; }\nconst inc=make(); inc(); inc()", result: "2", resultColor: "#a78bfa" },
    { plain: "No argument passed → the default value steps in.", tech: "Default parameters apply when the argument is undefined or omitted.", code: "function hi(name=\"Guest\"){ return name; }\nhi()", result: '"Guest"', resultColor: "#fb923c" },
  ];

  // ── CONTENT: Try-It presets ───────────────────────────────────────────────
  const exprPresets = [
    { expr: "(()=>5*2)()", result: "10", resultType: "number", note: "Arrow function body 5*2 is implicitly returned." },
    { expr: "function f(){}; f()", result: "undefined", resultType: "undef", note: "No return statement → undefined." },
    { expr: "function f(a,b=2){return a+b;}; f(3)", result: "5", resultType: "number", note: "b defaults to 2 since no second argument was given." },
    { expr: "let x=1; { let x=2; }; x", result: "1", resultType: "number", note: "The inner let x=2 stays trapped in its own { } block." },
    { expr: "function f(a,b){return a+b;}; f(1,2,3)", result: "3", resultType: "number", note: "The extra argument 3 is silently ignored." },
    { expr: "[1,2,3].map(n=>n*n)", result: "[1, 4, 9]", resultType: "array", note: "map() is higher-order — it takes a function as its argument." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch with hints ──────────────────────────
  const ch1Pairs = [
    { code: "function f(){}; f()", meaning: "undefined", hint: "No return statement always gives back this exact value." },
    { code: "(n)=>n*2", meaning: "Arrow function expression", hint: "It's stored as a value using =>, not the 'function' keyword." },
    { code: "makeCounter()()", meaning: "A closure remembering state", hint: "The inner function returned here still remembers a variable from outside." },
    { code: "function f(x=5){}", meaning: "Default parameter", hint: "The = inside the parameter list is the giveaway." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: missing return ─────────────────────
  const bugLines = [
    { text: "const total = price * quantity;", buggy: false },
    { text: "function double(n) { n * 2; }", buggy: true, why: "There's no return statement! n * 2 is computed but thrown away — double(5) gives back undefined, not 10. Fix: return n * 2;" },
    { text: "const isEven = (n) => n % 2 === 0;", buggy: false },
    { text: "function greet(name = \"Guest\") { return `Hi ${name}`; }", buggy: false },
  ];
  const bugHints = [
    "Three of these functions correctly hand back a value — one doesn't.",
    "Look at the one missing a particular keyword inside its { }.",
    "It's the line computing n * 2 but never using return — tap that line.",
  ];

  // ── shared style object — identical pattern to Unit4_1 ──────────────────
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
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🧠</div>
        <div style={s.h2}>What does this print?</div>
      </div>

      <div style={s.codeBox}>{`function makeCounter() {
  let count = 0;
  return function () { count++; return count; };
}
const counter = makeCounter();
console.log(counter());
console.log(counter());`}</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["1, 1", "1, 2", "undefined, undefined", "Error"].map((opt, i) => (
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
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>counter(), counter()</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#a78bfa", fontSize: "1.1rem" }}>1, 2</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>{sparkGuess === "1, 2" ? "🎯 Exactly right!" : "Not quite — the real answer is 1, then 2."}</div>
          <div style={s.line}>The inner function remembers "count" between calls — that's a closure.</div>
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
    const colorFor = (type) => (type === "array" ? "#fb923c" : type === "undef" ? "#94a3b8" : "#7dd3fc");

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
          <div style={s.h2}>Unit 4.2 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now reason about scope, closures, and how functions actually behave.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What a function is, and the three ways to write one",
              "Parameters vs arguments",
              "Return values — and what happens with no return",
              "Scope: global, local, block",
              "Closures — functions that remember",
              "Default parameters",
              "Arrow functions and 'this'",
              "Higher-order functions",
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
        <div style={{ ...s.h3, color: "#f1f5f9", fontSize: "0.92rem", marginBottom: 14, whiteSpace: "pre-wrap" }}>{q.q}</div>
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
        <div style={s.topTitle}>Unit 4.2 — Functions & Scope</div>
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

  // 0 — What is a function: ingredients in, dish out.
  if (index === 0) {
    const cooking = pos > 0.4 && pos < 0.8;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "1.3rem" }}>🥚🥕</div>
          {arrow}
          <div style={{
            background: cooking ? "#38bdf833" : "#1e293b", border: "2px solid #38bdf8", borderRadius: 8,
            padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#38bdf8", fontSize: "0.76rem", transition: "all 0.2s",
          }}>function</div>
          {arrow}
          <div style={{ fontSize: "1.3rem", opacity: pos >= 0.8 ? 1 : 0.25, transition: "opacity 0.2s" }}>🍳</div>
        </div>
      </div>
    );
  }

  // 1 — Three syntaxes producing the same arrow-out result.
  if (index === 1) {
    const variants = ["function f(){}", "const f=function(){}", "const f=()=>{}"];
    const which = Math.floor(pos * variants.length) % variants.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#7dd3fc", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px" }}>{variants[which]}</div>
          {arrow}
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#4ade80" }}>same function</div>
        </div>
      </div>
    );
  }

  // 2 — Parameter (placeholder) vs argument (real value), arrow between.
  if (index === 2) {
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>parameter</div>
            <div style={{ fontFamily: "monospace", color: "#fb923c", border: "1px dashed #fb923c", borderRadius: 6, padding: "4px 10px", fontSize: "0.76rem" }}>name</div>
          </div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓ filled by</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>argument</div>
            <div style={{ fontFamily: "monospace", color: "#4ade80", border: "1px solid #4ade80", borderRadius: 6, padding: "4px 10px", fontSize: "0.76rem" }}>"Asha"</div>
          </div>
        </div>
      </div>
    );
  }

  // 3 — Return value vs missing return → undefined.
  if (index === 3) {
    const hasReturn = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.76rem", color: "#e2e8f0" }}>{hasReturn ? "return 8" : "(no return)"}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, color: hasReturn ? "#4ade80" : "#94a3b8" }}>{hasReturn ? "8" : "undefined"}</div>
        </div>
      </div>
    );
  }

  // 4 — Scope: nested boxes, inner highlight visible from outside fails.
  if (index === 4) {
    const checking = Math.floor(pos * 2) % 2;
    return (
      <div style={base}>
        <div style={{ border: "2px dashed #475569", borderRadius: 10, padding: "16px", position: "relative" }}>
          <div style={{ position: "absolute", top: -9, left: 8, background: "#0f172a", fontSize: "0.56rem", color: "#64748b", padding: "0 4px" }}>global</div>
          <div style={{ border: "2px dashed #38bdf8", borderRadius: 8, padding: "12px", position: "relative" }}>
            <div style={{ position: "absolute", top: -9, left: 8, background: "#0f172a", fontSize: "0.56rem", color: "#38bdf8", padding: "0 4px" }}>function</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#4ade80" }}>let x = 1</div>
          </div>
          <div style={{ marginTop: 10, textAlign: "center", fontSize: "0.66rem", fontWeight: 700, color: checking ? "#ef4444" : "#475569" }}>{checking ? "outside can't see x ❌" : "x visible inside ✅"}</div>
        </div>
      </div>
    );
  }

  // 5 — Closure: inner function keeps a thread back to outer's variable
  // even after the outer box fades (returns).
  if (index === 5) {
    const returned = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ opacity: returned ? 0.25 : 1, border: "1px dashed #64748b", borderRadius: 8, padding: "8px 10px", fontSize: "0.64rem", color: "#94a3b8", transition: "opacity 0.3s" }}>makeCounter() (finished)</div>
          <div style={{ width: 26, height: 2, background: "#a78bfa", opacity: returned ? 1 : 0.3 }} />
          <div style={{ border: "2px solid #a78bfa", borderRadius: 8, padding: "8px 10px", fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa" }}>inner fn (remembers count)</div>
        </div>
      </div>
    );
  }

  // 6 — Default parameter: undefined argument → fallback steps in.
  if (index === 6) {
    const missing = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#e2e8f0" }}>{missing ? "f()" : 'f("Maya")'}</div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, color: missing ? "#fb923c" : "#4ade80" }}>{missing ? '"Guest"' : '"Maya"'}</div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: missing ? "#fb923c" : "#4ade80" }}>{missing ? "default used" : "argument used"}</div>
        </div>
      </div>
    );
  }

  // 7 — Arrow function 'this' borrowed from surrounding scope.
  if (index === 7) {
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: "0.68rem", color: "#94a3b8" }}>surrounding this</div>
          <div style={{ fontSize: "1rem", color: "#475569" }}>↓ borrowed by</div>
          <div style={{ border: "2px solid #38bdf8", borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontSize: "0.74rem", fontWeight: 700, color: "#38bdf8" }}>{"() => ..."}</div>
        </div>
      </div>
    );
  }

  // 8 — Higher-order function: a function flowing IN as an argument.
  const flowing = Math.floor(((frame % 40) / 40) * 10);
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#fb923c", border: "1px solid #fb923c", borderRadius: 6, padding: "5px 9px" }}>n=&gt;n*n</div>
        <div style={{ fontSize: "1rem", color: "#475569", transform: `translateX(${flowing}px)`, transition: "transform 0.1s" }}>→</div>
        <div style={{ fontFamily: "monospace", fontSize: "0.76rem", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 6, padding: "6px 10px", fontWeight: 700 }}>map( )</div>
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
