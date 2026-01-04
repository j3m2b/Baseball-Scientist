'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TeamProbability {
  team_code: string;
  team_name: string;
  probability: number;
  rank: number;
}

interface ProbabilityChartProps {
  data: TeamProbability[];
}

// Gradient colors for modern look
const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

export function ProbabilityChart({ data }: ProbabilityChartProps) {
  const chartData = data.slice(0, 10).map((team) => ({
    name: team.team_code,
    probability: parseFloat(team.probability.toFixed(1)),
    fullName: team.team_name,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.2} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#93c5fd', fontSize: 12, fontWeight: 600 }}
        />
        <YAxis
          tick={{ fill: '#93c5fd', fontSize: 12 }}
          label={{
            value: 'Win Probability (%)',
            angle: -90,
            position: 'insideLeft',
            style: { fill: '#60a5fa', fontSize: 14, fontWeight: 600 }
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
          }}
          labelStyle={{ color: '#93c5fd', fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ color: '#dbeafe' }}
          formatter={(value: number, name: string, props: any) => [
            `${value}% chance`,
            props.payload.fullName,
          ]}
          cursor={{ fill: '#1e40af', opacity: 0.1 }}
        />
        <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              opacity={0.9}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
