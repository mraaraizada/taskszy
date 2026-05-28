import React from 'react';
import { Monitor, Tablet, Smartphone, Maximize2 } from 'lucide-react';

/**
 * Responsive Test Component
 * This component demonstrates all responsive features and helps verify the system is working
 */
export default function ResponsiveTest() {
  return (
    <div className="responsive-padding" style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="responsive-card" style={{ marginBottom: 'var(--card-gap)' }}>
        <h1 className="text-responsive-hero" style={{ marginBottom: 8 }}>
          Responsive Design Test Page
        </h1>
        <p className="text-responsive-body" style={{ color: 'var(--text-muted)' }}>
          Resize your browser window to see the responsive behavior in action
        </p>
      </div>

      {/* Breakpoint Indicator */}
      <div className="responsive-card" style={{ marginBottom: 'var(--card-gap)', background: '#EEF2FF', border: '1.5px solid #3B5BFC' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12, color: '#3B5BFC' }}>
          Current Breakpoint
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="show-mobile" style={{ padding: '8px 16px', background: '#3B5BFC', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            [Phone] Mobile (< 640px)
          </div>
          <div className="hide-mobile hide-desktop" style={{ padding: '8px 16px', background: '#3B5BFC', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            [Phone] Tablet (640-991px)
          </div>
          <div className="hide-mobile hide-tablet" style={{ padding: '8px 16px', background: '#3B5BFC', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            [PC] Desktop (> 991px)
          </div>
        </div>
      </div>

      {/* CSS Variables Test */}
      <div className="responsive-card" style={{ marginBottom: 'var(--card-gap)' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12 }}>
          CSS Variables (Auto-adjusting)
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <span className="text-responsive-small" style={{ fontWeight: 600 }}>Container Padding:</span>
            <code className="text-responsive-small" style={{ color: '#3B5BFC', fontWeight: 700 }}>var(--container-padding)</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <span className="text-responsive-small" style={{ fontWeight: 600 }}>Sidebar Width:</span>
            <code className="text-responsive-small" style={{ color: '#3B5BFC', fontWeight: 700 }}>var(--sidebar-width)</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <span className="text-responsive-small" style={{ fontWeight: 600 }}>Header Height:</span>
            <code className="text-responsive-small" style={{ color: '#3B5BFC', fontWeight: 700 }}>var(--header-height)</code>
          </div>
        </div>
      </div>

      {/* Responsive Grid Test */}
      <div style={{ marginBottom: 'var(--card-gap)' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12 }}>
          Responsive Grid (1 col mobile → 2 col tablet → 3 col desktop)
        </h2>
        <div className="grid-responsive">
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className="responsive-card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#3B5BFC' }}>{num}</div>
              <div className="text-responsive-small" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                Grid Item
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Test */}
      <div style={{ marginBottom: 'var(--card-gap)' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12 }}>
          Visibility Classes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="hide-mobile responsive-card" style={{ padding: '12px 16px', background: '#E8FBF1', border: '1.5px solid #12C479' }}>
            <span className="text-responsive-body" style={{ color: '#12C479', fontWeight: 700 }}>
              ✓ Hidden on mobile (< 640px)
            </span>
          </div>
          <div className="hide-tablet responsive-card" style={{ padding: '12px 16px', background: '#FFF7ED', border: '1.5px solid #F97316' }}>
            <span className="text-responsive-body" style={{ color: '#F97316', fontWeight: 700 }}>
              ✓ Hidden on tablet (640-991px)
            </span>
          </div>
          <div className="hide-desktop responsive-card" style={{ padding: '12px 16px', background: '#EEF2FF', border: '1.5px solid #3B5BFC' }}>
            <span className="text-responsive-body" style={{ color: '#3B5BFC', fontWeight: 700 }}>
              ✓ Hidden on desktop (> 991px)
            </span>
          </div>
          <div className="show-mobile responsive-card" style={{ padding: '12px 16px', background: '#F5F3FF', border: '1.5px solid #7C3AED' }}>
            <span className="text-responsive-body" style={{ color: '#7C3AED', fontWeight: 700 }}>
              ✓ Only visible on mobile (< 640px)
            </span>
          </div>
        </div>
      </div>

      {/* Typography Test */}
      <div className="responsive-card" style={{ marginBottom: 'var(--card-gap)' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12 }}>
          Responsive Typography
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div className="text-responsive-hero">Hero Text (14px → 17px)</div>
            <code style={{ fontSize: 10, color: 'var(--text-muted)' }}>className="text-responsive-hero"</code>
          </div>
          <div>
            <div className="text-responsive-title">Title Text (12px → 14px)</div>
            <code style={{ fontSize: 10, color: 'var(--text-muted)' }}>className="text-responsive-title"</code>
          </div>
          <div>
            <div className="text-responsive-body">Body Text (11px → 13px)</div>
            <code style={{ fontSize: 10, color: 'var(--text-muted)' }}>className="text-responsive-body"</code>
          </div>
          <div>
            <div className="text-responsive-small">Small Text (10px → 11px)</div>
            <code style={{ fontSize: 10, color: 'var(--text-muted)' }}>className="text-responsive-small"</code>
          </div>
        </div>
      </div>

      {/* Flex Column Mobile Test */}
      <div style={{ marginBottom: 'var(--card-gap)' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12 }}>
          Flex Column on Mobile
        </h2>
        <div className="flex-col-mobile" style={{ gap: 'var(--card-gap)' }}>
          <div className="responsive-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <Monitor size={32} color="#3B5BFC" style={{ margin: '0 auto 8px' }} />
            <div className="text-responsive-body" style={{ fontWeight: 700 }}>Column 1</div>
          </div>
          <div className="responsive-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <Tablet size={32} color="#7C3AED" style={{ margin: '0 auto 8px' }} />
            <div className="text-responsive-body" style={{ fontWeight: 700 }}>Column 2</div>
          </div>
          <div className="responsive-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <Smartphone size={32} color="#F97316" style={{ margin: '0 auto 8px' }} />
            <div className="text-responsive-body" style={{ fontWeight: 700 }}>Column 3</div>
          </div>
        </div>
      </div>

      {/* Touch Target Test */}
      <div className="responsive-card" style={{ marginBottom: 'var(--card-gap)' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12 }}>
          Touch Targets (44x44px minimum on mobile)
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={{ padding: '10px 20px', background: '#3B5BFC', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Button 1
          </button>
          <button style={{ padding: '10px 20px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Button 2
          </button>
          <button style={{ padding: '10px 20px', background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Button 3
          </button>
        </div>
        <p className="text-responsive-small" style={{ color: 'var(--text-muted)', marginTop: 12 }}>
          On mobile (< 768px), these buttons automatically get min-height: 44px and min-width: 44px
        </p>
      </div>

      {/* Testing Instructions */}
      <div className="responsive-card" style={{ background: '#FFF7ED', border: '1.5px solid #F97316' }}>
        <h2 className="text-responsive-title" style={{ marginBottom: 12, color: '#F97316' }}>
          🧪 How to Test
        </h2>
        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li className="text-responsive-body">
            <strong>Open DevTools:</strong> Press F12 or Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
          </li>
          <li className="text-responsive-body">
            <strong>Toggle Device Toolbar:</strong> Press Ctrl+Shift+M (Windows) / Cmd+Shift+M (Mac)
          </li>
          <li className="text-responsive-body">
            <strong>Test These Widths:</strong>
            <ul style={{ paddingLeft: 20, marginTop: 4 }}>
              <li>375px (iPhone SE - Mobile Small)</li>
              <li>414px (iPhone 12 Pro Max - Mobile)</li>
              <li>768px (iPad Portrait - Tablet Large)</li>
              <li>1024px (iPad Landscape - Desktop Small)</li>
              <li>1440px (Standard Desktop)</li>
              <li>1920px (Full HD - Large Desktop)</li>
            </ul>
          </li>
          <li className="text-responsive-body">
            <strong>Watch for:</strong> Grid columns changing, visibility toggles, text sizes adjusting, spacing changes
          </li>
        </ol>
      </div>

    </div>
  );
}
