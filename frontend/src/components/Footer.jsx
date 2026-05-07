import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

function Footer() {
  return (
    <footer className="w-full text-center py-8 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 mt-16 flex flex-col items-center gap-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex gap-6 justify-center">
        <a href="https://github.com/Sanket-Hatti" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5 transition">
          <FaGithub className="text-lg" /> GitHub
        </a>
        <a href="https://linkedin.com/in/sanket-hatti-9253b6301/" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5 transition">
          <FaLinkedin className="text-lg" /> LinkedIn
        </a>
        <a href="mailto:sanketshatti18@gmail.com" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Contact</a>
        <a href="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Privacy</a>
      </div>
      <div className="text-sm">
        © {new Date().getFullYear()} SkillPilot. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer; 