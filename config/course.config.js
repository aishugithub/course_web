// ============================================================
//  COURSE CONFIG — change this file for every new course
//  Add a new unit = one object in the units array below
//  Add a new module = one object in the modules array below
//  Never touch any shell file for course structure changes
// ============================================================

const COURSE_CONFIG = {

  courseId:    "course_web",
  courseTitle: "Web Programming",
  subtitle:    "From zero to full-stack — one concept at a time",
  batch:       "",

  modules: [
    {
      moduleId:    "M1",
      moduleTitle: "How the Web Works",
      icon:        "🌐",
      units: [
        { unitId: "Unit1_1", title: "What is the Internet?" },
        { unitId: "Unit1_2", title: "How Browsers & Servers Talk" },
        { unitId: "Unit1_3", title: "How a Web Request Travels" },
      ],
    },
    {
      moduleId:    "M2",
      moduleTitle: "HTML Foundations",
      icon:        "🏗️",
      units: [
        { unitId: "Unit2_1", title: "Structure of an HTML Document" },
        { unitId: "Unit2_2", title: "Text, Links & Images" },
        { unitId: "Unit2_3", title: "Lists, Tables & Forms" },
        { unitId: "Unit2_4", title: "Semantic HTML" },
      ],
    },
    {
      moduleId:    "M3",
      moduleTitle: "CSS Styling",
      icon:        "🎨",
      units: [
        { unitId: "Unit3_1", title: "Selectors & the Cascade" },
        { unitId: "Unit3_2", title: "Colours, Fonts & Spacing" },
        { unitId: "Unit3_3", title: "Flexbox" },
        { unitId: "Unit3_4", title: "CSS Grid" },
      ],
    },
    {
      moduleId:    "M4",
      moduleTitle: "JavaScript Fundamentals",
      icon:        "⚡",
      units: [
        { unitId: "Unit4_1", title: "Variables, Types & Operators" },
        { unitId: "Unit4_2", title: "Functions & Scope" },
        { unitId: "Unit4_3", title: "Arrays & Objects" },
        { unitId: "Unit4_4", title: "DOM Manipulation" },
        { unitId: "Unit4_5", title: "Fetch & Promises" },
      ],
    },
    {
      moduleId:    "M5",
      moduleTitle: "Node.js & Backend",
      icon:        "🖥️",
      units: [
        { unitId: "Unit5_1", title: "What is Node.js?" },
        { unitId: "Unit5_2", title: "Your First HTTP Server" },
        { unitId: "Unit5_3", title: "npm & Modules" },
        { unitId: "Unit5_4", title: "Express.js Basics" },
        { unitId: "Unit5_5", title: "Reading & Writing Files" },
      ],
    },
    {
      moduleId:    "M6",
      moduleTitle: "Databases & APIs",
      icon:        "🗄️",
      units: [
        { unitId: "Unit6_1", title: "What is a Database?" },
        { unitId: "Unit6_2", title: "REST API Design" },
        { unitId: "Unit6_3", title: "Connecting Node to a DB" },
      ],
    },
  ],
};

export default COURSE_CONFIG;
