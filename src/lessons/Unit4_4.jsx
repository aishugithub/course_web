// ============================================================================
//  UNIT 4.4 — "Touching the Page: DOM Manipulation"
//  Module: M4 — JavaScript Fundamentals (fourth unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly like every lesson: App.jsx looks
//    up "Unit4_4" in config/course.config.js, renders
//    <Unit4_4 student={...} onUnitComplete={...} />, and waits for
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
//    Stage 0 SPARK     — predict what happens when a button is clicked,
//                         before seeing how addEventListener works.
//    Stage 1 BUILD     — 9 concepts: what the DOM is, selecting elements,
//                         textContent vs innerHTML, classList, creating &
//                         appending elements, addEventListener, the event
//                         object, preventDefault, event bubbling.
//    Stage 2 SEE IT    — five real snippets evaluated step by step.
//    Stage 3 TRY IT    — preset DOM operations shown live.
//    Stage 4 CHALLENGE — tag-match (DOM method → behavior) with hints,
//                         then a bug hunt (wrong addEventListener usage).
//    Stage 5 QUIZ      — 12 questions, escalating hints.
//
//  MOBILE-FRIENDLY: % widths, flexWrap, minmax()/clamp() — no fixed px.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit4_4({ student, onUnitComplete }) {
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
      title: "What Is the DOM?",
      plain: "The DOM is your HTML turned into a live tree of objects JavaScript can read and change.",
      technical: "The Document Object Model represents the page as a tree of nodes; JS can query and mutate it at runtime.",
    },
    {
      title: "Selecting Elements",
      plain: "document.querySelector finds the first matching element on the page.",
      technical: "querySelector(selector) accepts any CSS selector; querySelectorAll returns ALL matches as a NodeList.",
    },
    {
      title: "textContent vs innerHTML",
      plain: "textContent sets plain text safely. innerHTML can inject real HTML tags — and real risk.",
      technical: "textContent escapes everything as text; innerHTML parses its string as markup, opening the door to injection if untrusted.",
    },
    {
      title: "Changing Style & Classes",
      plain: "classList.add/remove/toggle flips a CSS class on or off without touching inline styles.",
      technical: "element.classList is a token list API for safely managing class names, avoiding manual string concatenation.",
    },
    {
      title: "Creating & Appending Elements",
      plain: "createElement makes a new tag in memory; appendChild actually places it on the page.",
      technical: "document.createElement(tag) builds a detached node; parent.appendChild(node) attaches it to the live DOM tree.",
    },
    {
      title: "Event Listeners",
      plain: "addEventListener watches for something happening (like a click) and runs your function when it does.",
      technical: "element.addEventListener(type, handler) registers a callback invoked when the named event fires on that element.",
    },
    {
      title: "The Event Object",
      plain: "Every handler receives an 'event' object describing exactly what happened and where.",
      technical: "The event object carries properties like target, type, and methods like preventDefault()/stopPropagation().",
    },
    {
      title: "preventDefault()",
      plain: "preventDefault() stops the browser's normal built-in reaction — like a form actually submitting.",
      technical: "event.preventDefault() cancels the default browser action associated with the event, without stopping the handler itself.",
    },
    {
      title: "Event Bubbling",
      plain: "A click doesn't just fire on the element you tapped — it 'bubbles' up through its parents too.",
      technical: "Events propagate up the DOM tree from target to ancestors by default (bubbling phase), enabling event delegation.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  const quizQuestions = [
    {
      q: "What does document.querySelector(\".card\") return if there are 3 elements with class 'card' on the page?",
      options: ["All 3 elements as an array", "Only the FIRST matching element", "null, because there's more than one match", "All 3 elements as a NodeList"],
      answer: 1,
      hints: [
        "querySelector (singular) behaves differently from querySelectorAll (plural).",
        "It stops searching as soon as it finds ONE match.",
        "querySelector always returns only the first matching element — use querySelectorAll for all of them.",
      ],
      explanation: "querySelector returns just the first match in document order. querySelectorAll would return all matches as a NodeList.",
    },
    {
      q: "Why is innerHTML considered riskier than textContent when displaying user-provided text?",
      options: [
        "innerHTML is slower to type",
        "innerHTML parses the string as real HTML, so malicious markup/script could be injected and run",
        "innerHTML only works on <div> elements",
        "There is no real difference — they're interchangeable",
      ],
      answer: 1,
      hints: [
        "Think about what happens if the 'text' you're inserting actually contains a <script> tag.",
        "One of these two properties treats its input as MARKUP; the other treats it as plain TEXT, always.",
        "innerHTML renders its string as HTML — including any embedded scripts/tags — which is how injection attacks happen. textContent never does this.",
      ],
      explanation: "innerHTML interprets its string as HTML markup, so untrusted input can inject scripts or unwanted tags. textContent always treats its input as plain, safe text.",
    },
    {
      q: "el.classList.toggle(\"active\") — what does this do if \"active\" is currently ON the element?",
      options: ["Adds it again (no real effect)", "Removes it", "Throws an error", "Renames it"],
      answer: 1,
      hints: [
        "toggle() always flips to the OPPOSITE of the current state.",
        "If the class is currently present, toggling should make it absent.",
        "toggle() removes the class if it's present, and adds it if it's absent — a simple on/off flip.",
      ],
      explanation: "classList.toggle() flips the class's presence: removing it if present, adding it if absent.",
    },
    {
      q: "const div = document.createElement(\"div\"); div.textContent = \"Hi\";\nIs this <div> visible on the page yet?",
      options: ["Yes, createElement automatically shows it", "No — it only becomes visible after being appended to the DOM tree (e.g. via appendChild)", "Yes, but only after a page refresh", "No, createElement never works without a CSS file"],
      answer: 1,
      hints: [
        "createElement only builds the element IN MEMORY — it isn't connected to the page yet.",
        "A separate step is needed to actually place it somewhere visible.",
        "The element stays detached and invisible until you call something like parent.appendChild(div).",
      ],
      explanation: "createElement() builds a node in memory, fully detached from the visible page, until it's explicitly appended (e.g. with appendChild) to a parent that's already in the DOM.",
    },
    {
      q: "button.addEventListener(\"click\", handleClick);\nWhat would go wrong if this were written as addEventListener(\"click\", handleClick()) instead?",
      options: [
        "Nothing — they behave identically",
        "handleClick() runs IMMEDIATELY when this line executes, and its return value (often undefined) gets registered as the handler instead",
        "It would only work on mobile devices",
        "It would attach the listener twice",
      ],
      answer: 1,
      hints: [
        "The () after handleClick CALLS the function right away — it doesn't just refer to it.",
        "addEventListener needs a referenceto a function it can call LATER, not the function's result.",
        "handleClick() executes instantly, and whatever it returns (usually undefined) is what gets registered — so the click never actually triggers anything useful.",
      ],
      explanation: "Passing handleClick (no parentheses) gives addEventListener a reference to call later. Passing handleClick() calls it immediately and passes its return value instead — a very common bug.",
    },
    {
      q: "What does the event object's event.target typically refer to?",
      options: [
        "The element the listener was attached to, always",
        "The exact element that triggered/originated the event",
        "The entire document",
        "A random DOM element",
      ],
      answer: 1,
      hints: [
        "target answers \"which specific element did the user actually interact with?\"",
        "If you click a child element inside a bigger container, target is that inner child.",
        "event.target is the actual element that the event originated from — which can differ from the element the listener is attached to, due to bubbling.",
      ],
      explanation: "event.target is the specific element where the event originated — useful in event delegation, where a listener is on a parent but target identifies the actual child clicked.",
    },
    {
      q: "Inside a form's submit handler, what does event.preventDefault() accomplish?",
      options: [
        "It deletes the form from the page",
        "It stops the browser's default action (a full page reload/navigation) so your JS can handle the submission instead",
        "It prevents the handler function itself from running",
        "It clears all the form's input values",
      ],
      answer: 1,
      hints: [
        "Forms have a BUILT-IN browser behavior on submit — page navigation. This method targets exactly that.",
        "It stops the DEFAULT browser action, not your own code.",
        "preventDefault() cancels the browser's normal default behavior (e.g. reloading the page on form submit) while your handler keeps running.",
      ],
      explanation: "preventDefault() cancels only the browser's built-in default behavior for that event (like form submission causing a page reload) — your handler code still executes normally.",
    },
    {
      q: "If you click a <button> inside a <div>, and both have click listeners, which fires FIRST by default?",
      options: [
        "The div's listener, then the button's",
        "The button's listener (the actual click target), then the div's, as the event bubbles up",
        "Only the div's listener fires; the button's never does",
        "They always fire at exactly the same time",
      ],
      answer: 1,
      hints: [
        "Events start at the exact element clicked, then travel UPWARD through its ancestors.",
        "The button is the innermost element — it's closer to where the click actually happened.",
        "By default, events bubble: target (button) first, then each ancestor (div) in turn.",
      ],
      explanation: "Default event propagation is 'bubbling' — the event fires on the target element first, then bubbles up through each ancestor in turn.",
    },
    {
      q: "Which approach correctly creates a new list item and adds it visibly to an existing <ul id=\"list\">?",
      options: [
        "document.createElement(\"li\")  (and nothing else)",
        "const li = document.createElement(\"li\"); li.textContent=\"New\"; document.querySelector(\"#list\").appendChild(li);",
        "document.querySelector(\"#list\").textContent = \"li\"",
        "document.querySelector(\"#list\").innerHTML",
      ],
      answer: 1,
      hints: [
        "You need at least two steps: BUILD the element, then ATTACH it somewhere already on the page.",
        "Just creating an element (without appending it) leaves it invisible, detached from the page.",
        "createElement + set content + appendChild to an already-attached parent is the complete, correct pattern.",
      ],
      explanation: "Adding a visible new element requires creating it, optionally setting its content, and appending it to a parent that is already part of the live DOM tree.",
    },
    {
      q: "el.classList.add(\"hidden\") vs el.style.display = \"none\" — what's a key practical difference in typical use?",
      options: [
        "They are exactly identical in every way",
        "classList.add toggles a predefined CSS class (often more maintainable); style.display sets inline CSS directly on the element",
        "style.display only works in old browsers",
        "classList.add can only be used once per element, ever",
      ],
      answer: 1,
      hints: [
        "One approach relies on a class defined separately in your CSS file; the other writes CSS directly onto the element itself (inline).",
        "Inline styles (style.xxx) tend to override class-based styles and can be harder to maintain at scale.",
        "classList.add toggles classes defined in your stylesheet — generally preferred for maintainability; style.display sets an inline style directly, bypassing the stylesheet.",
      ],
      explanation: "classList works with classes defined in your CSS, keeping styling centralized and maintainable. Setting el.style directly writes inline CSS, which can be harder to manage and overrides stylesheet rules.",
    },
    {
      q: "Why might you attach ONE click listener to a parent <ul> instead of a separate listener on every single <li> inside it?",
      options: [
        "It's required — you can't attach listeners to <li> elements at all",
        "Event delegation: thanks to bubbling, the parent's listener still catches clicks on any child <li>, even ones added later",
        "It makes the list items invisible",
        "Listeners on parents run twice as fast",
      ],
      answer: 1,
      hints: [
        "This pattern relies directly on the bubbling behavior covered earlier in this unit.",
        "It's especially useful when list items are added dynamically AFTER the page first loads.",
        "This is called event delegation: one listener on the parent catches bubbled clicks from any current OR future child, via event.target.",
      ],
      explanation: "Event delegation exploits bubbling: a single listener on a stable parent element can handle events from any child, including children added dynamically later — much more efficient than attaching listeners to every child individually.",
    },
    {
      q: "What is the safest way to insert a string that came directly from user input into the page?",
      options: [
        "el.innerHTML = userInput;  (always, no exceptions)",
        "el.textContent = userInput;  so it's always treated as plain text, never parsed as HTML",
        "eval(userInput);",
        "document.write(userInput);",
      ],
      answer: 1,
      hints: [
        "Recall the textContent vs innerHTML distinction from earlier in this unit.",
        "You want user input treated as TEXT, never as executable markup.",
        "textContent guarantees the string is displayed as plain text and never parsed as HTML, which is why it's the safe default for untrusted input.",
      ],
      explanation: "textContent never parses its input as HTML, making it the safe default when displaying untrusted user input. innerHTML, eval, and document.write can all execute or render injected markup/code.",
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
    { plain: "querySelector grabs the first element matching the CSS selector.", tech: "Returns the first Element matching the selector in document order, or null.", code: 'document.querySelector("#title")', result: "<h1 id=\"title\">", resultColor: "#4ade80" },
    { plain: "textContent replaces the element's text — safely, never as HTML.", tech: "Sets the node's text, escaping any markup characters automatically.", code: 'el.textContent = "<b>Hi</b>"', result: "shows the literal text <b>Hi</b>", resultColor: "#38bdf8" },
    { plain: "classList.add turns a CSS class on without touching anything else.", tech: "Appends the token to the element's class attribute if not already present.", code: 'el.classList.add("active")', result: "class becomes \"active\"", resultColor: "#fb923c" },
    { plain: "The new <li> exists in memory but is invisible until appended.", tech: "createElement returns a detached node; appendChild attaches it to the live tree.", code: 'const li=document.createElement("li");\nul.appendChild(li);', result: "li now appears inside ul", resultColor: "#a78bfa" },
    { plain: "preventDefault stops the page from reloading on submit.", tech: "Cancels the browser's default action for this event without affecting your own handler code.", code: 'form.addEventListener("submit", e=>e.preventDefault())', result: "page no longer reloads on submit", resultColor: "#ef4444" },
  ];

  // ── CONTENT: Try-It presets ───────────────────────────────────────────────
  const exprPresets = [
    { expr: 'document.querySelectorAll(".item").length', result: "4", resultType: "number", note: "querySelectorAll returns ALL matches, as a NodeList." },
    { expr: 'el.textContent = "5 < 10"', result: "shows: 5 < 10 (as text)", resultType: "text", note: "textContent never parses < or > as HTML tags." },
    { expr: 'el.innerHTML = "<b>Hi</b>"', result: "shows: Hi (bold)", resultType: "text", note: "innerHTML parses the string and renders the <b> tag." },
    { expr: 'el.classList.contains("active")', result: "true / false", resultType: "bool", note: "Checks whether the class is currently present." },
    { expr: 'btn.addEventListener("click", fn)', result: "fn runs on every click", resultType: "text", note: "fn (no parentheses) is stored as a reference, called later." },
    { expr: "event.target.tagName", result: '"BUTTON"', resultType: "text", note: "target is whichever element actually triggered the event." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch with hints ──────────────────────────
  const ch1Pairs = [
    { code: "querySelector(sel)", meaning: "Returns the FIRST matching element", hint: "Compare this to querySelectorAll, which returns every match." },
    { code: "el.textContent = s", meaning: "Sets plain, safe text", hint: "This one never parses < and > as real HTML tags." },
    { code: "el.classList.toggle(c)", meaning: "Flips a class on/off", hint: "Think of a light switch — it goes to the OPPOSITE state." },
    { code: "el.addEventListener(t, fn)", meaning: "Runs fn when event t happens", hint: "fn isn't called now — it's stored to run LATER." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: calling instead of referencing ─────
  const bugLines = [
    { text: 'const el = document.querySelector("#btn");', buggy: false },
    { text: 'el.addEventListener("click", handleClick());', buggy: true, why: "handleClick() with parentheses CALLS the function immediately — its return value gets registered instead, not the function itself. Fix: handleClick (no parentheses)." },
    { text: 'el.classList.add("ready");', buggy: false },
    { text: 'el.textContent = "Ready";', buggy: false },
  ];
  const bugHints = [
    "Three of these lines are completely correct — one passes the WRONG thing to addEventListener.",
    "Look closely at how handleClick is written on the addEventListener line.",
    "It's the trailing () after handleClick — that calls it immediately instead of just referencing it. Tap that line.",
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
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🖱️</div>
        <div style={s.h2}>What happens when this button is clicked?</div>
      </div>

      <div style={s.codeBox}>{`const btn = document.querySelector("#go");
btn.addEventListener("click", () => {
  btn.textContent = "Clicked!";
});`}</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["Nothing happens", "The button's text changes to 'Clicked!'", "The page reloads", "An error appears"].map((opt, i) => (
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
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>click event</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#4ade80", fontSize: "1rem" }}>"Clicked!"</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>{sparkGuess?.includes("Clicked") ? "🎯 Exactly right!" : "Not quite — the button's text changes to 'Clicked!'."}</div>
          <div style={s.line}>addEventListener registers a function that runs whenever that click happens.</div>
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
          <span style={{ color: step.resultColor, fontWeight: 700, fontSize: "0.95rem" }}>{step.result}</span>
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
    const colorFor = (type) => (type === "bool" ? "#a78bfa" : type === "text" ? "#4ade80" : "#7dd3fc");

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run It, Watch It Evaluate</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {exprPresets.map((p) => (
            <button key={p.expr} onClick={() => { setExprPicked(p.expr); if (exprPicked !== p.expr) setTriedCount((c) => c + 1); }} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
              background: exprPicked === p.expr ? "#38bdf8" : "#0f172a", color: exprPicked === p.expr ? "#0f172a" : "#7dd3fc",
            }}>{p.expr}</button>
          ))}
        </div>

        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{active.expr}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: colorFor(active.resultType), fontWeight: 700, fontSize: "0.92rem" }}>{active.result}</div>
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
          <div style={s.h2}>Unit 4.4 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now select, change, and react to the live page with JavaScript.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What the DOM is",
              "Selecting elements with querySelector",
              "textContent vs innerHTML",
              "classList.add/remove/toggle",
              "Creating & appending elements",
              "addEventListener",
              "The event object & preventDefault()",
              "Event bubbling",
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
        <div style={s.topTitle}>Unit 4.4 — DOM Manipulation</div>
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

  // 0 — The DOM: HTML tags transforming into a tree of nodes.
  if (index === 0) {
    const isTree = pos > 0.5;
    return (
      <div style={base}>
        {!isTree ? (
          <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#94a3b8" }}>{"<div><p>Hi</p></div>"}</div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 700 }}>div</div>
            <div style={{ fontSize: "0.85rem", color: "#475569" }}>↓</div>
            <div style={{ fontSize: "0.7rem", color: "#4ade80", fontWeight: 700 }}>p</div>
          </div>
        )}
      </div>
    );
  }

  // 1 — querySelector: scanning cards, locking onto the first match.
  if (index === 1) {
    const found = pos > 0.6;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              border: i === 0 && found ? "2px solid #38bdf8" : "1px solid #334155",
              background: i === 0 && found ? "#38bdf833" : "#1e293b",
              borderRadius: 6, padding: "8px 10px", fontSize: "0.62rem", color: i === 0 && found ? "#38bdf8" : "#94a3b8",
            }}>.card</div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 6, fontSize: "0.6rem", color: "#38bdf8", fontWeight: 700 }}>{found ? "first match found ✅" : "scanning..."}</div>
      </div>
    );
  }

  // 2 — textContent (safe text) vs innerHTML (parsed markup).
  if (index === 2) {
    const isHtml = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.66rem", color: "#94a3b8" }}>{"<b>Hi</b>"}</div>
          {arrow}
          {isHtml
            ? <div style={{ fontWeight: 800, fontSize: "1rem", color: "#ef4444" }}>Hi</div>
            : <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#4ade80" }}>{"<b>Hi</b>"}</div>}
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: isHtml ? "#ef4444" : "#4ade80" }}>{isHtml ? "innerHTML (parsed)" : "textContent (safe)"}</div>
        </div>
      </div>
    );
  }

  // 3 — classList toggle: a class chip flipping on/off.
  if (index === 3) {
    const on = pos < 0.5;
    return (
      <div style={base}>
        <div style={{
          border: on ? "2px solid #4ade80" : "2px solid #334155", borderRadius: 99, padding: "10px 18px",
          fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", color: on ? "#4ade80" : "#64748b", transition: "all 0.2s",
        }}>.active</div>
        <div style={{ position: "absolute", bottom: 6, fontSize: "0.6rem", color: on ? "#4ade80" : "#64748b", fontWeight: 700 }}>{on ? "ON" : "OFF"}</div>
      </div>
    );
  }

  // 4 — createElement (detached, dim) → appendChild (attached, bright).
  if (index === 4) {
    const attached = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "1px dashed #475569", borderRadius: 8, padding: "8px 10px", fontSize: "0.62rem", color: "#64748b" }}>ul (page)</div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>{attached ? "← appended" : "  "}</div>
          <div style={{
            opacity: attached ? 1 : 0.4, border: attached ? "1px solid #4ade80" : "1px dashed #334155",
            borderRadius: 6, padding: "6px 9px", fontSize: "0.66rem", color: attached ? "#4ade80" : "#94a3b8", transition: "all 0.2s",
          }}>li (new)</div>
        </div>
      </div>
    );
  }

  // 5 — addEventListener: click pulses, handler fires.
  if (index === 5) {
    const fired = pos > 0.5 && pos < 0.8;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ background: fired ? "#38bdf8" : "#1e293b", color: fired ? "#0f172a" : "#94a3b8", border: "1px solid #38bdf8", borderRadius: 8, padding: "8px 14px", fontSize: "0.72rem", fontWeight: 700, transition: "all 0.15s" }}>click</button>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: fired ? "#4ade80" : "#64748b", fontWeight: 700 }}>{fired ? "handler ran ✅" : "waiting..."}</div>
        </div>
      </div>
    );
  }

  // 6 — Event object: a labeled card with target/type fields.
  if (index === 6) {
    return (
      <div style={base}>
        <div style={{ border: "2px solid #a78bfa", borderRadius: 8, padding: "10px 14px", fontSize: "0.66rem", color: "#a78bfa", textAlign: "left" }}>
          <div>type: "click"</div>
          <div>target: &lt;button&gt;</div>
        </div>
      </div>
    );
  }

  // 7 — preventDefault: a form submit being intercepted before navigation.
  if (index === 7) {
    const blocked = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>submit</div>
          {arrow}
          <div style={{ fontSize: blocked ? "1rem" : "0.8rem", color: blocked ? "#ef4444" : "#64748b", fontWeight: 700 }}>{blocked ? "🚫 page reload" : "(default)"}</div>
        </div>
      </div>
    );
  }

  // 8 — Event bubbling: click travels up nested boxes.
  const level = Math.floor(pos * 3) % 3;
  const labels = ["button", "div", "body"];
  return (
    <div style={base}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {labels.map((l, i) => (
          <div key={l} style={{
            border: level === i ? "2px solid #fb923c" : "1px solid #334155", borderRadius: 6, padding: "6px 14px",
            fontSize: "0.66rem", color: level === i ? "#fb923c" : "#64748b", fontWeight: level === i ? 700 : 400,
          }}>{l}</div>
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
              fontFamily: "monospace", fontSize: "0.7rem", color: matched[p.code] ? "#4ade80" : "#e2e8f0",
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
