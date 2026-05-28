import { Building2, Mail, Phone, Users, Calendar, Clock } from 'lucide-react';

export default function OrganizationListItem({ organization, onSelect, isSelected }) {
  // Debug: Log the organization data
  console.log('🔍 OrganizationListItem received:', {
    name: organization.name,
    email: organization.email,
    phone: organization.phone,
    teamCount: organization.teamCount,
    workspaceLogo: organization.workspaceLogo,
    planExpiryDate: organization.planExpiryDate,
    fullOrganization: organization
  });

  // Determine status badge styling based on subscription status
  const getStatusStyle = (status) => {
    const styles = {
      active: {
        background: '#E8FBF1',
        color: '#12C479',
      },
      trial: {
        background: '#EEF2FF',
        color: '#3B5BFC',
      },
      inactive: {
        background: '#F3F4F6',
        color: '#6B7280',
      },
      suspended: {
        background: '#FFF1F1',
        color: '#FF4D4F',
      },
    };
    return styles[status] || styles.inactive;
  };

  // Determine plan badge styling
  const getPlanStyle = (plan) => {
    const styles = {
      Free: {
        background: '#F3F4F6',
        color: '#6B7280',
      },
      Starter: {
        background: '#FEF3C7',
        color: '#D97706',
      },
      Professional: {
        background: '#DBEAFE',
        color: '#1D4ED8',
      },
      Business: {
        background: '#D1FAE5',
        color: '#059669',
      },
      Enterprise: {
        background: '#F3E8FF',
        color: '#7C3AED',
      },
    };
    return styles[plan] || styles.Free;
  };

  const statusStyle = getStatusStyle(organization.subscriptionStatus);
  const planStyle = getPlanStyle(organization.subscriptionPlan);

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    try {
      const now = new Date();
      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) return null;
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  const daysUntilExpiry = getDaysUntilExpiry(organization.planExpiryDate);

  return (
    <div
      onClick={() => onSelect(organization)}
      style={{
        padding: '18px',
        borderRadius: 12,
        border: isSelected ? '2px solid #3B5BFC' : '1.5px solid var(--border-color)',
        background: isSelected ? 'rgba(59, 91, 252, 0.05)' : 'var(--bg-surface)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: 12,
        boxShadow: isSelected ? '0 4px 12px rgba(59, 91, 252, 0.15)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.borderColor = '#3B5BFC';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-surface)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Header with Avatar and Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* Workspace Logo */}
        {organization.workspaceLogo ? (
          <img
            src={organization.workspaceLogo}
            alt={organization.name}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              objectFit: 'cover',
              border: '2px solid var(--border-light)',
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667EEA, #764BA2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              border: '2px solid var(--border-light)',
            }}
          >
            {organization.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Organization Name and Subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {organization.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {organization.workspaceSub || 'No description'}
          </div>
        </div>

        {/* Plan and Status Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span
            style={{
              ...planStyle,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 6,
              textTransform: 'capitalize',
            }}
          >
            {organization.subscriptionPlan}
          </span>
          <span
            style={{
              ...statusStyle,
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 5,
              textTransform: 'capitalize',
            }}
          >
            {organization.subscriptionStatus}
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={14} color="#6B7280" />
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
            {organization.email || 'No email'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Phone size={14} color="#6B7280" />
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
            {organization.phone || 'No phone'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color="#6B7280" />
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
            {organization.teamCount || 0} team {organization.teamCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* Plan Expiry Date */}
      {organization.planExpiryDate && formatDate(organization.planExpiryDate) !== 'N/A' && (
        <div
          style={{
            paddingTop: 12,
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color={daysUntilExpiry !== null && daysUntilExpiry < 7 ? '#EF4444' : '#6B7280'} />
              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                Plan Expires:
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 12,
                  color: daysUntilExpiry !== null && daysUntilExpiry < 7 ? '#EF4444' : '#374151',
                  fontWeight: 600,
                }}
              >
                {formatDate(organization.planExpiryDate)}
              </div>
              {daysUntilExpiry !== null && (
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                  {daysUntilExpiry > 0
                    ? `${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'} left`
                    : daysUntilExpiry === 0
                    ? 'Expires today'
                    : `Expired ${Math.abs(daysUntilExpiry)} ${Math.abs(daysUntilExpiry) === 1 ? 'day' : 'days'} ago`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
