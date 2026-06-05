import { CheckCircle, RotateCcw, UserPlus, DollarSign, AlertCircle, Plus, Edit, MinusCircle, Shield, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TYPE_CONFIG = {
  complete:   { iconBg: '#E8FBF1', iconColor: '#12C479', icon: CheckCircle,  label: 'Task Completed' },
  review:     { iconBg: '#FFF7ED', iconColor: '#F97316', icon: RotateCcw,    label: 'Sent for Review' },
  member:     { iconBg: '#EEF2FF', iconColor: '#3B5BFC', icon: UserPlus,     label: 'Member Added' },
  payment:    { iconBg: '#E8FBF1', iconColor: '#12C479', icon: DollarSign,   label: 'Payment Processed' },
  update:     { iconBg: '#FFF1F1', iconColor: '#FF4D4F', icon: AlertCircle,  label: 'Update Requested' },
  new:        { iconBg: '#EEF2FF', iconColor: '#3B5BFC', icon: Plus,         label: 'Task Created' },
  accept:     { iconBg: '#ECFDF5', iconColor: '#12C479', icon: CheckCircle,  label: 'Work Approved' },
  start:      { iconBg: '#EEF2FF', iconColor: '#3B5BFC', icon: Play,         label: 'Task Started' },
  edit:       { iconBg: '#F5F3FF', iconColor: '#7C3AED', icon: Edit,         label: 'Member Updated' },
  activate:   { iconBg: '#ECFDF5', iconColor: '#12C479', icon: Shield,       label: 'Member Activated' },
  deactivate: { iconBg: '#FFF1F1', iconColor: '#EF4444', icon: MinusCircle,  label: 'Member Deactivated' },
  delete:     { iconBg: '#FFF1F1', iconColor: '#EF4444', icon: MinusCircle,  label: 'Task Deleted' },
};

// Derive avatar initials + color from a sub-string like "Marcus Chen — Lead Developer"
function getAvatarFromSub(sub, tasks, team) {
  // Try to match a task ID pattern like #XXXXXXXX
  const taskIdMatch = sub.match(/#[A-Z0-9]+/);
  if (taskIdMatch) {
    const task = tasks.find(t => t.id === taskIdMatch[0]);
    if (task && task.members.length > 0) {
      const m = task.members[0];
      return { initials: m.avatar, color: m.color, extra: task.members.length > 1 ? `+${task.members.length - 1}` : null };
    }
  }
  // Try to match a team member by name
  for (const m of team) {
    if (sub.includes(m.name)) {
      return { initials: m.avatar, color: m.color, extra: null };
    }
  }
  return null;
}

function ActivityAvatar({ initials, color, extra, compact }) {
  const size = compact ? 20 : 24;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? 7 : 8, fontWeight: 800, color: '#fff',
        border: '2px solid var(--bg-surface)', flexShrink: 0,
      }}>{initials}</div>
      {extra && (
        <div style={{
          width: size, height: size, borderRadius: '50%', background: 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? 7 : 8, fontWeight: 700, color: 'var(--text-secondary)',
          border: '2px solid var(--bg-surface)', marginLeft: -6, flexShrink: 0,
        }}>{extra}</div>
      )}
    </div>
  );
}

export default function RecentActivity({ compact = false }) {
  const { activity, tasks, team, fmt } = useApp();
  const displayed = activity.slice(0, compact ? 5 : 10);

  return (
    <div className="card animate-fade-slide"
      style={{ padding: compact ? '14px 16px' : '22px 24px', animationDelay: '250ms', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: compact ? 10 : 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: 'var(--text-primary)' }}>Team Activity</h2>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--border-light)', padding: '2px 8px', borderRadius: 20 }}>
          {activity.length} events
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 10, flex: 1, overflowY: compact ? 'hidden' : 'auto' }}>
        {displayed.map((act) => {
          const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG['new'];
          const ActIcon = cfg.icon;
          const avatarData = getAvatarFromSub(act.sub, tasks, team);

          // Parse task title from sub for a cleaner display
          const dashIdx = act.sub.indexOf(' — ');
          const taskRef  = dashIdx !== -1 ? act.sub.slice(0, dashIdx) : act.sub;
          const taskName = dashIdx !== -1 ? act.sub.slice(dashIdx + 3) : '';

          return (
            <div key={act.id} className="flex items-center"
              style={{ gap: 10, padding: compact ? '7px 10px' : '9px 12px', borderRadius: 10, background: 'var(--bg-subtle)', transition: 'background 0.15s', cursor: 'default' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}>

              {/* Icon */}
              <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: compact ? 32 : 38, height: compact ? 32 : 38, background: cfg.iconBg }}>
                <ActIcon size={compact ? 13 : 16} color={cfg.iconColor} strokeWidth={2.5} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {act.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {taskRef && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#3B5BFC', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
                      {taskRef}
                    </span>
                  )}
                  {taskName && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {taskName}
                    </span>
                  )}
                  {!taskRef && !taskName && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{act.sub}</span>
                  )}
                </div>
              </div>

              {/* Right: avatar stack + amount + time */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {avatarData && (
                    <ActivityAvatar
                      initials={avatarData.initials}
                      color={avatarData.color}
                      extra={avatarData.extra}
                      compact={compact}
                    />
                  )}
                  {act.amount && (
                    <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: act.up ? '#12C479' : '#FF4D4F' }}>
                      {act.amount}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 9, color: '#B0B8CC' }}>{fmt(act.time)}</p>
              </div>
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9CA3AF', gap: 6 }}>
            <div style={{ fontSize: 24 }}>📋</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>No activity yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
