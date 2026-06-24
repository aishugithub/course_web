// ============================================================================
//  UNIT 3.3 — "Flexbox"
//  Module: M3 — CSS Styling (third unit, follows Colours/Fonts/Spacing)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly like every sibling lesson: App.jsx
//    looks up "Unit3_3" in config/course.config.js, renders this component
//    with { student, onUnitComplete }, and waits for exactly one call to
//    onUnitComplete() (fired at the end of the quiz) before saving progress
//    and unlocking Unit3_4 (CSS Grid).
//  - Never imports api.js or gas.config.js — only App.jsx is allowed to talk
//    to the backend (see ADDING_NEW_LESSON.md at the repo root).
//
//  TEACHING DESIGN — same six-stage shell as every other unit:
//    Stage 0  SPARK      — curiosity question before any teaching.
//    Stage 1  BUILD      — five concepts: container/items & display:flex →
//                           main vs cross axis & flex-direction →
//                           justify-content → align-items →
//                           flex-grow/shrink/basis & flex-wrap. Timer-gated,
//                           Plain⇄Tech toggle, same as every other unit.
//    Stage 2  SEE IT     — a real flex row assembled live, item by item,
//                           with the actual CSS properties shown alongside
//                           a REAL flex container rendering those exact
//                           items — not a static picture of one.
//    Stage 3  TRY IT     — a genuine interactive flexbox PLAYGROUND: the
//                           student clicks through real justify-content
//                           and align-items values on an ACTUAL flex
//                           container (rendered with real CSS flex
//                           properties, not a simulation), and watches the
//                           boxes physically rearrange in real time.
//    Stage 4  CHALLENGE  — tag-matching (property → what it controls), then
//                           a "spot the bug" hunt where the bug is a classic
//                           Flexbox mistake (forgetting flex-wrap on a row
//                           that needs to wrap on small screens).
//    Stage 5  QUIZ       — 10 questions. Wrong answers never reveal the
//                           correct option — an escalating hint shows
//                           instead, and the hint is ALWAYS visible on every
//                           wrong attempt, never disappearing once the hint
//                           array runs out (it stays pinned at the final,
//                           most specific hint).
//
//  MOBILE-FRIENDLINESS: every flex demo here uses flexWrap so it never
//  overflows a phone's width; no fixed pixel widths anywhere.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit3_3({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ────────────────────────────────────────────────────
  const [stage, setStage] = useState(0); // 0 Spark · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

  // ── SPARK stage state ──────────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD stage state ──────────────────────────────────────────────────────
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT stage state ──────────────────────────────────────────────────────
  // seeitStep walks through items being added one at a time to a REAL flex
  // row (rendered with display:flex below) so the student watches actual
  // flex behaviour, not a drawing of it.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT stage state ──────────────────────────────────────────────────────
  // The real Flexbox playground: justifyVal/alignVal/directionVal/wrapVal
  // are fed DIRECTLY into an actual flex container's inline style further
  // down in renderTryIt() — this is genuine CSS flex behaviour the student
  // is controlling, not a simulated stand-in. triedCombos counts distinct
  // (justify, align) pairs explored, gating the next stage until the
  // student has experimented enough to see real variety.
  const [justifyVal, setJustifyVal] = useState("flex-start");
  const [alignVal, setAlignVal] = useState("stretch");
  const [directionVal, setDirectionVal] = useState("row");
  const [wrapVal, setWrapVal] = useState("nowrap");
  const [triedCombos, setTriedCombos] = useState(() => new Set());

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
      title: "Flex Container & Flex Items — Turning On Flexbox",
      plain: "Set display: flex on a parent element, and it instantly becomes a FLEX CONTAINER — every direct child inside it automatically becomes a FLEX ITEM, and they line up in a row by default, with no floats or extra markup needed.",
      technical: "display: flex (or inline-flex) establishes a flex formatting context. The element it's set on becomes the flex container; its direct children automatically become flex items, laid out according to the flex properties on both the container and the items, with floats/clear having no effect inside it.",
      unlock: 8,
    },
    {
      title: "Main Axis vs Cross Axis — flex-direction",
      plain: "Flexbox thinks in two axes: the MAIN axis (the direction items flow in) and the CROSS axis (perpendicular to it). By default flex-direction is \"row\", so the main axis runs left-to-right and the cross axis runs top-to-bottom. Switch to \"column\" and the two axes literally swap — main becomes vertical, cross becomes horizontal.",
      technical: "flex-direction (row | row-reverse | column | column-reverse) defines the main axis. The cross axis is always perpendicular to it. This matters because justify-content always aligns along the MAIN axis and align-items always aligns along the CROSS axis — switching flex-direction effectively swaps which property controls horizontal vs vertical alignment.",
      unlock: 9,
    },
    {
      title: "justify-content — Aligning Along the Main Axis",
      plain: "justify-content controls how items are spaced along the MAIN axis: flex-start packs them at the beginning, center bunches them in the middle, flex-end pushes them to the end, space-between spreads them out with equal gaps in between (but none at the edges), and space-around/space-evenly add space at the edges too.",
      technical: "justify-content distributes extra free space along the main axis: flex-start, flex-end, center, space-between (equal gaps between items, none at the container edges), space-around (equal space around each item, so edge gaps are half of between-gaps), space-evenly (perfectly equal space everywhere, including edges).",
      unlock: 9,
    },
    {
      title: "align-items — Aligning Along the Cross Axis",
      plain: "align-items controls how items line up along the CROSS axis (perpendicular to the main one): stretch (the default) makes every item fill the full cross-axis space, flex-start/flex-end push items to one side, and center vertically (in a row) centers them.",
      technical: "align-items aligns flex items along the cross axis: stretch (default — items stretch to fill the container's cross-size unless a fixed size is set), flex-start, flex-end, center, baseline (aligns items by their text baselines). align-self overrides align-items for one specific item.",
      unlock: 9,
    },
    {
      title: "flex-grow, flex-shrink, flex-basis & flex-wrap",
      plain: "flex-grow says how eagerly an item should expand to fill leftover space (0 = don't grow at all, higher numbers grow more relative to siblings). flex-shrink is the same idea but for shrinking when space is tight. flex-basis is an item's starting size before growing/shrinking happens. flex-wrap: wrap lets items drop onto a new line instead of being squeezed or overflowing — essential for responsive rows.",
      technical: "flex-grow (default 0) and flex-shrink (default 1) are unitless ratios determining how leftover space/deficit is distributed proportionally among items. flex-basis sets an item's initial main-size before grow/shrink is applied. The shorthand flex: grow shrink basis combines all three. flex-wrap: nowrap (default) forces items onto one line even if it overflows; wrap allows items to flow onto multiple lines.",
      unlock: 10,
    },
  ];

  // ── CONTENT: Quiz bank — 10 questions ──────────────────────────────────────
  const quizQuestions = [
    {
      q: "What CSS declaration turns an element into a flex container?",
      options: ["flex: container;", "display: flex;", "position: flex;", "layout: flexbox;"],
      answer: 1,
      hints: [
        "It's set using the same property you'd normally use for block/inline/none.",
        "It's a value of the display property, not a brand-new property of its own.",
        "display: flex (or inline-flex) is what establishes a flex formatting context on an element.",
      ],
      explanation: "display: flex (or display: inline-flex) turns an element into a flex container — its direct children automatically become flex items.",
    },
    {
      q: "By default (flex-direction: row), which direction does the MAIN axis run?",
      options: ["Top to bottom", "Left to right", "Diagonally", "There is no main axis by default"],
      answer: 1,
      hints: [
        "'Row' strongly implies a horizontal layout direction.",
        "Think of items lined up side-by-side, like words in a sentence.",
        "With the default flex-direction: row, the main axis runs left-to-right (in left-to-right languages), and the cross axis runs top-to-bottom.",
      ],
      explanation: "With flex-direction: row (the default), the main axis runs horizontally, left to right. The cross axis is perpendicular — top to bottom.",
    },
    {
      q: "If you switch flex-direction from row to column, what happens to justify-content and align-items?",
      options: [
        "Nothing changes — they always mean the same thing",
        "They stop working entirely",
        "Their effective direction swaps — justify-content now aligns vertically, align-items now aligns horizontally",
        "You must rename them to justify-content-v and align-items-v",
      ],
      answer: 2,
      hints: [
        "Remember: justify-content always follows the MAIN axis, align-items always follows the CROSS axis.",
        "Switching flex-direction to column doesn't change which property does what — it changes which physical direction is 'main'.",
        "Since column makes the main axis vertical, justify-content (main-axis alignment) now controls vertical spacing, and align-items (cross-axis) now controls horizontal alignment — a common point of confusion for beginners.",
      ],
      explanation: "justify-content always aligns along the main axis, and align-items always aligns along the cross axis — when flex-direction: column makes the main axis vertical, their effective directions swap accordingly.",
    },
    {
      q: "Which justify-content value spreads items with equal gaps BETWEEN them, but no extra gap at the container's edges?",
      options: ["space-around", "space-evenly", "space-between", "center"],
      answer: 2,
      hints: [
        "Its name is almost literally a description of what it does.",
        "Two of these options also add space at the edges; this one specifically does not.",
        "space-between puts equal gaps strictly BETWEEN items, leaving the first and last items flush against the container's edges.",
      ],
      explanation: "space-between distributes equal gaps strictly between items, with no extra space added at the container's edges (unlike space-around or space-evenly).",
    },
    {
      q: "What is the DEFAULT value of align-items, and what does it do?",
      options: [
        "center — items are centered on the cross axis by default",
        "stretch — items stretch to fill the container's full cross-axis size unless given a fixed size",
        "flex-start — items hug the start of the cross axis by default",
        "There is no default; align-items must always be set explicitly",
      ],
      answer: 1,
      hints: [
        "This is why flex items in a row often all appear the same height even without you setting height anywhere.",
        "The default behaviour FILLS the available cross-axis space, rather than hugging one edge.",
        "stretch is the default — every flex item expands to fill the container's cross-axis size, unless that item has an explicit size set.",
      ],
      explanation: "align-items defaults to stretch, which is why flex items in a row commonly end up the same height automatically — each stretches to fill the cross-axis unless it has its own fixed size.",
    },
    {
      q: "Two flex items both have flex-grow: 1, and there's 100px of leftover space in the row. How is it distributed?",
      options: [
        "All 100px goes to whichever item is listed first in the HTML",
        "It's split evenly — 50px extra to each item",
        "Nothing is distributed unless flex-basis is also set to a specific px value",
        "The leftover space is always given to the LAST item only",
      ],
      answer: 1,
      hints: [
        "flex-grow values work as RATIOS relative to each other, not as fixed px amounts.",
        "Equal flex-grow values mean an equal SHARE of the leftover space — think of it like splitting a bill evenly.",
        "With both items at flex-grow: 1, they have an equal ratio, so the 100px of leftover space splits evenly — 50px extra to each.",
      ],
      explanation: "flex-grow values are proportional ratios. Two items with equal flex-grow: 1 split any leftover space evenly between them — 50px each in this case.",
    },
    {
      q: "What's the practical effect of adding flex-wrap: wrap to a flex row that's too narrow for all its items?",
      options: [
        "Items get squeezed to fit on one line no matter how small they get",
        "Items overflow the container horizontally, creating a scrollbar",
        "Items that don't fit drop down onto a new line, instead of overflowing or shrinking indefinitely",
        "flex-wrap has no visual effect on a row layout",
      ],
      answer: 2,
      hints: [
        "The default, nowrap, is what forces everything onto a single line even if it overflows.",
        "'Wrap' is a strong hint here — think of text wrapping onto a new line when it runs out of room.",
        "flex-wrap: wrap lets items that don't fit on the current line flow onto additional lines instead — essential for responsive rows on smaller screens.",
      ],
      explanation: "flex-wrap: wrap allows flex items that don't fit on one line to flow onto subsequent lines, rather than overflowing the container or being squeezed indefinitely — critical for responsive layouts.",
    },
    {
      q: "Which property would you reach for to override align-items just for ONE specific flex item, leaving the rest unaffected?",
      options: ["align-content", "align-self", "justify-self", "flex-align"],
      answer: 1,
      hints: [
        "You need a property that targets an INDIVIDUAL item, not the whole container.",
        "Its name pairs directly with align-items, but scoped to 'self' instead of all items.",
        "align-self, set on an individual flex item, overrides whatever align-items says for the container — only that one item is affected.",
      ],
      explanation: "align-self is set on an individual flex item and overrides the container's align-items value just for that one item, leaving its siblings unaffected.",
    },
    {
      q: "A row of 3 equal-width cards needs to stack into a single column on narrow phone screens. Which Flexbox approach handles this most directly?",
      options: [
        "Set flex-direction: row everywhere and accept the overflow on phones",
        "Use a media query to switch flex-direction to column on small screens",
        "Flexbox cannot respond to screen size at all — only Grid can",
        "Add more flex-grow to force the cards to shrink to zero width",
      ],
      answer: 1,
      hints: [
        "Recall that flex-direction can be column as well as row — and CSS lets you change property values conditionally based on screen size.",
        "The tool for 'apply different CSS at different screen widths' is a media query.",
        "Wrapping flex-direction: column inside a media query for small screens is the standard, direct way to make a flex row stack vertically on narrow viewports.",
      ],
      explanation: "Switching flex-direction from row to column inside a media query (targeting small screens) is the standard, direct Flexbox technique for stacking a row of items into a column on narrow viewports.",
    },
    {
      q: "What's the key structural relationship in Flexbox between a 'flex container' and a 'flex item'?",
      options: [
        "Any element anywhere on the page is automatically a flex item",
        "A flex item must be styled with display: flex itself",
        "A flex item is specifically a DIRECT child of an element that has display: flex set on it",
        "Flex items and flex containers are unrelated, separate concepts",
      ],
      answer: 2,
      hints: [
        "Setting display: flex only affects the element's OWN direct children, not deeper descendants automatically.",
        "Grandchildren of a flex container are NOT automatically flex items themselves — only direct children are.",
        "A flex item is specifically a direct child of a flex container (an element with display: flex). Nested elements further down are unaffected unless their own parent is also a flex container.",
      ],
      explanation: "Only the direct children of an element with display: flex become flex items — deeper-nested descendants are not automatically affected unless their own immediate parent is also a flex container.",
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

  // ── Looping animation frame (Build & See-It) ───────────────────────────────
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — items added one at a time to a REAL flex row ────────
  // `count` tells renderSeeIt() how many of the demo's actual flex items to
  // render right now — the container below genuinely has display:flex set,
  // so this is real flex re-flow behaviour, not an illustration of it.
  const seeitSteps = [
    { plain: "We start with an empty flex container — display: flex is set, but it has no children yet.", tech: ".row { display: flex; }", count: 0 },
    { plain: "Add one item. With nothing else set, it sits at the start of the row.", tech: "+ one flex item, default justify-content: flex-start.", count: 1 },
    { plain: "Add a second item. It lines up right after the first, along the main axis.", tech: "+ second flex item — both flow left-to-right automatically.", count: 2 },
    { plain: "Add a third item, then set justify-content: space-between. Watch them spread out.", tech: "+ third item, justify-content: space-between applied.", count: 3 },
  ];

  // ── CONTENT: Challenge 1 — property-to-meaning matching ────────────────────
  const ch1Pairs = [
    { code: "display: flex", meaning: "Turns an element into a flex container" },
    { code: "justify-content", meaning: "Aligns items along the MAIN axis" },
    { code: "align-items", meaning: "Aligns items along the CROSS axis" },
    { code: "flex-wrap: wrap", meaning: "Lets overflowing items drop onto a new line" },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: missing flex-wrap on a row that
  // needs to wrap on small screens. ───────────────────────────────────────────
  const bugLines = [
    { text: ".cards { display: flex; gap: 16px; }", buggy: true, why: "This flex row has no flex-wrap set, which defaults to nowrap — on a narrow phone screen, several cards in a row will get squeezed uncomfortably small (or overflow) instead of dropping onto a new line. Adding flex-wrap: wrap (or wrap with a media query) is the standard fix for a row of cards that needs to work on small screens." },
    { text: ".cards .card { flex: 1 1 220px; }", buggy: false },
    { text: ".nav-links { display: flex; justify-content: flex-end; }", buggy: false },
    { text: ".hero { display: flex; align-items: center; }", buggy: false },
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
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.78rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
    flexItem: { background: "#38bdf8", color: "#0f172a", borderRadius: 8, padding: "16px 20px", fontWeight: 700, fontSize: "0.8rem", textAlign: "center", minWidth: 60 },
    selectChip: (active) => ({ padding: "6px 12px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", background: active ? "#38bdf8" : "#0f172a", color: active ? "#0f172a" : "#7dd3fc", margin: "2px" }),
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📐</div>
        <div style={s.h2}>You have 3 boxes in a row and want them evenly spaced — including matching gaps at both ends.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          <strong style={{ color: "#f1f5f9" }}>Which single justify-content value does this in one line, with no extra markup?</strong>
        </div>
      </div>
      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["flex-start", "space-between", "space-evenly", "center"].map((opt) => (
              <div key={opt} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", fontFamily: "monospace", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>✅ Let's find out!</div>
          <div style={s.p}>
            {sparkGuess === "space-evenly"
              ? "🎯 Exactly right! space-evenly creates perfectly equal gaps everywhere — including the edges. (space-between is close, but leaves NO gap at the edges — only between items.)"
              : "The real answer: space-evenly. It's the only value that puts EQUAL space everywhere, including matching gaps at both edges. space-between is the classic mix-up — it skips the edge gaps entirely."}
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
  // A REAL flex container (display:flex genuinely set below) gains items
  // one at a time, exactly mirroring the code shown above it.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    const isLastStep = seeitStep === seeitSteps.length - 1;
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch a Real Flex Row Get Built</div>
        <div style={s.p}>Step through each addition. The row below is a genuine flex container — not a drawing of one.</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>{step.tech}</div>

        {/* The genuine flex container — display:flex is really set here. */}
        <div style={{
          display: "flex", justifyContent: isLastStep ? "space-between" : "flex-start", gap: 10,
          background: "#0f172a", borderRadius: 10, padding: "16px", margin: "14px 0", minHeight: 70, flexWrap: "wrap",
        }}>
          {Array.from({ length: step.count }).map((_, i) => (
            <div key={i} style={s.flexItem}>Item {i + 1}</div>
          ))}
          {step.count === 0 && <div style={{ color: "#475569", fontSize: "0.78rem" }}>(empty flex container)</div>}
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
  // A genuine, fully-interactive Flexbox playground: every chip below sets
  // REAL CSS flex properties on the container rendered right underneath.
  const renderTryIt = () => {
    const justifyOptions = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
    const alignOptions = ["stretch", "flex-start", "center", "flex-end"];
    const comboCount = triedCombos.size;

    function pick(setter, value, axis) {
      setter(value);
      setTriedCombos((prev) => {
        const next = new Set(prev);
        next.add(axis === "j" ? `j:${value}|a:${alignVal}` : `j:${justifyVal}|a:${value}`);
        return next;
      });
    }

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 A Real Flexbox Playground</div>
        <div style={s.p}>Try at least 4 different combinations of justify-content and align-items. Every chip below applies real CSS to the container.</div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 4 }}>justify-content (main axis)</div>
          {justifyOptions.map((opt) => (
            <button key={opt} style={s.selectChip(justifyVal === opt)} onClick={() => pick(setJustifyVal, opt, "j")}>{opt}</button>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 4 }}>align-items (cross axis)</div>
          {alignOptions.map((opt) => (
            <button key={opt} style={s.selectChip(alignVal === opt)} onClick={() => pick(setAlignVal, opt, "a")}>{opt}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button style={s.selectChip(directionVal === "row")} onClick={() => setDirectionVal("row")}>direction: row</button>
          <button style={s.selectChip(directionVal === "column")} onClick={() => setDirectionVal("column")}>direction: column</button>
          <button style={s.selectChip(wrapVal === "wrap")} onClick={() => setWrapVal(wrapVal === "wrap" ? "nowrap" : "wrap")}>wrap: {wrapVal}</button>
        </div>

        {/* The real, live flex container — every property above is applied
            directly, no simulation layer in between. */}
        <div style={{
          display: "flex", flexDirection: directionVal, justifyContent: justifyVal, alignItems: alignVal, flexWrap: wrapVal,
          background: "#0f172a", borderRadius: 10, padding: "16px", minHeight: 160, gap: 10, transition: "all 0.2s",
        }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ ...s.flexItem, height: n === 2 ? 70 : 44, transition: "all 0.2s" }}>Box {n}</div>
          ))}
        </div>

        <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontFamily: "monospace", fontSize: "0.74rem", color: "#7dd3fc" }}>
          display: flex; flex-direction: {directionVal}; justify-content: {justifyVal}; align-items: {alignVal}; flex-wrap: {wrapVal};
        </div>

        <div style={{ marginTop: 14 }}>
          {comboCount >= 4
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try {4 - comboCount} more combination{4 - comboCount === 1 ? "" : "s"} to unlock the next stage ({comboCount}/4 tried).</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match Property to What It Controls</div>
          <div style={s.p}>Tap a property, then tap what it actually controls.</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Challenge 2: Spot the Missing Responsiveness</div>
          <div style={s.p}>Three of these four flex rules are reasonably safe for small screens. One row of cards will get painfully squeezed on a phone because it's missing a key property. Tap it.</div>
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
          <div style={s.h2}>Unit 3.3 Complete!</div>
          <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now build flexible, responsive rows and columns with real confidence — and you've actually played with a live Flexbox container, not just read about one.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["display: flex — containers & items", "Main axis vs cross axis — flex-direction", "justify-content — main-axis alignment", "align-items — cross-axis alignment", "flex-grow/shrink/basis & flex-wrap"].map((l, i) => (
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
        <div style={s.topTitle}>Unit 3.3 — Flexbox</div>
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

  // Concept 0 — display:flex turning three "loose" boxes into a tidy row.
  if (index === 0) {
    const aligned = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: aligned ? 8 : 2, transition: "gap 0.3s", alignItems: aligned ? "center" : "flex-end" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 28, height: 28 + (aligned ? 0 : i * 8), background: "#38bdf8", borderRadius: 6,
              transform: aligned ? "none" : `translateY(${i * 3}px) rotate(${i * 3}deg)`, transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>
    );
  }

  // Concept 1 — main vs cross axis arrows, swapping orientation.
  if (index === 1) {
    const isRow = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: isRow ? "row" : "column", alignItems: "center", gap: 10, transition: "all 0.3s" }}>
          <div style={{ fontSize: "1.2rem", color: "#38bdf8" }}>{isRow ? "→" : "↓"}</div>
          <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>main axis ({isRow ? "row" : "column"})</div>
        </div>
      </div>
    );
  }

  // Concept 2 — justify-content cycling through a few values visually.
  if (index === 2) {
    const vals = ["flex-start", "center", "space-between"];
    const which = Math.floor(pos * vals.length) % vals.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", justifyContent: vals[which], gap: 6, width: "90%", background: "#1e293b", borderRadius: 8, padding: 10, transition: "justify-content 0.3s" }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 20, height: 20, background: "#38bdf8", borderRadius: 4 }} />)}
        </div>
      </div>
    );
  }

  // Concept 3 — align-items cycling between stretch/center/flex-end.
  if (index === 3) {
    const vals = ["stretch", "center", "flex-end"];
    const which = Math.floor(pos * vals.length) % vals.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: vals[which], gap: 8, height: 60, background: "#1e293b", borderRadius: 8, padding: 8, transition: "align-items 0.3s" }}>
          {[18, 36, 26].map((h, i) => (
            <div key={i} style={{ width: 18, height: vals[which] === "stretch" ? "100%" : h, background: "#a78bfa", borderRadius: 4, transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
    );
  }

  // Concept 4 — flex-grow distributing leftover space proportionally.
  return (
    <div style={base}>
      <div style={{ display: "flex", gap: 6, width: "90%", background: "#1e293b", borderRadius: 8, padding: 8 }}>
        <div style={{ flex: pos > 0.5 ? 2 : 1, height: 28, background: "#4ade80", borderRadius: 4, transition: "flex 0.3s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#0f172a" }}>grow:1</div>
        <div style={{ flex: 1, height: 28, background: "#38bdf8", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#0f172a" }}>grow:1</div>
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>PROPERTIES</div>
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>WHAT IT CONTROLS</div>
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
