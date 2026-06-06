/**
 * Task Timeline Panel - Phase 10
 * Displays task change history from Firestore timeline subcollection
 */

import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { X, Clock, Edit, Users, DollarSign, CheckCircle, Circle } from 'lucide-react';
import {
  collection, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';

// Event type configurations
const EVENT_CONFIG = {
  created: {
    label: 'Task Created',
    color: '#3B5BFC',
    bg: '#EEF2FF',
    icon: Circle,
  },
  updated: {
    label: 'Updated',
    color: '#F97316',
    bg: '#FFF7ED',
    icon: Edit,
  },
  budget_updated: {
    label: 'Budget',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: DollarSign,
  },
  members_changed: {
    label: 'Team',
    color: '#06B6D4',
    bg: '#ECFEFF',
    icon: Users,
  },
  stage_changed: {
    label: 'Stage Update',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: CheckCircle,
  },
  payment_status: {
    label: 'Task Budget',
    color: '#12C479',
    bg: '#ECFDF5',
    icon: DollarSign,
  },
  payment_completed: {
    label: 'Task Payment',
    color: '#12C479',
    bg: '#ECFDF5',
    icon: DollarSign,
  },
  profit_received: {
    label: 'Profit',
    color: '#10B981',
    bg: '#D1FAE5',
    icon: DollarSign,
  },
  payment_received: {
    label: 'Payment Received',
    color: '#12C479',
    bg: '#ECFDF5',
    icon: DollarSign,
  },
};

// ⭐ Memoized Event Card - only re-renders if event data changes
const EventCard = memo(({ event, config, eventColor, eventBg, isLast }) => {
  const Icon = config.icon;
  
  // ⭐ Customize label and colors for specific event types
  let eventLabel = config.label;
  let customColor = eventColor;
  let customBg = eventBg;
  
  if (event.eventType === 'updated' && event.changes?.field === 'extendedDeadline') {
    eventLabel = 'Extended';
  } else if (event.eventType === 'updated' && event.changes?.field === 'memberHold') {
    if (event.changes.newValue === 'On Hold') {
      eventLabel = 'Task Hold';
      customColor = '#EF4444'; // Red for hold
      customBg = '#FEF2F2';
    } else {
      eventLabel = 'Task Activated';
      customColor = '#12C479'; // Green for activated
      customBg = '#ECFDF5';
    }
  } else if (event.eventType === 'updated' && event.changes?.field === 'status') {
    // For full task hold/activate (not member-specific)
    if (event.changes.newValue === 'On Hold') {
      customColor = '#EF4444'; // Red for hold
      customBg = '#FEF2F2';
    } else if (event.changes.newValue === 'Active') {
      customColor = '#12C479'; // Green for activated
      customBg = '#ECFDF5';
    }
  }
  
  return (
    <div key={event.id} style={{ position: 'relative', marginBottom: isLast ? 0 : 20 }}>
      {/* Dot */}
      <div
        style={{
          position: 'absolute',
          left: -26,
          top: 8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: customBg,
          border: `2px solid ${customColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <Icon size={8} color={customColor} strokeWidth={3} />
      </div>

      {/* Event Card */}
      <div
        style={{
          background: customBg,
          borderRadius: 10,
          padding: '12px 14px',
          border: `1.5px solid ${customColor}30`,
        }}
      >
        {/* Event Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: customColor }}>
            {eventLabel}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
            {event.formattedTime}
          </span>
        </div>

        {/* Description */}
        {event.description && event.eventType !== 'created' && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
            {(() => {
              // ⭐ Handle objects in description (for old events)
              if (typeof event.description === 'object') {
                if (Array.isArray(event.description)) {
                  return event.description.map(item => 
                    typeof item === 'string' ? item : (item?.label || item?.name || JSON.stringify(item))
                  ).join(', ');
                }
                return event.description?.label || event.description?.name || JSON.stringify(event.description);
              }
              return event.description;
            })()}
          </div>
        )}

        {/* User Info */}
        {event.user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {event.user.avatarImg ? (
              <img
                src={event.user.avatarImg}
                alt={event.user.name}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: event.user.color || '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {event.user.avatar || event.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.user.name}
              </div>
              {event.user.role && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {event.user.role}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Issue Note - Show for Issue or Update stages */}
        {event.eventType === 'stage_changed' && event.issueNote && (event.changes?.newStage === 'Issue' || event.changes?.newStage === 'Update') && (
          <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {event.issueNote}
            </div>
          </div>
        )}
        
        {/* Debug: Log if we should show issue note */}
        {event.eventType === 'stage_changed' && (event.changes?.newStage === 'Issue' || event.changes?.newStage === 'Update') && (() => {

          return null;
        })()}

        {/* Changes Details - Hidden for all events (description already shows the info) */}
        {false && event.changes && Object.keys(event.changes).length > 0 && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6, fontSize: 11 }}>
            {Object.entries(event.changes).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 4, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{key}:</span>{' '}
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if event ID changes
  return prevProps.event.id === nextProps.event.id && prevProps.isLast === nextProps.isLast;
});

EventCard.displayName = 'EventCard';

export default function TaskTimelinePanel({ task, onClose }) {
  const { workspaceId, STAGE_COLORS, STAGE_BG } = useApp();
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [formattedEvents, setFormattedEvents] = useState([]); // Store formatted events in state
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(10); // Show only 10 events initially
  const bottomRef = useRef(null);
  const eventIdsRef = useRef(new Set()); // Track existing event IDs
  const formattedTimesRef = useRef(new Map()); // Cache formatted times by event ID
  const renderCountRef = useRef(0); // Track render count to force stable keys

  // ⭐ PHASE 10: Real-time timeline listener
  useEffect(() => {
    if (!workspaceId || !task?.id) return;

    const timelinePath = `workspaces/${workspaceId}/tasks/${task.id}/timeline`;

    // ⭐ CRITICAL: Reset state when task changes
    eventIdsRef.current.clear();
    formattedTimesRef.current.clear();
    setFormattedEvents([]);

    const unsubscribe = onSnapshot(
      query(collection(db, timelinePath), orderBy('timestampMs', 'asc')), // ⭐ Sort by timestampMs (creation order)
      (snap) => {

        const allEventsFromFirebase = snap.docs.map(d => {
          const data = d.data();
          // Use timestampMs if available, otherwise convert Firestore timestamp
          const timestamp = data.timestampMs 
            ? new Date(data.timestampMs)
            : (data.timestamp?.toDate ? data.timestamp.toDate() : new Date());
          
          return {
            id: d.id,
            ...data,
            timestamp: timestamp,
            timestampMs: data.timestampMs || timestamp.getTime(),
            // ⭐ CRITICAL: Use pre-formatted times from Firebase (never recalculate)
            formattedTime: data.formattedTime || timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            formattedExactTime: data.formattedExactTime || timestamp.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          };
        });

        // ⭐ CRITICAL: Identify truly new events (not in our cache)
        const existingEventIds = eventIdsRef.current;
        const newEventIds = [];
        
        allEventsFromFirebase.forEach(event => {
          if (!existingEventIds.has(event.id)) {
            newEventIds.push(event.id);
            existingEventIds.add(event.id);
          }
        });

        // ⭐ CRITICAL: Build formatted events array
        const formattedTimesCache = formattedTimesRef.current;
        
        if (formattedTimesCache.size === 0) {
          // Initial load - format all events

          const allFormattedEvents = allEventsFromFirebase.map(event => {
            const formattedEvent = {
              ...event,
              _renderKey: `${event.id}_initial` // Stable render key
            };
            formattedTimesCache.set(event.id, formattedEvent);
            return formattedEvent;
          });
          
          setFormattedEvents(allFormattedEvents);
        } else if (newEventIds.length > 0) {
          // New events detected - append them to existing array

          const newFormattedEvents = allEventsFromFirebase
            .filter(event => newEventIds.includes(event.id))
            .map(event => {
              const formattedEvent = {
                ...event,
                _renderKey: `${event.id}_${Date.now()}` // Stable render key with timestamp
              };
              formattedTimesCache.set(event.id, formattedEvent);
              return formattedEvent;
            });
          
          setFormattedEvents(prev => {

            // ⭐ CRITICAL: Append new events at the end (don't sort, don't insert)
            return [...prev, ...newFormattedEvents];
          });
        } else {

        }
        
        setLoading(false);
      },
      (error) => {

        setLoading(false);
      }
    );

    return () => {

      unsubscribe();
    };
  }, [workspaceId, task?.id]); // ⭐ REMOVED formattedEvents.length dependency

  // Auto-scroll to latest event when new events are added
  useEffect(() => {
    if (formattedEvents.length > 0 && bottomRef.current) {

      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [formattedEvents.length]);

  // ⭐ Limit to displayLimit events (show only 10 initially)
  const limitedEvents = formattedEvents.slice(-displayLimit); // Get last N events (most recent)
  
  const hasMoreEvents = formattedEvents.length > displayLimit;

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format exact time for hover
  const formatExactTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: 'var(--bg-surface)',
        borderLeft: '1.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={18} color="#7C3AED" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>#{task.id}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Task Title - Removed */}
      </div>

      {/* Timeline Events */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
            <Clock size={32} color="var(--text-muted)" strokeWidth={1.5} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading timeline...</span>
          </div>
        ) : limitedEvents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12, opacity: 0.5 }}>
            <Clock size={32} color="var(--text-muted)" strokeWidth={1.5} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              No timeline events yet.
            </span>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            {/* Load More Button - At the top */}
            {hasMoreEvents && (
              <div style={{ marginBottom: 16, marginLeft: -32, paddingLeft: 32 }}>
                <button
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#EEF2FF';
                    e.currentTarget.style.borderColor = '#3B5BFC';
                    e.currentTarget.style.color = '#3B5BFC';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  Load More
                </button>
              </div>
            )}
            
            {/* Timeline Line */}
            <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: 'var(--border)', borderRadius: 2 }} />

            {/* Events grouped by date */}
            {(() => {
              // Group events by date
              const eventsByDate = {};
              limitedEvents.forEach(event => {
                const dateKey = event.timestamp.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                if (!eventsByDate[dateKey]) {
                  eventsByDate[dateKey] = [];
                }
                eventsByDate[dateKey].push(event);
              });
              
              // ⭐ Sort events within each date by exact timestamp
              Object.keys(eventsByDate).forEach(dateKey => {
                eventsByDate[dateKey].sort((a, b) => a.timestamp - b.timestamp);
              });

              return Object.entries(eventsByDate).map(([dateKey, events], dateIndex) => (
                <div key={dateKey} style={{ marginBottom: dateIndex < Object.keys(eventsByDate).length - 1 ? 24 : 0 }}>
                  {/* Date Header */}
                  <div style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    marginBottom: 12,
                    marginLeft: -32,
                    paddingLeft: 32,
                    position: 'sticky',
                    top: -16,
                    background: 'var(--bg-surface)',
                    paddingTop: 12,
                    paddingBottom: 8,
                    zIndex: 10,
                    borderBottom: '1px solid var(--border-light)'
                  }}>
                    {dateKey}
                  </div>

                  {/* Events for this date */}
                  {events.map((event, i) => {
                    const config = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.updated;
                    const isLast = i === events.length - 1;
                    
                    // ⭐ For stage_changed events, use the new stage's color
                    let eventColor = config.color;
                    let eventBg = config.bg;
                    
                    if (event.eventType === 'stage_changed' && event.changes?.newStage) {
                      const newStage = event.changes.newStage;
                      eventColor = STAGE_COLORS[newStage] || config.color;
                      eventBg = STAGE_BG[newStage] || config.bg;
                    }

                    return (
                      <EventCard
                        key={event._renderKey || event.id}
                        event={event}
                        config={config}
                        eventColor={eventColor}
                        eventBg={eventBg}
                        isLast={isLast}
                      />
                    );
                  })}
                </div>
              ));
            })()}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{ padding: '12px 20px', borderTop: '1.5px solid var(--border)', flexShrink: 0, background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formattedEvents.length} event{formattedEvents.length !== 1 ? 's' : ''}
          </span>
          {formattedEvents.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Last updated {formatRelativeTime(formattedEvents[formattedEvents.length - 1].timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
