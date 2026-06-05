import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const TODAY = 2;
const YELLOW_DAY = 17;
const RANGE_START = 27;
const RANGE_END = 29;

export default function CalendarCard({ compact = false }) {
  const [year, setYear]   = useState(2019);
  const [month, setMonth] = useState(9);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventColor, setEventColor] = useState('#22C55E');
  const [events, setEvents] = useState([]);

  const daysInMonth     = getDaysInMonth(year, month);
  const firstDay        = getFirstDayOfWeek(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

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
    }
  };

  const getEventForDate = (day) => {
    return events.find(e => e.date === day && e.month === month && e.year === year);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrevMonth - firstDay + 1 + i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const cellH = compact ? 24 : 32;
  const fontSize = compact ? 10 : 12;

  return (
    <div className="card animate-fade-slide" style={{ padding: compact ? '14px 16px' : '22px 24px', animationDelay: '300ms' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: compact ? 10 : 14 }}>
        <h2 style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: '#1A1D2E' }}>
          Calendar
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0F2F8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={18} color="#6B7280" />
          </button>
          <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: '#1A1D2E', whiteSpace: 'nowrap' }}>
            {MONTH_NAMES[month].slice(0, 3)} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#F7F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={18} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#B0B8CC', paddingBottom: 4, letterSpacing: '0.4px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {week.map((cell, di) => {
              const isOct2019     = month === 9 && year === 2019;
              const isToday       = cell.current && cell.day === TODAY      && isOct2019;
              const isYellow      = cell.current && cell.day === YELLOW_DAY && isOct2019;
              const inRange       = cell.current && cell.day >= RANGE_START && cell.day <= RANGE_END && isOct2019;
              const isRangeStart  = cell.current && cell.day === RANGE_START && isOct2019;
              const isRangeEnd    = cell.current && cell.day === RANGE_END   && isOct2019;
              const eventForDate  = cell.current ? getEventForDate(cell.day) : null;

              let textColor  = cell.current ? '#374151' : '#D1D5DB';
              let fontWeight = 400;
              let circleColor = null;
              let rangeBg    = 'transparent';
              let rangeRadius = 0;

              if (eventForDate) { circleColor = eventForDate.color; textColor = '#fff'; fontWeight = 700; }
              else if (isToday)  { circleColor = '#22C55E'; textColor = '#fff'; fontWeight = 700; }
              else if (isYellow) { circleColor = '#F59E0B'; textColor = '#fff'; fontWeight = 700; }
              else if (inRange) {
                rangeBg   = '#DCFCE7';
                textColor = '#15803D';
                fontWeight = 600;
                rangeRadius = isRangeStart ? '50% 0 0 50%' : isRangeEnd ? '0 50% 50% 0' : 0;
              }

              return (
                <div
                  key={di}
                  onClick={() => cell.current && handleDateClick(cell.day)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: cellH,
                    background: inRange ? rangeBg : 'transparent',
                    borderRadius: inRange ? rangeRadius : 0,
                    cursor: cell.current ? 'pointer' : 'default',
                  }}
                >
                  {(eventForDate || isToday || isYellow) ? (
                    <div style={{
                      width: cellH - 4, height: cellH - 4, borderRadius: '50%',
                      background: circleColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize, fontWeight, color: '#fff',
                      boxShadow: eventForDate ? `0 2px 6px ${circleColor}40` : isToday ? '0 2px 6px rgba(34,197,94,0.4)' : '0 2px 6px rgba(245,158,11,0.4)',
                    }}>
                      {String(cell.day).padStart(2, '0')}
                    </div>
                  ) : (
                    <span style={{ fontSize, fontWeight, color: textColor, lineHeight: 1 }}>
                      {String(cell.day).padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Plus Button - Bottom Right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={() => { setSelectedDate(null); setShowModal(true); }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#4F46E5',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4338CA';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4F46E5';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
          }}
        >
          <Plus size={18} color="#fff" strokeWidth={2.5} />
        </button>
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
                {selectedDate ? `Add Event - ${MONTH_NAMES[month]} ${selectedDate}` : 'Add Event'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEventName(''); }}
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
                  placeholder="Day"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(parseInt(e.target.value))}
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                onClick={() => { setShowModal(false); setEventName(''); }}
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
