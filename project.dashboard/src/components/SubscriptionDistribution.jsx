import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bone } from './Skeleton';

const PLAN_COLORS = {
  Free: '#9CA3AF',
  Starter: '#D97706',
  Professional: '#3B5BFC',
  Business: '#12C479',
  Enterprise: '#F97316'
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid #E5E7EB'
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', marginBottom: 4 }}>
        {data.plan}
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
        Organizations: <span style={{ fontWeight: 700, color: '#1A1D2E' }}>{data.count}</span>
      </div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>
        Percentage: <span style={{ fontWeight: 700, color: data.color }}>{data.percentage}%</span>
      </div>
    </div>
  );
};

const CustomLegend = ({ payload }) => {
  return null;
};

// Removed: Percentages now only show on hover in tooltip, not on chart segments
const renderCustomLabel = () => {
  return null;
};

export default function SubscriptionDistribution({ data = [], isLoading = false, selectedView = 'monthly' }) {
  const [hoveredPlan, setHoveredPlan] = useState(null);

  if (isLoading) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '24px 26px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1.5px solid #E8EAEF',
      }}>
        <div style={{ marginBottom: 20 }}>
          <Bone w="40%" h={18} style={{ marginBottom: 6 }} />
          <Bone w="60%" h={12} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300
        }}>
          <Bone w={200} h={200} r="50%" />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 20
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bone w={12} h={12} r="50%" />
              <Bone w={60} h={13} />
              <Bone w={30} h={20} r={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Prepare data for the chart
  const totalOrganizations = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
  
  const chartData = data.map(item => {
    const count = item.value || item.count || 0;
    const percentage = totalOrganizations > 0 ? Math.round((count / totalOrganizations) * 100) : 0;
    return {
      plan: item.name || item.plan,
      count: count,
      percentage: percentage,
      color: item.color || PLAN_COLORS[item.name || item.plan] || '#9CA3AF'
    };
  });

  // Empty state
  if (totalOrganizations === 0) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '24px 26px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1.5px solid #E8EAEF',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: 4
          }}>
            Revenue Graph
          </h2>
          <p style={{
            fontSize: 12,
            color: '#9CA3AF'
          }}>
            Plan distribution and revenue metrics
          </p>
        </div>

        <div style={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>
            No subscription data yet
          </h3>
          <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 280 }}>
            Add organizations with subscription plans to see the distribution chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 20,
      padding: '24px 26px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      border: '1.5px solid #E8EAEF',
      transition: 'all 0.3s ease',
      animation: 'fadeIn 0.4s ease-in-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0.7; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#1F2937',
          marginBottom: 4
        }}>
          Revenue Graph
        </h2>
        <p style={{
          fontSize: 12,
          color: '#9CA3AF'
        }}>
          Plan distribution and revenue metrics
        </p>
      </div>

      <div style={{
        position: 'relative',
        minHeight: 300,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="count"
              label={renderCustomLabel}
              labelLine={false}
              onMouseEnter={(_, index) => setHoveredPlan(chartData[index].plan)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={hoveredPlan === entry.plan ? '#fff' : 'none'}
                  strokeWidth={hoveredPlan === entry.plan ? 3 : 0}
                  style={{
                    filter: hoveredPlan === entry.plan ? 'brightness(1.1)' : 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label showing total */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#1A1D2E',
            lineHeight: 1,
            letterSpacing: '-0.5px'
          }}>
            {totalOrganizations}
          </span>
          <span style={{
            fontSize: 11,
            color: '#9CA3AF',
            fontWeight: 600,
            marginTop: 4
          }}>
            Total Orgs
          </span>
        </div>
      </div>
    </div>
  );
}
