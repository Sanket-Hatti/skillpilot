import { useEffect, useState } from "react";

function Header() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [scrolled, setScrolled] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setTimeout(() => setLogoVisible(true), 100);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 border-b transition-all duration-300
        ${scrolled
          ? "bg-white/90 dark:bg-gray-900/90 shadow-lg backdrop-blur-md"
          : "bg-white/60 dark:bg-gray-900/60 shadow-none backdrop-blur-none"
        }`}
    >
      <h1
        className={`text-2xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-500 origin-left
          ${scrolled ? "scale-90" : "scale-100"}
          ${logoVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}
        `}
        style={{ willChange: 'transform, opacity' }}
      >
        🚀 SkillPilot
      </h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:opacity-80 text-gray-800 dark:text-white"
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
    </header>
  );
}

export default Header;
