import React, { useState, useEffect, useRef, useMemo } from 'react';
import { notify } from '../../lib/notify';
import { CheckCircle, DollarSign, RotateCcw, Calendar, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, RefreshCw, Clock, Plus, X, MessageSquare, Send } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useLottie } from 'lottie-react';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { subscribeToCalendarEvents, addCalendarEvent, removeCalendarEvent } from '../../lib/calendarService';
import { getVisibleBroadcasts } from '../../lib/broadcastService';

function useDonutWelcomeAnim() {
  const [data, setData] = useState(null);
  useEffect(() => { import('../../lottie/Welcome (1).json').then(m => setData(m.default)); }, []);
  return data;
}
import Avatar from '../../components/Avatar';
import TaskChatPanel from '../../components/TaskChatPanel';
import { MemberHomeSkeleton } from '../../components/Skeleton';

const TYPE_ICONS = {
  complete:  { icon: CheckCircle, bg: '#E8FBF1', color: '#12C479' },
  review:    { icon: RotateCcw,   bg: '#FFF7ED', color: '#F97316' },
  payment:   { icon: DollarSign,  bg: '#E8FBF1', color: '#12C479' },
  update:    { icon: AlertCircle, bg: '#FFF1F1', color: '#EF4444' },
  accept:    { icon: CheckCircle, bg: '#EEF2FF', color: '#3B5BFC' },
  broadcast: { icon: Send,        bg: '#F5F3FF', color: '#7C3AED' },
  start:     { icon: CheckCircle, bg: '#EEF2FF', color: '#3B5BFC' },
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MEMBER_STAGES = ['New', 'Start', 'Issue', 'Review A', 'Review B'];
const TASK_FILTERS = ['Active', 'Completed', 'All'];
const STAGE_DESCRIPTIONS = {
  Issue: 'Report a problem or blocker',
  'Review A': 'Submit your work for first review',
  'Review B': 'Submit for final review',
};

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

function MiniCalendar({ tasks, member, onDateSelect, orgId, userId }) {
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

  // Subscribe to calendar events from Firebase (personal calendar for team members)
  useEffect(() => {
    if (!orgId || !userId) {

      return;
    }

    const unsubscribe = subscribeToCalendarEvents(orgId, userId, false, (loadedEvents) => {

      setEvents(loadedEvents);
    });
    
    return () => {

      unsubscribe();
    };
  }, [orgId, userId]);

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
        
        await addCalendarEvent(orgId, userId, false, newEvent); // false = personal calendar
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
      await removeCalendarEvent(orgId, userId, false, event); // false = personal calendar
      notify.success('Event deleted');
      setSelectedEvent(null);
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
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E8EAEF', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="#6B7280" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1D2E', letterSpacing: '0.01em' }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E8EAEF', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={18} color="#6B7280" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#9CA3AF', paddingBottom: 6, letterSpacing: '0.02em' }}>{d}</div>)}
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
          
          let bgColor = 'transparent';
          let textColor = '#374151';
          let fontWeight = 400;
          
          if (isToday) {
            bgColor = '#3B5BFC';
            textColor = '#fff';
            fontWeight = 700;
          } else if (isSelected) {
            bgColor = '#EEF2FF';
            textColor = '#3B5BFC';
            fontWeight = 700;
          }
          
          return (
            <button key={day} onClick={() => { 
              setSelectedDay(day);
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
      <div style={{ marginTop: 10, padding: '8px 10px', background: '#F0F2F8', borderRadius: 10 }}>
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
                        background: selectedEvent?.id === event.id ? '#FEE2E2' : '#fff', 
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: selectedEvent?.id === event.id ? '1px solid #EF4444' : '1px solid transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: event.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
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
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', fontStyle: 'italic' }}>
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

function MemberTaskDonut({ tasks, member }) {
  const [hovered, setHovered] = useState(null);
  const { showDonutWelcome, setShowDonutWelcome, hasSeenDonutWelcome } = useApp();
  const [donutFading, setDonutFading] = useState(false);
  const donutAnimData = useDonutWelcomeAnim();

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

  // All member tasks
  const myTasks = tasks.filter(t => t.members.some(m => String(m.id) === String(member.id)));
  
  // Completed: Tasks completed in last 7 days
  const completed = myTasks.filter(t => {
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
  const active = myTasks.filter(t => {
    if (t.stage === 'Complete') return false;
    const deadline = new Date(t.extendedDeadline || t.deadline);
    return deadline >= sevenDaysAgo;
  }).length;

  // Pending: ALL pending tasks from any date (overdue tasks)
  const pending = myTasks.filter(t => {
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
  const centerColor = hoveredData ? hoveredData.color : '#1A1D2E';

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '1.5px solid #E8EAEF', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1D2E' }}>Task Overview</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Completed • Active • Pending</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', background: '#F0F2F8', padding: '3px 9px', borderRadius: 6, border: '1px solid #E8EAEF' }}>All Tasks</span>
      </div>

      {/* Donut */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={displayData}
                cx="50%" cy="50%" innerRadius={60} outerRadius={88}
                dataKey="value" strokeWidth={2} stroke="#fff"
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
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginTop: 4 }}>{centerLabel}</span>
          </div>
        </div>
      </div>

      {/* Welcome lottie overlay - covers full card */}
      {showDonutWelcome && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', opacity: donutFading ? 0 : 1, transition: 'opacity 0.5s ease', borderRadius: 18, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutLottie />
        </div>
      )}

    </div>
  );
}

export default function MemberHome({ member, onNavigateToNotes = null, openTaskId = null }) {
  const { tasks, team, activity, financials, STAGE_COLORS, STAGE_BG, STAGES, updateTaskStage, fmt, addTaskRequest, refreshTrigger, broadcasts, workspaceId, currentUid, TAGS, CATEGORIES, notes: globalNotes } = useApp();

  const visibleBroadcasts = useMemo(() => {
    return getVisibleBroadcasts(broadcasts, member);
  }, [broadcasts, member.role, member.userRole, member.uid, member.joinedDate, member.createdAt]);

  // React to refresh trigger - this will cause component to re-render with fresh data
  useEffect(() => {
    // Component will automatically re-render when refreshTrigger changes
    // In a real app, you might fetch fresh data here
  }, [refreshTrigger]);

  // Upcoming
  const myTasks     = tasks.filter(t => {
    // ? Exclude all tasks if member is on hold
    if (member.isOnHold) return false;
    
    return t.members.some(m => String(m.id) === String(member.id));
  });
  
  // Task filtering complete
  
  // Enrich tasks with full tag and category data (including images and saved bg)
  const enrichedTasks = myTasks.map(task => {
    const enrichedTask = { ...task };
    
    // ? Enrich members with latest team data to ensure budget and profile info is current
    if (task.members && task.members.length > 0) {
      enrichedTask.members = task.members.map(taskMember => {
        // Find the latest team member data
        const teamMember = team.find(t => String(t.id) === String(taskMember.id));
        if (teamMember) {
          // Merge task member data with latest team data, keeping task-specific fields like budget and stage
          return {
            ...teamMember, // Latest profile data (name, avatar, color, etc.)
            ...taskMember, // Task-specific data (budget, stage, etc.)
            // Ensure critical fields are preserved
            id: taskMember.id,
            budget: taskMember.budget,
            stage: taskMember.stage
          };
        }
        return taskMember; // If not found in team, keep original
      });
    }
    
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

  const activeTasks = enrichedTasks.filter(t => t.stage !== 'Complete');
  const upcoming    = [...activeTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 4);

  // Full task list state
  const [filter, setFilter]       = useState('Active');
  const [modalTask, setModalTask] = useState(null);
  const [stageSelect, setStageSelect] = useState({});
  const [issueText, setIssueText] = useState({});
  const [updating, setUpdating]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const tasksPerPage = 10;
  
  // Open task modal when openTaskId is provided (from search)
  useEffect(() => {
    if (openTaskId) {
      const taskToOpen = tasks.find(t => t.id === openTaskId);
      if (taskToOpen) {

        setModalTask(taskToOpen);
      }
    }
  }, [openTaskId, tasks]);
  
  // ? CRITICAL: Update modalTask when tasks array changes (real-time updates)
  // This ensures the modal shows the latest member stages after updates
  useEffect(() => {
    if (modalTask) {
      const updatedTask = tasks.find(t => t.id === modalTask.id);
      if (updatedTask) {
        // Always update to ensure we have the latest data
        setModalTask(updatedTask);
      }
    }
  }, [tasks, modalTask?.id]); // Re-run when tasks array changes
  
  // Task request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [viewBroadcast, setViewBroadcast] = useState(null);
  const [chatTask, setChatTask] = useState(null);
  const [readUpdateIds, setReadUpdateIds] = useState(new Set());
  const [updatesDisplayLimit, setUpdatesDisplayLimit] = useState(10); // For expanded panel pagination

  // Load read update IDs from Firestore
  useEffect(() => {
    if (!workspaceId || !member?.id) return;
    const ref = doc(db, `workspaces/${workspaceId}/memberReadState`, String(member.id));
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const ids = snap.data().readUpdateIds || [];
        setReadUpdateIds(new Set(ids));
      }
    }, () => {});
    return unsub;
  }, [workspaceId, member?.id]);

  const markUpdateRead = (id) => {
    setReadUpdateIds(prev => {
      const next = new Set(prev);
      next.add(id);
      // Write to Firestore
      if (workspaceId && member?.id) {
        setDoc(
          doc(db, `workspaces/${workspaceId}/memberReadState`, String(member.id)),
          { readUpdateIds: [...next], updatedAt: serverTimestamp() },
          { merge: true }
        ).catch(() => {});
      }
      return next;
    });
  };

  const filtered = enrichedTasks.filter(t => {
    return filter === 'Active' ? t.stage !== 'Complete' : filter === 'Completed' ? t.stage === 'Complete' : true;
  }).sort((a, b) => {
    // Sort by most recent date (updatedAt or createdAt) - newest first
    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : (a.updatedAt ? new Date(a.updatedAt) : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)));
    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : (b.updatedAt ? new Date(b.updatedAt) : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)));
    return dateB - dateA; // Descending order (newest first)
  });

  // Filter by selected calendar date
  const filteredByDate = selectedCalendarDate 
    ? filtered.filter(t => {
        const taskDate = new Date(t.deadline);
        return taskDate.getDate() === selectedCalendarDate.day && 
               taskDate.getMonth() === selectedCalendarDate.month && 
               taskDate.getFullYear() === selectedCalendarDate.year;
      })
    : filtered;

  const totalPages = Math.ceil(filteredByDate.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedTasks = filteredByDate.slice(startIndex, endIndex);
  
  const handleRequestTask = async () => {
    if (!requestTitle.trim()) return;
    
    try {
      await addTaskRequest({
        title: requestTitle.trim(),
        description: requestDescription.trim(),
        submittedBy: { 
          id: member.id, 
          name: member.name, 
          role: member.role, 
          avatar: member.avatar, 
          color: member.color,
          avatarImg: member.avatarImg || null,
          uid: currentUid
        },
      });
      
      setShowRequestModal(false);
      setRequestTitle('');
      setRequestDescription('');
      
      // Show success notification only after successful submission
      notify.taskRequestSubmitted(requestTitle.trim());
    } catch (error) {

      notify.error('Failed to submit task request');
    }
  };

  const counts = {
    Active: enrichedTasks.filter(t => t.stage !== 'Complete').length,
    Completed: enrichedTasks.filter(t => t.stage === 'Complete').length,
    All: enrichedTasks.length,
  };

  function handleStageUpdate(task) {
    const newStage = stageSelect[task.id];
    
    if (!newStage) {
      return;
    }
    
    // If selecting Issue stage, require issue text
    if (newStage === 'Issue' && !issueText[task.id]?.trim()) {
      alert('Please describe the issue before submitting.');
      return;
    }

    setUpdating(task.id);
    setTimeout(() => {
      // Pass issue text if stage is Issue
      const issueNote = newStage === 'Issue' ? issueText[task.id] : null;
      // Pass member name as actorName to properly record who updated the stage
      updateTaskStage(task.id, newStage, member.id, member.name, issueNote);
      setUpdating(null);
      setStageSelect(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      setIssueText(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      setModalTask(null);
    }, 700);
  }

  const isOverdue = (t) => new Date(t.extendedDeadline || t.deadline) < new Date() && t.stage !== 'Complete';
  const daysLeft  = (d, ext) => Math.ceil((new Date(ext || d) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* -- Single two-column layout filling full height -- */}
      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

        {/* LEFT: Upcoming Tasks (fixed) + My Tasks (fills rest, scrollable) */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

          {/* Upcoming Tasks - wrapped in one card with heading */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', overflow: 'hidden', flexShrink: 0 }}>
            {/* Heading */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #F0F2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={14} color="#3B5BFC" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1D2E' }}>Upcoming Tasks</div>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  background: '#EEF2FF',
                  border: 'none',
                  borderRadius: 10,
                  color: '#3B5BFC',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Task cards */}
            <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
              {upcoming.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="#3B5BFC" strokeWidth={1.8} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E' }}>No upcoming tasks</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>Your assigned tasks will appear here</div>
                </div>
              ) : upcoming.slice(0, 3).map(task => {
                const deadline = new Date(task.extendedDeadline || task.deadline);
                const overdue = deadline < new Date();
                const days = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                const dateLabel = overdue ? (Math.abs(days) === 0 ? 'Late' : `${Math.abs(days)}d late`) : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={task.id} style={{
                    flex: 1, background: overdue ? '#FFF5F5' : '#FAFBFF',
                    borderRadius: 12, border: `1.5px solid ${overdue ? '#FED7D7' : '#F0F2F8'}`,
                    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7,
                    position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: task.paid ? '#12C479' : '#F97316', background: task.paid ? '#E8FBF1' : '#FFF7ED', padding: '2px 7px', borderRadius: 20 }}>{task.paid ? 'Paid' : 'Pending'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#3B5BFC', padding: '2px 6px', borderRadius: 4 }}>#{task.id}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: overdue ? '#EF4444' : days <= 2 ? '#F97316' : '#9CA3AF', flexShrink: 0 }}>{dateLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Tasks - fills remaining height, scrollable inside */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 18, border: '1.5px solid #E8EAEF', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #F0F2F8', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={13} color="#3B5BFC" strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1D2E' }}>My Tasks</div>
                {selectedCalendarDate && (
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
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
              {filteredByDate.length > tasksPerPage && (
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      border: '1.5px solid #E8EAEF',
                      background: currentPage === 1 ? '#F0F2F8' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={12} color="#6B7280" />
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', minWidth: 40, textAlign: 'center' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      border: '1.5px solid #E8EAEF',
                      background: currentPage === totalPages ? '#F0F2F8' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={12} color="#6B7280" />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 3, background: '#F0F2F8', borderRadius: 9, padding: '3px' }}>
                {TASK_FILTERS.map(f => (
                  <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); setSelectedCalendarDate(null); }} style={{ padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#1A1D2E' : '#6B7280', boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {f} {f === 'Active' && <span style={{ fontSize: 10, fontWeight: 800, color: filter === f ? '#3B5BFC' : '#9CA3AF' }}>{counts[f]}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredByDate.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} color="#3B5BFC" strokeWidth={1.6} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2E', marginBottom: 5 }}>
                  {filter === 'Completed' ? 'No completed tasks' : 'No tasks assigned'}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
                  {filter === 'Completed' ? 'Tasks will appear here once marked complete' : 'Your admin will assign tasks to you'}
                </div>
              </div>
            </div>
          )}

          {paginatedTasks.map(task => {
            const mem = task.members.find(m => String(m.id) === String(member.id));
            
            const overdueFlag = isOverdue(task);
            const isComplete  = task.stage === 'Complete' || mem?.stage === 'Complete';
            const days = daysLeft(task.deadline, task.extendedDeadline);
            const currentStage = mem?.stage || task.stage;
            return (
              <div key={task.id} onClick={() => setModalTask(task)} style={{
                background: '#fff', borderRadius: 14,
                border: `1.5px solid ${overdueFlag ? '#FED7D7' : isComplete ? '#BBF7D0' : '#E8EAEF'}`,
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: isComplete ? '#ECFDF5' : overdueFlag ? '#FEF2F2' : STAGE_BG[currentStage], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isComplete ? <CheckCircle size={16} color="#12C479" strokeWidth={2.5} /> : overdueFlag ? <AlertCircle size={16} color="#EF4444" strokeWidth={2.5} /> : <Clock size={16} color={STAGE_COLORS[currentStage]} strokeWidth={2.5} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: isComplete ? '#12C479' : '#3B5BFC', padding: '2px 7px', borderRadius: 5 }}>#{task.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
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
                    <button
                      onClick={e => { e.stopPropagation(); setChatTask(task); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#3B5BFC', position: 'relative', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#3B5BFC'; e.currentTarget.querySelector('svg').style.fill = '#3B5BFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#3B5BFC'; e.currentTarget.querySelector('svg').style.fill = 'none'; }}
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
                          border: '1.5px solid #fff',
                        }} />
                      )}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (task.paused || task.isPaused) ? '#FFF7ED' : STAGE_BG[currentStage], color: (task.paused || task.isPaused) ? '#F97316' : STAGE_COLORS[currentStage] }}>{(task.paused || task.isPaused) ? 'Hold' : currentStage}</span>
                    {task.tags && task.tags.map(tag => {
                      const tagBg = tag.bg || (tag.color ? lightenColor(tag.color, 0.15) : '#F0F2F8');
                      const tagColor = tag.color || '#3B5BFC';
                      return (
                        <span key={tag.label} style={{ 
                          fontSize: 10, 
                          padding: '4px 10px', 
                          borderRadius: 50, 
                          background: tagBg, 
                          color: '#1A1D2E', 
                          fontWeight: 600,
                          border: `1px solid ${tagColor}30`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {tag.image && (
                            <img src={tag.image} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                          )}
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Due date - right side center */}
                <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 110 }}>
                  <span style={{ fontSize: 11, color: overdueFlag ? '#EF4444' : days <= 2 ? '#F97316' : '#9CA3AF', fontWeight: overdueFlag || days <= 2 ? 700 : 500, display: 'block' }}>
                    {isComplete ? new Date(task.paidOn || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : overdueFlag ? `[Warn] ${Math.abs(days)}d overdue` : days === 0 ? '[Fire] Due today' : days === 1 ? 'Tomorrow' : `${task.extendedDeadline ? 'Extended: ' : 'Due '}${new Date(task.extendedDeadline || task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </span>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isComplete ? '#12C479' : '#374151' }}>
                    ₹ {mem?.budget ? mem.budget.toLocaleString() : '0'}
                  </div>
                </div>
              </div>
            );
          })}
          </div>{/* end scrollable rows */}
          </div>{/* end My Tasks card */}
        </div>{/* end LEFT column */}

        {/* RIGHT: Calendar + Donut + Updates */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '4px', border: '1.5px solid #E8EAEF', flexShrink: 0 }}>
            <MiniCalendar 
              tasks={enrichedTasks} 
              member={member} 
              orgId={workspaceId}
              userId={currentUid}
              onDateSelect={(day, month, year) => {
                setSelectedCalendarDate({ day, month, year });
                setCurrentPage(1);
              }} 
            />
          </div>

          {/* Task Overview + Updates side by side */}
          <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, position: 'relative' }}>

            <MemberTaskDonut tasks={tasks} member={member} />

            {/* Updates card - always visible */}
            <div
              onClick={() => setShowUpdates(true)}
              style={{ flex: 1, background: '#fff', borderRadius: 18, padding: '18px 22px', border: `1.5px solid ${showUpdates ? '#3B5BFC' : '#E8EAEF'}`, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', cursor: showUpdates ? 'default' : 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { if (!showUpdates) { e.currentTarget.style.boxShadow = '0 4px 18px rgba(59,91,252,0.10)'; e.currentTarget.style.borderColor = '#3B5BFC'; }}}
              onMouseLeave={e => { if (!showUpdates) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E8EAEF'; }}}
            >
              {/* Header */}
              {(() => {
                const now = new Date();
                // ? Only show: broadcast messages (exclude all task-related activities)
                const TASK_STAGE_TYPES = new Set(['broadcast']);
                
                // ? Role-based activity filtering for team members
                const filterActivityByRole = (act) => {
                  // For broadcasts, check visibility
                  if (act.type === 'broadcast') {
                    const broadcastId = act.broadcastId || act.id;
                    return visibleBroadcasts.some(b => b.id === broadcastId);
                  }
                  
                  // Exclude all task-related activities
                  return false;
                };
                
                // Filter activity items - only show broadcasts
                const allItems = activity.filter(act => {
                  // Convert Firestore timestamp to Date if needed
                  const actTime = act.time?.toDate ? act.time.toDate() : new Date(act.time);
                  const isValidType = TASK_STAGE_TYPES.has(act.type);
                  
                  if (!isValidType) return false;
                  
                  // Apply role-based filtering
                  return filterActivityByRole(act);
                });
                
                const unread = allItems.filter(act => !readUpdateIds.has(act.id)).length;
                return (
                  <div style={{ marginBottom: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ position: 'relative', width: 30, height: 30, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={14} color="#3B5BFC" strokeWidth={2.5} />
                        {unread > 0 && !showUpdates && (
                          <div style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #fff' }}>
                            {unread}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1D2E' }}>Updates</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Recent</div>
                      </div>
                    </div>
                    {!showUpdates && <ChevronRight size={14} color="#3B5BFC" />}
                  </div>
                );
              })()}
              {/* List preview */}
              {(() => {
                const now = new Date();
                // ? Only show: broadcast messages (exclude all task-related activities)
                const TASK_STAGE_TYPES = new Set(['broadcast']);
                
                // ? Role-based activity filtering for team members
                const filterActivityByRole = (act) => {
                  // For broadcasts, check visibility
                  if (act.type === 'broadcast') {
                    const broadcastId = act.broadcastId || act.id;
                    return visibleBroadcasts.some(b => b.id === broadcastId);
                  }
                  
                  // Exclude all task-related activities
                  return false;
                };
                
                // Filter activity items - only show broadcasts
                const allItems = activity.filter(act => {
                  const actTime = act.time?.toDate ? act.time.toDate() : new Date(act.time);
                  const isValidType = TASK_STAGE_TYPES.has(act.type);
                  if (!isValidType) return false;
                  return filterActivityByRole(act);
                });
                
                // ? COLLAPSED VIEW: Show only UNREAD messages
                const items = allItems.filter(act => !readUpdateIds.has(act.id));
                
                if (items.length === 0) return (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10 }}>
                    <RefreshCw size={18} color="#9CA3AF" strokeWidth={1.8} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>No unread updates</div>
                  </div>
                );
                
                // Show all unread items in collapsed view (no limit)
                const displayItems = items;
                
                return (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {displayItems.map((act, i) => {
                      const cfg = TYPE_ICONS[act.type] || TYPE_ICONS.accept;
                      const ActIcon = cfg.icon;
                      const isBroadcast = act.type === 'broadcast';
                      const isUnread = !readUpdateIds.has(act.id);
                      const broadcastData = isBroadcast ? visibleBroadcasts.find(b => b.id === (act.broadcastId || act.id)) : null;
                      
                      return (
                        <div key={act.id} style={{ display: 'flex', gap: 10, padding: '6px 8px', borderRadius: 8, background: isUnread ? '#F5F3FF' : 'transparent', marginBottom: i < displayItems.length - 1 ? 3 : 0, cursor: isBroadcast ? 'pointer' : 'default' }} onClick={(e) => {
                          if (isBroadcast && broadcastData) {
                            e.stopPropagation();
                            markUpdateRead(act.id);
                            setShowUpdates(true); // Expand the Updates panel
                          }
                        }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: isUnread ? '#fff' : '#F0F2F8', border: `1.5px solid ${isUnread ? '#DDD6FE' : '#E8EAEF'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ActIcon size={10} color={cfg.color} strokeWidth={2.5} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>{act.title}</div>
                              {isUnread && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />}
                            </div>
                            <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Team Update</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                              {new Date(act.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Expanded panel */}
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
                <style>{`@keyframes smoothReveal { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
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
                  <button onClick={() => setShowUpdates(false)} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={13} color="var(--text-secondary)" />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(() => {
                    const now = new Date();
                    // ? Only show: broadcast messages (exclude all task-related activities)
                    const TASK_STAGE_TYPES = new Set(['broadcast']);
                    
                    // ? Role-based activity filtering for team members
                    const filterActivityByRole = (act) => {
                      // For broadcasts, check visibility
                      if (act.type === 'broadcast') {
                        const broadcastId = act.broadcastId || act.id;
                        return visibleBroadcasts.some(b => b.id === broadcastId);
                      }
                      
                      // Exclude all task-related activities
                      return false;
                    };
                    
                    // Filter activity items - show ALL broadcasts (read + unread)
                    const allItems = activity.filter(act => {
                      const actTime = act.time?.toDate ? act.time.toDate() : new Date(act.time);
                      const isValidType = TASK_STAGE_TYPES.has(act.type);
                      if (!isValidType) return false;
                      return filterActivityByRole(act);
                    });
                    
                    // ? EXPANDED VIEW: Show all messages with pagination
                    const items = allItems.slice(0, updatesDisplayLimit);
                    const hasMore = allItems.length > updatesDisplayLimit;
                    
                    const anyUnread = items.some(a => !readUpdateIds.has(a.id));
                    if (allItems.length === 0) return (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <RefreshCw size={32} color="#C4C9D9" />
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>No updates available</div>
                      </div>
                    );
                    return (
                      <>
                        {anyUnread && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <button onClick={() => {
                              const ids = items.map(a => a.id);
                              setReadUpdateIds(prev => {
                                const next = new Set([...prev, ...ids]);
                                if (workspaceId && member?.id) {
                                  setDoc(
                                    doc(db, `workspaces/${workspaceId}/memberReadState`, String(member.id)),
                                    { readUpdateIds: [...next], updatedAt: serverTimestamp() },
                                    { merge: true }
                                  ).catch(() => {});
                                }
                                return next;
                              });
                            }} style={{ fontSize: 10, fontWeight: 700, color: '#3B5BFC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}>Mark all read</button>
                          </div>
                        )}
                        {items.map((act, i) => {
                          const cfg = TYPE_ICONS[act.type] || TYPE_ICONS.accept;
                          const ActIcon = cfg.icon;
                          const isBroadcast = act.type === 'broadcast';
                          const isUnread = !readUpdateIds.has(act.id);
                          const broadcastData = isBroadcast ? visibleBroadcasts.find(b => b.id === (act.broadcastId || act.id)) : null;
                          
                          return (
                            <div key={act.id} onClick={() => {
                              if (isUnread) markUpdateRead(act.id);
                              if (isBroadcast && broadcastData) {
                                setViewBroadcast(broadcastData);
                              }
                            }} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 10, background: isUnread ? (isBroadcast ? '#F5F3FF' : '#EEF2FF') : 'transparent', marginBottom: i < items.length - 1 ? 4 : 0, cursor: 'pointer', transition: 'background 0.2s' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isUnread ? '#fff' : 'var(--bg-subtle)', border: `1.5px solid ${isUnread ? (isBroadcast ? '#DDD6FE' : '#3B5BFC40') : 'var(--border-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ActIcon size={12} color={cfg.color} strokeWidth={2.5} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: isBroadcast ? '#7C3AED' : 'var(--text-primary)' }}>{act.title}</div>
                                  {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: isBroadcast ? '#7C3AED' : '#3B5BFC', flexShrink: 0 }} />}
                                </div>
                                {isBroadcast ? (
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Team Update</div>
                                ) : (
                                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#3B5BFC', padding: '1px 5px', borderRadius: 4 }}>{taskRef}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{taskName}</span>
                                  </div>
                                )}
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {new Date(act.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* Load More button */}
                        {hasMore && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E8EAEF' }}>
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
        </div>{/* end RIGHT column */}

      </div>{/* end two-column layout */}

      {chatTask && <TaskChatPanel task={chatTask} onClose={() => setChatTask(null)} currentUser={member} team={[]} />}

      {/* -- Broadcast Read Modal -- */}
      {viewBroadcast && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1.5px solid #F0F2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={14} color="#7C3AED" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 }}>Update</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                    {new Date(viewBroadcast.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewBroadcast(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E8EAEF', background: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} color="#6B7280" />
              </button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1D2E', lineHeight: 1.3, marginBottom: 14 }}>{viewBroadcast.title}</div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{viewBroadcast.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* -- Task Modal -- */}
      {modalTask && (() => {
        // ? CRITICAL: Always use fresh task data from enrichedTasks (never use stale modalTask)
        const t = enrichedTasks.find(task => task.id === modalTask.id);
        
        // If task not found in enrichedTasks, close modal (task might have been deleted)
        if (!t) {
          setModalTask(null);
          return null;
        }

        // FIRST: Define all variables before using them in logs
        const mem = t.members.find(m => String(m.id) === String(member.id));
        const overdueFlag = isOverdue(t);
        const isComplete  = t.stage === 'Complete' || mem?.stage === 'Complete';
        const onHold = mem?.isOnHold || t.paused || t.isPaused || false;
        const days = daysLeft(t.deadline, t.extendedDeadline);
        const currentStage = mem?.stage || t.stage;
        
        // Members can select stages defined in MEMBER_STAGES
        // Prevent going back from Start to New
        const allowedNext = MEMBER_STAGES.filter(s => {
          // Don't show current stage as an option
          if (s === currentStage) return false;
          // If current stage is Start or later, don't allow going back to New
          if (currentStage !== 'New' && s === 'New') return false;
          return true;
        });
        
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

              {/* Modal header */}
              <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #F0F2F8', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: isComplete ? '#ECFDF5' : overdueFlag ? '#FEF2F2' : STAGE_BG[currentStage], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isComplete ? <CheckCircle size={18} color="#12C479" strokeWidth={2.5} /> : overdueFlag ? <AlertCircle size={18} color="#EF4444" strokeWidth={2.5} /> : <Clock size={18} color={STAGE_COLORS[currentStage]} strokeWidth={2.5} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: isComplete ? '#12C479' : '#3B5BFC', padding: '2px 8px', borderRadius: 5 }}>#{t.id}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1D2E' }}>{t.title}</span>
                    {t.category && (
                      <span style={{ 
                        fontSize: 10, 
                        padding: '4px 10px', 
                        borderRadius: 50, 
                        background: t.category.bg, 
                        color: '#1A1D2E', 
                        fontWeight: 700, 
                        border: `1px solid ${t.category.color}30`, 
                        flexShrink: 0, 
                        marginLeft: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {t.category.image && (
                          <img src={t.category.image} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                        )}
                        {t.category.label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: STAGE_BG[currentStage], color: STAGE_COLORS[currentStage] }}>{currentStage}</span>
                    <span style={{ fontSize: 12, color: overdueFlag ? '#EF4444' : days <= 2 ? '#F97316' : '#6B7280', fontWeight: 600 }}>
                      {isComplete ? new Date(t.paidOn || t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : overdueFlag ? `[Warn] ${Math.abs(days)}d overdue` : days === 0 ? '[Fire] Due today' : days === 1 ? 'Tomorrow' : `${t.extendedDeadline ? 'Extended: ' : 'Due '}${new Date(t.extendedDeadline || t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                    {t.tags && t.tags.map(tag => {
                      const tagBg = tag.bg || (tag.color ? lightenColor(tag.color, 0.15) : '#F0F2F8');
                      const tagColor = tag.color || '#3B5BFC';
                      return (
                        <span key={tag.label} style={{ 
                          fontSize: 10, 
                          padding: '4px 10px', 
                          borderRadius: 50, 
                          background: tagBg, 
                          color: '#1A1D2E', 
                          fontWeight: 600,
                          border: `1px solid ${tagColor}30`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {tag.image && (
                            <img src={tag.image} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                          )}
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => setModalTask(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F0F2F8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, color: '#6B7280' }}>
                  <X size={16} color="#6B7280" />
                </button>
              </div>

              {/* Modal body - scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Overview */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Task Overview</div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0 }}>{t.description}</p>
                </div>

                {/* Private instructions */}
                {mem?.memberDesc && (
                  <div style={{ background: 'linear-gradient(135deg, #F0F4FF, #F5F3FF)', border: '1.5px solid #C7D4FF', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#3B5BFC', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Instructions</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0 }}>{mem.memberDesc}</p>
                  </div>
                )}

                {/* Update Instructions - Show member-specific update note when member is in Update stage */}
                {mem?.stage === 'Update' && mem?.updateNote && (
                  <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Update Instructions</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.75, margin: 0 }}>{mem.updateNote}</p>
                  </div>
                )}

                {/* Team */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Team</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {t.members.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: m.id === member.id ? '#EEF2FF' : '#F8F9FF', border: `1.5px solid ${m.id === member.id ? '#C7D4FF' : '#E8EAEF'}`, borderRadius: 10, padding: '7px 12px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.avatarImg ? 'transparent' : m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', overflow: 'hidden', position: 'relative' }}>
                          {m.avatarImg ? (
                            <img src={m.avatarImg} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            m.avatar
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1D2E' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{m.role}</div>
                        </div>
                        {m.id === member.id && <span style={{ fontSize: 9, color: '#3B5BFC', fontWeight: 800, background: '#EEF2FF', padding: '1px 6px', borderRadius: 5 }}>You</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scribes - Only show scribes the member has access to */}
                {(() => {
                  if (!t.scribes || t.scribes.length === 0) return null;
                  
                  // Filter scribes based on member access
                  const accessibleScribes = t.scribes.filter((s) => {
                    // Check if member has access based on assignMode
                    if (s.assignMode === 'all') return true;
                    if (s.assignees && s.assignees.some(id => String(id) === String(member.id))) return true;
                    
                    return false;
                  });
                  
                  // Don't show section if no accessible scribes
                  if (accessibleScribes.length === 0) return null;
                  
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Scribes</div>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        {accessibleScribes.map((s, i) => {
                          const maxTitleLength = 25;
                          const displayTitle = s.title.length > maxTitleLength 
                            ? s.title.substring(0, maxTitleLength) + '...' 
                            : s.title;
                          
                          return (
                            <button key={i} type="button"
                              onClick={() => { 

                                // Find the actual note ID from globalNotes by matching title and taskId
                                const actualNote = (globalNotes || []).find(n => 
                                  n.taskId === t.id && 
                                  n.title === s.title && 
                                  n.type === s.type
                                );
                                const noteId = actualNote?.id;

                                setModalTask(null); 
                                if (onNavigateToNotes && noteId) {

                                  onNavigateToNotes(noteId);
                                } else {

                                }
                              }}
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'row',
                                alignItems: 'center', 
                                gap: 10, 
                                padding: '10px 12px', 
                                background: '#fff', 
                                borderRadius: 10, 
                                border: '1.5px solid #E8EAEF', 
                                cursor: 'pointer', 
                                textAlign: 'left', 
                                flex: '1 1 calc(50% - 4px)',
                                minWidth: 160,
                                maxWidth: 'calc(50% - 4px)',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = s.type === 'sheet' ? '#12C479' : '#7C3AED';
                                e.currentTarget.style.background = s.type === 'sheet' ? '#F0FDF4' : '#F5F3FF';
                                e.currentTarget.style.transform = 'translateX(2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#E8EAEF';
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                background: s.type === 'sheet' ? '#ECFDF5' : '#F5F3FF', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                flexShrink: 0,
                                border: `1.5px solid ${s.type === 'sheet' ? '#BBF7D0' : '#DDD6FE'}`
                              }}>
                                {s.type === 'sheet'
                                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12C479" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                }
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                                <div style={{ 
                                  fontSize: 12, 
                                  fontWeight: 700, 
                                  color: '#1A1D2E', 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  lineHeight: 1.3
                                }} title={s.title}>
                                  {displayTitle}
                                </div>
                                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>
                                  {s.assignMode === 'all' ? 'All members' : `${(s.assignees || []).length} member${(s.assignees || []).length !== 1 ? 's' : ''}`}
                                </div>
                              </div>
                              
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.type === 'sheet' ? '#12C479' : '#7C3AED'} strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Stage workflow */}
                {!isComplete && (
                  <div style={{ padding: '14px 16px', background: '#FAFBFF', borderRadius: 12, border: '1.5px solid #F0F2F8' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Stage Progress</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {STAGES.map((s, i) => {
                        const curIdx = STAGES.indexOf(currentStage);
                        const sIdx   = STAGES.indexOf(s);
                        const isPast = sIdx < curIdx;
                        const isCur  = s === currentStage;
                        const isActive = isPast || isCur;
                        
                        return (
                          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              background: isActive ? (isPast ? '#12C479' : '#3B5BFC') : '#fff',
                              border: `2px solid ${isActive ? (isPast ? '#12C479' : '#3B5BFC') : '#E8EAEF'}`,
                              fontSize: 11, 
                              fontWeight: 800, 
                              color: isActive ? '#fff' : '#9CA3AF',
                              transition: 'all 0.3s ease'
                            }}>
                              {isPast ? '?' : i + 1}
                            </div>
                            <span style={{ 
                              fontSize: 9, 
                              fontWeight: isCur ? 800 : 500, 
                              color: isCur ? '#3B5BFC' : isPast ? '#12C479' : '#9CA3AF', 
                              marginTop: 6, 
                              whiteSpace: 'nowrap',
                              textAlign: 'center'
                            }}>
                              {s}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Update stage */}
                {!isComplete && !onHold && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#fff', borderRadius: 12, border: '1.5px solid #E8EAEF' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 2 }}>Update your stage</div>
                        {stageSelect[t.id] && stageSelect[t.id] !== currentStage && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{STAGE_DESCRIPTIONS[stageSelect[t.id]]}</div>}
                      </div>
                      <select value={stageSelect[t.id] || currentStage} onChange={(e) => {
                        setStageSelect((prev) => ({ ...prev, [t.id]: e.target.value }));
                      }}
                        style={{ height: 38, borderRadius: 10, border: `1.5px solid ${stageSelect[t.id] && stageSelect[t.id] !== currentStage ? '#3B5BFC' : '#E8EAEF'}`, padding: '0 12px', fontSize: 12, fontWeight: 600, color: '#1A1D2E', background: '#fff', cursor: 'pointer', outline: 'none', minWidth: 160 }}>
                        <option value={currentStage}>{currentStage} (Current)</option>
                        {allowedNext.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button disabled={!stageSelect[t.id] || stageSelect[t.id] === currentStage || updating === t.id} onClick={() => {
                        handleStageUpdate(t);
                      }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: 'none', background: (stageSelect[t.id] && stageSelect[t.id] !== currentStage) ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : '#F0F2F8', color: (stageSelect[t.id] && stageSelect[t.id] !== currentStage) ? '#fff' : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: (stageSelect[t.id] && stageSelect[t.id] !== currentStage) ? 'pointer' : 'default', boxShadow: (stageSelect[t.id] && stageSelect[t.id] !== currentStage) ? '0 4px 12px rgba(59,91,252,0.3)' : 'none', transition: 'all 0.15s' }}>
                        {updating === t.id ? <><RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : 'Update Stage'}
                      </button>
                    </div>
                    
                    {/* Issue text box - only show when Issue stage is selected */}
                    {stageSelect[t.id] === 'Issue' && (
                      <div style={{ padding: '14px 16px', background: '#FEF2F2', borderRadius: 12, border: '1.5px solid #FED7D7' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Describe the Issue *
                        </label>
                        <textarea
                          value={issueText[t.id] || ''}
                          onChange={(e) => setIssueText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="Explain what problem or blocker you're facing..."
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid #FED7D7',
                            borderRadius: 10,
                            fontSize: 13,
                            color: '#374151',
                            outline: 'none',
                            background: '#fff',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#EF4444'}
                          onBlur={(e) => e.target.style.borderColor = '#FED7D7'}
                        />
                        <div style={{ fontSize: 10, color: '#EF4444', marginTop: 6, fontWeight: 500 }}>
                          This will be visible to admin and management
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* On Hold Notice */}
                {onHold && !isComplete && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#FFF7ED', borderRadius: 12, border: '1.5px solid #F97316' }}>
                    <Clock size={18} color="#F97316" strokeWidth={2.5} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>Task Hold</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Admin has hold this task, you cannot update your stage.</div>
                    </div>
                  </div>
                )}

                {isComplete && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #BBF7D0' }}>
                    <CheckCircle size={20} color="#12C479" strokeWidth={2.5} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#12C479' }}>Task completed - great work!</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Task Request Modal */}
      {showRequestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>New Task</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Submit task</div>
              </div>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} color="#6B7280" />
              </button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title *</label>
                <input 
                  value={requestTitle} 
                  onChange={e => setRequestTitle(e.target.value)} 
                  placeholder="Enter task title..."
                  style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} 
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
                <textarea 
                  value={requestDescription} 
                  onChange={e => setRequestDescription(e.target.value)} 
                  placeholder="Describe what you need help with..." 
                  rows={4}
                  style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', background: 'var(--input-bg)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3B5BFC'} 
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} 
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRequestModal(false)} style={{ padding: '11px 22px', background: 'var(--input-bg)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
              <button 
                onClick={handleRequestTask} 
                disabled={!requestTitle.trim()}
                style={{
                  padding: '11px 28px', 
                  border: 'none', 
                  borderRadius: 12, 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: requestTitle.trim() ? 'pointer' : 'not-allowed',
                  background: requestTitle.trim() ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : 'var(--border)',
                  color: requestTitle.trim() ? '#fff' : 'var(--text-muted)',
                  boxShadow: requestTitle.trim() ? '0 6px 20px rgba(59,91,252,0.4)' : 'none',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1001, background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1.5px solid #12C479', display: 'flex', alignItems: 'center', gap: 12, minWidth: 350 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={20} color="#12C479" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2E', marginBottom: 2 }}>Task Request Submitted</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Your request has been sent to the admin for review and approval.</div>
          </div>
          <button 
            onClick={() => setShowSuccessMessage(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} color="#9CA3AF" />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
