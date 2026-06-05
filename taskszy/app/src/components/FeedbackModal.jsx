import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { submitFeedback } from '../lib/feedbackService';
import { dismissFeedbackRequest, hasDismissedFeedback } from '../lib/feedbackBroadcastService';
import { toast } from 'sonner';

export default function FeedbackModal({ 
  feedbackRequest, 
  organizationId, 
  organizationName,
  userId, 
  userName, 
  userEmail, 
  userPhone,
  userRole 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isDismissedLocally, setIsDismissedLocally] = useState(false); // Track local dismissal (not in Firestore)

  const charCount = description.length;
  const maxChars = 1000;

  useEffect(() => {
    if (feedbackRequest && userId) {
      // Check if user has already submitted feedback for this broadcast
      hasDismissedFeedback(feedbackRequest.id, userId).then(dismissed => {
        if (!dismissed && !isDismissedLocally) {
          // Not submitted and not dismissed locally - show modal
          setIsVisible(true);
          setShowNotification(false);
        } else if (!dismissed && isDismissedLocally) {
          // Not submitted but dismissed locally - show notification
          setIsVisible(false);
          setShowNotification(true);
        } else {
          // Already submitted - hide everything
          setIsVisible(false);
          setShowNotification(false);
        }
      });
    } else {
      setIsVisible(false);
      setShowNotification(false);
    }
  }, [feedbackRequest, userId, isDismissedLocally]);

  const handleDismiss = () => {
    // Only dismiss locally (don't save to Firestore)
    // This allows the notification to persist after reload
    setIsDismissedLocally(true);
    setIsVisible(false);
    setShowNotification(true);
  };
  
  const handleNotificationClick = () => {
    // Reopen the modal
    setIsDismissedLocally(false);
    setIsVisible(true);
    setShowNotification(false);
  };

  const handleSubmit = async () => {
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        organizationId,
        organizationName,
        userId,
        userName,
        userEmail,
        userPhone: userPhone || '',
        description: description.trim(),
        userRole: userRole || 'user',
      });

      toast.success('Feedback submitted');
      setHasSubmitted(true);
      setDescription('');
      
      // Mark as dismissed in Firestore after successful submission
      if (feedbackRequest && userId) {
        await dismissFeedbackRequest(feedbackRequest.id, userId);
      }
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
        setShowNotification(false); // Don't show notification after submission
      }, 2000);
    } catch (error) {

      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Notification Badge - Shows when modal is dismissed */}
      {showNotification && !isVisible && feedbackRequest && (
        <div 
          onClick={handleNotificationClick}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 280,
            background: 'linear-gradient(135deg, #FFFFFF, #F9FAFB)',
            border: '2px solid #3B5BFC',
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(59, 91, 252, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08)',
            zIndex: 9998,
            cursor: 'pointer',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.2s ease',
            animation: 'slideInRight 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 91, 252, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 91, 252, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08)';
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(100px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
          
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <HelpCircle size={20} color="#fff" />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#1F2937',
            }}>
              Feedback
            </div>
          </div>
          
          <ChevronUp size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
        </div>
      )}
      
      {/* Feedback Modal */}
      {isVisible && feedbackRequest && (
        <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: isCollapsed ? 320 : 420,
      maxHeight: isCollapsed ? 60 : 500,
      background: 'linear-gradient(135deg, #FFFFFF, #F9FAFB)',
      border: '2px solid #3B5BFC',
      borderRadius: 16,
      boxShadow: '0 12px 40px rgba(59, 91, 252, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #3B5BFC, #2142D9)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpCircle size={20} color="#fff" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Taskzy Feedback
            </div>
            {!isCollapsed && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {feedbackRequest.message}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            {isCollapsed ? <ChevronUp size={16} color="#fff" /> : <ChevronDown size={16} color="#fff" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <X size={16} color="#fff" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <>
          {hasSubmitted ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              gap: 12,
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #12C479, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Send size={28} color="#fff" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', textAlign: 'center' }}>
                Thank you for your feedback!
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                We appreciate your input and will review it soon.
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.substring(0, maxChars))}
                    placeholder="Type your message, suggestions, or report any issues"
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#1F2937',
                      outline: 'none',
                      background: '#FFFFFF',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B5BFC'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}>
                <button
                  onClick={handleDismiss}
                  style={{
                    padding: '10px 20px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6B7280',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                >
                  Later
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || isSubmitting}
                  style={{
                    padding: '10px 24px',
                    background: !description.trim() || isSubmitting 
                      ? '#D1D5DB' 
                      : 'linear-gradient(135deg, #3B5BFC, #2142D9)',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: !description.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: !description.trim() || isSubmitting 
                      ? 'none' 
                      : '0 4px 12px rgba(59, 91, 252, 0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </>
          )}
        </>
      )}
        </div>
      )}
    </>
  );
}
