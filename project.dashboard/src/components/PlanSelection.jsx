import { useState } from 'react';
import { Check, Mail } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 589,
    users: 7,
    period: 'month',
    features: ['Up to 7 users', 'Basic task management', 'Email support', '10GB storage'],
    color: '#3B5BFC',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 1279,
    users: 19,
    period: 'month',
    features: ['Up to 19 users', 'Advanced analytics', 'Priority support', '50GB storage', 'Custom roles'],
    color: '#7C3AED',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 2489,
    users: 45,
    period: 'month',
    features: ['Up to 45 users', 'Full analytics suite', '24/7 support', '200GB storage', 'API access', 'Custom integrations'],
    color: '#12C479',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4589,
    users: 'Unlimited',
    period: 'month',
    features: ['Unlimited team members', 'All features included', 'Premium support', 'Unlimited storage', 'White-label option', 'Dedicated account manager'],
    color: '#F97316',
    popular: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    users: 'Custom',
    period: 'custom',
    features: ['Tailored user limits', 'Custom features', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees', 'On-premise option'],
    color: '#EC4899',
    popular: false,
    isCustom: true,
  },
];

export default function PlanSelection({ email, onSelectPlan, onBack, backText = 'Back to login' }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);

  const handlePlanSelect = (plan) => {
    if (plan.isCustom) {
      setShowCustomize(true);
      return;
    }
    setSelectedPlan(plan.id);
    setTimeout(() => {
      onSelectPlan(plan, billingCycle);
    }, 300);
  };

  const handleCustomize = () => {
    setShowCustomize(true);
  };

  const getPrice = (plan) => {
    if (plan.period === 'one-time') return plan.price;
    if (billingCycle === 'yearly') {
      return Math.round(plan.price * 12 * 0.8); // 20% discount for yearly
    }
    return plan.price;
  };

  return (
    <div
      className="plan-selection-enter"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 56px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← {backText}
        </button>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#1A1D2E',
            letterSpacing: '-0.8px',
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Choose Your Plan
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>
          Select the perfect plan for your team
        </p>
        <p style={{ fontSize: 12, color: '#6B7280' }}>
          Logged in as: <span style={{ fontWeight: 600, color: '#3B5BFC' }}>{email}</span>
        </p>
      </div>

      {/* Billing Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 32,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: billingCycle === 'monthly' ? '#1A1D2E' : '#9CA3AF' }}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          style={{
            width: 52,
            height: 28,
            borderRadius: 14,
            background: billingCycle === 'yearly' ? 'linear-gradient(135deg, #3B5BFC, #7C3AED)' : '#E5E7EB',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.3s ease',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 3,
              left: billingCycle === 'yearly' ? 27 : 3,
              transition: 'left 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: billingCycle === 'yearly' ? '#1A1D2E' : '#9CA3AF' }}>
          Yearly
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#12C479',
              background: '#ECFDF5',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            Save 20%
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {PLANS.map((plan) => {
          const price = getPrice(plan);
          const isSelected = selectedPlan === plan.id;
          
          // Custom card design
          if (plan.isCustom) {
            return (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                style={{
                  background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 50%, #FFF1F2 100%)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: `2px dashed ${plan.color}`,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? `0 8px 24px ${plan.color}30` : '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${plan.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 20,
                    background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 12,
                    boxShadow: `0 4px 12px ${plan.color}50`,
                  }}
                >
                  ENTERPRISE
                </div>

                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: `0 8px 20px ${plan.color}40`,
                    }}
                  >
                    <Mail size={28} color="#fff" />
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#1A1D2E',
                      marginBottom: 4,
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      Let's Talk
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6B7280',
                      marginBottom: 16,
                    }}
                  >
                    Tailored for your needs
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: `${plan.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} color={plan.color} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 10,
                    border: 'none',
                    background: `linear-gradient(135deg, ${plan.color}, #F43F5E)`,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 16,
                    boxShadow: `0 4px 12px ${plan.color}40`,
                    transition: 'transform 0.15s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${plan.color}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${plan.color}40`;
                  }}
                >
                  Contact Sales
                </button>
              </div>
            );
          }
          
          return (
            <div
              key={plan.id}
              onClick={() => handlePlanSelect(plan)}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '24px 20px',
                border: `2px solid ${isSelected ? plan.color : '#E5E7EB'}`,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? `0 8px 24px ${plan.color}30` : '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = plan.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 20,
                    background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(59,91,252,0.3)',
                  }}
                >
                  POPULAR
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#1A1D2E',
                    marginBottom: 4,
                  }}
                >
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: plan.color,
                      letterSpacing: '-1px',
                    }}
                  >
                    ₹{price.toLocaleString()}
                  </span>
                  {plan.period !== 'one-time' && (
                    <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6B7280',
                    marginBottom: 16,
                  }}
                >
                  Up to {plan.users} {typeof plan.users === 'number' ? 'users' : ''}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: `${plan.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={12} color={plan.color} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 13, color: '#4B5563' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customize Modal */}
      {showCustomize && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCustomize(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px',
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#1A1D2E',
                marginBottom: 12,
              }}
            >
              Contact Our Sales Team
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
              Send us your requirements and we'll get back to you within 24 hours.
            </p>
            <input
              type="email"
              placeholder="Your email"
              defaultValue={email}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 10,
                border: '1.5px solid #E5E7EB',
                padding: '0 16px',
                fontSize: 14,
                marginBottom: 12,
                outline: 'none',
              }}
            />
            <textarea
              placeholder="Tell us about your requirements..."
              style={{
                width: '100%',
                height: 120,
                borderRadius: 10,
                border: '1.5px solid #E5E7EB',
                padding: '12px 16px',
                fontSize: 14,
                marginBottom: 16,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowCustomize(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: '1.5px solid #E5E7EB',
                  background: '#fff',
                  color: '#6B7280',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCustomize(false);
                }}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
