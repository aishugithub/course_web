// ============================================================================
//  UNIT 5.5 — "Reading & Writing Files"
//  Module: M5 — Node.js & Backend (FIFTH and FINAL unit of this module — once
//  this unit's quiz is finished, the whole of Module 5 is done. The
//  completion screen below is the ONE place in this file that says "Module 5
//  complete" — every Build/See-It/Try-It/Challenge screen above it still
//  only ever talks about Unit 5.5 itself.)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - src/shell/App.jsx looks up "Unit5_5" in config/course.config.js and
//    renders <Unit5_5 student={...} onUnitComplete={...} />, waiting for
//    onUnitComplete() to fire exactly once, from the Quiz screen's final
//    button only. No api.js / gas.config.js imports here — lessons are
//    offline, pure-UI React components. `student` is a read-only
//    { rollNo, name, batch }-shaped object handed down so this lesson can
//    say "Nice work, <name>" without knowing how it was fetched.
//    onUnitComplete is App.jsx's own callback; its implementation persists
//    progress via api.js/gas.config.js and routes the student onward — after
//    Unit 5.5 that means Module 6 ("Databases & APIs"), starting at Unit6_1
//    ("What is a Database?") — this file just calls it bare, once.
//
//  HOUSE STYLE (matches every other unit in this course):
//  - Six-stage flow, same order every time:
//      Stage 0 SPARK     — one prediction question, before any teaching.
//      Stage 1 BUILD     — 8 concepts, each {title, plain, technical} +
//                          a ConceptAnimation + Plain⇄Tech toggle, plus a
//                          horizontally-scrollable concept-picker strip.
//      Stage 2 SEE IT    — step-by-step build of a tiny file-reading/writing
//                          script, one code snippet + simulated terminal
//                          output per step.
//      Stage 3 TRY IT    — simulated file operations against a fake
//                          filesystem (read an existing file, write a new
//                          one, append to one, try reading one that doesn't
//                          exist and see the ENOENT error).
//      Stage 4 CHALLENGE — TagMatch (term→meaning) then BugHunt (a route
//                          handler calling fs.readFileSync, blocking the
//                          whole server while it reads).
//      Stage 5 QUIZ      — 12 questions, escalating hints, never revealing
//                          the answer. Completion screen is the ONLY call
//                          site for onUnitComplete() AND the ONLY place that
//                          declares Module 5 itself finished.
//  - Same shared inline-style object `s` as every other unit.
//  - Mobile-first: every width is %, flexWrap, or clamp()/minmax() — no
//    fixed px widths, since this course runs on phones in class.
//
//  CONTENT TAUGHT (Build-stage concepts, 8 total):
//    1. require('fs') — Node's built-in module for reading/writing files.
//    2. fs.readFileSync — blocking read; returns file contents directly.
//    3. fs.writeFileSync — blocking write; creates or overwrites a file.
//    4. Why "Sync" calls BLOCK everything else while they run.
//    5. fs.readFile (callback) — non-blocking, the older async style.
//    6. fs.promises + async/await — the modern, readable non-blocking way.
//    7. path.join — building a file path safely across operating systems.
//    8. fs.appendFile + the ENOENT error — adding to files, and what happens
//       when a path doesn't exist at all.
//
//  VISUAL-DENSITY RULE THIS FILE FOLLOWS (per the course owner's feedback
//  that earlier lessons were "too text-heavy — needs to be more visual-
//  interactive and less text, more animation"):
//  - Every Build-stage concept's `plain`/`technical` string is ONE short
//    sentence — ConceptAnimation below carries the actual teaching weight via
//    multiple frame/pos-driven moving elements, not paragraphs of prose.
//  - Every other stage's rendered text is kept as short as possible, favoring
//    visuals (icons, colored panels, simulated terminal output) over text.
//  - Quiz question/option/hint/explanation text is the ONE exception — that
//    stays full-length and precise, since the quiz is where understanding is
//    actually verified.
//
//  EXTRA COMMENT DENSITY (per global CLAUDE.md house rule): nearly every
//  state declaration, render function, and non-trivial JSX block below
//  carries its own explanatory comment — both WHAT it does and HOW it
//  threads into the six-stage flow / App.jsx's contract.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit5_5({ student, onUnitComplete }) {
  // ── ALL HOOKS, UNCONDITIONAL, FIXED ORDER, AT THE TOP ──────────────────
  // React's Rules of Hooks: every hook must run on every render regardless
  // of `stage`. Stage-gating happens with plain `if`s INSIDE each render
  // function below, never around a hook declaration.

  // stage: single source of truth for which of the six screens is visible.
  // 0=Spark,1=Build,2=SeeIt,3=TryIt,4=Challenge,5=Quiz. The sticky top
  // bar's pill row reads this same value so pills and content never drift.
  const [stage, setStage] = useState(0);

  // SPARK: sparkGuess holds the tapped prediction option (or null);
  // sparkSubmitted flips true once locked in, swapping UI to the reveal.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // BUILD: buildConcept indexes into `concepts` (which of 8 is shown).
  // buildMode toggles "plain"/"tech" — reset to "plain" on every concept
  // switch so jargon stays opt-in.
  const [buildConcept, setBuildConcept] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // SEE IT: seeitStep indexes into seeitSteps; seeitMode mirrors buildMode's
  // toggle but is tracked independently so the two stages never interfere.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // TRY IT: filePicked is the label of the last-tapped simulated file
  // operation; triedCount counts DISTINCT operations tried, gating the
  // Challenge button until it reaches 3 (this unit's rule).
  const [filePicked, setFilePicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0);

  // CHALLENGE: challengePhase 0=TagMatch, 1=BugHunt. ch1Done/ch2Done flip
  // true the instant each mini-game's onDone fires, gating the buttons that
  // move forward so a student can't skip a mini-game unfinished.
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // QUIZ: quizQ is the current question index (0..11). quizSelected is the
  // highlighted option (resets between questions / after a wrong attempt).
  // quizFeedback is null|"correct"|"wrong", driving tile color + message
  // box. quizAttempts counts WRONG attempts on the CURRENT question only,
  // resetting every new question — it indexes the escalating hint shown
  // (Math.min(attempts-1, hints.length-1) clamps so a hint always shows).
  // quizDone flips true once all 12 are correct, swapping render to the
  // MODULE-COMPLETE screen — the ONLY place onUnitComplete() is ever called.
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // Looping animation frame: animRef holds the interval ID (a ref, not
  // state, since the ID itself is never rendered); animFrame IS state,
  // since changing it must re-render ConceptAnimation with fresh positions.
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: eight Build-stage concepts ─────────────────────────────────
  // ConceptAnimation(index) below has one matching if-block per concept, in
  // the SAME order as this array — keep both lists in lockstep.
  const concepts = [
    {
      title: "The fs Module",
      plain: "require('fs') gives your code the power to read and write files.",
      technical: "fs is Node's built-in module wrapping the OS's filesystem calls.",
    },
    {
      title: "fs.readFileSync",
      plain: "fs.readFileSync(path) reads a file and hands back its contents directly.",
      technical: "readFileSync blocks the thread until the whole file is read, then returns it.",
    },
    {
      title: "fs.writeFileSync",
      plain: "fs.writeFileSync(path, data) creates or overwrites a file with new content.",
      technical: "writeFileSync blocks until the write completes; an existing file is fully replaced.",
    },
    {
      title: "Why Sync Calls BLOCK",
      plain: "While a Sync call runs, your whole program waits — nothing else happens.",
      technical: "Sync methods run on the main thread, freezing all other JS execution until they finish.",
    },
    {
      title: "fs.readFile (Callback)",
      plain: "fs.readFile(path, callback) reads in the background and calls you back when done.",
      technical: "readFile is non-blocking — it delegates to libuv and invokes your callback(err, data) later.",
    },
    {
      title: "fs.promises + async/await",
      plain: "await fs.promises.readFile(path) reads without blocking, written like plain sync code.",
      technical: "fs.promises returns a Promise; await pauses only THIS async function, not the whole program.",
    },
    {
      title: "path.join",
      plain: "path.join('a','b.txt') builds a correct file path on any operating system.",
      technical: "path.join normalizes separators (/ vs \\\\) so paths work on Windows, Mac, and Linux alike.",
    },
    {
      title: "fs.appendFile + ENOENT",
      plain: "appendFile adds to a file's end; reading a missing file throws an ENOENT error.",
      technical: "appendFile never overwrites existing content; ENOENT means 'no such file or directory'.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  // Each has an escalating hints[] array (2-3 hints) nudging reasoning
  // WITHOUT ever stating the correct option's text, plus a fixed
  // `explanation` shown only after a correct answer.
  const quizQuestions = [
    {
      q: "What does require('fs') give a Node.js program access to?",
      options: [
        "A way to make HTTP requests to other servers",
        "Node's built-in module for reading from and writing to files on disk",
        "A database connection",
        "A tool for formatting JavaScript code automatically",
      ],
      answer: 1,
      hints: [
        "The letters 'fs' are short for two English words describing what this module deals with.",
        "Think about what a program needs in order to open, read, or save a file on disk.",
        "fs stands for 'file system' — it's Node's built-in module for reading and writing files.",
      ],
      explanation: "fs (file system) is Node's built-in module providing methods to read, write, append to, and otherwise manipulate files and directories on disk.",
    },
    {
      q: "const data = fs.readFileSync('notes.txt', 'utf8'); — what does this line do?",
      options: [
        "Starts reading the file in the background and returns immediately with nothing",
        "Reads the entire file's contents synchronously and stores the text directly in `data`",
        "Deletes notes.txt after reading it",
        "Creates notes.txt if it doesn't already exist, but reads nothing",
      ],
      answer: 1,
      hints: [
        "The 'Sync' suffix is the key word here — it tells you HOW this call behaves while it runs.",
        "This call doesn't take a callback function, which is a strong clue about when the result becomes available.",
        "readFileSync blocks until the file is fully read, then returns the contents directly — no callback needed, `data` has the text immediately after this line.",
      ],
      explanation: "fs.readFileSync reads a file synchronously: it blocks until the read finishes, then returns the file's contents directly as the function's return value.",
    },
    {
      q: "fs.writeFileSync('out.txt', 'Hello'); — if out.txt already exists with old content, what happens?",
      options: [
        "Node throws an error and refuses to write",
        "'Hello' is appended to the end of the existing content",
        "The old content is completely replaced/overwritten by 'Hello'",
        "Nothing — writeFileSync only works on files that don't exist yet",
      ],
      answer: 2,
      hints: [
        "Compare the word 'write' to the word 'append' — they describe two genuinely different behaviors.",
        "writeFileSync's job is to make the file's final contents match exactly what you passed in.",
        "writeFileSync overwrites: it replaces the file's entire contents with the new data, discarding whatever was there before.",
      ],
      explanation: "fs.writeFileSync replaces a file's entire contents with the new data given — any previous content is overwritten, not preserved or appended to.",
    },
    {
      q: "A Node server's request handler calls fs.readFileSync on a large file. What happens to OTHER incoming requests while that read is happening?",
      options: [
        "They are handled normally in parallel, with no delay at all",
        "They all wait — the entire server is blocked and can't respond to anyone until the Sync read finishes",
        "They are automatically queued and answered twice as fast afterward",
        "Node spins up a new thread automatically for each request",
      ],
      answer: 1,
      hints: [
        "Sync calls run on the SAME single thread that handles everything else in a Node program.",
        "If that one thread is busy reading a file, what can it possibly do for anyone else at that exact moment?",
        "Because readFileSync blocks the single main thread, every other request — and all other JS in the whole program — has to wait until that read finishes.",
      ],
      explanation: "Sync filesystem calls block Node's single main thread. While fs.readFileSync runs, the entire server is frozen — no other request can be handled until the read completes, which is why Sync calls are risky inside servers.",
    },
    {
      q: "fs.readFile('notes.txt', 'utf8', (err, data) => { console.log(data); }); — how is this different from readFileSync?",
      options: [
        "It's identical in every way, just spelled differently",
        "It reads in the background (non-blocking) and calls the callback with the result once the read finishes",
        "It can only read files smaller than 1KB",
        "It deletes the file immediately after reading",
      ],
      answer: 1,
      hints: [
        "Notice this version takes an extra argument that readFileSync never needed — what kind of argument is it?",
        "The word missing from this method's name ('Sync') is itself a hint about its behavior.",
        "fs.readFile is non-blocking: it starts the read in the background and invokes your callback(err, data) later, once the file is actually read — other code keeps running meanwhile.",
      ],
      explanation: "fs.readFile is the non-blocking, callback-based version: it kicks off the read and returns immediately, letting the rest of your program keep running, then calls your callback once the data is ready.",
    },
    {
      q: "const data = await fs.promises.readFile('notes.txt', 'utf8'); — what does `await` actually pause here?",
      options: [
        "It pauses the entire Node process, including all other requests",
        "It pauses only THIS async function until the Promise resolves, while everything else keeps running",
        "It pauses your computer's operating system",
        "It does nothing — await is purely decorative syntax",
      ],
      answer: 1,
      hints: [
        "await only ever works inside an `async function` — that scoping is a clue about what it actually affects.",
        "Compare this to Sync calls, which block literally everything — await is deliberately narrower than that.",
        "await pauses execution of only the current async function until the Promise settles; the rest of the program (other requests, other code) keeps running normally the whole time.",
      ],
      explanation: "await pauses only the async function it's written inside, waiting for that one Promise to resolve — unlike a Sync call, it does NOT block the rest of the program, which is why fs.promises + async/await is the recommended modern pattern.",
    },
    {
      q: "Why use path.join('data', 'notes.txt') instead of writing the string 'data/notes.txt' by hand?",
      options: [
        "path.join makes the file read 10x faster",
        "path.join automatically encrypts the resulting path",
        "path.join builds a correctly-separated path regardless of operating system (/ on Mac/Linux, \\\\ on Windows)",
        "There is no real difference; path.join is purely stylistic",
      ],
      answer: 2,
      hints: [
        "Different operating systems use a different character to separate folders in a path — Windows is famously different here.",
        "Hand-typing '/' works fine on Mac/Linux but can cause subtle bugs once code runs on Windows.",
        "path.join automatically uses the correct separator for whatever OS the code is running on, avoiding hand-typed paths that might break cross-platform.",
      ],
      explanation: "path.join builds file paths using the correct separator for the current operating system automatically, avoiding bugs from hand-typed paths that assume one specific OS's separator character.",
    },
    {
      q: "fs.appendFile('log.txt', 'new line\\n', callback); — what happens to log.txt's EXISTING content?",
      options: [
        "It is completely deleted and replaced by 'new line'",
        "It stays exactly as it was, with 'new line' added onto the END of it",
        "It is sorted alphabetically before the new line is added",
        "appendFile always creates a brand new file with a different name",
      ],
      answer: 1,
      hints: [
        "The method's own name describes exactly what it does to existing content — read it literally.",
        "Compare this directly to writeFile, which behaves very differently with existing content.",
        "appendFile preserves whatever was already in the file and adds the new data onto the end — unlike writeFile, it never erases existing content.",
      ],
      explanation: "fs.appendFile adds new data to the END of a file's existing content, leaving everything that was already there untouched — the opposite of writeFile's full-overwrite behavior.",
    },
    {
      q: "fs.readFile('does-not-exist.txt', 'utf8', (err, data) => {...}); — if that file genuinely doesn't exist, what is `err.code` likely to be?",
      options: ["'OK'", "'ENOENT'", "'TIMEOUT'", "'404'"],
      answer: 1,
      hints: [
        "This error code is specific to filesystems, not to web servers — it's not the same as an HTTP status code.",
        "The code is an abbreviation built from English words about a file or directory simply not being there.",
        "ENOENT stands for 'Error: NO ENTry' — it's the standard filesystem error code meaning the path you asked for doesn't exist.",
      ],
      explanation: "ENOENT is the standard Node/POSIX error code for 'no such file or directory' — it's what you'll see in err.code whenever you try to read a path that doesn't exist.",
    },
    {
      q: "What is the safest way to handle a possible ENOENT error when reading a file with fs.promises?",
      options: [
        "Ignore it — Node will silently skip missing files automatically",
        "Wrap the await call in a try/catch and handle err.code === 'ENOENT' specifically",
        "Always assume the file exists and never check for errors",
        "Restart the entire server whenever any file read fails",
      ],
      answer: 1,
      hints: [
        "Async/await errors surface as thrown exceptions — what JS construct is built specifically to catch those?",
        "You want to keep the rest of your program running even if one specific file happens to be missing.",
        "A try/catch around the await call lets you catch the rejected Promise as a thrown error, inspect err.code for 'ENOENT', and respond gracefully instead of crashing.",
      ],
      explanation: "Wrapping an awaited fs.promises call in try/catch lets you catch the rejection as a normal JS exception and inspect err.code (e.g. 'ENOENT') to respond gracefully, rather than letting the whole program crash.",
    },
    {
      q: "Which of these is the BEST reason to prefer fs.promises + async/await over fs.readFileSync inside an Express route handler?",
      options: [
        "Async/await is shorter to type, that's the only reason",
        "readFileSync would block the entire server from handling any other request while it runs",
        "fs.promises is the only version of fs that actually works inside Express",
        "Sync methods are deprecated and no longer exist in modern Node",
      ],
      answer: 1,
      hints: [
        "Think back to what happens to ALL OTHER requests while a Sync call is running on a server.",
        "This isn't about typing convenience — it's about what happens to every other user hitting the server at the same moment.",
        "Because Sync calls block the single main thread, using readFileSync in a route handler would freeze the ENTIRE server for every other request until that one read finishes — async/await avoids this entirely.",
      ],
      explanation: "Inside a server, Sync filesystem calls block the single main thread, freezing every other request. fs.promises + async/await reads without blocking the thread, so other requests can still be handled while the read is in progress — the main reason Sync calls are risky in servers.",
    },
    {
      q: "async function loadNotes() {\n  const raw = await fs.promises.readFile(path.join('data','notes.txt'), 'utf8');\n  return raw;\n}\nWhich concepts from this whole unit does this one function combine?",
      options: [
        "Only fs.writeFileSync",
        "path.join for a safe cross-platform path, plus fs.promises + await for a non-blocking read",
        "Only the ENOENT error code, nothing else",
        "It combines callbacks and Sync calls together",
      ],
      answer: 1,
      hints: [
        "Look at exactly two function calls inside this snippet — each one maps to a different concept taught in this unit.",
        "One call builds a path safely; the other call actually performs a non-blocking read using a Promise-based API.",
        "This combines path.join (a cross-platform-safe path) with fs.promises.readFile + await (a non-blocking read) — two separate concepts from this unit working together in one realistic function.",
      ],
      explanation: "This function combines path.join (building a safe, cross-platform file path) with fs.promises.readFile awaited inside an async function (a non-blocking read) — exactly the pattern recommended for real Node applications.",
    },
  ];

  // ── Looping animation frame effect ──────────────────────────────────────
  // Only ticks while on Build (1) or See It (2), the only stages rendering
  // a ConceptAnimation that depends on animFrame. Every 100ms, animFrame
  // advances by 1, wrapping at 60 — the timing source every ConceptAnimation
  // block reads via its own `pos`. Cleanup clears the interval on stage
  // change or unmount, so no stray timer keeps ticking.
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It steps — building a tiny file-handling script ───────
  // Each step pairs a growing code snippet with the SIMULATED terminal
  // output it would produce. Nothing here is live executed — these are
  // pre-written strings made to LOOK like a real terminal session.
  const seeitSteps = [
    {
      plain: "First, import the fs and path modules.",
      tech: "require('fs') and require('path') are both built into Node.",
      code: "const fs = require(\"fs\");\nconst path = require(\"path\");",
      result: "(modules loaded — nothing read or written yet)",
      resultColor: "#94a3b8",
    },
    {
      plain: "Build a safe file path with path.join, then write a file.",
      tech: "path.join handles OS-specific separators; writeFileSync creates the file.",
      code: "const file = path.join(\"data\", \"notes.txt\");\nfs.writeFileSync(file, \"Hello, files!\");",
      result: "data/notes.txt created\ncontents: \"Hello, files!\"",
      resultColor: "#4ade80",
    },
    {
      plain: "Read that same file back synchronously.",
      tech: "readFileSync blocks until the file is fully read, then returns it.",
      code: "const text = fs.readFileSync(file, \"utf8\");\nconsole.log(text);",
      result: "$ node app.js\nHello, files!",
      resultColor: "#38bdf8",
    },
    {
      plain: "Append a second line without erasing the first.",
      tech: "appendFile adds to the end; it never overwrites existing content.",
      code: "fs.appendFileSync(file, \"\\nSecond line!\");",
      result: "data/notes.txt now contains:\nHello, files!\nSecond line!",
      resultColor: "#a78bfa",
    },
    {
      plain: "Now read it the modern, non-blocking way.",
      tech: "fs.promises.readFile + await reads without blocking the thread.",
      code: "async function load() {\n  const text = await fs.promises.readFile(file, \"utf8\");\n  console.log(text);\n}\nload();",
      result: "Hello, files!\nSecond line!\n(other code could keep running during this read)",
      resultColor: "#fb923c",
    },
    {
      plain: "Try reading a file that doesn't exist — and catch the error.",
      tech: "A missing path rejects with err.code === 'ENOENT'.",
      code: "try {\n  await fs.promises.readFile(\"missing.txt\", \"utf8\");\n} catch (err) {\n  console.log(err.code);\n}",
      result: "ENOENT",
      resultColor: "#ef4444",
    },
  ];

  // ── CONTENT: Try-It presets — simulated file operations ────────────────
  const filePresets = [
    { label: "Read notes.txt", op: "fs.readFileSync('notes.txt')", outcome: "\"Hello, files!\\nSecond line!\"", color: "#4ade80", note: "notes.txt already exists in this simulated filesystem, so the read succeeds." },
    { label: "Write report.txt", op: "fs.writeFileSync('report.txt', 'Q1 summary')", outcome: "report.txt created/overwritten", color: "#38bdf8", note: "writeFileSync replaces report.txt's entire contents with the new text." },
    { label: "Append to log.txt", op: "fs.appendFileSync('log.txt', 'new entry\\n')", outcome: "log.txt's existing lines kept, new entry added at the end", color: "#a78bfa", note: "appendFile preserves everything already in log.txt." },
    { label: "Read missing.txt", op: "fs.readFileSync('missing.txt')", outcome: "Error: ENOENT — no such file or directory", color: "#ef4444", note: "missing.txt was never created, so Node throws ENOENT." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch pairs (term → meaning) ─────────────
  const ch1Pairs = [
    { code: "fs.readFileSync", meaning: "Blocking read — returns file contents directly", hint: "The 'Sync' suffix tells you this one freezes everything else while it runs." },
    { code: "fs.promises.readFile", meaning: "Non-blocking read — used with await inside an async function", hint: "This version returns a Promise, not the data itself." },
    { code: "fs.writeFileSync", meaning: "Overwrites a file's entire contents", hint: "This replaces what was there before, it doesn't add onto it." },
    { code: "fs.appendFile", meaning: "Adds new data to the end, keeping existing content", hint: "Think about what 'append' means in plain English." },
    { code: "path.join", meaning: "Builds a file path that works on any operating system", hint: "This solves the Windows-vs-Mac/Linux separator character problem." },
    { code: "ENOENT", meaning: "Error code meaning the file or directory doesn't exist", hint: "It's an abbreviation, not a real English word — sound out 'no ent...'." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: Sync call blocking a server ───────
  const bugLines = [
    { text: "app.get(\"/\", (req, res) => { res.send(\"home\"); });", buggy: false },
    { text: "app.get(\"/report\", (req, res) => { const data = fs.readFileSync(\"big-file.csv\"); res.send(data); });", buggy: true, why: "fs.readFileSync blocks Node's single main thread for as long as the read takes. While 'big-file.csv' is being read, the ENTIRE server is frozen — no other request, from any other user, can be handled until this read finishes." },
    { text: "app.use(express.json());", buggy: false },
    { text: "app.listen(3000);", buggy: false },
  ];
  const bugHints = [
    "Three of these four lines are completely ordinary Express setup. One route handler does something risky for a server to do.",
    "Look specifically at any line calling a method ending in 'Sync' — what does that suffix mean for everyone else hitting the server?",
    "The /report route calls fs.readFileSync directly inside a request handler — that blocks the whole server for every other request while the file is being read. Tap that line.",
  ];

  // ── SHARED STYLE OBJECT — copied verbatim from Unit4_5.jsx/Unit5_2.jsx ─
  // so this unit is visually indistinguishable in "feel" from every other
  // unit in the course. Every numeric size is a %, a flexWrap-friendly
  // flex-basis, or a clamp()/minmax() expression — nothing forces overflow
  // on a phone.
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    // pill(active, done) — active stage glows bright blue, an already-passed
    // stage turns translucent green with a green outline, else dim slate.
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
    // btn(color) — primary CTA factory; default sky-blue, "advance/complete"
    // buttons pass "#4ade80" (green) to visually distinguish from plain Next.
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    // tag(color) — small rounded badge, used for counters like "3 / 8" or
    // "Attempt 2" labels.
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.84rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    // quizOption(selected, correct, wrong) — three-way visual state.
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  // Labels for the six stage-pills in the sticky top bar, index-matched to
  // the `stage` numeric value (0..5) used everywhere else in this file.
  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── STAGE 0 RENDERER — SPARK ─────────────────────────────────────────────
  // Poses one prediction question BEFORE any teaching: what happens to a
  // server while it reads a big file the "blocking" way? Student must pick a
  // guess and submit before seeing the reveal; only then does a
  // "Start Learning →" button advance to Build.
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📁</div>
        <div style={s.h2}>A server reads a giant file the "blocking" way. Then what?</div>
      </div>

      <div style={{ ...s.p, color: "#cbd5e1", textAlign: "center" }}>
        Your code can read/write files — but HOW you do it matters a lot on a server.
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Take your best guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Nothing changes — Node reads files instantly no matter the size",
              "Every other request has to WAIT until that one file finishes reading",
              "The file read happens on a totally separate computer",
              "Node automatically cancels the read if it takes too long",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          {/* Submit stays disabled until a guess is picked — forces an
              active choice rather than letting students skip the prediction. */}
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>the real answer</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>everyone waits</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "Every other request has to WAIT until that one file finishes reading" ? "🎯 Exactly right!" : "Close enough to investigate — here's what's really going on."}
          </div>
          <div style={s.line}>A Sync read blocks Node's one main thread — the whole server freezes until it's done.</div>
          {/* Advances stage 0 → 1, into Build's concept-by-concept teaching. */}
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── STAGE 1 RENDERER — BUILD ─────────────────────────────────────────────
  // Renders the horizontally-scrollable concept-picker strip above a card
  // for the CURRENT concept: title, ConceptAnimation (keyed by buildConcept,
  // animated via shared animFrame), Plain⇄Technical toggle, and either a
  // "Next: <title> →" button or a green "I've got it!" once the last
  // concept is reached.
  const renderBuild = () => {
    // Upcoming concept's short title for the "Next:" button, or null if
    // this IS the last concept.
    const nextTitle = buildConcept < concepts.length - 1
      ? concepts[buildConcept + 1].title.split("—")[0].trim()
      : null;
    return (
      <div>
        {/* Horizontally-scrollable concept picker: one numbered pill per
            concept; tapping resets buildMode to "plain" so jumping concepts
            never strands a student on Technical text for an unseen topic. */}
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
          {/* Animated illustration for THIS concept — ConceptAnimation
              reads buildConcept as `index` and animFrame to animate it. */}
          <div style={s.animBox}><ConceptAnimation index={buildConcept} frame={animFrame} /></div>
          <div style={s.toggleRow}>
            <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
            <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            {/* Only one of these ever renders, based on buildMode. */}
            {buildMode === "plain" && <div style={{ ...s.line, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
            {buildMode === "tech" && <div style={{ ...s.line, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            {/* While concepts remain, advance by 1 and reset to Plain mode;
                on the LAST concept, advance the lesson to stage 2 instead. */}
            {nextTitle
              ? <button style={s.btn()} onClick={() => { setBuildConcept(buildConcept + 1); setBuildMode("plain"); }}>Next: {nextTitle} →</button>
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
            {/* Progress counter, e.g. "3 / 8". */}
            <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── STAGE 2 RENDERER — SEE IT ────────────────────────────────────────────
  // A slower, step-by-step build-up of a tiny file-handling script: one code
  // snippet per step, the simulated terminal output, and a Plain/Technical
  // explanation. seeitStep drives which seeitSteps entry shows; "Next Step"
  // / "← Back" move linearly; on the LAST step the forward button instead
  // reads "Now Let Me Try It!" and advances to stage 3.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Build a Tiny File-Handling Script</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        {/* The growing code snippet for this step. */}
        <div style={s.codeBox}>{step.code}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* The simulated terminal output, colored per-step. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", margin: "0 0 12px", fontFamily: "'Cascadia Code','Consolas',monospace", textAlign: "center", whiteSpace: "pre-wrap" }}>
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

  // ── STAGE 3 RENDERER — TRY IT ────────────────────────────────────────────
  // Hands-on simulation: preset file operations (read existing, write new,
  // append, read missing → ENOENT). Tapping one looks up its filePresets
  // entry and renders a simulated outcome. triedCount increments only the
  // FIRST time an operation is tapped; "Take the Challenge →" appears once
  // at least 3 distinct operations have been tried.
  const renderTryIt = () => {
    const active = filePresets.find((p) => p.label === filePicked);

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Try File Operations on a Simulated Filesystem</div>
        <div style={{ ...s.p, marginBottom: 16 }}>Tap an operation to see its simulated outcome.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {filePresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFilePicked(p.label);
                if (filePicked !== p.label) setTriedCount((c) => c + 1);
              }}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                background: filePicked === p.label ? "#38bdf8" : "#0f172a", color: filePicked === p.label ? "#0f172a" : "#7dd3fc",
              }}
            >{p.label}</button>
          ))}
        </div>

        {/* The simulated filesystem-operation result panel. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{active.op}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: active.color, fontWeight: 700, fontSize: "0.85rem" }}>{active.outcome}</div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "0.8rem" }}>Tap an operation above ↑</div>
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
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 different operations to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ── STAGE 4 RENDERER — CHALLENGE ─────────────────────────────────────────
  // Two back-to-back mini-games: challengePhase 0 → TagMatch (ch1Pairs),
  // gated by ch1Done; phase 1 → BugHunt (bugLines/bugHints), gated by
  // ch2Done. Both child components call onDone the instant the student
  // finishes, revealing the button that moves on.
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
          <div style={s.h2}>🐛 Spot the Server-Freezing Line</div>
          <div style={{ ...s.line, marginBottom: 14 }}>Tap the route handler that blocks the whole server.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ── STAGE 5 RENDERER — QUIZ ──────────────────────────────────────────────
  // If quizDone is true, render ONLY the MODULE-COMPLETE screen — the single
  // call site for onUnitComplete() in this whole file, AND the only place
  // that ever declares Module 5 itself finished, wired to a real onClick,
  // never auto-fired. Otherwise render the current question with its
  // options, hint box (wrong) or explanation box (correct), and
  // Check Answer / Next controls.
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: 12 }}>🎉</div>
          {/* THIS is the one and only screen in the whole M5/M6 build that
              declares "Module 5" itself complete — every other unit's
              completion screen only ever claims its own unit is done. */}
          <div style={s.h2}>Module 5 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>
            {student?.name ? `Amazing work, ${student.name}!` : "Amazing work!"} That's all five units of Module 5 — Node.js &amp; Backend — done!
          </div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned across Module 5:</div>
            {[
              "Unit 5.1 — What Node.js is and why it runs JS outside a browser",
              "Unit 5.2 — Building a raw HTTP server with req/res/listen",
              "Unit 5.3 — npm packages and Node's module system",
              "Unit 5.4 — Express.js: routes, middleware, and req.body",
              "Unit 5.5 — Reading and writing files with fs, sync vs async",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          <div style={{ ...s.line, color: "#7dd3fc", fontSize: "0.8rem" }}>Next up: Module 6 — Databases &amp; APIs, starting with "What is a Database?"</div>
          {/* THE ONLY onUnitComplete() CALL SITE IN THIS FILE — a real
              onClick, exactly once per click, only present once quizDone is
              true. App.jsx's own implementation persists progress and
              routes the student onward (typically to Unit6_1). */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
    // hintIndex clamps to the LAST hint past the hints array's length, so a
    // student who keeps missing always sees SOME hint, never silence, and
    // never anything past the final, still-not-the-answer hint.
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
  // The sticky top bar is ALWAYS visible regardless of `stage`. Below it,
  // exactly one render* function fires, chosen by `stage` — never more than
  // one at once, never zero. App.jsx renders its own floating "← Dashboard"
  // affordance over this whole component elsewhere in the shell.
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 5.5 — Reading & Writing Files</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {/* Personalized welcome line, shown only on Spark so it doesn't
          clutter every subsequent screen. */}
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong> — last stop in Module 5!
        </div>
      )}
      {/* Exactly one of these six is ever true, since `stage` is a single
          number — the actual switch implementing the six-stage flow. */}
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

// ============================================================================
// CONCEPT ANIMATIONS — one small illustration per Build-stage concept. A
// plain, stateless function component: all motion comes from the `frame`
// number Unit5_5 keeps incrementing via its own useEffect/setInterval,
// passed in as a prop on every render. `index` picks exactly one if-block
// below, in the SAME order as the `concepts` array above. Each block
// derives its own animated values from `pos` (a 0..1 sawtooth computed from
// `frame`), returning plain divs styled with inline CSS — no real CSS
// keyframes anywhere; the "animation" is React re-rendering 10x/second with
// a slightly different `pos`.
// ============================================================================
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — "The fs Module": require('fs') box lighting up into a small toolbox
  // icon representing file-system powers being unlocked.
  if (index === 0) {
    const unlocked = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.64rem", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px" }}>require('fs')</div>
          {arrow}
          <div style={{ fontSize: unlocked ? "1.4rem" : "1.1rem", transition: "font-size 0.2s" }}>{unlocked ? "🗂️✅" : "🔒"}</div>
        </div>
      </div>
    );
  }

  // 1 — "fs.readFileSync": a file icon pouring its text directly into a
  // variable box, all in one instant motion (representing the blocking,
  // synchronous, "all at once" nature of the call).
  if (index === 1) {
    const read = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "1.2rem" }}>📄</div>
          <div style={{ fontSize: "0.9rem", color: read ? "#4ade80" : "#475569" }}>{read ? "→→→" : "..."}</div>
          <div style={{ border: read ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "6px 10px", fontSize: "0.6rem", fontWeight: 700, color: read ? "#4ade80" : "#64748b" }}>{read ? "data ✅" : "waiting..."}</div>
        </div>
      </div>
    );
  }

  // 2 — "fs.writeFileSync": old file content fading out, new content fading
  // in to replace it entirely — visualizing overwrite behavior.
  if (index === 2) {
    const overwritten = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#ef4444", opacity: overwritten ? 0.2 : 1, textDecoration: overwritten ? "line-through" : "none" }}>old content</div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: overwritten ? "#4ade80" : "#475569", fontWeight: 700 }}>{overwritten ? "new content ✅" : "..."}</div>
        </div>
      </div>
    );
  }

  // 3 — "Why Sync Calls BLOCK": multiple other request tokens piling up,
  // frozen, behind one big "Sync read in progress" bar.
  if (index === 3) {
    const queued = Math.min(4, Math.floor(pos * 5));
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ border: "2px solid #ef4444", borderRadius: 8, padding: "6px 12px", fontSize: "0.6rem", fontWeight: 700, color: "#ef4444" }}>readFileSync running...</div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: queued }).map((_, i) => (
              <div key={i} style={{ fontSize: "0.85rem", opacity: 0.6 }}>⏸️</div>
            ))}
          </div>
          <div style={{ fontSize: "0.56rem", color: "#fb923c" }}>{queued} requests frozen, waiting...</div>
        </div>
      </div>
    );
  }

  // 4 — "fs.readFile (Callback)": the main thread keeps moving (a small
  // ball cycling) WHILE a separate callback box lights up once "ready".
  if (index === 4) {
    const ready = pos > 0.65;
    const ballPos = (pos * 3) % 1;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: 90 }}>
            <div style={{ fontSize: "0.56rem", color: "#94a3b8" }}>main thread</div>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", marginLeft: ballPos * 20 }} />
          </div>
          <div style={{ border: ready ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "5px 10px", fontSize: "0.58rem", fontWeight: 700, color: ready ? "#4ade80" : "#64748b" }}>{ready ? "callback(err,data) ✅" : "reading in background..."}</div>
        </div>
      </div>
    );
  }

  // 5 — "fs.promises + async/await": a Promise box resolving into a clean
  // checkmark, paired with a small "await" label pausing only one lane.
  if (index === 5) {
    const resolved = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#a78bfa" }}>await</div>
          <div style={{ border: resolved ? "2px solid #4ade80" : "1px dashed #a78bfa", borderRadius: 8, padding: "6px 10px", fontSize: "0.6rem", fontWeight: 700, color: resolved ? "#4ade80" : "#a78bfa" }}>{resolved ? "Promise resolved ✅" : "Promise pending..."}</div>
        </div>
      </div>
    );
  }

  // 6 — "path.join": two OS icons (Windows / Linux) each producing a
  // correctly-separated path string from the same join() call.
  if (index === 6) {
    const showWin = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#94a3b8" }}>path.join('data','notes.txt')</div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.62rem", fontWeight: 700, color: "#4ade80" }}>{showWin ? "data\\\\notes.txt (Windows)" : "data/notes.txt (Mac/Linux)"}</div>
        </div>
      </div>
    );
  }

  // 7 — "fs.appendFile + ENOENT": one file growing with an extra line
  // appended, beside a separate "missing file" icon flashing an ENOENT tag.
  const appended = pos > 0.5;
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <div style={{ fontSize: "1rem" }}>📄</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.54rem", color: appended ? "#4ade80" : "#94a3b8" }}>{appended ? "+ new line ✅" : "line 1"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <div style={{ fontSize: "1rem", opacity: 0.5 }}>❓</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.54rem", color: "#ef4444", fontWeight: 700 }}>ENOENT</div>
        </div>
      </div>
    </div>
  );
}

// ── TAG MATCH — wrong tap shows that pair's hint immediately ───────────────
// Generic, reusable mini-game: tap a "code" tile, then tap the "meaning"
// tile believed to match it. Correct → locks green. Wrong → flashes red and
// shows that pair's own `hint`. Once every pair is matched, onDone() fires
// once, letting the parent reveal its "Next" button.
function TagMatch({ pairs, onDone }) {
  // matched: { [code]: meaning } for every successfully matched pair.
  const [matched, setMatched] = useState({});
  // selected: which single tile (code OR meaning) is currently "armed".
  const [selected, setSelected] = useState(null);
  // flashWrong: which meaning tile should flash red right now.
  const [flashWrong, setFlashWrong] = useState(null);
  // hintMsg: the explanatory hint shown after a wrong attempt.
  const [hintMsg, setHintMsg] = useState(null);
  // shuffledMeanings: meanings column shuffled ONCE on mount (useRef
  // pattern) so it doesn't trivially mirror the codes column's order.
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
// Generic, reusable mini-game: a list of code lines, exactly one
// `buggy: true`. Tapping it reveals it (green, with its `why` explanation)
// and fires onDone(). Tapping any other line increments wrongAttempts and
// shows the next escalating hint from `hints[]`, which NEVER states which
// line is the bug outright — only nudges reasoning toward it.
function BugHunt({ lines, hints, onDone }) {
  // revealed: flips true once the genuinely buggy line is tapped.
  const [revealed, setRevealed] = useState(false);
  // wrongTap: index of whichever line should flash red right now.
  const [wrongTap, setWrongTap] = useState(null);
  // wrongAttempts: total incorrect taps so far, indexing the hint shown.
  const [wrongAttempts, setWrongAttempts] = useState(0);

  function tap(line, i) {
    if (revealed) return;
    if (line.buggy) { setRevealed(true); onDone(); }
    else { setWrongTap(i); setWrongAttempts((a) => a + 1); setTimeout(() => setWrongTap(null), 600); }
  }

  // hintIndex clamps to the LAST hint, mirroring the Quiz stage's same
  // escalation formula, so a student who keeps missing always sees SOME hint.
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
