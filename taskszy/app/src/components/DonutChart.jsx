import { useState } from 'react';
import { ChevronDown, CheckCircle, Clock, RotateCcw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

function ConcentricRings({ rings, total, hovered, compact }) {
  const STROKE = compact ? 7 : 10;
  const SIZE   = compact ? 128 : 176;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const radii  = compact ? [52, 38, 24, 12] : [72, 54, 36, 20];
  const doneRate = total ? Math.round((rings[0]?.value / total) * 100) : 0;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        {rings.map((d) => (
          <linearGradient key={d.gradId} id={`dc-${d.gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={d.grad[0]} />
            <stop offset="100%" stopColor={d.grad[1]} />
          </linearGradient>
        ))}
      </defs>

      {rings.map((item, i) => {
        const r    = radii[i] || radii[radii.length - 1];
        const circ = 2 * Math.PI * r;
        const safeVal = Math.max(item.value, 0);
        const dash = total > 0 ? (safeVal / total) * circ : 0;
        const gap  = circ - dash;
        const isHov = hovered === item.name;
        const sw   = isHov ? STROKE + 2 : STROKE;
        return (
          <g key={item.name}>
            <circle cx={CX} cy={CY} r={r} fill="none" stroke={`${item.color}18`} strokeWidth={sw} />
            <circle cx={CX} cy={CY} r={r} fill="none"
              stroke={`url(#dc-${item.gradId})`} strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={`${dash} ${gap}`} transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: 'stroke-width 0.2s ease' }}
            />
          </g>
        );
      })}

      <text x={CX} y={CY - (compact ? 10 : 14)} textAnchor="middle"
        style={{ fontSize: compact ? 18 : 26, fontWeight: 800, fill: '#1A1D2E', fontFamily: 'Inter,sans-serif', letterSpacing: '-0.5px' }}>
        {total}
      </text>
      <text x={CX} y={CY + (compact ? 6 : 8)} textAnchor="middle"
        style={{ fontSize: compact ? 8 : 10, fill: '#9CA3AF', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>
        Total Tasks
      </text>
      <rect x={CX - (compact ? 22 : 26)} y={CY + (compact ? 12 : 16)} width={compact ? 44 : 52} height={compact ? 14 : 16} rx={8} fill="#E8FBF1" />
      <text x={CX} y={CY + (compact ? 22 : 27)} textAnchor="middle"
        style={{ fontSize: compact ? 8 : 10, fontWeight: 700, fill: '#059669', fontFamily: 'Inter,sans-serif' }}>
        {doneRate}% done
      </text>
    </svg>
  );
}

export default function DonutChart({ compact = false }) {
  const [hovered, setHovered] = useState(null);
  const { dashStats } = useApp();
  const { stageBreakdown, totalTasks } = dashStats;

  const inProgress = (stageBreakdown['Start'] || 0) + (stageBreakdown['Accept'] || 0) + (stageBreakdown['Update'] || 0);

  const rings = [
    { name: 'Complete',    value: stageBreakdown['Complete'] || 0, icon: CheckCircle, color: '#12C479', gradId: 'comp', grad: ['#12C479','#34D399'] },
    { name: 'In Progress', value: inProgress,                      icon: Clock,       color: '#3B5BFC', gradId: 'prog', grad: ['#3B5BFC','#7C9FFF'] },
    { name: 'Review',      value: stageBreakdown['Review'] || 0,   icon: RotateCcw,   color: '#F97316', gradId: 'rev',  grad: ['#F97316','#FB923C'] },
    { name: 'New',         value: stageBreakdown['New'] || 0,      icon: AlertCircle, color: '#9CA3AF', gradId: 'newt', grad: ['#9CA3AF','#D1D5DB'] },
  ];

  return (
    <div className="card animate-fade-slide"
      style={{ padding: compact ? '14px 16px' : '22px 24px', animationDelay: '100ms', height: compact ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: compact ? 10 : 20, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: '#1A1D2E', marginBottom: 2 }}>Task Status</h2>
          <p style={{ fontSize: compact ? 10 : 12, color: '#9CA3AF' }}>Live task breakdown</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F7F8FC', border: '1px solid #EEF0FA', borderRadius: 8, padding: compact ? '4px 10px' : '6px 12px', fontSize: compact ? 10 : 12, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}>
          Live <ChevronDown size={11} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: compact ? 10 : 16, flexShrink: 0 }}>
        <ConcentricRings rings={rings} total={totalTasks} hovered={hovered} compact={compact} />
      </div>

      <div style={{ height: 1, background: '#F0F2F8', marginBottom: compact ? 8 : 14, flexShrink: 0 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8, flex: 1, justifyContent: 'space-between' }}>
        {rings.map((item) => {
          const isHov = hovered === item.name;
          const pct = totalTasks ? Math.round((item.value / totalTasks) * 100) : 0;
          return (
            <div key={item.name}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? '7px 10px' : '10px 12px', borderRadius: 10, background: isHov ? `${item.color}08` : '#FAFBFF', border: `1.5px solid ${isHov ? `${item.color}30` : 'transparent'}`, cursor: 'default', transition: 'background 0.18s, border-color 0.18s', flex: compact ? 1 : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 7 : 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, boxShadow: `0 0 0 2.5px ${item.color}25`, flexShrink: 0 }} />
                <div style={{ width: compact ? 26 : 32, height: compact ? 26 : 32, borderRadius: compact ? 7 : 9, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={compact ? 11 : 14} color={item.color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: compact ? 11 : 13, fontWeight: 600, color: '#1A1D2E' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8 }}>
                <span style={{ fontSize: compact ? 12 : 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>{item.value}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: compact ? 9 : 10, fontWeight: 700, padding: compact ? '2px 5px' : '3px 7px', borderRadius: 20, background: '#F0F2F8', color: '#6B7280' }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
