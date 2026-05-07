import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function MermaidGraph({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current || !chart) {
        return;
      }

      const hasEdges = chart.includes("-->");
      if (!hasEdges) {
        ref.current.innerHTML = `
          <div class="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-sm text-slate-600 dark:text-slate-300">
            No prerequisite links were found for this roadmap yet.
          </div>
        `;
        return;
      }

      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "default"
        });

        const uniqueId = `mermaid-graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (error) {
        console.error("MermaidGraph: Error rendering diagram:", error);
        if (ref.current) {
          ref.current.innerHTML = `
            <div class="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-sm text-slate-600 dark:text-slate-300">
              <div>
                <p class="font-semibold mb-1">Error rendering dependency graph</p>
                <p class="text-xs opacity-75">${error.message || "Unknown error"}</p>
              </div>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [chart]);

  return (
    <>
      <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800 text-sm text-teal-900 dark:text-teal-100 leading-relaxed">
        <strong className="block mb-2">Skill Dependency Graph:</strong>
        This graph shows which skills depend on others. Skills with arrows pointing to them require the prerequisite skills. Start with skills at the beginning of the arrows.
      </div>
      <div ref={ref} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-4 min-h-[240px]" />
      <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 italic">
        Only skills with dependencies are shown. Some skills may not appear if they have no prerequisites.
      </div>
    </>
  );
} 