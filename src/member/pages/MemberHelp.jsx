import { useState, useEffect } from 'react';
import { notify } from '../../lib/notify';
import { Send, CheckCircle, Clock, X, HelpCircle, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { subscribeToHelpSubmissions, submitHelpRequest } from '../../lib/helpService';

export default function MemberHelp({ setPageFilteredData }) {
  const { workspaceId, currentUid, currentUser } = useApp();
  const [helpText, setHelpText] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [displayedSubmissions, setDisplayedSubmissions] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to help submissions from Firebase (only this user's submissions)
  useEffect(() => {
    if (!workspaceId || !currentUid) return;

    const unsubscribe = subscribeToHelpSubmissions(workspaceId, (loadedSubmissions) => {
      // Filter to show only this user's submissions
      const userSubmissions = loadedSubmissions.filter(sub => sub.member?.uid === currentUid);
      
      // Sort: pending first, then solved, by timestamp (newest first)
      const sorted = [...userSubmissions].sort((a, b) => {
        if (a.status === 'pending' && b.status === 'solved') return -1;
        if (a.status === 'solved' && b.status === 'pending') return 1;
        return b.timestamp - a.timestamp;
      });
      
      setAllSubmissions(sorted);
    });

    return () => unsubscribe();
  }, [workspaceId, currentUid]);

  // Update displayed submissions when allSubmissions or displayLimit changes
  useEffect(() => {
    setDisplayedSubmissions(allSubmissions.slice(0, displayLimit));
  }, [allSubmissions, displayLimit]);

  // Send filtered data to parent for search
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ help: allSubmissions });
    }
  }, [allSubmissions.length, setPageFilteredData]);

  const handleSubmit = async () => {
    if (!helpText.trim() || submitting || !currentUser) return;
    
    setSubmitting(true);
    
    try {
      await submitHelpRequest(workspaceId, {
        member: {
          name: currentUser.name || 'Team Member',
          role: currentUser.role || 'member',
          userRole: currentUser.userRole || 'member', // System role for permission checks
          avatar: currentUser.avatar || '👤',
          avatarImg: currentUser.avatarImg || null,
          color: currentUser.color || '#3B5BFC',
          uid: currentUid
        },
        message: helpText.trim()
      });
      
      setHelpText('');
      notify.helpSubmitted('Your request has been sent to the admin team');
    } catch (error) {
      console.error('Error submitting help request:', error);
      notify.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', gap: 20 }}>
      {/* Left: Submit Help Request or View Selected */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
          {selectedSubmission ? (
            <>
              {/* View Selected Submission */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={20} color="#3B5BFC" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Submission Details</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedSubmission.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {selectedSubmission.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  style={{
                    padding: '8px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    background: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <X size={14} /> Close
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedSubmission.status === 'solved' ? (
                    <>
                      <CheckCircle size={16} color="#12C479" strokeWidth={2.5} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#12C479' }}>Solved</span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} color="#F97316" strokeWidth={2.5} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>Pending</span>
                    </>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Message</label>
                  <div style={{
                    padding: '14px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    background: '#F9FAFB',
                    lineHeight: 1.6,
                  }}>
                    {selectedSubmission.message}
                  </div>
                </div>

                {/* Admin/Management Response */}
                {selectedSubmission.response && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {selectedSubmission.resolvedByInfo ? 
                        (selectedSubmission.resolvedByInfo.role === 'admin' || selectedSubmission.resolvedByInfo.role === 'Administrator' ? 'Admin Response' : 
                         selectedSubmission.resolvedByInfo.role === 'management' || selectedSubmission.resolvedByInfo.role === 'Management' ? 'Management Response' : 
                         'Response')
                        : 'Admin Response'}
                    </label>
                    <div style={{
                      padding: '14px 16px',
                      border: '1.5px solid #12C479',
                      borderRadius: 12,
                      fontSize: 14,
                      color: '#059669',
                      background: '#ECFDF5',
                      lineHeight: 1.6,
                    }}>
                      {selectedSubmission.response}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Submit New Request */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={20} color="#3B5BFC" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Submit Help</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Describe your issue or question</div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>Your Message</label>
                <textarea
                  value={helpText}
                  onChange={e => {
                    if (e.target.value.length <= 1000) {
                      setHelpText(e.target.value);
                    }
                  }}
                  placeholder="Describe your issue, question, or request for assistance..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    background: 'var(--input-bg)',
                    resize: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    flex: 1,
                    minHeight: 0,
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!helpText.trim() || submitting}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: (helpText.trim() && !submitting) ? 'pointer' : 'not-allowed',
                  background: (helpText.trim() && !submitting) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)',
                  color: (helpText.trim() && !submitting) ? '#fff' : 'var(--text-muted)',
                  boxShadow: (helpText.trim() && !submitting) ? '0 6px 20px rgba(59,91,252,0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <Send size={16} /> {submitting ? 'Submitting...' : 'Proceed'}
              </button>

            </>
          )}
        </div>
      </div>

      {/* Right: Previous Submissions */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid #F0F2F8', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Previous Submissions</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', background: '#FFF7ED', padding: '4px 10px', borderRadius: 8 }}>
                  {allSubmissions.filter((s) => s.status === 'pending').length} Pending
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#12C479', background: '#ECFDF5', padding: '4px 10px', borderRadius: 8 }}>
                  {allSubmissions.filter((s) => s.status === 'solved').length} Solved
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {allSubmissions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '48px 20px', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={22} color="#F97316" strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No requests yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 200 }}>Your submitted help requests will appear here</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {displayedSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      style={{
                        background: sub.status === 'solved' ? '#F9FAFB' : '#FFFBEB',
                        border: `1.5px solid ${sub.status === 'solved' ? '#E5E7EB' : '#FDE68A'}`,
                        borderRadius: 12,
                        padding: '14px 16px',
                        transition: 'all 0.15s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {sub.status === 'solved' ? (
                            <>
                              <CheckCircle size={14} color="#12C479" strokeWidth={2.5} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#12C479' }}>Solved</span>
                            </>
                          ) : (
                            <>
                              <Clock size={14} color="#F97316" strokeWidth={2.5} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316' }}>Pending</span>
                            </>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {sub.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Message */}
                      <div style={{ 
                        fontSize: 12, 
                        color: 'var(--text-secondary)', 
                        lineHeight: 1.5, 
                        marginBottom: sub.response ? 10 : 0, 
                        wordBreak: 'break-word'
                      }}>
                        {sub.message.split(' ').length > 15 
                          ? sub.message.split(' ').slice(0, 15).join(' ') + '...' 
                          : sub.message}
                      </div>

                      {/* Response */}
                      {sub.response && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                            {sub.resolvedByInfo ? 
                              (sub.resolvedByInfo.role === 'admin' || sub.resolvedByInfo.role === 'Administrator' ? 'Admin Response' : 
                               sub.resolvedByInfo.role === 'management' || sub.resolvedByInfo.role === 'Management' ? 'Management Response' : 
                               'Response')
                              : 'Admin Response'}
                          </div>
                          <div style={{ 
                            fontSize: 11, 
                            color: '#059669', 
                            lineHeight: 1.5, 
                            wordBreak: 'break-word'
                          }}>
                            {sub.response.split(' ').length > 15 
                              ? sub.response.split(' ').slice(0, 15).join(' ') + '...' 
                              : sub.response}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {displayLimit < allSubmissions.length && (
                  <button
                    onClick={() => setDisplayLimit((prev) => prev + 10)}
                    style={{
                      marginTop: 12,
                      padding: '10px 16px',
                      border: '1.5px solid var(--border)',
                      borderRadius: 10,
                      background: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B5BFC';
                      e.currentTarget.style.color = '#3B5BFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Plus size={14} /> Load More
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
