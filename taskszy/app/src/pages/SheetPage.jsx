import { useEffect, useRef, useState } from 'react';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadStyle(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}
export default function SheetPage() {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadStyle('/xspreadsheet.css');
    loadScript('/xspreadsheet.js').then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    if (instanceRef.current) return; // already mounted

    const xs = window.x_spreadsheet;
    if (!xs) return;

    // Clear container first
    containerRef.current.innerHTML = '';

    instanceRef.current = xs(containerRef.current, {
      mode: 'edit',
      showToolbar: true,
      showGrid: true,
      showContextmenu: true,
      view: {
        height: () => containerRef.current?.clientHeight || 600,
        width: () => containerRef.current?.clientWidth || 800,
      },
      row: { len: 100, height: 25 },
      col: { len: 26, width: 100, indexWidth: 60, minWidth: 60 },
      style: {
        bgcolor: '#ffffff',
        align: 'left',
        valign: 'middle',
        textwrap: false,
        strike: false,
        underline: false,
        color: '#0a0a0a',
        font: { name: 'Inter', size: 10, bold: false, italic: false },
      },
    });

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, [ready]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: 'var(--bg-main)' }}>
      {/* Header bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1.5px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Sheet</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Spreadsheet editor</div>
        </div>
      </div>

      {/* Spreadsheet container */}
      <div
        ref={containerRef}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      />

      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #EEF2FF', borderTopColor: '#3B5BFC', animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}
    </div>
  );
}
