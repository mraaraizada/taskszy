import { useState } from 'react';
import { Plus, Shield, ChevronDown, Check, X, Tag, FolderOpen, Lock, Edit2, Copy, FileImage, Users, Settings2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';
import { toast } from 'sonner';

const COLOR_PALETTE = [
  '#3B5BFC','#7C3AED','#12C479','#F97316','#EF4444',
  '#06B6D4','#EC4899','#F59E0B','#8B5CF6','#10B981',
];

/* -----------------------------------------------
   TAGS TAB
----------------------------------------------- */
const INITIAL_TAGS = [];

/* -----------------------------------------------
   CATEGORIES TAB
----------------------------------------------- */
const INITIAL_CATS = [];

const ICONS = ['[PC]','[Phone]','??','[Mega]','[Chart]','??','??','[Lock]','??','[Rocket]','[Idea]','[Target]'];

// Function to lighten a color for background use
function lightenColor(color, opacity = 0.15) {
  if (!color || !color.startsWith('#')) return '#F0F2F8';
  
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const lightR = Math.round(r + (255 - r) * (1 - opacity));
  const lightG = Math.round(g + (255 - g) * (1 - opacity));
  const lightB = Math.round(b + (255 - b) * (1 - opacity));
  
  return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
}

/* -----------------------------------------------
   TEXT IMAGE ADD COMPONENT
----------------------------------------------- */
function TextImageAdd({ onAdd, onCancel, managementMode = false }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [color, setColor] = useState('#3B5BFC');
  const [type, setType] = useState('tag');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const extractColorFromImage = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        
        // Generate light background (15% opacity blend with white)
        const lightR = Math.round(r + (255 - r) * 0.85);
        const lightG = Math.round(g + (255 - g) * 0.85);
        const lightB = Math.round(b + (255 - b) * 0.85);
        const lightBg = '#' + [lightR, lightG, lightB].map(x => x.toString(16).padStart(2, '0')).join('');
        
        resolve({ color: hex, bg: lightBg });
      };
      img.src = imageUrl;
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const preview = reader.result;
        setImagePreview(preview);
        if (file.type.startsWith('image/')) {
          const { color: extractedColor, bg: extractedBg } = await extractColorFromImage(preview);
          setColor(extractedColor);

        } else {
          setColor('#3B5BFC');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    requestAdminPassword(`add ${type}`, () => {
      // Generate light background from color
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const lightR = Math.round(r + (255 - r) * 0.85);
      const lightG = Math.round(g + (255 - g) * 0.85);
      const lightB = Math.round(b + (255 - b) * 0.85);
      const lightBg = '#' + [lightR, lightG, lightB].map(x => x.toString(16).padStart(2, '0')).join('');
      
      onAdd({ name: name.trim(), image: imagePreview || '??', color, bg: lightBg, type });
      setName('');
      setImage(null);
      setImagePreview('');
      setColor('#3B5BFC');
    });
  };

  const canAdd = name.trim();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        id="text-image-upload"
        style={{ display: 'none' }}
      />
      <label
        htmlFor="text-image-upload"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1.5px dashed var(--border)',
          background: 'var(--bg-subtle)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#3B5BFC'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        ) : (
          <FileImage size={14} color="var(--text-muted)" />
        )}
      </label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && canAdd && handleAdd()}
        placeholder="Text"
        maxLength={20}
        style={{ width: 180, padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', background: 'var(--input-bg)', outline: 'none', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.borderColor = '#3B5BFC'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {imagePreview && (
        <button
          onClick={() => { setImage(null); setImagePreview(''); }}
          style={{
            background: '#FEF2F2',
            border: 'none',
            borderRadius: 8,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={12} color="#EF4444" />
        </button>
      )}
      
      {/* Add button with dropdown */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <button 
          onClick={handleAdd} 
          disabled={!canAdd} 
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            padding: '6px 12px',
            background: canAdd ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : '#E8EAEF', 
            border: 'none', 
            borderTopLeftRadius: 9,
            borderBottomLeftRadius: 9,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            color: canAdd ? '#fff' : '#9CA3AF', 
            fontSize: 12, 
            fontWeight: 600,
            cursor: canAdd ? 'pointer' : 'not-allowed',
            boxShadow: canAdd ? '0 4px 10px #3B5BFC40' : 'none',
            opacity: canAdd ? 1 : 0.6,
          }}
        >
          <Plus size={13} /> Add {type === 'tag' ? 'Tag' : 'Category'}
        </button>
        <button
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          disabled={!canAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 8px',
            background: canAdd ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : '#E8EAEF',
            border: 'none',
            borderLeft: canAdd ? '1px solid rgba(255,255,255,0.2)' : '1px solid #D1D5DB',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: 9,
            borderBottomRightRadius: 9,
            color: canAdd ? '#fff' : '#9CA3AF',
            cursor: canAdd ? 'pointer' : 'not-allowed',
            boxShadow: canAdd ? '0 4px 10px #3B5BFC40' : 'none',
            opacity: canAdd ? 1 : 0.6,
          }}
        >
          <ChevronDown size={14} />
        </button>
        
        {/* Dropdown menu */}
        {showTypeMenu && canAdd && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 40,
            marginTop: 4,
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            minWidth: 140,
            overflow: 'hidden',
          }}>
            {[
              { value: 'tag', label: 'Tag', icon: Tag },
              { value: 'category', label: 'Category', icon: FolderOpen }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => { setType(option.value); setShowTypeMenu(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: type === option.value ? '#EEF2FF' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: type === option.value ? '#3B5BFC' : 'var(--text-primary)',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (type !== option.value) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={e => { if (type !== option.value) e.currentTarget.style.background = 'transparent'; }}
              >
                <option.icon size={14} />
                {option.label}
                {type === option.value && <Check size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button onClick={onCancel} style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
        background: 'var(--input-bg)', 
        border: '1.5px solid var(--border)', borderRadius: 9,
        color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
        cursor: 'pointer', flexShrink: 0,
      }}>
        <X size={13} /> Cancel
      </button>
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

/* -----------------------------------------------
   ROLES TAB
----------------------------------------------- */

function CopyModal({ item, type, onClose, onSave }) {
  const [name, setName] = useState(item.name + ' (Copy)');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 400, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Copy {type}</div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} color="#6B7280" /></button>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
            placeholder="Enter name..."
            autoFocus
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
            onBlur={e => e.target.style.borderColor = 'var(--border)'} 
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            style={{ flex: 1, padding: 11, background: name.trim() ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : '#E8EAEF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: name.trim() ? '#fff' : '#9CA3AF', cursor: name.trim() ? 'pointer' : 'default' }}>
            Create Copy
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRoleModal({ onClose, onSave, managementMode = false }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { currentUser } = useApp();
  const [roleType, setRoleType] = useState('Admin');
  const [name, setName]         = useState('');
  const [about, setAbout]       = useState('');
  const [color, setColor]       = useState('#7C3AED');

  const isValid = roleType && name.trim();

  const handleCreateRole = () => {
    if (!isValid) return;
    requestAdminPassword('create role', () => {
      onSave({ 
        id: Date.now(), 
        name: name.trim(), 
        description: about.trim(), 
        roleType, 
        color, 
        members: 0, 
        permissions: {},
        createdBy: {
          name: currentUser?.name || 'Admin',
          role: currentUser?.userRole || currentUser?.role || 'admin',
          uid: currentUser?.uid || null
        }
      });
      onClose();
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 440, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Create New Role</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Define a role for your team</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} color="#6B7280" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Role Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role Type *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: 'Management',  color: '#3B5BFC', bg: '#EEF2FF', border: '#3B5BFC', icon: <Settings2 size={16} color={roleType === 'Management' ? '#3B5BFC' : '#9CA3AF'} /> },
                { val: 'Team Member', color: '#12C479', bg: '#ECFDF5', border: '#12C479', icon: <Users size={16} color={roleType === 'Team Member' ? '#12C479' : '#9CA3AF'} /> },
              ].map(t => (
                <div key={t.val} onClick={() => { setRoleType(t.val); setColor(t.color); }}
                  style={{ flex: 1, padding: '12px 10px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${roleType === t.val ? t.border : 'var(--border)'}`, background: roleType === t.val ? t.bg : 'var(--bg-surface)', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {t.icon}
                  <div style={{ fontSize: 11, fontWeight: 700, color: roleType === t.val ? t.color : 'var(--text-primary)', textAlign: 'center' }}>{t.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Content Manager"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* About � single line */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
            <input value={about} onChange={e => setAbout(e.target.value)} placeholder="Brief description of this role..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 11, background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateRole}
              disabled={!isValid}
              style={{ flex: 1, padding: 11, background: isValid ? `linear-gradient(135deg, ${color}, ${color}CC)` : '#E8EAEF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: isValid ? '#fff' : '#9CA3AF', cursor: isValid ? 'pointer' : 'default' }}>
              Create Role
            </button>
          </div>
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

function RoleCard({ role, selected, onSelect, onCopy, onDelete, onEdit }) {
  return (
    <div onClick={onSelect} style={{
      background: selected ? `linear-gradient(135deg, ${role.color}12, ${role.color}06)` : 'var(--bg-surface)',
      borderRadius: 14, padding: '16px 18px',
      border: `2px solid ${selected ? role.color : 'var(--border)'}`,
      cursor: 'pointer', transition: 'all 0.2s',
      boxShadow: selected ? `0 4px 16px ${role.color}20` : 'none',
      position: 'relative',
    }}>
      {selected && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(role); }} 
            style={{ 
              background: 'var(--bg-subtle)', 
              border: 'none', 
              borderRadius: 7, 
              width: 26, 
              height: 26, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <Edit2 size={13} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onCopy(role); }} 
            style={{ 
              background: 'var(--bg-subtle)', 
              border: 'none', 
              borderRadius: 7, 
              width: 26, 
              height: 26, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <Copy size={13} />
          </button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${role.color}, ${role.color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {role.roleType === 'Admin' ? <Shield size={18} color="#fff" /> : role.roleType === 'Management' ? <Settings2 size={18} color="#fff" /> : role.roleType === 'Team Member' ? <Users size={18} color="#fff" /> : <Settings2 size={18} color="#fff" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{role.name}</div>
          {role.roleType && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: role.roleType === 'Admin' ? '#F5F3FF' : role.roleType === 'Management' ? '#EEF2FF' : '#ECFDF5', color: role.roleType === 'Admin' ? '#7C3AED' : role.roleType === 'Management' ? '#3B5BFC' : '#12C479', marginTop: 3, display: 'inline-block' }}>{role.roleType}</span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {role.description || 'No description provided'}
      </div>
    </div>
  );
}

function RolesTab() {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { roles, saveRoles, team, saveMember } = useApp();
  const setRoles = saveRoles;
  const [selectedId, setSelectedId] = useState(roles[0]?.id || 1);
  const [showNew, setShowNew]   = useState(false);
  const [copyingRole, setCopyingRole] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const role = roles.find((r) => r.id === selectedId);

  if (!role && roles.length > 0) { setSelectedId(roles[0].id); return null; }
  if (!role) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--text-muted)' }}>
      No roles available. Create a new role to get started.
    </div>
  );

  const copyRole = (role) => setCopyingRole(role);

  const [editingDesc, setEditingDesc] = useState(false);
  const [tempDesc, setTempDesc]       = useState('');
  const [editingAbout, setEditingAbout] = useState(false);
  const [tempAbout, setTempAbout]       = useState('');

  const confirmCopyRole = (newName) => {
    const newRole = { ...copyingRole, id: Date.now(), name: newName, members: 0 };
    setRoles(prev => [...prev, newRole]);
    setSelectedId(newRole.id);
    setCopyingRole(null);
  };

  const deleteRole = (id) => {
    const remainingRoles = roles.filter(r => r.id !== id);
    setRoles(remainingRoles);
    if (selectedId === id && remainingRoles.length > 0) setSelectedId(remainingRoles[0].id);
    else if (remainingRoles.length === 0) setSelectedId(null);
  };

  const startEditRole = (r) => { setEditingRole(r); setEditName(r.name); setEditDescription(r.description); };

  const saveEditRole = () => {
    if (!editName.trim()) return;
    setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, name: editName.trim(), description: editDescription.trim() } : r));
    // Note: Card description is separate from work description, so we don't sync it to team members
    setEditingRole(null);
  };

  const saveDesc = () => {

    const updatedAt = Date.now();

    setRoles(prev => prev.map(r => r.id === selectedId ? { 
      ...r, 
      workDescription: tempDesc,
      workDescriptionUpdatedAt: updatedAt // Track when description was updated
    } : r));

    // Sync work description to all team members whose role matches this role's name (case-insensitive)
    const affectedMembers = team.filter(m => m.role?.toLowerCase() === role.name?.toLowerCase());

    affectedMembers.forEach(m => {

      // Reset the descReadAt timestamp so users see the unread indicator
      saveMember({ ...m, desc: tempDesc, descReadAt: null });
    });
    setEditingDesc(false);
    
    // Show success notification
    if (affectedMembers.length > 0) {
      toast.success(`Work description updated for ${affectedMembers.length} team member${affectedMembers.length > 1 ? 's' : ''} with role "${role.name}"`);
    } else {
      toast.success('Work description saved');
    }
  };

  const saveAbout = () => {
    setRoles(prev => prev.map(r => r.id === selectedId ? { ...r, about: tempAbout } : r));
    setEditingAbout(false);
  };

  return (
    <div style={{ display: 'flex', gap: 18, minHeight: 0, flex: 1, overflow: 'hidden', width: '100%' }}>
      {/* Left � Role list */}
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Roles</span>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px #3B5BFC40' }}>
            <Plus size={13} /> New
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {roles.map(r => <RoleCard key={r.id} role={r} selected={selectedId === r.id} onSelect={() => { setSelectedId(r.id); setEditingDesc(false); setEditingAbout(false); }} onCopy={copyRole} onDelete={deleteRole} onEdit={startEditRole} />)}
        </div>
      </div>

      {/* Right � Role detail panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {role ? (
          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: `2px solid ${role.color}30`, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${role.color}12, transparent)`, borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${role.color}, ${role.color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {role.roleType === 'Admin' ? <Shield size={20} color="#fff" /> : role.roleType === 'Management' ? <Settings2 size={20} color="#fff" /> : role.roleType === 'Team Member' ? <Users size={20} color="#fff" /> : <Settings2 size={20} color="#fff" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{role.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {role.roleType && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: role.roleType === 'Admin' ? '#F5F3FF' : role.roleType === 'Management' ? '#EEF2FF' : '#ECFDF5', color: role.roleType === 'Admin' ? '#7C3AED' : role.roleType === 'Management' ? '#3B5BFC' : '#12C479', display: 'inline-block' }}>{role.roleType}</span>
                  )}
                  {role.createdBy && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                      Created by: {role.createdBy.name} ({role.createdBy.role})
                    </span>
                  )}
                </div>
              </div>
              
              {/* Save and Cancel buttons */}
              {(editingDesc || editingAbout) && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button 
                    onClick={() => {
                      requestAdminPassword('save changes', () => {
                        if (editingDesc) saveDesc();
                        if (editingAbout) saveAbout();
                      });
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 5, 
                      padding: '8px 16px', 
                      background: 'linear-gradient(135deg, #12C479, #0EA368)', 
                      border: 'none', 
                      borderRadius: 9, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: '#fff', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px #12C47940'
                    }}
                  >
                    <Check size={14} /> Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditingDesc(false);
                      setEditingAbout(false);
                    }}
                    style={{ 
                      padding: '8px 16px', 
                      background: 'var(--bg-subtle)', 
                      border: '1.5px solid var(--border)', 
                      borderRadius: 9, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: 'var(--text-secondary)', 
                      cursor: 'pointer' 
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0 }}>

              {/* Description section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Description</div>
                </div>
                {editingDesc ? (
                  <div>
                    <textarea value={tempDesc} onChange={e => setTempDesc(e.target.value)} autoFocus rows={10}
                      placeholder="Use / to separate each point. e.g. Review pull requests daily / Write unit tests for all new features / Attend weekly stand-ups"
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #3B5BFC', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', background: 'var(--input-bg)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, marginBottom: 4 }}>
                      [Idea] Use <code style={{ background: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>/</code> to separate each bullet point shown to team members
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', minHeight: 120, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: 13, color: role.workDescription ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {role.workDescription || 'Use / to separate each point. e.g. Review pull requests daily / Write unit tests / Attend weekly stand-ups'}
                    <button onClick={() => { setEditingDesc(true); setTempDesc(role.workDescription || ''); }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <Edit2 size={12} color="var(--text-muted)" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Select a role to view details
          </div>
        )}
      </div>

      {showNew && <NewRoleModal onClose={() => setShowNew(false)} onSave={r => { setRoles(prev => [...prev, r]); setSelectedId(r.id); setShowNew(false); }} />}
      {copyingRole && <CopyModal item={copyingRole} type="Role" onClose={() => setCopyingRole(null)} onSave={confirmCopyRole} />}
      {editingRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 440, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Role</div>
              <button onClick={() => setEditingRole(null)} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} color="#6B7280" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Role Name - Read Only */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role Name</label>
                <div style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-subtle)', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                  {editingRole.name}
                </div>
              </div>
              {/* Description - Editable */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description</label>
                <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEditRole()}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={(e) => e.target.style.borderColor = '#3B5BFC'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button onClick={() => setEditingRole(null)} style={{ flex: 1, padding: 11, background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => {
                  requestAdminPassword('save role description', () => {
                    setRoles(prev => prev.map((r) => r.id === editingRole.id ? { ...r, description: editDescription } : r));
                    setEditingRole(null);
                  });
                }}
                  style={{ flex: 1, padding: 11, background: `linear-gradient(135deg, ${editingRole.color}, ${editingRole.color}CC)`, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action={pendingAction?.actionName || 'perform this action'}
          label="Admin Password"
        />
      )}
    </div>
  );
}

/* -----------------------------------------------
   TAGS & CATEGORIES COMBINED TAB
----------------------------------------------- */
function TagsAndCategoriesTab({ managementMode = false }) {
  const { showPasswordModal, pendingAction, requestAdminPassword, handlePasswordConfirm, handlePasswordCancel } = useAdminPassword();
  const { TAGS: tags, CATEGORIES: cats, saveTags, saveCategories, deleteTag: deleteTagFromContext, deleteCategory: deleteCategoryFromContext, tasks, updateTask } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [editTagId, setEditTagId] = useState(null);
  const [editCatId, setEditCatId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [copyingTag, setCopyingTag] = useState(null);
  const [copyingCat, setCopyingCat] = useState(null);

  function addItem(item) {
    const newId = Date.now();
    if (item.type === 'tag') {
      saveTags(prev => [...prev, { id: newId, name: item.name, image: item.image, color: item.color, bg: item.bg, createdByManagement: managementMode, visible: true }]);
    } else {
      saveCategories(prev => [...prev, { id: newId, name: item.name, icon: item.image, color: item.color, bg: item.bg, count: 0, createdByManagement: managementMode, visible: true }]);
    }
    setShowCreate(false);
  }

  function toggleTagVisibility(tagId) {
    requestAdminPassword('toggle tag visibility', () => {
      saveTags(prev => prev.map(t => t.id === tagId ? { ...t, visible: t.visible === false ? true : false } : t));
    });
  }

  function toggleCatVisibility(catId) {
    requestAdminPassword('toggle category visibility', () => {
      saveCategories(prev => prev.map(c => c.id === catId ? { ...c, visible: c.visible === false ? true : false } : c));
    });
  }

  function startEditTag(tag) {
    setEditTagId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function startEditCat(cat) {
    setEditCatId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  }

  function saveEditTag() {
    if (!editName.trim()) return;
    
    // ? CRITICAL: Capture the old name BEFORE updating the tag
    const oldTag = tags.find((t) => t.id === editTagId);
    const oldName = oldTag?.name;
    const newName = editName.trim();
    
    if (!oldName || oldName === newName) {
      setEditTagId(null);
      return;
    }
    
    requestAdminPassword('save tag changes', async () => {

      let updatedCount = 0;
      
      // First, update all tasks that use this tag
      const updatePromises = tasks.map(async (task) => {
        if (task.tags && Array.isArray(task.tags)) {

          // Check if this task uses the old tag name (stored as 'label' in task)
          const hasTag = task.tags.some((tag) => tag.label === oldName);
          
          if (hasTag) {
            // Update the tag label in this task
            const updatedTags = task.tags.map((tag) => 
              tag.label === oldName ? { ...tag, label: newName } : tag
            );

            updatedCount++;
            await updateTask(task.id, { ...task, tags: updatedTags });
          }
        }
      });
      
      await Promise.all(updatePromises);

      // Then update the tag in tags array
      saveTags(prev => prev.map((t) => t.id === editTagId ? { ...t, name: newName } : t));
      
      setEditTagId(null);
    });
  }

  function saveEditCat() {
    if (!editName.trim()) return;
    
    // ? CRITICAL: Capture the old name BEFORE updating the category
    const oldCat = cats.find((c) => c.id === editCatId);
    const oldName = oldCat?.name;
    const newName = editName.trim();
    
    if (!oldName || oldName === newName) {
      setEditCatId(null);
      return;
    }
    
    requestAdminPassword('save category changes', async () => {

      let updatedCount = 0;
      
      // First, update all tasks that use this category
      const updatePromises = tasks.map(async (task) => {

        // Check if this task uses the old category name (stored as 'label' in task.category object)
        if (task.category && task.category.label === oldName) {

          updatedCount++;
          // Update the category label in this task
          const updatedCategory = { ...task.category, label: newName };
          await updateTask(task.id, { ...task, category: updatedCategory });
        }
      });
      
      await Promise.all(updatePromises);

      // Then update the category in categories array
      saveCategories(prev => prev.map((c) => c.id === editCatId ? { ...c, name: newName } : c));
      
      setEditCatId(null);
    });
  }

  function deleteTag(id) {
    requestAdminPassword('delete tag', () => {
      deleteTagFromContext(id);
    });
  }

  function deleteCat(id) {
    requestAdminPassword('delete category', () => {
      deleteCategoryFromContext(id);
    });
  }

  function copyTag(tag) {
    setCopyingTag(tag);
  }

  function confirmCopyTag(newName) {
    const newTag = { ...copyingTag, id: Date.now(), name: newName };
    saveTags(prev => [...prev, newTag]);
    setCopyingTag(null);
  }

  function copyCat(cat) {
    setCopyingCat(cat);
  }

  function confirmCopyCat(newName) {
    const newCat = { ...copyingCat, id: Date.now(), name: newName };
    saveCategories(prev => [...prev, newCat]);
    setCopyingCat(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* All Items - Tags & Categories */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 24, border: '1.5px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={18} color="#3B5BFC" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Tags & Categories</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage task labels and types</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showCreate && <TextImageAdd onAdd={addItem} onCancel={() => setShowCreate(false)} managementMode={managementMode} />}
            {!showCreate && (
              <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px #3B5BFC40', flexShrink: 0 }}>
                <Plus size={13} /> Add
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {/* Empty state when both tags and cats are empty */}
          {tags.length === 0 && cats.length === 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={26} color="#3B5BFC" strokeWidth={1.8} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No tags or categories yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 300 }}>Add tags and categories to organise and label your tasks</div>
              </div>
              <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,91,252,0.25)' }}>
                <Plus size={14} /> Add First Tag
              </button>
            </div>
          )}

          {/* Tags */}
          {tags.map(tag => {
            // Use saved bg or generate from color
            const bgColor = tag.bg || (tag.color ? lightenColor(tag.color, 0.15) : '#F0F2F8');
            const isVisible = tag.visible !== false; // Default to true if not set
            return (
              <div key={`tag-${tag.id}`}
                onClick={() => { setSelectedTagId(selectedTagId === tag.id ? null : tag.id); setSelectedCatId(null); }}
                onMouseEnter={e => { e.currentTarget.style.background = tag.color ? lightenColor(tag.color, 0.10) : '#F0F2F8'; e.currentTarget.style.borderColor = tag.color; }}
                onMouseLeave={e => { if (selectedTagId !== tag.id) { e.currentTarget.style.background = bgColor; e.currentTarget.style.borderColor = 'var(--border-light)'; } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', background: bgColor,
                  borderRadius: 10, border: `1.5px solid ${selectedTagId === tag.id ? tag.color : 'var(--border-light)'}`,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  minHeight: 38,
                  opacity: isVisible ? 1 : 0.4,
                }}
              >
              {editTagId === tag.id ? (
                <>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {tag.image?.startsWith('data:image') ? (
                      <img src={tag.image} alt={tag.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 14 }}>{tag.image}</span>
                    )}
                  </div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditTag()}
                    autoFocus
                    style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button onClick={saveEditTag} style={{ background: '#ECFDF5', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Check size={12} color="#12C479" />
                  </button>
                  <button onClick={() => setEditTagId(null)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={12} color="#EF4444" />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {tag.image?.startsWith('data:image') ? (
                      <img src={tag.image} alt={tag.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 14 }}>{tag.image}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tag.name}</span>
                  {selectedTagId === tag.id && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                      {/* Visibility Checkbox - Only visible when selected */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleTagVisibility(tag.id); }}
                        style={{ 
                          width: 26, 
                          height: 26, 
                          borderRadius: 7, 
                          border: 'none',
                          background: 'transparent',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          position: 'relative'
                        }}
                        title={isVisible ? 'Hide from task creation' : 'Show in task creation'}
                      >
                        <div style={{ 
                          width: 18, 
                          height: 18, 
                          borderRadius: 5, 
                          border: `2px solid ${isVisible ? tag.color || '#3B5BFC' : '#D1D5DB'}`, 
                          background: isVisible ? (tag.color || '#3B5BFC') : 'transparent',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}>
                          {isVisible && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                      </button>
                      {!managementMode && (
                        <button onClick={(e) => { e.stopPropagation(); copyTag(tag); }} style={{ background: 'transparent', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Copy size={13} />
                        </button>
                      )}
                      {(!managementMode || tag.createdByManagement) && (
                        <button onClick={(e) => { e.stopPropagation(); startEditTag(tag); }} style={{ background: 'transparent', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Edit2 size={13} />
                        </button>
                      )}
                      {!managementMode && (
                        <button onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }} style={{ background: 'transparent', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            );
          })}
          
          {/* Spacer */}
          {tags.length > 0 && cats.length > 0 && (
            <div style={{ width: '100%', height: 8 }} />
          )}
          
          {/* Categories */}
          {cats.map(cat => {
            // Use saved bg or generate from color
            const bgColor = cat.bg || (cat.color ? lightenColor(cat.color, 0.15) : '#F0F2F8');
            const isVisible = cat.visible !== false; // Default to true if not set
            return (
              <div key={`cat-${cat.id}`}
                onClick={() => { setSelectedCatId(selectedCatId === cat.id ? null : cat.id); setSelectedTagId(null); }}
                onMouseEnter={e => { e.currentTarget.style.background = cat.color ? lightenColor(cat.color, 0.10) : '#F0F2F8'; e.currentTarget.style.borderColor = cat.color; }}
                onMouseLeave={e => { if (selectedCatId !== cat.id) { e.currentTarget.style.background = bgColor; e.currentTarget.style.borderColor = 'var(--border-light)'; } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', background: bgColor,
                  borderRadius: 10, border: `1.5px solid ${selectedCatId === cat.id ? cat.color : 'var(--border-light)'}`,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  minHeight: 38,
                  opacity: isVisible ? 1 : 0.4,
                }}
              >
              {editCatId === cat.id ? (
                <>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cat.icon?.startsWith('data:image') ? (
                      <img src={cat.icon} alt={cat.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    )}
                  </div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditCat()}
                    autoFocus
                    style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button onClick={saveEditCat} style={{ background: '#ECFDF5', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Check size={12} color="#12C479" />
                  </button>
                  <button onClick={() => setEditCatId(null)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={12} color="#EF4444" />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cat.icon?.startsWith('data:image') ? (
                      <img src={cat.icon} alt={cat.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                  {selectedCatId === cat.id && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                      {/* Visibility Checkbox - Only visible when selected */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleCatVisibility(cat.id); }}
                        style={{ 
                          width: 26, 
                          height: 26, 
                          borderRadius: 7, 
                          border: 'none',
                          background: 'transparent',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          position: 'relative'
                        }}
                        title={isVisible ? 'Hide from task creation' : 'Show in task creation'}
                      >
                        <div style={{ 
                          width: 18, 
                          height: 18, 
                          borderRadius: 5, 
                          border: `2px solid ${isVisible ? cat.color || '#3B5BFC' : '#D1D5DB'}`, 
                          background: isVisible ? (cat.color || '#3B5BFC') : 'transparent',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}>
                          {isVisible && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                      </button>
                      {!managementMode && (
                        <button onClick={(e) => { e.stopPropagation(); copyCat(cat); }} style={{ background: 'transparent', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Copy size={13} />
                        </button>
                      )}
                      {(!managementMode || cat.createdByManagement) && (
                        <button onClick={(e) => { e.stopPropagation(); startEditCat(cat); }} style={{ background: 'transparent', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Edit2 size={13} />
                        </button>
                      )}
                      {!managementMode && (
                        <button onClick={(e) => { e.stopPropagation(); deleteCat(cat.id); }} style={{ background: 'transparent', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            );
          })}
        </div>
      </div>
      {copyingTag && <CopyModal item={copyingTag} type="Tag" onClose={() => setCopyingTag(null)} onSave={confirmCopyTag} />}
      {copyingCat && <CopyModal item={copyingCat} type="Category" onClose={() => setCopyingCat(null)} onSave={confirmCopyCat} />}
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

/* -----------------------------------------------
   MANAGEMENT PAGE (TABS)
----------------------------------------------- */
const TABS = [
  { id: 'tags',        label: 'Tags',                icon: Tag,        desc: 'Manage task labels' },
  { id: 'categories',  label: 'Categories',          icon: FolderOpen, desc: 'Organize task types' },
  { id: 'roles',       label: 'Roles & Description', icon: Lock,       desc: 'Manage role descriptions' },
];

export default function RolesPage({ managementMode = false }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px 24px', gap: 16, overflowY: 'auto' }}>

      {/* Roles & Description Section */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 24, border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0, height: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="#F97316" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Roles & Description</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage role descriptions</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <RolesTab />
        </div>
      </div>

      {/* Horizontal Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Tags & Categories Section */}
      <TagsAndCategoriesTab managementMode={managementMode} />

    </div>
  );
}
