// ============================================================
//  MAIN.JSX — the single entry point of the whole app.
//  index.html loads this file as a <script type="module">.
//  Its only job is: mount <App /> into the #root div.
//  Never put course logic here — that all lives in App.jsx,
//  which decides whether to show Login, Dashboard, or a lesson.
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'           // global resets + dark theme base
import App from './shell/App.jsx'

// React 18 root API: finds the <div id="root"> from index.html
// and renders the component tree into it.
// StrictMode is a dev-only helper that warns about unsafe patterns
// (e.g. double-invokes effects in dev to surface missing cleanup) —
// it has zero effect on the production build.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
