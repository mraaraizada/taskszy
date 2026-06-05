import { Search, X, PanelRight, Plus, ImagePlus, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, query as firestoreQuery, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { compressCarouselImage } from '../lib/imageCompression';
import carouselE from '../assets/carousel-e.png';
import carouselG from '../assets/carousel-g.png';
import carouselJ from '../assets/carousel-j.png';
import carouselQ from '../assets/carousel-q.png';
import carouselZ from '../assets/carousel-z.png';

const STAGE_COLOR = {
  New: '#9CA3AF', Start: '#3B5BFC', Accept: '#7C3AED',
  Review: '#F97316', Update: '#EF4444', Complete: '#12C479',
};

// Persist dashboards to localStorage so LoginPage carousel picks them up
const LS_KEY = 'carouselDashboards';

// Default carousel images from local assets
const DEFAULT_CAROUSEL_IMAGES = [
  carouselE,
  carouselG,
  carouselJ,
  carouselQ,
  carouselZ,
];

function loadDashboards() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'default',
      label: 'Default',
      active: true,
      images: DEFAULT_CAROUSEL_IMAGES,
    },
  ];
}

function saveDashboards(dashboards) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(dashboards)); } catch {}
}

export default function Header({ title, subtitle }) {
  const { tasks, currentUser, globalSearchQuery, setGlobalSearchQuery, organizations, setNavigationRequest, setSelectedOrganizationId } = useApp();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dashTitle, setDashTitle] = useState('');
  const [dashboards, setDashboards] = useState(loadDashboards);
  const [selectedImages, setSelectedImages] = useState([]);   // { localUrl, file } pairs
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef(null);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Sync dashboards to localStorage whenever they change
  useEffect(() => { saveDashboards(dashboards); }, [dashboards]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Get search results - filter organizations by search query
  const getSearchResults = () => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    
    return (organizations || [])
      .filter(org => 
        org.name?.toLowerCase().includes(q) ||
        org.workspaceSub?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(org => ({ ...org, type: 'organization' }));
  };

  const results = getSearchResults();
  const showDrop = focused && globalSearchQuery.trim().length > 0;

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setFocused(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setPanelOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleAddDashboard() {
    const label = dashTitle.trim();
    if (!label) return;

    const filesToUpload = selectedImages.filter(img => img.file);
    const alreadyUploaded = selectedImages.filter(img => !img.file).map(img => img.localUrl);

    // Validate: Must have at least one image
    if (filesToUpload.length === 0 && alreadyUploaded.length === 0) {
      alert('Please select at least one image for the carousel');
      return;
    }

    if (filesToUpload.length === 0) {
      // No new files — just add with already-uploaded URLs
      const id = 'dash-' + Date.now();
      const updated = [...dashboards, { id, label, images: alreadyUploaded, active: false }];
      setDashboards(updated);
      setDashTitle('');
      setSelectedImages([]);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Compress images before uploading
    const compressionPromises = filesToUpload.map(async (img) => {
      try {

        const compressedFile = await compressCarouselImage(img.file);
        return { ...img, file: compressedFile };
      } catch (err) {

        return img; // Fallback to original if compression fails
      }
    });

    Promise.all(compressionPromises)
      .then((compressedImages) => {
        const uploadPromises = compressedImages.map((img, idx) => {
          return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `carousel/${Date.now()}_${idx}_${img.file.name}`);
            
            // Add cache control metadata
            const metadata = {
              cacheControl: 'public, max-age=604800', // Cache for 7 days
              contentType: img.file.type
            };
            
            const task = uploadBytesResumable(storageRef, img.file, metadata);
            task.on(
              'state_changed',
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                setUploadProgress(pct);
              },
              reject,
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);

                resolve(url);
              }
            );
          });
        });

        return Promise.all(uploadPromises);
      })
      .then((downloadUrls) => {
        const allImages = [...alreadyUploaded, ...downloadUrls];
        const id = 'dash-' + Date.now();
        const updated = [...dashboards, { id, label, images: allImages, active: false }];
        setDashboards(updated);
        setDashTitle('');
        setSelectedImages([]);
      })
      .catch((err) => {

      })
      .finally(() => {
        setUploading(false);
        setUploadProgress(0);
      });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Use FileReader instead of createObjectURL to avoid blob URL errors
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImages(prev => [...prev, { localUrl: event.target.result, file }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleDeleteDashboard(e, id) {
    e.stopPropagation();
    setDashboards(prev => {
      const filtered = prev.filter(d => d.id !== id);
      const hasActive = filtered.some(d => d.active);
      if (!hasActive && filtered.length > 0) filtered[0].active = true;
      return filtered;
    });
  }

  async function handleSetActive(id) {
    setDashboards(prev => prev.map(d => ({ ...d, active: d.id === id })));
    
    // If default carousel is selected, clear Firebase cache and set default images
    if (id === 'default') {

      try {
        // Save default local asset images to cache immediately
        localStorage.setItem('login_carousel_images', JSON.stringify(DEFAULT_CAROUSEL_IMAGES));
        localStorage.setItem('login_carousel_timestamp', Date.now().toString());

        // Deactivate all Firebase carousels
        const carouselsRef = collection(db, 'carousels');
        const activeQuery = firestoreQuery(carouselsRef, where('active', '==', true));
        const activeSnapshot = await getDocs(activeQuery);
        
        const deactivatePromises = activeSnapshot.docs.map(docSnapshot => 
          setDoc(docSnapshot.ref, { active: false }, { merge: true })
        );
        await Promise.all(deactivatePromises);

      } catch (error) {

      }
      
      return;
    }
    
    // Save active carousel to Firebase (only for custom carousels)
    const activeDashboard = dashboards.find(d => d.id === id);
    if (activeDashboard) {
      try {

        // First, set all existing carousels to inactive
        const carouselsRef = collection(db, 'carousels');
        const activeQuery = firestoreQuery(carouselsRef, where('active', '==', true));
        const activeSnapshot = await getDocs(activeQuery);
        
        const deactivatePromises = activeSnapshot.docs.map(docSnapshot => 
          setDoc(docSnapshot.ref, { active: false }, { merge: true })
        );
        await Promise.all(deactivatePromises);
        
        // Then save/update the new active carousel
        const carouselDocRef = doc(db, 'carousels', activeDashboard.id);
        await setDoc(carouselDocRef, {
          id: activeDashboard.id,
          label: activeDashboard.label,
          images: activeDashboard.images || [],
          active: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });

      } catch (error) {

      }
    }
  }

  return (
    <>
    <div style={{
      height: 64,
      background: 'var(--bg-surface)',
      borderBottom: '1.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0, position: 'relative', zIndex: 200,
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>

      {/* Left: greeting + date */}
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {greeting}, {currentUser?.name || 'Admin'}! 👋
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{dateStr}</p>
      </div>

      {/* Right: search + edit button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Task search */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: focused ? 'var(--bg-surface)' : 'var(--input-bg)',
            border: `1.5px solid ${focused ? '#3B5BFC' : 'var(--border)'}`,
            borderRadius: 11, padding: '0 12px', height: 38,
            width: focused ? 280 : 220,
            boxShadow: focused ? '0 0 0 3px rgba(59,91,252,0.1)' : 'none',
            transition: 'all 0.2s ease',
          }}>
            <Search size={14} color={focused ? '#3B5BFC' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={globalSearchQuery}
              onChange={e => {

                setGlobalSearchQuery(e.target.value);
              }}
              onFocus={() => setFocused(true)}
              placeholder="Search organizations…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-primary)', width: '100%' }}
            />
            {globalSearchQuery && (
              <button onClick={() => { setGlobalSearchQuery(''); inputRef.current?.focus(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={13} color="var(--text-muted)" />
              </button>
            )}
          </div>

          {showDrop && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, background: 'var(--bg-surface)',
              border: '1.5px solid var(--border)', borderRadius: 14,
              boxShadow: 'var(--shadow-md)', overflow: 'hidden',
              animation: 'fadeSlideIn 0.18s ease forwards', zIndex: 300,
            }}>
              {results.length === 0 ? (
                <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No organizations found for "<strong>{globalSearchQuery}</strong>"
                </div>
              ) : (
                results.map((org, idx) => {
                    const getPlanColor = (plan) => {
                      switch (plan) {
                        case 'Starter': return { bg: '#FEF3C7', color: '#D97706' };
                        case 'Professional': return { bg: '#DBEAFE', color: '#1D4ED8' };
                        case 'Business': return { bg: '#F3E8FF', color: '#9333EA' };
                        case 'Enterprise': return { bg: '#FFF7ED', color: '#F97316' };
                        default: return { bg: '#F3F4F6', color: '#6B7280' };
                      }
                    };
                    
                    const planColors = getPlanColor(org.subscriptionPlan);
                    const getInitials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    
                    return (
                      <div key={org.id || idx} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                        transition: 'background 0.12s', cursor: 'pointer',
                      }}
                        onClick={() => {

                          setSelectedOrganizationId(org.id);
                          setNavigationRequest('team');
                          setGlobalSearchQuery('');
                          setFocused(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Organization Logo */}
                        {org.workspaceLogo ? (
                          <img
                            src={org.workspaceLogo}
                            alt={org.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {getInitials(org.name)}
                          </div>
                        )}
                        
                        {/* Organization Info */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                            {org.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                            {org.workspaceSub || 'No description'}
                          </div>
                        </div>
                        
                        {/* Plan Badge */}
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: planColors.bg,
                          color: planColors.color,
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {org.subscriptionPlan}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Panel Button */}
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            width: 38, height: 38, borderRadius: 11,
            border: `1.5px solid ${panelOpen ? '#3B5BFC' : 'var(--border)'}`,
            background: panelOpen ? '#EEF2FF' : 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#EEF2FF';
            e.currentTarget.style.borderColor = '#3B5BFC';
          }}
          onMouseLeave={e => {
            if (!panelOpen) {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }
          }}
          title="Dashboard options"
        >
          <PanelRight size={16} color="#3B5BFC" strokeWidth={2} />
        </button>

      </div>

    </div>

    {/* ── Centered Dashboard Options Modal ── */}
    {panelOpen && (
      <div
        onClick={() => setPanelOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.18s ease',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 360, background: 'var(--bg-surface)',
            border: '1.5px solid var(--border)', borderRadius: 20,
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column',
            maxHeight: '85vh',
            animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Modal header */}
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1.5px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderRadius: '20px 20px 0 0',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Carousel Options</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manage carousel for organizations</div>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            >
              <X size={14} color="#374151" strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Update input */}
          <div style={{ padding: '12px 16px', borderBottom: '1.5px solid var(--border-light)' }}>

            {/* Title + image + add button */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={dashTitle}
                onChange={e => setDashTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDashboard()}
                placeholder="Text"
                autoFocus
                style={{
                  flex: 1, padding: '9px 13px', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: 'var(--input-bg)',
                  fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                  transition: 'border 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#3B5BFC'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {/* Image picker button */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                title="Select image"
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  border: `1.5px solid ${selectedImages.length ? '#3B5BFC' : 'var(--border)'}`,
                  background: selectedImages.length ? '#EEF2FF' : 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  opacity: uploading ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = '#3B5BFC'; e.currentTarget.style.background = '#EEF2FF'; } }}
                onMouseLeave={e => { if (!selectedImages.length && !uploading) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-subtle)'; } }}
              >
                <ImagePlus size={15} color={selectedImages.length ? '#3B5BFC' : '#6B7280'} strokeWidth={2} />
              </button>
              <button
                onClick={handleAddDashboard}
                disabled={!dashTitle.trim() || uploading || selectedImages.length === 0}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none',
                  background: dashTitle.trim() && !uploading && selectedImages.length > 0 ? '#3B5BFC' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: dashTitle.trim() && !uploading && selectedImages.length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { if (dashTitle.trim() && !uploading && selectedImages.length > 0) e.currentTarget.style.background = '#2D4AE8'; }}
                onMouseLeave={e => { if (dashTitle.trim() && !uploading && selectedImages.length > 0) e.currentTarget.style.background = '#3B5BFC'; }}
              >
                {uploading
                  ? <Loader2 size={15} color="#fff" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Plus size={16} color="#fff" strokeWidth={2.5} />
                }
              </button>
            </div>

            {/* Upload progress bar */}
            {uploading && (
              <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#3B5BFC', borderRadius: 4, transition: 'width 0.2s ease' }} />
              </div>
            )}

            {/* Image previews — horizontal row */}
            {selectedImages.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {selectedImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={img.localUrl} alt={`img-${idx}`} style={{ width: 36, height: 36, borderRadius: 7, objectFit: 'cover', border: '1.5px solid var(--border)', display: 'block' }} />
                    {!uploading && (
                      <button
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute', top: -5, right: -5,
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#EF4444', border: '1.5px solid #fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        <X size={9} color="#fff" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dashboard list */}
          <div style={{ padding: '12px 16px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {dashboards.map(d => (
              <div
                key={d.id}
                onClick={() => handleSetActive(d.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8,
                  padding: '11px 14px', borderRadius: 12,
                  border: `1.5px solid ${d.active ? '#3B5BFC' : 'var(--border-light)'}`,
                  background: d.active ? '#EEF2FF' : 'var(--bg-subtle)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!d.active) e.currentTarget.style.background = 'var(--bg-surface)'; }}
                onMouseLeave={e => { if (!d.active) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                    background: d.active ? '#3B5BFC' : 'var(--text-muted)',
                    boxShadow: d.active ? '0 0 0 3px rgba(59,91,252,0.18)' : 'none',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: d.active ? 700 : 500, color: d.active ? '#3B5BFC' : 'var(--text-primary)', flex: 1 }}>
                    {d.label}
                  </span>
                  {d.active && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#3B5BFC', background: '#D6DFFE', padding: '2px 8px', borderRadius: 20, marginRight: 4 }}>Active</span>
                  )}
                  {d.id !== 'default' && (
                    <button
                      onClick={e => handleDeleteDashboard(e, d.id)}
                      style={{
                        width: 20, height: 20, borderRadius: 6, border: 'none',
                        background: 'transparent', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Delete"
                    >
                      <X size={11} color="#EF4444" strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* Image previews - Only show for non-default dashboards */}
                {d.id !== 'default' && d.images && d.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {d.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`img-${idx}`}
                        style={{
                          width: 34, height: 34, borderRadius: 6,
                          objectFit: 'cover',
                          border: `1.5px solid ${d.active ? 'rgba(59,91,252,0.25)' : 'var(--border)'}`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          </div>{/* end scrollable body */}

        </div>
      </div>
    )}
    </>
  );
}
