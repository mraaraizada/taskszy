import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Lock, Image, Loader } from 'lucide-react';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { canAccessTaskChat } from '../lib/chatService';
import { uploadImage } from '../lib/storageService';
import { notify } from '../lib/notify';
import { compressImage } from '../lib/imageCompression';

export const MOCK_CHAT_MESSAGES = [];

export default function TaskChatPanel({ task, onClose, currentUser, team = [] }) {
  // ⭐ PHASE 9: Check access before rendering
  const hasAccess = canAccessTaskChat(task, currentUser);
  
  // If no access, show access denied message
  if (!hasAccess) {
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
          background: 'var(--bg-surface)', borderLeft: '1.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', zIndex: 1000,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={16} color="#EF4444" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Access Denied</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Access Denied Message */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Lock size={28} color="#EF4444" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Chat Access Restricted
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280 }}>
            Only team members assigned to this task and admins can access the task chat.
          </p>
        </div>
      </div>
    );
  }
  const { workspaceId } = useApp();
  const chatPath = workspaceId
    ? `workspaces/${workspaceId}/tasks/${String(task.id)}/chat`
    : null;
  const readPath = workspaceId
    ? `workspaces/${workspaceId}/tasks/${String(task.id)}/readReceipts`
    : null;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [messageLimit, setMessageLimit] = useState(15); // Initially load 15 messages
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hoveredMember, setHoveredMember] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [readReceipts, setReadReceipts] = useState({});
  const [viewingImage, setViewingImage] = useState(null);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const messagesContainerRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // ── Real-time chat listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!chatPath) return;
    const unsub = onSnapshot(
      query(collection(db, chatPath), orderBy('timestamp', 'asc')),
      (snap) => {
        const allMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTotalMessageCount(allMessages.length);
        
        const previousMessageCount = messages.length;
        const newMessages = allMessages.slice(-messageLimit);
        
        // Only auto-scroll if we're at the initial load or new messages arrived (not loading old ones)
        if (messages.length === 0 || (newMessages.length > previousMessageCount && messageLimit === 15)) {
          setShouldScrollToBottom(true);
        }
        
        setMessages(newMessages);
      },
      () => {}
    );
    return unsub;
  }, [chatPath, messageLimit]);

  // ── Real-time read receipts listener ─────────────────────────────────────
  useEffect(() => {
    if (!readPath) return;
    const unsub = onSnapshot(
      collection(db, readPath),
      (snap) => {
        const receipts = {};
        snap.docs.forEach(doc => {
          receipts[doc.id] = doc.data();
        });
        setReadReceipts(receipts);
      },
      () => {}
    );
    return unsub;
  }, [readPath]);

  const loadMoreMessages = () => {
    // Save current scroll position and the first visible message
    const container = messagesContainerRef.current;
    if (container) {
      const firstMessage = container.querySelector('[data-message-id]');
      const firstMessageId = firstMessage?.getAttribute('data-message-id');
      
      // Load 15 more messages
      setMessageLimit(prev => prev + 15);
      setShouldScrollToBottom(false);
      
      // After DOM updates, scroll to the same message that was at top before
      setTimeout(() => {
        if (container && firstMessageId) {
          const messageElement = container.querySelector(`[data-message-id="${firstMessageId}"]`);
          if (messageElement) {
            messageElement.scrollIntoView({ block: 'start' });
          }
        }
      }, 100);
    } else {
      setMessageLimit(prev => prev + 15);
      setShouldScrollToBottom(false);
    }
  };

  // ── Mark as read on open ─────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
    if (!readPath || !currentUser) return;
    setDoc(doc(db, readPath, String(currentUser.name || 'user')), {
      readAt: serverTimestamp(),
      name: currentUser.name || 'user',
    }, { merge: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (shouldScrollToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldScrollToBottom]);

  // ⭐ Check if user can send messages (admin or assigned member)
  const isAdmin = currentUser?.userRole === 'admin' || currentUser?.role === 'Admin';
  const isAssignedMember = task.members?.some(m => 
    String(m.id) === String(currentUser?.id) || 
    String(m.id) === String(currentUser?.memberId)
  );
  const isTaskComplete = task.stage === 'Complete';
  const canSendMessages = !isTaskComplete && (isAdmin || isAssignedMember);

  const send = async () => {
    const text = input.trim();
    if ((!text && !imagePreview) || !chatPath || !canSendMessages) return;
    
    try {
      setUploadingImage(true);
      
      // ⭐ Get user info with proper avatar support
      const userName = currentUser?.name || 'User';
      const userAvatar = currentUser?.avatar || userName.charAt(0).toUpperCase();
      const userColor = currentUser?.color || '#3B5BFC';
      const userAvatarImg = currentUser?.avatarImg || null;
      
      let imageUrl = null;
      
      // Upload image if present
      if (imagePreview) {
        if (!workspaceId) {
          throw new Error('Workspace ID not found');
        }
        
        const timestamp = Date.now();
        const extension = imagePreview.file.name.split('.').pop() || 'jpg';
        const imagePath = `workspaces/${workspaceId}/tasks/${task.id}/chat/${timestamp}.${extension}`;

        imageUrl = await uploadImage(imagePreview.file, imagePath);

      }
      
      const msg = {
        text: text || '',
        sender: userName,
        avatar: userAvatar,
        avatarImg: userAvatarImg,
        color: userColor,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: serverTimestamp(),
        ...(imageUrl && { imageUrl }) // Add image URL if present
      };
      
      await addDoc(collection(db, chatPath), msg);
      
      // Mark as read immediately
      if (readPath) {
        await setDoc(doc(db, readPath, String(userName)), {
          readAt: serverTimestamp(),
          name: userName,
        }, { merge: true });
      }
      
      setInput('');
      setImagePreview(null);
      setUploadingImage(false);
      setShouldScrollToBottom(true); // Scroll to bottom after sending
    } catch (error) {

      if (error.code === 'storage/unauthorized') {
        notify.error('Permission denied. Please check your access.');
      } else if (error.message.includes('permission')) {
        notify.error('You do not have permission to upload images');
      } else {
        notify.error('Failed to send message: ' + error.message);
      }
      setUploadingImage(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      notify.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB before compression)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      notify.error('Image size must be less than 10MB');
      return;
    }
    
    try {
      // Compress image before creating preview (no toast notification)
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview({
          url: e.target.result,
          file: compressedFile // Use compressed file
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {

      notify.error('Failed to process image');
    }
  };

  const removeImagePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: 'var(--bg-surface)', borderLeft: '1.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 1000,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} color="#3B5BFC" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{task.id}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        {task.members && task.members.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {task.members.slice(0, 3).map((m, i) => (
                <div
                  key={m.id}
                  onMouseEnter={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const teamMember = team.find(t => t.id === m.id);
                    setHoveredMember({ name: m.name, role: teamMember?.role || '', x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setHoveredMember(null)}
                  style={{
                    width: 26, 
                    height: 26, 
                    borderRadius: '50%',
                    background: m.avatarImg ? 'transparent' : (m.color || '#3B5BFC'),
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#fff', 
                    fontSize: 9, 
                    fontWeight: 800,
                    border: '2px solid var(--bg-surface)',
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: task.members.length - i,
                    position: 'relative', 
                    cursor: 'default',
                    overflow: 'hidden'
                  }}
                >
                  {/* ⭐ Show profile image if available, otherwise show avatar letter */}
                  {m.avatarImg ? (
                    <img 
                      src={m.avatarImg} 
                      alt={m.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    m.avatar
                  )}
                </div>
              ))}
            </div>
            {task.members.length > 3 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                +{task.members.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Load More Button - Only show if there are more messages to load */}
        {totalMessageCount > messages.length && (
          <button
            onClick={loadMoreMessages}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              alignSelf: 'center',
              marginBottom: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EEF2FF';
              e.currentTarget.style.borderColor = '#3B5BFC';
              e.currentTarget.style.color = '#3B5BFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Load
          </button>
        )}
        
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.5 }}>
            <MessageSquare size={32} color="var(--text-muted)" strokeWidth={1.5} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No messages yet.<br />Start the conversation.</span>
          </div>
        ) : messages.map((msg, i) => {
          const showDate = i === 0 || messages[i - 1].date !== msg.date;
          const isMine = msg.sender === (currentUser?.name || 'Admin');
          
          // ⭐ Calculate read receipts from real-time data
          // Only count users who read AFTER this message was sent
          const msgTimestamp = msg.timestamp?.toDate?.() || new Date(0);
          const readByUsers = Object.values(readReceipts)
            .filter(receipt => {
              if (!receipt.name || receipt.name === msg.sender) return false;
              const readTime = receipt.readAt?.toDate?.() || new Date(0);
              return readTime > msgTimestamp;
            })
            .map(receipt => receipt.name);
          const readCount = readByUsers.length;
          const totalMembers = (task.members?.length || 1) - 1; // Exclude sender
          
          // ⭐ CRITICAL: Load actual user avatar from team data
          // First check task.members, then team array, then fall back to stored message data
          let userAvatar = msg.avatar;
          let userAvatarImg = msg.avatarImg;
          let userColor = msg.color;
          
          // Try to find user in task members first
          const taskMember = task.members?.find(m => m.name === msg.sender);
          if (taskMember) {
            userAvatar = taskMember.avatar || userAvatar;
            userAvatarImg = taskMember.avatarImg || userAvatarImg;
            userColor = taskMember.color || userColor;
          } else {
            // Try to find in team array
            const teamMember = team?.find(t => t.name === msg.sender);
            if (teamMember) {
              userAvatar = teamMember.avatar || userAvatar;
              userAvatarImg = teamMember.avatarImg || userAvatarImg;
              userColor = teamMember.color || userColor;
            }
          }
          
          return (
            <div key={msg.id} data-message-id={msg.id}>
              {showDate && (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 10px', borderRadius: 20 }}>{msg.date}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {/* ⭐ Avatar with profile image support - uses actual user data from team */}
                {userAvatarImg ? (
                  <img 
                    src={userAvatarImg} 
                    alt={msg.sender}
                    style={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '2px solid var(--bg-surface)'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    background: userColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    fontSize: 10, 
                    fontWeight: 800, 
                    flexShrink: 0 
                  }}>
                    {userAvatar}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{msg.sender}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.time}</span>
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                    {/* Image if present */}
                    {msg.imageUrl && (
                      <div style={{ marginBottom: msg.text ? 8 : 0 }}>
                        <img 
                          src={msg.imageUrl} 
                          alt="Shared image"
                          onClick={() => setViewingImage(msg.imageUrl)}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: 300,
                            borderRadius: 8, 
                            cursor: 'pointer',
                            display: 'block',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}
                    {/* Text message */}
                    {msg.text && (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '4px 12px 12px 12px', wordBreak: 'break-word', paddingRight: isMine && readCount > 0 ? 28 : 12, position: 'relative' }}>
                        {msg.text}
                        {isMine && readCount > 0 && (
                          <div
                            style={{ position: 'absolute', bottom: 6, right: 7, display: 'inline-block' }}
                            onMouseEnter={e => { const tip = e.currentTarget.querySelector('[data-tip]'); if (tip) tip.style.display = 'block'; }}
                            onMouseLeave={e => { const tip = e.currentTarget.querySelector('[data-tip]'); if (tip) tip.style.display = 'none'; }}
                          >
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3B5BFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', lineHeight: 1 }}>i</span>
                            </div>
                            <div data-tip style={{ display: 'none', position: 'absolute', bottom: '100%', right: 0, marginBottom: 6, zIndex: 9999, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 160, whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.4 }}>
                                Read by
                              </div>
                              {readByUsers.map((name, ri) => (
                                <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: ri === readByUsers.length - 1 ? 0 : 3 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#12C479', flexShrink: 0 }} />
                                  <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{name}</span>
                                </div>
                              ))}
                              <div style={{ position: 'absolute', bottom: -5, right: 8, transform: 'rotate(45deg)', width: 8, height: 8, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderTop: 'none', borderLeft: 'none' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 18px', borderTop: '1.5px solid var(--border)', flexShrink: 0 }}>
        {canSendMessages ? (
          <>
            {/* Image Preview */}
            {imagePreview && (
              <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                <img 
                  src={imagePreview.url} 
                  alt="Preview"
                  style={{ 
                    maxWidth: 200, 
                    maxHeight: 150, 
                    borderRadius: 8, 
                    display: 'block',
                    border: '1.5px solid var(--border)'
                  }}
                />
                <button
                  onClick={removeImagePreview}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#EF4444',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <X size={14} color="#fff" />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border)', padding: '8px 10px' }}>
              {/* Image Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  flexShrink: 0,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!uploadingImage) {
                    e.currentTarget.style.background = '#EEF2FF';
                    e.currentTarget.style.color = '#3B5BFC';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Image size={16} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message…"
                rows={1}
                style={{ 
                  flex: 1, 
                  background: 'none', 
                  border: 'none', 
                  outline: 'none', 
                  resize: 'none', 
                  fontSize: 13, 
                  color: 'var(--text-primary)', 
                  fontFamily: 'inherit', 
                  lineHeight: 1.5, 
                  maxHeight: 100, 
                  overflowY: 'auto', 
                  padding: '6px 0',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              />
              <button
                onClick={send}
                disabled={(!input.trim() && !imagePreview) || uploadingImage}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0, background: (input.trim() || imagePreview) && !uploadingImage ? '#3B5BFC' : 'var(--border)', color: (input.trim() || imagePreview) && !uploadingImage ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (input.trim() || imagePreview) && !uploadingImage ? 'pointer' : 'default', transition: 'all 0.15s' }}
              >
                {uploadingImage ? <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={14} />}
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, textAlign: 'center' }}>Enter to send · Shift+Enter for new line</div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1.5px solid var(--border)' }}>
            {!isTaskComplete && <Lock size={14} color="var(--text-muted)" style={{ marginRight: 8 }} />}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isTaskComplete 
                ? 'Task completed' 
                : 'Only admins and assigned members can send messages'}
            </span>
          </div>
        )}
      </div>

      {/* Member hover tooltip */}
      {hoveredMember && (
        <div style={{ position: 'fixed', left: hoveredMember.x, top: hoveredMember.y - 8, transform: 'translateX(-50%) translateY(-100%)', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredMember.name}</div>
          {hoveredMember.role && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{hoveredMember.role}</div>}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 8, height: 8, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderTop: 'none', borderLeft: 'none' }} />
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          onClick={() => setViewingImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setViewingImage(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={24} color="#fff" />
          </button>

          {/* Image container with fixed size */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80vw',
              maxWidth: 900,
              height: '80vh',
              maxHeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 20,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <img 
              src={viewingImage} 
              alt="Full size"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
