// ============================================================================
//  UNIT 3.1 — "Selectors & the Cascade"
//  Module: M3 — CSS Styling (first unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - This component is loaded by src/shell/App.jsx exactly the same way every
//    other lesson is: App.jsx reads "Unit3_1" out of config/course.config.js,
//    renders <Unit3_1 student={...} onUnitComplete={...} />, and then just
//    waits. It does not know or care HOW this lesson teaches CSS selectors —
//    it only cares about one event: onUnitComplete() being called exactly
//    once, at the very end of the quiz, never automatically.
//  - We deliberately never import api.js or config/gas.config.js in this
//    file. Only App.jsx is allowed to talk to the backend (saving progress,
//    unlocking the next unit). Keeping that boundary means every lesson file
//    can be tested/edited in complete isolation — see ADDING_NEW_LESSON.md.
//
//  TEACHING DESIGN — same six-stage shell used in every unit so far
//  (Unit1_*, Unit2_*), so students always know "where" they are in a lesson:
//    Stage 0  SPARK      — a curiosity question BEFORE any teaching, so the
//                           student predicts first (predict-then-learn).
//    Stage 1  BUILD      — five core concepts (selector types → combinators
//                           → specificity → cascade order → why it matters),
//                           each timer-gated so students can't speed-skip,
//                           each with a Plain-English ⇄ Technical toggle.
//    Stage 2  SEE IT     — a live "which rule wins" walkthrough: the SAME
//                           three CSS rules, watched fighting over one
//                           paragraph, with the winning rule highlighted at
//                           every step — making the abstract idea of
//                           "specificity" into something visibly demonstrated.
//    Stage 3  TRY IT     — the student picks selectors themselves and watches
//                           which boxes in a tiny mock page light up — turns
//                           "which elements does .class p select?" from a
//                           guessing game into an experiment with instant
//                           visual feedback.
//    Stage 4  CHALLENGE  — tag-matching (selector → what it targets), then a
//                           "spot the bug" hunt where the bug is a selector
//                           that's needlessly over-specific or mis-targeted.
//    Stage 5  QUIZ       — 10 questions. Wrong answers NEVER reveal the
//                           correct option outright — an escalating hint is
//                           shown instead, and crucially the hint NEVER
//                           disappears even after many wrong attempts (it
//                           just stays pinned at the final, most-specific
//                           hint) so a struggling student is never left with
//                           zero guidance.
//
//  MOBILE-FRIENDLINESS: no fixed pixel widths anywhere. Layout uses %,
//  flexWrap, minmax()/clamp() so every stage is fully usable on a phone —
//  matching the approach used across the rest of this course.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit3_1({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ────────────────────────────────────────────────────
  // `stage` is the single source of truth for which of the six screens is
  // currently on screen. Every "Next →" button in this file just calls
  // setStage(n+1); nothing else decides what renders.
  const [stage, setStage] = useState(0); // 0 Spark · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

  // ── SPARK stage state ──────────────────────────────────────────────────────
  // sparkGuess holds which of the multiple-choice predictions the student
  // tapped; sparkSubmitted flips once they lock it in, which swaps the UI
  // from "pick one" to "here's the real answer + Start Learning button".
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD stage state ──────────────────────────────────────────────────────
  // buildConcept = index into the `concepts` array below (which of the 5
  // core ideas is on screen right now). conceptUnlocked is a parallel array
  // of booleans — concept 0 starts unlocked, every later one unlocks only
  // once its own countdown timer (conceptTimer) finishes, which forces a
  // minimum reading time instead of letting students rapid-click through.
  // buildMode toggles the Plain-English vs Technical phrasing of whichever
  // concept is currently showing.
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT stage state ──────────────────────────────────────────────────────
  // seeitStep walks through the "three rules fight over one paragraph"
  // specificity demo one step at a time; seeitMode toggles the narration
  // text the same way buildMode does in the Build stage.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT stage state ──────────────────────────────────────────────────────
  // selectorPicked tracks which of the experiment's preset selectors the
  // student has currently chosen to "run" against the mock page below —
  // changing it instantly recomputes (in renderTryIt) which mock elements
  // should highlight, giving immediate visual feedback per click.
  const [selectorPicked, setSelectorPicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0); // how many distinct selectors they've tried — gates the "Take the Challenge" button until they've explored a few.

  // ── CHALLENGE stage state ──────────────────────────────────────────────────
  // challengePhase: 0 = the tag-matching minigame, 1 = the bug-hunt minigame.
  // ch1Done / ch2Done flip true once each minigame reports completion, which
  // is what reveals each phase's "Next →" button.
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ stage state ────────────────────────────────────────────────────────
  // quizQ = index of the current question. quizSelected = which option the
  // student tapped (not yet checked). quizFeedback = null | "correct" |
  // "wrong" after they hit "Check Answer". quizAttempts counts wrong tries
  // on THIS question only (resets every time we move to a new question) —
  // it drives which escalating hint text shows. quizDone flips true after
  // the final question, swapping the whole stage to the completion screen.
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // ── shared timer ref + looping animation frame ─────────────────────────────
  // timerRef holds the interval ID for the Build-stage countdown so its
  // cleanup function (in the effect below) can always clear the right timer,
  // even across re-renders. animFrame just ticks upward forever while the
  // student is on Build/SeeIt, driving the small CSS animations.
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: the five Build-stage concepts ─────────────────────────────────
  // Each object feeds renderBuild() directly: `title` is the pill label and
  // heading, `plain`/`technical` are the two phrasings shown via the toggle,
  // `unlock` is how many seconds the NEXT concept stays locked for (forces a
  // minimum dwell time on each idea before the student can race ahead).
  const concepts = [
    {
      title: "Selectors — How CSS Finds Elements",
      plain: "A CSS rule starts with a SELECTOR — basically \"who am I talking to?\". Want to style every paragraph? Use p. Just one special box? Give it an id and use #thatId. A whole group of boxes that share a look? Give them all the same class and use .thatClass.",
      technical: "A selector is a pattern that matches one or more elements in the document. The three most common types are the type/element selector (p), the class selector (.card), and the ID selector (#header) — each progressively narrower and, as we'll see, progressively more powerful in the cascade.",
      unlock: 8,
    },
    {
      title: "Combinators — Targeting Relationships, Not Just Tags",
      plain: "Selectors can combine. \"nav a\" means \"any <a> that lives ANYWHERE inside a <nav>\" (descendant). \"nav > a\" means \"only an <a> that is a DIRECT child of <nav>\" — a grandchild link wouldn't count. Comma-separating selectors like \"h1, h2\" just means \"apply this rule to BOTH\".",
      technical: "Combinators define relationships between selectors: the descendant combinator (a space, e.g. nav a) matches any depth of nesting; the child combinator (>, e.g. nav > a) matches only direct children; the comma is technically a selector LIST, not a combinator — it groups otherwise-unrelated selectors under one shared rule, avoiding repeated declarations.",
      unlock: 9,
    },
    {
      title: "Specificity — Who Wins When Two Rules Collide",
      plain: "If two CSS rules both try to set the same property on the same element, the browser needs a tie-breaker. That tie-breaker is called SPECIFICITY, and it works like a points system: an ID is worth more points than a class, and a class is worth more points than a plain tag. Whoever scores higher wins — no matter which rule was written first.",
      technical: "Specificity is calculated as a 3-part tuple (IDs, classes/attributes/pseudo-classes, type-selectors/pseudo-elements), often written as (a,b,c). #header (1,0,0) always beats .nav-link (0,1,0), which always beats a (0,0,1) — compared left-to-right, like comparing version numbers digit by digit, not added as a single sum.",
      unlock: 10,
    },
    {
      title: "The Cascade — Order, Inheritance & !important",
      plain: "If specificity ties exactly, the rule written LATER in the CSS file wins — that's the \"cascade\" part. Some properties (like color and font-family) also \"trickle down\" automatically from a parent to its children even with no rule at all — that's INHERITANCE. And !important is an emergency override switch that jumps to the very top of the priority list — powerful, but overusing it makes a stylesheet impossible to reason about.",
      technical: "When specificity ties, source order is the tie-breaker — later rules override earlier ones. Some CSS properties are inherited by default (color, font-family, line-height); others are not (margin, border, width). !important attached to a declaration overrides normal specificity/order rules entirely, and should be used sparingly — it's the reason large stylesheets become unmaintainable when overused.",
      unlock: 10,
    },
    {
      title: "Why It Matters — Predictable, Maintainable Styling",
      plain: "Understanding the cascade is what separates \"I randomly add !important until it looks right\" from \"I know exactly why this rule won, and I can fix it cleanly\". It's the single biggest source of CSS confusion for beginners — and the easiest to fix once you actually understand the points system above.",
      technical: "Mastery of selector specificity and cascade order lets developers write minimal, targeted CSS instead of relying on !important escalation wars — a major contributor to unmaintainable stylesheets at scale. It's foundational for every CSS topic that follows in this module (colours/fonts/spacing, Flexbox, Grid all assume you can reason about which rule applies).",
      unlock: 9,
    },
  ];

  // ── CONTENT: Quiz bank — 10 questions, escalating hints, never reveals
  // the answer outright (Rule 6 of the lesson template). ───────────────────
  const quizQuestions = [
    {
      q: "Which selector targets every single <p> element on the page, no matter what class or ID it has?",
      options: ["#paragraph", ".p", "p", "*p"],
      answer: 2,
      hints: [
        "Look for the plain, bare tag name with nothing in front of it.",
        "# means ID and . means class — neither of those is what's being asked for here.",
        "A bare type/element selector like p (no symbol at all) matches every <p> on the page.",
      ],
      explanation: "p with no prefix is a type/element selector — it matches every <p> element on the page regardless of class or ID.",
    },
    {
      q: "What does the selector \"nav a\" (a space between nav and a) actually match?",
      options: [
        "Only an <a> that is a direct child of <nav>",
        "Any <a> nested anywhere inside a <nav>, at any depth",
        "A <nav> element that is itself inside an <a>",
        "Nothing — a space is not valid CSS syntax",
      ],
      answer: 1,
      hints: [
        "This is the DESCENDANT combinator, not the child combinator (> is the child one).",
        "Descendant means 'anywhere inside', at any nesting depth — not just one level down.",
        "nav a matches any <a>, no matter how deeply nested, as long as it's somewhere inside a <nav>.",
      ],
      explanation: "A space between two selectors is the descendant combinator — it matches an element nested anywhere inside the other, at any depth, not just direct children.",
    },
    {
      q: "What's the key difference between \"nav a\" and \"nav > a\"?",
      options: [
        "There is no difference, they're identical",
        "nav > a only matches an <a> that is a DIRECT child of <nav>; nav a matches any depth",
        "nav > a is faster to type but does the same thing",
        "nav > a only works in old browsers",
      ],
      answer: 1,
      hints: [
        "The > symbol is the CHILD combinator — it's stricter than a plain space.",
        "Think of it as 'one level down only' versus 'any number of levels down'.",
        "nav > a requires the <a> to be an IMMEDIATE child of <nav> — a link nested two levels deep wouldn't match, but it would match plain nav a.",
      ],
      explanation: "The child combinator (>) only matches direct children, one level down. The descendant combinator (a plain space) matches at any nesting depth.",
    },
    {
      q: "Between #header, .nav-link, and a plain div selector, which has the HIGHEST specificity?",
      options: ["div", ".nav-link", "#header", "They're all equal"],
      answer: 2,
      hints: [
        "Think of specificity as a points system where one category of selector scores far more than the others.",
        "ID selectors outrank class selectors, which outrank plain type/tag selectors.",
        "#header is an ID selector — IDs sit at the top of the specificity hierarchy, above classes and tags.",
      ],
      explanation: "ID selectors (#header) have higher specificity than class selectors (.nav-link), which in turn outrank plain type selectors (div).",
    },
    {
      q: "Two CSS rules target the same element with the EXACT same specificity. Which one actually applies?",
      options: [
        "The one written first in the file",
        "The one written LAST in the file (closer to the bottom)",
        "Neither applies — the browser ignores both",
        "The browser picks one at random",
      ],
      answer: 1,
      hints: [
        "This is exactly what the word 'cascade' refers to — rules flow downward.",
        "When specificity is genuinely tied, something else has to break the tie.",
        "When specificity ties exactly, source order decides — the rule that appears LATER in the stylesheet wins.",
      ],
      explanation: "When two rules have identical specificity, the cascade's tie-breaker is source order — whichever rule comes later in the CSS wins.",
    },
    {
      q: "Which CSS property is INHERITED by default from a parent element to its children?",
      options: ["margin", "border", "color", "width"],
      answer: 2,
      hints: [
        "Inherited properties are mostly ones related to text appearance, not box layout.",
        "Think about what happens if you set a text colour on <body> — does every nested element pick it up automatically?",
        "color is inherited by default (along with font-family, line-height) — margin, border, and width are NOT inherited.",
      ],
      explanation: "color (along with font-family and line-height) is inherited by default — a child element picks it up from its parent unless overridden. Box-model properties like margin, border, and width are never inherited automatically.",
    },
    {
      q: "What does adding !important to a CSS declaration actually do?",
      options: [
        "Makes that property load faster than other properties",
        "Forces that declaration to override normal specificity and cascade order almost entirely",
        "Tells the browser to double-check the value for typos",
        "Nothing — it is just a comment marker, ignored by browsers",
      ],
      answer: 1,
      hints: [
        "It is described in the lesson as an 'emergency override switch'.",
        "It jumps straight to the top of the priority list, bypassing the normal specificity comparison.",
        "!important overrides normal cascade/specificity rules almost entirely — which is exactly why overusing it makes stylesheets hard to reason about.",
      ],
      explanation: "!important forces a declaration to win regardless of normal specificity/source-order rules. It's powerful but should be used sparingly, since overuse leads to unmaintainable, hard-to-override stylesheets.",
    },
    {
      q: "A rule for .card (specificity 0,1,0) and a rule for #sidebar .card (specificity 1,1,0) both set background-color on the same element. Which wins?",
      options: [
        "#sidebar .card — its specificity score is higher because it includes an ID",
        ".card — because it's shorter and simpler",
        "Whichever one is alphabetically first",
        "Both apply at once, blended together",
      ],
      answer: 0,
      hints: [
        "Compare the specificity tuples digit by digit, starting from the ID count.",
        "One of these two selectors includes an ID in its chain (#sidebar) — that's a major specificity boost.",
        "#sidebar .card scores (1,1,0) versus .card's (0,1,0) — the ID component makes it win outright, regardless of length or order.",
      ],
      explanation: "Specificity compares ID-count first, then class-count, then type-count. #sidebar .card has 1 ID + 1 class versus .card's 0 IDs + 1 class — the ID makes it win, full stop.",
    },
    {
      q: "Why is relying heavily on !important across a large stylesheet usually considered bad practice?",
      options: [
        "It makes the CSS file larger in file size only",
        "It breaks the normal cascade so badly that future overrides require even more !important, making styles unpredictable",
        "Browsers will refuse to render pages that contain it",
        "It is deprecated and no longer works in modern browsers",
      ],
      answer: 1,
      hints: [
        "Think about what happens when you need to override an !important rule later — what's the only tool that can beat it?",
        "It tends to create an 'arms race' where every override needs to be even more forceful than the last.",
        "Since !important nearly always wins, overriding it later usually requires ANOTHER !important — this escalates until the cascade becomes unpredictable and hard to maintain.",
      ],
      explanation: "Overusing !important creates an escalating override war, since beating an existing !important rule typically requires another one — this defeats the entire purpose of a predictable, readable cascade.",
    },
    {
      q: "You want every <li> inside any <ul class=\"menu\"> styled, but NOT <li>s in other lists on the page. Which selector should you write?",
      options: ["li", ".menu li", "ul li", "#menu"],
      answer: 1,
      hints: [
        "You need the styling to be scoped specifically to lists that carry the 'menu' class.",
        "A bare li or ul li would match EVERY list's items, not just the menu — too broad.",
        ".menu li uses the descendant combinator from the .menu class, so it only matches <li> elements nested inside an element carrying that class.",
      ],
      explanation: ".menu li scopes the rule correctly: it matches any <li> nested inside an element with class=\"menu\", while a bare li or ul li would incorrectly match every list on the page.",
    },
  ];

  // ── Concept unlock timer (Build stage) ─────────────────────────────────────
  // While stage === 1 (Build), this effect resets conceptTimer to the current
  // concept's required dwell time, then ticks it down once per second. When
  // it hits zero it unlocks the NEXT concept's pill in the timeline above.
  // The cleanup function clears the interval whenever buildConcept or stage
  // changes (e.g. student navigates away), so no stray timers ever leak.
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

  // ── Looping animation frame (drives the small CSS animations in Build &
  // See-It) — just an ever-incrementing counter mod 60, recycled by every
  // animation component below via simple math on `frame`.
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — three rules fighting over one paragraph ──────────────
  // Each step shows the CSS rules written "so far" plus which one is
  // CURRENTLY winning (because each new rule added has higher specificity
  // or comes later) — this is the visible specificity/cascade demonstration.
  const seeitSteps = [
    {
      plain: "We start with one plain rule: every paragraph is grey.",
      tech: "Rule 1: p { color: grey; } — specificity (0,0,1).",
      code: "p { color: grey; }",
      winner: "Rule 1 (p)",
      winnerColor: "#94a3b8",
    },
    {
      plain: "Now we add a class rule. Because a class outranks a plain tag, blue wins.",
      tech: "Rule 2: .highlight { color: blue; } — specificity (0,1,0), beats (0,0,1).",
      code: "p { color: grey; }\n.highlight { color: blue; }",
      winner: "Rule 2 (.highlight)",
      winnerColor: "#38bdf8",
    },
    {
      plain: "Now we add an ID rule. An ID outranks a class, so green takes over.",
      tech: "Rule 3: #intro { color: green; } — specificity (1,0,0), beats (0,1,0).",
      code: "p { color: grey; }\n.highlight { color: blue; }\n#intro { color: green; }",
      winner: "Rule 3 (#intro)",
      winnerColor: "#4ade80",
    },
    {
      plain: "Finally, someone adds !important to the FIRST rule. Even though it's the weakest selector, !important jumps to the top and wins anyway.",
      tech: "Rule 1 amended: p { color: grey !important; } — !important overrides specificity entirely.",
      code: "p { color: grey !important; }\n.highlight { color: blue; }\n#intro { color: green; }",
      winner: "Rule 1 (p !important)",
      winnerColor: "#fb923c",
    },
  ];

  // ── CONTENT: Try-It — preset selectors run against a tiny mock page ───────
  // Each preset's `matches` array lists which mock element IDs (defined in
  // renderTryIt's JSX below) light up when that selector is "run". This is a
  // simplified, hand-authored simulation of real selector matching — exact
  // enough to teach the concept without needing a real CSS parser.
  const selectorPresets = [
    { sel: "p", label: "p", matches: ["p1", "p2", "p3"], note: "Matches every <p>, regardless of class/ID." },
    { sel: ".note", label: ".note", matches: ["p2", "li2"], note: "Matches every element carrying class=\"note\", across tag types." },
    { sel: "#callout", label: "#callout", matches: ["p3"], note: "Matches the one element with id=\"callout\" — at most one match, ever." },
    { sel: "ul li", label: "ul li", matches: ["li1", "li2"], note: "Descendant combinator — matches any <li> nested anywhere inside a <ul>." },
    { sel: "ul > li", label: "ul > li", matches: ["li1", "li2"], note: "Child combinator — here it matches the same as above because both <li>s are DIRECT children of the <ul>." },
    { sel: ".note, #callout", label: ".note, #callout", matches: ["p2", "li2", "p3"], note: "Selector list (comma) — applies the rule to BOTH groups, as if two separate rules were written." },
  ];

  // ── CONTENT: Challenge 1 — tag-to-meaning matching ─────────────────────────
  const ch1Pairs = [
    { code: ".card", meaning: "Class selector — matches every element sharing that class" },
    { code: "#footer", meaning: "ID selector — matches at most one element on the page" },
    { code: "nav a", meaning: "Descendant combinator — matches at any nesting depth inside <nav>" },
    { code: "h1, h2", meaning: "Selector list — applies one rule to two unrelated selectors" },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: an unnecessarily over-specific
  // selector that will be painful to override later. ────────────────────────
  const bugLines = [
    { text: ".sidebar { width: 240px; }", buggy: false },
    { text: 'div#sidebar.sidebar.dark.fixed nav ul li a { color: white; }', buggy: true, why: "This selector is wildly over-specific — chaining a tag, ID, three classes, and two more combinators just to style a link colour. It will be almost impossible to override later without an even messier selector (or !important). A single, well-scoped class like .sidebar a would do the same job and stay maintainable." },
    { text: ".btn-primary { background: #38bdf8; }", buggy: false },
    { text: "p { line-height: 1.6; }", buggy: false },
  ];

  // ── STYLES — kept visually identical to every other unit in this course
  // (same palette, same spacing scale, same button shapes) so the whole app
  // feels like one consistent product, not four separately designed pages. ──
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
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  // Curiosity hook before any teaching: a relatable "which rule wins?"
  // scenario the student predicts on, before we explain specificity at all.
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>⚔️</div>
        <div style={s.h2}>Two CSS rules both want to colour the SAME heading.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          Rule A: <code style={{ color: "#7dd3fc" }}>h1 {"{"} color: red; {"}"}</code><br />
          Rule B: <code style={{ color: "#7dd3fc" }}>#title {"{"} color: blue; {"}"}</code>
        </div>
        <div style={{ ...s.p, textAlign: "center" }}>
          <strong style={{ color: "#f1f5f9" }}>The heading has id="title". Which colour actually shows up?</strong>
        </div>
      </div>
      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Red — Rule A was probably written first",
              "Blue — an ID selector outranks a plain tag selector",
              "Both — the browser blends them into purple",
              "Neither — conflicting rules cancel out to black",
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
            {sparkGuess.startsWith("Blue")
              ? "🎯 Exactly right! #title is an ID selector, and ID selectors always outrank plain tag selectors like h1 — no matter which rule was written first. The heading turns blue."
              : "The real answer: #title is an ID selector, which always outranks a plain tag selector like h1 in the specificity points system — regardless of write order. The heading turns blue, not red."}
          </div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD ─────────────────────────────────────────────────────────────────
  // Five concepts, each gated by a countdown timer, each switchable between
  // Plain-English and Technical phrasing, each with a small live animation.
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
  // Walks through the same paragraph getting fought over by three rules of
  // increasing specificity, plus a final !important twist — the winning
  // rule is visually called out at every step.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch the Cascade Decide a Winner</div>
        <div style={s.p}>Same paragraph, same three competing rules — step through and watch which one wins at each point.</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>{step.code}</div>

        {/* Live "rendered paragraph" preview — its colour mirrors whichever
            rule is currently winning, making the abstract idea tangible. */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "16px", margin: "12px 0" }}>
          <p style={{ color: step.winnerColor, margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>
            This paragraph's colour shows whichever rule currently wins.
          </p>
        </div>

        <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Currently winning:</span>
          <span style={s.tag(step.winnerColor)}>{step.winner}</span>
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
  // The student picks one of several real selectors and watches, live,
  // which elements in a tiny mock page light up — direct cause-and-effect
  // experimentation instead of memorizing matching rules abstractly.
  const renderTryIt = () => {
    const mockElements = [
      { id: "p1", tag: "p", classes: [], html: "<p>Plain paragraph, no class or id.</p>" },
      { id: "p2", tag: "p", classes: ["note"], html: '<p class="note">A note paragraph.</p>' },
      { id: "p3", tag: "p", classes: [], idAttr: "callout", html: '<p id="callout">The one callout paragraph.</p>' },
      { id: "li1", tag: "li", classes: [], html: "<li>First list item (inside ul).</li>" },
      { id: "li2", tag: "li", classes: ["note"], html: '<li class="note">Second list item, also noted.</li>' },
    ];
    const active = selectorPresets.find((p) => p.sel === selectorPicked);

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run a Selector, Watch It Match</div>
        <div style={s.p}>Tap a selector below to "run" it against the mock page. Matching elements light up blue.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {selectorPresets.map((p) => (
            <button key={p.sel} onClick={() => { setSelectorPicked(p.sel); if (selectorPicked !== p.sel) setTriedCount((c) => c + 1); }} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              background: selectorPicked === p.sel ? "#38bdf8" : "#0f172a", color: selectorPicked === p.sel ? "#0f172a" : "#7dd3fc",
              border1: "1px solid #334155",
            }}>{p.label}</button>
          ))}
        </div>

        {/* The mock page: every element renders, but ones included in the
            active preset's `matches` list get the highlight treatment. */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "16px" }}>
          {mockElements.map((el) => {
            const isMatch = active && active.matches.includes(el.id);
            return (
              <div key={el.id} style={{
                background: isMatch ? "#bfdbfe" : "transparent", border: isMatch ? "2px solid #2563eb" : "2px solid transparent",
                borderRadius: 6, padding: "6px 8px", marginBottom: 4, fontFamily: "monospace", fontSize: "0.76rem", color: "#1e293b", transition: "all 0.25s",
              }}>{el.html}{isMatch ? " ✅" : ""}</div>
            );
          })}
        </div>

        {active && (
          <div style={{ background: "#0f2942", borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.82rem", marginBottom: 4 }}>{active.label} matched {active.matches.length} element{active.matches.length === 1 ? "" : "s"}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{active.note}</div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try at least 3 different selectors to unlock the next stage ({triedCount}/3 tried).</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match Selector to Meaning</div>
          <div style={s.p}>Tap a selector, then tap what it actually targets.</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Challenge 2: Spot the Over-Specific Selector</div>
          <div style={s.p}>Three of these four rules are reasonably scoped. One chains far more selectors together than it needs to, making it brittle and hard to override later. Tap it.</div>
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
          <div style={s.h2}>Unit 3.1 Complete!</div>
          <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now read any CSS rule and predict, with confidence, exactly which one will actually apply.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["Selector types — tag, class, ID", "Combinators — descendant, child, grouping", "Specificity — the points system that breaks ties", "The cascade — source order, inheritance, !important", "Why it matters for maintainable CSS"].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* This is the ONLY place in the whole file that calls
              onUnitComplete — fired from a real click, never automatically,
              satisfying Rule 1/Rule 3 of the lesson template. */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
    // The hint shown always uses the LAST hint once attempts exceed the
    // hint list's length — per house rule, a struggling student must always
    // see SOME hint on every wrong attempt, never silence after the array
    // runs out. Math.min caps the index instead of letting it overflow.
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
        {/* Wrong-answer hint box: ALWAYS shown on a wrong attempt, using the
            escalating hint at hintIndex — never disappears, even past the
            third wrong attempt, per the house "always give a hint" rule. */}
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
  // Renders the sticky top bar (title + stage-progress pills) plus exactly
  // one stage body, chosen by `stage`. App.jsx already overlays a floating
  // "← Dashboard" button on top of every lesson, so we don't add our own.
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 3.1 — Selectors & the Cascade</div>
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
// `index` picks which of the 5 concepts to illustrate; `frame` (0-59, looping)
// drives simple position/opacity oscillation so each animation feels alive
// without needing any external animation library.
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40; // 0→1 sawtooth, reused by every animation below
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  // Concept 0 — Selectors: a tag/class/ID each glow in turn to show the
  // three basic selector "categories" cycling.
  if (index === 0) {
    const which = Math.floor(pos * 3) % 3;
    const labels = [["p", "#38bdf8"], [".card", "#a78bfa"], ["#header", "#4ade80"]];
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 16 }}>
          {labels.map(([txt, color], i) => (
            <div key={txt} style={{
              padding: "8px 14px", borderRadius: 8, fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem",
              background: which === i ? color + "22" : "#1e293b", border: which === i ? `2px solid ${color}` : "1px dashed #334155",
              color: which === i ? color : "#475569", transition: "all 0.3s",
            }}>{txt}</div>
          ))}
        </div>
      </div>
    );
  }

  // Concept 1 — Combinators: an arrow "descends" through nested boxes to
  // illustrate nav → a being matched at depth.
  if (index === 1) {
    const depth = Math.floor(pos * 3);
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          {["<nav>", "  <ul>", "    <a> link </a>"].map((line, i) => (
            <div key={i} style={{ paddingLeft: i * 14, fontFamily: "monospace", fontSize: "0.7rem", color: depth >= i ? "#38bdf8" : "#475569", fontWeight: depth === i ? 700 : 400, transition: "color 0.3s" }}>{line}</div>
          ))}
        </div>
      </div>
    );
  }

  // Concept 2 — Specificity: a simple bar chart, tag < class < ID, with the
  // currently-"flashing" bar cycling to draw the eye to the comparison.
  if (index === 2) {
    const flash = Math.floor(pos * 3) % 3;
    const bars = [["tag", 30, "#94a3b8"], ["class", 60, "#38bdf8"], ["ID", 95, "#4ade80"]];
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: 80 }}>
          {bars.map(([label, h, color], i) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: h * (flash === i ? 1 : 0.85), background: color, borderRadius: 4, transition: "height 0.3s", opacity: flash === i ? 1 : 0.6 }} />
              <div style={{ fontSize: "0.62rem", color: "#94a3b8", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Concept 3 — Cascade/order: two identical-specificity boxes, with the
  // "later" one's checkmark blinking on to show it winning by source order.
  if (index === 3) {
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 12px", fontSize: "0.68rem", color: "#64748b" }}>Rule written first</div>
          <div style={{ background: pos > 0.5 ? "#14532d33" : "#1e293b", border: pos > 0.5 ? "1px solid #4ade80" : "1px solid #334155", borderRadius: 6, padding: "6px 12px", fontSize: "0.68rem", color: pos > 0.5 ? "#4ade80" : "#64748b", transition: "all 0.3s" }}>Rule written LAST {pos > 0.5 ? "✅ wins" : ""}</div>
        </div>
      </div>
    );
  }

  // Concept 4 — Why it matters: a messy stack of !important shrinking down
  // to one clean, well-scoped rule.
  return (
    <div style={base}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ textAlign: "center", opacity: pos < 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.4rem" }}>😵</div>
          <div style={{ fontSize: "0.58rem", color: "#94a3b8" }}>!important ×5</div>
        </div>
        <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>
        <div style={{ textAlign: "center", opacity: pos >= 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.4rem" }}>😌</div>
          <div style={{ fontSize: "0.58rem", color: "#94a3b8" }}>one clean .class</div>
        </div>
      </div>
    </div>
  );
}

// ── TAG MATCH (shared minigame pattern, reused across the course) ─────────
// Student taps a "code" item, then a "meaning" item; if they form a real
// pair, both lock in green. A shuffled copy of the meanings list (computed
// once via useRef so it doesn't re-shuffle on every re-render) keeps the
// matching non-trivial instead of being in the same order as the codes.
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>SELECTORS</div>
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>MEANING</div>
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
// Student taps lines until they tap the one flagged `buggy: true`; wrong
// taps flash red briefly, the correct tap reveals the "why" explanation and
// reports completion via onDone().
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
