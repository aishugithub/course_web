// ============================================================================
//  UNIT 3.1 — "What Is CSS, and Who Wins When Rules Collide?"
//  Module: M3 — CSS Styling (first unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - This component is loaded by src/shell/App.jsx exactly the same way every
//    other lesson is: App.jsx reads "Unit3_1" out of config/course.config.js,
//    renders <Unit3_1 student={...} onUnitComplete={...} />, and then just
//    waits. It does not know or care HOW this lesson teaches CSS —
//    it only cares about one event: onUnitComplete() being called exactly
//    once, at the very end of the quiz, never automatically.
//  - We deliberately never import api.js or config/gas.config.js in this
//    file. Only App.jsx is allowed to talk to the backend (saving progress,
//    unlocking the next unit). Keeping that boundary means every lesson file
//    can be tested/edited in complete isolation — see ADDING_NEW_LESSON.md.
//
//  WHY THIS UNIT WAS REWORKED (content-only change, same shell/state machine):
//  Module 2 only taught HTML. A student arriving here has NEVER been told
//  what CSS even is, or that there's more than one place to write it. The
//  original version of this unit jumped straight into selectors and the
//  cascade — which assumes the student already knows CSS exists, what a
//  rule looks like, and where rules are written. That's too big a leap.
//  So Stage 1 (BUILD) now opens with THREE new foundational concepts before
//  selectors are introduced at all, and every concept (old and new) now has
//  its own small visual animation in the Build stage instead of relying on
//  text alone. Nothing about the STAGE FLOW, the state variables, or the
//  onUnitComplete contract changed — only the *content* inside each stage.
//
//  TEACHING DESIGN — same six-stage shell used in every unit so far
//  (Unit1_*, Unit2_*), so students always know "where" they are in a lesson:
//    Stage 0  SPARK      — a curiosity question BEFORE any teaching: the
//                           SAME html, shown two ways, predict why they
//                           look different (predict-then-learn).
//    Stage 1  BUILD      — EIGHT concepts, freely navigable in any order
//                           (an earlier countdown-timer gate was removed —
//                           it slowed students down without helping them
//                           learn), each with a Plain-English ⇄ Technical
//                           toggle AND a small live animation:
//                             0. What is CSS, and why do we need it?
//                             1. Three ways to write CSS (inline/internal/external)
//                             2. Anatomy of one CSS rule
//                             3. Selector types (tag / class / ID)
//                             4. Combinators (descendant / child / grouping)
//                             5. Specificity (the points system)
//                             6. The cascade (order, inheritance, !important)
//                             7. Why all of this matters
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
//    Stage 5  QUIZ       — 13 questions (3 new ones on the CSS foundations,
//                           10 on selectors/cascade). Wrong answers NEVER
//                           reveal the correct option outright — an
//                           escalating hint is shown instead, and crucially
//                           the hint NEVER disappears even after many wrong
//                           attempts (it just stays pinned at the final,
//                           most-specific hint) so a struggling student is
//                           never left with zero guidance.
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
  // buildConcept = index into the `concepts` array below (which of the 8
  // core ideas is on screen right now — 3 brand-new foundations followed by
  // the original 5 selector/cascade concepts). There used to be a per-concept
  // countdown timer that locked the next concept's pill until N seconds had
  // passed — students found it slowed them down without actually helping
  // them learn anything, so navigation between concepts is now completely
  // free: every pill is clickable at any time, in any order. buildMode
  // toggles the Plain-English vs Technical phrasing of whichever concept is
  // currently showing.
  const [buildConcept, setBuildConcept] = useState(0);
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

  // ── looping animation frame ─────────────────────────────────────────────────
  // animFrame just ticks upward forever while the student is on Build/SeeIt,
  // driving the small CSS animations (see the effect below and
  // ConceptAnimation at the bottom of this file).
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: the eight Build-stage concepts ────────────────────────────────
  // Each object feeds renderBuild() directly: `title` is the pill label and
  // heading, `plain`/`technical` are the two phrasings shown via the toggle.
  // There is no `unlock`/timer field any more — navigation between concepts
  // is completely free (see the BUILD stage state comment above for why).
  // Concepts 0-2 are brand-new scaffolding for students who have only seen
  // HTML so far; concepts 3-7 are the original selector/cascade content.
  const concepts = [
    {
      title: "What Is CSS, and Why Do We Need It?",
      plain: "Look at every page you've built so far in HTML: black text, white background, no colours, links underlined blue, nothing centred. That's not a bug — HTML was never designed to control how things LOOK. HTML only describes WHAT is on the page (\"this is a heading\", \"this is a button\"). CSS — Cascading Style Sheets — is the missing half: a separate language whose entire job is appearance — colour, spacing, fonts, layout, even animation. The exact same HTML can look like a plain text document or a polished app, purely depending on what CSS is attached to it.",
      technical: "CSS enforces a principle called separation of concerns: HTML defines document structure and meaning (semantics), CSS defines presentation, and — later in this course — JavaScript defines behaviour. Keeping these separate means one HTML document can be completely restyled (a new theme, a new layout, even a different device size) without touching a single tag.",
    },
    {
      title: "Three Ways to Write CSS",
      plain: "There are exactly three places CSS can live. INLINE: written directly inside one element's style=\"...\" attribute — affects only that one element. INTERNAL (a.k.a. embedded): written inside a <style> tag in the <head> of the HTML file — affects every matching element on that one page. EXTERNAL: written in a completely separate .css file, connected to the HTML with a <link> tag — reusable across every page of an entire website. Real sites almost always use external CSS: one file can style hundreds of pages, and changing one line updates all of them at once.",
      technical: "Inline styles (style=\"color:red\") apply to a single element and carry very high specificity (second only to !important). Internal styles live inside <style> in <head> and apply page-wide, recompiled on every page load. External styles are loaded via <link rel=\"stylesheet\" href=\"styles.css\">, are cached by the browser across page visits, and are the only one of the three that scales to a multi-page site without duplicating code.",
    },
    {
      title: "Anatomy of One CSS Rule",
      plain: "Every CSS rule has the exact same shape, no matter how complicated it looks: a SELECTOR (who gets styled), then curly braces { }, and inside them one or more DECLARATIONS — each a PROPERTY: VALUE pair ending in a semicolon. For example: p { color: blue; } reads as \"select every <p>, and set its color property to the value blue.\" Learn to see this shape and every CSS rule you'll ever encounter — simple or huge — instantly becomes readable.",
      technical: "Formally: selector { property: value; property: value; } — the selector is matched against the DOM tree, and every matched element receives every declaration inside the braces. A declaration is always property : value ;  — omitting the trailing semicolon on the LAST declaration is legal but becomes a bug magnet the moment a new declaration is added after it.",
    },
    {
      title: "Selectors — How CSS Finds Elements",
      plain: "Now that you know WHERE css rules are written and what SHAPE they have, let's look at the SELECTOR part more closely — \"who am I talking to?\". Want to style every paragraph? Use p. Just one special box? Give it an id and use #thatId. A whole group of boxes that share a look? Give them all the same class and use .thatClass.",
      technical: "A selector is a pattern that matches one or more elements in the document. The three most common types are the type/element selector (p), the class selector (.card), and the ID selector (#header) — each progressively narrower and, as we'll see, progressively more powerful in the cascade.",
    },
    {
      title: "Combinators — Targeting Relationships, Not Just Tags",
      plain: "Selectors can combine. \"nav a\" means \"any <a> that lives ANYWHERE inside a <nav>\" (descendant). \"nav > a\" means \"only an <a> that is a DIRECT child of <nav>\" — a grandchild link wouldn't count. Comma-separating selectors like \"h1, h2\" just means \"apply this rule to BOTH\".",
      technical: "Combinators define relationships between selectors: the descendant combinator (a space, e.g. nav a) matches any depth of nesting; the child combinator (>, e.g. nav > a) matches only direct children; the comma is technically a selector LIST, not a combinator — it groups otherwise-unrelated selectors under one shared rule, avoiding repeated declarations.",
    },
    {
      title: "Specificity — Who Wins When Two Rules Collide",
      plain: "If two CSS rules both try to set the same property on the same element, the browser needs a tie-breaker. That tie-breaker is called SPECIFICITY, and it works like a points system: an ID is worth more points than a class, and a class is worth more points than a plain tag. Whoever scores higher wins — no matter which rule was written first.",
      technical: "Specificity is calculated as a 3-part tuple (IDs, classes/attributes/pseudo-classes, type-selectors/pseudo-elements), often written as (a,b,c). #header (1,0,0) always beats .nav-link (0,1,0), which always beats a (0,0,1) — compared left-to-right, like comparing version numbers digit by digit, not added as a single sum.",
    },
    {
      title: "The Cascade — Order, Inheritance & !important",
      plain: "If specificity ties exactly, the rule written LATER in the CSS file wins — that's the \"cascade\" part. Some properties (like color and font-family) also \"trickle down\" automatically from a parent to its children even with no rule at all — that's INHERITANCE. And !important is an emergency override switch that jumps to the very top of the priority list — powerful, but overusing it makes a stylesheet impossible to reason about.",
      technical: "When specificity ties, source order is the tie-breaker — later rules override earlier ones. Some CSS properties are inherited by default (color, font-family, line-height); others are not (margin, border, width). !important attached to a declaration overrides normal specificity/order rules entirely, and should be used sparingly — it's the reason large stylesheets become unmaintainable when overused.",
    },
    {
      title: "Why It Matters — Predictable, Maintainable Styling",
      plain: "Understanding the cascade is what separates \"I randomly add !important until it looks right\" from \"I know exactly why this rule won, and I can fix it cleanly\". It's the single biggest source of CSS confusion for beginners — and the easiest to fix once you actually understand the points system above.",
      technical: "Mastery of selector specificity and cascade order lets developers write minimal, targeted CSS instead of relying on !important escalation wars — a major contributor to unmaintainable stylesheets at scale. It's foundational for every CSS topic that follows in this module (colours/fonts/spacing, Flexbox, Grid all assume you can reason about which rule applies).",
    },
  ];

  // ── CONTENT: Quiz bank — 13 questions, escalating hints, never reveals
  // the answer outright (Rule 6 of the lesson template). Questions 1-3 are
  // new and test the CSS foundations (concepts 0-2); questions 4-13 are the
  // original selector/cascade bank (concepts 3-7), renumbered. ─────────────
  const quizQuestions = [
    {
      q: "What is CSS actually responsible for, that plain HTML cannot do on its own?",
      options: [
        "Adding more headings and paragraphs to a page",
        "Controlling how the page LOOKS — colour, spacing, fonts, layout",
        "Storing data in a database",
        "Making a webpage load faster on slow internet only",
      ],
      answer: 1,
      hints: [
        "Think back to every page you've built so far in HTML — what did they all have in common?",
        "HTML pages with no CSS are always black text on a white background, with no custom colours or layout.",
        "CSS is the language whose entire job is appearance — colour, fonts, spacing, layout, and animation — separate from HTML's job of describing structure and content.",
      ],
      explanation: "CSS (Cascading Style Sheets) handles presentation — colour, spacing, fonts, and layout — while HTML only describes structure and content. They are deliberately separate languages with separate jobs.",
    },
    {
      q: "Which of the three ways to write CSS is reusable across MANY pages of a website from a single file?",
      options: [
        "Inline CSS (style=\"...\" on one element)",
        "Internal/embedded CSS (a <style> tag in <head>)",
        "External CSS (a separate .css file linked with <link>)",
        "None of them can be reused across pages",
      ],
      answer: 2,
      hints: [
        "Inline only affects the one element it's written on. Internal only affects the one page it's written in.",
        "You need something that lives OUTSIDE any single HTML file, so many files can point to it at once.",
        "External CSS — a separate .css file connected with <link rel=\"stylesheet\" href=\"...\">  — can be linked from every page on a site, so one file styles them all.",
      ],
      explanation: "External CSS lives in its own .css file and is linked into as many HTML pages as needed with <link>. That's why real-world sites use it almost exclusively — one edit updates every linked page.",
    },
    {
      q: "In the CSS rule  p { color: blue; }  — what is \"color\" called?",
      options: ["The selector", "The property", "The value", "The combinator"],
      answer: 1,
      hints: [
        "Every CSS declaration follows the shape  property : value ;",
        "\"p\" is the selector (who gets styled), and \"blue\" is the value. That leaves one part unnamed.",
        "\"color\" is the PROPERTY — the specific aspect of the element being changed. \"blue\" is the VALUE assigned to it.",
      ],
      explanation: "A CSS declaration is property: value; — here \"color\" is the property being set, and \"blue\" is the value it's being set to. \"p\" before the braces is the selector.",
    },
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

  // NOTE: the old "concept unlock timer" effect that used to live here has
  // been removed entirely (see the BUILD stage state comment above) — there
  // is nothing left to gate, so no replacement effect is needed.

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
    // NOTE: maxWidth + margin:"0 auto" added so the bar doesn't stretch
    // edge-to-edge on wide desktop browsers — on a 1920px screen, a topbar
    // with only a title on the left and a few pills on the right looked
    // oddly spread out and "horizontally elongated". Capping the width and
    // centering it makes it read as one tidy header instead of a thin
    // full-width strip. position:"sticky" still works fine on a
    // narrower, centered element — it sticks relative to the scroll
    // container, not to its own width.
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: (active, done) => ({
      padding: "3px 9px", borderRadius: 99, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none", whiteSpace: "nowrap",
    }),
    // NOTE: same fix as topBar above — maxWidth + margin:"0 auto" so every
    // stage's content card reads as a comfortable, centered column on a
    // wide desktop monitor instead of stretching the full browser width
    // (which made paragraphs, code blocks, and quiz options look thin and
    // overly elongated left-to-right). "width: calc(100% - 24px)" keeps
    // the original 12px side gutters on small/mobile screens where
    // maxWidth never actually kicks in.
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px auto", maxWidth: 760, width: "calc(100% - 24px)", border: "1px solid #334155" },
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
  // Curiosity hook before any teaching, rebuilt for total beginners: the
  // SAME html markup, rendered two completely different ways. The student
  // predicts WHY before we ever say the word "CSS" out loud — this directly
  // sets up Build concept 0 (what CSS is and why we need it).
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🎭</div>
        <div style={s.h2}>Same exact HTML. Two completely different looks.</div>
      </div>

      {/* Visual side-by-side mock-up: identical markup, two renders. This
          IS the visual hook — no need to describe it in words first. */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ flex: "1 1 150px", background: "#fff", borderRadius: 10, padding: "14px", color: "#000", fontFamily: "Times New Roman, serif" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 400, marginBottom: 6 }}>Welcome</div>
          <div style={{ fontSize: "0.74rem", marginBottom: 8 }}>Click below to continue.</div>
          <div style={{ textDecoration: "underline", color: "#00f", fontSize: "0.74rem" }}>Continue</div>
        </div>
        <div style={{ flex: "1 1 150px", background: "linear-gradient(135deg,#38bdf8,#818cf8)", borderRadius: 10, padding: "14px", color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 6 }}>Welcome 👋</div>
          <div style={{ fontSize: "0.74rem", marginBottom: 10, opacity: 0.9 }}>Click below to continue.</div>
          <div style={{ background: "#fff", color: "#1e293b", borderRadius: 8, padding: "6px 0", fontSize: "0.76rem", fontWeight: 700 }}>Continue</div>
        </div>
      </div>
      <div style={{ ...s.p, textAlign: "center" }}>
        <strong style={{ color: "#f1f5f9" }}>Both boxes use the exact same HTML</strong> — a heading, a paragraph, and a link. So why do they look nothing alike?
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "The HTML must secretly be different",
              "Something extra — not HTML — was added to control the look",
              "Different browsers just render HTML differently, always",
              "The second one isn't really a webpage",
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
            {sparkGuess.startsWith("Something")
              ? "🎯 Exactly right! The HTML in both boxes is identical. The colours, the gradient, the centring, the button shape — none of that is HTML's job. That's CSS: a second language, layered on top of HTML, whose only job is appearance."
              : "The real answer: the HTML in both boxes is 100% identical. What changed is CSS — a separate language layered on top of HTML whose entire job is appearance (colour, spacing, fonts, layout). Same content, different CSS, completely different look."}
          </div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD ─────────────────────────────────────────────────────────────────
  // Eight concepts, freely navigable (no countdown gate — see state comment
  // above), each switchable between Plain-English and Technical phrasing,
  // each with a small live animation. The "next" button names the actual
  // concept coming up instead of a generic "Next Concept" label, so the
  // student always knows what they're about to learn before they click.
  const renderBuild = () => {
    // Short version of the NEXT concept's title (before the em dash, if any)
    // — reused by the button below so its label is meaningful rather than
    // a one-size-fits-all "Next Concept →".
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
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
            {buildMode === "plain" && <div style={{ ...s.p, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
            {buildMode === "tech" && <div style={{ ...s.p, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
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
          <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You can now explain what CSS is for, where it's written, and read any CSS rule to predict exactly which one will actually apply.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What CSS is, and why HTML alone can't control appearance",
              "The three ways to write CSS — inline, internal, external",
              "The anatomy of a CSS rule — selector, property, value",
              "Selector types — tag, class, ID",
              "Combinators — descendant, child, grouping",
              "Specificity — the points system that breaks ties",
              "The cascade — source order, inheritance, !important",
              "Why it matters for maintainable CSS",
            ].map((l, i) => (
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
        <div style={s.topTitle}>Unit 3.1 — What Is CSS? Selectors & the Cascade</div>
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
// `index` picks which of the 8 concepts to illustrate; `frame` (0-59, looping)
// drives simple position/opacity oscillation so each animation feels alive
// without needing any external animation library. Indices 0-2 are the new
// foundational concepts; indices 3-7 are the original selector/cascade ones
// (shifted down by 3 from the previous version of this file).
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40; // 0→1 sawtooth, reused by every animation below
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  // Concept 0 — What is CSS: the same tiny "card" flips between an unstyled
  // look and a styled look, visually repeating the Spark-stage hook.
  if (index === 0) {
    const styled = pos >= 0.5;
    return (
      <div style={base}>
        <div style={{
          width: 130, padding: "14px", borderRadius: styled ? 12 : 0, textAlign: styled ? "center" : "left",
          background: styled ? "linear-gradient(135deg,#38bdf8,#818cf8)" : "#fff", color: styled ? "#fff" : "#000",
          fontFamily: styled ? "'Segoe UI',sans-serif" : "Times New Roman, serif", transition: "all 0.4s",
        }}>
          <div style={{ fontWeight: styled ? 800 : 400, fontSize: "0.8rem" }}>Hello</div>
          <div style={{ fontSize: "0.62rem", marginTop: 4, opacity: styled ? 0.9 : 1 }}>same HTML</div>
        </div>
        <div style={{ position: "absolute", bottom: 6, fontSize: "0.62rem", color: "#64748b" }}>{styled ? "with CSS" : "no CSS"}</div>
      </div>
    );
  }

  // Concept 1 — Three ways to write CSS: source-code pane next to a
  // rendered-output pane, cycling inline / internal / external.
  if (index === 1) {
    // Cycles through the three ways to write CSS, but instead of just
    // naming them, it shows BOTH halves of the idea at once: the actual
    // code on the left ("where it's written") and the resulting rendered
    // text on the right ("what shows on the page") — colour-matched so the
    // connection between the two is impossible to miss, even without
    // reading a word of the surrounding text.
    const which = Math.floor(pos * 3) % 3;
    const items = [
      { label: "inline", color: "#fb923c", code: ['<p ', 'style="color:red"', '>Hi</p>'], note: "only THIS tag turns red" },
      { label: "internal", color: "#38bdf8", code: ['<style>\n  ', 'p { color: red; }', '\n</style>'], note: "every <p> on this page turns red" },
      { label: "external", color: "#4ade80", code: ['styles.css:\n  ', 'p { color: red; }', ''], note: "every page linking this file turns red" },
    ];
    const cur = items[which];
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "6px 8px", flex: "0 1 45%", minWidth: 0 }}>
            <div style={{ fontSize: "0.56rem", color: "#475569", marginBottom: 3 }}>{cur.label} — where it's written</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.6rem", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
              <span style={{ color: "#475569" }}>{cur.code[0]}</span>
              <span style={{ background: cur.color + "33", color: cur.color, borderRadius: 3, padding: "0 2px", fontWeight: 700 }}>{cur.code[1]}</span>
              <span style={{ color: "#475569" }}>{cur.code[2]}</span>
            </div>
          </div>
          <div style={{ color: "#475569", fontSize: "0.9rem" }}>→</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "10px 8px", flex: "0 1 38%", minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: "0.56rem", color: "#64748b", marginBottom: 3 }}>what shows up</div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: cur.color }}>Hi</div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 4, fontSize: "0.58rem", color: cur.color, fontWeight: 600 }}>{cur.note}</div>
      </div>
    );
  }

  // Concept 2 — Anatomy of a rule: labels the three parts of  p { color: blue; }
  // one at a time as the loop progresses.
  if (index === 2) {
    const part = Math.floor(pos * 3) % 3; // 0 selector, 1 property, 2 value
    const labels = ["selector", "property", "value"];
    const colors = ["#4ade80", "#38bdf8", "#fb923c"];
    return (
      <div style={base}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.95rem", marginBottom: 10 }}>
            <span style={{ color: part === 0 ? colors[0] : "#475569", fontWeight: part === 0 ? 800 : 400 }}>p</span>
            <span style={{ color: "#475569" }}> {"{ "}</span>
            <span style={{ color: part === 1 ? colors[1] : "#475569", fontWeight: part === 1 ? 800 : 400 }}>color</span>
            <span style={{ color: "#475569" }}>: </span>
            <span style={{ color: part === 2 ? colors[2] : "#475569", fontWeight: part === 2 ? 800 : 400 }}>blue</span>
            <span style={{ color: "#475569" }}>{"; }"}</span>
          </div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: colors[part] }}>↑ this part is the {labels[part]}</div>
        </div>
      </div>
    );
  }

  // Concept 3 — Selectors: shows the SAME idea as concept 1's animation —
  // source on the left, rendered result on the right — but now the right
  // side is a tiny mock page with THREE elements, and the current selector
  // (p / .card / #header) lights up only the element(s) it actually
  // matches in BOTH panes at once, so "this selector finds THESE elements"
  // is something the student watches happen, not something they read.
  if (index === 3) {
    const which = Math.floor(pos * 3) % 3;
    const selectors = [
      { txt: "p", color: "#38bdf8", matches: [true, true, false] },
      { txt: ".card", color: "#a78bfa", matches: [false, true, false] },
      { txt: "#header", color: "#4ade80", matches: [false, false, true] },
    ];
    const elements = [
      { tag: "<p>", short: "para" },
      { tag: '<p class="card">', short: "card" },
      { tag: '<div id="header">', short: "header" },
    ];
    const cur = selectors[which];
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "6px 8px", flex: "0 1 48%", minWidth: 0 }}>
            <div style={{ fontSize: "0.56rem", color: "#475569", marginBottom: 3 }}>the html</div>
            {elements.map((el, i) => (
              <div key={i} style={{
                fontFamily: "monospace", fontSize: "0.56rem", lineHeight: 1.7,
                color: cur.matches[i] ? cur.color : "#475569",
                fontWeight: cur.matches[i] ? 700 : 400,
                background: cur.matches[i] ? cur.color + "22" : "transparent",
                borderRadius: 3, padding: "0 2px",
              }}>{el.tag}</div>
            ))}
          </div>
          <div style={{ color: "#475569", fontSize: "0.9rem" }}>→</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "6px 8px", flex: "0 1 38%", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {elements.map((el, i) => (
              <div key={i} style={{
                fontSize: "0.56rem", padding: "3px 5px", borderRadius: 4, textAlign: "center",
                border: cur.matches[i] ? `2px solid ${cur.color}` : "1px solid #e2e8f0",
                background: cur.matches[i] ? cur.color + "22" : "#f8fafc",
                color: cur.matches[i] ? cur.color : "#94a3b8", fontWeight: cur.matches[i] ? 700 : 400,
              }}>{el.short}{cur.matches[i] ? " ✓" : ""}</div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 4, fontSize: "0.62rem", color: cur.color, fontWeight: 700, fontFamily: "monospace" }}>{cur.txt}</div>
      </div>
    );
  }

  // Concept 4 — Combinators: an arrow "descends" through nested boxes to
  // illustrate nav → a being matched at depth.
  if (index === 4) {
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

  // Concept 5 — Specificity: a simple bar chart, tag < class < ID, with the
  // currently-"flashing" bar cycling to draw the eye to the comparison.
  if (index === 5) {
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

  // Concept 6 — Cascade/order: two identical-specificity boxes, with the
  // "later" one's checkmark blinking on to show it winning by source order.
  if (index === 6) {
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 12px", fontSize: "0.68rem", color: "#64748b" }}>Rule written first</div>
          <div style={{ background: pos > 0.5 ? "#14532d33" : "#1e293b", border: pos > 0.5 ? "1px solid #4ade80" : "1px solid #334155", borderRadius: 6, padding: "6px 12px", fontSize: "0.68rem", color: pos > 0.5 ? "#4ade80" : "#64748b", transition: "all 0.3s" }}>Rule written LAST {pos > 0.5 ? "✅ wins" : ""}</div>
        </div>
      </div>
    );
  }

  // Concept 7 — Why it matters: a messy stack of !important shrinking down
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
