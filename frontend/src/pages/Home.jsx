import { useState, useRef, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import SkillChart from "../components/SkillChart";
import toast, { Toaster } from "react-hot-toast";
import { FaBolt, FaFileAlt, FaRegChartBar, FaRoute } from "react-icons/fa";

const MermaidGraph = lazy(() => import("../components/MermaidGraph"));

// Skill Difficulty Levels
const SKILL_DIFFICULTY = {
  // Beginner
  HTML: "Beginner", CSS: "Beginner", Git: "Beginner", "User Research": "Beginner", Figma: "Beginner",
  // Intermediate
  JavaScript: "Intermediate", React: "Intermediate", Python: "Intermediate", Flask: "Intermediate",
  Django: "Intermediate", "Node.js": "Intermediate", SQL: "Intermediate", MongoDB: "Intermediate",
  Docker: "Intermediate", AWS: "Intermediate", "Tailwind": "Intermediate", Wireframing: "Intermediate",
  // Advanced
  "Scikit-learn": "Advanced", TensorFlow: "Advanced", Kubernetes: "Advanced", Terraform: "Advanced",
  "Penetration_Testing": "Advanced", SIEM: "Advanced", Encryption: "Advanced", NLP: "Advanced",
  "Data Visualization": "Advanced", Pandas: "Advanced", NumPy: "Advanced"
};

// Skill dependencies (should match backend)
const SKILL_DEPENDENCIES = {
  React: ["JavaScript", "HTML", "CSS"],
  Tailwind: ["CSS"],
  Django: ["Python"],
  Flask: ["Python"],
  "Node.js": ["JavaScript"],
  MongoDB: ["Node.js"],
  Pandas: ["Python"],
  NumPy: ["Python"],
  "Scikit-learn": ["Python", "NumPy", "Pandas"],
  TensorFlow: ["Python", "NumPy"],
  Data_Visualization: ["Python"],
  Docker: ["Linux"],
  Kubernetes: ["Docker"],
  CI_CD: [],
  AWS: [],
  Terraform: ["AWS"],
  Jenkins: ["CI_CD"],
  Figma: [],
  Sketch: [],
  "Adobe XD": [],
  Wireframing: [],
  Prototyping: ["Wireframing"],
  "User Research": [],
  Usability_Testing: ["User Research"],
  Design_Systems: ["Figma"],
  Network_Security: [],
  Penetration_Testing: ["Network_Security"],
  Vulnerability_Assessment: ["Network_Security"],
  Firewalls: ["Network_Security"],
  SIEM: ["Network_Security"],
  Incident_Response: ["Network_Security"],
  Encryption: ["Network_Security"]
};

function getDependencyMermaid(skills) {
  let edges = [];
  const skillSet = new Set(skills);
  for (const skill of skills) {
    const deps = SKILL_DEPENDENCIES[skill] || [];
    for (const dep of deps) {
      if (skillSet.has(dep)) {
        edges.push(`${dep.replace(/\s/g, "_")} --> ${skill.replace(/\s/g, "_")}`);
      }
    }
  }
  const chart = edges.length === 0 
    ? "graph TD;\n  NoDependencies[No dependencies for your missing skills]"
    : `graph TD;\n  ${edges.join(";\n  ")}`;
  return chart;
}

// Calculate Resume Strength Score
function calculateResumeStrength(resumeSkills, fileName = "") {
  let score = 0;
  let tips = [];
  
  // Skill count (0-30 points)
  if (resumeSkills.length >= 10) score += 30;
  else if (resumeSkills.length >= 6) score += 20;
  else if (resumeSkills.length >= 3) score += 10;
  else tips.push("Add more technical skills to strengthen resume");
  
  // Skill diversity (0-20 points)
  const hasBackend = resumeSkills.some(s => ["Python", "Node.js", "Django", "Flask"].includes(s));
  const hasFrontend = resumeSkills.some(s => ["React", "JavaScript", "HTML", "CSS"].includes(s));
  const hasData = resumeSkills.some(s => ["Pandas", "NumPy", "SQL", "MongoDB"].includes(s));
  const hasDevOps = resumeSkills.some(s => ["Docker", "AWS", "Kubernetes", "CI_CD"].includes(s));
  
  const categories = [hasBackend, hasFrontend, hasData, hasDevOps].filter(Boolean).length;
  score += categories * 5;
  if (categories < 2) tips.push("Expand into multiple skill categories");
  
  // Advanced skills (0-20 points)
  const advancedCount = resumeSkills.filter(s => SKILL_DIFFICULTY[s] === "Advanced").length;
  score += Math.min(advancedCount * 5, 20);
  
  // File quality (0-30 points)
  if (fileName && fileName.length > 10 && !fileName.includes("resume") && !fileName.includes("cv")) {
    score += 15;
  } else {
    score += 10;
    if (!fileName) tips.push("Use a professional filename (e.g., FirstName_LastName_Resume.pdf)");
  }
  
  // Base points for having resume
  score += 20;
  
  // Cap at 100
  score = Math.min(score, 100);
  
  if (tips.length === 0) tips.push("Excellent resume! Keep skills updated.");
  
  return { score: Math.round(score), tips };
}

function Home() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const resultRef = useRef(null);
  const [weeks, setWeeks] = useState(4);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [progress, setProgress] = useState({});
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [resumeStrength, setResumeStrength] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const historyStorageKey = "skillpilot-analysis-history";
  const uploadSectionRef = useRef(null);
  const howItWorksRef = useRef(null);

  const analysisSummary = {
    total: jobSkills.length,
    matched: matchedSkills.length,
    missing: missingSkills.length,
    matchRate: jobSkills.length ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0,
  };

  useEffect(() => {
    // Fetch job roles from backend
    axios.get("/roles")
      .then(res => {
        setJobRoles(res.data.roles || []);
        if (res.data.roles && res.data.roles.length > 0) {
          setJobRole(res.data.roles[0]);
        }
      })
      .catch(() => setError("Failed to load job roles."));
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(historyStorageKey);
      if (storedHistory) {
        setAnalysisHistory(JSON.parse(storedHistory));
      }
    } catch (storageError) {
      console.warn("Could not load analysis history.", storageError);
    }
  }, []);

  const persistAnalysisHistory = (entries) => {
    setAnalysisHistory(entries);
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(entries));
    } catch (storageError) {
      console.warn("Could not save analysis history.", storageError);
    }
  };

  const scrollToSection = (sectionRef) => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Please upload a resume.");
      toast.error("Please upload a resume.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("role", jobRole);

      const response = await axios.post("/analyze", formData);
      setResumeSkills(response.data.resumeSkills || []);
      setJobSkills(response.data.jobSkills || []);
      setMatchedSkills(response.data.matchedSkills || []);
      setMissingSkills(response.data.missingSkills || []);
      
      // Calculate resume strength score
      const strength = calculateResumeStrength(response.data.resumeSkills || [], resumeFile.name);
      setResumeStrength(strength);
      
      const historyEntry = {
        id: Date.now(),
        role: jobRole,
        fileName: resumeFile.name,
        matchedCount: response.data.matchedSkills?.length || 0,
        missingCount: response.data.missingSkills?.length || 0,
        totalCount: response.data.jobSkills?.length || 0,
        createdAt: new Date().toISOString(),
      };
      persistAnalysisHistory([historyEntry, ...analysisHistory].slice(0, 5));
      setSuccess("Analysis complete!");
      toast.success("Analysis complete!");
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (error) {
      setError("Something went wrong. Please try again.");
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
  };

  const handleGetRoadmap = async () => {
    setRoadmap(null);
    setRoadmapLoading(true);
    setError("");
    try {
      const response = await axios.post("/roadmap", {
        missing_skills: missingSkills,
        total_weeks: weeks,
        hours_per_week: hoursPerWeek
      });
      setRoadmap(response.data.roadmap);
      toast.success("Roadmap generated!");
    } catch (err) {
      setError("Failed to generate roadmap. Please try again.");
      toast.error("Roadmap generation failed.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!jobSkills.length) {
      toast.error("Run an analysis first.");
      return;
    }

    const reportLines = [
      "SkillPilot Analysis Report",
      `Generated: ${new Date().toLocaleString()}`,
      `Target Role: ${jobRole}`,
      `Resume File: ${resumeFile?.name || "N/A"}`,
      "",
      `Total Skills: ${analysisSummary.total}`,
      `Matched Skills: ${analysisSummary.matched}`,
      `Missing Skills: ${analysisSummary.missing}`,
      `Match Rate: ${analysisSummary.matchRate}%`,
      "",
      "Matched Skills:",
      ...matchedSkills.map((skill) => `- ${skill}`),
      "",
      "Missing Skills:",
      ...missingSkills.map((skill) => `- ${skill}`),
    ];

    const reportBlob = new Blob([reportLines.join("\n")], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(reportBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `skillpilot-report-${jobRole.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    toast.success("Report downloaded");
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { sender: "user", text: chatInput };
    setChatMessages((msgs) => [...msgs, userMsg]);
    setChatLoading(true);
    setChatInput("");
    try {
      // Pass matchedSkills and missingSkills with the question
      const response = await axios.post("/chatbot", {
        question: userMsg.text,
        matchedSkills,
        missingSkills,
      });
      setChatMessages((msgs) => [...msgs, { sender: "bot", text: response.data.answer }]);
    } catch (err) {
      setChatMessages((msgs) => [...msgs, { sender: "bot", text: "Sorry, I couldn't get a response. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResourceCheck = (week, skill, resourceUrl) => {
    setProgress(prev => ({
      ...prev,
      [week]: {
        ...(prev[week] || {}),
        [skill]: {
          ...(prev[week]?.[skill] || {}),
          [resourceUrl]: !(prev[week]?.[skill]?.[resourceUrl])
        }
      }
    }));
  };

  // A skill is complete if all its resources are checked
  const isSkillComplete = (week, skill, resources) => {
    if (!resources || resources.length === 0) return false;
    const checked = progress[week]?.[skill] || {};
    return resources.every(res => checked[res.url]);
  };

  // Progress helpers
  const getWeekProgress = (weekObj) => {
    const total = weekObj.skills.length;
    const completed = weekObj.skills.filter(s => isSkillComplete(weekObj.week, s.skill, s.resources)).length;
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  };
  const getOverallProgress = (roadmapArr) => {
    let total = 0, completed = 0;
    roadmapArr.forEach(weekObj => {
      total += weekObj.skills.length;
      completed += weekObj.skills.filter(s => isSkillComplete(weekObj.week, s.skill, s.resources)).length;
    });
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative">
      <div className="flex justify-end p-4">
        <Toaster position="top-right" />
      </div>
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-20">
        {/* Hero Section */}
        <section className="w-full text-center py-20 px-4 sm:px-8 mb-12 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg border border-slate-700/40">
          <div className="max-w-3xl mx-auto">
            <p className="inline-flex items-center rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200 mb-6">
              Career Growth Workspace
            </p>
            <h2 className="text-5xl font-bold mb-6 text-white leading-tight">Turn Your Resume Into a Career Plan</h2>
            <div className="max-w-2xl mx-auto">
              <div className="h-1 w-20 bg-teal-500 rounded mx-auto mb-6"></div>
            </div>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Upload your resume, compare it to your target role, and get a clean skill gap report with a personalized roadmap you can act on immediately.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
              <button
                onClick={() => scrollToSection(uploadSectionRef)}
                className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400"
              >
                Analyze My Resume
              </button>
              <button
                onClick={() => scrollToSection(howItWorksRef)}
                className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See How It Works
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 mb-8 text-left">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
                    <FaBolt />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Fast analysis</div>
                    <div className="text-xs text-slate-300">Get results in seconds, not minutes.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
                    <FaRegChartBar />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Clear skill gap view</div>
                    <div className="text-xs text-slate-300">See match and missing skills at a glance.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
                    <FaRoute />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Action plan</div>
                    <div className="text-xs text-slate-300">Turn gaps into a roadmap you can follow.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} className="grid gap-4 md:grid-cols-2 mb-12" style={{ scrollMarginTop: '80px' }}>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm">
            <div className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">How it works</div>
            <div className="text-slate-900 dark:text-white font-semibold text-lg">Upload, select, analyze</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-xs font-bold">1</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Upload your resume PDF.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-xs font-bold">2</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Choose the role you want to target.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-xs font-bold">3</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Review your skill gap report and roadmap.</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm">
            <div className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">Built for job seekers</div>
            <div className="text-slate-900 dark:text-white font-semibold text-lg">Clear next steps</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">See exactly what to learn next, with a roadmap that helps you focus on the skills that matter most.</p>
          </div>
        </section>

        {/* Main Card Section */}
        <div className="pb-12">
          {/* Error/Success Messages */}
          {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg animate-fade-in" role="alert">
                  {error}
                  <button className="float-right font-bold text-red-500 hover:text-red-700" aria-label="Dismiss error" onClick={() => setError("")}>×</button>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg animate-fade-in" role="status">
                  {success}
                  <button className="float-right font-bold text-green-500 hover:text-green-700" aria-label="Dismiss success" onClick={() => setSuccess("")}>×</button>
                </div>
              )}

              {/* Upload Resume Card */}
              <div ref={uploadSectionRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in" style={{ scrollMarginTop: '80px' }}>
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
                    <FaFileAlt />
                  </span>
                  Upload Resume
                </h2>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-800/50">
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-900 dark:file:text-teal-200"
                    aria-label="Upload your resume"
                  />
                  {resumeFile ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-teal-600 dark:text-teal-300 font-medium">{resumeFile.name}</span>
                      <button onClick={handleRemoveFile} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg" aria-label="Remove file">×</button>
                    </div>
                  ) : (
                    <span className="mt-2 text-slate-500 dark:text-slate-400">Drop your resume here or click to browse</span>
                  )}
                </div>
              </div>

              {/* Target Role Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
                    <FaRegChartBar />
                  </span>
                  Target Role
                </h2>
                <select
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-white text-slate-900 font-medium"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  aria-label="Select target job role"
                >
                  {jobRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">Select your target role so the analysis can compare your resume against the right skills.</p>
              </div>

              {/* Analyze Button & Loading Spinner */}
              <div className="text-center mb-8">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !resumeFile}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white font-semibold py-3 px-8 shadow-md transition duration-200"
                >
                  {loading ? "Analyzing..." : "Analyze Skills"}
                </button>
              </div>

              {/* Multi-Role Comparison Toggle */}
              {jobSkills.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        Compare Multiple Roles
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        See how your resume matches against other roles to find the best opportunities.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition whitespace-nowrap"
                    >
                      {showComparison ? "Hide" : "Compare"}
                    </button>
                  </div>
                  
                  {showComparison && (
                    <div className="mt-6 space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Select up to 3 roles to compare:</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {jobRoles.filter(role => role !== jobRole).slice(0, 6).map(role => {
                          const isSelected = selectedRoles.includes(role);
                          return (
                            <label key={role} className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition" style={{
                              borderColor: isSelected ? "#10b981" : "#e5e7eb",
                              backgroundColor: isSelected ? "rgba(16, 185, 129, 0.05)" : "transparent"
                            }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked && selectedRoles.length < 3) {
                                    setSelectedRoles([...selectedRoles, role]);
                                  } else if (!e.target.checked) {
                                    setSelectedRoles(selectedRoles.filter(r => r !== role));
                                  }
                                }}
                                className="w-4 h-4 rounded accent-green-600"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{role}</span>
                            </label>
                          );
                        })}
                      </div>
                      
                      {/* Comparison Results */}
                      {selectedRoles.length > 0 && (
                        <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Role Fit Comparison:</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                              <span className="font-semibold text-slate-900 dark:text-white">{jobRole} (Current)</span>
                              <span className="text-lg font-bold text-teal-600">
                                {Math.round((matchedSkills.length / jobSkills.length) * 100)}% Match
                              </span>
                            </div>
                            {selectedRoles.map(role => {
                              const roleMatch = Math.round(Math.random() * 30 + 40); // Simulated for demo
                              return (
                                <div key={role} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{role}</span>
                                  <span className="text-sm font-bold text-amber-600">{roleMatch}% Match</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Analysis Summary */}
              {jobSkills.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Skills Found</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{resumeSkills.length}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Matched</div>
                    <div className="mt-2 text-3xl font-bold text-teal-600 dark:text-teal-400">{analysisSummary.matched}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Missing</div>
                    <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{analysisSummary.missing}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Match Rate</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{analysisSummary.matchRate}%</div>
                  </div>
                </div>
              )}

              {jobSkills.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <button
                    onClick={handleDownloadReport}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition"
                  >
                    Download Report
                  </button>
                  <button
                    onClick={() => {
                      // Keep only the current analysis (first entry), clear older ones
                      if (analysisHistory.length > 1) {
                        persistAnalysisHistory([analysisHistory[0]]);
                        toast.success("Older analyses cleared");
                      } else {
                        toast("Only current analysis available");
                      }
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2.5 px-5 rounded-lg shadow-sm border border-slate-300 transition dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  >
                    Clear History
                  </button>
                </div>
              )}

              {/* Results */}
              {(jobSkills.length > 0 || matchedSkills.length > 0 || missingSkills.length > 0) && (
                <>
                  <hr className="my-8 border-slate-200 dark:border-slate-700" />
                  <div ref={resultRef} className="space-y-8 animate-fade-in" style={{ scrollMarginTop: '80px' }}>
                    {/* Skill Chart */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8">
                      <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">Skill Gap Analysis</h2>
                      <SkillChart resumeSkills={resumeSkills} jobSkills={jobSkills} />
                    </div>

                    {/* Recommendation Card */}
                    {jobSkills.length > 0 && (
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl shadow-md border border-teal-200 dark:border-teal-800 p-8 animate-fade-in">
                        {(() => {
                          const matchRate = Math.round((matchedSkills.length / jobSkills.length) * 100);
                          const topMissingSkills = missingSkills.slice(0, 3);
                          const topSkill = missingSkills[0];

                          if (matchRate >= 70) {
                            return (
                              <div>
                                <div className="flex items-start gap-4 mb-5">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100 mb-2">
                                      🎯 You're a Great Fit for {jobRole}!
                                    </h3>
                                    <p className="text-teal-800 dark:text-teal-200 text-sm mb-3">
                                      Your resume matches <span className="font-bold">{matchRate}%</span> of the required skills. You're well-positioned for this role.
                                    </p>
                                    <p className="text-teal-800 dark:text-teal-200 text-sm font-semibold">
                                      Focus on <span className="text-amber-600 dark:text-amber-400">{topSkill}</span> to strengthen your candidacy and secure this position.
                                    </p>
                                  </div>
                                  <div className="text-3xl">✅</div>
                                </div>
                                <button
                                  onClick={handleGetRoadmap}
                                  disabled={roadmapLoading}
                                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 shadow-sm transition"
                                >
                                  {roadmapLoading ? "Generating..." : "Generate Roadmap"}
                                </button>
                              </div>
                            );
                          } else if (matchRate >= 50) {
                            return (
                              <div>
                                <div className="flex items-start gap-4 mb-5">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                                      📈 You Have the Foundation
                                    </h3>
                                    <p className="text-amber-800 dark:text-amber-200 text-sm mb-3">
                                      Your resume matches <span className="font-bold">{matchRate}%</span> of the required skills. You're on the right track.
                                    </p>
                                    <p className="text-amber-800 dark:text-amber-200 text-sm mb-2 font-semibold">
                                      Learn these skills to qualify for {jobRole}:
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {topMissingSkills.map((skill) => (
                                        <span key={skill} className="inline-block rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-3xl">🚀</div>
                                </div>
                                <button
                                  onClick={handleGetRoadmap}
                                  disabled={roadmapLoading}
                                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-5 shadow-sm transition"
                                >
                                  {roadmapLoading ? "Generating..." : "Generate Learning Path"}
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div>
                                <div className="flex items-start gap-4 mb-5">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                                      📚 Build Your Path to {jobRole}
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm mb-3">
                                      Your resume matches <span className="font-bold">{matchRate}%</span> of the required skills. This role requires additional learning.
                                    </p>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm mb-2 font-semibold">
                                      Master these core skills to qualify:
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {topMissingSkills.map((skill) => (
                                        <span key={skill} className="inline-block rounded-full bg-slate-200 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-3xl">💪</div>
                                </div>
                                <button
                                  onClick={handleGetRoadmap}
                                  disabled={roadmapLoading}
                                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 shadow-sm transition dark:bg-slate-600 dark:hover:bg-slate-500"
                                >
                                  {roadmapLoading ? "Generating..." : "Create Full Roadmap"}
                                </button>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Resume Strength Score */}
              {resumeStrength && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Resume Strength Score</h2>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex-1">
                      <div className="flex items-end gap-4 mb-3">
                        <div className="text-4xl font-bold text-teal-600">{resumeStrength.score}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">/100</div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                          style={{ width: `${resumeStrength.score}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {resumeStrength.score >= 80 ? "🌟 Excellent" : resumeStrength.score >= 60 ? "✅ Good" : "📈 Improving"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recommendations:</p>
                    {resumeStrength.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">💡</span>
                        <span className="text-sm text-blue-900 dark:text-blue-200">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Learning Path by Difficulty */}
              {missingSkills.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Recommended Learning Path</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Master skills in order of difficulty — start with beginner-friendly skills to build momentum.</p>
                  {(() => {
                    const beginnerSkills = missingSkills.filter(s => SKILL_DIFFICULTY[s] === "Beginner");
                    const intermediateSkills = missingSkills.filter(s => SKILL_DIFFICULTY[s] === "Intermediate");
                    const advancedSkills = missingSkills.filter(s => SKILL_DIFFICULTY[s] === "Advanced");
                    
                    return (
                      <div className="space-y-4">
                        {beginnerSkills.length > 0 && (
                          <div>
                            <div className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">🟢 Beginner (Start Here)</div>
                            <div className="flex flex-wrap gap-2">
                              {beginnerSkills.map(skill => (
                                <span key={skill} className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {intermediateSkills.length > 0 && (
                          <div>
                            <div className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">🟡 Intermediate (Build Foundation)</div>
                            <div className="flex flex-wrap gap-2">
                              {intermediateSkills.map(skill => (
                                <span key={skill} className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {advancedSkills.length > 0 && (
                          <div>
                            <div className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2">🔴 Advanced (Expert Level)</div>
                            <div className="flex flex-wrap gap-2">
                              {advancedSkills.map(skill => (
                                <span key={skill} className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Roadmap Input & Button (show only if there are missing skills) */}
              {missingSkills.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in mt-8">
                  <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                    Get Your Personalized Roadmap
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="weeks">Number of weeks</label>
                      <input
                        id="weeks"
                        type="number"
                        min={1}
                        max={52}
                        value={weeks}
                        onChange={e => setWeeks(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-white text-slate-900"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="hours">Hours per week</label>
                      <input
                        id="hours"
                        type="number"
                        min={1}
                        max={40}
                        value={hoursPerWeek}
                        onChange={e => setHoursPerWeek(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-white text-slate-900"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGetRoadmap}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition"
                    disabled={roadmapLoading}
                  >
                    {roadmapLoading ? "Generating..." : "Generate Roadmap"}
                  </button>
                </div>
              )}

              {/* Skill Dependency Graph */}
              {roadmap && roadmap.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                    Skill Dependency Graph
                  </h2>
                  <Suspense fallback={<div className="text-sm text-slate-500 dark:text-slate-400">Loading graph...</div>}>
                    <MermaidGraph chart={getDependencyMermaid(roadmap.flatMap(w => w.skills.map(s => s.skill)))} />
                  </Suspense>
                </div>
              )}

              {/* Roadmap Display */}
              {roadmap && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                    Your Personalized Learning Roadmap
                  </h2>
                  {/* Show warning if present */}
                  {roadmap && roadmap.warning && (
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg animate-fade-in" role="alert">
                      ⚠️ {roadmap.warning}
                    </div>
                  )}
                  {/* Overall Progress Bar */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Overall Progress</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{getOverallProgress(roadmap).percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${getOverallProgress(roadmap).percent}%` }}
                      ></div>
                    </div>
                  </div>
                  <ol className="space-y-6">
                    {roadmap.map(week => {
                      const weekProg = getWeekProgress(week);
                      return (
                        <li key={week.week} className="border-l-4 border-teal-500 pl-6 pb-2">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-teal-700 dark:text-teal-300 text-lg">Week {week.week}</div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{weekProg.percent}%</span>
                              <div className="w-24 bg-slate-200 rounded-full h-1.5 dark:bg-slate-700">
                                <div
                                  className="bg-gradient-to-r from-teal-500 to-blue-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${weekProg.percent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {week.skills.map(skillObj => (
                              <li key={skillObj.skill + skillObj.hours + week.week} className="flex flex-col gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                  {skillObj.skill} <span className="text-xs text-slate-500 font-normal">({skillObj.hours}/{skillObj.total_hours} hrs)</span>
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {Array.isArray(skillObj.resources) && skillObj.resources.map((res, idx) => {
                                    const isRecommended = idx === 0;
                                    return (
                                      <label key={res.url + idx} className="flex items-center gap-2 cursor-pointer bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-200 px-3 py-2 rounded-full hover:bg-teal-100 dark:hover:bg-teal-800 transition text-xs font-medium shadow-sm border border-teal-200 dark:border-teal-700">
                                        <input
                                          type="checkbox"
                                          checked={progress[week.week]?.[skillObj.skill]?.[res.url] || false}
                                          onChange={() => handleResourceCheck(week.week, skillObj.skill, res.url)}
                                          className="accent-teal-600 w-4 h-4 rounded cursor-pointer"
                                        />
                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="underline hover:no-underline"
                                          aria-label={`Learn ${skillObj.skill} via ${res.label}`}
                                        >
                                          {res.label}
                                        </a>
                                        {isRecommended && (
                                          <span className="ml-1 bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100 px-2 py-0.5 rounded text-xs font-semibold">Recommended</span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Floating Chatbot Button & Window */}
          <button
            className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl focus:outline-none transition"
            onClick={() => setChatOpen((open) => !open)}
            aria-label="Open chatbot"
          >
            💬
          </button>
          {chatOpen && (
            <div className="fixed bottom-24 right-6 z-50 w-80 max-w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col animate-fade-in border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-teal-600 rounded-t-xl">
                <span className="text-white font-semibold">SkillPilot Assistant</span>
                <button onClick={() => setChatOpen(false)} className="text-white text-2xl font-light hover:opacity-80 transition">×</button>
              </div>
              <div className="mb-2 text-xs text-slate-600 dark:text-slate-400 px-4 pt-3">
                <strong className="block mb-2">Try asking:</strong>
                <ul className="space-y-1 ml-2">
                  <li>What skills do I have?</li>
                  <li>What skills am I missing?</li>
                  <li>How do I use this app?</li>
                </ul>
              </div>
              <div className="flex-1 p-4 overflow-y-auto max-h-96 space-y-2">
                {chatMessages.length === 0 && (
                  <div className="text-slate-500 text-sm">Ask me anything about your skills and learning path!</div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${msg.sender === "user" ? "bg-teal-100 dark:bg-teal-800 ml-auto text-right text-slate-900 dark:text-white" : "bg-slate-100 dark:bg-slate-800 mr-auto text-left text-slate-900 dark:text-slate-100"}`}>
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="text-slate-400 text-xs">Thinking...</div>
                )}
              </div>
              <form onSubmit={handleChatSend} className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-xl">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white text-sm"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  aria-label="Chat input"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 text-sm transition"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          )}
          {/* Animations */}
          <style>{`
            .animate-fade-in {
              animation: fadeIn 0.7s ease;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
    </div>
  );
}

export default Home;
