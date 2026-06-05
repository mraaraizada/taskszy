import { useState, useEffect } from 'react';
import { CheckCircle, DollarSign, RotateCcw, Calendar, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, RefreshCw, Clock, Plus, Trash2, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { AdminTaskModal } from '../pages/TasksPage';
import Avatar from './Avatar';
import { DashboardSkeleton } from './Skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './ui/empty';
import { Button } from './ui/button';

const TYPE_ICONS = {
  complete: { icon: CheckCircle, bg: '#E8FBF1', color: '#12C479' },
  review:   { icon: RotateCcw,   bg: '#FFF7ED', color: '#F97316' },
  payment:  { icon: DollarSign,  bg: '#E8FBF1', color: '#12C479' },
  update:   { icon: AlertCircle, bg: '#FFF1F1', color: '#EF4444' },
  accept:   { icon: CheckCircle, bg: '#EEF2FF', color: '#3B5BFC' },
  new:      { icon: Plus,        bg: '#EEF2FF', color: '#3B5BFC' },
  delete:   { icon: Trash2,      bg: '#FFF1F1', color: '#EF4444' },
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TASK_FILTERS = ['Active', 'Completed', 'All'];

function MiniCalendar({ tasks, onDateSelect, selectedCalendarDate }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventColor, setEventColor] = useState('#22C55E');
  const [events, setEvents] = useState([]); // Start with empty events

  // Reset selectedDay when selectedCalendarDate is cleared
  useEffect(() => {
    if (selectedCalendarDate === null) {
      setSelectedDay(today.getDate());
    }
  }, [selectedCalendarDate]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const taskDates = new Set(tasks.map(t => {
    const d = new Date(t.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
    return null;
  }).filter(Boolean));

  const overdueDates = new Set(tasks.filter(t => new Date(t.deadline) < today && t.stage !== 'Complete').map(t => {
    const d = new Date(t.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
    return null;
  }).filter(Boolean));

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowModal(true);
  };

  const handleSaveEvent = () => {
    if (eventName.trim() && selectedDate) {
      setEvents([...events, { date: selectedDate, name: eventName, color: eventColor, month, year }]);
      setShowModal(false);
      setEventName('');
      setEventColor('#22C55E');
      setSelectedDate(null);
    }
  };

  const getEventsForDate = (day) => {
    return events.filter(e => e.date === day && e.month === month && e.year === year);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={14} color="var(--text-muted)" />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={14} color="var(--text-muted)" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 0 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', paddingBottom: 0, letterSpacing: '0.02em' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selectedDay;
          const eventsForDate = getEventsForDate(day);
          const hasEvents = eventsForDate.length > 0;
          
          // Determine background and text color
          let bgColor = 'transparent';
          let textColor = 'var(--text-secondary)';
          let fontWeight = 400;
          
          if (isToday) {
            // Today has solid blue background
            bgColor = '#3B5BFC';
            textColor = '#fff';
            fontWeight = 700;
          } else if (isSelected) {
            // Selected day has light blue background
            bgColor = '#EEF2FF';
            textColor = '#3B5BFC';
            fontWeight = 700;
          }
          // Event days have no background, only dots
          
          return (
            <button key={day} onClick={() => { 
              setSelectedDay(day); 
              // Don't open modal when clicking any day - just filter tasks
              // Notify parent component about date selection
              if (onDateSelect) {
                onDateSelect(day, month, year);
              }
            }} style={{
              aspectRatio: '1', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: bgColor,
              color: textColor,
              fontSize: 12, fontWeight: fontWeight,
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {day}
              {/* Show dots only for events */}
              {hasEvents && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 3, 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  display: 'flex',
                  gap: 4
                }}>
                  {eventsForDate.slice(0, 3).map((event, idx) => (
                    <div key={idx} style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: event.color 
                    }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Show events for selected day - Always visible */}
      <div style={{ marginTop: 1, padding: '3px 5px', background: 'var(--bg-subtle)', borderRadius: 5 }}>
        {(() => {
          const selectedEvents = getEventsForDate(selectedDay);
          if (selectedEvents.length > 0) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', flex: 1 }}>
                  {selectedEvents.map((event, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: event.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {event.name}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Plus Button */}
                <button
                  onClick={() => { setSelectedDate(selectedDay); setShowModal(true); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={16} color="#3B5BFC" strokeWidth={2.5} />
                </button>
              </div>
            );
          } else {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No events
                </div>
                {/* Plus Button */}
                <button
                  onClick={() => { setSelectedDate(selectedDay); setShowModal(true); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={16} color="#3B5BFC" strokeWidth={2.5} />
                </button>
              </div>
            );
          }
        })()}
      </div>

      {/* Event Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 24, width: 320,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1D2E', margin: 0 }}>
                {selectedDate ? `Add Event - ${MONTHS[month]} ${selectedDate}` : 'Add Event'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEventName(''); setSelectedDate(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>

            {!selectedDate && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Select Date
                </label>
                <input
                  type="number"
                  min="1"
                  max={daysInMonth}
                  placeholder="Enter day (1-31)"
                  value={selectedDate || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= daysInMonth) {
                      setSelectedDate(val);
                    } else if (e.target.value === '') {
                      setSelectedDate(null);
                    }
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                    fontSize: 14, outline: 'none', transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Event Name
              </label>
              <input
                type="text"
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                  fontSize: 14, outline: 'none', transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Choose Color
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'].map(color => (
                  <button
                    key={color}
                    onClick={() => setEventColor(color)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: color,
                      border: eventColor === color ? '3px solid #1A1D2E' : '2px solid transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      transform: eventColor === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowModal(false); setEventName(''); setSelectedDate(null); }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                  background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!eventName.trim() || !selectedDate}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: (!eventName.trim() || !selectedDate) ? '#D1D5DB' : '#4F46E5',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: (!eventName.trim() || !selectedDate) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (eventName.trim() && selectedDate) e.currentTarget.style.background = '#4338CA';
                }}
                onMouseLeave={(e) => {
                  if (eventName.trim() && selectedDate) e.currentTarget.style.background = '#4F46E5';
                }}
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const WEEK_OPTIONS = ['This Week', 'Last Week', '2 Weeks Ago'];

function TaskDonut({ tasks }) {
  const [hovered, setHovered] = useState(null);

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Completed: Tasks completed in last 7 days
  const completed = tasks.filter(t => {
    if (t.stage !== 'Complete') return false;
    // Check if completed in last 7 days (using history or updatedAt)
    const completedDate = t.history?.find(h => h.stage === 'Complete')?.date;
    if (completedDate) {
      const date = completedDate?.toDate ? completedDate.toDate() : new Date(completedDate);
      return date >= sevenDaysAgo;
    }
    return true; // Include if no history available
  }).length;

  // Active: Tasks active (not complete) with deadline in last 7 days or future
  const active = tasks.filter(t => {
    if (t.stage === 'Complete') return false;
    const deadline = new Date(t.extendedDeadline || t.deadline);
    return deadline >= sevenDaysAgo;
  }).length;

  // Pending: ALL pending tasks from any date (overdue tasks)
  const pending = tasks.filter(t => {
    if (t.stage === 'Complete') return false;
    const deadline = new Date(t.extendedDeadline || t.deadline);
    return deadline < sevenDaysAgo;
  }).length;

  const total = completed + active + pending;

  const data = [
    { name: 'Complete', value: completed, color: '#12C479' },
    { name: 'Active',   value: active,    color: '#3B5BFC' },
    { name: 'Pending',  value: pending,   color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const hoveredData = hovered ? data.find(d => d.name === hovered) : null;
  const centerValue = hoveredData ? hoveredData.value : total;
  const centerLabel = hoveredData ? hoveredData.name : 'Total';
  const centerColor = hoveredData ? hoveredData.color : 'var(--text-primary)';

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Task Overview</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed · Active · Pending</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '3px 9px', borderRadius: 6, border: '1px solid var(--border)' }}>All Tasks</span>
      </div>

      {/* Donut centered with label inside */}
      <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 12px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
          <PieChart>
            <Pie
              data={total > 0 ? data : [{ name: 'Empty', value: 1, color: '#E5E7EB' }]}
              cx="50%" cy="50%" innerRadius={48} outerRadius={72}
              dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}
              onMouseEnter={(_, i) => setHovered(total > 0 ? data[i]?.name : null)}
              onMouseLeave={() => setHovered(null)}
            >
              {(total > 0 ? data : [{ color: '#E5E7EB' }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={hovered && hovered !== entry.name ? 0.35 : 1} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: centerColor, lineHeight: 1, transition: 'color 0.2s' }}>{centerValue}</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{centerLabel}</span>
          {active && <span style={{ fontSize: 9, fontWeight: 700, color: active.color }}>{total > 0 ? Math.round((active.value / total) * 100) : 0}%</span>}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ hideBudget = false, member = null }) {
  const { tasks, activity, STAGE_COLORS, STAGE_BG, STAGES, updateTaskStage, deleteTask, markTaskPaid, fmt, scheduledTasks, addScheduledTask, removeScheduledTask, createTask, refreshTrigger } = useApp();

  // React to refresh trigger - this will cause component to re-render with fresh data
  useEffect(() => {

    // Component will automatically re-render when refreshTrigger changes
    // In a real app, you might fetch fresh data here
  }, [refreshTrigger]);

  const activeTasks = tasks.filter(t => t.stage !== 'Complete');
  const upcoming    = [...activeTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3);

  const [filter, setFilter]         = useState('Active');
  const [modalTask, setModalTask]   = useState(null);
  const [stageSelect, setStageSelect] = useState({});
  const [memberStage, setMemberStage] = useState({});
  const [updating, setUpdating]     = useState(null);
  const [updatingMember, setUpdatingMember] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const tasksPerPage = 10;

  // Merge scheduled tasks with regular tasks
  const allTasks = [...tasks, ...scheduledTasks];

  let filtered = allTasks.filter(t => {
    return filter === 'Active' ? t.stage !== 'Complete' : filter === 'Completed' ? t.stage === 'Complete' : true;
  }).sort((a, b) => {
    if (a.stage === 'Complete' && b.stage !== 'Complete') return 1;
    if (b.stage === 'Complete' && a.stage !== 'Complete') return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // Filter by selected calendar date
  if (selectedCalendarDate) {
    filtered = filtered.filter(t => {
      const taskDate = new Date(t.deadline);
      return taskDate.getDate() === selectedCalendarDate.day && 
             taskDate.getMonth() === selectedCalendarDate.month && 
             taskDate.getFullYear() === selectedCalendarDate.year;
    });
  }

  const totalPages = Math.ceil(filtered.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedTasks = filtered.slice(startIndex, endIndex);

  const counts = {
    Active: allTasks.filter(t => t.stage !== 'Complete').length,
    Completed: allTasks.filter(t => t.stage === 'Complete').length,
    All: allTasks.length,
  };

  function handleStageUpdate(task) {
    const newStage = stageSelect[task.id];
    if (!newStage) return;
    setUpdating(task.id);
    setTimeout(() => {
      updateTaskStage(task.id, newStage);
      setUpdating(null);
      setStageSelect(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      setModalTask(prev => prev ? { ...prev, stage: newStage } : null);
    }, 700);
  }

  function handleMemberStageUpdate(taskId, memberId) {
    const key = `${taskId}-${memberId}`;
    const newStage = memberStage[key];
    if (!newStage) return;
    setUpdatingMember(key);
    setTimeout(() => {
      updateTaskStage(taskId, newStage, memberId);
      setUpdatingMember(null);
      setMemberStage(prev => { const n = { ...prev }; delete n[key]; return n; });
    }, 600);
  }

  function handleDelete(taskId) {
    setDeleting(true);
    setTimeout(() => {
      deleteTask(taskId);
      setModalTask(null);
      setConfirmDelete(false);
      setDeleting(false);
    }, 500);
  }

  const isOverdue = (t) => new Date(t.extendedDeadline || t.deadline) < new Date() && t.stage !== 'Complete';
  const daysLeft  = (d, ext) => Math.ceil((new Date(ext || d) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>

      {/* ── Two-column layout ── */}
      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

        {/* LEFT: Upcoming Tasks + All Tasks */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

          {/* Upcoming Tasks */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px 12px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={13} color="#3B5BFC" strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Upcoming Tasks</div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
              {upcoming.length === 0 ? (
                <div style={{ flex: 1, textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>No active tasks</div>
              ) : upcoming.map(task => {
                const deadline = new Date(task.deadline);
                const overdue = deadline < new Date();
                const days = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                const dateLabel = overdue ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={task.id} style={{
                    flex: 1, background: overdue ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                    borderRadius: 12, border: `1.5px solid ${overdue ? '#FED7D7' : 'var(--border-light)'}`,
                    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7,
                    cursor: 'pointer', transition: 'box-shadow 0.15s', position: 'relative',
                  }}
                    onClick={() => setModalTask(task)}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: task.paid ? '#12C479' : '#F97316', background: task.paid ? '#E8FBF1' : '#FFF7ED', padding: '2px 7px', borderRadius: 20 }}>{task.paid ? 'Paid' : 'Pending'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#3B5BFC', padding: '2px 6px', borderRadius: 4 }}>#{task.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: overdue ? '#EF4444' : days <= 2 ? '#F97316' : 'var(--text-muted)' }}>{dateLabel}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.title}</span>
                      {/* Member avatars */}
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        {task.members.slice(0, 4).map((m, idx) => (
                          <Avatar key={m.id} member={m} size={20} style={{ border: '2px solid var(--bg-surface)', marginLeft: idx === 0 ? 0 : -6, zIndex: task.members.length - idx }} />
                        ))}
                        {task.members.length > 4 && <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-subtle)', border: '2px solid var(--bg-surface)', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: 'var(--text-muted)' }}>+{task.members.length - 4}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Tasks — fills remaining height */}
          <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={13} color="#3B5BFC" strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Tasks</div>
                {selectedCalendarDate && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Showing tasks for {MONTHS[selectedCalendarDate.month]} {selectedCalendarDate.day}, {selectedCalendarDate.year}
                    <button 
                      onClick={() => setSelectedCalendarDate(null)}
                      style={{ marginLeft: 6, fontSize: 10, color: '#3B5BFC', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
              {filtered.length > tasksPerPage && (
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={12} color="var(--text-muted)" />
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 40, textAlign: 'center' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={12} color="var(--text-muted)" />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 3, background: 'var(--bg-subtle)', borderRadius: 9, padding: '3px' }}>
                {TASK_FILTERS.map(f => (
                  <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); setSelectedCalendarDate(null); }} style={{ padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? 'var(--bg-surface)' : 'transparent', color: filter === f ? (f === 'Scheduled' ? '#7C3AED' : 'var(--text-primary)') : 'var(--text-muted)', boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {f} {(f === 'Active' || f === 'Scheduled') && <span style={{ fontSize: 10, fontWeight: 800, color: filter === f ? (f === 'Scheduled' ? '#7C3AED' : '#3B5BFC') : 'var(--text-muted)' }}>{counts[f]}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 ? (
                <Empty style={{ flex: 1, padding: '48px 24px' }}>
                  <EmptyHeader>
                    <EmptyMedia>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={32} color="var(--text-muted)" strokeWidth={1.5} />
                      </div>
                    </EmptyMedia>
                    <EmptyTitle>No Tasks Found</EmptyTitle>
                    <EmptyDescription>
                      {filter === 'Completed' 
                        ? 'No completed tasks yet. Tasks will appear here once marked as complete.' 
                        : filter === 'Active'
                        ? 'No active tasks at the moment. Create a new task to get started.'
                        : 'No tasks available. Start by creating your first task.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add your create task logic here
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#3B5BFC',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={16} />
                      Create Task
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : null}

              {paginatedTasks.map(task => {
                const overdueFlag = isOverdue(task);
                const isComplete  = task.stage === 'Complete';
                const days = daysLeft(task.deadline, task.extendedDeadline);
                return (
                  <div key={task.id} onClick={() => { setModalTask(task); setConfirmDelete(false); }} style={{
                    background: 'var(--bg-surface)', borderRadius: 14,
                    border: `1.5px solid ${overdueFlag ? '#FED7D7' : isComplete ? '#BBF7D0' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Stage icon */}
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isComplete ? '#ECFDF5' : overdueFlag ? '#FEF2F2' : STAGE_BG[task.stage], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isComplete ? <CheckCircle size={15} color="#12C479" strokeWidth={2.5} /> : overdueFlag ? <AlertCircle size={15} color="#EF4444" strokeWidth={2.5} /> : <Clock size={15} color={STAGE_COLORS[task.stage]} strokeWidth={2.5} />}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: isComplete ? '#12C479' : '#3B5BFC', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>#{task.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                        {task.category && (
                          <span style={{ 
                            fontSize: 10, 
                            padding: '4px 10px', 
                            borderRadius: 50, 
                            background: task.category.bg, 
                            color: '#1A1D2E', 
                            fontWeight: 700, 
                            border: `1px solid ${task.category.color}30`, 
                            flexShrink: 0, 
                            marginLeft: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {task.category.image && (
                              <img src={task.category.image} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                            )}
                            {task.category.label}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: STAGE_BG[task.stage], color: STAGE_COLORS[task.stage] }}>{task.stage}</span>
                        {task.tags && task.tags.map(tag => (
                          <span key={tag.label} style={{ 
                            fontSize: 10, 
                            padding: '4px 10px', 
                            borderRadius: 50, 
                            background: tag.bg, 
                            color: '#1A1D2E', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {tag.image && (
                              <img src={tag.image} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                            )}
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Due date - right side center */}
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 100 }}>
                      <span style={{ fontSize: 11, color: overdueFlag ? '#EF4444' : days <= 2 ? '#F97316' : 'var(--text-muted)', fontWeight: overdueFlag || days <= 2 ? 700 : 500, display: 'block' }}>
                        {isComplete ? new Date(task.paidOn || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : overdueFlag ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${task.extendedDeadline ? 'Extended: ' : 'Due '}${new Date(task.extendedDeadline || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                      {task.isScheduled && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#3B5BFC', background: '#EEF2FF', padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 4 }}>
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Member stack */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', flexShrink: 0, maxWidth: 90 }}>
                      {task.members.slice(0, 6).map((m, idx) => (
                        <Avatar key={m.id} member={m} size={22} style={{ border: '2px solid var(--bg-surface)', marginLeft: idx === 0 ? 0 : -6 }} />
                      ))}
                      {task.members.length > 6 && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-subtle)', border: '2px solid var(--bg-surface)', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--text-muted)' }}>+{task.members.length - 6}</div>}
                    </div>

                    {/* Budget */}
                    {!hideBudget && (
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isComplete ? '#12C479' : 'var(--text-primary)' }}>₹ {task.totalBudget?.toLocaleString()}</div>
                      </div>
                    )}

                    {/* Payment status — management only */}
                    {hideBudget && member && task.members.some(m => m.id === member.id) && (() => {
                      const mem = task.members.find(m => m.id === member.id);
                      return (
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: task.paid ? '#12C479' : 'var(--text-primary)' }}>
                            ₹ {mem?.budget?.toLocaleString()}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Admin Profile + Calendar + Donut + Updates */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflowY: 'auto' }}>

          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '4px', border: '1.5px solid var(--border)', flexShrink: 0 }}>
            <MiniCalendar 
              tasks={tasks} 
              selectedCalendarDate={selectedCalendarDate}
              onDateSelect={(day, month, year) => {
                setSelectedCalendarDate({ day, month, year });
                setCurrentPage(1);
              }} 
            />
          </div>

          {/* Task Overview + Updates side by side */}
          <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>

            <TaskDonut tasks={tasks} />

            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ marginBottom: 14, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={14} color="#3B5BFC" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Updates</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recent changes across all tasks</div>
                  </div>
                </div>
              </div>
              {(() => {
                const now = new Date();
                const TASK_STAGE_TYPES = new Set(['payment', 'accept', 'review', 'update', 'complete', 'start', 'new', 'edit', 'delete']);
                const thisMonthActivity = activity.filter(act => {
                  const d = new Date(act.time);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                    && TASK_STAGE_TYPES.has(act.type);
                });
                return thisMonthActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>No updates this month</div>
              ) : (
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {thisMonthActivity.map((act, i) => {
                      const cfg = TYPE_ICONS[act.type] || TYPE_ICONS.accept;
                      const ActIcon = cfg.icon;
                      const dashIdx = act.sub.indexOf(' — ');
                      const taskRef  = dashIdx !== -1 ? act.sub.slice(0, dashIdx) : act.sub;
                      const taskName = dashIdx !== -1 ? act.sub.slice(dashIdx + 3) : '';
                      return (
                        <div key={act.id} style={{ display: 'flex', gap: 12, paddingBottom: i === thisMonthActivity.length - 1 ? 0 : 14, position: 'relative' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, zIndex: 1, background: cfg.bg, border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1.5px var(--border-light)' }}>
                            <ActIcon size={13} color={cfg.color} strokeWidth={2.5} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{act.title}</div>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#3B5BFC', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{taskRef}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{taskName}</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{fmt(act.time)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })()}
            </div>

          </div>
        </div>

      </div>

      {/* ── Task Detail Modal ── */}
      {modalTask && <AdminTaskModal task={modalTask} onClose={() => { setModalTask(null); setConfirmDelete(false); }} hideBudget={hideBudget} onCreateScheduled={(task) => { createTask(task); removeScheduledTask(task.id); }} onCancelScheduled={(id) => removeScheduledTask(id)} />}

    </div>
  );
}
