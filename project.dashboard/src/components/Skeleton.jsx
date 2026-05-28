/* ─────────────────────────────────────────────────────────────
   Skeleton loader — shimmer bones + per-page layouts
───────────────────────────────────────────────────────────── */

const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%)',
  backgroundSize: '400% 100%',
  animation: 'skeletonShimmer 1.4s ease infinite',
  borderRadius: 8,
};

export function Bone({ w = '100%', h = 16, r = 8, style = {} }) {
  return (
    <div style={{
      ...shimmerStyle,
      width: w, height: h, borderRadius: r, flexShrink: 0,
      ...style,
    }} />
  );
}

const card = (extra = {}) => ({
  background: 'var(--bg-surface)',
  border: '1.5px solid var(--border-light)',
  borderRadius: 16,
  ...extra,
});

/* ── Dashboard Skeleton (AdminProjectDashboardPage) ─────────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '24px',
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* 4 stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ ...card(), padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w={40} h={40} r={12} />
              <Bone w={56} h={20} r={20} />
            </div>
            <Bone w="60%" h={28} />
            <Bone w="80%" h={13} />
          </div>
        ))}
      </div>

      {/* Growth Analytics + Subscription Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.5fr 1fr',
        gap: '24px',
      }}>
        {/* Growth Analytics Chart */}
        <div style={{ ...card(), padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Bone w={180} h={20} />
              <Bone w={240} h={14} style={{ marginTop: 8 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Bone w={80} h={32} r={8} />
              <Bone w={80} h={32} r={8} />
            </div>
          </div>
          {/* Chart area */}
          <div style={{ height: 280, display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 20 }}>
            {[60, 80, 70, 90, 75, 85, 95, 70, 80, 85, 90, 100].map((h, i) => (
              <Bone key={i} w="100%" h={`${h}%`} r={4} style={{ flex: 1 }} />
            ))}
          </div>
        </div>

        {/* Subscription Distribution Pie Chart */}
        <div style={{ ...card(), padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Bone w={160} h={18} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
            <Bone w={180} h={180} r={90} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bone w={12} h={12} r={3} />
                <Bone w="60%" h={12} />
                <Bone w={30} h={12} style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Joined Organizations */}
      <div style={{ ...card(), padding: '24px' }}>
        <Bone w={220} h={20} style={{ marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ ...card({ borderRadius: 12 }), padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bone w={48} h={48} r={12} />
                <div style={{ flex: 1 }}>
                  <Bone w="70%" h={16} />
                  <Bone w="50%" h={12} style={{ marginTop: 6 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Bone w={60} h={24} r={12} />
                <Bone w={70} h={24} r={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Team Skeleton (TeamPage - Organizations Grid) ─────────────────────────────────────── */
export function TeamSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} style={{ ...card(), padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header: avatar + name + status badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
              <Bone w={48} h={48} r={14} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Bone w="80%" h={16} />
                <Bone w="60%" h={12} style={{ marginTop: 6 }} />
              </div>
            </div>
            <Bone w={60} h={22} r={12} />
          </div>

          {/* Plan + Join date */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Bone w={80} h={24} r={12} />
            <Bone w={100} h={24} r={12} />
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '10px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <Bone w={40} h={20} />
              <Bone w={50} h={10} />
            </div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '10px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <Bone w={40} h={20} />
              <Bone w={50} h={10} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
            <Bone w="100%" h={32} r={8} style={{ flex: 1 }} />
            <Bone w={40} h={32} r={8} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tasks Skeleton (TasksPage - Table Layout) ─────────────────────────────────────── */
export function TasksSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      {/* Toolbar with stage filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[75, 65, 70, 85, 85, 70, 90].map((w, i) => (
            <Bone key={i} w={w} h={30} r={20} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Bone w={140} h={36} r={10} />
          <Bone w={120} h={36} r={10} />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card(), flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--input-bg)', alignItems: 'center' }}>
          <Bone w={80} h={12} />
          <Bone w="100%" h={12} style={{ flex: 1 }} />
          <Bone w={90} h={12} />
          <Bone w={110} h={12} />
          <Bone w={80} h={12} />
          <Bone w={70} h={12} />
          <Bone w={50} h={12} />
        </div>

        {/* Data rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
              <Bone w={75} h={16} r={6} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Bone w="60%" h={14} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Bone w={65} h={20} r={20} />
                  <Bone w={75} h={20} r={20} />
                </div>
              </div>
              <Bone w={85} h={24} r={20} />
              <div style={{ display: 'flex' }}>
                <Bone w={28} h={28} r={14} />
                <Bone w={28} h={28} r={14} style={{ marginLeft: -8 }} />
                <Bone w={28} h={28} r={14} style={{ marginLeft: -8 }} />
              </div>
              <Bone w={75} h={13} />
              <Bone w={65} h={14} />
              <Bone w={50} h={30} r={8} />
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        <div style={{ padding: '12px 20px', borderTop: '1.5px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Bone w={120} h={12} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bone w={32} h={32} r={8} />
            <Bone w={60} h={12} />
            <Bone w={32} h={32} r={8} />
          </div>
          <Bone w={100} h={12} />
        </div>
      </div>
    </div>
  );
}

/* ── Financial Skeleton (FinancialPage - Payment Table) ─────────────────────────────────────── */
export function FinancialSkeleton() {
  return (
    <div style={{ ...card(), flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bone w={1} h={32} r={0} />
          <div style={{ display: 'flex', gap: 6 }}>
            <Bone w={40} h={30} r={20} />
            <Bone w={68} h={30} r={20} />
            <Bone w={50} h={30} r={20} />
          </div>
          <Bone w={1} h={32} r={0} />
          <div style={{ display: 'flex', gap: 6 }}>
            <Bone w={40} h={30} r={20} />
            <Bone w={60} h={30} r={20} />
            <Bone w={72} h={30} r={20} />
            <Bone w={32} h={30} r={10} />
          </div>
          <Bone w={130} h={30} r={10} />
          <Bone w={1} h={32} r={0} />
          <Bone w={150} h={30} r={10} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Bone w={110} h={30} r={8} />
          <Bone w={110} h={30} r={8} />
          <Bone w={1} h={32} r={0} />
          <Bone w={26} h={26} r={7} />
          <Bone w={50} h={11} />
          <Bone w={26} h={26} r={7} />
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1.2fr 1.2fr 1fr 1.3fr 1fr 0.9fr 1fr', padding: '10px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', flexShrink: 0, alignItems: 'center', gap: 12 }}>
        <Bone w={16} h={16} r={3} style={{ margin: '0 auto' }} />
        {[90, 80, 65, 80, 75, 55, 60, 55].map((w, i) => (
          <Bone key={i} w={w} h={10} />
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1.2fr 1.2fr 1fr 1.3fr 1fr 0.9fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', gap: 12 }}>
            <Bone w={16} h={16} r={3} style={{ margin: '0 auto' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bone w={32} h={32} r={9} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <Bone w={36} h={16} r={4} style={{ flexShrink: 0 }} />
                <Bone w={100} h={13} />
              </div>
            </div>
            <Bone w="85%" h={28} r={8} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bone w={26} h={26} r={13} style={{ flexShrink: 0 }} />
              <Bone w={70} h={12} />
            </div>
            <Bone w={80} h={12} />
            <Bone w={75} h={22} r={20} />
            <Bone w={65} h={22} r={20} />
            <Bone w={65} h={12} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <Bone w={60} h={15} />
              <Bone w={44} h={16} r={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Roles Skeleton ─────────────────────────────────────── */
export function RolesSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px 24px', gap: 16, overflowY: 'auto' }}>
      <div style={{ ...card(), padding: 24, display: 'flex', flexDirection: 'column', height: 520, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
          <Bone w={36} h={36} r={10} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Bone w={160} h={16} />
            <Bone w={130} h={11} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <Bone w={50} h={13} />
              <Bone w={64} h={28} r={9} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ ...card({ borderRadius: 14 }), padding: '16px 18px', border: '2px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Bone w={38} h={38} r={11} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <Bone w="65%" h={14} />
                      <Bone w={60} h={16} r={20} />
                    </div>
                  </div>
                  <Bone w="85%" h={11} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, ...card({ borderRadius: 16 }), border: '2px solid var(--border-light)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <Bone w={44} h={44} r={12} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w="45%" h={18} />
                <Bone w={70} h={18} r={20} />
              </div>
            </div>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Bone w={100} h={11} />
                <Bone w="90%" h={13} />
                <Bone w="75%" h={13} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Bone w={120} h={11} />
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <Bone w="40%" h={13} />
                    <Bone w={44} h={24} r={12} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Settings Skeleton (SettingsPage) ─────────────────────────────────────── */
export function SettingsSkeleton() {
  return (
    <div style={{ flex: 1, minHeight: 0, padding: '20px 28px 24px', overflowY: 'auto' }}>
      <div style={{ ...card(), padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Profile Section */}
        <div>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <Bone w={76} h={76} r={38} />
            <div style={{ flex: 1 }}>
              <Bone w={180} h={22} style={{ marginBottom: 8 }} />
              <Bone w={120} h={13} style={{ marginBottom: 4 }} />
              <Bone w={160} h={11} />
            </div>
            <Bone w={120} h={36} r={10} />
          </div>

          {/* About */}
          <Bone w={60} h={11} style={{ marginBottom: 8 }} />
          <div style={{ marginBottom: 20 }}>
            <Bone w="100%" h={14} style={{ marginBottom: 6 }} />
            <Bone w="90%" h={14} style={{ marginBottom: 6 }} />
            <Bone w="70%" h={14} />
          </div>

          <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 20 }} />

          {/* Contact */}
          <Bone w={80} h={11} style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                <Bone w={34} h={34} r={9} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Bone w={80} h={11} style={{ marginBottom: 4 }} />
                  <Bone w={140} h={13} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-light)' }} />

        {/* Password Sections */}
        {[0, 1].map(i => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12 }}>
              <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Bone w={140} h={14} style={{ marginBottom: 4 }} />
                <Bone w={240} h={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Performance Skeleton (PerformancePage) ─────────────────────────────────────── */
export function PerformanceSkeleton() {
  return (
    <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ ...card(), padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w={40} h={40} r={12} />
              <Bone w={56} h={20} r={20} />
            </div>
            <Bone w="60%" h={28} />
            <Bone w="80%" h={13} />
          </div>
        ))}
      </div>
      {/* two-col */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ ...card(), padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Bone w="40%" h={18} />
            {[0, 1, 2, 3, 4].map(j => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bone w={36} h={36} r={10} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Bone w="70%" h={13} />
                  <Bone w="45%" h={11} />
                </div>
                <Bone w={60} h={22} r={20} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reports Skeleton (ReportsPage) ─────────────────────────────────────── */
export function ReportsSkeleton() {
  return (
    <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
      {/* Header with filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[80, 90, 100].map((w, i) => (
            <Bone key={i} w={w} h={32} r={8} />
          ))}
        </div>
        <Bone w={120} h={36} r={10} />
      </div>
      
      {/* Charts grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: 0 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ ...card(), padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w={140} h={18} />
              <Bone w={80} h={24} r={12} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {[60, 80, 70, 90, 75, 85].map((h, j) => (
                <Bone key={j} w="100%" h={`${h}%`} r={4} style={{ flex: 1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Notes Skeleton (NotesPage) ─────────────────────────────────────── */
export function NotesSkeleton() {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: 'var(--bg-main)', padding: '20px 24px', gap: 16 }}>
      {/* Left panel: note list */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bone w="100%" h={40} r={12} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ ...card({ borderRadius: 12 }), padding: '12px 14px' }}>
              <Bone w="80%" h={13} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                <Bone w={50} h={18} r={20} />
                <Bone w={60} h={18} r={20} />
              </div>
              <Bone w={100} h={11} />
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: note detail */}
      <div style={{ flex: 1, ...card(), display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          <Bone w="60%" h={20} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <Bone w={60} h={20} r={20} />
            <Bone w={70} h={20} r={20} />
            <Bone w={80} h={20} r={20} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <Bone key={i} w={`${Math.random() * 30 + 70}%`} h={14} style={{ marginBottom: 10 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Feedback Skeleton (FeedbackPage - Table Layout) ─────────────────────────────────────── */
export function FeedbackSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-main)', padding: '20px 24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Table container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', minHeight: 0 }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1.5fr 1.2fr 1.5fr 1.2fr 1.3fr 2fr',
            padding: '12px 20px',
            borderBottom: '1.5px solid var(--border-light)',
            background: 'var(--bg-subtle)',
            flexShrink: 0,
            alignItems: 'center',
            gap: 12,
          }}>
            <Bone w={24} h={24} r={6} />
            {[90, 75, 60, 80, 85].map((w, i) => (
              <Bone key={i} w={w} h={10} />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Bone w={80} h={10} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bone w={26} h={26} r={7} />
                <Bone w={50} h={11} />
                <Bone w={26} h={26} r={7} />
              </div>
            </div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative', minHeight: 0 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1.5fr 1.2fr 1.5fr 1.2fr 1.3fr 2fr',
                  padding: '8px 20px',
                  borderBottom: '1px solid var(--border-light)',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div style={{ paddingLeft: 16, paddingRight: 8 }}></div>
                <Bone w="75%" h={13} />
                <Bone w="65%" h={13} />
                <Bone w="80%" h={12} />
                <Bone w="70%" h={12} />
                <Bone w="75%" h={11} />
                <Bone w="90%" h={13} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar Skeleton ─────────────────────────────────────── */
export function SidebarSkeleton() {
  return (
    <div style={{
      width: 240,
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      gap: 20,
      flexShrink: 0,
    }}>
      {/* Logo/Header */}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bone w={32} h={32} r={10} />
        <Bone w={80} h={18} />
      </div>

      {/* Navigation items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 10 }}>
            <Bone w={20} h={20} r={6} />
            <Bone w={`${Math.random() * 30 + 60}%`} h={13} />
          </div>
        ))}
      </div>

      {/* Logout button */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)' }}>
        <Bone w="100%" h={40} r={10} />
      </div>
    </div>
  );
}

/* ── Full Dashboard Skeleton (Sidebar + Header + Page) ─────────────────────────────────────── */
export function FullDashboardSkeleton() {
  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-main)',
    }}>
      <SkeletonStyles />
      
      {/* Sidebar */}
      <SidebarSkeleton />

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        background: 'var(--bg-main)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1.5px solid var(--border)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <Bone w={200} h={24} style={{ marginBottom: 6 }} />
          <Bone w={280} h={14} />
        </div>

        {/* Page content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <DashboardSkeleton />
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Styles Component ─────────────────────────────────────── */
export function SkeletonStyles() {
  return null; // Styles are already in index.css
}
