import React, { useState, useEffect, useRef } from 'react';
import { notify } from '../lib/notify';
import { Plus, Search, Mail, Star, CheckCircle, Clock, Edit2, X, User, Users, Phone, MapPin, Lock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Avatar from '../components/Avatar';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';
import { createMemberAccount, createMemberFallback } from '../lib/memberService';
import { updateProfile } from '../lib/userProfileService';
import { monitor } from '../lib/performanceMonitor';

const AVATAR_COLORS = ['#3B5BFC','#7C3AED','#12C479','#F97316','#EF4444','#06B6D4','#EC4899','#8B5CF6'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function getColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── Add / Edit Member Modal ─────────────────────────────────────────────────
function MemberModal({ member, onClose, onSave, roles, managementMode = false, onNavigateToManage, currentUser, existingTeam = [] }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { workspaceId } = useApp();
  const isEdit = !!member;
  
  // Load cached form data for new members only
  const getCachedFormData = () => {
    if (isEdit) return null; // Don't use cache for editing
    try {
      const cached = localStorage.getItem('teamMemberFormCache');
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      return null;
    }
  };
  
  const cachedData = getCachedFormData();
  
  const [form, setForm] = useState({
    name: member?.name || cachedData?.name || '',
    email: member?.email || cachedData?.email || '',
    phone: member?.phone || cachedData?.phone || '',
    location: member?.location || cachedData?.location || '',
    role: member?.role || cachedData?.role || '', // Don't auto-select first role - require manual selection
    password: cachedData?.password || '',
    desc: member?.desc || cachedData?.desc || '',
    status: member?.status || 'Active',
  });
  
  // Save form data to cache whenever it changes (only for new members)
  useEffect(() => {
    if (!isEdit) {
      try {
        localStorage.setItem('teamMemberFormCache', JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          role: form.role,
          password: form.password,
          desc: form.desc,
        }));
      } catch (err) {
        // Ignore cache errors
      }
    }
  }, [form, isEdit]);
  
  const f = k => v => setForm(p => ({ ...p, [k]: v }));
  const [modalError, setModalError] = useState('');
  
  // Function to close modal without clearing cache (for X button)
  const handleCloseWithoutClear = () => {
    onClose();
  };
  
  // Clear cache only on successful save
  const handleCloseAndClearCache = () => {
    if (!isEdit) {
      try {
        localStorage.removeItem('teamMemberFormCache');
      } catch (err) {
        // Ignore
      }
    }
    onClose();
  };

  const handleSaveClick = () => {
    // Validate all required fields
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.location.trim() || !form.role) {
      setModalError('Please fill in all required fields.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setModalError('Please enter a valid email address.');
      return;
    }
    
    // Check for duplicate email in existing team (only for new members or if email changed)
    if (!isEdit || (isEdit && form.email.trim().toLowerCase() !== member?.email?.toLowerCase())) {
      const emailExists = existingTeam.some(m => 
        m.email?.toLowerCase() === form.email.trim().toLowerCase() && 
        m.id !== member?.id
      );
      
      if (emailExists) {
        setModalError('A team member with this email already exists. Please use a different email address.');
        return;
      }
    }
    
    // For new members, password is required
    if (!isEdit && !form.password.trim()) {
      setModalError('Password is required for new members.');
      return;
    }
    
    // Validate password length
    if (!isEdit && form.password.trim().length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }
    
    if (!workspaceId) {
      setModalError('Workspace not initialized. Please refresh and try again.');
      return;
    }
    
    setModalError('');
    requestAdminPassword(isEdit ? 'update this member' : 'add this member', async () => {
      const initials = getInitials(form.name);
      const color = member?.color || getColor(Math.floor(Math.random() * AVATAR_COLORS.length));
      
      // Find the selected role to get its roleType
      const selectedRole = roles.find(r => r.name === form.role);
      const roleType = selectedRole?.roleType || 'Team Member';

      // Map roleType to dashboard role
      let dashboardRole = 'member'; // default
      if (roleType === 'Admin') {
        dashboardRole = 'admin';
      } else if (roleType === 'Management') {
        dashboardRole = 'management';
      } else {
        dashboardRole = 'member';
      }

      // Generate member ID ONCE at the beginning for new members
      const memberId = member?.id || Date.now();
      
      const newMember = {
        ...member,
        ...form,
        avatar: initials,
        color,
        tasks: member?.tasks || 0,
        completed: member?.completed || 0,
        rating: member?.rating || 0,
        joined: member?.joined || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        id: memberId,
      };

      if (!isEdit) {
        // New member — Create using client-side method
        
        let uid;
        try {
          const result = await createMemberAccount({
            email: form.email.trim().toLowerCase(), // Ensure clean email
            password: form.password,
            role: dashboardRole,
            workspaceId,
            memberId: memberId, // Use the pre-generated ID
            name: form.name.trim(),
            phone: form.phone.trim()
          });
          
          uid = result.uid;
          
          // Show appropriate message based on whether admin needs to re-login
          if (result.requiresRelogin) {
            alert(`Team member created!\n\n${form.name} can log in with:\nEmail: ${form.email}\nPassword: ${form.password}\n\nYou will need to log in again.`);
          } else {
            // Admin stayed logged in - just show success

          }
        } catch (createErr) {

          // Display user-friendly error message
          const errorMessage = createErr.message || 'Failed to create member account. Please try again.';
          setModalError(errorMessage);
          
          // Don't close modal - let user fix the issue
          return;
        }
        
        // Auth account created successfully - save to team collection
        newMember.uid = uid;
        
        // Use actual current user info for addedBy field

        const addedByInfo = currentUser ? {
          uid: currentUser.uid || null, // Add uid for profile enrichment
          name: currentUser.name || 'Admin',
          avatar: currentUser.avatar || 'A',
          avatarImg: currentUser.avatarImg || null, // Add profile picture
          color: currentUser.color || '#3B5BFC',
          role: currentUser.role || 'Administrator' // Use display role name, not userRole
        } : { name: 'Admin', avatar: 'A', color: '#3B5BFC', role: 'Administrator' };

        onSave(newMember, addedByInfo);
        
        // Close modal and clear cache on successful save
        handleCloseAndClearCache();
      } else {
        // Editing existing member
        if (member?.uid) {
          try { 
            await updateProfile(member.uid, { 
              name: form.name,
              phone: form.phone,
              role: dashboardRole, // Use mapped dashboard role
              memberId: member.id 
            }); 

          } catch (err) {

          }
        }
        
        // If password is provided, send password reset email
        if (form.password.trim()) {
          try {
            const { sendPasswordResetEmail } = await import('../lib/memberService');
            await sendPasswordResetEmail(form.email);
            setModalError('');
            alert(`Password reset email sent to ${form.email}. The user can set a new password using the link in the email.`);
          } catch (err) {

            setModalError('Member updated, but failed to send password reset email. You can send it manually from Firebase Console.');
          }
        }
        
        onSave(newMember, null);
      }

      handleCloseAndClearCache();
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-surface)', borderRadius: '24px 24px 0 0', zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{isEdit ? 'Edit Member' : 'Add Team Member'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{isEdit ? 'Update member details and permissions' : 'Create a new account and assign a role'}</div>
          </div>
          <button onClick={handleCloseWithoutClear} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Personal details */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Personal Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Full Name *', key: 'name', icon: User, placeholder: 'John Doe' },
                { label: 'Email Address *', key: 'email', icon: Mail, placeholder: 'john@taskzy.io', readOnlyOnEdit: true },
                { label: 'Phone Number *', key: 'phone', icon: Phone, placeholder: '+1 555 0000' },
                { label: 'Location *', key: 'location', icon: MapPin, placeholder: 'City, State' },
              ].map(field => {
                const isReadOnly = isEdit && field.readOnlyOnEdit;
                return (
                  <div key={field.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <field.icon size={14} color="#9CA3AF" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type={field.key === 'phone' ? 'tel' : field.key === 'email' ? 'email' : 'text'}
                        value={form[field.key]} 
                        onChange={e => {
                          if (isReadOnly) return; // Prevent changes if read-only
                          // Only allow digits, +, -, spaces, and parentheses for phone
                          if (field.key === 'phone') {
                            const filtered = e.target.value.replace(/[^\d+\-\s()]/g, '');
                            // Limit to 12 digits (not counting special characters)
                            const digitsOnly = filtered.replace(/[^\d]/g, '');
                            if (digitsOnly.length <= 12) {
                              f(field.key)(filtered);
                            }
                          } else if (field.key === 'email') {
                            // Remove spaces from email
                            const filtered = e.target.value.replace(/\s/g, '');
                            f(field.key)(filtered);
                          } else {
                            f(field.key)(e.target.value);
                          }
                        }} 
                        readOnly={isReadOnly}
                        placeholder={field.placeholder}
                        maxLength={field.key === 'phone' ? 20 : undefined}
                        style={{ 
                          width: '100%', 
                          padding: '10px 14px 10px 32px', 
                          border: `1.5px solid ${isReadOnly ? '#E8EAEF' : 'var(--border)'}`, 
                          borderRadius: 10, 
                          fontSize: 13, 
                          color: isReadOnly ? '#9CA3AF' : 'var(--text-primary)', 
                          outline: 'none', 
                          background: isReadOnly ? '#F9FAFB' : 'var(--input-bg)', 
                          boxSizing: 'border-box',
                          cursor: isReadOnly ? 'not-allowed' : 'text',
                        }}
                        onFocus={e => !isReadOnly && (e.target.style.borderColor = '#3B5BFC')} 
                        onBlur={e => !isReadOnly && (e.target.style.borderColor = '#E8EAEF')} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Login credentials - Only show when adding new member */}
          {!isEdit && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Login Credentials</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username (Email)</label>
                  <div style={{ padding: '10px 14px', background: 'var(--input-bg)', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                    {form.email || 'Set email above'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Initial Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="#9CA3AF" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
                    <input 
                      type="password" 
                      value={form.password} 
                      onChange={e => f('password')(e.target.value)} 
                      placeholder="Set password..."
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px 10px 32px', 
                        border: '1.5px solid var(--border)', 
                        borderRadius: 10, 
                        fontSize: 13, 
                        color: 'var(--text-primary)', 
                        outline: 'none', 
                        background: 'var(--input-bg)', 
                        boxSizing: 'border-box',
                        cursor: 'text',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
                      onBlur={e => e.target.style.borderColor = '#E8EAEF'} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role - Only show when adding new member, not when editing */}
          {!isEdit && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Role Assignment *</div>
                {onNavigateToManage && (
                  <button
                    type="button"
                    onClick={() => { handleCloseWithoutClear(); onNavigateToManage(); }}
                    title="Create a new role"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: '1.5px solid #3B5BFC', background: '#EEF2FF', color: '#3B5BFC',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#3B5BFC'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#3B5BFC'; }}
                  >
                    <Plus size={11} /> Add Role
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {roles.map(r => {
                  const roleName = typeof r === 'string' ? r : r.name;
                  const roleType = typeof r === 'object' ? r.roleType : null;
                  const roleWorkDesc = typeof r === 'object' ? r.workDescription : '';
                  const isSelected = form.role === roleName;
                  const isAdminRole = roleType === 'Admin';
                  
                  // Premium gold gradient for Admin roles when selected
                  const selectedBg = isAdminRole 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                    : '#EEF2FF';
                  const selectedBorder = isAdminRole ? '#FFD700' : '#3B5BFC';
                  const selectedColor = isAdminRole ? '#8B4513' : '#3B5BFC';
                  
                  return (
                    <button key={roleName} onClick={() => {
                      f('role')(roleName);
                      // Auto-fill desc from role's workDescription
                      if (roleWorkDesc) {
                        f('desc')(roleWorkDesc);

                      }
                    }} style={{
                      padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${isSelected ? selectedBorder : '#E8EAEF'}`,
                      background: isSelected ? selectedBg : '#fff',
                      color: isSelected ? selectedColor : '#6B7280',
                      transition: 'all 0.15s',
                      boxShadow: isSelected && isAdminRole ? '0 2px 8px rgba(255, 215, 0, 0.3)' : 'none',
                    }}>{roleName}</button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)' }}>
          {modalError && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500, marginBottom: 12 }}>
              {modalError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
            <button 
              onClick={handleSaveClick} 
              disabled={
                !form.name.trim() || 
                !form.email.trim() || 
                !form.phone.trim() || 
                !form.location.trim() || 
                !form.role || 
                (!isEdit && !form.password.trim())
              } 
              style={{
                padding: '11px 28px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, 
                cursor: (form.name.trim() && form.email.trim() && form.phone.trim() && form.location.trim() && form.role && (isEdit || form.password.trim())) ? 'pointer' : 'not-allowed',
                background: (form.name.trim() && form.email.trim() && form.phone.trim() && form.location.trim() && form.role && (isEdit || form.password.trim())) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : '#E8EAEF',
                color: (form.name.trim() && form.email.trim() && form.phone.trim() && form.location.trim() && form.role && (isEdit || form.password.trim())) ? '#fff' : '#9CA3AF',
                boxShadow: (form.name.trim() && form.email.trim() && form.phone.trim() && form.location.trim() && form.role && (isEdit || form.password.trim())) ? '0 6px 20px #3B5BFC40' : 'none',
              }}
            >
              {isEdit ? 'Update' : 'Add Member'}
            </button>
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
    </div>
  );
}

// ── Member Profile Modal ────────────────────────────────────────────────────
function MemberProfileModal({ member, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar member={member} size={64} style={{ borderRadius: 16, boxShadow: `0 8px 24px ${member.color}40` }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{member.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{member.role}</div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: member.status === 'Active' ? '#ECFDF5' : '#FEF2F2', color: member.status === 'Active' ? '#12C479' : '#EF4444' }}>
                  {member.status === 'Active' ? '● Active' : '○ Inactive'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Member since {member.joined}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          {/* Contact Info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Contact Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                <Mail size={16} color="#6B7280" />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{member.email}</span>
              </div>
              {member.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                  <Phone size={16} color="#6B7280" />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{member.phone}</span>
                </div>
              )}
              {member.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                  <MapPin size={16} color="#6B7280" />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{member.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          {member.about && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>About</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: '1.6', background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                {member.about}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Performance</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total Tasks', value: member.tasks, color: member.color, icon: Clock },
                { label: 'Completed', value: member.completed, color: '#12C479', icon: CheckCircle },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={s.color} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value > 0 ? s.value : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Completion Rate</div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Overall Progress</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: member.color }}>{(member.tasks && member.tasks > 0) ? Math.round((member.completed / member.tasks) * 100) + '%' : ''}</span>
              </div>
              <div style={{ height: 8, background: '#E8EAEF', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: (member.tasks && member.tasks > 0) ? `${Math.round((member.completed / member.tasks) * 100)}%` : '100%', height: '100%', background: (member.tasks && member.tasks > 0) ? member.color : '#E8EAEF', borderRadius: 8, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Member Card ─────────────────────────────────────────────────────────────
function MemberCard({ member, onEdit, onToggleStatus, onViewProfile, managementMode = false, atLimit = false }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [hover, setHover] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(null);
  
  // Calculate days remaining for 7-day timer
  useEffect(() => {
    if (member.status === 'Inactive' && member.deactivatedAt) {
      const calculateDays = () => {
        const deactivatedDate = member.deactivatedAt.seconds 
          ? new Date(member.deactivatedAt.seconds * 1000) 
          : new Date(member.deactivatedAt);
        const now = new Date();
        const daysPassed = Math.floor((now - deactivatedDate) / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, 7 - daysPassed);
        setDaysRemaining(remaining);
      };
      
      calculateDays();
      // Update every hour
      const interval = setInterval(calculateDays, 1000 * 60 * 60);
      return () => clearInterval(interval);
    } else {
      setDaysRemaining(null);
    }
  }, [member.status, member.deactivatedAt]);
  
  const canActivate = member.status === 'Inactive' && (daysRemaining === null || daysRemaining === 0);
  
  const handleToggleStatus = (e) => {
    e.stopPropagation();
    
    // Block activating if at plan limit
    if (member.status === 'Inactive' && atLimit) {
      notify.error('Plan limit reached. Deactivate another member first or upgrade your plan.');
      return;
    }
    
    // Block activating if 7-day timer hasn't expired
    if (member.status === 'Inactive' && daysRemaining > 0) {
      notify.error(`Cannot activate yet. ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.`);
      return;
    }
    
    const actionText = member.status === 'Active' ? 'deactivate this member' : 'activate this member';
    requestAdminPassword(actionText, () => {
      onToggleStatus(member.id);
      // Don't switch tabs - just let the user disappear from current view
      // The user will be in the appropriate tab (Active/Inactive) based on their new status
    });
  };
  
  return (
    <>
      <div
        data-member-id={member.id}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onViewProfile(member)}
        style={{
          background: 'var(--bg-surface)', borderRadius: 18, padding: '20px',
          border: `1.5px solid ${hover ? member.color + '40' : '#E8EAEF'}`,
          boxShadow: hover ? `0 8px 24px ${member.color}18` : '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.2s', transform: hover ? 'translateY(-2px)' : 'none',
          cursor: 'pointer',
        }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar member={member} size={46} style={{ borderRadius: 14, boxShadow: `0 4px 12px ${member.color}40` }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{member.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{member.role}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: member.status === 'Active' ? '#ECFDF5' : '#FEF2F2', color: member.status === 'Active' ? '#12C479' : '#EF4444' }}>
          {member.status === 'Active' ? '● Active' : '○ Inactive'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Tasks', value: member.tasks || 0, icon: <Clock size={12} color={member.color} /> },
          { label: 'Done', value: member.completed || 0, icon: <CheckCircle size={12} color="#12C479" /> },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: 'var(--input-bg)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{s.icon}<span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value > 0 ? s.value : ''}</span></div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Completion</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: member.color }}>{(member.tasks && member.tasks > 0) ? Math.round((member.completed / member.tasks) * 100) + '%' : ''}</span>
        </div>
        <div style={{ height: 4, background: '#E8EAEF', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: (member.tasks && member.tasks > 0) ? `${Math.round((member.completed / member.tasks) * 100)}%` : '100%', height: '100%', background: (member.tasks && member.tasks > 0) ? member.color : '#E8EAEF', borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Show profile picture if available, otherwise show avatar initials */}
          {member.addedBy?.avatarImg ? (
            <img 
              src={member.addedBy.avatarImg} 
              alt={member.addedBy.name}
              style={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                objectFit: 'cover',
                flexShrink: 0,
                border: '1.5px solid var(--border-light)'
              }} 
            />
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: member.addedBy?.color || '#3B5BFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {member.addedBy?.avatar || (member.addedBy?.name ? member.addedBy.name[0].toUpperCase() : 'A')}
            </div>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {member.addedBy?.name && member.addedBy?.role 
              ? `${member.addedBy.name.split(' ')[0]} (${member.addedBy.role})`
              : member.addedBy?.name 
              ? member.addedBy.name
              : member.createdBy 
              ? `Created by ${member.createdBy}` 
              : 'Added by Admin'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={handleToggleStatus} 
            disabled={member.status === 'Inactive' && (atLimit || daysRemaining > 0)}
            style={{ 
              padding: '5px 10px', 
              background: member.status === 'Active' ? '#FEF2F2' : (atLimit || daysRemaining > 0 ? '#F3F4F6' : '#ECFDF5'), 
              border: 'none', 
              borderRadius: 8, 
              fontSize: 11, 
              fontWeight: 600, 
              cursor: (member.status === 'Inactive' && (atLimit || daysRemaining > 0)) ? 'not-allowed' : 'pointer', 
              color: member.status === 'Active' ? '#EF4444' : (atLimit || daysRemaining > 0 ? '#9CA3AF' : '#12C479'),
              opacity: (member.status === 'Inactive' && (atLimit || daysRemaining > 0)) ? 0.6 : 1
            }} 
            title={
              member.status === 'Inactive' && atLimit 
                ? 'Plan limit reached — upgrade to activate' 
                : member.status === 'Inactive' && daysRemaining > 0
                ? `Wait ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to activate`
                : ''
            }
          >
            {member.status === 'Active' 
              ? 'Deactivate' 
              : daysRemaining > 0 
              ? `${daysRemaining}d` 
              : 'Activate'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(member); }} style={{ padding: '5px 10px', background: '#EEF2FF', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#3B5BFC' }}>
            Edit
          </button>
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
  </>
  );
}

// Track if team has been enriched at least once (persists across component mounts)
let hasEnrichedTeamOnce = false;

function TeamPage({ managementMode = false, onNavigateToManage, currentUser, setPageFilteredData = null }) {
  const { team, saveMember, toggleMemberStatus, financials, roles, currentPlan, workspaceId, currentUid } = useApp();

  // Track page load
  useEffect(() => {
    monitor.trackPageLoad('team_page');
  }, []);

  // State to hold enriched team members with profile data
  const [enrichedTeam, setEnrichedTeam] = useState([]);
  const [isEnriching, setIsEnriching] = useState(false); // Don't show skeleton initially

  // Load and enrich team members with profile data from Firestore
  useEffect(() => {

    const enrichTeamWithProfiles = async () => {
      if (!team || team.length === 0) {
        setEnrichedTeam([]);
        setIsEnriching(false);
        hasEnrichedTeamOnce = true;
        return;
      }

      // Only show loading skeleton on very first load ever, not on subsequent visits
      if (!hasEnrichedTeamOnce) {
        setIsEnriching(true);
      }

      try {
        const { getProfile } = await import('../lib/userProfileService');
        
        // Enrich each team member with their profile data
        const enrichedMembers = await Promise.all(
          team.map(async (member) => {
            // Only enrich if member has a uid
            if (!member.uid) {
              return member;
            }

            try {
              const profileData = await getProfile(member.uid);
              
              // Also enrich the addedBy field with creator's profile data
              let enrichedAddedBy = member.addedBy || null;
              if (member.addedBy?.uid) {
                try {
                  const creatorProfile = await getProfile(member.addedBy.uid);
                  if (creatorProfile) {
                    enrichedAddedBy = {
                      ...member.addedBy,
                      name: creatorProfile.name || member.addedBy.name,
                      avatarImg: creatorProfile.avatarImg || null,
                      avatar: member.addedBy.avatar, // Keep original initials as fallback
                      color: member.addedBy.color,
                      role: member.addedBy.role,
                      uid: member.addedBy.uid,
                    };
                  }
                } catch (err) {

                }
              }
              
              if (profileData) {
                // Merge profile data with team member data
                // IMPORTANT: Preserve status and other critical fields from team data
                const enrichedMember = {
                  ...member, // Start with all member data (including status)
                  name: profileData.name || member.name,
                  phone: profileData.phone || member.phone || '',
                  location: profileData.location || member.location || '',
                  about: profileData.about || member.about || '',
                  avatarImg: profileData.avatarImg || member.avatarImg || null,
                  userRole: profileData.role || member.userRole || 'member', // Add userRole from profile
                  // Use enriched addedBy with profile data
                  addedBy: enrichedAddedBy,
                  // Explicitly preserve status from team data
                  status: member.status,
                };

                // DON'T preload avatars - let the Avatar component handle loading
                // This prevents unnecessary errors and the Avatar component has proper fallback
                
                // DON'T auto-save to Firestore - just enrich for display
                // This prevents unnecessary writes and role overwrites
                
                return enrichedMember;
              }
            } catch (err) {

            }
            
            return member;
          })
        );

        setEnrichedTeam(enrichedMembers);
        setIsEnriching(false);
        hasEnrichedTeamOnce = true; // Mark as enriched - persists across component mounts

      } catch (err) {

        setEnrichedTeam(team);
        setIsEnriching(false);
        hasEnrichedTeamOnce = true;
      }
    };

    enrichTeamWithProfiles();
  }, [team, saveMember]);

  // Use enriched team for display - show team data immediately, don't wait for enrichment
  const displayTeam = enrichedTeam.length > 0 ? enrichedTeam : team;

  // Member limit based on selected plan (default Professional = 15 if no plan selected)
  const PLAN_LIMITS = { starter: 7, professional: 15, business: 30, enterprise: 50 };
  const memberLimit = currentPlan
    ? (currentPlan.users === 'Unlimited' || currentPlan.users === 'Custom' ? 0 : (PLAN_LIMITS[currentPlan.id] ?? currentPlan.users))
    : 15;
  const activeCount = displayTeam.filter(m => m.status === 'Active').length;
  const atLimit = activeCount >= memberLimit;
  const roleNames = roles.map(r => r.name);
  const [filter, setFilter] = useState('Active');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false); // Loading state for pagination
  const membersPerPage = 15;

  // Check if current user is workspace owner
  const isWorkspaceOwner = workspaceId && currentUid && workspaceId === `ws_${currentUid}`;

  const filtered = displayTeam.filter(m => {
    // In management dashboard, only show team members (hide admin and management users)
    if (managementMode && m.userRole && (m.userRole === 'admin' || m.userRole === 'management')) {
      return false;
    }
    
    // Hide admin's own card ONLY if NOT workspace owner
    if (!isWorkspaceOwner && currentUser && currentUser.uid && m.uid === currentUser.uid) {
      return false;
    }
    
    const matchFilter = filter === 'All' || (filter === 'Active' ? m.status === 'Active' : m.status === 'Inactive');
    const matchRole = roleFilter === 'All Roles' || m.role === roleFilter;
    return matchFilter && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const paginatedMembers = filtered.slice(startIndex, endIndex);
  
  // Update filtered data for search - use FULL filtered data, not just paginated
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ team: filtered }); // Search all filtered members, not just current page
    }
  }, [filtered.length, filter, roleFilter, setPageFilteredData]);

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px' }}>
      {/* Team Members Component Card */}
      <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        
        {/* Header with Controls */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={13} color="#3B5BFC" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Team Members</div>
            </div>
          </div>

          {/* Pagination — truly centered */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            {filtered.length > membersPerPage && (<>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || pageLoading}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', cursor: (currentPage === 1 || pageLoading) ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} color="#6B7280" />
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{currentPage} / {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || pageLoading}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', cursor: (currentPage === totalPages || pageLoading) ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} color="#6B7280" />
              </button>
            </>)}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'All' },
                { label: 'Active',   count: team.filter(m => m.status === 'Active').length },
                { label: 'Inactive' },
              ].map(({ label, count }) => (
                <button key={label} onClick={() => setFilter(label)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: filter === label ? 'none' : '1.5px solid #E8EAEF',
                  background: filter === label ? '#3B5BFC' : 'var(--bg-surface)',
                  color: filter === label ? '#fff' : '#6B7280', transition: 'all 0.15s',
                }}>
                  {label}
                  {count !== undefined && (
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      background: filter === label ? 'rgba(255,255,255,0.25)' : '#F0F2F8',
                      color: filter === label ? '#fff' : '#6B7280',
                      padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
                    }}>{count}</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ height: 24, width: '1px', background: 'var(--border)' }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
              }}>
              <option value="All Roles">All Roles</option>
              {roleNames.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button onClick={() => {
              if (atLimit) {
                notify.error(`Plan limit reached (${activeCount}/${memberLimit} active members). Upgrade your plan to add more.`);
                return;
              }
              setEditMember(null); setShowModal(true);
            }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: atLimit ? '#E8EAEF' : 'linear-gradient(135deg, #3B5BFC, #2142D9)',
              color: atLimit ? '#9CA3AF' : '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: atLimit ? 'not-allowed' : 'pointer',
              boxShadow: atLimit ? 'none' : '0 4px 12px #3B5BFC40',
              transition: 'all 0.15s',
            }}
              title={atLimit ? `Plan limit: ${memberLimit} members. Upgrade to add more.` : 'Add team member'}
            >
              <Plus size={15} /> Add Member
              {atLimit && <span style={{ fontSize: 10, fontWeight: 700, background: '#F97316', color: '#fff', padding: '1px 6px', borderRadius: 10, marginLeft: 2 }}>Limit</span>}
            </button>
          </div>
        </div>

        {/* Scrollable Grid inside component */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {(pageLoading || isEnriching) ? (
              // Skeleton loading for pagination or enriching
              <>
                {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => (
                  <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1.5px solid var(--border)', padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 16 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="skeleton" style={{ width: '70%', height: 16, borderRadius: 6 }} />
                        <div className="skeleton" style={{ width: '55%', height: 12, borderRadius: 6 }} />
                        <div className="skeleton" style={{ width: '45%', height: 11, borderRadius: 6 }} />
                      </div>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                        <div className="skeleton" style={{ width: 32, height: 20, borderRadius: 6 }} />
                        <div className="skeleton" style={{ width: 50, height: 10, borderRadius: 6 }} />
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                        <div className="skeleton" style={{ width: 28, height: 20, borderRadius: 6 }} />
                        <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 6 }} />
                      </div>
                    </div>
                    <div className="skeleton" style={{ width: '100%', height: 1, borderRadius: 0 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 8 }} />
                      <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 8 }} />
                    </div>
                  </div>
                ))}
              </>
            ) : paginatedMembers.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={32} color="#3B5BFC" strokeWidth={1.8} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No team members yet</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6 }}>Add your first team member to start assigning tasks and tracking progress</div>
                </div>
                <button onClick={() => { if (!atLimit) { setEditMember(null); setShowModal(true); } }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: atLimit ? '#E8EAEF' : 'linear-gradient(135deg, #3B5BFC, #2142D9)', border: 'none', borderRadius: 11, color: atLimit ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: atLimit ? 'not-allowed' : 'pointer', boxShadow: atLimit ? 'none' : '0 4px 14px rgba(59,91,252,0.3)' }}>
                  <Plus size={15} /> Add First Member
                </button>
              </div>
            ) : (
              paginatedMembers.map(m => (
                <MemberCard key={m.id} member={m}
                  onEdit={m => { setEditMember(m); setShowModal(true); }}
                  onToggleStatus={toggleMemberStatus}
                  onViewProfile={m => { setSelectedMember(m); setShowProfileModal(true); }}
                  managementMode={managementMode}
                  atLimit={atLimit}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {showModal && (
        <MemberModal
          member={editMember}
          onClose={() => { setShowModal(false); setEditMember(null); }}
          onSave={saveMember}
          roles={roles}
          managementMode={managementMode}
          onNavigateToManage={onNavigateToManage}
          currentUser={currentUser}
        />
      )}

      {showProfileModal && selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => { setShowProfileModal(false); setSelectedMember(null); }}
        />
      )}
    </div>
  );
}

export default TeamPage;

