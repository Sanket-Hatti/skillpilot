import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const SkillChart = ({ resumeSkills, jobSkills }) => {
  const resumeSet = new Set(resumeSkills.map(skill => skill.toLowerCase()));
  const chartData = jobSkills.map(skill => ({
    skill,
    Status: resumeSet.has(skill.toLowerCase()) ? "Matched" : "Missing",
    Value: 1,
  }));

  const getBarColor = (status) =>
    status === "Matched" ? "#2563eb" : "#f87171";

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { Status } = payload[0].payload;
      return (
        <div className="rounded-xl shadow-lg p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Skill: {label}</div>
          {Status === "Matched" ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">Matched:</span>
              <span className="text-blue-600 dark:text-blue-400">You have this skill!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-red-600 dark:text-red-400">Missing:</span>
              <span className="text-red-600 dark:text-red-400">You are missing this skill</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-800">
      {/* Removed Skill Gap Overview heading for cleaner look */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Matched</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-red-600 dark:text-red-400 font-medium">Missing</span>
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis
            dataKey="skill"
            type="category"
            tick={{ fontSize: 16, fill: "#334155", fontWeight: 600 }}
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
