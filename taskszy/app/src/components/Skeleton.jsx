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

/* ── Admin skeletons ─────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Two-column layout — matches Dashboard flex: 1, gap: 14 */}
      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

        {/* LEFT: flex 3 — Upcoming Tasks + All Tasks */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

          {/* ── Upcoming Tasks card ── */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', flexShrink: 0 }}>
            {/* Header: 26×26 icon + "Upcoming Tasks" label */}
            <div style={{ padding: '12px 14px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bone w={26} h={26} r={8} />
              <Bone w={130} h={13} />
            </div>
            {/* 3 task cards side-by-side */}
            <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border-light)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
                  {/* paid/pending badge — absolute top-right */}
                  <Bone w={48} h={18} r={20} style={{ position: 'absolute', top: 10, right: 10 }} />
                  {/* Row 1: task ID badge + date label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Bone w={38} h={16} r={4} />
                    <Bone w={55} h={11} />
                  </div>
                  {/* Row 2: title + member avatars */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Bone w="65%" h={13} />
                    <div style={{ display: 'flex', flexShrink: 0 }}>
                      <Bone w={20} h={20} r={10} />
                      <Bone w={20} h={20} r={10} style={{ marginLeft: -6 }} />
                      <Bone w={20} h={20} r={10} style={{ marginLeft: -6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── All Tasks card — fills remaining height ── */}
          <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Header: 28×28 icon + "Tasks" label + filter tabs right */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Bone w={28} h={28} r={8} />
              <Bone w={55} h={14} />
              {/* filter tabs pill group — right side */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, background: 'var(--bg-subtle)', borderRadius: 9, padding: '3px' }}>
                <Bone w={62} h={26} r={7} />
                <Bone w={78} h={26} r={7} />
                <Bone w={42} h={26} r={7} />
              </div>
            </div>

            {/* Scrollable task rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  {/* Stage icon 34×34 */}
                  <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
                  {/* Main info: ID + title row, then stage badge + tags row */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bone w={36} h={16} r={4} style={{ flexShrink: 0 }} />
                      <Bone w="55%" h={13} />
                      <Bone w={60} h={16} r={20} style={{ flexShrink: 0 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Bone w={65} h={18} r={20} />
                      <Bone w={72} h={18} r={20} />
                    </div>
                  </div>
                  {/* Due date */}
                  <Bone w={100} h={12} style={{ flexShrink: 0 }} />
                  {/* Member avatars */}
                  <div style={{ display: 'flex', flexShrink: 0 }}>
                    <Bone w={22} h={22} r={11} />
                    <Bone w={22} h={22} r={11} style={{ marginLeft: -6 }} />
                    <Bone w={22} h={22} r={11} style={{ marginLeft: -6 }} />
                  </div>
                  {/* Budget */}
                  <Bone w={72} h={14} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: flex 2 — Calendar + (Donut + Updates) */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflowY: 'auto' }}>

          {/* ── Calendar card — padding: 4px wrapper ── */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '4px', border: '1.5px solid var(--border-light)', flexShrink: 0 }}>
            {/* Nav row: prev arrow + "Month Year" + next arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 4px' }}>
              <Bone w={28} h={28} r={6} />
              <Bone w={100} h={11} />
              <Bone w={28} h={28} r={6} />
            </div>
            {/* Day-of-week labels: 7 columns, no gap */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, padding: '2px 0' }}>
              {Array(7).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 18 }}>
                  <Bone w={18} h={9} r={3} />
                </div>
              ))}
            </div>
            {/* Date cells: 7 columns, aspect-ratio 1, no gap */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {Array(35).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bone w={28} h={28} r={4} />
                </div>
              ))}
            </div>
            {/* Events bar */}
            <div style={{ margin: '4px 2px 2px', padding: '4px 6px', background: 'var(--bg-subtle)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Bone w="55%" h={11} />
              <Bone w={22} h={22} r={11} />
            </div>
          </div>

          {/* ── Task Overview (Donut) + Updates — side by side, flex 1 ── */}
          <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>

            {/* Task Overview Donut */}
            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header: title + "This Week" badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Bone w={100} h={14} />
                  <Bone w={130} h={11} />
                </div>
                <Bone w={68} h={22} r={6} />
              </div>
              {/* Donut: 160×160 circle centered */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
                {/* Outer ring */}
                <Bone w={160} h={160} r={80} />
                {/* Inner cutout to simulate donut */}
                <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-surface)' }} />
              </div>
              {/* Legend: Complete + Pending */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Bone w={8} h={8} r={4} />
                    <Bone w={55} h={11} />
                    <Bone w={20} h={11} />
                  </div>
                ))}
              </div>
            </div>

            {/* Updates */}
            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {/* Header: 30×30 icon + "Updates" title + subtitle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, flexShrink: 0 }}>
                <Bone w={30} h={30} r={9} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Bone w={70} h={14} />
                  <Bone w={160} h={11} />
                </div>
              </div>
              {/* Activity items: icon + two text lines */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12 }}>
                      <Bone w={28} h={28} r={8} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Bone w="85%" h={12} />
                        <Bone w="65%" h={10} />
                        <Bone w="40%" h={9} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TasksSkeleton() {
  return (
    <div style={{ flex: 1, padding: '0 28px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      {/* Toolbar with stage filters and action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        {/* Stage filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[75, 65, 70, 85, 85, 70, 90].map((w, i) => (
            <Bone key={i} w={w} h={30} r={20} />
          ))}
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Bone w={140} h={36} r={10} />
          <Bone w={120} h={36} r={10} />
        </div>
      </div>

      {/* Main table */}
      <div style={{ ...card(), flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Table header */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--input-bg)', alignItems: 'center' }}>
          <Bone w={80} h={12} />
          <Bone w="100%" h={12} style={{ flex: 1 }} />
          <Bone w={90} h={12} />
          <Bone w={110} h={12} />
          <Bone w={80} h={12} />
          <Bone w={70} h={12} />
          <Bone w={50} h={12} />
        </div>

        {/* Table rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
              {/* Task ID */}
              <Bone w={75} h={16} r={6} />
              
              {/* Task title + tags */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Bone w="60%" h={14} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Bone w={65} h={20} r={20} />
                  <Bone w={75} h={20} r={20} />
                </div>
              </div>

              {/* Stage badge */}
              <Bone w={85} h={24} r={20} />

              {/* Members */}
              <div style={{ display: 'flex' }}>
                <Bone w={28} h={28} r={14} />
                <Bone w={28} h={28} r={14} style={{ marginLeft: -8 }} />
                <Bone w={28} h={28} r={14} style={{ marginLeft: -8 }} />
              </div>

              {/* Deadline */}
              <Bone w={75} h={13} />

              {/* Budget */}
              <Bone w={65} h={14} />

              {/* Actions */}
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

export function TeamSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px' }}>
      {/* Single card wrapping everything — matches TeamPage */}
      <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Header: 3-column grid — icon+title | pagination center | filters+add */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', flexShrink: 0 }}>
          {/* Left: icon + "Team Members" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bone w={28} h={28} r={8} />
            <Bone w={120} h={14} />
          </div>

          {/* Center: pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Bone w={32} h={30} r={8} />
            <Bone w={40} h={12} />
            <Bone w={32} h={30} r={8} />
          </div>

          {/* Right: All/Active/Inactive pills + divider + role select + Add Member button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Bone w={40} h={30} r={20} />
              <Bone w={58} h={30} r={20} />
              <Bone w={66} h={30} r={20} />
            </div>
            <Bone w={1} h={24} r={0} />
            <Bone w={110} h={32} r={10} />
            <Bone w={120} h={36} r={10} />
          </div>
        </div>

        {/* Scrollable grid: padding 18px, 3 columns, gap 16 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '20px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Top row: avatar 46×46 + name/role + Active badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Bone w={46} h={46} r={14} style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Bone w={100} h={14} />
                      <Bone w={80} h={12} />
                    </div>
                  </div>
                  {/* Active/Inactive badge */}
                  <Bone w={56} h={20} r={20} />
                </div>

                {/* Stats row: Tasks + Done boxes */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[0, 1].map(j => (
                    <div key={j} style={{ flex: 1, background: 'var(--input-bg)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Bone w={30} h={18} />
                      <Bone w={36} h={10} />
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Bone w={70} h={11} />
                    <Bone w={30} h={11} />
                  </div>
                  <Bone w="100%" h={4} r={4} />
                </div>

                {/* Footer: addedBy + action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bone w={20} h={20} r={10} />
                    <Bone w={55} h={11} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Bone w={76} h={28} r={8} />
                    <Bone w={44} h={28} r={8} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinancialSkeleton() {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Single table card — fills everything ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

        {/* Toolbar: left filters | right action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
          {/* Left: divider + status pills + divider + date pills + calendar + Team Members + divider + Categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bone w={1} h={32} r={0} />
            {/* All / Pending / Paid */}
            <div style={{ display: 'flex', gap: 6 }}>
              <Bone w={40} h={30} r={20} />
              <Bone w={68} h={30} r={20} />
              <Bone w={50} h={30} r={20} />
            </div>
            <Bone w={1} h={32} r={0} />
            {/* All / 7 Days / 30 Days + calendar icon */}
            <div style={{ display: 'flex', gap: 6 }}>
              <Bone w={40} h={30} r={20} />
              <Bone w={60} h={30} r={20} />
              <Bone w={72} h={30} r={20} />
              <Bone w={32} h={30} r={10} />
            </div>
            {/* Team Members dropdown */}
            <Bone w={130} h={30} r={10} />
            <Bone w={1} h={32} r={0} />
            {/* Categories/Roles dropdown */}
            <Bone w={150} h={30} r={10} />
          </div>
          {/* Right: Add Payment + Export Excel + pagination */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bone w={110} h={30} r={8} />
            <Bone w={110} h={30} r={8} />
            <Bone w={1} h={32} r={0} />
            <Bone w={26} h={26} r={7} />
            <Bone w={50} h={11} />
            <Bone w={26} h={26} r={7} />
          </div>
        </div>

        {/* Column headers: checkbox | Task | Description | Member | Assigned By | Category | Stage | Due Date | Amount | Paid On */}
        <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 160px 130px 130px 120px 90px 90px 110px', padding: '10px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', flexShrink: 0, alignItems: 'center', gap: 0 }}>
          {/* Checkbox */}
          <Bone w={16} h={16} r={3} style={{ margin: '0 auto' }} />
          {/* Column labels */}
          {[90, 80, 65, 80, 75, 55, 60, 55, 60].map((w, i) => (
            <Bone key={i} w={w} h={10} />
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 160px 130px 130px 120px 90px 90px 110px', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
              {/* Checkbox */}
              <Bone w={16} h={16} r={3} style={{ margin: '0 auto' }} />

              {/* Task: 32×32 icon + ID badge + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bone w={32} h={32} r={9} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <Bone w={36} h={16} r={4} style={{ flexShrink: 0 }} />
                  <Bone w={140} h={13} />
                </div>
              </div>

              {/* Description pill */}
              <Bone w="88%" h={30} r={8} />

              {/* Member: avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bone w={26} h={26} r={13} style={{ flexShrink: 0 }} />
                <Bone w={80} h={12} />
              </div>

              {/* Assigned By */}
              <Bone w={90} h={12} />

              {/* Category badge */}
              <Bone w={80} h={22} r={20} />

              {/* Stage badge */}
              <Bone w={70} h={22} r={20} />

              {/* Due Date */}
              <Bone w={70} h={12} />

              {/* Amount + paid/pending badge */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Bone w={65} h={15} />
                <Bone w={44} h={16} r={6} />
              </div>

              {/* Paid On */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Bone w={75} h={12} />
                <Bone w={55} h={10} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RolesSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px 24px', gap: 16, overflowY: 'auto' }}>

      {/* ── Section 1: Roles & Description card (height 520) ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 24, border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: 520, flexShrink: 0 }}>
        {/* Header: 36×36 icon + title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
          <Bone w={36} h={36} r={10} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Bone w={160} h={16} />
            <Bone w={130} h={11} />
          </div>
        </div>

        {/* Two-column body: left 260px role list | right flex-1 detail panel */}
        <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0, overflow: 'hidden' }}>

          {/* Left: role list */}
          <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            {/* "Roles" label + "New" button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <Bone w={50} h={13} />
              <Bone w={64} h={28} r={9} />
            </div>
            {/* Role cards */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '16px 18px', border: '2px solid var(--border-light)' }}>
                  {/* Icon + name + roleType badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Bone w={38} h={38} r={11} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <Bone w="65%" h={14} />
                      <Bone w={60} h={16} r={20} />
                    </div>
                  </div>
                  {/* Description line */}
                  <Bone w="85%" h={11} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: role detail panel */}
          <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 16, border: '2px solid var(--border-light)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            {/* Detail header: 44×44 icon + name + badge */}
            <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <Bone w={44} h={44} r={12} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w="45%" h={18} />
                <Bone w={70} h={18} r={20} />
              </div>
            </div>
            {/* Detail body: description + permissions sections */}
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

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-light)', flexShrink: 0 }} />

      {/* ── Section 2: Tags & Categories ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[0, 1].map(col => (
          <div key={col} style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1.5px solid var(--border-light)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bone w={28} h={28} r={8} />
                <Bone w={col === 0 ? 40 : 90} h={14} />
              </div>
              {/* Add input row */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Bone w={36} h={32} r={8} />
                <Bone w={140} h={32} r={8} />
                <Bone w={90} h={32} r={9} />
              </div>
            </div>
            {/* Items list */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--border-light)' }}>
                  <Bone w={22} h={22} r={6} style={{ flexShrink: 0 }} />
                  <Bone w="50%" h={13} />
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    <Bone w={24} h={24} r={7} />
                    <Bone w={24} h={24} r={7} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div style={{ flex: 1, padding: '0 28px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, paddingTop: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ ...card(), padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w={36} h={36} r={10} />
              <Bone w={60} h={20} r={20} />
            </div>
            <Bone w="70%" h={26} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bone w={16} h={16} r={4} />
              <Bone w="50%" h={11} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0 }}>
        {/* Left chart */}
        <div style={{ ...card(), padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Bone w={140} h={16} />
              <Bone w={180} h={12} style={{ marginTop: 6 }} />
            </div>
            <Bone w={90} h={28} r={8} />
          </div>
          {/* Bar chart representation */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 20 }}>
            {[60, 80, 45, 90, 70, 55, 85, 65, 75, 50].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <Bone w="100%" h={`${h}%`} r={4} />
                <Bone w={20} h={8} r={4} />
              </div>
            ))}
          </div>
        </div>

        {/* Right chart */}
        <div style={{ ...card(), padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Bone w={130} h={16} />
            <Bone w={170} h={12} style={{ marginTop: 6 }} />
          </div>
          {/* Progress bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
            {[85, 70, 60, 45, 90, 55].map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Bone w={100} h={12} />
                  <Bone w={40} h={12} />
                </div>
                <div style={{ width: '100%', height: 10, background: 'var(--bg-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                  <Bone w={`${w}%`} h={10} r={6} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PerformanceSkeleton() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>

      {/* ── Row 1: Date range pills + View by toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 7D / 30D / Quarter / Year pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[52, 62, 66, 46].map((w, i) => <Bone key={i} w={w} h={30} r={20} />)}
          </div>
          <Bone w={1} h={28} r={0} />
          {/* Calendar filter button */}
          <Bone w={34} h={30} r={10} />
        </div>
        {/* "View by" tag/category toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bone w={50} h={12} />
          <Bone w={160} h={34} r={10} />
        </div>
      </div>

      {/* ── Row 2: Finance card + Tasks & Team card ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flexShrink: 0 }}>

        {/* Finance card */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bone w={36} h={36} r={10} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Bone w={80} h={13} />
              <Bone w={110} h={11} />
            </div>
          </div>
          {/* 2×2 grid of stat boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ borderRadius: 12, padding: '12px 14px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Bone w={14} h={14} r={4} />
                  <Bone w={60} h={11} />
                </div>
                <Bone w={55} h={20} />
              </div>
            ))}
          </div>
        </div>

        {/* Tasks & Team card */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bone w={36} h={36} r={10} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Bone w={100} h={13} />
              <Bone w={120} h={11} />
            </div>
          </div>
          {/* 3-column grid of 6 stat boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ borderRadius: 12, padding: '12px 14px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Bone w={14} h={14} r={4} />
                  <Bone w={50} h={11} />
                </div>
                <Bone w={36} h={20} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Investment Trend (1fr) + Budget Wise (360px) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, flexShrink: 0 }}>

        {/* Investment Trend */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Bone w={150} h={16} />
            <Bone w={220} h={12} style={{ marginTop: 6 }} />
          </div>
          {/* Legend: 6 colored dots + labels */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[55, 65, 80, 60, 50, 70].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Bone w={8} h={8} r={4} />
                <Bone w={w} h={11} />
              </div>
            ))}
          </div>
          {/* Line chart area: 200px tall */}
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 0, position: 'relative' }}>
            {/* Y-axis lines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: '100%', height: 1, background: 'var(--border-light)' }} />
              ))}
            </div>
            {/* Bars simulating multi-line chart */}
            {[55, 70, 45, 80, 60, 75, 50].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <Bone w="70%" h={`${h}%`} r={3} />
                <Bone w={20} h={9} r={3} />
              </div>
            ))}
          </div>
        </div>

        {/* Budget Wise */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Bone w={110} h={16} />
            <Bone w={160} h={12} style={{ marginTop: 6 }} />
          </div>
          {/* Donut 140×140 + legend list side by side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Donut */}
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bone w={140} h={140} r={70} />
              <div style={{ position: 'absolute', width: 84, height: 84, borderRadius: '50%', background: 'var(--bg-surface)' }} />
            </div>
            {/* Legend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bone w={8} h={8} r={4} />
                    <Bone w={70} h={12} />
                  </div>
                  <Bone w={30} h={11} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Task Completion (2fr) + Task Growth (1fr) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, flexShrink: 0 }}>
        {/* CustomerHabitsChart — bar chart */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Bone w={140} h={16} />
              <Bone w={180} h={12} style={{ marginTop: 6 }} />
            </div>
            <Bone w={90} h={28} r={8} />
          </div>
          <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {[65, 80, 50, 90, 70, 55, 85, 60, 75, 45, 88, 62].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                <Bone w="100%" h={`${h}%`} r={4} />
                <Bone w={18} h={8} r={3} />
              </div>
            ))}
          </div>
        </div>

        {/* CustomerGrowth — area chart */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Bone w={110} h={16} />
            <Bone w={140} h={12} style={{ marginTop: 6 }} />
          </div>
          <div style={{ flex: 1, minHeight: 160, position: 'relative' }}>
            <Bone w="100%" h="100%" r={8} />
          </div>
        </div>
      </div>

      {/* ── Row 5: Team Performance (full width) ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div>
          <Bone w={150} h={16} />
          <Bone w={200} h={12} style={{ marginTop: 6 }} />
        </div>
        {/* Progress bars for each team member/category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Bone w={100} h={13} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, height: 10, background: 'var(--bg-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                <Bone w={`${[75, 60, 85, 50, 70][i]}%`} h={10} r={6} />
              </div>
              <Bone w={36} h={13} style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotesSkeleton() {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: 'var(--bg-main)', padding: '20px 24px', gap: 16 }}>

      {/* ── Left panel: note list (width 260) ── */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* "Create New Note" button */}
        <Bone w="100%" h={42} r={12} />

        {/* Note list items */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: i === 0 ? 'var(--bg-subtle)' : 'var(--bg-surface)', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Title */}
              <Bone w="80%" h={13} />
              {/* Tag pills */}
              <div style={{ display: 'flex', gap: 5 }}>
                <Bone w={40} h={18} r={20} />
                <Bone w={50} h={18} r={20} />
              </div>
              {/* Clock + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bone w={10} h={10} r={5} />
                <Bone w={80} h={10} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: note detail (flex 1) ── */}
      <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header: title + tags + date | Edit + Delete buttons */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Bone w={280} h={22} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Bone w={55} h={22} r={20} />
                <Bone w={65} h={22} r={20} />
                <Bone w={50} h={22} r={20} />
                <Bone w={110} h={14} style={{ marginLeft: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Bone w={60} h={34} r={9} />
              <Bone w={80} h={34} r={9} />
            </div>
          </div>
        </div>

        {/* Body: pre-formatted text lines */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[100, 85, 90, 70, 95, 80, 75, 88, 65, 92, 78, 60].map((w, i) => (
            <Bone key={i} w={`${w}%`} h={13} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HelpSkeleton() {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', gap: 20 }}>

      {/* ── Left: detail panel (flex 1) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
          {/* Header: avatar + name/role | Close button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bone w={40} h={40} r={20} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w={130} h={16} />
                <Bone w={180} h={11} />
              </div>
            </div>
            <Bone w={80} h={34} r={10} />
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bone w={16} h={16} r={8} />
            <Bone w={60} h={13} />
          </div>

          {/* "Member Message" label + message box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w={120} h={11} />
            <div style={{ padding: '14px 16px', border: '1.5px solid var(--border-light)', borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone w="95%" h={13} />
              <Bone w="88%" h={13} />
              <Bone w="75%" h={13} />
              <Bone w="60%" h={13} />
            </div>
          </div>

          {/* "Your Response" label + textarea + button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w={110} h={11} />
            <Bone w="100%" h={120} r={12} />
            <Bone w="100%" h={46} r={12} />
          </div>
        </div>
      </div>

      {/* ── Right: submissions list (width 400) ── */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header: "Help Submissions" + pending/solved counts */}
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid var(--border-light)', flexShrink: 0 }}>
            <Bone w={140} h={14} />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bone w={12} h={12} r={6} />
                <Bone w={70} h={11} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bone w={12} h={12} r={6} />
                <Bone w={60} h={11} />
              </div>
            </div>
          </div>

          {/* Submission cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Member row: avatar + name/role + status icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bone w={32} h={32} r={16} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Bone w="60%" h={12} />
                    <Bone w="40%" h={10} />
                  </div>
                  <Bone w={14} h={14} r={7} />
                </div>
                {/* Message preview */}
                <Bone w="95%" h={12} />
                <Bone w="75%" h={12} />
                {/* Timestamp */}
                <Bone w={100} h={10} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  // Matches SettingsPage: single card with ProfileTab + AdminPasswordTab + AccountPasswordTab
  return (
    <div style={{ flex: 1, minHeight: 0, padding: '20px 28px 24px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 28, border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── ProfileTab ── */}
        {/* Avatar 76×76 + name + role + email + Update Profile button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
          <Bone w={76} h={76} r={38} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w={180} h={22} />
            <Bone w={110} h={13} />
            <Bone w={150} h={11} />
          </div>
          <Bone w={120} h={34} r={10} />
        </div>

        {/* About label + text */}
        <Bone w={50} h={10} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 4 }}>
          <Bone w="100%" h={13} />
          <Bone w="90%" h={13} />
          <Bone w="75%" h={13} />
        </div>

        {/* Divider + Contact label */}
        <Bone w="100%" h={1} r={0} />
        <Bone w={60} h={10} />

        {/* 4 contact rows: 34×34 icon + label + value */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
              <Bone w={34} h={34} r={9} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={55} h={10} />
                <Bone w="55%" h={13} />
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <Bone w="100%" h={1} r={0} />

        {/* AdminPasswordTab row: 42×42 icon + title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12 }}>
          <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w={130} h={14} />
            <Bone w={220} h={12} />
          </div>
        </div>

        {/* Divider */}
        <Bone w="100%" h={1} r={0} />

        {/* AccountPasswordTab row: 42×42 icon + title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12 }}>
          <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w={150} h={14} />
            <Bone w={200} h={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Member skeletons ─────────────────────────────────────── */

export function MemberHomeSkeleton() {
  // Matches MemberHome exactly — same two-column layout as admin Dashboard
  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

        {/* LEFT: flex 3 — Upcoming Tasks + My Tasks */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

          {/* Upcoming Tasks card */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', flexShrink: 0 }}>
            {/* Header: 30×30 icon + "Upcoming Tasks" + Plus button right */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bone w={30} h={30} r={9} />
                <Bone w={130} h={14} />
              </div>
              <Bone w={32} h={32} r={10} />
            </div>
            {/* 3 task cards */}
            <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border-light)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
                  {/* paid/pending badge */}
                  <Bone w={48} h={18} r={20} style={{ position: 'absolute', top: 10, right: 10 }} />
                  {/* task ID badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Bone w={38} h={16} r={4} />
                  </div>
                  {/* title + date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Bone w="65%" h={13} />
                    <Bone w={50} h={11} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Tasks card — fills remaining height */}
          <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Header: 28×28 icon + "My Tasks" + filter tabs right */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Bone w={28} h={28} r={8} />
              <Bone w={70} h={14} />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, background: 'var(--bg-subtle)', borderRadius: 9, padding: '3px' }}>
                <Bone w={62} h={26} r={7} />
                <Bone w={78} h={26} r={7} />
                <Bone w={42} h={26} r={7} />
              </div>
            </div>
            {/* Task rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bone w={36} h={16} r={4} style={{ flexShrink: 0 }} />
                      <Bone w="55%" h={13} />
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Bone w={65} h={18} r={20} />
                      <Bone w={90} h={12} />
                    </div>
                  </div>
                  <Bone w={72} h={14} style={{ flexShrink: 0 }} />
                  <Bone w={14} h={14} r={4} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: flex 2 — Calendar + (Donut + Updates) */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflowY: 'auto' }}>

          {/* Calendar — padding: 4px wrapper */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '4px', border: '1.5px solid var(--border-light)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 4px' }}>
              <Bone w={28} h={28} r={6} />
              <Bone w={100} h={11} />
              <Bone w={28} h={28} r={6} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, padding: '2px 0' }}>
              {Array(7).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 18 }}>
                  <Bone w={18} h={9} r={3} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {Array(35).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bone w={28} h={28} r={4} />
                </div>
              ))}
            </div>
            <div style={{ margin: '4px 2px 2px', padding: '4px 6px', background: 'var(--bg-subtle)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Bone w="55%" h={11} />
              <Bone w={22} h={22} r={11} />
            </div>
          </div>

          {/* Task Overview Donut + Updates side by side */}
          <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>

            {/* Donut */}
            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Bone w={100} h={14} />
                  <Bone w={130} h={11} />
                </div>
                <Bone w={68} h={22} r={6} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
                <Bone w={160} h={160} r={80} />
                <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Bone w={8} h={8} r={4} />
                    <Bone w={55} h={11} />
                    <Bone w={20} h={11} />
                  </div>
                ))}
              </div>
            </div>

            {/* Updates */}
            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, flexShrink: 0 }}>
                <Bone w={30} h={30} r={9} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Bone w={70} h={14} />
                  <Bone w={160} h={11} />
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12 }}>
                    <Bone w={28} h={28} r={8} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <Bone w="85%" h={12} />
                      <Bone w="65%" h={10} />
                      <Bone w="40%" h={9} />
                    </div>
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

export function MemberTasksSkeleton() {
  // Matches MemberTasks: overflow: auto, padding 20px 28px, gap 16
  // Top bar: filter pill group + search input + task count
  // Task cards: 42×42 icon + ID badge + title + stage badge + date | budget + chevron
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Top bar: filter tabs + search + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Filter pill group */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 12, padding: '4px' }}>
          {[80, 90, 60].map((w, i) => <Bone key={i} w={w} h={32} r={9} />)}
        </div>
        {/* Search input */}
        <Bone w={220} h={36} r={10} />
        {/* Task count */}
        <Bone w={60} h={12} style={{ marginLeft: 'auto' }} />
      </div>

      {/* Task cards */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', flexShrink: 0 }}>
          {/* Card header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
            {/* 42×42 stage icon */}
            <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />

            {/* Title + meta */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* ID badge + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bone w={38} h={18} r={5} style={{ flexShrink: 0 }} />
                <Bone w="50%" h={14} />
              </div>
              {/* Stage badge + date + tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bone w={70} h={20} r={20} />
                <Bone w={100} h={12} />
                <Bone w={60} h={20} r={20} />
              </div>
            </div>

            {/* Budget + chevron */}
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <Bone w={80} h={16} />
              <Bone w={55} h={10} />
            </div>
            <Bone w={16} h={16} r={4} style={{ flexShrink: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberPaymentsSkeleton() {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Stats banner: 4 stats with dividers ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '20px 28px', border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', borderRight: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
            {/* 40×40 icon */}
            <Bone w={40} h={40} r={12} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bone w={80} h={11} />
              <Bone w={100} h={26} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Payments table card ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

        {/* Toolbar: status pills + calendar filter | pagination right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Status filter pills: All / Pending / Paid */}
            <div style={{ display: 'flex', gap: 6 }}>
              <Bone w={40} h={30} r={20} />
              <Bone w={68} h={30} r={20} />
              <Bone w={50} h={30} r={20} />
            </div>
            {/* Divider */}
            <Bone w={1} h={32} r={0} />
            {/* Calendar date filter button */}
            <Bone w={36} h={30} r={10} />
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bone w={26} h={26} r={7} />
            <Bone w={50} h={11} />
            <Bone w={26} h={26} r={7} />
          </div>
        </div>

        {/* Column headers: Task / Description / Stage / Due Date / Amount / Paid On */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 160px 110px 100px 140px', padding: '10px 20px', borderBottom: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
          {[120, 90, 60, 65, 55, 60].map((w, i) => (
            <Bone key={i} w={w} h={10} />
          ))}
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 160px 110px 100px 140px', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
              {/* Task: 32×32 icon + ID badge + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bone w={32} h={32} r={9} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bone w={36} h={16} r={4} style={{ flexShrink: 0 }} />
                  <Bone w={130} h={13} />
                </div>
              </div>
              {/* Description pill */}
              <Bone w="90%" h={32} r={8} />
              {/* Stage badge */}
              <div style={{ paddingLeft: 16 }}>
                <Bone w={80} h={22} r={20} />
              </div>
              {/* Due date */}
              <Bone w={80} h={12} />
              {/* Amount + paid/pending badge */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Bone w={70} h={16} />
                <Bone w={46} h={16} r={6} />
              </div>
              {/* Paid On */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Bone w={80} h={12} />
                <Bone w={60} h={10} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MemberProfileSkeleton() {
  // Matches MemberProfile: single card — avatar + name + role + Edit btn → about → divider → 4 contact rows → Change Password row
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '28px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Top row: avatar 72×72 + name + role + Edit button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Bone w={72} h={72} r={36} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w={180} h={22} />
            <Bone w={110} h={14} />
          </div>
          <Bone w={100} h={32} r={10} />
        </div>

        {/* About section */}
        <div style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <Bone w="95%" h={13} />
          <Bone w="88%" h={13} />
          <Bone w="70%" h={13} />
        </div>

        {/* Divider */}
        <Bone w="100%" h={1} r={0} style={{ marginBottom: 16 }} />

        {/* 4 contact rows: 34×34 icon + label + value */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
              <Bone w={34} h={34} r={9} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={55} h={10} />
                <Bone w="50%" h={13} />
              </div>
            </div>
          ))}
        </div>

        {/* Divider + Change Password row */}
        <Bone w="100%" h={1} r={0} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12 }}>
          <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w={140} h={14} />
            <Bone w={200} h={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemberWorkDescSkeleton() {
  // Matches MemberWorkDesc: gradient bg, single white card
  // Header (fixed): "Work Description" title + subtitle + divider
  // Scrollable body: bullet point rows (dot + text, separated by dividers)
  return (
    <div style={{ flex: 1, overflow: 'hidden', background: 'linear-gradient(160deg, #F8F9FC 0%, #F0F2F7 100%)', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, background: 'var(--bg-surface)', borderRadius: 16, border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Fixed header */}
        <div style={{ padding: '24px 32px 20px', flexShrink: 0 }}>
          <Bone w={180} h={20} />
          <Bone w={260} h={13} style={{ marginTop: 8 }} />
          <Bone w="100%" h={1} r={0} style={{ marginTop: 16 }} />
        </div>

        {/* Scrollable bullet points */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 28px', minHeight: 0 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 0', borderBottom: i < 8 ? '1px solid var(--border-light)' : 'none' }}>
              {/* Blue dot */}
              <div style={{ marginTop: 8, width: 5, height: 5, borderRadius: '50%', background: 'var(--border-light)', flexShrink: 0 }} />
              {/* Text line — varying widths */}
              <Bone w={`${[95, 88, 92, 78, 96, 85, 90, 82, 75][i]}%`} h={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MemberHelpSkeleton() {
  // Matches MemberHelp: padding 24px 28px, gap 20, two-column flex
  // Left (flex 1): white card — 40×40 icon + "Submit Help" title + subtitle | textarea | Send button
  // Right (width 400): white card — "Previous Submissions" header | submission cards (status badge + message + response)
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '24px 28px', display: 'flex', gap: 20 }}>

      {/* Left: Submit Help form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
          {/* Header: 40×40 icon + title + subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Bone w={40} h={40} r={12} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Bone w={110} h={16} />
              <Bone w={200} h={12} />
            </div>
          </div>

          {/* "Your Message" label */}
          <Bone w={110} h={11} style={{ flexShrink: 0 }} />

          {/* Textarea */}
          <Bone w="100%" style={{ flex: 1, minHeight: 120, borderRadius: 12 }} h="100%" />

          {/* Send button */}
          <Bone w="100%" h={46} r={12} style={{ flexShrink: 0 }} />
        </div>
      </div>

      {/* Right: Previous Submissions list (width 400) */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid var(--border-light)', flexShrink: 0 }}>
            <Bone w={170} h={14} />
          </div>

          {/* Submission cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Status badge + date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bone w={14} h={14} r={7} />
                    <Bone w={55} h={11} />
                  </div>
                  <Bone w={60} h={10} />
                </div>
                {/* Message preview */}
                <Bone w="95%" h={12} />
                <Bone w="75%" h={12} />
                {/* Response preview (for solved) */}
                {i % 2 === 0 && (
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Bone w={90} h={10} />
                    <Bone w="80%" h={11} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Management skeletons ─────────────────────────────────────── */

export function ManagementHomeSkeleton() {
  // Reuse DashboardSkeleton since ManagementHome uses Dashboard component
  return <DashboardSkeleton />;
}

export function ManagementProfileSkeleton() {
  // Matches ManagementProfile: single card — avatar + name + role + Edit btn → About label + text → divider → 4 contact rows → divider → Admin Controls row → divider → Change Password row
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '28px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Top row: avatar 72×72 + name + role + Edit button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Bone w={72} h={72} r={36} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w={180} h={22} />
            <Bone w={110} h={14} />
          </div>
          <Bone w={100} h={32} r={10} />
        </div>

        {/* About label + text block */}
        <Bone w={50} h={10} style={{ marginBottom: 8 }} />
        <div style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--border-light)', background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <Bone w="95%" h={13} />
          <Bone w="88%" h={13} />
          <Bone w="70%" h={13} />
        </div>

        {/* Divider */}
        <Bone w="100%" h={1} r={0} style={{ marginBottom: 16 }} />

        {/* 4 contact rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
              <Bone w={34} h={34} r={9} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={55} h={10} />
                <Bone w="50%" h={13} />
              </div>
            </div>
          ))}
        </div>

        {/* Divider + Admin Controls row + Divider + Change Password row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Bone w="100%" h={1} r={0} style={{ marginBottom: 12 }} />
          {/* Admin Controls (Management Password) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12 }}>
            <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bone w={170} h={14} />
              <Bone w={220} h={12} />
            </div>
          </div>
          <Bone w="100%" h={1} r={0} style={{ margin: '8px 0' }} />
          {/* Change Password */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12 }}>
            <Bone w={42} h={42} r={12} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bone w={140} h={14} />
              <Bone w={200} h={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ManagementHelpSkeleton() {
  return (
    <div style={{ flex: 1, padding: '24px 28px', display: 'flex', gap: 20, overflow: 'hidden' }}>
      {/* Left: Help submissions list */}
      <div style={{ flex: 1, ...card(), display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Bone w={140} h={18} />
            <Bone w={200} h={12} style={{ marginTop: 6 }} />
          </div>
          <Bone w={140} h={38} r={10} />
        </div>

        {/* Filter tabs */}
        <div style={{ padding: '16px 24px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', gap: 8 }}>
          {[0,1,2].map(i => (
            <Bone key={i} w={80} h={32} r={20} />
          ))}
        </div>

        {/* Help submissions */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ ...card({ background: 'var(--bg-subtle)' }), padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bone w={40} h={40} r={12} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Bone w="60%" h={14} />
                  <Bone w="40%" h={11} />
                </div>
                <Bone w={70} h={24} r={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w="100%" h={12} />
                <Bone w="85%" h={12} />
              </div>
              <Bone w="30%" h={10} />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div style={{ width: 420, ...card(), padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bone w={48} h={48} r={14} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w="70%" h={16} />
            <Bone w="50%" h={12} />
          </div>
        </div>
        <Bone w="100%" h={1} r={0} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bone w="100%" h={13} />
          <Bone w="95%" h={13} />
          <Bone w="88%" h={13} />
          <Bone w="92%" h={13} />
        </div>
        <Bone w="100%" h={1} r={0} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bone w={100} h={12} />
          <Bone w="100%" h={120} r={12} />
          <Bone w={140} h={38} r={10} />
        </div>
      </div>
    </div>
  );
}

/* ── Full app-shell skeleton (sidebar + header + page content) ── */
export function AppShellSkeleton({ page = 'dashboard' }) {
  // Nav items matching the real Sidebar sections
  const navItems = [
    // MAIN
    [3, 3, 3],
    // MANAGEMENT
    [3, 3, 3],
    // PERSONAL
    [3, 3],
    // SYSTEM
    [3],
  ];

  const PageSkeleton = {
    dashboard:   DashboardSkeleton,
    tasks:       TasksSkeleton,
    team:        TeamSkeleton,
    financial:   FinancialSkeleton,
    roles:       RolesSkeleton,
    performance: PerformanceSkeleton,
    reports:     ReportsSkeleton,
    notes:       NotesSkeleton,
    help:        HelpSkeleton,
    settings:    SettingsSkeleton,
    trash:       NotesSkeleton,
  }[page] || DashboardSkeleton;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>

      {/* ── Sidebar skeleton (230px) ── */}
      <aside style={{
        width: 230, height: '100vh', background: 'var(--bg-surface)',
        borderRight: '1.5px solid var(--border-light)',
        display: 'flex', flexDirection: 'column',
        padding: '0 12px', flexShrink: 0,
      }}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 8px 20px' }}>
          <Bone w={34} h={34} r={10} style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Bone w={70} h={14} />
            <Bone w={55} h={9} />
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
          {navItems.map((section, si) => (
            <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
              {section.map((_, ii) => (
                <div key={ii} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 11,
                  background: si === 0 && ii === 0 ? 'var(--bg-subtle)' : 'transparent',
                }}>
                  <Bone w={30} h={30} r={9} style={{ flexShrink: 0 }} />
                  <Bone w={si === 0 && ii === 0 ? 80 : [70, 55, 90, 65, 75, 50, 60, 45, 55][si * 3 + ii] || 65} h={12} />
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Archive button */}
        <div style={{ padding: '12px 8px' }}>
          <Bone w="100%" h={40} r={12} />
        </div>

        {/* Admin user card */}
        <div style={{ padding: '0 4px 20px' }}>
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '12px 14px', border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Avatar + name + role */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bone w={36} h={36} r={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone w={110} h={13} />
                <Bone w={80} h={10} />
              </div>
            </div>
            {/* Active status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bone w={7} h={7} r={4} />
              <Bone w={45} h={11} />
              <Bone w={70} h={10} style={{ marginLeft: 'auto' }} />
            </div>
            {/* Logout button */}
            <Bone w="100%" h={30} r={9} />
          </div>
        </div>
      </aside>

      {/* ── Right: header + page content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', background: 'var(--bg-main)', overflow: 'hidden' }}>
        {/* Header skeleton */}
        <div style={{
          height: 64, flexShrink: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1.5px solid var(--border-light)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: 12,
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w={120} h={16} />
            <Bone w={180} h={11} />
          </div>
          <Bone w={220} h={36} r={10} />
          <Bone w={36} h={36} r={10} />
          <Bone w={36} h={36} r={18} />
        </div>

        {/* Page content skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}

/* ── Global CSS ────────────────────────────────────────────── */
export function SkeletonStyles() {
  return (
    <style>{`
      :root {
        --skeleton-base:  #E8EAEF;
        --skeleton-shine: #F5F6FA;
      }
      [data-theme="dark"] {
        --skeleton-base:  #1E2130;
        --skeleton-shine: #252838;
      }
      @keyframes skeletonShimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
      @keyframes pageEnter {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .page-enter {
        animation: pageEnter 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
    `}</style>
  );
}
