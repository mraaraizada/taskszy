import React, { useState, useRef, useEffect, useMemo } from 'react';
import { notify } from '../lib/notify';
import { Clock, CheckCircle, TrendingUp, ArrowUpRight, Wallet, Download, X, DollarSign, Calendar, Plus, User, Users, Briefcase, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ArrowLeft, ArrowRight, ReceiptIndianRupee } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';
import { usePaginatedPayments } from '../hooks/usePaginatedPayments';
import { useLottie } from 'lottie-react';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Dynamic loading animation loader
function useLoadingAnimation() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Sandy Loading.json').then(m => setData(m.default)); }, []);
  return data;
}
function exportToCSV(rows) {
  const headers = ['Task ID', 'Task Title', 'Member', 'Assigned By', 'Role', 'Stage', 'Due Date', 'Amount', 'Status'];
  const lines = rows.map(r => [
    r.id,
    `"${r.title}"`,
    `"${r.memberName}"`,
    r.assignedBy || 'Admin',
    r.assignedRole || 'Admin',
    r.stage,
    new Date(r.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    r.amount,
    r.isPaid ? 'Paid' : 'Pending',
  ].join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Add Budget Modal
function AddBudgetModal({ taskBudget, onClose, onConfirm }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      notify('Please enter a valid amount', 'error');
      return;
    }
    // ⭐ Request admin password before confirming
    requestAdminPassword('receive payment', () => {
      onConfirm(parsedAmount);
    });
  };

  // Calculate current status
  const totalBudget = taskBudget?.amount || 0;
  const paidAmount = taskBudget?.paidAmount || 0;
  const isPaid = taskBudget?.isPaid || false;
  const pendingAmount = totalBudget - paidAmount;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              {isPaid ? 'Add Profit/Bonus' : 'Receive Payment'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {isPaid ? 'Record additional amount received' : 'Record payment received for this task'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Task Info */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F3FF', border: '2px solid #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wallet size={16} color="#7C3AED" strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{taskBudget?.memberName || 'Task Budget'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Budget: ₹{totalBudget.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Paid</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#12C479' }}>₹{paidAmount.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Pending</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>₹{pendingAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {isPaid ? 'Additional Amount Received' : 'Amount Received'}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 32px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  background: 'var(--input-bg)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAdd();
                  }
                }}
              />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: isPaid ? '#ECFDF5' : '#F5F3FF', borderRadius: 10, border: `1px solid ${isPaid ? '#A7F3D0' : '#E9D5FF'}` }}>
                <div style={{ fontSize: 11, color: isPaid ? '#12C479' : '#7C3AED', fontWeight: 600, marginBottom: 4 }}>
                  {isPaid ? 'Profit/Bonus' : 'After This Payment'}
                </div>
                {isPaid ? (
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#12C479' }}>+₹{parseFloat(amount).toLocaleString()}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#12C479', marginBottom: 4 }}>
                      Paid: ₹{(paidAmount + parseFloat(amount)).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>
                      Pending: ₹{Math.max(0, pendingAmount - parseFloat(amount)).toLocaleString()}
                    </div>
                    {parseFloat(amount) > pendingAmount && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#12C479', marginTop: 4 }}>
                        Profit: +₹{(parseFloat(amount) - pendingAmount).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleAdd}
            disabled={!amount || parseFloat(amount) <= 0}
            style={{
              padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, 
              cursor: (!amount || parseFloat(amount) <= 0) ? 'not-allowed' : 'pointer',
              background: (!amount || parseFloat(amount) <= 0) ? 'var(--border)' : 'linear-gradient(135deg, #12C479, #059669)',
              color: (!amount || parseFloat(amount) <= 0) ? 'var(--text-muted)' : '#fff',
              boxShadow: (!amount || parseFloat(amount) <= 0) ? 'none' : '0 6px 20px rgba(18,196,121,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            <Plus size={16} strokeWidth={2.5} /> {isPaid ? 'Add Profit' : 'Receive Payment'}
          </button>
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'receive payment'}
        />
      )}
    </div>
  );
}

// Payment Modal
function PaymentModal({ selectedRows, onClose, onConfirm }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [notes, setNotes] = useState('');
  const totalAmount = selectedRows.reduce((sum, row) => sum + row.amount, 0);
  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  const handleProcessPayment = () => {
    if (wordCount > 100) {
      return;
    }
    requestAdminPassword('process payment', () => {
      onConfirm(notes);
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Process Payment</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Confirm payment for {selectedRows.length} task{selectedRows.length > 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Selected tasks summary */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Selected Tasks</div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedRows.map(row => (
                <div key={row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {row.memberAvatar === 'ARROW_UP_ICON' ? (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ArrowUpRight size={14} color="#fff" strokeWidth={2.5} />
                      </div>
                    ) : row.memberAvatar === 'TASK_BUDGET_ICON' ? (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wallet size={14} color="#fff" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{row.memberAvatar}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{row.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.memberName}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#12C479', flexShrink: 0 }}>₹{row.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Total amount */}
          <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #C7D4FF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3B5BFC', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Payment Amount</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{selectedRows.length} task{selectedRows.length > 1 ? 's' : ''} selected</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3B5BFC', letterSpacing: '-1px' }}>₹{totalAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Description <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(optional, max 100 words)</span></div>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={4} 
              placeholder="Add notes about this payment (e.g., invoice number, payment method, special instructions)..."
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
              onBlur={e => e.target.style.borderColor = 'var(--border)'} 
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: wordCount > 100 ? '#EF4444' : 'var(--text-muted)', marginTop: 4 }}>
              {wordCount}/100 words
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleProcessPayment} 
            disabled={wordCount > 100}
            style={{
              padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, 
              cursor: wordCount > 100 ? 'not-allowed' : 'pointer',
              background: wordCount > 100 ? 'var(--border)' : 'linear-gradient(135deg, #12C479, #059669)',
              color: wordCount > 100 ? 'var(--text-muted)' : '#fff',
              boxShadow: wordCount > 100 ? 'none' : '0 6px 20px rgba(18,196,121,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>₹</span> Process Payment
          </button>
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        />
      )}
    </div>
  );
}

// Loading Overlay Component
function LoadingOverlay({ show, onComplete }) {
  const loadingAnimData = useLoadingAnimation();
  const [fading, setFading] = useState(false);
  
  // ⭐ Reset fading state when show becomes true
  useEffect(() => {
    if (show) {
      setFading(false);
    }
  }, [show]);
  
  const LoadingLottie = () => {
    const { View } = useLottie({
      animationData: loadingAnimData ?? null,
      loop: false,
      autoplay: true,
      onComplete: () => {
        // Start fading after animation completes
        setTimeout(() => {
          setFading(true);
          setTimeout(() => {
            onComplete();
          }, 300); // 0.3 second fade out
        }, 200); // 0.2 second delay after animation
      },
    });
    return View;
  };
  
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999, // ⭐ Very high z-index to be on top of everything
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.3)', // ⭐ Light dark overlay so animation is visible
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.3s ease',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      <div style={{
        width: 350,
        height: 350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {loadingAnimData ? <LoadingLottie /> : (
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#fff',
            textAlign: 'center'
          }}>
            Processing payment...
          </div>
        )}
      </div>
    </div>
  );
}

// Add Manual Payment Modal
function AddPaymentModal({ onClose, onAdd, team, tasks, prefilledTaskId = null }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { CATEGORIES } = useApp(); // ⭐ Get categories from Firebase
  
  // ⭐ Debug: Log team data to check avatarImg
  useEffect(() => {

  }, [team]);
  
  // All admin users get full access
  const isAdminA = false;
  
  const [paymentType, setPaymentType] = useState('member'); // 'member' or 'investment'
  const [memberId, setMemberId] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [taskId, setTaskId] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payNow, setPayNow] = useState(false);
  
  const memberDropdownRef = useRef(null);
  
  // Payment categories from Firebase - empty for Admin A
  const PAYMENT_CATEGORIES = isAdminA ? [] : (CATEGORIES && CATEGORIES.length > 0 
    ? CATEGORIES.map(cat => {
        return {
          label: cat.label || cat.name,
          icon: cat.icon || null, // ⭐ Don't use fallback emoji if image exists
          color: cat.color || '#6B7280',
          bg: cat.bg || '#F3F4F6',
          image: cat.image || cat.img || null,
        };
      })
    : [
        // Fallback if CATEGORIES not loaded
        { label: 'Domain & Hosting', icon: '🌐', color: '#3B5BFC', bg: '#EEF2FF' },
        { label: 'Software & Tools', icon: '💻', color: '#7C3AED', bg: '#F5F3FF' },
        { label: 'Infrastructure', icon: '🏗️', color: '#06B6D4', bg: '#ECFEFF' },
        { label: 'Marketing', icon: '📢', color: '#F97316', bg: '#FFF7ED' },
        { label: 'Equipment', icon: '🔧', color: '#12C479', bg: '#ECFDF5' },
        { label: 'Legal', icon: '⚖️', color: '#8B5CF6', bg: '#F5F3FF' },
        { label: 'Training', icon: '📚', color: '#F59E0B', bg: '#FFFBEB' },
        { label: 'Other', icon: '📦', color: '#6B7280', bg: '#F3F4F6' },
      ]);
  
  // ⭐ Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
    }
    if (showMemberDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMemberDropdown]);

  // ⭐ Auto-fill task ID when navigating from Task Detail Modal
  useEffect(() => {
    if (prefilledTaskId) {

      setPaymentType('investment'); // Set to Payment type (investment)
      setTaskId(prefilledTaskId.toString());
      setTaskSearchQuery(prefilledTaskId.toString());
    }
  }, [prefilledTaskId]);

  // ⭐ Auto-fill due date and category from selected task
  useEffect(() => {

    if (taskId && tasks && tasks.length > 0) {
      const selectedTask = tasks.find(t => t.id.toString() === taskId.toString());

      if (selectedTask) {
        // Auto-fill due date from task deadline
        if (selectedTask.deadline) {
          const taskDeadline = new Date(selectedTask.deadline);
          const formattedDate = taskDeadline.toISOString().split('T')[0];

          setDueDate(formattedDate);
        }
        
        // Auto-fill category from task category
        if (selectedTask.category && PAYMENT_CATEGORIES.length > 0) {
          const taskCategoryLabel = typeof selectedTask.category === 'object' 
            ? (selectedTask.category.label || selectedTask.category.name)
            : selectedTask.category;

          // Try multiple matching strategies
          let matchingCategory = PAYMENT_CATEGORIES.find(c => {
            // Try exact label match
            if (c.label === taskCategoryLabel) return true;
            // Try label vs category.label
            if (c.label === selectedTask.category?.label) return true;
            // Try label vs category.name
            if (c.label === selectedTask.category?.name) return true;
            // Try case-insensitive match
            if (c.label?.toLowerCase() === taskCategoryLabel?.toLowerCase()) return true;
            return false;
          });
          
          // ⭐ If no match found, use the task's category directly
          if (!matchingCategory && typeof selectedTask.category === 'object') {

            // Check if icon field contains image data
            const taskIcon = selectedTask.category.icon || selectedTask.category.emoji;
            const taskImage = selectedTask.category.image || selectedTask.category.img;
            const isIconImage = taskIcon && (taskIcon.startsWith('data:image') || taskIcon.startsWith('http'));
            
            matchingCategory = {
              label: selectedTask.category.label || selectedTask.category.name,
              icon: !isIconImage ? taskIcon : null, // Only use as icon if it's NOT an image
              color: selectedTask.category.color || '#6B7280',
              bg: selectedTask.category.bg || '#F3F4F6',
              image: taskImage || (isIconImage ? taskIcon : null), // Use image field for actual images
            };

          }

          if (matchingCategory) {

            setSelectedCategory(matchingCategory);

          } else {

          }
        } else {

        }
        
        // ⭐ Don't auto-fill title - user should enter it manually
      }
    }
  }, [taskId, tasks]); // ⭐ Only depend on taskId and tasks - always update when taskId changes

  // ⭐ Monitor selectedCategory changes
  useEffect(() => {

  }, [selectedCategory]);

  const selectedMember = team.find(m => String(m.id) === String(memberId));
  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;
  
  // ⭐ Validation logic - for investment, require category OR taskId (task-linked payments auto-fill category)
  const isValid = paymentType === 'investment' 
    ? amount && parseFloat(amount) > 0 && title.trim() && (selectedCategory || taskId)
    : memberId && amount && parseFloat(amount) > 0 && title.trim();

  // ⭐ Debug validation
  useEffect(() => {

  }, [paymentType, amount, title, selectedCategory, taskId, isValid]);

  const handleSubmit = () => {

    if (!isValid || wordCount > 100) {

      return;
    }

    requestAdminPassword('add payment', () => {
      const today = new Date().toISOString().split('T')[0];
      
      // ⭐ Find linked task to include task data
      const linkedTask = taskId && tasks ? tasks.find(t => t.id.toString() === taskId.toString()) : null;
      
      const paymentData = {
        paymentType,
        memberId: paymentType === 'member' ? String(memberId) : null, // ⭐ Explicitly convert to string
        amount: parseFloat(amount),
        description: title.trim(), // ⭐ User-entered title goes to description field
        notes: notes.trim(), // ⭐ Additional notes field
        dueDate: dueDate || today,
        isPaid: false,
        investmentCategory: paymentType === 'investment' && selectedCategory ? selectedCategory.label : null,
        taskId: taskId.trim() || null,
        // ⭐ Include task data if linked to a task
        ...(linkedTask && {
          taskTitle: linkedTask.title, // ⭐ Store task title separately for reference
          taskCategory: linkedTask.category || null,
          taskTags: linkedTask.tags || [],
          taskStage: linkedTask.stage || null,
          taskDeadline: linkedTask.deadline || null,
        }),
      };

      onAdd(paymentData);

      onClose();
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Add Manual Payment</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Create a payment entry (Task ID is optional)</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Payment Type Selection */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Type *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setPaymentType('member'); setSelectedCategory(null); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: paymentType === 'member' ? 'none' : '1.5px solid var(--border)',
                  background: paymentType === 'member' ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--bg-surface)',
                  color: paymentType === 'member' ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                <Users size={16} /> Team
              </button>
              <button
                onClick={() => { setPaymentType('investment'); setMemberId(''); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: paymentType === 'investment' ? 'none' : '1.5px solid var(--border)',
                  background: paymentType === 'investment' ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'var(--bg-surface)',
                  color: paymentType === 'investment' ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                <ReceiptIndianRupee size={16} /> Payment
              </button>
            </div>
          </div>

          {/* Team Member Selection - Only for member payments */}
          {paymentType === 'member' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Team Member *</label>
              
              {/* ⭐ Custom dropdown with avatars and role grouping */}
              <div style={{ position: 'relative' }} ref={memberDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 14,
                    color: selectedMember ? 'var(--text-primary)' : 'var(--text-muted)',
                    outline: 'none',
                    background: 'var(--input-bg)',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    gap: 10
                  }}
                >
                  {selectedMember ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      {/* ⭐ Show avatar image or initials */}
                      {selectedMember.avatarImg ? (
                        <img
                          src={selectedMember.avatarImg}
                          alt={selectedMember.name}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: selectedMember.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {selectedMember.avatar}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMember.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedMember.role}</div>
                      </div>
                    </div>
                  ) : (
                    <span>Select team member...</span>
                  )}
                  <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
                
                {showMemberDropdown && team && team.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    maxHeight: 300,
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    {/* ⭐ Group by roles */}
                    {[...new Set(team.filter(m => m.status === 'Active').map(m => m.role))].sort().map(role => {
                      const membersInRole = team.filter(m => m.status === 'Active' && m.role === role);
                      return (
                        <div key={role}>
                          {/* Role header */}
                          <div style={{
                            padding: '8px 12px',
                            background: 'var(--bg-subtle)',
                            borderBottom: '1px solid var(--border-light)',
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}>
                            {role}
                          </div>
                          
                          {/* Members in this role */}
                          {membersInRole.map(m => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setMemberId(m.id.toString());
                                setShowMemberDropdown(false);
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-light)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: memberId === m.id.toString() ? '#EEF2FF' : 'transparent'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#EEF2FF'}
                              onMouseLeave={e => e.currentTarget.style.background = memberId === m.id.toString() ? '#EEF2FF' : 'transparent'}
                            >
                              {/* ⭐ Show avatar image or initials */}
                              {m.avatarImg ? (
                                <img
                                  src={m.avatarImg}
                                  alt={m.name}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                    border: '2px solid var(--bg-surface)'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: m.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: '#fff',
                                  flexShrink: 0
                                }}>
                                  {m.avatar}
                                </div>
                              )}
                              
                              {/* Member info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Category - Only for payment type */}
          {paymentType === 'investment' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Payment Category * <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>
                  {taskId ? '(auto-filled from task)' : '(select one)'}
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, opacity: taskId ? 0.6 : 1, pointerEvents: taskId ? 'none' : 'auto' }}>
                {PAYMENT_CATEGORIES.map(cat => {
                  const sel = selectedCategory?.label === cat.label;
                  // ⭐ Check if icon is actually an image (base64 or URL)
                  const isImageIcon = cat.icon && (cat.icon.startsWith('data:image') || cat.icon.startsWith('http'));
                  const imageUrl = cat.image || (isImageIcon ? cat.icon : null);
                  const displayIcon = !imageUrl && cat.icon;
                  
                  return (
                    <button 
                      key={cat.label} 
                      type="button"
                      onClick={() => {

                        setSelectedCategory(sel ? null : cat);
                      }} 
                      style={{
                        padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: taskId ? 'not-allowed' : 'pointer',
                        border: `1.5px solid ${sel ? '#3B5BFC' : 'var(--border)'}`,
                        background: sel ? cat.bg : 'var(--bg-surface)',
                        color: sel ? cat.color : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                        boxShadow: sel ? `0 2px 8px ${cat.color}30` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={cat.label} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                      ) : displayIcon ? (
                        <span style={{ fontSize: 14 }}>{displayIcon}</span>
                      ) : null}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              {taskId && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Category is automatically set from the linked task
                </div>
              )}
            </div>
          )}

          {/* Task ID - Optional for investment payment type only */}
          {paymentType === 'investment' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                Link to Task <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(optional)</span>
              </label>
              {tasks && tasks.find(t => t.id.toString() === taskId) && (
                <div style={{ width: 20, height: 20, borderRadius: 4, background: '#12C479', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={14} color="#fff" strokeWidth={3} />
                </div>
              )}
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  value={taskSearchQuery}
                  onChange={e => { 
                    const value = e.target.value;
                    setTaskSearchQuery(value); 
                    // Strip # if present and set taskId immediately
                    const cleanId = value.replace(/^#/, '');
                    setTaskId(cleanId);
                  }}
                  placeholder="Type exact Task ID..."
                  style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              {taskId && (
                <button onClick={() => { setTaskId(''); setTaskSearchQuery(''); }}
                  style={{ padding: '6px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            {taskSearchQuery && taskId && !(tasks && tasks.find(t => t.id.toString() === taskId)) && (
              <div style={{ fontSize: 11, marginTop: 6, paddingLeft: 2 }}>
                <span style={{ color: '#F97316', fontWeight: 600 }}>⚠ Task ID "{taskId}" not found</span>
              </div>
            )}
            {taskSearchQuery && !taskId && (
              <div style={{ fontSize: 11, marginTop: 6, paddingLeft: 2 }}>
                <span style={{ color: 'var(--text-muted)' }}>Leave empty to create standalone payment</span>
              </div>
            )}
          </div>
          )}

          {/* Amount and Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount (?) *</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{ 
                  width: '100%', 
                  padding: '11px 16px', 
                  border: '1.5px solid var(--border)', 
                  borderRadius: 10, 
                  fontSize: 14, 
                  color: 'var(--text-primary)', 
                  outline: 'none', 
                  background: 'var(--input-bg)', 
                  boxSizing: 'border-box' 
                }}
                onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
                onBlur={e => e.target.style.borderColor = 'var(--border)'} 
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Due Date <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>
                  {taskId ? '(auto-filled from task)' : '(optional)'}
                </span>
              </label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)}
                disabled={payNow || !!taskId}
                style={{ 
                  width: '100%', 
                  padding: '11px 16px', 
                  border: '1.5px solid var(--border)', 
                  borderRadius: 10, 
                  fontSize: 14, 
                  color: 'var(--text-primary)', 
                  outline: 'none', 
                  background: (payNow || taskId) ? 'var(--bg-subtle)' : 'var(--input-bg)', 
                  boxSizing: 'border-box', 
                  colorScheme: 'normal',
                  cursor: (payNow || taskId) ? 'not-allowed' : 'text',
                  opacity: (payNow || taskId) ? 0.6 : 1,
                }}
                onFocus={e => !(payNow || taskId) && (e.target.style.borderColor = '#3B5BFC')} 
                onBlur={e => e.target.style.borderColor = 'var(--border)'} 
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title *</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., Bonus payment, Domain renewal, Office supplies..."
              style={{ 
                width: '100%', 
                padding: '11px 16px', 
                border: '1.5px solid var(--border)', 
                borderRadius: 10, 
                fontSize: 14, 
                color: 'var(--text-primary)', 
                outline: 'none', 
                background: 'var(--input-bg)', 
                boxSizing: 'border-box' 
              }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
              onBlur={e => e.target.style.borderColor = 'var(--border)'} 
            />
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Description <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(optional, max 100 words)</span></div>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={3} 
              placeholder="Additional notes about this payment..."
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: '1.5px solid var(--border)', 
                borderRadius: 10, 
                fontSize: 13, 
                color: 'var(--text-primary)', 
                outline: 'none', 
                background: 'var(--input-bg)', 
                resize: 'vertical', 
                fontFamily: 'inherit', 
                boxSizing: 'border-box' 
              }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
              onBlur={e => e.target.style.borderColor = 'var(--border)'} 
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: wordCount > 100 ? '#EF4444' : 'var(--text-muted)', marginTop: 4 }}>
              {wordCount}/100 words
            </div>
          </div>

          {/* Preview */}
          {isValid && (
            <div style={{ background: paymentType === 'investment' ? 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' : 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 14, padding: '16px 20px', border: paymentType === 'investment' ? '1.5px solid #F97316' : '1.5px solid #C7D4FF' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: paymentType === 'investment' ? '#F97316' : '#3B5BFC', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                {paymentType === 'investment' ? 'Payment Preview' : 'Payment Preview'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {paymentType === 'investment' ? (
                      // ⭐ For investment payments, show task title if linked, otherwise show category
                      taskId && tasks && tasks.find(t => t.id.toString() === taskId.toString()) ? (
                        <span>{tasks.find(t => t.id.toString() === taskId.toString()).title}</span>
                      ) : selectedCategory ? (
                        <>
                          {selectedCategory.image || (selectedCategory.icon && (selectedCategory.icon.startsWith('data:image') || selectedCategory.icon.startsWith('http'))) ? (
                            <img 
                              src={selectedCategory.image || selectedCategory.icon} 
                              alt={selectedCategory.label} 
                              style={{ width: 16, height: 16, objectFit: 'contain' }} 
                            />
                          ) : selectedCategory.icon ? (
                            <span style={{ fontSize: 14 }}>{selectedCategory.icon}</span>
                          ) : null}
                          <span>{selectedCategory.label}</span>
                        </>
                      ) : (
                        'Select Category'
                      )
                    ) : selectedMember ? (
                      selectedMember.name
                    ) : (
                      'Select Member'
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{title}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: paymentType === 'investment' ? '#F97316' : '#3B5BFC', letterSpacing: '-1px' }}>₹{parseFloat(amount).toLocaleString()}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} color="#F97316" />
                <span>Due: {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={!isValid || wordCount > 100}
            style={{
              padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: (!isValid || wordCount > 100) ? 'not-allowed' : 'pointer',
              background: (!isValid || wordCount > 100) ? 'var(--border)' : 'linear-gradient(135deg, #3B5BFC, #2142D9)',
              color: (!isValid || wordCount > 100) ? 'var(--text-muted)' : '#fff',
              boxShadow: (!isValid || wordCount > 100) ? 'none' : '0 6px 20px rgba(59,91,252,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            <Plus size={16} /> Add Payment
          </button>
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        />
      )}
    </div>
  );
}

// Category Payment Modal
function CategoryPaymentModal({ selectedRows, onClose, onConfirm, team }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  
  // ⭐ Initialize task amounts with correct keys
  const initialAmounts = useMemo(() => {
    const amounts = {};
    selectedRows.forEach(row => {
      const key = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
      amounts[key] = row.amount || 0;
    });
    return amounts;
  }, [selectedRows]);
  
  const initialTotal = selectedRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const [totalAmount, setTotalAmount] = useState(initialTotal > 0 ? initialTotal : '');
  const [description, setDescription] = useState('');
  const [taskAmounts, setTaskAmounts] = useState(initialAmounts);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const calculatedTotal = Object.values(taskAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
  
  // ⭐ Log for debugging
  useEffect(() => {

  }, [totalAmount, calculatedTotal, taskAmounts, selectedRows]);

  const handleAmountChange = (key, value) => {
    // ⭐ Allow decimals (floats)
    const floatValue = value === '' ? 0 : parseFloat(value) || 0;
    setTaskAmounts(prev => ({
      ...prev,
      [key]: floatValue
    }));
  };

  const handleTotalAmountChange = (value) => {
    // ⭐ Allow decimals (floats)
    const floatValue = value === '' ? '' : parseFloat(value) || '';
    setTotalAmount(floatValue);
    
    // ⭐ Auto-distribute when total amount is typed
    if (floatValue && floatValue > 0) {
      const numTasks = selectedRows.length;
      const perTask = floatValue / numTasks;
      const newAmounts = {};
      
      let totalDistributed = 0;
      
      selectedRows.forEach((row, index) => {
        const key = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
        
        // ⭐ For the last task, give whatever is left to ensure exact total
        if (index === numTasks - 1) {
          newAmounts[key] = parseFloat((floatValue - totalDistributed).toFixed(2));
        } else {
          // ⭐ Round to 2 decimal places
          const amount = parseFloat(perTask.toFixed(2));
          newAmounts[key] = amount;
          totalDistributed += amount;
        }
      });
      
      setTaskAmounts(newAmounts);
      
      // ⭐ Verify distribution
      const distributedTotal = Object.values(newAmounts).reduce((sum, amt) => sum + amt, 0);

    } else if (floatValue === '') {
      // ⭐ Clear all amounts when input is cleared
      const newAmounts = {};
      selectedRows.forEach(row => {
        const key = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
        newAmounts[key] = 0;
      });
      setTaskAmounts(newAmounts);
    }
  };

  const distributeEvenly = () => {
    if (!totalAmount || totalAmount <= 0) return;
    
    const numTasks = selectedRows.length;
    const perTask = totalAmount / numTasks;
    const newAmounts = {};
    
    let totalDistributed = 0;
    
    selectedRows.forEach((row, index) => {
      const key = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
      
      // ⭐ For the last task, give whatever is left to ensure exact total
      if (index === numTasks - 1) {
        newAmounts[key] = parseFloat((totalAmount - totalDistributed).toFixed(2));
      } else {
        // ⭐ Round to 2 decimal places
        const amount = parseFloat(perTask.toFixed(2));
        newAmounts[key] = amount;
        totalDistributed += amount;
      }
    });
    
    setTaskAmounts(newAmounts);
    
    // ⭐ Verify distribution
    const distributedTotal = Object.values(newAmounts).reduce((sum, amt) => sum + amt, 0);

  };

  const handleConfirm = () => {
    if (calculatedTotal <= 0) {
      return;
    }
    
    requestAdminPassword('create payment', () => {
      const categoryData = {
        description: description.trim(),
        totalAmount: calculatedTotal,
        tasks: selectedRows.map(row => {
          const key = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
          return {
            ...row,
            categoryAmount: taskAmounts[key] || 0,
          };
        }),
      };
      
      onConfirm(categoryData);
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🏷️</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Category Payment</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Distribute payment across {selectedRows.length} task{selectedRows.length > 1 ? 's' : ''}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Total Amount Input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Total Amount *</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
              <input 
                type="number"
                min="0.01"
                step="0.01"
                value={totalAmount} 
                onChange={e => handleTotalAmountChange(e.target.value)} 
                placeholder="Enter total amount..."
                style={{ width: '100%', padding: '11px 16px 11px 36px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
                onBlur={e => e.target.style.borderColor = 'var(--border)'} 
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Amount will be automatically distributed across {selectedRows.length} task{selectedRows.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Description <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(optional, max 100 words)</span></div>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              placeholder="Describe this category payment..."
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
              onBlur={e => e.target.style.borderColor = 'var(--border)'} 
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: wordCount > 100 ? '#EF4444' : 'var(--text-muted)', marginTop: 4 }}>
              {wordCount}/100 words
            </div>
          </div>

          {/* Total Amount Display */}
          <div style={{ background: 'linear-gradient(135deg, #F5F3FF, #EEF2FF)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #C7D4FF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 }}>Calculated Total</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Sum of all task amounts</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7C3AED', letterSpacing: '-1px' }}>₹{calculatedTotal.toLocaleString()}</div>
            </div>
            {totalAmount > 0 && (
              <button
                onClick={distributeEvenly}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  background: '#fff',
                  border: '1.5px solid #C7D4FF',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#7C3AED',
                  cursor: 'pointer',
                }}
              >
                Distribute Evenly (₹{(totalAmount / selectedRows.length).toFixed(2)} per task)
              </button>
            )}
          </div>

          {/* Task Amount Distribution */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Amount Distribution</div>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedRows.map(row => {
                const key = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: row.memberAvatarImg ? 'transparent' : row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {row.memberAvatarImg ? (
                        <img src={row.memberAvatarImg} alt={row.memberName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : row.memberAvatar === 'ARROW_UP_ICON' ? (
                        <ArrowUpRight size={16} color="#fff" strokeWidth={2.5} />
                      ) : row.memberAvatar === 'TASK_BUDGET_ICON' ? (
                        <Wallet size={16} color="#fff" strokeWidth={2.5} />
                      ) : (
                        row.memberAvatar
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{row.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.memberName}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {row.stage && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: (row.memberIsOnHold || row.paused || row.isPaused) ? '#FFF7ED' : (STAGE_BG[row.stage] || 'var(--bg-subtle)'), color: (row.memberIsOnHold || row.paused || row.isPaused) ? '#F97316' : (STAGE_COLORS[row.stage] || 'var(--text-muted)') }}>
                          {(row.memberIsOnHold || row.paused || row.isPaused) ? 'Hold' : row.stage}
                          {/* Debug: Show hold status */}
                          {row.taskId === 'B6I41C7A' && <span style={{ fontSize: 8, marginLeft: 4 }}>({row.memberIsOnHold ? 'M' : ''}{row.paused ? 'T' : ''})</span>}
                        </span>
                      )}
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={taskAmounts[key] !== undefined ? taskAmounts[key] : 0}
                          onChange={e => handleAmountChange(key, e.target.value)}
                          style={{
                            width: 110,
                            padding: '6px 10px 6px 20px',
                            border: '1.5px solid var(--border)',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            outline: 'none',
                            background: 'var(--bg-surface)',
                            textAlign: 'right',
                          }}
                          onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleConfirm}
            disabled={calculatedTotal <= 0 || wordCount > 100}
            style={{
              padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, 
              cursor: (calculatedTotal <= 0 || wordCount > 100) ? 'not-allowed' : 'pointer',
              background: (calculatedTotal <= 0 || wordCount > 100) ? 'var(--border)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: (calculatedTotal <= 0 || wordCount > 100) ? 'var(--text-muted)' : '#fff',
              boxShadow: (calculatedTotal <= 0 || wordCount > 100) ? 'none' : '0 6px 20px #7C3AED40',
            }}
          >
            Payment
          </button>
        </div>
      </div>
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        />
      )}
    </div>
  );
}

// -- Payment Detail Panel (Right Side) ---------------------------------------
function PaymentDetailPanel({ payment, onClose }) {
  const panelRef = useRef(null);
  
  if (!payment) return null;

  // Close on click outside
  const handleDownloadPDF = () => {

    // In a real app, this would generate and download a PDF receipt
    alert('PDF download functionality would be implemented here');
  };

  return (
    <div 
      ref={panelRef}
      style={{ 
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: 'var(--bg-surface)', 
        zIndex: 1000,
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        borderLeft: '1px solid var(--border-light)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Payment Receipt</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>#{payment.taskId}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        
        {/* Status Badge */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 12,
            background: payment.isPaid ? '#ECFDF5' : '#FFF7ED',
            border: `1.5px solid ${payment.isPaid ? '#BBF7D0' : '#FED7AA'}`,
          }}>
            {payment.isPaid ? <CheckCircle size={20} color="#12C479" /> : <Clock size={20} color="#F97316" />}
            <span style={{ fontSize: 14, fontWeight: 700, color: payment.isPaid ? '#12C479' : '#F97316' }}>
              {payment.isPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>Payment Information</div>
          
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '16px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Task/Invoice ID</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>#{payment.taskId}</span>
              </div>

              {payment.title && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Task Title</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{payment.title}</span>
                </div>
              )}

              {payment.memberName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Member</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {payment.memberAvatarImg ? (
                      <img 
                        src={payment.memberAvatarImg} 
                        alt={payment.memberName}
                        style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: payment.memberColor || '#3B5BFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                        {payment.memberAvatar || payment.memberName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{payment.memberName}</span>
                  </div>
                </div>
              )}

              {payment.memberRole && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Role</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{payment.memberRole}</span>
                </div>
              )}

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Amount</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#12C479' }}>₹{payment.amount?.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Due Date</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(payment.deadline || payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {payment.isPaid && payment.paidOn && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Paid On</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#12C479' }}>
                    {new Date(payment.paidOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}

              {payment.stage && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stage</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: payment.stage === 'Complete' ? '#ECFDF5' : '#EEF2FF', color: payment.stage === 'Complete' ? '#12C479' : '#3B5BFC' }}>
                    {payment.stage}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description/Notes */}
        {(payment.description || payment.notes) && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
              {payment.description ? 'Description' : 'Notes'}
            </div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {payment.description || payment.notes}
              </p>
            </div>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownloadPDF}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(59,91,252,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Download size={18} />
          Download PDF Receipt
        </button>
      </div>
    </div>
  );
}

export default function FinancialPage({ prefilledTaskId = null, setPageFilteredData = null, filterToTaskId = null }) {
  // All admin users get full access
  const isAdminA = false;
  
  // ⭐ ALL useState declarations MUST be at the top - React Rules of Hooks
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [manualPayments, setManualPayments] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showCategoryPaymentModal, setShowCategoryPaymentModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [selectedTaskBudget, setSelectedTaskBudget] = useState(null);
  const [localDescriptionUpdates, setLocalDescriptionUpdates] = useState({});
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [prefilledTask, setPrefilledTask] = useState(null);
  const [expandedPaymentHistory, setExpandedPaymentHistory] = useState({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [hoveredDescription, setHoveredDescription] = useState(null);
  const [editingDescription, setEditingDescription] = useState(null);
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  const [filteredPage, setFilteredPage] = useState(1); // ⭐ MOVED FROM LINE 2239 - Must be at top per React Rules of Hooks
  
  // ⭐ Check if any filters are active (after state declarations)
  const hasActiveFilters = selectedCategories.length > 0 || selectedMembers.length > 0;
  
  // ⭐ OPTIMIZATION: Use paginated payments hook (loads only 15 at a time)
  // Always call hooks unconditionally - React requirement
  const hookResult = usePaginatedPayments(15);
  const appContext = useApp();
  const passwordHook = useAdminPassword();
  
  const {
    payments: paginatedPayments = [],
    tasks = [],
    currentPage: paymentsCurrentPage = 1,
    totalPages: paymentsTotalPages = 1,
    pageSize: paymentsPageSize = 15,
    loading: paymentsLoading = false,
    nextPage: paymentsNextPage = () => {},
    prevPage: paymentsPrevPage = () => {},
    goToPage: paymentsGoToPage = () => {},
    refresh: paymentsRefresh = () => {},
    showingFrom: paymentsShowingFrom = 0,
    showingTo: paymentsShowingTo = 0,
    getCacheStats = () => {},
  } = hookResult || {};
  
  const { financials = {}, STAGE_COLORS = {}, STAGE_BG = {}, markTaskPaid = () => {}, team = [], addTaskHistoryEntry = () => {}, currentUser = {}, addPaymentToTask = () => {}, markPaymentAsPaid = () => {}, updatePaymentNotes = () => {}, CATEGORIES = [], workspaceId = null, addTimelineEvent = () => {}, payments: allPayments = [] } = appContext || {};
  const { showPasswordModal = false, pendingAction = null, requestAdminPassword = () => {}, handlePasswordConfirm = () => {}, handlePasswordCancel = () => {} } = passwordHook || {};
  
  // ⭐ Workspace path for Firebase operations
  const wsPath = workspaceId ? `workspaces/${workspaceId}` : null;
  
  // ⭐ ALL useState moved to top of component - removed duplicates here
  
  // ⭐ Pagination is now handled by usePaginatedPayments hook
  // No need for currentPage and rowsPerPage state here

  // ⭐ Clean up local description updates when Firebase data arrives
  useEffect(() => {
    // Remove local updates that match Firebase data
    setLocalDescriptionUpdates(prev => {
      const newUpdates = { ...prev };
      let hasChanges = false;
      
      Object.keys(newUpdates).forEach(paymentId => {
        const payment = paginatedPayments.find(p => p.id === paymentId);
        if (payment && payment.notes === newUpdates[paymentId]) {
          delete newUpdates[paymentId];
          hasChanges = true;
        }
      });
      
      return hasChanges ? newUpdates : prev;
    });
  }, [paginatedPayments]);

  // ⭐ Auto-open Add Payment modal when navigating from Task Detail with prefilled task ID
  useEffect(() => {
    if (prefilledTaskId && !showAddPaymentModal) {

      setPrefilledTask(prefilledTaskId);
      setShowAddPaymentModal(true);
    }
  }, [prefilledTaskId]);

  // ⭐ Payment categories definition - merge with CATEGORIES from context to get images
  const PAYMENT_CATEGORIES = useMemo(() => {
    return CATEGORIES && CATEGORIES.length > 0 
      ? CATEGORIES.map(cat => ({
          label: cat.label || cat.name,
          image: cat.image || cat.icon,
          color: cat.color || '#3B5BFC',
          bg: cat.bg || '#EEF2FF',
          type: 'category'
        }))
      : [
          // Fallback if CATEGORIES not loaded
          { label: 'Domain & Hosting', color: '#3B5BFC', bg: '#EEF2FF', type: 'category' },
          { label: 'Software & Tools', color: '#7C3AED', bg: '#F5F3FF', type: 'category' },
          { label: 'Infrastructure', color: '#06B6D4', bg: '#ECFEFF', type: 'category' },
          { label: 'Marketing', color: '#F97316', bg: '#FFF7ED', type: 'category' },
          { label: 'Equipment', color: '#12C479', bg: '#ECFDF5', type: 'category' },
          { label: 'Legal', color: '#8B5CF6', bg: '#F5F3FF', type: 'category' },
          { label: 'Training', color: '#F59E0B', bg: '#FFFBEB', type: 'category' },
          { label: 'Other', color: '#6B7280', bg: '#F3F4F6', type: 'category' },
        ];
  }, [CATEGORIES]);

  // ⭐ When filters are active, use all payments from context (real-time data)
  // ⭐ When no filters, use paginated payments (15 per page)
  const paymentsToUse = hasActiveFilters ? allPayments : paginatedPayments;

  // ⭐ OPTIMIZATION: Use useMemo to prevent recalculating rows on every render
  const allRows = useMemo(() => {
    const rows = [];
    
    // ⭐ OPTIMIZATION: Only log once, not for every payment
    if (process.env.NODE_ENV === 'development') {

    }
    
    // Add payments from payments collection
    if (paymentsToUse && paymentsToUse.length > 0) {
      paymentsToUse.forEach(payment => {
        // ⭐ Handle subscription payments differently
        if (payment.isSubscriptionPayment) {

          // Format subscription payment for table
          const planName = payment.plan?.name || 'Unknown Plan';
          const billingCycle = payment.plan?.billingCycle || 'monthly';
          const expiryDate = payment.plan?.expiryDate;
          const userName = payment.userInfo?.name || 'Unknown User';
          const userEmail = payment.userInfo?.email || '';
          const userPhone = payment.userInfo?.phone || '';
          
          // Format description with billing info
          let description = `Billed ${billingCycle}`;
          if (payment.plan?.users) {
            description += ` · Up to ${payment.plan.users} users`;
          }
          if (expiryDate) {
            const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
            description += ` · Active till ${expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          }
          
          rows.push({
            paymentId: payment.id,
            taskId: 'SUBSCRIPTION',
            id: payment.paymentId || payment.orderId || payment.id,
            title: `${planName} Plan`,
            description: description,
            deadline: expiryDate ? (expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate)) : payment.createdAt,
            amount: payment.pricing?.total || 0,
            isPaid: payment.status === 'completed',
            status: payment.status === 'completed' ? 'Paid' : 'Pending',
            paidAmount: payment.status === 'completed' ? payment.pricing?.total || 0 : 0,
            profitAmount: 0,
            paymentHistory: [],
            lastPaymentAt: payment.transactionDate ? (payment.transactionDate.toDate ? payment.transactionDate.toDate() : payment.transactionDate) : null,
            lastPaymentAmount: payment.pricing?.total || 0,
            lastPaymentBy: userName,
            paidOn: payment.status === 'completed' ? (payment.transactionDate ? (payment.transactionDate.toDate ? payment.transactionDate.toDate() : payment.transactionDate) : null) : null,
            paidBy: userName,
            isCategoryPayment: false,
            createdOn: payment.transactionDate ? (payment.transactionDate.toDate ? payment.transactionDate.toDate() : payment.transactionDate) : payment.createdAt,
            assignedTo: [],
            createdBy: payment.userId || null,
            isManual: false,
            taskStage: 'Completed',
            memberIsOnHold: false,
            stage: 'Completed',
            paused: false,
            isPaused: false,
            paymentType: 'subscription',
            memberName: userName,
            memberId: payment.userId || null,
            memberRole: 'Subscription',
            memberAvatar: '💳',
            memberAvatarImg: null,
            // Additional subscription-specific fields
            isSubscriptionPayment: true,
            subscriptionInfo: {
              plan: planName,
              billingCycle: billingCycle,
              email: userEmail,
              phone: userPhone,
              coupon: payment.coupon || null,
              previousPlan: payment.previousPlan || null,
            }
          });

          return; // Skip regular payment processing
        }
        
        // Get task details for regular payments
        const task = tasks.find(t => t.id === payment.taskId);
        
        // ⭐ Debug: Log the newest payment to verify title field
        if (payment.id === 'm1uheZTtervAPHDA9XqS') {

        }
        
        // ⭐ Debug: Log paused status for task B6I41C7A
        if (payment.taskId === 'B6I41C7A') {

        }
        
        // Create a row for each payment
        rows.push({
        paymentId:   payment.id, // ⭐ UNIQUE KEY - use this for React key
        taskId:      payment.taskId,
        id:          payment.taskId, // Show Task ID in table (not payment ID)
        title:       payment.title || payment.taskTitle || task?.title || 'Unknown Task', // ⭐ Use user-entered title (don't fallback to notes to avoid duplication with description)
        // ⭐ Use local update if available, otherwise use payment notes (no fallback to task description)
        description: localDescriptionUpdates[payment.id] !== undefined 
          ? localDescriptionUpdates[payment.id] 
          : (payment.notes || ''), // ⭐ Only show user-entered notes, don't fallback to task description
        deadline:    payment.dueDate || task?.deadline || payment.createdAt || new Date(), // ⭐ Use dueDate first, then task deadline, then createdAt
        amount:      payment.amount || 0,
        isPaid:      payment.status === 'Paid',
        status:      payment.status,
        paidAmount:  payment.paidAmount || 0, // ⭐ Track paid amount for task budget
        profitAmount: payment.profitAmount || 0, // ⭐ Track profit amount for task budget
        paymentHistory: payment.paymentHistory || [], // ⭐ All payment entries
        lastPaymentAt: payment.lastPaymentAt ? (payment.lastPaymentAt.toDate ? payment.lastPaymentAt.toDate() : payment.lastPaymentAt) : null, // ⭐ Last payment timestamp
        lastPaymentAmount: payment.lastPaymentAmount || 0, // ⭐ Last payment amount
        lastPaymentBy: payment.lastPaymentBy || null, // ⭐ Who made last payment
        paidOn:      payment.paidAt ? (payment.paidAt.toDate ? payment.paidAt.toDate() : payment.paidAt) : null,
        paidBy:      payment.paidBy || null, // ⭐ Track who paid
        isCategoryPayment: payment.isCategoryPayment || false, // ⭐ Track if paid via category button
        createdOn:   payment.createdAt ? (payment.createdAt.toDate ? payment.createdAt.toDate() : payment.createdAt) : null,
        assignedTo:  payment.assignedTo || [],
        createdBy:   payment.createdBy,
        isManual:    false,
        taskStage:   task?.stage || 'Unknown',
        // ⭐ Check if the specific member assigned to this payment is on hold
        memberIsOnHold: (() => {
          const memberId = payment.memberId || payment.assignedTo?.[0]?.id;
          if (!memberId || !task) return false;
          const taskMember = task.members?.find(m => m.id === memberId);
          const isOnHold = taskMember?.isOnHold || false;
          
          // ⭐ Debug: Log for task B6I41C7A
          if (payment.taskId === 'B6I41C7A') {

          }
          
          return isOnHold;
        })(),
        // ⭐ Show member-specific stage if member is assigned, otherwise show task stage
        stage:       (() => {
          const memberId = payment.memberId || payment.assignedTo?.[0]?.id;
          if (!memberId || !task) return task?.stage || payment.stage || '';
          const taskMember = task.members?.find(m => m.id === memberId);
          return taskMember?.stage || task?.stage || payment.stage || '';
        })(),
        paused:      task?.paused || false, // ⭐ Track if entire task is paused
        isPaused:    task?.isPaused || false, // ⭐ Track if entire task is paused (alternate property)
        paymentType: payment.paymentType || 'member', // ⭐ Track payment type
        // For display purposes - show task title if linked to task, otherwise show "Additional Payment" for investment
        memberName:  payment.paymentType === 'task-budget'
          ? 'Task Budget'
          : payment.paymentType === 'additional' 
          ? 'Additional Payment'
          : !payment.memberId && payment.taskId && payment.taskId !== 'PAYMENT' && task
            ? task.title // ⭐ Show task title for investment payments linked to tasks
            : !payment.memberId && (!payment.taskId || payment.taskId === 'PAYMENT')
              ? 'Additional Payment' // ⭐ Show "Additional Payment" for investment payments without task
              : (payment.memberName || payment.assignedTo?.[0]?.name || 'Unassigned'),
        memberId:    payment.memberId || payment.assignedTo?.[0]?.id || null,
        memberRole:  payment.paymentType === 'task-budget'
          ? 'Task Budget'
          : payment.paymentType === 'additional'
          ? 'Additional'
          : !payment.memberId && payment.taskId && payment.taskId !== 'PAYMENT' && task
            ? 'Task Payment' // ⭐ Show "Task Payment" role for investment payments linked to tasks
            : !payment.memberId && (!payment.taskId || payment.taskId === 'PAYMENT')
              ? 'Investment' // ⭐ Show "Investment" role for payments without task
              : (() => {
              const memberId = payment.memberId || payment.assignedTo?.[0]?.id;
              // ⭐ For manual payments (no task), get role from team array
              if (!task || payment.isManualPayment) {
                const teamMember = team.find(m => m.id === memberId);
                return teamMember?.role || payment.assignedTo?.[0]?.role || 'Team Member';
              }
              // For task-linked payments, get role from task members
              const taskMember = task.members?.find(m => m.id === memberId);
              return taskMember?.role || 'Team Member';
            })(),
        // ⭐ Load avatar from team data (global) or task members
        memberAvatar: payment.paymentType === 'task-budget'
          ? 'TASK_BUDGET_ICON' // ⭐ Special marker for task budget icon
          : payment.paymentType === 'additional'
          ? 'ARROW_UP_ICON' // ⭐ Special marker for ArrowUpRight icon in circle
          : !payment.memberId && payment.taskId && payment.taskId !== 'PAYMENT' && task
            ? '📋' // ⭐ Show task icon for investment payments linked to tasks
            : !payment.memberId && (!payment.taskId || payment.taskId === 'PAYMENT')
              ? 'ARROW_UP_ICON' // ⭐ Special marker for ArrowUpRight icon in circle
              : (() => {
              const memberId = payment.memberId || payment.assignedTo?.[0]?.id;
              const teamMember = team.find(m => m.id === memberId);
              const taskMember = task?.members?.find(m => m.id === memberId);
              return teamMember?.avatar || taskMember?.avatar || '?';
            })(),
        memberAvatarImg: payment.paymentType === 'task-budget'
          ? null
          : payment.paymentType === 'additional'
          ? null
          : !payment.memberId && (payment.taskId && payment.taskId !== 'PAYMENT' || !payment.taskId)
            ? null // ⭐ No avatar image for investment payments (use emoji)
            : (() => {
              const memberId = payment.memberId || payment.assignedTo?.[0]?.id;
              const teamMember = team.find(m => m.id === memberId);
              const taskMember = task?.members?.find(m => m.id === memberId);
              return teamMember?.avatarImg || taskMember?.avatarImg || null;
            })(),
        memberColor:  payment.paymentType === 'task-budget'
          ? '#7C3AED' // ⭐ Purple color for task budget
          : payment.paymentType === 'additional'
          ? '#12C479' // ⭐ Green color for additional payments
          : !payment.memberId && payment.taskId && payment.taskId !== 'PAYMENT' && task
            ? '#3B5BFC' // ⭐ Blue color for task-linked investment payments
            : !payment.memberId && (!payment.taskId || payment.taskId === 'PAYMENT')
              ? '#12C479' // ⭐ Green color for investment payments without task
              : (task?.members?.find(m => m.id === (payment.memberId || payment.assignedTo?.[0]?.id))?.color || '#6B7280'),
        // ⭐ Assigned By - use payment creator, then task creator, then current user
        assignedBy:  payment.createdBy?.name || 
                     task?.createdBy?.name || 
                     (typeof task?.createdBy === 'string' ? task?.createdBy : null) ||
                     currentUser?.name || 
                     'Admin',
        assignedRole: payment.createdBy?.role || 
                      payment.createdBy?.userRole || 
                      task?.createdBy?.role || 
                      task?.createdBy?.userRole || 
                      currentUser?.role || 
                      'Admin',
        // ⭐ Map category to full category object with icon, color, bg
        category:    task?.category ? (() => {
          const categoryMatch = PAYMENT_CATEGORIES.find(c => c.label === task.category || c.label === task.category?.label);
          return categoryMatch || (typeof task.category === 'object' ? task.category : null);
        })() : null,
      });
    });
  }
  
  if (process.env.NODE_ENV === 'development') {

  }

  // Add manual payments (keep existing manual payment logic for backward compatibility)
  manualPayments.forEach(payment => {
    if (payment.paymentType === 'investment') {
      // Investment payment - map category to get icon/image
      const categoryMatch = PAYMENT_CATEGORIES.find(c => c.label === payment.investmentCategory);
      
      rows.push({
        id:         payment.taskId,
        taskId:     payment.taskId,
        paymentId:  payment.id,
        title:      payment.description,
        description: payment.notes || payment.description,
        deadline:   payment.dueDate,
        memberName: payment.investmentCategory,
        memberId:   null,
        memberRole: 'Investment',
        memberAvatar: categoryMatch?.image || categoryMatch?.icon || '💰',
        memberAvatarImg: categoryMatch?.image || null,
        memberColor:  categoryMatch?.color || '#F97316',
        stage:      '', // Manual investment payment - no stage
        amount:     payment.amount,
        isPaid:     payment.isPaid,
        status:     payment.isPaid ? 'Paid' : 'Unpaid',
        taskStage:  '', // Manual investment payment - no task stage
        isManual:   true,
        isInvestment: true,
        manualId:   payment.id,
        assignedBy: payment.assignedBy || (() => { try { return currentUser?.name || 'Admin'; } catch { return 'Admin'; } })(),
        assignedRole: payment.assignedRole || 'Admin',
        paidOn:     payment.paidOn || null,
      });
    } else {
      // Team member payment - Load full profile data
      // ⭐ First try to get data from payment.assignedTo (saved profile data)
      // Then fall back to team array (current profile data)
      const paymentMember = payment.assignedTo?.[0];
      const teamMember = team.find(m => m.id === payment.memberId);
      const member = teamMember; // Always use current team data for latest profile
      
      if (member) {
        rows.push({
          id:         payment.taskId,
          taskId:     payment.taskId,
          paymentId:  payment.id,
          title:      payment.taskTitle || payment.description,
          description: payment.notes || payment.description,
          deadline:   payment.dueDate,
          memberName: member.name,
          memberId:   member.id,
          memberRole: member.role,
          memberAvatar: member.avatar,
          memberAvatarImg: member.avatarImg || paymentMember?.avatarImg || null, // ⭐ Use current or saved avatar
          memberColor:  member.color,
          stage:      '', // Manual member payment - no stage
          amount:     payment.amount,
          isPaid:     payment.isPaid,
          status:     payment.isPaid ? 'Paid' : 'Unpaid',
          taskStage:  '', // Manual member payment - no task stage
          isManual:   true,
          isInvestment: false,
          manualId:   payment.id,
          assignedBy: payment.assignedBy || (() => { try { return currentUser?.name || 'Admin'; } catch { return 'Admin'; } })(),
          assignedRole: payment.assignedRole || 'Admin',
          paidOn:     payment.paidOn || null,
        });
      }
    }
  });
  
  return rows;
  }, [paymentsToUse, tasks, team, manualPayments, localDescriptionUpdates, PAYMENT_CATEGORIES, currentUser, hasActiveFilters]);

  // ═══════════════════════════════════════════════════════════════
  // FILTER LOGIC - Wrapped in useMemo to prevent infinite re-renders
  // ═══════════════════════════════════════════════════════════════
  
  const { filtered, sorted, finalFiltered, totalPaid, totalPending, totalBudget, paidRate } = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {

    }
    
    let filtered = allRows;
    
    // STEP 1: Filter by Category/Role (if selected)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(row => {
        return selectedCategories.some(cat => {
          if (cat.type === 'category') {
            // ⭐ Check task category (not investment category)
            if (row.category && row.category.label === cat.label) {
              return true;
            }
            // Also check investment category for manual payments
            if (row.isInvestment && row.memberName === cat.label) {
              return true;
            }
            return false;
          } else if (cat.type === 'role') {
            // ⭐ Member role match - works for both manual and task-linked payments
            return !row.isInvestment && row.memberRole === cat.label;
          }
          return false;
        });
      });
      if (process.env.NODE_ENV === 'development') {

      }
    }
    
    // STEP 2: Filter by Team Member (if selected) - AND logic with category filter
    if (selectedMembers.length > 0) {
      filtered = filtered.filter(row => {
        return selectedMembers.some(memberId => {
          if (memberId === 'Investment') {
            // ⭐ Show only additional payments (not investment categories)
            return row.paymentType === 'additional';
          }
          if (memberId === 'TaskBudget') {
            // ⭐ Show only task budget payments
            return row.paymentType === 'task-budget';
          }
          return row.memberId === memberId;
        });
      });
      if (process.env.NODE_ENV === 'development') {

      }
    }
    
    // STEP 3: Filter by Date Range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(row => {
        // Get the date to check (deadline or createdOn)
        let dateToCheck = row.deadline || row.createdOn;
        
        // Skip if no date
        if (!dateToCheck) {

          return true; // Include rows without dates
        }
        
        // Convert Firestore timestamp to Date
        if (dateToCheck.toDate) {
          dateToCheck = dateToCheck.toDate();
        }
        
        // Parse to Date object
        const rowDate = new Date(dateToCheck);
        rowDate.setHours(0, 0, 0, 0);
        
        // Validate date
        if (isNaN(rowDate.getTime())) {

          return true; // Include rows with invalid dates
        }
        
        // Check date range
        let matches = true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matches = matches && rowDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matches = matches && rowDate <= toDate;
        }
        
        return matches;
      });

    }
    
    // STEP 4: Filter by Status (All/Pending/Paid)
    if (process.env.NODE_ENV === 'development') {

    }
    
    if (statusFilter === 'Pending') {
      filtered = filtered.filter(row => !row.isPaid);

    } else if (statusFilter === 'Paid') {
      filtered = filtered.filter(row => row.isPaid);

    } else {
      // ⭐ "All" - show everything (no filtering)
      if (process.env.NODE_ENV === 'development') {

      }
    }
    
    // STEP 5: Sort by due date (deadline) - Latest due date first
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.deadline || a.createdOn);
      const dateB = new Date(b.deadline || b.createdOn);
      return dateB - dateA; // Latest due date first (descending)
    });
    
    // STEP 6: Apply search filter if filterToTaskId is provided (show only that task)
    let finalFiltered = sorted;
    if (filterToTaskId) {
      finalFiltered = sorted.filter(row => row.taskId === filterToTaskId || row.id === filterToTaskId);
    }
    
    if (process.env.NODE_ENV === 'development') {

    }
    
    // Calculate totals from filtered results
    // ⭐ Total Paid = ONLY paid amounts (not pending)
    const totalPaid    = filtered.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0);
    const totalPending = filtered.filter(r => !r.isPaid).reduce((s, r) => s + r.amount, 0);
    
    // ⭐ CRITICAL FIX: Calculate actual task budgets from tasks, not from payments
    // Total Budget = Sum of all member budgets assigned in tasks
    const totalBudget = tasks.reduce((sum, task) => {
      if (!task.members || task.members.length === 0) return sum;
      const taskMemberBudgets = task.members.reduce((memberSum, member) => {
        return memberSum + (member.budget || 0);
      }, 0);
      return sum + taskMemberBudgets;
    }, 0);
    
    const paidRate     = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

    if (process.env.NODE_ENV === 'development') {

    }
    
    return { filtered, sorted, finalFiltered, totalPaid, totalPending, totalBudget, paidRate };
  }, [allRows, selectedCategories, selectedMembers, dateFrom, dateTo, statusFilter, filterToTaskId]);

  // ⭐ STEP 6: Client-side pagination for filtered results
  // ⭐ filteredPage state MOVED TO TOP (line ~1645) - React Rules of Hooks requirement
  const filteredPageSize = 15;
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setFilteredPage(1);
  }, [selectedCategories, selectedMembers, statusFilter, dateFrom, dateTo, filterToTaskId]);
  
  // Apply client-side pagination to filtered results
  const paginatedFiltered = hasActiveFilters || filterToTaskId
    ? finalFiltered.slice((filteredPage - 1) * filteredPageSize, filteredPage * filteredPageSize)
    : finalFiltered; // No pagination needed when using Firestore pagination
  
  const filteredTotalPages = hasActiveFilters || filterToTaskId
    ? Math.ceil(finalFiltered.length / filteredPageSize)
    : paymentsTotalPages;
  
  if (process.env.NODE_ENV === 'development' && (hasActiveFilters || filterToTaskId)) {

  }

  // ⭐ Only include unpaid rows for selection (exclude paid entries and task-budget)
  const selectableRows = paginatedFiltered.filter((r) => r.paymentType !== 'task-budget' && !r.isPaid);
  const selectedAmount = selectedRows.reduce((sum, row) => sum + row.amount, 0);
  
  // Update filtered data for search - use FULL filtered data, not just paginated
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ tasks: filtered }); // Search all filtered payments, not just current page
    }
  }, [filtered.length, selectedCategories.length, selectedMembers.length, statusFilter, dateFrom, dateTo, filterToTaskId, setPageFilteredData]);

  // Get unique roles from team members
  const roles = [...new Set(team.map(m => m.role))].sort();
  const roleOptions = roles.map(role => ({ label: role, color: '#3B5BFC', bg: '#EEF2FF', type: 'role' }));
  
  // Combined filter options
  const filterOptions = [...PAYMENT_CATEGORIES, ...roleOptions];

  const categoryDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (option) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.label === option.label);
      if (exists) {
        return prev.filter(c => c.label !== option.label);
      } else {
        return [...prev, option];
      }
    });
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const clearMemberFilters = () => {
    setSelectedMembers([]);
  };

  const toggleRow = (row) => {
    // ⭐ Allow selection of paid rows, but they won't be included in payment actions
    // if (row.isPaid) return; // REMOVED: Now paid rows can be selected
    if (row.paymentType === 'task-budget') return; // ⭐ Can't select task budget entries for category payment
    // ⭐ Use paymentId for unique identification
    const rowId = row.paymentId || `${row.id}-${row.memberName}-${row.memberId}`;
    const isSelected = selectedRows.some(r => {
      const rId = r.paymentId || `${r.id}-${r.memberName}-${r.memberId}`;
      return rId === rowId;
    });
    if (isSelected) {
      setSelectedRows(prev => prev.filter(r => {
        const rId = r.paymentId || `${r.id}-${r.memberName}-${r.memberId}`;
        return rId !== rowId;
      }));
    } else {
      setSelectedRows(prev => [...prev, row]);
    }
  };

  const toggleAll = () => {
    // ⭐ Select/deselect only unpaid rows (exclude paid entries and task-budget)
    const selectableRows = paginatedFiltered.filter((row) => row.paymentType !== 'task-budget' && !row.isPaid);
    if (selectedRows.length === selectableRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...selectableRows]);
    }
  };

  const handlePayment = async (notes) => {
    const paidTimestamp = new Date().toISOString();
    // ⭐ Filter out any paid rows before processing (only process unpaid rows)
    const unpaidRows = selectedRows.filter(r => !r.isPaid);
    const count = unpaidRows.length;
    const totalAmount = unpaidRows.reduce((s, r) => s + r.amount, 0);
    
    // ⭐ Store selected rows before clearing (important for async processing)
    const rowsToProcess = [...unpaidRows];
    
    // ⭐ Close modal first
    setShowPaymentModal(false);
    setSelectedRows([]);
    
    // ⭐ Show loading overlay immediately after modal closes
    setTimeout(() => {
      setShowLoadingOverlay(true);
      
      // ⭐ Process payments AFTER animation starts (to avoid lag)
      setTimeout(async () => {
        
        // ⭐ PHASE 5: Mark payments as paid using new payment system
        const paymentIds = rowsToProcess.filter(r => !r.isManual && r.paymentId).map(r => r.paymentId);
        
        // Mark each payment as paid and update description if notes provided
        for (const paymentId of paymentIds) {
          const row = rowsToProcess.find(r => r.paymentId === paymentId);
          if (row) {
            await markPaymentAsPaid(paymentId, row.taskId, row.amount);
            
            // If notes provided, update payment description for all selected payments
            if (notes && notes.trim()) {
              await updatePaymentNotes(paymentId, notes.trim());
            }
          }
        }
        
        // Mark manual payments as paid (backward compatibility)
        const manualIds = rowsToProcess.filter(r => r.isManual).map(r => r.manualId);
        if (manualIds.length > 0) {
          setManualPayments(prev => prev.map(p => 
            manualIds.includes(p.id) ? { 
              ...p, 
              isPaid: true, 
              paidOn: paidTimestamp,
              notes: notes && notes.trim() ? notes.trim() : p.notes // ⭐ Update description
            } : p
          ));
        }
        
        // ⭐ Refresh pagination to show updated data
        setTimeout(() => {
          paymentsRefresh();
        }, 500);

        // Loading overlay will auto-hide after animation completes
        notify.paymentsProcessed(count, `₹ ${totalAmount.toLocaleString()} marked as paid`);
      }, 100); // Start processing after 100ms (animation has started)
    }, 150); // Show overlay after 150ms (modal has closed)
  };

  const handleAddPayment = async (paymentData) => {

    // ⭐ Generate unique payment ID (not taskId)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generatedTaskId = 'PAY-';
    for (let i = 0; i < 8; i++) generatedTaskId += chars[Math.floor(Math.random() * chars.length)];

    const linkedTaskId = paymentData.taskId?.trim();
    const linkedTask = linkedTaskId ? tasks.find(t => t.id === linkedTaskId) : null;

    // ⭐ Create payment entry in Firebase (works WITHOUT taskId)
    if (paymentData.paymentType === 'member' && paymentData.memberId) {

      // Team member payment - create in Firebase
      // ⭐ Use == instead of === to handle type coercion (string vs number)
      const member = team.find(m => m.id == paymentData.memberId);

      if (member) {
        // ⭐ Build payment object with task data if linked
        const payment = {
          // ⭐ Use "PAYMENT" as default taskId if no task is linked
          taskId: linkedTaskId || 'PAYMENT',
          taskTitle: linkedTask?.title || paymentData.taskTitle || null, // ⭐ Store actual task title for reference
          amount: paymentData.amount,
          dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0],
          memberId: member.id,
          memberName: member.name,
          memberUid: member.uid || null,
          title: paymentData.description && paymentData.description.trim() ? paymentData.description.trim() : 'Payment', // ⭐ User-entered title (default to 'Payment')
          notes: paymentData.notes && paymentData.notes.trim() ? paymentData.notes.trim() : '', // ⭐ User-entered notes (empty string if not provided)
          paymentType: 'member',
          status: 'Pending',
          isPaid: false,
          isManualPayment: !linkedTaskId, // ⭐ Flag to identify manual payments without task
          assignedTo: [{
            id: member.id,
            name: member.name,
            uid: member.uid || null,
            role: member.role || 'Member',
            email: member.email || null,
            avatarImg: member.avatarImg || null,
            phone: member.phone || null,
            status: member.status || 'Active'
          }],
          createdBy: {
            uid: currentUser?.uid || null,
            name: currentUser?.name || 'Admin',
            role: currentUser?.role || 'admin',
            userRole: currentUser?.userRole || 'admin',
            memberId: currentUser?.memberId || null
          },
          // ⭐ Include task data if linked to a task (from linkedTask or paymentData)
          ...(linkedTask && {
            category: linkedTask.category || paymentData.taskCategory || null,
            categoryLabel: linkedTask.categoryLabel || null,
            tags: linkedTask.tags || paymentData.taskTags || [],
            stage: linkedTask.stage || paymentData.taskStage || null,
            priority: linkedTask.priority || null,
            deadline: linkedTask.deadline || paymentData.taskDeadline || null,
            description: linkedTask.description || null, // ⭐ Task description (separate from payment notes)
            taskMembers: linkedTask.members || [],
            taskCreatedBy: linkedTask.createdBy || null,
            taskCreatedAt: linkedTask.createdAt || null
          })
        };

        // ⭐ Add payment to Firebase
        try {

          // ⭐ Pass "PAYMENT" as taskId if no task is linked (manual payment)
          await addPaymentToTask(linkedTaskId || 'PAYMENT', payment);

          // Add task history if linked to task
          if (linkedTask) {

            addTaskHistoryEntry(linkedTaskId, {
              stage: linkedTask.stage,
              date: new Date(),
              user: currentUser?.name || 'Admin',
              action: 'payment_added',
              note: `Manual payment added: ₹${paymentData.amount.toLocaleString()} for ${member.name}`,
            });
          }
          
          notify.paymentAdded(`₹${paymentData.amount.toLocaleString()} — ${member.name}`);
          
          // ⭐ Close modal first
          setShowAddPaymentModal(false);
          
          // ⭐ Wait for Firebase real-time listener to sync the new payment

          setTimeout(() => {

            paymentsRefresh(); // This clears cache and loads page 1
          }, 1500); // 1.5 seconds should be enough for Firebase real-time listener
        } catch (error) {

          notify.error('Failed to add payment: ' + error.message);
        }
      } else {

      }
    } else if (paymentData.paymentType === 'investment') {

      // ⭐ Investment/company expense - also create in Firebase
      const payment = {
        // ⭐ Use "PAYMENT" as default taskId if no task is linked
        taskId: linkedTaskId || 'PAYMENT',
        taskTitle: linkedTask?.title || paymentData.taskTitle || null, // ⭐ Store actual task title for reference
        amount: paymentData.amount,
        dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0],
        memberId: null,
        memberName: paymentData.investmentCategory || 'Investment',
        memberUid: null,
        title: paymentData.description && paymentData.description.trim() ? paymentData.description.trim() : 'Payment', // ⭐ User-entered title (default to 'Payment')
        notes: paymentData.notes && paymentData.notes.trim() ? paymentData.notes.trim() : '', // ⭐ User-entered notes (empty string if not provided)
        paymentType: linkedTaskId ? 'additional' : 'investment', // ⭐ Use 'additional' if linked to task, 'investment' if standalone
        investmentCategory: paymentData.investmentCategory,
        status: 'Pending',
        isPaid: false,
        isManualPayment: !linkedTaskId,
        assignedTo: [], // ⭐ Empty array - not assigned to any users
        createdBy: {
          uid: currentUser?.uid || null,
          name: currentUser?.name || 'Admin',
          role: currentUser?.role || 'admin',
          userRole: currentUser?.userRole || 'admin',
          memberId: currentUser?.memberId || null
        },
        // ⭐ Include task data if linked to a task (from linkedTask or paymentData)
        ...(linkedTask && {
          category: linkedTask.category || paymentData.taskCategory || null,
          categoryLabel: linkedTask.categoryLabel || null,
          tags: linkedTask.tags || paymentData.taskTags || [],
          stage: linkedTask.stage || paymentData.taskStage || null,
          priority: linkedTask.priority || null,
          deadline: linkedTask.deadline || paymentData.taskDeadline || null,
          description: linkedTask.description || null, // ⭐ Task description (separate from payment notes)
          taskMembers: linkedTask.members || [],
          taskCreatedBy: linkedTask.createdBy || null,
          taskCreatedAt: linkedTask.createdAt || null
        })
      };

      try {

        // ⭐ Pass "PAYMENT" as taskId if no task is linked (manual payment)
        await addPaymentToTask(linkedTaskId || 'PAYMENT', payment);

        if (linkedTask) {
          addTaskHistoryEntry(linkedTaskId, {
            stage: linkedTask.stage,
            date: new Date(),
            user: currentUser?.name || 'Admin',
            action: 'payment_added',
            note: `Investment payment added: ₹${paymentData.amount.toLocaleString()} — ${paymentData.investmentCategory}`,
          });
        }
        
        notify.paymentAdded(`₹${paymentData.amount.toLocaleString()} — ${paymentData.investmentCategory || 'Investment'}`);
        setShowAddPaymentModal(false);
        
        // ⭐ Wait for Firebase real-time listener to sync the new payment

        setTimeout(() => {

          paymentsRefresh(); // This clears cache and loads page 1
        }, 1500); // 1.5 seconds should be enough for Firebase real-time listener
      } catch (error) {

        notify.error('Failed to add payment: ' + error.message);
      }
    } else {

    }
  };

  const handleDescriptionEdit = (rowKey, currentDescription) => {
    setEditingDescription(rowKey);
    setEditDescriptionValue(currentDescription || '');
  };

  const handleDescriptionSave = async (row) => {
    const savedValue = editDescriptionValue; // Save the value before clearing
    
    // ⭐ Close the edit box immediately for better UX
    setEditingDescription(null);
    setEditDescriptionValue('');
    
    if (row.isManual) {
      // Update manual payment description
      setManualPayments(prev => prev.map(p => 
        p.id === row.manualId ? { ...p, notes: savedValue } : p
      ));
    } else {
      // ⭐ Optimistic update - update UI immediately
      if (row.paymentId) {
        setLocalDescriptionUpdates(prev => ({
          ...prev,
          [row.paymentId]: savedValue
        }));
        
        // Update in Firebase (async) - don't await to avoid blocking
        updatePaymentNotes(row.paymentId, savedValue).then(success => {
          if (!success) {
            // Revert on failure
            setLocalDescriptionUpdates(prev => {
              const newUpdates = { ...prev };
              delete newUpdates[row.paymentId];
              return newUpdates;
            });
            notify.error('Failed to update description');
          }
        });
      }
    }
  };

  const handleDescriptionCancel = () => {
    setEditingDescription(null);
    setEditDescriptionValue('');
  };

  const handleCategoryPayment = async (categoryData) => {
    // Show loading overlay
    setShowLoadingOverlay(true);
    
    try {
      const paidTimestamp = new Date();
      
      // ⭐ Update each payment with new amount and description
      for (const task of categoryData.tasks) {
        const paymentId = task.paymentId;
        const newAmount = task.categoryAmount;
        
        if (paymentId && newAmount > 0) {
          
          // ⭐ Update payment amount and description in Firebase
          await updateDoc(doc(db, `${wsPath}/payments`, paymentId), {
            amount: newAmount,
            notes: categoryData.description || '',
            status: 'Paid',
            isPaid: true,
            paidAt: serverTimestamp(),
            paidAmount: newAmount,
            paidBy: {
              uid: currentUser?.uid || null,
              name: currentUser?.name || 'Admin',
              userRole: currentUser?.userRole || 'admin'
            },
            // ⭐ Mark as category payment to show icon in "Paid On" column
            isCategoryPayment: true,
            categoryPaymentIcon: '🏷️'
          });
          
          // ⭐ Update local state immediately for instant UI update
          setLocalDescriptionUpdates(prev => ({
            ...prev,
            [paymentId]: categoryData.description || ''
          }));
          
          // Add timeline event
          await addTimelineEvent(task.taskId, {
            eventType: "payment_completed",
            description: `${currentUser?.name || 'Admin'} processed category payment (₹${newAmount.toLocaleString()})`,
            paymentId: paymentId,
            paymentAmount: newAmount
          });
        }
      }
      
      // Clear selection and close modal
      setSelectedRows([]);
      setShowCategoryPaymentModal(false);
      
      // ⭐ Refresh pagination to show updated data
      setTimeout(() => {
        paymentsRefresh();
      }, 1500);

      // Loading overlay will auto-hide after animation completes
      notify.paymentsProcessed(categoryData.tasks.length, `₹${categoryData.totalAmount.toLocaleString()} processed via category payment`);
    } catch (error) {

      notify.error('Failed to process category payment');
      setShowLoadingOverlay(false);
    }
  };

  const handleAddBudget = async (receivedAmount) => {
    if (!selectedTaskBudget || !wsPath) {
      notify.error('Unable to update task budget');
      return;
    }

    try {
      const paymentId = selectedTaskBudget.paymentId;
      const totalBudget = selectedTaskBudget.amount || 0;
      const currentPaidAmount = selectedTaskBudget.paidAmount || 0;
      const isPaid = selectedTaskBudget.isPaid || false;
      
      const newPaidAmount = currentPaidAmount + receivedAmount;
      const isNowFullyPaid = newPaidAmount >= totalBudget;
      const profitAmount = newPaidAmount > totalBudget ? newPaidAmount - totalBudget : 0;

      // Create payment history entry
      const paymentHistoryEntry = {
        amount: receivedAmount,
        timestamp: new Date().toISOString(),
        paidBy: {
          uid: currentUser?.uid || null,
          name: currentUser?.name || 'Admin',
          userRole: currentUser?.userRole || 'admin'
        },
        type: isPaid ? 'profit' : 'payment',
      };

      // Get existing payment history or create new array
      const existingHistory = selectedTaskBudget.paymentHistory || [];
      const updatedHistory = [...existingHistory, paymentHistoryEntry];

      // Update main payment document with payment history array
      await updateDoc(doc(db, `${wsPath}/payments`, paymentId), {
        paidAmount: newPaidAmount,
        isPaid: isNowFullyPaid,
        status: isNowFullyPaid ? 'Paid' : 'Pending',
        paymentHistory: updatedHistory, // ⭐ Store all payment entries in an array
        lastPaymentAt: serverTimestamp(), // ⭐ Track when last payment was received
        lastPaymentAmount: receivedAmount, // ⭐ Track last payment amount
        lastPaymentBy: {
          uid: currentUser?.uid || null,
          name: currentUser?.name || 'Admin',
          userRole: currentUser?.userRole || 'admin'
        },
        ...(isNowFullyPaid && !isPaid ? { paidAt: serverTimestamp() } : {}),
        ...(profitAmount > 0 ? { profitAmount: profitAmount } : {}),
      });

      // Add timeline event
      if (selectedTaskBudget.taskId) {
        const eventDescription = isPaid 
          ? `Task profit of ₹${receivedAmount.toLocaleString()}`
          : isNowFullyPaid
            ? `Task budget completed: ₹${receivedAmount.toLocaleString()}${profitAmount > 0 ? ` + ₹${profitAmount.toLocaleString()} profit` : ''}`
            : `Received ₹${receivedAmount.toLocaleString()} (Pending: ₹${(totalBudget - newPaidAmount).toLocaleString()})`;

        await addTimelineEvent(selectedTaskBudget.taskId, {
          eventType: isPaid ? "profit_received" : "payment_received",
          description: eventDescription,
          paymentAmount: receivedAmount,
          totalPaid: newPaidAmount,
          ...(profitAmount > 0 ? { profitAmount } : {}),
        });
      }

      const message = isPaid 
        ? `Profit recorded: ₹${receivedAmount.toLocaleString()}`
        : isNowFullyPaid
          ? `Payment completed${profitAmount > 0 ? ` with ₹${profitAmount.toLocaleString()} profit` : ''}`
          : `Payment received: ₹${receivedAmount.toLocaleString()}`;
      
      notify.success(message);

      // Close modal
      setShowAddBudgetModal(false);
      setSelectedTaskBudget(null);

      // Refresh data immediately to show updated payment history
      paymentsRefresh();
    } catch (error) {

      notify.error('Failed to record payment');
    }
  };

  // Safety check - if component is stuck, show error message
  if (!paginatedPayments && !team && !workspaceId) {
  } else {
    console.log('[FinancialPage] Data loaded - will render main content');
  }
  
  return (
    <div style={{ 
      flex: 1, 
      minHeight: 0, 
      overflow: 'visible', 
      padding: '20px 28px 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 18, 
      position: 'relative',
      visibility: 'visible',
      opacity: 1,
      width: '100%',
      height: '100%',
      background: 'var(--bg-main)'
    }}>

      {/* Show message if no data loaded at all */}
      {!paginatedPayments && !team && !workspaceId ? (
        <>
        {console.log('[FinancialPage] Rendering loading state - no data available')}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: 40
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '4px solid var(--border-light)', 
            borderTopColor: '#3B5BFC', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Loading financial data...
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        </>
      ) : (
        <>
        {console.log('[FinancialPage] Rendering main content - data available')}
      {/* -- Payments table -- */}
      <div style={{ 
        background: 'var(--bg-surface)', 
        borderRadius: 18, 
        border: '1.5px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        minHeight: 400, 
        maxHeight: '100%', 
        overflow: 'hidden',
        visibility: 'visible',
        width: '100%'
      }}>

        {/* Table toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1.5px solid var(--border-light)',
          background: 'var(--bg-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ height: 32, width: '1px', background: 'var(--border)' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Pending', 'Paid'].map(status => (
                <button key={status} onClick={() => setStatusFilter(status)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: statusFilter === status ? 'none' : '1.5px solid var(--border)',
                  background: statusFilter === status ? (status === 'Pending' ? '#F97316' : status === 'Paid' ? '#12C479' : '#3B5BFC') : 'var(--bg-surface)',
                  color: statusFilter === status ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                }}>{status}</button>
              ))}
            </div>
            <div style={{ height: 32, width: '1px', background: 'var(--border)' }} />
            {dateRangeFilter === 'custom' ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowDateDropdown(p => !p)}
                  style={{ padding: '6px 10px', borderRadius: 10, border: '1.5px solid #3B5BFC', background: '#EEF2FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color="#3B5BFC" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>{dateFrom} – {dateTo}</span>
                  <button onClick={(e) => { 
                    e.stopPropagation(); 
                    const today = new Date();
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]); 
                    setDateTo(today.toISOString().split('T')[0]); 
                    setDateRangeFilter('30days'); 
                    setShowDateDropdown(false); 
                  }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#3B5BFC', fontSize: 14, lineHeight: 1 }}>×</button>
                </button>
                {showDateDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 14, zIndex: 200, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FROM</label>
                      <input type="date" value={tempDateFrom} onChange={e => setTempDateFrom(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', background: 'var(--input-bg)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TO</label>
                      <input type="date" value={tempDateTo} onChange={e => setTempDateTo(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', background: 'var(--input-bg)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <button disabled={!tempDateFrom || !tempDateTo}
                      onClick={() => { setDateFrom(tempDateFrom); setDateTo(tempDateTo); setDateRangeFilter('custom'); setShowDateDropdown(false); }}
                      style={{ padding: '7px', background: tempDateFrom && tempDateTo ? '#3B5BFC' : '#E8EAEF', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: tempDateFrom && tempDateTo ? '#fff' : '#9CA3AF', cursor: tempDateFrom && tempDateTo ? 'pointer' : 'not-allowed' }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[
                  { label: 'All', value: 'all' },
                  { label: '7 Days', value: '7days' },
                  { label: '30 Days', value: '30days' },
                ].map(range => (
                  <button
                    key={range.value}
                    onClick={() => {

                      setDateRangeFilter(range.value);
                      const today = new Date();
                      if (range.value === 'all') { 
                        setDateFrom(''); 
                        setDateTo(''); 

                      }
                      else if (range.value === '7days') { 
                        // ⭐ Show tasks from 7 days ago to 7 days in the future
                        const past = new Date(today); 
                        past.setDate(today.getDate() - 7); 
                        const future = new Date(today);
                        future.setDate(today.getDate() + 7);
                        const from = past.toISOString().split('T')[0];
                        const to = future.toISOString().split('T')[0];
                        setDateFrom(from); 
                        setDateTo(to);

                      }
                      else if (range.value === '30days') { 
                        // ⭐ Show tasks from 30 days ago to 30 days in the future
                        const past = new Date(today); 
                        past.setDate(today.getDate() - 30); 
                        const future = new Date(today);
                        future.setDate(today.getDate() + 30);
                        const from = past.toISOString().split('T')[0];
                        const to = future.toISOString().split('T')[0];
                        setDateFrom(from); 
                        setDateTo(to);

                      }
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: dateRangeFilter === range.value ? 'none' : '1.5px solid var(--border)',
                      background: dateRangeFilter === range.value ? '#3B5BFC' : 'var(--bg-surface)',
                      color: dateRangeFilter === range.value ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                    }}
                  >{range.label}</button>
                ))}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowDateDropdown(p => !p)}
                    style={{ padding: '6px 8px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={14} color="var(--text-muted)" />
                  </button>
                  {showDateDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 14, zIndex: 200, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FROM</label>
                        <input type="date" value={tempDateFrom} onChange={e => setTempDateFrom(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', background: 'var(--input-bg)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TO</label>
                        <input type="date" value={tempDateTo} onChange={e => setTempDateTo(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', background: 'var(--input-bg)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <button
                        disabled={!tempDateFrom || !tempDateTo}
                        onClick={() => { setDateFrom(tempDateFrom); setDateTo(tempDateTo); setDateRangeFilter('custom'); setShowDateDropdown(false); }}
                        style={{ padding: '7px', background: tempDateFrom && tempDateTo ? '#3B5BFC' : '#E8EAEF', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: tempDateFrom && tempDateTo ? '#fff' : '#9CA3AF', cursor: tempDateFrom && tempDateTo ? 'pointer' : 'not-allowed' }}>
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <User size={13} />
                Team Members {selectedMembers.length > 0 && `(${selectedMembers.length})`}
                <ChevronDown size={14} />
              </button>
              {showMemberDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: 260,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Select Team Members</span>
                    {selectedMembers.length > 0 && (
                      <button
                        onClick={clearMemberFilters}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#3B5BFC',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ padding: '8px' }}>
                    {/* Investment option */}
                    <button
                      onClick={() => toggleMember('Investment')}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: selectedMembers.includes('Investment') ? '#FFF7ED' : 'transparent',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid var(--border)', background: selectedMembers.includes('Investment') ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedMembers.includes('Investment') && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #12C479', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        <ArrowUpRight size={16} color="#12C479" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Additional Payments</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Extra payments for tasks</div>
                      </div>
                    </button>

                    {/* Task Budget option */}
                    <button
                      onClick={() => toggleMember('TaskBudget')}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: selectedMembers.includes('TaskBudget') ? '#F5F3FF' : 'transparent',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        textAlign: 'left',
                        marginTop: 4,
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid var(--border)', background: selectedMembers.includes('TaskBudget') ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedMembers.includes('TaskBudget') && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F3FF', border: '2px solid #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        <Wallet size={16} color="#7C3AED" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Task Budget</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Budget allocated to tasks</div>
                      </div>
                    </button>

                    <div style={{ height: 1, background: 'var(--border-light)', margin: '8px 0' }} />

                    {/* Team members */}
                    {team.map(member => (
                        <button
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: selectedMembers.includes(member.id) ? '#EEF2FF' : 'transparent',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            textAlign: 'left',
                            marginTop: 4,
                          }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid var(--border)', background: selectedMembers.includes(member.id) ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selectedMembers.includes(member.id) && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
                          </div>
                          {/* ⭐ Show profile image or avatar */}
                          {member.avatarImg ? (
                            <img 
                              src={member.avatarImg} 
                              alt={member.name}
                              style={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: '2px solid var(--bg-surface)'
                              }}
                            />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                              {member.avatar}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{member.role}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ height: 32, width: '1px', background: 'var(--border)' }} />
            <div style={{ position: 'relative' }} ref={categoryDropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Categories/Roles {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                <ChevronDown size={14} />
              </button>
              {showCategoryDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: 280,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Filter by Category or Role</span>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={clearCategories}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#EF4444',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {/* Payment Categories */}
                  <div style={{ padding: '8px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px' }}>Payment Categories</div>
                    {PAYMENT_CATEGORIES.map(cat => {
                      const isSelected = selectedCategories.some(c => c.label === cat.label);
                      return (
                        <div
                          key={cat.label}
                          onClick={() => toggleCategory(cat)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: isSelected ? cat.bg : 'transparent',
                            border: `1px solid ${isSelected ? cat.color + '40' : 'transparent'}`,
                            marginBottom: 4,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                          {/* ⭐ Show category image if available */}
                          {cat.image && (
                            <div style={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: 6, 
                              background: cat.bg, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0,
                              padding: 4
                            }}>
                              <img src={cat.image} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                            </div>
                          )}
                          <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? cat.color : 'var(--text-secondary)', flex: 1 }}>{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Team Roles */}
                  {roleOptions.length > 0 && (
                    <div style={{ padding: '8px', borderTop: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px' }}>Team Roles</div>
                      {roleOptions.map(role => {
                        const isSelected = selectedCategories.some(c => c.label === role.label);
                        return (
                          <div
                            key={role.label}
                            onClick={() => toggleCategory(role)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: isSelected ? role.bg : 'transparent',
                              border: `1px solid ${isSelected ? role.color + '40' : 'transparent'}`,
                              marginBottom: 4,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg-subtle)')}
                            onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                            {/* ⭐ No icon for roles, just text */}
                            <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? role.color : 'var(--text-secondary)', flex: 1 }}>{role.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedRows.length > 1 && (() => {
              const unpaidCount = selectedRows.filter(r => !r.isPaid).length;
              return unpaidCount > 1 && (
                <>
                  <div style={{ height: 32, width: '1px', background: 'var(--border)' }} />
                  <button
                    onClick={() => setShowCategoryPaymentModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 8,
                      background: '#F5F3FF',
                      border: '1.5px solid #C7D4FF',
                      color: '#7C3AED', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                  >
                    <span style={{ fontSize: 14 }}>🏷️</span> Category Payment ({unpaidCount})
                  </button>
                </>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
            {selectedRows.length > 0 && (() => {
              const unpaidCount = selectedRows.filter(r => !r.isPaid).length;
              return unpaidCount > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #12C479, #059669)',
                    border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(18,196,121,0.25)',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>₹</span> Process Payment ({unpaidCount})
                </button>
              );
            })()}
            {selectedRows.length === 0 && (
              <button
                onClick={() => setShowAddPaymentModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8,
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Plus size={12} /> Add Payment
              </button>
            )}
            <button
              onClick={() => requestAdminPassword('export excel', () => exportToCSV(selectedRows.length > 0 ? selectedRows : sorted))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: selectedRows.length > 0 ? 'linear-gradient(135deg, #12C479, #059669)' : 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', boxShadow: selectedRows.length > 0 ? '0 2px 8px rgba(18,196,121,0.25)' : '0 2px 8px rgba(59,91,252,0.25)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Download size={12} /> {selectedRows.length > 0 ? `Export ${selectedRows.length} Selected` : 'Export Excel'}
            </button>
            
            {/* ⭐ PAGINATION: Show pagination controls */}
            {paymentsTotalPages > 1 && (
              <>
                <div style={{ height: 32, width: '1px', background: 'var(--border)', marginLeft: 4 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* ⭐ Show loading indicator */}
                  {paymentsLoading && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>Loading...</span>
                  )}
                  
                  <button
                    onClick={hasActiveFilters ? () => setFilteredPage(p => Math.max(1, p - 1)) : paymentsPrevPage}
                    disabled={hasActiveFilters ? filteredPage === 1 : (paymentsCurrentPage === 1 || paymentsLoading)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: (hasActiveFilters ? filteredPage === 1 : (paymentsCurrentPage === 1 || paymentsLoading)) ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: (hasActiveFilters ? filteredPage === 1 : (paymentsCurrentPage === 1 || paymentsLoading)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: (hasActiveFilters ? filteredPage === 1 : (paymentsCurrentPage === 1 || paymentsLoading)) ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={12} color="var(--text-muted)" />
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 50, textAlign: 'center' }}>
                    {hasActiveFilters ? filteredPage : paymentsCurrentPage} / {hasActiveFilters ? filteredTotalPages : paymentsTotalPages}
                  </span>
                  <button
                    onClick={hasActiveFilters ? () => setFilteredPage(p => Math.min(filteredTotalPages, p + 1)) : paymentsNextPage}
                    disabled={hasActiveFilters ? filteredPage === filteredTotalPages : (paymentsCurrentPage === paymentsTotalPages || paymentsLoading)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: (hasActiveFilters ? filteredPage === filteredTotalPages : (paymentsCurrentPage === paymentsTotalPages || paymentsLoading)) ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: (hasActiveFilters ? filteredPage === filteredTotalPages : (paymentsCurrentPage === paymentsTotalPages || paymentsLoading)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: (hasActiveFilters ? filteredPage === filteredTotalPages : (paymentsCurrentPage === paymentsTotalPages || paymentsLoading)) ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={12} color="var(--text-muted)" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table content wrapper with horizontal scroll */}
        <div style={{ overflowX: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr',
          padding: '10px 20px',
          borderBottom: '1.5px solid var(--border-light)',
          background: 'var(--bg-subtle)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          minWidth: '1000px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input 
              type="checkbox" 
              checked={selectableRows.length > 0 && selectedRows.length === selectableRows.length}
              onChange={toggleAll}
              disabled={selectableRows.length === 0}
              style={{ cursor: selectableRows.length > 0 ? 'pointer' : 'not-allowed', width: 16, height: 16 }}
            />
          </div>
          {['Task', 'Description', 'Member', 'Assigned By', 'Category', 'Stage', 'Due Date', 'Amount', 'Paid On'].map((h, i) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i === 1 ? 'left' : (i === 7 || i === 8) ? 'right' : 'left', paddingLeft: i === 2 ? 16 : i === 8 ? 16 : 0 }}>
              {h === 'Task' && selectedRows.length > 0
                ? <span style={{ color: '#3B5BFC', textTransform: 'none', fontSize: 12 }}>{selectedRows.length} selected (₹{selectedRows.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()})</span>
                : h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '80px 24px', gap: 16, visibility: 'visible', opacity: 1 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={32} color="#12C479" strokeWidth={1.8} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No payment records yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.6 }}>Payments are generated from completed tasks, or you can add manual payments</div>
            </div>
            <button onClick={() => setShowAddPaymentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
              <Plus size={15} /> Add Payment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 300 }}>
            {/* ⭐ Show paginated filtered results when filters active, otherwise show Firestore paginated data */}
            {paginatedFiltered.map((row, idx) => {
              const isLast = idx === paginatedFiltered.length - 1;
              // ⭐ Generate unique key - use paymentId if available, otherwise create unique composite key
              const key = row.paymentId 
                ? row.paymentId 
                : row.manualId 
                  ? `manual-${row.manualId}` 
                  : `${row.taskId || 'NOTASK'}-${row.memberId || 'NOMEMBER'}-${row.memberName || 'NONAME'}-${idx}`;
              const isSelected = selectedRows.some(r => (r.paymentId || `${r.id}-${r.memberName}`) === (row.paymentId || `${row.id}-${row.memberName}`));
              return (
                <div key={key} 
                  data-task-id={row.id}
                  onClick={() => !row.isPaid && toggleRow(row)}
                  style={{
                    display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr',
                    alignItems: 'center',
                    padding: '14px 20px',
                    minWidth: '1000px',
                    minHeight: '60px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
                    background: isSelected ? '#EEF2FF' : row.isPaid ? 'var(--bg-surface)' : 'var(--bg-surface)',
                    transition: 'background 0.12s',
                    cursor: row.isPaid ? 'default' : 'pointer',
                    visibility: 'visible',
                    opacity: 1,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#EEF2FF' : 'var(--bg-surface)'; }}
                >
                  {/* Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); toggleRow(row); }}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Task */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: row.isPaid ? '#ECFDF5' : '#FFF7ED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {row.isPaid
                        ? <CheckCircle size={14} color="#12C479" strokeWidth={2.5} />
                        : <Clock size={14} color="#F97316" strokeWidth={2.5} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span 
                          onClick={(e) => { e.stopPropagation(); setSelectedPayment(row); }}
                          style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: row.isPaid ? '#12C479' : '#3B5BFC', padding: '1px 6px', borderRadius: 4, flexShrink: 0, cursor: 'pointer' }}
                        >#{row.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.title}</span>
                      </div>
                    </div>
                  </div>
                  {/* Description */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    {editingDescription === key ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                        <input
                          value={editDescriptionValue}
                          onChange={e => setEditDescriptionValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleDescriptionSave(row);
                            if (e.key === 'Escape') handleDescriptionCancel();
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1,
                            fontSize: 11,
                            color: 'var(--text-primary)',
                            background: '#fff',
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1.5px solid #3B5BFC',
                            outline: 'none',
                            fontWeight: 500,
                          }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDescriptionSave(row); }}
                          style={{
                            background: '#ECFDF5',
                            border: 'none',
                            borderRadius: 6,
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <CheckCircle size={12} color="#12C479" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDescriptionCancel(); }}
                          style={{
                            background: '#FEF2F2',
                            border: 'none',
                            borderRadius: 6,
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <X size={12} color="#EF4444" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => { e.stopPropagation(); handleDescriptionEdit(key, row.description); }}
                        onMouseEnter={() => row.description && setHoveredDescription(row.description)}
                        onMouseLeave={() => setHoveredDescription(null)}
                        style={{ 
                          fontSize: 11, 
                          color: row.description ? 'var(--text-secondary)' : 'var(--text-muted)', 
                          background: 'var(--bg-subtle)', 
                          padding: '6px 12px', 
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          width: '100%',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: 32,
                          fontStyle: row.description ? 'normal' : 'italic',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#3B5BFC'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        {row.description || 'Click to add description...'}
                      </div>
                    )}
                    {hoveredDescription === row.description && row.description && editingDescription !== key && (
                      <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '20px 24px',
                        background: '#fff',
                        color: '#374151',
                        fontSize: 14,
                        borderRadius: 12,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        border: '1px solid #E5E7EB',
                        whiteSpace: 'normal',
                        maxWidth: '500px',
                        lineHeight: '1.6',
                        zIndex: 10000,
                      }}>
                        {row.description}
                      </div>
                    )}
                  </div>

                  {/* Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, overflow: 'hidden' }}>
                    {row.isInvestment ? (
                      <>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          {row.memberAvatar === 'ARROW_UP_ICON' ? (
                            <ArrowUpRight size={14} color="#fff" strokeWidth={2.5} />
                          ) : row.memberAvatar === 'TASK_BUDGET_ICON' ? (
                            <Wallet size={14} color="#fff" strokeWidth={2.5} />
                          ) : (
                            row.memberAvatar
                          )}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.memberName}</span>
                      </>
                    ) : row.paymentType === 'task-budget' ? (
                      // ⭐ Task budget: Wallet icon + Text with purple color
                      <>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Wallet size={14} color="#fff" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: row.memberColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.memberName}</span>
                      </>
                    ) : row.paymentType === 'additional' ? (
                      // ⭐ Additional payments: Icon + Text with green color
                      <>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ArrowUpRight size={14} color="#fff" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: row.memberColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.memberName}</span>
                      </>
                    ) : (
                      <>
                        {/* ⭐ Team members: Show profile image or avatar */}
                        {row.memberAvatarImg ? (
                          <img 
                            src={row.memberAvatarImg} 
                            alt={row.memberName}
                            style={{ 
                              width: 26, 
                              height: 26, 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '2px solid var(--bg-surface)'
                            }}
                          />
                        ) : (
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{row.memberAvatar}</div>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.memberName}</span>
                      </>
                    )}
                  </div>

                  {/* Assigned By */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{row.assignedBy}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{row.assignedRole || 'Admin'}</div>
                  </div>

                  {/* Category */}
                  <div>
                    {row.category ? (
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: 50, 
                        background: row.category.bg, 
                        color: '#1A1D2E', 
                        border: `1px solid ${row.category.color}30`, 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {row.category.image && (
                          <img src={row.category.image} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                        )}
                        {row.category.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>

                  {/* Stage */}
                  <div>
                    {/* ⭐ Show stage only if not a manual payment */}
                    {row.stage && row.stage.trim() !== '' ? (
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        padding: '3px 10px', 
                        borderRadius: 20, 
                        background: (row.paused || row.isPaused) ? '#FFF7ED' : (STAGE_BG[row.stage] || '#F3F4F6'), 
                        color: (row.memberIsOnHold || row.paused || row.isPaused) ? '#F97316' : (STAGE_COLORS[row.stage] || '#6B7280') 
                      }}>
                        {(row.memberIsOnHold || row.paused || row.isPaused) ? 'Hold' : row.stage}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>

                  {/* Due date */}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {new Date(row.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                      {row.isPaid && <ArrowUpRight size={12} color="#12C479" />}
                      <span style={{ fontSize: 15, fontWeight: 800, color: row.isPaid ? '#12C479' : '#F97316', letterSpacing: '-0.3px' }}>₹{row.amount.toLocaleString()}</span>
                      {/* ⭐ Plus button for task budget entries */}
                      {row.paymentType === 'task-budget' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // ⭐ Open modal directly without password check
                            setSelectedTaskBudget(row);
                            setShowAddBudgetModal(true);
                          }}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#7C3AED',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#6D28D9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#7C3AED'}
                        >
                          <Plus size={14} color="#fff" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    {/* ⭐ Subtitle: show pending amount if partially paid */}
                    {!row.isPaid && row.paidAmount > 0 && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#F97316', marginTop: 2 }}>
                        Pending: ₹{(row.amount - row.paidAmount).toLocaleString()}
                      </div>
                    )}
                    {/* ⭐ Subtitle: show profit for task budget */}
                    {row.paymentType === 'task-budget' && row.profitAmount > 0 && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#12C479', marginTop: 2 }}>
                        +₹{row.profitAmount.toLocaleString()} profit
                      </div>
                    )}
                    <div style={{ fontSize: 10, fontWeight: 600, color: row.isPaid ? '#12C479' : '#F97316', background: row.isPaid ? '#ECFDF5' : '#FFF7ED', padding: '1px 7px', borderRadius: 6, marginTop: 2, display: 'inline-block' }}>
                      {row.isPaid ? 'paid' : 'pending'}
                    </div>
                  </div>

                  {/* Paid On */}
                  <div style={{ textAlign: 'right', paddingLeft: 16 }}>
                    {/* ⭐ For task budget: show payment history with navigation arrows */}
                    {row.paymentType === 'task-budget' ? (
                      row.paymentHistory && row.paymentHistory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {(() => {
                            // ⭐ Default to latest entry (last index) if not set
                            const currentIndex = expandedPaymentHistory[key] !== undefined 
                              ? expandedPaymentHistory[key] 
                              : row.paymentHistory.length - 1;
                            const currentEntry = row.paymentHistory[currentIndex];
                            const hasPrevious = currentIndex > 0;
                            const hasNext = currentIndex < row.paymentHistory.length - 1;
                            const hasMultiple = row.paymentHistory.length > 1;
                            
                            return (
                              <>
                                {/* ⭐ Navigation arrows above the entry */}
                                {hasMultiple && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {/* Left arrow */}
                                    {hasPrevious ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedPaymentHistory(prev => ({
                                            ...prev,
                                            [key]: currentIndex - 1
                                          }));
                                        }}
                                        style={{
                                          background: 'var(--bg-subtle)',
                                          border: '1px solid var(--border)',
                                          borderRadius: 6,
                                          width: 18,
                                          height: 18,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#EEF2FF';
                                          e.currentTarget.style.borderColor = '#3B5BFC';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'var(--bg-subtle)';
                                          e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                      >
                                        <ArrowLeft size={10} color="#3B5BFC" strokeWidth={2.5} />
                                      </button>
                                    ) : (
                                      <div style={{ width: 18 }} />
                                    )}
                                    
                                    {/* Right arrow */}
                                    {hasNext ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedPaymentHistory(prev => ({
                                            ...prev,
                                            [key]: currentIndex + 1
                                          }));
                                        }}
                                        style={{
                                          background: 'var(--bg-subtle)',
                                          border: '1px solid var(--border)',
                                          borderRadius: 6,
                                          width: 18,
                                          height: 18,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#EEF2FF';
                                          e.currentTarget.style.borderColor = '#3B5BFC';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'var(--bg-subtle)';
                                          e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                      >
                                        <ArrowRight size={10} color="#3B5BFC" strokeWidth={2.5} />
                                      </button>
                                    ) : (
                                      <div style={{ width: 18 }} />
                                    )}
                                  </div>
                                )}
                                
                                {/* ⭐ Current entry below arrows - ALWAYS show amount */}
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: currentEntry.type === 'profit' ? '#12C479' : '#7C3AED' }}>
                                    {currentEntry.type === 'profit' ? '+' : ''}₹{currentEntry.amount.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                                    {new Date(currentEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                                    {currentEntry.paidBy?.name || 'Admin'}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                      )
                    ) : row.isPaid && row.paidOn ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {/* ⭐ Show category icon if payment was paid via category button */}
                        {row.isCategoryPayment && (
                          <span style={{ fontSize: 16 }}>🏷️</span>
                        )}
                        <div>
                          {/* ⭐ ALWAYS show paid amount */}
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>
                            ₹{row.paidAmount.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#12C479' }}>
                            {new Date(row.paidOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {new Date(row.paidOn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {row.paidBy?.name || 'Admin'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        {/* End table content wrapper with horizontal scroll */}

      </div>

      {showPaymentModal && (
        <PaymentModal 
          selectedRows={selectedRows}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePayment}
        />
      )}

      {showAddPaymentModal && (
        <AddPaymentModal 
          team={team}
          tasks={tasks}
          prefilledTaskId={prefilledTask}
          onClose={() => {
            setShowAddPaymentModal(false);
            setPrefilledTask(null); // Clear prefilled task when modal closes
          }}
          onAdd={handleAddPayment}
        />
      )}

      {showCategoryPaymentModal && (
        <CategoryPaymentModal
          selectedRows={selectedRows}
          team={team}
          onClose={() => setShowCategoryPaymentModal(false)}
          onConfirm={handleCategoryPayment}
        />
      )}

      {showAddBudgetModal && selectedTaskBudget && (
        <AddBudgetModal
          taskBudget={selectedTaskBudget}
          onClose={() => {
            setShowAddBudgetModal(false);
            setSelectedTaskBudget(null);
          }}
          onConfirm={handleAddBudget}
        />
      )}

      {selectedPayment && (
        <PaymentDetailPanel
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay 
        show={showLoadingOverlay} 
        onComplete={() => setShowLoadingOverlay(false)} 
      />
      </>
      )}
    </div>
  );
}
