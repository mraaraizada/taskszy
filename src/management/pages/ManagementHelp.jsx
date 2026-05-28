import { useState, useEffect } from 'react';
import { notify } from '../../lib/notify';
import { Send, CheckCircle, Clock, X, HelpCircle, MessageSquare, Edit2, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { subscribeToHelpSubmissions, submitHelpRequest, resolveHelpSubmission, updateHelpResponse } from '../../lib/helpService';
import { AdminPasswordModal } from '../../components/AdminPasswordModal';
import { useAdminPassword } from '../../hooks/useAdminPassword';

function ResponseForm({ submissionId, onResolve, initialResponse = '', isEditing = false, onCancelEdit }) {
  const [responseText, setResponseText] = useState(initialResponse);
  const handleSubmit = () => {
    if (!responseText.trim()) return;
    onResolve(submissionId, responseText.trim());
    setResponseText('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{isEditing ? 'Edit Response' : 'Write Response'}</label>
        {isEditing && <button onClick={onCancelEdit} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>}
      </div>
      <textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Type your response…" rows={5}
        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#3B5BFC'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <button onClick={handleSubmit} disabled={!responseText.trim()} style={{ alignSelf: 'flex-start', padding: '10px 22px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: responseText.trim() ? 'pointer' : 'not-allowed', background: responseText.trim() ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)', color: responseText.trim() ? '#fff' : 'var(--text-muted)', boxShadow: responseText.trim() ? '0 4px 12px rgba(59,91,252,0.3)' : 'none', display: 'flex', alignItems: 'center', gap: 7 }}>
        <CheckCircle size={14} /> {isEditing ? 'Update Response' : 'Mark as Solved'}
      </button>
    </div>
  );
}

function SubmitModal({ member, onClose, currentUser }) {
  const { workspaceId, currentUid } = useApp();
  const [helpText, setHelpText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!helpText.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      await submitHelpRequest(workspaceId, {
        member: {
          name: member.name,
          role: member.role,
          userRole: currentUser?.userRole || 'management', // System role for permission checks
          avatar: member.avatar,
          avatarImg: member.avatarImg || null,
          color: member.color,
          uid: currentUid
        },
        message: helpText.trim()
      });
      
      setSubmitted(true);
      notify.helpSubmitted('Your request has been sent to the admin team');
      setTimeout(() => onClose(), 1800);
    } catch (error) {
      console.error('Error submitting help request:', error);
      notify.error('Failed to submit request');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '28px', width: 480, border: '1.5px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={18} color="#3B5BFC" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Submit Help Request</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Describe your issue or question</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="var(--text-muted)" />
          </button>
        </div>

        {submitted ? (
          <div style={{ background: '#ECFDF5', border: '1.5px solid #12C479', borderRadius: 12, padding: '18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={22} color="#12C479" strokeWidth={2.5} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>Request Submitted</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Your help request has been sent.</div>
            </div>
          </div>
        ) : (
          <>
            <textarea value={helpText} onChange={e => { if (e.target.value.length <= 1000) setHelpText(e.target.value); }}
              placeholder="Describe your issue, question, or request for assistance…"
              rows={6}
              style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!helpText.trim() || submitting} style={{ padding: '9px 20px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: (helpText.trim() && !submitting) ? 'pointer' : 'not-allowed', background: (helpText.trim() && !submitting) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)', color: (helpText.trim() && !submitting) ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, boxShadow: (helpText.trim() && !submitting) ? '0 4px 12px rgba(59,91,252,0.3)' : 'none' }}>
                <Send size={13} /> {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ManagementHelp({ member, setPageFilteredData }) {
  const { workspaceId, currentUid, currentUser } = useApp();
  const [allSubmissions, setAllSubmissions] = useState([]); // Store all filtered submissions
  const [displayedSubmissions, setDisplayedSubmissions] = useState([]); // Submissions to display
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingResponse, setEditingResponse] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10); // How many to display
  
  // Check if current user is admin (not management)
  const isAdmin = currentUser?.userRole === 'admin';
  
  // Password protection hook
  const { 
    showPasswordModal, 
    pendingAction, 
    requestAdminPassword, 
    handlePasswordConfirm, 
    handlePasswordCancel 
  } = useAdminPassword();

  // Subscribe to help submissions from Firebase (load all, we'll paginate on client)
  useEffect(() => {
    if (!workspaceId) return;

    // Load more submissions from Firebase (50 at a time is reasonable)
    const unsubscribe = subscribeToHelpSubmissions(workspaceId, (loadedSubmissions) => {
      // Filter submissions based on user role:
      // - Admin users: see ALL submissions
      // - Management users: see their OWN submissions + ALL team member submissions (not other management users)
      const filteredSubmissions = isAdmin 
        ? loadedSubmissions 
        : loadedSubmissions.filter(sub => {
            // Always show if it's the current user's own submission
            if (sub.member?.uid === currentUid) return true;
            
            // Show if it's from a team member (not from management or admin)
            const submitterRole = sub.member?.role?.toLowerCase();
            const isFromManagementOrAdmin = submitterRole === 'admin' || 
                                           submitterRole === 'management' || 
                                           submitterRole === 'mangment'; // Handle typo variant
            
            // Show team member submissions (exclude management/admin submissions from other users)
            return !isFromManagementOrAdmin;
          });
      
      // Sort: Pending submissions first, then solved submissions
      // Within each group, sort by timestamp (newest first)
      const sortedSubmissions = filteredSubmissions.sort((a, b) => {
        // First, sort by status (pending before solved)
        if (a.status === 'pending' && b.status === 'solved') return -1;
        if (a.status === 'solved' && b.status === 'pending') return 1;
        
        // If same status, sort by timestamp (newest first)
        return b.timestamp - a.timestamp;
      });
      
      console.log('📋 Help submissions filtered and sorted:', {
        isAdmin,
        currentUid,
        totalSubmissions: loadedSubmissions.length,
        filteredCount: sortedSubmissions.length,
        pendingCount: sortedSubmissions.filter(s => s.status === 'pending').length,
        solvedCount: sortedSubmissions.filter(s => s.status === 'solved').length,
        filtered: sortedSubmissions.map(s => ({ 
          id: s.id, 
          from: s.member?.name, 
          role: s.member?.role,
          status: s.status,
          isOwn: s.member?.uid === currentUid 
        }))
      });
      
      // Store all filtered and sorted submissions
      setAllSubmissions(sortedSubmissions);
    }, 50); // Load 50 at a time from Firebase

    return () => unsubscribe();
  }, [workspaceId, isAdmin, currentUid]);
  
  // Apply display limit to filtered submissions
  useEffect(() => {
    const displayed = allSubmissions.slice(0, displayLimit);
    setDisplayedSubmissions(displayed);
  }, [allSubmissions, displayLimit]);

  // Send filtered data to parent for search
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ help: allSubmissions });
    }
  }, [allSubmissions.length, setPageFilteredData]);
  
  // Function to load more submissions
  const loadMore = () => {
    setDisplayLimit(prev => prev + 10);
  };
  
  const hasMore = allSubmissions.length > displayLimit;

  const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;
  const solvedCount  = allSubmissions.filter(s => s.status === 'solved').length;

  async function handleResolve(submissionId, responseText) {
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
          name: currentUser?.name || member?.name || 'Management',
          avatar: currentUser?.avatar || member?.avatar || '👤',
          avatarImg: currentUser?.avatarImg || member?.avatarImg || null,
          color: currentUser?.color || member?.color || '#3B5BFC',
          role: currentUser?.role || member?.role || 'management'
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
                    name: currentUser?.name || member?.name || 'Management',
                    avatar: currentUser?.avatar || member?.avatar || '👤',
                    avatarImg: currentUser?.avatarImg || member?.avatarImg || null,
                    color: currentUser?.color || member?.color || '#3B5BFC',
                    role: currentUser?.role || member?.role || 'management'
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
              name: currentUser?.name || member?.name || 'Management',
              avatar: currentUser?.avatar || member?.avatar || '👤',
              avatarImg: currentUser?.avatarImg || member?.avatarImg || null,
              color: currentUser?.color || member?.color || '#3B5BFC',
              role: currentUser?.role || member?.role || 'management'
            },
            resolvedAt: new Date(),
            updatedAt: new Date()
          }));
        }
      }
      
      setEditingResponse(false);
      notify.helpResolved();
    } catch (error) {
      console.error('Error resolving help submission:', error);
      notify.error('Failed to update submission');
    }
  }
  
  // Handle password-protected resolve
  const handleResolveWithPassword = (submissionId, responseText) => {
    requestAdminPassword('resolve help submission', () => handleResolve(submissionId, responseText));
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', gap: 20 }}>

      {/* Main layout */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', gap: 20 }}>
        {/* Left: detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
            {selectedSubmission ? (
              <>
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
                      fontSize: 14, 
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
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedSubmission.member.role} • {selectedSubmission.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedSubmission(null); setEditingResponse(false); }} style={{ padding: '8px 16px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-surface)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X size={14} /> Close
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedSubmission.status === 'solved'
                      ? <><CheckCircle size={16} color="#12C479" strokeWidth={2.5} /><span style={{ fontSize: 13, fontWeight: 700, color: '#12C479' }}>Solved</span></>
                      : <><Clock size={16} color="#F97316" strokeWidth={2.5} /><span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>Pending</span></>
                    }
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</label>
                    <div style={{ padding: '14px 16px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)', lineHeight: 1.6 }}>{selectedSubmission.message}</div>
                  </div>
                  {selectedSubmission.status === 'solved' && !editingResponse ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Response</label>
                          {/* Show resolver info */}
                          {selectedSubmission.resolvedByInfo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ 
                                width: 18, 
                                height: 18, 
                                borderRadius: '50%', 
                                background: selectedSubmission.resolvedByInfo.avatarImg ? 'transparent' : selectedSubmission.resolvedByInfo.color,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: 8,
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
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                                by {selectedSubmission.resolvedByInfo.name}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Only show Edit button if current user resolved it AND is admin */}
                        {isAdmin && selectedSubmission.resolvedBy === currentUid && (
                          <button onClick={() => setEditingResponse(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <Edit2 size={11} /> Edit
                          </button>
                        )}
                      </div>
                      <div style={{ padding: '14px 16px', border: '1.5px solid #12C479', borderRadius: 12, fontSize: 14, color: '#059669', background: '#ECFDF5', lineHeight: 1.6 }}>{selectedSubmission.response}</div>
                    </div>
                  ) : selectedSubmission.status === 'pending' && isAdmin ? (
                    // Admin users can respond to all pending submissions
                    <ResponseForm submissionId={selectedSubmission.id} onResolve={handleResolveWithPassword} initialResponse={editingResponse ? selectedSubmission.response : ''} isEditing={editingResponse} onCancelEdit={() => setEditingResponse(false)} />
                  ) : selectedSubmission.status === 'pending' && !isAdmin ? (
                    // Management users can only respond to team member submissions (not other management/admin)
                    (() => {
                      // Use userRole (system role) for permission check
                      const submitterUserRole = selectedSubmission.member?.userRole?.toLowerCase();
                      
                      // If userRole exists, use it for the check (most reliable)
                      // If userRole is missing (old submissions), assume it's a team member
                      let isFromManagementOrAdmin = false;
                      
                      if (submitterUserRole) {
                        // New submissions with userRole field
                        isFromManagementOrAdmin = submitterUserRole === 'admin' || submitterUserRole === 'management';
                      } else {
                        // Old submissions without userRole - check role field as fallback
                        const submitterRole = selectedSubmission.member?.role?.toLowerCase();
                        isFromManagementOrAdmin = submitterRole === 'admin' || 
                                                  submitterRole === 'administrator' ||
                                                  submitterRole === 'management' || 
                                                  submitterRole === 'mangment';
                      }
                      
                      console.log('🔍 Management Help - Checking response permission:', {
                        submitterName: selectedSubmission.member?.name,
                        submitterRole: selectedSubmission.member?.role,
                        submitterUserRole: selectedSubmission.member?.userRole,
                        hasUserRole: !!submitterUserRole,
                        isFromManagementOrAdmin,
                        canRespond: !isFromManagementOrAdmin
                      });
                      
                      // Show response form only if it's from a team member (not management/admin)
                      if (!isFromManagementOrAdmin) {
                        return <ResponseForm submissionId={selectedSubmission.id} onResolve={handleResolveWithPassword} initialResponse={editingResponse ? selectedSubmission.response : ''} isEditing={editingResponse} onCancelEdit={() => setEditingResponse(false)} />;
                      }
                      
                      // Show waiting message for management/admin submissions
                      return (
                        <div style={{ padding: '16px', border: '1.5px solid #FDE68A', borderRadius: 12, background: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Clock size={20} color="#F97316" strokeWidth={2.5} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>Waiting for Admin Response</div>
                            <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>An admin will respond to this request.</div>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                <MessageSquare size={40} color="#C4C9D9" />
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>No Submission Selected</div>
                <div style={{ fontSize: 14 }}>Select a help request from the right panel</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: list */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1.5px solid var(--border-light)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Help Submissions</div>
                <button onClick={() => setShowSubmitModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,91,252,0.3)' }}>
                  <Plus size={13} /> Submit
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color="#F97316" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316' }}>{pendingCount} Pending</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} color="#12C479" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#12C479' }}>{solvedCount} Solved</span>
                </div>
              </div>
            </div>
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
                      <div key={sub.id} onClick={() => { setSelectedSubmission(sub); setEditingResponse(false); }}
                        style={{ background: sub.status === 'solved' ? 'var(--bg-subtle)' : '#FFFBEB', border: `1.5px solid ${selectedSubmission?.id === sub.id ? '#3B5BFC' : sub.status === 'solved' ? 'var(--border)' : '#FDE68A'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              background: sub.member.avatarImg ? 'transparent' : sub.member.color, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: 8, 
                              fontWeight: 800, 
                              color: '#fff',
                              overflow: 'hidden'
                            }}>
                              {sub.member.avatarImg ? (
                                <img src={sub.member.avatarImg} alt={sub.member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                sub.member.avatar
                              )}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{sub.member.name}</span>
                          </div>
                          {sub.status === 'solved'
                            ? <CheckCircle size={13} color="#12C479" strokeWidth={2.5} />
                            : <Clock size={13} color="#F97316" strokeWidth={2.5} />
                          }
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {sub.message.split(' ').slice(0, 12).join(' ')}{sub.message.split(' ').length > 12 ? '…' : ''}
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
      </div>

      {showSubmitModal && <SubmitModal member={member} currentUser={currentUser} onClose={() => setShowSubmitModal(false)} />}
      
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
