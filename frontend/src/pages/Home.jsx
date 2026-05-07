import { useState, useRef, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import SkillChart from "../components/SkillChart";
import toast, { Toaster } from "react-hot-toast";
import { FaBolt, FaFileAlt, FaRegChartBar, FaRoute } from "react-icons/fa";

const MermaidGraph = lazy(() => import("../components/MermaidGraph"));

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

function Home() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
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
      <div className="max-w-4xl mx-auto px-4 pb-12 pt-20">
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

        <section ref={howItWorksRef} className="grid gap-4 md:grid-cols-2 mb-12">
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
              <div ref={uploadSectionRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8 animate-fade-in">
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
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition text-base focus:outline-none focus:ring-2 focus:ring-teal-500 animate-fade-in"
                  disabled={loading}
                  aria-busy={loading}
                >
                  Analyze Skills
                </button>
                {loading && (
                  <div className="flex justify-center mt-4 animate-fade-in">
                    <svg className="animate-spin h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading spinner">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  </div>
                )}
              </div>

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
                  <div ref={resultRef} className="space-y-8 animate-fade-in">
                    {/* Skill Chart */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8 mb-8">
                      <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">Skill Gap Analysis</h2>
                      <SkillChart resumeSkills={resumeSkills} jobSkills={jobSkills} />
                    </div>
                  </div>
                </>
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
