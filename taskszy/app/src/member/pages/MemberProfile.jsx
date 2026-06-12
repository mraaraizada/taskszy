import React, { useState, useRef, useEffect } from 'react';
import { notify } from '../../lib/notify';
import { Mail, Phone, MapPin, Calendar, Save, Camera, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MAX_WORDS = 500;

function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function formatJoined(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return raw;
}

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
          style={{ width: '100%', padding: '11px 40px 11px 36px', borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          {show ? <EyeOff size={15} color="#9CA3AF" /> : <Eye size={15} color="#9CA3AF" />}
        </button>
      </div>
    </div>
  );
}

function PasswordSection({ member }) {
  const MEMBER_PWD = 'member123';
  const { isPlanActive, triggerPlanBlink } = useApp();
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]   = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [msg, setMsg]     = useState('');

  function handleUpdate() {
    if (!isPlanActive) { 
      triggerPlanBlink(); 
      notify.error('An error occurred, Please contact admin');
      return; 
    }
    if (!form.current || !form.next || !form.confirm) { setStatus('error'); setMsg('All fields are required.'); return; }
    if (form.current !== MEMBER_PWD) { setStatus('error'); setMsg('Current password is incorrect.'); return; }
    if (form.next.length < 6) { setStatus('error'); setMsg('New password must be at least 6 characters.'); return; }
    if (form.next !== form.confirm) { setStatus('error'); setMsg('Passwords do not match.'); return; }
    setStatus('success'); setMsg('Password updated successfully.');
    setForm({ current: '', next: '', confirm: '' });
    notify.passwordUpdated();
    setTimeout(() => { setStatus(null); setOpen(false); }, 2500);
  }
  
  const handleClick = () => {
    if (!isPlanActive) { 
      triggerPlanBlink(); 
      notify.error('An error occurred, Please contact admin');
      return; 
    }
    setOpen(p => !p); 
    setStatus(null); 
    setForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 16 }} />
      <div
        onClick={handleClick}
        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '10px 12px', borderRadius: 12, transition: 'background 0.15s', background: open ? '#F5F3FF' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = open ? '#F5F3FF' : 'transparent'; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Lock size={18} color="#7C3AED" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: open ? '#7C3AED' : 'var(--text-primary)' }}>Change Password</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Update your account password</div>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 12, padding: '18px 20px', background: 'var(--bg-subtle)', borderRadius: 14, border: '1.5px solid #DDD6FE', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PwdInput label="Current Password" fieldKey="current" form={form} setForm={setForm} show={show.current} toggle={() => setShow(p => ({ ...p, current: !p.current }))} />
          <PwdInput label="New Password"     fieldKey="next"    form={form} setForm={setForm} show={show.next}    toggle={() => setShow(p => ({ ...p, next: !p.next }))} />
          <PwdInput label="Confirm Password" fieldKey="confirm" form={form} setForm={setForm} show={show.confirm} toggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))} />
          {status && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: status === 'success' ? '#ECFDF5' : '#FEF2F2', border: `1.5px solid ${status === 'success' ? '#BBF7D0' : '#FCA5A5'}`, fontSize: 13, fontWeight: 600, color: status === 'success' ? '#12C479' : '#EF4444' }}>
              {msg}
            </div>
          )}
          <button type="button" onClick={handleUpdate} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Lock size={13} /> Update Password
          </button>
        </div>
      )}
    </div>
  );
}

export default function MemberProfile({ member }) {
  const { currentUid, isPlanActive, triggerPlanBlink } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: member.name, phone: member.phone, location: member.location, about: member.about || '' });
  const [saved, setSaved]     = useState(false);
  const [avatarFile, setAvatarFile] = useState(null); // Store avatar file for upload on save
  const [avatarImg, setAvatarImg] = useState(member.avatarImg || null);
  const fileRef = useRef(null);

  const wordCount = countWords(form.about);
  const overLimit = wordCount > MAX_WORDS;

  // Load profile data from Firestore on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { getProfile } = await import('../../lib/userProfileService');
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const uid = auth.currentUser?.uid || currentUid;
        
        if (uid) {
          const profileData = await getProfile(uid);
          if (profileData) {

            setForm({
              name: profileData.name || member.name,
              phone: profileData.phone || member.phone || '',
              location: profileData.location || member.location || '',
              about: profileData.about || member.about || '',
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
  }, [currentUid, member.name, member.phone, member.location, member.about]);

  async function handleSave() {
    if (!isPlanActive) { 
      triggerPlanBlink(); 
      notify.error('An error occurred, Please contact admin');
      return; 
    }
    if (overLimit) return;
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const uid = auth.currentUser?.uid || currentUid;
      
      if (!uid) {

        notify.error('Unable to save profile. Please try again.');
        return;
      }
      
      let finalAvatarUrl = avatarImg;
      
      // Upload avatar file if user selected a new one
      if (avatarFile) {
        try {
          const { uploadUserAvatar } = await import('../../lib/storageService');
          const { compressAvatar } = await import('../../lib/imageCompression');

          const compressedFile = await compressAvatar(avatarFile);

          finalAvatarUrl = await uploadUserAvatar(compressedFile, uid);

          setAvatarImg(finalAvatarUrl);
          setAvatarFile(null); // Clear the file after upload
        } catch (err) {

          notify.error('Failed to upload avatar. Please try again.');
          return; // Don't save profile if avatar upload fails
        }
      }
      
      // Use updateProfile from userProfileService to update user document
      const { updateProfile } = await import('../../lib/userProfileService');
      await updateProfile(uid, {
        name: form.name,
        phone: form.phone,
        location: form.location,
        about: form.about,
        avatarImg: finalAvatarUrl
      });
      
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      notify.profileUpdated();
    } catch (error) {

      notify.error('Failed to save profile. Please try again.');
    }
  }

  function handleAvatarChange(e) {
    if (!isPlanActive) { 
      triggerPlanBlink(); 
      notify.error('An error occurred, Please contact admin');
      return; 
    }
    const file = e.target.files[0];
    if (!file) return;
    
    // Store the file for later upload
    setAvatarFile(file);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatarImg(ev.target.result);
    };
    reader.readAsDataURL(file);
  }
  
  const handleEditToggle = () => {
    if (!isPlanActive && !editing) { 
      triggerPlanBlink(); 
      notify.error('An error occurred, Please contact admin');
      return; 
    }
    if (editing) {
      // Cancel - reset form and avatar preview
      setForm({ name: member.name, phone: member.phone, location: member.location, about: member.about || '' });
      setAvatarImg(member.avatarImg);
      setAvatarFile(null);
    }
    setEditing(!editing);
  };
  
  const handleAvatarClick = () => {
    if (!isPlanActive) { 
      triggerPlanBlink(); 
      notify.error('An error occurred, Please contact admin');
      return; 
    }
    if (editing) fileRef.current.click();
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Single profile card */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '28px', border: '1.5px solid var(--border)', transition: 'background 0.25s, border-color 0.25s' }}>

        {/* Top row: avatar + name + edit btn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {/* Avatar — clickable only in edit mode */}
          <div
            onClick={handleAvatarClick}
            title={editing ? 'Click to change photo' : undefined}
            style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: member.color, cursor: editing ? 'pointer' : 'default', position: 'relative',
              boxShadow: `0 8px 24px ${member.color}55`, overflow: 'hidden',
            }}
          >
            {avatarImg ? (
              <img src={avatarImg} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {member.avatar}
              </div>
            )}
            {/* Hover overlay — only in edit mode */}
            {editing && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'transparent', display: 'flex', flexDirection: 'column',
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
                  borderBottom: '2px solid #7C3AED',
                  outline: 'none',
                  width: '100%',
                  padding: '4px 0',
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{form.name}</div>
            )}
            <div style={{ fontSize: 14, color: '#7C3AED', fontWeight: 600, marginTop: 2 }}>{member.role}</div>
          </div>

          <button type="button" onClick={handleEditToggle} style={{
            padding: '7px 16px', borderRadius: 10,
            border: `1.5px solid ${editing ? '#7C3AED' : 'var(--border)'}`,
            background: editing ? '#F5F3FF' : 'var(--bg-surface)',
            fontSize: 12, fontWeight: 600,
            color: editing ? '#7C3AED' : 'var(--text-secondary)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* About — before contact fields */}
        <div style={{ marginBottom: 16 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                autoFocus
                value={form.about}
                onChange={e => setForm(prev => ({ ...prev, about: e.target.value }))}
                placeholder="Write a short bio — your skills, interests, background…"
                rows={5}
                style={{
                  width: '100%', resize: 'vertical',
                  padding: '12px 14px', borderRadius: 12,
                  border: `1.5px solid ${overLimit ? '#EF4444' : '#DDD6FE'}`,
                  background: 'var(--bg-subtle)',
                  fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
              />
            </div>
          ) : form.about ? (
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              border: '1.5px solid var(--border-light)',
              background: 'var(--bg-subtle)',
            }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, margin: 0 }}>{form.about}</p>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No about yet.</div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 16 }} />

        {/* Contact fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: Mail,     label: 'Email',       value: member.email,                editable: false },
            { icon: Phone,    label: 'Phone',        value: form.phone,                  editable: true, key: 'phone' },
            { icon: MapPin,   label: 'Location',     value: form.location,               editable: true, key: 'location' },
            { icon: Calendar, label: 'Member Since', value: formatJoined(member.joined), editable: false },
          ].map(field => {
            const Icon = field.icon;
            return (
              <div key={field.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-subtle)',
                borderRadius: 12, border: '1px solid var(--border-light)',
                transition: 'background 0.25s',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#3B5BFC" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{field.label}</div>
                  {editing && field.editable ? (
                    <input
                      value={form[field.key]}
                      onChange={e => {
                        if (field.key === 'phone') {
                          // Only allow digits, max 12
                          const filtered = e.target.value.replace(/[^\d]/g, '');
                          if (filtered.length <= 12) {
                            setForm(prev => ({ ...prev, [field.key]: filtered }));
                          }
                        } else {
                          setForm(prev => ({ ...prev, [field.key]: e.target.value }));
                        }
                      }}
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', border: 'none', borderBottom: '1.5px solid #7C3AED', outline: 'none', width: '100%', padding: '2px 0' }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{field.value}</div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {editing && (
          <button type="button" onClick={handleSave} style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: '#3B5BFC', border: 'none', borderRadius: 11, color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59,91,252,0.35)',
          }}>
            Update
          </button>
        )}
        {saved && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#12C479', fontWeight: 600 }}>Profile saved successfully!</div>
        )}

        {/* ── Change Password ── */}
        <PasswordSection member={member} />
      </div>

    </div>
  );
}
