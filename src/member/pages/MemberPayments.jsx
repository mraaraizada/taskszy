import { useState, useEffect } from 'react';
import { Clock, CheckCircle, TrendingUp, ArrowUpRight, Wallet, Calendar, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function PaymentDetailPanel({ task, member, onClose }) {
  if (!task) return null;
  const isPaid = task._status === 'paid';
  const budget = task.members.find(m => m.id === member.id)?.budget || 0;
  const stage  = task.members.find(m => m.id === member.id)?.stage || task.stage;

  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 400,
      background: '#fff', zIndex: 10, display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', borderLeft: '1.5px solid #E8EAEF',
    }}>
      {/* Header */}
      <div style={{ padding: '22px 24px 18px', borderBottom: '1.5px solid #F0F2F8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1D2E' }}>Payment Receipt</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>#{task.id}</div>
        </div>
        <button onClick={onClose} style={{ background: '#F0F2F8', border: 'none', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={14} color="#6B7280" />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Status badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: isPaid ? '#ECFDF5' : '#FFF7ED', border: `1.5px solid ${isPaid ? '#BBF7D0' : '#FED7AA'}` }}>
            {isPaid ? <CheckCircle size={18} color="#12C479" /> : <Clock size={18} color="#F97316" />}
            <span style={{ fontSize: 13, fontWeight: 700, color: isPaid ? '#12C479' : '#F97316' }}>{isPaid ? 'Paid' : 'Pending'}</span>
          </div>
        </div>

        {/* Payment info */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Payment Information</div>
          <div style={{ background: '#FAFBFF', borderRadius: 12, padding: '14px 16px', border: '1px solid #F0F2F8', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              { label: 'Task ID',    value: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{task.id}</span> },
              { label: 'Task Title', value: task.title },
              { label: 'Member',     value: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {member.avatarImg ? (
                    <img 
                      src={member.avatarImg} 
                      alt={member.name}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: member.color || '#3B5BFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>
                      {member.avatar || member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span>{member.name}</span>
                </div>
              )},
              { label: 'Role',       value: member.role },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1D2E', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ height: 1, background: '#F0F2F8' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Amount</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: isPaid ? '#12C479' : '#F97316' }}>₹ {budget.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Due Date</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1D2E' }}>{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {isPaid && task.paidOn && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Paid On</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#12C479' }}>{new Date(task.paidOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Stage</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isPaid ? '#ECFDF5' : '#EEF2FF', color: isPaid ? '#12C479' : '#3B5BFC' }}>{isPaid ? 'Complete' : stage}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Description</div>
            <div style={{ background: '#FAFBFF', borderRadius: 12, padding: '12px 14px', border: '1px solid #F0F2F8' }}>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{task.description}</p>
            </div>
          </div>
        )}

        {/* Update Instructions - Show when member or task is in Update stage */}
        {(stage === 'Update' || task.stage === 'Update') && task.updateNote && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Update Instructions</div>
            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '12px 14px', border: '1.5px solid #FDE68A' }}>
              <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, margin: 0 }}>{task.updateNote}</p>
            </div>
          </div>
        )}

        {/* Download */}
        <button style={{ width: '100%', padding: '13px 20px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59,91,252,0.25)' }}>
          <Download size={15} /> Download PDF Receipt
        </button>
      </div>
    </div>
  );
}

export default function MemberPayments({ member, setPageFilteredData = null, filterToTaskId = null }) {
  const { tasks, financials, STAGE_COLORS, STAGE_BG, payments, getPaymentsForTask } = useApp();
  const [hoveredDescription, setHoveredDescription] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const rowsPerPage = 15;

  // ⭐ PHASE 8: Get only payments for this specific member
  console.log('💰 Member Payment Filter - Input:', {
    memberId: member.id,
    memberName: member.name,
    memberUid: member.uid,
    memberRole: member.role,
    memberUserRole: member.userRole,
    totalPayments: payments.length,
    allPaymentMemberIds: payments.map(p => ({ 
      paymentId: p.id,
      taskId: p.taskId, 
      memberId: p.memberId,
      memberName: p.memberName,
      amount: p.amount,
      paymentType: p.paymentType,
      assignedTo: p.assignedTo 
    }))
  });
  
  const myPayments = payments.filter(p => {
    // ⭐ EXCLUDE all payments if member is on hold
    if (member.isOnHold) {
      console.log('❌ Member is on hold - excluding all payments');
      return false;
    }
    
    // ⭐ EXCLUDE additional payments for team members (admin only)
    if (p.paymentType === 'additional') {
      console.log('❌ Excluding additional payment for team member:', p.id, p.taskId);
      return false;
    }
    
    // ⭐ EXCLUDE task budget payments (only for admin dashboard)
    if (p.paymentType === 'task-budget') {
      console.log('❌ Excluding task budget payment:', p.id);
      return false;
    }
    
    // Check if payment is assigned to this member by memberId
    if (p.memberId && p.memberId === member.id) {
      console.log('✅ Payment matched by memberId:', p.id, p.taskId);
      return true;
    }
    
    // Check by memberUid if available
    if (p.memberUid && member.uid && p.memberUid === member.uid) {
      console.log('✅ Payment matched by memberUid:', p.id, p.taskId);
      return true;
    }
    
    // Check assignedTo array
    if (p.assignedTo && Array.isArray(p.assignedTo)) {
      const isAssigned = p.assignedTo.some(a => a.id === member.id || (a.uid && member.uid && a.uid === member.uid));
      if (isAssigned) {
        console.log('✅ Payment matched by assignedTo:', p.id, p.taskId);
        return true;
      }
    }
    
    // Fallback: check if payment is for a task assigned to this member (old format)
    if (p.taskId && !p.memberId) {
      const task = tasks.find(t => t.id === p.taskId);
      const isTaskMember = task && task.members.some(m => m.id === member.id || (m.uid && member.uid && m.uid === member.uid));
      if (isTaskMember) {
        console.log('✅ Payment matched by task membership:', p.id, p.taskId);
        return true;
      }
    }
    
    return false;
  });
  
  console.log('💰 Member payments filtered:', {
    memberId: member.id,
    memberName: member.name,
    totalPayments: payments.length,
    myPayments: myPayments.length,
    paymentDetails: myPayments.map(p => ({ 
      taskId: p.taskId, 
      memberId: p.memberId, 
      amount: p.amount, 
      status: p.status 
    }))
  });
  
  // ⭐ Calculate earnings from payments - Total = Paid + Pending
  const paidPayments = myPayments.filter(p => p.status === 'Paid' || p.status === 'paid');
  const pendingPayments = myPayments.filter(p => p.status !== 'Paid' && p.status !== 'paid');
  
  const paidEarnings = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingEarnings = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalEarnings = paidEarnings + pendingEarnings; // ⭐ Total = Paid + Pending
  const totalPotential = paidEarnings + pendingEarnings; // Total if all payments are made
  const progressPct = totalPotential > 0 ? Math.round((paidEarnings / totalPotential) * 100) : 0;
  
  const myEarnings = { total: totalEarnings, paid: paidEarnings, pending: pendingEarnings };
  
  console.log('💰 Earnings calculation:', {
    totalPayments: myPayments.length,
    paidPayments: paidPayments.length,
    pendingPayments: pendingPayments.length,
    totalEarned: totalEarnings,
    paidAmount: paidEarnings,
    pendingAmount: pendingEarnings,
    totalPotential,
    progressPct
  });

  const getMyBudget = (task) => task.members.find(m => m.id === member.id)?.budget || 0;
  const getMyStage  = (task) => task.members.find(m => m.id === member.id)?.stage || task.stage;

  // ⭐ Build rows from payments (not tasks)
  let allRows = myPayments.map(payment => {
    const isPaid = payment.status === 'Paid' || payment.status === 'paid';
    
    // ⭐ Check if this is a manual payment (taskId = "PAYMENT" or isManualPayment flag)
    const isManualPayment = payment.isManualPayment || payment.taskId === 'PAYMENT';
    
    if (isManualPayment) {
      // ⭐ Manual payment - create row without task data
      return {
        id: payment.taskId || 'PAYMENT',
        taskId: payment.taskId || 'PAYMENT',
        paymentId: payment.id,
        title: payment.taskTitle || 'Manual Payment',
        description: payment.notes || '',
        deadline: payment.dueDate || payment.createdAt,
        amount: payment.amount || 0,
        _status: isPaid ? 'paid' : 'pending',
        isPaid: isPaid,
        paidOn: payment.paidAt ? (payment.paidAt.toDate ? payment.paidAt.toDate() : payment.paidAt) : null,
        createdOn: payment.createdAt ? (payment.createdAt.toDate ? payment.createdAt.toDate() : payment.createdAt) : null,
        stage: '', // ⭐ Manual payment - no stage (empty)
        members: payment.assignedTo || [],
        isManualPayment: true,
      };
    }
    
    // ⭐ Task-linked payment - find the task
    const task = tasks.find(t => t.id === payment.taskId);
    
    // ⭐ Handle case where task might not exist (deleted or archived)
    if (!task) {
      console.warn('⚠️ Task not found for payment:', payment.id, payment.taskId);
      // Create a minimal row with payment data
      return {
        id: payment.taskId,
        taskId: payment.taskId,
        paymentId: payment.id,
        title: payment.taskTitle || 'Task Not Found',
        description: payment.notes || '',
        deadline: payment.dueDate || payment.createdAt,
        amount: payment.amount || 0,
        _status: isPaid ? 'paid' : 'pending',
        isPaid: isPaid,
        paidOn: payment.paidAt ? (payment.paidAt.toDate ? payment.paidAt.toDate() : payment.paidAt) : null,
        createdOn: payment.createdAt ? (payment.createdAt.toDate ? payment.createdAt.toDate() : payment.createdAt) : null,
        stage: '', // ⭐ Deleted task - no stage (empty)
        members: payment.assignedTo || [],
        isTaskDeleted: true,
      };
    }
    
    return {
      ...task,
      paymentId: payment.id,
      amount: payment.amount || 0, // ⭐ Ensure amount is always a number
      // ⭐ Only use payment notes (from admin dashboard), NOT task description
      description: payment.notes || '',
      _status: isPaid ? 'paid' : 'pending',
      isPaid: isPaid,
      paidOn: payment.paidAt ? (payment.paidAt.toDate ? payment.paidAt.toDate() : payment.paidAt) : null,
      createdOn: payment.createdAt ? (payment.createdAt.toDate ? payment.createdAt.toDate() : payment.createdAt) : null,
    };
  });
  
  console.log('💰 Built payment rows:', {
    totalRows: allRows.length,
    manualPayments: allRows.filter(r => r.isManualPayment).length,
    taskLinkedPayments: allRows.filter(r => !r.isManualPayment && !r.isTaskDeleted).length,
    deletedTaskPayments: allRows.filter(r => r.isTaskDeleted).length,
    pendingRows: allRows.filter(r => r._status === 'pending').length,
    paidRows: allRows.filter(r => r._status === 'paid').length,
    rowAmounts: allRows.map(r => ({ id: r.id, amount: r.amount, status: r._status, isManual: r.isManualPayment }))
  });

  // ⭐ Store unfiltered count for "All" button
  const unfilteredCount = allRows.length;

  // Filter by date range (BEFORE status filter)
  let dateFilteredRows = allRows;
  if (dateFrom || dateTo) {
    dateFilteredRows = allRows.filter(task => {
      const taskDate = new Date(task.deadline);
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

  // ⭐ Filter by status (AFTER date filter)
  let filteredRows = dateFilteredRows;
  if (statusFilter === 'Pending') {
    filteredRows = dateFilteredRows.filter(t => t._status === 'pending');
  } else if (statusFilter === 'Paid') {
    filteredRows = dateFilteredRows.filter(t => t._status === 'paid');
  }
  // ⭐ If statusFilter === 'All', show all rows (no additional filtering)
  
  console.log('💰 After filtering:', {
    statusFilter,
    dateFrom,
    dateTo,
    unfilteredCount,
    dateFilteredCount: dateFilteredRows.length,
    finalFilteredCount: filteredRows.length,
    pendingRows: filteredRows.filter(r => r._status === 'pending').length,
    paidRows: filteredRows.filter(r => r._status === 'paid').length
  });

  // Use filtered rows for display
  allRows = filteredRows;
  
  // ⭐ Sort by due date (deadline) AFTER filtering - newest first
  allRows = allRows.sort((a, b) => {
    const dateA = new Date(a.deadline);
    const dateB = new Date(b.deadline);
    return dateB - dateA; // Newest deadline first
  });
  
  // Apply search filter if filterToTaskId is provided (show only that task)
  if (filterToTaskId) {
    allRows = allRows.filter(r => r.id === filterToTaskId || r.taskId === filterToTaskId);
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allRows.length / rowsPerPage)); // ⭐ Ensure at least 1 page
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRows = allRows.slice(startIndex, endIndex);
  
  // Update filtered data for search
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ tasks: allRows });
    }
  }, [allRows.length, statusFilter, dateFrom, dateTo, filterToTaskId, setPageFilteredData]);
  
  console.log('💰 Pagination:', {
    totalRows: allRows.length,
    totalPages,
    currentPage,
    rowsPerPage,
    startIndex,
    endIndex,
    paginatedRowsCount: paginatedRows.length
  });

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>

      {/* ── Stats banner ── */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 16, padding: '20px 28px',
        border: '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center',
        transition: 'background 0.25s, border-color 0.25s',
      }}>
        {[
          { label: 'Total', value: `₹${myEarnings.total.toLocaleString()}`,   color: '#3B5BFC', bg: '#EEF2FF',  icon: Wallet },
          { label: 'Paid',         value: `₹${myEarnings.paid.toLocaleString()}`,    color: '#12C479', bg: '#ECFDF5',  icon: CheckCircle },
          { label: 'Pending',      value: `₹${myEarnings.pending.toLocaleString()}`, color: '#F97316', bg: '#FFF7ED',  icon: Clock },
          { label: 'Paid Rate',    value: `${progressPct}%`,                         color: '#7C3AED', bg: '#F5F3FF',  icon: TrendingUp },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 14,
              padding: '0 24px',
              borderRight: i < 3 ? '1px solid var(--border-light)' : 'none',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={s.color} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Merged Payments table ── */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

        {/* Table toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1.5px solid #F0F2F8',
          background: '#FAFBFF',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Pending', 'Paid'].map(status => (
                <button key={status} onClick={() => setStatusFilter(status)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: statusFilter === status ? 'none' : '1.5px solid #E8EAEF',
                  background: statusFilter === status ? (status === 'Pending' ? '#F97316' : status === 'Paid' ? '#12C479' : '#3B5BFC') : '#fff',
                  color: statusFilter === status ? '#fff' : '#6B7280', transition: 'all 0.15s',
                }}>{status}</button>
              ))}
            </div>
            <div style={{ height: 32, width: '1px', background: '#E8EAEF' }} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDatePicker(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${(dateFrom || dateTo) ? '#3B5BFC' : '#E8EAEF'}`,
                  background: (dateFrom || dateTo) ? '#EEF2FF' : '#fff',
                }}
              >
                <Calendar size={14} color={(dateFrom || dateTo) ? '#3B5BFC' : '#9CA3AF'} />
                {(dateFrom || dateTo) && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>
                    {dateFrom && new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {dateFrom && dateTo && ' – '}
                    {dateTo && new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 100,
                  background: '#fff', borderRadius: 12, padding: '14px 16px',
                  border: '1.5px solid #E8EAEF', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>From</span>
                    <input type="date" value={tempDateFrom} onChange={e => setTempDateFrom(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E8EAEF', fontSize: 12, color: '#374151', background: '#F9FAFB', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>To</span>
                    <input type="date" value={tempDateTo} onChange={e => setTempDateTo(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E8EAEF', fontSize: 12, color: '#374151', background: '#F9FAFB', outline: 'none' }} />
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
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: (tempDateFrom || tempDateTo) ? '#3B5BFC' : '#F3F4F6', color: (tempDateFrom || tempDateTo) ? '#fff' : '#9CA3AF', fontSize: 11, fontWeight: 700, cursor: (tempDateFrom || tempDateTo) ? 'pointer' : 'default' }}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {allRows.length > rowsPerPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: '1.5px solid var(--border)',
                  background: currentPage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={12} color="var(--text-muted)" />
              </button>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '520px 1.5fr 180px 120px 110px 150px',
          padding: '10px 20px',
          borderBottom: '1.5px solid #F0F2F8',
          background: '#FAFBFF',
          flexShrink: 0,
        }}>
          {['Task', 'Description', 'Stage', 'Due Date', 'Amount', 'Paid On'].map((h, i) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i === 1 ? 'left' : (i === 4 || i === 5) ? 'right' : 'left', paddingLeft: i === 2 ? 16 : 0 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {allRows.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '80px 24px', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={28} color="#12C479" strokeWidth={1.6} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1D2E', marginBottom: 6 }}>No payment records yet</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 280 }}>Your earnings will appear here once tasks are completed and payments are processed</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {paginatedRows.map((task, idx) => {
              const budget  = task.amount || 0; // ⭐ Use payment amount, not task member budget
              const stage   = getMyStage(task);
              const isPaid  = task._status === 'paid';
              const isLast  = idx === paginatedRows.length - 1;
              
              // ⭐ Check if current member is on hold for this task
              const currentMemberInTask = task.members?.find(m => String(m.id) === String(member.id));
              const isMemberOnHold = currentMemberInTask?.isOnHold || false;
              
              // ⭐ Check if entire task is paused OR if current member is on hold
              const isTaskPaused = task.paused || task.isPaused || false;
              const showHold = isTaskPaused || isMemberOnHold;
              
              // ⭐ Use member-specific stage if available, otherwise use task stage
              const displayStage = currentMemberInTask?.stage || stage;
              
              // ⭐ Debug: Log paused status for task B6I41C7A
              if (task.id === 'B6I41C7A') {
                console.log('🔍 Task B6I41C7A payment entry:', {
                  taskId: task.id,
                  paused: task.paused,
                  isPaused: task.isPaused,
                  isTaskPaused: isTaskPaused,
                  isMemberOnHold: isMemberOnHold,
                  showHold: showHold,
                  stage: stage,
                  displayStage: displayStage,
                  memberId: member.id,
                  memberIdType: typeof member.id,
                  currentMemberInTask: currentMemberInTask,
                  allTaskMembers: task.members,
                  taskMemberIds: task.members?.map(m => ({ id: m.id, type: typeof m.id, isOnHold: m.isOnHold })),
                  taskObject: task
                });
              }
              
              // ⭐ Generate unique key - use paymentId if available, otherwise create unique composite key
              const uniqueKey = task.paymentId 
                ? task.paymentId 
                : task.manualId 
                  ? `manual-${task.manualId}` 
                  : `${task.id || 'NOTASK'}-${task.memberId || 'NOMEMBER'}-${idx}`;

              return (
                <div key={uniqueKey} style={{
                  display: 'grid', gridTemplateColumns: '520px 1.5fr 180px 120px 110px 150px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: isLast ? 'none' : '1px solid #F4F5F8',
                  background: isPaid ? '#FAFFFE' : '#FFFCFA',
                  transition: 'background 0.12s',
                  cursor: 'pointer',
                  position: 'relative', zIndex: 10,
                }}
                  onClick={() => setSelectedTask(task)}
                  onMouseEnter={e => e.currentTarget.style.background = '#F7F8FF'}
                  onMouseLeave={e => e.currentTarget.style.background = isPaid ? '#FAFFFE' : '#FFFCFA'}
                >
                  {/* Task name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: isPaid ? '#ECFDF5' : '#FFF7ED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isPaid
                        ? <CheckCircle size={14} color="#12C479" strokeWidth={2.5} />
                        : <Clock size={14} color="#F97316" strokeWidth={2.5} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: isPaid ? '#12C479' : '#3B5BFC', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>#{task.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, position: 'relative' }}>
                    <div 
                      onMouseEnter={() => setHoveredDescription(task.description)}
                      onMouseLeave={() => setHoveredDescription(null)}
                      style={{ 
                        fontSize: 11, 
                        color: '#6B7280', 
                        background: '#F9FAFB', 
                        padding: '6px 12px', 
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        width: '100%',
                        fontWeight: 500,
                        cursor: 'default',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: 32,
                      }}
                    >
                      {task.description || '—'}
                    </div>
                    {hoveredDescription === task.description && task.description && (
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
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* Stage */}
                  <div style={{ paddingLeft: 16 }}>
                    {/* ⭐ Show stage only if not empty (manual payments have empty stage) */}
                    {displayStage && displayStage.trim() !== '' ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: showHold ? '#FFF7ED' : (isPaid ? '#ECFDF5' : STAGE_BG[displayStage]), color: showHold ? '#F97316' : (isPaid ? '#12C479' : STAGE_COLORS[displayStage]) }}>
                        {showHold ? 'Hold' : (isPaid ? 'Complete' : displayStage)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                    )}
                  </div>

                  {/* Due date */}
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                      {isPaid && <ArrowUpRight size={12} color="#12C479" />}
                      <span style={{ fontSize: 15, fontWeight: 800, color: isPaid ? '#12C479' : '#F97316', letterSpacing: '-0.3px' }}>₹ {budget.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: isPaid ? '#12C479' : '#F97316', background: isPaid ? '#ECFDF5' : '#FFF7ED', padding: '1px 7px', borderRadius: 6, marginTop: 2, display: 'inline-block' }}>
                      {isPaid ? 'paid' : 'pending'}
                    </div>
                  </div>

                  {/* Paid On */}
                  <div style={{ textAlign: 'right' }}>
                    {isPaid && task.paidOn ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#12C479' }}>
                          {new Date(task.paidOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
                          {new Date(task.paidOn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTask && (
        <>
          <div
            onClick={() => setSelectedTask(null)}
            style={{ position: 'absolute', inset: 0, zIndex: 9, cursor: 'default' }}
          />
          <PaymentDetailPanel task={selectedTask} member={member} onClose={() => setSelectedTask(null)} />
        </>
      )}

    </div>
  );
}
