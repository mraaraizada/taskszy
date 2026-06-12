import {
  BarChart,
  Bar,
  BarXAxis,
  Grid,
  ChartTooltip,
  LinearGradient,
  BarLineIndicator,
} from "./ui/bar-chart";

const chartData = [
  { month: "Jan", revenue: 4200, completed: 12, overdue: 2, onHold: 1 },
  { month: "Feb", revenue: 3800, completed: 10, overdue: 3, onHold: 2 },
  { month: "Mar", revenue: 5100, completed: 15, overdue: 1, onHold: 0 },
  { month: "Apr", revenue: 4600, completed: 13, overdue: 2, onHold: 1 },
  { month: "May", revenue: 5400, completed: 16, overdue: 1, onHold: 1 },
  { month: "Jun", revenue: 6200, completed: 18, overdue: 0, onHold: 2 },
  { month: "Jul", revenue: 5800, completed: 17, overdue: 2, onHold: 0 },
  { month: "Aug", revenue: 6800, completed: 20, overdue: 1, onHold: 1 },
  { month: "Sep", revenue: 6100, completed: 18, overdue: 2, onHold: 1 },
  { month: "Oct", revenue: 7200, completed: 22, overdue: 0, onHold: 0 },
  { month: "Nov", revenue: 6900, completed: 21, overdue: 1, onHold: 2 },
  { month: "Dec", revenue: 7800, completed: 24, overdue: 0, onHold: 1 },
];

export default function BarChartDemo() {
  return (
    <div className="w-full h-full bg-white">
      <BarChart
        data={chartData}
        xDataKey="month"
        barGap={0}
        aspectRatio="auto"
        className="w-full h-full"
        margin={{ top: 20, right: 20, bottom: 30, left: 20 }}
        animationDuration={0}
      >
        <LinearGradient
          from="#f59e0b"
          to="rgba(245, 158, 11, 0)"
          id="noGapGradient"
        />
        <Grid horizontal stroke="rgba(0,0,0,0.1)" />
        <Bar
          dataKey="revenue"
          fill="url(#noGapGradient)"
          lineCap="butt"
          stroke="#f59e0b"
          fadedOpacity={0.2}
          animate={false}
        />
        <BarXAxis />
        <ChartTooltip 
          showCrosshair={false} 
          showDots={false}
          rows={(point) => [
            { color: "#10b981", label: "Completed", value: point.completed || 0 },
            { color: "#ef4444", label: "Overdue", value: point.overdue || 0 },
            { color: "#f59e0b", label: "On Hold", value: point.onHold || 0 },
          ]}
        />
        <BarLineIndicator
          data={chartData}
          valueKey="revenue"
          xKey="month"
          stroke="#3b82f6"
          strokeWidth={3}
          offsetY={-5}
        />
      </BarChart>
    </div>
  );
}
