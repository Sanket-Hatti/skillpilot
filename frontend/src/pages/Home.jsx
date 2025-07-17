import { useState, useRef, useEffect } from "react";
import axios from "axios";
import SkillChart from "../components/SkillChart";
import MermaidGraph from "../components/MermaidGraph";

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
  if (edges.length === 0) return "graph TD;\n  NoDependencies[No dependencies for your missing skills]";
  return `graph TD;\n  ${edges.join(";\n  ")}`;
}

function Home() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [jobRoles, setJobRoles] = useState([]);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [learningResources, setLearningResources] = useState({});
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
  // Resource-level progress: progress[week][skill][resourceUrl] = true/false
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Fetch job roles from backend
    axios.get("http://127.0.0.1:5000/roles")
      .then(res => {
        setJobRoles(res.data.roles || []);
        if (res.data.roles && res.data.roles.length > 0) {
          setJobRole(res.data.roles[0]);
        }
      })
      .catch(() => setError("Failed to load job roles."));
  }, []);

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Please upload a resume.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("role", jobRole);

      const response = await axios.post("http://127.0.0.1:5000/analyze", formData);
      setResumeSkills(response.data.resumeSkills || []);
      setJobSkills(response.data.jobSkills || []);
      setMatchedSkills(response.data.matchedSkills || []);
      setMissingSkills(response.data.missingSkills || []);
      setLearningResources(response.data.learningResources || {});
      setSuccess("Analysis complete!");
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (error) {
      setError("Something went wrong. Please try again.");
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
      const response = await axios.post("http://127.0.0.1:5000/roadmap", {
        missing_skills: missingSkills,
        total_weeks: weeks,
        hours_per_week: hoursPerWeek
      });
      setRoadmap(response.data.roadmap);
    } catch (err) {
      setError("Failed to generate roadmap. Please try again.");
    } finally {
      setRoadmapLoading(false);
    }
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
      const response = await axios.post("http://127.0.0.1:5000/chatbot", {
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

  const handleSkillCheck = (week, skill) => {
    setProgress(prev => ({
      ...prev,
      [week]: {
        ...(prev[week] || {}),
        [skill]: !(prev[week] && prev[week][skill])
      }
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative">
      {/* Decorative SVGs - fixed to viewport corners */}
      <div className="fixed top-0 left-0 w-64 h-64 opacity-10 pointer-events-none z-0">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="#a5b4fc" d="M40.5,-67.6C52.7,-60.2,62.7,-52.2,70.2,-41.6C77.7,-31,82.7,-17.8,81.7,-5.1C80.7,7.6,73.7,20.8,65.2,32.2C56.7,43.6,46.7,53.2,35.1,59.7C23.5,66.2,10.2,69.6,-2.7,73.1C-15.6,76.6,-31.2,80.2,-41.2,73.2C-51.2,66.2,-55.7,48.6,-62.2,33.2C-68.7,17.8,-77.2,4.6,-75.7,-7.2C-74.2,-19,-62.7,-29.4,-52.2,-37.7C-41.7,-46,-32.2,-52.2,-21.1,-60.2C-10,-68.2,2.7,-78,16.2,-80.2C29.7,-82.4,44,-77,40.5,-67.6Z" transform="translate(100 100)" />
        </svg>
      </div>
      <div className="fixed bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none z-0">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="#fca5a5" d="M40.5,-67.6C52.7,-60.2,62.7,-52.2,70.2,-41.6C77.7,-31,82.7,-17.8,81.7,-5.1C80.7,7.6,73.7,20.8,65.2,32.2C56.7,43.6,46.7,53.2,35.1,59.7C23.5,66.2,10.2,69.6,-2.7,73.1C-15.6,76.6,-31.2,80.2,-41.2,73.2C-51.2,66.2,-55.7,48.6,-62.2,33.2C-68.7,17.8,-77.2,4.6,-75.7,-7.2C-74.2,-19,-62.7,-29.4,-52.2,-37.7C-41.7,-46,-32.2,-52.2,-21.1,-60.2C-10,-68.2,2.7,-78,16.2,-80.2C29.7,-82.4,44,-77,40.5,-67.6Z" transform="translate(100 100)" />
        </svg>
      </div>
      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 pb-12 pt-20">
        {/* Hero Section */}
        <section className="w-full text-center py-16 px-4 sm:px-8 mb-8 bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900">
          <h2 className="text-5xl font-extrabold mb-8 text-white leading-tight">Unlock Your Career</h2>
          <div className="max-w-2xl mx-auto">
            <div className="h-2 w-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded mb-6 opacity-70"></div>
          </div>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            AI-powered skill analysis and personalized learning paths to accelerate your career growth
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-white/90 text-base mb-2">
            <span className="flex items-center gap-2"><span className="text-xl">⚡</span> Instant Analysis</span>
            <span className="flex items-center gap-2"><span className="text-xl">📊</span> Skill Tracking</span>
            <span className="flex items-center gap-2"><span className="text-xl">📚</span> Learning Plans</span>
          </div>
        </section>

        {/* Main Card Section */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded shadow animate-fade-in" role="alert">
              {error}
              <button className="float-right text-red-500" aria-label="Dismiss error" onClick={() => setError("")}>×</button>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded shadow animate-fade-in" role="status">
              {success}
              <button className="float-right text-green-500" aria-label="Dismiss success" onClick={() => setSuccess("")}>×</button>
            </div>
          )}

          {/* Upload Resume Card */}
          <div className="bg-white/90 dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-purple-500 text-2xl">📄</span> Upload Resume
            </h2>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                aria-label="Upload your resume"
              />
              {resumeFile ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">{resumeFile.name}</span>
                  <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 text-lg" aria-label="Remove file">×</button>
                </div>
              ) : (
                <span className="mt-2 text-gray-500 dark:text-gray-300">Drop your resume here or click to browse</span>
              )}
            </div>
          </div>

          {/* Target Role Card */}
          <div className="bg-white/90 dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-500 text-2xl">🎯</span> Target Role
            </h2>
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              aria-label="Select target job role"
            >
              {jobRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Select your target role for personalized analysis</p>
          </div>

          {/* Analyze Button & Loading Spinner */}
          <div className="text-center mb-8">
            <button
              onClick={handleAnalyze}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 animate-fade-in"
              disabled={loading}
              aria-busy={loading}
            >
              🚀 Analyze Skills
            </button>
            {loading && (
              <div className="flex justify-center mt-4 animate-fade-in">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading spinner">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </div>
            )}
          </div>

          {/* Results */}
          {(jobSkills.length > 0 || matchedSkills.length > 0 || missingSkills.length > 0) && (
            <>
              <hr className="my-8 border-gray-300 dark:border-gray-700" />
              <div ref={resultRef} className="space-y-8 animate-fade-in">
                {/* Skill Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">📊 Skill Gap Chart</h2>
                  <SkillChart resumeSkills={resumeSkills} jobSkills={jobSkills} />
                </div>
              </div>
            </>
          )}

          {/* Roadmap Input & Button (show only if there are missing skills) */}
          {missingSkills.length > 0 && (
            <div className="bg-white/90 dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in mt-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-500 text-2xl">🗺️</span> Get Your Personalized Roadmap
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="weeks">Number of weeks</label>
                  <input
                    id="weeks"
                    type="number"
                    min={1}
                    max={52}
                    value={weeks}
                    onChange={e => setWeeks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" htmlFor="hours">Hours per week</label>
                  <input
                    id="hours"
                    type="number"
                    min={1}
                    max={40}
                    value={hoursPerWeek}
                    onChange={e => setHoursPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleGetRoadmap}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
                disabled={roadmapLoading}
              >
                {roadmapLoading ? "Generating..." : "Generate Roadmap"}
              </button>
            </div>
          )}

          {/* Skill Dependency Graph */}
          {roadmap && roadmap.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-blue-500 text-2xl">🕸️</span> Skill Dependency Graph
              </h2>
              <MermaidGraph chart={getDependencyMermaid(roadmap.flatMap(w => w.skills.map(s => s.skill)))} />
            </div>
          )}

          {/* Roadmap Display */}
          {roadmap && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-green-500 text-2xl">📅</span> Your Personalized Learning Roadmap
              </h2>
              {/* Show warning if present */}
              {roadmap && roadmap.warning && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded shadow animate-fade-in" role="alert">
                  ⚠️ {roadmap.warning}
                </div>
              )}
              {/* Overall Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Overall Progress</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{getOverallProgress(roadmap).percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-green-400 h-2.5 rounded-full transition-all"
                    style={{ width: `${getOverallProgress(roadmap).percent}%` }}
                  ></div>
                </div>
              </div>
              <ol className="space-y-6">
                {roadmap.map(week => {
                  const weekProg = getWeekProgress(week);
                  return (
                    <li key={week.week} className="border-l-4 border-indigo-400 pl-4 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-indigo-700 dark:text-indigo-300">Week {week.week}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-300">{weekProg.percent}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-green-400 h-2 rounded-full transition-all"
                              style={{ width: `${weekProg.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {week.skills.map(skillObj => (
                          <li key={skillObj.skill + skillObj.hours + week.week} className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {skillObj.skill} <span className="text-xs text-gray-500">({skillObj.hours}/{skillObj.total_hours} hrs)</span>
                            </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Array.isArray(skillObj.resources) && skillObj.resources.map((res, idx) => {
                                let icon = "📖";
                                if (/video|youtube/i.test(res.label)) icon = "▶️";
                                if (/google/i.test(res.label)) icon = "🔍";
                                const isRecommended = idx === 0;
                                return (
                                  <label key={res.url + idx} className="flex items-center gap-2 cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition text-sm font-medium shadow-sm border border-blue-200 dark:border-blue-700">
                                    <input
                                      type="checkbox"
                                      checked={progress[week.week]?.[skillObj.skill]?.[res.url] || false}
                                      onChange={() => handleResourceCheck(week.week, skillObj.skill, res.url)}
                                      className="accent-indigo-500 w-4 h-4 rounded"
                                    />
                                    <span>{icon}</span>
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
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
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl focus:outline-none"
        onClick={() => setChatOpen((open) => !open)}
        aria-label="Open chatbot"
      >
        💬
      </button>
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-indigo-600 rounded-t-xl">
            <span className="text-white font-semibold">SkillPilot Chatbot</span>
            <button onClick={() => setChatOpen(false)} className="text-white text-xl font-bold">×</button>
          </div>
          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 px-4 pt-2">
            <strong>Try asking me:</strong>
            <ul className="list-disc list-inside ml-2">
              <li>What skills do I have?</li>
              <li>What skills am I missing?</li>
              <li>How do I use this app?</li>
              <li>How can I improve my resume?</li>
              <li>What is a skill gap?</li>
              <li>How do I stay motivated?</li>
            </ul>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-96 space-y-2">
            {chatMessages.length === 0 && (
              <div className="text-gray-400 text-sm">Ask me anything about your roadmap, skills, or learning resources!</div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${msg.sender === "user" ? "bg-indigo-100 dark:bg-indigo-800 ml-auto text-right" : "bg-gray-100 dark:bg-gray-700 mr-auto text-left"}`}>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="text-gray-400 text-xs">Thinking...</div>
            )}
          </div>
          <form onSubmit={handleChatSend} className="flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-white"
              placeholder="Type your question..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={chatLoading}
              aria-label="Chat input"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
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
