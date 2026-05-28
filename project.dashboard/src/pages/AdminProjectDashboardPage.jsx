import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAdminStats } from '../hooks/useAdminDashboard';
import { getOrganizationsPaginated } from '../lib/optimizedOrganizationService';
import OrganizationOverview from '../components/OrganizationOverview';
import GrowthAnalytics from '../components/GrowthAnalytics';
import SubscriptionDistribution from '../components/SubscriptionDistribution';
import RecentlyJoinedOrganizations from '../components/RecentlyJoinedOrganizations';

export default function AdminProjectDashboardPage() {
  const { globalSearchQuery } = useApp();
  const { stats, loading: statsLoading } = useAdminStats(false); // Disable real-time, use fallback
  const [organizations, setOrganizations] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [yearlyGrowth, setYearlyGrowth] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);
  
  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const result = await getOrganizationsPaginated({ pageSize: 100 });
      setOrganizations(result.organizations);
      
      // Calculate growth data
      calculateGrowthData(result.organizations);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateGrowthData = (orgs) => {
    // Monthly growth
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      const count = orgs.filter(o => {
        const joinDate = new Date(o.joinDate);
        return joinDate.getMonth() === month.getMonth() && joinDate.getFullYear() === month.getFullYear();
      }).length;
      monthlyData.push({ month: monthName, count });
    }
    setMonthlyGrowth(monthlyData);
    
    // Yearly growth
    const yearlyData = [];
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const count = orgs.filter(o => new Date(o.joinDate).getFullYear() === year).length;
      yearlyData.push({ year: year.toString(), count });
    }
    setYearlyGrowth(yearlyData);
  };
  
  // Update plan distribution from stats
  useEffect(() => {
    if (stats && stats.workspaces) {
      const planDist = [
        { name: 'Starter', value: stats.workspaces.byPlan?.Starter || 0, color: '#3B5BFC' },
        { name: 'Professional', value: stats.workspaces.byPlan?.Professional || 0, color: '#7C3AED' },
        { name: 'Business', value: stats.workspaces.byPlan?.Business || 0, color: '#12C479' },
        { name: 'Enterprise', value: stats.workspaces.byPlan?.Enterprise || 0, color: '#F97316' },
        { name: 'Free', value: stats.workspaces.byPlan?.Free || 0, color: '#9CA3AF' },
      ].filter(plan => plan.value > 0);
      setPlanDistribution(planDist);
    }
  }, [stats]);

  // Filter organizations by global search query
  const filteredOrganizations = globalSearchQuery
    ? organizations.filter(org => 
        org.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        org.workspaceSub?.toLowerCase().includes(globalSearchQuery.toLowerCase())
      )
    : organizations;

  console.log('🔍 Dashboard: Search query:', globalSearchQuery, 'Total orgs:', organizations.length, 'Filtered:', filteredOrganizations.length);

  // Use stats from aggregation if available, otherwise calculate from filtered orgs
  const totalOrganizations = stats?.workspaces?.total || filteredOrganizations.length;
  
  const starterCount = stats?.workspaces?.byPlan?.Starter || filteredOrganizations.filter(org => 
    org.subscriptionPlan === 'Starter' && org.subscriptionStatus === 'active'
  ).length;
  
  const professionalCount = stats?.workspaces?.byPlan?.Professional || filteredOrganizations.filter(org => 
    org.subscriptionPlan === 'Professional' && org.subscriptionStatus === 'active'
  ).length;
  
  const businessCount = stats?.workspaces?.byPlan?.Business || filteredOrganizations.filter(org => 
    org.subscriptionPlan === 'Business' && org.subscriptionStatus === 'active'
  ).length;
  
  const enterpriseCount = stats?.workspaces?.byPlan?.Enterprise || filteredOrganizations.filter(org => 
    org.subscriptionPlan === 'Enterprise' && org.subscriptionStatus === 'active'
  ).length;
  
  // Main container with flex layout and padding - make it scrollable
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '24px',
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* Organization Overview Statistics Section */}
      <OrganizationOverview
        totalOrganizations={totalOrganizations}
        starterCount={starterCount}
        professionalCount={professionalCount}
        businessCount={businessCount}
        enterpriseCount={enterpriseCount}
        isLoading={isLoading}
      />

      {/* Growth Analytics and Revenue Graph Section - Side by Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.5fr 1fr',
        gap: '24px',
      }}>
        <GrowthAnalytics
          monthlyData={monthlyGrowth}
          yearlyData={yearlyGrowth}
          selectedView={selectedTimeRange}
          onViewChange={setSelectedTimeRange}
          isLoading={isLoading}
        />

        <SubscriptionDistribution
          data={planDistribution}
          isLoading={isLoading}
          selectedView={selectedTimeRange}
          key={selectedTimeRange}
        />
      </div>

      {/* Recently Joined Organizations */}
      <RecentlyJoinedOrganizations
        organizations={filteredOrganizations}
        isLoading={isLoading}
      />
    </div>
  );
}
