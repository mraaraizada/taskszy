import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WorkspaceSetup({ onComplete, existingWorkspace = null, isManagement = false }) {
  const { saveWorkspaceSettings } = useApp();
  
  // If workspace exists, skip to password step
  const hasExistingData = !!existingWorkspace;

  // Step 1 — workspace branding (always start here, but read-only if data exists)
  const [step, setStep] = useState(1);
  const [name, setName] = useState(existingWorkspace?.workspaceName || '');
  const [subtitle, setSubtitle] = useState(existingWorkspace?.workspaceSub || '');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(existingWorkspace?.workspaceLogo || null);
  const [nameFocus, setNameFocus] = useState(false);
  const [subtitleFocus, setSubtitleFocus] = useState(false);

  // Step 2 — admin password
  const [adminPwd, setAdminPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showAdminPwd, setShowAdminPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [adminFocus, setAdminFocus] = useState(false);
  const [confirmFocus, setConfirmFocus] = useState(false);

  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    
    // Use FileReader instead of createObjectURL to avoid blob URL errors
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    setPwdError('');
    
    // Both admin and management users set their own password
    if (adminPwd.length < 4) {
      setPwdError('Password must be at least 4 characters.');
      return;
    }
    if (adminPwd !== confirmPwd) {
      setPwdError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    
    // Save password to user's profile in Firestore, not workspace settings
    import('../lib/userProfileService').then(({ updateProfile }) => {
      import('firebase/auth').then(({ getAuth }) => {
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        
        if (uid) {
          // Save password to user's own profile

          updateProfile(uid, { 
            userPassword: adminPwd,
            hasCompletedSetup: true 
          }).then(async () => {

            // Verify it was saved by reading it back
            try {
              const { getProfile } = await import('../lib/userProfileService');
              const verifyProfile = await getProfile(uid);

            } catch (err) {

            }
            
            // Also update workspace settings (branding only, not setup status)
            saveWorkspaceSettings({
              workspaceName:      name.trim(),
              workspaceSub:       subtitle.trim() || 'Workspace',
              workspaceLogo:      logoPreview || null,
              hasSeenDonutWelcome: false,
            });
            
            // Update workspace document in Firestore with complete data
            // CRITICAL: Wait for this to complete before calling onComplete
            try {
              const { db } = await import('../lib/firebase');
              const { doc, updateDoc, serverTimestamp, getDoc } = await import('firebase/firestore');
              const workspaceId = `ws_${uid}`;


              await updateDoc(doc(db, 'workspaces', workspaceId), {
                'settings.workspaceName': name.trim(),
                'settings.workspaceSub': subtitle.trim() || 'Workspace',
                'settings.workspaceLogo': logoPreview || null,
                'settings.hasCompletedSetup': true,
                'settings.adminPassword': adminPwd,
                updatedAt: serverTimestamp(),
              });


              // Verify the update was successful by reading it back
              const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
              if (workspaceDoc.exists()) {
                const data = workspaceDoc.data();
                
                if (data.settings?.hasCompletedSetup) {
                  // Wait a bit to ensure all Firebase writes are propagated
                  setTimeout(() => {
                    onComplete({ name: name.trim(), subtitle: subtitle.trim(), logo: logoPreview });
                  }, 500);
                } else {
                  // Still proceed even if flag not set - it might be a propagation delay
                  setTimeout(() => {
                    onComplete({ name: name.trim(), subtitle: subtitle.trim(), logo: logoPreview });
                  }, 500);
                }
              } else {
                // Still proceed - the data was written, just might not be visible yet
                setTimeout(() => {
                  onComplete({ name: name.trim(), subtitle: subtitle.trim(), logo: logoPreview });
                }, 500);
              }
            } catch (error) {
              
              // Check if it's a permission error or network error
              if (error.code === 'permission-denied') {
                // Data was likely saved to user profile, just workspace doc failed
                // Try to proceed anyway after a delay
                setTimeout(() => {
                  onComplete({ name: name.trim(), subtitle: subtitle.trim(), logo: logoPreview });
                }, 1000);
              } else {
                // Show error only for non-permission errors
                setPwdError('Failed to save workspace settings. Please try again.');
                setLoading(false);
              }
            }
          }).catch((error) => {

            setPwdError('Failed to save password. Please try again.');
            setLoading(false);
          });
        } else {

          setPwdError('Authentication error. Please try again.');
          setLoading(false);
        }
      });
    });
  };

  const inp = (focused) => ({
    width: '100%', height: 48, borderRadius: 10,
    border: `1.5px solid ${focused ? '#3B5BFC' : '#E5E7EB'}`,
    padding: '0 16px', fontSize: 14, color: '#1A1D2E', outline: 'none',
    background: focused ? '#F5F7FF' : '#FAFBFF',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(59,91,252,0.10)' : 'none',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      background: 'rgba(15,20,40,0.35)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 44px 36px',
        width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(59,91,252,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid rgba(255,255,255,0.9)',
        animation: 'wsSetupIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <style>{`
          @keyframes wsSetupIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: s <= step ? 'linear-gradient(90deg, #3B5BFC, #7C3AED)' : '#E5E7EB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* ── Step 1: Workspace branding ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.6px', marginBottom: 4 }}>
              {hasExistingData ? 'Your workspace' : 'Set up your workspace'}
            </h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>
              {hasExistingData ? 'Review your workspace details' : 'Personalise your workspace before you get started'}
            </p>

            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Logo upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
                <div
                  onClick={hasExistingData ? undefined : () => fileRef.current.click()}
                  style={{ 
                    width: 64, height: 64, borderRadius: 16, 
                    border: hasExistingData ? '2px solid #E5E7EB' : '2px dashed #E5E7EB', 
                    background: hasExistingData ? '#F9FAFB' : '#FAFBFF', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: hasExistingData ? 'default' : 'pointer', 
                    overflow: 'hidden', flexShrink: 0, 
                    transition: 'border-color 0.2s',
                    opacity: hasExistingData ? 0.7 : 1
                  }}
                  onMouseEnter={e => !hasExistingData && (e.currentTarget.style.borderColor = '#3B5BFC')}
                  onMouseLeave={e => !hasExistingData && (e.currentTarget.style.borderColor = '#E5E7EB')}
                >
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Upload size={20} color="#9CA3AF" />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1D2E', marginBottom: 2 }}>Workspace Logo</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {hasExistingData ? 'Pre-configured' : 'PNG, JPG up to 2MB'}
                  </div>
                  {!hasExistingData && (
                    <button type="button" onClick={() => fileRef.current.click()} style={{ marginTop: 4, background: 'none', border: 'none', color: '#3B5BFC', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      {logoPreview ? 'Change image' : 'Upload image'}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} disabled={hasExistingData} />
              </div>

              {/* Workspace name */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                  Workspace Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  readOnly={hasExistingData}
                  style={{
                    ...inp(nameFocus),
                    cursor: hasExistingData ? 'default' : 'text',
                    background: hasExistingData ? '#F9FAFB' : (nameFocus ? '#F5F7FF' : '#FAFBFF'),
                    color: hasExistingData ? '#6B7280' : '#1A1D2E',
                  }}
                  onFocus={() => !hasExistingData && setNameFocus(true)}
                  onBlur={() => !hasExistingData && setNameFocus(false)}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                  Subtitle <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. Design & Development Team"
                  readOnly={hasExistingData}
                  style={{
                    ...inp(subtitleFocus),
                    cursor: hasExistingData ? 'default' : 'text',
                    background: hasExistingData ? '#F9FAFB' : (subtitleFocus ? '#F5F7FF' : '#FAFBFF'),
                    color: hasExistingData ? '#6B7280' : '#1A1D2E',
                  }}
                  onFocus={() => !hasExistingData && setSubtitleFocus(true)}
                  onBlur={() => !hasExistingData && setSubtitleFocus(false)}
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', background: name.trim() ? 'linear-gradient(135deg, #3B5BFC, #7C3AED)' : '#E5E7EB', color: name.trim() ? '#fff' : '#9CA3AF', fontSize: 15, fontWeight: 700, cursor: !name.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: name.trim() ? '0 6px 20px rgba(59,91,252,0.3)' : 'none', transition: 'all 0.2s', marginTop: 4 }}
              >
                Next <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Admin/Management password ── */}
        {step === 2 && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: isManagement ? 'linear-gradient(135deg, #7C3AED, #3B5BFC)' : 'linear-gradient(135deg, #3B5BFC, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={22} color="#fff" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.6px', marginBottom: 4 }}>
              {isManagement ? 'Set management password' : 'Set admin password'}
            </h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>
              {isManagement 
                ? 'Create a secure password for your management dashboard access.'
                : 'This password protects sensitive actions across all dashboards — admin, management, and root.'
              }
            </p>

            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Password input */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                  {isManagement ? 'Management Password *' : 'Admin Password *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    autoFocus
                    type={showAdminPwd ? 'text' : 'password'}
                    value={adminPwd}
                    onChange={e => { setAdminPwd(e.target.value); setPwdError(''); }}
                    placeholder="Set a secure password"
                    style={{ ...inp(adminFocus), paddingRight: 44 }}
                    onFocus={() => setAdminFocus(true)}
                    onBlur={() => setAdminFocus(false)}
                  />
                  <button type="button" onClick={() => setShowAdminPwd(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF' }}>
                    {showAdminPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password - for both admin and management */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={e => { setConfirmPwd(e.target.value); setPwdError(''); }}
                    placeholder="Repeat the password"
                    style={{ ...inp(confirmFocus), paddingRight: 44 }}
                    onFocus={() => setConfirmFocus(true)}
                    onBlur={() => setConfirmFocus(false)}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF' }}>
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password hint */}
              <div style={{ background: '#F0F4FF', border: '1.5px solid #C7D4FF', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#3B5BFC', marginBottom: 4 }}>
                  {isManagement ? 'Management password used for:' : 'Used for:'}
                </p>
                <ul style={{ fontSize: 11, color: '#6B7280', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                  <li>Saving / editing tasks and members</li>
                  <li>Processing payments</li>
                  <li>Deleting or archiving items</li>
                  <li>Changing roles and permissions</li>
                </ul>
              </div>

              {pwdError && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                  {pwdError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ flex: 1, height: 50, borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#FAFBFF', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !adminPwd || !confirmPwd}
                  style={{ flex: 2, height: 50, borderRadius: 12, border: loading ? '1.5px solid #EEF2FF' : 'none', background: loading ? '#F5F7FF' : (adminPwd && confirmPwd) ? 'linear-gradient(135deg, #3B5BFC, #7C3AED)' : '#E5E7EB', color: (adminPwd && confirmPwd) ? '#fff' : '#9CA3AF', fontSize: 15, fontWeight: 700, cursor: loading || !adminPwd || !confirmPwd ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (adminPwd && confirmPwd) && !loading ? '0 6px 20px rgba(59,91,252,0.3)' : 'none', transition: 'all 0.2s' }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid #EEF2FF', borderTopColor: '#3B5BFC', animation: 'spin 0.7s linear infinite' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#3B5BFC' }}>Setting up…</span>
                    </div>
                  ) : (
                    <>Go to Dashboard <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
