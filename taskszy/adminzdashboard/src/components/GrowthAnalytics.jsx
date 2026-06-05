import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 10, 
      padding: '10px 14px', 
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', 
      border: '1px solid #E5E7EB' 
    }}>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function GrowthAnalytics({ monthlyData, yearlyData, selectedView, onViewChange, isLoading }) {
  const data = selectedView === 'monthly' ? monthlyData : yearlyData;

  return (
    <div style={{ 
      background: '#FFFFFF',
      borderRadius: 20,
      padding: '24px 26px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      border: '1.5px solid #E8EAEF',
      transition: 'all 0.3s ease',
    }}>
      {/* Header with view toggle */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
            Organizational Growth
          </h2>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>
            {selectedView === 'monthly' ? 'Monthly Growth' : 'Yearly growth comparison'}
          </p>
        </div>

        {/* View toggle buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 6, 
          background: '#F3F4F6', 
          padding: 4, 
          borderRadius: 10 
        }}>
          <button
            onClick={() => onViewChange('monthly')}
            style={{
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: selectedView === 'monthly' ? '#3B5BFC' : 'transparent',
              color: selectedView === 'monthly' ? '#fff' : '#6B7280',
              boxShadow: selectedView === 'monthly' ? '0 2px 8px rgba(59, 91, 252, 0.25)' : 'none',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => onViewChange('yearly')}
            style={{
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: selectedView === 'yearly' ? '#3B5BFC' : 'transparent',
              color: selectedView === 'yearly' ? '#fff' : '#6B7280',
              boxShadow: selectedView === 'yearly' ? '0 2px 8px rgba(59, 91, 252, 0.25)' : 'none',
            }}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div style={{ width: '100%', height: 280 }}>
        {isLoading ? (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: 'var(--input-bg)', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading chart...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 91, 252, 0.1)'
            }}>
              <TrendingUp size={28} color="#3B5BFC" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                No growth data yet
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 240 }}>
                Add organizations to see {selectedView === 'monthly' ? 'monthly' : 'yearly'} growth trends
              </div>
            </div>
          </div>
        ) : selectedView === 'monthly' ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B5BFC" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B5BFC" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                name="Organizations"
                stroke="#3B5BFC" 
                strokeWidth={2}
                fill="url(#colorGrowth)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                name="Organizations"
                fill="#3B5BFC" 
                radius={[8, 8, 0, 0]} 
                barSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
