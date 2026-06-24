// ════════════════════════════════════════════════════════════════
// src/lessons/Unit1_3.jsx — Module 1 ("How the Web Works"), Unit 1.3
// "How a Web Request Travels"
// ────────────────────────────────────────────────────────────────
// WHERE THIS FITS IN THE APP:
// App.jsx (src/shell/App.jsx) uses Vite's import.meta.glob to find
// every file in src/lessons/*.jsx automatically. When a student
// clicks the "Unit1_3" tile on the Dashboard, App.jsx lazy-loads
// THIS file, hands it `student` (their {rollNo,name,batch}) and
// `onUnitComplete` (a callback), and renders it full-screen with a
// floating "← Dashboard" button on top (added by App.jsx itself —
// we must NOT draw our own back button here).
//
// WHAT THIS LESSON TEACHES (and why, relative to its neighbours):
// Unit1_1 taught "the Internet is a network of networks" (very
// high level). Unit1_2 taught the CLIENT↔SERVER conversation itself
// (HTTP/HTTPS, DNS name lookup, request/response, status codes).
// This unit, 1.3, fills the gap between them: once a request leaves
// your browser, what does it physically pass through on its way to
// a server that might be on the other side of the planet? We teach:
// packets + TTL, hops/routers, ISPs/IXPs/backbones, CDNs, and
// latency/RTT. We deliberately do NOT re-teach DNS or HTTP verbs —
// that's already covered in Unit1_2 — to avoid repeating content.
//
// HOUSE STYLE — same 6-stage pedagogy used by every lesson in this
// course (Hook → Build → See It → Try It → Challenge → Quiz), the
// same plain-English/technical toggle pattern, the same dark-card
// visual language, and the same "wrong answers get an escalating
// hint, never the answer" quiz rule. See Unit1_1_template.jsx for
// the full rulebook if extending this file later.
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";

export default function Unit1_3({ student, onUnitComplete }) {
  // ── ALL HOOKS LIVE HERE, UNCONDITIONALLY, IN A FIXED ORDER ───────
  // (Template Rule 3: hooks must never be called conditionally, so
  // every piece of state this lesson will ever need is declared up
  // front, in the same order, on every single render.)

  // Which of the 6 stages the student is currently on. Also drives
  // the little progress-pill row in the top bar.
  const [stage, setStage] = useState(0); // 0 Hook · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

  // -- Hook stage: the student predicts how many routers ("hops") a
  // request crosses before answering, then we reveal the truth.
  const [hookGuess, setHookGuess] = useState(null);
  const [hookSubmitted, setHookSubmitted] = useState(false);

  // -- Build stage: 5 concept cards, unlocked one-by-one by a short
  // reading timer (prevents rapid-click-through without reading —
  // same anti-pattern guard Unit1_2 uses). `buildConcept` is which
  // concept is currently open; `conceptUnlocked` is a parallel
  // boolean array (concept 0 starts unlocked); `buildTimer` counts
  // down per-concept; `buildMode` toggles plain-English vs technical
  // phrasing of whichever concept is open right now.
  const [buildConcept, setBuildConcept] = useState(0);
  const [conceptUnlocked, setConceptUnlocked] = useState([true, false, false, false, false]);
  const [buildTimer, setBuildTimer] = useState(0);
  const [buildMode, setBuildMode] = useState("plain");

  // -- See It stage: a 7-step narrated replay of one concrete request
  // (Chennai → a server in Singapore), steppable forward/back, with
  // its own plain/technical toggle. `seeItFrame` drives the small
  // CSS "packet moving along the line" animation tied to each step.
  const [seeItStep, setSeeItStep] = useState(0);
  const [seeItMode, setSeeItMode] = useState("plain");
  const [seeItFrame, setSeeItFrame] = useState(0);

  // -- Try It stage: the student plays "traceroute" themselves —
  // clicking one hop at a time and watching simulated latency add up,
  // exactly like running the real `tracert`/`traceroute` command.
  // `hopsRevealed` = how many of the simulated hops have been clicked
  // so far; `totalRTT` = running sum of each hop's simulated millisecond
  // delay, shown live like a real traceroute terminal output would.
  const [hopsRevealed, setHopsRevealed] = useState(0);
  const [totalRTT, setTotalRTT] = useState(0);

  // -- Challenge stage: two mini-games back to back. `challengePhase`
  // picks which one is showing. `termsDone`/`orderDone` track whether
  // each has been fully solved yet (used to reveal the "next" button).
  const [challengePhase, setChallengePhase] = useState(0); // 0 = term-match, 1 = ordering
  const [termsDone, setTermsDone] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  // -- Quiz stage: which question we're on, the student's current
  // selection, whether the last check was right/wrong, how many wrong
  // attempts on THIS question (drives which escalating hint shows),
  // and whether the whole quiz (and therefore the lesson) is finished.
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null); // null | "right" | "wrong"
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // A ref to hold the per-concept countdown's setInterval id, so the
  // cleanup function in the effect below can always clear the LATEST
  // interval even across re-renders (refs don't trigger re-renders
  // themselves, which is exactly what we want for a "just hold an id"
  // value like this).
  const buildTimerRef = useRef(null);

  // ════════════════════════════════════════════════════════════════
  //  CONTENT — every string a real student will read lives here, so
  //  the JSX further down stays about LAYOUT, not content. Swapping
  //  wording later never requires touching the render functions.
  // ════════════════════════════════════════════════════════════════

  // The 5 Build-stage concepts. `unlock` = seconds the student must
  // stay on this concept before the "Next" button (or the next tab)
  // becomes available — forces at least a skim-read before moving on.
  const concepts = [
    {
      title: "Breaking the Request into Packets",
      plain: "When you click a link, your request isn't sent as one giant blob of data. It's chopped into small pieces called packets — like splitting a long letter into several postcards, each numbered so the post office can put them back in order at the other end.",
      technical: "At the Transport Layer, TCP segments the HTTP request into packets, each carrying a sequence number, source/destination port numbers, and an IP header with a TTL (Time To Live) value that limits how many routers it may pass through.",
      icon: "📦",
      unlock: 8,
    },
    {
      title: "Hops: Every Packet Visits Several Routers",
      plain: "Each packet doesn't fly straight to the destination — it gets passed from one router to the next, like a relay race baton, until it finally reaches the destination's network. Each router-to-router step is called a 'hop'.",
      technical: "Every router along the path decrements the IP packet's TTL by 1. If TTL ever hits 0, the packet is dropped and the router replies with an ICMP 'Time Exceeded' message — this exact mechanism is how the traceroute/tracert tool discovers every hop on a path.",
      icon: "🔀",
      unlock: 8,
    },
    {
      title: "Crossing Networks: ISPs, IXPs & Backbones",
      plain: "Your packet doesn't stay on your home Wi-Fi for long — it leaves your ISP's network and joins giant 'backbone' connections, often meeting other providers' networks at neutral meeting points so traffic from many companies can cross over smoothly.",
      technical: "Internet Exchange Points (IXPs) let different Autonomous Systems (ASes) peer and exchange traffic directly. Long-haul backbone links — terrestrial fiber and undersea cables — carry traffic between cities and continents, with routers using BGP (Border Gateway Protocol) to choose the path.",
      icon: "🌐",
      unlock: 9,
    },
    {
      title: "CDNs: Skipping the Long Trip",
      plain: "Big websites don't make every single visitor's request travel across the whole planet. They keep copies of their content on servers placed near you — called edge servers — so most of what you load barely leaves your city.",
      technical: "A Content Delivery Network (CDN) caches static (and sometimes dynamic) content across globally distributed edge nodes, using Anycast routing to automatically send your request to the nearest healthy edge — sharply cutting hop count and round-trip distance.",
      icon: "🏙️",
      unlock: 9,
    },
    {
      title: "Latency & Round-Trip Time (RTT)",
      plain: "Every hop adds a tiny delay. The total time for your request to reach the server AND for the reply to come back is called latency, or 'round-trip time' (RTT) — the number you see when you 'ping' a website.",
      technical: "RTT = the time for a packet to reach the destination plus the time for an acknowledgment to return. Distance, the number of hops, and processing delay at each router all add up; satellite links can add 500ms+, while undersea fiber adds roughly a few milliseconds per 1,000 km.",
      icon: "⏱️",
      unlock: 8,
    },
  ];

  // The 7-step narrated journey used in the See It stage: a single
  // concrete example (a student in Chennai requesting a page hosted
  // in Singapore) walked through step by step, each with a plain and
  // a technical phrasing.
  const journeySteps = [
    { icon: "🖱️", label: "You click the link", plain: "Your browser builds an HTTP request for the page.", tech: "Browser constructs an HTTP GET request targeting the resolved destination IP." },
    { icon: "📦", label: "Request leaves your device", plain: "The request is split into packets, each stamped with a TTL (say, 64) so it can't loop forever.", tech: "TCP segments the request; each IP packet is given a TTL value (commonly 64 or 128) decremented at every hop." },
    { icon: "🔀", label: "Hop 1 — Your home router", plain: "Your Wi-Fi router receives the packet and forwards it toward your ISP.", tech: "The default gateway (home router) forwards the packet to the ISP's edge router; TTL is decremented to 63." },
    { icon: "🏢", label: "Hops 2–4 — Your ISP's network", plain: "A few of your ISP's own routers pass the packet along, getting it closer to the wider internet.", tech: "Packets traverse several ISP-internal routers (access → aggregation → core) before reaching a peering point." },
    { icon: "🌊", label: "Hops 5–9 — Backbone & undersea cables", plain: "The packet leaves India entirely, often travelling through undersea fiber-optic cables toward Singapore.", tech: "BGP-selected backbone routers carry the packet across an IXP and undersea cable links between regional networks." },
    { icon: "🖥️", label: "Final hop — Destination server", plain: "The packet finally reaches the server (or a nearby CDN edge) that holds the page you asked for.", tech: "The packet arrives at the destination network; if a CDN is used, it may actually stop much sooner at a nearby edge node instead of the origin server." },
    { icon: "↩️", label: "The response makes the same trip back", plain: "The server's reply retraces a similar hop-by-hop path back to you — and the total time for the round trip is what we call latency.", tech: "The response packet(s) traverse a (often asymmetric) return path; total elapsed time for request+response is the RTT." },
  ];

  // Simulated traceroute hops for the Try It stage — each with a
  // fake-but-realistic IP, a human label, and a millisecond delay
  // that "adds up" as the student clicks through them one at a time.
  // (Numbers are illustrative, not a real traceroute capture.)
  const traceHops = [
    { ip: "192.168.1.1",     label: "Your home router",        ms: 2 },
    { ip: "49.205.16.1",     label: "ISP access router",       ms: 6 },
    { ip: "49.205.0.1",      label: "ISP core router",         ms: 9 },
    { ip: "103.21.244.1",    label: "IXP peering point",       ms: 14 },
    { ip: "203.83.220.1",    label: "Undersea cable landing",  ms: 38 },
    { ip: "182.50.86.1",     label: "Singapore backbone hop",  ms: 11 },
    { ip: "104.18.32.1",     label: "Destination/CDN server",  ms: 4 },
  ];

  // Terms-to-definitions pairs for the first Challenge mini-game.
  const termPairs = [
    { term: "Hop",  meaning: "One router-to-router step along a packet's path" },
    { term: "TTL",  meaning: "A counter that stops a packet from looping forever" },
    { term: "RTT",  meaning: "Time for a request to arrive and its reply to return" },
    { term: "CDN",  meaning: "A network of edge servers placed close to users" },
    { term: "IXP",  meaning: "A neutral point where different networks interconnect" },
  ];

  // Steps to put in order for the second Challenge mini-game — reuses
  // the same journey concept but as short shuffled labels.
  const orderSteps = [
    "Request Created", "Leaves Your Device", "Home Router (Hop 1)",
    "ISP Network", "Backbone / IXP", "Destination Server", "Response Returns",
  ];

  // Quiz bank: 4 questions, each with escalating hints (never reveal
  // the answer outright) and an explanation shown only after a
  // correct answer (Template Rule 6).
  const quiz = [
    {
      q: "What does TTL stand for, and what job does it do for a packet?",
      options: [
        "Total Transfer Limit — caps file size",
        "Time To Live — limits how many hops a packet may take before being dropped",
        "Transmission Type Level — chooses Wi-Fi vs cable",
        "Traffic Throughput Level — controls speed",
      ],
      answer: 1,
      hints: [
        "Think about what would happen if a lost packet could bounce between routers forever.",
        "TTL is a small counter that goes DOWN by one at every router (every hop) it passes through.",
      ],
      explanation: "TTL (Time To Live) starts at a fixed number (e.g. 64) and is decremented by 1 at every hop. If it ever hits 0, the packet is discarded — this prevents packets from looping endlessly if routing ever goes wrong.",
    },
    {
      q: "In the journey of a web request, what exactly is a 'hop'?",
      options: [
        "The total distance the request travels in kilometres",
        "One step from one router to the next router along the path",
        "The moment the browser encrypts the request",
        "The final server that holds the webpage",
      ],
      answer: 1,
      hints: [
        "Picture a relay race — each runner only carries the baton for one short leg.",
        "A 'hop' is exactly ONE leg of the journey: from one router to the very next one.",
      ],
      explanation: "A hop is one router-to-router leg of the path. A request from Chennai to a server in Singapore might cross 10–20 hops — and tools like traceroute can list every single one.",
    },
    {
      q: "Why do large websites use CDNs (Content Delivery Networks)?",
      options: [
        "To make the website's design prettier",
        "To store user passwords more securely",
        "To serve content from servers physically closer to the visitor, cutting latency",
        "To block hackers from visiting the site",
      ],
      answer: 2,
      hints: [
        "Think about why a request travelling fewer kilometres, through fewer hops, arrives faster.",
        "A CDN keeps copies of content on 'edge' servers scattered around the world — close to users.",
      ],
      explanation: "CDNs cache content at edge servers near users worldwide. Instead of every request crossing oceans to one origin server, most requests are served from a nearby edge — far fewer hops, far less latency.",
    },
    {
      q: "What does RTT (Round-Trip Time) actually measure?",
      options: [
        "How many routers a packet passes through",
        "The total time for a request to reach its destination AND for the reply to come back",
        "The physical size of a single packet",
        "How many devices are connected to one router",
      ],
      answer: 1,
      hints: [
        "'Round trip' is the clue — it's not a one-way measurement.",
        "It's the full there-and-back time: request out, response back, added together.",
      ],
      explanation: "RTT is the complete there-and-back time: how long it takes for your packet to reach the server, plus however long the server's reply takes to return to you. It's exactly what a 'ping' measures.",
    },
  ];

  // ════════════════════════════════════════════════════════════════
  //  EFFECTS — side effects tied to the Build stage's reading-gate
  //  countdown and the See It stage's small looping CSS animation tick.
  // ════════════════════════════════════════════════════════════════

  // Per-concept countdown: while the student is on the Build stage,
  // count their current concept's `unlock` seconds down to 0, then
  // flip the NEXT concept's slot in `conceptUnlocked` to true so its
  // tab becomes clickable. Resets automatically whenever `buildConcept`
  // changes (new concept opened) thanks to the dependency array, and
  // always clears its own interval on cleanup so no stray timers keep
  // ticking in the background after the student leaves this stage.
  useEffect(() => {
    if (stage !== 1) return; // only run this timer while actually on the Build stage
    setBuildTimer(concepts[buildConcept].unlock);
    buildTimerRef.current = setInterval(() => {
      setBuildTimer((t) => {
        if (t <= 1) {
          clearInterval(buildTimerRef.current);
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
    return () => clearInterval(buildTimerRef.current); // cleanup: stop counting if stage/concept changes or component unmounts
  }, [stage, buildConcept]);

  // A simple looping 0→39 frame counter, ticking every 120ms, used only
  // to drive the small CSS "packet sliding along the line" animation in
  // the See It stage (see the SeeItAnimation component below). It's
  // deliberately decoupled from `seeItStep` so the dot keeps gliding
  // smoothly even while the student is reading, not just on step change.
  useEffect(() => {
    if (stage !== 2) return; // only animate while on the See It stage
    const id = setInterval(() => setSeeItFrame((f) => (f + 1) % 40), 120);
    return () => clearInterval(id);
  }, [stage]);

  // ── shared style object — copied from the template/Unit1_2 so this
  // lesson visually matches every other unit in the course. Percentage
  // widths, flexWrap, and clamp() keep every card mobile-safe.
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    topBar: { background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 100 },
    topTitle: { color: "#38bdf8", fontWeight: 700, fontSize: "0.9rem" },
    stagePills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: (active, done) => ({
      padding: "3px 10px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 600,
      background: done ? "#22c55e33" : active ? "#38bdf8" : "#1e293b",
      color: done ? "#4ade80" : active ? "#0f172a" : "#64748b",
      border: done ? "1px solid #4ade8066" : "none",
    }),
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px 12px", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    h3: { fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginBottom: 10 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.65, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    btnOutline: { background: "transparent", color: "#38bdf8", border: "2px solid #38bdf8", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 },
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    tag: (c) => ({ display: "inline-block", background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }),
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9",
    }),
  };

  // Names shown in the top progress-pill strip — purely cosmetic, kept
  // in one place so renaming a stage only needs one edit.
  const stageNames = ["Hook", "Build", "See It", "Try It", "Challenge", "Quiz"];

  // ════════════════════════════════════════════════════════════════
  //  STAGE RENDERERS — one function per stage. Only the Quiz stage's
  //  final "Mark Complete" button calls onUnitComplete (Template
  //  Rules 1 & 3: fired from a real click, never automatically).
  // ════════════════════════════════════════════════════════════════

  // ── HOOK — predict-then-learn: ask the student to guess the hop
  // count BEFORE teaching anything, then reveal the real answer.
  function renderHook() {
    const options = ["0 — it's a direct cable to the server", "2–3 hops", "10–20 hops", "100+ hops"];
    return (
      <div style={s.card}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: "2.6rem", marginBottom: 8 }}>🖱️🌍🖥️</div>
          <div style={s.h2}>You click a link to a site hosted in Singapore. You're in Chennai.</div>
          <div style={{ ...s.p, textAlign: "center" }}>
            The page appears in well under a second. But your request didn't fly there in one straight line —
            it bounced between machines along the way. <strong style={{ color: "#f1f5f9" }}>How many of these "hops" do you think it took?</strong>
          </div>
        </div>
        {!hookSubmitted ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
              {options.map((opt) => (
                <div key={opt} onClick={() => setHookGuess(opt)} style={{
                  background: hookGuess === opt ? "#0f2942" : "#0f172a",
                  border: hookGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                  borderRadius: 10, padding: 12, cursor: "pointer", fontSize: "0.82rem", textAlign: "center",
                }}>{opt}</div>
              ))}
            </div>
            <button style={s.btn()} disabled={!hookGuess} onClick={() => setHookSubmitted(true)}>Submit My Guess →</button>
          </>
        ) : (
          <div style={{ background: "#0f2942", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>
              {hookGuess === options[2] ? "🎯 Spot on!" : "Here's the real answer:"}
            </div>
            <div style={s.p}>
              A request from Chennai to Singapore typically crosses <strong style={{ color: "#f1f5f9" }}>10–20 routers</strong> —
              through your home router, several ISP routers, an internet exchange point, possibly an undersea cable, and finally
              the destination network. Let's see exactly what each of those hops is doing.
            </div>
            <button style={s.btn()} onClick={() => setStage(1)}>Start Learning →</button>
          </div>
        )}
      </div>
    );
  }

  // ── BUILD — 5 concept tabs, each gated by its own short reading
  // timer, each with a plain-English/technical toggle.
  function renderBuild() {
    const c = concepts[buildConcept];
    return (
      <div>
        {/* Tab strip: locked tabs show a 🔒 and can't be clicked until
            unlocked by the previous concept's countdown finishing. */}
        <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "12px 16px 0" }}>
          {concepts.map((cc, i) => (
            <button key={i}
              disabled={!conceptUnlocked[i]}
              onClick={() => { setBuildConcept(i); setBuildMode("plain"); }}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 99, border: "none", fontWeight: 600,
                fontSize: "0.72rem", cursor: conceptUnlocked[i] ? "pointer" : "not-allowed",
                background: buildConcept === i ? "#38bdf8" : conceptUnlocked[i] ? "#1e293b" : "#0f172a",
                color: buildConcept === i ? "#0f172a" : conceptUnlocked[i] ? "#e2e8f0" : "#334155",
              }}>
              {conceptUnlocked[i] ? `${cc.icon} ${i + 1}` : "🔒"}
            </button>
          ))}
        </div>

        <div style={s.card}>
          <div style={s.h3}>{c.icon} {c.title}</div>

          {/* Plain-English / Technical toggle — same pattern used in
              every lesson so students always know which "voice" they're
              reading, and can flip between them freely. */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
            <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
          </div>

          <div style={{ background: "#0f172a", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ ...s.p, marginBottom: 0, color: buildMode === "tech" ? "#7dd3fc" : "#94a3b8", fontFamily: buildMode === "tech" ? "monospace" : "inherit", fontSize: buildMode === "tech" ? "0.8rem" : "0.86rem" }}>
              {buildMode === "plain" ? c.plain : c.technical}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            {buildTimer > 0
              ? <div style={{ color: "#64748b", fontSize: "0.8rem" }}>⏳ Next unlocks in {buildTimer}s…</div>
              : buildConcept < concepts.length - 1
                ? <button style={s.btn()} onClick={() => { setBuildConcept(buildConcept + 1); setBuildMode("plain"); }}>Next Concept →</button>
                : <button style={s.btn("#4ade80")} onClick={() => setStage(2)}>I've got it! See It in Action →</button>}
            <div style={s.tag("#38bdf8")}>{buildConcept + 1} / {concepts.length}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── SEE IT — a single concrete example (Chennai → Singapore) walked
  // through 7 narrated steps, with a small CSS animation showing the
  // packet sliding from "you" to "server" as the step number advances.
  function renderSeeIt() {
    const step = journeySteps[seeItStep];
    // The little animated dot's horizontal position is a function of
    // BOTH which step we're on (coarse position) AND the looping
    // `seeItFrame` counter (fine wobble), so it never looks perfectly
    // static even while the student pauses to read.
    const baseline = (seeItStep / (journeySteps.length - 1)) * 100;
    const wobble = Math.sin(seeItFrame / 6) * 1.5;
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch One Request Travel: Chennai → Singapore</div>
        <div style={s.p}>Step through the journey. Toggle Plain English / Technical at any point.</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button style={s.toggleBtn(seeItMode === "plain")} onClick={() => setSeeItMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(seeItMode === "tech")} onClick={() => setSeeItMode("tech")}>🔬 Technical</button>
        </div>

        {/* The travelling-packet strip: a thin track from 🧑 (you) to
            🖥️ (server) with a glowing dot positioned by `baseline+wobble`. */}
        <div style={{ background: "#0f172a", borderRadius: 12, padding: "20px 14px", marginBottom: 14, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "1.4rem" }}>
            <span>🧑 You</span><span>🖥️ Server</span>
          </div>
          <div style={{ height: 4, background: "#334155", borderRadius: 99, position: "relative" }}>
            <div style={{ height: 4, width: `${baseline}%`, background: "linear-gradient(90deg,#38bdf8,#4ade80)", borderRadius: 99 }} />
            <div style={{ position: "absolute", top: -7, left: `calc(${baseline + wobble}% - 8px)`, fontSize: "1.1rem", transition: "left 0.1s linear" }}>📦</div>
          </div>
        </div>

        {/* The current step's icon, label, and plain/technical text. */}
        <div style={{ background: "#0f2942", borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#38bdf8", marginBottom: 6 }}>
            {step.icon} Step {seeItStep + 1} of {journeySteps.length}: {step.label}
          </div>
          <div style={{ ...s.p, marginBottom: 0 }}>{seeItMode === "plain" ? step.plain : step.tech}</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {seeItStep > 0 && <button style={s.btnOutline} onClick={() => setSeeItStep(seeItStep - 1)}>← Back</button>}
          {seeItStep < journeySteps.length - 1
            ? <button style={s.btn()} onClick={() => setSeeItStep(seeItStep + 1)}>Next Step →</button>
            : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It →</button>}
        </div>
      </div>
    );
  }

  // ── TRY IT — the student runs their own simulated "traceroute": one
  // click reveals one more hop's fake-but-realistic IP, label, and
  // millisecond delay, with the running RTT total updating live, just
  // like watching a real terminal traceroute output scroll down.
  function renderTryIt() {
    const allRevealed = hopsRevealed === traceHops.length;
    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Run Your Own Traceroute</div>
        <div style={s.p}>Click "Next Hop" to send your packet one step further and watch the simulated delay add up — exactly what the real <code>traceroute</code> / <code>tracert</code> command shows you.</div>

        {/* The terminal-style readout: every revealed hop becomes a
            permanent line, formatted like real traceroute output. */}
        <div style={{ background: "#000", borderRadius: 10, padding: 14, marginBottom: 14, fontFamily: "monospace", fontSize: "0.78rem", color: "#4ade80", minHeight: 60 }}>
          {hopsRevealed === 0 && <div style={{ color: "#64748b" }}>$ traceroute destination-server.com</div>}
          {traceHops.slice(0, hopsRevealed).map((h, i) => (
            <div key={i} style={{ color: "#86efac" }}>{i + 1}&nbsp;&nbsp;{h.ip}&nbsp;&nbsp;({h.label})&nbsp;&nbsp;{h.ms}ms</div>
          ))}
          {allRevealed && <div style={{ color: "#4ade80", marginTop: 6 }}>✓ Destination reached. Total RTT: {totalRTT}ms</div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={s.tag("#fb923c")}>Hops revealed: {hopsRevealed} / {traceHops.length}</div>
          <div style={s.tag("#38bdf8")}>Running RTT: {totalRTT}ms</div>
        </div>

        {!allRevealed ? (
          <button style={s.btn()} onClick={() => {
            setTotalRTT((t) => t + traceHops[hopsRevealed].ms);
            setHopsRevealed((h) => h + 1);
          }}>Send to Next Hop →</button>
        ) : (
          <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>
        )}
      </div>
    );
  }

  // ── CHALLENGE — two back-to-back mini-games: a tap-to-match of key
  // terms (Hop/TTL/RTT/CDN/IXP), then an ordering challenge for the
  // 7-step journey, reusing the small TermMatch/OrderSteps helpers
  // defined below the main component.
  function renderChallenge() {
    return (
      <div>
        {challengePhase === 0 && (
          <div style={s.card}>
            <div style={s.h2}>🎯 Challenge 1: Match the Term</div>
            <div style={s.p}>Tap a term, then tap its correct meaning.</div>
            <TermMatch pairs={termPairs} onDone={() => setTermsDone(true)} />
            {termsDone && <button style={{ ...s.btn("#4ade80") }} onClick={() => setChallengePhase(1)}>Next Challenge →</button>}
          </div>
        )}
        {challengePhase === 1 && (
          <div style={s.card}>
            <div style={s.h2}>🎯 Challenge 2: Order the Journey</div>
            <div style={s.p}>Tap the steps below in the correct order a request actually travels.</div>
            <OrderSteps steps={orderSteps} onDone={() => setOrderDone(true)} />
            {orderDone && <button style={{ ...s.btn("#4ade80") }} onClick={() => setStage(5)}>Final Quiz →</button>}
          </div>
        )}
      </div>
    );
  }

  // ── QUIZ — the only stage that ever calls onUnitComplete, and only
  // from the final button's onClick (Template Rules 1 & 3).
  function renderQuiz() {
    if (quizFinished) {
      return (
        <div style={s.card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 10 }}>🏆</div>
            <div style={s.h2}>Unit 1.3 Complete!</div>
            <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} You now know what really happens between clicking a link and a page loading — packets, hops, backbones, CDNs, and latency.</div>
            <div style={{ background: "#0f172a", borderRadius: 12, padding: 14, margin: "12px 0", textAlign: "left" }}>
              {["Packets & TTL", "Hops & routers (traceroute)", "ISPs, IXPs & backbones", "CDNs — edge servers near you", "Latency & Round-Trip Time"].map((l) => (
                <div key={l} style={{ color: "#94a3b8", fontSize: "0.83rem", padding: "4px 0" }}>✅ {l}</div>
              ))}
            </div>
            <button style={s.btn("#4ade80")} onClick={() => onUnitComplete?.()}>Mark Complete & Continue →</button>
          </div>
        </div>
      );
    }

    const q = quiz[quizIdx];
    return (
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={s.tag("#38bdf8")}>Question {quizIdx + 1} of {quiz.length}</div>
          {quizFeedback === "wrong" && <div style={s.tag("#fb923c")}>Attempt {quizAttempts + 1}</div>}
        </div>
        <div style={{ ...s.p, color: "#f1f5f9" }}>{q.q}</div>
        {q.options.map((opt, i) => {
          const isSel = quizSelected === i;
          const isCorrect = quizFeedback === "right" && isSel;
          const isWrong = quizFeedback === "wrong" && isSel;
          return (
            <div key={i} style={s.quizOption(isSel, isCorrect, isWrong)} onClick={() => {
              if (!quizFeedback || quizFeedback === "wrong") { setQuizSelected(i); setQuizFeedback(null); }
            }}>{opt}</div>
          );
        })}
        {/* Escalating hint on a wrong attempt — never reveals the
            correct option itself (Template Rule 6). */}
        {quizFeedback === "wrong" && (
          <div style={{ background: "#1c1c0f", border: "1px solid #ca8a0455", borderRadius: 10, padding: 12, margin: "10px 0", color: "#fde68a", fontSize: "0.82rem" }}>
            💡 {q.hints[Math.min(quizAttempts - 1, q.hints.length - 1)]}
          </div>
        )}
        {quizFeedback === "right" && (
          <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: 12, margin: "10px 0", color: "#86efac", fontSize: "0.82rem" }}>
            ✅ {q.explanation}
          </div>
        )}
        {quizFeedback !== "right" ? (
          <button style={s.btn()} disabled={quizSelected === null} onClick={() => {
            if (quizSelected === q.answer) setQuizFeedback("right");
            else { setQuizAttempts((a) => a + 1); setQuizFeedback("wrong"); setQuizSelected(null); }
          }}>Check Answer</button>
        ) : (
          <button style={s.btn("#4ade80")} onClick={() => {
            if (quizIdx + 1 < quiz.length) { setQuizIdx(quizIdx + 1); setQuizSelected(null); setQuizFeedback(null); setQuizAttempts(0); }
            else setQuizFinished(true);
          }}>{quizIdx + 1 < quiz.length ? "Next Question →" : "Finish Quiz 🎉"}</button>
        )}
      </div>
    );
  }

  // ── TOP-LEVEL RENDER — sticky top bar (title + progress pills),
  // then exactly one stage renderer chosen by `stage`. App.jsx already
  // overlays the "← Dashboard" button, so we never draw our own.
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={s.topTitle}>Unit 1.3 — How a Web Request Travels</div>
        <div style={s.stagePills}>
          {stageNames.map((name, i) => <span key={i} style={s.pill(stage === i, stage > i)}>{name}</span>)}
        </div>
      </div>

      {stage === 0 && (
        <div style={{ padding: "14px 20px 0", color: "#64748b", fontSize: "0.82rem" }}>
          👋 Welcome, <strong style={{ color: "#e2e8f0" }}>{student?.name || "Student"}</strong>
        </div>
      )}

      {[renderHook, renderBuild, renderSeeIt, renderTryIt, renderChallenge, renderQuiz][stage]()}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  HELPER COMPONENTS — small, self-contained mini-games used ONLY by
//  the Challenge stage above. Defined outside the main component
//  (rather than nested inside it) so React doesn't recreate their
//  function identity on every parent re-render, and so they can hold
//  their own private useState without polluting Unit1_3's own hook
//  list (keeping Template Rule 3's "all hooks live in one fixed,
//  flat list" guarantee intact for the component that matters most).
// ════════════════════════════════════════════════════════════════

// TermMatch — tap a term card, then tap the meaning card you think
// matches it. A correct pair locks in green; a wrong pair flashes red
// and un-selects so the student can try again (no penalty, just a
// nudge — consistent with this course's "never punish exploration"
// philosophy). Calls onDone() once every pair has been matched.
function TermMatch({ pairs, onDone }) {
  const [matched, setMatched] = useState({});       // { term: meaning } for every solved pair
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [wrongMeaning, setWrongMeaning] = useState(null);
  // Shuffle the meanings ONCE on mount (via useRef so the shuffled
  // order doesn't re-shuffle itself on every re-render, which would
  // be disorienting mid-game).
  const shuffled = useRef([...pairs].sort(() => Math.random() - 0.5)).current;

  function tapTerm(term) { if (!matched[term]) setSelectedTerm(term); }
  function tapMeaning(meaning) {
    if (!selectedTerm) return; // must pick a term first
    const isCorrect = pairs.find((p) => p.term === selectedTerm)?.meaning === meaning;
    if (isCorrect) {
      const next = { ...matched, [selectedTerm]: meaning };
      setMatched(next);
      setSelectedTerm(null);
      if (Object.keys(next).length === pairs.length) onDone();
    } else {
      setWrongMeaning(meaning);
      setTimeout(() => { setWrongMeaning(null); setSelectedTerm(null); }, 700);
    }
  }

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 100 }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>TERMS</div>
        {pairs.map((p) => (
          <div key={p.term} onClick={() => tapTerm(p.term)} style={{
            background: matched[p.term] ? "#14532d33" : selectedTerm === p.term ? "#0f2942" : "#0f172a",
            border: matched[p.term] ? "2px solid #4ade8055" : selectedTerm === p.term ? "2px solid #38bdf8" : "1px solid #334155",
            borderRadius: 10, padding: 12, marginBottom: 8, textAlign: "center", fontWeight: 700,
            color: matched[p.term] ? "#4ade80" : "#f1f5f9", cursor: matched[p.term] ? "default" : "pointer",
          }}>{p.term}{matched[p.term] ? " ✅" : ""}</div>
        ))}
      </div>
      <div style={{ flex: 2, minWidth: 160 }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 8 }}>MEANINGS</div>
        {shuffled.map((p) => {
          const isMatched = Object.values(matched).includes(p.meaning);
          return (
            <div key={p.meaning} onClick={() => !isMatched && tapMeaning(p.meaning)} style={{
              background: isMatched ? "#14532d33" : wrongMeaning === p.meaning ? "#450a0a" : "#0f172a",
              border: isMatched ? "2px solid #4ade8055" : wrongMeaning === p.meaning ? "2px solid #ef4444" : "1px solid #334155",
              borderRadius: 10, padding: 12, marginBottom: 8, fontSize: "0.82rem",
              color: isMatched ? "#4ade80" : "#e2e8f0", cursor: isMatched ? "default" : "pointer",
            }}>{p.meaning}</div>
          );
        })}
      </div>
    </div>
  );
}

// OrderSteps — the student taps shuffled step labels in what they
// believe is the correct chronological order. If the final order is
// wrong, every placed step gets reshuffled back into the bank so they
// can retry (again: no penalty, just another attempt). Calls onDone()
// the moment the full correct order has been placed.
function OrderSteps({ steps, onDone }) {
  const [bank, setBank] = useState(() => [...steps].sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);

  function place(item) {
    const next = [...placed, item];
    setPlaced(next);
    setBank((b) => b.filter((x) => x !== item));
    if (next.length === steps.length) {
      const correct = next.every((s, i) => s === steps[i]);
      if (correct) { setDone(true); onDone(); }
      else {
        setWrong(true);
        setTimeout(() => {
          setBank([...next].sort(() => Math.random() - 0.5));
          setPlaced([]);
          setWrong(false);
        }, 1200);
      }
    }
  }
  function unplace(item) {
    if (done) return; // lock the board once solved
    setPlaced((p) => p.filter((x) => x !== item));
    setBank((b) => [...b, item]);
  }

  return (
    <div>
      {wrong && <div style={{ background: "#450a0a", border: "1px solid #ef444455", borderRadius: 10, padding: 10, marginBottom: 10, color: "#fca5a5", fontSize: "0.82rem" }}>❌ Not quite — reshuffled. Try again!</div>}
      {done && <div style={{ background: "#14532d33", border: "1px solid #4ade8055", borderRadius: 10, padding: 10, marginBottom: 10, color: "#4ade80", fontSize: "0.82rem" }}>✅ Perfect order — that's exactly how the request travels!</div>}

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 6 }}>YOUR ORDER (tap to remove):</div>
        <div style={{ minHeight: 50, background: "#0f172a", borderRadius: 10, padding: 8, border: "1px dashed #334155" }}>
          {placed.map((item, i) => (
            <div key={item} onClick={() => unplace(item)} style={{
              display: "inline-block", background: "#0f2942", border: "1px solid #38bdf8", borderRadius: 8,
              padding: "6px 12px", margin: 4, fontSize: "0.78rem", color: "#7dd3fc", cursor: done ? "default" : "pointer",
            }}>{i + 1}. {item}</div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, marginBottom: 6 }}>AVAILABLE STEPS (tap to place):</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {bank.map((item) => (
            <div key={item} onClick={() => place(item)} style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px",
              fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer",
            }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
