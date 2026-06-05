import StatCard from './StatCard';
import { Building2, Users, Zap, Crown } from 'lucide-react';
import { Bone } from './Skeleton';

export default function OrganizationOverview({ 
  totalOrganizations, 
  starterCount, 
  professionalCount, 
  businessCount,
  enterpriseCount, 
  isLoading = false 
}) {
  if (isLoading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-light)',
              borderRadius: 16,
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w={40} h={40} r={12} />
              <Bone w={56} h={20} r={20} />
            </div>
            <Bone w="60%" h={28} />
            <Bone w="80%" h={13} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 16,
      marginBottom: 24,
    }}>
      <StatCard
        icon={Building2}
        iconBg="#EEF2FF"
        title="Total Organizations"
        value={totalOrganizations}
        sub="All registered organizations"
        delay={0}
      />
      <StatCard
        icon={Users}
        iconBg="#EEF2FF"
        title="Starter Plan"
        value={starterCount}
        sub="Entry-level tier organizations"
        delay={100}
      />
      <StatCard
        icon={Zap}
        iconBg="#EEF2FF"
        title="Professional Plan"
        value={professionalCount}
        sub="Professional tier organizations"
        delay={200}
      />
      <StatCard
        icon={Building2}
        iconBg="#EEF2FF"
        title="Business Plan"
        value={businessCount}
        sub="Business tier organizations"
        delay={300}
      />
      <StatCard
        icon={Crown}
        iconBg="#EEF2FF"
        title="Enterprise Plan"
        value={enterpriseCount}
        sub="Enterprise tier organizations"
        delay={400}
      />
    </div>
  );
}
