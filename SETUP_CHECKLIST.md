# New Course Setup Checklist

This is course_template — a clean copy of the working course_python
app shell with all course-specific content stripped out. Spin up a
new course by copying this whole folder.

## Files to change (4 only):

[ ] config/course.config.js     — courseId, courseTitle, subtitle, modules, units
[ ] config/gas.config.js        — paste GAS Web App URL
[ ] package.json                — name and homepage fields
[ ] vite.config.js              — base field

## Files that NEVER change:
- index.html                    (always says SRET E-Learning)
- src/shell/App.jsx
- src/shell/Login.jsx
- src/shell/Dashboard.jsx
- src/shell/api.js
- src/main.jsx
- src/index.css
- .github/workflows/deploy.yml
- Code.gs

## Steps:
1. Create a new GitHub repo for the course (e.g. course_web)
2. Copy this course_template folder → rename it (e.g. course_web) →
   place it alongside course_python inside C:\aishu\courses → cd into it
3. npm install && npm install react-router-dom && npm install --save-dev gh-pages
4. Edit the 4 files above:
   - config/course.config.js: set courseId to match the new repo name,
     set courseTitle/subtitle, and replace the example module/units
     with the real ones
   - package.json: "name" + "homepage" (homepage must end in /REPO_NAME)
   - vite.config.js: "base" must be '/REPO_NAME/' (match repo name exactly)
5. Delete the example src/lessons/Unit1_1.jsx (or rewrite it) and add
   your real lesson files — see ADDING_NEW_LESSON.md
6. Set up a new Google Sheet + Apps Script (paste in Code.gs unchanged)
   → run setupSheets() once → Deploy as Web App → get the GAS URL
7. Paste the GAS URL into config/gas.config.js
8. npm run dev → test locally
9. git init → git add . → git commit -m "init" → git branch -M main →
   git remote add origin https://github.com/aishugithub/REPO_NAME →
   git push origin main
10. GitHub repo → Settings → Actions → General → Workflow permissions →
    "Read and write permissions" → Save
11. Wait for the green tick in the Actions tab (first push triggers the
    deploy.yml workflow, which builds + publishes to the gh-pages branch)
12. GitHub repo → Settings → Pages → Source → Branch: gh-pages → Save
13. Done! Site is live at https://aishugithub.github.io/REPO_NAME/

Notes:
- You need to grant write permission for Actions in GitHub Settings
  (step 10) before the first deploy will succeed.
- You need to manually enable Pages once (step 12) — after that,
  every future `git push origin main` auto-redeploys via deploy.yml.
- If anything about this setup process changes (e.g. GitHub changes
  its Pages/Actions UI, or the workflow file needs updating), update
  this checklist and the copy living in course_template so future
  courses stay accurate.
