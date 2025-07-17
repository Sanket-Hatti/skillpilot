import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function MermaidGraph({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.initialize({ startOnLoad: false });
      mermaid.render("theGraph", chart, (svgCode) => {
        ref.current.innerHTML = svgCode;
      });
    }
  }, [chart]);

  return (
    <>
      <div className="mb-4 p-3 bg-blue-50 dark:bg-gray-800 rounded shadow text-sm text-blue-900 dark:text-blue-200">
        <strong>Skill Dependency Graph:</strong> This graph shows the order in which you should learn skills.
        <br />
        <span className="font-medium">Arrows</span> point from prerequisite skills to the skills that depend on them.
        Start with the skills at the beginning of the arrows!
      </div>
      <div ref={ref} />
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
        Only skills with dependencies are shown in the graph. Some missing skills may not appear if they have no prerequisite relationships.
      </div>
    </>
  );
} 