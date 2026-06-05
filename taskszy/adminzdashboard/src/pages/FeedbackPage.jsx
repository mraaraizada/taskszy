import { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { getFeedbackPaginated } from '../lib/optimizedFeedbackService';
import { sendFeedbackRequest } from '../lib/feedbackBroadcastService';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

const FEEDBACK_TYPE_COLORS = {
  'General Feedback': { color: '#3B5BFC', bg: '#EEF2FF' },
  'Bug Report': { color: '#EF4444', bg: '#FEF2F2' },
  'Feature Request': { color: '#7C3AED', bg: '#F5F3FF' },
  'Improvement': { color: '#12C479', bg: '#ECFDF5' },
};

export default function FeedbackPage() {
  const { globalSearchQuery } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredDescription, setHoveredDescription] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [containerHeight, setContainerHeight] = useState(0);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Fetch feedback data from Firebase with pagination
  useEffect(() => {

    loadFeedback(true); // Reset on initial load to avoid duplicates
  }, []);

  const loadFeedback = async (reset = false) => {
    try {

      setLoading(true);
      const result = await getFeedbackPaginated({
        pageSize: 100,
        lastDoc: reset ? null : lastDoc,
        forceRefresh: reset
      });

      if (reset) {
        setFeedbackData(result.feedback);
      } else {
        setFeedbackData(prev => [...prev, ...result.feedback]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {

      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);

    }
  };

  const handleSendFeedbackRequest = async (organizationId, organizationName) => {
    try {

      await sendFeedbackRequest(organizationId, 'We would love to hear your feedback!');

      toast.success('Feedback');
      setShowFeedbackDialog(false);
      setSelectedOrganization(null);
      
      // Reload feedback data after sending request

      loadFeedback(true);
    } catch (error) {

      toast.error('Failed to send feedback request');
    }
  };
  
  // Load more feedback if needed
  const loadMoreFeedback = () => {
    if (hasMore && !loading) {
      loadFeedback(false);
    }
  };
  
  // Calculate rows per page based on container height
  const rowHeight = 37; // Height of each row
  const headerHeight = 57; // Column header height
  const calculatedRows = containerHeight > 0 
    ? Math.floor((containerHeight - headerHeight) / rowHeight) + 3 // Add 3 extra rows to fill completely
    : 28;
  
  // Use calculated rows, no maximum limit
  const rowsPerPage = calculatedRows > 0 ? calculatedRows : 28;

  // Filter feedback by global search query
  const filteredFeedback = globalSearchQuery
    ? feedbackData.filter(item =>
        item.organizationName?.toLowerCase().includes(globalSearchQuery.toLowerCase())
      )
    : feedbackData;

  // Pagination
  const totalPages = Math.ceil(filteredFeedback.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedFeedback = filteredFeedback.slice(startIndex, startIndex + rowsPerPage);

  // Measure container height on mount and resize
  useEffect(() => {
    const measureHeight = () => {
      const container = document.querySelector('[data-feedback-container]');
      if (container) {
        const height = container.clientHeight;
        setContainerHeight(height);
      }
    };
    
    // Measure after a short delay to ensure layout is complete
    setTimeout(measureHeight, 100);
    window.addEventListener('resize', measureHeight);
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  const formatDateTime = (date) => {
    // Handle invalid or missing dates
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'N/A';
    }
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {

      return 'N/A';
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-main)', padding: '20px 24px' }}>
      {/* Main content wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Table container */}
        <div data-feedback-container style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', minHeight: 0 }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1.5fr 1.2fr 1.5fr 1.2fr 1.3fr 2fr',
            padding: '12px 20px',
            borderBottom: '1.5px solid var(--border-light)',
            background: 'var(--bg-subtle)',
            flexShrink: 0,
            alignItems: 'center',
          }}>
            {/* Icon button in most left corner */}
            <div style={{ paddingLeft: 16, paddingRight: 8 }}>
              <button
                onClick={() => setShowFeedbackDialog(true)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EEF2FF';
                  e.currentTarget.style.borderColor = '#3B5BFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <HelpCircle size={12} color="#6B7280" />
              </button>
            </div>
            {/* Organization column */}
            <div style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              letterSpacing: '0.05em', 
              textTransform: 'uppercase',
            }}>
              Organization
            </div>
            {['Name', 'Email', 'Phone', 'Date & Time'].map((h) => (
              <div key={h} style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: 'var(--text-muted)', 
                letterSpacing: '0.05em', 
                textTransform: 'uppercase',
              }}>
                {h}
              </div>
            ))}
            {/* Description column with pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: 'var(--text-muted)', 
                letterSpacing: '0.05em', 
                textTransform: 'uppercase',
              }}>
                Description
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={12} color="#6B7280" />
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 50, textAlign: 'center' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      border: '1.5px solid var(--border)',
                      background: currentPage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={12} color="#6B7280" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative', minHeight: 0 }}>
            {paginatedFeedback.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '80px 20px',
                gap: 12,
              }}>
                <MessageSquare size={48} color="#D1D5DB" strokeWidth={1.5} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, textAlign: 'center' }}>
                    No feedback found
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                    No feedback submissions yet
                  </div>
                </div>
              </div>
            ) : (
              <>
                {paginatedFeedback.map((item, index) => {
                  const typeStyle = FEEDBACK_TYPE_COLORS[item.feedbackType] || { color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1.5fr 1.2fr 1.5fr 1.2fr 1.3fr 2fr',
                        padding: '8px 20px',
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ paddingLeft: 16, paddingRight: 8 }}></div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.organizationName}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.userName} {item.userRole && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({item.userRole})</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                        {item.userEmail}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                        {item.userPhone || '-'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                        {formatDateTime(item.submittedAt)}
                      </div>
                      <div 
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'default',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPosition({ 
                            x: rect.left + 10, 
                            y: rect.bottom + 8 
                          });
                          setHoveredDescription(item.id);
                        }}
                        onMouseLeave={() => setHoveredDescription(null)}
                      >
                        {item.description}
                      </div>
                    </div>
                  );
                })}
                {/* Fill remaining space with empty rows */}
                {rowsPerPage > paginatedFeedback.length && Array.from({ length: rowsPerPage - paginatedFeedback.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1.5fr 1.2fr 1.5fr 1.2fr 1.3fr 2fr',
                      padding: '8px 20px',
                      borderBottom: '1px solid var(--border-light)',
                      height: '37px',
                    }}
                  >
                    <div style={{ paddingLeft: 16, paddingRight: 8 }}>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Global Tooltip */}
      {hoveredDescription && (
        <div style={{
          position: 'fixed',
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          padding: '12px 16px',
          background: '#FFFFFF',
          color: '#1F2937',
          fontSize: 13,
          fontWeight: 500,
          borderRadius: 10,
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 99999,
          minWidth: 300,
          maxWidth: 500,
          whiteSpace: 'normal',
          lineHeight: 1.6,
          pointerEvents: 'none',
        }}>
          {paginatedFeedback.find(item => item.id === hoveredDescription)?.description}
        </div>
      )}

      {/* Feedback Form Dialog */}
      {showFeedbackDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 16,
            width: 400,
            maxWidth: '90vw',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 20px',
              borderBottom: '1.5px solid var(--border-light)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <HelpCircle size={18} color="#3B5BFC" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Feedback
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Organization
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Are you sure to update feedback form from organizations?
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1.5px solid var(--border-light)',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowFeedbackDialog(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendFeedbackRequest('ALL', 'All Organizations')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59,91,252,0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
