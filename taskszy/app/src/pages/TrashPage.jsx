import { useState } from 'react';
import { Trash2, RotateCcw, X, FileText, StickyNote, Tag, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FILTERS = ['All', 'Tasks', 'Notes'];

function TrashDetailModal({ item, onClose, onRestore, onDelete }) {
  const isTask = item._trashType === 'task';
  const isNote = item._trashType === 'note';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isNote ? '#FFF7ED' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isNote ? <StickyNote size={18} color="#F97316" strokeWidth={2.5} /> : <FileText size={18} color="#EF4444" strokeWidth={2.5} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: isNote ? '#FFF7ED' : '#FEF2F2', color: isNote ? '#F97316' : '#EF4444' }}>
                {isNote ? 'Note' : 'Task'}
              </span>
              {isTask && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#6B7280', padding: '1px 6px', borderRadius: 4 }}>{item.id}</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-secondary)', fontSize: 16 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Deleted by / when */}
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trash2 size={14} color="#EF4444" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Deleted</span>
              {item._deletedBy && <span style={{ fontSize: 12, color: '#EF4444' }}> by <strong>{item._deletedBy.name}</strong> ({item._deletedBy.role})</span>}
            </div>
            {item._deletedAt && <span style={{ fontSize: 11, color: '#EF4444', flexShrink: 0 }}>{new Date(item._deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
          </div>

          {/* Task details */}
          {isTask && (
            <>
              {item.description && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 10 }}>{item.description}</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Stage</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.stage || '—'}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Deadline</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                </div>
              </div>
              {item.members?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Team Members</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {item.members.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-subtle)', borderRadius: 10, padding: '8px 12px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {item.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.tags.map(tag => (
                    <span key={tag.label} style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      padding: '4px 10px', 
                      borderRadius: 50, 
                      background: tag.bg, 
                      color: '#1A1D2E',
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
              )}
            </>
          )}

          {/* Note details */}
          {isNote && (
            <>
              {item.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={9} />{t}
                    </span>
                  ))}
                </div>
              )}
              {item.body && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Content</div>
                  <pre style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 10 }}>{item.body}</pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1.5px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {isTask && (
            <button onClick={() => { onRestore(item.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #C7D4FF', background: '#EEF2FF', color: '#3B5BFC', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <RotateCcw size={14} /> Restore
            </button>
          )}
          <button onClick={() => { onDelete(item.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Trash2 size={14} /> Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrashPage() {
  const { trashedItems, restoreFromTrash, permanentlyDelete, clearTrash } = useApp();
  const [filter, setFilter] = useState('All');
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filtered = trashedItems.filter(item => {
    if (filter === 'Tasks') return item._trashType === 'task';
    if (filter === 'Notes') return item._trashType === 'note';
    return true;
  });

  const counts = {
    All: trashedItems.length,
    Tasks: trashedItems.filter(i => i._trashType === 'task').length,
    Notes: trashedItems.filter(i => i._trashType === 'note').length,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '20px 28px', overflow: 'hidden' }}>
      <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 18, border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 3, background: 'var(--bg-subtle)', borderRadius: 9, padding: '3px' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: filter === f ? 'var(--bg-surface)' : 'transparent',
                  color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {f}
                </button>
              ))}
            </div>
            {trashedItems.length > 0 && (
              confirmClear ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', borderRadius: 9, padding: '5px 10px', border: '1px solid #FECACA' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>Empty trash?</span>
                  <button onClick={() => { clearTrash(); setConfirmClear(false); }} style={{ background: '#EF4444', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Yes</button>
                  <button onClick={() => setConfirmClear(false)} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}>No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} style={{ padding: '6px 14px', borderRadius: 9, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Empty Trash
                </button>
              )
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '80px 24px', gap: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={30} color="#9CA3AF" strokeWidth={1.6} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Archive is empty</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Deleted tasks and notes will appear here</div>
              </div>
            </div>
          ) : filtered.map(item => (
            <div key={item.id + (item._deletedAt?.toString() || '')}
              onClick={() => setSelectedItem(item)}
              style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: item._trashType === 'note' ? '#FFF7ED' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item._trashType === 'note' ? <StickyNote size={16} color="#F97316" strokeWidth={2.5} /> : <FileText size={16} color="#EF4444" strokeWidth={2.5} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: item._trashType === 'note' ? '#FFF7ED' : '#FEF2F2', color: item._trashType === 'note' ? '#F97316' : '#EF4444' }}>
                    {item._trashType === 'note' ? 'Note' : 'Task'}
                  </span>
                  {item._trashType === 'task' && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#6B7280', padding: '1px 6px', borderRadius: 4 }}>{item.id}</span>}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item._deletedBy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: item._deletedBy.color || '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: '#fff' }}>
                        {item._deletedBy.avatar || item._deletedBy.name?.slice(0,1)}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {item._deletedBy.name}</span>
                    </div>
                  )}
                  {item._deletedAt && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(item._deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {item._trashType === 'task' && (
                  <button onClick={() => restoreFromTrash(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #C7D4FF', background: '#EEF2FF', color: '#3B5BFC', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    <RotateCcw size={12} /> Restore
                  </button>
                )}
                <button onClick={() => permanentlyDelete(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <X size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <TrashDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onRestore={restoreFromTrash}
          onDelete={permanentlyDelete}
        />
      )}
    </div>
  );
}
