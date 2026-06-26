// ============================================================================
//  UNIT 5.3 — "npm & Modules"
//  Module: M5 — Node.js & Backend (THIRD unit of FIVE in this module —
//  NOT the final unit, so this file must never claim "Module 5 complete".
//  After this unit the student moves on to Unit 5.4: Express.js Basics.)
//
//  WHERE THIS FILE FITS IN THE APP (read this before touching anything):
//  - src/shell/App.jsx is the ONE place in the whole app that talks to the
//    backend (it imports api.js / config/gas.config.js — lesson files like
//    this one NEVER do). App.jsx keeps a lookup table (config/course.config.js)
//    that maps a unit id string, "Unit5_3", to this component file.
//  - When the student picks "npm & Modules" on the Dashboard, App.jsx does
//    roughly:  <Unit5_3 student={studentObj} onUnitComplete={handleDone} />
//    where studentObj = { rollNo, name, batch } (read-only, used here only
//    to personalize a greeting/completion line — never mutated) and
//    handleDone is a callback OWNED by App.jsx that records progress and
//    routes the student back to the Dashboard.
//  - Our ONLY contract with the outside world is: render the lesson, let
//    the student work through it, and call onUnitComplete() EXACTLY ONCE,
//    and ONLY from a real onClick on the final Quiz "Mark Complete" button.
//    Never from a useEffect, never automatically, never more than once.
//    (This mirrors Unit4_5.jsx and the rule explained at length in
//    Unit1_1_template.jsx's header: auto-firing inside a conditional block
//    risks breaking React's Rules of Hooks and stranding the student.)
//
//  HOUSE STYLE (copied deliberately from Unit4_5.jsx for visual/UX
//  consistency across the whole course — same dark-slate theme, same
//  component shapes, same interaction patterns, so a student who has
//  done other units already knows how to navigate this one):
//  - Build-stage blurbs are short; the real teaching happens visually via
//    ConceptAnimation (a hand-rolled CSS/JS animation driven by a looping
//    `frame` counter from setInterval, NOT an external animation library).
//  - Every wrong tap in TagMatch / BugHunt immediately shows an
//    explanatory hint — wrong answers are never just silently rejected.
//  - Quiz wrong answers NEVER reveal the correct option outright. Instead
//    an escalating hint is shown (hint text gets more specific the more
//    times the student gets it wrong), and the student can keep retrying.
//    Only a correct answer reveals the "explanation" (the teaching payoff).
//
//  SIX-STAGE FLOW (every lesson in this course follows this exact shape,
//  so students always know "where" they are inside a lesson via the
//  sticky top-bar stage pills):
//    Stage 0 SPARK     — predict: "if you delete node_modules and
//                         re-clone, does the project still run?" — a
//                         concrete, guessable question BEFORE any teaching,
//                         so the student forms a hypothesis first.
//    Stage 1 BUILD     — 8 bite-sized concepts: what npm is, package.json,
//                         npm install + dependencies vs devDependencies,
//                         node_modules, module.exports/require (CommonJS),
//                         built-in vs third-party modules, npm scripts,
//                         and just enough semantic versioning to read a
//                         package.json line like "^4.18.2".
//    Stage 2 SEE IT    — a 6-step walkthrough that builds up a tiny
//                         package.json AND a two-file module.exports/
//                         require example, with a simulated terminal
//                         showing what `npm install` / `npm start` print.
//    Stage 3 TRY IT    — the student clicks preset commands/snippets
//                         (require, module.exports, npm install, npm
//                         start) and watches a simulated terminal/console
//                         panel react — must try 3+ before Next unlocks.
//    Stage 4 CHALLENGE — TagMatch (term ↔ meaning: package.json,
//                         node_modules, dependencies, require,
//                         module.exports, npm script) with per-pair hints,
//                         then a BugHunt: spot the file that forgot
//                         `module.exports = …`, so require() on it
//                         elsewhere silently returns an empty object.
//    Stage 5 QUIZ      — 12 questions (course minimum is 10), escalating
//                         hints, never auto-revealing the answer. The
//                         final screen says "Unit 5.3 done, on to
//                         Express.js Basics" — UNIT-level completion only,
//                         since Module 5 still has two more units left.
//
//  MOBILE-FIRST: every width below is a %, a flexWrap, or a clamp()/
//  minmax() — there are no fixed pixel widths that could overflow a
//  narrow phone screen. (Rule 7 in Unit1_1_template.jsx.)
//
//  COMMENT DENSITY: per this project's global CLAUDE.md instruction,
//  comments here are intentionally MORE thorough than Unit4_5.jsx —
//  every state variable, every render function, and every non-obvious
//  style/logic line gets a "what AND why" comment, including how it
//  threads back into the six-stage flow and into App.jsx's contract.
// ============================================================================

// React hooks we need:
//  - useState   → every piece of UI state in this component (current
//                 stage, quiz progress, which concept is open, etc.)
//  - useEffect  → drives the looping Build/See-It animation frame counter
//                 via setInterval, and cleans the interval up on unmount
//                 or stage change so we never leak a running timer.
//  - useRef     → holds the setInterval handle (animRef) so the cleanup
//                 function in useEffect can clearInterval() the EXACT
//                 timer that effect created, even across re-renders.
import { useState, useEffect, useRef } from "react";

// ── THE COMPONENT ITSELF ────────────────────────────────────────────────
// Signature is locked by house rules: must be named export default,
// must destructure exactly { student, onUnitComplete } as props, no more,
// no less — App.jsx calls us with exactly these two props and nothing else.
export default function Unit5_3({ student, onUnitComplete }) {

  // ==========================================================================
  // ALL HOOKS LIVE HERE, UNCONDITIONALLY, IN ONE FIXED ORDER — every single
  // render of this component calls EXACTLY these hooks in EXACTLY this
  // order, with zero hooks declared inside an if/loop/early-return anywhere
  // below. This is non-negotiable per React's Rules of Hooks AND per this
  // course's house rule (see Unit1_1_template.jsx header, rule 3): breaking
  // this once already crashed a lesson silently and stranded a student who
  // could never reach the Dashboard again. So: new state goes here, full
  // stop, never nested deeper in the file.
  // ==========================================================================

  // -- STAGE / FLOW STATE --------------------------------------------------
  // `stage` is the single source of truth for which of the six stages is
  // currently on screen. The top-level render switches on this number, and
  // the sticky top-bar pills (stageNames array, further down) highlight
  // the matching pill so the student always has a "you are here" cue.
  // 0=Spark 1=Build 2=SeeIt 3=TryIt 4=Challenge 5=Quiz.
  const [stage, setStage] = useState(0);

  // -- SPARK STAGE STATE ----------------------------------------------------
  // sparkGuess  → which of the four guess-options the student tapped
  //               (string, or null before they've picked anything).
  // sparkSubmitted → flips true once they lock in their guess, which swaps
  //               the UI from "pick an option" into "here's the reveal".
  // Both reset to their initial values automatically whenever a fresh
  // mount of this component happens (i.e. a new visit to this lesson),
  // because useState's initializer only runs once per mount.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // -- BUILD STAGE STATE ------------------------------------------------------
  // buildConcept → index (0..7) into the `concepts` array below, i.e. which
  //               of the 8 Build concepts is currently displayed. Driven by
  //               the horizontal concept-picker strip AND the "Next:" button.
  // buildMode    → "plain" | "tech" — toggles between the Plain-English
  //               explanation and the more formal/technical one for
  //               WHICHEVER concept is currently selected. Resets to
  //               "plain" every time the student switches concepts, so they
  //               always meet a new idea in friendly language first.
  const [buildConcept, setBuildConcept] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // -- SEE IT STAGE STATE -----------------------------------------------------
  // seeitStep → which step (0..5) of the package.json / require walkthrough
  //            is on screen right now. Walked forward/back by buttons.
  // seeitMode → same Plain/Technical toggle pattern as Build, but scoped to
  //            the currently-visible See-It step's narration text.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // -- TRY IT STAGE STATE -------------------------------------------------------
  // exprPicked  → which preset command/snippet (a string key, e.g.
  //              "npm install express") the student last tapped, so we know
  //              which simulated terminal output to render.
  // triedCount  → how many DISTINCT presets the student has tried so far
  //              this visit. Stage rule 8 (interactivity-over-text) plus
  //              this lesson's own requirement: the "Take the Challenge"
  //              button only unlocks once triedCount >= 3, forcing genuine
  //              exploration instead of a single click-through.
  const [exprPicked, setExprPicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0);

  // -- CHALLENGE STAGE STATE ----------------------------------------------------
  // challengePhase → 0 while the TagMatch mini-game is active, 1 once that's
  //                 done and the BugHunt mini-game takes over. Lets us show
  //                 exactly one mini-game card at a time inside renderChallenge().
  // ch1Done / ch2Done → flip true the moment TagMatch / BugHunt respectively
  //                 report completion via their onDone callback prop. Used to
  //                 reveal the "Next Challenge →" / "Final Quiz →" buttons —
  //                 i.e. you can't skip ahead without actually finishing each
  //                 mini-game.
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // -- QUIZ STAGE STATE -----------------------------------------------------
  // quizQ        → index into quizQuestions[] for the question on screen now.
  // quizSelected → index of the option the student has currently clicked
  //               (not yet necessarily "checked").
  // quizFeedback → null | "correct" | "wrong" — set only after the student
  //               presses "Check Answer"; drives which color/hint/explanation
  //               block renders below the options.
  // quizAttempts → wrong-attempt counter for the CURRENT question only —
  //               resets to 0 every time we move to a new question. Used to
  //               pick which escalating hint string to show (more attempts
  //               => a more specific hint, but the correct answer text is
  //               NEVER placed inside a hint string, per house rule 6).
  // quizDone     → flips true once the LAST question has been answered
  //               correctly and the student presses "Finish Quiz". This is
  //               what swaps the quiz UI over to the one-time completion
  //               screen that contains the only onUnitComplete() call in
  //               this entire file.
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // -- SHARED LOOPING ANIMATION FRAME ----------------------------------------
  // animRef   → a ref (not state, because changing it should NOT trigger a
  //            re-render by itself) holding the setInterval() handle, so the
  //            cleanup function below can clearInterval() the precise timer
  //            it created, every time the effect re-runs or unmounts.
  // animFrame → a continuously incrementing counter (wrapped mod 60) that
  //            EVERY ConceptAnimation() below reads to derive its current
  //            visual position — this is what makes the Build/See-It
  //            animations look "alive" without any external animation
  //            library, just plain CSS values recomputed from a number.
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ==========================================================================
  // CONTENT: the 8 Build-stage concepts students click through one at a time
  // via the concept-picker strip. Order matters pedagogically: npm itself,
  // then its manifest file, then how packages get added, then where they
  // land on disk, then how code is split into reusable files (require/
  // module.exports), then a built-in-vs-third-party distinction, then npm
  // scripts as a convenience layer, and finally just enough semver to read
  // a dependency line without this becoming a deep version-theory unit.
  // ==========================================================================
  const concepts = [
    {
      title: "What Is npm?",
      plain: "npm comes free with Node — your doorway to a huge library of ready-made code.",
      technical: "npm is Node's bundled package manager: installs dependencies, runs scripts.",
    },
    {
      title: "package.json — The Manifest",
      plain: "package.json describes your project: name, version, packages needed, scripts.",
      technical: "package.json is a JSON manifest: name, version, dependencies, scripts.",
    },
    {
      title: "npm install — Adding Packages",
      plain: "npm install downloads a package and records it in package.json.",
      technical: "npm install <pkg> fetches into node_modules/ and updates dependencies.",
    },
    {
      title: "node_modules/ — Where Packages Live",
      plain: "node_modules/ stores installed packages — usually skipped from git.",
      technical: "node_modules/ is the dependency tree on disk; conventionally gitignored.",
    },
    {
      title: "module.exports & require — Splitting Code Up",
      plain: "module.exports sends code out, require() pulls it into another file.",
      technical: "CommonJS: module.exports defines a file's API; require() loads it.",
    },
    {
      title: "Built-in vs Third-Party Modules",
      plain: "Built-ins like fs need no install; third-party ones like express do.",
      technical: "Core modules ship with Node; third-party ones come from the npm registry.",
    },
    {
      title: "npm run — Custom Scripts",
      plain: "package.json's scripts let \"npm start\" run a saved shortcut command.",
      technical: "scripts maps a name to a shell command; npm run <name> executes it.",
    },
    {
      title: "Semantic Versioning (Just Enough to Read It)",
      plain: "Versions are MAJOR.MINOR.PATCH — ^ allows safe upgrades, ~ allows fewer.",
      technical: "Semver: MAJOR=breaking, MINOR=features, PATCH=fixes; ^ and ~ bound upgrades.",
    },
  ];

  // ==========================================================================
  // EFFECT: drives the shared looping animation frame used by both the
  // Build stage's ConceptAnimation and any animated visuals on See-It.
  // Runs ONLY while stage is 1 (Build) or 2 (See It) — there is no point
  // burning a setInterval tick every 100ms while the student is reading
  // Spark text or answering Quiz questions, so we bail out early (the
  // hook itself still runs every render, satisfying Rules of Hooks — only
  // its BODY behavior is conditional, never the hook call itself).
  // Every tick advances animFrame by 1, wrapping at 60 so the same set of
  // derived "pos" values in ConceptAnimation() repeats in a smooth loop.
  // The returned cleanup function clears the interval whenever `stage`
  // changes or the component unmounts, so leaving Build/SeeIt never
  // leaves a stray timer ticking in the background (which would otherwise
  // silently leak memory/CPU for the rest of the session).
  // ==========================================================================
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ==========================================================================
  // CONTENT: See-It steps. These six steps build up, in front of the
  // student's eyes, (a) a tiny package.json from nothing, and (b) a
  // two-file module.exports/require example — each step pairs a code
  // snippet with a SIMULATED terminal/console line (result/resultColor)
  // so the student sees plausible real-world output without us actually
  // running Node anywhere (this is a static React lesson, not a sandboxed
  // runtime — "result" strings below are hand-authored to LOOK like what
  // a real terminal would print).
  // ==========================================================================
  const seeitSteps = [
    {
      plain: "npm init -y writes a starter package.json instantly.",
      tech: "Skips prompts, writes sensible defaults to package.json.",
      code: `$ npm init -y`,
      result: `Wrote to ./package.json:
{
  "name": "my-app",
  "version": "1.0.0"
}`,
      resultColor: "#94a3b8",
    },
    {
      plain: "Install express — a popular third-party server package.",
      tech: "Downloads into node_modules/, records under \"dependencies\".",
      code: `$ npm install express`,
      result: `added 57 packages in 2s
package.json now has:
"dependencies": { "express": "^4.18.2" }`,
      resultColor: "#4ade80",
    },
    {
      plain: "math.js exposes 'add' by assigning it to module.exports.",
      tech: "Assigning to module.exports defines this file's public API.",
      code: `// math.js
function add(a, b) { return a + b; }
module.exports = add;`,
      result: `(no terminal output yet — math.js just defines its export)`,
      resultColor: "#7dd3fc",
    },
    {
      plain: "app.js pulls 'add' in with require('./math').",
      tech: "require caches and returns math.js's module.exports value.",
      code: `// app.js
const add = require('./math');
console.log(add(2, 3));`,
      result: `5`,
      resultColor: "#38bdf8",
    },
    {
      plain: "A 'start' script saves teammates from typing the node command.",
      tech: "scripts.start is npm start's conventional entry point.",
      code: `// package.json (added)
"scripts": { "start": "node app.js" }`,
      result: `(saved — no terminal output for an edit to a file)`,
      resultColor: "#a78bfa",
    },
    {
      plain: "npm start now runs that script — same result, shorter to type.",
      tech: "npm start runs the shell command in scripts.start.",
      code: `$ npm start`,
      result: `> my-app@1.0.0 start
> node app.js

5`,
      resultColor: "#4ade80",
    },
  ];

  // ==========================================================================
  // CONTENT: Try-It presets. Each preset pairs a short command/snippet the
  // student can tap with a simulated terminal/console "result" string and
  // a one-line plain-English note explaining WHY that's the output. The
  // Try-It stage requires triedCount >= 3 distinct taps before "Next" is
  // enabled — see renderTryIt() further down — forcing the student to
  // explore rather than tap once and coast through.
  // ==========================================================================
  const exprPresets = [
    {
      expr: "require('./math')",
      result: "[Function: add]",
      resultType: "text",
      note: "require() returns exactly what module.exports assigned.",
    },
    {
      expr: "module.exports = add;",
      result: "(no console output — this just SETS what require() will hand back elsewhere)",
      resultType: "text",
      note: "Sets the file's public API — prints nothing itself.",
    },
    {
      expr: "require('fs')",
      result: "{ readFile: [Function], writeFile: [Function], ... }",
      resultType: "text",
      note: "fs is BUILT-IN — no install needed.",
    },
    {
      expr: "npm install express",
      result: "added 57 packages in 2s\n+ express@4.18.2",
      resultType: "text",
      note: "express is THIRD-PARTY — install before requiring it.",
    },
    {
      expr: "npm start",
      result: "> my-app@1.0.0 start\n> node app.js\n\n5",
      resultType: "text",
      note: "Runs whatever's stored under scripts.start.",
    },
    {
      expr: "require('./empty')  // forgot module.exports",
      result: "{}",
      resultType: "text",
      note: "No module.exports means a default empty object, not an error.",
    },
  ];

  // ==========================================================================
  // CONTENT: Challenge 1 — TagMatch pairs (term ↔ meaning). Six core
  // vocabulary terms from this unit, each with its own "wrong tap" hint
  // string so a mismatched tap teaches something instead of just buzzing red.
  // ==========================================================================
  const ch1Pairs = [
    { code: "package.json", meaning: "The manifest describing a project's name, version, dependencies & scripts", hint: "Think 'ID card for the whole project' — not a single package, the WHOLE project." },
    { code: "node_modules/", meaning: "The folder where installed packages physically live on disk", hint: "This is the folder that gets huge and is usually .gitignore'd." },
    { code: "dependencies", meaning: "Packages the app needs to actually RUN in production", hint: "Contrast this with packages only needed while developing/testing." },
    { code: "require('./file')", meaning: "Pulls another file's exported value into THIS file", hint: "It's the 'bring this in' half of the export/import pair." },
    { code: "module.exports", meaning: "What a file assigns to expose something to other files", hint: "It's the 'send this out' half of the export/import pair." },
    { code: "npm run <script>", meaning: "Runs a custom shortcut command defined in package.json's scripts field", hint: "Look for where package.json defines named shell commands." },
  ];

  // ==========================================================================
  // CONTENT: Challenge 2 — bug hunt. Three files' worth of lines stitched
  // into one list; the bug is a file that forgot `module.exports = ...`,
  // so requiring it elsewhere silently returns {} instead of the function
  // the student expects — a very common real beginner mistake.
  // ==========================================================================
  const bugLines = [
    { text: "// greet.js", buggy: false },
    { text: "function greet(name) { return 'Hi ' + name; }", buggy: true, why: "greet.js defines the function but NEVER assigns it to module.exports. Anyone who does require('./greet') gets back the default {} — not the greet function. Fix: add module.exports = greet; at the bottom of this file." },
    { text: "// app.js", buggy: false },
    { text: "const greet = require('./greet');", buggy: false },
    { text: "console.log(greet('Aishwarya'));", buggy: false },
  ];
  const bugHints = [
    "Four of these five lines are perfectly fine — one file is missing a statement we covered earlier in Build.",
    "Look at greet.js specifically: it DEFINES a function, but does it ever hand that function off to anything?",
    "greet.js never writes to module.exports, so require('./greet') in app.js gets back {} instead of the greet function. Tap the line in greet.js that's missing that assignment.",
  ];

  // ==========================================================================
  // CONTENT: Quiz bank — 12 questions (course minimum is 10; we exceed it
  // to match Unit4_5.jsx's depth). Every question carries 2-3 escalating
  // hints (string only gets MORE specific with repeated wrong attempts,
  // NEVER contains the literal correct option text) plus an `explanation`
  // shown only after a correct answer — the actual teaching payoff.
  // ==========================================================================
  const quizQuestions = [
    {
      q: "What is npm, in one sentence?",
      options: [
        "A code editor bundled with Node.js",
        "Node's package manager — a tool (and registry) for installing and managing reusable code packages",
        "A built-in Node module for reading files",
        "A testing framework for JavaScript",
      ],
      answer: 1,
      hints: [
        "Its full name spells out exactly what it does — think about the three words it stands for.",
        "It's not a single file or module; it's the TOOL you run from the command line (npm install, npm start...).",
        "npm stands for Node Package Manager — it manages installing, updating, and running scripts for packages in a project.",
      ],
      explanation: "npm (Node Package Manager) ships with Node.js and is the standard way to install third-party packages, manage a project's dependency list, and run custom scripts defined in package.json.",
    },
    {
      q: "What is package.json's main job in a Node project?",
      options: [
        "It stores the actual downloaded code of every installed package",
        "It's a JSON manifest describing the project: name, version, dependencies, and scripts",
        "It's where you write your application's main logic",
        "It's a log file npm writes errors to",
      ],
      answer: 1,
      hints: [
        "The downloaded CODE of packages lives somewhere else entirely — this file just describes things ABOUT the project.",
        "Picture it as a project's ID card, not a folder of code.",
        "package.json is metadata: name, version, the dependencies list, and the scripts shortcuts — not the installed code itself (that's node_modules/).",
      ],
      explanation: "package.json is a manifest file npm/Node tooling reads — it never contains installed packages' actual code, only the project's identity, its declared dependencies, and any custom scripts.",
    },
    {
      q: "Running 'npm install express' does which of these?",
      options: [
        "Only downloads express into node_modules/, without touching package.json",
        "Only edits package.json, without actually downloading any code",
        "Downloads express (and its own dependencies) into node_modules/, AND records it under package.json's dependencies",
        "Permanently installs express onto your operating system, available to every project",
      ],
      answer: 2,
      hints: [
        "npm install does TWO things at once, not just one — think disk AND manifest.",
        "One half is 'where does the actual code end up', the other half is 'how does the PROJECT remember it needs this'.",
        "npm install both downloads the package's files into node_modules/ and adds/updates an entry for it under \"dependencies\" in package.json.",
      ],
      explanation: "npm install <pkg> fetches the package (plus whatever IT depends on) into node_modules/, and simultaneously records that dependency in package.json so the project's requirements are documented and reproducible.",
    },
    {
      q: "What flag marks a package as a devDependency instead of a regular dependency?",
      options: ["-g", "-D (or --save-dev)", "-f", "--prod"],
      answer: 1,
      hints: [
        "It's a short, commonly-typed single-letter flag — think 'D' for the category name itself.",
        "devDependencies are for tools needed only while DEVELOPING/testing, not at runtime.",
        "npm install <pkg> -D (equivalently --save-dev) adds the package under devDependencies rather than dependencies.",
      ],
      explanation: "-D / --save-dev tells npm to record the package under devDependencies — for tools like test runners or bundlers that the shipped app doesn't need at runtime, only the development process does.",
    },
    {
      q: "Why is node_modules/ usually listed in .gitignore?",
      options: [
        "Because Git refuses to track folders with that exact name",
        "Because it's large and fully reproducible from package.json — teammates just run npm install themselves",
        "Because node_modules/ contains private passwords",
        "Because npm deletes node_modules/ automatically after every install",
      ],
      answer: 1,
      hints: [
        "It's purely a practicality decision, not a technical restriction Git imposes.",
        "Ask: if you deleted node_modules/ entirely, could the project regenerate it from something ELSE already in the repo?",
        "node_modules/ can always be rebuilt by running npm install against package.json, so committing it would just bloat the repository with regeneratable, often platform-specific files.",
      ],
      explanation: "Since package.json (plus package-lock.json) fully describes what node_modules/ should contain, committing the folder itself is redundant — teammates regenerate it locally with a single npm install.",
    },
    {
      q: "If you delete node_modules/ and re-clone (or freshly clone) a project that has a package.json, will it run right away?",
      options: [
        "Yes, instantly — package.json IS the code",
        "No, never — deleting node_modules/ permanently breaks the project",
        "No, not until you run npm install again to regenerate node_modules/ from package.json",
        "Yes, but only if you also reinstall Node.js itself",
      ],
      answer: 2,
      hints: [
        "Recall this unit's opening Spark question — what did package.json actually contain versus what node_modules/ contained?",
        "package.json only DESCRIBES the dependencies; the actual package code lives in node_modules/, which is now gone.",
        "Running npm install reads package.json and re-downloads everything listed into a fresh node_modules/ — after that, the project runs exactly as before.",
      ],
      explanation: "package.json records WHAT you need, not the code itself. Deleting node_modules/ removes the actual installed packages, but npm install rebuilds that folder from package.json's dependency list, restoring full functionality.",
    },
    {
      q: "In math.js: module.exports = add; — what does this line do?",
      options: [
        "It runs the add function immediately",
        "It makes 'add' the value any other file gets back when it requires this file",
        "It deletes any previous exports from this file",
        "It only works inside index.js, never any other filename",
      ],
      answer: 1,
      hints: [
        "This line doesn't CALL the function — it labels the function as 'this file's public output'.",
        "Whatever you assign to module.exports is exactly what comes back on the OTHER end of a require() call.",
        "Assigning to module.exports defines this file's entire public API — require('./math') elsewhere will receive exactly that assigned value (the add function).",
      ],
      explanation: "module.exports is the object every CommonJS file uses to expose its public API. Assigning the add function to it means any require('./math') call elsewhere receives that exact function back.",
    },
    {
      q: "const add = require('./math'); — what does require() do here?",
      options: [
        "It creates a brand-new copy of math.js's code inline",
        "It loads math.js (once) and returns whatever that file assigned to module.exports",
        "It only works for built-in modules, never for your own files",
        "It deletes math.js after reading it",
      ],
      answer: 1,
      hints: [
        "require() and module.exports are a matched PAIR — one sends out, the other pulls in.",
        "It runs the target file (the first time it's required) and hands back exactly what THAT file exported.",
        "require(path) loads the target module, caching the result, and returns whatever value that module assigned to module.exports — here, the add function.",
      ],
      explanation: "require('./math') runs math.js (only once, then caches the result) and returns precisely what math.js put into module.exports — letting app.js use add() as if it were defined locally.",
    },
    {
      q: "Which of these is a BUILT-IN Node module that needs NO npm install?",
      options: ["express", "lodash", "fs", "react"],
      answer: 2,
      hints: [
        "Three of these four are popular THIRD-PARTY packages you'd have to npm install first.",
        "One of them ships inside Node itself, for reading/writing files on disk.",
        "fs (the file system module) is part of Node's standard library — require('fs') works with zero installation.",
      ],
      explanation: "fs, http, and path are examples of Node's built-in/core modules — always available via require() with no npm install step. express, lodash, and react are all third-party packages that must be installed first.",
    },
    {
      q: "Why does requiring express need 'npm install express' first, but requiring fs needs nothing?",
      options: [
        "express is just a buggier package than fs",
        "fs is a built-in module bundled with Node itself; express is a third-party package that lives in the npm registry and must be downloaded",
        "There's no real difference — both always need installing",
        "express only works on Windows, so it needs special setup",
      ],
      answer: 1,
      hints: [
        "The distinction is exactly the 'built-in vs third-party' idea from this unit's Build stage.",
        "One of them comes pre-packaged inside Node.js itself; the other was published independently to the public registry.",
        "Built-in modules (fs, http, path) ship inside Node and need no install; third-party modules (express, lodash...) live in the npm registry and must be fetched into node_modules/ via npm install before requiring them.",
      ],
      explanation: "Node bundles a small standard library of built-in modules available immediately. Everything else — including hugely popular packages like express — is third-party and must be installed via npm before any require() call for it will succeed.",
    },
    {
      q: "package.json has: \"scripts\": { \"start\": \"node app.js\" }. What does running 'npm start' do?",
      options: [
        "It opens a guided setup wizard",
        "It runs exactly the command stored under scripts.start — here, node app.js",
        "It installs every dependency from scratch, ignoring node_modules/",
        "It only works if the file is literally named start.js",
      ],
      answer: 1,
      hints: [
        "npm start is really just a convenient ALIAS for whatever shell command is written under that scripts key.",
        "Look again at exactly what string is stored next to \"start\" in scripts — that's literally what gets executed.",
        "npm start expands to and runs the command stored at scripts.start in package.json — in this case, node app.js — saving teammates from memorizing the exact command.",
      ],
      explanation: "npm run <name> (with start and test specially shorthand-able to just npm start / npm test) looks up that name under package.json's scripts field and runs the associated shell command verbatim.",
    },
    {
      q: "In package.json you see \"express\": \"^4.18.2\". What does the caret (^) roughly allow?",
      options: [
        "Only the exact version 4.18.2, nothing else, ever",
        "Any version at all, including future incompatible major rewrites",
        "Newer MINOR and PATCH updates within the same MAJOR version (e.g. up to but not including 5.0.0)",
        "Only PATCH updates, never new MINOR features",
      ],
      answer: 2,
      hints: [
        "Recall MAJOR.MINOR.PATCH — the caret cares about which of those three numbers is allowed to move.",
        "It explicitly stays within ONE specific number (MAJOR) while allowing the other two to creep upward.",
        "^4.18.2 permits any 4.x.x update (newer MINOR features or PATCH fixes) but blocks jumping to 5.0.0, since a new MAJOR version may include breaking changes.",
      ],
      explanation: "The caret (^) is the most common semver range in package.json: it allows automatic updates to newer MINOR or PATCH versions, but never to a new MAJOR version, since MAJOR bumps are reserved for breaking changes.",
    },
  ];

  // ==========================================================================
  // SHARED STYLE OBJECT `s` — copied verbatim (field-for-field) from
  // Unit4_5.jsx so every lesson in this course shares one visual language:
  // same dark slate gradient background, same card/pill/button shapes, same
  // mobile-safe sizing approach (percentages, flexWrap, clamp()/minmax()
  // everywhere — never a bare fixed px width that could overflow a phone).
  // Each key is a small factory: plain objects for static styles, functions
  // for styles that vary by state (e.g. s.pill(active, done) recolors a
  // stage pill depending on whether it's the current stage or an already-
  // completed one).
  // ==========================================================================
  const s = {
    // Full-page background gradient + base text color/font — the outermost
    // wrapper div in the final return uses this.
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    // Sticky header bar pinned to the top of the viewport (position:sticky,
    // top:0) so the stage-progress pills stay visible while the student
    // scrolls a long card — capped at maxWidth 760 and centered so it never
    // looks absurdly wide on a desktop monitor, but still 100% width (with
    // flexWrap) so it never overflows a narrow phone.
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    // s.pill(active, done): a small rounded "chip" for each of the six
    // stage names in the top bar. `active` = this is the CURRENT stage
    // (bright blue fill); `done` = the student has already passed this
    // stage (soft green outline). Neither true = a dim, not-yet-reached pill.
    pill: (active, done) => ({
      padding: "3px 9px", borderRadius: 99, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none", whiteSpace: "nowrap",
    }),
    // The main content "card" every stage renders inside — rounded corners,
    // dark slate fill, centered with a max width but width: calc(100% - 24px)
    // so on a phone it always leaves a small margin instead of touching the
    // screen edges.
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px auto", maxWidth: 760, width: "calc(100% - 24px)", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: 10 },
    line: { color: "#cbd5e1", fontSize: "0.88rem", fontWeight: 600, marginBottom: 10 },
    // s.btn(color): the primary call-to-action button used everywhere a
    // student advances the lesson forward (defaults to course-blue, but
    // callers pass "#4ade80" green for "this stage is done, move on").
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    // s.tag(c): a small colored badge (used for "Question X of Y", progress
    // counters, etc.) — c is any hex color, and the badge auto-derives a
    // translucent background/border from it.
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    // s.toggleBtn(active): the Plain-English / Technical toggle buttons
    // used in both Build and See-It — highlights whichever mode is active.
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    // The dark inner box that hosts each Build concept's ConceptAnimation —
    // fixed minHeight so the animation always has visual room, but width is
    // 100% of its flexible parent so it scales down on phones automatically.
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    // Monospace "code block" styling used for every snippet/terminal-command
    // shown throughout Build/See-It/Try-It — whiteSpace:pre-wrap plus
    // wordBreak:break-word plus overflowX:auto means even a long single-line
    // command wraps or scrolls instead of blowing out the layout on mobile.
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.84rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    // s.quizOption(sel, correct, wrong): one quiz answer row's styling —
    // green if it's the just-confirmed correct pick, red if it's the
    // just-rejected wrong pick, blue outline if merely selected-but-not-
    // checked-yet, default dark otherwise.
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  // Labels for the six stage pills in the sticky top bar, in stage-index
  // order (index 0 = "Spark" matches stage===0, etc.) — purely cosmetic,
  // but it's what gives the student the "you are here" breadcrumb.
  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ==========================================================================
  // STAGE 0 RENDERER — SPARK
  // Shows a single concrete prediction question BEFORE any teaching, so the
  // student forms a hypothesis first (predict-then-learn beats being told
  // the answer outright). Two phases inside one function: (1) the student
  // hasn't submitted yet → show the four guess options + a disabled-until-
  // picked submit button; (2) sparkSubmitted is true → reveal the real
  // answer plus a one-line takeaway, and a button advancing stage → 1 (Build).
  // ==========================================================================
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📦</div>
        <div style={s.h2}>Quick Prediction</div>
      </div>

      {/* The scenario itself, framed as plain text rather than a code block
          since it's a real-world action (deleting a folder), not code. */}
      <div style={{ ...s.line, color: "#e2e8f0" }}>
        Delete <code style={{ color: "#7dd3fc" }}>node_modules/</code>, keep <code style={{ color: "#7dd3fc" }}>package.json</code>.
      </div>
      <div style={{ ...s.line, color: "#f1f5f9", fontWeight: 700 }}>Does it still run right away?</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          {/* Grid of guess options — auto-fit + minmax keeps this readable
              on both a wide desktop and a narrow phone without us writing
              two separate layouts. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Yes, instantly — package.json already contains all the code",
              "No, never — deleting node_modules/ breaks the project permanently",
              "No, not until you run npm install again",
              "Yes, but only after reinstalling Node.js itself",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          {/* Submit is disabled (via the `disabled` attribute) until
              sparkGuess holds a truthy value — forces an actual pick before
              advancing, rather than letting the student skip the prediction. */}
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>real answer</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.0rem" }}>No, not until you run npm install again</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "No, not until you run npm install again" ? "🎯 Exactly right!" : "Not quite — here's why."}
          </div>
          <div style={s.line}>package.json only DESCRIBES needs; npm install rebuilds the real code.</div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // STAGE 1 RENDERER — BUILD
  // Renders a horizontally-scrollable strip of 8 concept "pills" (so the
  // student can jump to any concept directly, not just step forward
  // linearly) above one card showing the CURRENTLY selected concept: its
  // title, its ConceptAnimation (driven by the shared animFrame), the
  // Plain/Technical toggle, the matching explanation text, and either a
  // "Next: <upcoming title>" button (if more concepts remain) or a green
  // "I've got it!" button that advances to stage 2 (See It) once the
  // student has reached the final (8th) concept.
  // ==========================================================================
  const renderBuild = () => {
    // Compute the short label for the NEXT concept (if any) up front so the
    // JSX below stays simple — null when we're already on the last concept.
    const nextTitle = buildConcept < concepts.length - 1
      ? concepts[buildConcept + 1].title.split("—")[0].trim()
      : null;
    return (
      <div>
        {/* Horizontal concept-picker strip: overflowX:auto lets it scroll
            sideways on a phone instead of wrapping/breaking the layout.
            Clicking a pill jumps buildConcept directly to that index AND
            resets buildMode back to "plain" so every concept is first met
            in friendly language. */}
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
          {/* ConceptAnimation is a separate component (defined below, OUTSIDE
              this component) so React doesn't redefine it on every render —
              it receives just the current concept index and the shared
              animFrame counter, and derives its own visuals from those two
              numbers alone. */}
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
            {/* Ternary: if there's a next concept, advance buildConcept by 1
                (and reset to plain-English mode again); otherwise this IS
                the last concept, so the button instead moves the whole
                lesson forward to stage 2 (See It). */}
            {nextTitle
              ? <button style={s.btn()} onClick={() => { setBuildConcept(buildConcept + 1); setBuildMode("plain"); }}>Next: {nextTitle} →</button>
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
            <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 2 RENDERER — SEE IT
  // Walks through the 6 seeitSteps array one at a time: a code/command
  // snippet, a simulated terminal-style "result" line, and a narration
  // (Plain/Technical toggle, scoped to the CURRENT step only). "Next Step"
  // advances seeitStep; on the final step the button instead advances the
  // whole lesson to stage 3 (Try It). A "← Back" button appears once the
  // student isn't on the first step, letting them re-watch earlier steps.
  // ==========================================================================
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Building package.json &amp; a Module, Step by Step</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>{step.code}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* Simulated terminal/console output panel — black background,
            monospace, colored per-step via step.resultColor so e.g. a
            successful install glows green while an "undefined module"
            scenario (used elsewhere in Try-It) could glow red. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", margin: "0 0 12px", fontFamily: "'Cascadia Code','Consolas',monospace", textAlign: "center", whiteSpace: "pre-wrap" }}>
          <span style={{ color: step.resultColor, fontWeight: 700, fontSize: "0.86rem" }}>{step.result}</span>
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

  // ==========================================================================
  // STAGE 3 RENDERER — TRY IT
  // The student taps any of the 6 exprPresets buttons; we look up the
  // matching preset object (`active`) by comparing its `expr` string to
  // exprPicked, then render its simulated terminal output + explanatory
  // note. Every NEW (previously-unpicked) preset tapped increments
  // triedCount; once triedCount reaches 3, the "Take the Challenge" button
  // replaces the "try 3 first" reminder — gating progress behind genuine
  // exploration rather than a single click.
  // ==========================================================================
  const renderTryIt = () => {
    // .find() walks exprPresets looking for the one whose `expr` string
    // matches the currently clicked preset key; undefined until the
    // student has clicked at least one button.
    const active = exprPresets.find((p) => p.expr === exprPicked);
    // All our preset outputs here are textual strings (no numeric results
    // in this lesson, unlike Unit4_5's Promise values), so this always
    // resolves to the same cyan — kept as a function for parity with the
    // Unit4_5 pattern in case future numeric results are added later.
    const colorFor = (type) => (type === "number" ? "#4ade80" : "#7dd3fc");

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run Commands, Watch the Terminal</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {exprPresets.map((p) => (
            <button key={p.expr} onClick={() => {
              setExprPicked(p.expr);
              // Only bump triedCount the FIRST time this particular preset
              // is picked in this visit — re-clicking the same one shouldn't
              // inflate the counter and let the student "fake" 3 tries by
              // mashing one button.
              if (exprPicked !== p.expr) setTriedCount((c) => c + 1);
            }} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.66rem", fontWeight: 700, cursor: "pointer",
              background: exprPicked === p.expr ? "#38bdf8" : "#0f172a", color: exprPicked === p.expr ? "#0f172a" : "#7dd3fc",
            }}>{p.expr}</button>
          ))}
        </div>

        {/* Simulated terminal panel: shows a placeholder prompt until the
            student picks something, then the picked command, a down-arrow,
            and the simulated result text. whiteSpace:pre-wrap lets
            multi-line "result" strings (like npm install's output) render
            with their line breaks intact. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center", whiteSpace: "pre-wrap" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.68rem" }}>{active.expr}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: colorFor(active.resultType), fontWeight: 700, fontSize: "0.82rem" }}>{active.result}</div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "0.8rem" }}>Tap a command above ↑</div>
          )}
        </div>

        {active && (
          <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginTop: 12, textAlign: "center" }}>
            <div style={{ ...s.line, color: "#94a3b8", marginBottom: 0 }}>{active.note}</div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {/* Gate: stays a passive reminder text until triedCount hits 3,
              then swaps to the real "advance the lesson" button. */}
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 commands to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 4 RENDERER — CHALLENGE
  // Two mini-games shown one at a time, switched by challengePhase:
  //   phase 0 → TagMatch (term ↔ meaning) using ch1Pairs; once the TagMatch
  //             component reports completion via onDone, ch1Done flips true
  //             and a "Next Challenge →" button appears to move to phase 1.
  //   phase 1 → BugHunt (spot the missing module.exports line) using
  //             bugLines/bugHints; once BugHunt reports completion via
  //             onDone, ch2Done flips true and a "Final Quiz →" button
  //             appears that advances the WHOLE lesson to stage 5 (Quiz).
  // Both TagMatch and BugHunt are generic, reusable components defined
  // below (outside this component) — they don't know anything about npm
  // specifically, they just operate on whatever pairs/lines/hints arrays
  // we hand them as props.
  // ==========================================================================
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Match Term → Meaning</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Spot the Missing Export</div>
          <div style={{ ...s.line, marginBottom: 14 }}>One file forgot a line we covered in Build. Tap the buggy line.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // STAGE 5 RENDERER — QUIZ
  // Two very different return paths inside one function:
  //   (a) quizDone === true → render the ONE-TIME completion screen. This
  //       is the ONLY place in the entire file that calls onUnitComplete(),
  //       and it does so from a real onClick handler on a real button —
  //       never automatically, satisfying the house rule that burned a
  //       previous lesson (see Unit1_1_template.jsx header comment). The
  //       completion text explicitly says "on to Express.js Basics" and
  //       NEVER claims Module 5 itself is complete, since this is only
  //       unit 3 of 5 in that module.
  //   (b) otherwise → render the current question (quizQuestions[quizQ]),
  //       its options, and — depending on quizFeedback — either an
  //       escalating hint block (wrong) or the explanation block (correct).
  //       hintIndex clamps so repeated wrong attempts never index past the
  //       end of that question's hints array (we just keep showing the
  //       LAST, most-specific hint instead of crashing).
  // ==========================================================================
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>🏆</div>
          {/* UNIT-level completion language only — Module 5 still has
              Express.js Basics, plus two further units, ahead of this one. */}
          <div style={s.h2}>Unit 5.3 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>
            {student?.name ? `Nice work, ${student.name}!` : "Nice work!"} On to Express.js Basics next.
          </div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What npm is and why it's bundled with Node",
              "package.json as a project's manifest",
              "npm install, dependencies vs devDependencies",
              "Why node_modules/ exists and is usually gitignored",
              "module.exports & require() — CommonJS modules",
              "Built-in modules (fs, http, path) vs third-party modules",
              "npm run / npm start custom scripts",
              "Reading basic semver (MAJOR.MINOR.PATCH, ^ and ~)",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* THE single onUnitComplete() call site in this whole file.
              Optional-chaining (?.()) guards against App.jsx ever forgetting
              to pass the prop, without throwing if it's undefined. */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete?.(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
    // Clamp so e.g. a 5th wrong attempt on a question with only 3 hints
    // just keeps re-showing hints[2] (the last, most specific one) instead
    // of indexing out of bounds.
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
            // Clicking an option is only allowed when there's no feedback
            // yet, OR the previous feedback was "wrong" (letting the
            // student pick a different option to retry) — once feedback is
            // "correct" the options become inert until "Next Question".
            <div key={i} style={s.quizOption(isSelected, isCorrect, isWrong)} onClick={() => { if (!quizFeedback || quizFeedback === "wrong") { setQuizSelected(i); setQuizFeedback(null); } }}>
              {opt}
            </div>
          );
        })}
        {/* Wrong-answer hint block — per house rule 6, this NEVER contains
            the correct option's text, only an escalating nudge. */}
        {quizFeedback === "wrong" && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
            <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{q.hints[hintIndex]}</div>
          </div>
        )}
        {/* Correct-answer explanation block — the actual teaching payoff,
            shown ONLY after a correct pick. */}
        {quizFeedback === "correct" && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✅ Correct!</div>
            <div style={{ color: "#86efac", fontSize: "0.82rem" }}>{q.explanation}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {/* "Check Answer" button — disabled until something is selected;
              on click, either flips feedback to "correct" (leaving
              quizSelected as-is so the green highlight has something to
              point at) or to "wrong" (incrementing quizAttempts AND
              clearing quizSelected so the student must actively pick again
              rather than just re-clicking Check on the same wrong option). */}
          {quizFeedback !== "correct" && (
            <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
              if (quizSelected === q.answer) { setQuizFeedback("correct"); }
              else { setQuizAttempts((a) => a + 1); setQuizFeedback("wrong"); setQuizSelected(null); }
            }}>Check Answer</button>
          )}
          {/* "Next Question" / "Finish Quiz" button — only shown once
              feedback is "correct". Advances quizQ and resets all
              per-question state (selected/feedback/attempts) for the next
              question, UNLESS this was the last question, in which case it
              flips quizDone to true instead, swapping this whole renderer
              over to the completion-screen branch above on the next render. */}
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

  // ==========================================================================
  // TOP-LEVEL RENDER — the component's actual return value. Renders the
  // sticky top bar (title + stage pills) ALWAYS, then conditionally renders
  // exactly one of the six stage renderers based on `stage`'s current
  // value. A small welcome line only shows on stage 0 (Spark), personalized
  // with the student's name when App.jsx supplied one. App.jsx itself
  // overlays a floating "← Dashboard" button above every lesson, so this
  // file intentionally does NOT render its own back-navigation control.
  // ==========================================================================
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 5.3 — npm &amp; Modules</div>
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
      {/* Tiny media query mirroring Unit4_5.jsx's mobile safety net — shrinks
          the top-bar title further on very small phone screens so it never
          forces the stage pills to wrap onto a third line. */}
      <style>{`
        @media (max-width: 420px) {
          .unit-topbar-title { font-size: 0.74rem !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// CONCEPT ANIMATIONS — one hand-rolled illustration per Build-stage concept.
// Defined OUTSIDE Unit5_3 (a sibling function, not a nested one) so React
// never recreates this component's function identity on every parent
// re-render — it's a pure, stateless function of its two props:
//   index → which of the 8 concepts (0..7) is currently selected in Build,
//           matching the position of that concept inside the `concepts`
//           array above.
//   frame → the shared looping counter (0..59) ticking every 100ms while
//           stage is Build or See-It, driven by the useEffect/setInterval
//           pair inside Unit5_3 above. Every branch below derives its own
//           "pos" (a 0..1 fraction of one loop) from this frame number, so
//           the same numeric input produces smoothly animated, repeating
//           visuals using nothing but plain inline style values — no CSS
//           keyframes file, no animation library.
// ============================================================================
function ConceptAnimation({ index, frame }) {
  // `pos` = how far through ONE 40-tick loop we currently are, as a 0..1
  // fraction. Re-using `frame % 40` (rather than the full 0..59 range)
  // gives each animation a slightly different loop length feel across
  // concepts while still being driven by the one shared counter.
  const pos = (frame % 40) / 40;
  // `base` is the shared centering wrapper every animation branch below
  // renders into, so each one only needs to describe its OWN inner content.
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — What Is npm: a single download icon "pulling" a package down from
  // a cloud/registry into a box, looping forward then resetting.
  if (index === 0) {
    const dropped = pos > 0.5;
    // Extra element: a small counter badge that ticks up once the package
    // "lands", visually saying "your project just gained a dependency"
    // instead of needing another caption to explain that.
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "1.3rem" }}>☁️</div>
          <div style={{ fontSize: "1rem", color: dropped ? "#4ade80" : "#475569", transition: "color 0.2s" }}>{dropped ? "⬇" : "⋮"}</div>
          <div style={{ width: 40, height: 26, border: `2px solid ${dropped ? "#4ade80" : "#334155"}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: dropped ? "#4ade80" : "#64748b" }}>{dropped ? "📦" : ""}</div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>npm registry → your project</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: dropped ? "#4ade80" : "#334155", transition: "color 0.2s" }}>{dropped ? "packages: 1 ✅" : "packages: 0"}</div>
        </div>
      </div>
    );
  }

  // 1 — package.json: a document icon "filling in" its fields one at a
  // time (name → version → dependencies → scripts) as pos advances.
  if (index === 1) {
    const fieldsShown = Math.floor(pos * 4); // 0..3, how many fields are lit
    const fields = ["name", "version", "dependencies", "scripts"];
    return (
      <div style={base}>
        <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.62rem" }}>
          <div style={{ color: "#64748b", marginBottom: 4 }}>package.json</div>
          {fields.map((f, i) => (
            <div key={f} style={{ color: fieldsShown > i ? "#4ade80" : "#334155", transition: "color 0.2s" }}>"{f}": ...</div>
          ))}
        </div>
      </div>
    );
  }

  // 2 — npm install: a package name flying from "registry" into a
  // node_modules/ box, while a tiny package.json gains a dependencies line.
  if (index === 2) {
    const arrived = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontFamily: "monospace" }}>npm install</div>
          {arrow}
          <div style={{ border: arrived ? "2px solid #4ade80" : "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: "0.6rem", color: arrived ? "#4ade80" : "#64748b" }}>node_modules/</div>
          {arrow}
          <div style={{ fontSize: "0.6rem", color: arrived ? "#4ade80" : "#475569" }}>{arrived ? "+dependency ✅" : "..."}</div>
        </div>
      </div>
    );
  }

  // 3 — node_modules/: a folder bulging with package boxes — illustrates
  // "it's big and full of installed code", with a little .gitignore tag
  // fading in to reinforce "usually excluded from git".
  if (index === 3) {
    const gitignored = pos > 0.55;
    // Extra element: the boxes themselves now light up one-by-one as `pos`
    // advances (instead of sitting static), so the folder visibly "fills
    // up" with packages before the .gitignore label appears — two beats of
    // motion instead of one.
    const filled = Math.floor(pos * 4) + 1; // 1..4 boxes lit
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: "1.3rem" }}>🗂️</div>
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 10, height: 10, background: i < filled ? "#38bdf8" : "#334155", borderRadius: 2, transition: "background 0.2s" }} />)}
          </div>
          <div style={{ fontSize: "0.58rem", color: gitignored ? "#fb923c" : "#475569", fontFamily: "monospace", transition: "color 0.2s" }}>{gitignored ? ".gitignore'd 🚫" : "node_modules/"}</div>
        </div>
      </div>
    );
  }

  // 4 — module.exports & require: one file box "sending" its export to a
  // second file box via an arrow, illustrating the export → import pairing.
  if (index === 4) {
    const sent = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", fontSize: "0.6rem", fontFamily: "monospace", color: "#94a3b8" }}>math.js<br/>module.exports</div>
          <div style={{ fontSize: "0.95rem", color: sent ? "#38bdf8" : "#475569", transition: "color 0.2s" }}>{sent ? "⟹" : "→"}</div>
          <div style={{ border: sent ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 6, padding: "8px 10px", fontSize: "0.6rem", fontFamily: "monospace", color: sent ? "#38bdf8" : "#64748b" }}>app.js<br/>require(...)</div>
        </div>
      </div>
    );
  }

  // 5 — Built-in vs third-party: two side-by-side paths — one straight
  // from Node to your code (no install icon), one routed through a cloud
  // (npm registry) requiring a download step first.
  if (index === 5) {
    const thirdPartyArrived = pos > 0.6;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6rem" }}>
            <span style={{ color: "#4ade80" }}>Node</span><span style={{ color: "#475569" }}>→</span><span style={{ color: "#4ade80", fontFamily: "monospace" }}>require('fs')</span><span style={{ color: "#4ade80" }}>✅ instant</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6rem" }}>
            <span style={{ color: "#94a3b8" }}>☁️ npm</span>
            <span style={{ color: thirdPartyArrived ? "#38bdf8" : "#475569" }}>→</span>
            <span style={{ color: thirdPartyArrived ? "#38bdf8" : "#475569", fontFamily: "monospace" }}>require('express')</span>
            <span style={{ color: thirdPartyArrived ? "#38bdf8" : "#475569" }}>{thirdPartyArrived ? "✅ after install" : "⏳"}</span>
          </div>
        </div>
      </div>
    );
  }

  // 6 — npm run scripts: a "scripts" field entry lighting up, then an
  // arrow firing off to a little terminal-prompt icon to show it actually
  // running the underlying shell command.
  if (index === 6) {
    const running = pos > 0.5;
    // Extra element: a tiny terminal-output line that only appears once
    // "running" is true, giving the arrow's destination an actual payoff
    // (the script's effect) instead of just changing color.
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: "0.6rem", fontFamily: "monospace", color: "#94a3b8" }}>"start": "node app.js"</div>
            <div style={{ fontSize: "0.9rem", color: running ? "#4ade80" : "#475569" }}>{running ? "▶" : "→"}</div>
            <div style={{ border: running ? "2px solid #4ade80" : "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: "0.6rem", fontFamily: "monospace", color: running ? "#4ade80" : "#64748b" }}>$ npm start</div>
          </div>
          <div style={{ fontSize: "0.58rem", fontFamily: "monospace", color: "#4ade80", opacity: running ? 1 : 0, transition: "opacity 0.2s" }}>→ server running ✅</div>
        </div>
      </div>
    );
  }

  // 7 — Semver: a version number's three segments lighting up one at a
  // time (MAJOR, then MINOR, then PATCH) to visually separate the triple.
  const seg = Math.floor(pos * 3) % 3; // 0=MAJOR,1=MINOR,2=PATCH highlighted
  const labels = ["MAJOR", "MINOR", "PATCH"];
  return (
    <div style={base}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ fontFamily: "monospace", fontSize: "1rem", display: "flex", gap: 2 }}>
          <span style={{ color: seg === 0 ? "#fb923c" : "#94a3b8", fontWeight: seg === 0 ? 800 : 400 }}>4</span>
          <span style={{ color: "#475569" }}>.</span>
          <span style={{ color: seg === 1 ? "#fb923c" : "#94a3b8", fontWeight: seg === 1 ? 800 : 400 }}>18</span>
          <span style={{ color: "#475569" }}>.</span>
          <span style={{ color: seg === 2 ? "#fb923c" : "#94a3b8", fontWeight: seg === 2 ? 800 : 400 }}>2</span>
        </div>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#fb923c" }}>{labels[seg]} segment highlighted</div>
        {/* Extra element: a small ^ / ~ caret indicator cycling alongside
            the segment highlight, hinting at "this is the part a version
            range symbol controls" without spelling it out in prose. */}
        <div style={{ fontSize: "0.56rem", color: "#64748b", fontFamily: "monospace" }}>
          {seg === 0 ? "locked by both ^ and ~" : "free to update"}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAG MATCH — generic tap-to-match mini-game used by the Challenge stage.
// Receives `pairs` (array of {code, meaning, hint}) and an `onDone`
// callback fired exactly once, the instant every pair has been correctly
// matched. Completely content-agnostic: this same component is reused
// verbatim (down to styling) across every lesson in the course, including
// Unit4_5.jsx — only the `pairs` data passed in differs.
//
// Internal state:
//   matched      → { [code]: meaning } map of pairs already solved.
//   selected     → the currently "armed" tap — either a code or a meaning
//                  the student tapped first, waiting for its counterpart.
//   flashWrong   → which meaning string to briefly flash red after an
//                  incorrect match attempt (auto-clears via setTimeout).
//   hintMsg      → the explanatory hint string to show after a wrong tap;
//                  cleared as soon as a fresh code is tapped.
//   shuffledMeanings → the right-hand column's pairs in randomized order,
//                  computed ONCE via useRef (so it doesn't re-shuffle on
//                  every re-render, which would be disorienting mid-match).
// ============================================================================
function TagMatch({ pairs, onDone }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [flashWrong, setFlashWrong] = useState(null);
  const [hintMsg, setHintMsg] = useState(null);
  // useRef(...).current pattern: the sort() runs exactly once on first
  // render (the initializer passed to useRef only matters the first time),
  // giving a STABLE shuffled order for the lifetime of this component
  // instance, instead of re-shuffling and disorienting the student every
  // time React re-renders this component.
  const shuffledMeanings = useRef([...pairs].sort(() => Math.random() - 0.5)).current;

  // Tapping a CODE term: if it's not already matched, arm it as the
  // "selected" half waiting for its meaning counterpart, and clear any
  // stale hint message from a previous wrong attempt.
  const handleCode = (code) => { if (!matched[code]) { setSelected({ type: "code", value: code }); setHintMsg(null); } };

  // Tapping a MEANING term: behavior depends on whether a code is
  // currently armed (selected.type === "code"):
  //   - if armed, look up whether that code's real meaning matches what
  //     was just tapped. If yes: record the match, clear selection/hint,
  //     and if that was the LAST remaining pair, fire onDone() once.
  //     If no: flash this meaning red briefly, show that pair's hint
  //     string, and clear the selection after the flash so the student
  //     must re-tap a code to try again.
  //   - if NOT armed (no code tapped yet), simply arm this meaning as the
  //     selected half instead (lets the student start from either column).
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
        setHintMsg(pair?.hint || "Not quite — look at the term again.");
        setTimeout(() => { setFlashWrong(null); setSelected(null); }, 700);
      }
    } else {
      setSelected({ type: "meaning", value: meaning });
    }
  };

  return (
    <div>
      {/* Two-column layout: CODE terms on the left, shuffled BEHAVIOR/
          meaning strings on the right. flexWrap + flex:"1 1 140px" lets
          the columns stack on very narrow phones instead of squeezing. */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 140px" }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>TERM</div>
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
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>MEANING</div>
          {shuffledMeanings.map((p) => {
            // isUsed: true once THIS meaning string has already been
            // successfully matched to some code (locks it from further taps).
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
      {/* Hint banner — only appears right after a wrong tap, and shows the
          SPECIFIC hint tied to the pair the student was actually trying to
          match (never the generic "wrong" message alone) — per house rule
          that every wrong tap teaches something. */}
      {hintMsg && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
          <span style={{ color: "#fde68a", fontSize: "0.78rem" }}>💡 {hintMsg}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BUG HUNT — generic "tap the buggy line" mini-game used by the Challenge
// stage's second phase. Receives `lines` (array of {text, buggy, why?}),
// a `hints` array (escalating, generic-enough hint strings shown BEFORE the
// bug is found), and `onDone`, fired exactly once the instant the student
// taps the line marked buggy: true.
//
// Internal state:
//   revealed       → flips true the moment the correct (buggy) line is
//                    tapped; freezes further taps and reveals the "why"
//                    explanation for that specific bug.
//   wrongTap       → index of whichever non-buggy line was JUST tapped,
//                    used to briefly flash that single row red (auto-clears
//                    via setTimeout so it's a momentary flash, not a
//                    permanent red highlight).
//   wrongAttempts  → total count of wrong taps so far (across ALL lines),
//                    used to pick which entry of the `hints` array to show
//                    — clamped the same way the Quiz hints are, so it never
//                    indexes past the end of a short hints array.
// ============================================================================
function BugHunt({ lines, hints, onDone }) {
  const [revealed, setRevealed] = useState(false);
  const [wrongTap, setWrongTap] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // Tap handler for any line: does nothing once the bug is already found
  // (revealed === true). If the tapped line IS the buggy one, lock in the
  // reveal and fire onDone() exactly once. Otherwise, flash that specific
  // wrong line red for 600ms and bump the wrong-attempt counter (which
  // drives the escalating hint shown below).
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
      {/* Escalating hint banner — shown only while NOT yet revealed and
          only after at least one wrong tap. Per house rule, the hint never
          names the bug outright; it only narrows the search. */}
      {!revealed && wrongAttempts > 0 && hints?.length > 0 && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{hints[hintIndex]}</div>
        </div>
      )}
      {/* Final "Found it!" explanation — appears only once revealed,
          pulling the specific `why` string off whichever line object had
          buggy: true. This is the actual teaching payoff of the mini-game. */}
      {revealed && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>Found it!</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{lines.find((l) => l.buggy)?.why}</div>
        </div>
      )}
    </div>
  );
}
