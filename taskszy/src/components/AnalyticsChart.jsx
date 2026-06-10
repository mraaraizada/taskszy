import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Generate 30 days of data
const generateChartData = () => {
  const data = [];
  const startDate = Date.now() - 29 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate + i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: 12000 + Math.random() * 12000,
      costs: 8000 + Math.random() * 9000,
    });
  }
  
  return data;
};

const chartData = generateChartData();

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-700 shadow-xl">
        <p className="text-white font-medium text-xs mb-1.5">{payload[0].payload.date}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5b5ff8]"></span>
              <span className="text-zinc-400 text-xs">Revenue</span>
            </div>
            <span className="text-white font-semibold text-xs tabular-nums">
              ${Math.round(payload[0].value).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span className="text-zinc-400 text-xs">Costs</span>
            </div>
            <span className="text-white font-semibold text-xs tabular-nums">
              ${Math.round(payload[1].value).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-xl p-4 flex flex-col">
      <div className="flex-1 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5b5ff8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#5b5ff8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#71717a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="#52525b"
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis 
              stroke="#52525b"
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#5b5ff8" 
              strokeWidth={2}
              fill="url(#colorRevenue)" 
              animationDuration={1000}
            />
            <Area 
              type="monotone" 
              dataKey="costs" 
              stroke="#71717a" 
              strokeWidth={2}
              fill="url(#colorCosts)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
