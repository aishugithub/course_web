// ════════════════════════════════════════════════════════════════
//  LESSON TEMPLATE — copy this whole file to make any new lesson.
//  Rename the file AND the exported function to match the unitId
//  you add in config/course.config.js (e.g. "Unit3_2" → Unit3_2.jsx,
//  `export default function Unit3_2(...)`). Everything else below
//  is the REQUIRED shape + the house style for this course. Delete
//  this top rule block once you've internalized it, or leave it —
//  it costs nothing at runtime, it's just comments.
//
//  ── THE RULES (non-negotiable — breaking these breaks the app) ──
//
//  1. SIGNATURE: must be exactly
//       export default function UnitX_Y({ student, onUnitComplete })
//     `student` = { rollNo, name, batch } — read-only, for personalizing
//     text. `onUnitComplete` = call it ONCE, only after the student has
//     actually finished the quiz — never automatically, never twice.
//
//  2. NEVER import api.js or config/gas.config.js in a lesson file.
//     Lessons don't talk to the network. App.jsx (src/shell/App.jsx)
//     is the only file that does — it receives onUnitComplete being
//     called and handles saving progress + returning to Dashboard.
//
//  3. FIRE onUnitComplete() FROM A BUTTON onClick — never from a
//     useEffect that "auto-fires on mount". This is the #1 bug we've
//     hit in this course: a useRef/useEffect pair living inside an
//     `if (stage >= lastStage) {...}` block broke React's Rules of
//     Hooks (every render must call the same hooks in the same
//     order — hooks can NEVER be conditional, never inside an if/
//     loop/early-return). The instant a student reached the final
//     screen, the component tried calling hooks it hadn't called in
//     earlier renders, React crashed the render with no on-screen
//     error, and the student got stuck forever — never returning to
//     Dashboard. The fix going forward: keep ALL hooks (useState,
//     useEffect, useRef, etc.) unconditional, declared once at the
//     very top of the component, in the same order on every single
//     render — then gate behavior with plain `if` statements INSIDE
//     the hook body, never around the hook call itself. Better yet,
//     as this template does, skip auto-firing entirely and fire
//     onUnitComplete() from a real button click on the final screen.
//
//  4. COMMENT EVERY LINE'S PURPOSE AND HOW IT FITS THE WHOLE APP.
//     Per house style: don't just say "what" a line does, say "why"
//     it's there and how it connects to the rest of the lesson/app.
//     A future reader (including future-you) should never have to
//     guess why a piece of code exists.
//
//  5. SIX-STAGE FLOW — every lesson in this course follows the same
//     pedagogy, so students always know where they are:
//       Spark → Build → See It → Try It → Challenge → Quiz
//     ("Spark", not "Hook" — renamed because "Hook" reads poorly to
//     students even though it's the same idea: a curiosity-driver
//     before any real teaching happens.)
//
//  6. QUIZ RULE: wrong answers NEVER reveal the correct option
//     outright. Show an escalating hint instead, and let the student
//     try again (multiple attempts) — this is what makes the quiz a
//     learning moment instead of a guess-and-reveal exercise.you should give a hint even when chosen wrong answer the third time.give a hint always when wrong
//		Have a minimum of 10 quiz questions.
		
//
//  7. MOBILE-FIRST: no fixed pixel widths that can overflow a phone
//     screen. Use %, flexWrap, minmax()/clamp(), and a small
//     `<style>` block with an @media query for the smallest phones.
//     Every lesson must be fully usable on a phone, not just desktop.
//
//  8. INTERACTIVITY OVER TEXT: every stage should have the student
//     DOING something (clicking, dragging-by-tap, typing into a real
//     input, watching a timed reveal) — not just reading paragraphs.
//     Passive lessons don't teach; this course is built around
//     active/simulated learning at every stage.
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";

export default function UnitX_Y({ student, onUnitComplete }) {
  // ── ALL HOOKS LIVE HERE, UNCONDITIONALLY, IN A FIXED ORDER. ──────
  // Per Rule 3 above: never move a hook call inside an if/loop/early
  // return. Add new pieces of state here as you build out a real
  // lesson — just keep adding to this flat list, never nest a hook
  // call inside a conditional block further down the file.
  const [stage, setStage] = useState(0); // 0 Spark · 1 Build · 2 SeeIt · 3 TryIt · 4 Challenge · 5 Quiz

  // -- Spark stage state: a single curiosity question before teaching.
  const [sparkGuess, setSparkGuess] = useState(null);
  const [sparkSubmitted, setSparkSubmitted] = useState(false);

  // -- Build stage state: one concept shown per screen, gated by a
  // short countdown so students pause to read instead of rapid-clicking.
  const [buildUnlocked, setBuildUnlocked] = useState(false);
  const [buildTimer, setBuildTimer] = useState(6);
  const [buildMode, setBuildMode] = useState("plain"); // "plain" | "tech" toggle

  // -- See It stage state: a step-by-step live "code so far" / process
  // walkthrough the student clicks through at their own pace.
  const [seeItStep, setSeeItStep] = useState(0);

  // -- Try It stage state: a hands-on simulation the student actually
  // operates (here: a simple click-driven toggle list as a stand-in
  // for whatever real simulation your topic needs).
  const [tryItDone, setTryItDone] = useState(false);

  // -- Challenge stage state: a tap-to-match minigame (touch-friendly
  // alternative to drag-and-drop, since this course runs on phones too).
  const [matched, setMatched] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);

  // -- Quiz stage state: tracks the current question, the student's
  // selection, whether the last check was right/wrong, how many wrong
  // attempts on THIS question (drives which hint shows), and whether
  // the whole quiz (and therefore the lesson) is finished.
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null); // null | "right" | "wrong"
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // -- Build-stage countdown timer effect: counts down buildTimer once
  // per second while the student is on the Build stage, then flips
  // buildUnlocked once it hits zero so the "Next" button becomes
  // clickable. Cleans itself up if the student leaves the stage early
  // (stage changes) so no stray timers keep running in the background.
  useEffect(() => {
    if (stage !== 1 || buildUnlocked) return; // only run during Build, only until unlocked
    const id = setInterval(() => {
      setBuildTimer((t) => {
        if (t <= 1) { clearInterval(id); setBuildUnlocked(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id); // cleanup on unmount/stage change — prevents leaked timers
  }, [stage, buildUnlocked]);

  // ── EXAMPLE CONTENT — replace every string below with real topic
  // content. Structure (object shapes) is what matters; keep it.

  // One Build concept (real lessons have ~5; one is enough to show
  // the Plain-English ⇄ Technical toggle pattern this course uses
  // everywhere so students get the same idea explained twice).
  const concept = {
    plain: "Plain-English explanation of the idea goes here — write it like you're talking to a friend, no jargon.",
    technical: "Technical/formal phrasing of the exact same idea goes here — the vocabulary students need for exams/interviews.",
  };

  // See-It steps: each one is a small "what just got added/what just
  // happened" narration, paired with a code/diagram snippet if relevant.
  const seeItSteps = [
    { label: "Step 1 of the live walkthrough.", code: "// code or diagram snippet for step 1" },
    { label: "Step 2 of the live walkthrough.", code: "// code or diagram snippet for step 2" },
  ];

  // Tap-to-match pairs for the Challenge stage's TagMatch minigame.
  const matchPairs = [
    { left: "Term A", right: "Definition of Term A" },
    { left: "Term B", right: "Definition of Term B" },
  ];

  // Quiz bank: each question carries its own ESCALATING hints array —
  // hint[0] shown after the 1st wrong attempt, hint[1] after the 2nd,
  // etc. — and an `explanation` shown only once the student gets it
  // right. Never put the correct answer text inside a hint.
  const quiz = [
    {
      q: "Placeholder question — replace with real content.",
      options: ["Option A", "Option B (correct)", "Option C", "Option D"],
      answer: 1,
      hints: [
        "First gentle nudge — point at the right way to think about it, don't give it away.",
        "Second, more specific nudge if they're still stuck.",
      ],
      explanation: "Shown after a correct answer — reinforces WHY it's right.",
    },
  ];

  // ── shared style object — copy this verbatim into new lessons so
  // every unit in the course looks/feels consistent. Percentage
  // widths + flexWrap + clamp() throughout = mobile-safe by default.
  const s = {
    wrap: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',sans-serif", padding: "0 0 60px" },
    card: { background: "#1e293b", borderRadius: 16, padding: "20px 16px", margin: "20px 12px", border: "1px solid #334155" },
    h2: { fontSize: "clamp(1.05rem,3vw,1.3rem)", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
    p: { color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: 10 },
    btn: (color = "#38bdf8") => ({ background: color, color: "#0f172a", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", marginTop: 10 }),
    toggleBtn: (active) => ({ flex: "1 1 100px", padding: "8px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: active ? "#38bdf8" : "#1e293b", color: active ? "#0f172a" : "#64748b" }),
    quizOption: (sel, correct, wrong) => ({
      background: correct ? "#14532d" : wrong ? "#450a0a" : sel ? "#0f2942" : "#0f172a",
      border: correct ? "2px solid #4ade80" : wrong ? "2px solid #ef4444" : sel ? "2px solid #38bdf8" : "1px solid #334155",
      borderRadius: 10, padding: "13px 16px", marginBottom: 8, cursor: "pointer", fontSize: "0.85rem", color: "#f1f5f9",
    }),
  };

  // ── STAGE RENDERERS — one function per stage. Each ends by setting
  // `stage` to move to the next one; ONLY the Quiz stage's final
  // button calls onUnitComplete (Rule 3 / Rule 1).

  function renderSpark() {
    return (
      <div style={s.card}>
        <div style={s.h2}>🎯 A curiosity question before we teach anything</div>
        <div style={s.p}>Pose a relatable scenario/question here. The point is to make the student GUESS first (predict-then-learn beats being told straight away).</div>
        {!sparkSubmitted ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
              {["Guess A", "Guess B", "Guess C"].map((opt) => (
                <div key={opt} onClick={() => setSparkGuess(opt)} style={{
                  background: sparkGuess === opt ? "#0f2942" : "#0f172a",
                  border: sparkGuess === opt ? "2px solid #38bdf8" : "1px solid #334155",
                  borderRadius: 10, padding: 12, cursor: "pointer", fontSize: "0.8rem",
                }}>{opt}</div>
              ))}
            </div>
            <button style={s.btn()} disabled={!sparkGuess} onClick={() => setSparkSubmitted(true)}>Submit My Guess →</button>
          </>
        ) : (
          <button style={s.btn("#4ade80")} onClick={() => setStage(1)}>Start Learning →</button>
        )}
      </div>
    );
  }

  function renderBuild() {
    return (
      <div style={s.card}>
        <div style={s.h2}>Concept Title</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button style={s.toggleBtn(buildMode === "plain")} onClick={() => setBuildMode("plain")}>💬 Plain English</button>
          <button style={s.toggleBtn(buildMode === "tech")} onClick={() => setBuildMode("tech")}>🔬 Technical</button>
        </div>
        <div style={s.p}>{buildMode === "plain" ? concept.plain : concept.technical}</div>
        {!buildUnlocked
          ? <div style={{ color: "#64748b", fontSize: "0.8rem" }}>⏳ Next unlocks in {buildTimer}s…</div>
          : <button style={s.btn()} onClick={() => setStage(2)}>Next →</button>}
      </div>
    );
  }

  function renderSeeIt() {
    const step = seeItSteps[seeItStep];
    return (
      <div style={s.card}>
        <div style={s.h2}>📽️ Watch It Get Built, Step by Step</div>
        <div style={s.p}>{step.label}</div>
        <pre style={{ background: "#0f172a", borderRadius: 10, padding: 14, color: "#7dd3fc", fontSize: "0.78rem", overflowX: "auto" }}>{step.code}</pre>
        {seeItStep < seeItSteps.length - 1
          ? <button style={s.btn()} onClick={() => setSeeItStep(seeItStep + 1)}>Next Step →</button>
          : <button style={s.btn("#4ade80")} onClick={() => setStage(3)}>Now Let Me Try It →</button>}
      </div>
    );
  }

  function renderTryIt() {
    return (
      <div style={s.card}>
        <div style={s.h2}>🧪 Hands-On Simulation</div>
        <div style={s.p}>Replace this with a real interactive simulation matching your topic (a controlled form, a live preview, a drag/tap assembly task, etc.) — the student must DO something here, not just read.</div>
        {!tryItDone
          ? <button style={s.btn()} onClick={() => setTryItDone(true)}>Run the simulation</button>
          : <button style={s.btn("#4ade80")} onClick={() => setStage(4)}>Take the Challenge →</button>}
      </div>
    );
  }

  function renderChallenge() {
    const allMatched = Object.keys(matched).length === matchPairs.length;
    function tapLeft(left) { setSelectedTag(left); }
    function tapRight(right) {
      if (!selectedTag) return;
      const correct = matchPairs.find((p) => p.left === selectedTag)?.right === right;
      if (correct) setMatched((m) => ({ ...m, [selectedTag]: right }));
      setSelectedTag(null);
    }
    return (
      <div style={s.card}>
        <div style={s.h2}>🎯 Tap to Match</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}>
            {matchPairs.map((p) => (
              <div key={p.left} onClick={() => !matched[p.left] && tapLeft(p.left)} style={{
                background: matched[p.left] ? "#14532d33" : selectedTag === p.left ? "#0f2942" : "#0f172a",
                border: "1px solid #334155", borderRadius: 10, padding: 10, marginBottom: 8, cursor: "pointer", fontSize: "0.8rem",
              }}>{matched[p.left] ? "✅ " : ""}{p.left}</div>
            ))}
          </div>
          <div style={{ flex: "1 1 140px" }}>
            {matchPairs.map((p) => (
              <div key={p.right} onClick={() => tapRight(p.right)} style={{
                background: Object.values(matched).includes(p.right) ? "#14532d33" : "#0f172a",
                border: "1px solid #334155", borderRadius: 10, padding: 10, marginBottom: 8, cursor: "pointer", fontSize: "0.8rem",
              }}>{p.right}</div>
            ))}
          </div>
        </div>
        {allMatched && <button style={s.btn("#4ade80")} onClick={() => setStage(5)}>Final Quiz →</button>}
      </div>
    );
  }

  function renderQuiz() {
    // Completion screen: the ONLY place in this whole template that
    // calls onUnitComplete() — fired from a real click, satisfying
    // Rule 1 and Rule 3 simultaneously. Nothing here runs automatically.
    if (quizFinished) {
      return (
        <div style={s.card}>
          <div style={s.h2}>🏆 Unit Complete!</div>
          <div style={s.p}>{student?.name ? `Nice work, ${student.name}.` : "Nice work."} Summarize what was learned here.</div>
          <button style={s.btn("#4ade80")} onClick={() => onUnitComplete?.()}>Mark Complete & Continue →</button>
        </div>
      );
    }

    const q = quiz[quizIdx];
    return (
      <div style={s.card}>
        <div style={s.h2}>Question {quizIdx + 1} of {quiz.length}</div>
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
        {/* Wrong-answer hint — escalates with attempt count, NEVER reveals the answer (Rule 6). */}
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

  // ── TOP-LEVEL RENDER — picks exactly one stage renderer based on
  // `stage`. App.jsx already renders a floating "← Dashboard" button
  // over every lesson, so don't add your own back button here.
  return (
    <div style={s.wrap}>
      {[renderSpark, renderBuild, renderSeeIt, renderTryIt, renderChallenge, renderQuiz][stage]()}
    </div>
  );
}
