import React, { useState, useEffect, useRef } from 'react';
import { notify } from '../lib/notify';
import { Save, Mail, Phone, MapPin, Building, Calendar, KeyRound, Eye, EyeOff, ShieldCheck, User, Lock, Shield, Camera, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

function PwdInput({ label, fieldKey, form, setForm, show, toggle }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <KeyRound size={14} color="#9CA3AF" />
        </div>
        <input
          type={show ? 'text' : 'password'}
          value={form[fieldKey]}
          onChange={e => setForm(p => ({ ...p, [fieldKey]: e.target.value }))}
          placeholder="••••••••"
          style={{ width: '100%', padding: '11px 40px 11px 36px', borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--input-bg)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#3B5BFC'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          {show ? <EyeOff size={15} color="#9CA3AF" /> : <Eye size={15} color="#9CA3AF" />}
        </button>
      </div>
    </div>
  );
}

function StatusMsg({ status, msg }) {
  if (!status) return null;
  return (
    <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: status === 'success' ? '#ECFDF5' : '#FEF2F2', border: `1.5px solid ${status === 'success' ? '#BBF7D0' : '#FCA5A5'}`, fontSize: 13, fontWeight: 600, color: status === 'success' ? '#12C479' : '#EF4444' }}>
      {msg}
    </div>
  );
}

/* ─── Profile Tab ─────────────────────────────────────────── */
function ProfileTab() {
  const { currentUser, setCurrentUser, currentUid } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarImg, setAvatarImg] = useState(currentUser?.avatarImg || null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:     currentUser?.name     || 'Admin',
    email:    currentUser?.email    || '',
    phone:    currentUser?.phone    || '',
    location: currentUser?.location || '',
    about:    currentUser?.about    || '',
  });

  // Load profile data from Firestore on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { getProfile } = await import('../lib/userProfileService');
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const uid = auth.currentUser?.uid || currentUid;
        
        if (uid) {
          const profileData = await getProfile(uid);
          if (profileData) {
            setForm({
              name: profileData.name || 'Admin',
              email: profileData.email || '',
              phone: profileData.phone || '',
              location: profileData.location || '',
              about: profileData.about || '',
            });
            if (profileData.avatarImg) {
              setAvatarImg(profileData.avatarImg);
            }
          }
        }
      } catch (err) {

      }
    };
    
    loadProfile();
  }, [currentUid]);

  async function handleSave() {
    try {
      // Save to Firestore using userProfileService
      const { updateProfile } = await import('../lib/userProfileService');
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const uid = auth.currentUser?.uid || currentUid;
      
      if (!uid) {

        notify.error('Unable to save profile. Please try again.');
        return;
      }
      
      await updateProfile(uid, {
        name: form.name,
        phone: form.phone,
        location: form.location,
        about: form.about,
        avatarImg: avatarImg,
      });
      
      // Update local state
      setCurrentUser(prev => ({ 
        ...prev, 
        name: form.name, 
        phone: form.phone, 
        location: form.location, 
        about: form.about,
        avatarImg: avatarImg,
      }));

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      notify.profileUpdated();
    } catch (err) {

      notify.error('Failed to save profile. Please try again.');
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatarImg(ev.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    import('firebase/auth').then(({ getAuth }) => {
      const auth = getAuth();
      const uid = auth.currentUser?.uid || currentUid;
      
      if (!uid) {

        alert('Unable to upload avatar. Please try again.');
        return;
      }

      import('../lib/storageService').then(({ uploadUserAvatar }) => {
        uploadUserAvatar(file, uid)
          .then(async (downloadURL) => {
            setAvatarImg(downloadURL);
            
            // Update profile with new avatar
            const { updateProfile } = await import('../lib/userProfileService');
            await updateProfile(uid, { avatarImg: downloadURL });
            
            // Update local state
            setCurrentUser(prev => ({ ...prev, avatarImg: downloadURL }));
            
            notify.avatarUpdated();
          })
          .catch(err => {

            alert('Failed to upload avatar. Please try again.');
          });
      });
    });
  }

  const fields = [
    { icon: Mail,     label: 'Email',        key: 'email',    editable: false },
    { icon: Phone,    label: 'Phone',        key: 'phone',    editable: true  },
    { icon: MapPin,   label: 'Location',     key: 'location', editable: true  },
    { icon: Calendar, label: 'Member Since', key: null,       editable: false, value: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
  ];

  const avatarInitials = form.name ? form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'A';
  const avatarColor = currentUser?.color || '#3B5BFC';

  return (
    <div>
      {/* Avatar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <div
          onClick={() => editing && fileRef.current.click()}
          title={editing ? 'Click to change photo' : undefined}
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: avatarImg ? 'transparent' : `linear-gradient(135deg, ${avatarColor}, #2142D9)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: `0 8px 24px ${avatarColor}55`,
            cursor: editing ? 'pointer' : 'default',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {avatarImg ? (
            <img src={avatarImg} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            avatarInitials
          )}
          {/* Hover overlay — only in edit mode */}
          {editing && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              opacity: 0, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <Camera size={16} color="#fff" />
              <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>Change</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        <div style={{ flex: 1 }}>
          {editing ? (
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              style={{ 
                fontSize: 22, 
                fontWeight: 800, 
                color: 'var(--text-primary)', 
                letterSpacing: '-0.3px',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #3B5BFC',
                outline: 'none',
                width: '100%',
                padding: '4px 0',
                fontFamily: 'inherit',
                marginBottom: 4
              }}
            />
          ) : (
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{form.name}</div>
          )}
          <div style={{ fontSize: 13, color: '#3B5BFC', fontWeight: 600, marginTop: 2 }}>{currentUser?.role || 'Administrator'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{form.email}</div>
        </div>
        <button onClick={() => setEditing(p => !p)} style={{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${editing ? '#3B5BFC' : 'var(--border)'}`, background: editing ? '#EEF2FF' : 'var(--bg-surface)', fontSize: 12, fontWeight: 700, color: editing ? '#3B5BFC' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Edit2 size={14} />
          {editing ? 'Cancel' : ''}
        </button>
      </div>

      {/* About */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>About</div>
      <div style={{ marginBottom: 20 }}>
        {editing ? (
          <textarea value={form.about} onChange={e => setForm(p => ({ ...p, about: e.target.value }))} rows={3}
            style={{ width: '100%', resize: 'vertical', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #C7D4FF', background: 'var(--bg-subtle)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>{form.about}</p>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 20 }} />

      {/* Contact */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>Contact</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fields.map(({ icon: Icon, label, key, editable, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={15} color="#3B5BFC" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
              {editing && editable && key ? (
                <input 
                  type={key === 'phone' ? 'tel' : 'text'}
                  value={form[key]} 
                  onChange={e => {
                    // Only allow digits for phone, max 12
                    if (key === 'phone') {
                      const filtered = e.target.value.replace(/[^\d]/g, '');
                      if (filtered.length <= 12) {
                        setForm(p => ({ ...p, [key]: filtered }));
                      }
                    } else {
                      setForm(p => ({ ...p, [key]: e.target.value }));
                    }
                  }}
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', border: 'none', borderBottom: '1.5px solid #7C3AED', outline: 'none', width: '100%', padding: '2px 0', fontFamily: 'inherit' }} />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value || form[key]}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <button onClick={handleSave} style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 22px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,91,252,0.35)' }}>
          Update
        </button>
      )}
      {saved && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#12C479', fontWeight: 600 }}>Profile saved successfully!</div>
      )}
    </div>
  );
}

/* ─── Admin Password Tab ──────────────────────────────────── */
function AdminPasswordTab() {
  const { adminPassword, updateAdminPassword, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');

  async function handleUpdate() {
    if (!form.current || !form.next || !form.confirm) { setStatus('error'); setMsg('All fields are required.'); return; }
    if (form.next.length < 6) { setStatus('error'); setMsg('New password must be at least 6 characters.'); return; }
    if (form.next !== form.confirm) { setStatus('error'); setMsg('Passwords do not match.'); return; }
    
    // Check if current password matches admin password OR account password
    let isValid = false;
    
    // First check if it matches admin password
    if (form.current === adminPassword) {
      isValid = true;
    } else {
      // Try to verify with account password
      try {
        const { getAuth, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
        const auth = getAuth();
        const user = auth.currentUser;
        if (user && user.email) {
          const credential = EmailAuthProvider.credential(user.email, form.current);
          await reauthenticateWithCredential(user, credential);
          isValid = true;
        }
      } catch (err) {
        // Account password verification failed
        isValid = false;
      }
    }
    
    if (!isValid) {
      setStatus('error');
      setMsg('Current password is incorrect. Enter either your admin password or account password.');
      return;
    }
    
    updateAdminPassword(form.next);
    setStatus('success'); setMsg('Admin password updated successfully.');
    setForm({ current: '', next: '', confirm: '' });
    notify.adminPwdUpdated();
    setTimeout(() => { setStatus(null); setOpen(false); }, 2500);
  }

  return (
    <div>
      {/* Clickable row */}
      <div onClick={() => { setOpen(p => !p); setStatus(null); setForm({ current: '', next: '', confirm: '' }); }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '10px 12px', borderRadius: 12, transition: 'background 0.15s', background: open ? '#EEF2FF' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={18} color="#3B5BFC" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: open ? '#3B5BFC' : 'var(--text-primary)' }}>Admin Password</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Enter the admin password to unlock management controls</div>
        </div>
      </div>

      {/* Expanded form */}
      {open && (
        <div style={{ marginTop: 16, padding: '18px 20px', background: 'var(--bg-subtle)', borderRadius: 14, border: '1.5px solid #C7D4FF', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Current Password (Admin or Account)</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <KeyRound size={14} color="#9CA3AF" />
              </div>
              <input
                type={show.current ? 'text' : 'password'}
                value={form.current}
                onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 40px 11px 36px', borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--input-bg)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button onClick={() => setShow(p => ({ ...p, current: !p.current }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                {show.current ? <EyeOff size={15} color="#9CA3AF" /> : <Eye size={15} color="#9CA3AF" />}
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>Enter your current admin password or account password</div>
          </div>
          <PwdInput label="New Admin Password"     fieldKey="next"    form={form} setForm={setForm} show={show.next}    toggle={() => setShow(p => ({ ...p, next: !p.next }))} />
          <PwdInput label="Confirm New Password"   fieldKey="confirm" form={form} setForm={setForm} show={show.confirm} toggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))} />
          <StatusMsg status={status} msg={msg} />
          <button onClick={handleUpdate} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,91,252,0.3)' }}>
            <Shield size={13} /> Update Admin Password
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Account Password Tab ────────────────────────────────── */
function AccountPasswordTab() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');

  async function handleUpdate() {
    if (!form.current || !form.next || !form.confirm) { setStatus('error'); setMsg('All fields are required.'); return; }
    if (form.next.length < 8) { setStatus('error'); setMsg('New password must be at least 8 characters.'); return; }
    if (form.next !== form.confirm) { setStatus('error'); setMsg('Passwords do not match.'); return; }
    try {
      const { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { setStatus('error'); setMsg('Not signed in.'); return; }
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, form.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, form.next);
      setStatus('success'); setMsg('Account password updated successfully.');
      setForm({ current: '', next: '', confirm: '' });
      notify.accountPwdUpdated();
      setTimeout(() => { setStatus(null); setOpen(false); }, 2500);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setStatus('error'); setMsg('Current password is incorrect.');
      } else {
        setStatus('error'); setMsg('Failed to update password. Please try again.');
      }
    }
  }

  return (
    <div>
      {/* Clickable row */}
      <div onClick={() => { setOpen(p => !p); setStatus(null); setForm({ current: '', next: '', confirm: '' }); }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '10px 12px', borderRadius: 12, transition: 'background 0.15s', background: open ? '#F5F3FF' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Lock size={18} color="#7C3AED" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: open ? '#7C3AED' : 'var(--text-primary)' }}>Account Password</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Used to log in to your admin account</div>
        </div>
      </div>

      {/* Expanded form */}
      {open && (
        <div style={{ marginTop: 16, padding: '18px 20px', background: 'var(--bg-subtle)', borderRadius: 14, border: '1.5px solid #DDD6FE', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PwdInput label="Current Account Password" fieldKey="current" form={form} setForm={setForm} show={show.current} toggle={() => setShow(p => ({ ...p, current: !p.current }))} />
          <PwdInput label="New Account Password"     fieldKey="next"    form={form} setForm={setForm} show={show.next}    toggle={() => setShow(p => ({ ...p, next: !p.next }))} />
          <PwdInput label="Confirm New Password"     fieldKey="confirm" form={form} setForm={setForm} show={show.confirm} toggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))} />
          <StatusMsg status={status} msg={msg} />
          <button onClick={handleUpdate} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Lock size={13} /> Update Account Password
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function SettingsPage() {
  return (
    <div style={{ flex: 1, minHeight: 0, padding: '20px 28px 24px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 28, border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ProfileTab />
        <div style={{ height: 1, background: 'var(--border-light)' }} />
        <AdminPasswordTab />
        <div style={{ height: 1, background: 'var(--border-light)' }} />
        <AccountPasswordTab />
      </div>
    </div>
  );
}
