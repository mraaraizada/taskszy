import { Building2, Calendar, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RecentlyJoinedOrganizations({ organizations, isLoading }) {
  const { setSelectedOrganizationId, setNavigationRequest } = useApp();

  // Sort by join date and get the 5 most recent
  const recentOrgs = [...organizations]
    .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
    .slice(0, 5);

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Starter':
        return { bg: '#FEF3C7', color: '#D97706' };
      case 'Professional':
        return { bg: '#DBEAFE', color: '#1D4ED8' };
      case 'Business':
        return { bg: '#F3E8FF', color: '#9333EA' };
      case 'Enterprise':
        return { bg: '#FFF7ED', color: '#F97316' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 20 }}>
          Recently Joined Organizations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              height: 60,
              background: '#F3F4F6',
              borderRadius: 12,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 20,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
            Organizations
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            Updates
          </div>
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TrendingUp size={20} color="#fff" />
        </div>
      </div>

      {/* Organizations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recentOrgs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}>
              <Building2 size={24} color="#9CA3AF" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
              No organizations yet
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 220 }}>
              Recently joined organizations will appear here
            </div>
          </div>
        ) : (
          recentOrgs.map((org, index) => {
            const planColors = getPlanColor(org.subscriptionPlan);
            
            // Calculate days until expiry
            const getDaysUntilExpiry = () => {
              if (!org.planExpiryDate) return null;
              try {
                const now = new Date();
                const expiry = new Date(org.planExpiryDate);
                if (isNaN(expiry.getTime())) return null;
                const diffTime = expiry - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
              } catch (e) {
                return null;
              }
            };
            
            const daysUntilExpiry = getDaysUntilExpiry();
            
            const handleCardClick = (e) => {

              setSelectedOrganizationId(org.id);

              setNavigationRequest('team');

            };

            return (
              <div
                key={org.id}
                onClick={handleCardClick}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  background: '#FAFBFC',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#F3F4F6';
                  e.currentTarget.style.borderColor = '#3B5BFC';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FAFBFC';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Organization Logo */}
                  {org.workspaceLogo ? (
                    <img
                      src={org.workspaceLogo}
                      alt={org.name}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {getInitials(org.name)}
                    </div>
                  )}

                  {/* Organization Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1F2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize',
                    }}>
                      {org.name}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#6B7280',
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize',
                    }}>
                      {org.workspaceSub || 'No description'}
                    </div>
                  </div>

                  {/* Plan Badge */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: planColors.bg,
                    color: planColors.color,
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {org.subscriptionPlan}
                  </div>

                  {/* New Badge */}
                  {index === 0 && (
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: '#ECFDF5',
                      color: '#12C479',
                      fontSize: 9,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      NEW
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
