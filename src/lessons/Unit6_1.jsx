// ============================================================================
//  UNIT 6.1 — "What Is a Database?"
//  Module: M6 — Databases & APIs (FIRST of three units in this module —
//  Unit6_2 will cover REST API Design, Unit6_3 will cover Connecting
//  Node to a DB. This unit does NOT claim module completion — only its
//  own unit is finished when the student reaches the end.)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - This file lives at src/lessons/Unit6_1.jsx. It is loaded by
//    src/shell/App.jsx the exact same way every other lesson in this
//    course is loaded: App.jsx reads the course map in
//    config/course.config.js, finds the entry whose id is "Unit6_1",
//    dynamically renders <Unit6_1 student={...} onUnitComplete={...} />
//    inside its lesson-viewport area, and then just WAITS — it does not
//    poll or guess when the student is done. The only signal App.jsx
//    listens for is a single call to the onUnitComplete() function it
//    handed us as a prop. When that call happens, App.jsx marks this
//    unit as complete (probably writing to local/cloud progress state
//    elsewhere in the shell — NOT in this file) and routes the student
//    back to the Dashboard or on to Unit6_2.
//  - Because of that contract, THIS file must never import api.js or
//    config/gas.config.js — this lesson is a pure, self-contained React
//    component. It has zero network awareness. Saving progress, talking
//    to Google Apps Script, etc. are App.jsx's job, not ours. We only
//    ever call the onUnitComplete prop we were given — and we call it
//    exactly once, only from a real onClick on the final Quiz screen,
//    never from a useEffect/auto-fire (see Unit1_1_template.jsx Rule 3
//    for why: an auto-firing effect inside a conditional block once
//    broke React's Rules of Hooks and silently stranded students).
//
//  HOUSE STYLE (copied verbatim in spirit from Unit4_5.jsx so every
//  lesson in this course looks and feels the same to a student flipping
//  between units):
//  - Build-stage blurbs stay short; the real teaching happens visually,
//    through the looping ConceptAnimation component (one little canvas
//    per concept, animated frame-by-frame using a shared animFrame tick).
//  - Every wrong tap in TagMatch / BugHunt immediately shows an
//    explanatory hint — nothing is ever silently "just wrong".
//  - Quiz wrong answers NEVER reveal the correct option. Instead an
//    escalating (never auto-disappearing) hint is shown, and the
//    student can keep retrying the same question.
//  - Shared style object is literally named `s` everywhere in this
//    course, reused field-for-field, so margins/colors/radii feel
//    identical lesson to lesson. We copy it here unchanged.
//
//  SIX-STAGE FLOW (same six stages every unit in this course uses,
//  controlled entirely by the single `stage` integer state variable):
//    Stage 0 SPARK     — predict why an e-commerce site's orders/accounts
//                         SURVIVE an overnight server restart, before any
//                         teaching happens. Ties back to Unit5_5's idea
//                         that a plain JS variable's data dies the moment
//                         the program stops running.
//    Stage 1 BUILD     — 7 concepts: why we need persistence/databases,
//                         relational tables (rows & columns), primary
//                         keys, relationships between tables (foreign
//                         keys), the NoSQL/document model, CRUD, and
//                         when to reach for relational vs document-style.
//    Stage 2 SEE IT    — 5 step-by-step walkthroughs: a "users" table
//                         growing row by row, the SAME data reshaped as
//                         a NoSQL/JSON document, and a CRUD operation
//                         (an Update) applied step by step to a row.
//    Stage 3 TRY IT    — the student actually clicks Create / Read /
//                         Update / Delete buttons against a small live
//                         simulated table and watches it change for real.
//    Stage 4 CHALLENGE — tag-match (vocabulary term → meaning) with
//                         hints, then a bug hunt: spot the row with a
//                         missing/duplicate primary key.
//    Stage 5 QUIZ      — 12 questions, escalating hints, completion
//                         screen is UNIT-level only (points the student
//                         at Unit6_2, does NOT claim Module 6 is done).
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
export default function Unit6_1({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ──────────────────────────────────────────────────
  // `stage` is the single source of truth for which of the six big
  // screens is currently showing. 0=Spark,1=Build,2=SeeIt,3=TryIt,
  // 4=Challenge,5=Quiz. Every "Next" button in this file just calls
  // setStage(n) to move forward — there is no separate router, App.jsx
  // doesn't know or care about this internal state, it only cares about
  // onUnitComplete() eventually firing once.
  const [stage, setStage] = useState(0);

  // ── SPARK STATE ──────────────────────────────────────────────────────────
  // sparkGuess holds which of the four guess-pills the student tapped
  // (or null if they haven't tapped one yet — used to disable the
  // Submit button until a real choice is made). sparkSubmitted flips to
  // true once they click Submit, which swaps the picker UI for the
  // reveal/explanation UI in renderSpark() below.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD STATE ──────────────────────────────────────────────────────────
  // buildConcept is an index into the `concepts` array further down —
  // it tracks which of the 7 Build-stage concepts is currently on
  // screen. buildMode is the Plain-English/Technical toggle, reset back
  // to "plain" every time the student switches concepts so they always
  // start with the friendlier explanation first.
  const [buildConcept, setBuildConcept] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT STATE ─────────────────────────────────────────────────────────
  // seeitStep walks through the `seeitSteps` array (table growing row
  // by row, then the JSON-document view, then a CRUD Update applied
  // step by step). seeitMode is its own independent Plain/Technical
  // toggle (kept separate from buildMode so leaving Build doesn't
  // silently change what the student sees in See It, and vice versa).
  const [seeitStep, setSeeitStep] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");

  // ── TRY IT STATE ─────────────────────────────────────────────────────────
  // tryRows holds the actual simulated "users" table data the student
  // is mutating live by clicking Create/Read/Update/Delete buttons —
  // this is real, visible, changing state, not a canned animation.
  // lastAction records which CRUD action was last performed (for the
  // status readout under the table). readHighlight stores which row id
  // is currently being "read" (visually highlighted) when Read is
  // clicked. triedCount counts how many DISTINCT CRUD actions the
  // student has performed — the course rule is the student must
  // perform 3+ actions before the "Next" button unlocks, so this count
  // gates that button.
  const [tryRows, setTryRows] = useState([
    { id: 1, name: "Asha", email: "asha@mail.com" },
    { id: 2, name: "Rohit", email: "rohit@mail.com" },
  ]);
  const [lastAction, setLastAction] = useState(null);
  const [readHighlight, setReadHighlight] = useState(null);
  const [triedCount, setTriedCount] = useState(0);
  const [triedActions, setTriedActions] = useState({ create: false, read: false, update: false, delete: false });

  // ── CHALLENGE STATE ──────────────────────────────────────────────────────
  // challengePhase: 0 = the TagMatch vocabulary game is showing, 1 = the
  // BugHunt missing/duplicate primary key game is showing. ch1Done/
  // ch2Done flip to true once each minigame's onDone callback fires,
  // which is what reveals each "Next Challenge"/"Final Quiz" button.
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
  // one shared counter (no per-concept timers needed).
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: seven Build-stage concepts ──────────────────────────────────
  // Each entry feeds: (1) the concept-picker strip at the top of Build,
  // (2) the ConceptAnimation visual (matched by array INDEX, 0-6, in
  // the ConceptAnimation function defined below the component), and
  // (3) the plain/technical text blurb shown under the animation.
  const concepts = [
    {
      title: "Why We Need Databases",
      plain: "Restart the server and a plain variable's data vanishes — a database survives it.",
      technical: "In-memory data dies with the process; a database persists to durable disk storage.",
    },
    {
      title: "Relational Tables — Rows & Columns",
      plain: "Like a spreadsheet: each row is one record, each column one fact about it.",
      technical: "A relational table enforces a fixed schema of typed columns shared by every row.",
    },
    {
      title: "Primary Keys",
      plain: "A primary key uniquely IDs one row, so updates/deletes never get confused.",
      technical: "A primary key is a unique, non-null column used to unambiguously target one row.",
    },
    {
      title: "Relationships Between Tables",
      plain: "Orders just store a customer's id instead of repeating all their details.",
      technical: "A foreign key references another table's primary key, linking data without duplication.",
    },
    {
      title: "NoSQL / Document Databases",
      plain: "Document databases store flexible JSON-like records instead of fixed tables.",
      technical: "Document stores hold schema-less JSON/BSON records that can vary per document.",
    },
    {
      title: "CRUD — The Four Basic Operations",
      plain: "Every app boils down to four moves: Create, Read, Update, Delete.",
      technical: "CRUD maps to SQL's INSERT, SELECT, UPDATE, DELETE operations.",
    },
    {
      title: "Relational vs NoSQL — Which One, When?",
      plain: "Rigid, relationship-heavy data → relational. Flexible, changing data → NoSQL.",
      technical: "Relational favors structure/joins; document stores favor flexible, evolving shapes.",
    },
  ];

  // ── CONTENT: Quiz bank — 12 questions, escalating hints, never reveals ──
  // Every object: q (question text), options (4 strings), answer (index
  // of the correct option), hints (array — hint[min(attempts-1,len-1)]
  // is shown, so the LAST hint stays visible forever past that many
  // wrong tries instead of erroring), explanation (shown only after a
  // correct answer, reinforcing WHY it's right).
  const quizQuestions = [
    {
      q: "An e-commerce site restarts its server overnight for maintenance. Why don't all the orders and accounts disappear?",
      options: [
        "They don't actually restart anything — that would be impossible",
        "The data was saved in a database on disk, not just held in a JS variable in memory",
        "Browsers automatically back up server data",
        "Orders are emailed to the company so there's always a backup",
      ],
      answer: 1,
      hints: [
        "Think about WHERE the data physically lived while the server was running, versus where it lives now that the server stopped.",
        "A plain JS variable lives only in RAM, and RAM is cleared when a process exits — but disk storage is NOT cleared on restart.",
        "A database persists data to disk, completely independent of whether the server process restarts — that's the whole point of using one.",
      ],
      explanation: "Databases store data durably on disk, so it survives a server restart, crash, or redeploy — unlike a plain JS variable, which lives only in that process's memory and vanishes the moment the process stops.",
    },
    {
      q: "Why does a plain JavaScript variable (like let orders = []) fail as long-term storage for a real app?",
      options: [
        "JS variables can only hold numbers, not objects",
        "It only exists in the running program's memory and is lost the instant that program stops or restarts",
        "JS variables are too slow to read from",
        "Variables can only be read once",
      ],
      answer: 1,
      hints: [
        "This isn't about variable TYPES — objects and arrays work fine in JS variables while the program is running.",
        "The problem is about WHEN the data disappears, not what kind of data it is.",
        "The moment the process running that variable exits (crash, restart, redeploy), the memory holding it is reclaimed — the data is gone for good.",
      ],
      explanation: "In-memory variables are wiped the instant their process stops running. A database avoids this by saving data to disk, where it survives independently of any one running program.",
    },
    {
      q: "In a relational database table, what does each ROW represent?",
      options: [
        "One column's worth of data across every record",
        "One single record — e.g. one specific user",
        "The table's schema definition",
        "A relationship to another table",
      ],
      answer: 1,
      hints: [
        "Think of a spreadsheet: rows run left-to-right, one per entry.",
        "If the table is 'users', what would ONE row logically represent?",
        "Each row is one complete record — in a 'users' table, one row is exactly one user, with each column holding one fact about that user.",
      ],
      explanation: "A row is a single record. Every column in that row holds one specific attribute (like name or email) of that one record.",
    },
    {
      q: "What does a COLUMN represent in a relational table?",
      options: [
        "One specific record, like one customer",
        "One specific attribute/field shared across every row, like 'email'",
        "A backup copy of the table",
        "A primary key only",
      ],
      answer: 1,
      hints: [
        "Columns run top-to-bottom in a spreadsheet — the same heading applies to every row beneath it.",
        "If 'email' is a column header, every single row in that table has its own value under that same heading.",
        "A column is one field/attribute (e.g. email, name, price) that every row in the table has a value for.",
      ],
      explanation: "Columns define the table's fixed set of attributes — every row shares the same columns, just with different values in each.",
    },
    {
      q: "What is a 'fixed schema' in a relational database?",
      options: [
        "A rule that every row must have the same defined set of typed columns",
        "A single huge table that holds all the app's data",
        "A backup schedule for the database",
        "A way to encrypt the data",
      ],
      answer: 0,
      hints: [
        "Schema is about STRUCTURE — what shape every row is required to have.",
        "Think about what stays the same across EVERY row in a table, even though the values differ.",
        "A fixed schema means the table defines its columns and their types up front, and every row must conform to that same structure.",
      ],
      explanation: "A fixed schema locks in the table's column names and types ahead of time — every row must follow that same structure, which is what relational databases enforce strictly.",
    },
    {
      q: "Why does a table need a PRIMARY KEY?",
      options: [
        "To make the table look more organized",
        "To uniquely identify each row so it can be found, updated, or deleted without ambiguity",
        "To store the table's column names",
        "Primary keys are optional decoration with no real function",
      ],
      answer: 1,
      hints: [
        "Imagine two rows with literally identical name and email values, but you only want to delete ONE of them — what would let you target exactly the right one?",
        "The key word is UNIQUE — every row's primary key value must differ from every other row's.",
        "A primary key guarantees that no two rows share the same identifying value, so any single row can always be unambiguously found, updated, or deleted.",
      ],
      explanation: "Without a unique identifier, two rows with identical-looking data would be indistinguishable to an update or delete operation — the primary key removes that ambiguity completely.",
    },
    {
      q: "An 'orders' table stores a column called user_id that matches a row's id in the 'users' table. What is this an example of?",
      options: [
        "A duplicate primary key (a bug)",
        "A relationship between tables, using a foreign key reference",
        "A NoSQL document",
        "A schema-less table",
      ],
      answer: 1,
      hints: [
        "This is intentional, not a bug — it's how relational databases avoid repeating a user's full details inside every single order row.",
        "The orders table doesn't need to copy the user's name/email — it just needs to know WHICH user, by referencing that user's primary key.",
        "Storing another table's primary key value inside a column is exactly how a foreign-key relationship links two tables together.",
      ],
      explanation: "This is a foreign key relationship: orders.user_id references users.id, letting one user be linked to many orders without duplicating that user's data into every order row.",
    },
    {
      q: "Why link tables with relationships (foreign keys) instead of just repeating all the customer's details inside every order row?",
      options: [
        "Repeating the data would actually be faster",
        "It avoids duplicating the same information over and over, and keeps it consistent in one place",
        "Relational databases don't allow repeating values anyway",
        "There's no real benefit, it's just convention",
      ],
      answer: 1,
      hints: [
        "Picture a customer who places 50 orders — what would happen if their email changed and it was copy-pasted into all 50 order rows?",
        "Updating ONE place (the users table) should be enough — you don't want to hunt down 50 copies.",
        "Storing each fact once (in users) and referencing it (via user_id in orders) keeps data consistent and avoids the mess of updating many duplicated copies.",
      ],
      explanation: "Linking tables via a foreign key means each fact lives in exactly one place. Update the user's email once, and every order referencing that user_id automatically points at the up-to-date record.",
    },
    {
      q: "How does a NoSQL / document database (like MongoDB) typically store a record, compared to a relational table?",
      options: [
        "As a row split across rigid, predefined columns",
        "As a flexible, JSON-like document that doesn't have to match the shape of every other document",
        "It can't store records at all, only files",
        "Exactly the same as a relational row, just renamed",
      ],
      answer: 1,
      hints: [
        "Think about whether every record absolutely must have the identical set of fields, or whether that can vary.",
        "JSON-like means nested fields and optional fields are both completely fine — unlike a fixed-column table.",
        "A document database stores each record as a flexible JSON-like document, and different documents in the same collection can have different fields.",
      ],
      explanation: "Document databases drop the fixed-schema requirement — each document is its own flexible JSON-like structure, which is why they're sometimes called 'schema-less'.",
    },
    {
      q: "What does the 'C' in CRUD stand for, and what SQL command does it usually map to?",
      options: [
        "Connect — CONNECT",
        "Create — INSERT",
        "Clear — DELETE",
        "Copy — SELECT",
      ],
      answer: 1,
      hints: [
        "CRUD is an acronym for four basic data operations every app does — think about what comes BEFORE you can read or update something.",
        "Before you can Read, Update, or Delete a row, it first has to come into existence somehow.",
        "'C' is Create — adding new data — which in SQL is the INSERT command.",
      ],
      explanation: "Create is the very first CRUD operation: bringing a brand-new row/document into existence. In SQL that's the INSERT statement.",
    },
    {
      q: "Which of these is NOT one of the four CRUD operations?",
      options: ["Create", "Update", "Sort", "Delete"],
      answer: 2,
      hints: [
        "CRUD is exactly four letters/operations — three of these four options are definitely part of it.",
        "Sorting data is a useful feature, but it's not one of the four fundamental data-MODIFYING/retrieving operations CRUD describes.",
        "Sort is not part of CRUD — the four are Create, Read, Update, Delete.",
      ],
      explanation: "CRUD stands for Create, Read, Update, Delete. Sorting is a query feature you can apply on top of a Read, but it isn't one of the four core CRUD operations itself.",
    },
    {
      q: "Your app's data is rigidly structured with lots of relationships (customers, orders, products) and you need strong consistency. Which style of database fits best, conceptually?",
      options: [
        "A document/NoSQL database, because it's always faster",
        "A relational database, because it's well-suited to structured data with relationships and consistency needs",
        "Neither — store everything in JS variables",
        "It never matters which one you pick",
      ],
      answer: 1,
      hints: [
        "Think back to what each style is naturally good at: one enforces structure and relationships strictly, the other favors flexible/evolving shapes.",
        "'Lots of relationships' and 'strong consistency' are exactly the strengths this unit attributed to one of the two styles.",
        "Relational databases are the natural fit for rigid, relationship-heavy, consistency-sensitive data — that's their core strength.",
      ],
      explanation: "Relational databases shine when data is structured, relationship-heavy, and needs strong consistency guarantees — exactly the scenario described here. NoSQL/document stores tend to fit better when the data's shape is flexible or evolves quickly.",
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
  // Five steps: (0) table starts with one row, (1) a second row gets
  // added (growing the table), (2) the SAME final data reshaped as a
  // NoSQL/JSON document for direct visual comparison, (3)-(4) a CRUD
  // Update operation applied to a specific row, step by step, showing
  // the before/after value change. `code` is shown in the monospace
  // code box; `plain`/`tech` are the explanatory line underneath.
  const seeitSteps = [
    {
      plain: "A 'users' table starts with one row — id is the primary key.",
      tech: "INSERT INTO users (id, name, email) VALUES (1, 'Asha', 'asha@mail.com');",
      code: "users\nid | name | email\n1  | Asha | asha@mail.com",
    },
    {
      plain: "A second row is added — same columns, new unique id.",
      tech: "INSERT INTO users (id, name, email) VALUES (2, 'Rohit', 'rohit@mail.com');",
      code: "users\nid | name  | email\n1  | Asha  | asha@mail.com\n2  | Rohit | rohit@mail.com",
    },
    {
      plain: "Same data, as flexible JSON documents instead of a table.",
      tech: "db.users.insertMany([{...}]) — schema not enforced.",
      code: '[\n  { "_id": 1, "name": "Asha",  "email": "asha@mail.com" },\n  { "_id": 2, "name": "Rohit", "email": "rohit@mail.com" }\n]',
    },
    {
      plain: "A CRUD Update: Rohit's email is about to change.",
      tech: "UPDATE users SET email = 'rohit.k@mail.com' WHERE id = 2;",
      code: "BEFORE\nid | name  | email\n2  | Rohit | rohit@mail.com",
    },
    {
      plain: "Only the matching row changed — everything else stayed untouched.",
      tech: "WHERE id = 2 targeted one row via its primary key.",
      code: "AFTER\nid | name  | email\n2  | Rohit | rohit.k@mail.com",
    },
  ];

  // ── shared style object — copied field-for-field from Unit4_5.jsx so
  // every screen in this lesson visually matches every other lesson in
  // the course (same dark navy background, same card radius/border,
  // same button colors, etc). Nothing here is unit-specific content —
  // it's pure presentation, reused verbatim across the whole course.
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
  // without at least making a guess and seeing the reveal.
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🗄️</div>
        <div style={s.h2}>An online store restarts its server overnight for maintenance. Why don't all the orders and accounts vanish?</div>
      </div>

      {/* This recreates the same kind of in-memory-variable code box used
          in Unit4_5's Spark, reminding the student of the earlier lesson's
          idea: a plain variable's data dies when the program stops. */}
      <div style={s.codeBox}>{`let orders = [];          // lives only in server RAM
orders.push({ id: 1, item: "Shoes" });
// ...server restarts for maintenance...
console.log(orders);      // ??? — is it still there?`}</div>

      {!sparkSubmitted ? (
        <>
          <div style={{ ...s.line, marginTop: 14 }}>Pick your guess:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "They DO vanish — that's just normal and expected",
              "The browser keeps a hidden backup automatically",
              "The data was saved in a database on disk, separate from the running server process",
              "Restarting a server never actually clears anything",
            ].map((opt, i) => (
              <div key={i} onClick={() => setSparkGuess(opt)} style={{
                background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0", transition: "all 0.2s",
              }}>{opt}</div>
            ))}
          </div>
          {/* Submit is disabled (greyed via the browser's default
              disabled styling) until sparkGuess is non-null, forcing an
              actual choice before moving on — matches Rule 8 (every
              stage demands real interaction, not passive reading). */}
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>the real reason</span>
            <span style={{ color: "#475569" }}>→</span>
            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fb923c", fontSize: "1.05rem" }}>a database, not a JS variable</span>
          </div>
          <div style={{ ...s.line, color: "#4ade80" }}>
            {sparkGuess === "The data was saved in a database on disk, separate from the running server process" ? "🎯 Exactly right!" : "Not quite — the real reason is that the data lives in a database on disk."}
          </div>
          <div style={s.line}>RAM gets wiped on restart — but a database writes to disk, surviving it.</div>
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
  // the matching text blurb, and a Next button that either advances to
  // the next concept or — on the last concept — advances stage to 2
  // (See It) instead.
  const renderBuild = () => {
    // nextTitle is computed just to label the Next button helpfully
    // ("Next: Primary Keys →") instead of a generic "Next →" — null
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
              below, OUTSIDE Unit6_1 — it receives just the concept index
              and the shared animFrame tick, and internally switches on
              `index` to draw the right little animated diagram. */}
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
  // current step's code/data snippet in the monospace code box, then
  // its plain/technical explanation underneath (toggle shared across
  // all 5 steps via seeitMode). Back/Next buttons move seeitStep up or
  // down by one; on the final step the Next button instead advances
  // stage to 3 (Try It).
  const renderSeeIt = () => {
    const step = seeitSteps[seeitStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch the Data Take Shape</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>{step.code}</div>
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
  // The student clicks one of four CRUD action buttons, each of which
  // mutates the REAL tryRows state (not a canned animation) so the
  // table visibly changes on screen. Each distinct action type clicked
  // for the FIRST time increments triedCount (tracked via the
  // triedActions object so re-clicking the SAME action repeatedly
  // doesn't inflate the counter — the course rule is 3+ DIFFERENT
  // actions, encouraging the student to actually explore all four).
  const renderTryIt = () => {
    // markTried bumps triedCount by exactly 1 the first time a given
    // action key (create/read/update/delete) is used, and is a no-op
    // on every subsequent use of that same action — this is what makes
    // triedCount represent "how many distinct CRUD actions tried" not
    // "how many clicks total".
    function markTried(key) {
      if (!triedActions[key]) {
        setTriedActions((prev) => ({ ...prev, [key]: true }));
        setTriedCount((c) => c + 1);
      }
    }

    // doCreate: inserts a brand-new row with a fresh unique id (one
    // higher than the current max id in the table) — demonstrates that
    // Create always needs a NEW primary key value, never reusing one.
    function doCreate() {
      setTryRows((rows) => {
        const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
        return [...rows, { id: nextId, name: `User${nextId}`, email: `user${nextId}@mail.com` }];
      });
      setLastAction(`Created a new row (Create).`);
      setReadHighlight(null);
      markTried("create");
    }

    // doRead: doesn't change any data at all — it just highlights the
    // last row in the table for a moment, visually demonstrating that
    // Read is purely "look at data", never a mutation.
    function doRead() {
      if (tryRows.length === 0) { setLastAction("Nothing to read — the table is empty."); return; }
      const target = tryRows[tryRows.length - 1];
      setReadHighlight(target.id);
      setLastAction(`Read row id=${target.id} (Read) — no data was changed.`);
      markTried("read");
    }

    // doUpdate: changes the email of the LAST row in the table,
    // demonstrating that Update targets one row (by its primary key)
    // and changes its existing data in place, rather than adding or
    // removing a row.
    function doUpdate() {
      if (tryRows.length === 0) { setLastAction("Nothing to update — the table is empty."); return; }
      setTryRows((rows) => {
        const lastId = rows[rows.length - 1].id;
        return rows.map((r) => (r.id === lastId ? { ...r, email: `updated${r.id}@mail.com` } : r));
      });
      setLastAction(`Updated the last row's email (Update) — same primary key, new data.`);
      setReadHighlight(null);
      markTried("update");
    }

    // doDelete: removes the LAST row entirely, demonstrating that
    // Delete removes a whole row, identified by its primary key.
    function doDelete() {
      if (tryRows.length === 0) { setLastAction("Nothing to delete — the table is already empty."); return; }
      setTryRows((rows) => rows.slice(0, -1));
      setLastAction(`Deleted the last row (Delete) — that row no longer exists.`);
      setReadHighlight(null);
      markTried("delete");
    }

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run Real CRUD on a Live Table</div>
        <div style={{ ...s.p, marginBottom: 14 }}>Tap a button — watch the table change live.</div>

        {/* The four CRUD action buttons — color-coded so the student
            starts associating colors with operation TYPE across the
            course (green=create, blue=read, orange=update, red=delete). */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button style={s.btn("#4ade80")} onClick={doCreate}>➕ Create a row</button>
          <button style={s.btn("#38bdf8")} onClick={doRead}>🔍 Read a row</button>
          <button style={s.btn("#fb923c")} onClick={doUpdate}>✏️ Update a row</button>
          <button style={s.btn("#ef4444")} onClick={doDelete}>🗑️ Delete a row</button>
        </div>

        {/* Live table — re-renders automatically every time tryRows
            changes, because React re-runs this render function whenever
            any of its state changes. flexWrap + % widths inside the row
            keep this from overflowing a narrow phone screen. */}
        <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px", marginBottom: 12, overflowX: "auto" }}>
          <div style={{ display: "flex", fontWeight: 700, color: "#64748b", fontSize: "0.72rem", padding: "4px 8px", gap: 8 }}>
            <div style={{ flex: "0 0 15%" }}>id (PK)</div>
            <div style={{ flex: "1 1 40%" }}>name</div>
            <div style={{ flex: "1 1 45%" }}>email</div>
          </div>
          {tryRows.length === 0 ? (
            <div style={{ color: "#475569", fontSize: "0.78rem", padding: "8px" }}>(table is empty)</div>
          ) : tryRows.map((r) => (
            <div key={r.id} style={{
              display: "flex", gap: 8, padding: "8px", borderRadius: 8, fontSize: "0.78rem",
              background: readHighlight === r.id ? "#0f2942" : "transparent",
              border: readHighlight === r.id ? "1px solid #38bdf8" : "1px solid transparent",
              color: "#e2e8f0",
            }}>
              <div style={{ flex: "0 0 15%", color: "#4ade80", fontWeight: 700 }}>{r.id}</div>
              <div style={{ flex: "1 1 40%" }}>{r.name}</div>
              <div style={{ flex: "1 1 45%", wordBreak: "break-word" }}>{r.email}</div>
            </div>
          ))}
        </div>

        {lastAction && (
          <div style={{ background: "#0f2942", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ ...s.line, color: "#94a3b8", marginBottom: 0 }}>{lastAction}</div>
          </div>
        )}

        {/* Gate: Next only unlocks once 3+ DISTINCT CRUD actions have
            been tried — encourages exploring Create/Read/Update/Delete
            rather than spamming one button three times. */}
        <div style={{ marginTop: 4 }}>
          {triedCount >= 3
            ? <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
            : <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Try 3 different CRUD actions to unlock the next stage ({triedCount}/3).</div>}
        </div>
      </div>
    );
  };

  // ── CHALLENGE CONTENT ─────────────────────────────────────────────────────
  // ch1Pairs feeds the TagMatch vocabulary minigame: each pair's `code`
  // is the term shown on the left column, `meaning` is its correct
  // definition (shuffled into the right column by TagMatch itself), and
  // `hint` is shown immediately if the student taps a WRONG meaning for
  // that term.
  const ch1Pairs = [
    { code: "Table", meaning: "A structured collection of rows, all sharing the same fixed columns", hint: "Think spreadsheet — rows and columns together make this." },
    { code: "Row", meaning: "One single record inside a table", hint: "If the table is 'users', this is ONE specific user." },
    { code: "Column", meaning: "One attribute/field shared across every row, like 'email'", hint: "This runs top-to-bottom — same heading, different value per row." },
    { code: "Primary Key", meaning: "A unique value that identifies exactly one row, with no ambiguity", hint: "No two rows can share this value — that's what makes it useful for finding one exact row." },
    { code: "Schema", meaning: "The fixed, defined structure (columns + types) every row must follow", hint: "This is decided up front and every row in the table has to match it." },
    { code: "Document", meaning: "A flexible, JSON-like record used in NoSQL databases instead of a row", hint: "This is the NoSQL alternative to a row — its shape doesn't have to match every other one." },
    { code: "CRUD", meaning: "The four basic operations: Create, Read, Update, Delete", hint: "It's an acronym — four letters, four fundamental operations." },
  ];

  // bugLines feeds the BugHunt minigame: an array of table rows shown
  // as tappable lines, where exactly one has buggy:true (a duplicate
  // primary key) and the rest are buggy:false. bugHints escalate with
  // each wrong tap.
  const bugLines = [
    { text: "id=1 | name=Asha  | email=asha@mail.com", buggy: false },
    { text: "id=2 | name=Rohit | email=rohit@mail.com", buggy: false },
    { text: "id=2 | name=Meera | email=meera@mail.com", buggy: true, why: "Two rows both have id=2! A primary key must be unique — with a duplicate, the database (and your code) can no longer tell which of these two rows an UPDATE or DELETE targeting id=2 is supposed to affect." },
    { text: "id=4 | name=Zaid  | email=zaid@mail.com", buggy: false },
  ];
  const bugHints = [
    "Look closely at the id column (the primary key) on every row — three are fine, one repeats a value that's already used elsewhere.",
    "A primary key must be UNIQUE per row. Scan the id values: 1, 2, 2, 4 — something's off there.",
    "Two different rows both have id=2 — tap the SECOND row using that duplicated id (the one for Meera).",
  ];

  // ── CHALLENGE RENDERER ────────────────────────────────────────────────────
  // challengePhase 0 shows the TagMatch vocabulary game; once its
  // onDone fires (ch1Done becomes true) a "Next Challenge" button
  // appears that flips challengePhase to 1, which shows the BugHunt
  // duplicate-primary-key game; once ITS onDone fires (ch2Done becomes
  // true) a "Final Quiz" button appears that advances stage to 5.
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
          <div style={s.h2}>🐛 Spot the Broken Primary Key</div>
          <div style={{ ...s.line, marginBottom: 14 }}>One of these rows breaks the "unique primary key" rule. Tap it.</div>
          <BugHunt lines={bugLines} hints={bugHints} onDone={() => setCh2Done(true)} />
          {ch2Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>}
        </div>
      )}
    </div>
  );

  // ── QUIZ RENDERER ─────────────────────────────────────────────────────────
  // If quizDone is true, shows the UNIT-level completion screen (NOT a
  // module-complete screen — Module 6 still has Unit6_2 and Unit6_3 left
  // — so the copy explicitly points the student at "REST API Design"
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
          <div style={s.h2}>Unit 6.1 Complete!</div>
          <div style={{ ...s.line, color: "#94a3b8" }}>{student?.name ? `Nice work, ${student.name}!` : "Nice work!"} Next up: Unit 6.2, REST API Design.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {[
              "Why programs need a database for persistence (surviving restarts)",
              "Relational tables: rows and columns under a fixed schema",
              "Primary keys — uniquely identifying a row",
              "Relationships between tables via foreign keys",
              "NoSQL / document databases (flexible, schema-less JSON)",
              "CRUD — Create, Read, Update, Delete",
              "When to reach for relational vs NoSQL",
            ].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          {/* The ONE and only onUnitComplete() call in this file — fired
              directly from this button's onClick, never from an effect. */}
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue to Unit 6.2 →</button>
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
        <div style={s.topTitle}>Unit 6.1 — What Is a Database?</div>
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
// A standalone function component (NOT inside Unit6_1, so it doesn't
// re-declare itself every render and doesn't need its own hooks) that
// receives just `index` (which of the 7 Build concepts is active) and
// `frame` (the shared animFrame counter ticking every 100ms while on
// Build/See It). It derives a normalized 0..1 "pos" progress value from
// frame and switches on `index` to draw the appropriate tiny animated
// diagram using plain styled divs (no SVG/canvas needed at this scale).
function ConceptAnimation({ index, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
  const arrow = <div style={{ fontSize: "1.1rem", color: "#475569" }}>→</div>;

  // 0 — Why persistence matters: a variable's data evaporating on
  // restart vs. a disk icon that survives the same restart.
  if (index === 0) {
    const restarted = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem" }}>{restarted ? "💨" : "🧠"}</div>
              <div style={{ fontSize: "0.58rem", color: restarted ? "#ef4444" : "#94a3b8" }}>{restarted ? "gone!" : "RAM variable"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem" }}>💾</div>
              <div style={{ fontSize: "0.58rem", color: "#4ade80" }}>still here ✅</div>
            </div>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#64748b" }}>{restarted ? "server just restarted..." : "server running normally"}</div>
        </div>
      </div>
    );
  }

  // 1 — Relational table: rows/columns lighting up to show structure.
  if (index === 1) {
    const activeRow = Math.floor(pos * 3) % 3;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["id", "name", "email"].map((h) => (
              <div key={h} style={{ width: 44, fontSize: "0.56rem", color: "#64748b", fontWeight: 700, textAlign: "center" }}>{h}</div>
            ))}
          </div>
          {[0, 1, 2].map((r) => (
            <div key={r} style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map((c) => (
                <div key={c} style={{
                  width: 44, height: 16, borderRadius: 3, fontSize: "0.5rem",
                  background: activeRow === r ? "#38bdf833" : "#1e293b",
                  border: activeRow === r ? "1px solid #38bdf8" : "1px solid #334155",
                }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2 — Primary key: one row's id glowing as the "unique finder".
  if (index === 2) {
    const found = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>WHERE id = 2</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3].map((id) => (
              <div key={id} style={{
                width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.62rem", fontWeight: 700,
                background: found && id === 2 ? "#14532d" : "#1e293b",
                border: found && id === 2 ? "2px solid #4ade80" : "1px solid #334155",
                color: found && id === 2 ? "#4ade80" : "#64748b",
              }}>{id}</div>
            ))}
          </div>
          <div style={{ fontSize: "0.58rem", color: found ? "#4ade80" : "#475569" }}>{found ? "found exactly one row ✅" : "scanning..."}</div>
        </div>
      </div>
    );
  }

  // 3 — Relationships: an orders table row pointing via an arrow to a
  // matching users table row, instead of duplicating data.
  if (index === 3) {
    const linked = pos > 0.4;
    // Extra element: a small "no duplication" badge that appears once the
    // link lands, making the PAYOFF of the foreign-key arrow ("we didn't
    // copy the data") visible instead of just implied by the arrow.
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: "0.6rem", color: "#94a3b8" }}>orders<br />user_id: 2</div>
            <div style={{ fontSize: "1rem", color: linked ? "#38bdf8" : "#475569" }}>{linked ? "⤳" : "→"}</div>
            <div style={{ border: linked ? "2px solid #38bdf8" : "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: "0.6rem", color: linked ? "#38bdf8" : "#64748b" }}>users<br />id: 2</div>
          </div>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, color: linked ? "#4ade80" : "#334155", transition: "color 0.2s" }}>{linked ? "no duplicate data ✅" : ""}</div>
        </div>
      </div>
    );
  }

  // 4 — NoSQL/document: a flexible JSON document with curly braces
  // pulsing to suggest its shape can vary document-to-document.
  if (index === 4) {
    const pulse = Math.floor(pos * 3) % 3 === 1;
    // Extra element: a SECOND document with a different shape (extra
    // field, missing field) fading in alongside the first, visually
    // proving "documents don't have to match" instead of just stating it.
    const showSecond = pos > 0.5;
    return (
      <div style={base}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            fontFamily: "monospace", fontSize: "0.6rem", color: pulse ? "#a78bfa" : "#94a3b8",
            border: pulse ? "1px solid #a78bfa66" : "1px solid #334155", borderRadius: 8, padding: "8px 10px",
            whiteSpace: "pre",
          }}>{`{\n  name: "Asha",\n  email: "..."\n}`}</div>
          <div style={{
            fontFamily: "monospace", fontSize: "0.6rem", color: "#fb923c",
            border: "1px solid #fb923c55", borderRadius: 8, padding: "8px 10px",
            whiteSpace: "pre", opacity: showSecond ? 1 : 0, transition: "opacity 0.2s",
          }}>{`{\n  name: "Rohit",\n  age: 22\n}`}</div>
        </div>
      </div>
    );
  }

  // 5 — CRUD: four letters cycling through highlight to show all four
  // operations exist on equal footing.
  if (index === 5) {
    const activeOp = Math.floor(pos * 4) % 4;
    const ops = [
      { l: "C", c: "#4ade80", word: "Create" },
      { l: "R", c: "#38bdf8", word: "Read" },
      { l: "U", c: "#fb923c", word: "Update" },
      { l: "D", c: "#ef4444", word: "Delete" },
    ];
    // Extra element: a full word label underneath that swaps in sync with
    // the highlighted letter circle, spelling out the acronym one letter
    // at a time instead of leaving the student to remember what C/R/U/D
    // stand for from text alone.
    return (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {ops.map((o, i) => (
              <div key={o.l} style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.8rem",
                background: activeOp === i ? o.c + "33" : "#1e293b",
                border: activeOp === i ? `2px solid ${o.c}` : "1px solid #334155",
                color: activeOp === i ? o.c : "#64748b",
              }}>{o.l}</div>
            ))}
          </div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: ops[activeOp].c }}>{ops[activeOp].word}</div>
        </div>
      </div>
    );
  }

  // 6 — Relational vs NoSQL: a balance/seesaw tipping toward whichever
  // side fits the described scenario better.
  const tiltLeft = pos < 0.5;
  return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ textAlign: "center", transform: tiltLeft ? "translateY(-4px)" : "translateY(2px)", transition: "transform 0.3s" }}>
          <div style={{ fontSize: "1.1rem" }}>🗂️</div>
          <div style={{ fontSize: "0.56rem", color: tiltLeft ? "#38bdf8" : "#64748b" }}>relational</div>
        </div>
        <div style={{ fontSize: "1rem", color: "#475569" }}>⚖️</div>
        <div style={{ textAlign: "center", transform: !tiltLeft ? "translateY(-4px)" : "translateY(2px)", transition: "transform 0.3s" }}>
          <div style={{ fontSize: "1.1rem" }}>📄</div>
          <div style={{ fontSize: "0.56rem", color: !tiltLeft ? "#a78bfa" : "#64748b" }}>document</div>
        </div>
      </div>
    </div>
  );
}

// ── TAG MATCH — wrong tap shows that pair's hint immediately ───────────────
// Reused mechanic from Unit4_5.jsx, unchanged: the student taps a term
// in the left column, then a meaning in the right column. A correct
// match locks both in green; a wrong match flashes red briefly and
// shows that pair's specific hint. onDone() fires once every pair is
// matched, which is what reveals the "Next Challenge" button in
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
// Reused mechanic from Unit4_5.jsx, unchanged: the student taps any one
// of `lines`; tapping the single line flagged buggy:true reveals it
// (green, with its `why` explanation) and calls onDone(); tapping any
// other line briefly flashes red and shows the NEXT escalating hint
// from `hints` (clamped so the last hint just repeats once exhausted).
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
