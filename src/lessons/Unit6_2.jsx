// ============================================================================
//  UNIT 6.2 — "REST API Design"
//  Module: M6 — Databases & APIs (SECOND of three units in this module —
//  Unit6_1 covered "What Is a Database?", this unit covers REST API
//  Design, Unit6_3 will cover Connecting Node to a DB. This unit does
//  NOT claim module completion — only its own unit is finished when the
//  student reaches the end of the quiz.)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - This file lives at src/lessons/Unit6_2.jsx. It is loaded by
//    src/shell/App.jsx the exact same way every other lesson in this
//    course is loaded: App.jsx reads the course map in
//    config/course.config.js, finds the entry whose id is "Unit6_2",
//    dynamically renders <Unit6_2 student={...} onUnitComplete={...} />
//    inside its lesson-viewport area, and then just WAITS — it does not
//    poll or guess when the student is done. The only signal App.jsx
//    listens for is a single call to the onUnitComplete() function it
//    handed us as a prop. When that call happens, App.jsx marks this
//    unit as complete (writing to local/cloud progress state elsewhere
//    in the shell — NOT in this file) and routes the student back to
//    the Dashboard or on to Unit6_3.
//  - Because of that contract, THIS file must never import api.js or
//    config/gas.config.js — this lesson is a pure, self-contained React
//    component. It has zero network awareness. Saving progress, talking
//    to Google Apps Script, etc. are App.jsx's job, not ours. We only
//    ever call the onUnitComplete prop we were given — and we call it
//    exactly once, only from a real onClick on the final Quiz screen,
//    never from a useEffect/auto-fire (see Unit1_1_template.jsx Rule 3
//    for why: an auto-firing effect inside a conditional block once
//    broke React's Rules of Hooks and silently stranded students — so
//    every hook below is declared unconditionally, at the top, in a
//    fixed order, on every single render, no exceptions).
//
//  HOUSE STYLE (copied verbatim in spirit from Unit4_5.jsx / Unit6_1.jsx
//  so every lesson in this course looks and feels the same to a student
//  flipping between units):
//  - Shared style object is literally named `s` everywhere in this
//    course, reused field-for-field, so margins/colors/radii feel
//    identical lesson to lesson. We copy it here unchanged.
//  - Every wrong tap in TagMatch / BugHunt immediately shows an
//    explanatory hint — nothing is ever silently "just wrong".
//  - Quiz wrong answers NEVER reveal the correct option. Instead an
//    escalating (never auto-disappearing) hint is shown, and the
//    student can keep retrying the same question.
//
//  *** CRITICAL VISUAL-DENSITY DIRECTIVE FOR THIS FILE (per course owner
//  feedback that earlier lessons were "too text-heavy — needs to be more
//  visual-interactive and less text, more animation") ***
//  - Every Build-stage concept's `plain` and `technical` strings are
//    capped at ONE short sentence (under ~20 words each). All of the
//    actual TEACHING happens inside ConceptAnimation below — multiple
//    moving/state-changing parts driven by the shared animFrame/pos
//    tick, never a static box. Concretely: verb badges that light up in
//    sequence, a URL bar typing itself out, a request packet animating
//    from client to server and a colored response packet animating
//    back, a stoplight-style status-code indicator, etc.
//  - Every OTHER piece of rendered text in this file (Spark framing, See
//    It descriptions, Try It notes, Challenge intros) is also kept to
//    the shortest sentence that still makes sense — we lean on visual
//    elements (code/request boxes, colored pills, icons) instead of
//    prose wherever one will do the job.
//  - Quiz question text, options, hints, and explanations are the ONE
//    exception — those stay full-length and are NOT compressed, per the
//    explicit instruction that compression only applies to student-
//    facing Build/Spark/SeeIt/TryIt/Challenge text, never the Quiz.
//
//  SIX-STAGE FLOW (same six stages every unit in this course uses,
//  controlled entirely by the single `stage` integer state variable):
//    Stage 0 SPARK     — predict which of two competing endpoint designs
//                         is "more RESTful": POST /deleteUser/7 versus
//                         DELETE /users/7 — before any teaching happens.
//    Stage 1 BUILD     — 7 concepts: what REST actually means (resources
//                         as nouns, not verb endpoints), the CRUD→HTTP
//                         verb mapping, naming conventions (plural nouns,
//                         nested resources, no verbs in URLs), status
//                         codes matching intent, statelessness, JSON as
//                         the standard body format, and how all of this
//                         maps directly onto Express's app.get/post/
//                         put/delete from Unit5_4.
//    Stage 2 SEE IT    — 5 step-by-step screens, each showing a real
//                         request (verb + path + body) hitting a server
//                         and the matching response (status + body) for
//                         different CRUD operations on a /tasks resource.
//    Stage 3 TRY IT    — the student clicks preset requests (GET /tasks,
//                         GET /tasks/3, POST /tasks with a body, PUT
//                         /tasks/3, DELETE /tasks/3) against a small
//                         simulated REST API and watches the correct
//                         status + body come back for real.
//    Stage 4 CHALLENGE — tag-match (HTTP verb/status code → meaning)
//                         with hints, then a bug hunt: spot the one
//                         badly-designed, verb-in-URL endpoint hiding
//                         among several well-designed REST endpoints.
//    Stage 5 QUIZ      — 12 questions, escalating hints, completion
//                         screen is UNIT-level only (points the student
//                         at Unit6_3, does NOT claim Module 6 is done).
//
//  MOBILE-FRIENDLY: every width below is a % or comes from flexWrap /
//  minmax() / clamp() — there are no fixed pixel widths anywhere that
//  could force horizontal scrolling on a small phone screen.
// ============================================================================

// React hooks we need: useState for every piece of UI state below,
// useEffect to drive the looping concept-animation timer, useRef to
// hold a mutable interval handle without triggering re-renders itself.
import { useState, useEffect, useRef } from "react";

// The component itself. Signature is EXACTLY what App.jsx expects to
// call: a `student` object (read-only — we only ever read student.name
// to personalize a greeting, we never write to it) and an
// `onUnitComplete` callback function (we call it zero or one times,
// never more, and only after a real button click on the Quiz screen).
export default function Unit6_2({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ──────────────────────────────────────────────────
  // `stage` is the single source of truth for which of the six big
  // screens is currently showing. 0=Spark,1=Build,2=SeeIt,3=TryIt,
  // 4=Challenge,5=Quiz. Every "Next" button in this file just calls
  // setStage(n) to move forward — there is no separate router, App.jsx
  // doesn't know or care about this internal state, it only cares about
  // onUnitComplete() eventually firing once. Declared first, and every
  // hook below it is ALSO declared unconditionally so React always sees
  // the same hook call order on every render (Rule 3 from the template).
  const [stage, setStage] = useState(0);

  // ── SPARK STATE ──────────────────────────────────────────────────────────
  // sparkGuess holds which of the guess-pills the student tapped (or
  // null if they haven't tapped one yet — used to disable the Submit
  // button until a real choice is made). sparkSubmitted flips to true
  // once they click Submit, swapping the picker UI for the reveal UI.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD STATE ──────────────────────────────────────────────────────────
  // buildConcept is an index into the `concepts` array further down —
  // tracks which of the 7 Build-stage concepts is currently on screen.
  // buildMode is the Plain-English/Technical toggle, reset back to
  // "plain" every time the student switches concepts so they always
  // start with the friendlier explanation first.
  const [buildConcept, setBuildConcept] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT STATE ─────────────────────────────────────────────────────────
  // seeitStep walks through the `seeitSteps` array (each one a distinct
  // request/response pair on the /tasks resource). seeitMode is its own
  // independent Plain/Technical toggle (kept separate from buildMode so
  // leaving Build doesn't silently change what's shown in See It).
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT STATE ─────────────────────────────────────────────────────────
  // tryTasks holds the actual simulated "/tasks" resource list the
  // student mutates live by clicking preset request buttons — real,
  // visible, changing state, not a canned animation. lastRequest/
  // lastResponse record the most recently fired preset (verb+path+body
  // and the status+body that came back) so the request/response panel
  // always reflects the LAST thing the student actually clicked.
  // triedPresets is a set-like object tracking which DISTINCT presets
  // have been tried at least once — the course rule is 3+ distinct
  // tries before "Next" unlocks, tracked via triedCount.
  const [tryTasks, setTryTasks] = useState([
    { id: 1, title: "Buy groceries", done: false },
    { id: 2, title: "Finish assignment", done: false },
    { id: 3, title: "Read chapter 6", done: true },
  ]);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [triedPresets, setTriedPresets] = useState({});
  const [triedCount, setTriedCount] = useState(0);

  // ── CHALLENGE STATE ──────────────────────────────────────────────────────
  // challengePhase: 0 = the TagMatch verb/status-code game is showing,
  // 1 = the BugHunt bad-endpoint-naming game is showing. ch1Done/ch2Done
  // flip to true once each minigame's onDone callback fires, which is
  // what reveals each "Next Challenge"/"Final Quiz" button.
  const [challengePhase, setChallengePhase] = useState(0);
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ STATE ───────────────────────────────────────────────────────────
  // quizQ = index of the current question inside quizQuestions.
  // quizSelected = which option index the student has currently tapped
  // (null = nothing tapped yet, used to disable Check Answer button).
  // quizFeedback = null | "correct" | "wrong" — controls which
  // highlight colors and hint/explanation boxes render.
  // quizAttempts = how many WRONG attempts on the CURRENT question —
  // resets to 0 every time we move to a new question — drives which
  // escalating hint string is shown (more wrong attempts = more
  // specific hint, but never the literal answer).
  // quizDone = true once every question has been answered correctly —
  // flips renderQuiz() over to the final completion screen, which is
  // the ONLY place in this entire file that calls onUnitComplete().
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // ── LOOPING ANIMATION FRAME ──────────────────────────────────────────────
  // animRef holds the setInterval handle so the cleanup function in the
  // useEffect below can clearInterval it without animRef itself causing
  // re-renders (refs don't trigger renders, unlike state). animFrame is
  // the actual state value that DOES trigger re-renders — it ticks up
  // by 1 every 100ms while the student is on Build or See It, and every
  // ConceptAnimation below derives its visual motion purely from this
  // one shared counter (no per-concept timers needed). This is what
  // carries the bulk of the teaching per the visual-density directive.
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: seven Build-stage concepts ──────────────────────────────────
  // Each entry feeds: (1) the concept-picker strip at the top of Build,
  // (2) the ConceptAnimation visual (matched by array INDEX, 0-6, in
  // the ConceptAnimation function defined below the component), and
  // (3) the plain/technical text blurb shown under the animation. Per
  // the visual-density directive, plain/technical are each ONE short
  // sentence — the ConceptAnimation does the real teaching.
  const concepts = [
    {
      title: "REST = Resources, Not Verbs",
      plain: "REST names URLs after THINGS (nouns like /users), never actions (verbs like /getUser).",
      technical: "REST models endpoints as resources (nouns); the HTTP verb — not the URL — expresses the action.",
    },
    {
      title: "CRUD → HTTP Verb Mapping",
      plain: "GET reads, POST creates, PUT/PATCH updates, DELETE removes — same resource URL, different verb.",
      technical: "CRUD maps onto HTTP methods: GET=Read, POST=Create, PUT/PATCH=Update, DELETE=Delete.",
    },
    {
      title: "Naming Conventions",
      plain: "Use plural nouns and nesting, like /users/:id/orders — never a verb in the URL.",
      technical: "REST URLs use plural resource nouns and hierarchical nesting to express ownership, never action verbs.",
    },
    {
      title: "Status Codes Matching Intent",
      plain: "200 means OK, 201 means just-created, 404 means not found — the number IS the message.",
      technical: "HTTP status codes communicate outcome class: 2xx success, 4xx client error, 5xx server error.",
    },
    {
      title: "Statelessness",
      plain: "Each request must carry everything it needs — the server remembers nothing between requests.",
      technical: "REST requires each request to be self-contained; the server holds no client session state between calls.",
    },
    {
      title: "JSON as the Body Format",
      plain: "Requests and responses both carry their data as JSON — one shared format everywhere.",
      technical: "JSON is REST's de facto standard serialization format for both request and response bodies.",
    },
    {
      title: "REST ↔ Express",
      plain: "app.get/post/put/delete in Express are literally how you implement each REST verb in code.",
      technical: "Express route methods (app.get, app.post, app.put, app.delete) directly implement REST's verb-per-resource model.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions, escalating hints, never reveals ──
  // Every object: q (question text), options (4 strings), answer (index
  // of the correct option), hints (array — hint[min(attempts-1,len-1)]
  // is shown, so the LAST hint stays visible forever past that many
  // wrong tries instead of erroring), explanation (shown only after a
  // correct answer, reinforcing WHY it's right). Per the explicit rule,
  // Quiz text is NOT compressed — full-length questions/hints/
  // explanations throughout.
  const quizQuestions = [
    {
      q: "Which of these is the more RESTful way to delete a user with id 7?",
      options: [
        "POST /deleteUser/7",
        "DELETE /users/7",
        "GET /users/7/delete",
        "POST /users/7/remove",
      ],
      answer: 1,
      hints: [
        "REST names URLs after the resource (a noun) and lets the HTTP VERB express the action — look for the option that does that.",
        "Three of these options stuff a verb (delete/remove) directly into the URL path, which REST avoids entirely.",
        "DELETE /users/7 uses the plural noun resource 'users', the id to target one row, and the HTTP verb DELETE to express the action — no verb appears in the URL itself.",
      ],
      explanation: "REST keeps URLs as nouns (resources) and lets the HTTP verb carry the action. DELETE /users/7 follows this: the verb is DELETE, the resource is /users/7 — no verb baked into the path.",
    },
    {
      q: "What does the 'C' in CRUD map to, in HTTP terms?",
      options: ["GET", "POST", "PUT", "DELETE"],
      answer: 1,
      hints: [
        "Think about which CRUD letter comes first — you need to bring something new into existence before you can read/update/delete it.",
        "Of the four HTTP verbs listed, one is specifically used to ADD a brand-new resource to a collection.",
        "POST is used to create a new resource — e.g. POST /users adds a new user.",
      ],
      explanation: "Create maps to POST. POST /users (for example) creates a brand-new user resource, typically returning a 201 Created status along with the new resource's data.",
    },
    {
      q: "A client sends GET /users/42. What is this request asking the server to do?",
      options: [
        "Create a new user with id 42",
        "Read/fetch the single user whose id is 42",
        "Delete the user with id 42",
        "Update the user with id 42",
      ],
      answer: 1,
      hints: [
        "GET is the 'safe, read-only' HTTP verb — it should never change any data on the server.",
        "The :id in the path (42) narrows the request down to exactly ONE record inside the /users collection.",
        "GET /users/42 reads (fetches) the single user with id 42, without modifying anything.",
      ],
      explanation: "GET requests fetch data without modifying it. GET /users/42 means: read the one user resource identified by id 42, and return its current data.",
    },
    {
      q: "What is the key difference between PUT /users/5 and PATCH /users/5?",
      options: [
        "PUT creates a new user, PATCH deletes one",
        "PUT typically replaces the whole resource, PATCH typically applies a partial update",
        "There is no difference — they are exact synonyms",
        "PATCH is only used for reading data",
      ],
      answer: 1,
      hints: [
        "Both PUT and PATCH update an EXISTING resource — the difference is about how MUCH of that resource gets touched.",
        "Think about updating just one field (like only the email) versus sending the entire object back to overwrite it.",
        "PUT conventionally replaces the entire resource with the new data sent; PATCH conventionally updates only the specific fields included in the request body.",
      ],
      explanation: "Both update an existing resource at the same URL, but PUT is conventionally a full replacement of the resource, while PATCH is a partial update touching only the fields provided.",
    },
    {
      q: "Which of these endpoint names follows REST naming conventions correctly?",
      options: [
        "/getAllUsers",
        "/user",
        "/users",
        "/fetchUserById",
      ],
      answer: 2,
      hints: [
        "REST endpoints should be plural NOUNS describing a collection of resources, never a verb describing an action.",
        "Three of these four either contain a verb (get/fetch) or use the singular form instead of the plural collection name.",
        "/users is a plural noun naming the whole collection — exactly what REST naming conventions call for, with the HTTP verb (GET, POST, etc.) carrying the action separately.",
      ],
      explanation: "REST favors plural noun resource names like /users, with the action expressed purely through the HTTP verb — not folded into the URL as getAllUsers or fetchUserById.",
    },
    {
      q: "What does the URL /users/12/orders represent, in REST naming conventions?",
      options: [
        "All orders in the entire system, unrelated to any one user",
        "The orders belonging specifically to the user with id 12 — a nested resource",
        "A single order with id 12",
        "A user account named 'orders'",
      ],
      answer: 1,
      hints: [
        "Nesting one resource path inside another (/users/12/...) expresses an ownership or 'belongs to' relationship.",
        "Read it left to right: first you scope down to ONE specific user (id 12), then to that user's sub-collection.",
        "/users/12/orders means: the orders sub-collection that belongs to the single user identified by id 12.",
      ],
      explanation: "Nested resource URLs express a parent-child relationship: /users/12/orders means 'the orders belonging to user 12', a common and idiomatic REST naming pattern.",
    },
    {
      q: "A server successfully creates a new resource and wants to tell the client. Which status code best matches that intent?",
      options: ["200", "201", "204", "400"],
      answer: 1,
      hints: [
        "200 is a generic 'OK, success' — but there's a MORE SPECIFIC code reserved just for successful creation.",
        "Look for the code whose number itself hints at something brand-new coming into existence.",
        "201 Created is the status code specifically meant for 'a new resource was successfully created' — typically returned by a successful POST.",
      ],
      explanation: "201 Created specifically signals that a new resource now exists as a result of the request — more precise than the generic 200 OK, and the conventional response for a successful POST.",
    },
    {
      q: "A client requests GET /users/999 but no user with id 999 exists. What status code should the server respond with?",
      options: ["200", "201", "404", "500"],
      answer: 2,
      hints: [
        "This is a problem with what the CLIENT asked for (a nonexistent id), not a problem inside the server's own code — so it belongs in the 4xx client-error range.",
        "There's one very well-known status code specifically for 'the thing you asked for does not exist'.",
        "404 Not Found is the standard response when the requested resource simply doesn't exist.",
      ],
      explanation: "404 Not Found means the server understood the request but couldn't find a resource matching it — exactly the case when a requested id doesn't exist.",
    },
    {
      q: "Which status code range generally indicates a problem caused by the CLIENT's request itself (e.g. bad input), rather than a server-side failure?",
      options: ["1xx", "2xx", "4xx", "5xx"],
      answer: 2,
      hints: [
        "There are two 'error' ranges in HTTP status codes — one points the blame at the client, the other at the server.",
        "Codes like 400 (Bad Request) and 404 (Not Found) both fall into the SAME hundred-range.",
        "4xx codes (400, 404, etc.) indicate the client's request was malformed or invalid in some way; 5xx codes indicate the server itself failed.",
      ],
      explanation: "4xx status codes signal a client-side problem — invalid input, a missing resource, unauthorized access, etc. 5xx codes, by contrast, mean the server itself encountered an error.",
    },
    {
      q: "What does it mean for a REST API to be 'stateless'?",
      options: [
        "The server remembers every previous request a client has made",
        "Each request must contain everything the server needs to process it, with no memory of past requests kept on the server",
        "The API has no state at all, including no database",
        "Stateless means the API never returns any data",
      ],
      answer: 1,
      hints: [
        "Statelessness is about what the SERVER remembers between separate requests, not about whether data exists at all.",
        "If the server forgot who you were after every single request, what would EACH new request need to include on its own?",
        "Statelessness means every request is self-contained — it carries its own full context (e.g. an auth token), so the server never has to recall anything from a prior request.",
      ],
      explanation: "Statelessness means the server treats every request independently — nothing about a previous request is remembered. Each request must include everything required to handle it (such as an auth token), making the server easier to scale and reason about.",
    },
    {
      q: "Why does statelessness make a REST API easier to scale across multiple servers?",
      options: [
        "Because stateless servers use less electricity",
        "Because any server can handle any request without needing shared memory of a specific client's history",
        "Because stateless APIs never need a database",
        "Statelessness has no real connection to scaling",
      ],
      answer: 1,
      hints: [
        "If a server doesn't need to remember anything client-specific between requests, does it matter WHICH server in a cluster handles the next request from that same client?",
        "Think about load balancers distributing requests across many identical servers — what would make that simple to do safely?",
        "Because no server needs to retain client-specific memory, any server in a pool can handle any incoming request, which is exactly what makes horizontal scaling and load balancing straightforward.",
      ],
      explanation: "Since no individual server needs to remember a particular client's history, requests can be routed to ANY available server in a pool — which is precisely what makes stateless APIs simple to scale horizontally with load balancers.",
    },
    {
      q: "An Express route is written as app.put(\"/users/:id\", (req, res) => { ... }). Which REST operation does this implement?",
      options: [
        "Create a new user",
        "Read a single user",
        "Update an existing user identified by :id",
        "Delete a user",
      ],
      answer: 2,
      hints: [
        "Match the Express method name directly to its corresponding HTTP verb — they're spelled the same way on purpose.",
        "PUT is the HTTP verb conventionally used to replace/update an EXISTING resource at a specific URL, not to create a brand-new one.",
        "app.put(\"/users/:id\", ...) handles HTTP PUT requests to that path — implementing the Update operation on the existing user identified by :id.",
      ],
      explanation: "Express's app.put(...) directly implements handling for HTTP PUT requests. Combined with a path containing :id, this is exactly how you implement 'Update an existing resource' in an Express REST API — mirroring the CRUD→HTTP→Express chain taught in this unit.",
    },
  ];

  // ── LOOPING ANIMATION FRAME EFFECT ───────────────────────────────────────
  // This effect only runs (sets up its interval) while the student is on
  // Build (stage 1) or See It (stage 2) — those are the only two stages
  // that render a ConceptAnimation. It increments animFrame every 100ms,
  // wrapping at 60 so the animations loop smoothly forever rather than
  // growing an ever-larger number. The cleanup function (the returned
  // arrow function) clears the interval whenever `stage` changes or the
  // component unmounts, so we never leak a background timer once the
  // student moves to Try It/Challenge/Quiz where no animation is shown.
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It steps ────────────────────────────────────────────────
  // Five steps, each a complete request/response pair against a /tasks
  // resource — GET collection, GET one, POST (create), PUT (update),
  // DELETE. `req` is shown in the request code box (verb+path+body),
  // `status`/`resBody` are shown in the response box, `plain`/`tech` are
  // the one-line explanation underneath (kept short per the visual-
  // density directive — the request/response boxes carry the teaching).
  const seeitSteps = [
    {
      plain: "GET /tasks reads the WHOLE collection — nothing is sent in the body.",
      tech: "GET requests carry no body; the server returns the full /tasks array.",
      req: "GET /tasks",
      status: "200 OK",
      statusColor: "#4ade80",
      resBody: '[\n  { "id": 1, "title": "Buy groceries", "done": false },\n  { "id": 2, "title": "Finish assignment", "done": false }\n]',
    },
    {
      plain: "GET /tasks/1 narrows it down to exactly ONE task by id.",
      tech: "The :id path segment targets a single resource within the collection.",
      req: "GET /tasks/1",
      status: "200 OK",
      statusColor: "#4ade80",
      resBody: '{ "id": 1, "title": "Buy groceries", "done": false }',
    },
    {
      plain: "POST /tasks creates a new task — the body carries its data, 201 confirms creation.",
      tech: "POST's request body supplies the new resource's fields; 201 Created signals success.",
      req: 'POST /tasks\nBody: { "title": "Walk the dog" }',
      status: "201 Created",
      statusColor: "#38bdf8",
      resBody: '{ "id": 3, "title": "Walk the dog", "done": false }',
    },
    {
      plain: "PUT /tasks/1 updates that exact task — body carries the new values.",
      tech: "PUT's body replaces the targeted resource's fields at that same URL.",
      req: 'PUT /tasks/1\nBody: { "done": true }',
      status: "200 OK",
      statusColor: "#4ade80",
      resBody: '{ "id": 1, "title": "Buy groceries", "done": true }',
    },
    {
      plain: "DELETE /tasks/2 removes that task — 204 means success with no body to return.",
      tech: "204 No Content confirms deletion succeeded without sending any response payload.",
      req: "DELETE /tasks/2",
      status: "204 No Content",
      statusColor: "#fb923c",
      resBody: "(empty — nothing to return)",
    },
  ];

  // ── shared style object — copied field-for-field from Unit4_5.jsx /
  // Unit6_1.jsx so every screen in this lesson visually matches every
  // other lesson in the course (same dark navy background, same card
  // radius/border, same button colors, etc). Nothing here is unit-
  // specific content — it's pure presentation, reused verbatim.
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8, maxWidth: 760, margin: "0 auto", width: "100%" },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
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
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.84rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  // Labels for the six sticky top-bar pills — index lines up 1:1 with
  // the `stage` integer, so s.pill(stage===i, stage>i) below lights up
  // the current stage and checkmarks every stage already passed.
  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK RENDERER ────────────────────────────────────────────────────────
  // Shows the curiosity question BEFORE any teaching. The student must
  // tap one of four guess-pills (stored in sparkGuess) before Submit is
  // enabled; after submitting, the picker is replaced by the reveal box
  // that shows the real answer and a one-line explanation, then a
  // button that advances stage to 1 (Build) — this is the ONLY way
  // stage advances out of Spark, so the student can't skip ahead
  // without at least making a guess and seeing the reveal. Kept visual
  // (two competing code-style endpoint pills) rather than a wall of
  // prose, per the visual-density directive.
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🌐</div>
        <div style={s.h2}>Which is more RESTful?</div>
      </div>

      {/* Two competing endpoint designs shown side by side as code, so
          the student visually compares them before guessing — no prose
          needed to set up the question. */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
        <div style={{ ...s.codeBox, flex: "1 1 220px", textAlign: "center", margin: 0 }}>POST /deleteUser/7</div>
        <div style={{ ...s.codeBox, flex: "1 1 220px", textAlign: "center", margin: 0 }}>DELETE /users/7</div>
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "POST /deleteUser/7 — verb is clearer in the URL",
              "DELETE /users/7 — verb belongs in HTTP, not the URL",
              "Both are equally RESTful",
              "Neither is RESTful",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          {/* Submit disabled until sparkGuess is non-null — forces a
              real choice before moving on (Rule 8: active doing, not
              passive reading, at every stage). */}
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>winner</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>DELETE /users/7</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "DELETE /users/7 — verb belongs in HTTP, not the URL" ? "🎯 Exactly right!" : "Not quite — DELETE /users/7 wins."}
          </div>
          <div style={s.line}>/users/7 names a resource (noun); DELETE — the HTTP verb — expresses the action.</div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD RENDERER ────────────────────────────────────────────────────────
  // Renders the horizontally-scrollable concept-picker strip across the
  // top (one pill per entry in `concepts`, tapping one jumps straight
  // to that concept and resets buildMode back to "plain"), then the
  // active concept's card: title, ConceptAnimation visual (keyed by
  // buildConcept so it swaps instantly), the Plain/Technical toggle,
  // the matching ONE-SENTENCE text blurb, and a Next button that either
  // advances to the next concept or — on the last concept — advances
  // stage to 2 (See It) instead.
  const renderBuild = () => {
    // nextTitle is computed just to label the Next button helpfully
    // ("Next: Status Codes →") instead of a generic "Next →" — null
    // once we're on the final concept, which is how we know to render
    // the "I've got it!" stage-advancing button instead.
    const nextTitle = buildConcept < concepts.length - 1
      ? concepts[buildConcept + 1].title.split("—")[0].trim()
      : null;
    return (
      <div>
        {/* Concept-picker strip: lets the student jump to ANY concept in
            any order, not just linearly — overflowX auto + flexShrink:0
            on each pill keeps this usable on a narrow phone screen by
            letting it scroll horizontally instead of wrapping/overflowing. */}
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
          {/* ConceptAnimation is a separate function component declared
              below, OUTSIDE Unit6_2 — it receives just the concept index
              and the shared animFrame tick, and internally switches on
              `index` to draw the right little animated diagram. This is
              where the bulk of the teaching lives per the visual-density
              directive — multi-part, frame-driven motion, not a static box. */}
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
            {nextTitle
              ? <button style={s.btn()} onClick={() => { setBuildConcept(buildConcept + 1); setBuildMode("plain"); }}>Next: {nextTitle} →</button>
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
            <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── SEE IT RENDERER ───────────────────────────────────────────────────────
  // Walks the student through `seeitSteps` one at a time: shows the
  // current step's REQUEST (verb+path+body) in one code box, an arrow,
  // then the matching RESPONSE (status pill + body) in a second box,
  // then a single-sentence explanation underneath (toggle shared across
  // all 5 steps via seeitMode). Back/Next buttons move seeitStep up or
  // down by one; on the final step the Next button instead advances
  // stage to 3 (Try It).
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Request In, Response Out</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        {/* REQUEST box — the verb+path+body the client sends. */}
        <div style={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 700, marginBottom: 4 }}>REQUEST</div>
        <div style={s.codeBox}>{step.req}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0", fontSize: "1.2rem", color: "#475569" }}>↓</div>
        {/* RESPONSE box — status pill (color-coded by outcome class) plus body. */}
        <div style={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 700, marginBottom: 4 }}>RESPONSE</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <span style={s.tag(step.statusColor)}>{step.status}</span>
        </div>
        <div style={s.codeBox}>{step.resBody}</div>
        <div style={{ ...s.line, color: "#e2e8f0", textAlign: "center", marginTop: 10 }}>{seeitMode === "plain" ? step.plain : step.tech}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
          {seeitStep < seeitSteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
          {/* Back button only appears once there's actually somewhere to
              go back to — keeps step 0 from showing a useless disabled
              button. */}
          {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
        </div>
      </div>
    );
  };

  // ── TRY IT RENDERER ───────────────────────────────────────────────────────
  // The student clicks one of five preset REST requests, each of which
  // mutates the REAL tryTasks state where appropriate (POST/PUT/DELETE)
  // and always produces a real status+body shown in the response panel
  // — not a canned animation. Each distinct preset clicked for the
  // FIRST time increments triedCount (tracked via triedPresets so
  // re-clicking the SAME preset repeatedly doesn't inflate the counter
  // — the course rule is 3+ DISTINCT tries before Next unlocks).
  const renderTryIt = () => {
    // markTried bumps triedCount by exactly 1 the first time a given
    // preset key is used, and is a no-op on every subsequent use of
    // that same preset — this is what makes triedCount represent "how
    // many distinct presets tried" not "how many clicks total".
    function markTried(key) {
      if (!triedPresets[key]) {
        setTriedPresets((prev) => ({ ...prev, [key]: true }));
        setTriedCount((c) => c + 1);
      }
    }

    // doGetAll: simulates GET /tasks — read-only, returns the full
    // current tryTasks array as the response body, status 200.
    function doGetAll() {
      setLastRequest("GET /tasks");
      setLastResponse({ status: "200 OK", color: "#4ade80", body: JSON.stringify(tryTasks, null, 2) });
      markTried("getAll");
    }

    // doGetOne: simulates GET /tasks/3 — read-only, finds task id=3 and
    // returns just that one object, or a 404 body if it doesn't exist
    // (demonstrating that status codes track real outcomes, not just
    // "always success").
    function doGetOne() {
      const found = tryTasks.find((t) => t.id === 3);
      setLastRequest("GET /tasks/3");
      if (found) {
        setLastResponse({ status: "200 OK", color: "#4ade80", body: JSON.stringify(found, null, 2) });
      } else {
        setLastResponse({ status: "404 Not Found", color: "#ef4444", body: '{ "error": "Task 3 not found" }' });
      }
      markTried("getOne");
    }

    // doPost: simulates POST /tasks with a body — creates a brand-new
    // task with a fresh unique id (one higher than the current max),
    // mutating tryTasks for real, and responds 201 Created with the
    // new task's full data.
    function doPost() {
      const nextId = tryTasks.length ? Math.max(...tryTasks.map((t) => t.id)) + 1 : 1;
      const newTask = { id: nextId, title: "Walk the dog", done: false };
      setTryTasks((tasks) => [...tasks, newTask]);
      setLastRequest('POST /tasks\nBody: { "title": "Walk the dog" }');
      setLastResponse({ status: "201 Created", color: "#38bdf8", body: JSON.stringify(newTask, null, 2) });
      markTried("post");
    }

    // doPut: simulates PUT /tasks/3 — flips task id=3's `done` flag,
    // mutating that ONE row in place (same primary key, new data),
    // responding 200 OK with the updated object, or 404 if it was
    // already deleted by an earlier DELETE click in this same session.
    function doPut() {
      const exists = tryTasks.some((t) => t.id === 3);
      setLastRequest('PUT /tasks/3\nBody: { "done": true }');
      if (exists) {
        let updated;
        setTryTasks((tasks) => tasks.map((t) => {
          if (t.id === 3) { updated = { ...t, done: true }; return updated; }
          return t;
        }));
        setLastResponse({ status: "200 OK", color: "#4ade80", body: JSON.stringify({ id: 3, title: "Read chapter 6", done: true }, null, 2) });
      } else {
        setLastResponse({ status: "404 Not Found", color: "#ef4444", body: '{ "error": "Task 3 not found" }' });
      }
      markTried("put");
    }

    // doDelete: simulates DELETE /tasks/3 — removes that row entirely
    // from tryTasks, responding 204 No Content with an empty body (or
    // 404 if it's already gone from a previous click), demonstrating
    // that Delete removes a whole resource by its identifying key.
    function doDelete() {
      const exists = tryTasks.some((t) => t.id === 3);
      setLastRequest("DELETE /tasks/3");
      if (exists) {
        setTryTasks((tasks) => tasks.filter((t) => t.id !== 3));
        setLastResponse({ status: "204 No Content", color: "#fb923c", body: "(empty — nothing to return)" });
      } else {
        setLastResponse({ status: "404 Not Found", color: "#ef4444", body: '{ "error": "Task 3 not found" }' });
      }
      markTried("delete");
    }

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Fire Real Requests at /tasks</div>
        <div style={{ ...s.p, marginBottom: 14 }}>Tap a preset request below.</div>

        {/* Five preset request buttons — color-neutral (blue) since,
            unlike Unit6_1's CRUD buttons, the color-coding for THIS
            lesson lives on the STATUS pill in the response, not the
            request buttons (keeps the verb itself the visual focus). */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button style={s.btn("#38bdf8")} onClick={doGetAll}>GET /tasks</button>
          <button style={s.btn("#38bdf8")} onClick={doGetOne}>GET /tasks/3</button>
          <button style={s.btn("#4ade80")} onClick={doPost}>POST /tasks</button>
          <button style={s.btn("#fb923c")} onClick={doPut}>PUT /tasks/3</button>
          <button style={s.btn("#ef4444")} onClick={doDelete}>DELETE /tasks/3</button>
        </div>

        {/* Request/response panel — re-renders automatically whenever
            lastRequest/lastResponse change, since React re-runs this
            render function on every state change. */}
        {lastRequest && (
          <>
            <div style={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 700, marginBottom: 4 }}>REQUEST</div>
            <div style={s.codeBox}>{lastRequest}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "8px 0", fontSize: "1.1rem", color: "#475569" }}>↓</div>
            <div style={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 700, marginBottom: 4 }}>RESPONSE</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <span style={s.tag(lastResponse.color)}>{lastResponse.status}</span>
            </div>
            <div style={s.codeBox}>{lastResponse.body}</div>
          </>
        )}

        {/* Gate: Next only unlocks once 3+ DISTINCT presets have been
            tried — encourages exploring multiple verbs rather than
            spamming one button three times. */}
        <div style={{ marginTop: 14 }}>
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 different requests to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE CONTENT ─────────────────────────────────────────────────────
  // ch1Pairs feeds the TagMatch verb/status-code minigame: each pair's
  // `code` is the term shown on the left column (an HTTP verb or status
  // code), `meaning` is its correct definition (shuffled into the right
  // column by TagMatch itself), and `hint` is shown immediately if the
  // student taps a WRONG meaning for that term.
  const ch1Pairs = [
    { code: "GET", meaning: "Read/fetch a resource without changing anything", hint: "This is the 'safe, read-only' verb — it should never modify data." },
    { code: "POST", meaning: "Create a brand-new resource in a collection", hint: "Think about which verb you'd use to add something that doesn't exist yet." },
    { code: "PUT", meaning: "Replace/update an existing resource at its URL", hint: "This verb targets a resource that ALREADY exists, not a new one." },
    { code: "DELETE", meaning: "Remove an existing resource entirely", hint: "The name is the strongest hint here — what does this verb literally do?" },
    { code: "200", meaning: "Generic success — the request worked", hint: "This is the most common 'everything is fine' status code." },
    { code: "201", meaning: "Success, AND a brand-new resource was just created", hint: "This is more specific than a generic success — something NEW now exists." },
    { code: "404", meaning: "The requested resource does not exist", hint: "This is the classic 'page/resource not found' code." },
  ];

  // bugLines feeds the BugHunt minigame: an array of endpoint definitions
  // shown as tappable lines, where exactly one has buggy:true (a verb
  // baked into the URL instead of expressed via the HTTP method) and
  // the rest are well-designed REST endpoints. bugHints escalate with
  // each wrong tap.
  const bugLines = [
    { text: "GET /users", buggy: false },
    { text: "POST /users", buggy: false },
    { text: "POST /getAllUsers", buggy: true, why: "This endpoint stuffs the verb 'get' AND 'All' into the URL itself, duplicating what the HTTP method should already express. A well-designed REST endpoint would just be GET /users — the verb GET already says 'read', so the URL only needs to name the resource." },
    { text: "DELETE /users/9", buggy: false },
  ];
  const bugHints = [
    "Three of these four endpoints are well-designed REST — one repeats an action verb INSIDE the URL path itself.",
    "Look closely at the path text, not just the HTTP method shown before it — one path contains words like 'get' or 'All' that don't belong in a REST URL.",
    "Tap POST /getAllUsers — the URL itself contains a verb ('get'), which REST naming conventions say should never happen; the action belongs in the HTTP method alone.",
  ];

  // ── CHALLENGE RENDERER ────────────────────────────────────────────────────
  // challengePhase 0 shows the TagMatch verb/status-code game; once its
  // onDone fires (ch1Done becomes true) a "Next Challenge" button
  // appears that flips challengePhase to 1, which shows the BugHunt
  // bad-endpoint-naming game; once ITS onDone fires (ch2Done becomes
  // true) a "Final Quiz" button appears that advances stage to 5.
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Match Verb/Code → Meaning</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Spot the Badly-Designed Endpoint</div>
          <div style={{ ...s.line, marginBottom: 14 }}>One of these breaks REST naming rules. Tap it.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ── QUIZ RENDERER ─────────────────────────────────────────────────────────
  // If quizDone is true, shows the UNIT-level completion screen (NOT a
  // module-complete screen — Module 6 still has Unit6_3 left — so the
  // copy explicitly points the student at "Connecting Node to a DB"
  // next instead of claiming the whole module is finished). The single
  // button here is the ONLY call to onUnitComplete() in this entire
  // file, fired directly from a real onClick — satisfying the hard rule
  // that it must never auto-fire from an effect.
  //
  // Otherwise, renders the current question (quizQuestions[quizQ]):
  // the question text, its four tappable options (colored via
  // s.quizOption based on selection/correct/wrong state), an escalating
  // hint box on a wrong answer (hintIndex clamps so the LAST hint stays
  // shown forever past that many wrong attempts rather than erroring
  // out of bounds), and an explanation box plus "Next Question"/"Finish
  // Quiz" button once answered correctly.
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 12 }}>🏆</div>
          <div style={s.h2}>Unit 6.2 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You've finished "REST API Design" — second unit of Module 6: Databases & APIs. Next up: Unit 6.3, Connecting Node to a DB.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "REST names resources as nouns; the HTTP verb carries the action",
              "CRUD → HTTP mapping: GET/POST/PUT-PATCH/DELETE",
              "Naming conventions: plural nouns, nesting, no verbs in URLs",
              "Status codes matching intent: 200, 201, 204, 400, 404, 500",
              "Statelessness — each request is self-contained",
              "JSON as the standard request/response body format",
              "How REST verbs map directly onto Express's app.get/post/put/delete",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* The ONE and only onUnitComplete() call in this file — fired
              directly from this button's onClick, never from an effect. */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue to Unit 6.3 →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
    // hintIndex clamps quizAttempts-1 into the valid range of q.hints so
    // that after the hints array is exhausted, the LAST hint just keeps
    // re-showing instead of throwing an out-of-bounds error.
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
            // Options stay clickable while feedback is null or "wrong"
            // (so the student can change their pick and retry) but lock
            // once feedback is "correct", since the question is done.
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
            // Check Answer is disabled until an option is actually
            // selected. On a correct pick, feedback flips to "correct"
            // (revealing the explanation box). On a wrong pick, attempts
            // increments (driving the next-shown hint) and the
            // selection is cleared so the student must actively pick
            // again rather than just re-clicking Check on the same
            // wrong option.
            <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
              if (quizSelected === q.answer) { setQuizFeedback("correct"); }
              else { setQuizAttempts((a) => a + 1); setQuizFeedback("wrong"); setQuizSelected(null); }
            }}>Check Answer</button>
          )}
          {quizFeedback === "correct" && (
            // Advances to the next question (resetting selected/feedback/
            // attempts for the fresh question) or, on the final question,
            // flips quizDone to true — which swaps this whole renderer
            // over to the completion screen above on the NEXT render.
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
  // Renders the sticky top bar (unit title + the six stage pills, which
  // are purely a progress READOUT here — clicking them does nothing,
  // they're not buttons, only `stage` state drives what's visible
  // below), then conditionally renders exactly one of the six stage
  // renderers based on the current `stage` value. Note: App.jsx already
  // overlays its own floating "← Dashboard" control above every lesson
  // it renders, so this file deliberately does not add a second one.
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 6.2 — REST API Design</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
      </div>
      {/* Welcome line only shows on the Spark screen (stage 0) — a small
          personal touch using student?.name, with a safe fallback to
          "Student" if the prop wasn't passed a name for any reason. */}
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
      {/* Tiny extra media query for the very smallest phones — shrinks
          the top-bar title further if it would otherwise crowd the
          stage pills off the edge of a narrow screen. */}
      <style>{`
        @media (max-width: 420px) {
          .unit-topbar-title { font-size: 0.74rem !important; }
        }
      `}</style>
    </div>
  );
}

// ── CONCEPT ANIMATIONS — one illustration per Build-stage concept ─────────
// A standalone function component (NOT inside Unit6_2, so it doesn't
// re-declare itself every render and doesn't need its own hooks) that
// receives just `index` (which of the 7 Build concepts is active) and
// `frame` (the shared animFrame counter ticking every 100ms while on
// Build/See It). It derives a normalized 0..1 "pos" progress value from
// frame and switches on `index` to draw the appropriate tiny animated
// diagram using plain styled divs (no SVG/canvas needed at this scale).
// Per the visual-density directive, EVERY one of these has multiple
// moving/state-changing parts, not a single static label.
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — REST = resources, not verbs: a bad verb-style URL crossed out,
  // a good noun-style URL glowing in, alternating back and forth.
  if (index === 0) {
    const showGood = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <div style={{
            fontFamily: "monospace", fontSize: "0.7rem", padding: "6px 10px", borderRadius: 6,
            color: showGood ? "#475569" : "#ef4444",
            border: showGood ? "1px dashed #334155" : "2px solid #ef4444",
            textDecoration: showGood ? "line-through" : "none", opacity: showGood ? 0.4 : 1,
          }}>/getUser ❌</div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>↓</div>
          <div style={{
            fontFamily: "monospace", fontSize: "0.7rem", padding: "6px 10px", borderRadius: 6,
            color: showGood ? "#4ade80" : "#475569",
            border: showGood ? "2px solid #4ade80" : "1px dashed #334155",
            opacity: showGood ? 1 : 0.4,
          }}>/users ✅</div>
        </div>
      </div>
    );
  }

  // 1 — CRUD → HTTP mapping: four verb badges cycling highlight, each
  // paired with its matching CRUD letter underneath, lighting in sync.
  if (index === 1) {
    const activeOp = Math.floor(pos * 4) % 4;
    const ops = [
      { verb: "GET", letter: "Read", c: "#38bdf8" },
      { verb: "POST", letter: "Create", c: "#4ade80" },
      { verb: "PUT", letter: "Update", c: "#fb923c" },
      { verb: "DELETE", letter: "Delete", c: "#ef4444" },
    ];
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {ops.map((o, i) => (
            <div key={o.verb} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "monospace", fontWeight: 800, fontSize: "0.62rem", padding: "5px 8px", borderRadius: 6, marginBottom: 4,
                background: activeOp === i ? o.c + "33" : "#1e293b",
                border: activeOp === i ? `2px solid ${o.c}` : "1px solid #334155",
                color: activeOp === i ? o.c : "#64748b",
              }}>{o.verb}</div>
              <div style={{ fontSize: "0.56rem", color: activeOp === i ? o.c : "#475569" }}>{o.letter}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2 — Naming conventions: a URL typing itself out character by
  // character, building /users/:id/orders piece by piece.
  if (index === 2) {
    const full = "/users/:id/orders";
    const chars = Math.max(1, Math.floor(pos * (full.length + 6)));
    const shown = full.slice(0, Math.min(chars, full.length));
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#4ade80", minHeight: "1.2em" }}>{shown}<span style={{ opacity: chars < full.length ? 1 : 0, color: "#94a3b8" }}>▌</span></div>
          <div style={{ fontSize: "0.58rem", color: "#64748b" }}>plural noun → id → nested collection</div>
        </div>
      </div>
    );
  }

  // 3 — Status codes: a traffic-light style stack of three lamps (2xx
  // green, 4xx amber, 5xx red) cycling which one is lit, with its code.
  if (index === 3) {
    const lit = Math.floor(pos * 3) % 3;
    const lamps = [
      { code: "200", c: "#4ade80" },
      { code: "404", c: "#fb923c" },
      { code: "500", c: "#ef4444" },
    ];
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {lamps.map((l, i) => (
            <div key={l.code} style={{
              width: 60, padding: "4px 0", borderRadius: 6, textAlign: "center", fontFamily: "monospace", fontWeight: 800, fontSize: "0.7rem",
              background: lit === i ? l.c + "33" : "#1e293b",
              border: lit === i ? `2px solid ${l.c}` : "1px solid #334155",
              color: lit === i ? l.c : "#64748b",
            }}>{l.code}</div>
          ))}
        </div>
      </div>
    );
  }

  // 4 — Statelessness: two separate request packets traveling to the
  // server, neither one leaving any "memory" trail behind on arrival.
  if (index === 4) {
    const reqA = pos < 0.5 ? pos * 2 : 1;
    const reqB = pos >= 0.5 ? (pos - 0.5) * 2 : 0;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: "80%", justifyContent: "center" }}>
            <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>client</span>
            <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: `${reqA * 90}%`, top: -4, fontSize: "0.7rem" }}>📦</div>
            </div>
            <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>server</span>
          </div>
          <div style={{ fontSize: "0.56rem", color: "#475569" }}>no memory kept between requests</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: "80%", justifyContent: "center" }}>
            <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>client</span>
            <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: `${reqB * 90}%`, top: -4, fontSize: "0.7rem" }}>📦</div>
            </div>
            <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>server</span>
          </div>
        </div>
      </div>
    );
  }

  // 5 — JSON bodies: curly braces pulsing on both the request side and
  // response side, showing the SAME format flowing both directions.
  if (index === 5) {
    const pulse = Math.floor(pos * 3) % 3 === 1;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            fontFamily: "monospace", fontSize: "0.6rem", padding: "8px 10px", borderRadius: 8, whiteSpace: "pre",
            color: pulse ? "#a78bfa" : "#94a3b8", border: pulse ? "1px solid #a78bfa66" : "1px solid #334155",
          }}>{`{ "title": "..." }`}</div>
          <div style={{ fontSize: "0.9rem", color: "#475569" }}>⇄</div>
          <div style={{
            fontFamily: "monospace", fontSize: "0.6rem", padding: "8px 10px", borderRadius: 8, whiteSpace: "pre",
            color: !pulse ? "#a78bfa" : "#94a3b8", border: !pulse ? "1px solid #a78bfa66" : "1px solid #334155",
          }}>{`{ "id": 3, ... }`}</div>
        </div>
      </div>
    );
  }

  // 6 — REST ↔ Express: a REST verb morphing visually into its matching
  // Express route method call, cycling through all four verbs in turn.
  const activeOp = Math.floor(pos * 4) % 4;
  const pairs = [
    { verb: "GET", code: 'app.get("/users", ...)', c: "#38bdf8" },
    { verb: "POST", code: 'app.post("/users", ...)', c: "#4ade80" },
    { verb: "PUT", code: 'app.put("/users/:id", ...)', c: "#fb923c" },
    { verb: "DELETE", code: 'app.delete("/users/:id", ...)', c: "#ef4444" },
  ];
  const active = pairs[activeOp];
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          fontFamily: "monospace", fontWeight: 800, fontSize: "0.7rem", padding: "6px 10px", borderRadius: 6,
          color: active.c, border: `2px solid ${active.c}`,
        }}>{active.verb}</div>
        {arrow}
        <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: active.c }}>{active.code}</div>
      </div>
    </div>
  );
}

// ── TAG MATCH — wrong tap shows that pair's hint immediately ───────────────
// Reused mechanic from Unit4_5.jsx/Unit6_1.jsx, unchanged: the student
// taps a term in the left column, then a meaning in the right column. A
// correct match locks both in green; a wrong match flashes red briefly
// and shows that pair's specific hint. onDone() fires once every pair
// is matched, which is what reveals the "Next Challenge" button in
// renderChallenge() above.
function TagMatch({ pairs, onDone }) {
  // matched: object mapping each matched term's `code` to its `meaning`
  // once correctly paired — used both to render the ✅ state and to
  // know when ALL pairs are done (Object.keys(matched).length === pairs.length).
  const [matched, setMatched] = useState({});
  // selected: tracks whichever single tile (a term OR a meaning) was
  // tapped most recently, so the NEXT tap on the opposite column can be
  // compared against it.
  const [selected, setSelected] = useState(null);
  // flashWrong: which meaning tile to briefly flash red on a wrong tap.
  const [flashWrong, setFlashWrong] = useState(null);
  // hintMsg: the explanatory message shown under the columns after a
  // wrong tap (cleared again on the next correct match or new term tap).
  const [hintMsg, setHintMsg] = useState(null);
  // shuffledMeanings: the right column's display order, shuffled ONCE
  // via useRef (not re-shuffled every render) so meanings don't line up
  // suspiciously with their terms by position.
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
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>VERB / CODE</div>
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
// Reused mechanic from Unit4_5.jsx/Unit6_1.jsx, unchanged: the student
// taps any one of `lines`; tapping the single line flagged buggy:true
// reveals it (green, with its `why` explanation) and calls onDone();
// tapping any other line briefly flashes red and shows the NEXT
// escalating hint from `hints` (clamped so the last hint just repeats
// once exhausted).
function BugHunt({ lines, hints, onDone }) {
  // revealed: true once the student has correctly found the buggy line —
  // locks all lines from further taps and shows the "Found it!" box.
  const [revealed, setRevealed] = useState(false);
  // wrongTap: index of whichever line was just incorrectly tapped, used
  // purely to flash that one line red for 600ms.
  const [wrongTap, setWrongTap] = useState(null);
  // wrongAttempts: total count of incorrect taps so far — drives which
  // escalating hint string to display next.
  const [wrongAttempts, setWrongAttempts] = useState(0);

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
