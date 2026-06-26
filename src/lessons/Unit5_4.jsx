// ============================================================================
//  UNIT 5.4 — "Express.js Basics"
//  Module: M5 — Node.js & Backend (FOURTH unit of this module — 5 units
//  total in M5; this file only ever claims "Unit 5.4 complete", never
//  "Module 5 complete", because Unit 5.5 ("Reading & Writing Files") still
//  lies ahead.)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - src/shell/App.jsx looks up "Unit5_4" in config/course.config.js and
//    renders <Unit5_4 student={...} onUnitComplete={...} />, waiting for
//    onUnitComplete() to fire exactly once, from the Quiz screen's final
//    button only. No api.js / gas.config.js imports here — lessons are
//    offline, pure-UI React components. `student` is a read-only
//    { rollNo, name, batch }-shaped object handed down so this lesson can
//    say "Nice work, <name>" without knowing how it was fetched.
//    onUnitComplete is App.jsx's own callback; its implementation persists
//    progress via api.js/gas.config.js and routes the student onward
//    (typically to Unit5_5) — this file just calls it bare, once.
//
//  HOUSE STYLE (matches every other unit in this course):
//  - Six-stage flow, same order every time:
//      Stage 0 SPARK     — one prediction question, before any teaching.
//      Stage 1 BUILD     — 8 concepts, each {title, plain, technical} +
//                          a ConceptAnimation + Plain⇄Tech toggle, plus a
//                          horizontally-scrollable concept-picker strip.
//      Stage 2 SEE IT    — step-by-step build of a tiny Express app, one
//                          code snippet + simulated request/response per step.
//      Stage 3 TRY IT    — simulated requests against a fake Express app
//                          (GET /, GET /users/:id, POST /login with body).
//      Stage 4 CHALLENGE — TagMatch (term→meaning) then BugHunt (middleware
//                          forgetting next(), hanging the request).
//      Stage 5 QUIZ      — 12 questions, escalating hints, never revealing
//                          the answer. Completion screen is the ONLY call
//                          site for onUnitComplete().
//  - Same shared inline-style object `s` as every other unit.
//  - Mobile-first: every width is %, flexWrap, or clamp()/minmax() — no
//    fixed px widths, since this course runs on phones in class.
//
//  CONTENT TAUGHT (Build-stage concepts, 8 total):
//    1. Why Express exists (raw http + if/else gets messy).
//    2. const app = express(); app.listen(PORT).
//    3. app.get/app.post — route handlers per method+path.
//    4. res.send/res.json/res.status vs raw res.end.
//    5. Route params — req.params.id from /users/:id.
//    6. What middleware is (runs between request and handler).
//    7. app.use() + next() — registering middleware, passing control on.
//    8. express.json() + req.body — parsing JSON request bodies.
//
//  EXTRA COMMENT DENSITY (per global CLAUDE.md house rule): nearly every
//  state declaration, render function, and non-trivial JSX block below
//  carries its own explanatory comment — both WHAT it does and HOW it
//  threads into the six-stage flow / App.jsx's contract.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit5_4({ student, onUnitComplete }) {
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
  // completion screen — the ONLY place onUnitComplete() is ever called.
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
      title: "Why Express Exists",
      plain: "Raw http + an if/else per route turns into a mess past a few routes.",
      technical: "Express replaces manual URL/method branching with a declarative routing API.",
    },
    {
      title: "Starting an Express App",
      plain: "const app = express(); app.listen(PORT) boots your server in two lines.",
      technical: "express() builds an app instance; .listen(PORT) binds it to a TCP port.",
    },
    {
      title: "app.get / app.post",
      plain: "app.get(path, handler) and app.post(path, handler) wire a route directly.",
      technical: "Each HTTP verb gets its own registration method, keyed by path pattern.",
    },
    {
      title: "res.send / res.json / res.status",
      plain: "res.send() and res.json() reply for you — far less typing than raw res.end().",
      technical: "Response helpers set headers, serialize bodies, and end the response automatically.",
    },
    {
      title: "Route Params",
      plain: "app.get('/users/:id', ...) — req.params.id grabs that piece of the URL.",
      technical: ":id is a named URL segment that Express parses into req.params.id.",
    },
    {
      title: "What Is Middleware?",
      plain: "Middleware is a function that runs BETWEEN the request and your handler.",
      technical: "Middleware receives (req, res, next) and can inspect/modify req before next().",
    },
    {
      title: "app.use() and next()",
      plain: "app.use(fn) registers middleware; forgetting next() leaves the request hanging.",
      technical: "next() hands control to the next middleware/handler in the stack — skip it, and the chain stalls.",
    },
    {
      title: "express.json() + req.body",
      plain: "express.json() parses a JSON request body so req.body just works.",
      technical: "express.json() is built-in middleware that parses Content-Type: application/json bodies onto req.body.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions ───────────────────────────────────
  // Each has an escalating hints[] array (2-3 hints) nudging reasoning
  // WITHOUT ever stating the correct option's text, plus a fixed
  // `explanation` shown only after a correct answer.
  const quizQuestions = [
    {
      q: "Unit 5.2's raw http server needed an if/else per route. What problem does Express mainly solve?",
      options: [
        "Express makes JavaScript run faster than raw Node",
        "Express replaces manual if/else URL routing with a clean, declarative way to register routes",
        "Express removes the need for a server entirely",
        "Express is only for serving HTML files, not APIs",
      ],
      answer: 1,
      hints: [
        "Think about what got messy in Unit 5.2 as more routes were added — not about raw execution speed.",
        "Express gives you a METHOD per HTTP verb instead of one giant branching block.",
        "Express's core value is replacing sprawling if/else URL checks with declarative app.get/app.post calls per route.",
      ],
      explanation: "Express's main job is cleaning up routing: instead of one big if/else chain checking req.url and req.method, you register each route declaratively with app.get(), app.post(), etc.",
    },
    {
      q: "const app = express(); app.listen(3000); — what does app.listen(3000) do?",
      options: [
        "It only logs the number 3000 to the console",
        "It starts the server listening for incoming connections on port 3000",
        "It sets the maximum number of users allowed",
        "It deletes any existing server on port 3000",
      ],
      answer: 1,
      hints: [
        "This is the same fundamental job .listen() does on a raw Node http server, just called on an Express app instead.",
        "Port 3000 is a NETWORK port, not a count of anything.",
        "app.listen(3000) binds the Express app to port 3000 and starts accepting incoming HTTP requests there.",
      ],
      explanation: "app.listen(PORT) starts the Express server listening for incoming HTTP connections on that port — nothing happens over the network until this is called.",
    },
    {
      q: "app.get('/about', (req, res) => { res.send('About page'); }); — when does this handler function actually run?",
      options: [
        "Immediately when the server starts, once",
        "Every single time ANY request hits the server, regardless of path",
        "Only when a GET request arrives at the exact path '/about'",
        "Only when the server is restarted",
      ],
      answer: 2,
      hints: [
        "app.get's first argument is a specific URL PATH, not a wildcard for everything.",
        "This handler is scoped to both a METHOD (GET) and a PATH ('/about') together.",
        "The callback only fires for a GET request matching '/about' exactly — other paths or methods never trigger it.",
      ],
      explanation: "app.get(path, handler) registers a route scoped to both the GET method and that exact path — the handler only runs when both match an incoming request.",
    },
    {
      q: "Which Express method would you register a route on to handle a form submission sending data to the server?",
      options: ["app.get", "app.post", "app.listen", "app.use only"],
      answer: 1,
      hints: [
        "Form submissions that send new data typically use a different HTTP verb than simply fetching a page.",
        "Recall which verb is conventionally used for creating/submitting data, versus just reading it.",
        "app.post(path, handler) is the method matched to POST requests — the verb typically used for submitting data like a login form.",
      ],
      explanation: "app.post(path, handler) registers a route for POST requests — the conventional verb for submitting/creating data, like a login or signup form.",
    },
    {
      q: "res.send('Hello') vs raw Node's res.end('Hello') with http — what's the key practical difference?",
      options: [
        "There is no difference at all, they're aliases",
        "res.send() only works with numbers, never strings",
        "res.send() sets sensible headers (like Content-Type) and handles different data types automatically; raw res.end() requires you to set all of that by hand",
        "res.end() is newer and recommended over res.send()",
      ],
      answer: 2,
      hints: [
        "Raw http made you manually call res.writeHead and set Content-Type yourself before res.end() — recall Unit 5.2.",
        "Express's response helpers are designed to remove exactly that manual setup work.",
        "res.send() automatically infers and sets headers like Content-Type based on what you pass it, while raw res.end() does none of that for you.",
      ],
      explanation: "res.send() is a convenience layer over the raw response: it sets appropriate headers automatically and can accept strings, objects, buffers, etc., while raw res.end() requires you to configure all of that manually.",
    },
    {
      q: "app.get('/api/data', (req, res) => { res.json({ ok: true }); }); — what does res.json(...) specifically do?",
      options: [
        "Sends the object as plain unformatted text",
        "Serializes the JS object to a JSON string AND sets the Content-Type header to application/json automatically",
        "Saves the object permanently to a database",
        "Only works if the object has no nested values",
      ],
      answer: 1,
      hints: [
        "Compare this to res.send() — res.json() is more SPECIFIC about the kind of data it's built for.",
        "Think about what a frontend fetch() call expects to receive and parse back as JSON.",
        "res.json(obj) both JSON.stringifies the object AND sets Content-Type: application/json, so the client knows exactly how to parse the response.",
      ],
      explanation: "res.json() serializes a JavaScript value to JSON text and sets the Content-Type header to application/json, sparing you from doing both steps by hand.",
    },
    {
      q: "res.status(404).send('Not found'); — what does .status(404) change here?",
      options: [
        "It changes nothing visible to the client",
        "It sets the HTTP status code of the response to 404, then .send() sends the body with that status attached",
        "It deletes the route entirely",
        "It only affects logging on the server, not the actual response sent",
      ],
      answer: 1,
      hints: [
        "404 is a very recognizable HTTP STATUS CODE, not a body or a header name.",
        ".status() and .send() are chained — one sets metadata, the other sends the actual response.",
        "res.status(404) sets the response's HTTP status code to 404 (Not Found), and chaining .send() after it sends the body using that status.",
      ],
      explanation: "res.status(code) sets the HTTP status code for the response; chaining .send()/.json() after it sends the body marked with that status — here, a 404 Not Found.",
    },
    {
      q: "app.get('/users/:id', (req, res) => { res.send(req.params.id); }); — visiting /users/42, what does req.params.id equal?",
      options: ["undefined", "'42' (the matched URL segment, as a string)", "42 as a number", "The string ':id'"],
      answer: 1,
      hints: [
        "The :id in the route path is a NAMED placeholder Express fills in from the actual URL visited.",
        "URL segments always arrive as strings, never automatically converted to a different type.",
        "Visiting /users/42 makes Express capture '42' (a string) into req.params.id, because :id named that exact URL segment.",
      ],
      explanation: "Route params like :id are placeholders Express extracts from the matching URL segment into req.params — always as a string, here req.params.id === '42'.",
    },
    {
      q: "What is 'middleware' in Express, in essence?",
      options: [
        "A separate database used only for caching",
        "A function that runs between the incoming request and the final route handler, with the power to inspect/modify req before passing control onward",
        "A type of route that only matches POST requests",
        "A CSS framework bundled with Express",
      ],
      answer: 1,
      hints: [
        "The word itself is a strong hint — it sits in the MIDDLE of the request's journey through your app.",
        "Think about logging, authentication checks, or parsing — things that should happen BEFORE your actual route logic runs.",
        "Middleware is a (req, res, next) function that runs before the final handler, often used for logging, auth checks, or body parsing.",
      ],
      explanation: "Middleware is any function with signature (req, res, next) that runs in the request pipeline before the final route handler — useful for logging, authentication, parsing, and more.",
    },
    {
      q: "app.use((req, res, next) => { console.log(req.method); next(); }); — what does calling next() do here?",
      options: [
        "It ends the response immediately, like res.end()",
        "It restarts the entire server",
        "It passes control along to the NEXT middleware or route handler in the chain",
        "It has no effect — Express ignores next() unless res.send() was already called",
      ],
      answer: 2,
      hints: [
        "Without calling this, the request's journey through your app simply STOPS right there.",
        "Think of middleware functions as a relay race — next() is the baton pass.",
        "next() hands off control to whatever middleware or route handler comes after this one — skip it, and nothing further ever runs for that request.",
      ],
      explanation: "next() passes control to the next middleware or route handler in the stack. If a middleware never calls it (and never sends a response itself), the request simply hangs — a very common bug.",
    },
    {
      q: "A teammate writes middleware that logs a request but forgets to call next() and never sends a response. What happens to that request?",
      options: [
        "Express automatically calls next() for them after a short delay",
        "The request hangs — the client just waits, since nothing ever sends a response or passes control onward",
        "The server crashes immediately",
        "Express skips that middleware silently and runs the route handler anyway",
      ],
      answer: 1,
      hints: [
        "Recall: middleware MUST do one of two things to finish its job — send a response itself, or call next().",
        "If neither happens, nothing tells the client anything — there's no error, just silence.",
        "Without next() or a response being sent, the request simply hangs forever from the client's point of view — a classic, hard-to-spot middleware bug.",
      ],
      explanation: "Express never auto-advances the chain. A middleware that calls neither next() nor a response method (res.send/json/end) leaves the request hanging indefinitely — the client waits with no response and no error.",
    },
    {
      q: "app.use(express.json()); app.post('/login', (req, res) => { console.log(req.body); }); — what does express.json() enable here?",
      options: [
        "It encrypts the request body for security",
        "It parses an incoming JSON request body so req.body contains the parsed JS object, instead of req.body being undefined",
        "It converts the response into JSON format automatically",
        "It blocks any request that isn't in JSON format",
      ],
      answer: 1,
      hints: [
        "Without this line, req.body would simply not exist as useful data — Express doesn't parse bodies by default.",
        "This is built-in MIDDLEWARE — registered with app.use(), just like any other middleware.",
        "express.json() is built-in middleware that reads and parses a JSON request body, attaching the resulting object to req.body for your handlers to use.",
      ],
      explanation: "express.json() is built-in middleware that parses an incoming request body formatted as JSON, making the parsed object available as req.body inside later route handlers.",
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

  // ── CONTENT: See-It steps — building a tiny Express app line by line ───
  // Each step pairs a growing code snippet with the SIMULATED
  // request/response result it would produce. Nothing here is live
  // executed — these are pre-written strings made to LOOK like a real
  // terminal + HTTP exchange.
  const seeitSteps = [
    {
      plain: "First, import Express and create an app instance.",
      tech: "express() returns an app object exposing .get/.post/.use/.listen.",
      code: "const express = require(\"express\");\nconst app = express();",
      result: "(app created — not listening yet)",
      resultColor: "#94a3b8",
    },
    {
      plain: "Add one GET route that just replies with text.",
      tech: "app.get(path, handler) registers a GET-method route.",
      code: "app.get(\"/\", (req, res) => {\n  res.send(\"Welcome!\");\n});",
      result: "GET / → 200 \"Welcome!\"",
      resultColor: "#4ade80",
    },
    {
      plain: "Add a route with a param to read a piece of the URL.",
      tech: "req.params.id captures the :id URL segment as a string.",
      code: "app.get(\"/users/:id\", (req, res) => {\n  res.json({ userId: req.params.id });\n});",
      result: "GET /users/7 → 200 { userId: \"7\" }",
      resultColor: "#38bdf8",
    },
    {
      plain: "Add express.json() so POST requests can read a body.",
      tech: "express.json() middleware parses JSON bodies onto req.body.",
      code: "app.use(express.json());\napp.post(\"/login\", (req, res) => {\n  res.json({ user: req.body.username });\n});",
      result: "POST /login {\"username\":\"asha\"} → 200 { user: \"asha\" }",
      resultColor: "#a78bfa",
    },
    {
      plain: "Finally, start the server with app.listen().",
      tech: "app.listen(PORT) binds the app to a port and starts accepting requests.",
      code: "app.listen(3000, () => {\n  console.log(\"Server running\");\n});",
      result: "$ node app.js\nServer running",
      resultColor: "#fb923c",
    },
  ];

  // ── CONTENT: Try-It presets — simulated requests against the tiny app ──
  const requestPresets = [
    { label: "GET /", method: "GET", path: "/", body: null, status: 200, response: "\"Welcome!\"", note: "Matches app.get('/', ...) — no params, no body needed." },
    { label: "GET /users/7", method: "GET", path: "/users/7", body: null, status: 200, response: "{ \"userId\": \"7\" }", note: ":id captured '7' from the URL into req.params.id." },
    { label: "POST /login", method: "POST", path: "/login", body: "{ \"username\": \"asha\" }", status: 200, response: "{ \"user\": \"asha\" }", note: "express.json() parsed the body so req.body.username worked." },
    { label: "GET /missing", method: "GET", path: "/missing", body: null, status: 404, response: "\"Cannot GET /missing\"", note: "No route matches '/missing' — Express's default 404 kicks in." },
  ];

  // ── CONTENT: Challenge 1 — TagMatch pairs (term → meaning) ─────────────
  const ch1Pairs = [
    { code: "app.get(path, fn)", meaning: "Registers a handler for GET requests at that path", hint: "This is scoped to ONE specific HTTP verb — read the method name in the code." },
    { code: "app.use(fn)", meaning: "Registers middleware that runs for matching requests", hint: "This isn't tied to one HTTP verb — it's the general-purpose registration method." },
    { code: "middleware", meaning: "A function that runs between the request and the final handler", hint: "Think about WHERE in the pipeline this kind of function sits — not at the start, not at the end." },
    { code: "req.params", meaning: "Holds values captured from named URL segments like :id", hint: "This is filled in from pieces of the URL itself, not from a request body." },
    { code: "req.body", meaning: "Holds the parsed JSON sent in a POST request", hint: "This needs express.json() registered first, or it stays undefined." },
    { code: "next()", meaning: "Passes control to the next middleware or handler in the chain", hint: "Forgetting to call this is exactly what makes a request hang." },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: middleware forgetting next() ──────
  const bugLines = [
    { text: "app.use((req, res, next) => { console.log(req.method); next(); });", buggy: false },
    { text: "app.use((req, res, next) => { req.startTime = Date.now(); });", buggy: true, why: "This middleware never calls next() and never sends a response — every request that reaches it just hangs forever, with the client waiting and no error shown anywhere." },
    { text: "app.get(\"/\", (req, res) => { res.send(\"home\"); });", buggy: false },
    { text: "app.listen(3000);", buggy: false },
  ];
  const bugHints = [
    "Three of these four lines are totally fine middleware/route code. One middleware function forgets to finish its job.",
    "Middleware must do ONE of two things before it's done: call next(), or send a response itself. Find the one that does neither.",
    "Look at the line setting req.startTime — it never calls next() and never sends anything. Tap that line.",
  ];

  // ── SHARED STYLE OBJECT — copied verbatim from Unit4_5.jsx/Unit5_1.jsx ─
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
  // Poses one prediction question BEFORE any teaching: how would Express
  // handle 50 routes more cleanly than Unit 5.2's if/else approach? Student
  // must pick a guess and submit before seeing the reveal; only then does a
  // "Start Learning →" button advance to Build.
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🧭</div>
        <div style={s.h2}>50 routes, one giant if/else — then what?</div>
      </div>

      <div style={{ ...s.p, color: "#cbd5e1", textAlign: "center" }}>
        Unit 5.2's raw server needed if/else per route. Imagine 50 of them.
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Take your best guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "There's no cleaner way — every server needs one big if/else",
              "A framework lets you register each route declaratively, one line per route",
              "You'd need to write 50 separate servers, one per route",
              "JavaScript automatically optimizes long if/else chains for you",
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
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>Express.js</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "A framework lets you register each route declaratively, one line per route" ? "🎯 Exactly right!" : "Close enough to investigate — here's what's really going on."}
          </div>
          <div style={s.line}>app.get('/path', fn) replaces a whole branch of if/else — one line per route.</div>
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
  // A slower, step-by-step build-up of a tiny Express app: one code snippet
  // per step, the simulated request/response result, and a Plain/Technical
  // explanation. seeitStep drives which seeitSteps entry shows; "Next Step"
  // / "← Back" move linearly; on the LAST step the forward button instead
  // reads "Now Let Me Try It!" and advances to stage 3.
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Build a Tiny Express App, Line by Line</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        {/* The growing code snippet for this step. */}
        <div style={s.codeBox}>{step.code}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* The simulated request/response result, colored per-step. */}
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
  // Hands-on simulation: preset requests (GET /, GET /users/7, POST /login
  // with a body, GET /missing). Tapping one looks up its requestPresets
  // entry and renders a simulated response. triedCount increments only the
  // FIRST time a request is tapped; "Take the Challenge →" appears once at
  // least 3 distinct requests have been tried.
  const renderTryIt = () => {
    const active = requestPresets.find((p) => p.label === reqPicked);

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Send Requests to a Simulated Express App</div>
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
                padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                background: reqPicked === p.label ? "#38bdf8" : "#0f172a", color: reqPicked === p.label ? "#0f172a" : "#7dd3fc",
              }}
            >{p.label}</button>
          ))}
        </div>

        {/* The simulated HTTP exchange panel. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>
                {active.method} {active.path}{active.body ? " " + active.body : ""}
              </div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: active.status === 200 ? "#4ade80" : "#ef4444", fontWeight: 700, fontSize: "0.78rem" }}>{active.status}</div>
              <div style={{ color: "#7dd3fc", fontWeight: 700, fontSize: "0.9rem", marginTop: 2 }}>{active.response}</div>
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
          <div style={s.h2}>🐛 Spot the Hanging Request</div>
          <div style={{ ...s.line, marginBottom: 14 }}>Tap the middleware that forgets next().</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ── STAGE 5 RENDERER — QUIZ ──────────────────────────────────────────────
  // If quizDone is true, render ONLY the completion screen — the single
  // call site for onUnitComplete() in this whole file, wired to a real
  // onClick, never auto-fired. Otherwise render the current question with
  // its options, hint box (wrong) or explanation box (correct), and
  // Check Answer / Next controls.
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>🏆</div>
          {/* "Unit 5.4 complete", pointing to Reading & Writing Files next —
              NEVER "Module 5 complete", since Unit 5.5 still remains. */}
          <div style={s.h2}>Unit 5.4 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>
            {student?.name ? `Nice work, ${student.name}!` : "Nice work!"} On to Reading & Writing Files next.
          </div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "Why Express exists — cleaner than raw http + if/else per route",
              "Starting an app: const app = express(); app.listen(PORT)",
              "app.get / app.post register routes by method + path",
              "res.send / res.json / res.status vs raw res.end",
              "Route params: app.get('/users/:id', ...) → req.params.id",
              "What middleware is and why it sits between request and handler",
              "app.use() registers middleware; next() passes control onward",
              "express.json() parses JSON bodies onto req.body",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* THE ONLY onUnitComplete() CALL SITE IN THIS FILE — a real
              onClick, exactly once per click, only present once quizDone is
              true. App.jsx's own implementation persists progress and
              routes the student onward (typically to Unit5_5). */}
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
        <div style={s.topTitle}>Unit 5.4 — Express.js Basics</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {/* Personalized welcome line, shown only on Spark so it doesn't
          clutter every subsequent screen. */}
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong>
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
// number Unit5_4 keeps incrementing via its own useEffect/setInterval,
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

  // 0 — "Why Express Exists": a messy stack of if/else blocks collapsing
  // into one clean route line.
  if (index === 0) {
    const collapsed = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          {!collapsed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {["if (url===A)", "else if (url===B)", "else if (url===C)", "else if (...)"].map((l, i) => (
                <div key={l} style={{ fontFamily: "monospace", fontSize: "0.56rem", color: "#ef4444", opacity: 1 - i * 0.15 }}>{l}</div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#4ade80", fontWeight: 700, border: "2px solid #4ade80", borderRadius: 8, padding: "8px 12px" }}>app.get('/path', fn)</div>
          )}
          <div style={{ fontSize: "0.58rem", color: collapsed ? "#4ade80" : "#fb923c", fontWeight: 700 }}>{collapsed ? "one line per route ✅" : "messy at 50 routes..."}</div>
        </div>
      </div>
    );
  }

  // 1 — "Starting an Express App": app box appearing, then a port number
  // lighting up once .listen() runs.
  if (index === 1) {
    const listening = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "2px solid #38bdf8", borderRadius: 8, padding: "8px 12px", fontSize: "0.64rem", fontWeight: 700, color: "#38bdf8" }}>app</div>
          {arrow}
          <div style={{
            border: listening ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "8px 12px",
            fontSize: "0.64rem", fontWeight: 700, color: listening ? "#4ade80" : "#475569",
          }}>{listening ? ":3000 listening ✅" : "port idle..."}</div>
        </div>
      </div>
    );
  }

  // 2 — "app.get / app.post": two route cards lighting up in turn as a
  // matching request flows toward each.
  if (index === 2) {
    const active = Math.floor(pos * 2) % 2;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {["GET /home", "POST /login"].map((l, i) => (
            <div key={l} style={{
              border: active === i ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 8, padding: "8px 10px",
              fontSize: "0.6rem", fontWeight: 700, color: active === i ? "#38bdf8" : "#64748b", fontFamily: "monospace",
            }}>{l}</div>
          ))}
        </div>
      </div>
    );
  }

  // 3 — "res.send/json/status vs res.end": raw res.end requiring manual
  // header-setting versus res.send doing it automatically.
  if (index === 3) {
    const auto = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: auto ? "#4ade80" : "#ef4444", fontWeight: 700 }}>
            {auto ? "res.send('hi') ✅" : "res.end('hi') — headers??"}
          </div>
          <div style={{ fontSize: "0.56rem", color: auto ? "#4ade80" : "#fb923c" }}>{auto ? "headers set automatically" : "you set headers by hand"}</div>
        </div>
      </div>
    );
  }

  // 4 — "Route Params": a URL with :id morphing into the captured value
  // inside req.params.
  if (index === 4) {
    const captured = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#94a3b8" }}>/users/<span style={{ color: captured ? "#4ade80" : "#fb923c", fontWeight: 700 }}>{captured ? "42" : ":id"}</span></div>
          {arrow}
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", fontWeight: 700, color: captured ? "#4ade80" : "#475569" }}>{captured ? "req.params.id = '42'" : "..."}</div>
        </div>
      </div>
    );
  }

  // 5 — "What Is Middleware?": a request token passing through a gate
  // labeled "middleware" before reaching the route handler.
  if (index === 5) {
    const passed = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>📨</div>
          {arrow}
          <div style={{ border: "2px solid #a78bfa", borderRadius: 8, padding: "6px 10px", fontSize: "0.58rem", color: "#a78bfa", fontWeight: 700 }}>middleware</div>
          <div style={{ fontSize: "0.9rem", color: passed ? "#475569" : "#a78bfa" }}>{passed ? "→" : "⏳"}</div>
          <div style={{ border: passed ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "6px 10px", fontSize: "0.58rem", color: passed ? "#4ade80" : "#64748b", fontWeight: 700 }}>handler</div>
        </div>
      </div>
    );
  }

  // 6 — "app.use() and next()": two outcomes side by side — one chain
  // calling next() and flowing through, one frozen because it forgot.
  if (index === 6) {
    const showFrozen = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {!showFrozen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: "0.58rem", color: "#4ade80", fontFamily: "monospace" }}>next()</div>
              <div style={{ color: "#4ade80" }}>→</div>
              <div style={{ fontSize: "0.58rem", color: "#4ade80", fontWeight: 700 }}>request continues ✅</div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: "0.58rem", color: "#ef4444", fontFamily: "monospace" }}>no next()</div>
              <div style={{ color: "#ef4444" }}>⏸</div>
              <div style={{ fontSize: "0.58rem", color: "#ef4444", fontWeight: 700 }}>request hangs ❌</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 7 — "express.json() + req.body": a raw JSON blob turning into a usable
  // object once the parsing middleware runs.
  const parsed = pos > 0.5;
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: "0.56rem", color: parsed ? "#475569" : "#fb923c", opacity: parsed ? 0.4 : 1 }}>{"{\"u\":\"a\"}"}</div>
        {arrow}
        <div style={{ border: "1px solid #334155", borderRadius: 8, padding: "5px 8px", fontSize: "0.56rem", color: "#a78bfa" }}>express.json()</div>
        {arrow}
        <div style={{ fontFamily: "monospace", fontSize: "0.6rem", fontWeight: 700, color: parsed ? "#4ade80" : "#475569" }}>{parsed ? "req.body.u ✅" : "..."}</div>
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
