import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const SkillChart = ({ resumeSkills, jobSkills }) => {
  const resumeSet = new Set(resumeSkills.map(skill => skill.toLowerCase()));
  let chartData = jobSkills.map(skill => ({
    skill,
    Status: resumeSet.has(skill.toLowerCase()) ? "Matched" : "Missing",
    Value: 1,
  }));

  // Sort by match status: Matched first, then Missing
  chartData = chartData.sort((a, b) => {
    if (a.Status === "Matched" && b.Status === "Missing") return -1;
    if (a.Status === "Missing" && b.Status === "Matched") return 1;
    return 0;
  });

  const getBarColor = (status) =>
    status === "Matched" ? "#14b8a6" : "#f59e0b";

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { Status } = payload[0].payload;
      return (
        <div className="rounded-xl shadow-lg p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="font-semibold mb-1 text-slate-900 dark:text-slate-100">Skill: {label}</div>
          {Status === "Matched" ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-teal-600 dark:text-teal-400">Matched:</span>
              <span className="text-teal-600 dark:text-teal-400">You have this skill</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-amber-600 dark:text-amber-400">Missing:</span>
              <span className="text-amber-600 dark:text-amber-400">You need to learn this</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-8">
      {/* Removed Skill Gap Overview heading for cleaner look */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-sm bg-teal-600"></span>
            <span className="text-teal-700 dark:text-teal-400 font-semibold text-sm">Matched</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-sm bg-amber-400"></span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">Missing</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={jobSkills.length > 8 ? 40 * jobSkills.length : 360}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 80, bottom: 10 }}
          barCategoryGap={24}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis
            dataKey="skill"
            type="category"
            tick={{ fontSize: 14, fill: "#475569", fontWeight: 500 }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="Value"
            barSize={18}
            radius={[8, 8, 8, 8]}
            isAnimationActive={true}
            animationDuration={1200}
            name="Skill"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.Status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillChart;
