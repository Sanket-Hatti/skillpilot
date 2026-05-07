import React from "react";
import { FaChevronRight, FaCheckCircle } from "react-icons/fa";

// Skill dependencies (should match Home.jsx)
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

function SkillDependencyFlow({ skills = [] }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
        <p className="text-sm">No skills to display dependencies for</p>
      </div>
    );
  }

  // Build dependency map for skills in the list
  const skillDependencyMap = {};
  const skillSet = new Set(skills);

  for (const skill of skills) {
    const deps = SKILL_DEPENDENCIES[skill] || [];
    skillDependencyMap[skill] = deps.filter(d => skillSet.has(d));
  }

  // Sort skills: those with no dependencies first, then by dependency depth
  const sortedSkills = [...skills].sort((a, b) => {
    const depsA = skillDependencyMap[a] || [];
    const depsB = skillDependencyMap[b] || [];
    return depsA.length - depsB.length;
  });

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 font-semibold mb-2">
          Skill Prerequisites
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Listed skills below show their prerequisites (if any exist in your learning path)
        </p>
      </div>

      {/* Skill Flow Cards */}
      <div className="space-y-3">
        {sortedSkills.map((skill, index) => {
          const deps = skillDependencyMap[skill] || [];
          const hasDependencies = deps.length > 0;

          return (
            <div key={`${skill}-${index}`} className="animate-fade-in">
              {/* Dependencies */}
              {hasDependencies && (
                <div className="ml-0 mb-2 space-y-2">
                  {deps.map((dep, depIndex) => (
                    <div
                      key={`${skill}-dep-${depIndex}`}
                      className="flex items-center gap-2 pl-4 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30"
                    >
                      <FaCheckCircle className="text-amber-600 dark:text-amber-500 text-xs flex-shrink-0" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {dep}
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-500 ml-auto">
                        Prerequisite
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Skill Card */}
              <div
                className={`p-4 rounded-lg border-2 transition ${
                  hasDependencies
                    ? "bg-teal-50 dark:bg-teal-900/10 border-teal-300 dark:border-teal-700"
                    : "bg-white dark:bg-slate-800 border-teal-400 dark:border-teal-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  {hasDependencies && (
                    <FaChevronRight className="text-teal-600 dark:text-teal-400 text-sm flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {skill}
                  </span>
                  {hasDependencies && (
                    <span className="ml-auto text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-1 rounded">
                      {deps.length} prerequisite{deps.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {sortedSkills.filter(s => (skillDependencyMap[s] || []).length > 0).length}
          </span>{" "}
          skill{sortedSkills.filter(s => (skillDependencyMap[s] || []).length > 0).length !== 1 ? "s" : ""} have prerequisites in your path
        </p>
      </div>
    </div>
  );
}

export default SkillDependencyFlow;
