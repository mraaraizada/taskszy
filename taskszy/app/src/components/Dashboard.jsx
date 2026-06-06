import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, DollarSign, RotateCcw, Calendar, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, RefreshCw, Clock, Plus, Trash2, X, MessageSquare, Send, Users, User, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createBroadcast, getVisibleBroadcasts } from '../lib/broadcastService';
import { useApp } from '../context/AppContext';
import { AdminTaskModal } from '../pages/TasksPage';
import { AdminPasswordModal } from './AdminPasswordModal';
import { notify } from '../lib/notify';
import Avatar from './Avatar';
import TaskChatPanel from './TaskChatPanel';
import { DashboardSkeleton } from './Skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './ui/empty';
import { useLottie } from 'lottie-react';
import { subscribeToCalendarEvents, addCalendarEvent, removeCalendarEvent } from '../lib/calendarService';

function useDonutWelcomeAnim() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../lottie/Welcome (1).json').then(m => setData(m.default)); }, []);
  return data;
}
import { Button } from './ui/button';

const TYPE_ICONS = {
  complete: { icon: CheckCircle, bg: '#E8FBF1', color: '#12C479' },
  review:   { icon: RotateCcw,   bg: '#FFF7ED', color: '#F97316' },
  payment:  { icon: DollarSign,  bg: '#E8FBF1', color: '#12C479' },
  update:   { icon: AlertCircle, bg: '#FFF1F1', color: '#EF4444' },
  accept:   { icon: CheckCircle, bg: '#EEF2FF', color: '#3B5BFC' },
  new:      { icon: Plus,        bg: '#EEF2FF', color: '#3B5BFC' },
  delete:   { icon: Trash2,      bg: '#FFF1F1', color: '#EF4444' },
  broadcast:{ icon: Send,        bg: '#F5F3FF', color: '#7C3AED' },
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TASK_FILTERS = ['Active', 'Completed', 'All'];

function MiniCalendar({ tasks, onDateSelect, selectedCalendarDate, orgId, userId, isSharedCalendar = true }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventColor, setEventColor] = useState('#22C55E');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Track clicked event for delete
  const calendarRef = useRef(null); // Reference to calendar container

  // Subscribe to calendar events from Firebase
  useEffect(() => {
    if (!orgId || !userId) {

      return;
    }

    const unsubscribe = subscribeToCalendarEvents(orgId, userId, isSharedCalendar, (loadedEvents) => {

      setEvents(loadedEvents);
    });
    
    return () => {

      unsubscribe();
    };
  }, [orgId, userId, isSharedCalendar]);

  // Click outside to deselect event
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setSelectedEvent(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const taskDates = new Set(tasks.filter(t => t.stage !== 'Complete').map(t => {
    const d = new Date(t.extendedDeadline || t.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
    return null;
  }).filter(Boolean));

  // Count tasks per date (incomplete tasks only)
  const taskCountByDate = {};
  tasks.filter(t => t.stage !== 'Complete').forEach(t => {
    const d = new Date(t.extendedDeadline || t.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      taskCountByDate[day] = (taskCountByDate[day] || 0) + 1;
    }
  });

  const overdueDates = new Set(tasks.filter(t => new Date(t.extendedDeadline || t.deadline) < today && t.stage !== 'Complete').map(t => {
    const d = new Date(t.extendedDeadline || t.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
    return null;
  }).filter(Boolean));

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (eventName.trim() && selectedDate && orgId && userId) {
      try {
        const newEvent = {
          date: selectedDate,
          name: eventName,
          color: eventColor,
          month,
          year
        };
        
        await addCalendarEvent(orgId, userId, isSharedCalendar, newEvent);
        notify.success('Event added successfully');
        setShowModal(false);
        setEventName('');
        setEventColor('#22C55E');
        setSelectedDate(null);
      } catch (error) {

        notify.error('Failed to save event');
      }
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!orgId || !userId) return;
    
    try {
      await removeCalendarEvent(orgId, userId, isSharedCalendar, event);
      notify.success('Event deleted');
    } catch (error) {

      notify.error('Failed to delete event');
    }
  };

  const getEventsForDate = (day) => {
    return events.filter(e => e.date === day && e.month === month && e.year === year);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={calendarRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="var(--text-muted)" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={18} color="var(--text-muted)" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', paddingBottom: 6, letterSpacing: '0.02em' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selectedDay;
          const eventsForDate = getEventsForDate(day);
          const hasEvents = eventsForDate.length > 0;
          const hasTask = taskDates.has(day);
          const isOverdue = overdueDates.has(day);
          
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
              width: '100%', height: 56, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: bgColor,
              color: textColor,
              fontSize: 16, fontWeight: fontWeight,
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              padding: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {day}
              {/* Show dots for events and tasks */}
              {(hasEvents || hasTask) && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 3, 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  maxWidth: '90%',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {/* Task dots - show multiple dots based on task count (max 10) */}
                  {hasTask && (() => {
                    const taskCount = taskCountByDate[day] || 0;
                    const dotsToShow = Math.min(taskCount, 10); // Maximum 10 dots
                    return Array.from({ length: dotsToShow }).map((_, idx) => (
                      <div key={`task-${idx}`} style={{ 
                        width: 5, 
                        height: 5, 
                        borderRadius: '50%', 
                        background: isOverdue ? '#EF4444' : '#3B5BFC'
                      }} />
                    ));
                  })()}
                  {/* Event dots - show after task dots if space allows */}
                  {eventsForDate.slice(0, hasTask ? Math.max(0, 10 - (taskCountByDate[day] || 0)) : 10).map((event, idx) => (
                    <div key={`event-${idx}`} style={{ 
                      width: 5, 
                      height: 5, 
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
      <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
        {(() => {
          const selectedEvents = getEventsForDate(selectedDay);
          if (selectedEvents.length > 0) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', flex: 1 }}>
                  {selectedEvents.map((event, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3, 
                        padding: '2px 6px', 
                        background: selectedEvent?.id === event.id ? '#FEE2E2' : 'var(--bg-surface)', 
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: selectedEvent?.id === event.id ? '1px solid #EF4444' : '1px solid transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: event.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {event.name}
                      </span>
                      {selectedEvent?.id === event.id && (
                        (() => {
                          // Check if event is in the past
                          const eventDate = new Date(event.year, event.month, event.date);
                          const todayDate = new Date();
                          todayDate.setHours(0, 0, 0, 0);
                          const isPastEvent = eventDate < todayDate;
                          
                          // Only show delete button for current or future events
                          if (isPastEvent) return null;
                          
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event);
                                setSelectedEvent(null);
                              }}
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: '#EF4444',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 2,
                                flexShrink: 0
                              }}
                            >
                              <X size={10} color="#fff" strokeWidth={2.5} />
                            </button>
                          );
                        })()
                      )}
                    </div>
                  ))}
                </div>
                {/* Plus Button */}
                <button
                  onClick={() => { setSelectedDate(selectedDay); setShowModal(true); }}
                  style={{
                    width: 20,
                    height: 20,
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
                  <Plus size={14} color="#3B5BFC" strokeWidth={2.5} />
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
                    width: 20,
                    height: 20,
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
                  <Plus size={14} color="#3B5BFC" strokeWidth={2.5} />
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
          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
  const { showDonutWelcome, setShowDonutWelcome, hasSeenDonutWelcome } = useApp();
  const [donutFading, setDonutFading] = useState(false);
  const donutAnimData = useDonutWelcomeAnim();

  // Auto-dismiss if already seen
  useEffect(() => {
    if (showDonutWelcome && hasSeenDonutWelcome) {

      setShowDonutWelcome(false);
    }
  }, [showDonutWelcome, hasSeenDonutWelcome, setShowDonutWelcome]);

  const DonutLottie = () => {
    const { View } = useLottie({
      animationData: donutAnimData ?? null,
      loop: false,
      autoplay: !!donutAnimData,
      onComplete: () => { setDonutFading(true); setTimeout(() => setShowDonutWelcome(false), 500); },
      style: { width: '100%', height: '100%', objectFit: 'cover' },
    });
    useEffect(() => {
      const t = setTimeout(() => { setDonutFading(true); setTimeout(() => setShowDonutWelcome(false), 500); }, 4000);
      return () => clearTimeout(t);
    }, []);
    if (!donutAnimData) return null;
    return View;
  };

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

  const displayData = data.length > 0 ? data : [{ name: 'Empty', value: 1, color: '#E5E7EB' }];

  const hoveredData = hovered ? data.find(d => d.name === hovered) : null;
  const centerValue = hoveredData ? hoveredData.value : total;
  const centerLabel = hoveredData ? hoveredData.name : 'Total';
  const centerColor = hoveredData ? hoveredData.color : 'var(--text-primary)';

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: '1.5px solid var(--border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Task Overview</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed · Active · Pending</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '3px 9px', borderRadius: 6, border: '1px solid var(--border)' }}>All Tasks</span>
      </div>

      {/* Donut */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <PieChart>
              <Pie
                data={displayData}
                cx="50%" cy="50%" innerRadius={60} outerRadius={88}
                dataKey="value" strokeWidth={2} stroke="var(--bg-surface)"
                startAngle={90} endAngle={-270}
                onMouseEnter={(_, i) => setHovered(data.length > 0 ? displayData[i]?.name : null)}
                onMouseLeave={() => setHovered(null)}
              >
                {displayData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={hovered && hovered !== entry.name ? 0.3 : 1} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: centerColor, lineHeight: 1, transition: 'color 0.2s' }}>{centerValue}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>{centerLabel}</span>
          </div>
        </div>
      </div>

      {/* Welcome lottie overlay — covers full card */}
      {showDonutWelcome && !hasSeenDonutWelcome && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', opacity: donutFading ? 0 : 1, transition: 'opacity 0.5s ease', borderRadius: 18, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutLottie />
        </div>
      )}

    </div>
  );
}

// ── Broadcast View/Edit Modal ─────────────────────────────────────────────────
function BroadcastViewModal({ broadcast, onClose, canEdit, onSave, showCreatorInfo = false }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(broadcast.title);
  const [editMessage, setEditMessage] = useState(broadcast.message);

  const handleSave = () => {
    onSave(broadcast.id, { title: editTitle, message: editMessage });
    setEditing(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={14} color="#7C3AED" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 }}>Update</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {showCreatorInfo && broadcast.creatorInfo && (
                  <>
                    {broadcast.creatorInfo.avatarImg ? (
                      <img src={broadcast.creatorInfo.avatarImg} alt={broadcast.creatorInfo.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: broadcast.creatorInfo.color || '#3B5BFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>
                        {broadcast.creatorInfo.avatar || broadcast.creatorInfo.name?.[0] || 'U'}
                      </div>
                    )}
                    <span style={{ fontWeight: 600 }}>{broadcast.creatorInfo.name}</span>
                    <span>·</span>
                  </>
                )}
                {new Date(broadcast.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {showCreatorInfo && (
                  <>
                    <span>·</span>
                    {broadcast.recipientMode === 'all' ? (
                      <span>(All)</span>
                    ) : broadcast.recipientMode === 'role' && broadcast.selectedRoles && broadcast.selectedRoles.length > 0 ? (
                      <span>({broadcast.selectedRoles.join(', ')})</span>
                    ) : broadcast.recipientMode === 'member' && broadcast.selectedMembers && broadcast.selectedMembers.length > 0 ? (
                      <span>({broadcast.selectedMembers.length === 1 ? '1 Member' : `${broadcast.selectedMembers.length} Members`})</span>
                    ) : (
                      <span>(No recipients)</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            )}
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {editing ? (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #7C3AED', borderRadius: 10, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</label>
                <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={5}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #7C3AED', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{broadcast.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{broadcast.message}</div>
            </>
          )}
        </div>

        {/* Footer — only in edit mode */}
        {editing && (
          <div style={{ padding: '12px 22px 18px', borderTop: '1.5px solid var(--border-light)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button onClick={() => { setEditing(false); setEditTitle(broadcast.title); setEditMessage(broadcast.message); }}
              style={{ padding: '9px 18px', background: 'var(--input-bg)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={!editTitle.trim() || !editMessage.trim()}
              style={{ padding: '9px 20px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Compose Update Modal ─────────────────────────────────────────────────────
function ComposeUpdateModal({ onClose, team, onSend }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientMode, setRecipientMode] = useState('all'); // 'all' | 'role' | 'member'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  const uniqueRoles = [...new Set(team.filter(m => m.status === 'Active').map(m => m.role))].sort();
  const activeMembers = team.filter(m => m.status === 'Active');

  const toggleMember = (id) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleRole = (role) => {
    const roleMembers = activeMembers.filter(m => m.role === role).map(m => m.id);
    const allSel = roleMembers.every(id => selectedMembers.includes(id));
    setSelectedMembers(prev => allSel
      ? prev.filter(id => !roleMembers.includes(id))
      : [...new Set([...prev, ...roleMembers])]
    );
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const recipientCount = recipientMode === 'all'
    ? activeMembers.length
    : selectedMembers.length;

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    // Store the update data and show password modal
    setPendingUpdate({ title: title.trim(), message: message.trim(), recipientMode, selectedMembers, recipientCount });
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = () => {
    // Password verified, proceed with sending
    if (pendingUpdate) {
      setSending(true);
      setTimeout(() => {
        onSend(pendingUpdate);
        onClose();
      }, 600);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingUpdate(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,91,252,0.3)' }}>
              <Send size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Update</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title <span style={{ color: '#EF4444' }}>*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Update title..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your update or announcement..."
              rows={4}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Recipients */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>To</label>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 10, padding: 4, marginBottom: 12 }}>
              {[
                { key: 'all', label: 'All', icon: <Users size={13} /> },
                { key: 'role', label: 'Role', icon: <Shield size={13} /> },
              ].map(opt => (
                <button key={opt.key} type="button"
                  onClick={() => { setRecipientMode(opt.key); setSelectedMembers([]); setSelectedRoles([]); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: recipientMode === opt.key ? 'var(--bg-surface)' : 'transparent', color: recipientMode === opt.key ? '#3B5BFC' : 'var(--text-muted)', boxShadow: recipientMode === opt.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>

            {/* All mode */}
            {recipientMode === 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#EEF2FF', borderRadius: 10, border: '1.5px solid #C7D4FF' }}>
                <CheckCircle size={14} color="#3B5BFC" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3B5BFC' }}>All {activeMembers.length} active members will read this update</span>
              </div>
            )}

            {/* Role mode */}
            {recipientMode === 'role' && (
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {uniqueRoles.map((role, idx) => {
                  const roleMembers = activeMembers.filter(m => m.role === role);
                  const allSel = roleMembers.every(m => selectedMembers.includes(m.id));
                  const someSel = roleMembers.some(m => selectedMembers.includes(m.id));
                  return (
                    <button key={role} type="button"
                      onClick={() => toggleRole(role)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: allSel ? '#F5F8FF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < uniqueRoles.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allSel ? '#3B5BFC' : someSel ? '#93A8FF' : '#C4C9D9'}`, background: allSel ? '#3B5BFC' : someSel ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {allSel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {!allSel && someSel && <div style={{ width: 6, height: 2, background: '#3B5BFC', borderRadius: 1 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                          {roleMembers.map(m => (
                            <div key={m.id} title={m.name} style={{ width: 18, height: 18, borderRadius: '50%', background: m.avatarImg ? 'transparent' : m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff', overflow: 'hidden', border: m.avatarImg ? '1px solid var(--border-light)' : 'none' }}>
                              {m.avatarImg ? (
                                <img src={m.avatarImg} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                m.avatar
                              )}
                            </div>
                          ))}
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }}>{roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      {allSel && <CheckCircle size={13} color="#3B5BFC" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Member mode */}
            {recipientMode === 'member' && (
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Select all */}
                <button type="button"
                  onClick={() => setSelectedMembers(activeMembers.every(m => selectedMembers.includes(m.id)) ? [] : activeMembers.map(m => m.id))}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: activeMembers.every(m => selectedMembers.includes(m.id)) ? '#EEF2FF' : 'var(--bg-subtle)', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${activeMembers.every(m => selectedMembers.includes(m.id)) ? '#3B5BFC' : '#C4C9D9'}`, background: activeMembers.every(m => selectedMembers.includes(m.id)) ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activeMembers.every(m => selectedMembers.includes(m.id)) && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Select All</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{activeMembers.length} members</span>
                </button>
                {activeMembers.map((m, idx) => {
                  const sel = selectedMembers.includes(m.id);
                  return (
                    <button key={m.id} type="button"
                      onClick={() => toggleMember(m.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: sel ? '#F5F8FF' : 'var(--bg-surface)', border: 'none', borderBottom: idx < activeMembers.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#3B5BFC' : '#C4C9D9'}`, background: sel ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                      </div>
                      {sel && <CheckCircle size={13} color="#3B5BFC" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selection summary */}
            {recipientMode !== 'all' && selectedMembers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Update to:</span>
                {selectedMembers.slice(0, 5).map(id => {
                  const m = activeMembers.find(x => x.id === id);
                  if (!m) return null;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D4FF' }}>
                      {m.avatarImg ? (
                        <img src={m.avatarImg} alt={m.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>{m.name}</span>
                    </div>
                  );
                })}
                {selectedMembers.length > 5 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{selectedMembers.length - 5} more</span>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '1.5px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--input-bg)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={!title.trim() || !message.trim() || (recipientMode !== 'all' && selectedMembers.length === 0) || sending}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: title.trim() && message.trim() && (recipientMode === 'all' || selectedMembers.length > 0) ? 'pointer' : 'default',
              background: title.trim() && message.trim() && (recipientMode === 'all' || selectedMembers.length > 0) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)',
              color: title.trim() && message.trim() && (recipientMode === 'all' || selectedMembers.length > 0) ? '#fff' : 'var(--text-muted)',
              boxShadow: title.trim() && message.trim() && (recipientMode === 'all' || selectedMembers.length > 0) ? '0 4px 14px rgba(59,91,252,0.3)' : 'none',
            }}>
            {sending ? <RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={13} strokeWidth={2.5} />}
            {sending ? 'Updating…' : 'Update members'}
          </button>
        </div>
      </div>

      {/* Admin Password Modal */}
      {showPasswordModal && (
        <AdminPasswordModal
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordConfirm}
          action="send this update"
          label="Admin Password"
        />
      )}
    </div>
  );
}

export default function Dashboard({ hideBudget = false, member = null, onCreateTask = null, onNavigateToNotes = null, openTaskId = null }) {
  const { tasks, team, activity, STAGE_COLORS, STAGE_BG, STAGES, updateTaskStage, deleteTask, markTaskPaid, fmt, scheduledTasks, addScheduledTask, removeScheduledTask, createTask, refreshTrigger, addActivity, broadcasts, setBroadcasts, updateBroadcast, TAGS, CATEGORIES, workspaceId, currentUser, notes: globalNotes } = useApp();

  // OPTIMIZATION: Memoize visible broadcasts to prevent excessive filtering on every render
  const visibleBroadcasts = useMemo(() => {
    return getVisibleBroadcasts(broadcasts, currentUser);
  }, [broadcasts, currentUser.role, currentUser.userRole, currentUser.uid]);

  // Determine if this is a shared calendar based on the dashboard type
  // Admin Dashboard (member = null) → shared calendar for ALL users
  // Management Dashboard (member exists, hideBudget = true) → shared calendar for ALL users
  // Team Dashboard (member exists, hideBudget = false) → personal calendar per user
  const isSharedCalendar = !member || hideBudget;

  // React to refresh trigger - this will cause component to re-render with fresh data
  useEffect(() => {
    // Component will automatically re-render when refreshTrigger changes
    // In a real app, you might fetch fresh data here
  }, [refreshTrigger]);

  const [filter, setFilter]         = useState('Active');
  const [modalTask, setModalTask]   = useState(null);
  const [stageSelect, setStageSelect] = useState({});
  const [memberStage, setMemberStage] = useState({});
  const [updating, setUpdating]     = useState(null);
  const [updatingMember, setUpdatingMember] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showComposeUpdate, setShowComposeUpdate] = useState(false);
  const [updatesDisplayLimit, setUpdatesDisplayLimit] = useState(10); // For expanded panel pagination
  const [viewBroadcast, setViewBroadcast] = useState(null); // { id, title, message, to, time } | null
  
  // ⭐ CRITICAL: Update modalTask when tasks array changes (real-time updates)
  // This ensures the modal shows the latest member stages when team members update from Team Dashboard
  useEffect(() => {
    if (modalTask) {
      const updatedTask = tasks.find(t => t.id === modalTask.id);
      if (updatedTask) {

        // Always update to ensure we have the latest data
        setModalTask(updatedTask);
      }
    }
  }, [tasks, modalTask?.id]); // Re-run when tasks array changes or modalTask.id changes
  
  // Open task modal when openTaskId is provided (from search)
  useEffect(() => {
    if (openTaskId) {
      const task = tasks.find(t => t.id === openTaskId);
      if (task) {

        setModalTask(task);
      }
    }
  }, [openTaskId, tasks]);
  
  // Debug: Log when viewBroadcast changes
  useEffect(() => {

  }, [viewBroadcast]);
  const [chatTask, setChatTask] = useState(null);
  const [readUpdateIds, setReadUpdateIds] = useState(new Set());

  // Load read update IDs from Firestore (consistent with team member dashboard)
  useEffect(() => {
    if (!workspaceId || !currentUser?.uid) return;

    const ref = doc(db, `workspaces/${workspaceId}/userReadState`, currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const ids = snap.data().readUpdateIds || [];

        setReadUpdateIds(new Set(ids));
      } else {

        setReadUpdateIds(new Set());
      }
    }, (error) => {

    });
    return unsub;
  }, [workspaceId, currentUser?.uid]);

  const markUpdateRead = (id) => {

    setReadUpdateIds(prev => {
      const next = new Set(prev);
      next.add(id);

      // Save to Firestore instead of localStorage
      if (workspaceId && currentUser?.uid) {

        setDoc(
          doc(db, `workspaces/${workspaceId}/userReadState`, currentUser.uid),
          { readUpdateIds: [...next], updatedAt: serverTimestamp() },
          { merge: true }
        ).then(() => {

        }).catch((error) => {

        });
      }
      return next;
    });
  };
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const tasksPerPage = 10;

  // Merge scheduled tasks with regular tasks - with visibility filtering
  const allTasks = [...tasks, ...scheduledTasks.filter((t) => {
    // Scheduled tasks visibility:
    // 1. Admin users can see all scheduled tasks
    // 2. Management users can only see their own scheduled tasks
    const isAdmin = currentUser?.userRole === 'admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Administrator';
    const isManagement = currentUser?.userRole === 'management' || currentUser?.role === 'Management' || currentUser?.role?.toLowerCase().includes('management') || currentUser?.role?.toLowerCase().includes('manager');
    
    if (isAdmin) {
      return true;
    } else if (isManagement) {
      const createdByUid = t.createdBy?.uid;
      const createdByMemberId = t.createdBy?.memberId;
      const currentUid = currentUser?.uid;
      const currentMemberId = currentUser?.memberId || currentUser?.id;
      
      return createdByUid === currentUid || String(createdByMemberId) === String(currentMemberId);
    } else {
      return false;
    }
  })];

  // Function to extract dominant color from image and create light background
  const getImageBasedBg = (imageUrl, fallbackBg) => {
    if (!imageUrl || !imageUrl.startsWith('data:image')) {
      return fallbackBg;
    }
    
    // This will be calculated on first render and cached
    // For now, return fallback - we'll enhance this with actual color extraction
    return fallbackBg;
  };

  // Function to lighten a color for background use
  const lightenColor = (color, opacity = 0.15) => {
    if (!color || !color.startsWith('#')) return '#F0F2F8';
    
    // Extract RGB values
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Create a light version by blending with white
    const lightR = Math.round(r + (255 - r) * (1 - opacity));
    const lightG = Math.round(g + (255 - g) * (1 - opacity));
    const lightB = Math.round(b + (255 - b) * (1 - opacity));
    
    return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
  };

  // Enrich tasks with full tag and category data (including images) - MEMOIZED to prevent excessive re-renders
  const enrichedTasks = useMemo(() => {
    return allTasks.map(task => {
      const enrichedTask = { ...task };
      
      // Enrich tags with full data including images
      if (task.tags && task.tags.length > 0 && TAGS && TAGS.length > 0) {
        enrichedTask.tags = task.tags.map(taskTag => {
          const fullTag = TAGS.find(t => t.id === taskTag.id);
          if (fullTag) {
            const tagImage = fullTag.image || fullTag.icon;
            const tagColor = fullTag.color || taskTag.color;
            // Use saved bg or generate if not available
            const lightBg = fullTag.bg || lightenColor(tagColor, 0.15);
            return { ...taskTag, image: tagImage, emoji: fullTag.emoji || taskTag.emoji, color: tagColor, bg: lightBg };
          }
          return taskTag;
        });
      }
      
      // Enrich category with full data including image
      if (task.category && CATEGORIES && CATEGORIES.length > 0) {
        const fullCategory = CATEGORIES.find(c => c.id === task.category.id);
        if (fullCategory) {
          const categoryImage = fullCategory.image || fullCategory.icon;
          const categoryColor = fullCategory.color || task.category.color;
          // Use saved bg or generate if not available
          const lightBg = fullCategory.bg || lightenColor(categoryColor, 0.15);
          enrichedTask.category = { ...task.category, image: categoryImage, emoji: fullCategory.emoji || task.category.emoji, color: categoryColor, bg: lightBg };
        }
      }
      
      return enrichedTask;
    });
  }, [allTasks, TAGS, CATEGORIES]);

  const activeTasks = enrichedTasks.filter(t => t.stage !== 'Complete');
  const upcoming    = [...activeTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3);

  let filtered = enrichedTasks.filter(t => {
    return filter === 'Active' ? t.stage !== 'Complete' : filter === 'Completed' ? t.stage === 'Complete' : true;
  }).sort((a, b) => {
    // Sort by most recent date (updatedAt or createdAt) - newest first
    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : (a.updatedAt ? new Date(a.updatedAt) : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)));
    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : (b.updatedAt ? new Date(b.updatedAt) : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)));
    return dateB - dateA; // Descending order (newest first)
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

  // Handle page change with loading animation
  const handlePageChange = (newPage) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    
    setPageLoading(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => {
        setPageLoading(false);
      }, 400); // 400ms skeleton display for pagination
    }, 50);
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
                const deadline = new Date(task.extendedDeadline || task.deadline);
                const overdue = deadline < new Date();
                const days = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                const dateLabel = overdue ? (Math.abs(days) === 0 ? 'Late' : `${Math.abs(days)}d late`) : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                        {task.members.slice(0, 3).map((m, idx) => (
                          <Avatar key={m.id} member={m} size={20} style={{ border: '2px solid var(--bg-surface)', marginLeft: idx === 0 ? 0 : -6, zIndex: task.members.length - idx }} />
                        ))}
                        {task.members.length > 3 && <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-subtle)', border: '2px solid var(--bg-surface)', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: 'var(--text-muted)' }}>+{task.members.length - 3}</div>}
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || pageLoading}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: (currentPage === 1 || pageLoading) ? 'not-allowed' : 'pointer',
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || pageLoading}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: (currentPage === totalPages || pageLoading) ? 'not-allowed' : 'pointer',
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
              {pageLoading ? (
                // Skeleton loading for pagination
                <>
                  {[0,1,2,3,4,5,6,7,8,9].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid var(--border)' }}>
                      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div className="skeleton" style={{ width: '65%', height: 14, borderRadius: 6 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 20 }} />
                          <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 6 }} />
                        </div>
                      </div>
                      <div className="skeleton" style={{ width: 100, height: 13, borderRadius: 6 }} />
                      <div style={{ display: 'flex' }}>
                        <div className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                        <div className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%', marginLeft: -6 }} />
                        <div className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%', marginLeft: -6 }} />
                      </div>
                      <div className="skeleton" style={{ width: 80, height: 15, borderRadius: 6 }} />
                    </div>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={26} color="var(--text-muted)" strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>
                      {filter === 'Completed' ? 'No completed tasks yet' : 'No tasks found'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {filter === 'Completed'
                        ? 'Tasks will appear here once marked as complete.'
                        : 'Create a new task to get started.'}
                    </div>
                  </div>
                  {filter !== 'Completed' && onCreateTask && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCreateTask(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#3B5BFC', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,91,252,0.25)' }}
                    >
                      <Plus size={14} /> Create Task
                    </button>
                  )}
                </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: isComplete ? '#12C479' : '#3B5BFC', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>#{task.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{task.title}</span>
                        <button
                          onClick={e => { e.stopPropagation(); if (!task.isScheduled) setChatTask(task); }}
                          title={task.isScheduled ? "Chat not available for scheduled tasks" : "Open chat"}
                          style={{ background: 'none', border: 'none', cursor: task.isScheduled ? 'not-allowed' : 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: task.isScheduled ? 'var(--text-muted)' : '#3B5BFC', position: 'relative', transition: 'all 0.2s', opacity: task.isScheduled ? 0.5 : 1 }}
                          onMouseEnter={e => { if (!task.isScheduled) { e.currentTarget.style.color = '#3B5BFC'; e.currentTarget.querySelector('svg').style.fill = '#3B5BFC'; } }}
                          onMouseLeave={e => { if (!task.isScheduled) { e.currentTarget.style.color = '#3B5BFC'; e.currentTarget.querySelector('svg').style.fill = 'none'; } }}
                        >
                          <MessageSquare size={17} style={{ transition: 'fill 0.2s' }} />
                          {/* Unread indicator dot */}
                          {task.unreadCount > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: -1,
                              right: -1,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#EF4444',
                              border: '1.5px solid var(--bg-surface)',
                            }} />
                          )}
                        </button>
                        {task.category && (() => {
                          // Use enriched background or fallback
                          const bgColor = task.category.bg || '#F0F2F8';
                          return (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: bgColor, color: '#1A1D2E', fontWeight: 700, border: '1px solid #E8EAEF', flexShrink: 0, marginLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {task.category.image ? (
                                task.category.image.startsWith('data:image') ? (
                                  <img src={task.category.image} alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontSize: 13 }}>{task.category.image}</span>
                                )
                              ) : (
                                <span style={{ fontSize: 13 }}>{task.category.emoji}</span>
                              )}
                              <span>{task.category.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: STAGE_BG[task.stage], color: STAGE_COLORS[task.stage], flexShrink: 0 }}>{task.stage}</span>
                        {task.tags && task.tags.slice(0, 2).map(tag => {
                          // Use enriched background or fallback
                          const bgColor = tag.bg || '#F0F2F8';
                          return (
                            <span key={tag.label} style={{ fontSize: 11, padding: '3px 7px', borderRadius: 20, background: bgColor, color: '#1A1D2E', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #E8EAEF' }}>
                              {tag.image ? (
                                tag.image.startsWith('data:image') ? (
                                  <img src={tag.image} alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontSize: 13 }}>{tag.image}</span>
                                )
                              ) : (
                                <span style={{ fontSize: 13 }}>{tag.emoji}</span>
                              )}
                              <span>{tag.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Due date - right side center */}
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 100 }}>
                      <span style={{ fontSize: 11, color: overdueFlag ? '#EF4444' : days <= 2 ? '#F97316' : '#1A1D2E', fontWeight: overdueFlag || days <= 2 ? 700 : 600, display: 'block' }}>
                        {isComplete ? new Date(task.paidOn || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : overdueFlag ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${task.extendedDeadline ? 'Extended: ' : 'Due '}${new Date(task.extendedDeadline || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                      {task.isScheduled && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#3B5BFC', background: '#EEF2FF', padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 4 }}>
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Member stack */}
                    <div style={{ display: 'flex', flexShrink: 0 }}>
                      {task.members.slice(0, 3).map((m, idx) => (
                        <Avatar key={m.id} member={m} size={22} style={{ border: '2px solid var(--bg-surface)', marginLeft: idx === 0 ? 0 : -6, zIndex: task.members.length - idx }} />
                      ))}
                      {task.members.length > 3 && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-subtle)', border: '2px solid var(--bg-surface)', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: 'var(--text-muted)' }}>+{task.members.length - 3}</div>}
                    </div>

                    {/* Budget */}
                    {!hideBudget && (
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isComplete ? '#12C479' : '#1A1D2E' }}>₹ {task.totalBudget?.toLocaleString()}</div>
                      </div>
                    )}

                    {/* Payment status — management only */}
                    {hideBudget && member && task.members.some(m => m.id === member.id) && (() => {
                      const mem = task.members.find(m => m.id === member.id);
                      return (
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: task.paid ? '#12C479' : '#1A1D2E' }}>
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
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflowY: 'auto', position: 'relative' }}>

          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '4px', border: '1.5px solid var(--border)', flexShrink: 0 }}>
            <MiniCalendar 
              tasks={tasks} 
              selectedCalendarDate={selectedCalendarDate}
              orgId={workspaceId}
              userId={currentUser?.uid || currentUser?.id}
              isSharedCalendar={isSharedCalendar}
              onDateSelect={(day, month, year) => {
                setSelectedCalendarDate({ day, month, year });
                setCurrentPage(1);
              }} 
            />
          </div>

          {/* Task Overview + Updates side by side */}
          <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, position: 'relative' }}>

            <TaskDonut tasks={tasks} />

            {/* Updates card — always visible */}
            <div
              onClick={(e) => {
                // Don't open Updates panel if clicking on a broadcast item (it will handle opening itself)
                const clickedBroadcast = e.target.closest('[data-broadcast-item="true"]');
                if (!clickedBroadcast && !showUpdates) {
                  setShowUpdates(true);
                }
              }}
              style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 22px', border: `1.5px solid ${showUpdates ? '#3B5BFC' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { if (!showUpdates) { e.currentTarget.style.boxShadow = '0 4px 18px rgba(59,91,252,0.10)'; e.currentTarget.style.borderColor = '#3B5BFC'; }}}
              onMouseLeave={e => { if (!showUpdates) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}}
            >
              {/* Header */}
              {(() => {
                // ⭐ Use visibleBroadcasts directly instead of filtering activity
                // This ensures broadcasts persist and show read/unread status correctly
                const allItems = visibleBroadcasts;

                const count = allItems.length;
                const unread = allItems.filter(b => !readUpdateIds.has(b.id)).length;
                return (
                  <div style={{ marginBottom: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ position: 'relative', width: 30, height: 30, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={14} color="#3B5BFC" strokeWidth={2.5} />
                        {unread > 0 && !showUpdates && (
                          <div style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--bg-surface)' }}>
                            {unread}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Updates</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Recent
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setShowComposeUpdate(true); }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,91,252,0.3)', flexShrink: 0 }}>
                        <Plus size={14} color="#fff" strokeWidth={2.5} />
                      </button>
                      {!showUpdates && <ChevronRight size={14} color="#3B5BFC" />}
                    </div>
                  </div>
                );
              })()}
              {/* List preview */}
              {(() => {
                // ⭐ Use visibleBroadcasts directly - these are already filtered by role and join date
                const allItems = visibleBroadcasts;
                
                // ⭐ COLLAPSED VIEW: Show only UNREAD messages (max 10)
                const unreadItems = allItems.filter(b => !readUpdateIds.has(b.id));
                const items = unreadItems.slice(0, 10); // Limit to 10 unread messages

                if (items.length === 0) return (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No unread updates</div>
                );
                
                const displayItems = items;
                
                return (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {displayItems.map((broadcast, i) => {
                      const cfg = TYPE_ICONS.broadcast;
                      const ActIcon = cfg.icon;
                      
                      return (
                        <div 
                          key={broadcast.id}
                          data-broadcast-item="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            markUpdateRead(broadcast.id);
                            setShowUpdates(true); // Expand the Updates panel
                          }}
                          style={{ display: 'flex', gap: 10, paddingBottom: i < items.length - 1 ? 12 : 0, cursor: 'pointer' }}
                        >
                          <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: '#F5F3FF', border: '1.5px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ActIcon size={11} color={cfg.color} strokeWidth={2.5} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', marginBottom: 2 }}>{broadcast.title}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Team Update</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                              {new Date(broadcast.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Updates expanded — covers full right column */}
            {showUpdates && (
              <div style={{
                position: 'fixed', bottom: '2%', right: '1%',
                width: '26%', height: '70%',
                background: 'var(--bg-surface)', borderRadius: 18,
                border: '1.5px solid var(--border)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                zIndex: 200,
                boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
                animation: 'smoothReveal 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}>
                <style>{`@keyframes smoothReveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                {/* Header */}
                <div style={{ padding: '16px 20px 14px', borderBottom: '1.5px solid var(--border-light)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={14} color="#3B5BFC" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Updates</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Recent</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setShowComposeUpdate(true)}
                      style={{ width: 28, height: 28, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,91,252,0.3)', flexShrink: 0 }}>
                      <Plus size={13} color="#fff" strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setShowUpdates(false)} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} color="var(--text-secondary)" />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(() => {
                    // ⭐ Use visibleBroadcasts directly - show ALL broadcasts (read + unread)
                    // Sort by time (newest first)
                    const allItems = [...visibleBroadcasts].sort((a, b) => {
                      const timeA = a.time instanceof Date ? a.time : new Date(a.time);
                      const timeB = b.time instanceof Date ? b.time : new Date(b.time);
                      return timeB - timeA; // Newest first
                    });
                    
                    // ⭐ EXPANDED VIEW: Show all messages with pagination
                    const items = allItems.slice(0, updatesDisplayLimit);
                    const hasMore = allItems.length > updatesDisplayLimit;
                    
                    const anyUnread = items.some(b => !readUpdateIds.has(b.id));

                    if (allItems.length === 0) return (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8, paddingTop: 20 }}>
                        <RefreshCw size={32} color="#C4C9D9" />
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>No updates available</div>
                      </div>
                    );
                    return (
                      <>
                        {anyUnread && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <button
                              onClick={() => {
                                const allIds = items.map(b => b.id);
                                setReadUpdateIds(prev => {
                                  const next = new Set([...prev, ...allIds]);
                                  // Save to Firestore instead of localStorage
                                  if (workspaceId && currentUser?.uid) {
                                    setDoc(
                                      doc(db, `workspaces/${workspaceId}/userReadState`, currentUser.uid),
                                      { readUpdateIds: [...next], updatedAt: serverTimestamp() },
                                      { merge: true }
                                    ).catch(() => {});
                                  }
                                  return next;
                                });
                              }}
                              style={{ fontSize: 10, fontWeight: 700, color: '#3B5BFC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
                            >
                              Mark all read
                            </button>
                          </div>
                        )}
                        {items.map((broadcast, i) => {
                          const cfg = TYPE_ICONS.broadcast;
                          const ActIcon = cfg.icon;
                          const isUnread = !readUpdateIds.has(broadcast.id);
                          
                          return (
                            <div key={broadcast.id} onClick={() => {
                              if (isUnread) markUpdateRead(broadcast.id);
                              setViewBroadcast(broadcast);
                            }} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 10, background: isUnread ? '#F5F3FF' : 'transparent', marginBottom: i < items.length - 1 ? 4 : 0, cursor: 'pointer', transition: 'background 0.2s' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isUnread ? '#fff' : 'var(--bg-subtle)', border: `1.5px solid ${isUnread ? '#DDD6FE' : 'var(--border-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ActIcon size={12} color={cfg.color} strokeWidth={2.5} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{broadcast.title}</div>
                                  {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Team Update</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {new Date(broadcast.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* Load More button */}
                        {hasMore && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                            <button
                              onClick={() => setUpdatesDisplayLimit(prev => prev + 10)}
                              style={{
                                padding: '8px 16px',
                                background: '#EEF2FF',
                                border: '1.5px solid #3B5BFC',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#3B5BFC',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#3B5BFC';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#EEF2FF';
                                e.currentTarget.style.color = '#3B5BFC';
                              }}
                            >
                              Load More
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ── Task Detail Modal ── */}
      {modalTask && <AdminTaskModal key={`${modalTask.id}-${modalTask.members?.map(m => `${m.id}:${m.stage}`).join('-')}`} task={modalTask} onClose={() => { setModalTask(null); setConfirmDelete(false); }} hideBudget={hideBudget} onCreateScheduled={(task) => { createTask(task); removeScheduledTask(task.id); }} onCancelScheduled={(id) => removeScheduledTask(id)} managementMode={member !== null} currentUser={member || currentUser} onNavigateToTask={(taskId, scribeId) => {

        if (onNavigateToNotes && scribeId) {
          onNavigateToNotes(scribeId);
        }
      }} />}
      {chatTask && <TaskChatPanel task={chatTask} onClose={() => setChatTask(null)} currentUser={currentUser} team={team} />}

      {/* ── Broadcast View Modal ── */}
      {viewBroadcast && (
        <BroadcastViewModal
          broadcast={viewBroadcast}
          onClose={() => setViewBroadcast(null)}
          canEdit={(() => {
            // Check if user created the broadcast (for non-admin users)
            if (member !== null && viewBroadcast.createdBy !== currentUser?.uid) return false;
            
            // Check if broadcast was created today (same day) - applies to ALL users including admin
            try {
              const broadcastDate = viewBroadcast.time instanceof Date 
                ? viewBroadcast.time 
                : viewBroadcast.createdAt instanceof Date
                ? viewBroadcast.createdAt
                : new Date(viewBroadcast.time || viewBroadcast.createdAt);
              
              const today = new Date();
              
              // Reset time to midnight for accurate day comparison
              const broadcastDay = new Date(broadcastDate.getFullYear(), broadcastDate.getMonth(), broadcastDate.getDate());
              const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              
              // Compare timestamps (same day if timestamps are equal)
              const isSameDay = broadcastDay.getTime() === todayDay.getTime();

              return isSameDay;
            } catch (error) {

              return false; // If date check fails, don't allow edit
            }
          })()}
          showCreatorInfo={member === null}
          onSave={(id, updates) => {
            updateBroadcast(id, updates);
            setViewBroadcast(prev => ({ ...prev, ...updates }));
          }}
        />
      )}

      {/* ── Compose Update Modal ── */}
      {showComposeUpdate && (
        <ComposeUpdateModal
          onClose={() => setShowComposeUpdate(false)}
          team={team}
          onSend={async ({ title: updateTitle, message, recipientMode, selectedMembers, recipientCount }) => {
            const to = recipientMode === 'all' ? 'All members' : `${recipientCount} member${recipientCount !== 1 ? 's' : ''}`;
            
            // Get selected roles from selected members
            const selectedRoles = recipientMode === 'role' 
              ? [...new Set(team.filter(m => selectedMembers.includes(m.id)).map(m => m.role))]
              : [];
            
            const broadcastData = {
              title: updateTitle,
              message,
              to,
              recipientMode,
              selectedMembers,
              selectedRoles,
              recipientCount,
              createdBy: currentUser?.uid || null,
              creatorInfo: currentUser ? {
                name: currentUser.name || 'Admin',
                avatar: currentUser.avatar || '👤',
                avatarImg: currentUser.avatarImg || null,
                color: currentUser.color || '#3B5BFC',
                role: currentUser.role || 'admin'
              } : null
            };

            try {
              // Save to Firebase
              const broadcastId = await createBroadcast(workspaceId, broadcastData);

              // Wait a moment for the broadcast listener to receive the new broadcast
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Add to activity feed with the same ID as the broadcast
              addActivity('broadcast', updateTitle, `${message} · Sent to ${to}`, null, null, broadcastId);

              notify.success('Update');
            } catch (error) {

              notify.error('Failed to send update');
            }
          }}
        />
      )}
    </div>
  );
}
