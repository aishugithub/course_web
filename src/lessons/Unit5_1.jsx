// ============================================================================
//  UNIT 5.1 — "What is Node.js?"
//  Module: M5 — Node.js & Backend (FIRST unit of this module — 5 units total
//  in M5; this file only ever claims "Unit 5.1 complete", never "Module 5
//  complete", because Units 5.2 through 5.5 still lie ahead.)
//
//  WHERE THIS FILE FITS IN THE APP (read this before touching anything):
//  - src/shell/App.jsx is the single "traffic controller" component for the
//    whole course. It keeps a `currentUnitId` (something like "Unit5_1") in
//    its own state, looks that id up inside config/course.config.js (a big
//    table that maps every unit id to a human title, its module, and which
//    React component file implements it), and then does:
//        <Unit5_1 student={studentObject} onUnitComplete={handleComplete} />
//  - `student` is a plain read-only object — shape is roughly
//    { rollNo, name, batch } — handed down so this lesson can say "Nice
//    work, <name>" without this file ever needing to know HOW that object
//    was fetched. Fetching/auth/network all happens upstream, in App.jsx
//    and api.js — never inside a lesson file like this one.
//  - `onUnitComplete` is a callback handed down BY App.jsx. App.jsx's own
//    implementation of that callback is the thing that talks to api.js /
//    gas.config.js (Google Apps Script backend) to persist "this student
//    finished Unit5_1" and then route the student back to the Dashboard,
//    typically advancing them to Unit5_2. THIS FILE NEVER IMPORTS api.js
//    OR gas.config.js — lessons are offline, pure-UI React components.
//    All this file does is CALL `onUnitComplete()` — a bare function call,
//    no arguments — and exactly once, from one real onClick handler that
//    lives on the Quiz stage's final "Mark Complete & Continue" button.
//    It is never invoked from a useEffect, never invoked automatically on
//    mount, and never invoked more than once — see Unit1_1_template.jsx's
//    Rule 3 for the war story about why that specific mistake once broke
//    the whole app's Rules-of-Hooks contract and stranded students.
//
//  HOUSE STYLE THIS FILE COPIES VERBATIM FROM Unit4_5.jsx / the template:
//  - The exact same six-stage pedagogical shape, in the exact same order,
//    on every single lesson in this entire course, so a student never has
//    to re-learn "how do I use this screen" between units:
//        Stage 0  SPARK     — one curiosity/prediction question, asked
//                              BEFORE any teaching happens at all.
//        Stage 1  BUILD     — concept-by-concept teaching. Each concept is
//                              a {title, plain, technical} object, paired
//                              with a small hand-rolled CSS animation
//                              (ConceptAnimation) and a Plain⇄Technical
//                              toggle, plus a horizontally-scrollable strip
//                              of concept "pills" so students can jump
//                              around instead of being forced linear.
//        Stage 2  SEE IT    — a slower, step-by-step worked walkthrough:
//                              one code/terminal snippet + its result +
//                              an explanation per step, clicked through.
//        Stage 3  TRY IT    — a SIMULATED hands-on sandbox (no real Node
//                              process runs anywhere — this is a browser
//                              tab, there is no terminal underneath it!
//                              instead we fake a terminal: clicking a
//                              preset command renders pre-written fake
//                              output text that LOOKS like a real
//                              terminal/REPL session).
//        Stage 4  CHALLENGE — two back-to-back mini-games: a TagMatch
//                              (tap a term, tap its meaning) and a
//                              BugHunt (tap the one line that's wrong),
//                              both of which show an escalating textual
//                              hint on every wrong tap, never staying
//                              silent about a mistake.
//        Stage 5  QUIZ      — 12 multiple-choice questions. Every wrong
//                              answer is met with an escalating hint
//                              (hints[] array, indexed by
//                              Math.min(attempts-1, hints.length-1)) that
//                              NEVER prints the correct option's text —
//                              it only nudges the student's reasoning.
//                              A correct answer shows a fixed `explanation`
//                              string reinforcing WHY it's right. The very
//                              last screen (after question 12) is the
//                              completion screen, and ITS button is the
//                              one and only call site for onUnitComplete().
//  - The exact same shared inline-style object, named `s`, reused by every
//    stage renderer below — same color palette (dark navy background,
//    sky-blue #38bdf8 accents, green #4ade80 for "correct/done", red
//    #ef4444 for "wrong/buggy", amber #fbbf24/#fde68a for hint boxes) so
//    that visually this unit feels like the same app as every other unit,
//    not a one-off page that happens to teach different content.
//  - Mobile-first sizing throughout: every width is a %, a flexWrap, or a
//    clamp()/minmax() expression — there is intentionally NOT ONE fixed
//    pixel width anywhere that could force horizontal scrolling on a
//    narrow phone screen, because this course is used on phones in class.
//
//  CONTENT TAUGHT IN THIS SPECIFIC UNIT (Build-stage concepts, 8 total):
//    1. JS used to be "browser-only" — Node breaks JS out of the browser.
//    2. Node = the V8 engine (the same engine inside Chrome) running
//       standalone, outside any browser, as a normal program on your OS.
//    3. Browser JS has window/document (the DOM) — Node JS does NOT; it
//       instead exposes built-in modules like fs, http, path, process.
//    4. Node's concurrency model: single-threaded, non-blocking, powered
//       by an event loop — it never just sits and waits for slow I/O.
//    5. What Node is actually used for in the real world: web
//       servers/APIs, CLI tools, build tooling (webpack/vite run on
//       Node), real-time apps (chat, live dashboards).
//    6. npm ships bundled with Node — a teaser for the full npm lesson
//       coming in Unit5_3 ("npm & Modules"); we deliberately do NOT teach
//       npm deeply here, just enough that the term isn't a total stranger.
//    7. Running a file with Node: `node app.js` from a terminal, and how
//       that's different from opening an .html file in a browser.
//    8. console.log() inside Node prints to the TERMINAL, not to any
//       browser DevTools console — a very common beginner mix-up.
//
//  EXTRA COMMENT DENSITY NOTE (per this project's global CLAUDE.md house
//  rule): this file intentionally carries MORE inline commentary per line
//  than Unit4_5.jsx does. Nearly every state declaration, render function,
//  and non-trivial JSX block below has its own explanatory comment, not
//  just a label — explaining both WHAT the line does and WHY it exists /
//  how it threads into the six-stage flow and into App.jsx's contract.
// ============================================================================

// React's three hooks this file needs: useState for all interactive stage
// state, useEffect to drive the looping CSS animation's frame counter, and
// useRef to hold the interval ID for that animation loop (so we can clear
// it on cleanup without it being reactive state itself).
import { useState, useEffect, useRef } from "react";

export default function Unit5_1({ student, onUnitComplete }) {
  // ==========================================================================
  // ALL HOOKS LIVE HERE, UNCONDITIONALLY, AT THE TOP, IN A FIXED ORDER.
  // Per the template's Rule 3: React's Rules of Hooks require every hook to
  // run on every render, in the same order, no matter what `stage` currently
  // is. None of these are ever wrapped in an `if`, a loop, or placed after
  // an early return — gating happens with plain `if` statements INSIDE each
  // stage's render function, never around the hook declarations themselves.
  // ==========================================================================

  // -- MASTER FLOW STATE -----------------------------------------------------
  // `stage` is the single source of truth for "which of the six big screens
  // is currently visible". 0=Spark, 1=Build, 2=SeeIt, 3=TryIt, 4=Challenge,
  // 5=Quiz. The top bar's stage-pill row (rendered at the very bottom of this
  // file) reads this same value to highlight/checkmark each pill, so the
  // pills and the actual visible content can never drift out of sync.
  const [stage, setStage] = useState(0);

  // -- SPARK STAGE STATE ------------------------------------------------------
  // sparkGuess: which of the four prediction options the student has tapped
  // so far (string, or null before any tap). sparkSubmitted: flips to true
  // once they lock in their guess by pressing "Submit My Guess" — this swaps
  // the UI from "pick an option" mode into "here's the reveal" mode. Both
  // reset to their initial values automatically whenever this component is
  // freshly mounted (i.e. whenever a student opens this exact unit), because
  // useState's initial value is only ever used on first mount.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // -- BUILD STAGE STATE ------------------------------------------------------
  // buildConcept: an index into the `concepts` array below — which of the
  // 8 Build-stage concepts is currently on screen. Driven both by the
  // horizontally-scrollable concept-picker strip (tap any pill to jump
  // straight to that concept) AND by the "Next: <title> →" button that
  // advances it by exactly 1 each press.
  const [buildConcept, setBuildConcept] = useState(0);
  // buildMode: "plain" or "tech" — which half of each concept's explanation
  // (the {plain, technical} pair) is currently rendered. Reset to "plain"
  // every time the student switches concepts, so they always land on the
  // friendlier explanation first and have to deliberately opt into jargon.
  const [buildMode, setBuildMode] = useState("plain");

  // -- SEE IT STAGE STATE -------------------------------------------------
  // seeitStep: index into the seeitSteps array — which step of the guided,
  // step-by-step walkthrough is currently shown. seeitMode mirrors
  // buildMode's plain/technical toggle, but is tracked completely
  // separately so toggling explanation style in Build doesn't leak into
  // (or get reset by) the See It stage, and vice versa.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // -- TRY IT STAGE STATE ---------------------------------------------------
  // cmdPicked: the exact command string (matching one entry in
  // `commandPresets` below) that the student last tapped — drives which
  // simulated terminal output block is currently displayed. triedCount:
  // a running count of *distinct* commands tried so far, used purely as a
  // gate — the "Take the Challenge" button stays disabled/hidden until
  // this reaches 3, per this unit's "try at least 3" requirement.
  const [cmdPicked, setCmdPicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0);

  // -- CHALLENGE STAGE STATE -------------------------------------------------
  // challengePhase: 0 = the TagMatch mini-game is showing, 1 = the BugHunt
  // mini-game is showing. ch1Done / ch2Done: flip to true the moment each
  // respective mini-game's onDone callback fires (i.e. the student has
  // successfully matched every pair / found the one buggy line) — these
  // gate the "Next Challenge →" and "Final Quiz →" buttons so a student
  // can't skip past a mini-game without actually finishing it.
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // -- QUIZ STAGE STATE -------------------------------------------------------
  // quizQ: index of the current question (0..11, since there are 12).
  // quizSelected: which option index the student currently has highlighted
  // (resets to null between questions and after every wrong attempt, so
  // they must actively re-pick before re-checking). quizFeedback: null
  // (nothing checked yet) | "correct" | "wrong" — drives both the option
  // tile coloring (via s.quizOption) and which message box renders below
  // the options. quizAttempts: how many WRONG attempts on the CURRENT
  // question only — resets to 0 every time a new question loads — this is
  // the index that picks which escalating hint string to show (see Rule 6
  // in the template: hints must escalate, never reveal the answer, and per
  // this project's CLAUDE.md a hint must show even on the 3rd+ wrong try,
  // which Math.min(...) below guarantees by clamping to the last hint).
  // quizDone: flips true once the student has answered all 12 correctly —
  // swaps the Quiz stage's render into the final completion screen, whose
  // button is the ONLY place in this entire file that calls
  // onUnitComplete().
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // -- LOOPING ANIMATION FRAME STATE ------------------------------------------
  // animRef: holds the setInterval ID returned when the animation loop
  // starts, stored in a ref (not state) because the ID itself is never
  // rendered — we only need it later to clearInterval() on cleanup, and refs
  // don't trigger re-renders when written to (which would be wasteful here).
  // animFrame: state because it DOES need to trigger re-renders — every
  // time it changes, ConceptAnimation (used in both Build and See It) gets
  // re-invoked with a new `frame` number and recomputes its animated
  // positions, producing the illusion of smooth motion out of plain CSS.
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ==========================================================================
  // CONTENT: eight Build-stage concepts.
  // Each object's `title` appears on its concept-picker pill (truncated to
  // before any "—") and atop its card; `plain` is the friendly one-liner
  // shown by default; `technical` is the jargon-correct version shown only
  // once the student taps the "🔬 Technical" toggle. ConceptAnimation(index)
  // below has one matching `if (index === N)` block per concept, in the
  // exact same order as this array, so concept #0 here always pairs with
  // the `if (index === 0)` animation, concept #1 with `if (index === 1)`,
  // and so on — keep these two lists in lockstep if you ever edit one.
  // ==========================================================================
  const concepts = [
    {
      title: "JS Escapes the Browser",
      plain: "Node lets the same JavaScript run outside the browser too.",
      technical: "Node.js runs .js files as standalone OS processes, no browser needed.",
    },
    {
      title: "Node = V8, Unplugged",
      plain: "Node is just Chrome's V8 engine, running on its own.",
      technical: "Node embeds V8 (C++) plus its own bindings for OS-level access.",
    },
    {
      title: "No window, No document",
      plain: "No webpage means no window/document — Node gives fs, http, path instead.",
      technical: "Browser DOM globals don't exist in Node; core modules replace them.",
    },
    {
      title: "Single-Threaded, Never Blocked",
      plain: "One thread, but slow tasks never freeze it — Node just moves on.",
      technical: "Single thread + non-blocking I/O via the event loop, no synchronous waits.",
    },
    {
      title: "What People Actually Build",
      plain: "Servers, CLI tools, build tooling, and real-time apps all run on Node.",
      technical: "Common Node uses: HTTP APIs, CLIs, bundlers (webpack/Vite), WebSocket apps.",
    },
    {
      title: "npm Rides Along (Teaser)",
      plain: "npm comes free with Node — your gateway to ready-made code.",
      technical: "npm bundles with Node; manages packages via package.json. Deep dive in 5.3.",
    },
    {
      title: "Actually Running a File",
      plain: "Type `node app.js` in a terminal — that's how you run it.",
      technical: "`node <file>.js` spawns a process that executes the file as entry point.",
    },
    {
      title: "console.log Has a New Home",
      plain: "No browser means console.log() prints to the terminal instead.",
      technical: "console.log writes to stdout — the terminal, not a DevTools panel.",
    },
  ];

  // ==========================================================================
  // CONTENT: Quiz bank — 12 questions, each with an escalating hints[]
  // array (2-3 hints) that nudges reasoning WITHOUT ever stating the correct
  // option's text, plus an `explanation` shown only after a correct answer.
  // Order roughly follows the Build concepts above: what Node is → V8 →
  // event loop/non-blocking → browser-vs-Node globals → what people build →
  // npm's role → how to run a file → console.log location, then a couple of
  // questions that mix ideas together to check real understanding.
  // ==========================================================================
  const quizQuestions = [
    {
      q: "In one sentence: what IS Node.js?",
      options: [
        "A new programming language that replaces JavaScript",
        "A JavaScript runtime that lets JS run outside a browser, e.g. on a server",
        "A web browser made specifically for developers",
        "A database system for storing JSON",
      ],
      answer: 1,
      hints: [
        "Node does not introduce new syntax or a new language — the JS you already know stays exactly the same.",
        "Think about WHERE the code runs, not what the code looks like.",
        "Node takes the language you already know and gives it a place to run beyond just a browser tab — servers, your laptop, a terminal.",
      ],
      explanation: "Node.js is a JavaScript runtime — it executes ordinary JavaScript code outside any browser, most commonly on servers, in CLI tools, or as local build tooling.",
    },
    {
      q: "Node.js is built around which browser engine, running outside the browser?",
      options: ["SpiderMonkey", "V8", "JavaScriptCore", "Chakra"],
      answer: 1,
      hints: [
        "This is the SAME engine Google's own browser uses to run JavaScript.",
        "Its name is a single capital letter followed by a digit.",
        "Node embeds V8 — the engine inside Google Chrome — and runs it as a standalone program, no browser required.",
      ],
      explanation: "Node.js embeds Google's V8 engine (the same one that powers Chrome) and wraps it with extra capabilities so it can run standalone, outside any browser.",
    },
    {
      q: "Which best describes Node's concurrency model for handling something slow, like reading a large file?",
      options: [
        "Node spins up a brand-new thread for every single operation, no matter how small",
        "Node freezes everything and waits synchronously until the slow operation finishes",
        "Node is single-threaded and non-blocking — it moves on to other work and comes back via a callback/Promise once the slow operation finishes",
        "Node cannot handle slow I/O operations at all",
      ],
      answer: 2,
      hints: [
        "The keyword from this unit was 'event loop' — what does an event loop let you AVOID doing?",
        "Node does NOT freeze on a slow file read or network call — that's the whole point of this design.",
        "Single thread, but never blocked: Node kicks off the slow task, keeps running other code, and gets notified later (callback/Promise) once that task is done.",
      ],
      explanation: "Node uses a single main thread with a non-blocking, event-loop-driven model: slow I/O is delegated, the thread keeps working on other things, and a callback or Promise reports back once the result is ready.",
    },
    {
      q: "Which of these exists in browser JavaScript but does NOT exist in Node.js?",
      options: ["fs (filesystem module)", "process", "document (the DOM)", "http"],
      answer: 2,
      hints: [
        "Three of these four are Node-specific tools for talking to files, the OS, or the network.",
        "The odd one out is something a webpage needs that has nothing to do with files, servers, or the OS.",
        "document represents the webpage's DOM — and Node has no webpage and no DOM, so document simply isn't there.",
      ],
      explanation: "Node has no browser and no DOM, so window/document don't exist in it. Instead Node ships its own built-in modules like fs, http, path, and process.",
    },
    {
      q: "Which of these is something Node.js gives you that a browser environment does NOT?",
      options: [
        "Access to the filesystem via the fs module",
        "The window object",
        "A DOM you can query with document.querySelector",
        "alert() popups",
      ],
      answer: 0,
      hints: [
        "Browsers sandbox JS away from your computer's actual files, for safety reasons.",
        "Node, with no sandbox like that, can directly read and write files on disk.",
        "fs (the filesystem module) lets Node read/write real files on disk — something a browser deliberately blocks JS from doing directly.",
      ],
      explanation: "Browsers heavily sandbox JS away from the local filesystem for security. Node has no such sandbox, so it exposes fs for direct file reading/writing.",
    },
    {
      q: "Which of these is a realistic, common thing people build WITH Node.js?",
      options: [
        "A backend API/web server that a frontend app talks to",
        "A new CSS framework that only runs in stylesheets",
        "A browser's rendering engine itself",
        "An operating system kernel",
      ],
      answer: 0,
      hints: [
        "Think about what kind of program needs to listen for incoming network requests and respond to them.",
        "This is one of the single most common real-world uses of Node — powering the 'server side' of a web app.",
        "Node is very commonly used to build backend web servers and APIs that a frontend (like a React app) sends requests to.",
      ],
      explanation: "One of Node's most common real-world uses is building backend servers and APIs — handling requests from a frontend, talking to a database, sending back responses.",
    },
    {
      q: "Tools like webpack and Vite, which bundle frontend code for deployment, actually run on top of...?",
      options: ["A web browser's JS engine, inside a hidden tab", "Node.js", "A separate compiled language unrelated to JS", "The Python interpreter"],
      answer: 1,
      hints: [
        "These build tools need filesystem access (reading/writing your project's files) — something only a non-browser JS environment provides.",
        "This unit specifically called out these two tools as Node use-cases.",
        "webpack and Vite are themselves JavaScript programs, executed by Node.js, which is why they need 'npm install' before you can run them.",
      ],
      explanation: "Build tools like webpack and Vite are JavaScript programs that run on Node.js — that's also why setting them up always starts with npm install.",
    },
    {
      q: "What is npm, in relation to Node.js?",
      options: [
        "A completely separate program you must install yourself, unrelated to Node",
        "Node's official Package Manager, bundled with Node, giving access to a huge ecosystem of reusable packages",
        "A built-in code editor for writing Node programs",
        "A testing framework exclusive to React apps",
      ],
      answer: 1,
      hints: [
        "You get this automatically the moment you install Node — no separate download needed.",
        "Its full name spells out exactly what it manages.",
        "npm = Node Package Manager, bundled with Node, and it's the gateway to installing other people's reusable packages instead of writing everything yourself.",
      ],
      explanation: "npm (Node Package Manager) is bundled with every standard Node.js install and gives access to a massive ecosystem of reusable packages — covered in full in Unit 5.3.",
    },
    {
      q: "Which terminal command actually RUNS a Node.js file named app.js?",
      options: ["run app.js", "node app.js", "open app.js", "npm app.js"],
      answer: 1,
      hints: [
        "The command starts with the name of the runtime itself.",
        "It's a two-word command: the runtime's name, then the filename.",
        "`node app.js` starts a new Node process that reads and executes app.js from top to bottom.",
      ],
      explanation: "Running `node app.js` from a terminal starts a Node.js process that executes app.js as a program — no browser involved.",
    },
    {
      q: "When you call console.log(\"hi\") inside a Node.js program, where does \"hi\" actually appear?",
      options: [
        "In the browser's DevTools console panel",
        "Nowhere — Node silently ignores console.log",
        "In the terminal/shell window you used to launch the program",
        "In a popup alert box",
      ],
      answer: 2,
      hints: [
        "There is no browser running at all in this scenario — so a DevTools panel can't be the answer.",
        "Think about WHERE you physically typed the `node app.js` command.",
        "console.log in Node writes to the terminal's standard output — the very same window you typed `node app.js` into.",
      ],
      explanation: "With no browser involved, console.log in Node prints directly to the terminal (stdout) — the same window used to launch the script.",
    },
    {
      q: "A teammate writes `document.getElementById(\"title\")` inside a plain Node.js script (no browser involved). What happens?",
      options: [
        "It works exactly the same as in a browser",
        "It throws an error, because `document` doesn't exist in Node's environment",
        "Node automatically creates a fake invisible webpage to satisfy the call",
        "It silently returns an empty string",
      ],
      answer: 1,
      hints: [
        "Recall which global object only exists because a browser supplies a DOM.",
        "Node has no rendering engine and therefore nothing resembling a document at all.",
        "Since `document` is never defined in Node's global environment, referencing it throws a ReferenceError.",
      ],
      explanation: "document only exists because a browser's rendering engine creates a DOM. Node has no DOM, so referencing document throws a ReferenceError — this is a classic browser-only mistake inside a Node script.",
    },
    {
      q: "Why doesn't a slow network request inside a Node server freeze the entire server for every connected user?",
      options: [
        "Because Node secretly creates a new thread for every single request",
        "Because Node's non-blocking, event-loop model lets the main thread keep handling other requests while it waits for slow I/O to finish",
        "Because slow requests are simply dropped and ignored",
        "Because Node servers can only handle one user at a time anyway, so there's nothing to protect",
      ],
      answer: 1,
      hints: [
        "This is the same single-threaded-but-non-blocking idea from earlier in this unit, just applied to a server with many users.",
        "The main thread never sits around waiting on ANY one slow task — it keeps cycling through other work via the event loop.",
        "Because I/O is non-blocking, the single main thread stays free to serve other users' requests while a slow one is still being handled in the background.",
      ],
      explanation: "Node's single thread never blocks on slow I/O — the event loop lets it keep serving other requests/users while a slow operation (like a network call) finishes in the background, then handles its result via a callback/Promise.",
    },
  ];

  // ==========================================================================
  // LOOPING ANIMATION FRAME EFFECT.
  // Only runs (sets up its interval) while the student is on the Build stage
  // (1) or the See It stage (2), since those are the only two stages that
  // actually render a ConceptAnimation/visual that depends on `animFrame`.
  // On every tick (every 100ms) it bumps animFrame forward by 1, wrapping
  // back to 0 after 60 — giving each ConceptAnimation a continuously cycling
  // "pos" value (computed inside that component) to animate from. The
  // returned cleanup function clears the interval whenever `stage` changes
  // OR the component unmounts, so leaving Build/SeeIt — or leaving the unit
  // entirely — never leaves a stray timer ticking in the background.
  // ==========================================================================
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ==========================================================================
  // CONTENT: See-It steps — five guided, step-by-step screens. Each pairs a
  // small code/terminal snippet with the simulated result it produces and a
  // plain/technical explanation of what just happened. These are NOT live
  // executed — `code`/`result` are just strings written to LOOK like a real
  // terminal session, because this is a browser-rendered lesson page, not an
  // actual OS shell.
  // ==========================================================================
  const seeitSteps = [
    {
      plain: "An ordinary JS file — nothing browser-specific.",
      tech: "Plain JavaScript, no DOM, runnable directly by V8.",
      code: `// app.js
console.log("Hello from Node!");`,
      result: "(file saved — nothing has run yet)",
      resultColor: "#94a3b8",
    },
    {
      plain: "Run it from a terminal with node + the filename.",
      tech: "`node app.js` starts a process executing that file.",
      code: `$ node app.js`,
      result: "Hello from Node!",
      resultColor: "#4ade80",
    },
    {
      plain: "It printed to the TERMINAL — no browser involved.",
      tech: "console.log writes straight to stdout.",
      code: `// same file, after running
// terminal now shows:`,
      result: "Hello from Node!",
      resultColor: "#38bdf8",
    },
    {
      plain: "Now try using document, like a browser would.",
      tech: "document only exists in a browser's DOM — not in Node.",
      code: `// app.js
console.log(document.title);`,
      result: "ReferenceError: document is not defined",
      resultColor: "#ef4444",
    },
    {
      plain: "Swap in Node's own process module instead — it works.",
      tech: "process is a real Node global with runtime info.",
      code: `// app.js
console.log(process.version);`,
      result: "v20.11.0",
      resultColor: "#a78bfa",
    },
  ];

  // ==========================================================================
  // CONTENT: Try-It presets — the simulated terminal "commands" a student
  // can click. Each one renders a pre-written fake terminal output block, so
  // students get the FEEL of typing real commands (node -v, running a file,
  // console.log, and the classic document-in-Node mistake) without this
  // lesson ever needing a real backend shell to execute anything against.
  // ==========================================================================
  const commandPresets = [
    { cmd: "node -v", output: "v20.11.0", note: "Shows the installed Node version." },
    { cmd: "node app.js", output: "Hello from Node!", note: "Runs app.js top to bottom as a program." },
    { cmd: 'console.log("hi")', output: "hi", note: "Prints to the terminal, not a browser console." },
    { cmd: "document.title", output: "ReferenceError: document is not defined", note: "No browser, no DOM, no document." },
    { cmd: "process.platform", output: "\"win32\"", note: "process exposes the OS Node is running on." },
    { cmd: "typeof window", output: "\"undefined\"", note: "window never existed here — undefined, not an error." },
  ];

  // ==========================================================================
  // CONTENT: Challenge 1 — TagMatch pairs (term → meaning). Wrong taps show
  // that specific pair's `hint` field immediately, per house style.
  // ==========================================================================
  const ch1Pairs = [
    { code: "runtime", meaning: "An environment that executes code outside of where it was originally designed to run", hint: "Think about what Node actually IS, in one word, from this whole unit's opening idea." },
    { code: "V8 engine", meaning: "The JavaScript engine from Chrome that Node runs standalone", hint: "This is named after a type of car engine, and it's the SAME engine inside Google's own browser." },
    { code: "event loop", meaning: "The mechanism that lets Node stay non-blocking while handling slow I/O", hint: "This is what keeps a single Node thread from ever freezing on a slow file read or network call." },
    { code: "npm", meaning: "Node's bundled package manager, gateway to reusable third-party code", hint: "Its name literally spells out 'Node Package ___' — what's the last word?" },
  ];

  // ==========================================================================
  // CONTENT: Challenge 2 — bug hunt. Three lines are fine inside a Node
  // script; exactly one line would only work in a BROWSER (uses
  // document.getElementById, a DOM API Node doesn't have).
  // ==========================================================================
  const bugLines = [
    { text: 'const fs = require("fs");', buggy: false },
    { text: 'console.log("Server starting...");', buggy: false },
    { text: 'const title = document.getElementById("title").innerText;', buggy: true, why: "document.getElementById is a browser DOM API. Node has no DOM, so document is never defined here — this line throws a ReferenceError the moment it runs in plain Node." },
    { text: "process.exit(0);", buggy: false },
  ];
  const bugHints = [
    "Three of these four lines use things that genuinely exist inside Node (fs, console, process). One line reaches for something that only a BROWSER provides.",
    "Look specifically for a method name you'd normally see used to grab an element off a webpage.",
    "getElementById is a DOM method — and DOM methods live on `document`, which simply does not exist in plain Node.js. Tap that line.",
  ];

  // ==========================================================================
  // SHARED STYLE OBJECT — copied verbatim (same keys, same values) from
  // Unit4_5.jsx so this unit is visually indistinguishable in "feel" from
  // every other unit in the course. Every numeric size below is either a %,
  // a flexWrap-friendly flex-basis, or a clamp()/minmax() expression, so
  // nothing here can force horizontal overflow on a narrow phone screen.
  // ==========================================================================
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    // pill(active, done) — a function-valued style: active stage is bright
    // blue, a completed (already-passed) stage turns translucent green with
    // a green outline, anything else stays a dim, unobtrusive slate color.
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
    // btn(color) — primary call-to-action button factory; default sky-blue,
    // but every "this finishes/unlocks something" button passes "#4ade80"
    // (green) instead, visually distinguishing "advance" from "complete".
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    // tag(color) — small rounded badge, used for things like "3 / 8" concept
    // counters or "Attempt 2" labels in the quiz.
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.84rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    // quizOption(selected, correct, wrong) — three-way visual state for each
    // multiple-choice tile: green if just-confirmed-correct, red if
    // just-confirmed-wrong, blue outline if merely selected-but-unchecked,
    // plain otherwise.
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  // Labels for the six stage-pills in the sticky top bar — index-matched to
  // the `stage` numeric value (0..5) used everywhere else in this file.
  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ==========================================================================
  // STAGE 0 RENDERER — SPARK.
  // Poses a single curiosity/prediction question BEFORE any real teaching,
  // by design (predict-then-learn beats being told an answer cold). The
  // student must pick one of four guesses and submit before seeing the
  // reveal; only after submitting do they get a "Start Learning →" button
  // that advances `stage` to 1 (Build).
  // ==========================================================================
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🤔</div>
        <div style={s.h2}>JavaScript only runs in browsers... right?</div>
      </div>

      {/* The provocation: Netflix (and basically every big tech company)
          runs JS on its SERVERS, where there is no browser at all. How? */}
      <div style={{ ...s.p, color: "#cbd5e1", textAlign: "center" }}>
        Netflix's servers run tons of JS — with no browser anywhere in sight.
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Take your best guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Servers secretly run a hidden, invisible browser",
              "JavaScript got a way to run completely outside any browser",
              "It's not really JavaScript, it just looks like it",
              "Netflix rewrote JS into a totally different language first",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          {/* Submit button stays disabled until a guess is actually picked,
              forcing an active choice rather than letting students skip
              straight past the prediction step. */}
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>the real answer</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>Node.js</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "JavaScript got a way to run completely outside any browser" ? "🎯 Exactly right!" : "Close enough to investigate — here's what's really going on."}
          </div>
          <div style={s.line}>
            Node lets JS run anywhere — servers, laptops, CLIs — zero browser needed.
          </div>
          {/* Advances stage 0 → 1, moving the student into the Build stage's
              concept-by-concept teaching. */}
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // STAGE 1 RENDERER — BUILD.
  // Renders the horizontally-scrollable concept-picker strip (lets students
  // jump to any of the 8 concepts directly) above a card showing the
  // CURRENTLY selected concept: its title, its ConceptAnimation illustration
  // (keyed by `buildConcept` and animated via the shared `animFrame`), a
  // Plain English ⇄ Technical toggle, and either a "Next: <title> →" button
  // (while concepts remain) or a green "I've got it!" button that advances
  // to the See It stage once the LAST concept has been reached.
  // ==========================================================================
  const renderBuild = () => {
    // Compute the upcoming concept's short title (split off anything after
    // an em-dash, mirroring Unit4_5's pattern) to label the "Next:" button
    // with exactly what's coming next, or null if this IS the last concept.
    const nextTitle = buildConcept < concepts.length - 1
      ? concepts[buildConcept + 1].title.split("—")[0].trim()
      : null;
    return (
      <div>
        {/* Horizontally-scrollable concept picker: one small pill button per
            concept, numbered, letting a student jump directly to any concept
            instead of only ever moving forward linearly. Tapping a pill also
            resets buildMode back to "plain" so jumping concepts doesn't
            strand the student on a Technical explanation for a topic they
            haven't even seen in Plain English yet. */}
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
          {/* The animated illustration for THIS concept — ConceptAnimation
              reads buildConcept as `index` to pick which if-block to render,
              and the shared, ever-incrementing `animFrame` to animate it. */}
          <div style={s.animBox}><ConceptAnimation index={buildConcept} frame={animFrame} /></div>
          <div style={s.toggleRow}>
            <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
            <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            {/* Only one of these two ever renders, based on buildMode — the
                plain-English copy in default slate text, OR the technical
                copy in monospace sky-blue, signalling "this is the precise
                vocabulary version" visually as well as textually. */}
            {buildMode === "plain" && <div style={{ ...s.line, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
            {buildMode === "tech" && <div style={{ ...s.line, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            {/* Ternary: while more concepts remain, advance buildConcept by
                1 and reset to Plain mode; once on the LAST concept, instead
                advance the whole lesson to stage 2 (See It). */}
            {nextTitle
              ? <button style={s.btn()} onClick={() => { setBuildConcept(buildConcept + 1); setBuildMode("plain"); }}>Next: {nextTitle} →</button>
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
            {/* Progress counter, e.g. "3 / 8", so students always know how
                much of the Build stage remains. */}
            <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 2 RENDERER — SEE IT.
  // A slower, single-thread walkthrough: one code/terminal snippet per
  // step, the simulated result it produces, and a Plain/Technical-toggled
  // explanation underneath. seeitStep drives which entry of `seeitSteps` is
  // visible; "Next Step →" / "← Back" move linearly, and once the LAST step
  // is reached the forward button instead reads "Now Let Me Try It!" and
  // advances the whole lesson into stage 3 (Try It).
  // ==========================================================================
  const renderSeeIt = () => {
    // Look up the single step object currently being shown, once per
    // render, so the JSX below can just reference `step.code`, `step.result`
    // etc. without repeating the array index lookup everywhere.
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch a Node Script Actually Run</div>
        {/* Same Plain/Technical toggle pattern as Build, but backed by its
            own independent `seeitMode` state — switching modes here never
            touches buildMode, and vice versa. */}
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        {/* The fake "code/terminal" snippet for this step, rendered in a
            monospace box styled to look like an editor/terminal pane. */}
        <div style={s.codeBox}>{step.code}</div>
        {/* A small downward arrow purely as a visual "this produces..."
            connector between the snippet above and the result box below. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* The simulated result — colored per-step (green for success,
            red for the document-is-not-defined error step, etc. — see
            seeitSteps' resultColor field above) inside a black
            terminal-style box. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", margin: "0 0 12px", fontFamily: "'Cascadia Code','Consolas',monospace", textAlign: "center" }}>
          <span style={{ color: step.resultColor, fontWeight: 700, fontSize: "0.92rem" }}>{step.result}</span>
        </div>
        {/* The explanation text itself swaps between step.plain and
            step.tech depending on which toggle is currently active. */}
        <div style={{ ...s.line, color: "#e2e8f0", textAlign: "center" }}>{seeitMode === "plain" ? step.plain : step.tech}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
          {/* Forward navigation: advance seeitStep while more steps remain;
              once on the final step, instead push the whole lesson forward
              into stage 3 (Try It). */}
          {seeitStep < seeitSteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
          {/* Back navigation only appears once there IS a previous step to
              return to (seeitStep > 0), letting students re-read something
              without losing their forward progress entirely. */}
          {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 3 RENDERER — TRY IT.
  // The hands-on simulation: a row of preset "commands" (node -v, running a
  // file, console.log, the browser-only document.title mistake, etc.) the
  // student can tap. Tapping one looks up its matching object inside
  // `commandPresets` and renders a simulated terminal block with that
  // command's pre-written fake output. `triedCount` only increments the
  // FIRST time a given command is tapped (re-tapping an already-tried
  // command doesn't inflate the counter), and the "Take the Challenge →"
  // button only appears once at least 3 distinct commands have been tried.
  // ==========================================================================
  const renderTryIt = () => {
    // Find the full preset object matching whichever command string is
    // currently selected, so the JSX below can read .output/.note directly.
    const active = commandPresets.find((p) => p.cmd === cmdPicked);

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Try a Few Commands in a Simulated Terminal</div>
        <div style={{ ...s.p, marginBottom: 16 }}>
          Tap a command to see its simulated terminal output.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {commandPresets.map((p) => (
            <button
              key={p.cmd}
              onClick={() => {
                setCmdPicked(p.cmd);
                // Only bump the "distinct commands tried" counter the FIRST
                // time this exact command is selected — tapping the same
                // command again later should not count twice toward the
                // "try at least 3" unlock requirement.
                if (cmdPicked !== p.cmd) setTriedCount((c) => c + 1);
              }}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                background: cmdPicked === p.cmd ? "#38bdf8" : "#0f172a", color: cmdPicked === p.cmd ? "#0f172a" : "#7dd3fc",
              }}
            >{p.cmd}</button>
          ))}
        </div>

        {/* The simulated terminal output panel: shows a prompt-style
            rendering of the chosen command followed by its canned output,
            or a neutral placeholder message if nothing has been tapped yet. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>$ {active.cmd}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: active.output.startsWith("ReferenceError") ? "#ef4444" : "#4ade80", fontWeight: 700, fontSize: "0.9rem" }}>{active.output}</div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "0.8rem" }}>Tap a command above ↑</div>
          )}
        </div>

        {/* Explanatory note for whichever command is currently active,
            reinforcing WHY that output happened (e.g. why document.title
            throws but process.platform doesn't). */}
        {active && (
          <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginTop: 12, textAlign: "center" }}>
            <div style={{ ...s.line, color: "#94a3b8", marginBottom: 0 }}>{active.note}</div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {/* Gate: at least 3 DISTINCT commands must have been tried before
              the Challenge stage unlocks, per this unit's requirement. Below
              that threshold, show a small progress counter instead of a
              button so the student knows exactly how much further to go. */}
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 different commands to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 4 RENDERER — CHALLENGE.
  // Two back-to-back mini-games, switched via `challengePhase`:
  //   phase 0 → TagMatch (term → meaning) using ch1Pairs, gated by ch1Done.
  //   phase 1 → BugHunt (find the browser-only line) using bugLines/bugHints,
  //             gated by ch2Done.
  // Both child components are generic/reusable (defined once, below, outside
  // this component) and call back up via onDone the moment the student
  // finishes that mini-game, which flips the matching ch*Done flag and
  // reveals the button that moves on (to the other mini-game, then finally
  // to the Quiz stage).
  // ==========================================================================
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Match Term → Meaning</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {/* This button only appears once TagMatch has reported every pair
              matched correctly (ch1Done === true), preventing a skip. */}
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Spot the Browser-Only Line</div>
          <div style={{ ...s.line, marginBottom: 14 }}>Tap the one browser-only line.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {/* This button only appears once BugHunt confirms the actually-
              buggy line was tapped (ch2Done === true). It's the doorway
              into stage 5, the final Quiz. */}
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // STAGE 5 RENDERER — QUIZ.
  // If quizDone is already true, render ONLY the completion screen — this
  // is the single spot in the entire file where onUnitComplete() is called,
  // wired to a real onClick on a real button, never auto-fired. Otherwise,
  // render the current question (quizQuestions[quizQ]) with its multiple-
  // choice options, hint box (on wrong attempts) or explanation box (on a
  // correct attempt), and the Check Answer / Next Question controls.
  // ==========================================================================
  const renderQuiz = () => {
    // Early-return-style branch INSIDE the render function (not around any
    // hook!) — once every question has been answered correctly, quizDone
    // flips true and this function only ever returns the completion card
    // from that point forward, until the component unmounts.
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>🏆</div>
          {/* Deliberately says "Unit 5.1 complete" and points to Unit 5.2
              next — NEVER "Module 5 complete", since four more units of
              M5 remain after this one. */}
          <div style={s.h2}>Unit 5.1 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>
            {student?.name ? `Nice work, ${student.name}!` : "Nice work!"} On to Unit 5.2 next.
          </div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "What Node.js actually is (a JS runtime, not a new language)",
              "Node runs Chrome's own V8 engine, standalone, outside any browser",
              "Browser globals like window/document don't exist in Node",
              "Node's own modules: fs, http, path, process",
              "Node is single-threaded but non-blocking, via the event loop",
              "What people build with Node: servers/APIs, CLI tools, build tooling, real-time apps",
              "npm ships with Node as its package manager (full lesson coming in 5.3)",
              "How to run a file with `node app.js`, and where console.log actually prints",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* THE ONLY onUnitComplete() CALL SITE IN THIS ENTIRE FILE.
              Fired from a real onClick, exactly once per click, and this
              button only ever exists once quizDone is true (i.e. after all
              12 questions are answered correctly) — satisfying both the
              "call it once" and "only from a real button" hard rules.
              App.jsx's own onUnitComplete implementation takes over from
              here: persisting progress and routing the student onward,
              typically to Unit5_2. */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    // Look up the current question object once per render.
    const q = quizQuestions[quizQ];
    // hintIndex: clamps to the LAST hint once attempts exceed the hints
    // array's length, so a student who keeps getting it wrong always still
    // sees *some* hint (never silence, never nothing) but is never shown
    // anything beyond the final, most-revealing-but-still-not-the-answer
    // hint repeatedly. Math.min(quizAttempts - 1, q.hints.length - 1) is the
    // exact same escalation formula used across every unit in this course.
    const hintIndex = Math.min(quizAttempts - 1, q.hints.length - 1);
    return (
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
          {/* Question counter, e.g. "Question 4 of 12". */}
          <div style={s.tag("#38bdf8")}>Question {quizQ + 1} of {quizQuestions.length}</div>
          {/* Attempt counter only shows once the student has gotten this
              SPECIFIC question wrong at least once. */}
          {quizFeedback === "wrong" && <div style={s.tag("#fb923c")}>Attempt {quizAttempts + 1}</div>}
        </div>
        <div style={{ ...s.h3, color: "#f1f5f9", fontSize: "0.9rem", marginBottom: 14, whiteSpace: "pre-wrap" }}>{q.q}</div>
        {/* Render every option as its own clickable tile. Clicking is only
            allowed when nothing has been confirmed correct yet (you can
            freely change your selection before checking, or after a wrong
            attempt, but not after you've already gotten it right — at that
            point only the "Next Question" button should be actionable). */}
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
        {/* Wrong-answer hint box — shows the escalating hint string at
            hintIndex. Crucially, this NEVER contains or reveals the correct
            option's literal text — every hints[] entry above was written to
            nudge reasoning only. */}
        {quizFeedback === "wrong" && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
            <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{q.hints[hintIndex]}</div>
          </div>
        )}
        {/* Correct-answer box — shows the fixed `explanation` string,
            reinforcing why the chosen option was right. Only ever shown
            once quizFeedback === "correct". */}
        {quizFeedback === "correct" && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✅ Correct!</div>
            <div style={{ color: "#86efac", fontSize: "0.82rem" }}>{q.explanation}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {/* "Check Answer" — disabled until an option is selected. On
              click: if the selection matches q.answer, flip feedback to
              "correct" (revealing the explanation box and swapping in the
              Next/Finish button below). Otherwise, bump quizAttempts (which
              shifts hintIndex forward for the NEXT wrong attempt), flip
              feedback to "wrong" (revealing the hint box), and clear the
              selection so the student must actively re-pick before trying
              again rather than re-submitting the same wrong tile by reflex. */}
          {quizFeedback !== "correct" && (
            <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
              if (quizSelected === q.answer) { setQuizFeedback("correct"); }
              else { setQuizAttempts((a) => a + 1); setQuizFeedback("wrong"); setQuizSelected(null); }
            }}>Check Answer</button>
          )}
          {/* Only shown after a correct answer. Advances to the next
              question (resetting selection/feedback/attempts for that fresh
              question) while questions remain; once this WAS the last
              question (quizQ + 1 === quizQuestions.length), instead flips
              quizDone to true, which on the NEXT render swaps this whole
              function over to the completion-screen branch above. */}
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
  // TOP-LEVEL RENDER.
  // The sticky top bar (unit name + stage pills) is ALWAYS visible regardless
  // of which stage is active, giving students a constant "you are here"
  // anchor. Below it, exactly one of the six render* functions is invoked,
  // chosen by the current `stage` value — never more than one at a time,
  // and never zero (stage always starts at 0 and only ever increases via
  // these render functions' own button onClicks). App.jsx renders its own
  // floating "← Dashboard" affordance OVER this entire component elsewhere
  // in the app shell, so this file does not add a redundant back button.
  // ==========================================================================
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 5.1 — What is Node.js?</div>
        {/* Stage pills: each one is colored by comparing its own index `i`
            against the live `stage` value — `stage === i` highlights the
            CURRENT stage, `stage > i` marks an already-completed stage
            green, and anything else (stage < i, not yet reached) stays
            dim/inactive. */}
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {/* A small personalized welcome line, shown only on the very first
          stage (Spark) so it doesn't clutter every subsequent screen. Reads
          the `student` prop handed down from App.jsx, falling back to the
          generic word "Student" if no name is present on that object yet. */}
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong>
        </div>
      )}
      {/* Exactly one of these six conditions is ever true at once, since
          `stage` is a single number — this is the actual stage switch that
          implements the whole Spark→Build→SeeIt→TryIt→Challenge→Quiz flow. */}
      {stage === 0 && renderSpark()}
      {stage === 1 && renderBuild()}
      {stage === 2 && renderSeeIt()}
      {stage === 3 && renderTryIt()}
      {stage === 4 && renderChallenge()}
      {stage === 5 && renderQuiz()}
      {/* Small responsive tweak for very narrow phones, shrinking the top
          bar's title text further than the clamp() in topTitle alone would,
          matching the same media-query pattern used across the course. */}
      <style>{`
        @media (max-width: 420px) {
          .unit-topbar-title { font-size: 0.74rem !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// CONCEPT ANIMATIONS — one small illustration per Build-stage concept.
// This is a plain function component (not exported, used only inside this
// file) so it can sit outside Unit5_1 and stay completely stateless itself:
// all the motion comes from the `frame` number Unit5_1 keeps incrementing
// via its own useEffect/setInterval, passed in as a prop on every render.
// `index` picks exactly one of the if-blocks below, in the SAME order as
// the `concepts` array up in Unit5_1, so concept #0 ("JS Escapes the
// Browser") always renders the index===0 block, and so on through #7.
// Each block derives its own animated values from `pos` (a 0..1 sawtooth
// computed from `frame`), then returns plain divs styled with inline CSS —
// no actual CSS animation/keyframes are used anywhere; the "animation" is
// just React re-rendering with a slightly different `pos` 10 times/second.
// ============================================================================
function ConceptAnimation({ index, frame }) {
  // pos cycles smoothly from 0 up to just-under-1 every 40 frames (4
  // seconds, since the parent ticks frame every 100ms) — a classic sawtooth
  // wave used as the single timing source for every animation block below.
  const pos = (frame % 40) / 40;
  // Shared full-size centering wrapper every animation block renders inside,
  // defined once here to avoid repeating identical inline-style objects in
  // every single if-branch below.
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  // A small reusable "→" glyph for several of the diagram blocks below.
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — "JS Escapes the Browser": a JS file icon moving from inside a
  // browser-window outline to standing completely free of it.
  if (index === 0) {
    const escaped = pos > 0.5;
    // Extra element: a small server icon that fades IN only once the JS
    // file has "escaped" — visually answering "escaped TO where?" without
    // needing another sentence of text.
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            border: "2px solid #334155", borderRadius: 8, padding: "10px 14px", fontSize: "0.62rem", color: "#64748b",
            opacity: escaped ? 0.35 : 1, transition: "opacity 0.2s",
          }}>🌐 browser tab</div>
          <div style={{ fontSize: "1.3rem", transform: escaped ? "translateX(6px)" : "translateX(0px)", transition: "transform 0.2s" }}>📄</div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: escaped ? "#4ade80" : "#475569" }}>{escaped ? "running free, no browser!" : "stuck inside..."}</div>
          <div style={{ fontSize: "1.1rem", opacity: escaped ? 1 : 0, transition: "opacity 0.2s" }}>🖥️</div>
        </div>
      </div>
    );
  }

  // 1 — "Node = V8, Unplugged": the V8 label moving out of a Chrome-shaped
  // outline into its own standalone box.
  if (index === 1) {
    const standalone = pos > 0.5;
    // Extra element: a pulsing dot under the V8 box that only lights up once
    // standalone is true, reinforcing "V8 is now alive on its own" visually.
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>{standalone ? "Chrome" : "Chrome ⚙️ V8"}</div>
            {arrow}
            <div style={{
              border: standalone ? "2px solid #38bdf8" : "1px dashed #334155", borderRadius: 8, padding: "8px 12px",
              fontSize: "0.66rem", fontWeight: 700, color: standalone ? "#38bdf8" : "#475569",
            }}>{standalone ? "V8 (inside Node)" : "..."}</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: 99, background: standalone ? "#4ade80" : "#1e293b", transition: "background 0.2s" }} />
        </div>
      </div>
    );
  }

  // 2 — "No window, No document": a checklist of globals, ticking
  // window/document as ❌ (Node) while fs/http stay ✅.
  if (index === 2) {
    const phase = Math.floor(pos * 4) % 4;
    const rows = [
      { label: "window", ok: false },
      { label: "document", ok: false },
      { label: "fs", ok: true },
      { label: "http", ok: true },
    ];
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{
              display: "flex", gap: 6, alignItems: "center", fontFamily: "monospace", fontSize: "0.62rem",
              color: phase === i ? (r.ok ? "#4ade80" : "#ef4444") : "#475569", fontWeight: phase === i ? 700 : 400,
            }}>
              <span>{phase === i ? (r.ok ? "✅" : "❌") : "·"}</span>
              <span>{r.label}</span>
            </div>
          ))}
          {/* Extra element: a small environment label that flips between
              "Browser" and "Node" in sync with the highlighted row, so the
              checklist's meaning ("this exists HERE but not THERE") reads
              visually instead of needing another caption. */}
          <div style={{ marginTop: 4, fontSize: "0.56rem", fontWeight: 700, color: rows[phase].ok ? "#38bdf8" : "#fb923c" }}>
            {rows[phase].ok ? "✅ exists in Node" : "❌ Node-only here"}
          </div>
        </div>
      </div>
    );
  }

  // 3 — "Single-Threaded, Never Blocked": a single thread dot looping
  // through other tasks WHILE a slow I/O task (dashed) finishes off to the
  // side, then "calls back" once done.
  if (index === 3) {
    const ioDone = pos > 0.75;
    const threadStep = Math.floor(pos * 4) % 4;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 99, background: threadStep === i ? "#38bdf8" : "#334155" }} />
            ))}
          </div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>main thread keeps cycling...</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: ioDone ? "#4ade80" : "#fb923c" }}>{ioDone ? "slow file read finished ✅ → callback fires" : "slow file read in progress (not blocking!)"}</div>
        </div>
      </div>
    );
  }

  // 4 — "What People Actually Build": cycling through four icons
  // representing servers/APIs, CLI tools, build tooling, real-time apps.
  if (index === 4) {
    const items = [
      { icon: "🖥️", label: "servers/APIs" },
      { icon: "⌨️", label: "CLI tools" },
      { icon: "📦", label: "build tooling" },
      { icon: "💬", label: "real-time apps" },
    ];
    const active = Math.floor(pos * items.length) % items.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {items.map((it, i) => (
              <div key={it.label} style={{ textAlign: "center", opacity: active === i ? 1 : 0.35, transition: "opacity 0.2s" }}>
                <div style={{ fontSize: "1.3rem" }}>{it.icon}</div>
                <div style={{ fontSize: "0.55rem", color: active === i ? "#38bdf8" : "#64748b", fontWeight: active === i ? 700 : 400 }}>{it.label}</div>
              </div>
            ))}
          </div>
          {/* Extra element: a tiny dot-progress row under the icons, echoing
              `active` so students see "we're cycling through 4 of these" at
              a glance, the same way a carousel's dots would. */}
          <div style={{ display: "flex", gap: 4 }}>
            {items.map((_, i) => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: 99, background: active === i ? "#38bdf8" : "#334155" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 5 — "npm Rides Along (Teaser)": a Node box with npm riding along inside
  // it, then a small package icon "downloading" from a cloud.
  if (index === 5) {
    const downloading = pos > 0.4 && pos < 0.85;
    const arrived = pos >= 0.85;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: "0.62rem", color: "#94a3b8" }}>Node install<br /><span style={{ color: "#4ade80", fontWeight: 700 }}>+ npm</span></div>
          {arrow}
          <div style={{ fontSize: "1.2rem" }}>☁️</div>
          <div style={{ fontSize: "0.9rem", color: downloading ? "#38bdf8" : "#475569" }}>{downloading ? "⬇" : "→"}</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: downloading ? "#38bdf8" : "#64748b" }}>{downloading ? "fetching a package..." : "📦"}</div>
          {/* Extra element: a checkmark badge that lights up once the
              package "arrives" (pos near the end of its cycle), giving the
              loop a visible completion beat instead of looping forever with
              no payoff moment. */}
          <div style={{ fontSize: "0.9rem", opacity: arrived ? 1 : 0, transition: "opacity 0.2s", color: "#4ade80" }}>✅</div>
        </div>
      </div>
    );
  }

  // 6 — "Actually Running a File": a terminal prompt typing out
  // `node app.js` character by character (simulated by length-of-string
  // slicing based on `pos`).
  if (index === 6) {
    const full = "node app.js";
    const chars = Math.max(1, Math.floor(pos * (full.length + 4)));
    const typed = full.slice(0, chars);
    // Extra element: once the command is fully typed, a "Running..." label
    // appears below the prompt, so the animation also implies "and now it
    // executes" rather than leaving the typed line as a dead end.
    const finishedTyping = chars >= full.length;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          <div style={{ background: "#000", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.7rem", color: "#4ade80", minWidth: "55%", textAlign: "left" }}>
            $ {typed}<span style={{ opacity: chars % 2 === 0 ? 1 : 0 }}>▌</span>
          </div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: finishedTyping ? "#fb923c" : "#334155", transition: "color 0.2s" }}>
            {finishedTyping ? "⏳ running app.js..." : ""}
          </div>
        </div>
      </div>
    );
  }

  // 7 — "console.log Has a New Home": console.log() arrow pointing at a
  // terminal icon instead of a browser DevTools icon, with the browser
  // option crossed out.
  const intoTerminal = pos > 0.5;
  return (
    <div style={base}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#94a3b8" }}>console.log()</div>
          {arrow}
          <div style={{ textAlign: "center", opacity: intoTerminal ? 0.3 : 1 }}>
            <div style={{ fontSize: "1.1rem" }}>🖥️</div>
            <div style={{ fontSize: "0.55rem", color: "#ef4444" }}>{intoTerminal ? "❌ DevTools" : "DevTools?"}</div>
          </div>
          <div style={{ textAlign: "center", opacity: intoTerminal ? 1 : 0.3 }}>
            <div style={{ fontSize: "1.1rem" }}>⌨️</div>
            <div style={{ fontSize: "0.55rem", color: "#4ade80", fontWeight: 700 }}>{intoTerminal ? "✅ terminal" : "terminal"}</div>
          </div>
        </div>
        {/* Extra element: a one-word verdict label beneath both icons that
            flips color/text in sync with `intoTerminal`, giving a final
            textual confirmation right where the eye naturally lands after
            scanning left-to-right. */}
        <div style={{ fontSize: "0.56rem", fontWeight: 700, color: intoTerminal ? "#4ade80" : "#64748b" }}>
          {intoTerminal ? "printed in terminal" : "deciding..."}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAG MATCH — generic term-to-meaning matching mini-game, reused (mechanics
// completely unchanged from Unit4_5.jsx) for this unit's Challenge phase 0.
// Receives `pairs` (array of {code, meaning, hint}) and an `onDone`
// callback fired the instant every pair has been correctly matched.
// Internally tracks which pairs are already matched, which single tile is
// currently "armed" (selected, waiting for its other half to be tapped),
// a brief red-flash state for a wrong tap, and the hint message to show
// for that wrong tap. The right-hand "meaning" column is shuffled exactly
// once per mount (via a useRef holding the shuffled array so it doesn't
// re-shuffle on every re-render, which would be disorienting mid-game).
// ============================================================================
function TagMatch({ pairs, onDone }) {
  // matched: a map of { [code]: meaning } for every pair successfully
  // matched so far — used both to gray-out/checkmark matched tiles and to
  // detect (via Object.keys(...).length === pairs.length) when the whole
  // game is complete.
  const [matched, setMatched] = useState({});
  // selected: the single tile currently "armed" — either { type:"code",
  // value } or { type:"meaning", value } — null when nothing is selected.
  const [selected, setSelected] = useState(null);
  // flashWrong: which meaning tile (if any) should currently render in its
  // brief red "wrong" flash state, cleared automatically after 700ms.
  const [flashWrong, setFlashWrong] = useState(null);
  // hintMsg: the explanatory hint text to show beneath the columns after a
  // wrong tap; cleared back to null on any subsequent correct match.
  const [hintMsg, setHintMsg] = useState(null);
  // Shuffle the meanings column exactly once, on first mount, by reading
  // .current off a ref initialized with a freshly-shuffled copy of `pairs`
  // — using useRef (not useState) here specifically so this shuffle never
  // re-randomizes itself on a later re-render triggered by other state
  // changes in this same component.
  const shuffledMeanings = useRef([...pairs].sort(() => Math.random() - 0.5)).current;

  // Tapping a CODE tile (left column): arm it as the current selection,
  // unless it's already matched (matched tiles become inert/unclickable).
  const handleCode = (code) => { if (!matched[code]) { setSelected({ type: "code", value: code }); setHintMsg(null); } };

  // Tapping a MEANING tile (right column): if a code tile is currently
  // armed, check whether this meaning is its correct partner. If correct,
  // record the match and clear selection/hint; if not, briefly flash this
  // tile red and show that pair's specific .hint string. If NO code tile
  // was armed yet, instead arm this meaning tile itself (supporting tapping
  // in either left-then-right or right-then-left order).
  const handleMeaning = (meaning) => {
    if (selected?.type === "code") {
      const pair = pairs.find((p) => p.code === selected.value);
      const correct = pair?.meaning === meaning;
      if (correct) {
        const newMatched = { ...matched, [selected.value]: meaning };
        setMatched(newMatched);
        setSelected(null);
        setHintMsg(null);
        // Once every pair has been matched, fire onDone() exactly once —
        // this is what flips ch1Done to true back in Unit5_1, revealing
        // the "Next Challenge →" button.
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
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* Left column: the raw terms (e.g. "runtime", "V8 engine"). */}
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
        {/* Right column: the shuffled meanings, rendered from
            `shuffledMeanings` (the one-time-shuffled copy) rather than the
            original `pairs` order, so the correct answer's screen position
            isn't a giveaway. */}
        <div style={{ flex: "1 1 140px" }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>MEANING</div>
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
      {/* Hint box — only appears after a wrong tap, showing that specific
          pair's .hint text (never the correct meaning itself). */}
      {hintMsg && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
          <span style={{ color: "#fde68a", fontSize: "0.78rem" }}>💡 {hintMsg}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BUG HUNT — generic "tap the one buggy line" mini-game, reused (mechanics
// unchanged from Unit4_5.jsx) for this unit's Challenge phase 1. Receives
// `lines` (array of {text, buggy, why?}), a `hints` array for escalating
// wrong-tap guidance, and an `onDone` callback fired the moment the actual
// buggy line is tapped.
// ============================================================================
function BugHunt({ lines, hints, onDone }) {
  // revealed: flips true once the correct (buggy) line has been tapped —
  // from that point on, all further taps are ignored and the buggy line's
  // `.why` explanation renders permanently below.
  const [revealed, setRevealed] = useState(false);
  // wrongTap: index of whichever line is CURRENTLY mid-flash (briefly red)
  // after an incorrect tap; cleared back to null after 600ms.
  const [wrongTap, setWrongTap] = useState(null);
  // wrongAttempts: total count of incorrect taps so far (across ALL lines,
  // not per-line) — drives which escalating hint string shows next.
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // tap(line, i): the single click handler for every line. Once revealed,
  // does nothing (game over, no more interaction needed). Otherwise: if
  // this line IS the buggy one, lock in revealed=true and fire onDone()
  // (exactly once, since revealed guards against any further calls).
  // Otherwise, flash this line red briefly and bump wrongAttempts so the
  // NEXT wrong tap (if any) shows a more specific hint.
  function tap(line, i) {
    if (revealed) return;
    if (line.buggy) { setRevealed(true); onDone(); }
    else { setWrongTap(i); setWrongAttempts((a) => a + 1); setTimeout(() => setWrongTap(null), 600); }
  }

  // Same escalating-hint clamp formula used throughout this course's
  // quizzes: never goes past the last hint in the array, but also never
  // goes negative before any wrong attempt has happened (guarded by the
  // `wrongAttempts > 0` check below before this is even rendered).
  const hintIndex = Math.min(wrongAttempts - 1, (hints?.length || 1) - 1);

  return (
    <div>
      {/* Render every candidate line as its own clickable row. Once
          revealed, the actually-buggy line gets a permanent green
          checkmark/highlight; everything else returns to its plain,
          un-clickable resting state. */}
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
      {/* Escalating hint box, shown only while the game is still unsolved
          AND at least one wrong tap has happened. */}
      {!revealed && wrongAttempts > 0 && hints?.length > 0 && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{hints[hintIndex]}</div>
        </div>
      )}
      {/* Final explanation box — appears only once revealed, permanently
          explaining WHY the tapped line was the buggy/browser-only one. */}
      {revealed && (
        <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", marginTop: 10 }}>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>Found it!</div>
          <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{lines.find((l) => l.buggy)?.why}</div>
        </div>
      )}
    </div>
  );
}
