import { useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MemberWorkDesc({ member }) {
  const { roles, saveMember } = useApp();
  const hasMarkedReadRef = useRef(false);

  // Get work description from the role, not from member.desc
  const memberRole = roles.find(r => r.name === member.role);
  const workDescription = memberRole?.workDescription || member.desc || '';
  
  // Check if there's an unread update
  const roleUpdatedAt = memberRole?.workDescriptionUpdatedAt || 0;

  // Log component mount
  useEffect(() => {

    return () => {

    };
  }, []);

  useEffect(() => {
    // Mark as viewed in localStorage AND Firestore when user actually views this page
    if (!hasMarkedReadRef.current && roleUpdatedAt > 0) {
      const storageKey = `desc_viewed_${member.id}_${roleUpdatedAt}`;
      const readAt = Date.now();

      // Save to localStorage
      try {
        localStorage.setItem(storageKey, 'true');

      } catch (err) {

      }
      
      // Save to Firestore
      try {
        saveMember({ ...member, descReadAt: readAt });

      } catch (err) {

      }
      
      hasMarkedReadRef.current = true;
    }
  }, [member, roleUpdatedAt, saveMember]); // Run when component mounts or roleUpdatedAt changes

  function parsePoints(text) {
    if (!text) return [];
    return text
      .split('/')
      .map(s => s.trim())
      .filter(Boolean);
  }

  const points = parsePoints(workDescription);

  return (
    <div style={{
      flex: 1, overflow: 'hidden',
      background: 'linear-gradient(160deg, #F8F9FC 0%, #F0F2F7 100%)',
      padding: '24px 28px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Card */}
      <div style={{
        flex: 1, minHeight: 0,
        background: '#fff',
        borderRadius: 16,
        border: '1.5px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header - Fixed */}
        <div style={{ padding: '24px 32px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1D2E', marginBottom: 6 }}>
            Work Description
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
            Your role responsibilities and guidelines
          </div>
          <div style={{ height: 1, background: '#E5E7EB', marginTop: 16 }} />
        </div>

        {/* Scrollable points only */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 28px', minHeight: 0 }}>
          {points.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} color="#3B5BFC" strokeWidth={1.6} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1D2E', marginBottom: 6 }}>No description yet</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 280 }}>Your admin will add your role responsibilities and guidelines here</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {points.map((point, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '16px 0',
                  borderBottom: i < points.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}>
                  <div style={{
                    marginTop: 8,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#3B5BFC',
                    flexShrink: 0,
                  }} />
                  <span style={{ 
                    fontSize: 14, 
                    color: '#374151', 
                    lineHeight: 1.8, 
                    fontWeight: 400,
                    flex: 1
                  }}>
                    {point}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
