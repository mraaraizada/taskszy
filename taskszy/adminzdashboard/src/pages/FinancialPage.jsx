import { useState, useRef, useEffect } from 'react';
import { Clock, CheckCircle, TrendingUp, ArrowUpRight, Wallet, Download, X, DollarSign, Calendar, Plus, User, Users, Briefcase, ChevronDown, ChevronLeft, ChevronRight, ReceiptIndianRupee, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';
import { FinancialSkeleton } from '../components/Skeleton';
import { getPaymentsPaginated, getCustomRequestsPaginated, getCouponsOptimized } from '../lib/optimizedPaymentService';
import { toast } from 'sonner';

// Payment data will be fetched from Firebase
const MOCK_PAYMENTS = [];

function exportToCSV(rows) {
  const headers = ['Task ID', 'Task Title', 'Member', 'Assigned By', 'Role', 'Stage', 'Due Date', 'Amount', 'Status'];
  const lines = rows.map(r => [
    r.id,
    `"${r.title}"`,
    `"${r.memberName}"`,
    r.assignedBy || 'John Smith',
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

// Payment Modal
function PaymentModal({ selectedRows, onClose, onConfirm }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [notes, setNotes] = useState('');
  const totalAmount = selectedRows.reduce((sum, row) => sum + row.amount, 0);
  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  const handleProcessPayment = () => {
    if (wordCount > 100) return;
    requestAdminPassword('process payment', () => {
      onConfirm(notes);
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div key={`${row.id}-${row.memberName}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{row.memberAvatar}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{row.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.memberName}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#12C479', flexShrink: 0 }}>₹ {row.amount.toLocaleString()}</div>
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
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3B5BFC', letterSpacing: '-1px' }}>₹ {totalAmount.toLocaleString()}</div>
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
            <DollarSign size={16} /> Process Payment
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

// Add Manual Payment Modal
function AddPaymentModal({ onClose, onAdd, team, tasks }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  // Check if Admin A is logged in
  const isAdminA = typeof window !== 'undefined' && localStorage.getItem('userEmail') === 'adminuser@taskzy.io';
  
  const [paymentType, setPaymentType] = useState('member'); // 'member' or 'investment'
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [taskId, setTaskId] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payNow, setPayNow] = useState(false);

  // Payment categories with icons and colors - empty for Admin A
  const PAYMENT_CATEGORIES = isAdminA ? [] : [
    { label: 'Domain & Hosting', icon: '🌐', color: '#3B5BFC', bg: '#EEF2FF' },
    { label: 'Software & Tools', icon: '💻', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Infrastructure', icon: '🏢', color: '#06B6D4', bg: '#ECFEFF' },
    { label: 'Marketing', icon: '📢', color: '#F97316', bg: '#FFF7ED' },
    { label: 'Equipment', icon: '🔧', color: '#12C479', bg: '#ECFDF5' },
    { label: 'Legal', icon: '⚖️', color: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Training', icon: '📚', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Other', icon: '📦', color: '#6B7280', bg: '#F3F4F6' },
  ];

  const selectedMember = team.find(m => m.id === parseInt(memberId));
  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;
  const isValid = paymentType === 'investment' 
    ? amount && parseFloat(amount) > 0 && title.trim() && selectedCategory
    : memberId && amount && parseFloat(amount) > 0 && title.trim();

  const handleSubmit = () => {
    if (!isValid || wordCount > 100) return;
    requestAdminPassword('add payment', () => {
      const today = new Date().toISOString().split('T')[0];
      onAdd({
        paymentType,
        memberId: paymentType === 'member' ? parseInt(memberId) : null,
        amount: parseFloat(amount),
        description: title.trim(),
        notes: notes.trim(),
        dueDate: dueDate || today,
        isPaid: false,
        investmentCategory: paymentType === 'investment' && selectedCategory ? selectedCategory.label : null,
        taskId: taskId.trim() || null,
      });
      onClose();
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Add Manual Payment</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Create a payment for specific task</div>
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
              {selectedMember && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: selectedMember.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{selectedMember.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMember.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedMember.role} • {selectedMember.email}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Category - Only for payment type */}
          {paymentType === 'investment' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Payment Category * <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(select one)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PAYMENT_CATEGORIES.map(cat => {
                  const sel = selectedCategory?.label === cat.label;
                  return (
                    <button key={cat.label} onClick={() => setSelectedCategory(sel ? null : cat)} style={{
                      padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${sel ? cat.color : 'var(--border)'}`,
                      background: sel ? cat.bg : 'var(--bg-surface)',
                      color: sel ? cat.color : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                      boxShadow: sel ? `0 2px 8px ${cat.color}30` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{cat.icon}</span> {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task ID - Only for payment type */}
          {paymentType === 'investment' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>Task ID <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    value={taskSearchQuery}
                    onChange={e => { setTaskSearchQuery(e.target.value); setTaskId(''); setShowTaskDropdown(e.target.value.length > 0); }}
                    onFocus={(e) => { 
                      if (taskSearchQuery.length > 0) setShowTaskDropdown(true);
                      e.target.style.borderColor = '#3B5BFC';
                    }}
                    onBlur={() => { setTimeout(() => { setShowTaskDropdown(false); if (taskSearchQuery && !taskId) setTaskId(taskSearchQuery); }, 200); }}
                    placeholder="Search or type Task ID..."
                    style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
                  />
                  {showTaskDropdown && taskSearchQuery && tasks && tasks.filter(t =>
                    t.id.toString().toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                    t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())
                  ).length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', zIndex: 1000 }}>
                      {tasks.filter(t =>
                        t.id.toString().toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                        t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())
                      ).slice(0, 5).map(task => (
                        <div key={task.id} onClick={() => { setTaskId(task.id.toString()); setTaskSearchQuery(task.id.toString()); setShowTaskDropdown(false); }}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Task #{task.id}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{task.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {taskId && (
                  <button onClick={() => { setTaskId(''); setTaskSearchQuery(''); }}
                    style={{ padding: '6px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
              {taskSearchQuery && (
                <div style={{ fontSize: 11, marginTop: 6, paddingLeft: 2 }}>
                  {tasks && tasks.find(t => t.id.toString() === taskId) ? (
                    <span style={{ color: '#12C479', fontWeight: 600 }}>✓ Linked to existing Task #{taskId}</span>
                  ) : taskId ? (
                    <span style={{ color: '#F97316', fontWeight: 600 }}>⚠ Task ID "{taskId}" not found</span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Amount and Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount (₹) *</label>
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
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Date <span style={{ fontSize: 11, textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)}
                disabled={payNow}
                style={{ 
                  width: '100%', 
                  padding: '11px 16px', 
                  border: '1.5px solid var(--border)', 
                  borderRadius: 10, 
                  fontSize: 14, 
                  color: 'var(--text-primary)', 
                  outline: 'none', 
                  background: payNow ? 'var(--bg-subtle)' : 'var(--input-bg)', 
                  boxSizing: 'border-box', 
                  colorScheme: 'normal',
                  cursor: payNow ? 'not-allowed' : 'text',
                  opacity: payNow ? 0.5 : 1,
                }}
                onFocus={e => !payNow && (e.target.style.borderColor = '#3B5BFC')} 
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {paymentType === 'investment' && selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : (selectedMember ? selectedMember.name : 'Select Member')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{title}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: paymentType === 'investment' ? '#F97316' : '#3B5BFC', letterSpacing: '-1px' }}>₹ {parseFloat(amount).toLocaleString()}</div>
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
  const initialTotal = selectedRows.reduce((sum, row) => sum + row.amount, 0);
  const [totalAmount, setTotalAmount] = useState(initialTotal);
  const [description, setDescription] = useState('');
  const [taskAmounts, setTaskAmounts] = useState(
    selectedRows.reduce((acc, row) => {
      acc[`${row.id}-${row.memberName}`] = row.amount;
      return acc;
    }, {})
  );

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const calculatedTotal = Object.values(taskAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);

  const handleAmountChange = (key, value) => {
    setTaskAmounts(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const handleTotalAmountChange = (value) => {
    const newTotal = parseFloat(value) || 0;
    setTotalAmount(newTotal);
    
    // Check if any task has zero amount
    const hasZeroAmounts = selectedRows.some(row => {
      const key = `${row.id}-${row.memberName}`;
      return !taskAmounts[key] || taskAmounts[key] === 0;
    });
    
    // If any task has zero amount, split evenly
    if (hasZeroAmounts) {
      const perTask = newTotal / selectedRows.length;
      const newAmounts = {};
      selectedRows.forEach(row => {
        newAmounts[`${row.id}-${row.memberName}`] = perTask;
      });
      setTaskAmounts(newAmounts);
    }
  };

  const distributeEvenly = () => {
    const perTask = totalAmount / selectedRows.length;
    const newAmounts = {};
    selectedRows.forEach(row => {
      newAmounts[`${row.id}-${row.memberName}`] = perTask;
    });
    setTaskAmounts(newAmounts);
  };

  const handleConfirm = () => {
    requestAdminPassword('create payment', () => {
      const categoryData = {
        description: description.trim(),
        totalAmount: calculatedTotal,
        tasks: selectedRows.map(row => ({
          ...row,
          categoryAmount: taskAmounts[`${row.id}-${row.memberName}`],
        })),
      };
      
      onConfirm(categoryData);
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Payment</div>
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
                value={totalAmount} 
                onChange={e => handleTotalAmountChange(e.target.value)} 
                placeholder="Enter total amount..."
                style={{ width: '100%', padding: '11px 16px 11px 36px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
                onBlur={e => e.target.style.borderColor = 'var(--border)'} 
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Amount will be split across {selectedRows.length} task{selectedRows.length > 1 ? 's' : ''}
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
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7C3AED', letterSpacing: '-1px' }}>₹ {calculatedTotal.toLocaleString()}</div>
            </div>
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
              Distribute Evenly (₹ {(totalAmount / selectedRows.length).toLocaleString()} per task)
            </button>
          </div>

          {/* Task Amount Distribution */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Amount Distribution</div>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedRows.map(row => {
                const key = `${row.id}-${row.memberName}`;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: row.memberAvatarImg ? 'transparent' : row.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {row.memberAvatarImg ? (
                        <img src={row.memberAvatarImg} alt={row.memberName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: STAGE_BG[row.stage] || 'var(--bg-subtle)', color: STAGE_COLORS[row.stage] || 'var(--text-muted)' }}>
                          {row.stage}
                        </span>
                      )}
                      <input
                        type="number"
                        value={taskAmounts[key]}
                        onChange={e => handleAmountChange(key, e.target.value)}
                        style={{
                          width: 100,
                          padding: '6px 10px',
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
            style={{
              padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              boxShadow: '0 6px 20px #7C3AED40',
            }}
          >
            Create Payment
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

// ── Payment Detail Panel (Right Side) ───────────────────────────────────────
function PaymentDetailPanel({ payment, onClose }) {
  const panelRef = useRef(null);
  
  if (!payment) return null;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Use setTimeout to allow other click handlers to execute first
        setTimeout(() => {
          onClose();
        }, 0);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleDownloadPDF = () => {
    // In a real app, this would generate and download a PDF receipt
    toast.info('PDF download functionality coming soon');
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Payment Receipt</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{payment.taskId}</div>
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
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{payment.taskId}</span>
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
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: payment.memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                      {payment.memberAvatar}
                    </div>
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
                <span style={{ fontSize: 16, fontWeight: 800, color: '#12C479' }}>₹ {payment.amount?.toLocaleString()}</span>
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

export default function FinancialPage() {
  // Check if Admin A is logged in
  const isAdminA = typeof window !== 'undefined' && localStorage.getItem('userEmail') === 'adminuser@taskzy.io';
  
  const { tasks, financials, STAGE_COLORS, STAGE_BG, markTaskPaid, team, addTaskHistoryEntry, organizations, globalSearchQuery } = useApp();
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [selectedRows, setSelectedRows] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [manualPayments, setManualPayments] = useState([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState([]); // ⭐ Add subscription payments state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showCategoryPaymentModal, setShowCategoryPaymentModal] = useState(false);
  const [showCouponPanel, setShowCouponPanel] = useState(false);
  const [showOrgPanel, setShowOrgPanel] = useState(false);
  const [pendingOrgCount, setPendingOrgCount] = useState(0);
  
  // Set default date range to last 30 days (including today)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29); // 29 days ago + today = 30 days
  
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const [dateRangeFilter, setDateRangeFilter] = useState('30days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [hoveredDescription, setHoveredDescription] = useState(null);
  const [editingDescription, setEditingDescription] = useState(null);
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [rowsPerPage] = useState(15);
  
  // Use real data from Firebase
  const [useMockData] = useState(false);

  // Check if page has been visited before
  const [initialLoading, setInitialLoading] = useState(() => {
    const visited = sessionStorage.getItem('visited_financial');
    return !visited;
  });

  // Load subscription payments with optimized pagination
  // Load subscription payments with optimized pagination
  useEffect(() => {
    let mounted = true;
    
    const loadSubscriptionPayments = async () => {
      try {
        const result = await getPaymentsPaginated({ pageSize: 100 });
        
        if (!mounted) return;
        
        const payments = result.payments.map(payment => {
          const toDate = (dateValue) => {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue;
            if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
            if (typeof dateValue === 'string' || typeof dateValue === 'number') {
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? null : date;
            }
            return null;
          };
          
          // Use the Razorpay payment ID if available, otherwise use document ID
          const razorpayPaymentId = payment.paymentId || payment.razorpayPaymentId || null;
          
          return {
            id: payment.id,
            paymentId: razorpayPaymentId, // Razorpay payment ID (pay_xxx format)
            documentId: payment.id, // Firestore document ID (ws_xxx format)
            workspaceId: payment.workspaceId,
            userId: payment.userId,
            userName: payment.userInfo?.name || 'N/A',
            userEmail: payment.userInfo?.email || 'N/A',
            userPhone: payment.userInfo?.phone || 'N/A',
            planName: payment.plan?.name || 'N/A',
            billingCycle: payment.plan?.billingCycle || 'monthly',
            amount: payment.pricing?.total || 0,
            couponCode: payment.coupon?.code || null,
            couponDiscount: payment.coupon?.discount || 0,
            status: payment.status || 'pending',
            transactionDate: toDate(payment.transactionDate),
            orderId: payment.orderId || null,
            fromHeaderUpgrade: payment.fromHeaderUpgrade || false,
          };
        });
        
        setSubscriptionPayments(payments);
      } catch (err) {
        toast.error('Failed to load payments');
      }
    };
    
    loadSubscriptionPayments();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Load pending organization count (custom plan requests that are not completed)
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        // Use optimized service instead of real-time listener
        const result = await getCustomRequestsPaginated({ pageSize: 100, status: 'pending' });
        const pendingCount = result.requests.filter(req => req.status !== 'completed').length;
        setPendingOrgCount(pendingCount);
      } catch (err) {
        toast.error('Failed to load pending requests count');
      }
    };
    
    loadPendingCount();
  }, []);

  // Initial loading effect
  useEffect(() => {
    if (initialLoading) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
        sessionStorage.setItem('visited_financial', 'true');
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [initialLoading]);

  const handlePageChange = (newPage) => {
    setPageLoading(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => setPageLoading(false), 400);
    }, 50);
  };

  // Build flat rows: one row per member per task
  const allRows = [];
  const planTypes = ['Starter', 'Professional', 'Business', 'Enterprise'];
  const addedPaymentIds = new Set(); // Track added payment IDs to prevent duplicates
  
  // Add subscription payments from payments collection
  subscriptionPayments.forEach(payment => {
    // Use Razorpay payment ID if available, otherwise use document ID
    const displayPaymentId = payment.paymentId || payment.documentId || payment.id;
    const isRazorpayId = payment.paymentId && payment.paymentId.startsWith('pay_');
    
    // Skip if this payment was already added (use document ID for deduplication)
    const dedupeKey = payment.documentId || payment.id;
    if (addedPaymentIds.has(dedupeKey)) {
      return;
    }
    
    addedPaymentIds.add(dedupeKey);
    
    // Find organization name from workspaceId
    const organization = organizations?.find(org => org.id === payment.workspaceId);
    const organizationName = organization?.name || payment.workspaceId || 'Unknown Organization';
    
    allRows.push({
      id: dedupeKey, // Use document ID for React key
      taskId: null,
      title: organizationName, // Show organization name in the Organization column
      description: `Subscription payment for ${payment.planName} plan`,
      deadline: payment.transactionDate || new Date(),
      memberName: payment.userName || 'N/A',
      memberId: null,
      memberRole: 'Subscription',
      memberAvatar: organizationName?.substring(0, 2).toUpperCase() || 'OR',
      memberColor: '#3B5BFC',
      stage: payment.status === 'completed' ? 'Complete' : 'New',
      amount: payment.amount || 0,
      isPaid: payment.status === 'completed',
      taskStage: payment.status === 'completed' ? 'Complete' : 'New',
      isManual: false,
      isSubscription: true,
      assignedBy: 'System',
      assignedRole: 'Admin',
      paidOn: payment.status === 'completed' ? payment.transactionDate?.toISOString() : null,
      planType: payment.planName || 'N/A',
      paymentId: displayPaymentId, // Display payment ID (Razorpay ID if available)
      razorpayPaymentId: payment.paymentId, // Store Razorpay ID separately
      documentId: payment.documentId || payment.id, // Store document ID separately
      isRazorpayId: isRazorpayId, // Flag to indicate if it's a proper Razorpay ID
      memberPhone: payment.userPhone || 'N/A',
      userPhone: payment.userPhone || 'N/A',
      userEmail: payment.userEmail || 'N/A',
      coupon: payment.couponCode || null,
      couponCode: payment.couponCode || null,
      orderId: payment.orderId || null,
      workspaceId: payment.workspaceId || null,
      organizationName: organizationName,
      fromHeaderUpgrade: payment.fromHeaderUpgrade || false,
    });
  });
  
  // Use mock data if enabled, otherwise use real task data
  if (useMockData) {
    allRows.push(...MOCK_PAYMENTS);
  } else {
    tasks.forEach(task => {
      task.members.forEach(m => {
        allRows.push({
          id:         task.id,
          taskId:     task.id,
          title:      task.title,
          description: task.description,
          deadline:   task.deadline,
          memberName: m.name,
          memberId:   m.id,
          memberRole: m.role,
          memberAvatar: m.avatar,
          memberColor:  m.color,
          stage:      m.stage,
          amount:     m.budget || 0,
          isPaid:     task.paid || task.stage === 'Complete',
          taskStage:  task.stage,
          isManual:   false,
          assignedBy: 'John Smith',
          assignedRole: 'Admin',
          paidOn:     (task.paid || task.stage === 'Complete') ? task.paidOn || new Date().toISOString() : null,
          category:   task.category || null,
          planType:   planTypes[Math.floor(Math.random() * planTypes.length)],
        });
      });
    });
  }

  // Add manual payments (only if not using mock data)
  if (!useMockData) {
    manualPayments.forEach(payment => {
      if (payment.paymentType === 'investment') {
        // Investment payment - map category to get icon
        const categoryMatch = PAYMENT_CATEGORIES.find(c => c.label === payment.investmentCategory);
        
        allRows.push({
          id:         payment.taskId,
          taskId:     payment.taskId,
          title:      payment.description,
          description: payment.notes || payment.description,
          deadline:   payment.dueDate,
          memberName: payment.investmentCategory,
          memberId:   null,
          memberRole: 'Investment',
          memberAvatar: categoryMatch?.icon || '💰',
          memberColor:  categoryMatch?.color || '#F97316',
          stage:      payment.isPaid ? 'Complete' : 'New',
          amount:     payment.amount,
          isPaid:     payment.isPaid,
          taskStage:  payment.isPaid ? 'Complete' : 'New',
          isManual:   true,
          isInvestment: true,
          manualId:   payment.id,
          assignedBy: payment.assignedBy || 'John Smith',
          assignedRole: payment.assignedRole || 'Admin',
          paidOn:     payment.paidOn || null,
        });
      } else {
        // Team member payment
        const member = team.find(m => m.id === payment.memberId);
        if (member) {
          allRows.push({
            id:         payment.taskId,
            taskId:     payment.taskId,
            title:      payment.description,
            description: payment.notes || payment.description,
            deadline:   payment.dueDate,
            memberName: member.name,
            memberId:   member.id,
            memberRole: member.role,
            memberAvatar: member.avatar,
            memberColor:  member.color,
            stage:      payment.isPaid ? 'Complete' : 'New',
            amount:     payment.amount,
            isPaid:     payment.isPaid,
            taskStage:  payment.isPaid ? 'Complete' : 'New',
            isManual:   true,
            isInvestment: false,
            manualId:   payment.id,
            assignedBy: payment.assignedBy || 'John Smith',
            assignedRole: payment.assignedRole || 'Admin',
            paidOn:     payment.paidOn || null,
          });
        }
      }
    });
  }

  // Filter by category/role
  const categoryFiltered = selectedCategories.length === 0
    ? allRows
    : allRows.filter(r => {
        // Check if any selected filter matches
        return selectedCategories.some(cat => {
          if (cat.type === 'category') {
            // Match investment category
            return r.isInvestment && r.memberName === cat.label;
          } else if (cat.type === 'role') {
            // Match member role
            return !r.isInvestment && r.memberRole === cat.label;
          }
          return false;
        });
      });

  // Filter by team member (multiple selection)
  const memberFiltered = selectedMembers.length === 0
    ? categoryFiltered
    : categoryFiltered.filter(r => {
        return selectedMembers.some(memberId => {
          if (memberId === 'Investment') {
            return r.isInvestment;
          }
          return r.memberId === memberId;
        });
      });

  // Filter by date range
  let dateFiltered = memberFiltered;
  if (dateFrom || dateTo) {
    dateFiltered = memberFiltered.filter(r => {
      // Handle both Date objects and timestamp strings
      let taskDate;
      if (r.deadline instanceof Date) {
        taskDate = new Date(r.deadline);
      } else if (typeof r.deadline === 'string' || typeof r.deadline === 'number') {
        taskDate = new Date(r.deadline);
      } else {
        return false; // Skip if invalid date
      }
      
      // Validate date
      if (isNaN(taskDate.getTime())) {
        return false;
      }
      
      taskDate.setHours(0, 0, 0, 0);
      
      let matchesDate = true;
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
      
      return matchesDate;
    });
  }

  // Filter by status
  const statusFiltered = statusFilter === 'All' 
    ? dateFiltered 
    : statusFilter === 'Pending' 
      ? dateFiltered.filter(r => !r.isPaid)
      : dateFiltered.filter(r => r.isPaid);

  // Filter by global search query (organization name)
  const searchFiltered = globalSearchQuery
    ? statusFiltered.filter(r => 
        r.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        r.organizationName?.toLowerCase().includes(globalSearchQuery.toLowerCase())
      )
    : statusFiltered;

  // Sort by date (most recent first), then by status (pending first, paid last)
  const sorted = [...searchFiltered].sort((a, b) => {
    // First sort by payment status (pending before paid)
    if (a.isPaid !== b.isPaid) {
      return a.isPaid ? 1 : -1;
    }
    
    // Then sort by date (most recent first)
    // Handle both transactionDate (subscription payments) and deadline (task payments)
    const getDate = (payment) => {
      if (payment.transactionDate) {
        return payment.transactionDate instanceof Date 
          ? payment.transactionDate.getTime() 
          : new Date(payment.transactionDate).getTime();
      }
      if (payment.deadline) {
        return new Date(payment.deadline).getTime();
      }
      return 0;
    };
    
    const dateA = getDate(a);
    const dateB = getDate(b);
    
    // If dates are invalid, put them at the end
    if (isNaN(dateA) || dateA === 0) return 1;
    if (isNaN(dateB) || dateB === 0) return -1;
    
    return dateB - dateA; // Descending order (newest first)
  });

  const totalBudget  = statusFiltered.reduce((s, r) => s + r.amount, 0);
  const totalPaid    = statusFiltered.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0);
  const totalPending = totalBudget - totalPaid;
  const paidRate     = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

  const pendingRows = sorted.filter(r => !r.isPaid);
  const selectedAmount = selectedRows.reduce((sum, row) => sum + row.amount, 0);

  // Payment categories - empty for Admin A
  const PAYMENT_CATEGORIES = isAdminA ? [] : [
    { label: 'Domain & Hosting', icon: '🌐', color: '#3B5BFC', type: 'category' },
    { label: 'Software & Tools', icon: '💻', color: '#7C3AED', type: 'category' },
    { label: 'Infrastructure', icon: '🏢', color: '#06B6D4', type: 'category' },
    { label: 'Marketing', icon: '📢', color: '#F97316', type: 'category' },
    { label: 'Equipment', icon: '🔧', color: '#12C479', type: 'category' },
    { label: 'Legal', icon: '⚖️', color: '#8B5CF6', type: 'category' },
    { label: 'Training', icon: '📚', color: '#F59E0B', type: 'category' },
    { label: 'Other', icon: '📦', color: '#6B7280', type: 'category' },
  ];

  // Get unique roles from team members - empty for Admin A
  const roles = isAdminA ? [] : [...new Set(team.map(m => m.role))].sort();
  const roleOptions = roles.map(role => ({ label: role, icon: '👤', color: '#3B5BFC', type: 'role' }));
  
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
    if (row.isPaid) return; // Can't select paid rows
    const key = `${row.id}-${row.memberName}`;
    const isSelected = selectedRows.some(r => `${r.id}-${r.memberName}` === key);
    if (isSelected) {
      setSelectedRows(prev => prev.filter(r => `${r.id}-${r.memberName}` !== key));
    } else {
      setSelectedRows(prev => [...prev, row]);
    }
  };

  const toggleAll = () => {
    if (selectedRows.length === pendingRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...pendingRows]);
    }
  };

  const handlePayment = (notes) => {
    const paidTimestamp = new Date().toISOString();
    
    // Group by task ID and mark as paid
    const taskIds = [...new Set(selectedRows.filter(r => !r.isManual).map(r => r.taskId))];
    taskIds.forEach(taskId => {
      markTaskPaid(taskId, { name: 'Admin' }, 'Payment Page');
    });
    
    // Mark manual payments as paid
    const manualIds = selectedRows.filter(r => r.isManual).map(r => r.manualId);
    if (manualIds.length > 0) {
      setManualPayments(prev => prev.map(p => 
        manualIds.includes(p.id) ? { ...p, isPaid: true, paidOn: paidTimestamp } : p
      ));
    }
    
    setSelectedRows([]);
    setShowPaymentModal(false);
  };

  const handleAddPayment = (paymentData) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newTaskId = '#';
    for (let i = 0; i < 8; i++) newTaskId += chars[Math.floor(Math.random() * chars.length)];

    // If a task ID was provided and matches an existing task, add history entry
    const linkedTaskId = paymentData.taskId;
    const linkedTask = linkedTaskId ? tasks.find(t => t.id === linkedTaskId) : null;
    if (linkedTask) {
      addTaskHistoryEntry(linkedTaskId, {
        stage: linkedTask.stage,
        date: new Date(),
        user: 'Admin',
        action: 'paid',
        note: `Manual payment added via Payment Page${paymentData.description ? ` — ${paymentData.description}` : ''}`,
      });
    }

    const newPayment = {
      id: Date.now(),
      taskId: linkedTaskId || newTaskId,
      ...paymentData,
      createdAt: new Date().toISOString(),
      paidOn: paymentData.isPaid ? new Date().toISOString() : null,
    };
    setManualPayments(prev => [...prev, newPayment]);
  };

  const handleDescriptionEdit = (rowKey, currentDescription) => {
    setEditingDescription(rowKey);
    setEditDescriptionValue(currentDescription || '');
  };

  const handleDescriptionSave = (row) => {
    if (row.isManual) {
      // Update manual payment description
      setManualPayments(prev => prev.map(p => 
        p.id === row.manualId ? { ...p, notes: editDescriptionValue } : p
      ));
    }
    // Note: For regular tasks, you would need to update the task in the context
    // This would require adding an updateTaskDescription function to AppContext
    
    setEditingDescription(null);
    setEditDescriptionValue('');
  };

  const handleDescriptionCancel = () => {
    setEditingDescription(null);
    setEditDescriptionValue('');
  };

  const handleCategoryPayment = (categoryData) => {
    // Store category payment data with tasks
    // This would typically update the context/state to mark these tasks with the category
    
    // For now, we'll just close the modal and clear selection
    // In a real app, you'd update the tasks with category information
    setShowCategoryPaymentModal(false);
    setSelectedRows([]);
  };

  // Show skeleton during initial load
  if (initialLoading) {
    return <FinancialSkeleton />;
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>

      {/* ── Payments table ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

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
                <button key={status} onClick={() => setStatusFilter(prev => prev === status && status !== 'All' ? 'All' : status)} style={{
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
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: 10, 
                    border: '1.5px solid #3B5BFC', 
                    background: '#EEF2FF', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6 
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B5BFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>{dateFrom} → {dateTo}</span>
                  <button onClick={(e) => { e.stopPropagation(); setDateFrom(''); setDateTo(''); setDateRangeFilter('30days'); setShowDateDropdown(false); }}
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
                      if (dateRangeFilter === range.value) return;
                      setDateRangeFilter(range.value);
                      const today = new Date();
                      today.setHours(23, 59, 59, 999); // Set to end of today
                      if (range.value === 'all') { 
                        setDateFrom(''); 
                        setDateTo(''); 
                      }
                      else if (range.value === '7days') { 
                        const d = new Date();
                        d.setDate(d.getDate() - 6); // 6 days ago + today = 7 days
                        d.setHours(0, 0, 0, 0);
                        setDateFrom(d.toISOString().split('T')[0]); 
                        setDateTo(today.toISOString().split('T')[0]); 
                      }
                      else if (range.value === '30days') { 
                        const d = new Date();
                        d.setDate(d.getDate() - 29); // 29 days ago + today = 30 days
                        d.setHours(0, 0, 0, 0);
                        setDateFrom(d.toISOString().split('T')[0]); 
                        setDateTo(today.toISOString().split('T')[0]); 
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
                    style={{ 
                      padding: '6px 8px', 
                      borderRadius: 10, 
                      border: '1.5px solid var(--border)', 
                      background: 'var(--bg-surface)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 32,
                      minHeight: 32
                    }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
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
            <button
              onClick={() => setShowCouponPanel(true)}
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
              <Plus size={12} /> Coupon
            </button>
            <button
              onClick={() => setShowOrgPanel(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,91,252,0.25)',
                transition: 'opacity 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Building2 size={12} /> Organization
              {pendingOrgCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: 10,
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(239,68,68,0.4)',
                }}>
                  {pendingOrgCount}
                </span>
              )}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
            {sorted.length > rowsPerPage && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={12} color="var(--text-muted)" />
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 50, textAlign: 'center' }}>
                    {currentPage} / {Math.ceil(sorted.length / rowsPerPage)}
                  </span>
                  <button
                    onClick={() => handlePageChange(Math.min(Math.ceil(sorted.length / rowsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(sorted.length / rowsPerPage)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === Math.ceil(sorted.length / rowsPerPage) ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: currentPage === Math.ceil(sorted.length / rowsPerPage) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: currentPage === Math.ceil(sorted.length / rowsPerPage) ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={12} color="var(--text-muted)" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.2fr 1fr 1.3fr 1fr 0.9fr 1fr',
          padding: '10px 20px',
          borderBottom: '1.5px solid var(--border-light)',
          background: 'var(--bg-subtle)',
          flexShrink: 0,
        }}>
          {['Organization', 'User Name', 'Phone Number', 'Payment ID', 'Date & Time', 'Coupon', 'Plan', 'Amount'].map((h, i) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i === 7 ? 'right' : 'left' }}>
              {h} {i === 0 && selectedRows.length > 0 && <span style={{ color: '#3B5BFC', marginLeft: 4, fontWeight: 800 }}>({selectedRows.length}) ₹{selectedRows.reduce((sum, row) => sum + row.amount, 0).toLocaleString()}</span>}
            </div>
          ))}
        </div>

        {/* Rows */}
        {pageLoading ? (
          <FinancialSkeleton />
        ) : sorted.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={26} color="#3B5BFC" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No payment records yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 220 }}>Payment records will appear here once tasks are assigned and budgets are set.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row, idx) => {
              const isLast = idx === sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).length - 1;
              const key = `${row.id}-${row.memberName}`;
              const isSelected = selectedRows.some(r => `${r.id}-${r.memberName}` === key);
              return (
                <div key={key} 
                  onClick={() => toggleRow(row)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.2fr 1fr 1.3fr 1fr 0.9fr 1fr',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
                    background: isSelected ? '#EEF2FF' : row.isPaid ? 'var(--bg-surface)' : 'var(--bg-surface)',
                    transition: 'background 0.12s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#EEF2FF' : 'var(--bg-surface)'; }}
                >
                  {/* Organization */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', wordWrap: 'break-word', lineHeight: '1.4', whiteSpace: 'normal', textTransform: 'capitalize' }}>
                        {row.title || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* User Name */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', wordWrap: 'break-word', lineHeight: '1.4', whiteSpace: 'normal' }}>
                    {row.memberName}
                  </div>

                  {/* Phone Number */}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, wordWrap: 'break-word', lineHeight: '1.4', whiteSpace: 'normal' }}>
                    {row.userPhone || row.memberPhone || 'N/A'}
                  </div>

                  {/* Payment ID */}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, wordWrap: 'break-word', lineHeight: '1.4', whiteSpace: 'normal', wordBreak: 'break-all' }}>
                    {row.isSubscription ? (row.paymentId || row.id) : `#${row.id}`}
                  </div>

                  {/* Date & Time */}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, wordWrap: 'break-word', lineHeight: '1.4', whiteSpace: 'normal' }}>
                    {new Date(row.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(row.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, wordWrap: 'break-word', lineHeight: '1.4', whiteSpace: 'normal' }}>
                    {row.coupon || '—'}
                  </div>

                  {/* Plan Type */}
                  <div>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      padding: '4px 10px', 
                      borderRadius: 6,
                      background: row.planType === 'Starter' ? '#FEF3C7' : row.planType === 'Professional' ? '#DBEAFE' : row.planType === 'Business' ? '#F3E8FF' : '#FFF7ED',
                      color: row.planType === 'Starter' ? '#D97706' : row.planType === 'Professional' ? '#1D4ED8' : row.planType === 'Business' ? '#9333EA' : '#F97316',
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
                    }}>
                      {row.planType || 'Starter'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: row.isPaid ? '#12C479' : '#6B7280', wordWrap: 'break-word', lineHeight: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    ₹ {row.amount.toLocaleString()}
                    {row.isSubscription && !row.fromHeaderUpgrade && (
                      <ArrowUpRight size={14} color="#3B5BFC" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          onClose={() => setShowAddPaymentModal(false)}
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

      {showCouponPanel && (
        <>
          <div 
            onClick={() => setShowCouponPanel(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          <CouponPanel
            onClose={() => setShowCouponPanel(false)}
          />
        </>
      )}

      {showOrgPanel && (
        <>
          <div 
            onClick={() => setShowOrgPanel(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          <OrganizationPanel
            onClose={() => setShowOrgPanel(false)}
          />
        </>
      )}
    </div>
  );
}

function OrganizationPanel({ onClose }) {
  const { refreshOrganizations, organizations } = useApp();
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(10); // Show 10 organizations initially
  const [customRequests, setCustomRequests] = useState([]);

  // Load custom plan requests from organizations context
  useEffect(() => {
    if (organizations && organizations.length > 0) {

      // Filter organizations that have customPlanRequest
      const requests = organizations
        .filter(org => org.customPlanRequest)
        .map(org => ({
          id: org.id,
          workspaceId: org.id,
          email: org.customPlanRequest.email || org.ownerEmail || 'N/A',
          description: org.customPlanRequest.description || org.customPlanRequest.message || 'No description available',
          requestDate: org.requestDate || org.createdAt || null,
          isCompleted: org.isCompleted || false,
          status: org.customPlanRequest.status || 'pending',
        }));

      setCustomRequests(requests);
    } else {

      setCustomRequests([]);
    }
  }, [organizations]);

  // Paginated requests
  const displayedRequests = customRequests.slice(0, displayCount);
  const hasMore = displayCount < customRequests.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 10); // Load 10 more
  };

  const handleMarkComplete = async (requestId) => {
    try {
      setLoading(true);
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      // Update workspace document to mark customPlanRequest as completed
      await updateDoc(doc(db, 'workspaces', requestId), {
        'customPlanRequest.status': 'completed',
        'customPlanRequest.completedAt': new Date().toISOString(),
        isCompleted: true,
      });
      
      toast.success('Request marked as complete');
      
      // Refresh organizations in the main context
      if (refreshOrganizations) {
        await refreshOrganizations();
      }
      
      setLoading(false);
    } catch (err) {

      toast.error('Failed to mark as complete');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 480,
      height: '100%',
      background: '#fff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            Organizations
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading requests...</div>
          </div>
        ) : customRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Building2 size={48} color="var(--border)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              No custom plan requests yet
            </div>
            <div style={{ fontSize: 12 }}>
              Requests will appear here
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayedRequests.map(org => {
                return (
                  <div
                    key={org.id}
                    style={{
                      padding: '18px',
                      background: 'var(--bg-surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 12,
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    {/* Date and Time - Top Right Corner */}
                    <div style={{ 
                      position: 'absolute', 
                      top: 12, 
                      right: 12, 
                      fontSize: 10, 
                      color: 'var(--text-muted)', 
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                    }}>
                      {org.requestDate ? (
                        <>
                          {org.requestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {org.requestDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : 'N/A'}
                    </div>

                    {/* Completion Badge */}
                    {org.isCompleted && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: '#ECFDF5',
                          color: '#12C479',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          <CheckCircle size={10} /> Complete
                        </span>
                      </div>
                    )}

                    {/* Email - Without Icon */}
                    <div style={{ marginBottom: 12, paddingRight: 80 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {typeof org.email === 'string' ? org.email : 'N/A'}
                      </div>
                    </div>

                    {/* Description Box */}
                    <div style={{ 
                      marginBottom: 12, 
                      padding: '12px 14px', 
                      background: 'var(--bg-subtle)', 
                      borderRadius: 8, 
                      border: '1px solid var(--border-light)' 
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {typeof org.description === 'string' ? org.description : 'No description available'}
                      </div>
                    </div>

                    {/* Mark Complete Button - Only show if NOT completed */}
                    {!org.isCompleted && (
                      <button
                        onClick={() => handleMarkComplete(org.id)}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, #12C479, #059669)',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(18,196,121,0.25)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(18,196,121,0.35)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(18,196,121,0.25)';
                        }}
                      >
                        <CheckCircle size={14} /> Complete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginTop: 16,
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = '#3B5BFC';
                  e.currentTarget.style.color = '#3B5BFC';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CouponPanel({ onClose }) {
  const [couponText, setCouponText] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [durationUnit, setDurationUnit] = useState('days');
  const [durationValue, setDurationValue] = useState('');
  const [amount, setAmount] = useState('');
  const [planType, setPlanType] = useState('all');
  const [usageLimit, setUsageLimit] = useState(''); // Per workspace limit
  const [totalCountLimit, setTotalCountLimit] = useState(''); // Total count limit across all workspaces
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false); // Toggle create form visibility
  const [couponError, setCouponError] = useState(''); // Error message for duplicate coupon
  const [checkingDuplicate, setCheckingDuplicate] = useState(false); // Loading state for duplicate check

  // Load coupons from Firestore on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const result = await getCouponsOptimized(100);
        setCoupons(result);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load coupons');
        setLoading(false);
      }
    };
    
    loadCoupons();
  }, []);

  // Check for duplicate coupon code while typing
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!couponText.trim()) {
        setCouponError('');
        return;
      }

      setCheckingDuplicate(true);
      
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        const couponsRef = collection(db, 'coupons');
        const codeToCheck = couponText.trim().toUpperCase();
        const q = query(couponsRef, where('code', '==', codeToCheck));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setCouponError('Coupon code already exists');
        } else {
          setCouponError('');
        }
      } catch (err) {
        // Silent error handling
      } finally {
        setCheckingDuplicate(false);
      }
    };

    // Debounce the check by 500ms
    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [couponText]);

  const handleCreate = async () => {
    // Validate coupon code is not empty
    if (!couponText.trim()) {
      setCouponError('Coupon code is required');
      return;
    }
    
    const newCoupon = {
      code: couponText,
      type: discountType,
      value: discountType === 'percentage' ? parseInt(discountValue) : parseInt(amount),
      duration: discountType !== 'percentage' ? { value: parseInt(durationValue), unit: durationUnit } : null,
      plan: planType,
      used: 0,
      totalUsed: 0, // Total uses across all workspaces
      usageByWorkspace: {}, // Track usage per workspace
      limit: usageLimit ? parseInt(usageLimit) : null, // Usage limit per workspace
      totalCountLimit: totalCountLimit ? parseInt(totalCountLimit) : null, // Total count limit across all workspaces
      active: true,
      createdAt: new Date(),
    };
    
    try {
      const { collection, addDoc, serverTimestamp, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      // Check if coupon code already exists (case-insensitive)
      const couponsRef = collection(db, 'coupons');
      const codeToCheck = couponText.trim().toUpperCase();
      const q = query(couponsRef, where('code', '==', codeToCheck));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setCouponError('Coupon code already exists');
        return;
      }
      
      await addDoc(collection(db, 'coupons'), {
        ...newCoupon,
        code: codeToCheck, // Store in uppercase
        createdAt: serverTimestamp(),
      });
      
      toast.success('Coupon created successfully');
      
      // Reset form
      setCouponText('');
      setDiscountValue('');
      setDurationValue('');
      setAmount('');
      setUsageLimit('');
      setTotalCountLimit('');
      setCouponError('');
    } catch (err) {
      setCouponError('Failed to create coupon');
      toast.error('Failed to create coupon');
    }
  };

  const isFormValid = couponText && (
    discountType === 'percentage' ? discountValue : (durationValue && amount)
  );

  const toggleCouponStatus = async (id) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const coupon = coupons.find(c => c.id === id);
      await updateDoc(doc(db, 'coupons', id), {
        active: !coupon.active
      });
      toast.success('Coupon status updated');
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  const deleteCoupon = async (id) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Coupon deleted successfully');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 420,
      height: '100%',
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Manage Coupons</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Create and manage discount coupons</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          
          {/* Created Coupons List - Hidden when create form is shown */}
          {!showCreateForm && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Created Coupons
                    {coupons.length > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 10 }}>
                        {coupons.length}
                      </span>
                    )}
                  </div>
                </div>
                {/* + Button to show create form */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                  }}
                >
                  <Plus size={14} /> New Coupon
                </button>
              </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                Loading coupons...
              </div>
            ) : coupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  No coupons yet. Create your first coupon!
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {coupons.map(coupon => (
                  <div key={coupon.id} style={{
                    padding: '14px',
                    border: `1.5px solid ${coupon.active ? 'var(--border)' : '#F3F4F6'}`,
                    borderRadius: 10,
                    background: coupon.active ? 'var(--bg-surface)' : '#F9FAFB',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: coupon.active ? '#7C3AED' : '#9CA3AF', letterSpacing: '0.5px' }}>{coupon.code}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                          {coupon.type === 'percentage'
                            ? `${coupon.value}% off`
                            : `${coupon.duration?.value} ${coupon.duration?.unit} • ₹${coupon.value?.toLocaleString()}`
                          }
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#EEF2FF', color: '#3B5BFC', textTransform: 'capitalize' }}>
                            {coupon.plan === 'all' ? 'All Plans' : coupon.plan}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <button
                          onClick={() => toggleCouponStatus(coupon.id)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: coupon.active ? '#ECFDF5' : '#FEF2F2', color: coupon.active ? '#12C479' : '#EF4444', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {coupon.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Total Count Badge - Purple */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: '#F5F3FF', border: '1px solid #E9D5FF' }}>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>Count:</span>
                        <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: 12 }}>
                          {coupon.totalUsed || 0}
                          {coupon.totalCountLimit && <span style={{ color: '#9CA3AF' }}> / {coupon.totalCountLimit}</span>}
                        </span>
                      </div>
                      
                      {/* Total Count Limit Badge - if limit exists */}
                      {coupon.totalCountLimit && (
                        <div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#F5F3FF', color: '#7C3AED', fontWeight: 600, border: '1px solid #E9D5FF' }}>
                          Limit: {coupon.totalCountLimit}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Create New Coupon Form - Shown when + button clicked */}
          {showCreateForm && (
            <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: 4, 
                      display: 'flex', 
                      alignItems: 'center',
                      color: 'var(--text-secondary)',
                      borderRadius: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    title="Back to coupons list"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Coupon</div>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} color="var(--text-muted)" />
                </button>
              </div>
            
            {/* Coupon Code */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                COUPON CODE *
              </label>
              <input
                type="text"
                value={couponText}
                onChange={e => { setCouponText(e.target.value.toUpperCase()); }}
                placeholder="e.g., SAVE20"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1.5px solid ${couponError ? '#FCA5A5' : 'var(--border)'}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  background: couponError ? '#FEF2F2' : 'var(--input-bg)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = couponError ? '#FCA5A5' : '#3B5BFC'}
                onBlur={e => e.target.style.borderColor = couponError ? '#FCA5A5' : 'var(--border)'}
              />
            </div>

            {/* Discount Type */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                DISCOUNT TYPE *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'duration', label: 'Days / Months' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDiscountType(opt.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      border: discountType === opt.value ? '2px solid #3B5BFC' : '1.5px solid var(--border)',
                      background: discountType === opt.value ? '#EEF2FF' : 'var(--bg-surface)',
                      color: discountType === opt.value ? '#3B5BFC' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Percentage fields */}
            {discountType === 'percentage' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  DISCOUNT PERCENTAGE *
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder="e.g., 20"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    background: 'var(--input-bg)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            )}

            {/* Duration fields */}
            {discountType === 'duration' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    DURATION *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      value={durationValue}
                      onChange={e => setDurationValue(e.target.value)}
                      placeholder="e.g., 30"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1.5px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        background: 'var(--input-bg)',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <select
                      value={durationUnit}
                      onChange={e => setDurationUnit(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1.5px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        background: 'var(--input-bg)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    AMOUNT (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g., 499"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      background: 'var(--input-bg)',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </>
            )}

            {/* Plan Type */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                APPLICABLE PLAN *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['all', 'starter', 'professional', 'business', 'enterprise'].map(plan => (
                  <button
                    key={plan}
                    onClick={() => setPlanType(plan)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 16,
                      border: planType === plan ? '2px solid #3B5BFC' : '1.5px solid var(--border)',
                      background: planType === plan ? '#EEF2FF' : 'var(--bg-surface)',
                      color: planType === plan ? '#3B5BFC' : 'var(--text-secondary)',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {plan === 'all' ? 'All Plans' : plan}
                  </button>
                ))}
              </div>
            </div>

            {/* Usage Limit Per Workspace */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                USAGE LIMIT PER WORKSPACE (Optional)
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
                placeholder="e.g., 2"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  background: 'var(--input-bg)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                How many times <strong>each workspace</strong> can use this coupon. Leave empty for unlimited per workspace.
              </div>
            </div>

            {/* Total Count Limit */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                TOTAL COUNT LIMIT (Optional)
              </label>
              <input
                type="number"
                value={totalCountLimit}
                onChange={e => setTotalCountLimit(e.target.value)}
                placeholder="e.g., 10"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  background: 'var(--input-bg)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Maximum total uses <strong>across all workspaces</strong>. Leave empty for unlimited total uses.
              </div>
            </div>

            <button
              onClick={() => {
                handleCreate();
                setShowCreateForm(false); // Close form after creating
              }}
              disabled={!isFormValid}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: isFormValid ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : '#E5E7EB',
                color: isFormValid ? '#fff' : '#9CA3AF',
                fontSize: 12,
                fontWeight: 700,
                cursor: isFormValid ? 'pointer' : 'not-allowed',
              }}
            >
              Create Coupon
            </button>
            </div>
          )}
        </div>
      </div>
  );
}

