// ============================================================
//  API.JS — the ONLY file in the whole app that talks to the
//  network (Google Apps Script backend defined in Code.gs).
//
//  Shell-only file: App.jsx, Login.jsx, and Dashboard.jsx import
//  from here. Lesson files (src/lessons/*.jsx) must NEVER import
//  this file or gas.config.js directly — lessons only receive
//  `student` and `onUnitComplete` as props from App.jsx. This
//  keeps lessons portable: they don't know or care how progress
//  is actually saved.
// ============================================================

// GAS_URL is the deployed Google Apps Script Web App URL.
// It is the one secret/config value that differs per course and
// lives in config/gas.config.js so it's easy to find and swap.
import GAS_URL from '../../config/gas.config.js';

// Called by Login.jsx when the student submits the sign-in form.
// Sends rollNo + password to the GAS backend's "login" action
// (see handleLogin in Code.gs). Returns { success, student } or
// { success: false, message }.
export async function loginStudent(rollNo, password) {
  try {
    const url = `${GAS_URL}?action=login&rollNo=${encodeURIComponent(rollNo)}&password=${encodeURIComponent(password)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    // Network failure (offline, GAS URL wrong, CORS, etc.) — fail
    // gracefully instead of throwing, so the UI can show a message.
    console.error('login failed:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// Called by App.jsx's handleUnitComplete() once a lesson calls
// onUnitComplete(). Tells the backend "this student finished this
// unit of this course" so it can be recorded in the Progress sheet
// (see handleSaveProgress in Code.gs) and persist across sessions.
export async function saveProgress(rollNo, courseId, unitId) {
  try {
    const url = `${GAS_URL}?action=saveProgress&rollNo=${encodeURIComponent(rollNo)}&courseId=${encodeURIComponent(courseId)}&unitId=${encodeURIComponent(unitId)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('saveProgress failed:', err);
    return { success: false };
  }
}

// Called by App.jsx's handleLogin() right after a successful login.
// Fetches the list of unitIds already completed by this student for
// this course, so Dashboard.jsx can show ✅ marks and unlock the
// next unit in sequence. Returns [] (not an error object) on failure
// so callers can always safely treat the result as an array.
export async function getProgress(rollNo, courseId) {
  try {
    const url = `${GAS_URL}?action=getProgress&rollNo=${encodeURIComponent(rollNo)}&courseId=${encodeURIComponent(courseId)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.completedUnits || [];
  } catch (err) {
    console.error('getProgress failed:', err);
    return [];
  }
}
