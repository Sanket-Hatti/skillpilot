import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

function Footer() {
  return (
    <footer className="w-full text-center py-4 text-gray-500 dark:text-gray-400 bg-transparent mt-8 flex flex-col items-center gap-2">
      <div className="flex gap-4 justify-center mb-1">
        <a href="https://github.com/Sanket-Hatti" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center gap-1">
          <FaGithub className="inline text-lg" /> GitHub
        </a>
        <a href="https://linkedin.com/in/sanket-hatti-9253b6301/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center gap-1">
          <FaLinkedin className="inline text-lg" /> LinkedIn
        </a>
        <a href="mailto:sanketshatti18@gmail.com" className="hover:text-blue-600">Contact</a>
        <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
      </div>
      <div>
        © {new Date().getFullYear()} SkillPilot. All rights reserved.
      </div>
      <div className="text-xs">Made with ❤️ using React & Flask</div>
    </footer>
  );
}

export default Footer; 