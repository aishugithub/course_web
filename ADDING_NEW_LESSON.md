# Adding a New Lesson — 2 Steps Only

## Step 1 — Add to config/course.config.js
Add one line inside the correct module's units array:
  { unitId: "Unit2_5", title: "Your Lesson Title" },

## Step 2 — Drop the JSX file
Create: src/lessons/Unit2_5.jsx

Every lesson must use this exact signature:
  export default function Unit2_5({ student, onUnitComplete }) {
    // student = { rollNo, name, batch }
    // Call onUnitComplete() when quiz is fully done
    // Never import api.js or gas.config.js
  }

See src/lessons/Unit1_1.jsx in this template for a worked example
of the required shape (quiz + completion button).

## Step 3 — Push to deploy
  git add .
  git commit -m "added Unit 2.5"
  git push origin main

---

## Known Pitfall — "Lesson finishes but doesn't go back to Dashboard"

**Symptom:** student completes the quiz, the lesson's final screen
shows, but the app never returns to the Dashboard (blank/frozen
screen, or it just stays stuck). No error is visible on screen.

**Root cause (found in Unit1_1.jsx, fixed 2026-06-24):** `onUnitComplete()`
was being fired from inside a `useRef`/`useEffect` pair that itself
lived inside a conditional block, e.g.:

```jsx
// ❌ WRONG — hooks called conditionally
if (stage >= LAST_STAGE) {
  const calledRef = useRef(false);       // only runs once stage is high enough
  useEffect(() => { onUnitComplete?.(); }, []);
  return <CompletionScreen />;
}
```

This breaks React's Rules of Hooks: every render of a component must
call the exact same hooks, in the exact same order. Early renders
(stage < LAST_STAGE) call 2 hooks (useState x2). The moment `stage`
crosses the threshold, the component suddenly tries to call 2 MORE
hooks (useRef, useEffect) that weren't called before. React detects
the mismatch and throws "Rendering more hooks than during the
previous render" — which crashes the component with no on-screen
error (no error boundary is set up in App.jsx), leaving the student
stuck on a blank/frozen screen. `onUnitComplete()` never fires, so
Dashboard never sees the unit as done.

**The fix:** declare `useRef`/`useEffect` unconditionally at the TOP
of the component (alongside the other `useState` calls), and put the
"only do this once we're on the completion stage" logic INSIDE the
effect body instead of around the hook call itself:

```jsx
// ✅ RIGHT — hook is always called; the condition lives inside it
const calledRef = useRef(false);
useEffect(() => {
  if (stage >= LAST_STAGE && !calledRef.current) {
    calledRef.current = true;
    onUnitComplete?.();
  }
}, [stage]);
```

**Even simpler & recommended for new lessons:** skip the
useRef/useEffect "auto-fire on mount" pattern entirely. Fire
`onUnitComplete()` directly from a button's `onClick` on the
lesson's final "Mark Complete & Continue →" screen — a normal user
click event, not a lifecycle hook, so there's no hook-order risk at
all. This is the pattern already used in Unit1_2.jsx and in all of
Unit2_1.jsx–Unit2_4.jsx:

```jsx
<button onClick={() => onUnitComplete?.()}>Mark Complete & Continue →</button>
```

**Checklist for every new lesson going forward:**
- [ ] Never call `useState`/`useRef`/`useEffect`/any hook inside an
      `if`, loop, or after an early `return` — hooks must be
      unconditional, always at the top of the component body.
  - [ ] Prefer firing `onUnitComplete()` from a button click on the
      final screen rather than an auto-firing `useEffect`.
- [ ] Test locally by clicking all the way through to the final
      screen and confirming it returns to Dashboard before pushing
      to GitHub.
