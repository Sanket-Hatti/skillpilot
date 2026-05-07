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
      className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-4 border-b transition-all duration-300
        ${scrolled
          ? "bg-white/95 dark:bg-slate-950/95 shadow-md border-slate-200 dark:border-slate-800 backdrop-blur-md"
          : "bg-white/80 dark:bg-slate-950/80 border-transparent backdrop-blur-none"
        }`}
    >
      <h1
        className={`text-xl font-bold tracking-tight text-slate-900 dark:text-white transition-all duration-500 origin-left
          ${scrolled ? "scale-90" : "scale-100"}
          ${logoVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}
        `}
        style={{ willChange: 'transform, opacity' }}
      >
        SkillPilot
      </h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition"
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
    </header>
  );
}

export default Header;
