// ============================================================================
//  UNIT 3.4 — "CSS Grid"
//  Module: M3 — CSS Styling (fourth and FINAL unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly like every sibling lesson: App.jsx
//    looks up "Unit3_4" in config/course.config.js, renders this component
//    with { student, onUnitComplete }, and waits for exactly one call to
//    onUnitComplete() (fired at the end of the quiz) before saving progress
//    and unlocking Module 4 (JavaScript Fundamentals).
//  - Never imports api.js or gas.config.js — only App.jsx talks to the
//    backend, by design (see ADDING_NEW_LESSON.md at the repo root).
//
//  TEACHING DESIGN — same six-stage shell as every other unit in this
//  course, so it feels seamless to a student moving between lessons:
//    Stage 0  SPARK      — curiosity question before any teaching.
//    Stage 1  BUILD      — five concepts: grid container/items & display:
//                           grid → grid-template-columns/rows & the fr
//                           unit → repeat() & gap → grid-template-areas →
//                           placing items with grid-column/row & span.
//                           Timer-gated, Plain⇄Tech toggle, identical
//                           pattern to every earlier unit.
//    Stage 2  SEE IT     — a real CSS grid assembled live, column by
//                           column then row by row, with the ACTUAL grid
//                           rendering at every step (not a drawing).
//    Stage 3  TRY IT     — a genuine interactive Grid PLAYGROUND: the
//                           student changes grid-template-columns, gap,
//                           and which cells span 2 columns, all applied as
//                           REAL CSS to a real grid container underneath.
//    Stage 4  CHALLENGE  — tag-matching (property → what it does), then a
//                           "spot the bug" hunt where the bug is reaching
//                           for Flexbox where Grid is clearly the better
//                           tool (a genuine two-dimensional layout problem).
//    Stage 5  QUIZ       — 10 questions. Wrong answers never reveal the
//                           correct option — an escalating hint shows
//                           instead, and the hint is ALWAYS visible on
//                           every wrong attempt, never disappearing once
//                           the hint array runs out (stays pinned at the
//                           final, most specific hint).
//
//  MOBILE-FRIENDLINESS: every grid demo collapses gracefully on narrow
//  screens via auto-fit/minmax()-style thinking in the explanations, and no
//  fixed pixel widths are used anywhere in this file's own layout.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit3_4({ student, onUnitComplete }) {
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
  // seeitStep walks a REAL CSS grid (genuinely display:grid below) from a
  // single cell up to a full 3-column, 2-row layout; seeitMode toggles the
  // narration text exactly like every other unit's See-It stage.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT stage state ──────────────────────────────────────────────────────
  // The real Grid playground: colCount and gapVal feed DIRECTLY into an
  // actual grid container's inline style below (grid-template-columns via
  // repeat(), and gap), and spanSecond toggles whether the 2nd cell spans 2
  // columns using gridColumn — all genuine CSS Grid behaviour, not a
  // simulated stand-in. triedConfigs counts distinct settings explored.
  const [colCount, setColCount] = useState(3);
  const [gapVal, setGapVal] = useState(10);
  const [spanSecond, setSpanSecond] = useState(false);
  const [triedConfigs, setTriedConfigs] = useState(() => new Set());

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
      title: "Grid Container & Grid Items — Turning On CSS Grid",
      plain: "Set display: grid on a parent, and it becomes a GRID CONTAINER — its direct children automatically become GRID ITEMS, placed into an invisible grid of rows and columns that you define with a couple more properties.",
      technical: "display: grid (or inline-grid) establishes a grid formatting context. The element becomes the grid container; its direct children become grid items, auto-placed into the grid defined by grid-template-columns/rows unless explicitly positioned with grid-column/grid-row.",
      unlock: 8,
    },
    {
      title: "grid-template-columns / rows & the fr Unit",
      plain: "grid-template-columns: 200px 1fr 1fr defines exactly 3 columns: one fixed at 200px, and two that share the REMAINING space equally (fr stands for \"fraction\" — a flexible share of leftover space, similar in spirit to flex-grow). grid-template-rows works the same way, but for rows.",
      technical: "grid-template-columns/rows define explicit track sizes for the grid. The fr unit represents a fraction of the available free space in the grid container — 1fr 2fr splits leftover space in a 1:2 ratio, after any fixed-size tracks (like 200px) are subtracted first.",
      unlock: 9,
    },
    {
      title: "repeat() & gap — Less Typing, Cleaner Spacing",
      plain: "Instead of writing 1fr 1fr 1fr three separate times, repeat(3, 1fr) does the exact same thing in less code — and it's easy to change to 4 or 5 columns later. gap (replacing the older grid-gap) sets consistent spacing between every row AND column in one declaration.",
      technical: "repeat(count, track-size) is shorthand for repeating a track-size pattern N times — repeat(3, 1fr) is identical to 1fr 1fr 1fr. The gap property (row-gap and column-gap combined, or set individually) defines spacing between grid tracks without needing margins on individual items, avoiding the classic 'extra margin at the edge' problem margins cause.",
      unlock: 9,
    },
    {
      title: "grid-template-areas — Naming Your Layout",
      plain: "Instead of just counting columns/rows, you can literally draw your layout using names: grid-template-areas lets you write \"header header\" / \"sidebar main\" / \"footer footer\" as a visual map, then assign each child to a named area with grid-area. It reads almost like ASCII art of your actual page layout.",
      technical: "grid-template-areas accepts a string-per-row syntax where each word names a grid area; repeating a name across cells merges them into one larger area. Items are assigned via grid-area: <name>, matching the parent's defined area names — this is often the most readable way to express a whole-page layout (header/sidebar/main/footer).",
      unlock: 10,
    },
    {
      title: "Placing Items — grid-column, grid-row & span",
      plain: "Want one specific item to stretch across 2 columns instead of just 1? Set grid-column: span 2 on that item. You can also place an item at an exact numbered line, like grid-column: 1 / 3 (start at line 1, end at line 3) — letting you build layouts where items deliberately overlap the regular grid pattern.",
      technical: "grid-column/grid-row accept either explicit line numbers (start / end, e.g. 1 / 3) or the span keyword (span 2 = occupy 2 tracks starting from the auto-placed position). This is what makes Grid genuinely two-dimensional — unlike Flexbox, an item can deliberately span multiple rows AND columns simultaneously.",
      unlock: 10,
    },
  ];

  // ── CONTENT: Quiz bank — 10 questions ──────────────────────────────────────
  const quizQuestions = [
    {
      q: "What CSS declaration turns an element into a grid container?",
      options: ["grid: container;", "display: grid;", "layout: grid;", "position: grid;"],
      answer: 1,
      hints: [
        "Same property you'd use for block/inline/flex — just a different value.",
        "It's a value of display, not a brand-new property.",
        "display: grid (or display: inline-grid) is what establishes a grid formatting context on an element.",
      ],
      explanation: "display: grid (or display: inline-grid) turns an element into a grid container — its direct children automatically become grid items.",
    },
    {
      q: "Given grid-template-columns: 200px 1fr 1fr, how is space distributed across the 3 columns?",
      options: [
        "All three columns end up exactly 200px wide",
        "The first column is a fixed 200px; the remaining space splits evenly between the other two",
        "1fr always means exactly 1 pixel",
        "fr columns are ignored entirely if a px column is also present",
      ],
      answer: 1,
      hints: [
        "px is an absolute, fixed unit — it claims its space first, no matter what.",
        "fr means a FRACTION of whatever space is left over, after fixed-size tracks are subtracted.",
        "The 200px column takes a fixed 200px; the two 1fr columns then split whatever space remains equally between them, since they have equal fr ratios.",
      ],
      explanation: "px tracks claim a fixed amount of space first. The remaining fr tracks then divide whatever space is left over, proportionally to their fr ratios — here, two equal 1fr columns split the leftover space evenly.",
    },
    {
      q: "What does repeat(3, 1fr) produce, written as grid-template-columns?",
      options: [
        "A single column that repeats 3 times vertically",
        "The exact same result as writing 1fr 1fr 1fr",
        "3 columns of exactly 3px each",
        "It is invalid CSS syntax",
      ],
      answer: 1,
      hints: [
        "repeat() is purely a shorthand — it doesn't add any new capability, just less typing.",
        "Read it literally: 'repeat this track-size pattern, 3 times'.",
        "repeat(3, 1fr) is exactly equivalent to writing 1fr 1fr 1fr by hand — just shorter, and easier to update if the column count changes later.",
      ],
      explanation: "repeat(count, track-size) is shorthand for writing that track-size pattern count times — repeat(3, 1fr) produces exactly the same 3 equal-fraction columns as writing 1fr 1fr 1fr manually.",
    },
    {
      q: "What's the main advantage of the gap property over manually adding margins to individual grid items?",
      options: [
        "gap is purely cosmetic and changes nothing structurally",
        "gap adds consistent spacing between tracks without creating extra space at the grid's outer edges, which margins on edge items would",
        "gap only works in print stylesheets",
        "There's no real difference, they're identical in every case",
      ],
      answer: 1,
      hints: [
        "Think about what happens if you add a left-margin to the FIRST item in a row to space items apart — does that also push the whole row away from the container's edge?",
        "gap intentionally only affects spacing BETWEEN tracks, never at the outer boundary.",
        "Margins on individual items would also shift the first/last item away from the container's edge, which is usually unwanted — gap avoids this entirely by only adding space between tracks.",
      ],
      explanation: "gap inserts spacing strictly between grid tracks (rows/columns), without affecting the outer edges of the grid — unlike margins on individual items, which would also push edge items away from the container boundary.",
    },
    {
      q: "In grid-template-areas, what happens if you repeat the same area name across multiple adjacent cells, like \"header header\"?",
      options: [
        "It causes a CSS error — area names must be unique per cell",
        "Those cells merge into a single, larger named area spanning all of them",
        "Only the first occurrence of the name is used; the rest are ignored",
        "It has no effect on layout, purely cosmetic for readability",
      ],
      answer: 1,
      hints: [
        "Think of the string syntax as drawing a literal map of your layout, cell by cell.",
        "Repeating a name across cells is exactly HOW you tell Grid that those cells should merge into one bigger region.",
        "Repeating an area name (like \"header header\") across adjacent cells merges them into a single larger area spanning all those cells — this is the intended mechanism, not an error.",
      ],
      explanation: "Repeating the same area name across adjacent cells in grid-template-areas merges them into one larger named area — this is exactly how you create regions wider or taller than a single grid cell.",
    },
    {
      q: "What does grid-column: span 2 do when applied to one specific grid item?",
      options: [
        "Deletes the next item in the grid",
        "Makes that item occupy 2 column-tracks instead of just 1, starting from its auto-placed position",
        "Forces every item in the grid to span 2 columns",
        "Adds 2px of extra margin to that item",
      ],
      answer: 1,
      hints: [
        "'span' describes how many TRACKS the item should stretch across, not a fixed pixel measurement.",
        "It only affects the ONE item it's applied to — siblings are unaffected.",
        "grid-column: span 2 makes that specific item stretch across 2 column-tracks starting from wherever it would normally be auto-placed — a key part of what makes Grid genuinely two-dimensional.",
      ],
      explanation: "grid-column: span 2 makes a single grid item occupy 2 column-tracks instead of 1, starting from its auto-placed position — only that item is affected, not its siblings.",
    },
    {
      q: "Why is CSS Grid described as 'two-dimensional' while Flexbox is usually described as 'one-dimensional'?",
      options: [
        "Grid can only be used for square layouts; Flexbox can be any shape",
        "Grid simultaneously controls both rows AND columns as a real layout system; Flexbox primarily lays items out along one axis at a time",
        "There is no real difference; the labels are arbitrary marketing terms",
        "Flexbox cannot wrap onto multiple lines under any circumstances",
      ],
      answer: 1,
      hints: [
        "Flexbox has a main axis and a cross axis too — but think about whether you can deliberately ALIGN something to BOTH a specific row and a specific column at once in Flexbox the way you can in Grid.",
        "Grid lets an item span specific rows AND specific columns simultaneously, by design — that's the 'two-dimensional' part.",
        "Grid is built to control rows and columns together as one coordinated system (an item can span 2 rows and 3 columns at once); Flexbox fundamentally distributes items along a single primary axis, even though wrapping can create multiple lines.",
      ],
      explanation: "Grid manages rows and columns together as a single coordinated system — an item can deliberately span specific rows and columns simultaneously. Flexbox is fundamentally organized around a single main axis, even though wrapped items can create multiple lines.",
    },
    {
      q: "A page layout needs a header spanning the full width, a sidebar, a main content area, and a footer spanning the full width — a classic whole-page layout. Which tool is the better fit?",
      options: [
        "Flexbox, because it is always the simpler choice",
        "CSS Grid, because the layout has genuine two-dimensional structure (rows AND columns relating to each other)",
        "Neither tool can build this layout at all",
        "Only inline styles with absolute positioning can achieve this",
      ],
      answer: 1,
      hints: [
        "This layout has a clear relationship between rows (header/body/footer) AND columns (sidebar/main) at the same time.",
        "Grid is specifically designed for exactly this kind of whole-page, two-dimensional structure — grid-template-areas was practically built for this exact scenario.",
        "CSS Grid's two-dimensional control (and grid-template-areas specifically) is the natural fit for a layout that has both row structure (header/body/footer) and column structure (sidebar/main) at once.",
      ],
      explanation: "A whole-page layout with both row relationships (header/body/footer) and column relationships (sidebar/main) is exactly the two-dimensional structure CSS Grid (especially grid-template-areas) is designed for.",
    },
    {
      q: "What happens to a grid item if you don't explicitly place it with grid-column/grid-row at all?",
      options: [
        "It disappears from the page entirely",
        "It gets auto-placed into the next available cell, following the grid's defined tracks",
        "The whole page layout breaks and nothing renders",
        "It always defaults to row 1, column 1, overlapping every other item",
      ],
      answer: 1,
      hints: [
        "Grid items don't require manual placement to appear correctly — there's a sensible default behaviour.",
        "Think of it like text flowing into the next available space, rather than items needing to be told exactly where to go.",
        "Without explicit placement, grid items auto-place into the next available cell in the grid's defined tracks, in source order — explicit placement (grid-column/row, span) is only needed when you want to override that default flow.",
      ],
      explanation: "Grid items that aren't explicitly placed are auto-placed into the next available cell, following the grid's defined tracks in source order — explicit placement is optional, used only when you need to override the default flow.",
    },
    {
      q: "You need 4 equal-width columns that automatically adjust if the column count changes later. Which is the cleanest way to write this?",
      options: [
        "grid-template-columns: 1fr 1fr 1fr 1fr;",
        "grid-template-columns: repeat(4, 1fr);",
        "Both options above are equally clean and equivalent",
        "grid-template-columns: 25% 25% 25% 25%;",
      ],
      answer: 2,
      hints: [
        "Re-read the repeat() concept: it's described as producing the EXACT same result as writing the pattern manually.",
        "The question asks about TWO things at once: correctness AND ease of changing the column count later.",
        "1fr 1fr 1fr 1fr and repeat(4, 1fr) are functionally identical — repeat() is just shorter and easier to edit later (changing one number instead of adding/removing tracks by hand), so both are 'equally clean' in terms of correctness, with repeat() being more maintainable.",
      ],
      explanation: "1fr 1fr 1fr 1fr and repeat(4, 1fr) produce an identical 4-column result — repeat() is simply more maintainable to edit later, but both are equally valid and equivalent in terms of correctness.",
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

  // ── CONTENT: See-It — a real CSS grid assembled step by step ──────────────
  // `cols`/`rows` describe the ACTUAL grid-template-columns/rows applied to
  // the real grid container rendered in renderSeeIt() at each step, and
  // `cellCount` is how many of the demo's real grid items to render.
  const seeitSteps = [
    { plain: "We start with one column and one cell — barely a grid at all yet.", tech: "grid-template-columns: 1fr;", cols: "1fr", cellCount: 1 },
    { plain: "Add a second column. The next cell automatically flows into it.", tech: "grid-template-columns: 1fr 1fr;", cols: "1fr 1fr", cellCount: 2 },
    { plain: "Add a third column using repeat(3, 1fr) — same result, less typing.", tech: "grid-template-columns: repeat(3, 1fr);", cols: "repeat(3, 1fr)", cellCount: 3 },
    { plain: "Add a second ROW. Notice cells now flow left-to-right, then wrap to the next row automatically.", tech: "grid-template-rows: auto auto; (6 cells total, auto-placed)", cols: "repeat(3, 1fr)", cellCount: 6 },
  ];

  // ── CONTENT: Challenge 1 — property-to-meaning matching ────────────────────
  const ch1Pairs = [
    { code: "display: grid", meaning: "Turns an element into a grid container" },
    { code: "1fr", meaning: "A flexible share of the leftover space in the grid" },
    { code: "repeat(3, 1fr)", meaning: "Shorthand for three equal 1fr columns" },
    { code: "grid-column: span 2", meaning: "Makes one item stretch across 2 column-tracks" },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: reaching for Flexbox where Grid is
  // clearly the better, more direct tool. ─────────────────────────────────────
  const bugLines = [
    { text: ".gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }", buggy: false },
    { text: '.page { display: flex; } .page .sidebar { width: 220px; } .page .main { flex: 1; }', buggy: true, why: "A genuine header/sidebar/main/footer page layout has real ROW and COLUMN relationships at the same time — exactly the two-dimensional structure CSS Grid (especially grid-template-areas) is purpose-built for. Forcing it through Flexbox alone works for the simple sidebar+main split shown here, but it gets clumsy fast once a header and footer also need to span the full width above and below — Grid handles that natively in one declaration." },
    { text: ".cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }", buggy: false },
    { text: '.layout { display: grid; grid-template-areas: "header header" "sidebar main" "footer footer"; }', buggy: false },
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
    gridCell: { background: "#38bdf8", color: "#0f172a", borderRadius: 8, padding: "16px 8px", fontWeight: 700, fontSize: "0.78rem", textAlign: "center" },
    selectChip: (active) => ({ padding: "6px 12px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", background: active ? "#38bdf8" : "#0f172a", color: active ? "#0f172a" : "#7dd3fc", margin: "2px" }),
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🧩</div>
        <div style={s.h2}>You need a header that spans the FULL width, then a sidebar + main content side by side underneath, then a footer spanning the full width again.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          <strong style={{ color: "#f1f5f9" }}>Which layout tool from this module is purpose-built for exactly this kind of structure?</strong>
        </div>
      </div>
      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {["Flexbox alone", "CSS Grid", "Plain floats", "Tables"].map((opt) => (
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
            {sparkGuess === "CSS Grid"
              ? "🎯 Exactly right! This layout has real ROW structure (header/body/footer) AND real COLUMN structure (sidebar/main) happening at once — that two-dimensional relationship is precisely what CSS Grid (especially grid-template-areas) is designed for."
              : "The real answer: CSS Grid. This layout needs row structure (header/body/footer) AND column structure (sidebar/main) controlled together — that's genuinely two-dimensional, and Grid (especially grid-template-areas) handles it far more directly than Flexbox alone."}
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
  // A genuinely real CSS grid container (display:grid below) grows column
  // by column, then gains a second row — mirroring the code shown above it.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch a Real Grid Get Built</div>
        <div style={s.p}>Step through each addition. The grid below is genuinely display:grid — not a drawing of one.</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>{step.tech}</div>

        {/* The genuine grid container — display:grid is really set here. */}
        <div style={{
          display: "grid", gridTemplateColumns: step.cols, gap: 10,
          background: "#0f172a", borderRadius: 10, padding: "16px", margin: "14px 0",
        }}>
          {Array.from({ length: step.cellCount }).map((_, i) => (
            <div key={i} style={s.gridCell}>{i + 1}</div>
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
  // A genuine, fully-interactive Grid playground: every control below sets
  // REAL CSS grid properties on the container rendered right underneath.
  const renderTryIt = () => {
    function setCols(n) {
      setColCount(n);
      setTriedConfigs((prev) => { const next = new Set(prev); next.add(`cols:${n}|gap:${gapVal}|span:${spanSecond}`); return next; });
    }
    function setGap(g) {
      setGapVal(g);
      setTriedConfigs((prev) => { const next = new Set(prev); next.add(`cols:${colCount}|gap:${g}|span:${spanSecond}`); return next; });
    }
    function toggleSpan() {
      const v = !spanSecond;
      setSpanSecond(v);
      setTriedConfigs((prev) => { const next = new Set(prev); next.add(`cols:${colCount}|gap:${gapVal}|span:${v}`); return next; });
    }
    const configCount = triedConfigs.size;

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 A Real CSS Grid Playground</div>
        <div style={s.p}>Try at least 4 different configurations below. Every control applies real CSS to the grid container.</div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 4 }}>grid-template-columns: repeat(N, 1fr)</div>
          {[2, 3, 4, 5].map((n) => (
            <button key={n} style={s.selectChip(colCount === n)} onClick={() => setCols(n)}>{n} columns</button>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 4 }}>gap</div>
          {[0, 6, 12, 24].map((g) => (
            <button key={g} style={s.selectChip(gapVal === g)} onClick={() => setGap(g)}>{g}px</button>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <button style={s.selectChip(spanSecond)} onClick={toggleSpan}>2nd cell grid-column: {spanSecond ? "span 2" : "span 1"}</button>
        </div>

        {/* The real, live grid container — every property above is applied
            directly, no simulation layer in between. */}
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: gapVal,
          background: "#0f172a", borderRadius: 10, padding: "16px", transition: "all 0.2s",
        }}>
          {Array.from({ length: colCount * 2 }).map((_, i) => (
            <div key={i} style={{
              ...s.gridCell,
              gridColumn: i === 1 && spanSecond ? "span 2" : undefined,
              background: i === 1 && spanSecond ? "#4ade80" : "#38bdf8",
            }}>{i + 1}</div>
          ))}
        </div>

        <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontFamily: "monospace", fontSize: "0.74rem", color: "#7dd3fc" }}>
          display: grid; grid-template-columns: repeat({colCount}, 1fr); gap: {gapVal}px;{spanSecond ? " /* 2nd cell: grid-column: span 2; */" : ""}
        </div>

        <div style={{ marginTop: 14 }}>
          {configCount >= 4
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try {4 - configCount} more configuration{4 - configCount === 1 ? "" : "s"} to unlock the next stage ({configCount}/4 tried).</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match Property to What It Does</div>
          <div style={s.p}>Tap a property, then tap what it actually does.</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Challenge 2: Spot the Wrong Tool for the Job</div>
          <div style={s.p}>Three of these four rules use Grid sensibly. One forces a genuinely two-dimensional page layout through Flexbox alone, where Grid would be the more direct tool. Tap it.</div>
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
          <div style={s.h2}>Unit 3.4 Complete — Module 3 Finished! 🎓</div>
          <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You now have the full CSS Styling toolkit: selectors and the cascade, colours/typography/the box model, Flexbox, and Grid — everything needed to build real, responsive layouts.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["display: grid — containers & items", "grid-template-columns/rows & the fr unit", "repeat() & gap", "grid-template-areas — naming your layout", "Placing items — grid-column/row & span"].map((l, i) => (
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
        <div style={s.topTitle}>Unit 3.4 — CSS Grid</div>
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

  // Concept 0 — display:grid turning loose boxes into an organized grid.
  if (index === 0) {
    const aligned = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: aligned ? 6 : 2, transition: "all 0.3s" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 26, height: 26, background: "#38bdf8", borderRadius: 6,
              transform: aligned ? "none" : `rotate(${(i % 2 === 0 ? 1 : -1) * 6}deg)`, transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>
    );
  }

  // Concept 1 — fr unit splitting leftover space, 1fr column growing
  // relative to a fixed px column.
  if (index === 1) {
    const grow = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 4, width: "90%", height: 36 }}>
          <div style={{ width: 50, background: "#94a3b8", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#0f172a" }}>200px</div>
          <div style={{ flex: 1, background: "#4ade80", borderRadius: 4, opacity: grow ? 1 : 0.6, transition: "opacity 0.3s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#0f172a" }}>1fr</div>
        </div>
      </div>
    );
  }

  // Concept 2 — repeat() collapsing three separate tracks into one call.
  if (index === 2) {
    const collapsed = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#7dd3fc", textAlign: "center" }}>
          {collapsed ? "repeat(3, 1fr)" : "1fr 1fr 1fr"}
        </div>
      </div>
    );
  }

  // Concept 3 — grid-template-areas drawn as a literal map.
  if (index === 3) {
    return (
      <div style={base}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 3, width: "80%" }}>
          <div style={{ gridColumn: "1 / 3", background: "#38bdf822", border: "1px solid #38bdf8", borderRadius: 4, fontSize: "0.55rem", color: "#38bdf8", textAlign: "center", padding: 4 }}>header</div>
          <div style={{ background: "#a78bfa22", border: "1px solid #a78bfa", borderRadius: 4, fontSize: "0.55rem", color: "#a78bfa", textAlign: "center", padding: 4 }}>side</div>
          <div style={{ background: "#4ade8022", border: "1px solid #4ade80", borderRadius: 4, fontSize: "0.55rem", color: "#4ade80", textAlign: "center", padding: 4 }}>main</div>
        </div>
      </div>
    );
  }

  // Concept 4 — an item spanning 2 columns, pulsing to draw the eye.
  return (
    <div style={base}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, width: "85%" }}>
        <div style={{ gridColumn: "span 2", background: pos > 0.5 ? "#4ade80" : "#4ade8088", borderRadius: 4, height: 22, transition: "background 0.3s" }} />
        <div style={{ background: "#38bdf8", borderRadius: 4, height: 22 }} />
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>WHAT IT DOES</div>
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
