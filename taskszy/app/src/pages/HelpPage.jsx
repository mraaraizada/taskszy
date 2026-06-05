import { useState, useEffect } from 'react';
import { notify } from '../lib/notify';
import { CheckCircle, Clock, X, HelpCircle, MessageSquare, Edit2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToHelpSubmissions, resolveHelpSubmission, updateHelpResponse } from '../lib/helpService';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';

export default function HelpPage({ setPageFilteredData = null }) {
  const { workspaceId, currentUid, currentUser } = useApp();
  const [allSubmissions, setAllSubmissions] = useState([]); // Store all submissions
  const [displayedSubmissions, setDisplayedSubmissions] = useState([]); // Submissions to display
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingResponse, setEditingResponse] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10); // How many to display
  
  // Password protection hook
  const { 
    showPasswordModal, 
    pendingAction, 
    requestAdminPassword, 
    handlePasswordConfirm, 
    handlePasswordCancel 
  } = useAdminPassword();

  // Subscribe to help submissions from Firebase
  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribe = subscribeToHelpSubmissions(workspaceId, (loadedSubmissions) => {
      // Sort: Pending submissions first, then solved submissions
      // Within each group, sort by timestamp (newest first)
      const sortedSubmissions = loadedSubmissions.sort((a, b) => {
        // First, sort by status (pending before solved)
        if (a.status === 'pending' && b.status === 'solved') return -1;
        if (a.status === 'solved' && b.status === 'pending') return 1;
        
        // If same status, sort by timestamp (newest first)
        return b.timestamp - a.timestamp;
      });
      
      setAllSubmissions(sortedSubmissions);
    }, 50); // Load 50 at a time from Firebase

    return () => unsubscribe();
  }, [workspaceId]);
  
  // Apply display limit
  useEffect(() => {
    const displayed = allSubmissions.slice(0, displayLimit);
    setDisplayedSubmissions(displayed);
  }, [allSubmissions, displayLimit]);
  
  // Update filtered data for search - use FULL data, not just paginated
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ help: allSubmissions }); // Search all submissions, not just current page
    }
  }, [allSubmissions.length, setPageFilteredData]);
  
  // Function to load more submissions
  const loadMore = () => {
    setDisplayLimit(prev => prev + 10);
  };
  
  const hasMore = allSubmissions.length > displayLimit;

  const handleResolve = async (submissionId, responseText) => {
    try {
      if (editingResponse) {
        // Update existing response
        await updateHelpResponse(workspaceId, submissionId, responseText);
        
        // Optimistically update local state
        setAllSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId
              ? { ...sub, response: responseText, updatedAt: new Date() }
              : sub
          )
        );
        
        // Update selected submission
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission((prev) => ({
            ...prev,
            response: responseText,
            updatedAt: new Date()
          }));
        }
      } else {
        // Mark as solved with new response
        await resolveHelpSubmission(workspaceId, submissionId, responseText, currentUid, {
          name: currentUser?.name || 'Admin',
          avatar: currentUser?.avatar || '👤',
          avatarImg: currentUser?.avatarImg || null,
          color: currentUser?.color || '#3B5BFC',
          role: currentUser?.role || 'admin'
        });
        
        // Optimistically update local state
        setAllSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId
              ? {
                  ...sub,
                  status: 'solved',
                  response: responseText,
                  resolvedBy: currentUid,
                  resolvedByInfo: {
                    name: currentUser?.name || 'Admin',
                    avatar: currentUser?.avatar || '👤',
                    avatarImg: currentUser?.avatarImg || null,
                    color: currentUser?.color || '#3B5BFC',
                    role: currentUser?.role || 'admin'
                  },
                  resolvedAt: new Date(),
                  updatedAt: new Date()
                }
              : sub
          )
        );
        
        // Update selected submission
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission((prev) => ({
            ...prev,
            status: 'solved',
            response: responseText,
            resolvedBy: currentUid,
            resolvedByInfo: {
              name: currentUser?.name || 'Admin',
              avatar: currentUser?.avatar || '👤',
              avatarImg: currentUser?.avatarImg || null,
              color: currentUser?.color || '#3B5BFC',
              role: currentUser?.role || 'admin'
            },
            resolvedAt: new Date(),
            updatedAt: new Date()
          }));
        }
      }
      
      setEditingResponse(false);
      notify.helpResolved();
    } catch (error) {

      notify.error('Failed to update submission');
    }
  };
  
  // Handle password-protected resolve
  const handleResolveWithPassword = (submissionId, responseText) => {
    requestAdminPassword('resolve help submission', () => handleResolve(submissionId, responseText));
  };

  const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;
  const solvedCount = allSubmissions.filter(s => s.status === 'solved').length;

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', gap: 20 }}>
      {/* Left: View Submission Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
          {selectedSubmission ? (
            <>
              {/* View Selected Submission */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: selectedSubmission.member.avatarImg ? 'transparent' : selectedSubmission.member.color,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#fff',
                    boxShadow: selectedSubmission.member.avatarImg ? 'none' : `0 4px 10px ${selectedSubmission.member.color}55`,
                    overflow: 'hidden'
                  }}>
                    {selectedSubmission.member.avatarImg ? (
                      <img src={selectedSubmission.member.avatarImg} alt={selectedSubmission.member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedSubmission.member.avatar
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedSubmission.member.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedSubmission.member.role} • {selectedSubmission.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {selectedSubmission.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Member Message</label>
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

                {/* Response Section */}
                {selectedSubmission.status === 'solved' && !editingResponse ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Response</label>
                        {/* Show resolver info */}
                        {selectedSubmission.resolvedByInfo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              background: selectedSubmission.resolvedByInfo.avatarImg ? 'transparent' : selectedSubmission.resolvedByInfo.color,
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: 9,
                              fontWeight: 800,
                              color: '#fff',
                              overflow: 'hidden'
                            }}>
                              {selectedSubmission.resolvedByInfo.avatarImg ? (
                                <img src={selectedSubmission.resolvedByInfo.avatarImg} alt={selectedSubmission.resolvedByInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                selectedSubmission.resolvedByInfo.avatar
                              )}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                              by {selectedSubmission.resolvedByInfo.name}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Only show Edit button if current user resolved it */}
                      {selectedSubmission.resolvedBy === currentUid && (
                        <button
                          onClick={() => setEditingResponse(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: '#EEF2FF',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#3B5BFC',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                    </div>
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
                ) : (
                  <ResponseForm 
                    submissionId={selectedSubmission.id} 
                    onResolve={handleResolveWithPassword}
                    initialResponse={editingResponse ? selectedSubmission.response : ''}
                    isEditing={editingResponse}
                    onCancelEdit={() => setEditingResponse(false)}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Empty State */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={36} color="#3B5BFC" strokeWidth={2} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No Submission Selected</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Select a help request from the right panel to view details</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Submissions List */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header with Stats */}
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid #F0F2F8', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Help Submissions</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} color="#F97316" strokeWidth={2.5} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316' }}>{pendingCount} Pending</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={12} color="#12C479" strokeWidth={2.5} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#12C479' }}>{solvedCount} Solved</span>
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {displayedSubmissions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '48px 20px', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={24} color="#F97316" strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No help requests yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 220 }}>Team members can submit help requests from their dashboard</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {displayedSubmissions.map(sub => (
                  <div
                    key={sub.id}
                    data-help-id={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    style={{
                      background: sub.status === 'solved' ? '#F9FAFB' : '#FFFBEB',
                      border: `1.5px solid ${sub.status === 'solved' ? '#E5E7EB' : '#FDE68A'}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Member Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        background: sub.member.avatarImg ? 'transparent' : sub.member.color,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#fff',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {sub.member.avatarImg ? (
                          <img src={sub.member.avatarImg} alt={sub.member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          sub.member.avatar
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.member.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub.member.role}</div>
                      </div>
                      {sub.status === 'solved' ? (
                        <CheckCircle size={14} color="#12C479" strokeWidth={2.5} />
                      ) : (
                        <Clock size={14} color="#F97316" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Message Preview */}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8, wordBreak: 'break-word' }}>
                      {sub.message.split(' ').length > 15 
                        ? sub.message.split(' ').slice(0, 15).join(' ') + '...' 
                        : sub.message}
                    </div>

                    {/* Timestamp */}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {sub.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {sub.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, paddingBottom: 8 }}>
                  <button 
                    onClick={loadMore}
                    style={{ 
                      padding: '10px 20px', 
                      borderRadius: 10, 
                      border: '1.5px solid var(--border)', 
                      background: 'var(--bg-surface)', 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: 'var(--text-secondary)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#3B5BFC';
                      e.currentTarget.style.color = '#3B5BFC';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Plus size={14} /> Load More
                  </button>
                </div>
              )}
            </>
            )}
          </div>
        </div>
      </div>
      
      {/* Password Modal */}
      {showPasswordModal && (
        <AdminPasswordModal
          onConfirm={handlePasswordConfirm}
          onClose={handlePasswordCancel}
        />
      )}
    </div>
  );
}

function ResponseForm({ submissionId, onResolve, initialResponse = '', isEditing = false, onCancelEdit }) {
  const [responseText, setResponseText] = useState(initialResponse);

  const handleSubmit = () => {
    if (!responseText.trim()) return;
    onResolve(submissionId, responseText.trim());
    setResponseText('');
  };

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Response</label>
      <textarea
        value={responseText}
        onChange={e => {
          if (e.target.value.length <= 1000) {
            setResponseText(e.target.value);
          }
        }}
        placeholder="Type your response to help the team member..."
        rows={6}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          fontSize: 14,
          color: 'var(--text-primary)',
          outline: 'none',
          background: 'var(--input-bg)',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          minHeight: 120,
        }}
        onFocus={e => e.target.style.borderColor = '#3B5BFC'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={!responseText.trim()}
          style={{
            flex: 1,
            padding: '12px 24px',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: responseText.trim() ? 'pointer' : 'not-allowed',
            background: responseText.trim() ? 'linear-gradient(135deg, #12C479, #059669)' : 'var(--border)',
            color: responseText.trim() ? '#fff' : 'var(--text-muted)',
            boxShadow: responseText.trim() ? '0 6px 20px rgba(18,196,121,0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={16} /> {isEditing ? 'Update Response' : 'Mark as Solved'}
        </button>
        {isEditing && (
          <button
            onClick={onCancelEdit}
            style={{
              padding: '12px 24px',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
