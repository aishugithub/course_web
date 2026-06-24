// ============================================================
//  CODE.GS — paste into Google Apps Script editor
//  Deploy as Web App → Anyone → Execute as Me
//
//  This is the SERVER side of the course. It runs entirely on
//  Google's servers (not in the browser) and talks to a Google
//  Sheet that acts as a tiny database with two tabs:
//    "Students" — login credentials (RollNo, Password, Name, Batch, Email)
//    "Progress" — one row per completed unit (RollNo, CourseId, UnitId, CompletedAt)
//
//  The React app (src/shell/api.js) calls this script over HTTP
//  using the URL you paste into config/gas.config.js. Never change
//  the action names below ('login', 'saveProgress', 'getProgress')
//  without also updating api.js to match.
// ============================================================

// doGet runs whenever the browser/app makes a GET request (our app
// always uses GET, even for "writes", because GAS web apps handle
// GET more simply for this use case — see api.js).
function doGet(e) {
  return handleRequest(e.parameter);
}

// doPost is kept for completeness / future use, in case some action
// ever needs to send a large JSON body instead of URL query params.
function doPost(e) {
  // LockService prevents two simultaneous requests from corrupting
  // the sheet (e.g. two students saving progress at the same instant).
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    let body;
    try { body = JSON.parse(e.postData.contents); } catch { body = e.parameter; }
    const result = routeAction(body);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Wraps routeAction() and always returns JSON, even on error, so the
// front-end's fetch().json() call never throws on a malformed response.
function handleRequest(params) {
  try {
    return ContentService.createTextOutput(JSON.stringify(routeAction(params))).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple dispatcher: looks at ?action=... and calls the matching handler.
// Add new actions here ONLY if you also add a matching function in api.js —
// keep the contract between front-end and back-end in sync.
function routeAction(body) {
  switch (body.action) {
    case 'login':        return handleLogin(body);
    case 'saveProgress': return handleSaveProgress(body);
    case 'getProgress':  return handleGetProgress(body);
    default:             return { success: false, message: 'Unknown action' };
  }
}

// Checks the roll number + password against the "Students" sheet.
// Returns the student's profile (without the password) on success —
// this profile becomes `student` that gets passed into every lesson.
function handleLogin(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { // row 0 is the header row, skip it
    const [rollNo, password, name, batch, email] = data[i];
    if (String(rollNo).trim() === String(body.rollNo).trim() &&
        String(password).trim() === String(body.password).trim()) {
      return { success: true, student: { rollNo: String(rollNo), name, batch, email } };
    }
  }
  return { success: false, message: 'Invalid roll number or password.' };
}

// Records that a student finished a unit, but only once per
// (rollNo, courseId, unitId) combination — re-visiting a completed
// lesson should not create duplicate rows.
function handleSaveProgress(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.rollNo) &&
        String(data[i][1]) === String(body.courseId) &&
        String(data[i][2]) === String(body.unitId)) {
      return { success: true, message: 'Already recorded.' };
    }
  }
  sheet.appendRow([body.rollNo, body.courseId, body.unitId, new Date().toISOString()]);
  return { success: true };
}

// Returns the list of unitIds a student has already completed for
// this course. The Dashboard uses this list to show check-marks and
// to decide which units are unlocked.
function handleGetProgress(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress');
  const data  = sheet.getDataRange().getValues();
  const units = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.rollNo) &&
        String(data[i][1]) === String(body.courseId)) {
      units.push(String(data[i][2]));
    }
  }
  return { success: true, completedUnits: units };
}

// One-time helper: run this manually from the Apps Script editor
// (select setupSheets in the function dropdown, click Run) to create
// the two required sheets with correct headers + one sample student.
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let students = ss.getSheetByName('Students');
  if (!students) students = ss.insertSheet('Students');
  students.clearContents();
  students.appendRow(['RollNo', 'Password', 'Name', 'Batch', 'Email']);
  students.appendRow(['2024CS001', 'pass123', 'Sample Student', '2024-2028', 'student@example.com']);
  let progress = ss.getSheetByName('Progress');
  if (!progress) progress = ss.insertSheet('Progress');
  progress.clearContents();
  progress.appendRow(['RollNo', 'CourseId', 'UnitId', 'CompletedAt']);
  return 'Sheets created successfully!';
}
