// ============================================================================
//  UNIT 6.3 — "Connecting Node to a DB"
//  Module: M6 — Databases & APIs (THIRD and FINAL unit of this module — once
//  this unit's quiz is finished, Module 6 itself is done. This is also the
//  capstone of the Node.js + Database arc spanning Modules 5 and 6 together
//  — but the completion screen below deliberately only claims "Module 6
//  complete", never "the whole course is finished", since further modules
//  may follow.)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - src/shell/App.jsx looks up "Unit6_3" in config/course.config.js and
//    renders <Unit6_3 student={...} onUnitComplete={...} />, waiting for
//    onUnitComplete() to fire exactly once, from the Quiz screen's final
//    button only. No api.js / gas.config.js imports here — lessons are
//    offline, pure-UI React components. `student` is a read-only
//    { rollNo, name, batch }-shaped object handed down so this lesson can
//    say "Nice work, <name>" without knowing how it was fetched.
//    onUnitComplete is App.jsx's own callback; its implementation persists
//    progress via api.js/gas.config.js and routes the student onward to
//    whatever module comes after M6 — this file just calls it bare, once.
//
//  HOUSE STYLE (matches every other unit in this course):
//  - Six-stage flow, same order every time:
//      Stage 0 SPARK     — one prediction question, before any teaching.
//      Stage 1 BUILD     — 8 concepts, each {title, plain, technical} +
//                          a ConceptAnimation + Plain⇄Tech toggle, plus a
//                          horizontally-scrollable concept-picker strip.
//      Stage 2 SEE IT    — step-by-step build of a tiny async Express route
//                          that queries a database, one code snippet +
//                          simulated terminal/response per step.
//      Stage 3 TRY IT    — simulated requests against a fake DB-backed
//                          Express route (successful query, empty result,
//                          DB connection failure).
//      Stage 4 CHALLENGE — TagMatch (term→meaning) then BugHunt (hardcoding
//                          a DB password directly in source code instead of
//                          using an env var).
//      Stage 5 QUIZ      — 12 questions, escalating hints, never revealing
//                          the answer. Completion screen is the ONLY call
//                          site for onUnitComplete() AND the only place that
//                          declares Module 6 itself finished.
//  - Same shared inline-style object `s` as every other unit.
//  - Mobile-first: every width is %, flexWrap, or clamp()/minmax() — no
//    fixed px widths, since this course runs on phones in class.
//
//  CONTENT TAUGHT (Build-stage concepts, 8 total):
//    1. The full flow: client request → Express route → DB query → response.
//    2. Drivers/ORMs are just npm packages (e.g. pg, mongoose) doing the
//       talking to the database for you.
//    3. Connection strings — one string telling Node where/how to connect.
//    4. Async DB queries — await db.find(...) since every query takes time.
//    5. Schemas/Models — defining the shape data must follow.
//    6. Env vars for secrets — process.env.DB_URL, never hardcoded.
//    7. Putting it together — one async Express route that queries a DB.
//    8. Handling DB errors — try/catch around the query; what the client
//       sees if the database itself is unreachable.
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

export default function Unit6_3({ student, onUnitComplete }) {
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

  // TRY IT: reqPicked is the label of the last-tapped simulated request;
  // triedCount counts DISTINCT requests tried, gating the Challenge button
  // until it reaches 3 (this unit's rule).
  const [reqPicked, setReqPicked] = useState(null);
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
      title: "The Full Flow",
      plain: "Client asks Express, Express asks the database, the database answers back.",
      technical: "Request → route handler → DB query (await) → response, end to end.",
    },
    {
      title: "Drivers & ORMs Are Just npm Packages",
      plain: "Packages like pg or mongoose do the actual talking to the database for you.",
      technical: "A driver/ORM wraps the database's wire protocol behind a friendly JS API.",
    },
    {
      title: "Connection Strings",
      plain: "One string tells Node exactly where the database is and how to log in.",
      technical: "A connection string bundles host, port, db name, and credentials into one URL.",
    },
    {
      title: "Async DB Queries",
      plain: "Every database query takes time, so you always await it.",
      technical: "DB drivers return Promises; await pauses only that function until data arrives.",
    },
    {
      title: "Schemas & Models",
      plain: "A schema defines exactly what fields a piece of data must have.",
      technical: "A Model wraps a schema, giving you methods like find/create validated against it.",
    },
    {
      title: "Env Vars for Secrets",
      plain: "process.env.DB_URL keeps passwords out of your actual source code.",
      technical: "Environment variables inject secrets at runtime, never committed to version control.",
    },
    {
      title: "Putting It Together",
      plain: "One async route: receive request, await the DB query, send the result back.",
      technical: "app.get(path, async (req,res) => { const data = await Model.find(); res.json(data); }).",

    },
    {
      title: "Handling DB Errors",
      plain: "If the database is unreachable, a try/catch keeps your server from crashing.",
      technical: "Wrapping the await in try/catch lets you return a clean 500 instead of crashing.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  // Each has an escalating hints[] array (2-3 hints) nudging reasoning
  // WITHOUT ever stating the correct option's text, plus a fixed
  // `explanation` shown only after a correct answer.
  const quizQuestions = [
    {
      q: "In the full client-to-database flow, what is the correct order of steps?",
      options: [
        "Database → client → Express, all simultaneously",
        "Client sends a request → Express route handler runs → it queries the database → the result is sent back as the response",
        "Express talks directly to the client's browser storage, no database involved",
        "The database sends requests TO the client first",
      ],
      answer: 1,
      hints: [
        "Think about who initiates this whole chain of events — it's the same client that always starts an HTTP exchange.",
        "Express sits in the MIDDLE — it doesn't talk to the client and the database at the exact same instant, but in sequence.",
        "The request starts at the client, Express's route handler receives it, that handler queries the database, and finally the response (built from the DB result) goes back to the client.",
      ],
      explanation: "The flow is sequential: client request → Express route handler → database query → response built from the query result, sent back to the client.",
    },
    {
      q: "What is a 'database driver' or 'ORM' like pg or mongoose, fundamentally?",
      options: [
        "A separate database that replaces the real one",
        "An npm package that handles the actual communication with a specific database, exposing a JS-friendly API",
        "A type of HTTP middleware unrelated to databases",
        "A built-in part of Node — no installation ever needed",
      ],
      answer: 1,
      hints: [
        "Recall Unit 5.3 — how do you normally add new functionality written by someone else into a Node project?",
        "You install these the exact same way you install Express — they aren't built into Node itself.",
        "Drivers and ORMs are npm packages you install, handling the low-level protocol talk to a specific database while giving you familiar JS methods to call instead.",
      ],
      explanation: "Database drivers/ORMs (like pg for Postgres or mongoose for MongoDB) are npm packages — installed just like Express — that handle the actual wire-protocol communication with a specific database and expose a JS-friendly API.",
    },
    {
      q: "What is a 'connection string' used for?",
      options: [
        "It's just a comment describing the database, with no functional purpose",
        "It bundles together the host, port, database name, and credentials needed to connect to a specific database",
        "It's the name of the npm package being installed",
        "It defines what fields a piece of data must have",
      ],
      answer: 1,
      hints: [
        "Think about everything Node needs to know just to LOCATE and LOG IN to a remote database.",
        "It's usually one single string, often shaped like a URL (e.g. starting with postgres:// or mongodb://).",
        "A connection string packs the host, port, database name, and login credentials into one string — everything the driver needs to actually connect.",
      ],
      explanation: "A connection string is a single string (often URL-shaped) bundling the host, port, database name, and credentials your driver needs to establish a connection.",
    },
    {
      q: "const users = await db.find({ active: true }); — why is `await` necessary here?",
      options: [
        "It isn't necessary, it's purely decorative",
        "Database queries take real time to complete, and the driver returns a Promise that await waits on",
        "await makes the query run twice as fast",
        "await deletes the result after using it once",
      ],
      answer: 1,
      hints: [
        "Querying a database is fundamentally similar to one other thing this course already covered, that ALSO needs await — think back to Unit 5.5.",
        "The driver method doesn't return the actual data directly — it returns something else first.",
        "DB queries take real time (network + disk), so drivers return a Promise; await pauses only this async function until that Promise resolves with the actual data.",
      ],
      explanation: "Database queries are asynchronous because they take real time — the driver method returns a Promise, and await pauses execution of the current async function until that Promise resolves with the query result.",
    },
    {
      q: "What is the main purpose of a 'schema' (e.g. in mongoose)?",
      options: [
        "It makes queries run without needing await",
        "It defines the expected shape/fields of a piece of data, so the ORM can validate against it",
        "It replaces the need for a database driver entirely",
        "It is only used for styling the database's admin dashboard",
      ],
      answer: 1,
      hints: [
        "Think about a form with required fields — a schema plays a similar role for data going INTO a database.",
        "Without this, nothing would stop you from saving wildly inconsistent records with random fields.",
        "A schema defines the expected fields/types for a piece of data, letting the ORM validate that new records match that shape before saving them.",
      ],
      explanation: "A schema defines the expected shape of data (which fields exist, their types, whether they're required) so the ORM can validate records against it before saving — a Model is then built around that schema.",
    },
    {
      q: "Why use process.env.DB_URL instead of writing the actual connection string (with the real password) directly in your .js file?",
      options: [
        "process.env.DB_URL runs the query faster",
        "Hardcoded secrets in source code can leak — anyone with the code (or a public repo) sees the real password; env vars keep secrets out of the code itself",
        "There is no real difference; it's purely a style preference",
        "process.env.DB_URL is required by JavaScript syntax rules",
      ],
      answer: 1,
      hints: [
        "Think about who might ever see your source code — teammates, a public GitHub repo, anyone you share it with.",
        "A hardcoded password sits right there in plain text, forever, in every copy of that file.",
        "Env vars keep secrets like passwords OUT of the actual source code — they're injected at runtime instead, so the password never has to be visible in a file anyone might read or commit to version control.",
      ],
      explanation: "Hardcoding a password directly in source code means anyone who sees that code (teammates, a public repo, version history) sees the real secret. Environment variables (process.env.DB_URL) inject secrets at runtime, keeping them out of the code itself.",
    },
    {
      q: "app.get(\"/users\", async (req, res) => { const users = await Model.find(); res.json(users); }); — what makes this route handler itself 'async'?",
      options: [
        "Nothing special — all Express route handlers are async by default already",
        "The `async` keyword lets this function use `await` inside it, specifically to wait on the DB query's Promise",
        "It's only async because res.json() requires it",
        "Adding 'async' makes the route run on a separate server",
      ],
      answer: 1,
      hints: [
        "Recall the basic JS rule about WHERE the `await` keyword is allowed to appear.",
        "Marking the handler function itself with `async` is what unlocks using `await` anywhere inside its body.",
        "`await` can only be used inside a function marked `async` — that's exactly why this route handler is declared `async (req, res) => {...}`, so it can await the DB query.",
      ],
      explanation: "await can only be used inside an async function. Marking the route handler async unlocks using await inside it, specifically to pause for the DB query's Promise to resolve before sending the response.",
    },
    {
      q: "What is the risk of writing a DB-querying route handler WITHOUT a try/catch around the await call?",
      options: [
        "There is no risk — await calls can never fail",
        "If the database query fails or the DB is unreachable, the error goes unhandled and the request can crash or hang ungracefully",
        "try/catch is required by JavaScript syntax for every await",
        "Skipping try/catch makes the query run faster",
      ],
      answer: 1,
      hints: [
        "Think about what happens to a Promise that REJECTS instead of resolving, if nothing is there to catch that rejection.",
        "A real database can genuinely go down, time out, or refuse the connection — these aren't purely hypothetical failures.",
        "Without try/catch, a rejected query Promise becomes an uncaught error, which can crash the handler or leave the client without any clean response — try/catch lets you return a controlled error (like a 500) instead.",
      ],
      explanation: "Without try/catch, a failed/rejected DB query becomes an unhandled error in that request, which can crash the handler ungracefully. Wrapping the await in try/catch lets you catch the failure and return a clean error response instead.",
    },
    {
      q: "try {\n  const data = await db.find();\n  res.json(data);\n} catch (err) {\n  res.status(500).json({ error: \"Database unavailable\" });\n}\nWhat does the catch block specifically protect against?",
      options: [
        "It prevents the route from ever being called twice",
        "It catches a failed/rejected DB query (e.g. connection lost) and responds with a controlled error instead of crashing",
        "It speeds up successful queries",
        "It automatically retries the query 100 times",
      ],
      answer: 1,
      hints: [
        "catch blocks only ever run when something inside the try block actually throws or rejects.",
        "Think about what kind of real-world failure (not a bug in your code) could cause db.find() to reject.",
        "The catch block runs specifically when the awaited db.find() call rejects (e.g. the database connection failed), letting the handler send back a controlled 500 error response instead of crashing.",
      ],
      explanation: "The catch block activates only when the awaited query rejects — for example if the database connection is lost. Instead of crashing, it sends a controlled error response (status 500) back to the client.",
    },
    {
      q: "Which combination correctly distinguishes 'Module 5: Node.js & Backend' work from 'Module 6: Databases & APIs' work, based on everything covered in both modules?",
      options: [
        "Module 5 covered only CSS; Module 6 covered only HTML",
        "Module 5 covered the server itself (http, Express, files); Module 6 covered storing/structuring data and designing the API surface around it",
        "Module 5 and Module 6 cover identical, fully overlapping content",
        "Module 6 came before Module 5 in this course",
      ],
      answer: 1,
      hints: [
        "Think back across all 5 units of Module 5 and the first 2 units of Module 6 — what was the THEME of each?",
        "One module was about building the server that handles requests; the other was about what that server stores and how its endpoints are shaped.",
        "Module 5 (Node.js & Backend) built the server itself — raw HTTP, Express, file I/O. Module 6 (Databases & APIs) covered storing/structuring data (databases, CRUD) and designing the API surface (REST), now connected together in this very unit.",
      ],
      explanation: "Module 5 focused on building the server itself (raw HTTP, Express routing, file I/O), while Module 6 focused on databases (storage, CRUD) and REST API design — this unit (6.3) is where the two threads connect: a real Express server querying a real database.",
    },
    {
      q: "A teammate writes: const conn = \"mongodb://admin:SuperSecret123@prod-db:27017\"; directly in server.js, then commits it to a public GitHub repo. What is the main problem?",
      options: [
        "Nothing — connection strings are meant to be public",
        "The real database password is now visible to anyone who can see that public repo, a serious security risk",
        "MongoDB connection strings can only be used once",
        "The code will fail to run because of a syntax error",
      ],
      answer: 1,
      hints: [
        "Think about who can see a PUBLIC repository on GitHub — it isn't just the original developer.",
        "This is exactly the scenario env vars (process.env.DB_URL) exist to prevent.",
        "Hardcoding the real password into a publicly-committed file exposes it to anyone who can view that repo — exactly why secrets belong in environment variables instead, never directly in source code.",
      ],
      explanation: "Committing a real password directly into a public repository exposes it to anyone with access to that repo — this is precisely the risk env vars (process.env.DB_URL) are designed to eliminate by keeping secrets out of source code entirely.",
    },
    {
      q: "Putting together everything from this unit, which line BEST represents a safe, correctly-async, DB-connected Express route?",
      options: [
        "app.get(\"/users\", (req, res) => { res.json(db.find()); });",
        "app.get(\"/users\", async (req, res) => { try { const users = await Model.find(); res.json(users); } catch (err) { res.status(500).json({ error: \"DB error\" }); } });",
        "app.get(\"/users\", () => { const pw = \"hunter2\"; });",
        "app.get(\"/users\", (req, res) => { res.json(\"users\"); });",
      ],
      answer: 1,
      hints: [
        "Eliminate any option missing the `async` keyword first — those can't legally use `await` inside.",
        "Eliminate any option that queries the database but has no try/catch around it, or hardcodes a secret.",
        "Only one option is marked async, properly awaits the DB query inside a try/catch, and sends a clean error response on failure — that's the safe, complete pattern this whole unit builds toward.",
      ],
      explanation: "The safe pattern combines everything from this unit: an async route handler, an awaited DB query (Model.find()), and a try/catch that returns a controlled error response if the query fails — exactly the structure shown in the 'Putting It Together' concept.",
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

  // ── CONTENT: See-It steps — building one async, DB-connected route ─────
  // Each step pairs a growing code snippet with the SIMULATED terminal
  // output it would produce. Nothing here is live executed — these are
  // pre-written strings made to LOOK like a real terminal/HTTP exchange.
  const seeitSteps = [
    {
      plain: "First, connect using a connection string from an env var.",
      tech: "process.env.DB_URL keeps the real credentials out of this file.",
      code: "const mongoose = require(\"mongoose\");\nmongoose.connect(process.env.DB_URL);",
      result: "(connecting... credentials never appear in this file)",
      resultColor: "#94a3b8",
    },
    {
      plain: "Define a schema describing what a User must look like.",
      tech: "The schema is the contract every saved User document must follow.",
      code: "const userSchema = new mongoose.Schema({\n  name: String,\n  email: String,\n});\nconst User = mongoose.model(\"User\", userSchema);",
      result: "(User model ready — not queried yet)",
      resultColor: "#94a3b8",
    },
    {
      plain: "Write an async route that awaits a real DB query.",
      tech: "await User.find() pauses only this handler until results arrive.",
      code: "app.get(\"/users\", async (req, res) => {\n  const users = await User.find();\n  res.json(users);\n});",
      result: "(route registered — awaiting the next request)",
      resultColor: "#94a3b8",
    },
    {
      plain: "A client requests /users and gets real DB data back.",
      tech: "GET /users → 200 with the array User.find() resolved to.",
      code: "// browser: GET /users",
      result: "GET /users → 200\n[{ name: \"Asha\", email: \"asha@x.com\" }, ...]",
      resultColor: "#4ade80",
    },
    {
      plain: "Wrap it in try/catch so a DB outage doesn't crash the route.",
      tech: "catch(err) returns a clean 500 instead of an unhandled rejection.",
      code: "app.get(\"/users\", async (req, res) => {\n  try {\n    const users = await User.find();\n    res.json(users);\n  } catch (err) {\n    res.status(500).json({ error: \"Database unavailable\" });\n  }\n});",
      result: "(DB down) GET /users → 500 { error: \"Database unavailable\" }",
      resultColor: "#ef4444",
    },
  ];

  // ── CONTENT: Try-It presets — simulated DB-backed requests ──────────────
  const requestPresets = [
    { label: "GET /users (success)", status: 200, statusColor: "#4ade80", body: '[{"name":"Asha"},{"name":"Ravi"}]', note: "await User.find() resolved with real documents — 200 OK." },
    { label: "GET /users (empty DB)", status: 200, statusColor: "#38bdf8", body: "[]", note: "The query succeeded, it just found zero matching documents — still 200, not an error." },
    { label: "GET /users/999 (not found)", status: 404, statusColor: "#fb923c", body: '{"error":"User not found"}', note: "The query ran fine but no document matched id 999." },
    { label: "GET /users (DB down)", status: 500, statusColor: "#ef4444", body: '{"error":"Database unavailable"}', note: "The await rejected — caught by try/catch, returning a controlled 500 instead of crashing." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch pairs (term → meaning) ─────────────
  const ch1Pairs = [
    { code: "driver / ORM", meaning: "An npm package that talks to a specific database for you", hint: "Recall Unit 5.3 — how does new functionality usually get added to a Node project?" },
    { code: "connection string", meaning: "Bundles host, port, db name, and credentials into one string", hint: "Think about everything needed just to LOCATE and LOG IN to a database." },
    { code: "schema", meaning: "Defines the required shape/fields of a piece of data", hint: "Think of it like required fields on a form." },
    { code: "process.env.DB_URL", meaning: "Injects a secret connection string at runtime, kept out of source code", hint: "This is how passwords avoid ending up in a public GitHub repo." },
    { code: "await Model.find()", meaning: "Pauses the async function until the DB query's Promise resolves", hint: "DB queries take real time — this is the keyword that waits for them." },
    { code: "try/catch around await", meaning: "Returns a controlled error instead of crashing if the DB query fails", hint: "Think about what should happen if the database itself goes down." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: hardcoded DB password ─────────────
  const bugLines = [
    { text: "const mongoose = require(\"mongoose\");", buggy: false },
    { text: "mongoose.connect(\"mongodb://admin:SuperSecret123@prod-db:27017\");", buggy: true, why: "This hardcodes the real database password directly in source code. Anyone who sees this file — a teammate, or anyone with access to the repo (especially if it's public) — sees the real credentials. Fix: use mongoose.connect(process.env.DB_URL); instead, and keep the real string in an untracked .env file." },
    { text: "const User = mongoose.model(\"User\", userSchema);", buggy: false },
    { text: "app.listen(3000);", buggy: false },
  ];
  const bugHints = [
    "Three of these four lines are completely normal setup code. One line exposes something that should never be visible in source code.",
    "Look closely at the connect() call — does it reference an env var, or does it contain something more literal?",
    "The connect() line hardcodes the actual password 'SuperSecret123' directly in the file instead of reading it from process.env.DB_URL. Tap that line.",
  ];

  // ── SHARED STYLE OBJECT — copied verbatim from Unit4_5.jsx/Unit6_2.jsx ─
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
  // Poses one prediction question BEFORE any teaching: where does the
  // password for connecting to a real database actually belong? Student
  // must pick a guess and submit before seeing the reveal; only then does a
  // "Start Learning →" button advance to Build.
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🔌</div>
        <div style={s.h2}>Your Express server needs a DB password. Where should it live?</div>
      </div>

      <div style={{ ...s.p, color: "#cbd5e1", textAlign: "center" }}>
        Real apps connect Express routes to real databases — but HOW matters a lot.
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Take your best guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Typed directly into the .js file, right next to the connect() call",
              "Kept out of the code entirely, injected at runtime via an environment variable",
              "Sent to every client so they can connect too",
              "Stored as a comment so developers remember it",
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
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>process.env.DB_URL</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "Kept out of the code entirely, injected at runtime via an environment variable" ? "🎯 Exactly right!" : "Close enough to investigate — here's what's really going on."}
          </div>
          <div style={s.line}>Env vars keep real secrets out of any file a teammate (or the public) might ever see.</div>
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
  // A slower, step-by-step build-up of one async, DB-connected Express
  // route: one code snippet per step, the simulated terminal/response
  // result, and a Plain/Technical explanation. seeitStep drives which
  // seeitSteps entry shows; "Next Step" / "← Back" move linearly; on the
  // LAST step the forward button instead reads "Now Let Me Try It!" and
  // advances to stage 3.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Build One DB-Connected Route</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        {/* The growing code snippet for this step. */}
        <div style={s.codeBox}>{step.code}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* The simulated terminal/response result, colored per-step. */}
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
  // Hands-on simulation: preset requests against a fake DB-backed Express
  // route (successful query, empty result, not-found, DB-down 500). Tapping
  // one looks up its requestPresets entry and renders a simulated response.
  // triedCount increments only the FIRST time a given request is tapped;
  // "Take the Challenge →" appears once at least 3 distinct requests have
  // been tried.
  const renderTryIt = () => {
    const active = requestPresets.find((p) => p.label === reqPicked);

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Send Requests to a Simulated DB-Backed Route</div>
        <div style={{ ...s.p, marginBottom: 16 }}>Tap a request to see its simulated response.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {requestPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setReqPicked(p.label);
                if (reqPicked !== p.label) setTriedCount((c) => c + 1);
              }}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.66rem", fontWeight: 700, cursor: "pointer",
                background: reqPicked === p.label ? "#38bdf8" : "#0f172a", color: reqPicked === p.label ? "#0f172a" : "#7dd3fc",
              }}
            >{p.label}</button>
          ))}
        </div>

        {/* The simulated HTTP exchange panel. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: active.statusColor, fontWeight: 700, fontSize: "0.92rem" }}>{active.status}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: "#7dd3fc", fontSize: "0.78rem", wordBreak: "break-word" }}>{active.body}</div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "0.8rem" }}>Tap a request above ↑</div>
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
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 different requests to unlock the next stage ({triedCount}/3).</div>}
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
          <div style={s.h2}>🐛 Spot the Exposed Secret</div>
          <div style={{ ...s.line, marginBottom: 14 }}>Tap the line that hardcodes a real DB password.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ── STAGE 5 RENDERER — QUIZ ──────────────────────────────────────────────
  // If quizDone is true, render ONLY the MODULE-COMPLETE screen — the single
  // call site for onUnitComplete() in this whole file, AND the only place
  // that ever declares Module 6 itself finished, wired to a real onClick,
  // never auto-fired. Otherwise render the current question with its
  // options, hint box (wrong) or explanation box (correct), and
  // Check Answer / Next controls.
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: 12 }}>🎉</div>
          {/* THIS is the one and only screen in this whole build that
              declares "Module 6" itself complete — deliberately NOT
              claiming the entire course is finished, since more modules
              may follow beyond M5/M6. */}
          <div style={s.h2}>Module 6 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>
            {student?.name ? `Amazing work, ${student.name}!` : "Amazing work!"} That's all three units of Module 6 — Databases &amp; APIs — done!
          </div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned across Module 6:</div>
            {[
              "Unit 6.1 — What a database is and the CRUD operations",
              "Unit 6.2 — Designing clean, RESTful API endpoints",
              "Unit 6.3 — Connecting an Express server to a real database, safely",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* Closing line acknowledging this caps the Node.js+DB arc across
              Modules 5 AND 6 together, WITHOUT claiming the whole course is
              finished — more modules may follow beyond this point. */}
          <div style={{ ...s.line, color: "#7dd3fc", fontSize: "0.8rem" }}>
            Together with Module 5, you've now built the full backend arc: a real Node.js server, talking to a real database, through a real REST API.
          </div>
          {/* THE ONLY onUnitComplete() CALL SITE IN THIS FILE — a real
              onClick, exactly once per click, only present once quizDone is
              true. App.jsx's own implementation persists progress and
              routes the student onward to whatever module follows M6. */}
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
        <div style={s.topTitle}>Unit 6.3 — Connecting Node to a DB</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {/* Personalized welcome line, shown only on Spark so it doesn't
          clutter every subsequent screen. */}
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong> — last stop in Module 6!
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
// number Unit6_3 keeps incrementing via its own useEffect/setInterval,
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

  // 0 — "The Full Flow": a packet traveling client → Express → DB → back,
  // four stops total, one lit at a time as `pos` advances.
  if (index === 0) {
    const stops = ["💻", "⚙️", "🗄️", "⚙️"];
    const active = Math.floor(pos * 4) % 4;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {stops.map((icon, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: "1.1rem", opacity: active === i ? 1 : 0.35, transform: active === i ? "scale(1.3)" : "scale(1)", transition: "all 0.2s" }}>{icon}</div>
              {i < stops.length - 1 && <div style={{ fontSize: "0.7rem", color: "#475569" }}>→</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 1 — "Drivers & ORMs Are Just npm Packages": an npm box morphing into a
  // small "talking to DB" connector icon.
  if (index === 1) {
    const connected = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: "0.6rem", color: "#fb923c", fontFamily: "monospace" }}>npm i mongoose</div>
          {arrow}
          <div style={{ border: connected ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "6px 10px", fontSize: "0.6rem", fontWeight: 700, color: connected ? "#4ade80" : "#64748b" }}>{connected ? "🗄️ connected" : "..."}</div>
        </div>
      </div>
    );
  }

  // 2 — "Connection Strings": a single string visually splitting into its
  // four component parts (host, port, db, credentials).
  if (index === 2) {
    const split = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {!split ? (
            <div style={{ fontFamily: "monospace", fontSize: "0.56rem", color: "#94a3b8" }}>mongodb://user:pass@host:27017/db</div>
          ) : (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {["user:pass", "host", "27017", "db"].map((part) => (
                <div key={part} style={{ border: "1px solid #38bdf8", borderRadius: 6, padding: "3px 6px", fontSize: "0.52rem", color: "#38bdf8", fontFamily: "monospace" }}>{part}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3 — "Async DB Queries": a query box pulsing while "waiting", then
  // turning green with returned data once `pos` crosses the threshold.
  if (index === 3) {
    const resolved = pos > 0.6;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#a78bfa" }}>await db.find()</div>
          <div style={{ border: resolved ? "2px solid #4ade80" : "1px dashed #a78bfa", borderRadius: 8, padding: "6px 10px", fontSize: "0.58rem", fontWeight: 700, color: resolved ? "#4ade80" : "#a78bfa" }}>{resolved ? "data ✅" : "pending..."}</div>
        </div>
      </div>
    );
  }

  // 4 — "Schemas & Models": a loose blob of fields snapping into a
  // structured, validated box shape.
  if (index === 4) {
    const structured = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {!structured ? (
            <div style={{ fontSize: "0.58rem", color: "#fb923c" }}>name? email? age?? 🤷</div>
          ) : (
            <div style={{ border: "2px solid #4ade80", borderRadius: 8, padding: "6px 10px", fontSize: "0.58rem", color: "#4ade80", fontFamily: "monospace", fontWeight: 700 }}>{"{ name, email }"} ✅</div>
          )}
        </div>
      </div>
    );
  }

  // 5 — "Env Vars for Secrets": a password string fading out of a code file
  // and reappearing inside a separate, locked ".env" box.
  if (index === 5) {
    const moved = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: moved ? "#475569" : "#ef4444", opacity: moved ? 0.3 : 1 }}>server.js</div>
          {arrow}
          <div style={{ border: moved ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "6px 10px", fontSize: "0.58rem", color: moved ? "#4ade80" : "#64748b", fontWeight: 700 }}>{moved ? "🔒 .env ✅" : "..."}</div>
        </div>
      </div>
    );
  }

  // 6 — "Putting It Together": req in, await arrow through a DB icon, then
  // res out — the three core pieces lighting up in sequence.
  if (index === 6) {
    const active = Math.floor(pos * 3) % 3;
    const parts = ["req →", "🗄️ await", "→ res"];
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 10 }}>
          {parts.map((p, i) => (
            <div key={p} style={{
              border: active === i ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 8, padding: "6px 10px",
              fontSize: "0.6rem", fontWeight: 700, color: active === i ? "#38bdf8" : "#64748b", fontFamily: "monospace",
            }}>{p}</div>
          ))}
        </div>
      </div>
    );
  }

  // 7 — "Handling DB Errors": a try/catch box with two outcome paths — one
  // green (success) one red (caught error) — alternating which lights up.
  const errorPath = pos > 0.5;
  return (
    <div style={base}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "#94a3b8" }}>try {"{ await db.find() }"}</div>
        <div style={{
          border: errorPath ? "2px solid #ef4444" : "2px solid #4ade80", borderRadius: 8, padding: "6px 10px",
          fontSize: "0.58rem", fontWeight: 700, color: errorPath ? "#ef4444" : "#4ade80",
        }}>{errorPath ? "catch → 500 (handled)" : "success → 200"}</div>
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
