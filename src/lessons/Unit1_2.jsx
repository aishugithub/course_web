import { useState, useEffect, useRef } from "react";

export default function Unit1_2({ student, onUnitComplete }) {
  const [stage, setStage] = useState(0); // 0=Hook, 1=Build, 2=SeeIt, 3=TryIt, 4=Challenge, 5=Quiz
  const [hookGuess, setHookGuess] = useState("");
  const [hookSubmitted, setHookSubmitted] = useState(false);
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [conceptTimer, setConceptTimer] = useState(0);
  const [seeitMode, setSeeitMode] = useState("plain");
  const [seeitStep, setSeeitStep] = useState(0);
  const [tryitState, setTryitState] = useState({
    typed: false, dnsLookup: false, tcpConnect: false, httpSent: false, responseBack: false
  });
  const [challengePhase, setChallengePhase] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");
  const [ch1Answers, setCh1Answers] = useState({});
  const [ch1Done, setCh1Done] = useState(false);
  const [ch2Answers, setCh2Answers] = useState([]);
  const [ch2Done, setCh2Done] = useState(false);
  const [quizQ, setQuizQ] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const [animFrame, setAnimFrame] = useState(0);

  const concepts = [
    {
      title: "HTTP — The Language of the Web",
      plain: "When your browser wants a webpage, it asks in a special language called HTTP. Think of it like calling a restaurant — you speak Tamil, they speak Tamil, so you both understand each other.",
      technical: "HTTP (HyperText Transfer Protocol) is the application-layer protocol that defines how clients (browsers) send requests and servers send responses.",
      animation: "http",
      unlock: 8,
    },
    {
      title: "HTTPS — The Secure Version",
      plain: "HTTPS is HTTP with a lock on it. Imagine you're passing a secret note to a friend — but you put it in a sealed envelope first so no one in between can read it.",
      technical: "HTTPS adds TLS (Transport Layer Security) encryption on top of HTTP. Data is encrypted end-to-end, preventing man-in-the-middle attacks.",
      animation: "https",
      unlock: 8,
    },
    {
      title: "DNS — The Internet's Phone Book",
      plain: "You type 'youtube.com' but computers only understand numbers. DNS is like a contact list — it converts 'youtube.com' into '142.250.195.174' so your computer knows where to go.",
      technical: "DNS (Domain Name System) resolves human-readable domain names into IP addresses. Your device queries a DNS resolver, which traverses the hierarchy: root → TLD → authoritative nameserver.",
      animation: "dns",
      unlock: 10,
    },
    {
      title: "Request & Response — The Conversation",
      plain: "Your browser sends a REQUEST ('give me the YouTube homepage') and the server sends back a RESPONSE ('here it is!'). Like asking a librarian for a book and they hand it to you.",
      technical: "An HTTP request contains a method (GET/POST), URL, headers, and optional body. The server returns a response with a status code, headers, and the resource body (HTML/JSON/etc).",
      animation: "reqres",
      unlock: 8,
    },
    {
      title: "Status Codes — Server's Reply Card",
      plain: "Every response carries a number. 200 means 'here you go!', 404 means 'sorry, I can't find that', 500 means 'something broke on my end'. Like a delivery status — Out for Delivery, Delivered, Failed.",
      technical: "HTTP status codes: 2xx (success), 3xx (redirection), 4xx (client error — e.g. 404 Not Found), 5xx (server error — e.g. 500 Internal Server Error).",
      animation: "status",
      unlock: 8,
    },
  ];

  const quizQuestions = [
    {
      q: "You type 'google.com' in your browser. Which technology converts this name into an IP address?",
      options: ["HTTP", "DNS", "TCP", "HTTPS"],
      answer: 1,
      hints: [
        "Think of it like a phone contact list — you store a name, it gives you the number.",
        "It's a 'system' that handles 'names' of 'domains'... the first letters are D, N, S.",
        "DNS — Domain Name System — is the internet's phone book that converts names to IP addresses.",
      ],
      explanation: "DNS (Domain Name System) acts like a contact list. It converts 'google.com' into an IP address like '142.250.195.174' so your computer knows exactly where to connect.",
    },
    {
      q: "Your browser sends a message to a server asking for a webpage. What is this message called?",
      options: ["A Response", "A Packet", "A Request", "A Status Code"],
      answer: 2,
      hints: [
        "Think of the conversation between you and a librarian — you ask first, they reply.",
        "The thing YOU send is the first part of the conversation. The server's reply is the other part.",
        "When YOU ask for something, that's a REQUEST. The server's reply is the RESPONSE.",
      ],
      explanation: "In HTTP, the browser always sends a REQUEST first. The server then sends back a RESPONSE. This back-and-forth is the request-response cycle.",
    },
    {
      q: "A website shows you error '404'. What does this mean?",
      options: ["Server crashed", "Page not found", "Connection is secure", "Request was successful"],
      answer: 1,
      hints: [
        "Think of it like a delivery that fails because the address doesn't exist.",
        "4xx codes are CLIENT errors — meaning the problem is with what you asked for.",
        "404 specifically means 'Not Found' — the server couldn't find the page you requested.",
      ],
      explanation: "404 is an HTTP status code meaning 'Not Found'. The server understood your request but couldn't find the page. 4xx codes are client-side errors — something was wrong with what you asked for.",
    },
    {
      q: "What is the difference between HTTP and HTTPS?",
      options: [
        "HTTPS is faster than HTTP",
        "HTTPS works only on mobile",
        "HTTPS encrypts the data, HTTP does not",
        "HTTP is newer than HTTPS",
      ],
      answer: 2,
      hints: [
        "The 'S' in HTTPS stands for something that protects your data.",
        "Think of HTTP as a postcard anyone can read, and HTTPS as a sealed envelope.",
        "The 'S' stands for Secure — HTTPS uses TLS encryption so no one in the middle can read your data.",
      ],
      explanation: "HTTPS adds TLS encryption to HTTP. Your data is encrypted before sending, so even if someone intercepts it, they can't read it. Always look for the 🔒 in your browser!",
    },
  ];

  // Concept timer unlock
  useEffect(() => {
    if (stage !== 1) return;
    const c = concepts[buildConcept];
    setConceptTimer(c.unlock);
    timerRef.current = setInterval(() => {
      setConceptTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setConceptUnlocked(prev => {
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

  // See It + Build animation ticker
  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    animRef.current = setInterval(() => {
      setAnimFrame(f => (f + 1) % 60);
    }, 100);
    return () => clearInterval(animRef.current);
  }, [stage]);

  const seeitSteps = [
    { plain: "You type 'youtube.com' and hit Enter.", tech: "Browser initiates a DNS resolution request for 'youtube.com'." },
    { plain: "Your computer asks a DNS server: 'What's youtube.com's phone number?'", tech: "DNS resolver queries root nameserver → .com TLD → YouTube's authoritative nameserver." },
    { plain: "DNS replies: 'It's 142.250.195.174!'", tech: "Authoritative nameserver returns A record: 142.250.195.174" },
    { plain: "Your browser connects to YouTube's server and says: 'Please send me your homepage.'", tech: "Browser sends: GET / HTTP/1.1 Host: youtube.com" },
    { plain: "YouTube's server replies: '200 OK — here's the page!'", tech: "Server responds: HTTP/1.1 200 OK Content-Type: text/html [HTML body]" },
    { plain: "Your browser paints the page on your screen!", tech: "Browser parses HTML, requests CSS/JS/images, renders the DOM." },
  ];

  const ch1Pairs = [
    { code: "200", meaning: "OK – Request succeeded" },
    { code: "404", meaning: "Not Found" },
    { code: "500", meaning: "Server Error" },
    { code: "301", meaning: "Moved Permanently" },
  ];

  const ch2Steps = [
    "DNS Lookup",
    "TCP Connection",
    "HTTP Request Sent",
    "Server Processes",
    "HTTP Response",
    "Browser Renders",
  ];
  const ch2Correct = [0, 1, 2, 3, 4, 5];

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "0.95rem" },
    stagePills: { display: "flex", gap: 6 },
    pill: (active, done) => ({
      padding: "3px 10px", borderRadius: 99, fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none",
    }),
    card: { background: "#1e293b", borderRadius: 16, padding: "24px 20px", margin: "20px 16px", border: "1px solid #334155" },
    h2: { fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "1rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({
      background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 22px",
      fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", marginTop: 10,
    }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 20px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", marginTop: 10 },
    input: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", padding: "11px 14px", fontSize: "0.88rem", marginBottom: 10 },
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }),
    conceptCard: (active) => ({
      background: active ? "#0f2942" : "#1a2535", borderRadius: 12, padding: "16px", marginBottom: 10,
      border: active ? "2px solid #38bdf8" : "1px solid #334155", transition: "all 0.3s",
    }),
    toggleRow: { display: "flex", gap: 8, marginBottom: 16 },
    toggleBtn: (active) => ({
      flex: 1, padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
      background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b",
    }),
    seeitBox: { background: "#0f172a", borderRadius: 12, padding: "18px", marginBottom: 12, border: "1px solid #334155" },
    animBox: { background: "#0f172a", borderRadius: 12, height: 160, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
    checkRow: (done) => ({
      background: done ? "#14532d33" : "#1e293b", border: done ? "1px solid #4ade8044" : "1px solid #334155",
      borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10,
      transition: "all 0.3s",
    }),
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.86rem",
      color: "#f1f5f9", transition: "all 0.2s",
    }),
  };

  const stageNames = ["Hook", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ── HOOK ────────────────────────────────────────────────────────────────────
  const renderHook = () => (
    <div style={s.card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "3rem", marginBottom: 10 }}>🌐</div>
        <div style={s.h2}>You type "youtube.com"…</div>
        <div style={{ ...s.p, textAlign: "center" }}>
          In about 0.3 seconds, a full webpage appears on your screen.<br />
          But <strong style={{ color: "#f1f5f9" }}>what actually happens</strong> in that 0.3 seconds?
        </div>
      </div>

      {/* Mini animation of typing */}
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontFamily: "monospace", fontSize: "0.95rem", color: "#4ade80" }}>
        <span style={{ color: "#64748b" }}>🔒 </span>
        <span style={{ color: "#38bdf8" }}>https://</span>
        youtube.com
        <span style={{ animation: "blink 1s infinite", color: "#f1f5f9" }}>|</span>
      </div>

      {!hookSubmitted ? (
        <>
          <div style={s.h3}>Your guess: What do you think happens first?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {["The browser magically knows where YouTube is", "A phone-book lookup happens to find YouTube's address", "Your WiFi router searches for YouTube", "YouTube detects you and sends the page automatically"].map((opt, i) => (
              <div key={i}
                onClick={() => setHookGuess(opt)}
                style={{
                  background: hookGuess === opt ? "#0f2942" : "#0f172a",
                  border: hookGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                  borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: "0.8rem", color: "#e2e8f0",
                  transition: "all 0.2s",
                }}>
                {opt}
              </div>
            ))}
          </div>
          <button style={s.btn()} disabled={!hookGuess} onClick={() => setHookSubmitted(true)}>Submit My Guess →</button>
        </>
      ) : (
        <div style={{ background: "#0f2942", borderRadius: 12, padding: "16px" }}>
          <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>✅ Great guess!</div>
          <div style={s.p}>
            {hookGuess.includes("phone-book")
              ? "🎯 You're spot on! A DNS lookup is exactly like a phone-book search. Let's learn exactly how this works."
              : "The secret is something called DNS — a giant phone book for the internet. Before your browser can even talk to YouTube, it needs to find YouTube's address. Let's discover exactly how!"}
          </div>
          <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
        </div>
      )}
    </div>
  );

  // ── BUILD ────────────────────────────────────────────────────────────────────
  const renderBuild = () => (
    <div>
      {/* Concept tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "12px 16px 0" }}>
        {concepts.map((c, i) => (
          <button key={i}
            disabled={!conceptUnlocked[i]}
            onClick={() => { setBuildConcept(i); setBuildMode("plain"); }}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 99, border: "none", fontWeight: 600,
              fontSize: "0.75rem", cursor: conceptUnlocked[i] ? "pointer" : "not-allowed",
              background: buildConcept === i ? "#38bdf8" : conceptUnlocked[i] ? "#1e293b" : "#0f172a",
              color: buildConcept === i ? "#0f172a" : conceptUnlocked[i] ? "#e2e8f0" : "#334155",
            }}>
            {conceptUnlocked[i] ? `${i + 1}. ${c.title.split("—")[0].trim()}` : `🔒 Concept ${i + 1}`}
          </button>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.h3}>{concepts[buildConcept].title}</div>

        {/* Animation area */}
        <div style={s.animBox}>
          <ConceptAnimation type={concepts[buildConcept].animation} frame={animFrame} />
        </div>

        {/* Toggle plain/technical */}
        <div style={s.toggleRow}>
          <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
        </div>

        <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
          {buildMode === "plain" && <div style={{ ...s.p, marginBottom: 0 }}>{concepts[buildConcept].plain}</div>}
          {buildMode === "tech" && <div style={{ ...s.p, color: "#7dd3fc", fontFamily: "monospace", fontSize: "0.8rem", marginBottom: 0 }}>{concepts[buildConcept].technical}</div>}
        </div>

        {/* Timer / Next */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

  // ── SEE IT ───────────────────────────────────────────────────────────────────
  const renderSeeIt = () => (
    <div style={s.card}>
      <div style={s.h2}>📽️ Watch the Journey: youtube.com</div>
      <div style={s.p}>Follow each step. Toggle between plain English and technical terms.</div>

      <div style={s.toggleRow}>
        <button style={s.toggleBtn(seeitMode === "plain")} onClick={() => setSeeitMode("plain")}>💬 Plain English</button>
        <button style={s.toggleBtn(seeitMode === "tech")} onClick={() => setSeeitMode("tech")}>🔬 Technical</button>
      </div>

      {/* Journey animation */}
      <div style={s.animBox}>
        <JourneyAnimation step={seeitStep} frame={animFrame} />
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 16 }}>
        {seeitSteps.map((step, i) => (
          <div key={i}
            onClick={() => setSeeitStep(i)}
            style={{
              background: seeitStep === i ? "#0f2942" : i < seeitStep ? "#14532d22" : "#0f172a",
              border: seeitStep === i ? "2px solid #38bdf8" : i < seeitStep ? "1px solid #4ade8044" : "1px solid #334155",
              borderRadius: 10, padding: "11px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.2s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.75rem", color: i < seeitStep ? "#4ade80" : seeitStep === i ? "#38bdf8" : "#475569", fontWeight: 700 }}>
                {i < seeitStep ? "✅" : seeitStep === i ? "▶" : `${i + 1}.`}
              </span>
              <span style={{ fontSize: "0.84rem", color: seeitStep === i ? "#f1f5f9" : "#94a3b8" }}>
                {seeitMode === "plain" ? step.plain : step.tech}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {seeitStep < seeitSteps.length - 1
          ? <button style={s.btn()} onClick={() => setSeeitStep(seeitStep + 1)}>Next Step →</button>
          : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It! →</button>
        }
        {seeitStep > 0 && <button style={s.btnOutline} onClick={() => setSeeitStep(seeitStep - 1)}>← Back</button>}
      </div>
    </div>
  );

  // ── TRY IT ───────────────────────────────────────────────────────────────────
  const renderTryIt = () => {
    const steps = [
      { key: "typed", label: "Type 'college.edu' in the browser bar", action: "Type URL", icon: "⌨️" },
      { key: "dnsLookup", label: "Trigger DNS lookup — find the server's IP", action: "DNS Lookup", icon: "📖" },
      { key: "tcpConnect", label: "Open a connection to the server", action: "Connect", icon: "🔌" },
      { key: "httpSent", label: "Send an HTTP GET request", action: "Send Request", icon: "📤" },
      { key: "responseBack", label: "Receive 200 OK and the HTML page", action: "Receive Response", icon: "📥" },
    ];
    const doneCount = Object.values(tryitState).filter(Boolean).length;
    const allDone = doneCount === steps.length;

    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Simulate a Browser Request</div>
        <div style={s.p}>You are the browser. Click each step in order to load <strong style={{ color: "#38bdf8" }}>college.edu</strong>.</div>

        {/* Progress bar */}
        <div style={{ height: 6, background: "#1e293b", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(doneCount / steps.length) * 100}%`, background: "linear-gradient(90deg,#38bdf8,#4ade80)", transition: "width 0.4s", borderRadius: 99 }} />
        </div>

        {/* Sidebar checklist + main action */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {/* Checklist */}
          <div style={{ flex: "1 1 180px" }}>
            {steps.map((step, i) => {
              const prevKey = i > 0 ? steps[i - 1].key : null;
              const prevDone = prevKey ? tryitState[prevKey] : true;
              return (
                <div key={step.key} style={s.checkRow(tryitState[step.key])}>
                  <span style={{ fontSize: "1rem" }}>{tryitState[step.key] ? "✅" : step.icon}</span>
                  <span style={{ fontSize: "0.8rem", color: tryitState[step.key] ? "#4ade80" : "#94a3b8" }}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Action area */}
          <div style={{ flex: "1 1 160px", background: "#0f172a", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600 }}>BROWSER SIMULATOR</div>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", fontSize: "0.78rem", color: "#7dd3fc", fontFamily: "monospace" }}>
              {allDone ? "✅ Page Loaded!" : doneCount === 0 ? "> waiting…" : doneCount === 1 ? "> DNS resolving…" : doneCount === 2 ? "> Connecting…" : doneCount === 3 ? "> GET / HTTP/1.1" : "> 200 OK received"}
            </div>
            {steps.map((step, i) => {
              const prevKey = i > 0 ? steps[i - 1].key : null;
              const prevDone = prevKey ? tryitState[prevKey] : true;
              if (tryitState[step.key]) return null;
              if (!prevDone) return null;
              return (
                <button key={step.key} style={s.btn()}
                  onClick={() => setTryitState(prev => ({ ...prev, [step.key]: true }))}>
                  {step.icon} {step.action}
                </button>
              );
            })}
          </div>
        </div>

        {allDone && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8044", borderRadius: 12, padding: "14px", marginTop: 14 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>🎉 Page loaded in simulation!</div>
            <div style={s.p}>You just experienced the full request-response cycle. Every real browser does exactly this, millions of times per second.</div>
            <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
          </div>
        )}
      </div>
    );
  };

  // ── CHALLENGE ────────────────────────────────────────────────────────────────
  const renderChallenge = () => (
    <div>
      {challengePhase === 0 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 1: Match the Status Code</div>
          <div style={s.p}>Drag each status code to its correct meaning.</div>
          <StatusCodeMatch pairs={ch1Pairs} onDone={() => { setCh1Done(true); }} done={ch1Done} />
          {ch1Done && (
            <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setChallengePhase(1)}>
              Next Challenge →
            </button>
          )}
        </div>
      )}
      {challengePhase === 1 && (
        <div style={s.card}>
          <div style={s.h2}>🎯 Challenge 2: Order the Steps</div>
          <div style={s.p}>Arrange these steps in the correct order for loading a webpage. Tap to select, then tap the position.</div>
          <OrderingChallenge steps={ch2Steps} onDone={() => setCh2Done(true)} done={ch2Done} />
          {ch2Done && (
            <button style={{ ...s.btn("#4ade80"), marginTop: 16 }} onClick={() => setStage(5)}>
              Final Quiz →
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ── QUIZ ─────────────────────────────────────────────────────────────────────
  const renderQuiz = () => {
    if (quizDone) return (
      <div style={s.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏆</div>
          <div style={s.h2}>Unit 1.2 Complete!</div>
          <div style={s.p}>You now understand how browsers and servers communicate — the foundation of everything on the web.</div>
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px", margin: "14px 0", textAlign: "left" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>What you learned:</div>
            {["HTTP/HTTPS — the language of the web", "DNS — the internet's phone book", "Request-Response — the conversation", "Status codes — server's reply card"].map((l, i) => (
              <div key={i} style={{ color: "#94a3b8", fontSize: "0.83rem", padding: "4px 0" }}>✅ {l}</div>
            ))}
          </div>
          <button style={s.btn("#4ade80")} onClick={() => { onUnitComplete && onUnitComplete(); }}>
            Mark Complete & Continue →
          </button>
        </div>
      </div>
    );

    const q = quizQuestions[quizQ];
    return (
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
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

        {/* Hints */}
        {quizFeedback === "wrong" && hintsShown < q.hints.length && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem", marginBottom: 4 }}>💡 Hint {hintsShown}:</div>
            <div style={{ color: "#fde68a", fontSize: "0.83rem" }}>{q.hints[hintsShown - 1]}</div>
          </div>
        )}

        {quizFeedback === "correct" && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: "12px", margin: "10px 0" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✅ Correct!</div>
            <div style={{ color: "#86efac", fontSize: "0.83rem" }}>{q.explanation}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {quizFeedback !== "correct" && (
            <button style={s.btn()} disabled={quizSelected === null}
              onClick={() => {
                if (quizSelected === q.answer) {
                  setQuizFeedback("correct");
                } else {
                  const newAttempts = quizAttempts + 1;
                  setQuizAttempts(newAttempts);
                  setQuizFeedback("wrong");
                  setHintsShown(Math.min(newAttempts, q.hints.length));
                  setQuizSelected(null);
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

  return (
    <div style={s.wrap}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 1.2 — How Browsers & Servers Talk</div>
        <div style={s.stagePills}>
          {stageNames.map((name, i) => (
            <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>
          ))}
        </div>
      </div>

      {/* Student greeting */}
      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong>
        </div>
      )}

      {stage === 0 && renderHook()}
      {stage === 1 && renderBuild()}
      {stage === 2 && renderSeeIt()}
      {stage === 3 && renderTryIt()}
      {stage === 4 && renderChallenge()}
      {stage === 5 && renderQuiz()}

      <style>{`@keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }`}</style>
    </div>
  );
}

// ── CONCEPT ANIMATIONS ───────────────────────────────────────────────────────
function ConceptAnimation({ type, frame }) {
  const pos = (frame % 40) / 40;
  const base = { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };

  if (type === "http") return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ background: "#1e3a5f", borderRadius: 10, padding: "10px 16px", color: "#38bdf8", fontSize: "0.8rem", fontWeight: 700 }}>🖥 Browser</div>
        <div style={{ flex: 1, position: "relative", height: 30, minWidth: 120, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#334155" }} />
          <div style={{ position: "absolute", top: "calc(50% - 5px)", left: `${pos * 100}%`, background: "#38bdf8", borderRadius: "50%", width: 12, height: 12, transition: "left 0.1s linear" }} />
          <div style={{ position: "absolute", top: "20%", left: "40%", fontSize: "0.6rem", color: "#64748b" }}>HTTP GET /</div>
        </div>
        <div style={{ background: "#1a3320", borderRadius: 10, padding: "10px 16px", color: "#4ade80", fontSize: "0.8rem", fontWeight: 700 }}>🗄 Server</div>
      </div>
    </div>
  );

  if (type === "https") return (
    <div style={base}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ background: "#1e3a5f", borderRadius: 10, padding: "10px 16px", color: "#38bdf8", fontSize: "0.8rem", fontWeight: 700 }}>🖥 Browser</div>
        <div style={{ position: "relative", minWidth: 120, height: 40, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "#4ade80", opacity: 0.4 }} />
          <div style={{ position: "absolute", top: "calc(50% - 7px)", left: `${pos * 80}%`, fontSize: "1.1rem" }}>🔒</div>
        </div>
        <div style={{ background: "#1a3320", borderRadius: 10, padding: "10px 16px", color: "#4ade80", fontSize: "0.8rem", fontWeight: 700 }}>🗄 Server</div>
      </div>
    </div>
  );

  if (type === "dns") {
    const phase = Math.floor(pos * 3);
    return (
      <div style={base}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 6 }}>
            {phase === 0 ? "1. You type 'youtube.com'" : phase === 1 ? "2. DNS Server looks it up" : "3. Returns IP: 142.250.195.174"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#1e3a5f", borderRadius: 8, padding: "8px 12px", color: "#38bdf8", fontSize: "0.75rem" }}>📱 youtube.com</div>
            <div style={{ fontSize: "1.2rem", color: phase >= 1 ? "#fbbf24" : "#334155" }}>→</div>
            <div style={{ background: "#2d1b00", borderRadius: 8, padding: "8px 12px", color: "#fbbf24", fontSize: "0.75rem" }}>📖 DNS</div>
            <div style={{ fontSize: "1.2rem", color: phase >= 2 ? "#4ade80" : "#334155" }}>→</div>
            <div style={{ background: "#14532d33", borderRadius: 8, padding: "8px 12px", color: "#4ade80", fontSize: "0.7rem" }}>142.250…</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "reqres") return (
    <div style={base}>
      <div style={{ width: "90%" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ background: "#1e3a5f", borderRadius: 8, padding: "6px 12px", color: "#38bdf8", fontSize: "0.72rem", minWidth: 70 }}>🖥 Browser</div>
          <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg,#38bdf8,transparent)", position: "relative" }}>
            <div style={{ position: "absolute", right: `${(1 - pos) * 100}%`, top: -4, fontSize: "0.7rem", color: "#38bdf8" }}>📤 GET /</div>
          </div>
          <div style={{ background: "#1a3320", borderRadius: 8, padding: "6px 12px", color: "#4ade80", fontSize: "0.72rem", minWidth: 70 }}>🗄 Server</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ background: "#1e3a5f", borderRadius: 8, padding: "6px 12px", color: "#38bdf8", fontSize: "0.72rem", minWidth: 70 }}>🖥 Browser</div>
          <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg,transparent,#4ade80)", position: "relative" }}>
            <div style={{ position: "absolute", left: `${(1 - pos) * 100}%`, top: -4, fontSize: "0.7rem", color: "#4ade80" }}>📥 200 OK</div>
          </div>
          <div style={{ background: "#1a3320", borderRadius: 8, padding: "6px 12px", color: "#4ade80", fontSize: "0.72rem", minWidth: 70 }}>🗄 Server</div>
        </div>
      </div>
    </div>
  );

  if (type === "status") {
    const codes = [{ code: "200", color: "#4ade80", label: "OK" }, { code: "404", color: "#fb923c", label: "Not Found" }, { code: "500", color: "#ef4444", label: "Server Error" }];
    const idx = Math.floor(pos * 3) % 3;
    return (
      <div style={base}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color: codes[idx].color, marginBottom: 4 }}>{codes[idx].code}</div>
          <div style={{ color: codes[idx].color, fontWeight: 700, fontSize: "0.9rem" }}>{codes[idx].label}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
            {codes.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i === idx ? c.color : "#334155" }} />)}
          </div>
        </div>
      </div>
    );
  }

  return <div style={{ color: "#64748b" }}>Animation</div>;
}

// ── JOURNEY ANIMATION ────────────────────────────────────────────────────────
function JourneyAnimation({ step, frame }) {
  const icons = ["⌨️", "📖", "✅", "📤", "📥", "🎨"];
  const labels = ["Type URL", "DNS Lookup", "IP Found", "HTTP Request", "Response", "Render"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 16px", width: "100%" }}>
      {icons.map((icon, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: i === step ? "1.6rem" : "1rem", transition: "font-size 0.3s", filter: i > step ? "grayscale(1) opacity(0.3)" : "none" }}>{icon}</div>
            <div style={{ fontSize: "0.55rem", color: i === step ? "#38bdf8" : "#475569", fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>{labels[i]}</div>
          </div>
          {i < icons.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? "#4ade80" : "#334155", margin: "0 4px", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── STATUS CODE MATCH ────────────────────────────────────────────────────────
function StatusCodeMatch({ pairs, onDone, done }) {
  const [matched, setMatched] = useState({});
  const [selected, setSelected] = useState(null);
  const [wrong, setWrong] = useState(null);
  const shuffledMeanings = useRef([...pairs].sort(() => Math.random() - 0.5)).current;

  const handleCode = (code) => { if (!matched[code]) setSelected({ type: "code", value: code }); };
  const handleMeaning = (meaning) => {
    if (selected?.type === "code") {
      const correct = pairs.find(p => p.code === selected.value)?.meaning === meaning;
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
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 100 }}>
        <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, marginBottom: 8 }}>STATUS CODES</div>
        {pairs.map(p => (
          <div key={p.code}
            onClick={() => handleCode(p.code)}
            style={{
              background: matched[p.code] ? "#14532d33" : selected?.value === p.code ? "#0f2942" : "#0f172a",
              border: matched[p.code] ? "2px solid #4ade8055" : selected?.value === p.code ? "2px solid #38bdf8" : "1px solid #334155",
              borderRadius: 10, padding: "12px", marginBottom: 8, textAlign: "center",
              fontWeight: 700, fontSize: "1rem", color: matched[p.code] ? "#4ade80" : "#f1f5f9", cursor: matched[p.code] ? "default" : "pointer",
            }}>
            {p.code} {matched[p.code] ? "✅" : ""}
          </div>
        ))}
      </div>
      <div style={{ flex: 2, minWidth: 160 }}>
        <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, marginBottom: 8 }}>MEANINGS</div>
        {shuffledMeanings.map(p => {
          const isMatched = Object.values(matched).includes(p.meaning);
          return (
            <div key={p.meaning}
              onClick={() => !isMatched && handleMeaning(p.meaning)}
              style={{
                background: isMatched ? "#14532d33" : wrong === p.meaning ? "#450a0a" : "#0f172a",
                border: isMatched ? "2px solid #4ade8055" : wrong === p.meaning ? "2px solid #ef4444" : "1px solid #334155",
                borderRadius: 10, padding: "12px", marginBottom: 8,
                fontSize: "0.82rem", color: isMatched ? "#4ade80" : "#e2e8f0", cursor: isMatched ? "default" : "pointer",
                transition: "all 0.2s",
              }}>
              {p.meaning}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ORDERING CHALLENGE ───────────────────────────────────────────────────────
function OrderingChallenge({ steps, onDone, done }) {
  const [bank, setBank] = useState(() => [...steps].sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(false);

  const place = (item) => {
    const newPlaced = [...placed, item];
    setPlaced(newPlaced);
    setBank(bank.filter(b => b !== item));
    if (newPlaced.length === steps.length) {
      const correct = newPlaced.every((s, i) => s === steps[i]);
      if (correct) { onDone(); }
      else {
        setWrong(true);
        setTimeout(() => {
          setBank([...newPlaced, ...bank.filter(b => b !== item)].sort(() => Math.random() - 0.5));
          setPlaced([]);
          setWrong(false);
        }, 1200);
      }
    }
  };

  const unplace = (item) => {
    setPlaced(placed.filter(p => p !== item));
    setBank([...bank, item]);
  };

  return (
    <div>
      {wrong && <div style={{ background: "#450a0a", border: "1px solid #ef444455", borderRadius: 10, padding: "10px", marginBottom: 10, color: "#fca5a5", fontSize: "0.82rem" }}>❌ Not quite! The steps have been reshuffled. Try again!</div>}
      {done && <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: "10px", marginBottom: 10, color: "#4ade80", fontSize: "0.82rem" }}>✅ Perfect order! That's exactly how a browser loads a page.</div>}

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, marginBottom: 6 }}>YOUR ORDER (tap to remove):</div>
        <div style={{ minHeight: 50, background: "#0f172a", borderRadius: 10, padding: "8px", border: "1px dashed #334155" }}>
          {placed.map((item, i) => (
            <div key={item} onClick={() => !done && unplace(item)}
              style={{ display: "inline-block", background: "#0f2942", border: "1px solid #38bdf8", borderRadius: 8, padding: "6px 12px", margin: "4px", fontSize: "0.78rem", color: "#7dd3fc", cursor: done ? "default" : "pointer" }}>
              {i + 1}. {item}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, marginBottom: 6 }}>AVAILABLE STEPS (tap to place):</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {bank.map(item => (
            <div key={item} onClick={() => place(item)}
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer" }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
