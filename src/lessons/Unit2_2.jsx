// ============================================================================
//  UNIT 2.2 — "Text, Links & Images"
//  Module: M2 — HTML Foundations
//
//  WHERE THIS FILE FITS IN THE APP:
//  - Loaded dynamically by src/shell/App.jsx the same way every other unit
//    is: App.jsx looks up "Unit2_2" in config/course.config.js, renders this
//    component with { student, onUnitComplete }, and waits for us to call
//    onUnitComplete() exactly once when the student finishes the quiz.
//  - No network code lives here on purpose — App.jsx + api.js own saving
//    progress to the backend (Code.gs). We only teach and signal "done."
//
//  TEACHING DESIGN — same six-stage shape as Unit2_1.jsx / Unit1_2.jsx, kept
//  identical across the whole course so students don't have to re-learn the
//  UI every lesson, only the content changes:
//    Stage 0  SPARK      — curiosity question before any explanation.
//    Stage 1  BUILD      — concept-by-concept, timed unlocks, Plain⇄Tech toggle.
//    Stage 2  SEE IT     — a real mini bio-page built live, one tag at a time.
//    Stage 3  TRY IT     — student clicks the tags into place themselves.
//    Stage 4  CHALLENGE  — two games: tag-matching, then a "spot the bug"
//                           hunt (a NEW game type vs. Unit2_1, added so the
//                           course doesn't feel repetitive across lessons).
//    Stage 5  QUIZ       — wrong answers never reveal the correct option;
//                           the student gets an escalating hint and another
//                           attempt instead, so they keep reasoning actively.
//
//  MOBILE-FRIENDLINESS: same approach as Unit2_1.jsx — flexible widths
//  (%, flex-wrap, minmax(), clamp()) everywhere, no fixed pixel layouts that
//  could overflow a phone screen.
// ============================================================================

import { useState, useEffect, useRef } from "react";

export default function Unit2_2({ student, onUnitComplete }) {
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
  // Building a tiny "bio card" page, one element at a time, in order.
  const [tryitState, setTryitState] = useState({
    heading: false, bio: false, emphasis: false, link: false, image: false,
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
      title: "Headings <h1>…<h6> — A Hierarchy of Importance",
      plain: "Headings are like a book's chapter titles. <h1> is the biggest, most important heading (usually the page's main title), and they get smaller in importance down to <h6>. There should only be ONE <h1> per page.",
      technical: "<h1>–<h6> create a semantic outline of the document. Browsers render them in decreasing size by default, but their real purpose is structural/semantic — screen readers and search engines use heading levels to build a table of contents, so skipping levels (e.g. h1 straight to h4) is poor practice.",
      animation: "headings",
      unlock: 8,
    },
    {
      title: "Paragraphs & Emphasis — <p>, <strong>, <em>",
      plain: "<p> wraps a block of normal text — a paragraph. Inside it you can make a word bold with <strong> (this matters!) or italic with <em> (said with emphasis!) — both are about MEANING, not just looks.",
      technical: "<p> is a block-level element representing a paragraph. <strong> indicates strong importance (renders bold by default) and <em> indicates stress emphasis (renders italic). Prefer these over deprecated purely-visual tags like <b>/<i> when the meaning is semantic rather than just stylistic.",
      animation: "paragraph",
      unlock: 8,
    },
    {
      title: "Anchor Tags <a href=\"…\"> — Linking Pages Together",
      plain: "An anchor tag turns text (or an image) into a clickable link. The href attribute is the destination — where clicking takes you. Without href, <a> does nothing special at all.",
      technical: "<a href=\"URL\">text</a> creates a hyperlink. href can point to another page, a section on the same page (#id), an email (mailto:), or a file. target=\"_blank\" opens the link in a new tab — pair it with rel=\"noopener noreferrer\" for security.",
      animation: "anchor",
      unlock: 9,
    },
    {
      title: "Images <img src=\"…\" alt=\"…\"> — Bringing in Pictures",
      plain: "<img> drops a picture onto the page. src tells the browser WHERE to find the image file. alt is a short text description — it's what screen readers read aloud, and what shows up if the image fails to load.",
      technical: "<img> is a void (self-closing) element. src is required and points to the image resource. alt is required for accessibility (WCAG) — it provides an equivalent text description for assistive technology and is also indexed by search engines for image search.",
      animation: "image",
      unlock: 9,
    },
    {
      title: "Relative vs Absolute Paths — Where Files Actually Live",
      plain: "An absolute path is a full address, like a full postal address (https://example.com/photo.jpg) — it works from anywhere. A relative path is directions FROM where you're standing right now, like 'images/photo.jpg' meaning 'look inside the images folder next to me.'",
      technical: "Absolute URLs include the protocol and domain (https://site.com/img/pic.jpg) and resolve identically regardless of context. Relative paths (img/pic.jpg, ../img/pic.jpg) are resolved against the current document's location — useful for keeping a whole project portable when moving between dev/staging/production domains.",
      animation: "paths",
      unlock: 10,
    },
  ];

  // ── CONTENT: Quiz bank ───────────────────────────────────────────────────
  const quizQuestions = [
    {
      q: "A page should normally have how many <h1> tags?",
      options: ["As many as you like", "Exactly one", "Exactly six", "Zero — h1 is deprecated"],
      answer: 1,
      hints: [
        "Think of <h1> like the title printed on a book's front cover — how many front covers does one book have?",
        "Having multiple <h1>s confuses screen readers and search engines about what the page is actually about.",
        "Best practice: exactly one <h1> per page, used for the single main title.",
      ],
      explanation: "A page should have exactly one <h1> — its single main title. Lower headings (<h2>, <h3>...) organize sections beneath it, like a book's chapters and sub-sections.",
    },
    {
      q: "Why is the alt attribute on <img> considered important, not optional?",
      options: [
        "It makes the image load faster",
        "It changes the image's colour",
        "It gives screen-reader users (and search engines) a text description of the image",
        "It is required only for .png files",
      ],
      answer: 2,
      hints: [
        "Think about someone using a screen reader who can't see the image at all — what do they need instead?",
        "alt is read ALOUD by assistive technology, and shown as fallback text if the image fails to load.",
        "alt provides an accessible text equivalent — essential for visually impaired users and for search engines indexing images.",
      ],
      explanation: "alt gives a text description of an image. Screen readers read it aloud for visually impaired users, browsers show it if the image fails to load, and search engines use it to understand and index the image.",
    },
    {
      q: "Which attribute on <a> actually makes it a clickable link to somewhere?",
      options: ["alt", "src", "href", "class"],
      answer: 2,
      hints: [
        "alt and src both belong to a different tag you learned about in this same lesson — not this one.",
        "This attribute means 'hypertext reference' — it's literally where the H in HTML's cousin word comes from.",
        "href is the destination URL — without it, <a> is just text with no link behaviour.",
      ],
      explanation: "href ('hypertext reference') holds the destination URL. src and alt belong to <img>, not <a> — a common mix-up worth remembering.",
    },
    {
      q: "You're building a personal site and your photo sits in a folder called 'images' right next to your HTML file. Which path correctly loads it?",
      options: ["https://www.images.com/me.jpg", "images/me.jpg", "<img>", "me.jpg/images"],
      answer: 1,
      hints: [
        "This isn't on another website — it's a file sitting right next to your own HTML file, just one folder over.",
        "You don't need a full https:// address for files that live inside your own project.",
        "images/me.jpg is a relative path — 'look inside the images folder next to where I am right now.'",
      ],
      explanation: "Since the image lives in a local 'images' folder alongside the HTML file, a relative path like images/me.jpg is correct — no domain name needed because it's not pointing to a different website.",
    },
    {
      q: "What's the real difference between <strong>important</strong> and just making text bold with CSS?",
      options: [
        "There is no difference at all",
        "<strong> signals real semantic importance (read differently by screen readers); CSS bold is purely visual",
        "<strong> only works inside <head>",
        "CSS bold loads faster than <strong>",
      ],
      answer: 1,
      hints: [
        "Think about a screen reader user who can't see bold text on screen at all — does plain visual styling reach them?",
        "<strong> isn't really about how it LOOKS — it's about what it MEANS.",
        "<strong> conveys semantic importance that assistive technology can announce; styling text bold with CSS alone conveys nothing to a screen reader.",
      ],
      explanation: "<strong> carries semantic meaning — 'this is genuinely important' — which screen readers can announce with a different tone or emphasis. CSS-only bold text is purely visual and invisible to assistive technology that doesn't render visually.",
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

  // ── CONTENT: See-It — building a mini bio page live ─────────────────────
  const seeitSteps = [
    { plain: "We start inside an empty <body>.", tech: "Empty <body></body>.", code: "<body>\n\n</body>" },
    { plain: "Add the page's one big title.", tech: "Add <h1>.", code: "<body>\n  <h1>Aishu's Page</h1>\n</body>" },
    { plain: "Add a short paragraph about yourself.", tech: "Add <p>.", code: "<body>\n  <h1>Aishu's Page</h1>\n  <p>I teach AI/ML and IoT at SRFET.</p>\n</body>" },
    { plain: "Make one word really stand out.", tech: "Wrap a word in <strong>.", code: "<body>\n  <h1>Aishu's Page</h1>\n  <p>I <strong>love</strong> teaching AI/ML and IoT.</p>\n</body>" },
    { plain: "Add a clickable link to your department page.", tech: "Add <a href>.", code: "<body>\n  <h1>Aishu's Page</h1>\n  <p>I <strong>love</strong> teaching AI/ML and IoT.</p>\n  <a href=\"https://srfet.edu\">Visit my department →</a>\n</body>" },
    { plain: "Finally, add a profile picture with a description.", tech: "Add <img src alt>.", code: "<body>\n  <h1>Aishu's Page</h1>\n  <img src=\"profile.jpg\" alt=\"Professor Aishu smiling\">\n  <p>I <strong>love</strong> teaching AI/ML and IoT.</p>\n  <a href=\"https://srfet.edu\">Visit my department →</a>\n</body>" },
  ];

  // ── CONTENT: Challenge 1 — tag-to-job matching ───────────────────────────
  const ch1Pairs = [
    { code: "<h1>", meaning: "The page's single main title" },
    { code: "<a href>", meaning: "Makes text clickable and links elsewhere" },
    { code: "<img alt>", meaning: "Describes an image for screen readers" },
    { code: "<strong>", meaning: "Marks text as genuinely important" },
  ];

  // ── CONTENT: Challenge 2 — bug hunt snippets ─────────────────────────────
  // Each item is a tiny line of "code" — exactly ONE of these four lines has
  // a real bug. Tapping any other line just flashes red (no answer given
  // away) and the student tries again.
  const bugLines = [
    { text: '<img src="cat.jpg" alt="A sleeping cat">', buggy: false },
    { text: '<a href="https://example.com">Visit site</a>', buggy: false },
    { text: '<img src="dog.jpg">', buggy: true, why: "Missing the alt attribute — screen reader users get no description of this image at all." },
    { text: '<p>Welcome to my page!</p>', buggy: false },
  ];

  // ── STYLES (kept identical to Unit2_1.jsx for visual consistency) ───────
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
  };

  const stageNames = ["Spark", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── SPARK ─────────────────────────────────────────────────────────────────
  const renderSpark = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🔗🖼️</div>
        <div style={s.h2}>Two pages. Same words.</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          One page is just a wall of plain grey text. The other has a bold title, clickable blue links, and a photo. Same content, very different experience.
        </div>
        <div style={{ ...s.p, textAlign: "center" }}>
          <strong style={{ color: "#f1f5f9" }}>What three ingredients</strong> turn plain text into that second, richer page?
        </div>
      </div>

      {!sparkSubmitted ? (
        <>
          <div style={s.h3}>Your guess: pick the closest answer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              "Better internet speed makes pages look richer",
              "Heading tags, anchor (link) tags, and image tags",
              "The browser automatically adds colour to long text",
              "You need a separate app, not just a webpage",
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
            {sparkGuess.includes("Heading")
              ? "🎯 Exactly! Headings give structure, anchor tags create links between pages, and image tags bring in pictures. Let's master all three."
              : "The real answer: headings (<h1>…), links (<a href>), and images (<img src alt>) are the three workhorses that turn plain text into a connected, visual page. Let's build one together."}
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
  const renderSeeIt = () => (
    <div style={s.card}>
      <div style={s.h2}>📽️ Watch a Bio Page Get Built</div>
      <div style={s.p}>Step through each addition. Toggle between plain English and technical terms.</div>
      <div style={s.toggleRow}>
        <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
        <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
      </div>
      <div style={s.codeBox}>{seeitSteps[seeitStep].code}</div>
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

  // ── TRY IT ────────────────────────────────────────────────────────────────
  const renderTryIt = () => {
    const steps = [
      { key: "heading", label: "Add your page's main title", action: "Add <h1>Aishu's Page</h1>", icon: "📰" },
      { key: "bio", label: "Add a short bio paragraph", action: "Add <p>About me…</p>", icon: "📝" },
      { key: "emphasis", label: "Make one word stand out", action: "Wrap it in <strong>", icon: "💪" },
      { key: "link", label: "Link to your department site", action: "Add <a href=\"…\">", icon: "🔗" },
      { key: "image", label: "Add a profile photo with alt text", action: "Add <img src alt>", icon: "🖼️" },
    ];
    const doneCount = Object.values(tryitState).filter(Boolean).length;
    const allDone = doneCount === steps.length;

    // Live preview text — actually grows visually like a tiny rendered card.
    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Build Your Own Bio Card</div>
        <div style={s.p}>Click each step in order. Watch the live preview panel fill in.</div>
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
          {/* Live rendered preview card — actually styled like a real bio card,
              not just a code log, so the payoff feels visual/real. */}
          <div style={{ flex: "1 1 200px", background: "#f8fafc", borderRadius: 12, padding: "16px", color: "#0f172a" }}>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 700, marginBottom: 8 }}>LIVE RENDERED PREVIEW</div>
            {tryitState.image && <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: 8 }}>🧑‍🏫</div>}
            {tryitState.heading && <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 6 }}>Aishu's Page</div>}
            {tryitState.bio && (
              <div style={{ fontSize: "0.82rem", lineHeight: 1.5, marginBottom: 6 }}>
                {tryitState.emphasis ? <>I <strong>love</strong> teaching AI/ML and IoT.</> : "I love teaching AI/ML and IoT."}
              </div>
            )}
            {tryitState.link && <div style={{ color: "#2563eb", fontSize: "0.8rem", textDecoration: "underline" }}>Visit my department →</div>}
            {doneCount === 0 && <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>(nothing added yet)</div>}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {steps.map((step, i) => {
            const prevDone = i === 0 ? true : tryitState[steps[i - 1].key];
            if (tryitState[step.key] || !prevDone) return null;
            return <button key={step.key} style={s.btn()} onClick={() => setTryitState((p) => ({ ...p, [step.key]: true }))}>{step.icon} {step.action}</button>;
          })}
        </div>
        {allDone && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8044", borderRadius: 12, padding: "14px", marginTop: 14 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>🎉 You just built a real bio card!</div>
            <div style={s.p}>Every personal site, blog, and product page starts from these exact same five ingredients.</div>
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
          <div style={s.h2}>🐛 Challenge 2: Spot the Bug</div>
          <div style={s.p}>Three of these four lines are perfectly fine. One has a real accessibility bug. Tap the buggy line.</div>
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
          <div style={s.h2}>Unit 2.2 Complete!</div>
          <div style={s.p}>You can now structure text, link pages together, and embed images the right way.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["Headings — a hierarchy of importance", "Paragraphs, <strong> & <em> — meaningful text", "Anchor tags & href — linking pages", "Images, src & alt — pictures + accessibility", "Relative vs absolute paths"].map((l, i) => (
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
        <div style={s.topTitle}>Unit 2.2 — Text, Links & Images</div>
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

  if (type === "headings") {
    const sizes = ["2rem", "1.5rem", "1.2rem", "1rem", "0.85rem", "0.75rem"];
    const idx = Math.floor(pos * 6) % 6;
    return (
      <div style={base}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: sizes[idx], fontWeight: 800, color: "#38bdf8", transition: "font-size 0.2s" }}>Heading Level {idx + 1}</div>
          <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 6 }}>&lt;h{idx + 1}&gt; — {idx === 0 ? "most important" : idx === 5 ? "least important" : "mid-level"}</div>
        </div>
      </div>
    );
  }

  if (type === "paragraph") return (
    <div style={base}>
      <div style={{ fontSize: "0.85rem", color: "#e2e8f0", textAlign: "center" }}>
        I <span style={{ fontWeight: pos > 0.5 ? 800 : 400, color: pos > 0.5 ? "#fbbf24" : "#e2e8f0", transition: "all 0.2s" }}>love</span> teaching.
        <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 6 }}>{pos > 0.5 ? "<strong>love</strong> — semantic importance" : "plain text"}</div>
      </div>
    </div>
  );

  if (type === "anchor") return (
    <div style={base}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          color: "#38bdf8", textDecoration: "underline", fontSize: "0.95rem", cursor: "pointer",
          transform: pos > 0.5 ? "scale(1.08)" : "scale(1)", transition: "transform 0.2s", display: "inline-block",
        }}>Visit my department</div>
        <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 8 }}>href="https://srfet.edu" {pos > 0.5 ? "→ 🌐 navigating…" : ""}</div>
      </div>
    </div>
  );

  if (type === "image") return (
    <div style={base}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 10, background: pos > 0.5 ? "#1a3320" : "#33415544", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 8px" }}>
          {pos > 0.5 ? "🖼️" : "❌"}
        </div>
        <div style={{ fontSize: "0.62rem", color: "#64748b" }}>{pos > 0.5 ? "src found → image shown" : "alt text shown while loading / on failure"}</div>
      </div>
    </div>
  );

  if (type === "paths") return (
    <div style={base}>
      <div style={{ display: "flex", gap: 16, fontSize: "0.7rem" }}>
        <div style={{ textAlign: "center", opacity: pos < 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.4rem" }}>🌍</div>
          <div style={{ color: "#94a3b8" }}>Absolute</div>
          <div style={{ color: "#475569", fontFamily: "monospace", fontSize: "0.6rem" }}>https://site.com/x.jpg</div>
        </div>
        <div style={{ textAlign: "center", opacity: pos >= 0.5 ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: "1.4rem" }}>📁</div>
          <div style={{ color: "#94a3b8" }}>Relative</div>
          <div style={{ color: "#475569", fontFamily: "monospace", fontSize: "0.6rem" }}>images/x.jpg</div>
        </div>
      </div>
    </div>
  );

  return <div style={{ color: "#64748b" }}>Animation</div>;
}

// ── TAG MATCH (same click-to-match game used in Unit2_1.jsx) ─────────────
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
            fontFamily: "monospace", fontSize: "0.78rem", color: matched[p.code] ? "#4ade80" : "#e2e8f0",
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

// ── BUG HUNT (new game type for this lesson) ─────────────────────────────
// Shows a handful of code lines, exactly one of which is genuinely broken.
// Tapping a correct (non-buggy) line just flashes a neutral "not this one"
// nudge; tapping the buggy line reveals WHY it's wrong and completes the
// challenge. This trains the same "spot the real-world mistake" skill a
// developer uses every day reviewing their own markup.
function BugHunt({ lines, onDone }) {
  const [revealed, setRevealed] = useState(false);
  const [wrongTap, setWrongTap] = useState(null);

  function tap(line, i) {
    if (revealed) return;
    if (line.buggy) {
      setRevealed(true);
      onDone();
    } else {
      setWrongTap(i);
      setTimeout(() => setWrongTap(null), 600);
    }
  }

  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} onClick={() => tap(line, i)} style={{
          background: revealed && line.buggy ? "#14532d33" : wrongTap === i ? "#450a0a" : "#0f172a",
          border: revealed && line.buggy ? "1px solid #4ade8044" : wrongTap === i ? "2px solid #ef4444" : "1px solid #334155",
          borderRadius: 10, padding: "10px 14px", marginBottom: 8, cursor: revealed ? "default" : "pointer",
          fontFamily: "monospace", fontSize: "0.78rem", color: revealed && line.buggy ? "#4ade80" : "#e2e8f0",
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
