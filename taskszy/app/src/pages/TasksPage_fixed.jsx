import React, { useState, useRef, useEffect, useMemo } from 'react';
import { notify } from '../lib/notify';
import { Plus, X, RefreshCw, Wallet, Trash2, CheckCircle, CheckSquare, AlertCircle, Clock, Shield, UserCheck, Calendar, ChevronDown, ClipboardCheck, Edit2, ChevronLeft, ChevronRight, Hourglass, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';
import TaskChatPanel from '../components/TaskChatPanel';
import TaskTimelinePanel from '../components/TaskTimelinePanel'; // ? PHASE 10: New timeline panel

// -- Constants ---------------------------------------------------------------
const STAGES = ['New', 'Start', 'Issue', 'Review A', 'Review B', 'Update', 'Complete'];
const STAGE_COLORS = { New: '#9CA3AF', Start: '#3B5BFC', Issue: '#EF4444', 'Review A': '#F97316', 'Review B': '#7C3AED', Update: '#D97706', Complete: '#12C479' };
const STAGE_BG     = { New: '#F3F4F6', Start: '#EEF2FF', Issue: '#FEF2F2', 'Review A': '#FFF7ED', 'Review B': '#F5F3FF', Update: '#FFFBEB', Complete: '#ECFDF5' };

// Tags and categories are created dynamically from the task creation form
const TAGS = [];

const CATEGORIES = [];

// Fallback function for generating task ID on client side
// Format: 4 letters + 4 digits in random positions (e.g., A1BC2D34, 1AB2C3D4)
function generateIdFallback() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  // Create array of 8 positions
  const positions = Array(8).fill(null);
  
  // Randomly select 4 positions for letters
  const letterPositions = [];
  while (letterPositions.length < 4) {
    const pos = Math.floor(Math.random() * 8);
    if (!letterPositions.includes(pos)) {
      letterPositions.push(pos);
    }
  }
  
  // Fill letter positions
  letterPositions.forEach((pos) => {
    positions[pos] = letters.charAt(Math.floor(Math.random() * letters.length));
  });
  
  // Fill remaining positions with digits
  for (let i = 0; i < 8; i++) {
    if (positions[i] === null) {
      positions[i] = digits.charAt(Math.floor(Math.random() * digits.length));
    }
  }
  
  return positions.join('');
}

// Function to lighten a color for background use
function lightenColor(color, opacity = 0.15) {
  if (!color || !color.startsWith('#')) return '#F0F2F8';
  
  // Extract RGB values
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Create a light version by blending with white
  const lightR = Math.round(r + (255 - r) * (1 - opacity));
  const lightG = Math.round(g + (255 - g) * (1 - opacity));
  const lightB = Math.round(b + (255 - b) * (1 - opacity));
  
  return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
}

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '#';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function StageFlow({ current, members = [], paid = false, history = [], taskId, getPaymentsForTask }) {
  const idx = STAGES.indexOf(current);
  const visitedStages = new Set(history.map((h) => h.stage));

  const membersByStage = {};
  members.forEach((m) => {
    if (!membersByStage[m.stage]) membersByStage[m.stage] = [];
    membersByStage[m.stage].push(m);
  });

  // Get payments for this task to check if members are paid
  const taskPayments = getPaymentsForTask ? getPaymentsForTask(taskId) : [];
  
  // Debug: Log member avatar data

  return (
    <div style={{ position: 'relative', paddingBottom: 18 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {STAGES.map((s, i) => {
          const skippedUpdate = s === 'Update' && current === 'Complete' && !visitedStages.has('Update');
          const bg = skippedUpdate ? '#BBF7D0' : i <= idx ? STAGE_COLORS[s] : '#E8EAEF';
          const opacity = skippedUpdate ? 1 : i === idx ? 1 : i < idx ? 0.6 : 0.3;
          return (
            <div key={s} style={{ height: 5, flex: 1, borderRadius: 3, background: bg, opacity, transition: 'background 0.2s', position: 'relative' }} />
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 8, left: 0, right: 0 }}>
        {STAGES.map((s, i) => {
          const group = membersByStage[s];
          if (!group || group.length === 0) return null;
          const leftPct = (i / STAGES.length) * 100 + (100 / STAGES.length / 2);
          return (
            <div key={s} style={{ position: 'absolute', left: `${leftPct}%`, transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
              {group.slice(0, 3).map((m) => {
                // Check if this member's payment is paid from payments collection
                const memberPayment = taskPayments.find((p) => 
                  String(p.memberId) === String(m.id) || 
                  p.assignedTo?.some((a) => String(a.id) === String(m.id))
                );
                const isPaid = memberPayment && (memberPayment.isPaid === true || memberPayment.status === 'Paid');
                const showGreenBorder = m.stage === 'Complete' && isPaid;
                
                return (
                  <div key={m.id} style={{ width: 16, height: 16, borderRadius: '50%', background: m.avatarImg ? 'transparent' : m.color, border: showGreenBorder ? '2px solid #12C479' : '1.5px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: '#fff', position: 'relative', cursor: 'default', overflow: 'hidden' }}
                    onMouseEnter={(e) => { const tip = e.currentTarget.querySelector('.avatar-tip'); if (tip) tip.style.opacity = '1'; }}
                    onMouseLeave={(e) => { const tip = e.currentTarget.querySelector('.avatar-tip'); if (tip) tip.style.opacity = '0'; }}
                  >
                    {m.avatarImg ? (
                      <img src={m.avatarImg} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      m.avatar
                    )}
                    <div className="avatar-tip" style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: 'var(--text-primary)', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s', zIndex: 100 }}>
                      {m.name}
                    </div>
                  </div>
                );
              })}
              {group.length > 3 && (
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1.5px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: 'var(--text-muted)' }}>
                  +{group.length - 3}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- Task Requests Panel (Inline Right Side) ---------------------------------
function TaskRequestsModal({ onClose, onApprove, onComplete, requests }) {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month
  const [displayCount, setDisplayCount] = useState(10); // Initially show 10 requests
  const panelRef = useRef(null);

  const selectedDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();
  const monthLabel = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter by pending/complete status + selected month
  const filteredRequests = requests.filter((r) => {
    // Convert Firestore Timestamp to Date if needed
    const timestamp = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
    
    // Check if request is in selected month
    if (timestamp.getMonth() !== selectedMonth || timestamp.getFullYear() !== selectedYear) return false;
    
    // Filter by status
    if (statusFilter === 'Pending') return !r.isComplete && !r.isCreated;
    if (statusFilter === 'Complete') return r.isComplete || r.isCreated;
    return true;
  });
  
  // Paginate requests - show only displayCount items
  const displayedRequests = filteredRequests.slice(0, displayCount);
  const hasMore = filteredRequests.length > displayCount;
  
  // Reset display count when month or filter changes
  useEffect(() => {
    setDisplayCount(10);
  }, [monthOffset, statusFilter]);
  
  return (
    <div 
      ref={panelRef}
      style={{ 
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: 'var(--bg-surface)', 
        zIndex: 10,
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        borderLeft: '1px solid var(--border-light)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,91,252,0.3)' }}>
              <ClipboardCheck size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Task Approvals</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Review & approve member task</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['Pending', 'Complete'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === filter ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--bg-subtle)',
                color: statusFilter === filter ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                boxShadow: statusFilter === filter ? '0 2px 8px rgba(59,91,252,0.3)' : 'none',
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Month Scroller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)', borderRadius: 10, padding: '6px 10px' }}>
          <button onClick={() => setMonthOffset(p => p - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChevronLeft size={14} color="var(--text-secondary)" />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{monthLabel}</div>
          <button onClick={() => setMonthOffset(p => p + 1)} disabled={monthOffset >= 0} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--bg-surface)', cursor: monthOffset >= 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: monthOffset >= 0 ? 0.35 : 1 }}>
            <ChevronRight size={14} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column' }}>
        {filteredRequests.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', gap: 10 }}>
            <ClipboardCheck size={52} color="#C4C9D9" />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>No {statusFilter} Approvals</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220, lineHeight: 1.6 }}>Member task approvals for this month will appear here</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayedRequests.map((request) => (
              <div key={request.id} style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '18px 20px', border: '1.5px solid var(--border)' }}>
                {/* Submitted by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: request.submittedBy.avatarImg ? 'transparent' : request.submittedBy.color,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {request.submittedBy.avatarImg ? (
                      <img src={request.submittedBy.avatarImg} alt={request.submittedBy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      request.submittedBy.avatar
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{request.submittedBy.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{request.submittedBy.role} • {(request.timestamp?.toDate ? request.timestamp.toDate() : new Date(request.timestamp)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{request.title}</div>
                  {request.isCreated && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#EEF2FF', color: '#3B5BFC', border: '1px solid #C7D4FF' }}>Created</span>
                  )}
                  {request.isComplete && !request.isCreated && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#ECFDF5', color: '#12C479', border: '1px solid #A7F3D0' }}>Completed</span>
                  )}
                </div>

                {/* Description */}
                {request.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>{request.description}</div>
                )}

                {/* Approved by */}
                {request.approvedBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, padding: '7px 10px', background: 'var(--bg-surface)', borderRadius: 9, border: '1.5px solid var(--border-light)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: request.approvedBy.avatarImg ? 'transparent' : (request.approvedBy.color || '#3B5BFC'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {request.approvedBy.avatarImg ? (
                        <img src={request.approvedBy.avatarImg} alt={request.approvedBy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        request.approvedBy.avatar || request.approvedBy.name?.slice(0,2).toUpperCase()
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Approved by</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{request.approvedBy.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{request.approvedBy.role}</span>
                  </div>
                )}

                {/* Completed by */}
                {request.completedBy && !request.isCreated && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, padding: '7px 10px', background: 'var(--bg-surface)', borderRadius: 9, border: '1.5px solid var(--border-light)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: request.completedBy.avatarImg ? 'transparent' : (request.completedBy.color || '#12C479'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {request.completedBy.avatarImg ? (
                        <img src={request.completedBy.avatarImg} alt={request.completedBy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        request.completedBy.avatar || request.completedBy.name?.slice(0,2).toUpperCase()
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed by</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{request.completedBy.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{request.completedBy.role}</span>
                  </div>
                )}

                {/* Actions - Only show for pending requests */}
                {!request.isComplete && !request.isCreated && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => onApprove(request)}
                      style={{
                        flex: 1,
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59,91,252,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <UserCheck size={14} strokeWidth={2.5} />
                      Approve
                    </button>
                    <button 
                      onClick={() => onComplete && onComplete(request)}
                      style={{
                        flex: 1,
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #12C479, #059669)',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(18,196,121,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckCircle size={14} strokeWidth={2.5} />
                      Complete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <button
              onClick={() => setDisplayCount((prev) => prev + 10)}
              style={{
                marginTop: 16,
                padding: '12px 20px',
                background: 'var(--bg-subtle)',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.borderColor = '#3B5BFC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-subtle)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <RefreshCw size={14} strokeWidth={2.5} />
              Load More
            </button>
          )}
        </>
        )}
      </div>
    </div>
  );
}

// -- Task Timeline Panel (Right Side) ----------------------------------------
// ? PHASE 10: Moved to separate component file: src/components/TaskTimelinePanel.jsx
// This old implementation used task.history field
// New implementation uses Firestore timeline subcollection with real-time updates

// -- Create Task Modal -------------------------------------------------------
function CreateTaskModal({ onClose, onCreate, onSchedule, teamMembers, requestData = null, hideBudget = false, currentUser = null, managementMode = false, onNavigateToManage = null }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { tasks, workspaceId, TAGS, CATEGORIES } = useApp();
  const [taskId, setTaskId] = useState('');
  const [generatingId, setGeneratingId] = useState(true);
  const [title, setTitle] = useState(requestData?.title || '');
  const [description, setDescription] = useState(requestData?.description || '');
  const [deadline, setDeadline] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [dateMode, setDateMode] = useState('completion'); // 'completion' | 'schedule'
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stage, setStage] = useState('New');
  
  // ? Auto-assign management user when creating task in management mode
  const [assignments, setAssignments] = useState(() => {
    if (managementMode && currentUser && currentUser.memberId) {
      // Find the management user in teamMembers to get their full info
      const managementMember = teamMembers.find((m) => m.id === currentUser.memberId || String(m.id) === String(currentUser.memberId));
      if (managementMember) {

        return [{ memberId: String(managementMember.id), memberDesc: '', budget: '' }];
      }
    }
    return [{ memberId: '', memberDesc: '', budget: '' }];
  });
  
  // Restore form data from Firestore on mount
  useEffect(() => {
    if (!workspaceId) return;
    
    const loadDraft = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        const draftRef = doc(db, `workspaces/${workspaceId}/taskDrafts/current`);
        const draftSnap = await getDoc(draftRef);
        
        if (draftSnap.exists()) {
          const data = draftSnap.data();
          setTitle(data.title || '');
          setDescription(data.description || '');
          setDeadline(data.deadline || '');
          setScheduledDate(data.scheduledDate || '');
          setDateMode(data.dateMode || 'completion');
          setSelectedTags(data.selectedTags || []);
          setSelectedCategory(data.selectedCategory || null);
          setStage(data.stage || 'New');
          setAssignments(data.assignments || [{ memberId: '', memberDesc: '', budget: '' }]);
          setPaymentEntries(data.paymentEntries || [{ title: '', amount: '' }]);
          setScribes(data.scribes || []);

          // Delete draft after restoring
          const { deleteDoc } = await import('firebase/firestore');
          await deleteDoc(draftRef);
        }
      } catch (err) {

      }
    };
    
    loadDraft();
  }, [workspaceId]);
  
  // Generate task ID on mount
  useEffect(() => {
    import('../lib/taskIdService').then(({ generateTaskId }) => {
      generateTaskId(workspaceId).then(id => {
        setTaskId(id);
        setGeneratingId(false);
      }).catch(err => {

        // Fallback to client-side generation
        const fallbackId = generateIdFallback();
        setTaskId(fallbackId);
        setGeneratingId(false);
      });
    });
  }, [workspaceId]);
  
  // Custom tags and categories
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  
  // Payment options
  const [paymentEntries, setPaymentEntries] = useState([{ title: '', amount: '' }]);

  // Task Budget (separate from member budgets)
  const [taskBudgetAmount, setTaskBudgetAmount] = useState('');
  const [taskBudgetStatus, setTaskBudgetStatus] = useState('Unpaid'); // 'Paid' or 'Unpaid'

  // Scribe attachments
  const [scribes, setScribes] = useState([]);
  const [showScribePicker, setShowScribePicker] = useState(false);
  const [editingScribeIdx, setEditingScribeIdx] = useState(null); // index being edited, or null
  const [scribeType, setScribeType] = useState('note');
  const [scribeTitle, setScribeTitle] = useState('');
  const [scribeAssignees, setScribeAssignees] = useState([]);
  const [scribeAssignMode, setScribeAssignMode] = useState('all'); // 'all' | 'role' | 'member'
  const [scribeSelectedRole, setScribeSelectedRole] = useState('');

  // Load from previous task
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [loadSearch, setLoadSearch] = useState('');
  
  // Save form data to Firestore and navigate to Manage page
  const saveFormDataAndNavigate = async () => {
    if (!workspaceId) return;
    
    try {
      const formData = {
        title,
        description,
        deadline,
        scheduledDate,
        dateMode,
        selectedTags,
        selectedCategory,
        stage,
        assignments,
        paymentEntries,
        scribes,
        savedAt: new Date().toISOString()
      };
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      await setDoc(doc(db, `workspaces/${workspaceId}/taskDrafts/current`), formData);

      onClose();
      if (onNavigateToManage) {
        onNavigateToManage();
      }
    } catch (err) {

    }
  };

  const loadFromTask = (t) => {
    setTitle(t.title || '');
    setDescription(t.description || '');
    setSelectedTags(t.tags || []);
    setSelectedCategory(t.category || null);
    setStage('New');
    setAssignments(
      t.members && t.members.length > 0
        ? t.members.map((m) => ({ memberId: String(m.id), memberDesc: m.memberDesc || '', budget: String(m.budget || '') }))
        : [{ memberId: '', memberDesc: '', budget: '' }]
    );
    setPaymentEntries(
      t.payments && t.payments.length > 0
        ? t.payments.map((p) => ({ title: p.title, amount: String(p.amount) }))
        : [{ title: '', amount: '' }]
    );
    setShowLoadPanel(false);
    setLoadSearch('');
  };

  const openScribeEdit = (idx) => {
    const s = scribes[idx];
    setEditingScribeIdx(idx);
    setShowScribePicker(false);
    setScribeType(s.type);
    setScribeTitle(s.title);
    setScribeAssignMode(s.assignMode || 'all');
    setScribeAssignees(s.assignees || []);
    setScribeSelectedRole('');
  };

  const closeScribePicker = () => {
    setShowScribePicker(false);
    setEditingScribeIdx(null);
    setScribeTitle('');
    setScribeAssignees([]);
    setScribeAssignMode('all');
    setScribeSelectedRole('');
  };

  const addPaymentEntry = () => setPaymentEntries(prev => [...prev, { title: '', amount: '' }]);
  const removePaymentEntry = (i) => setPaymentEntries(prev => prev.filter((_, idx) => idx !== i));
  const updatePaymentEntry = (i, key, val) => setPaymentEntries(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  // ? Total Budget = Team member budgets + Additional payment amounts
  const memberBudgets = assignments.reduce((s, a) => s + (parseFloat(a.budget) || 0), 0);
  const additionalPayments = paymentEntries.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalBudget = memberBudgets + additionalPayments;

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.find((t) => t.label === tag.label) ? prev.filter((t) => t.label !== tag.label) : [...prev, tag]);
  };

  const addCustomTag = () => {
    if (!newTagLabel.trim()) return;
    const customTag = { 
      label: newTagLabel.trim(), 
      emoji: 'ðŸ·ï¸', 
      color: '#6B7280', 
      bg: '#F3F4F6' 
    };
    setSelectedTags(prev => [...prev, customTag]);
    setNewTagLabel('');
    setShowAddTag(false);
  };

  const addCustomCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const customCategory = { 
      label: newCategoryLabel.trim(), 
      emoji: 'ðŸ“', 
      color: '#6B7280', 
      bg: '#F3F4F6' 
    };
    setSelectedCategory(customCategory);
    setNewCategoryLabel('');
    setShowAddCategory(false);
  };

  const addMember = () => {
    if (assignments.length >= 100) return;
    setAssignments((prev) => [...prev, { memberId: '', memberDesc: '', budget: '' }]);
  };
  const removeMember = (i) => {
    // In management mode, prevent removing the management user
    if (managementMode && currentUser?.id && String(assignments[i].memberId) === String(currentUser.id)) {
      return;
    }
    setAssignments((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateAssignment = (i, key, val) => setAssignments((prev) => prev.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  // Find the most recent task this member was assigned to (for pre-fill)
  const getPreviousAssignment = (memberId) => {
    if (!memberId) return null;
    const mid = parseInt(memberId);
    const sorted = [...tasks]
      .filter((t) => t.members?.some((m) => String(m.id) === String(mid)))
      .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));

    if (!sorted.length) return null;
    const member = sorted[0].members.find((m) => String(m.id) === String(mid));

    return { budget: member?.budget ?? '', memberDesc: member?.memberDesc ?? '' };
  };
  const handleSubmitClick = () => {
    // ? Validate required fields: title, deadline/scheduledDate, and category
    if (!title.trim() || (!deadline && !scheduledDate)) return;
    if (!selectedCategory) {
      notify.error('Please select a category for this task');
      return;
    }
    requestAdminPassword(scheduledDate ? 'schedule this task' : 'create this task', () => {
      const members = assignments
        .filter((a) => a.memberId)
        .map((a) => {
          // Try multiple comparison strategies to handle type mismatches
          const m = teamMembers.find((t) => 
            t.id === a.memberId || // Direct comparison
            t.id === parseInt(a.memberId) || // String to number
            String(t.id) === String(a.memberId) || // Both to string
            t.id === Number(a.memberId) // Explicit number conversion
          );
          
          if (!m) {

            return null;
          }
          
          return { ...m, memberDesc: a.memberDesc, budget: parseFloat(a.budget) || 0, stage };
        })
        .filter(Boolean);

      const payments = paymentEntries
        .filter((p) => p.title.trim() || p.amount)
        .map((p) => ({ title: p.title.trim(), amount: parseFloat(p.amount) || 0 }));

      // Strip image data from tags and categories to reduce document size
      const tagsForSave = selectedTags.map((tag) => ({
        id: tag.id,
        label: tag.label || tag.name,
        color: tag.color,
        bg: tag.bg
      }));
      
      const categoryForSave = selectedCategory ? {
        id: selectedCategory.id,
        label: selectedCategory.label || selectedCategory.name,
        color: selectedCategory.color,
        bg: selectedCategory.bg
      } : null;

      const taskData = {
        id: taskId, 
        title, 
        description,
        deadline: deadline || scheduledDate,
        scheduledDate: scheduledDate || null,
        tags: tagsForSave, 
        category: categoryForSave,
        stage, 
        totalBudget, 
        members,
        payments: payments.length > 0 ? payments : null,
        scribes: scribes.length > 0 ? scribes : null,
        taskBudgetAmount: taskBudgetAmount ? parseFloat(taskBudgetAmount) : null, // ? Save task budget
        taskBudgetStatus: taskBudgetAmount ? taskBudgetStatus : null // ? Save task budget status
      };

      const createdBy = requestData?._approvedBy
        ? { ...requestData._approvedBy, source: 'Approval Panel' }
        : currentUser ? { ...currentUser, source: null } : null;

      if (scheduledDate && !deadline) {
        onSchedule && onSchedule(taskData);
      } else {
        onCreate(taskData, createdBy);
      }
      onClose();
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 24, width: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10, borderRadius: '24px 24px 0 0' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Create New Task</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Fill in the details to assign work to your team</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Load Previous Task button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { setShowLoadPanel(v => !v); setLoadSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: showLoadPanel ? '#EEF2FF' : 'var(--input-bg)', border: `1.5px solid ${showLoadPanel ? '#3B5BFC' : 'var(--border)'}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: showLoadPanel ? '#3B5BFC' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <RefreshCw size={13} strokeWidth={2.5} color={showLoadPanel ? '#3B5BFC' : 'var(--text-secondary)'} />
                Load Previous
              </button>

              {/* Dropdown panel */}
              {showLoadPanel && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden' }}>
                  {/* Search */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)' }}>
                    <input
                      autoFocus
                      value={loadSearch}
                      onChange={(e) => setLoadSearch(e.target.value)}
                      placeholder="Search by title or task ID"
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B5BFC'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  {/* Task list */}
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {(() => {
                      const q = loadSearch.trim().toLowerCase();
                      const filtered = tasks.filter((t) =>
                        !q ||
                        t.title?.toLowerCase().includes(q) ||
                        t.id?.toLowerCase().includes(q)
                      ).slice(0, 3); // Load only 3 recent tasks
                      if (filtered.length === 0) return (
                        <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No tasks found</div>
                      );
                      return filtered.map((t) => (
                        <button key={t.id} type="button" onClick={() => loadFromTask(t)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: t.stage === 'Complete' ? '#12C479' : '#3B5BFC', padding: '2px 6px', borderRadius: 5, fontFamily: 'monospace', letterSpacing: 0.5 }}>#{t.id}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: STAGE_BG[t.stage], color: STAGE_COLORS[t.stage] }}>{t.stage}</span>
                              {t.category && (
                                <span style={{ 
                                  fontSize: 10, 
                                  padding: '3px 8px', 
                                  borderRadius: 50, 
                                  background: t.category.bg || '#F3F4F6', 
                                  color: '#1A1D2E', 
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}>
                                  {t.category.image && (
                                    <img src={t.category.image} alt="" style={{ width: 10, height: 10, objectFit: 'contain' }} />
                                  )}
                                  {t.category.label}
                                </span>
                              )}
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{t.members?.length || 0} member{t.members?.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Task ID */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Task ID</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '11px 16px', background: 'var(--input-bg)', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#3B5BFC', letterSpacing: 1 }}>{taskId}</div>
              <button onClick={() => setTaskId(generateId())} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', background: '#EEF2FF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#3B5BFC', cursor: 'pointer' }}>
                <RefreshCw size={14} /> Generate
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title..."
              style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="General overview visible to all team members..." rows={3}
              style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Date ? toggle between Completion and Schedule */}
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, background: 'var(--bg-subtle)', borderRadius: 10, padding: 4 }}>
              {[{ label: 'Completion Date', key: 'completion' }, { label: 'Schedule Date', key: 'schedule' }].map((opt) => (
                <button key={opt.key}
                  onClick={() => { setDateMode(opt.key); setDeadline(''); setScheduledDate(''); }}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: dateMode === opt.key ? 'var(--bg-surface)' : 'transparent',
                    color: dateMode === opt.key ? (opt.key === 'schedule' ? '#7C3AED' : '#3B5BFC') : 'var(--text-muted)',
                    boxShadow: dateMode === opt.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >{opt.label}</button>
              ))}
            </div>
            <input type="date"
              value={dateMode === 'completion' ? deadline : scheduledDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => dateMode === 'completion' ? setDeadline(e.target.value) : setScheduledDate(e.target.value)}
              style={{ width: '100%', padding: '11px 16px', border: `1.5px solid ${(deadline || scheduledDate) ? (dateMode === 'schedule' ? '#7C3AED' : '#3B5BFC') : 'var(--border)'}`, borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', colorScheme: 'normal' }}
              onFocus={(e) => e.target.style.borderColor = dateMode === 'schedule' ? '#7C3AED' : '#3B5BFC'}
              onBlur={(e) => e.target.style.borderColor = (deadline || scheduledDate) ? (dateMode === 'schedule' ? '#7C3AED' : '#3B5BFC') : 'var(--border)'} />
            {dateMode === 'schedule' && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: '#F5F3FF', borderRadius: 10, border: '1.5px solid #DDD6FE', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={13} color="#7C3AED" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>Admin-only ? Scheduled Task</span>
                </div>
                <div style={{ fontSize: 11, color: '#6D28D9', lineHeight: 1.6 }}>
                  This task is scheduled for creation. Only admin can see it until then.
                </div>
              </div>
            )}
          </div>

          {/* Stage */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Initial Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}
              style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="New">New (Default)</option>
              <option value="Start">Start (Begin immediately)</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAGS.map((tag) => {
                // Normalize tag format (support both old and new format)
                const tagData = {
                  id: tag.id || tag.label,
                  label: tag.name || tag.label,
                  image: tag.image || tag.emoji || '???',
                  color: tag.color || '#6B7280',
                  bg: tag.color ? `${tag.color}15` : (tag.bg || '#F3F4F6')
                };
                const isImageUrl = tagData.image && (tagData.image.startsWith('data:') || tagData.image.startsWith('http'));
                const sel = selectedTags.find((t) => (t.label || t.name) === tagData.label);
                return (
                  <button key={tagData.id} onClick={() => toggleTag(tagData)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${sel ? '#3B5BFC' : 'var(--border)'}`,
                    background: sel ? tagData.bg : 'var(--bg-surface)', 
                    color: 'var(--text-secondary)', 
                    transition: 'all 0.15s',
                    boxShadow: sel ? `0 2px 8px ${tagData.color}30` : 'none',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {isImageUrl ? (
                      <img src={tagData.image} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span>{tagData.image}</span>
                    )}
                    {tagData.label}
                  </button>
                );
              })}
              
              {/* Add custom tag button */}
              {!showAddTag ? (
                <button 
                  onClick={saveFormDataAndNavigate} 
                  style={{
                    padding: '6px 14px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    border: '1.5px dashed #C7D4FF',
                    background: 'var(--bg-surface)', 
                    color: '#3B5BFC', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={14} /> Add Tag
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input 
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                    placeholder="Tag name..."
                    autoFocus
                    style={{
                      padding: '6px 12px',
                      border: '1.5px solid #3B5BFC',
                      borderRadius: 10,
                      fontSize: 12,
                      outline: 'none',
                      width: 120,
                    }}
                  />
                  <button 
                    onClick={addCustomTag}
                    style={{
                      background: '#ECFDF5',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CheckCircle size={14} color="#12C479" />
                  </button>
                  <button 
                    onClick={() => { setShowAddTag(false); setNewTagLabel(''); }}
                    style={{
                      background: '#FEF2F2',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} color="#EF4444" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Category <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400, color: 'var(--text-muted)' }}>(pick one)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((cat) => {
                // Normalize category format (support both old and new format)
                const catData = {
                  id: cat.id || cat.label,
                  label: cat.name || cat.label,
                  image: cat.icon || cat.emoji || '??',
                  color: cat.color || '#6B7280',
                  bg: cat.color ? `${cat.color}15` : (cat.bg || '#F3F4F6')
                };
                const isImageUrl = catData.image && (catData.image.startsWith('data:') || catData.image.startsWith('http'));
                const sel = selectedCategory && (selectedCategory.label || selectedCategory.name) === catData.label;
                return (
                  <button key={catData.id} onClick={() => setSelectedCategory(sel ? null : catData)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${sel ? '#3B5BFC' : 'var(--border)'}`,
                    background: sel ? catData.bg : 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    boxShadow: sel ? `0 2px 8px ${catData.color}30` : 'none',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {isImageUrl ? (
                      <img src={catData.image} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span>{catData.image}</span>
                    )}
                    {catData.label}
                  </button>
                );
              })}
              
              {/* Add custom category button */}
              {!showAddCategory ? (
                <button 
                  onClick={saveFormDataAndNavigate} 
                  style={{
                    padding: '6px 14px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    border: '1.5px dashed #C7D4FF',
                    background: 'var(--bg-surface)', 
                    color: '#3B5BFC', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={14} /> Add Category
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input 
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                    placeholder="Category name..."
                    autoFocus
                    style={{
                      padding: '6px 12px',
                      border: '1.5px solid #3B5BFC',
                      borderRadius: 10,
                      fontSize: 12,
                      outline: 'none',
                      width: 140,
                    }}
                  />
                  <button 
                    onClick={addCustomCategory}
                    style={{
                      background: '#ECFDF5',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CheckCircle size={14} color="#12C479" />
                  </button>
                  <button 
                    onClick={() => { setShowAddCategory(false); setNewCategoryLabel(''); }}
                    style={{
                      background: '#FEF2F2',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} color="#EF4444" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Team Assignments */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assign Team Members</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assignments.map((a, i) => (
                <div key={i} style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '16px', border: '1.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Member {i + 1}</span>
                    {assignments.length > 1 && !(managementMode && currentUser?.id && String(a.memberId) === String(currentUser.id)) && (
                      <button onClick={() => removeMember(i)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: hideBudget ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Team Member</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.memberId && getPreviousAssignment(a.memberId) && (
                          <div style={{ position: 'relative', flexShrink: 0 }}
                            onMouseEnter={(e) => {
                              const t = e.currentTarget.querySelector('.prev-tip');
                              if (!t) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              t.style.top = (rect.top - 38) + 'px';
                              t.style.left = (rect.left + rect.width / 2) + 'px';
                              t.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => { const t = e.currentTarget.querySelector('.prev-tip'); if(t) t.style.opacity='0'; }}
                          >
                            <button type="button"
                              onClick={() => {
                                const prev = getPreviousAssignment(a.memberId);
                                setAssignments(p => p.map((x, idx) => idx === i ? { ...x, budget: String(prev.budget), memberDesc: prev.memberDesc } : x));
                              }}
                              style={{ width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2FF', border: '1.5px solid #C7D4FF', borderRadius: 8, cursor: 'pointer' }}>
                              <RefreshCw size={13} color="#3B5BFC" strokeWidth={2.5} />
                            </button>
                            <div className="prev-tip" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'fixed', transform: 'translateX(-50%)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid var(--border)' }}>
                              Autofill from last assignment
                            </div>
                          </div>
                        )}
                        <select value={a.memberId} onChange={(e) => updateAssignment(i, 'memberId', e.target.value)}
                          style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', cursor: 'pointer', boxSizing: 'border-box' }}>
                          <option value="">Select member...</option>
                          {(() => {
                            // ? Get already selected member IDs (excluding current row)
                            const selectedMemberIds = assignments
                              .map((assignment, idx) => idx !== i ? assignment.memberId : null)
                              .filter(Boolean);
                            
                            // ? Filter out already assigned members
                            const active = teamMembers.filter((m) => 
                              m.status === 'Active' && 
                              m.role?.toLowerCase() !== 'admin' &&
                              !selectedMemberIds.includes(String(m.id))
                            );
                            
                            const roles = [...new Set(active.map((m) => m.role))].sort();
                            return roles.map((role) => (
                              <optgroup key={role} label={role}>
                                {active.filter((m) => m.role === role).map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </optgroup>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                    {!hideBudget && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (?)</label>
                        <input type="number" value={a.budget} onChange={(e) => updateAssignment(i, 'budget', e.target.value)} placeholder="0.00"
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', boxSizing: 'border-box' }}
                          onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Instructions</label>
                    <input value={a.memberDesc} onChange={(e) => updateAssignment(i, 'memberDesc', e.target.value)} placeholder="Instructions for this member..."
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addMember} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--bg-surface)', border: '1.5px dashed #C7D4FF', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#3B5BFC', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Add More Members
            </button>
          </div>

          {/* Payment Options */}
          {!hideBudget && (
          <div style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paymentEntries.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Payment Title</label>
                    <input 
                      value={p.title} 
                      onChange={(e) => updatePaymentEntry(i, 'title', e.target.value)} 
                      placeholder="Additional payment..."
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} 
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (?)</label>
                    <input 
                      type="number"
                      value={p.amount} 
                      onChange={(e) => updatePaymentEntry(i, 'amount', e.target.value)} 
                      placeholder="0.00"
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} 
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                    />
                  </div>
                  {paymentEntries.length > 1 && (
                    <button 
                      onClick={() => removePaymentEntry(i)} 
                      style={{ 
                        background: '#FEF2F2', 
                        border: 'none', 
                        borderRadius: 8, 
                        padding: '9px 12px', 
                        color: '#EF4444', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        height: 38,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={addPaymentEntry} 
              style={{ 
                marginTop: 10, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '8px 14px', 
                background: 'var(--bg-surface)', 
                border: '1.5px dashed #C7D4FF', 
                borderRadius: 10, 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#3B5BFC', 
                cursor: 'pointer', 
                width: '100%', 
                justifyContent: 'center' 
              }}
            >
              <Plus size={13} /> Add Payment Entry
            </button>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
              Additional payment details for this task
            </div>
          </div>
          )}

          {/* Scribe */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Scribe</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scribes.map((s, i) => (
                <div key={i}>
                  {/* Edit mode - inline editor for this scribe */}
                  {editingScribeIdx === i ? (
                    <div style={{ background: 'var(--input-bg)', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #7C3AED40', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Row 1: type + title + save + cancel */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[{ key: 'note', color: '#7C3AED', bg: '#F5F3FF', label: 'Note', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                          { key: 'sheet', color: '#12C479', bg: '#ECFDF5', label: 'Sheet', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg> }
                        ].map((opt) => (
                          <div key={opt.key} style={{ position: 'relative' }}
                            onMouseEnter={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '0'}
                          >
                            <button type="button" onClick={() => setScribeType(opt.key)}
                              style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${scribeType === opt.key ? opt.color : 'var(--border)'}`, background: scribeType === opt.key ? opt.bg : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                              {opt.icon}
                            </button>
                            <div className="scribe-tip" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#1A1D2E', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', pointerEvents: 'none', zIndex: 100 }}>
                              {opt.label}
                            </div>
                          </div>
                        ))}
                        <input value={scribeTitle} onChange={(e) => setScribeTitle(e.target.value)} autoFocus
                          placeholder="Title"
                          style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', minWidth: 0 }}
                          onFocus={(e) => e.target.style.borderColor = '#7C3AED'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                        {/* Save */}
                        <button type="button" disabled={!scribeTitle.trim()}
                          onClick={() => {
                            if (!scribeTitle.trim()) return;
                            const allMemberIds = assignments.filter((a) => a.memberId).map((a) => String(a.memberId));
                            const resolvedAssignees = scribeAssignMode === 'all'
                              ? allMemberIds
                              : scribeAssignees.length > 0 ? scribeAssignees : allMemberIds;
                            setScribes(prev => prev.map((sc, idx) => idx === i
                              ? { type: scribeType, title: scribeTitle.trim(), assignees: resolvedAssignees, assignMode: scribeAssignMode }
                              : sc
                            ));
                            closeScribePicker();
                          }}
                          style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: scribeTitle.trim() ? '#7C3AED' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: scribeTitle.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                          <CheckCircle size={14} strokeWidth={2.5} />
                        </button>
                        {/* Cancel */}
                        <button type="button" onClick={closeScribePicker}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <X size={13} color="#9CA3AF" />
                        </button>
                      </div>
                      {/* Row 2: Assign to ? mode tabs + list (same as add picker) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 8, padding: 3 }}>
                          {[{ key: 'all', label: 'All' }, { key: 'role', label: 'Role' }].map((mode) => (
                            <button key={mode.key} type="button"
                              onClick={() => { setScribeAssignMode(mode.key); setScribeAssignees([]); setScribeSelectedRole(''); }}
                              style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: scribeAssignMode === mode.key ? 'var(--bg-surface)' : 'transparent', color: scribeAssignMode === mode.key ? '#3B5BFC' : 'var(--text-muted)', boxShadow: scribeAssignMode === mode.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                              {mode.label}
                            </button>
                          ))}
                        </div>
                        {scribeAssignMode === 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#EEF2FF', borderRadius: 8, border: '1.5px solid #C7D4FF' }}>
                            <CheckCircle size={13} color="#3B5BFC" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>All assigned members will join this scribe</span>
                          </div>
                        )}
                        {scribeAssignMode === 'member' && (() => {
                          const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                          if (assignedMembers.length === 0) return <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>No members assigned yet</div>;
                          const allPicked = assignedMembers.every((m) => scribeAssignees.includes(String(m.id)));
                          return (
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                              <button type="button" onClick={() => setScribeAssignees(allPicked ? [] : assignedMembers.map((m) => String(m.id)))}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: allPicked ? '#EEF2FF' : 'var(--bg-subtle)', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allPicked ? '#3B5BFC' : '#C4C9D9'}`, background: allPicked ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {allPicked && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: allPicked ? '#3B5BFC' : 'var(--text-secondary)' }}>Select All</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''}</span>
                              </button>
                              {assignedMembers.map((m, idx) => {
                                const sel = scribeAssignees.includes(String(m.id));
                                return (
                                  <button key={m.id} type="button"
                                    onClick={() => setScribeAssignees(prev => sel ? prev.filter((id) => id !== String(m.id)) : [...prev, String(m.id)])}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: sel ? '#F5F8FF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < assignedMembers.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#3B5BFC' : '#C4C9D9'}`, background: sel ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {sel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                                    </div>
                                    {sel && <CheckCircle size={13} color="#3B5BFC" />}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {scribeAssignMode === 'role' && (() => {
                          const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                          const uniqueRoles = [...new Set(assignedMembers.map((m) => m.role))];
                          if (uniqueRoles.length === 0) return <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>No members assigned yet</div>;
                          return (
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                              {uniqueRoles.map((role, idx) => {
                                const roleMembers = assignedMembers.filter((m) => m.role === role);
                                const roleMemberIds = roleMembers.map((m) => String(m.id));
                                const allSel = roleMemberIds.every((id) => scribeAssignees.includes(id));
                                const someSel = roleMemberIds.some((id) => scribeAssignees.includes(id));
                                return (
                                  <button key={role} type="button"
                                    onClick={() => setScribeAssignees(allSel ? scribeAssignees.filter((id) => !roleMemberIds.includes(id)) : [...new Set([...scribeAssignees, ...roleMemberIds])])}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: allSel ? '#F5F8FF' : someSel ? '#FAFBFF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < uniqueRoles.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allSel ? '#3B5BFC' : someSel ? '#93A8FF' : '#C4C9D9'}`, background: allSel ? '#3B5BFC' : someSel ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {allSel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                      {!allSel && someSel && <div style={{ width: 6, height: 2, background: '#3B5BFC', borderRadius: 1 }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</div>
                                      <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                        {roleMembers.map((m) => (
                                          <div key={m.id} title={m.name} style={{ width: 18, height: 18, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                                        ))}
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }}>{roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                    {allSel && <CheckCircle size={13} color="#3B5BFC" />}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {scribeAssignMode !== 'all' && scribeAssignees.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Selected:</span>
                            {scribeAssignees.map((id) => {
                              const m = teamMembers.find((t) => t.id === parseInt(id));
                              if (!m) return null;
                              return (
                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D4FF' }}>
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>{m.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                  /* Normal display card */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--input-bg)', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: s.type === 'sheet' ? '#ECFDF5' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.type === 'sheet'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                      {s.assignMode === 'all' || (!s.assignMode && s.assignees.length === 0) ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>All assigned members</div>
                      ) : s.assignees.length > 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {s.assignees.map((id) => teamMembers.find((m) => m.id === parseInt(id))?.name).filter(Boolean).join(', ')}
                        </div>
                      ) : null}
                    </div>
                    {/* Edit button */}
                    <button type="button" onClick={() => openScribeEdit(i)}
                      style={{ background: '#F5F3FF', border: 'none', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Edit2 size={12} color="#7C3AED" />
                    </button>
                    {/* Delete button */}
                    <button type="button" onClick={() => setScribes(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                  )}
                </div>
              ))}
              {editingScribeIdx === null && (!showScribePicker ? (
                <button type="button"
                  onClick={() => { setShowScribePicker(true); setScribeTitle(''); setScribeType('note'); setScribeAssignees([]); setScribeAssignMode('all'); setScribeSelectedRole(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px dashed var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', width: '100%' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={12} color="#7C3AED" strokeWidth={2.5} />
                  </div>
                  Scribe
                </button>
              ) : (
                <div style={{ background: 'var(--input-bg)', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #C7D4FF', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Row 1: type + title + add + cancel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Type toggle */}
                  {[{ key: 'note', color: '#7C3AED', bg: '#F5F3FF', label: 'Note', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                    { key: 'sheet', color: '#12C479', bg: '#ECFDF5', label: 'Sheet', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg> }
                  ].map((opt) => (
                    <div key={opt.key} style={{ position: 'relative' }}
                      onMouseEnter={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '0'}
                    >
                      <button type="button" onClick={() => setScribeType(opt.key)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${scribeType === opt.key ? opt.color : 'var(--border)'}`, background: scribeType === opt.key ? opt.bg : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        {opt.icon}
                      </button>
                      <div className="scribe-tip" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#1A1D2E', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', pointerEvents: 'none', zIndex: 100 }}>
                        {opt.label}
                      </div>
                    </div>
                  ))}
                  {/* Title */}
                  <input value={scribeTitle} onChange={(e) => setScribeTitle(e.target.value)}
                    placeholder="Title" autoFocus
                    style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', minWidth: 0 }}
                    onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                  {/* Add */}
                  <button type="button" disabled={!scribeTitle.trim()}
                    onClick={() => {
                      if (!scribeTitle.trim()) return;
                      const allMemberIds = assignments.filter((a) => a.memberId).map((a) => String(a.memberId));
                      const resolvedAssignees = scribeAssignMode === 'all'
                        ? allMemberIds
                        : scribeAssignees.length > 0 ? scribeAssignees : allMemberIds;
                      setScribes(prev => [...prev, { type: scribeType, title: scribeTitle.trim(), assignees: resolvedAssignees, assignMode: scribeAssignMode }]);
                      closeScribePicker();
                    }}
                    style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: scribeTitle.trim() ? '#7C3AED' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: scribeTitle.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                  {/* Cancel */}
                  <button type="button" onClick={closeScribePicker}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={13} color="#9CA3AF" />
                  </button>
                  </div>
                  {/* Row 2: Assign to ? mode tabs + list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Mode tabs: All / Member / Role */}
                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 8, padding: 3 }}>
                      {[{ key: 'all', label: 'All' }, { key: 'role', label: 'Role' }].map((mode) => (
                        <button key={mode.key} type="button"
                          onClick={() => { setScribeAssignMode(mode.key); setScribeAssignees([]); setScribeSelectedRole(''); }}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: scribeAssignMode === mode.key ? 'var(--bg-surface)' : 'transparent',
                            color: scribeAssignMode === mode.key ? '#3B5BFC' : 'var(--text-muted)',
                            boxShadow: scribeAssignMode === mode.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s',
                          }}>
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    {/* All mode ? just a label */}
                    {scribeAssignMode === 'all' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#EEF2FF', borderRadius: 8, border: '1.5px solid #C7D4FF' }}>
                        <CheckCircle size={13} color="#3B5BFC" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>All assigned members will join this scribe</span>
                      </div>
                    )}

                    {/* Member mode ? checklist of assigned members */}
                    {scribeAssignMode === 'member' && (() => {
                      const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                      if (assignedMembers.length === 0) return (
                        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>
                          No members assigned yet
                        </div>
                      );
                      const allPicked = assignedMembers.every((m) => scribeAssignees.includes(String(m.id)));
                      return (
                        <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {/* Select All row */}
                          <button type="button"
                            onClick={() => setScribeAssignees(allPicked ? [] : assignedMembers.map((m) => String(m.id)))}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: allPicked ? '#EEF2FF' : 'var(--bg-subtle)', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allPicked ? '#3B5BFC' : '#C4C9D9'}`, background: allPicked ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {allPicked && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: allPicked ? '#3B5BFC' : 'var(--text-secondary)' }}>Select All</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''}</span>
                          </button>
                          {/* Individual member rows */}
                          {assignedMembers.map((m, idx) => {
                            const sel = scribeAssignees.includes(String(m.id));
                            return (
                              <button key={m.id} type="button"
                                onClick={() => setScribeAssignees(prev => sel ? prev.filter((id) => id !== String(m.id)) : [...prev, String(m.id)])}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: sel ? '#F5F8FF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < assignedMembers.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#3B5BFC' : '#C4C9D9'}`, background: sel ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {sel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                                </div>
                                {sel && <CheckCircle size={13} color="#3B5BFC" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Role mode ? checklist of unique roles from assigned members */}
                    {scribeAssignMode === 'role' && (() => {
                      const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                      const uniqueRoles = [...new Set(assignedMembers.map((m) => m.role))];
                      if (uniqueRoles.length === 0) return (
                        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>
                          No members assigned yet
                        </div>
                      );
                      return (
                        <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {uniqueRoles.map((role, idx) => {
                            const roleMembers = assignedMembers.filter((m) => m.role === role);
                            const roleMemberIds = roleMembers.map((m) => String(m.id));
                            const allSel = roleMemberIds.every((id) => scribeAssignees.includes(id));
                            const someSel = roleMemberIds.some((id) => scribeAssignees.includes(id));
                            return (
                              <button key={role} type="button"
                                onClick={() => setScribeAssignees(allSel
                                  ? scribeAssignees.filter((id) => !roleMemberIds.includes(id))
                                  : [...new Set([...scribeAssignees, ...roleMemberIds])]
                                )}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: allSel ? '#F5F8FF' : someSel ? '#FAFBFF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < uniqueRoles.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allSel ? '#3B5BFC' : someSel ? '#93A8FF' : '#C4C9D9'}`, background: allSel ? '#3B5BFC' : someSel ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {allSel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  {!allSel && someSel && <div style={{ width: 6, height: 2, background: '#3B5BFC', borderRadius: 1 }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</div>
                                  <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                    {roleMembers.map((m) => (
                                      <div key={m.id} title={m.name} style={{ width: 18, height: 18, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                                    ))}
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }}>{roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                {allSel && <CheckCircle size={13} color="#3B5BFC" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Selection summary */}
                    {scribeAssignMode !== 'all' && scribeAssignees.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Selected:</span>
                        {scribeAssignees.map((id) => {
                          const m = teamMembers.find((t) => t.id === parseInt(id));
                          if (!m) return null;
                          return (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D4FF' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>{m.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Budget */}
          {!hideBudget && (
          <div style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Task Budget</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (?)</label>
                <input 
                  type="number"
                  value={taskBudgetAmount} 
                  onChange={(e) => setTaskBudgetAmount(e.target.value)} 
                  placeholder="0.00"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} 
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
              Overall task budget (separate from team member budgets). Payment status managed from Payment page.
            </div>
          </div>
          )}

          {/* Amount summary */}
          {!hideBudget && (
          <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #C7D4FF' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount Summary</div>
            
            {/* Team member budgets */}
            {assignments.filter((a) => a.memberId && a.budget).map((a, i) => {
              const m = teamMembers.find((t) => String(t.id) === String(a.memberId));
              return m ? (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>{m.name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({m.role})</span></span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{parseFloat(a.budget || 0).toLocaleString()}</span>
                </div>
              ) : null;
            })}
            
            {/* Team Amount subtotal */}
            {memberBudgets > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E0E7FF' }}>
                <span style={{ fontWeight: 600 }}>Team Amount</span>
                <span style={{ fontWeight: 700 }}>₹{memberBudgets.toLocaleString()}</span>
              </div>
            )}
            
            {/* Additional Amount subtotal (without individual entries) */}
            {additionalPayments > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E0E7FF' }}>
                <span style={{ fontWeight: 600 }}>Additional Amount</span>
                <span style={{ fontWeight: 700 }}>₹{additionalPayments.toLocaleString()}</span>
              </div>
            )}
            
            {/* Task Budget (display only, not added to total) */}
            {taskBudgetAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7C3AED', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E0E7FF', background: '#F5F3FF', padding: '8px 12px', borderRadius: 8, marginLeft: -12, marginRight: -12 }}>
                <span style={{ fontWeight: 600 }}>Task Budget</span>
                <span style={{ fontWeight: 700 }}>₹{parseFloat(taskBudgetAmount).toLocaleString()}</span>
              </div>
            )}
            
            {/* Total Amount */}
            <div style={{ borderTop: '1px solid #C7D4FF', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#3B5BFC' }}>₹{totalBudget.toLocaleString()}</span>
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmitClick} disabled={!title.trim() || (!deadline && !scheduledDate)} style={{
            padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
            cursor: title.trim() && (deadline || scheduledDate) ? 'pointer' : 'default',
            background: title.trim() && (deadline || scheduledDate)
              ? scheduledDate ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'linear-gradient(135deg, #3B5BFC, #2142D9)'
              : 'var(--border)',
            color: title.trim() && (deadline || scheduledDate) ? '#fff' : 'var(--text-muted)',
            boxShadow: title.trim() && (deadline || scheduledDate) ? '0 6px 20px #3B5BFC40' : 'none',
          }}>{scheduledDate ? 'Schedule Task' : 'Create Task'}</button>
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
          label={managementMode ? 'Management Password' : 'Admin Password'}
        />
      )}
    </div>
  );
}

// -- Edit Task Modal ---------------------------------------------------------
function EditTaskModal({ task, onClose, onUpdate, teamMembers, hideBudget = false, managementMode = false }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { tasks, TAGS, CATEGORIES, getPaymentsForTask, updatePaymentDetails, currentUser } = useApp();
  
  // ? Check if task is completed - if so, make modal read-only
  const isCompleted = task.stage === 'Complete';
  
  // ? Detect if current user is management
  const isManagementUser = managementMode || currentUser?.role?.toLowerCase().includes('management') || currentUser?.role?.toLowerCase().includes('manager') || currentUser?.userRole === 'management';
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline);
  const [selectedTags, setSelectedTags] = useState(task.tags || []);
  const [selectedCategory, setSelectedCategory] = useState(task.category);
  const [assignments, setAssignments] = useState(
    task.members
      .filter((m) => {
        // Filter out management user in management mode
        if (isManagementUser && currentUser?.id && String(m.id) === String(currentUser.id)) {
          return false;
        }
        return true;
      })
      .map((m) => ({ memberId: m.id.toString(), memberDesc: m.memberDesc || '', budget: m.budget || '' }))
  );
  
  // Task Budget (separate from member budgets)
  const [taskBudgetAmount, setTaskBudgetAmount] = useState(task.taskBudgetAmount || '');
  const [taskBudgetStatus, setTaskBudgetStatus] = useState(task.taskBudgetStatus || 'Unpaid');
  
  // ? Load additional payments from Firebase (paymentType === 'additional' or 'investment')
  const [additionalPayments, setAdditionalPayments] = useState([]);
  const [isEditingAdditionalPayments, setIsEditingAdditionalPayments] = useState(false);
  const [hasLoadedInitialPayments, setHasLoadedInitialPayments] = useState(false);
  
  // ? Store payment status info (to check if paid)
  const [paymentStatusMap, setPaymentStatusMap] = useState({});
  
  // ? Load additional payments on mount ONLY (not on every task change)
  useEffect(() => {
    // Only load once when modal opens
    if (hasLoadedInitialPayments) return;
    
    if (getPaymentsForTask) {
      const taskPayments = getPaymentsForTask(task.id);
      const additional = taskPayments.filter((p) => p.paymentType === 'additional' || p.paymentType === 'investment');
      
      // ? Build payment status map for all payments (member + additional)
      const statusMap = {};
      taskPayments.forEach((p) => {
        if (p.paymentType === 'member') {
          // Map by memberId for team member payments
          statusMap[`member-${p.memberId}`] = {
            isPaid: p.isPaid || false,
            paidAmount: p.paidAmount || 0
          };
        } else if (p.paymentType === 'additional' || p.paymentType === 'investment') {
          // Map by payment ID for additional payments
          statusMap[`additional-${p.id}`] = {
            isPaid: p.isPaid || false,
            paidAmount: p.paidAmount || 0
          };
        }
      });

      setAdditionalPayments(additional.map((p) => ({
        id: p.id,
        title: p.title || '',
        amount: p.amount || 0,
      })));
      setPaymentStatusMap(statusMap);
      setHasLoadedInitialPayments(true);
    }
  }, [task.id, getPaymentsForTask, hasLoadedInitialPayments]);
  
  // ? Update additional payment locally (and in Firebase for existing payments)
  const updateAdditionalPayment = (index, field, value) => {
    const payment = additionalPayments[index];
    
    // Mark as editing to prevent useEffect from overwriting changes
    setIsEditingAdditionalPayments(true);
    
    // Always update local state immediately for responsive UI
    setAdditionalPayments(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
    
    // Only update Firebase for existing payments (with ID)
    // New payments (without ID) will be created when task is saved
    if (payment && payment.id) {
      // Debounce Firebase update to avoid lag on every keystroke
      clearTimeout(window.additionalPaymentUpdateTimeout);
      window.additionalPaymentUpdateTimeout = setTimeout(async () => {
        const updates = { [field]: field === 'amount' ? parseFloat(value) || 0 : value };
        await updatePaymentDetails(payment.id, updates);

      }, 1000); // Wait 1 second after user stops typing
    }
  };

  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  // Load from previous task
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [loadSearch, setLoadSearch] = useState('');

  // Scribe attachments
  const [scribes, setScribes] = useState(task.scribes || []);
  const [showScribePicker, setShowScribePicker] = useState(false);
  const [editingScribeIdx, setEditingScribeIdx] = useState(null);
  const [scribeType, setScribeType] = useState('note');
  const [scribeTitle, setScribeTitle] = useState('');
  const [scribeAssignees, setScribeAssignees] = useState([]);
  const [scribeAssignMode, setScribeAssignMode] = useState('all');
  const [scribeSelectedRole, setScribeSelectedRole] = useState('');

  const openScribeEdit = (idx) => {
    const s = scribes[idx];
    setEditingScribeIdx(idx);
    setShowScribePicker(false);
    setScribeType(s.type);
    setScribeTitle(s.title);
    setScribeAssignMode(s.assignMode || 'all');
    setScribeAssignees(s.assignees || []);
    setScribeSelectedRole('');
  };

  const closeScribePicker = () => {
    setShowScribePicker(false);
    setEditingScribeIdx(null);
    setScribeTitle('');
    setScribeAssignees([]);
    setScribeAssignMode('all');
    setScribeSelectedRole('');
  };

  const loadFromTask = (t) => {
    setTitle(t.title || '');
    setDescription(t.description || '');
    setSelectedTags(t.tags || []);
    setSelectedCategory(t.category || null);
    setAssignments(
      t.members && t.members.length > 0
        ? t.members.map((m) => ({ memberId: String(m.id), memberDesc: m.memberDesc || '', budget: String(m.budget || '') }))
        : [{ memberId: '', memberDesc: '', budget: '' }]
    );
    setPaymentEntries(
      t.payments && t.payments.length > 0
        ? t.payments.map((p) => ({ title: p.title, amount: String(p.amount) }))
        : [{ title: '', amount: '' }]
    );
    setShowLoadPanel(false);
    setLoadSearch('');
  };

  // ? Total Budget = Team member budgets + Additional payment amounts from Firebase
  const memberBudgets = assignments.reduce((s, a) => s + (parseFloat(a.budget) || 0), 0);
  const additionalPaymentsTotal = additionalPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalBudget = memberBudgets + additionalPaymentsTotal;

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.find((t) => t.label === tag.label) ? prev.filter((t) => t.label !== tag.label) : [...prev, tag]);
  };

  const addCustomTag = () => {
    if (!newTagLabel.trim()) return;
    const customTag = { label: newTagLabel.trim(), emoji: '???', color: '#6B7280', bg: '#F3F4F6' };
    setSelectedTags(prev => [...prev, customTag]);
    setNewTagLabel('');
    setShowAddTag(false);
  };

  const addCustomCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const customCategory = { label: newCategoryLabel.trim(), emoji: '??', color: '#6B7280', bg: '#F3F4F6' };
    setSelectedCategory(customCategory);
    setNewCategoryLabel('');
    setShowAddCategory(false);
  };

  const addMember = () => {
    if (assignments.length >= 100) return;
    setAssignments(prev => [...prev, { memberId: '', memberDesc: '', budget: '' }]);
  };
  const removeMember = (i) => setAssignments(prev => prev.filter((_, idx) => idx !== i));
  const updateAssignment = (i, key, val) => setAssignments(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  // Find the most recent task this member was assigned to (for pre-fill)
  const getPreviousAssignment = (memberId) => {
    if (!memberId) return null;
    const mid = parseInt(memberId);
    const sorted = [...tasks]
      .filter((t) => t.id !== task.id && t.members?.some((m) => String(m.id) === String(mid)))
      .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));

    if (!sorted.length) return null;
    const member = sorted[0].members.find((m) => String(m.id) === String(mid));

    return { budget: member?.budget ?? '', memberDesc: member?.memberDesc ?? '' };
  };

  const handleSubmitClick = () => {
    if (!title.trim() || !deadline) return;
    requestAdminPassword('update this task', async () => {

      const members = assignments
        .filter((a) => a.memberId)
        .map((a) => {
          // Try multiple comparison strategies to handle type mismatches
          const m = teamMembers.find((t) => 
            t.id === a.memberId || // Direct string comparison
            t.id === parseInt(a.memberId) || // String to number
            String(t.id) === String(a.memberId) || // Both to string
            t.id === Number(a.memberId) // Explicit number conversion
          );
          
          if (!m) {

            return null;
          }

          const existingMember = task.members.find((tm) => 
            tm.id === a.memberId || 
            tm.id === parseInt(a.memberId) ||
            String(tm.id) === String(a.memberId)
          );
          
          return { 
            ...m, 
            memberDesc: a.memberDesc, 
            budget: parseFloat(a.budget) || 0, 
            stage: existingMember?.stage || 'New' 
          };
        })
        .filter(Boolean);

      // ? Sync payment entries with task changes
      try {
        const taskPayments = getPaymentsForTask(task.id);

        // 0?? Update task title in ALL payment entries if title changed
        if (task.title !== title) {

          for (const payment of taskPayments) {
            if (payment.taskTitle !== title) {

              await updatePaymentDetails(payment.id, {
                taskTitle: title,
                ...(payment.paymentType === 'task-budget' ? { title: title } : {})
              });
            }
          }
        }
        
        // 1?? Sync team member payments
        for (const member of members) {
          const existingPayment = taskPayments.find((p) => 
            p.paymentType === 'member' && 
            (String(p.memberId) === String(member.id))
          );
          
          if (existingPayment) {
            // Update existing payment - update amount, name, and assignedTo
            const needsUpdate = 
              existingPayment.amount !== member.budget ||
              existingPayment.memberName !== member.name;
              
            if (needsUpdate) {

              // ? When updating amount, preserve paidAmount and recalculate status
              const currentPaidAmount = existingPayment.paidAmount || 0;
              const newAmount = member.budget;
              const isNowFullyPaid = currentPaidAmount >= newAmount;
              
              await updatePaymentDetails(existingPayment.id, {
                amount: newAmount,
                memberName: member.name,
                taskTitle: title,
                memberId: member.id,
                memberUid: member.uid || null,
                assignedTo: [{
                  id: member.id,
                  name: member.name,
                  uid: member.uid || null
                }],
                // ? Update status based on paidAmount vs new amount
                isPaid: isNowFullyPaid,
                status: isNowFullyPaid ? 'Paid' : 'Pending'
              });

            }
          } else {
            // Create new payment entry for new member

            // Get proper user info for createdBy
            const creatorName = currentUser?.name || 'Admin';
            const creatorRole = currentUser?.role || currentUser?.userRole || 'Admin';
            const creatorUid = currentUser?.uid || null;

            await updatePaymentDetails(null, {
              taskId: task.id,
              taskTitle: title,
              amount: member.budget,
              memberId: member.id,
              memberName: member.name,
              memberUid: member.uid || null,
              status: "Unpaid",
              isPaid: false,
              assignedTo: [{
                id: member.id,
                name: member.name,
                uid: member.uid || null
              }],
              paymentType: 'member',
              notes: '',
              paidAt: null,
              paidAmount: 0,
              createdBy: {
                name: creatorName,
                role: creatorRole,
                uid: creatorUid
              }
            });
          }
        }
        
        // 2?? Sync additional payments
        for (const payment of additionalPayments) {
          // Skip empty payments
          if (!payment.title && !payment.amount) continue;
          
          if (payment.id) {
            // Existing payment - ensure taskTitle is updated
            const existingPayment = taskPayments.find((p) => p.id === payment.id);
            if (existingPayment && existingPayment.taskTitle !== title) {

              await updatePaymentDetails(payment.id, {
                taskTitle: title
              });
            }
          } else {
            // New payment - create it now

            // Get proper user info for createdBy
            const creatorName = currentUser?.name || 'Admin';
            const creatorRole = currentUser?.role || currentUser?.userRole || 'Admin';
            const creatorUid = currentUser?.uid || null;
            
            await updatePaymentDetails(null, {
              taskId: task.id,
              title: payment.title || title,
              taskTitle: title,
              amount: parseFloat(payment.amount) || 0,
              memberId: null,
              memberName: null,
              memberUid: null,
              status: 'Unpaid',
              isPaid: false,
              assignedTo: [],
              paymentType: 'additional',
              notes: '',
              createdBy: {
                name: creatorName,
                role: creatorRole,
                uid: creatorUid
              }
            });
          }
        }
        
        // 3?? Sync task budget payment
        const taskBudgetPayment = taskPayments.find((p) => p.paymentType === 'task-budget');
        const newTaskBudget = taskBudgetAmount ? parseFloat(taskBudgetAmount) : null;
        
        if (newTaskBudget && newTaskBudget > 0) {
          if (taskBudgetPayment) {
            // Update existing task budget payment
            const needsUpdate = 
              taskBudgetPayment.amount !== newTaskBudget ||
              taskBudgetPayment.title !== title ||
              taskBudgetPayment.taskTitle !== title;
              
            if (needsUpdate) {

              // ? Preserve paidAmount and recalculate status
              const currentPaidAmount = taskBudgetPayment.paidAmount || 0;
              const isNowFullyPaid = currentPaidAmount >= newTaskBudget;
              
              await updatePaymentDetails(taskBudgetPayment.id, {
                amount: newTaskBudget,
                title: title,
                taskTitle: title,
                // ? Update status based on paidAmount vs new amount
                isPaid: isNowFullyPaid,
                status: isNowFullyPaid ? 'Paid' : 'Pending'
              });

            }
          } else {
            // Create new task budget payment

            // Get proper user info for createdBy
            const creatorName = currentUser?.name || 'Admin';
            const creatorRole = currentUser?.role || currentUser?.userRole || 'Admin';
            const creatorUid = currentUser?.uid || null;
            
            await updatePaymentDetails(null, {
              taskId: task.id,
              title: title,
              taskTitle: title,
              amount: newTaskBudget,
              memberId: null,
              memberName: null,
              memberUid: null,
              status: 'Unpaid',
              isPaid: false,
              assignedTo: [],
              paymentType: 'task-budget',
              notes: 'Task budget payment',
              paidAmount: 0,
              paymentHistory: [],
              createdBy: {
                name: creatorName,
                role: creatorRole,
                uid: creatorUid
              }
            });
          }
        }

      } catch (error) {

        // Don't block task update if payment sync fails
      }
      
      // Strip image data from tags and categories to reduce document size
      const tagsForSave = selectedTags.map((tag) => ({
        id: tag.id,
        label: tag.label || tag.name,
        color: tag.color,
        bg: tag.bg
      }));
      
      const categoryForSave = selectedCategory ? {
        id: selectedCategory.id,
        label: selectedCategory.label || selectedCategory.name,
        color: selectedCategory.color,
        bg: selectedCategory.bg
      } : null;
      
      const updatedTask = { 
        ...task,
        title, 
        description, 
        deadline, 
        tags: tagsForSave, 
        category: categoryForSave, 
        totalBudget, 
        members,
        scribes: scribes.length > 0 ? scribes : null,
        taskBudgetAmount: taskBudgetAmount ? parseFloat(taskBudgetAmount) : null, // ? Save task budget
        taskBudgetStatus: taskBudgetAmount ? taskBudgetStatus : null // ? Save task budget status
      };
      
      onUpdate(task.id, updatedTask);
      onClose();
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 24, width: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10, borderRadius: '24px 24px 0 0' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              {isCompleted ? 'View Task' : 'Edit Task'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {isCompleted ? 'Task is completed - read-only mode' : 'Update task details and payments'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, opacity: isCompleted ? 0.7 : 1, pointerEvents: isCompleted ? 'none' : 'auto' }}>
          {/* Task ID (read-only) */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Task ID</label>
            <div style={{ padding: '11px 16px', background: 'var(--input-bg)', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#3B5BFC', letterSpacing: 1 }}>{task.id}</div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title *</label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter task title..."
              disabled={isCompleted}
              style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: isCompleted ? 'var(--bg-subtle)' : 'var(--input-bg)', boxSizing: 'border-box', cursor: isCompleted ? 'not-allowed' : 'text', opacity: isCompleted ? 0.7 : 1 }}
              onFocus={(e) => !isCompleted && (e.target.style.borderColor = '#3B5BFC')} 
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="General overview visible to all team members..." 
              rows={3}
              disabled={isCompleted}
              style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: isCompleted ? 'var(--bg-subtle)' : 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', cursor: isCompleted ? 'not-allowed' : 'text', opacity: isCompleted ? 0.7 : 1 }}
              onFocus={(e) => !isCompleted && (e.target.style.borderColor = '#3B5BFC')} 
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Deadline */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Completion Date *</label>
            <input 
              type="date" 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={isCompleted}
              style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: isCompleted ? 'var(--bg-subtle)' : 'var(--input-bg)', boxSizing: 'border-box', colorScheme: 'normal', cursor: isCompleted ? 'not-allowed' : 'text', opacity: isCompleted ? 0.7 : 1 }}
              onFocus={(e) => !isCompleted && (e.target.style.borderColor = '#3B5BFC')} 
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAGS.map((tag) => {
                // Normalize tag format (support both old and new format)
                const tagData = {
                  id: tag.id || tag.label,
                  label: tag.name || tag.label,
                  image: tag.image || tag.emoji || '???',
                  color: tag.color || '#6B7280',
                  bg: tag.color ? `${tag.color}15` : (tag.bg || '#F3F4F6')
                };
                const isImageUrl = tagData.image && (tagData.image.startsWith('data:') || tagData.image.startsWith('http'));
                const sel = selectedTags.find((t) => (t.label || t.name) === tagData.label);
                return (
                  <button key={tagData.id} onClick={() => toggleTag(tagData)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${sel ? '#3B5BFC' : 'var(--border)'}`,
                    background: sel ? tagData.bg : 'var(--bg-surface)', 
                    color: 'var(--text-secondary)', 
                    transition: 'all 0.15s',
                    boxShadow: sel ? `0 2px 8px ${tagData.color}30` : 'none',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {isImageUrl ? (
                      <img src={tagData.image} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span>{tagData.image}</span>
                    )}
                    {tagData.label}
                  </button>
                );
              })}
              
              {!showAddTag ? (
                <button onClick={() => setShowAddTag(true)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px dashed #C7D4FF', background: 'var(--bg-surface)', color: '#3B5BFC', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Add Tag
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={newTagLabel} onChange={(e) => setNewTagLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomTag()} placeholder="Tag name..." autoFocus
                    style={{ padding: '6px 12px', border: '1.5px solid #3B5BFC', borderRadius: 10, fontSize: 12, outline: 'none', width: 120 }} />
                  <button onClick={addCustomTag} style={{ background: '#ECFDF5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={14} color="#12C479" />
                  </button>
                  <button onClick={() => { setShowAddTag(false); setNewTagLabel(''); }} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={14} color="#EF4444" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Category <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400, color: 'var(--text-muted)' }}>(pick one)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((cat) => {
                // Normalize category format (support both old and new format)
                const catData = {
                  id: cat.id || cat.label,
                  label: cat.name || cat.label,
                  image: cat.icon || cat.emoji || '??',
                  color: cat.color || '#6B7280',
                  bg: cat.color ? `${cat.color}15` : (cat.bg || '#F3F4F6')
                };
                const isImageUrl = catData.image && (catData.image.startsWith('data:') || catData.image.startsWith('http'));
                const sel = selectedCategory && (selectedCategory.label || selectedCategory.name) === catData.label;
                return (
                  <button key={catData.id} onClick={() => setSelectedCategory(sel ? null : catData)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${sel ? '#3B5BFC' : 'var(--border)'}`,
                    background: sel ? catData.bg : 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    boxShadow: sel ? `0 2px 8px ${catData.color}30` : 'none',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {isImageUrl ? (
                      <img src={catData.image} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span>{catData.image}</span>
                    )}
                    {catData.label}
                  </button>
                );
              })}
              
              {!showAddCategory && !isCompleted ? (
                <button onClick={() => setShowAddCategory(true)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px dashed #C7D4FF', background: 'var(--bg-surface)', color: '#3B5BFC', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Add Category
                </button>
              ) : showAddCategory && !isCompleted ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={newCategoryLabel} onChange={(e) => setNewCategoryLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()} placeholder="Category name..." autoFocus
                    style={{ padding: '6px 12px', border: '1.5px solid #3B5BFC', borderRadius: 10, fontSize: 12, outline: 'none', width: 140 }} />
                  <button onClick={addCustomCategory} style={{ background: '#ECFDF5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={14} color="#12C479" />
                  </button>
                  <button onClick={() => { setShowAddCategory(false); setNewCategoryLabel(''); }} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={14} color="#EF4444" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Team Assignments */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assign Team Members</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assignments.map((a, i) => (
                <div key={i} style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '16px', border: '1.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Member {i + 1}</span>
                    {assignments.length > 1 && !(managementMode && currentUser?.id && String(a.memberId) === String(currentUser.id)) && (
                      <button onClick={() => removeMember(i)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: hideBudget ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Team Member</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.memberId && getPreviousAssignment(a.memberId) && (
                          <div style={{ position: 'relative', flexShrink: 0 }}
                            onMouseEnter={(e) => {
                              const t = e.currentTarget.querySelector('.prev-tip');
                              if (!t) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              t.style.top = (rect.top - 38) + 'px';
                              t.style.left = (rect.left + rect.width / 2) + 'px';
                              t.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => { const t = e.currentTarget.querySelector('.prev-tip'); if(t) t.style.opacity='0'; }}
                          >
                            <button type="button"
                              onClick={() => {
                                const prev = getPreviousAssignment(a.memberId);
                                setAssignments(p => p.map((x, idx) => idx === i ? { ...x, budget: String(prev.budget), memberDesc: prev.memberDesc } : x));
                              }}
                              style={{ width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2FF', border: '1.5px solid #C7D4FF', borderRadius: 8, cursor: 'pointer' }}>
                              <RefreshCw size={13} color="#3B5BFC" strokeWidth={2.5} />
                            </button>
                            <div className="prev-tip" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'fixed', transform: 'translateX(-50%)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid var(--border)' }}>
                              Autofill from last assignment
                            </div>
                          </div>
                        )}
                        <select value={a.memberId} onChange={(e) => updateAssignment(i, 'memberId', e.target.value)}
                          style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', cursor: 'pointer', boxSizing: 'border-box' }}>
                          <option value="">Select member...</option>
                          {(() => {
                            // ? Get already selected member IDs (excluding current row)
                            const selectedMemberIds = assignments
                              .map((assignment, idx) => idx !== i ? assignment.memberId : null)
                              .filter(Boolean);
                            
                            // ? Filter out already assigned members
                            const active = teamMembers.filter((m) => 
                              m.status === 'Active' && 
                              m.role?.toLowerCase() !== 'admin' &&
                              !selectedMemberIds.includes(String(m.id))
                            );
                            
                            const roles = [...new Set(active.map((m) => m.role))].sort();
                            return roles.map((role) => (
                              <optgroup key={role} label={role}>
                                {active.filter((m) => m.role === role).map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </optgroup>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                    {!hideBudget && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (?)</label>
                        {(() => {
                          // ? Check if this member's payment has been paid
                          const paymentStatus = paymentStatusMap[`member-${a.memberId}`];
                          const hasPaidAmount = paymentStatus && paymentStatus.paidAmount > 0;
                          
                          return (
                            <>
                              <input 
                                type="number" 
                                value={a.budget} 
                                onChange={(e) => updateAssignment(i, 'budget', e.target.value)} 
                                placeholder="0.00"
                                disabled={hasPaidAmount}
                                style={{ 
                                  width: '100%', 
                                  padding: '9px 12px', 
                                  border: '1.5px solid var(--border)', 
                                  borderRadius: 9, 
                                  fontSize: 13, 
                                  color: hasPaidAmount ? 'var(--text-muted)' : 'var(--text-primary)', 
                                  outline: 'none', 
                                  background: hasPaidAmount ? 'var(--bg-subtle)' : 'var(--bg-surface)', 
                                  boxSizing: 'border-box',
                                  cursor: hasPaidAmount ? 'not-allowed' : 'text',
                                  opacity: hasPaidAmount ? 0.6 : 1
                                }}
                                onFocus={(e) => !hasPaidAmount && (e.target.style.borderColor = '#3B5BFC')} 
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                              />
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Instructions</label>
                    <input value={a.memberDesc} onChange={(e) => updateAssignment(i, 'memberDesc', e.target.value)} placeholder="Instructions for this member..."
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addMember} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--bg-surface)', border: '1.5px dashed #C7D4FF', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#3B5BFC', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Add More Members
            </button>
          </div>

          {/* Additional Payments from Firebase */}
          {!hideBudget && (
          <div style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid var(--border)' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Additional Payments</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {additionalPayments.map((p, i) => (
                <div key={p.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Payment Title</label>
                    <input 
                      value={p.title} 
                      onChange={(e) => updateAdditionalPayment(i, 'title', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // Prevent form submission
                          e.stopPropagation();
                        }
                      }}
                      placeholder="Additional payment..."
                      disabled={isCompleted}
                      style={{ 
                        width: '100%', 
                        padding: '9px 12px', 
                        border: '1.5px solid var(--border)', 
                        borderRadius: 9, 
                        fontSize: 13, 
                        color: 'var(--text-primary)', 
                        outline: 'none', 
                        background: isCompleted ? 'var(--bg-subtle)' : 'var(--bg-surface)', 
                        boxSizing: 'border-box',
                        cursor: isCompleted ? 'not-allowed' : 'text',
                        opacity: isCompleted ? 0.7 : 1
                      }}
                      onFocus={(e) => !isCompleted && (e.target.style.borderColor = '#3B5BFC')} 
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (?)</label>
                    {(() => {
                      // ? Check if this additional payment has been paid
                      const paymentStatus = p.id ? paymentStatusMap[`additional-${p.id}`] : null;
                      const hasPaidAmount = paymentStatus && paymentStatus.paidAmount > 0;
                      const isDisabled = isCompleted || hasPaidAmount;
                      
                      return (
                        <div>
                          <input 
                            type="number" 
                            value={p.amount} 
                            onChange={(e) => updateAdditionalPayment(i, 'amount', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault(); // Prevent form submission
                                e.stopPropagation();
                              }
                            }}
                            placeholder="0.00"
                            disabled={isDisabled}
                            style={{ 
                              width: '100%', 
                              padding: '9px 12px', 
                              border: '1.5px solid var(--border)', 
                              borderRadius: 9, 
                              fontSize: 13, 
                              color: isDisabled ? 'var(--text-muted)' : 'var(--text-primary)', 
                              outline: 'none', 
                              background: isDisabled ? 'var(--bg-subtle)' : 'var(--bg-surface)', 
                              boxSizing: 'border-box',
                              cursor: isDisabled ? 'not-allowed' : 'text',
                              opacity: isDisabled ? 0.6 : 1
                            }}
                            onFocus={(e) => !isDisabled && (e.target.style.borderColor = '#3B5BFC')} 
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                          />
                        </div>
                      );
                    })()}
                  </div>
                  {additionalPayments.length > 1 && !isCompleted && !p.id && (
                    <button 
                      onClick={() => {
                        // Remove from local state (only for new entries without Firebase ID)
                        setAdditionalPayments(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      style={{ 
                        background: '#FEF2F2', 
                        border: 'none', 
                        borderRadius: 8, 
                        padding: '9px 12px', 
                        color: '#EF4444', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        height: 38,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isCompleted && (
              <button 
                onClick={() => {
                  // Add new empty payment entry
                  setAdditionalPayments(prev => [...prev, { id: null, title: '', amount: 0 }]);
                }}
                style={{ 
                  marginTop: 10, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  padding: '8px 14px', 
                  background: 'var(--bg-surface)', 
                  border: '1.5px dashed #C7D4FF', 
                  borderRadius: 10, 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: '#3B5BFC', 
                  cursor: 'pointer', 
                  width: '100%', 
                  justifyContent: 'center' 
                }}
              >
                <Plus size={13} /> Add Payment Entry
              </button>
            )}

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
              Additional payment details for this task
            </div>
          </div>
          )}

          {/* Scribe */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Scribe</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scribes.map((s, i) => (
                <div key={i}>
                  {/* Edit mode - inline editor for this scribe */}
                  {editingScribeIdx === i ? (
                    <div style={{ background: 'var(--input-bg)', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #7C3AED40', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Row 1: type + title + save + cancel */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[{ key: 'note', color: '#7C3AED', bg: '#F5F3FF', label: 'Note', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                          { key: 'sheet', color: '#12C479', bg: '#ECFDF5', label: 'Sheet', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg> }
                        ].map((opt) => (
                          <div key={opt.key} style={{ position: 'relative' }}
                            onMouseEnter={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '0'}
                          >
                            <button type="button" onClick={() => setScribeType(opt.key)}
                              style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${scribeType === opt.key ? opt.color : 'var(--border)'}`, background: scribeType === opt.key ? opt.bg : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                              {opt.icon}
                            </button>
                            <div className="scribe-tip" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#1A1D2E', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', pointerEvents: 'none', zIndex: 100 }}>
                              {opt.label}
                            </div>
                          </div>
                        ))}
                        <input value={scribeTitle} onChange={(e) => setScribeTitle(e.target.value)} autoFocus
                          placeholder="Title"
                          style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', minWidth: 0 }}
                          onFocus={(e) => e.target.style.borderColor = '#7C3AED'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                        {/* Save */}
                        <button type="button" disabled={!scribeTitle.trim()}
                          onClick={() => {
                            if (!scribeTitle.trim()) return;
                            const allMemberIds = assignments.filter((a) => a.memberId).map((a) => String(a.memberId));
                            const resolvedAssignees = scribeAssignMode === 'all'
                              ? allMemberIds
                              : scribeAssignees.length > 0 ? scribeAssignees : allMemberIds;
                            setScribes(prev => prev.map((sc, idx) => idx === i
                              ? { type: scribeType, title: scribeTitle.trim(), assignees: resolvedAssignees, assignMode: scribeAssignMode }
                              : sc
                            ));
                            closeScribePicker();
                          }}
                          style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: scribeTitle.trim() ? '#7C3AED' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: scribeTitle.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                          <CheckCircle size={14} strokeWidth={2.5} />
                        </button>
                        {/* Cancel */}
                        <button type="button" onClick={closeScribePicker}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <X size={13} color="#9CA3AF" />
                        </button>
                      </div>
                      {/* Row 2: Assign to ? mode tabs + list (same as add picker) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 8, padding: 3 }}>
                          {[{ key: 'all', label: 'All' }, { key: 'role', label: 'Role' }].map((mode) => (
                            <button key={mode.key} type="button"
                              onClick={() => { setScribeAssignMode(mode.key); setScribeAssignees([]); setScribeSelectedRole(''); }}
                              style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: scribeAssignMode === mode.key ? 'var(--bg-surface)' : 'transparent', color: scribeAssignMode === mode.key ? '#3B5BFC' : 'var(--text-muted)', boxShadow: scribeAssignMode === mode.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                              {mode.label}
                            </button>
                          ))}
                        </div>
                        {scribeAssignMode === 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#EEF2FF', borderRadius: 8, border: '1.5px solid #C7D4FF' }}>
                            <CheckCircle size={13} color="#3B5BFC" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>All assigned members will join this scribe</span>
                          </div>
                        )}
                        {scribeAssignMode === 'member' && (() => {
                          const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                          if (assignedMembers.length === 0) return <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>No members assigned yet</div>;
                          const allPicked = assignedMembers.every((m) => scribeAssignees.includes(String(m.id)));
                          return (
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                              <button type="button" onClick={() => setScribeAssignees(allPicked ? [] : assignedMembers.map((m) => String(m.id)))}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: allPicked ? '#EEF2FF' : 'var(--bg-subtle)', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allPicked ? '#3B5BFC' : '#C4C9D9'}`, background: allPicked ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {allPicked && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: allPicked ? '#3B5BFC' : 'var(--text-secondary)' }}>Select All</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''}</span>
                              </button>
                              {assignedMembers.map((m, idx) => {
                                const sel = scribeAssignees.includes(String(m.id));
                                return (
                                  <button key={m.id} type="button"
                                    onClick={() => setScribeAssignees(prev => sel ? prev.filter((id) => id !== String(m.id)) : [...prev, String(m.id)])}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: sel ? '#F5F8FF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < assignedMembers.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#3B5BFC' : '#C4C9D9'}`, background: sel ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {sel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                                    </div>
                                    {sel && <CheckCircle size={13} color="#3B5BFC" />}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {scribeAssignMode === 'role' && (() => {
                          const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                          const uniqueRoles = [...new Set(assignedMembers.map((m) => m.role))];
                          if (uniqueRoles.length === 0) return <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>No members assigned yet</div>;
                          return (
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                              {uniqueRoles.map((role, idx) => {
                                const roleMembers = assignedMembers.filter((m) => m.role === role);
                                const roleMemberIds = roleMembers.map((m) => String(m.id));
                                const allSel = roleMemberIds.every((id) => scribeAssignees.includes(id));
                                const someSel = roleMemberIds.some((id) => scribeAssignees.includes(id));
                                return (
                                  <button key={role} type="button"
                                    onClick={() => setScribeAssignees(allSel ? scribeAssignees.filter((id) => !roleMemberIds.includes(id)) : [...new Set([...scribeAssignees, ...roleMemberIds])])}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: allSel ? '#F5F8FF' : someSel ? '#FAFBFF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < uniqueRoles.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allSel ? '#3B5BFC' : someSel ? '#93A8FF' : '#C4C9D9'}`, background: allSel ? '#3B5BFC' : someSel ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {allSel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                      {!allSel && someSel && <div style={{ width: 6, height: 2, background: '#3B5BFC', borderRadius: 1 }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</div>
                                      <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                        {roleMembers.map((m) => (
                                          <div key={m.id} title={m.name} style={{ width: 18, height: 18, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                                        ))}
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }}>{roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                    {allSel && <CheckCircle size={13} color="#3B5BFC" />}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {scribeAssignMode !== 'all' && scribeAssignees.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Selected:</span>
                            {scribeAssignees.map((id) => {
                              const m = teamMembers.find((t) => t.id === parseInt(id));
                              if (!m) return null;
                              return (
                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D4FF' }}>
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>{m.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                  /* Normal display card */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--input-bg)', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: s.type === 'sheet' ? '#ECFDF5' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.type === 'sheet'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                      {s.assignMode === 'all' || (!s.assignMode && s.assignees.length === 0) ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>All assigned members</div>
                      ) : s.assignees.length > 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {s.assignees.map((id) => teamMembers.find((m) => m.id === parseInt(id))?.name).filter(Boolean).join(', ')}
                        </div>
                      ) : null}
                    </div>
                    {/* Edit button */}
                    <button type="button" onClick={() => openScribeEdit(i)}
                      style={{ background: '#F5F3FF', border: 'none', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Edit2 size={12} color="#7C3AED" />
                    </button>
                    {/* Delete button */}
                    <button type="button" onClick={() => setScribes(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                  )}
                </div>
              ))}
              {editingScribeIdx === null && (!showScribePicker ? (
                <button type="button"
                  onClick={() => { setShowScribePicker(true); setScribeTitle(''); setScribeType('note'); setScribeAssignees([]); setScribeAssignMode('all'); setScribeSelectedRole(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-surface)', border: '1.5px dashed var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', width: '100%' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={12} color="#7C3AED" strokeWidth={2.5} />
                  </div>
                  Scribe
                </button>
              ) : (
                <div style={{ background: 'var(--input-bg)', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #C7D4FF', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Row 1: type + title + add + cancel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Type toggle */}
                  {[{ key: 'note', color: '#7C3AED', bg: '#F5F3FF', label: 'Note', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                    { key: 'sheet', color: '#12C479', bg: '#ECFDF5', label: 'Sheet', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg> }
                  ].map((opt) => (
                    <div key={opt.key} style={{ position: 'relative' }}
                      onMouseEnter={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.querySelector('.scribe-tip').style.opacity = '0'}
                    >
                      <button type="button" onClick={() => setScribeType(opt.key)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${scribeType === opt.key ? opt.color : 'var(--border)'}`, background: scribeType === opt.key ? opt.bg : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        {opt.icon}
                      </button>
                      <div className="scribe-tip" style={{ opacity: 0, transition: 'opacity 0.15s', position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#1A1D2E', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', pointerEvents: 'none', zIndex: 100 }}>
                        {opt.label}
                      </div>
                    </div>
                  ))}
                  {/* Title */}
                  <input value={scribeTitle} onChange={(e) => setScribeTitle(e.target.value)}
                    placeholder="Title" autoFocus
                    style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-surface)', minWidth: 0 }}
                    onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                  {/* Add */}
                  <button type="button" disabled={!scribeTitle.trim()}
                    onClick={() => {
                      if (!scribeTitle.trim()) return;
                      const allMemberIds = assignments.filter((a) => a.memberId).map((a) => String(a.memberId));
                      const resolvedAssignees = scribeAssignMode === 'all'
                        ? allMemberIds
                        : scribeAssignees.length > 0 ? scribeAssignees : allMemberIds;
                      setScribes(prev => [...prev, { type: scribeType, title: scribeTitle.trim(), assignees: resolvedAssignees, assignMode: scribeAssignMode }]);
                      closeScribePicker();
                    }}
                    style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: scribeTitle.trim() ? '#7C3AED' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: scribeTitle.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                  {/* Cancel */}
                  <button type="button" onClick={closeScribePicker}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={13} color="#9CA3AF" />
                  </button>
                  </div>
                  {/* Row 2: Assign to ? mode tabs + list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Mode tabs: All / Member / Role */}
                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 8, padding: 3 }}>
                      {[{ key: 'all', label: 'All' }, { key: 'role', label: 'Role' }].map((mode) => (
                        <button key={mode.key} type="button"
                          onClick={() => { setScribeAssignMode(mode.key); setScribeAssignees([]); setScribeSelectedRole(''); }}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: scribeAssignMode === mode.key ? 'var(--bg-surface)' : 'transparent',
                            color: scribeAssignMode === mode.key ? '#3B5BFC' : 'var(--text-muted)',
                            boxShadow: scribeAssignMode === mode.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s',
                          }}>
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    {/* All mode ? just a label */}
                    {scribeAssignMode === 'all' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#EEF2FF', borderRadius: 8, border: '1.5px solid #C7D4FF' }}>
                        <CheckCircle size={13} color="#3B5BFC" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>All assigned members will join this scribe</span>
                      </div>
                    )}

                    {/* Member mode ? checklist of assigned members */}
                    {scribeAssignMode === 'member' && (() => {
                      const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                      if (assignedMembers.length === 0) return (
                        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>
                          No members assigned yet
                        </div>
                      );
                      const allPicked = assignedMembers.every((m) => scribeAssignees.includes(String(m.id)));
                      return (
                        <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {/* Select All row */}
                          <button type="button"
                            onClick={() => setScribeAssignees(allPicked ? [] : assignedMembers.map((m) => String(m.id)))}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: allPicked ? '#EEF2FF' : 'var(--bg-subtle)', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allPicked ? '#3B5BFC' : '#C4C9D9'}`, background: allPicked ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {allPicked && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: allPicked ? '#3B5BFC' : 'var(--text-secondary)' }}>Select All</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''}</span>
                          </button>
                          {/* Individual member rows */}
                          {assignedMembers.map((m, idx) => {
                            const sel = scribeAssignees.includes(String(m.id));
                            return (
                              <button key={m.id} type="button"
                                onClick={() => setScribeAssignees(prev => sel ? prev.filter((id) => id !== String(m.id)) : [...prev, String(m.id)])}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: sel ? '#F5F8FF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < assignedMembers.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#3B5BFC' : '#C4C9D9'}`, background: sel ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {sel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                                </div>
                                {sel && <CheckCircle size={13} color="#3B5BFC" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Role mode ? checklist of unique roles from assigned members */}
                    {scribeAssignMode === 'role' && (() => {
                      const assignedMembers = assignments.filter((a) => a.memberId).map((a) => teamMembers.find((t) => String(t.id) === String(a.memberId))).filter(Boolean);
                      const uniqueRoles = [...new Set(assignedMembers.map((m) => m.role))];
                      if (uniqueRoles.length === 0) return (
                        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>
                          No members assigned yet
                        </div>
                      );
                      return (
                        <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {uniqueRoles.map((role, idx) => {
                            const roleMembers = assignedMembers.filter((m) => m.role === role);
                            const roleMemberIds = roleMembers.map((m) => String(m.id));
                            const allSel = roleMemberIds.every((id) => scribeAssignees.includes(id));
                            const someSel = roleMemberIds.some((id) => scribeAssignees.includes(id));
                            return (
                              <button key={role} type="button"
                                onClick={() => setScribeAssignees(allSel
                                  ? scribeAssignees.filter((id) => !roleMemberIds.includes(id))
                                  : [...new Set([...scribeAssignees, ...roleMemberIds])]
                                )}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: allSel ? '#F5F8FF' : someSel ? '#FAFBFF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < uniqueRoles.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allSel ? '#3B5BFC' : someSel ? '#93A8FF' : '#C4C9D9'}`, background: allSel ? '#3B5BFC' : someSel ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {allSel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  {!allSel && someSel && <div style={{ width: 6, height: 2, background: '#3B5BFC', borderRadius: 1 }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</div>
                                  <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                    {roleMembers.map((m) => (
                                      <div key={m.id} title={m.name} style={{ width: 18, height: 18, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                                    ))}
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }}>{roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                {allSel && <CheckCircle size={13} color="#3B5BFC" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Selection summary */}
                    {scribeAssignMode !== 'all' && scribeAssignees.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Selected:</span>
                        {scribeAssignees.map((id) => {
                          const m = teamMembers.find((t) => t.id === parseInt(id));
                          if (!m) return null;
                          return (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D4FF' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>{m.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Budget */}
          {!hideBudget && (
          <div style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Task Budget</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (?)</label>
                <input 
                  type="number"
                  value={taskBudgetAmount} 
                  onChange={(e) => setTaskBudgetAmount(e.target.value)} 
                  placeholder="0.00"
                  disabled={isCompleted}
                  style={{ 
                    width: '100%', 
                    padding: '9px 12px', 
                    border: '1.5px solid var(--border)', 
                    borderRadius: 9, 
                    fontSize: 13, 
                    color: 'var(--text-primary)', 
                    outline: 'none', 
                    background: isCompleted ? 'var(--bg-subtle)' : 'var(--bg-surface)', 
                    boxSizing: 'border-box',
                    cursor: isCompleted ? 'not-allowed' : 'text',
                    opacity: isCompleted ? 0.7 : 1
                  }}
                  onFocus={(e) => !isCompleted && (e.target.style.borderColor = '#3B5BFC')} 
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'} 
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
              Overall task budget (separate from team member budgets). Payment status managed from Payment page.
            </div>
          </div>
          )}

          {/* Amount summary */}
          {!hideBudget && <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #C7D4FF' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount Summary</div>
            
            {/* Team member budgets */}
            {assignments.filter((a) => a.memberId && a.budget).map((a, i) => {
              const m = teamMembers.find((t) => String(t.id) === String(a.memberId));
              return m ? (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>{m.name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({m.role})</span></span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{parseFloat(a.budget || 0).toLocaleString()}</span>
                </div>
              ) : null;
            })}
            
            {/* Team Amount subtotal */}
            {memberBudgets > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E0E7FF' }}>
                <span style={{ fontWeight: 600 }}>Team Amount</span>
                <span style={{ fontWeight: 700 }}>₹{memberBudgets.toLocaleString()}</span>
              </div>
            )}
            
            {/* Additional Amount subtotal (without individual entries) */}
            {additionalPaymentsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E0E7FF' }}>
                <span style={{ fontWeight: 600 }}>Additional Amount</span>
                <span style={{ fontWeight: 700 }}>₹{additionalPaymentsTotal.toLocaleString()}</span>
              </div>
            )}
            
            {/* Task Budget (display only, not added to total) */}
            {taskBudgetAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7C3AED', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E0E7FF', background: '#F5F3FF', padding: '8px 12px', borderRadius: 8, marginLeft: -12, marginRight: -12 }}>
                <span style={{ fontWeight: 600 }}>Task Budget</span>
                <span style={{ fontWeight: 700 }}>₹{parseFloat(taskBudgetAmount).toLocaleString()}</span>
              </div>
            )}
            
            {/* Total Amount */}
            <div style={{ borderTop: '1px solid #C7D4FF', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#3B5BFC' }}>₹{totalBudget.toLocaleString()}</span>
            </div>
          </div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {isCompleted ? 'Close' : 'Cancel'}
          </button>
          {!isCompleted && (
            <button onClick={handleSubmitClick} disabled={!title.trim() || !deadline} style={{
              padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: title.trim() && deadline ? 'pointer' : 'default',
              background: title.trim() && deadline ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)',
              color: title.trim() && deadline ? '#fff' : 'var(--text-muted)',
              boxShadow: title.trim() && deadline ? '0 6px 20px #3B5BFC40' : 'none',
            }}>Update Task</button>
          )}
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        label={managementMode ? 'Management Password' : 'Admin Password'} />
      )}
    </div>
  );
}

// -- Admin Task Detail Modal (same as Dashboard) -----------------------------
export function AdminTaskModal({ task: initialTask, onClose, onEdit, onTimelineClick, hideBudget = false, onCreateScheduled = null, onCancelScheduled = null, managementMode = false, onNavigateToTask = null, currentUser: propCurrentUser = null }) {
  const { tasks, STAGE_COLORS, STAGE_BG, STAGES, updateTaskStage, deleteTask, markTaskPaid, updateTask, pauseTask, resumeTask, fmt, adminPassword, TAGS, CATEGORIES, getPaymentsForTask, currentUser: contextCurrentUser } = useApp();
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  
  // Use prop currentUser if provided (for management mode), otherwise use context currentUser
  const currentUser = propCurrentUser || contextCurrentUser;

  // ? CRITICAL: Always use the task from context (tasks array) to get enriched member data with real-time updates
  // Use useMemo to ensure this updates when tasks array changes OR when initialTask changes
  const t = useMemo(() => {
    const foundTask = tasks.find((task) => task.id === initialTask.id);
    
    // Deep comparison of member stages
    const initialStages = initialTask.members?.map((m) => `${m.id}:${m.stage}`).sort().join(',') || '';
    const foundStages = foundTask?.members?.map((m) => `${m.id}:${m.stage}`).sort().join(',') || '';

    // Always prefer foundTask if it exists, as it has the latest data from Firestore
    return foundTask || initialTask;
  }, [tasks, initialTask]);
  
  // ? Check if current management user is on hold for this task
  // In management mode, currentUser is the displayMember (team member object), so use currentUser.id
  // Also detect management mode by checking user role if prop is not set correctly
  const isManagementUser = managementMode || currentUser?.role?.toLowerCase().includes('management') || currentUser?.role?.toLowerCase().includes('manager') || currentUser?.userRole === 'management';

  // Try multiple comparison strategies to handle type mismatches
  const currentUserMember = isManagementUser && currentUser?.id 
    ? t.members?.find((m) => 
        m.id === currentUser.id || 
        String(m.id) === String(currentUser.id) ||
        Number(m.id) === Number(currentUser.id) ||
        parseInt(m.id) === parseInt(currentUser.id)
      )
    : null;
  const isCurrentUserOnHold = currentUserMember?.isOnHold || false;

  // Log task member data for debugging
  useEffect(() => {

  }, [t, tasks, initialTask.id]);

  const [stageSelect, setStageSelect]     = useState('');
  const [updateNote, setUpdateNote]       = useState('');
  const [memberUpdateNote, setMemberUpdateNote] = useState({});
  const [memberStage, setMemberStage]     = useState({});
  const [updating, setUpdating]           = useState(false);
  const [updatingMember, setUpdatingMember] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [confirmPause, setConfirmPause]   = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  
  // ? CRITICAL: Reset memberStage state when task data changes
  // This ensures dropdowns show the correct current stage after updates
  useEffect(() => {

    setMemberStage({});
    setMemberUpdateNote({});
  }, [t.id, t.members?.map((m) => `${m.id}:${m.stage}`).join('-')]);
  const [adminPwd, setAdminPwd]           = useState('');
  const [pwdError, setPwdError]           = useState(false);
  const [showCreateDate, setShowCreateDate] = useState(false);
  const [createDate, setCreateDate]         = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const ADMIN_PASSWORD = adminPassword;

  function handleAdminUnlock() {
    if (adminPwd === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setAdminPwd('');
      setPwdError(false);
    } else {
      setPwdError(true);
      setAdminPwd('');
    }
  }
  const [extendDateVal, setExtendDateVal]   = useState(t.extendedDeadline || '');

  const today      = new Date();
  const displayDeadline = t.extendedDeadline || t.deadline;
  const overdueFlag = new Date(displayDeadline) < today && t.stage !== 'Complete';
  const isComplete  = t.stage === 'Complete';
  const days        = Math.ceil((new Date(displayDeadline) - today) / (1000 * 60 * 60 * 24));
  
  // Log management user hold check after isComplete is defined

  function handleStageUpdate() {
    if (!stageSelect || t.paused || t.isPaused || isCurrentUserOnHold) return;
    // ? No admin password required for stage updates
    setUpdating(true);
    setTimeout(() => { 
      // ? If moving all to Update stage with a note, apply to all members
      if (stageSelect === 'Update' && updateNote) {
        // Apply the same update note to all members being moved to Update
        updateTaskStage(t.id, stageSelect, null, null, null, updateNote);
      } else {
        updateTaskStage(t.id, stageSelect);
      }
      setUpdating(false); 
      setStageSelect(''); 
      setUpdateNote('');
    }, 700);
  }

  function handleMemberStageUpdate(memberId) {
    const key = `${t.id}-${memberId}`;
    const newStage = memberStage[key];
    if (!newStage) return;
    
    // Check if member is on hold OR task is paused OR management user is on hold
    const member = t.members.find((m) => m.id === memberId);
    if (member?.isOnHold || t.paused || t.isPaused || isCurrentUserOnHold) return;
    
    // ? No admin password required for member stage updates
    setUpdatingMember(key);
    setTimeout(() => {
      // Pass update note to updateTaskStage for member-specific storage
      const updateNoteForMember = newStage === 'Update' ? memberUpdateNote[key] : null;
      updateTaskStage(t.id, newStage, memberId, null, null, updateNoteForMember);
      setUpdatingMember(null);
      // Clear the selection so dropdown shows current stage after update
      setMemberStage(prev => { const n = { ...prev }; delete n[key]; return n; });
      setMemberUpdateNote(prev => { const n = { ...prev }; delete n[key]; return n; });
    }, 600);
  }

  function handleDelete() {
    setDeleting(true);
    setTimeout(() => { deleteTask(t.id, { name: 'Admin', role: 'Administrator', avatar: 'A', color: '#3B5BFC' }); onClose(); }, 500);
  }

  function handleHoldTaskClick() {

    requestAdminPassword('hold this task', () => {

      pauseTask(t.id);
      setConfirmPause(false);
    });
  }

  function handleRemoveTaskClick() {
    requestAdminPassword('remove this task', () => {
      handleDelete();
    });
  }

  function handleActivateTaskClick() {
    requestAdminPassword('activate this task', () => {
      resumeTask(t.id);
    });
  }

  function handleMemberHoldToggle(memberId, currentHoldStatus) {
    const actionText = currentHoldStatus ? 'activate this member' : 'hold this member';
    requestAdminPassword(actionText, () => {
      const updatedMembers = t.members.map((member) => 
        member.id === memberId ? { ...member, isOnHold: !member.isOnHold } : member
      );
      updateTask(t.id, { members: updatedMembers });
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isComplete ? '#ECFDF5' : overdueFlag ? '#FEF2F2' : STAGE_BG[t.stage], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isComplete ? <CheckCircle size={17} color="#12C479" strokeWidth={2.5} /> : overdueFlag ? <AlertCircle size={17} color="#EF4444" strokeWidth={2.5} /> : <Clock size={17} color={STAGE_COLORS[t.stage]} strokeWidth={2.5} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span 
                onClick={(e) => { e.stopPropagation(); if (onTimelineClick) onTimelineClick(t); }}
                style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: isComplete ? '#12C479' : '#3B5BFC', padding: '2px 8px', borderRadius: 5, cursor: onTimelineClick ? 'pointer' : 'default' }}
              >
                #{t.id}
              </span>
              <span 
                className="task-title-hover"
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', position: 'relative' }}
              >
                {t.title}
                {t.description && (
                  <div className="task-desc-tooltip" style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 8,
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                    minWidth: 300,
                    maxWidth: 400,
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Task Overview</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.description}</div>
                  </div>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: STAGE_BG[t.stage], color: STAGE_COLORS[t.stage] }}>{t.stage}</span>
              <span style={{ fontSize: 11, color: overdueFlag ? '#EF4444' : days <= 2 ? '#F97316' : 'var(--text-secondary)', fontWeight: 600 }}>
                {isComplete ? '' : overdueFlag ? `? ${Math.abs(days)}d overdue` : days === 0 ? '?? Due today' : days === 1 ? 'Tomorrow' : `${t.extendedDeadline ? 'Extended: ' : 'Due '}${new Date(displayDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </span>
              {t.isScheduled && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#3B5BFC', background: '#EEF2FF', padding: '3px 10px', borderRadius: 20, border: '1.5px solid #3B5BFC' }}>
                  [Cal] Scheduled
                </span>
              )}
              {t.category && (() => {
                // Find full category data from CATEGORIES to get image
                const fullCategory = CATEGORIES.find((c) => (c.id || c.label) === t.category.id || (c.name || c.label) === t.category.label);
                const categoryImage = fullCategory?.icon || fullCategory?.image || t.category.image;
                const isImageUrl = categoryImage && (categoryImage.startsWith('data:') || categoryImage.startsWith('http'));
                
                return (
                  <span style={{ 
                    fontSize: 10, 
                    padding: '4px 10px', 
                    borderRadius: 50, 
                    background: t.category.bg || '#F3F4F6', 
                    color: '#1A1D2E', 
                    fontWeight: 700, 
                    border: `1px solid ${t.category.color || '#E5E7EB'}30`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {isImageUrl && (
                      <img src={categoryImage} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                    )}
                    {t.category.label}
                  </span>
                );
              })()}
              {t.tags.map((tag) => {
                // Find full tag data from TAGS to get image
                const fullTag = TAGS.find((t) => (t.id || t.label) === tag.id || (t.name || t.label) === tag.label);
                const tagImage = fullTag?.image || tag.image;
                const isImageUrl = tagImage && (tagImage.startsWith('data:') || tagImage.startsWith('http'));
                
                return (
                  <span key={tag.label} style={{ 
                    fontSize: 10, 
                    padding: '4px 10px', 
                    borderRadius: 50, 
                    background: tag.bg || '#F3F4F6', 
                    color: '#1A1D2E', 
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    {isImageUrl && (
                      <img src={tagImage} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                    )}
                    {tag.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {t.isScheduled ? (
              showCreateDate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="date" value={createDate} min={todayStr}
                    onChange={(e) => setCreateDate(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #C7D4FF', fontSize: 12, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', colorScheme: 'normal' }}
                    onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = '#C7D4FF'} />
                  <button
                    disabled={!createDate}
                    onClick={() => { onCreateScheduled && onCreateScheduled({ ...t, deadline: createDate, scheduledDate: null, isScheduled: false }); onClose(); }}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: createDate ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)', color: createDate ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: createDate ? 'pointer' : 'default' }}>
                    Confirm
                  </button>
                  <button onClick={() => { setShowCreateDate(false); setCreateDate(''); }}
                    style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setShowCreateDate(true)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Create
                  </button>
                  <button onClick={() => { onCancelScheduled && onCancelScheduled(t.id); onClose(); }}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </>
              )
            ) : (
              onEdit && !isCurrentUserOnHold && (
                <button onClick={() => onEdit(t)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#EEF2FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#C7D4FF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#EEF2FF'}>
                  <Edit2 size={14} color="#3B5BFC" />
                </button>
              )
            )}
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, color: 'var(--text-secondary)' }}><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {!hideBudget && (() => {
              // Calculate team budget (sum of member budgets)
              const teamBudget = t.members?.reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0) || 0;
              
              // Calculate additional payments (investment/additional type payments for this task)
              const taskPayments = getPaymentsForTask ? getPaymentsForTask(t.id) : [];
              const additionalAmount = taskPayments
                .filter((p) => p.paymentType === 'investment' || p.paymentType === 'additional')
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
              
              // Check if ALL payments for this task are paid
              const allPaid = taskPayments.length > 0 && taskPayments.every((p) => p.isPaid === true || p.status === 'Paid');
              
              return (
                <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Amount</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#12C479' }}>₹{teamBudget.toLocaleString()}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: allPaid ? '#12C479' : '#F97316' }}>
                      {allPaid ? 'âœ“ Paid' : 'Pending'}
                    </div>
                  </div>
                  {additionalAmount > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
                      + ₹{additionalAmount.toLocaleString()} additional
                    </div>
                  )}
                </div>
              );
            })()}
            {!hideBudget && (() => {
              // Get task budget payment
              const taskPayments = getPaymentsForTask ? getPaymentsForTask(t.id) : [];
              const taskBudgetPayment = taskPayments.find((p) => p.paymentType === 'task-budget');
              
              if (!taskBudgetPayment) {
                // Show hyphen if no task budget
                return (
                  <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Task Budget</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-muted)' }}>â€”</div>
                  </div>
                );
              }
              
              const totalBudget = taskBudgetPayment.amount || 0;
              const paidAmount = taskBudgetPayment.paidAmount || 0;
              const isPaid = taskBudgetPayment.isPaid || taskBudgetPayment.status === 'Paid';
              const pendingAmount = totalBudget - paidAmount;
              const profitAmount = taskBudgetPayment.profitAmount || 0;
              
              return (
                <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Task Budget</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isPaid ? '#12C479' : '#F97316' }}>₹{totalBudget.toLocaleString()}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isPaid ? '#12C479' : '#F97316' }}>
                      {isPaid ? 'âœ“ Paid' : 'Pending'}
                    </div>
                  </div>
                  {!isPaid && paidAmount > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#F97316', marginTop: 2 }}>
                      Pending: ₹{pendingAmount.toLocaleString()}
                    </div>
                  )}
                  {profitAmount > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#12C479', marginTop: 2 }}>
                      +₹{profitAmount.toLocaleString()} profit
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Members</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{t.members?.length || 0} assigned</div>
            </div>
          </div>

          {/* Stage progress */}
          <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Stage Progress</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {STAGES.map((s, i) => {
                const curIdx = STAGES.indexOf(t.stage);
                const sIdx   = STAGES.indexOf(s);
                const isPast = sIdx < curIdx;
                const isCur  = s === t.stage;
                const isComplete = s === 'Complete' && isCur; // Check if current stage is Complete
                const isActive = isPast || isCur;
                
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: isActive ? (isPast || isComplete ? '#12C479' : '#3B5BFC') : 'var(--bg-surface)',
                      border: `2px solid ${isActive ? (isPast || isComplete ? '#12C479' : '#3B5BFC') : 'var(--border)'}`,
                      fontSize: 11, 
                      fontWeight: 800, 
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.3s ease'
                    }}>
                      {isPast || isComplete ? 'âœ“' : i + 1}
                    </div>
                    <span style={{ 
                      fontSize: 9, 
                      fontWeight: isCur ? 800 : 500, 
                      color: isCur ? (isComplete ? '#12C479' : '#3B5BFC') : isPast ? '#12C479' : 'var(--text-muted)', 
                      marginTop: 6, 
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Issue Note - Read Only - Show member's issue note if their stage is Issue */}
          {(() => {
            const memberWithIssue = t.members?.find((m) => m.stage === 'Issue' && m.issueNote);
            if (!memberWithIssue) return null;
            
            return (
              <div style={{ padding: '14px 16px', background: '#FEF2F2', borderRadius: 12, border: '1.5px solid #FED7D7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertCircle size={16} color="#EF4444" strokeWidth={2.5} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Reported Issue by {memberWithIssue.name}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #FED7D7' }}>
                  {memberWithIssue.issueNote}
                </div>
              </div>
            );
          })()}

          {/* Team â€” per-member stage controls */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Team</div>
            
            {/* Other team members - Show FIRST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(t.members && t.members.length > 0) ? t.members
                .filter((m) => {
                  // Filter out the current management user if they have a self-update card
                  if (isManagementUser && currentUserMember && String(m.id) === String(currentUserMember.id)) {
                    return false;
                  }
                  return true;
                })
                .map((m) => {
                const key = `${t.id}-${m.id}`;
                const isUpdatingThis = updatingMember === key;
                return (
                  <div key={m.id} style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.avatarImg ? 'transparent' : m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                        {m.avatarImg ? (
                          <img src={m.avatarImg} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          m.avatar
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div 
                          className="member-role-hover"
                          style={{ fontSize: 11, color: 'var(--text-muted)', position: 'relative' }}
                        >
                          {m.role}
                          {m.memberDesc && (
                            <div className="member-desc-tooltip" style={{ 
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              marginTop: 8,
                              padding: '10px 12px',
                              background: 'var(--bg-surface)',
                              borderRadius: 10,
                              border: '1.5px solid var(--border)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              zIndex: 1000,
                              minWidth: 250,
                              maxWidth: 350,
                              opacity: 0,
                              pointerEvents: 'none',
                              transition: 'opacity 0.2s',
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Instructions</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.memberDesc}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {!hideBudget && <div style={{ fontSize: 13, fontWeight: 800, color: '#12C479' }}>₹{m.budget?.toLocaleString()}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <UserCheck size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <select 
                          value={memberStage[key] !== undefined ? memberStage[key] : (m.stage || 'New')} 
                          onChange={(e) => setMemberStage(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={m.isOnHold || isComplete || t.paused || t.isPaused || isCurrentUserOnHold || m.stage === 'Complete'}
                          style={{ flex: 1, height: 32, borderRadius: 8, border: `1.5px solid ${(m.isOnHold || t.paused || t.isPaused || isCurrentUserOnHold) ? '#F97316' : (isComplete || m.stage === 'Complete') ? '#12C479' : (memberStage[key] && memberStage[key] !== m.stage) ? '#3B5BFC' : 'var(--border)'}`, padding: '0 10px', fontSize: 11, fontWeight: 600, color: (m.isOnHold || t.paused || t.isPaused || isCurrentUserOnHold) ? '#F97316' : (isComplete || m.stage === 'Complete') ? '#12C479' : 'var(--text-primary)', background: (m.isOnHold || t.paused || t.isPaused || isCurrentUserOnHold) ? '#FFF7ED' : (isComplete || m.stage === 'Complete') ? '#ECFDF5' : 'var(--bg-surface)', cursor: (m.isOnHold || isComplete || t.paused || t.isPaused || isCurrentUserOnHold || m.stage === 'Complete') ? 'not-allowed' : 'pointer', outline: 'none' }}>
                          {STAGES.map((s) => {
                            // Clean the stage value to ensure no duplicates
                            const cleanCurrentStage = (m.stage || 'New').trim();
                            const isCurrent = s === cleanCurrentStage;
                            return <option key={s} value={s}>{s}{isCurrent ? ' (Current)' : ''}</option>;
                          })}
                        </select>
                        {!m.isOnHold && !isComplete && !t.paused && !t.isPaused && !isCurrentUserOnHold && m.stage !== 'Complete' && (
                          <button disabled={!memberStage[key] || memberStage[key] === m.stage || isUpdatingThis} onClick={() => handleMemberStageUpdate(m.id)}
                            style={{ height: 32, padding: '0 14px', borderRadius: 8, border: 'none', background: (memberStage[key] && memberStage[key] !== m.stage) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)', color: (memberStage[key] && memberStage[key] !== m.stage) ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: (memberStage[key] && memberStage[key] !== m.stage) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'all 0.15s' }}>
                            {isUpdatingThis ? <><RefreshCw size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving</> : 'Apply'}
                          </button>
                        )}
                        {!isComplete && !t.paused && !t.isPaused && !isCurrentUserOnHold && m.stage !== 'Complete' && (
                          <button 
                            onClick={() => handleMemberHoldToggle(m.id, m.isOnHold)}
                            style={{ 
                              height: 32, 
                              padding: '0 12px', 
                              borderRadius: 8, 
                              border: 'none', 
                            background: m.isOnHold ? '#12C479' : '#F97316', 
                            color: '#fff', 
                            fontSize: 11, 
                            fontWeight: 700, 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 5, 
                            flexShrink: 0, 
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap'
                          }}
                          title={m.isOnHold ? 'Activate member' : 'Put member on hold'}
                        >
                          {m.isOnHold ? 'Activate' : 'Hold'}
                        </button>
                        )}
                      </div>
                      
                      {/* Update Note Field - Show when Update stage is selected for this member */}
                      {memberStage[key] === 'Update' && !t.paused && !t.isPaused && !isCurrentUserOnHold && (
                        <textarea
                          value={memberUpdateNote[key] || ''}
                          onChange={(e) => setMemberUpdateNote(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="Describe what this member needs to update..."
                          rows={2}
                          style={{ 
                            width: '100%', 
                            padding: '6px 8px', 
                            borderRadius: 6, 
                            border: '1.5px solid #D97706', 
                            background: '#FFFBEB', 
                            fontSize: 11, 
                            color: 'var(--text-primary)', 
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      )}
                      
                      {/* Show existing update note if member is in Update stage - member-specific */}
                      {m.stage === 'Update' && m.updateNote && (
                        <div style={{ padding: '8px 10px', background: '#FFFBEB', borderRadius: 6, border: '1.5px solid #FDE68A' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginBottom: 3 }}>Update Instructions:</div>
                          <div style={{ fontSize: 11, color: '#92400E', lineHeight: 1.4 }}>{m.updateNote}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px dashed var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>No members assigned</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Edit this task to assign team members</div>
                </div>
              )}
            </div>
            
            {/* ? Management User Self-Update Card - Show AFTER other team members */}
            {isManagementUser && currentUserMember && !isComplete && (
              <div style={{ background: '#EEF2FF', border: '1.5px solid #C7D4FF', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: currentUserMember.avatarImg ? 'transparent' : currentUserMember.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {currentUserMember.avatarImg ? (
                      <img src={currentUserMember.avatarImg} alt={currentUserMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      currentUserMember.avatar
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUserMember.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentUserMember.role}</div>
                  </div>
                </div>
                
                {!isCurrentUserOnHold ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                    <select 
                      value={memberStage[`${t.id}-${currentUserMember.id}`] || currentUserMember.stage || 'New'} 
                      onChange={(e) => setMemberStage((prev) => ({ ...prev, [`${t.id}-${currentUserMember.id}`]: e.target.value }))}
                      style={{ flex: 1, height: 38, borderRadius: 9, border: '1.5px solid #3B5BFC', padding: '0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                      {['New', 'Start', 'Issue', 'Review A', 'Review B', 'Update'].map((s) => {
                        const isCurrent = s === (currentUserMember.stage || 'New');
                        return <option key={s} value={s}>{s}{isCurrent ? ' (Current)' : ''}</option>;
                      })}
                    </select>
                    <button 
                      disabled={!memberStage[`${t.id}-${currentUserMember.id}`] || memberStage[`${t.id}-${currentUserMember.id}`] === currentUserMember.stage || updatingMember === `${t.id}-${currentUserMember.id}`}
                      onClick={() => handleMemberStageUpdate(currentUserMember.id)}
                      style={{ 
                        height: 38, 
                        padding: '0 20px', 
                        borderRadius: 9, 
                        border: 'none', 
                        background: (memberStage[`${t.id}-${currentUserMember.id}`] && memberStage[`${t.id}-${currentUserMember.id}`] !== currentUserMember.stage) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)', 
                        color: (memberStage[`${t.id}-${currentUserMember.id}`] && memberStage[`${t.id}-${currentUserMember.id}`] !== currentUserMember.stage) ? '#fff' : 'var(--text-muted)', 
                        fontSize: 12, 
                        fontWeight: 700, 
                        cursor: (memberStage[`${t.id}-${currentUserMember.id}`] && memberStage[`${t.id}-${currentUserMember.id}`] !== currentUserMember.stage) ? 'pointer' : 'default', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 6,
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}>
                      {updatingMember === `${t.id}-${currentUserMember.id}` ? <><RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving</> : 'Update Stage'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#FFF7ED', borderRadius: 9, border: '1.5px solid #F97316' }}>
                    <Clock size={16} color="#F97316" />
                    <div style={{ fontSize: 12, color: '#C2410C' }}>You are on hold. Cannot update stage.</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Task Management Controls */}
          <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border-light)' }}>
            
            {!isComplete && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 1 }}>Move all members to stage</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overrides all individual member stages</div>
                  </div>
                  <select value={stageSelect} onChange={(e) => setStageSelect(e.target.value)}
                    disabled={t.paused || t.isPaused || isCurrentUserOnHold}
                    style={{ height: 36, borderRadius: 9, border: `1.5px solid ${(t.paused || t.isPaused || isCurrentUserOnHold) ? '#F97316' : stageSelect ? '#3B5BFC' : 'var(--border)'}`, padding: '0 10px', fontSize: 12, fontWeight: 600, color: (t.paused || t.isPaused || isCurrentUserOnHold) ? '#F97316' : 'var(--text-primary)', background: (t.paused || t.isPaused || isCurrentUserOnHold) ? '#FFF7ED' : 'var(--bg-surface)', cursor: (t.paused || t.isPaused || isCurrentUserOnHold) ? 'not-allowed' : 'pointer', outline: 'none', minWidth: 140 }}>
                    <option value="">Select stage</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button disabled={!stageSelect || updating || t.paused || t.isPaused || isCurrentUserOnHold} onClick={handleStageUpdate}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: (stageSelect && !t.paused && !t.isPaused && !isCurrentUserOnHold) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)', color: (stageSelect && !t.paused && !t.isPaused && !isCurrentUserOnHold) ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: (stageSelect && !t.paused && !t.isPaused && !isCurrentUserOnHold) ? 'pointer' : 'default', boxShadow: (stageSelect && !t.paused && !t.isPaused && !isCurrentUserOnHold) ? '0 4px 12px rgba(59,91,252,0.3)' : 'none', transition: 'all 0.15s', flexShrink: 0 }}>
                    {updating ? <><RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving</> : 'Apply All'}
                  </button>
                </div>
                
                {/* Update Note Field - Show when Update stage is selected for bulk update */}
                {stageSelect === 'Update' && !t.paused && !t.isPaused && !isCurrentUserOnHold && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Update Instructions (for all members)</label>
                    <textarea
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      placeholder="Describe what needs to be updated..."
                      rows={3}
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: 8, 
                        border: '1.5px solid #D97706', 
                        background: '#FFFBEB', 
                        fontSize: 12, 
                        color: 'var(--text-primary)', 
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Extend Date */}
            {!isComplete && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Extend Date</div>
                    {t.extendedDeadline && (
                      <div style={{ fontSize: 11, color: '#F97316', fontWeight: 600 }}>Extended to {new Date(t.extendedDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="date" 
                    value={extendDateVal} 
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setExtendDateVal(newDate);
                      if (newDate) {
                        requestAdminPassword('extend task deadline', () => { 
                          updateTask(t.id, { ...t, extendedDeadline: newDate }); 
                        });
                      }
                    }}
                    disabled={t.paused || t.isPaused || isCurrentUserOnHold}
                    min={t.extendedDeadline || t.deadline}
                    style={{ flex: 1, height: 36, borderRadius: 9, border: `1.5px solid ${(t.paused || t.isPaused || isCurrentUserOnHold) ? '#F97316' : t.extendedDeadline ? '#F97316' : 'var(--border)'}`, padding: '0 10px', fontSize: 12, fontWeight: 600, color: (t.paused || t.isPaused || isCurrentUserOnHold) ? '#F97316' : 'var(--text-primary)', background: (t.paused || t.isPaused || isCurrentUserOnHold) ? '#FFF7ED' : 'var(--bg-surface)', cursor: (t.paused || t.isPaused || isCurrentUserOnHold) ? 'not-allowed' : 'auto', outline: 'none' }} 
                  />
                </div>
              </div>
            )}

          {/* Scribes */}
          {t.scribes && t.scribes.length > 0 && (
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', border: '1.5px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Scribes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.scribes.map((s, i) => {
                  // Determine if current user has access to this scribe
                  const isAdmin = !managementMode;
                  const currentMemberId = null; // admin view ? show all
                  const hasAccess = isAdmin || s.assignMode === 'all' || (s.assignees || []).includes(String(currentMemberId));
                  if (!hasAccess) return null;
                  return (
                    <button key={i} type="button"
                      onClick={() => { onClose(); if (onNavigateToTask) onNavigateToTask(t.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 10, border: '1.5px solid var(--border)', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7C3AED'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: s.type === 'sheet' ? '#ECFDF5' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {s.type === 'sheet'
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {s.assignMode === 'all' ? 'All assigned members' : `${(s.assignees || []).length} member${(s.assignees || []).length !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

            {isComplete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #BBF7D0', marginBottom: 10 }}>
                <CheckCircle size={16} color="#12C479" strokeWidth={2.5} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#12C479' }}>Task completed</div>
                </div>
              </div>
            )}

            {/* Hold / Activate */}
            {!managementMode && !isComplete && !t.paused && !confirmPause && !isCurrentUserOnHold && (
              <button onClick={() => setConfirmPause(true)}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #FDE68A', background: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 }}>
                <Hourglass size={13} /> Hold Task
              </button>
            )}
            {!managementMode && !isComplete && !t.paused && confirmPause && !isCurrentUserOnHold && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FFFBEB', borderRadius: 10, border: '1.5px solid #FDE68A', marginBottom: 8 }}>
                <AlertCircle size={14} color="#D97706" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706', flex: 1 }}>Place "{t.title}" on hold? Progress will be held.</span>
                <button onClick={handleHoldTaskClick}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Hold
                </button>
                <button onClick={() => setConfirmPause(false)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
            {!managementMode && t.paused && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FFFBEB', borderRadius: 10, border: '1.5px solid #FDE68A', marginBottom: 8 }}>
                <Hourglass size={15} color="#D97706" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>Task Hold</div>
                </div>
                <button onClick={handleActivateTaskClick}
                  style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59,91,252,0.3)', flexShrink: 0 }}>
                  <CheckCircle size={13} strokeWidth={2.5} /> Activate Task
                </button>
              </div>
            )}

            {t.stage === 'New' && (
              !confirmDelete ? (
                <button onClick={handleRemoveTaskClick}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Trash2 size={13} /> Remove Task
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, border: '1.5px solid #FCA5A5' }}>
                  <AlertCircle size={14} color="#EF4444" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', flex: 1 }}>Remove "{t.title}"? This cannot be undone.</span>
                  <button onClick={handleRemoveTaskClick} disabled={deleting}
                    style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {deleting ? <><RefreshCw size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> Removing</> : 'Remove'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        label={managementMode ? 'Management Password' : 'Admin Password'} />
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .task-title-hover:hover .task-desc-tooltip {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .member-role-hover:hover .member-desc-tooltip {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}

// -- Helper function to create scribes for a task ---------------------------
function createScribesForTask(task, teamMembers, currentUser, addNote) {
  const currentUid = currentUser?.uid;

  if (!task.scribes || task.scribes.length === 0 || !currentUid) {

    return;
  }
  
  if (!addNote) {

    return;
  }

  task.scribes.forEach((scribe, index) => {

    // Generate unique scribe ID
    const scribeId = `scribe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine accessList based on assignMode
    let accessList = [currentUid]; // Creator always has access
    let memberIds = []; // Array of member IDs for display
    
    if (scribe.assignMode === 'all') {
      // All task members get access

      const memberUids = task.members
        .map((m) => {
          // Try to get UID from task member first
          if (m.uid) {

            return m.uid;
          }
          
          // Fallback: look up UID from teamMembers using multiple ID fields
          const memberId = m.memberId || m.id;
          
          // Try multiple matching strategies
          const teamMember = teamMembers.find((t) => 
            String(t.id) === String(memberId) ||
            String(t.id) === String(m.id) ||
            (m.memberId && String(t.id) === String(m.memberId))
          );
          
          if (teamMember?.uid) {

            return teamMember.uid;
          } else {

            return null;
          }
        })
        .filter(Boolean);
      
      accessList = [...new Set([...accessList, ...memberUids])];
      
      // Get member IDs for display
      memberIds = task.members
        .map((m) => m.memberId || m.id)
        .filter(Boolean);

    } else if (scribe.assignMode === 'member' && scribe.assignees && scribe.assignees.length > 0) {
      // Only selected members get access

      const selectedMemberData = scribe.assignees
        .map((assigneeId) => {
          // First try to find in task.members (which has UIDs)
          const taskMember = task.members.find((m) => 
            String(m.memberId || m.id) === String(assigneeId) ||
            String(m.id) === String(assigneeId)
          );
          
          if (taskMember?.uid) {

            return { uid: taskMember.uid, memberId: taskMember.memberId || taskMember.id };
          }
          
          // Fallback to teamMembers with multiple matching strategies
          const teamMember = teamMembers.find((t) => 
            String(t.id) === String(assigneeId) ||
            String(t.id) === String(taskMember?.id) ||
            String(t.id) === String(taskMember?.memberId)
          );
          
          if (teamMember?.uid) {

            return { uid: teamMember.uid, memberId: teamMember.id };
          } else {

            return null;
          }
        })
        .filter(Boolean);
      
      accessList = [...new Set([...accessList, ...selectedMemberData.map(m => m.uid)])];
      memberIds = selectedMemberData.map(m => m.memberId);

    } else if (scribe.assignMode === 'role' && scribe.assignees && scribe.assignees.length > 0) {
      // Members with selected roles get access

      const roleBasedMembers = task.members
        .filter((m) => {
          const matches = scribe.assignees.includes(m.role);

          return matches;
        });

      const roleBasedUids = roleBasedMembers
        .map((m) => {
          // Try to get UID from task member first
          if (m.uid) {

            return m.uid;
          }
          
          // Fallback: look up UID from teamMembers using multiple ID fields
          const memberId = m.memberId || m.id;
          const teamMember = teamMembers.find((t) => 
            String(t.id) === String(memberId) ||
            String(t.id) === String(m.id) ||
            (m.memberId && String(t.id) === String(m.memberId))
          );
          
          if (teamMember?.uid) {

            return teamMember.uid;
          } else {

            return null;
          }
        })
        .filter(Boolean);
      
      memberIds = roleBasedMembers
        .map((m) => m.memberId || m.id)
        .filter(Boolean);
      
      accessList = [...new Set([...accessList, ...roleBasedUids])];

    }
    
    // Create scribe document
    const scribeDocument = {
      id: scribeId,
      title: scribe.title || 'Untitled',
      type: scribe.type, // 'note' or 'sheet'
      content: scribe.type === 'note' ? '' : null,
      sheetData: scribe.type === 'sheet' ? {} : null,
      taskId: task.id, // Link to task
      taskTitle: task.title, // Store task title for reference
      accessList: accessList,
      members: memberIds, // Array of member IDs for display
      createdBy: {
        uid: currentUser.uid,
        name: currentUser.name || 'User',
        role: currentUser.role || 'User',
        avatar: currentUser.avatar || currentUser.name?.[0]?.toUpperCase() || 'U',
        color: currentUser.color || '#3B5BFC',
        avatarImg: currentUser.avatarImg || null,
        memberId: currentUser.memberId || null
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [], // Initialize empty tags array
      tagColors: {}, // Initialize empty tag colors object
      category: '', // Initialize empty category
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // Initialize date
      joinCode: Math.random().toString(36).slice(2, 8).toUpperCase() // Generate join code
    };

    try {
      // Save scribe using addNote from AppContext

      addNote(scribeDocument);

    } catch (error) {

    }
  });

}

// -- Main Tasks Page ---------------------------------------------------------
export default function TasksPage({ hideBudget = false, hideTimeline = false, currentUser: propCurrentUser = null, managementMode = false, openCreateOnMount = false, onCreateMounted = null, onNavigateToNotes = null, onNavigateToManage = null }) {
  const { tasks, team, createTask, taskRequests, approveTaskRequest, completeTaskRequest, updateTask, updateTaskNote, scheduledTasks, addScheduledTask, removeScheduledTask, currentUser: contextCurrentUser, TAGS, CATEGORIES, payments, getPaymentsForTask, addNote, currentUid } = useApp();
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const currentUser = propCurrentUser || contextCurrentUser;

  const isAdmin = currentUser?.userRole === 'admin' || currentUser?.role === 'Administrator';
  const isManagement = currentUser?.userRole === 'management' || currentUser?.role?.includes('Management') || currentUser?.role?.includes('Manager');
  const canViewScheduled = isAdmin || isManagement;
  const [stageFilter, setStageFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [timelineTask, setTimelineTask] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNote, setEditingNote] = useState(null); // { taskId, value }
  const [noteTooltip, setNoteTooltip] = useState(null); // { note, x, y }
  const [chatTask, setChatTask] = useState(null);

  // ? CRITICAL: Update viewTask when tasks array changes (real-time updates)
  // This ensures the modal shows the latest member stages when team members update from Team Dashboard
  useEffect(() => {
    if (viewTask) {
      const updatedTask = tasks.find((t) => t.id === viewTask.id);
      if (updatedTask) {
        // Check if the task data has actually changed by comparing member stages
        const currentStages = viewTask.members?.map((m) => `${m.id}:${m.stage}`).sort().join(',') || '';
        const updatedStages = updatedTask.members?.map((m) => `${m.id}:${m.stage}`).sort().join(',') || '';
        
        // Check member budgets
        const currentBudgets = viewTask.members?.map((m) => `${m.id}:${m.budget || 0}`).sort().join(',') || '';
        const updatedBudgets = updatedTask.members?.map((m) => `${m.id}:${m.budget || 0}`).sort().join(',') || '';
        
        // Also check other fields that might have changed
        const hasChanges = currentStages !== updatedStages || 
                          currentBudgets !== updatedBudgets ||
                          viewTask.stage !== updatedTask.stage ||
                          viewTask.title !== updatedTask.title ||
                          viewTask.note !== updatedTask.note ||
                          viewTask.deadline !== updatedTask.deadline ||
                          viewTask.totalBudget !== updatedTask.totalBudget ||
                          viewTask.category?.label !== updatedTask.category?.label;
        
        if (hasChanges) {

          setViewTask(updatedTask);
        }
      }
    }
  }, [tasks]); // Re-run whenever tasks array changes

  // Hide note tooltip on scroll
  useEffect(() => {
    const handler = () => setNoteTooltip(null);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, []);

  // Open create modal immediately if navigated from Dashboard empty state
  useEffect(() => {
    if (openCreateOnMount) {
      setShowCreate(true);
      if (onCreateMounted) onCreateMounted();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [pageLoading, setPageLoading] = useState(false); // Loading state for pagination
  const itemsPerPage = 15;

  const handleApproveRequest = (request) => {
    requestAdminPassword('approve this task request', () => {
      approveTaskRequest(request.id, currentUser);
      setRequestToApprove({ ...request, _approvedBy: currentUser });
      setShowRequests(false);
      setShowCreate(true);
      notify.requestApproved(request.title);
    });
  };

  const handleCompleteRequest = (request) => {
    requestAdminPassword('complete this task request', () => {
      completeTaskRequest(request.id, currentUser);
      notify.requestCompleted(request.title);
    });
  };

  // Wrapper for createTask that marks request as complete if it came from a request
  const handleCreateTask = (task) => {

    // Create scribes if any are defined
    if (task.scribes && task.scribes.length > 0) {

      createScribesForTask(task, team, currentUser, addNote);
    } else {

    }
    
    createTask(task);
    
    // If this task was created from a request, mark it as complete
    if (requestToApprove && requestToApprove.id) {
      completeTaskRequest(requestToApprove.id, currentUser);
    }
  };

  const handleCreateTaskClick = () => {
    setShowCreate(true);
  };

  // Get unique categories and tags from tasks
  const categories = [...new Set(tasks.filter((t) => t.category).map((t) => t.category.label))];
  const allTags = [...new Set(tasks.flatMap(t => t.tags || []).map((tag) => tag.label))];

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const filtered = (stageFilter === 'Scheduled' ? scheduledTasks : tasks.filter((t) => {
    // Stage filter
    const matchesStage = stageFilter === 'All' || t.stage === stageFilter;
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(t.category?.label);
    
    // Tag filter
    const matchesTag = selectedTags.length === 0 || (t.tags && t.tags.some((tag) => selectedTags.includes(tag.label)));
    
    // Date range filter
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const taskDate = new Date(t.deadline);
      taskDate.setHours(0, 0, 0, 0);
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && taskDate >= fromDate;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && taskDate <= toDate;
      }
    }
    
    return matchesStage && matchesCategory && matchesTag && matchesDate;
  })).sort((a, b) => {
    // Sort by deadline (due date) - latest first
    const dateA = new Date(a.deadline);
    const dateB = new Date(b.deadline);
    return dateB - dateA;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = () => setCurrentPage(1);

  // Handle page change with loading animation
  const handlePageChange = (newPage) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    setPageLoading(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => {
        setPageLoading(false);
      }, 400);
    }, 50);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px', overflow: 'hidden', position: 'relative' }}>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Stage filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...STAGES].map((s) => (
              <button key={s} onClick={() => { setStageFilter(s); resetPagination(); }} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: stageFilter === s ? 'none' : '1.5px solid var(--border)',
                background: stageFilter === s ? (s === 'All' ? 'var(--text-primary)' : STAGE_COLORS[s]) : 'var(--bg-surface)',
                color: stageFilter === s ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
              }}>
                {s}
                {s !== 'All' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.8 }}>({tasks.filter((t) => t.stage === s).length})</span>}
              </button>
            ))}
            {canViewScheduled && (
              <button onClick={() => { setStageFilter('Scheduled'); resetPagination(); }} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: stageFilter === 'Scheduled' ? 'none' : '1.5px solid var(--border)',
                background: stageFilter === 'Scheduled' ? '#7C3AED' : 'var(--bg-surface)',
                color: stageFilter === 'Scheduled' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
              }}>
                Scheduled <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.8 }}>({scheduledTasks.length})</span>
              </button>
            )}
          </div>
          
          {/* Category filter */}
          <div style={{ height: 24, width: '1px', background: 'var(--border)' }} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              style={{
                padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
              <ChevronDown size={14} />
            </button>
            {showCategoryDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
                borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: 200, zIndex: 100, maxHeight: 300, overflowY: 'auto',
              }}>
                <div style={{ padding: '8px' }}>
                  {categories.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No categories</div>
                  ) : categories.map((cat) => (
                    <label key={cat} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px' }}>
                    <button
                      onClick={() => setSelectedCategories([])}
                      style={{
                        width: '100%', padding: '6px', background: 'var(--bg-subtle)',
                        border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        color: 'var(--text-secondary)', cursor: 'pointer',
                      }}>
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tag filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              style={{
                padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              <ChevronDown size={14} />
            </button>
            {showTagDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
                borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: 200, zIndex: 100, maxHeight: 300, overflowY: 'auto',
              }}>
                <div style={{ padding: '8px' }}>
                  {allTags.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No tags</div>
                  ) : allTags.map((tag) => (
                    <label key={tag} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tag}</span>
                    </label>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px' }}>
                    <button
                      onClick={() => setSelectedTags([])}
                      style={{
                        width: '100%', padding: '6px', background: 'var(--bg-subtle)',
                        border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        color: 'var(--text-secondary)', cursor: 'pointer',
                      }}>
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Date range filter */}
          <div style={{ height: 24, width: '1px', background: 'var(--border)' }} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDatePicker(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${(dateFrom || dateTo) ? '#3B5BFC' : 'var(--border)'}`,
                background: (dateFrom || dateTo) ? '#EEF2FF' : 'var(--bg-surface)',
              }}
            >
              <Calendar size={14} color={(dateFrom || dateTo) ? '#3B5BFC' : 'var(--text-muted)'} />
              {(dateFrom || dateTo) && (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>
                  {dateFrom && new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {dateFrom && dateTo && ' â€” '}
                  {dateTo && new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </button>
            {showDatePicker && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 100,
                background: 'var(--bg-surface)', borderRadius: 12, padding: '14px 16px',
                border: '1.5px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>From</span>
                  <input type="date" value={tempDateFrom} onChange={(e) => setTempDateFrom(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 12, color: 'var(--text-primary)', background: 'var(--bg-subtle)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>To</span>
                  <input type="date" value={tempDateTo} onChange={(e) => setTempDateTo(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 12, color: 'var(--text-primary)', background: 'var(--bg-subtle)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setTempDateFrom(''); setTempDateTo(''); setShowDatePicker(false); }}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => { setDateFrom(tempDateFrom); setDateTo(tempDateTo); setShowDatePicker(false); }}
                    disabled={!tempDateFrom && !tempDateTo}
                    style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: (tempDateFrom || tempDateTo) ? '#3B5BFC' : 'var(--bg-subtle)', color: (tempDateFrom || tempDateTo) ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: (tempDateFrom || tempDateTo) ? 'pointer' : 'default' }}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowRequests(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
            background: taskRequests.filter((r) => r.status === 'pending').length > 0 ? '#FFF7ED' : 'var(--bg-surface)',
            color: taskRequests.filter((r) => r.status === 'pending').length > 0 ? '#F97316' : 'var(--text-secondary)',
            border: `1.5px solid ${taskRequests.filter((r) => r.status === 'pending').length > 0 ? '#F97316' : 'var(--border)'}`,
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            position: 'relative',
          }}>
            <ClipboardCheck size={15} />
            {taskRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: -6, 
                right: -6, 
                background: '#F97316', 
                color: '#fff', 
                borderRadius: '50%', 
                width: 18, 
                height: 18, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 10, 
                fontWeight: 800,
                border: '2px solid var(--bg-main)',
              }}>
                {taskRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
            Approve Tasks
          </button>
          <button onClick={() => { setRequestToApprove(null); handleCreateTaskClick(); }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
            background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px #3B5BFC40',
          }}>
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 16, border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: hideBudget ? '110px 1fr 160px 120px 150px 130px 110px' : '110px 1fr 160px 120px 150px 130px 110px 100px' }}>
            {['Task ID', 'Title & Progress', 'Note', 'Category', 'Tags', 'Stage', 'Date', ...(hideBudget ? [] : ['Budget'])].map((h) => (
              h === 'Title & Progress' ? (
                <div key={h} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || pageLoading}
                        style={{ padding: '2px 6px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', cursor: (currentPage === 1 || pageLoading) ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
                        <ChevronLeft size={11} color="#6B7280" />
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{currentPage}/{totalPages}</span>
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || pageLoading}
                        style={{ padding: '2px 6px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', cursor: (currentPage === totalPages || pageLoading) ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
                        <ChevronRight size={11} color="#6B7280" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
              )
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {pageLoading ? (
            // Skeleton loading for pagination
            <>
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: hideBudget ? '110px 1fr 160px 120px 150px 130px 110px' : '110px 1fr 160px 120px 150px 130px 110px 100px', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 75, height: 16, borderRadius: 6 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 6 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div className="skeleton" style={{ width: 65, height: 20, borderRadius: 20 }} />
                      <div className="skeleton" style={{ width: 75, height: 20, borderRadius: 20 }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: 85, height: 24, borderRadius: 20 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  </div>
                  <div className="skeleton" style={{ width: 100, height: 13, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: 80, height: 13, borderRadius: 6 }} />
                  {!hideBudget && <div className="skeleton" style={{ width: 70, height: 14, borderRadius: 6 }} />}
                </div>
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '80px 24px', gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare size={32} color="#3B5BFC" strokeWidth={1.8} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No tasks found</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6 }}>
                  {stageFilter !== 'All' ? 'Try a different filter or create a new task' : 'Create your first task to get started'}
                </div>
              </div>
              <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,91,252,0.3)' }}>
                <Plus size={15} /> Create Task
              </button>
            </div>
          ) : paginatedTasks.map((task, i) => {
            const overdue = new Date(task.deadline) < new Date() && task.stage !== 'Complete';
            const reviewMembers = task.members.filter((m) => m.stage === 'Review').length;
            // Create a unique key that includes member stages to force re-render when stages change
            const taskKey = `${task.id}-${task.members?.map((m) => `${m.id}:${m.stage}`).join('-') || 'no-members'}`;
            return (
              <div key={taskKey}
                onClick={() => {
                  // ? Mark task as seen by admin when clicked
                  if (task.createdBy?.userRole === 'management' && !task.seenByAdmin) {
                    updateTask(task.id, { seenByAdmin: true });
                  }
                  setViewTask(task);
                }}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: hideBudget ? '110px 1fr 160px 120px 150px 130px 110px' : '110px 1fr 160px 120px 150px 130px 110px 100px', 
                  padding: '14px 20px', 
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none', 
                  alignItems: 'start', 
                  cursor: 'pointer', 
                  transition: 'background 0.15s',
                  // ? Light blue background for new management tasks
                  background: task.createdBy?.userRole === 'management' && !task.seenByAdmin ? '#EFF6FF' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = task.createdBy?.userRole === 'management' && !task.seenByAdmin ? '#DBEAFE' : 'var(--bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = task.createdBy?.userRole === 'management' && !task.seenByAdmin ? '#EFF6FF' : 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setChatTask(task); }}
                    title="Open chat"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 3,
                      borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0,
                      color: '#3B5BFC', position: 'relative', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#3B5BFC'; e.currentTarget.querySelector('svg').style.fill = '#3B5BFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#3B5BFC'; e.currentTarget.querySelector('svg').style.fill = 'none'; }}
                  >
                    <MessageSquare size={13} style={{ transition: 'fill 0.2s' }} />
                    {/* Unread indicator dot */}
                    {task.unreadCount > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: '1px solid var(--bg-surface)',
                      }} />
                    )}
                  </button>
                  <span
                    onClick={hideTimeline ? undefined : (e) => { e.stopPropagation(); setTimelineTask(task); }}
                    style={{ fontFamily: 'monospace', fontSize: 12, color: '#3B5BFC', fontWeight: 700, cursor: hideTimeline ? 'default' : 'pointer', transition: 'text-decoration 0.15s' }}
                    onMouseEnter={(e) => { if (!hideTimeline) e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    #{task.id}
                  </span>
                </div>
                <div style={{ paddingRight: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{task.title}</div>
                  <StageFlow current={task.stage} members={task.members} paid={task.paid} history={task.history || []} taskId={task.id} getPaymentsForTask={getPaymentsForTask} />
                </div>
                {/* Note cell */}
                <div onClick={(e) => e.stopPropagation()} style={{ paddingRight: 8 }}>
                  {editingNote?.taskId === task.id ? (
                    <textarea
                      autoFocus
                      value={editingNote.value}
                      onChange={(e) => setEditingNote(prev => ({ ...prev, value: e.target.value }))}
                      onBlur={() => { updateTaskNote(task.id, editingNote.value); setEditingNote(null); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') setEditingNote(null); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateTaskNote(task.id, editingNote.value); setEditingNote(null); } }}
                      style={{
                        width: '100%', minHeight: 56, resize: 'vertical',
                        padding: '6px 8px', borderRadius: 8,
                        border: '1.5px solid #3B5BFC',
                        background: 'var(--bg-surface)',
                        fontSize: 12, color: 'var(--text-primary)',
                        outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => setEditingNote({ taskId: task.id, value: task.note || '' })}
                      style={{
                        minHeight: 32, padding: '5px 8px', borderRadius: 8,
                        border: '1.5px solid transparent',
                        background: task.note ? 'var(--bg-subtle)' : 'transparent',
                        fontSize: 12, color: task.note ? 'var(--text-secondary)' : 'var(--text-muted)',
                        cursor: 'text', lineHeight: 1.5,
                        transition: 'border 0.15s, background 0.15s',
                        fontStyle: task.note ? 'normal' : 'italic',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = '1.5px solid var(--border)';
                        e.currentTarget.style.background = 'var(--bg-subtle)';
                        if (task.note) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setNoteTooltip({ note: task.note, x: rect.left + rect.width / 2, y: rect.top });
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = '1.5px solid transparent';
                        e.currentTarget.style.background = task.note ? 'var(--bg-subtle)' : 'transparent';
                        setNoteTooltip(null);
                      }}
                    >
                      {task.note || 'Add note'}
                    </div>
                  )}
                </div>
                <div>
                  {task.category ? (() => {
                    // Find full category data from CATEGORIES to get image
                    const fullCategory = CATEGORIES.find((c) => (c.id || c.label) === task.category.id || (c.name || c.label) === task.category.label);
                    const categoryImage = fullCategory?.icon || fullCategory?.image || task.category.image;
                    const isImageUrl = categoryImage && (categoryImage.startsWith('data:') || categoryImage.startsWith('http'));
                    
                    return (
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: 50, 
                        background: task.category.bg || '#F3F4F6', 
                        color: '#1A1D2E', 
                        border: `1px solid ${task.category.color || '#E5E7EB'}30`, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4 
                      }}>
                        {isImageUrl && (
                          <img src={categoryImage} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        )}
                        {task.category.label}
                      </span>
                    );
                  })() : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>â€”</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 2 }}>
                  {task.tags && task.tags.length > 0
                    ? task.tags.map((t) => {
                        // Find full tag data from TAGS to get image
                        const fullTag = TAGS.find((tag) => (tag.id || tag.label) === t.id || (tag.name || tag.label) === t.label);
                        const tagImage = fullTag?.image || t.image;
                        const isImageUrl = tagImage && (tagImage.startsWith('data:') || tagImage.startsWith('http'));
                        
                        return (
                          <span key={t.label} style={{ 
                            fontSize: 11, 
                            fontWeight: 600, 
                            padding: '4px 10px', 
                            borderRadius: 50, 
                            background: t.bg || '#F3F4F6', 
                            color: '#1A1D2E', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 4,
                            border: '1px solid rgba(0,0,0,0.08)'
                          }}>
                            {isImageUrl && (
                              <img src={tagImage} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                            )}
                            {t.label}
                          </span>
                        );
                      })
                    : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>?</span>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: STAGE_BG[task.stage], color: STAGE_COLORS[task.stage] }}>{task.stage}</span>
                  {task.paused && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 3 }}><Hourglass size={9} /> On Hold</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: overdue ? '#EF4444' : task.extendedDeadline ? '#F97316' : 'var(--text-secondary)' }}>
                  {task.isScheduled ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>{new Date(task.scheduledDate || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED' }}>Scheduled</span>
                    </div>
                  ) : (() => {
                    const displayDate = task.extendedDeadline || task.deadline;
                    const dateStr = new Date(displayDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {overdue ? `[Warn] ${dateStr}` : dateStr}
                      {task.extendedDeadline && <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', background: '#FFF7ED', padding: '1px 6px', borderRadius: 5, alignSelf: 'flex-start' }}>Extended</span>}
                      {task.scheduledDate && <span style={{ fontSize: 10, fontWeight: 600, color: '#3B5BFC' }}>Scheduled: {new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>;
                  })()}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: (() => {
                  // Check if ALL payments for this task are paid (from payments collection only)
                  const taskPayments = getPaymentsForTask ? getPaymentsForTask(task.id) : [];
                  
                  // Show green only if there are payments AND all are paid (check both isPaid and status)
                  const allPaymentsPaid = taskPayments.length > 0 && taskPayments.every((p) => p.isPaid === true || p.status === 'Paid');
                  return allPaymentsPaid ? '#12C479' : 'var(--text-primary)';
                })() }}>{hideBudget ? null : (() => {
                  // Calculate team budget (sum of member budgets)
                  const teamBudget = task.members?.reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0) || 0;
                  
                  // Calculate additional payments (investment/additional type payments for this task)
                  const taskPayments = getPaymentsForTask ? getPaymentsForTask(task.id) : [];
                  const additionalAmount = taskPayments
                    .filter((p) => p.paymentType === 'investment' || p.paymentType === 'additional')
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                  
                  const totalWithAdditional = teamBudget + additionalAmount;
                  return `₹${totalWithAdditional.toLocaleString()}`;
                })()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showRequests && <TaskRequestsModal onClose={() => setShowRequests(false)} onApprove={handleApproveRequest} onComplete={handleCompleteRequest} requests={taskRequests} />}
      {showCreate && <CreateTaskModal onClose={() => { setShowCreate(false); setRequestToApprove(null); }} onCreate={handleCreateTask} onSchedule={addScheduledTask} teamMembers={team} requestData={requestToApprove} hideBudget={hideBudget} currentUser={currentUser} managementMode={managementMode} onNavigateToManage={onNavigateToManage} />}
      {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} onUpdate={updateTask} teamMembers={team} hideBudget={hideBudget} managementMode={managementMode} />}
      {viewTask && <AdminTaskModal key={`${viewTask.id}-${viewTask.members?.map((m) => `${m.id}:${m.stage}`).join('-')}`} task={viewTask} onClose={() => setViewTask(null)} onEdit={(task) => { setEditTask(task); setViewTask(null); }} onTimelineClick={(task) => { setTimelineTask(task); setViewTask(null); }} hideBudget={hideBudget} onCreateScheduled={(task) => { createTask(task); removeScheduledTask(task.id); }} onCancelScheduled={(id) => removeScheduledTask(id)} managementMode={managementMode} currentUser={currentUser} onNavigateToTask={() => { setViewTask(null); if (onNavigateToNotes) onNavigateToNotes(); }} />}
      {timelineTask && <TaskTimelinePanel task={timelineTask} onClose={() => setTimelineTask(null)} />}
      {chatTask && <TaskChatPanel task={chatTask} onClose={() => setChatTask(null)} currentUser={currentUser} team={team} />}
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        label={managementMode ? 'Management Password' : 'Admin Password'} />
      )}

      {/* Fixed Note Tooltip ? renders above overflow:hidden containers */}
      {noteTooltip && (
        <div style={{
          position: 'fixed',
          left: noteTooltip.x,
          top: noteTooltip.y - 8,
          transform: 'translateX(-50%) translateY(-100%)',
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 10,
          padding: '10px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          width: 240,
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {noteTooltip.note}
          <div style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10,
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border)',
            borderTop: 'none', borderLeft: 'none',
          }} />
        </div>
      )}
    </div>
  );
}

