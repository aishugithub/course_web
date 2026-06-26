// ============================================================================
//  UNIT 5.2 — "Your First HTTP Server"
//  Module: M5 — Node.js & Backend (SECOND unit of this module — 5 units
//  total in M5; this file only ever claims "Unit 5.2 done", never "Module 5
//  complete" — Units 5.3 through 5.5 still lie ahead, including the full
//  npm lesson in 5.3 and the Express lesson in 5.4 that this unit teases.)
//
//  WHERE THIS FILE FITS IN THE APP (read before touching anything):
//  - src/shell/App.jsx is the single "traffic controller" for the whole
//    course. It keeps a `currentUnitId` (e.g. "Unit5_2") in its own state,
//    looks that id up inside config/course.config.js (the table mapping
//    every unit id to a human title, its module, and which React component
//    file implements it), and renders:
//        <Unit5_2 student={studentObject} onUnitComplete={handleComplete} />
//  - `student` is a plain read-only object — roughly { rollNo, name, batch }
//    — handed down purely so this lesson can greet the student by name. All
//    fetching/auth/network happens upstream in App.jsx and api.js; THIS FILE
//    NEVER IMPORTS api.js OR gas.config.js. Lessons are offline, pure-UI
//    React components with zero network calls of their own.
//  - `onUnitComplete` is a callback handed down BY App.jsx. App.jsx's own
//    implementation of that callback talks to api.js / gas.config.js (the
//    Google Apps Script backend) to persist "this student finished Unit5_2"
//    and route them onward, typically to Unit5_3 ("npm & Modules"). This
//    file only ever CALLS onUnitComplete() — a bare call, no arguments —
//    exactly once, from one real onClick on the Quiz stage's final "Mark
//    Complete & Continue" button. Never from a useEffect, never on mount,
//    never more than once.
//
//  HOUSE STYLE (copied verbatim from Unit4_5.jsx / Unit5_1.jsx):
//  - The same six-stage pedagogical shape, same order, every unit, so a
//    student never has to relearn "how do I use this screen":
//        Stage 0 SPARK     — one prediction question, asked BEFORE any
//                             teaching: "what happens when you visit a URL?"
//        Stage 1 BUILD     — 8 concepts: request/response cycle,
//                             require('http') + http.createServer, the
//                             (req,res) callback shape, res.end()/res.write(),
//                             res.statusCode (200/404/500), server.listen()
//                             + ports/localhost, req.url/req.method manual
//                             routing, and why raw http gets messy (teasing
//                             Express in Unit5_4). Each concept pairs a
//                             {title, plain, technical} object with a small
//                             hand-rolled CSS animation (ConceptAnimation)
//                             driven by a shared looping `frame` counter, a
//                             Plain⇄Technical toggle, and a horizontally
//                             scrollable concept-picker strip.
//        Stage 2 SEE IT    — six steps building one minimal server FILE up
//                             line by line, each step showing the growing
//                             code plus a simulated terminal/response panel.
//        Stage 3 TRY IT    — simulated preset requests (GET "/", GET
//                             "/about", GET "/missing-page") rendered as a
//                             fake browser/response panel — no real Node
//                             process runs anywhere in this browser tab.
//        Stage 4 CHALLENGE — TagMatch (term → meaning: req, res, listen,
//                             statusCode, port) then BugHunt (one line
//                             missing res.end(), which means the response
//                             never actually completes/hangs).
//        Stage 5 QUIZ      — 12 multiple-choice questions, each with an
//                             escalating hints[] array (2-3 hints) that
//                             nudges reasoning WITHOUT ever revealing the
//                             correct option's text, plus a fixed
//                             `explanation` string shown only after a
//                             correct answer. The final screen (after
//                             question 12) is the completion screen, whose
//                             button is the ONE AND ONLY call site for
//                             onUnitComplete().
//  - The exact same shared inline-style object, named `s` — same palette
//    (dark navy background, sky-blue #38bdf8 accents, green #4ade80 for
//    "correct/done", red #ef4444 for "wrong/buggy", amber #fbbf24/#fde68a
//    for hint boxes) so this unit visually feels like the same app as every
//    other unit in the course.
//  - Mobile-first sizing throughout: every width is a %, a flexWrap, or a
//    clamp()/minmax() expression — there is intentionally NOT ONE fixed
//    pixel width anywhere that could force horizontal scrolling on a phone.
//
//  VISUAL-DENSITY RULE THIS FILE FOLLOWS (per the course owner's feedback
//  that earlier lessons were "too text-heavy — needs to be more visual-
//  interactive and less text, more animation"):
//  - Every Build-stage concept's `plain` and `technical` strings are ONE
//    short sentence each (well under 20 words) — ConceptAnimation below
//    carries the ACTUAL teaching via multiple moving/state-changing parts
//    driven by `frame`/`pos`, not via paragraphs of text.
//  - Every other stage's rendered text (Spark, See It, Try It, Challenge)
//    is kept as short as humanly possible — a visual element (icon, arrow,
//    colored panel, animated dot) is preferred over a sentence wherever one
//    can carry the same meaning.
//  - Quiz question text, options, hints, and explanations are the ONE
//    exception — those stay full-length and precise, never compressed,
//    because the quiz is where understanding is actually verified.
//
//  CONTENT TAUGHT IN THIS SPECIFIC UNIT (Build-stage concepts, 8 total):
//    1. The request/response cycle — a client asks, a server answers.
//    2. require('http') + http.createServer((req,res)=>{...}) — the two
//       lines that create a server object out of thin air.
//    3. The (req, res) callback fires ONCE PER incoming request — req is
//       what came IN, res is what goes OUT.
//    4. res.end() finishes (and can include) the response; res.write()
//       streams partial chunks before end() finally closes it.
//    5. res.statusCode — 200 (ok), 404 (not found), 500 (server's own
//       fault) — three numbers that tell the client how it went.
//    6. server.listen(PORT) — the server starts answering on
//       localhost:PORT only after this call; nothing happens before it.
//    7. req.url / req.method — manual routing means reading these two
//       fields yourself and branching with plain if/else.
//    8. Why raw http gets messy fast — every route is hand-rolled if/else;
//       this is the exact pain point Express (Unit5_4) exists to solve.
//
//  EXTRA COMMENT DENSITY NOTE (per this project's global CLAUDE.md house
//  rule): this file carries MORE inline commentary per line than even
//  Unit5_1.jsx — nearly every state declaration, render function, and
//  non-trivial JSX block has its own explanatory comment covering both
//  WHAT the line does and WHY it exists / how it threads into the six-stage
//  flow and into App.jsx's contract above.
// ============================================================================

// React's three hooks this file needs: useState for all interactive stage
// state, useEffect to drive the looping CSS animation's frame counter, and
// useRef to hold the interval ID for that animation loop (so we can clear it
// on cleanup without the ID itself being reactive state).
import { useState, useEffect, useRef } from "react";

export default function Unit5_2({ student, onUnitComplete }) {
  // ==========================================================================
  // ALL HOOKS LIVE HERE, UNCONDITIONALLY, AT THE TOP, IN A FIXED ORDER.
  // React's Rules of Hooks require every hook to run on every render, in the
  // same order, regardless of what `stage` currently is. None of these are
  // ever wrapped in an `if`, a loop, or placed after an early return —
  // gating happens with plain `if` statements INSIDE each stage's render
  // function, never around the hook declarations themselves.
  // ==========================================================================

  // -- MASTER FLOW STATE -----------------------------------------------------
  // `stage` is the single source of truth for "which of the six big screens
  // is currently visible". 0=Spark, 1=Build, 2=SeeIt, 3=TryIt, 4=Challenge,
  // 5=Quiz. The sticky top bar's stage-pill row (rendered at the bottom of
  // this file) reads this exact same value to highlight/checkmark each
  // pill, so the pills and the actual visible content can never drift out
  // of sync with each other.
  const [stage, setStage] = useState(0);

  // -- SPARK STAGE STATE ------------------------------------------------------
  // sparkGuess: which of the prediction options the student has tapped so
  // far (string, or null before any tap). sparkSubmitted: flips true once
  // they lock in their guess — swaps the UI from "pick an option" mode into
  // "here's the reveal" mode. Both reset automatically on a fresh mount.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // -- BUILD STAGE STATE ------------------------------------------------------
  // buildConcept: index into the `concepts` array below — which of the 8
  // Build-stage concepts is currently on screen. Driven both by the
  // horizontally-scrollable concept-picker strip and by the "Next: <title>
  // →" button, which advances it by exactly 1 per press.
  const [buildConcept, setBuildConcept] = useState(0);
  // buildMode: "plain" or "tech" — which half of the current concept's
  // {plain, technical} pair is rendered. Reset to "plain" on every concept
  // switch so students always land on the friendlier explanation first.
  const [buildMode, setBuildMode] = useState("plain");

  // -- SEE IT STAGE STATE -------------------------------------------------
  // seeitStep: index into the seeitSteps array — which step of the guided,
  // line-by-line server build is currently shown. seeitMode mirrors
  // buildMode's plain/technical toggle but is tracked completely
  // separately, so toggling one stage's explanation style never leaks into
  // (or gets reset by) the other stage.
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // -- TRY IT STAGE STATE ---------------------------------------------------
  // reqPicked: the exact request label (matching one entry in
  // `requestPresets` below) that the student last tapped — drives which
  // simulated response panel is currently displayed. triedCount: a running
  // count of *distinct* requests tried so far, used purely as a gate — the
  // "Take the Challenge" button stays hidden until this reaches 3.
  const [reqPicked, setReqPicked] = useState(null);
  const [triedCount, setTriedCount] = useState(0);

  // -- CHALLENGE STAGE STATE -------------------------------------------------
  // challengePhase: 0 = TagMatch mini-game showing, 1 = BugHunt mini-game
  // showing. ch1Done / ch2Done: flip true the moment each mini-game's
  // onDone callback fires — these gate the "Next Challenge →" and "Final
  // Quiz →" buttons so a student can't skip past a mini-game unfinished.
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // -- QUIZ STAGE STATE -------------------------------------------------------
  // quizQ: index of the current question (0..11, since there are 12).
  // quizSelected: which option index is currently highlighted (resets to
  // null between questions and after every wrong attempt, forcing an
  // active re-pick before re-checking). quizFeedback: null | "correct" |
  // "wrong" — drives both option tile coloring and which message box
  // renders below the options. quizAttempts: wrong-attempt count for the
  // CURRENT question only, resets to 0 on every new question — this is the
  // index used to pick which escalating hint string to show. quizDone:
  // flips true once all 12 are answered correctly, swapping the Quiz
  // stage's render into the completion screen, whose button is the ONLY
  // place in this whole file that calls onUnitComplete().
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // -- LOOPING ANIMATION FRAME STATE ------------------------------------------
  // animRef: holds the setInterval ID once the animation loop starts,
  // stored in a ref (not state) because the ID itself is never rendered —
  // it's only needed later to clearInterval() on cleanup, and refs don't
  // trigger re-renders when written to. animFrame: state, because it DOES
  // need to trigger re-renders — every time it changes, ConceptAnimation
  // (used in both Build and See It) re-invokes with a new `frame` number
  // and recomputes its animated positions, producing motion out of plain
  // CSS with no real CSS keyframes anywhere.
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ==========================================================================
  // CONTENT: eight Build-stage concepts. Each `plain`/`technical` string is
  // ONE short sentence (visual-density rule) — ConceptAnimation(index) below
  // has one matching `if (index === N)` block per concept, in the exact same
  // order as this array, so concept #0 here always pairs with the
  // `if (index === 0)` animation, and so on through #7. Keep both lists in
  // lockstep if either is ever edited.
  // ==========================================================================
  const concepts = [
    {
      title: "Request → Response",
      plain: "A client asks something; a server answers something back.",
      technical: "HTTP is a request/response protocol — every exchange is one request, one response.",
    },
    {
      title: "createServer() Builds the Server",
      plain: "require('http') plus http.createServer() turns a callback into a real server.",
      technical: "http.createServer(callback) returns a Server object; the callback runs once per request.",
    },
    {
      title: "req In, res Out",
      plain: "req describes the incoming request; res is how you answer it.",
      technical: "The (req, res) callback receives an IncomingMessage and a ServerResponse object.",
    },
    {
      title: "res.write() and res.end()",
      plain: "write() sends a chunk; end() finishes the response for good.",
      technical: "res.end() flushes any buffered output and signals the response is complete.",
    },
    {
      title: "Status Codes: 200 / 404 / 500",
      plain: "statusCode tells the client whether it worked, was missing, or broke.",
      technical: "res.statusCode sets the HTTP status line's three-digit code before res.end().",
    },
    {
      title: "listen() Opens the Door",
      plain: "Nothing answers requests until server.listen(PORT) is called.",
      technical: "server.listen(port) binds the server to localhost:port, starting it accepting connections.",
    },
    {
      title: "Routing by req.url",
      plain: "Reading req.url yourself, with if/else, is how raw Node routes requests.",
      technical: "Manual routing branches on req.url and req.method since http has no built-in router.",
    },
    {
      title: "Why This Gets Messy",
      plain: "Every new route means another if/else — that's exactly what Express fixes.",
      technical: "Raw http scales poorly past a few routes; frameworks like Express add structured routing.",
    },
  ];

  // ==========================================================================
  // CONTENT: Quiz bank — 12 questions, each with an escalating hints[] array
  // (2-3 hints) that nudges reasoning WITHOUT ever stating the correct
  // option's text, plus an `explanation` shown only after a correct answer.
  // Order roughly follows the Build concepts above: request/response →
  // createServer → req vs res → write/end → status codes → listen/port →
  // req.url routing → res.end() omission, then a couple of questions mixing
  // ideas together to check real understanding.
  // ==========================================================================
  const quizQuestions = [
    {
      q: "In the simplest possible terms, what is the HTTP request/response cycle?",
      options: [
        "The server constantly pushes data to the client without being asked",
        "A client sends a request, and the server sends back exactly one response",
        "Two servers talking to each other in a loop forever",
        "The browser and server share the same memory directly",
      ],
      answer: 1,
      hints: [
        "Think about what happens the instant you type a URL and hit Enter — who speaks first?",
        "There are exactly two roles here, and each one only acts once per exchange.",
        "One side asks (the client, e.g. a browser), the other side answers (the server) — exactly one request paired with exactly one response.",
      ],
      explanation: "HTTP is fundamentally a request/response protocol: a client sends one request, and the server sends back exactly one response to that request.",
    },
    {
      q: "Which two lines actually CREATE a working Node HTTP server object?",
      options: [
        "import server from 'express'; server.start();",
        "const http = require('http'); const server = http.createServer((req,res)=>{...});",
        "const server = new Server(); server.run();",
        "fetch('http://localhost').create();",
      ],
      answer: 1,
      hints: [
        "Look for the exact built-in module name this unit kept repeating, and the exact method name on it.",
        "One line pulls in Node's built-in module; the other line calls a method on that module, passing it a callback function.",
        "require('http') loads Node's built-in module; http.createServer(callback) then returns the actual Server object.",
      ],
      explanation: "require('http') loads Node's built-in HTTP module, and http.createServer((req,res)=>{...}) returns a Server object whose callback runs once per incoming request.",
    },
    {
      q: "http.createServer((req, res) => { ... }) — what does the callback function actually receive?",
      options: [
        "Two strings: the request URL and the response URL",
        "An object representing the incoming request, and an object used to build the outgoing response",
        "A single combined req-and-res object",
        "Nothing — the callback takes no arguments",
      ],
      answer: 1,
      hints: [
        "The two parameter names themselves are abbreviations of two different English words — what are they short for?",
        "One object describes what came IN; the other is the tool you use to send something back OUT.",
        "req represents the incoming request (IncomingMessage); res is the object you use to construct and send the outgoing response (ServerResponse).",
      ],
      explanation: "The callback receives two separate objects: req (the incoming request — its url, method, headers) and res (the response you build and send back).",
    },
    {
      q: "res.write(\"Hello \"); res.write(\"World\"); res.end();\nWhat does the client ultimately receive?",
      options: [
        "Two separate, completely independent responses",
        "Nothing, because write() was called before end()",
        "One single response whose body is \"Hello World\"",
        "An error, because write() can only be called once",
      ],
      answer: 2,
      hints: [
        "write() doesn't send a finished response on its own — it just adds to a buffer.",
        "Think of write() as appending text, and end() as the final 'send it now' signal.",
        "Multiple write() calls accumulate into one response body; res.end() is what actually finalizes and sends that single combined response.",
      ],
      explanation: "res.write() can be called multiple times to stream chunks of the body; res.end() finalizes and sends the response — here, one response with body 'Hello World'.",
    },
    {
      q: "What happens if a request handler never calls res.end() (and never calls res.write() with an auto-ending option either)?",
      options: [
        "Node automatically ends the response after exactly 1 second",
        "The response is sent immediately anyway, end() is purely optional",
        "The client's connection hangs, waiting indefinitely for a response that never finishes",
        "The server crashes immediately",
      ],
      answer: 2,
      hints: [
        "end() is the signal that says 'I am completely done writing this response' — what happens if that signal never comes?",
        "Nothing crashes — the request handler just never tells Node it's finished.",
        "Without res.end(), Node never finalizes/sends the response, so the client is left waiting — the request appears to hang forever.",
      ],
      explanation: "res.end() is what signals 'this response is complete, send it now.' Omitting it leaves the response unfinished and the client's connection hanging indefinitely.",
    },
    {
      q: "Which status code should a server set when a request asks for a route/page that doesn't exist?",
      options: ["200", "404", "500", "302"],
      answer: 1,
      hints: [
        "This is one of the most famous three-digit numbers on the entire internet — you've definitely seen it in a browser error page.",
        "It specifically means 'I looked, and this thing is not here' — not a server crash, not success.",
        "404 means Not Found — the server understood the request but has nothing at that URL to return.",
      ],
      explanation: "404 (Not Found) tells the client the server is working fine but has no resource matching the requested URL.",
    },
    {
      q: "Which status code generally indicates the SERVER itself broke while handling a request (e.g. an unhandled exception in the handler)?",
      options: ["200", "404", "500", "201"],
      answer: 2,
      hints: [
        "This is NOT the client's fault in any way — the request itself might have been perfectly fine.",
        "Think 'something went wrong on OUR side, not yours.'",
        "500 (Internal Server Error) signals that the server encountered an unexpected problem while processing an otherwise valid request.",
      ],
      explanation: "500 (Internal Server Error) is the server's way of saying 'something broke on my end' — distinct from 404 (resource missing) or 200 (all good).",
    },
    {
      q: "const server = http.createServer((req,res)=>{...});\n// nothing below this line\nWhat is missing for this server to actually respond to anyone?",
      options: [
        "Nothing — createServer() alone already starts accepting connections",
        "A call to server.listen(PORT) to actually start it listening on a port",
        "An import statement for 'express'",
        "A call to res.send()",
      ],
      answer: 1,
      hints: [
        "Creating the Server object and STARTING it are two genuinely separate steps in Node's http module.",
        "Think about the one method name this unit repeated alongside the word 'port'.",
        "server.listen(PORT) is the call that actually binds the server to a port and starts it accepting incoming connections — without it, nothing is listening at all.",
      ],
      explanation: "http.createServer() only builds the Server object; it isn't actually listening for connections until server.listen(PORT) is called.",
    },
    {
      q: "After server.listen(3000), where would you typically visit in a browser to reach this server during local development?",
      options: [
        "https://nodejs.org:3000",
        "http://localhost:3000",
        "http://3000.com",
        "file:///server/3000",
      ],
      answer: 1,
      hints: [
        "'localhost' is a special hostname that always means 'this very machine, right here.'",
        "The number you passed into listen() becomes part of the address, after a colon.",
        "http://localhost:3000 means 'this machine, port 3000' — exactly where server.listen(3000) just bound the server to.",
      ],
      explanation: "localhost refers to your own machine, and the port number passed to listen() is appended after a colon — so server.listen(3000) is reached at http://localhost:3000.",
    },
    {
      q: "if (req.url === \"/about\") { ... } else if (req.url === \"/\") { ... }\nWhat is this pattern actually doing?",
      options: [
        "Nothing — req.url is never available in plain Node",
        "Manually routing requests by checking which URL path was requested",
        "Automatically generating an Express-style router",
        "Validating the request's HTTP headers",
      ],
      answer: 1,
      hints: [
        "There's no router object here at all — just an if/else chain you write yourself.",
        "req.url holds exactly the path part of the request, e.g. '/about' — and that's what's being compared.",
        "This is manual routing: since raw http has no built-in router, you read req.url yourself and branch with ordinary if/else.",
      ],
      explanation: "Raw Node's http module has no router built in — req.url holds the requested path, and developers branch on it manually with if/else, exactly as shown here.",
    },
    {
      q: "Besides req.url, which other property is commonly checked for manual routing, to distinguish e.g. a GET request from a POST request to the SAME url?",
      options: ["req.method", "req.body", "req.headers.referer", "req.port"],
      answer: 0,
      hints: [
        "Two requests can share the exact same URL but mean completely different things depending on this one property.",
        "Think GET vs POST vs DELETE — what's the general word for that category of action?",
        "req.method holds the HTTP verb (GET, POST, etc.) — checking it alongside req.url lets a handler tell apart 'GET /users' from 'POST /users'.",
      ],
      explanation: "req.method exposes the HTTP verb (GET, POST, PUT, DELETE...), letting manual routing logic distinguish requests that share the same URL but different intents.",
    },
    {
      q: "Why does this unit say raw http.createServer() routing 'gets messy fast' as an app grows past a handful of routes?",
      options: [
        "Because http.createServer() has a hard limit of 3 routes",
        "Because every single new route means writing another manual if/else branch checking req.url and req.method by hand",
        "Because Node deletes old routes automatically after an hour",
        "Because raw http cannot send any response body at all",
      ],
      answer: 1,
      hints: [
        "Nothing technically breaks — it's purely about how much repetitive, hand-written branching logic piles up.",
        "Imagine 30 different URLs, each needing its own check — what does that block of code start to look like?",
        "With no built-in router, every route is another manual if/else checking req.url/req.method — this repetitive sprawl is exactly the problem frameworks like Express (Unit 5.4) solve.",
      ],
      explanation: "Raw http has no router, so each additional route means another hand-written if/else checking req.url and req.method — this sprawl is precisely what a framework like Express exists to clean up, coming in Unit 5.4.",
    },
  ];

  // ==========================================================================
  // LOOPING ANIMATION FRAME EFFECT.
  // Only runs (sets up its interval) while the student is on the Build stage
  // (1) or the See It stage (2), since those are the only two stages whose
  // visuals depend on `animFrame`. On every tick (every 100ms) it bumps
  // animFrame forward by 1, wrapping back to 0 after 60 — giving every
  // ConceptAnimation a continuously cycling `pos` value to animate from. The
  // returned cleanup clears the interval whenever `stage` changes or the
  // component unmounts, so no stray timer keeps ticking once the student
  // leaves Build/SeeIt or leaves the unit entirely.
  // ==========================================================================
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ==========================================================================
  // CONTENT: See-It steps — six guided steps that build ONE minimal server
  // file up line by line. Each step shows the GROWING code (more lines than
  // the step before) plus a simulated terminal/response panel showing what
  // that much code would actually do if run. None of this is live-executed
  // — `code`/`result` are strings written to LOOK like a real terminal/
  // browser session, since this is a browser-rendered lesson page with no
  // real OS shell underneath it.
  // ==========================================================================
  const seeitSteps = [
    {
      plain: "Start by pulling in Node's built-in http module.",
      tech: "require('http') loads the module; no server exists yet.",
      code: `// server.js
const http = require('http');`,
      result: "(nothing runs yet — just an import)",
      resultColor: "#94a3b8",
    },
    {
      plain: "createServer() builds the server object around a callback.",
      tech: "The callback will run once per incoming request — not yet.",
      code: `// server.js
const http = require('http');
const server = http.createServer((req, res) => {
  // handler body goes here
});`,
      result: "(server object created, but not listening yet)",
      resultColor: "#94a3b8",
    },
    {
      plain: "Inside the handler, set a status and end the response.",
      tech: "res.statusCode + res.end(body) completes a basic response.",
      code: `const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.end('Hello from Node!');
});`,
      result: "(still not listening — one more step)",
      resultColor: "#94a3b8",
    },
    {
      plain: "listen(PORT) finally starts the server accepting connections.",
      tech: "server.listen(3000) binds to localhost:3000.",
      code: `server.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
      result: "$ node server.js\nServer running on port 3000",
      resultColor: "#4ade80",
    },
    {
      plain: "Visiting localhost:3000 in a browser now gets a real reply.",
      tech: "GET / → statusCode 200, body 'Hello from Node!'.",
      code: `// browser: GET http://localhost:3000/`,
      result: "200 OK\nHello from Node!",
      resultColor: "#38bdf8",
    },
    {
      plain: "Visiting an unhandled path still gets SOME response, by default empty.",
      tech: "Without routing logic, every path returns the same handler output.",
      code: `// browser: GET http://localhost:3000/anything`,
      result: "200 OK\nHello from Node! (same for every path — no routing yet)",
      resultColor: "#fb923c",
    },
  ];

  // ==========================================================================
  // CONTENT: Try-It presets — the simulated preset requests a student can
  // tap. Each renders a pre-written fake response panel, so students get the
  // FEEL of hitting different routes (including the routed "/about" path and
  // a deliberately unhandled "/missing-page" 404) without any real server
  // running anywhere behind this browser tab.
  // ==========================================================================
  const requestPresets = [
    { label: "GET /", status: 200, statusColor: "#4ade80", body: "Welcome home!", note: "req.url === '/' matched the home route — 200 OK." },
    { label: "GET /about", status: 200, statusColor: "#4ade80", body: "About this app.", note: "req.url === '/about' matched its own if/else branch." },
    { label: "GET /missing-page", status: 404, statusColor: "#ef4444", body: "Not Found", note: "No branch matched this url, so the else case sets statusCode 404." },
  ];

  // ==========================================================================
  // CONTENT: Challenge 1 — TagMatch pairs (term → meaning). Wrong taps show
  // that specific pair's `hint` field immediately, per house style.
  // ==========================================================================
  const ch1Pairs = [
    { code: "req", meaning: "The incoming request object — url, method, headers", hint: "Short for the English word describing what the client is making." },
    { code: "res", meaning: "The outgoing response object you build and send back", hint: "Short for the English word describing what the server sends back." },
    { code: "listen(PORT)", meaning: "Starts the server actually accepting connections", hint: "Nothing answers requests until THIS method is called." },
    { code: "statusCode", meaning: "The 200/404/500 number telling the client how it went", hint: "Three digits, set on res, before res.end()." },
    { code: "port", meaning: "The number after the colon in localhost:3000", hint: "It's the same number you pass into listen()." },
  ];

  // ==========================================================================
  // CONTENT: Challenge 2 — bug hunt. Three lines are fine inside a request
  // handler; exactly one line is missing res.end(), so the response never
  // actually finishes/sends.
  // ==========================================================================
  const bugLines = [
    { text: "const server = http.createServer((req, res) => {", buggy: false },
    { text: "  res.statusCode = 200;", buggy: false },
    { text: "  res.write('Hello!');", buggy: true, why: "This handler writes a chunk but never calls res.end(). Without end(), the response is never finalized — the client's connection just hangs, waiting forever. Fix: add res.end(); right after." },
    { text: "});", buggy: false },
  ];
  const bugHints = [
    "Three of these four lines are completely fine on their own. One line is missing a call that always needs to happen eventually.",
    "Look at the line writing the response body — what method usually gets called right after write(), to finish things off?",
    "res.write() alone never finishes the response — it's missing a follow-up res.end() call. Tap that line.",
  ];

  // ==========================================================================
  // SHARED STYLE OBJECT — copied verbatim (same keys, same values) from
  // Unit4_5.jsx / Unit5_1.jsx so this unit is visually indistinguishable in
  // "feel" from every other unit in the course. Every numeric size is either
  // a %, a flexWrap-friendly flex-basis, or a clamp()/minmax() expression,
  // so nothing here can force horizontal overflow on a narrow phone screen.
  // ==========================================================================
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    // pill(active, done) — active stage is bright blue, a completed stage
    // turns translucent green with a green outline, anything else dims.
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
    // green ("#4ade80") for any "this finishes/unlocks something" button.
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    // tag(color) — small rounded badge, e.g. "3 / 8" concept counters or
    // "Attempt 2" labels in the quiz.
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.84rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    // quizOption(selected, correct, wrong) — three-way tile coloring: green
    // if just-confirmed-correct, red if just-confirmed-wrong, blue outline
    // if merely selected-but-unchecked, plain otherwise.
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
  // Poses one prediction question BEFORE any teaching: what actually happens
  // the instant you type a URL and hit Enter. The student must pick one of
  // four guesses and submit before seeing the reveal; only after submitting
  // do they get a "Start Learning →" button advancing `stage` to 1 (Build).
  // ==========================================================================
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🌐</div>
        <div style={s.h2}>You type a URL and hit Enter. What REALLY happens?</div>
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 4 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "The browser makes up the page itself, no server involved",
              "Your browser sends a request; a server somewhere sends back a response",
              "The URL is just a filename opened locally",
              "Nothing — URLs are purely decorative",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          {/* Disabled until a guess is actually picked, forcing an active
              choice instead of letting students skip the prediction step. */}
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>real answer</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>request / response</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "Your browser sends a request; a server somewhere sends back a response" ? "🎯 Exactly right!" : "Let's build one of those servers ourselves."}
          </div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // STAGE 1 RENDERER — BUILD.
  // Renders the horizontally-scrollable concept-picker strip above a card
  // showing the CURRENTLY selected concept: its title, ConceptAnimation
  // illustration (keyed by buildConcept, animated via shared animFrame), a
  // Plain⇄Technical toggle, and either a "Next: <title> →" button or a
  // green "I've got it!" button once the LAST concept has been reached.
  // ==========================================================================
  const renderBuild = () => {
    // Compute the upcoming concept's short title for the "Next:" button
    // label, or null if this IS the last concept.
    const nextTitle = buildConcept < concepts.length - 1
      ? concepts[buildConcept + 1].title.split("—")[0].trim()
      : null;
    return (
      <div>
        {/* Horizontally-scrollable concept picker: tap any pill to jump
            directly to that concept. Also resets buildMode to "plain" so
            jumping concepts never strands the student on a Technical
            explanation for a topic they haven't seen in Plain English. */}
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
              reads buildConcept as `index` to pick its if-block, and the
              shared, ever-incrementing `animFrame` to animate it. */}
          <div style={s.animBox}><ConceptAnimation index={buildConcept} frame={animFrame} /></div>
          <div style={s.toggleRow}>
            <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
            <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            {/* Only one of these two ever renders, based on buildMode. */}
            {buildMode === "plain" && <div style={{ ...s.line, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
            {buildMode === "tech" && <div style={{ ...s.line, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            {/* While more concepts remain, advance by 1 and reset to Plain
                mode; on the LAST concept, advance the whole lesson to
                stage 2 (See It) instead. */}
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

  // ==========================================================================
  // STAGE 2 RENDERER — SEE IT.
  // A slower, step-by-step walkthrough building ONE server file up line by
  // line: each step shows the GROWING code snippet plus the simulated
  // terminal/response result it produces, alongside a Plain/Technical-
  // toggled one-line explanation. seeitStep drives which seeitSteps entry is
  // visible; "Next Step →" / "← Back" move linearly, and once the LAST step
  // is reached the forward button instead reads "Now Let Me Try It!" and
  // advances into stage 3 (Try It).
  // ==========================================================================
  const renderSeeIt = () => {
    // Look up the single step object currently shown, once per render.
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Build the Server, Line by Line</div>
        {/* Same Plain/Technical toggle pattern as Build, backed by its own
            independent seeitMode state. */}
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        {/* The growing code snippet for this step, monospace, styled to
            look like an editor pane. */}
        <div style={s.codeBox}>{step.code}</div>
        {/* A small downward arrow purely as a visual "this produces..."
            connector between the snippet above and the result box below. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* The simulated terminal/response result, color-coded per step. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", margin: "0 0 12px", fontFamily: "'Cascadia Code','Consolas',monospace", textAlign: "center", whiteSpace: "pre-wrap" }}>
          <span style={{ color: step.resultColor, fontWeight: 700, fontSize: "0.92rem" }}>{step.result}</span>
        </div>
        {/* Explanation text swaps between step.plain and step.tech. */}
        <div style={{ ...s.line, color: "#e2e8f0", textAlign: "center" }}>{seeitMode === "plain" ? step.plain : step.tech}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
          {/* Forward nav: advance while steps remain; on the final step,
              push the whole lesson into stage 3 (Try It) instead. */}
          {seeitStep < seeitSteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
          {/* Back nav only appears once there IS a previous step. */}
          {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 3 RENDERER — TRY IT.
  // The hands-on simulation: a row of preset requests (GET "/", GET
  // "/about", GET "/missing-page") the student can tap. Tapping one looks up
  // its matching object inside `requestPresets` and renders a simulated
  // response panel with that request's pre-written fake status/body.
  // `triedCount` only increments the FIRST time a given request is tapped,
  // and the "Take the Challenge →" button only appears once at least 3
  // distinct requests have been tried.
  // ==========================================================================
  const renderTryIt = () => {
    // Find the full preset object matching whichever request is currently
    // selected, so the JSX below can read .status/.body/.note directly.
    const active = requestPresets.find((p) => p.label === reqPicked);

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Send a Few Requests</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {requestPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setReqPicked(p.label);
                // Only bump the "distinct requests tried" counter the FIRST
                // time this exact request is selected — re-tapping the same
                // one later should not inflate the unlock counter.
                if (reqPicked !== p.label) setTriedCount((c) => c + 1);
              }}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #334155", fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                background: reqPicked === p.label ? "#38bdf8" : "#0f172a", color: reqPicked === p.label ? "#0f172a" : "#7dd3fc",
              }}
            >{p.label}</button>
          ))}
        </div>

        {/* Simulated response panel: status line, then body, or a neutral
            placeholder before anything has been tapped. */}
        <div style={{ background: "#000", borderRadius: 10, padding: "14px 16px", fontFamily: "'Cascadia Code','Consolas',monospace", minHeight: 50, textAlign: "center" }}>
          {active ? (
            <>
              <div style={{ color: active.statusColor, fontWeight: 700, fontSize: "0.95rem" }}>{active.status} {active.status === 200 ? "OK" : "Not Found"}</div>
              <div style={{ fontSize: "1.1rem", color: "#475569", margin: "2px 0" }}>↓</div>
              <div style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>{active.body}</div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "0.8rem" }}>Tap a request above ↑</div>
          )}
        </div>

        {/* Explanatory note reinforcing WHY this status/body happened. */}
        {active && (
          <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginTop: 12, textAlign: "center" }}>
            <div style={{ ...s.line, color: "#94a3b8", marginBottom: 0 }}>{active.note}</div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {/* Gate: at least 3 distinct requests must be tried before the
              Challenge stage unlocks. */}
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 different requests to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // STAGE 4 RENDERER — CHALLENGE.
  // Two back-to-back mini-games, switched via challengePhase:
  //   phase 0 → TagMatch (term → meaning) using ch1Pairs, gated by ch1Done.
  //   phase 1 → BugHunt (find the missing-res.end() line) using
  //             bugLines/bugHints, gated by ch2Done.
  // Both child components are generic/reusable (defined once below, outside
  // this component) and call back up via onDone the moment the student
  // finishes that mini-game.
  // ==========================================================================
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Match Term → Meaning</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {/* Only appears once TagMatch reports every pair matched, per
              house style — no skipping a mini-game unfinished. */}
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Find the Hanging Response</div>
          <div style={{ ...s.line, marginBottom: 14 }}>Tap the line missing res.end().</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {/* Only appears once BugHunt confirms the truly-buggy line was
              tapped — this is the doorway into stage 5, the final Quiz. */}
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ==========================================================================
  // STAGE 5 RENDERER — QUIZ.
  // If quizDone is already true, render ONLY the completion screen — the
  // single spot in the entire file where onUnitComplete() is called, wired
  // to a real onClick on a real button, never auto-fired. Otherwise, render
  // the current question with its options, hint box (on wrong attempts) or
  // explanation box (on a correct attempt), and Check Answer / Next
  // Question controls.
  // ==========================================================================
  const renderQuiz = () => {
    // Branch INSIDE the render function (not around any hook!) — once every
    // question has been answered correctly, quizDone flips true and this
    // function returns only the completion card from then on.
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>🏆</div>
          {/* Deliberately says "Unit 5.2 done" and points to npm & Modules
              next — NEVER "Module 5 complete", since Units 5.3-5.5 remain. */}
          <div style={s.h2}>Unit 5.2 done, on to npm &amp; Modules</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>
            {student?.name ? `Nice work, ${student.name}!` : "Nice work!"} You just built an HTTP server from scratch.
          </div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "The request/response cycle — one ask, one answer",
              "require('http') + http.createServer((req,res)=>{...})",
              "req describes what came in; res builds what goes out",
              "res.write() streams chunks; res.end() finishes the response",
              "Status codes: 200 ok, 404 not found, 500 server error",
              "server.listen(PORT) — nothing answers until this runs",
              "Manual routing by reading req.url and req.method yourself",
              "Why raw http gets messy fast — and why Express (Unit 5.4) helps",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* THE ONLY onUnitComplete() CALL SITE IN THIS ENTIRE FILE. Fired
              from a real onClick, exactly once per click, and this button
              only ever exists once quizDone is true (after all 12 questions
              are answered correctly) — satisfying the "call it once" and
              "only from a real button" hard rules. App.jsx's own
              onUnitComplete implementation takes over from here: persisting
              progress and routing the student onward, typically to
              Unit5_3 ("npm & Modules"). */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    // Look up the current question object once per render.
    const q = quizQuestions[quizQ];
    // hintIndex clamps to the LAST hint once attempts exceed the hints
    // array's length, so a student who keeps missing always still sees some
    // hint (never silence) but never anything beyond the final hint
    // repeatedly. Same escalation formula used across every unit.
    const hintIndex = Math.min(quizAttempts - 1, q.hints.length - 1);
    return (
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
          {/* Question counter, e.g. "Question 4 of 12". */}
          <div style={s.tag("#38bdf8")}>Question {quizQ + 1} of {quizQuestions.length}</div>
          {/* Attempt counter only shows once this SPECIFIC question has
              been gotten wrong at least once. */}
          {quizFeedback === "wrong" && <div style={s.tag("#fb923c")}>Attempt {quizAttempts + 1}</div>}
        </div>
        <div style={{ ...s.h3, color: "#f1f5f9", fontSize: "0.9rem", marginBottom: 14, whiteSpace: "pre-wrap" }}>{q.q}</div>
        {/* Render every option as its own clickable tile. Clicking is
            allowed only when nothing has been confirmed correct yet. */}
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
        {/* Wrong-answer hint box — shows the escalating hint at hintIndex.
            Crucially, this NEVER contains or reveals the correct option's
            literal text — every hints[] entry above was written to nudge
            reasoning only. */}
        {quizFeedback === "wrong" && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint:</div>
            <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{q.hints[hintIndex]}</div>
          </div>
        )}
        {/* Correct-answer box — shows the fixed `explanation` string. */}
        {quizFeedback === "correct" && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✅ Correct!</div>
            <div style={{ color: "#86efac", fontSize: "0.82rem" }}>{q.explanation}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {/* "Check Answer" — disabled until an option is selected. On
              click: if selection matches q.answer, flip feedback to
              "correct". Otherwise bump quizAttempts (shifting hintIndex for
              the NEXT wrong attempt), flip feedback to "wrong", and clear
              the selection so the student must actively re-pick. */}
          {quizFeedback !== "correct" && (
            <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
              if (quizSelected === q.answer) { setQuizFeedback("correct"); }
              else { setQuizAttempts((a) => a + 1); setQuizFeedback("wrong"); setQuizSelected(null); }
            }}>Check Answer</button>
          )}
          {/* Only shown after a correct answer. Advances to the next
              question (resetting selection/feedback/attempts) while
              questions remain; once this WAS the last question, instead
              flips quizDone to true, swapping this function over to the
              completion-screen branch above on the next render. */}
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
  // chosen by the current `stage` value. App.jsx renders its own floating
  // "← Dashboard" affordance OVER this entire component elsewhere in the app
  // shell, so this file does not add a redundant back button.
  // ==========================================================================
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 5.2 — Your First HTTP Server</div>
        {/* Stage pills: `stage === i` highlights the CURRENT stage,
            `stage > i` marks an already-completed stage green, anything
            else (not yet reached) stays dim/inactive. */}
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {/* Small personalized welcome line, shown only on the Spark stage so
          it doesn't clutter every subsequent screen. Reads the `student`
          prop handed down from App.jsx, falling back to "Student" if no
          name is present yet. */}
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
      {/* Small responsive tweak for very narrow phones, matching the same
          media-query pattern used across the course. */}
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
// plain function component (not exported, used only inside this file) so it
// can sit outside Unit5_2 and stay completely stateless itself: all motion
// comes from the `frame` number Unit5_2 keeps incrementing via its own
// useEffect/setInterval, passed in as a prop on every render. `index` picks
// exactly one of the if-blocks below, in the SAME order as the `concepts`
// array up in Unit5_2, so concept #0 ("Request → Response") always renders
// the index===0 block, and so on through #7. Each block derives its own
// animated values from `pos` (a 0..1 sawtooth computed from `frame`), then
// returns plain divs styled with inline CSS — no real CSS keyframes are used
// anywhere; the "animation" is React re-rendering with a slightly different
// `pos` 10 times/second.
// ============================================================================
function ConceptAnimation({ index, frame }) {
  // pos cycles smoothly from 0 up to just-under-1 every 40 frames (4
  // seconds, since the parent ticks frame every 100ms) — the single timing
  // source for every animation block below.
  const pos = (frame % 40) / 40;
  // Shared full-size centering wrapper every animation block renders inside.
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  // A small reusable "→" glyph for several diagram blocks below.
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — "Request → Response": a request packet travels client → server,
  // then a response packet travels back server → client.
  if (index === 0) {
    const phase = Math.floor(pos * 2) % 2; // 0 = request going out, 1 = response coming back
    const outgoing = phase === 0;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "1.3rem" }}>💻</div>
            <div style={{ fontSize: "0.9rem", color: outgoing ? "#38bdf8" : "#475569" }}>{outgoing ? "→ request →" : "← response ←"}</div>
            <div style={{ fontSize: "1.3rem" }}>🖥️</div>
          </div>
          {/* Extra element: a small status label flips between "asking..."
              and "answering..." in sync with phase, reinforcing the cycle
              visually without another sentence of text. */}
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: outgoing ? "#38bdf8" : "#4ade80" }}>{outgoing ? "client asking..." : "server answering..."}</div>
        </div>
      </div>
    );
  }

  // 1 — "createServer() Builds the Server": require('http') box, then an
  // arrow into createServer(), then the resulting Server object lighting up.
  if (index === 1) {
    const built = pos > 0.55;
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", fontSize: "0.6rem", color: "#94a3b8", fontFamily: "monospace" }}>require('http')</div>
          {arrow}
          <div style={{ border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", fontSize: "0.6rem", color: "#94a3b8", fontFamily: "monospace" }}>createServer()</div>
          {arrow}
          <div style={{
            border: built ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 6, padding: "6px 8px",
            fontSize: "0.62rem", fontWeight: 700, color: built ? "#4ade80" : "#475569",
          }}>{built ? "Server ✅" : "..."}</div>
        </div>
      </div>
    );
  }

  // 2 — "req In, res Out": two arrows, one pointing INTO a box labeled req,
  // one pointing OUT of a box labeled res, alternating emphasis.
  if (index === 2) {
    const showingReq = pos < 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: "0.9rem", color: showingReq ? "#38bdf8" : "#475569" }}>→</div>
            <div style={{
              border: showingReq ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 8, padding: "8px 12px",
              fontSize: "0.66rem", fontWeight: 700, color: showingReq ? "#38bdf8" : "#64748b",
            }}>req (in)</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              border: !showingReq ? "2px solid #4ade80" : "1px solid #334155", borderRadius: 8, padding: "8px 12px",
              fontSize: "0.66rem", fontWeight: 700, color: !showingReq ? "#4ade80" : "#64748b",
            }}>res (out)</div>
            <div style={{ fontSize: "0.9rem", color: !showingReq ? "#4ade80" : "#475569" }}>→</div>
          </div>
        </div>
      </div>
    );
  }

  // 3 — "res.write() and res.end()": chunks of text appending into a body
  // box, then a final "end()" stamp closing it off.
  if (index === 3) {
    const chunkCount = Math.min(3, Math.floor(pos * 4));
    const ended = pos > 0.8;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{
            border: ended ? "2px solid #4ade80" : "1px dashed #334155", borderRadius: 8, padding: "8px 14px",
            fontSize: "0.62rem", color: "#94a3b8", minWidth: 70, textAlign: "center",
          }}>{"chunk ".repeat(chunkCount) || "..."}</div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: ended ? "#4ade80" : "#fb923c" }}>{ended ? "res.end() ✅ sent!" : "res.write()..."}</div>
        </div>
      </div>
    );
  }

  // 4 — "Status Codes: 200 / 404 / 500": three colored badges, cycling
  // which one is currently "active" (highlighted).
  if (index === 4) {
    const codes = [
      { n: "200", c: "#4ade80", label: "ok" },
      { n: "404", c: "#fb923c", label: "missing" },
      { n: "500", c: "#ef4444", label: "broke" },
    ];
    const active = Math.floor(pos * 3) % 3;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 10 }}>
          {codes.map((c, i) => (
            <div key={c.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                border: active === i ? `2px solid ${c.c}` : "1px solid #334155", borderRadius: 8, padding: "8px 10px",
                fontSize: "0.74rem", fontWeight: 800, color: active === i ? c.c : "#64748b", fontFamily: "monospace",
              }}>{c.n}</div>
              <div style={{ fontSize: "0.56rem", color: active === i ? c.c : "#475569" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5 — "listen() Opens the Door": a door icon swinging from closed to open
  // once listen() "fires", with a localhost:PORT label appearing.
  if (index === 5) {
    const open = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: "1.6rem" }}>{open ? "🚪✅" : "🚪"}</div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: open ? "#4ade80" : "#64748b" }}>{open ? "listen(3000) → answering" : "not listening yet..."}</div>
          <div style={{ fontSize: "0.58rem", fontFamily: "monospace", color: open ? "#38bdf8" : "#334155", opacity: open ? 1 : 0.4 }}>localhost:3000</div>
        </div>
      </div>
    );
  }

  // 6 — "Routing by req.url": a signpost with three paths, one lighting up
  // as the "matched" branch based on a cycling req.url value.
  if (index === 6) {
    const paths = ["/", "/about", "/contact"];
    const active = Math.floor(pos * 3) % 3;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontFamily: "monospace" }}>req.url === "{paths[active]}"</div>
          <div style={{ display: "flex", gap: 6 }}>
            {paths.map((p, i) => (
              <div key={p} style={{
                border: active === i ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 6, padding: "5px 8px",
                fontSize: "0.58rem", fontFamily: "monospace", color: active === i ? "#38bdf8" : "#64748b",
              }}>{p}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 7 — "Why This Gets Messy": if/else branches stacking up taller and
  // taller, then an arrow pointing to a small "Express" label as the fix.
  const stackHeight = 1 + Math.floor(pos * 4); // 1..4 growing blocks
  const showFix = pos > 0.75;
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column-reverse", gap: 3 }}>
          {Array.from({ length: stackHeight }).map((_, i) => (
            <div key={i} style={{ width: 60, height: 10, borderRadius: 3, background: "#334155", fontSize: "0.5rem" }} />
          ))}
        </div>
        <div style={{ fontSize: "0.56rem", color: "#fb923c", fontWeight: 700 }}>if/else piling up...</div>
        {showFix && (
          <>
            <div style={{ fontSize: "0.9rem", color: "#4ade80" }}>→</div>
            <div style={{ border: "2px solid #4ade80", borderRadius: 6, padding: "5px 8px", fontSize: "0.58rem", fontWeight: 700, color: "#4ade80" }}>Express (next!)</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── TAG MATCH — wrong tap shows that pair's hint immediately ───────────────
// Generic, reusable two-column matching mini-game: tap a term on the left,
// then tap its meaning on the right. A correct pairing locks both tiles
// green; a wrong pairing flashes red briefly and surfaces that pair's
// specific `hint` string. Calls onDone() once every pair has been matched.
function TagMatch({ pairs, onDone }) {
  // matched: { [code]: meaning } map of pairs successfully matched so far.
  const [matched, setMatched] = useState({});
  // selected: the currently-tapped tile (either a code or a meaning),
  // awaiting its counterpart tap to complete or reject a pairing.
  const [selected, setSelected] = useState(null);
  // flashWrong: which meaning tile briefly flashes red after a bad match.
  const [flashWrong, setFlashWrong] = useState(null);
  // hintMsg: the explanatory hint shown after the most recent wrong tap.
  const [hintMsg, setHintMsg] = useState(null);
  // Shuffle the meanings ONCE on mount (useRef so the shuffle doesn't
  // re-randomize on every re-render, which would be visually jarring).
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
        // Fire onDone the instant every pair has been matched.
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
// Generic, reusable "tap the one buggy line" mini-game. Each wrong tap
// flashes that line red and bumps wrongAttempts, surfacing the next hint in
// the escalating `hints` array (clamped to the last hint once attempts
// exceed its length). Tapping the actually-buggy line locks in `revealed`
// and shows that line's specific `why` explanation, then fires onDone().
function BugHunt({ lines, hints, onDone }) {
  // revealed: true once the student has correctly found the buggy line.
  const [revealed, setRevealed] = useState(false);
  // wrongTap: index of the line currently flashing red (briefly), or null.
  const [wrongTap, setWrongTap] = useState(null);
  // wrongAttempts: total wrong taps so far — drives hintIndex below.
  const [wrongAttempts, setWrongAttempts] = useState(0);

  function tap(line, i) {
    if (revealed) return; // no-op once already solved
    if (line.buggy) { setRevealed(true); onDone(); }
    else { setWrongTap(i); setWrongAttempts((a) => a + 1); setTimeout(() => setWrongTap(null), 600); }
  }

  // Same escalation formula used by the Quiz stage: clamp to the last hint
  // once wrongAttempts exceeds the hints array's length.
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
