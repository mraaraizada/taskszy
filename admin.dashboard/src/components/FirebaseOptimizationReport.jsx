/**
 * Firebase Optimization Report Component
 * 
 * Displays real-time Firebase read analytics and optimization insights
 * For development and monitoring purposes
 */

import { useState, useEffect } from 'react';
import { Activity, TrendingDown, Database, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import readMonitor from '../lib/readMonitor';
import queryOptimizer from '../lib/queryOptimizer';
import cacheManager from '../lib/cacheManager';

export default function FirebaseOptimizationReport() {
  const [report, setReport] = useState(null);
  const [queryStats, setQueryStats] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      setReport(readMonitor.generateReport());
      setQueryStats(queryOptimizer.getStats());
      setCacheStats(cacheManager.getStats());
    }, 5000);

    // Initial load
    setReport(readMonitor.generateReport());
    setQueryStats(queryOptimizer.getStats());
    setCacheStats(cacheManager.getStats());

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '12px 16px',
          background: '#3B5BFC',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 91, 252, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 9999
        }}
      >
        <Activity size={16} />
        Firebase Stats
      </button>
    );
  }

  if (!report) return null;

  const { summary, topCollections, recommendations } = report;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 450,
      maxHeight: '80vh',
      background: '#fff',
      border: '2px solid #E5E7EB',
      borderRadius: 12,
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #3B5BFC 0%, #7C3AED 100%)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={20} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Firebase Optimization</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>Real-time Analytics</div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            width: 28,
            height: 28,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 600
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <StatCard
            icon={<Activity size={16} color="#3B5BFC" />}
            label="Total Reads"
            value={summary.totalReads}
            color="#3B5BFC"
          />
          <StatCard
            icon={<Zap size={16} color="#12C479" />}
            label="Cached Reads"
            value={summary.cachedReads}
            color="#12C479"
          />
          <StatCard
            icon={<TrendingDown size={16} color="#F97316" />}
            label="Cache Hit Rate"
            value={summary.cacheHitRate}
            color="#F97316"
          />
          <StatCard
            icon={<Database size={16} color="#7C3AED" />}
            label="Efficiency"
            value={`${summary.efficiency}%`}
            color="#7C3AED"
          />
        </div>

        {/* Cost Savings */}
        <div style={{
          padding: 16,
          background: '#ECFDF5',
          border: '1px solid #12C479',
          borderRadius: 8,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 8 }}>
            💰 Cost Savings
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#047857' }}>
            <span>Estimated Cost: {summary.estimatedCost}</span>
            <span>Saved: {summary.savedCost}</span>
          </div>
        </div>

        {/* Query Optimizer Stats */}
        {queryStats && (
          <div style={{
            padding: 16,
            background: '#EEF2FF',
            border: '1px solid #3B5BFC',
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC', marginBottom: 8 }}>
              ⚡ Query Optimizer
            </div>
            <div style={{ fontSize: 11, color: '#4338CA', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Cache Hit Rate: {queryStats.cacheHitRate}</div>
              <div>Deduplicated: {queryStats.deduplicated} queries</div>
              <div>In-flight: {queryStats.inflightRequests} requests</div>
            </div>
          </div>
        )}

        {/* Top Collections */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', marginBottom: 12 }}>
            📊 Top Collections
          </div>
          {topCollections.map((col, idx) => (
            <div key={idx} style={{
              padding: '10px 12px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1D2E' }}>{col.name}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>
                  {col.reads} reads · {col.cached} cached
                </div>
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: col.reads > 50 ? '#EF4444' : '#12C479'
              }}>
                {col.reads > 50 ? '⚠️' : '✅'}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', marginBottom: 12 }}>
              💡 Recommendations
            </div>
            {recommendations.map((rec, idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                background: rec.priority === 'high' ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${rec.priority === 'high' ? '#FCA5A5' : '#FCD34D'}`,
                borderRadius: 6,
                marginBottom: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
                  {rec.priority === 'high' ? (
                    <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <CheckCircle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1A1D2E', marginBottom: 4 }}>
                      {rec.message}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>
                      Impact: {rec.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Info */}
        <div style={{
          marginTop: 20,
          padding: 12,
          background: '#F9FAFB',
          borderRadius: 6,
          fontSize: 10,
          color: '#6B7280'
        }}>
          <div>Uptime: {summary.uptime}</div>
          <div>Reads/min: {summary.readsPerMinute}</div>
          <div>Operations: {summary.totalOperations}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      padding: 12,
      background: '#F9FAFB',
      border: '1px solid #E5E7EB',
      borderRadius: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
