// ============================================================================
//  UNIT 2.4 — "Semantic HTML"
//  Module: M2 — HTML Foundations (final unit of this module)
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded by src/shell/App.jsx exactly like every sibling lesson: App.jsx
//    looks up "Unit2_4" in config/course.config.js, renders this component
//    with { student, onUnitComplete }, and waits for a single call to
//    onUnitComplete() (fired at the end of the quiz) before it saves
//    progress and unlocks Module 3 (CSS Styling).
//  - We never import api.js or gas.config.js — App.jsx is the only thing
//    that talks to the backend, by design (see ADDING_NEW_LESSON.md).
//
//  TEACHING DESIGN — same six-stage shell used across the whole module
//  (Unit2_1.jsx, Unit2_2.jsx, Unit2_3.jsx) so the course feels consistent:
//    Stage 0  SPARK      — curiosity question before any explanation.
//    Stage 1  BUILD      — five concepts, timed unlocks, Plain⇄Tech toggle.
//    Stage 2  SEE IT     — a real semantic page skeleton assembled live,
//                           rendered as an actual visual landmark diagram
//                           (not just code) so the "shape" of a semantic
//                           page becomes intuitive at a glance.
//    Stage 3  TRY IT     — student clicks the landmark regions into place
//                           themselves and watches a live layout diagram
//                           fill in, region by region.
//    Stage 4  CHALLENGE  — tag-matching, then a "spot the bug" hunt where
//                           the bug is a missed opportunity to use a
//                           semantic tag instead of a generic <div>.
//    Stage 5  QUIZ       — wrong answers never reveal the correct option;
//                           escalating hints + repeat attempts instead.
//
//  MOBILE-FRIENDLINESS: identical approach to the rest of the module —
//  flexible widths (%, flex-wrap, minmax(), clamp()) everywhere, and the
//  landmark diagrams stack vertically instead of overflowing on narrow
//  screens (flex-wrap + min-width on each region box).
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit2_4({ student, onUnitComplete }) {
  // ── STAGE / FLOW STATE ──────────────────────────────────────────────────
  const [stage, setStage] = useState(0); // 0=Spark 1=Build 2=SeeIt 3=TryIt 4=Challenge 5=Quiz

  // ── SPARK ───────────────────────────────────────────────────────────────
  const [sparkGuess, setSparkGuess] = useState("");
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // ── BUILD ───────────────────────────────────────────────────────────────
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // ── SEE IT ──────────────────────────────────────────────────────────────
  const [seeitMode, setSeeitMode] = useState("plain");
  const [seeitStep, setSeeitStep] = useState(0);

  // ── TRY IT ──────────────────────────────────────────────────────────────
  // Assembling a full semantic page skeleton, one landmark region at a time.
  const [tryitState, setTryitState] = useState({
    header: false, nav: false, main: false, article: false, aside: false, footer: false,
  });

  // ── CHALLENGE ───────────────────────────────────────────────────────────
  const [challengePhase, setChallengePhase] = useState(0); // 0 = tag match, 1 = bug hunt
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Done, setCh2Done] = useState(false);

  // ── QUIZ ────────────────────────────────────────────────────────────────
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);

  // ── shared timers ───────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  // ── CONTENT: five core concepts for Build stage ──────────────────────────
  const concepts = [
    {
      title: "What \"Semantic\" Actually Means",
      plain: "A <div> is like an unlabeled cardboard box — it holds stuff, but doesn't say what's inside. A semantic tag like <nav> is a LABELED box — anyone (or anything, like a screen reader) instantly knows it holds navigation links, just from the name.",
      technical: "Semantic elements describe their MEANING/role in the document, not just their appearance. <div> and <span> are purely generic containers with zero inherent meaning — semantic tags (<header>, <nav>, <main>, etc.) communicate structure to browsers, assistive technology, and search engines alike.",
      animation: "semantic",
      unlock: 8,
    },
    {
      title: "<header> & <nav> — The Top of the Page",
      plain: "<header> is the introductory area at the top — usually a logo and title. <nav> is specifically the box of navigation links (Home, About, Contact) — and a page can have more than one <nav> if needed (e.g. main menu + footer menu).",
      technical: "<header> typically contains introductory content or navigational aids for its nearest sectioning ancestor. <nav> wraps major navigation links. Screen readers let users jump directly to a <nav> landmark, skipping repetitive content — something a generic <div> can never offer.",
      animation: "headernav",
      unlock: 9,
    },
    {
      title: "<main>, <section> & <article> — The Real Content",
      plain: "<main> is the one big area holding the page's actual unique content — there should only be ONE per page. Inside it, <section> groups related content together (like 'About Us'), and <article> is content that could stand alone, like a single blog post or news story.",
      technical: "<main> represents the dominant content of the <body>, unique to this page (excludes repeated headers/sidebars/footers) — exactly one per page. <section> groups thematically related content, typically with its own heading. <article> represents independently distributable/reusable content (a blog post, forum post, news story).",
      animation: "mainsection",
      unlock: 10,
    },
    {
      title: "<aside> & <footer> — Supporting & Closing Content",
      plain: "<aside> is content that's related but tangential — like a sidebar of 'related articles' or an ad. <footer> is the bottom-of-page area — copyright text, contact links, social icons.",
      technical: "<aside> represents content indirectly related to the surrounding content — sidebars, pull quotes, advertising. <footer> typically contains authorship info, copyright, links to related documents — it can appear at the page level or within a <section>/<article>.",
      animation: "asidefooter",
      unlock: 9,
    },
    {
      title: "Why It Matters — Accessibility & SEO",
      plain: "Screen readers let blind users jump straight to 'navigation' or 'main content' — but only if you actually used <nav> and <main> instead of plain <div>s. Search engines like Google also read your semantic structure to better understand (and rank) your page.",
      technical: "Assistive technology builds a landmark map of the page from semantic elements, letting users navigate by region rather than scrolling/tabbing through everything. Search engine crawlers use the same structure to weight content (e.g. <article> content is treated as primary, <aside>/<footer> as secondary) — a real, measurable SEO benefit, not just a 'best practice' platitude.",
      animation: "whyitmatters",
      unlock: 10,
    },
  ];

  // ── CONTENT: Quiz bank ───────────────────────────────────────────────────
  const quizQuestions = [
    {
      q: "What is the core difference between <div> and a semantic tag like <nav>?",
      options: [
        "<div> renders faster than <nav>",
        "<nav> can only contain text, <div> can contain anything",
        "<nav> communicates its MEANING/role to browsers, assistive tech, and search engines — <div> communicates nothing",
        "There is no real difference, just personal style",
      ],
      answer: 2,
      hints: [
        "Think about a screen reader user trying to jump straight to the navigation menu — could it find a <div> the same way?",
        "One of these tags is a labeled box; the other is a totally generic, unlabeled box.",
        "<nav> tells screen readers, browsers, and search engines 'this region is navigation' — <div> carries no such meaning at all.",
      ],
      explanation: "Semantic tags like <nav> communicate their actual role in the page to assistive technology and search engines. A <div> is purely generic — it works visually but conveys zero structural meaning.",
    },
    {
      q: "How many <main> elements should a single page have?",
      options: ["As many as needed", "Exactly one", "Exactly two — one for desktop, one for mobile", "Zero, <main> is deprecated"],
      answer: 1,
      hints: [
        "<main> is meant to represent THE dominant, unique content area of this specific page.",
        "If there were several, assistive tech wouldn't know which one is 'the' main content.",
        "Exactly one <main> per page — it should wrap the unique content, excluding repeated headers/footers/sidebars.",
      ],
      explanation: "A page should contain exactly one <main> element, representing its single dominant content area. Having more than one would confuse both assistive technology and the semantic structure of the page.",
    },
    {
      q: "You're marking up a single blog post that could be shared and read entirely on its own. Which tag fits best?",
      options: ["<aside>", "<nav>", "<article>", "<footer>"],
      answer: 2,
      hints: [
        "Ask: could this content be lifted out and published independently elsewhere and still make complete sense?",
        "This tag specifically represents self-contained, independently distributable content.",
        "<article> is exactly for standalone content like a single blog post, news story, or forum post.",
      ],
      explanation: "<article> represents independently distributable content — a single blog post is the textbook example, since it makes complete sense read entirely on its own, outside the context of the rest of the page.",
    },
    {
      q: "A sidebar showing 'related articles' that aren't essential to understanding the main content — which tag fits?",
      options: ["<main>", "<aside>", "<header>", "<section>"],
      answer: 1,
      hints: [
        "This content is related, but not central — it's more of a side note than the main point.",
        "Think of a printed magazine's sidebar callout box next to the main article.",
        "<aside> is for tangentially related content like sidebars, pull quotes, or 'related articles' widgets.",
      ],
      explanation: "<aside> represents content that's related but not essential to the main flow — exactly the role a 'related articles' sidebar plays.",
    },
    {
      q: "Besides looking the same on screen, what's a CONCRETE benefit of using semantic tags over an all-<div> layout?",
      options: [
        "Pages load measurably faster purely from tag names",
        "Screen-reader users can jump directly between landmark regions (nav, main, footer), and search engines better understand which content is primary",
        "Semantic tags automatically add colour and styling",
        "Browsers refuse to render pages built only with <div>",
      ],
      answer: 1,
      hints: [
        "Think about two different audiences who 'read' your page without looking at it visually at all: one is a person, one is a piece of software.",
        "Both of those audiences rely on the page's underlying structure, not its visual appearance, to make sense of it.",
        "Semantic structure lets assistive technology offer landmark-based navigation, and lets search engines weight content (article vs sidebar) more accurately — both are concrete, measurable benefits, not just aesthetics.",
      ],
      explanation: "Semantic HTML provides real benefits beyond appearance: screen readers expose landmark navigation (jump to nav, jump to main, etc.) only when real semantic tags are used, and search engines use the same structure to better understand which content is primary versus secondary.",
    },
  ];

  // ── Concept unlock timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 1) return;
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
    return () => clearInterval(timerRef.current);
  }, [buildConcept, stage]);

  // ── Looping animation frame ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => setAnimFrame((f) => (f + 1) % 60), 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  // ── CONTENT: See-It — assembling a semantic page skeleton live ──────────
  const seeitSteps = [
    { plain: "We start with an empty <body>.", tech: "Empty <body></body>.", code: "<body>\n\n</body>", regions: [] },
    { plain: "Add the page header with a logo/title.", tech: "Add <header>.", code: "<body>\n  <header>My Site</header>\n</body>", regions: ["header"] },
    { plain: "Add the navigation menu inside it.", tech: "Add <nav> inside <header>.", code: "<body>\n  <header>\n    My Site\n    <nav>Home · About · Contact</nav>\n  </header>\n</body>", regions: ["header", "nav"] },
    { plain: "Add the main content area with an article.", tech: "Add <main> with <article>.", code: "<body>\n  <header>...</header>\n  <main>\n    <article>Blog post content…</article>\n  </main>\n</body>", regions: ["header", "nav", "main", "article"] },
    { plain: "Add a sidebar of related links.", tech: "Add <aside>.", code: "<body>\n  <header>...</header>\n  <main><article>...</article></main>\n  <aside>Related posts…</aside>\n</body>", regions: ["header", "nav", "main", "article", "aside"] },
    { plain: "Finally, add the footer.", tech: "Add <footer>.", code: "<body>\n  <header>...</header>\n  <main><article>...</article></main>\n  <aside>...</aside>\n  <footer>© 2026 My Site</footer>\n</body>", regions: ["header", "nav", "main", "article", "aside", "footer"] },
  ];

  // ── CONTENT: Challenge 1 — tag-to-job matching ───────────────────────────
  const ch1Pairs = [
    { code: "<nav>", meaning: "Wraps the page's navigation links" },
    { code: "<main>", meaning: "The one unique content area (only one per page)" },
    { code: "<article>", meaning: "Self-contained content like a single blog post" },
    { code: "<aside>", meaning: "Related but non-essential sidebar content" },
  ];

  // ── CONTENT: Challenge 2 — bug hunt: spot the missed semantic opportunity
  const bugLines = [
    { text: '<nav>Home · About · Contact</nav>', buggy: false },
    { text: '<div class="header">My Site Logo</div>', buggy: true, why: "This is really the page header — it should be <header>, not a generic <div class=\"header\">. The class name LOOKS semantic but the tag itself carries no real meaning to screen readers or search engines." },
    { text: '<footer>© 2026 My Site</footer>', buggy: false },
    { text: '<article>Full blog post text…</article>', buggy: false },
  ];

  // ── STYLES (kept identical across the module for visual consistency) ───
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8 },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(0.78rem,2.5vw,0.95rem)" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: (active, done) => ({
      padding: "3px 9px", borderRadius: 99, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none", whiteSpace: "nowrap",
    }),
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px 12px", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    animBox: { background: "#0f172a", borderRadius: 12, minHeight: 150, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", padding: 10 },
    codeBox: { background: "#070b14", borderRadius: 10, padding: "14px", fontFamily: "'Cascadia Code','Consolas',monospace", fontSize: "0.78rem", color: "#7dd3fc", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto", lineHeight: 1.6 },
    checkRow: (done) => ({ background: done ? "#14532d33" : "#1e293b", border: done ? "1px solid #4ade8044" : "1px solid #334155", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s" }),
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9", transition: "all 0.2s",
    }),
    // A box representing one landmark region in the visual layout diagram
    // used in See-It and Try-It — colour-coded per region so the same
    // colour always means the same landmark across both stages.
    regionBox: (color, present) => ({
      background: present ? color + "22" : "#0f172a",
      border: present ? `2px solid ${color}` : "1px dashed #334155",
      borderRadius: 8, padding: "10px 12px", fontSize: "0.72rem", fontWeight: 700,
      color: present ? color : "#475569", textAlign: "center", flex: "1 1 90px", minWidth: 80,
      transition: "all 0.3s",
    }),
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // Region → colour map shared by See-It and Try-It diagrams.
  const REGION_COLORS = { header: "#38bdf8", nav: "#a78bfa", main: "#4ade80", article: "#4ade80", aside: "#fb923c", footer: "#f472b6" };

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>👁️‍🗨️</div>
        <div style={s.h2}>Two pages. Pixel-identical. Built completely differently.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          Page A is built entirely from unlabeled &lt;div&gt; boxes. Page B uses &lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;aside&gt;, &lt;footer&gt;. Visually, on screen, they look exactly the same.
        </div>
        <div style={{ ...s.p, textAlign: "center" }}>
          <strong style={{ color: "#f1f5f9" }}>So who — or what — would actually notice the difference?</strong>
        </div>
      </div>
      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Nobody — if it looks the same, it IS the same",
              "Screen readers and search engines — they 'read' structure, not just pixels",
              "Only people using Internet Explorer would notice",
              "Only the page's CSS file would notice",
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
            {sparkGuess.includes("Screen readers")
              ? "🎯 Exactly right! Sighted users browsing normally may never notice — but screen readers and search engine crawlers 'read' the underlying tag structure, not the pixels. Semantic tags give them real, usable meaning."
              : "The real answer: screen readers and search engines both rely on the underlying tag structure — not the visual pixels — to understand a page. A sighted user might never notice, but assistive technology and SEO absolutely do."}
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
          <button key={i} disabled={!conceptUnlocked[i]} onClick={() => { setBuildConcept(i); setBuildMode("plain"); }} style={{
            flexShrink: 0, padding: "6px 12px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: "0.72rem",
            cursor: conceptUnlocked[i] ? "pointer" : "not-allowed",
            background: buildConcept === i ? "#38bdf8" : conceptUnlocked[i] ? "#1e293b" : "#0f172a",
            color: buildConcept === i ? "#0f172a" : conceptUnlocked[i] ? "#e2e8f0" : "#334155",
          }}>{conceptUnlocked[i] ? `${i + 1}. ${c.title.split("—")[0].trim()}` : `🔒 Concept ${i + 1}`}</button>
        ))}
      </div>
      <div style={s.card}>
        <div style={s.h3}>{concepts[buildConcept].title}</div>
        <div style={s.animBox}><ConceptAnimation type={concepts[buildConcept].animation} frame={animFrame} /></div>
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
              : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
          <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
        </div>
      </div>
    </div>
  );

  // ── SEE IT ────────────────────────────────────────────────────────────────
  const renderSeeIt = () => {
    const regions = seeitSteps[seeitStep].regions;
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch a Semantic Page Skeleton Get Built</div>
        <div style={s.p}>Step through each addition. Toggle between plain English and technical terms.</div>
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.codeBox}>{seeitSteps[seeitStep].code}</div>

        {/* Visual landmark diagram mirroring the code above — this is the
            real point of Semantic HTML made tangible: a labeled-region
            layout, not just a wall of markup. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
          {["header", "nav", "main", "article", "aside", "footer"].map((r) => (
            <div key={r} style={s.regionBox(REGION_COLORS[r], regions.includes(r))}>{r}</div>
          ))}
        </div>

        <div style={{ margin: "14px 0" }}>
          {seeitSteps.map((step, i) => (
            <div key={i} onClick={() => setSeeitStep(i)} style={{
              background: seeitStep === i ? "#0f2942" : i < seeitStep ? "#14532d22" : "#0f172a",
              border: seeitStep === i ? "2px solid #38bdf8" : i < seeitStep ? "1px solid #4ade8044" : "1px solid #334155",
              borderRadius: 10, padding: "11px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: "0.75rem", color: i < seeitStep ? "#4ade80" : seeitStep === i ? "#38bdf8" : "#475569", fontWeight: 700 }}>
                  {i < seeitStep ? "✅" : seeitStep === i ? "▶" : `${i + 1}.`}
                </span>
                <span style={{ fontSize: "0.83rem", color: seeitStep === i ? "#f1f5f9" : "#94a3b8" }}>{seeitMode === "plain" ? step.plain : step.tech}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {seeitStep < seeitSteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>}
          {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
        </div>
      </div>
    );
  };

  // ── TRY IT ────────────────────────────────────────────────────────────────
  const renderTryIt = () => {
    const steps = [
      { key: "header", label: "Add the page <header>", action: "Add <header>", icon: "🔷" },
      { key: "nav", label: "Add the <nav> menu inside it", action: "Add <nav>", icon: "🧭" },
      { key: "main", label: "Open the <main> content area", action: "Add <main>", icon: "📄" },
      { key: "article", label: "Add a standalone <article>", action: "Add <article>", icon: "📰" },
      { key: "aside", label: "Add a related-content <aside>", action: "Add <aside>", icon: "📌" },
      { key: "footer", label: "Add the page <footer>", action: "Add <footer>", icon: "⬛" },
    ];
    const doneCount = Object.values(tryitState).filter(Boolean).length;
    const allDone = doneCount === steps.length;

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Assemble a Semantic Page Yourself</div>
        <div style={s.p}>Click each landmark region into place, in order, and watch the live layout diagram fill in.</div>
        <div style={{ height: 6, background: "#1e293b", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(doneCount / steps.length) * 100}%`, background: "linear-gradient(90deg,#38bdf8,#4ade80)", transition: "width 0.4s", borderRadius: 99 }} />
        </div>

        {/* Live landmark diagram — same colour-coding as See-It, so the
            student carries the mental map between stages. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {steps.map((step) => (
            <div key={step.key} style={s.regionBox(REGION_COLORS[step.key], tryitState[step.key])}>
              {tryitState[step.key] ? "✅ " : ""}{step.key}
            </div>
          ))}
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
          <div style={{ flex: "1 1 160px", background: "#0f172a", borderRadius: 12, padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>NEXT ACTION</div>
            {steps.map((step, i) => {
              const prevDone = i === 0 ? true : tryitState[steps[i - 1].key];
              if (tryitState[step.key] || !prevDone) return null;
              return <button key={step.key} style={s.btn()} onClick={() => setTryitState((p) => ({ ...p, [step.key]: true }))}>{step.icon} {step.action}</button>;
            })}
            {allDone && <div style={{ color: "#4ade80", fontSize: "0.8rem", fontWeight: 700 }}>✅ All regions placed!</div>}
          </div>
        </div>

        {allDone && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8044", borderRadius: 12, padding: "14px", marginTop: 14 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>🎉 You just built a fully semantic page layout!</div>
            <div style={s.p}>A screen reader user could now jump straight to "navigation," "main content," or "footer" — none of that landmark navigation works on an all-&lt;div&gt; page.</div>
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
          {ch1Done && <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🐛 Challenge 2: Spot the Missed Opportunity</div>
          <div style={s.p}>Three of these four lines correctly use semantic tags. One uses a generic &lt;div&gt; where a real semantic tag would be better. Tap it.</div>
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
          <div style={s.h2}>Unit 2.4 Complete — Module 2 Finished! 🎓</div>
          <div style={s.p}>You now know how to give a page real, meaningful structure — not just a visual layout, but one that actually communicates to assistive technology and search engines.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["What \"semantic\" really means", "<header> & <nav> — top-of-page landmarks", "<main>, <section> & <article> — real content", "<aside> & <footer> — supporting content", "Why it matters — accessibility & SEO"].map((l, i) => (
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
            <div key={i} style={s.quizOption(isSelected, isCorrect, isWrong)} onClick={() => { if (!quizFeedback || quizFeedback === "wrong") { setQuizSelected(i); setQuizFeedback(null); } }}>
              {opt}
            </div>
          );
        })}
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
            <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
              if (quizSelected === q.answer) { setQuizFeedback("correct"); }
              else {
                const newAttempts = quizAttempts + 1;
                setQuizAttempts(newAttempts);
                setQuizFeedback("wrong");
                setHintsShown(Math.min(newAttempts, q.hints.length));
                setQuizSelected(null);
              }
            }}>Check Answer</button>
          )}
          {quizFeedback === "correct" && (
            <button style={s.btn("#4ade80")} onClick={() => {
              if (quizQ + 1 < quizQuestions.length) { setQuizQ(quizQ + 1); setQuizSelected(null); setQuizFeedback(null); setQuizAttempts(0); setHintsShown(0); }
              else { setQuizDone(true); }
            }}>{quizQ + 1 < quizQuestions.length ? "Next Question →" : "Finish Quiz 🎉"}</button>
          )}
        </div>
      </div>
    );
  };

  // ── TOP-LEVEL RENDER ──────────────────────────────────────────────────────
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 2.4 — Semantic HTML</div>
        <div style={s.stagePills}>{stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}</div>
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
function ConceptAnimation({ type, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  if (type === "semantic") return (
    <div style={base}>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 36, background: "#33415544", border: "1px dashed #64748b", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#64748b" }}>?</div>
          <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 4 }}>&lt;div&gt;</div>
        </div>
        <div style={{ fontSize: "1.3rem", alignSelf: "center", opacity: pos > 0.5 ? 1 : 0.3 }}>→</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 36, background: "#1e3a5f", border: "1px solid #38bdf8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#38bdf8" }}>🧭</div>
          <div style={{ fontSize: "0.62rem", color: "#38bdf8", marginTop: 4 }}>&lt;nav&gt;</div>
        </div>
      </div>
    </div>
  );

  if (type === "headernav") return (
    <div style={base}>
      <div style={{ width: "85%", background: "#0d1b2e", border: "2px solid #38bdf8", borderRadius: 8, padding: 8 }}>
        <div style={{ fontSize: "0.65rem", color: "#38bdf8", fontWeight: 700, marginBottom: 4 }}>&lt;header&gt;</div>
        <div style={{ background: pos > 0.4 ? "#1a1530" : "#1a253544", border: pos > 0.4 ? "1px solid #a78bfa" : "1px dashed #334155", borderRadius: 6, padding: "4px 8px", fontSize: "0.6rem", color: pos > 0.4 ? "#a78bfa" : "#475569" }}>
          &lt;nav&gt; Home · About · Contact &lt;/nav&gt;
        </div>
      </div>
    </div>
  );

  if (type === "mainsection") {
    const idx = Math.floor(pos * 2) % 2;
    return (
      <div style={base}>
        <div style={{ width: "85%", background: "#0d2818", border: "2px solid #4ade80", borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: "0.65rem", color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>&lt;main&gt;</div>
          <div style={{ background: "#102a1c", borderRadius: 6, padding: "4px 8px", fontSize: "0.6rem", color: idx === 0 ? "#4ade80" : "#3f6048", border: idx === 0 ? "1px solid #4ade80" : "1px dashed #334155" }}>
            &lt;article&gt; one blog post &lt;/article&gt;
          </div>
        </div>
      </div>
    );
  }

  if (type === "asidefooter") return (
    <div style={base}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "85%" }}>
        <div style={{ background: pos < 0.5 ? "#2d1b00" : "#1a150c", border: pos < 0.5 ? "1px solid #fb923c" : "1px dashed #334155", borderRadius: 6, padding: "4px 8px", fontSize: "0.6rem", color: pos < 0.5 ? "#fb923c" : "#5c4a36" }}>&lt;aside&gt; related posts &lt;/aside&gt;</div>
        <div style={{ background: pos >= 0.5 ? "#3b0d2a" : "#1a0c16", border: pos >= 0.5 ? "1px solid #f472b6" : "1px dashed #334155", borderRadius: 6, padding: "4px 8px", fontSize: "0.6rem", color: pos >= 0.5 ? "#f472b6" : "#5c2d44" }}>&lt;footer&gt; © 2026 &lt;/footer&gt;</div>
      </div>
    </div>
  );

  if (type === "whyitmatters") return (
    <div style={base}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ textAlign: "center", opacity: pos < 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.5rem" }}>🦮</div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>Screen reader</div>
          <div style={{ fontSize: "0.55rem", color: "#475569" }}>jumps to "navigation"</div>
        </div>
        <div style={{ textAlign: "center", opacity: pos >= 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.5rem" }}>🔍</div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>Search engine</div>
          <div style={{ fontSize: "0.55rem", color: "#475569" }}>weighs &lt;article&gt; higher</div>
        </div>
      </div>
    </div>
  );

  return <div style={{ color: "#64748b" }}>Animation</div>;
}

// ── TAG MATCH (shared game pattern, reused across the module) ───────────
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>TAGS</div>
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
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>JOBS</div>
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

// ── BUG HUNT (shared game pattern, reused from Unit2_2.jsx) ──────────────
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
