// ============================================================================
//  UNIT 2.1 — "Structure of an HTML Document"
//  Module: M2 — HTML Foundations
//
//  WHERE THIS FILE FITS IN THE APP:
//  - src/shell/App.jsx reads config/course.config.js, finds the unit named
//    "Unit2_1" inside module M2, and when the student clicks that unit it
//    dynamically renders THIS component, passing it `student` (their login
//    info) and `onUnitComplete` (a callback to tell App.jsx the lesson is
//    finished so it can save progress to the backend and unlock Unit2_2).
//  - We never talk to the network ourselves (no api.js, no gas.config.js
//    imports) — App.jsx owns all of that. Our only job is to teach the
//    concept and call onUnitComplete() once, at the very end.
//
//  TEACHING DESIGN (mirrors the proven pattern used in Unit1_2.jsx so the
//  whole course feels consistent to a student moving from Module 1 to
//  Module 2):
//    Stage 0  SPARK      — a curiosity question that hooks attention
//                           (renamed from "Hook" because that word read as
//                           clickbait-y in the stage pill at the top; this
//                           is the same "predict before you're taught"
//                           pedagogy, just with a nicer label).
//    Stage 1  BUILD      — concept-by-concept walkthrough with a short
//                           timed unlock so students don't rush past ideas,
//                           plus a Plain-English ⇄ Technical toggle so the
//                           same idea is explained twice, two different ways.
//    Stage 2  SEE IT     — a worked example: we build a real HTML file from
//                           an empty page, one line at a time, and the
//                           student watches the live "rendered page" change.
//    Stage 3  TRY IT     — hands-on simulator: the student themselves clicks
//                           the tags into place, in the right order, and
//                           watches a tiny browser preview come alive.
//    Stage 4  CHALLENGE  — two short games: (a) match each tag to its job,
//                           (b) put a shuffled document's tags back into
//                           correct nesting order.
//    Stage 5  QUIZ       — multiple-choice questions. Per the latest
//                           instructions: a wrong answer never reveals the
//                           correct one immediately. Instead the student
//                           gets a hint and another attempt, and only sees
//                           the explanation once they pick correctly
//                           themselves. This keeps the student actively
//                           reasoning instead of being handed the answer.
//
//  MOBILE-FRIENDLINESS:
//  Every layout below uses flexible units (%, flex-wrap, minmax(), clamp())
//  instead of fixed pixel widths, so the lesson reflows cleanly on a phone
//  screen as well as a laptop. The small <style> block at the bottom adds a
//  couple of @media rules for the very narrow case (under ~420px).
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit2_1({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ──────────────────────────────────────────────────
  // `stage` drives which of the six teaching stages is currently on screen.
  // 0=Spark 1=Build 2=SeeIt 3=TryIt 4=Challenge 5=Quiz — see stageNames below.
  const [stage, setStage] = useState(0);

  // ── SPARK stage state ───────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState("");     // which option the student picked
  const [sparkSubmitted, setSparkSubmitted] = useState(false); // locks the choice + reveals feedback

  // ── BUILD stage state ───────────────────────────────────────────────────
  const [buildConcept, setBuildConcept] = useState(0);   // index into `concepts` array below
  // conceptUnlocked[i] = true once the student has spent enough time on
  // concept i-1 (or it's the very first concept, which starts unlocked).
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);    // seconds left before next concept unlocks
  const [buildMode, setBuildMode] = useState("plain");    // "plain" | "tech" toggle inside Build

  // ── SEE IT stage state ──────────────────────────────────────────────────
  const [seeitMode, setSeeitMode] = useState("plain");    // plain/technical toggle for the walk-through
  const [seeitStep, setSeeitStep] = useState(0);           // which line of the document we've revealed

  // ── TRY IT stage state ──────────────────────────────────────────────────
  // Each key becomes true once the student has clicked that tag into place,
  // in order. The UI only offers the *next* button so the order is enforced.
  const [tryitState, setTryitState] = useState({
    doctype: false, htmlOpen: false, head: false, title: false, body: false,
  });

  // ── CHALLENGE stage state ───────────────────────────────────────────────
  const [challengePhase, setChallengePhase] = useState(0); // 0 = tag-match game, 1 = ordering game
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ stage state ────────────────────────────────────────────────────
  const [quizQ, setQuizQ] = useState(0);              // which question we're on
  const [quizSelected, setQuizSelected] = useState(null); // currently highlighted option index
  const [quizFeedback, setQuizFeedback] = useState(null); // null | "correct" | "wrong"
  const [quizAttempts, setQuizAttempts] = useState(0);    // wrong attempts on THIS question
  const [quizDone, setQuizDone] = useState(false);        // true once every question is answered correctly
  const [hintsShown, setHintsShown] = useState(0);        // how many hints have been unlocked so far

  // ── Shared timers / animation frame ─────────────────────────────────────
  const timerRef = useRef(null); // holds the setInterval id for the concept-unlock countdown
  const animRef = useRef(null);  // holds the setInterval id for the looping animation frame
  const [animFrame, setAnimFrame] = useState(0); // 0..59, loops forever, drives the little animations

  // ── CONTENT: the five core concepts taught in Build stage ───────────────
  // `unlock` = seconds the student must sit with this concept before the
  // next one becomes clickable — keeps people from speed-running the lesson.
  const concepts = [
    {
      title: "<!DOCTYPE html> — The Version Announcement",
      plain: "Before anything else, a web page says one sentence to the browser: 'Hey, read me using the modern HTML rules.' That's all <!DOCTYPE html> does — it's not even a real tag, just a heads-up at the very top of the file.",
      technical: "The doctype declaration tells the browser's rendering engine to use HTML5 standards mode rather than 'quirks mode' (a legacy compatibility mode for very old, non-standard markup). It must be the first line of the file.",
      animation: "doctype",
      unlock: 8,
    },
    {
      title: "<html> — The Root Container",
      plain: "Everything in a webpage — every word, every picture, every button — lives inside one big box called <html>. It's like the cover of a book: everything else is a page inside it.",
      technical: "<html> is the document's root element. It wraps exactly two children — <head> and <body> — and commonly carries a `lang` attribute (e.g. lang=\"en\") so screen readers and translators know which language the content is in.",
      animation: "html",
      unlock: 8,
    },
    {
      title: "<head> — Information About the Page (Invisible)",
      plain: "Think of <head> as the page's ID card — it holds info like the page's title and which 'style sheet' to use, but none of it actually shows up on the page itself.",
      technical: "<head> holds metadata: <title>, <meta charset>, <meta name=\"viewport\">, <link> to CSS, and <script> tags. Nothing inside <head> is rendered as visible page content.",
      animation: "head",
      unlock: 9,
    },
    {
      title: "<body> — Everything You Actually See",
      plain: "<body> is the opposite of <head> — it's the part of the house you actually live in. Every heading, paragraph, image, and button a visitor sees goes inside <body>.",
      technical: "<body> contains all visible/interactive content rendered in the viewport: headings, text, media, forms, and scripts that manipulate the DOM at runtime.",
      animation: "body",
      unlock: 8,
    },
    {
      title: "Tags, Elements & Attributes — The Building Blocks",
      plain: "A 'tag' is a label like <p> or </p>. An 'element' is the opening tag + the content + the closing tag together, like <p>Hello</p>. An 'attribute' is extra detail you stuff inside the opening tag, like <p class=\"intro\">.",
      technical: "Elements are typically formed by a start tag, content, and an end tag: <tag attribute=\"value\">content</tag>. Attributes are name=\"value\" pairs inside the start tag that configure the element (id, class, src, href, etc.). Some elements are 'void' / self-closing, e.g. <img />, <br />, <meta />.",
      animation: "tags",
      unlock: 10,
    },
  ];

  // ── CONTENT: Quiz bank — 5 questions, each with progressive hints ───────
  // Design rule (per latest instructions): a wrong answer NEVER shows the
  // correct one. It deselects, shows hint #attempt, and lets the student
  // try again. The explanation only appears after they get it right
  // themselves — so the learning stays active, not spoon-fed.
  const quizQuestions = [
    {
      q: "Which line must always be the very first line of an HTML file?",
      options: ["<html>", "<!DOCTYPE html>", "<head>", "<title>"],
      answer: 1,
      hints: [
        "It's not really a 'tag' that displays anything — it's more like a note to the browser before the real document starts.",
        "It tells the browser which 'rulebook' (HTML version) to use when reading the rest of the file.",
        "<!DOCTYPE html> always comes first — it declares 'this file follows modern HTML5 rules.'",
      ],
      explanation: "<!DOCTYPE html> must be the first line. It isn't an HTML element itself — it's a declaration that puts the browser into standards-compliant HTML5 mode instead of an old legacy mode.",
    },
    {
      q: "Where does the visible content of a webpage — text, images, buttons — actually go?",
      options: ["Inside <head>", "Inside <title>", "Inside <body>", "Inside <!DOCTYPE>"],
      answer: 2,
      hints: [
        "One of these tags holds information ABOUT the page (invisible); the other holds the page itself (visible).",
        "Think of <head> as the ID card on the cover, and this other tag as the actual pages of the book.",
        "<body> holds everything a visitor actually sees and interacts with on screen.",
      ],
      explanation: "<body> contains all visible page content. <head> only holds metadata (title, links to stylesheets, etc.) that never appears directly on the page.",
    },
    {
      q: "In <p class=\"intro\">Hello</p>, what role does class=\"intro\" play?",
      options: ["It's the tag", "It's the element", "It's an attribute", "It's a comment"],
      answer: 2,
      hints: [
        "The tag is the label like <p> or </p>. The element is the whole opening+content+closing combo.",
        "This piece sits INSIDE the opening tag and looks like name=\"value\" — that pattern has a specific name.",
        "class=\"intro\" is an attribute — extra configuration written inside the start tag.",
      ],
      explanation: "Attributes are name=\"value\" pairs placed inside an opening tag to add extra detail or configuration — here, class=\"intro\" labels this paragraph for styling purposes.",
    },
    {
      q: "Which element correctly contains BOTH <head> and <body> as its only two children?",
      options: ["<!DOCTYPE html>", "<html>", "<body>", "<title>"],
      answer: 1,
      hints: [
        "This element is the outermost 'box' that wraps the entire page.",
        "It's often described as the document's 'root' — like the cover of a book containing all its pages.",
        "<html> is the root element; <head> and <body> are its two children.",
      ],
      explanation: "<html> is the root container of the whole document. It always has exactly two main children: <head> (metadata) and <body> (visible content).",
    },
    {
      q: "Why might <meta charset=\"UTF-8\"> appear inside <head>?",
      options: [
        "To make the page load faster on slow Wi-Fi",
        "To tell the browser which character encoding to use so text (including non-English text) displays correctly",
        "To add a picture to the page",
        "To change the page's background colour",
      ],
      answer: 1,
      hints: [
        "This isn't about speed or images — it's about how letters and symbols get interpreted.",
        "Without it, special characters (like ₹, é, or Tamil/Hindi script) can sometimes show up as garbled boxes or question marks.",
        "UTF-8 is a character encoding standard — declaring it tells the browser exactly how to decode the bytes of the file into the correct letters and symbols.",
      ],
      explanation: "<meta charset=\"UTF-8\"> tells the browser which character-encoding rules to use when turning the file's raw bytes into visible text — UTF-8 supports virtually every language's characters, which is why it's the near-universal default today.",
    },
  ];

  // ── Concept unlock timer ─────────────────────────────────────────────────
  // Whenever we land on a new Build concept, start counting down. When it
  // hits zero, unlock the NEXT concept's tab. This effect re-runs whenever
  // `buildConcept` changes (new concept selected) or stage changes.
  useEffect(() => {
    if (stage !== 1) return; // only run the countdown while we're actually on the Build stage
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
    // Cleanup: always clear the running interval when the effect re-fires
    // or the component unmounts, otherwise we'd leak multiple timers.
    return () => clearInterval(timerRef.current);
  }, [buildConcept, stage]);

  // ── Looping animation frame ticker ──────────────────────────────────────
  // Drives the little hand-drawn animations in Build and See-It. We just
  // increment a counter 0..59 forever; each animation component derives its
  // own visual state from this single shared frame number.
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It walkthrough — building a document line by line ──────
  const seeitSteps = [
    { plain: "We start with a totally empty file.", tech: "An empty .html file — zero bytes of markup.", code: "" },
    { plain: "First line: tell the browser 'this is modern HTML.'", tech: "Add the doctype declaration.", code: "<!DOCTYPE html>" },
    { plain: "Now open the root box that will hold everything.", tech: "Add the <html> root element with a lang attribute.", code: "<!DOCTYPE html>\n<html lang=\"en\">\n</html>" },
    { plain: "Inside it, add the invisible 'ID card' section.", tech: "Add <head> with a <title> and a charset meta tag.", code: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>My First Page</title>\n</head>\n</html>" },
    { plain: "Now add the visible part — this is what shows on screen.", tech: "Add <body> with a heading and a paragraph.", code: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>This is my first webpage.</p>\n</body>\n</html>" },
    { plain: "Done! This tiny file is already a complete, valid webpage.", tech: "A minimal but fully spec-compliant HTML5 document.", code: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>This is my first webpage.</p>\n</body>\n</html>" },
  ];

  // ── CONTENT: Challenge 1 — tag-to-job matching pairs ─────────────────────
  const ch1Pairs = [
    { code: "<!DOCTYPE html>", meaning: "Declares this is an HTML5 document" },
    { code: "<head>", meaning: "Holds invisible page metadata" },
    { code: "<title>", meaning: "Sets the browser tab's text" },
    { code: "<body>", meaning: "Holds everything the visitor sees" },
  ];

  // ── CONTENT: Challenge 2 — correct nesting order for the ordering game ──
  const ch2Steps = ["<!DOCTYPE html>", "<html>", "<head>", "<title>…</title>", "</head>", "<body>"];
  const ch2Correct = [0, 1, 2, 3, 4, 5];

  // ── STYLES ────────────────────────────────────────────────────────────────
  // A single style object reused across every stage, kept visually
  // consistent with Unit1_2.jsx (same dark slate palette + sky-blue accent)
  // so the whole course feels like one product. Anything that could
  // overflow on a phone uses %, flex-wrap, or minmax()/clamp() instead of a
  // fixed pixel size.
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8 },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: (active, done) => ({
      padding: "3px 9px", borderRadius: 99, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none",
      whiteSpace: "nowrap",
    }),
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px 12px", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({
      background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px",
      fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10,
    }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    conceptCard: (active) => ({
      background: active ? "#0f2942" : "#1a2535", borderRadius: 12, padding: "14px", marginBottom: 10,
      border: active ? "2px solid #38bdf8" : "1px solid #334155", transition: "all 0.3s",
    }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({
      flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
      background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b",
    }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.78rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    checkRow: (done) => ({
      background: done ? "#14532d33" : "#1e293b", border: done ? "1px solid #4ade8044" : "1px solid #334155",
      borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10,
      transition: "all 0.3s",
    }),
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem",
      color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  // Note: renamed from "Hook" to "Spark" per latest feedback — same teaching
  // purpose (predict-then-learn), friendlier label in the stage-pill bar.
  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📄</div>
        <div style={s.h2}>This is just plain text in a file...</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          Hello World
        </div>
        <div style={{ ...s.p, textAlign: "center" }}>
          ...yet a webpage has headings, bold text, clickable links and images.
          <strong style={{ color: "#f1f5f9" }}> What turns plain text into a structured page</strong> the browser knows how to draw?
        </div>
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: what does the trick?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "The browser guesses the structure using AI",
              "Special wrapper labels called 'tags' mark each part's role",
              "The internet connection adds the structure automatically",
              "Every webpage is secretly a picture, not text",
            ].map((opt, i) => (
              <div key={i}
                onClick={() => setSparkGuess(opt)}
                style={{
                  background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                  border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                  borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0",
                  transition: "all 0.2s",
                }}>
                {opt}
              </div>
            ))}
          </div>
          <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>✅ Let's find out!</div>
          <div style={s.p}>
            {sparkGuess.includes("tags")
              ? "🎯 Exactly right! HTML stands for HyperText Markup Language — 'markup' means wrapping content in tags that describe its role. Let's see exactly how that document is built, piece by piece."
              : "The real answer: HTML wraps every piece of content in 'tags' — labels like <h1> or <p> — that tell the browser what each piece is and how it should appear. Let's build a real document together and see it happen."}
          </div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD ─────────────────────────────────────────────────────────────────
  const renderBuild = () => (
    <div>
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "12px 12px 0" }}>
        {concepts.map((c, i) => (
          <button key={i}
            disabled={!conceptUnlocked[i]}
            onClick={() => { setBuildConcept(i); setBuildMode("plain"); }}
            style={{
              flexShrink: 0, padding: "6px 12px", borderRadius: 99, border: "none", fontWeight: 600,
              fontSize: "0.72rem", cursor: conceptUnlocked[i] ? "pointer" : "not-allowed",
              background: buildConcept === i ? "#38bdf8" : conceptUnlocked[i] ? "#1e293b" : "#0f172a",
              color: buildConcept === i ? "#0f172a" : conceptUnlocked[i] ? "#e2e8f0" : "#334155",
            }}>
            {conceptUnlocked[i] ? `${i + 1}. ${c.title.split("—")[0].trim()}` : `🔒 Concept ${i + 1}`}
          </button>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.h3}>{concepts[buildConcept].title}</div>

        <div style={s.animBox}>
          <ConceptAnimation type={concepts[buildConcept].animation} frame={animFrame} />
        </div>

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
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>
          }
          <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
        </div>
      </div>
    </div>
  );

  // ── SEE IT ────────────────────────────────────────────────────────────────
  const renderSeeIt = () => (
    <div style={s.card}>
      <div style={s.h2}>📽️ Watch a Page Get Built, Line by Line</div>
      <div style={s.p}>Step through each addition. Toggle between plain English and technical terms.</div>

      <div style={s.toggleRow}>
        <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
        <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
      </div>

      {/* Live "code so far" preview — this is the heart of See-It: the
          student literally watches the file grow with each step. */}
      <div style={s.codeBox}>{seeitSteps[seeitStep].code || "// (empty file)"}</div>

      <div style={{ margin: "14px 0" }}>
        {seeitSteps.map((step, i) => (
          <div key={i}
            onClick={() => setSeeitStep(i)}
            style={{
              background: seeitStep === i ? "#0f2942" : i < seeitStep ? "#14532d22" : "#0f172a",
              border: seeitStep === i ? "2px solid #38bdf8" : i < seeitStep ? "1px solid #4ade8044" : "1px solid #334155",
              borderRadius: 10, padding: "11px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.2s",
            }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: "0.75rem", color: i < seeitStep ? "#4ade80" : seeitStep === i ? "#38bdf8" : "#475569", fontWeight: 700 }}>
                {i < seeitStep ? "✅" : seeitStep === i ? "▶" : `${i + 1}.`}
              </span>
              <span style={{ fontSize: "0.83rem", color: seeitStep === i ? "#f1f5f9" : "#94a3b8" }}>
                {seeitMode === "plain" ? step.plain : step.tech}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {seeitStep < seeitSteps.length - 1
          ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
          : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>
        }
        {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
      </div>
    </div>
  );

  // ── TRY IT ────────────────────────────────────────────────────────────────
  const renderTryIt = () => {
    const steps = [
      { key: "doctype", label: "Declare the document type", action: "Add <!DOCTYPE html>", icon: "📋" },
      { key: "htmlOpen", label: "Open the root <html> box", action: "Add <html lang=\"en\">", icon: "📦" },
      { key: "head", label: "Add the invisible <head> section", action: "Add <head>…</head>", icon: "🗂️" },
      { key: "title", label: "Give the tab a <title>", action: "Add <title>My Page</title>", icon: "🏷️" },
      { key: "body", label: "Open <body> — where visible content lives", action: "Add <body>…</body>", icon: "👁️" },
    ];
    const doneCount = Object.values(tryitState).filter(Boolean).length;
    const allDone = doneCount === steps.length;

    // Build a tiny live "rendered preview" string that grows as the
    // student completes each step — gives an immediate visual payoff.
    const previewLines = [];
    if (tryitState.doctype) previewLines.push("📋 (browser now reads this as HTML5)");
    if (tryitState.htmlOpen) previewLines.push("📦 root document container open");
    if (tryitState.head) previewLines.push("🗂️ metadata section ready (invisible)");
    if (tryitState.title) previewLines.push("🏷️ browser tab now reads: \"My Page\"");
    if (tryitState.body) previewLines.push("👁️ visible canvas is now open for content!");

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Build the Document Yourself</div>
        <div style={s.p}>You're the developer this time. Click each step in order to assemble a valid HTML skeleton.</div>

        <div style={{ height: 6, background: "#1e293b", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(doneCount / steps.length) * 100}%`, background: "linear-gradient(90deg,#38bdf8,#4ade80)", transition: "width 0.4s", borderRadius: 99 }} />
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px" }}>
            {steps.map((step) => (
              <div key={step.key} style={s.checkRow(tryitState[step.key])}>
                <span style={{ fontSize: "1rem" }}>{tryitState[step.key] ? "✅" : step.icon}</span>
                <span style={{ fontSize: "0.8rem", color: tryitState[step.key] ? "#4ade80" : "#94a3b8" }}>{step.label}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: "1 1 180px", background: "#0f172a", borderRadius: 12, padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>LIVE PREVIEW PANEL</div>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 10px", fontSize: "0.74rem", color: "#7dd3fc", fontFamily: "monospace", minHeight: 70 }}>
              {previewLines.length === 0 ? "> waiting for first tag…" : previewLines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            {steps.map((step, i) => {
              const prevDone = i === 0 ? true : tryitState[steps[i - 1].key];
              if (tryitState[step.key] || !prevDone) return null;
              return (
                <button key={step.key} style={s.btn()} onClick={() => setTryitState((p) => ({ ...p, [step.key]: true }))}>
                  {step.icon} {step.action}
                </button>
              );
            })}
          </div>
        </div>

        {allDone && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8044", borderRadius: 12, padding: "14px", marginTop: 14 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>🎉 You just hand-built a valid HTML skeleton!</div>
            <div style={s.p}>Every real website — no matter how huge — starts from exactly this same five-piece skeleton.</div>
            <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
          </div>
        )}
      </div>
    );
  };

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match Tag to Job</div>
          <div style={s.p}>Tap a tag, then tap the job it performs.</div>
          <TagMatch pairs={ch1Pairs} onDone={() => setCh1Done(true)} />
          {ch1Done && (
            <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>
          )}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 2: Rebuild the Correct Order</div>
          <div style={s.p}>These tags got shuffled! Tap them in the order they should appear in a real document, top to bottom.</div>
          <OrderingChallenge steps={ch2Steps} correct={ch2Correct} onDone={() => setCh2Done(true)} />
          {ch2Done && (
            <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>Final Quiz →</button>
          )}
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
          <div style={s.h2}>Unit 2.1 Complete!</div>
          <div style={s.p}>You now know exactly how every HTML document is structured underneath.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["<!DOCTYPE html> — the version announcement", "<html> — the root container", "<head> — invisible page metadata", "<body> — everything visitors actually see", "Tags, elements & attributes — the building blocks"].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.82rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>Mark Complete & Continue →</button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
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
            <div key={i} style={s.quizOption(isSelected, isCorrect, isWrong)}
              onClick={() => { if (!quizFeedback || quizFeedback === "wrong") { setQuizSelected(i); setQuizFeedback(null); } }}>
              {opt}
            </div>
          );
        })}

        {/* Hints appear only after a wrong attempt — never the answer itself. */}
        {quizFeedback === "wrong" && hintsShown < q.hints.length && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint {hintsShown}:</div>
            <div style={{ color: "#fde68a", fontSize: "0.82rem" }}>{q.hints[hintsShown - 1]}</div>
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
            <button style={s.btn()} disabled={quizSelected === null}
              onClick={() => {
                if (quizSelected === q.answer) {
                  setQuizFeedback("correct");
                } else {
                  const newAttempts = quizAttempts + 1;
                  setQuizAttempts(newAttempts);
                  setQuizFeedback("wrong");
                  // Reveal one more hint per wrong attempt, capped at the
                  // number of hints we actually wrote for this question.
                  setHintsShown(Math.min(newAttempts, q.hints.length));
                  setQuizSelected(null); // force a fresh, deliberate re-pick
                }
              }}>
              Check Answer
            </button>
          )}
          {quizFeedback === "correct" && (
            <button style={s.btn("#4ade80")}
              onClick={() => {
                if (quizQ + 1 < quizQuestions.length) {
                  setQuizQ(quizQ + 1);
                  setQuizSelected(null);
                  setQuizFeedback(null);
                  setQuizAttempts(0);
                  setHintsShown(0);
                } else {
                  setQuizDone(true);
                }
              }}>
              {quizQ + 1 < quizQuestions.length ? "Next Question →" : "Finish Quiz 🎉"}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── TOP-LEVEL RENDER ──────────────────────────────────────────────────────
  // Renders the sticky top bar (with stage-progress pills) and then exactly
  // one of the six stage renderers based on `stage`. Identical shell pattern
  // to Unit1_2.jsx so the whole course feels uniform to students.
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 2.1 — Structure of an HTML Document</div>
        <div style={s.stagePills}>
          {stageNames.map((name, i) => (
            <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>
          ))}
        </div>
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

      {/* A couple of small responsive tweaks for very narrow phone screens:
          shrink the stage-pill text further and let the top bar's title
          and pills stack instead of squeezing onto one line. */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (max-width: 420px) {
          .unit-topbar-title { font-size: 0.74rem !important; }
        }
      `}</style>
    </div>
  );
}

// ── CONCEPT ANIMATIONS ────────────────────────────────────────────────────
// One small hand-built visual per Build concept. `frame` (0..59) loops
// forever and each animation derives its own motion/phase from it, so
// nothing here needs its own separate timer.
function ConceptAnimation({ type, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  if (type === "doctype") return (
    <div style={base}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#fbbf24", background: "#2d1b00", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
          &lt;!DOCTYPE html&gt;
        </div>
        <div style={{ fontSize: "1.4rem", opacity: pos > 0.5 ? 1 : 0.3, transition: "opacity 0.3s" }}>👀 ➜ 🌐</div>
        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Browser reads this BEFORE anything else</div>
      </div>
    </div>
  );

  if (type === "html") return (
    <div style={base}>
      <div style={{
        border: "2px dashed #38bdf8", borderRadius: 12, padding: "16px 22px",
        display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
        opacity: 0.6 + pos * 0.4,
      }}>
        <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>&lt;html lang="en"&gt;</div>
        <div style={{ background: "#1a2535", borderRadius: 6, padding: "4px 10px", fontSize: "0.65rem", color: "#94a3b8" }}>everything else lives here</div>
        <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>&lt;/html&gt;</div>
      </div>
    </div>
  );

  if (type === "head") {
    const items = ["<title>", "<meta charset>", "<link rel=stylesheet>"];
    const idx = Math.floor(pos * items.length) % items.length;
    return (
      <div style={base}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 6 }}>Inside &lt;head&gt; (nothing here is drawn on screen)</div>
          <div style={{ background: "#1a1530", border: "1px solid #a78bfa55", borderRadius: 8, padding: "10px 16px", color: "#a78bfa", fontFamily: "monospace", fontSize: "0.78rem" }}>
            {items[idx]}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
            {items.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#a78bfa" : "#334155" }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (type === "body") return (
    <div style={base}>
      <div style={{ width: "92%", background: "#0d2818", border: "2px solid #4ade80", borderRadius: 10, padding: 10 }}>
        <div style={{ height: 10, width: "60%", background: "#4ade8055", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 6, width: "90%", background: "#33415544", borderRadius: 4, marginBottom: 4 }} />
        <div style={{ height: 6, width: `${40 + pos * 50}%`, background: "#33415544", borderRadius: 4, transition: "width 0.2s" }} />
        <div style={{ fontSize: "0.6rem", color: "#4ade80", marginTop: 6 }}>👁️ all of this is visible to the visitor</div>
      </div>
    </div>
  );

  if (type === "tags") {
    return (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: "0.78rem", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ color: "#38bdf8" }}>&lt;p</span>
          <span style={{ color: "#fbbf24", opacity: pos > 0.3 ? 1 : 0.3, transition: "opacity 0.3s" }}>class="intro"</span>
          <span style={{ color: "#38bdf8" }}>&gt;</span>
          <span style={{ color: "#e2e8f0", opacity: pos > 0.55 ? 1 : 0.3, transition: "opacity 0.3s" }}>Hello!</span>
          <span style={{ color: "#38bdf8" }}>&lt;/p&gt;</span>
        </div>
      </div>
    );
  }

  return <div style={{ color: "#64748b" }}>Animation</div>;
}

// ── TAG MATCH ──────────────────────────────────────────────────────────────
// Click-based matching game (no drag-and-drop, so it works the same on
// touchscreens as with a mouse): tap a tag, then tap its job. A correct
// match locks both in green; a wrong match flashes red briefly and resets
// the selection so the student tries again rather than being told the
// answer outright.
function TagMatch({ pairs, onDone }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [wrong, setWrong] = useState(null);
  // Shuffle the "job" column once per mount so it doesn't visually line up
  // with the tag column — otherwise the game would be trivial.
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>TAGS</div>
        {pairs.map((p) => (
          <div key={p.code}
            onClick={() => handleCode(p.code)}
            style={{
              background: matched[p.code] ? "#14532d33" : selected?.value === p.code ? "#0f2942" : "#0f172a",
              border: matched[p.code] ? "1px solid #4ade8044" : selected?.value === p.code ? "2px solid #38bdf8" : "1px solid #334155",
              borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: matched[p.code] ? "default" : "pointer",
              fontFamily: "monospace", fontSize: "0.78rem", color: matched[p.code] ? "#4ade80" : "#e2e8f0",
            }}>
            {matched[p.code] ? "✅ " : ""}{p.code}
          </div>
        ))}
      </div>
      <div style={{ flex: "1 1 140px" }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>JOBS</div>
        {shuffledMeanings.map((p) => {
          const isUsed = Object.values(matched).includes(p.meaning);
          return (
            <div key={p.meaning}
              onClick={() => !isUsed && handleMeaning(p.meaning)}
              style={{
                background: isUsed ? "#14532d33" : wrong === p.meaning ? "#450a0a" : "#0f172a",
                border: isUsed ? "1px solid #4ade8044" : wrong === p.meaning ? "2px solid #ef4444" : "1px solid #334155",
                borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: isUsed ? "default" : "pointer",
                fontSize: "0.78rem", color: isUsed ? "#4ade80" : "#e2e8f0",
              }}>
              {isUsed ? "✅ " : ""}{p.meaning}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ORDERING CHALLENGE ─────────────────────────────────────────────────────
// Student taps shuffled tags in what they believe is the correct order. A
// wrong tap doesn't reveal the right order — it just flashes red and lets
// them keep trying (the picked item is NOT removed from the pool unless
// the tap was correct), reinforcing active recall over pattern-matching.
function OrderingChallenge({ steps, correct, onDone }) {
  const shuffled = useRef([...steps].map((s, i) => ({ s, origIndex: i })).sort(() => Math.random() - 0.5)).current;
  const [placed, setPlaced] = useState([]); // array of origIndex values, in the order tapped
  const [wrongFlash, setWrongFlash] = useState(null);

  function tap(item) {
    if (placed.includes(item.origIndex)) return;
    const expectedNext = correct[placed.length];
    if (item.origIndex === expectedNext) {
      const next = [...placed, item.origIndex];
      setPlaced(next);
      if (next.length === steps.length) onDone();
    } else {
      setWrongFlash(item.origIndex);
      setTimeout(() => setWrongFlash(null), 500);
    }
  }

  return (
    <div>
      {/* Slots showing progress so far, top to bottom */}
      <div style={{ marginBottom: 14 }}>
        {correct.map((origIdx, slot) => (
          <div key={slot} style={{
            background: placed.length > slot ? "#14532d33" : "#0f172a",
            border: placed.length > slot ? "1px solid #4ade8044" : "1px dashed #334155",
            borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontFamily: "monospace", fontSize: "0.78rem",
            color: placed.length > slot ? "#4ade80" : "#475569",
          }}>
            {placed.length > slot ? `${slot + 1}. ${steps[placed[slot]]}` : `${slot + 1}. ___`}
          </div>
        ))}
      </div>

      {/* Shuffled pool of tappable tags */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {shuffled.filter((item) => !placed.includes(item.origIndex)).map((item) => (
          <div key={item.origIndex}
            onClick={() => tap(item)}
            style={{
              background: wrongFlash === item.origIndex ? "#450a0a" : "#1e293b",
              border: wrongFlash === item.origIndex ? "2px solid #ef4444" : "1px solid #334155",
              borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace",
              fontSize: "0.78rem", color: "#e2e8f0",
            }}>
            {item.s}
          </div>
        ))}
      </div>
    </div>
  );
}
