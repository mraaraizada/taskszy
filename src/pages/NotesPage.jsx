import { useState, useRef, useEffect } from 'react';
import { notify } from '../lib/notify';
import { Plus, Tag, Clock, Trash2, X, StickyNote, Sheet, ChevronDown, UserPlus, User, Search, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { subscribeToNoteConflicts } from '../lib/conflictResolution';

const TAG_COLORS = [
  { label: 'Dev',       bg: '#EEF2FF', color: '#3B5BFC' },
  { label: 'Design',    bg: '#F5F3FF', color: '#7C3AED' },
  { label: 'Personal',  bg: '#ECFDF5', color: '#12C479' },
  { label: 'React',     bg: '#FFF0F0', color: '#EF4444' },
  { label: 'Health',    bg: '#FFF7ED', color: '#F97316' },
  { label: 'Finance',   bg: '#F0FDF4', color: '#059669' },
  { label: 'Travel',    bg: '#E7F5FD', color: '#1DA1F2' },
  { label: 'Cooking',   bg: '#FEF9C3', color: '#CA8A04' },
];

const RANDOM_COLORS = [
  { color: '#3B5BFC', bg: '#EEF2FF' }, { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#12C479', bg: '#ECFDF5' }, { color: '#EF4444', bg: '#FFF0F0' },
  { color: '#F97316', bg: '#FFF7ED' }, { color: '#059669', bg: '#F0FDF4' },
  { color: '#1DA1F2', bg: '#E7F5FD' }, { color: '#CA8A04', bg: '#FEF9C3' },
  { color: '#EC4899', bg: '#FDF2F8' }, { color: '#06B6D4', bg: '#ECFEFF' },
  { color: '#8B5CF6', bg: '#F5F3FF' }, { color: '#D97706', bg: '#FFFBEB' },
];

function randomTagColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

// ── Inline sheet viewer ──────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadStyle(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}

function SheetViewer({ sheetItem, onAutoSave }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [ready, setReady] = useState(false);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    loadStyle('/xspreadsheet.css');
    loadScript('/xspreadsheet.js').then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    containerRef.current.innerHTML = '';
    instanceRef.current = null;
    const xs = window.x_spreadsheet;
    if (!xs) return;
    
    // Initialize spreadsheet
    instanceRef.current = xs(containerRef.current, {
      mode: 'edit', showToolbar: true, showGrid: true, showContextmenu: true,
      view: {
        height: () => containerRef.current?.clientHeight || 500,
        width: () => containerRef.current?.clientWidth || 700,
      },
      row: { len: 100, height: 25 },
      col: { len: 26, width: 100, indexWidth: 60, minWidth: 60 },
      style: { bgcolor: '#ffffff', align: 'left', valign: 'middle', textwrap: false, strike: false, underline: false, color: '#0a0a0a', font: { name: 'Inter', size: 10, bold: false, italic: false } },
    });
    
    // Load existing sheet data if available
    // IMPORTANT: Only load the FIRST sheet to prevent multiple sheets/tabs
    if (sheetItem.sheetData) {
      try {
        let dataToLoad = sheetItem.sheetData;
        
        // If data is an array of sheets, extract only the first sheet
        if (Array.isArray(sheetItem.sheetData)) {
          if (sheetItem.sheetData.length > 1) {
            console.warn('⚠️ Multiple sheets detected! Using only first sheet to prevent data split');
          }
          // Wrap first sheet in array to maintain x-spreadsheet format
          dataToLoad = sheetItem.sheetData.length > 0 ? [sheetItem.sheetData[0]] : sheetItem.sheetData;
        }
        
        console.log('📊 Loading sheet data:', {
          hasData: !!sheetItem.sheetData,
          originalSheetsCount: Array.isArray(sheetItem.sheetData) ? sheetItem.sheetData.length : 'N/A',
          loadingSheetsCount: Array.isArray(dataToLoad) ? dataToLoad.length : 'N/A',
          forcedSingleSheet: Array.isArray(sheetItem.sheetData) && sheetItem.sheetData.length > 1
        });
        
        instanceRef.current.loadData(dataToLoad);
      } catch (error) {
        console.warn('Failed to load sheet data:', error);
      }
    }
    
    // Set up autosave on change
    if (instanceRef.current && onAutoSave) {
      // Listen for cell changes
      instanceRef.current.on('cell-edited', () => {
        // Clear existing timer
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        
        // Set new timer to save after 2 seconds of inactivity
        autoSaveTimerRef.current = setTimeout(() => {
          try {
            const data = instanceRef.current.getData();
            
            // IMPORTANT: Only save the FIRST sheet to prevent multiple sheets/tabs
            let dataToSave = data;
            if (Array.isArray(data)) {
              if (data.length > 1) {
                console.warn('⚠️ Multiple sheets detected on save! Saving only first sheet');
              }
              // Always save only the first sheet wrapped in array
              dataToSave = data.length > 0 ? [data[0]] : data;
            }
            
            console.log('💾 Autosaving sheet data:', {
              originalSheetsCount: Array.isArray(data) ? data.length : 'N/A',
              savingSheetsCount: Array.isArray(dataToSave) ? dataToSave.length : 'N/A',
              forcedSingleSheet: Array.isArray(data) && data.length > 1
            });
            
            onAutoSave(dataToSave);
          } catch (error) {
            console.error('Failed to autosave sheet:', error);
          }
        }, 2000);
      });
    }
    
    // Handle resize events to update spreadsheet dimensions
    const handleResize = () => {
      if (instanceRef.current && containerRef.current) {
        try {
          // Force spreadsheet to recalculate its size
          instanceRef.current.reRender();
        } catch (error) {
          console.warn('Failed to resize spreadsheet:', error);
        }
      }
    };
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to detect container size changes
    let resizeObserver;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }
    
    // Trigger initial resize after a short delay
    setTimeout(handleResize, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, [ready, sheetItem.id, onAutoSave]);

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid #EEF2FF', borderTopColor: '#3B5BFC', animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

const INITIAL_NOTES = [];

export default function NotesPage({ deletedBy = null, currentUser = null, onNavigateToTask = null, selectedScribeId = null, onScribeOpened = null, setPageFilteredData = null }) {
  const { addToTrash, team, notes: globalNotes, updateNote: updateGlobalNote, addNote: addGlobalNote, deleteNote: deleteGlobalNote, currentUser: contextUser, workspaceId, refreshData } = useApp();
  const activeUser = currentUser || contextUser;
  
  // STRICT role checks - only treat as admin/management if explicitly set
  // Check both userRole (from user profile) and role (from team data)
  const isAdmin = (
    activeUser?.userRole === 'admin' || 
    activeUser?.role === 'Admin' ||
    activeUser?.role === 'Administrator'
  );
  
  const isManagement = (
    activeUser?.userRole === 'management' || 
    activeUser?.role === 'Management' ||
    activeUser?.role?.toLowerCase().includes('management') ||
    activeUser?.role?.toLowerCase().includes('manager')
  );

  // Debug: Log user role info
  useEffect(() => {
    console.log('🔐 User Role Check:', {
      name: activeUser?.name,
      userRole: activeUser?.userRole,
      role: activeUser?.role,
      memberId: activeUser?.memberId,
      id: activeUser?.id,
      uid: activeUser?.uid,
      isAdmin,
      isManagement,
      '⚠️ FINAL RESULT': isAdmin ? '🚨 TREATED AS ADMIN' : isManagement ? '🚨 TREATED AS MANAGEMENT' : '✅ TREATED AS REGULAR MEMBER',
      calculation: {
        'userRole === admin': activeUser?.userRole === 'admin',
        'role === Admin': activeUser?.role === 'Admin',
        'role === Administrator': activeUser?.role === 'Administrator',
        'userRole === management': activeUser?.userRole === 'management',
        'role === Management': activeUser?.role === 'Management',
        'role includes management': activeUser?.role?.toLowerCase().includes('management'),
        'role includes manager': activeUser?.role?.toLowerCase().includes('manager')
      },
      '📋 Raw role value': `"${activeUser?.role}"`,
      '📋 Raw userRole value': `"${activeUser?.userRole}"`
    });
  }, [activeUser?.name, activeUser?.userRole, activeUser?.role, isAdmin, isManagement]);

  // Debug: Log user info on mount
  useEffect(() => {
    const userInfo = {
      name: activeUser?.name,
      id: activeUser?.id,
      uid: activeUser?.uid,
      memberId: activeUser?.memberId,
      userRole: activeUser?.userRole,
      role: activeUser?.role,
      isAdmin,
      isManagement
    };
    console.log('👤 Active User Info:', userInfo);
    
    // Check if memberId matches id
    if (activeUser?.id && activeUser?.memberId) {
      if (activeUser.id === activeUser.memberId) {
        console.log('✅ memberId matches id:', activeUser.id);
      } else {
        console.log('⚠️ MISMATCH: id =', activeUser.id, 'but memberId =', activeUser.memberId);
      }
    } else if (activeUser?.id && !activeUser?.memberId) {
      console.log('⚠️ memberId is undefined! Using id:', activeUser.id);
    }
  }, [activeUser?.id, activeUser?.memberId]);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(null);
  const [baseText, setBaseText] = useState(null); // NEW: Track base text for 3-way merge
  const [newTag, setNewTag]     = useState('');
  const [sheetEditingTitle, setSheetEditingTitle] = useState(false);
  const [sheetDraftTitle, setSheetDraftTitle] = useState('');
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Auto-select scribe when navigating from task modal
  useEffect(() => {
    console.log('🔍 Auto-select scribe effect triggered:', {
      selectedScribeId,
      hasGlobalNotes: !!globalNotes,
      globalNotesCount: globalNotes?.length || 0,
      editing,
      allNoteIds: globalNotes?.map(n => ({ id: n.id, title: n.title, type: n.type }))
    });
    
    if (selectedScribeId && globalNotes && globalNotes.length > 0 && !editing) {
      // Try multiple comparison methods to find the scribe
      let scribeToOpen = globalNotes.find(n => String(n.id) === String(selectedScribeId));
      
      if (!scribeToOpen) {
        // Try numeric comparison
        scribeToOpen = globalNotes.find(n => n.id === selectedScribeId);
      }
      
      if (!scribeToOpen) {
        // Try parsing as number
        const numericId = Number(selectedScribeId);
        if (!isNaN(numericId)) {
          scribeToOpen = globalNotes.find(n => Number(n.id) === numericId);
        }
      }
      
      if (scribeToOpen) {
        console.log('✅ Found scribe to open:', {
          id: scribeToOpen.id,
          title: scribeToOpen.title,
          type: scribeToOpen.type,
          searchedFor: selectedScribeId
        });
        setSelected(scribeToOpen);
        // For sheets, ensure we're not in editing mode so it displays properly
        setEditing(false);
        if (onScribeOpened) onScribeOpened(); // Clear the selectedScribeId in parent
      } else {
        console.warn('❌ Scribe not found:', {
          searchedFor: selectedScribeId,
          availableIds: globalNotes.map(n => n.id)
        });
      }
    }
  }, [selectedScribeId, globalNotes, editing, onScribeOpened]);
  const [showJoin, setShowJoin] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const createMenuRef = useRef(null);
  
  // Conflict detection state
  const [conflictWarning, setConflictWarning] = useState(null);
  const [lastKnownModifiedAt, setLastKnownModifiedAt] = useState(null);
  const conflictUnsubscribeRef = useRef(null);
  
  // Pagination state for sidebar
  const [visibleNotesCount, setVisibleNotesCount] = useState(10);

  // Function to find note by join code - uses one-time query to avoid listener conflicts
  const findNoteByJoinCode = async (code) => {
    if (!workspaceId) {
      console.error('No workspaceId available');
      return null;
    }

    try {
      console.log('🔍 Searching for note with join code:', code);
      
      // First check globalNotes (already loaded)
      const inMemory = (globalNotes || []).find(n => n.joinCode && n.joinCode.toUpperCase() === code.toUpperCase());
      if (inMemory) {
        console.log('✅ Found in memory:', inMemory.title);
        return inMemory;
      }

      // Query Firestore directly (one-time query, not a listener)
      const notesRef = collection(db, `workspaces/${workspaceId}/notes`);
      const q = query(notesRef, where('joinCode', '==', code.toUpperCase()));
      
      console.log('📡 Querying Firestore for join code...');
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('❌ No note found with code:', code);
        return null;
      }

      const doc = snapshot.docs[0];
      const noteData = { id: doc.id, ...doc.data() };
      console.log('✅ Found in Firestore:', noteData.title);
      return noteData;
    } catch (error) {
      console.error('❌ Error finding note:', error);
      return null;
    }
  };

  // Filter global notes by access:
  // Firestore rules now handle all filtering - each user only sees their own scribes
  // No client-side filtering needed
  const visibleNotes = globalNotes || [];
  
  console.log('📝 Visible notes (filtered by Firestore rules):', visibleNotes.length);

  const notes = visibleNotes;
  
  // Update selected note when globalNotes changes (to reflect member updates)
  useEffect(() => {
    if (selected && globalNotes && globalNotes.length > 0) {
      const updatedSelected = globalNotes.find(n => n.id === selected.id);
      if (updatedSelected) {
        // Check if members array has changed
        const oldMembers = JSON.stringify(selected.members || []);
        const newMembers = JSON.stringify(updatedSelected.members || []);
        
        if (oldMembers !== newMembers) {
          console.log('🔄 Updating selected note with new members:', {
            old: selected.members,
            new: updatedSelected.members
          });
          setSelected(updatedSelected);
        }
      }
    }
    
    // Reset editing states when selection changes
    setSheetEditingTitle(false);
    setEditing(false);
  }, [globalNotes, selected?.id]);
  
  // Debug: Log once when component mounts or notes change
  useEffect(() => {
    console.log('🔍 NotesPage Debug:', {
      globalNotesCount: globalNotes?.length || 0,
      activeUser: {
        name: activeUser?.name,
        id: activeUser?.id,
        uid: activeUser?.uid,
        memberId: activeUser?.memberId,
        isAdmin,
        isManagement
      }
    });
    
    if (globalNotes && globalNotes.length > 0) {
      console.log('📝 Notes loaded from Firestore:', globalNotes.length, 'notes');
      console.log('🔍 All notes:', globalNotes.map(n => ({
        id: n.id,
        title: n.title,
        members: n.members,
        createdBy: n.createdBy
      })));
    } else {
      console.log('⚠️ No notes in globalNotes from Firestore - Database may be empty or Firestore rules blocking access');
      console.log('💡 Check: Does getUserData().memberId match the ID in note.members array?');
    }
  }, [globalNotes?.length, activeUser?.id]);
  const visible = notes.filter(n => !n.archived);
  
  // Paginated notes for display
  const displayedNotes = visible.slice(0, visibleNotesCount);
  
  // Update filtered data for search - use FULL visible data, not just paginated
  useEffect(() => {
    if (setPageFilteredData) {
      setPageFilteredData({ notes: visible }); // Search all visible notes, not just current page
    }
  }, [visible.length, visibleNotesCount, setPageFilteredData]);

  // For task-linked scribes: only admin/management can edit title, tags, delete
  // For personal notes: creator and added members can edit
  const canEditScribe = (note) => {
    if (!note) return false;
    
    // Admin and management can always edit
    if (isAdmin || isManagement) return true;
    
    // For task-linked notes, only admin/management can edit
    if (note.taskId) return false;
    
    // For personal notes: creator can edit
    const creatorName = typeof note.createdBy === 'string' ? note.createdBy : note.createdBy?.name;
    const creatorUid = typeof note.createdBy === 'object' ? note.createdBy?.uid : null;
    if (creatorName === activeUser?.name || creatorUid === activeUser?.uid) return true;
    
    // Members added to the note can also edit (use memberId for correct identification)
    const userMemberId = activeUser?.memberId || activeUser?.id;
    if (note.members && userMemberId && note.members.map(id => parseInt(id)).includes(parseInt(userMemberId))) return true;
    
    return false;
  };

  // Separate permission for title and tags: only creator (and admin/management) can edit
  const canEditTitleAndTags = (note) => {
    if (!note) return false;
    
    // Admin and management can always edit
    if (isAdmin || isManagement) return true;
    
    // For task-linked notes, only admin/management can edit
    if (note.taskId) return false;
    
    // For personal notes: only creator can edit title and tags
    const creatorName = typeof note.createdBy === 'string' ? note.createdBy : note.createdBy?.name;
    const creatorUid = typeof note.createdBy === 'object' ? note.createdBy?.uid : null;
    if (creatorName === activeUser?.name || creatorUid === activeUser?.uid) return true;
    
    // Joined members CANNOT edit title and tags
    return false;
  };

  // Remove the setNotes wrapper - we'll use addGlobalNote directly

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectNote(note) {
    if (editing) return;
    setSelected(note);
  }

  function newNote() {
    console.log('📝 Creating new note with creator info:', {
      name: activeUser?.name,
      id: activeUser?.id,
      memberId: activeUser?.memberId,
      uid: activeUser?.uid,
      hasUid: !!activeUser?.uid
    });
    
    // Validate that user has a uid before creating note
    if (!activeUser?.uid) {
      console.error('❌ Cannot create note: User uid is missing');
      notify.error('Cannot create note: User not properly authenticated');
      return;
    }
    
    const n = { 
      id: Date.now(), 
      type: 'note', 
      title: 'Untitled Note', 
      tags: [], 
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), 
      body: '', 
      archived: false, 
      joinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      taskId: null, // Personal note, not task-linked
      createdBy: {
        uid: activeUser.uid, // Required - validated above
        name: activeUser.name || 'User',
        avatar: activeUser.avatar || 'U',
        avatarImg: activeUser.avatarImg || null,
        color: activeUser.color || '#3B5BFC',
        role: activeUser.role || 'User',
      },
      members: [], // Don't add creator to members - they're already the creator
    };
    console.log('📝 New note created:', {
      id: n.id,
      title: n.title,
      members: n.members,
      createdBy: n.createdBy,
      createdByUid: n.createdBy.uid
    });
    
    addGlobalNote(n);
    setSelected(n);
    setDraft({ ...n });
    setEditing(true);
    setShowCreateMenu(false);
  }

  function newSheet() {
    console.log('📊 Creating new sheet with creator info:', {
      name: activeUser?.name,
      id: activeUser?.id,
      memberId: activeUser?.memberId,
      uid: activeUser?.uid,
      hasUid: !!activeUser?.uid
    });
    
    // Validate that user has a uid before creating sheet
    if (!activeUser?.uid) {
      console.error('❌ Cannot create sheet: User uid is missing');
      notify.error('Cannot create sheet: User not properly authenticated');
      return;
    }
    
    const n = { 
      id: Date.now(), 
      type: 'sheet', 
      title: 'Untitled Sheet', 
      tags: [], 
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), 
      archived: false, 
      joinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      taskId: null, // Personal sheet, not task-linked
      createdBy: {
        uid: activeUser.uid, // Required - validated above
        name: activeUser.name || 'User',
        avatar: activeUser.avatar || 'U',
        avatarImg: activeUser.avatarImg || null,
        color: activeUser.color || '#3B5BFC',
        role: activeUser.role || 'User',
      },
      members: [], // Don't add creator to members - they're already the creator
    };
    console.log('📊 New sheet created:', {
      id: n.id,
      title: n.title,
      members: n.members,
      createdBy: n.createdBy,
      createdByUid: n.createdBy.uid
    });
    
    addGlobalNote(n);
    setSelected(n);
    setEditing(false);
    setShowCreateMenu(false);
  }

  function startEdit() {
    setDraft({ ...selected });
    setEditing(true);
    
    // NEW: Store base text for 3-way merge
    setBaseText(selected.body || '');
    
    setConflictWarning(null);
    
    // Handle lastModifiedAt - could be Timestamp, Date, or number
    let modifiedAtTime = Date.now();
    if (selected.lastModifiedAt) {
      if (typeof selected.lastModifiedAt.toMillis === 'function') {
        // Firestore Timestamp
        modifiedAtTime = selected.lastModifiedAt.toMillis();
      } else if (selected.lastModifiedAt instanceof Date) {
        // JavaScript Date
        modifiedAtTime = selected.lastModifiedAt.getTime();
      } else if (typeof selected.lastModifiedAt === 'number') {
        // Already a timestamp
        modifiedAtTime = selected.lastModifiedAt;
      }
    }
    setLastKnownModifiedAt(modifiedAtTime);
    
    // Subscribe to real-time conflict detection
    if (workspaceId && selected?.id && activeUser?.uid) {
      conflictUnsubscribeRef.current = subscribeToNoteConflicts(
        workspaceId,
        selected.id,
        activeUser.uid,
        (conflict) => {
          console.log('⚠️ Conflict detected:', conflict);
          setConflictWarning({
            message: 'Another user is editing this note',
            modifiedBy: conflict.modifiedBy,
            modifiedAt: new Date(conflict.modifiedAt).toLocaleTimeString(),
          });
        }
      );
    }
  }

  function saveNote() {
    // Extract id from draft and pass only the fields that should be updated
    const { id, ...updates } = draft;
    
    console.log('💾 Saving note:', {
      noteId: id,
      updateKeys: Object.keys(updates),
      hasBaseText: !!baseText,
    });
    
    // NEW: Pass base text and user info for intelligent merge
    const mergeContext = {
      baseText: baseText,
      currentUserId: activeUser?.uid,
      currentUserName: activeUser?.name || 'Unknown User',
    };
    
    updateGlobalNote(id, updates, mergeContext)
      .then((result) => {
        if (result?.merged) {
          // Conflict was resolved
          notify.success('Note saved with conflict resolution', {
            description: result.conflictCount > 0 
              ? `${result.conflictCount} conflict(s) resolved`
              : 'Your changes were merged automatically',
          });
          // Update draft with merged data (preserve id)
          setDraft({ ...result.data, id });
          setSelected({ ...result.data, id });
        } else {
          // No conflict
          setSelected({ ...updates, id });
          notify.noteSaved(draft.title || 'Untitled Note');
        }
        setEditing(false);
        setDraft(null);
        setBaseText(null); // Clear base text
        setConflictWarning(null);
        
        // Cleanup conflict listener
        if (conflictUnsubscribeRef.current) {
          conflictUnsubscribeRef.current();
          conflictUnsubscribeRef.current = null;
        }
      })
      .catch((error) => {
        console.error('Failed to save note:', error);
        notify.error('Failed to save note', {
          description: error.message || 'Please try again',
        });
      });
  }

  function cancelEdit() {
    if (!selected.title && selected.body === '') {
      deleteGlobalNote(selected.id);
      setSelected(notes.find(n => n.id !== selected.id) || null);
    }
    setEditing(false);
    setDraft(null);
    setBaseText(null); // Clear base text
    setConflictWarning(null);
    
    // Cleanup conflict listener
    if (conflictUnsubscribeRef.current) {
      conflictUnsubscribeRef.current();
      conflictUnsubscribeRef.current = null;
    }
  }

  function archiveNote(id) {
    const note = notes.find(n => n.id === id);
    updateGlobalNote(id, { archived: !note.archived });
    if (selected?.id === id) setSelected(null);
  }

  function deleteNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
      addToTrash({ ...note, _trashType: 'note', _deletedBy: deletedBy, _deletedAt: new Date() });
      // Show appropriate notification based on type
      if (note.type === 'sheet') {
        notify.sheetDeleted(note.title);
      } else {
        notify.noteDeleted(note.title);
      }
    }
    deleteGlobalNote(id);
    if (selected?.id === id) setSelected(null);
  }

  function toggleMember(memberId) {
    const current = selected?.members || [];
    // Convert to number for consistent comparison
    const memberIdNum = parseInt(memberId);
    const isAdding = !current.map(id => parseInt(id)).includes(memberIdNum);
    const updated = isAdding
      ? [...current, memberIdNum]
      : current.filter(id => parseInt(id) !== memberIdNum);
    
    // Find the member's UID from team data
    const member = team.find(m => parseInt(m.id) === memberIdNum);
    const memberUid = member?.uid;
    
    // Get creator's UID to ensure they always stay in accessList
    const creatorUid = selected?.createdBy?.uid || activeUser?.uid;
    
    // Update accessList if we have the member's UID
    const currentAccessList = selected?.accessList || [];
    let updatedAccessList = [...currentAccessList];
    
    // Ensure creator is always in accessList
    if (creatorUid && !updatedAccessList.includes(creatorUid)) {
      updatedAccessList.push(creatorUid);
      console.log('🔑 Ensuring creator UID in accessList:', creatorUid);
    }
    
    if (memberUid) {
      if (isAdding && !updatedAccessList.includes(memberUid)) {
        updatedAccessList.push(memberUid);
        console.log('🔑 Adding member UID to accessList:', memberUid);
      } else if (!isAdding) {
        // Don't remove creator from accessList
        if (memberUid !== creatorUid) {
          updatedAccessList = updatedAccessList.filter(uid => uid !== memberUid);
          console.log('🔑 Removing member UID from accessList:', memberUid);
        } else {
          console.log('⚠️ Cannot remove creator from accessList');
        }
      }
    }
    
    // Update in Firestore first - always include accessList to ensure creator stays
    const updates = { 
      members: updated,
      accessList: updatedAccessList
    };
    
    updateGlobalNote(selected.id, updates)
      .then(() => {
        console.log('✅ Member list updated in Firestore:', updated);
        console.log('✅ AccessList updated:', updatedAccessList);
        
        // Update local selected state
        const updatedNote = { ...selected, members: updated, accessList: updatedAccessList };
        setSelected(updatedNote);
        
        // Show notification based on note type
        const itemType = selected.type === 'sheet' ? 'sheet' : 'note';
        if (isAdding) {
          if (member) {
            notify.success(`${member.name} added to ${itemType}`);
          }
        } else {
          if (member) {
            notify.success(`${member.name} removed from ${itemType}`);
          }
        }
      })
      .catch((error) => {
        console.error('❌ Failed to update member list:', error);
        notify.error('Failed to update members');
      });
  }

  function toggleDraftTag(tag) {
    setDraft(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  }

  function addCustomTag() {
    const label = newTag.trim();
    if (!label) return;
    if (draft.tags.includes(label)) { setNewTag(''); return; }
    const { color, bg } = randomTagColor();
    setDraft(prev => ({
      ...prev,
      tags: [...prev.tags, label],
      tagColors: { ...(prev.tagColors || {}), [label]: { color, bg } },
    }));
    setNewTag('');
  }

  // Autosave handler for sheets
  function handleSheetAutoSave(sheetData) {
    if (!selected || selected.type !== 'sheet') return;
    
    console.log('💾 Autosaving sheet:', selected.id);
    
    const updates = {
      sheetData: sheetData,
      lastModifiedAt: Date.now(),
    };
    
    updateGlobalNote(selected.id, updates)
      .then(() => {
        console.log('✅ Sheet autosaved successfully');
        // Update local selected state
        setSelected(prev => ({ ...prev, ...updates }));
      })
      .catch((error) => {
        console.error('❌ Failed to autosave sheet:', error);
      });
  }

  const tagStyle = (label, note) => {
    const custom = note?.tagColors?.[label] || draft?.tagColors?.[label];
    if (custom) return { background: custom.bg, color: custom.color };
    const t = TAG_COLORS.find(t => t.label === label) || { bg: '#F3F4F6', color: 'var(--text-secondary)' };
    return { background: t.bg, color: t.color };
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: 'var(--bg-main)', padding: '20px 24px', gap: 16 }}>

      {/* ── Left panel: note list ── */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Join button */}
        {!showJoin ? (
          <button
            onClick={() => { setShowJoin(true); setJoinInput(''); setJoinError(''); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, border: '1.5px solid #C7D4FF', background: '#EEF2FF', color: '#3B5BFC', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.borderColor = '#3B5BFC'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D4FF'; }}
          >
            <Plus size={13} color="#3B5BFC" strokeWidth={2.5} />
            Join with Code
          </button>
        ) : (
          <div style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid #C7D4FF', padding: '14px', boxShadow: '0 4px 16px rgba(59,91,252,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={13} color="#3B5BFC" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Join with Code</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Enter the invite code</div>
              </div>
              <button onClick={() => { setShowJoin(false); setJoinInput(''); setJoinError(''); }} style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: 6, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={12} color="#9CA3AF" />
              </button>
            </div>
            <input
              autoFocus
              value={joinInput}
              onChange={e => { setJoinInput(e.target.value.toUpperCase()); setJoinError(''); }}
              placeholder="e.g. AB12CD"
              maxLength={8}
              style={{ width: '100%', height: 40, borderRadius: 10, border: `1.5px solid ${joinError ? '#FCA5A5' : '#C7D4FF'}`, padding: '0 14px', fontSize: 16, fontWeight: 800, letterSpacing: '4px', color: '#3B5BFC', outline: 'none', background: '#F5F8FF', fontFamily: 'monospace', boxSizing: 'border-box', textAlign: 'center', marginBottom: 8 }}
              onFocus={e => e.target.style.borderColor = '#3B5BFC'}
              onBlur={e => e.target.style.borderColor = joinError ? '#FCA5A5' : '#C7D4FF'}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  const code = joinInput.trim().toUpperCase();
                  if (!code) return;
                  
                  // Search for note by join code
                  const match = await findNoteByJoinCode(code);
                  
                  if (match) { 
                    console.log('📝 Found note:', match.title);
                    console.log('👤 Current user ID:', activeUser?.id);
                    console.log('👥 Current members:', match.members);
                    
                    // Check if user is already a member (use memberId for correct identification)
                    const userMemberId = activeUser?.memberId || activeUser?.id;
                    if (userMemberId && match.members?.map(id => parseInt(id)).includes(parseInt(userMemberId))) {
                      console.log('ℹ️ User already in members');
                      setSelected(match);
                      notify.success(`Already joined: ${match.title}`);
                      setShowJoin(false); 
                      setJoinInput(''); 
                      setJoinError('');
                      return;
                    }
                    
                    // Add current user to the note's members (use memberId for correct identification)
                    if (userMemberId) {
                      const userIdNum = parseInt(userMemberId);
                      const updatedMembers = [...(match.members || []).map(id => parseInt(id)), userIdNum];
                      console.log('➕ Adding user to members:', updatedMembers);
                      console.log('👤 User memberId being added:', userIdNum);
                      console.log('👤 User name:', activeUser?.name);
                      
                      // Also add user's UID to accessList for Firestore permissions
                      const updatedAccessList = [...(match.accessList || [])];
                      if (activeUser?.uid && !updatedAccessList.includes(activeUser.uid)) {
                        updatedAccessList.push(activeUser.uid);
                        console.log('🔑 Adding user UID to accessList:', activeUser.uid);
                      }
                      
                      try {
                        // Update in Firestore FIRST - include both members and accessList
                        await updateGlobalNote(match.id, { 
                          members: updatedMembers,
                          accessList: updatedAccessList 
                        });
                        console.log('✅ Updated in Firestore with accessList');
                        
                        // Also save to user's profile - add this scribe to their joinedScribes array
                        if (activeUser?.uid && workspaceId) {
                          try {
                            const userRef = doc(db, 'users', activeUser.uid);
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                              const userData = userSnap.data();
                              const joinedScribes = userData.joinedScribes || [];
                              if (!joinedScribes.includes(match.id)) {
                                await updateDoc(userRef, {
                                  joinedScribes: [...joinedScribes, match.id]
                                });
                                console.log('✅ Saved joined scribe to user profile');
                              }
                            }
                          } catch (err) {
                            console.warn('⚠️ Could not update user profile:', err);
                          }
                        }
                        
                        // Update local state
                        const updatedNote = { ...match, members: updatedMembers };
                        
                        // Force refresh to get updated note from Firestore
                        await refreshData();
                        
                        // Select the note after a short delay to ensure Firestore listener has updated
                        setTimeout(() => {
                          setSelected(updatedNote);
                        }, 500);
                        
                        notify.success(`Joined: ${match.title}`);
                      } catch (error) {
                        console.error('❌ Failed to join:', error);
                        notify.error('Failed to join note');
                      }
                    } else {
                      console.log('❌ No user ID available');
                      notify.error('User ID not found');
                    }
                    setShowJoin(false); 
                    setJoinInput(''); 
                    setJoinError('');
                  } else {
                    setJoinError('Code not found');
                  }
                }
                if (e.key === 'Escape') { setShowJoin(false); setJoinInput(''); setJoinError(''); }
              }}
            />
            {joinError && <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 8, fontWeight: 600, textAlign: 'center' }}>{joinError}</div>}
            <button
              onClick={async () => {
                const code = joinInput.trim().toUpperCase();
                if (!code) return;
                
                // Search for note by join code
                const match = await findNoteByJoinCode(code);
                
                if (match) { 
                  console.log('📝 Found note:', match.title);
                  console.log('👤 Current user ID:', activeUser?.id);
                  console.log('👥 Current members:', match.members);
                  
                  // Check if user is already a member (use memberId for correct identification)
                  const userMemberId = activeUser?.memberId || activeUser?.id;
                  if (userMemberId && match.members?.map(id => parseInt(id)).includes(parseInt(userMemberId))) {
                    console.log('ℹ️ User already in members');
                    setSelected(match);
                    notify.success(`Already joined: ${match.title}`);
                    setShowJoin(false); 
                    setJoinInput(''); 
                    setJoinError('');
                    return;
                  }
                  
                  // Add current user to the note's members (use memberId for correct identification)
                  if (userMemberId) {
                    const userIdNum = parseInt(userMemberId);
                    const updatedMembers = [...(match.members || []).map(id => parseInt(id)), userIdNum];
                    console.log('➕ Adding user to members:', updatedMembers);
                    console.log('👤 User memberId being added:', userIdNum);
                    console.log('👤 User name:', activeUser?.name);
                    
                    // Also add user's UID to accessList for Firestore permissions
                    const updatedAccessList = [...(match.accessList || [])];
                    if (activeUser?.uid && !updatedAccessList.includes(activeUser.uid)) {
                      updatedAccessList.push(activeUser.uid);
                      console.log('🔑 Adding user UID to accessList:', activeUser.uid);
                    }
                    
                    try {
                      // Update in Firestore FIRST - include both members and accessList
                      await updateGlobalNote(match.id, { 
                        members: updatedMembers,
                        accessList: updatedAccessList 
                      });
                      console.log('✅ Updated in Firestore with accessList');
                      
                      // Also save to user's profile - add this scribe to their joinedScribes array
                      if (activeUser?.uid && workspaceId) {
                        try {
                          const userRef = doc(db, 'users', activeUser.uid);
                          const userSnap = await getDoc(userRef);
                          if (userSnap.exists()) {
                            const userData = userSnap.data();
                            const joinedScribes = userData.joinedScribes || [];
                            if (!joinedScribes.includes(match.id)) {
                              await updateDoc(userRef, {
                                joinedScribes: [...joinedScribes, match.id]
                              });
                              console.log('✅ Saved joined scribe to user profile');
                            }
                          }
                        } catch (err) {
                          console.warn('⚠️ Could not update user profile:', err);
                        }
                      }
                      
                      // Update local state
                      const updatedNote = { ...match, members: updatedMembers };
                      
                      // Force refresh to get updated note from Firestore
                      await refreshData();
                      
                      // Select the note after a short delay to ensure Firestore listener has updated
                      setTimeout(() => {
                        setSelected(updatedNote);
                      }, 500);
                      
                      notify.success(`Joined: ${match.title}`);
                    } catch (error) {
                      console.error('❌ Failed to join:', error);
                      notify.error('Failed to join note');
                    }
                  } else {
                    console.log('❌ No user ID available');
                    notify.error('User ID not found');
                  }
                  setShowJoin(false); 
                  setJoinInput(''); 
                  setJoinError('');
                } else {
                  setJoinError('Code not found');
                }
              }}
              disabled={!joinInput.trim()}
              style={{ width: '100%', height: 36, borderRadius: 10, border: 'none', background: joinInput.trim() ? 'linear-gradient(135deg, #3B5BFC, #2142D9)' : '#E5E7EB', color: joinInput.trim() ? '#fff' : '#9CA3AF', fontSize: 13, fontWeight: 700, cursor: joinInput.trim() ? 'pointer' : 'not-allowed', boxShadow: joinInput.trim() ? '0 4px 12px rgba(59,91,252,0.3)' : 'none', transition: 'all 0.15s' }}
            >Join</button>
          </div>
        )}

        {/* Create button with dropdown */}
        <div style={{ position: 'relative' }} ref={createMenuRef}>
          <button
            onClick={() => setShowCreateMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,91,252,0.3)', width: '100%', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={15} strokeWidth={2.5} /> Create New</span>
            <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: showCreateMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          {showCreateMenu && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 12, border: '1.5px solid #E8EAEF', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
              <button
                onClick={newNote}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1A1D2E', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StickyNote size={14} color="#7C3AED" />
                </div>
                Note
              </button>
              <div style={{ height: 1, background: '#F0F2F8', margin: '0 10px' }} />
              <button
                onClick={newSheet}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1A1D2E', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = '#ECFDF5'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sheet size={14} color="#12C479" />
                </div>
                Sheet
              </button>
            </div>
          )}
        </div>


        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 16px', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StickyNote size={22} color="#7C3AED" strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Your Scribe is empty</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Great ideas start here — write a note or build a sheet!</div>
            </div>
          )}
          {displayedNotes.map((note) => {
            const hasMembers = (note.members || []).length > 0;
            const isTaskScribe = !!note.taskId;
            
            // Debug: Log member info for task scribes
            if (isTaskScribe) {
              console.log('📋 Scribe card render:', {
                id: note.id,
                title: note.title,
                taskId: note.taskId,
                members: note.members,
                membersCount: (note.members || []).length,
                hasMembers
              });
            }
            
            return (
            <div key={note.id} onClick={() => selectNote(note)} style={{
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: selected?.id === note.id ? '#EEF2FF' : 'var(--bg-surface)',
              border: `1.5px solid ${selected?.id === note.id ? '#C7D4FF' : isTaskScribe ? '#7C3AED40' : hasMembers ? '#3B5BFC' : 'var(--border)'}`,
              boxShadow: hasMembers && selected?.id !== note.id ? '0 0 0 1px #3B5BFC22' : 'none',
              transition: 'all 0.12s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                {note.type === 'sheet'
                  ? <Sheet size={12} color="#12C479" strokeWidth={2} />
                  : <StickyNote size={12} color="#7C3AED" strokeWidth={2} />
                }
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{note.title}</div>
              </div>
              {isTaskScribe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', fontFamily: 'monospace' }}>
                    {note.taskId}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                {(note.tags || []).map((t) => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, ...tagStyle(t, note) }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {note.date}
                </span>
                {(note.members || []).length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: selected?.id === note.id ? '#fff' : 'var(--bg-subtle)', borderRadius: 20, padding: '2px 7px', border: '1px solid var(--border)' }}>
                    <User size={9} color="#6B7280" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{(note.members || []).length}</span>
                  </span>
                )}
              </div>
            </div>
            );
          })}
          
          {/* Load More Button */}
          {visible.length > visibleNotesCount && (
            <button
              onClick={() => setVisibleNotesCount((prev) => prev + 10)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1.5px solid #C7D4FF',
                background: '#EEF2FF',
                color: '#3B5BFC',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 4,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E0E7FF';
                e.currentTarget.style.borderColor = '#3B5BFC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#EEF2FF';
                e.currentTarget.style.borderColor = '#C7D4FF';
              }}
            >
              <ChevronDown size={14} strokeWidth={2.5} />
              Load More
            </button>
          )}
        </div>
      </div>

      {/* ── Right panel: note detail / editor ── */}
      <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden', gap: 0 }}>
        <div style={{ 
          flex: showMemberPanel ? '1 1 auto' : '1 1 100%',
          background: 'var(--bg-surface)', 
          borderRadius: 18, 
          border: '1.5px solid var(--border)', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          minWidth: 0, 
          transition: 'flex 0.3s cubic-bezier(0.22,1,0.36,1)'
        }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #F5F3FF, #EEF2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(124,58,237,0.1)' }}>
              <StickyNote size={34} color="#7C3AED" strokeWidth={1.6} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Ready when you are</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>Select something from the list or hit Create New to spark something great</div>
            </div>
            <button onClick={newNote} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'linear-gradient(135deg, #3B5BFC, #7C3AED)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,91,252,0.3)' }}>
              <Plus size={15} /> Create New Note
            </button>
          </div>
        ) : selected.type === 'sheet' ? (
          /* ── Sheet mode ── */
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {selected.taskId && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTask && onNavigateToTask(selected.taskId)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 6px', background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 20, cursor: onNavigateToTask ? 'pointer' : 'default', fontSize: 11, fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}
                        onMouseEnter={e => { if (onNavigateToTask) e.currentTarget.style.background = '#EDE9FE'; }}
                        onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                      >
                        <span style={{ fontFamily: 'monospace', background: '#7C3AED', color: '#fff', borderRadius: 5, padding: '1px 5px', fontSize: 10 }}>{selected.taskId}</span>
                      </button>
                    )}
                    {sheetEditingTitle ? (
                      <input
                        autoFocus
                        value={sheetDraftTitle}
                        onChange={e => setSheetDraftTitle(e.target.value)}
                        onKeyDown={e => { 
                          if (e.key === 'Enter') {
                            const newTitle = sheetDraftTitle || selected.title;
                            updateGlobalNote(selected.id, { title: newTitle });
                            setSelected({ ...selected, title: newTitle });
                            setSheetEditingTitle(false);
                          }
                          if (e.key === 'Escape') { 
                            setSheetEditingTitle(false); 
                            setSheetDraftTitle(selected.title); 
                          }
                        }}
                        style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', border: 'none', borderBottom: '2px solid #3B5BFC', outline: 'none', background: 'transparent', minWidth: 60, padding: '2px 0' }}
                      />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginRight: 4 }}>{selected.title}</span>
                    )}
                  </div>
                  
                  {/* Tags and date row - on next line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Tags */}
                    {(selected.tags || []).map(t => {
                      const s = selected.tagColors?.[t] || TAG_COLORS.find(tc => tc.label === t) || { color: '#6B7280', bg: '#F3F4F6' };
                      return (
                        <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1.5px solid ${s.color}` }}>
                          {t}
                        </span>
                      );
                    })}
                    {/* New tag input - only show when editing */}
                    {canEditTitleAndTags(selected) && sheetEditingTitle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const label = newTag.trim();
                            if (!label) return;
                            const { color, bg } = randomTagColor();
                            const updated = { ...selected, tags: [...(selected.tags || []), label], tagColors: { ...(selected.tagColors || {}), [label]: { color, bg } } };
                            updateGlobalNote(selected.id, { tags: updated.tags, tagColors: updated.tagColors });
                            setSelected(updated);
                            setNewTag('');
                          }
                        }}
                        placeholder="New tag…"
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', width: 72 }}
                      />
                      <button 
                        onClick={() => {
                          const label = newTag.trim();
                          if (!label) return;
                          const { color, bg } = randomTagColor();
                          const updated = { ...selected, tags: [...(selected.tags || []), label], tagColors: { ...(selected.tagColors || {}), [label]: { color, bg } } };
                          updateGlobalNote(selected.id, { tags: updated.tags, tagColors: updated.tagColors });
                          setSelected(updated);
                          setNewTag('');
                        }}
                        style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#3B5BFC', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    )}
                    {/* Date */}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {selected.date}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  {/* Add member — all members can view the panel */}
                  <button
                    title="Add member"
                    onClick={() => setShowMemberPanel(true)}
                    style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3B5BFC'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <User size={14} color="#6B7280" />
                    <Plus size={10} color="#3B5BFC" strokeWidth={3} style={{ marginLeft: -2, marginTop: -6 }} />
                  </button>
                  {canEditTitleAndTags(selected) && (
                    sheetEditingTitle ? (
                      <button
                        onClick={() => {
                          const newTitle = sheetDraftTitle || selected.title;
                          updateGlobalNote(selected.id, { title: newTitle });
                          setSelected({ ...selected, title: newTitle });
                          setSheetEditingTitle(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: '1.5px solid #12C479', background: '#ECFDF5', color: '#12C479', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Check size={14} /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSheetDraftTitle(selected.title); setSheetEditingTitle(true); }}
                        style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >Edit</button>
                    )
                  )}
                  {canEditTitleAndTags(selected) && (
                  <button onClick={() => setConfirmDeleteId(selected.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                  )}
                </div>
              </div>
            </div>
            <SheetViewer sheetItem={selected} onAutoSave={handleSheetAutoSave} key={`${selected.id}-${showMemberPanel ? 'panel' : 'full'}`} />
          </>
        ) : editing ? (
          /* ── Edit mode ── */
          <>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
              {canEditTitleAndTags(selected) ? (
              <input
                value={draft.title}
                onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
                placeholder="Note title…"
                style={{ width: '100%', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', border: 'none', outline: 'none', background: 'transparent', marginBottom: 10 }}
              />
              ) : (
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>{draft.title}</div>
              )}
              {/* Tag picker */}
              {canEditTitleAndTags(selected) ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Show draft's current tags only */}
                {(draft.tags || []).map(label => {
                  const s = draft.tagColors?.[label] || TAG_COLORS.find(tc => tc.label === label) || { color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <button key={label} onClick={() => toggleDraftTag(label)} style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                      border: `1.5px solid ${s.color}`,
                      background: s.bg,
                      color: s.color,
                    }}>{label}</button>
                  );
                })}
                {/* New tag input - only way to add tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                    placeholder="New tag…"
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', width: 80 }}
                  />
                  <button onClick={addCustomTag} style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#3B5BFC', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus size={11} />
                  </button>
                </div>
              </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(draft.tags || []).map(t => {
                    const s = draft.tagColors?.[t] || TAG_COLORS.find(tc => tc.label === t) || { color: '#6B7280', bg: '#F3F4F6' };
                    return (
                      <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>{t}</span>
                    );
                  })}
                </div>
              )}
            </div>
            
            <textarea
              value={draft.body}
              onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your note here…"
              style={{ flex: 1, padding: '20px 24px', fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={saveNote} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3B5BFC, #2142D9)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,91,252,0.3)' }}>
                Save
              </button>
              <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <X size={13} /> Cancel
              </button>
            </div>
          </>
        ) : (
          /* ── View mode ── */
          <>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{selected.title}</div>
                  {selected.taskId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTask && onNavigateToTask(selected.taskId)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8, padding: '3px 10px 3px 6px', background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 20, cursor: onNavigateToTask ? 'pointer' : 'default', fontSize: 11, fontWeight: 700, color: '#7C3AED' }}
                      onMouseEnter={e => { if (onNavigateToTask) e.currentTarget.style.background = '#EDE9FE'; }}
                      onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                    >
                      <span style={{ fontFamily: 'monospace', background: '#7C3AED', color: '#fff', borderRadius: 5, padding: '1px 5px', fontSize: 10 }}>{selected.taskId}</span>
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(selected.tags || []).map(t => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, ...tagStyle(t, selected) }}>
                        <Tag size={9} style={{ display: 'inline', marginRight: 3 }} />{t}
                      </span>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                      <Clock size={11} /> Last edited &nbsp;{selected.date}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  {/* Add member — all members can view the panel */}
                  <button
                    title="Add member"
                    onClick={() => setShowMemberPanel(true)}
                    style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', position: 'relative' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3B5BFC'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <User size={14} color="#6B7280" />
                    <Plus size={10} color="#3B5BFC" strokeWidth={3} style={{ marginLeft: -2, marginTop: -6 }} />
                  </button>
                  {canEditScribe(selected) && (
                    <button onClick={startEdit} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  )}
                  {canEditTitleAndTags(selected) && (
                  <button onClick={() => setConfirmDeleteId(selected.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                  )}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              <pre style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selected.body || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content yet.</span>}
              </pre>
            </div>
          </>
        )}
        </div>

        {/* ── Member panel — slides in from right ── */}
        {showMemberPanel && (
        <div style={{
          width: 300,
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderLeft: '1.5px solid var(--border)',
          borderRadius: '0 18px 18px 0',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
        }}>
              {/* Header */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Members</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{(selected?.members || []).length} joined</div>
                </div>
                <button onClick={() => { setShowMemberPanel(false); setMemberSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <X size={15} color="#9CA3AF" />
                </button>
              </div>

              {/* Join code - only for creator/admin/management */}
              {canEditTitleAndTags(selected) && (
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Invite Code</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F5F7FF', borderRadius: 10, border: '1.5px solid #E0E7FF' }}>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#3B5BFC', letterSpacing: '3px', fontFamily: 'monospace' }}>{selected?.joinCode || 'N/A'}</span>
                  <button
                    onClick={() => {
                      if (selected?.joinCode) {
                        navigator.clipboard.writeText(selected.joinCode);
                        notify.success('Code copied to clipboard');
                      }
                    }}
                    style={{ fontSize: 10, fontWeight: 700, color: '#3B5BFC', background: '#EEF2FF', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                  >Copy</button>
                </div>
              </div>
              )}

              {/* Search - only for creator/admin/management */}
              {canEditTitleAndTags(selected) && (
              <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    style={{ width: '100%', height: 36, borderRadius: 9, border: '1.5px solid var(--border)', padding: '0 12px 0 32px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-subtle)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              )}

              {/* Creator info */}
              {selected?.createdBy && (
                <div style={{ padding: '10px 18px 6px', flexShrink: 0, borderBottom: '1.5px solid var(--border-light)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Created By</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#EEF2FF', border: '1.5px solid #C7D4FF' }}>
                    {typeof selected.createdBy === 'object' && selected.createdBy.avatarImg ? (
                      <img 
                        src={selected.createdBy.avatarImg} 
                        alt={selected.createdBy.name}
                        style={{ 
                          width: 30, 
                          height: 30, 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1.5px solid var(--border-light)'
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: 30, 
                        height: 30, 
                        borderRadius: '50%', 
                        background: typeof selected.createdBy === 'object' ? selected.createdBy.color : '#3B5BFC', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: 11, 
                        fontWeight: 800, 
                        color: '#fff', 
                        flexShrink: 0 
                      }}>
                        {typeof selected.createdBy === 'object' ? selected.createdBy.avatar : selected.createdBy[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof selected.createdBy === 'string' ? selected.createdBy : selected.createdBy.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#3B5BFC', fontWeight: 600 }}>
                        {typeof selected.createdBy === 'object' ? selected.createdBy.role : 'User'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Joined members */}
              {(selected?.members || []).length > 0 && (
                <div style={{ padding: '10px 18px 12px', flexShrink: 0, maxHeight: 300, overflowY: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Joined ({(selected?.members || []).length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(selected?.members || []).map(memberId => {
                      const m = team.find(t => parseInt(t.id) === parseInt(memberId));
                      if (!m) return null;
                      return (
                        <div key={`joined-${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
                          {/* Show profile picture if available, otherwise show avatar initials */}
                          {m.avatarImg ? (
                            <img 
                              src={m.avatarImg} 
                              alt={m.name}
                              style={{ 
                                width: 30, 
                                height: 30, 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: '1.5px solid var(--border-light)'
                              }} 
                            />
                          ) : (
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: '#12C479', fontWeight: 600 }}>{m.role}</div>
                          </div>
                          {canEditTitleAndTags(selected) && (
                          <button onClick={() => toggleMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                            <X size={13} color="#9CA3AF" />
                          </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All members to select - only for creator/admin/management */}
              {canEditTitleAndTags(selected) && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '0px 18px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Select to Add</div>
                {(!memberSearch.trim() && !isAdmin && !isManagement) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
                    <Search size={20} color="#D1D5DB" strokeWidth={1.8} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>Type a name to search</div>
                  </div>
                ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {team
                    .filter(m => m.status === 'Active') // Only show active users
                    .filter(m => !(selected?.members || []).map(id => parseInt(id)).includes(parseInt(m.id)))
                    .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.role.toLowerCase().includes(memberSearch.toLowerCase()))
                    .map(m => (
                      <div
                        key={`available-${m.id}`}
                        onClick={() => toggleMember(m.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B5BFC'; e.currentTarget.style.background = '#F5F7FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                      >
                        {/* Show profile picture if available, otherwise show avatar initials */}
                        {m.avatarImg ? (
                          <img 
                            src={m.avatarImg} 
                            alt={m.name}
                            style={{ 
                              width: 30, 
                              height: 30, 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1.5px solid var(--border-light)'
                            }} 
                          />
                        ) : (
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{m.role}</div>
                        </div>
                        <Plus size={14} color="#3B5BFC" strokeWidth={2.5} />
                      </div>
                    ))}
                  {team
                    .filter(m => !(selected?.members || []).map(id => parseInt(id)).includes(parseInt(m.id)))
                    .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.role.toLowerCase().includes(memberSearch.toLowerCase()))
                    .length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No members found</div>
                  )}
                </div>
                )}
              </div>
              )}
        </div>
        )}
      </div>

      {/* ── Confirm delete modal ── */}
      {confirmDeleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setConfirmDeleteId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'wsSetupIn 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Trash2 size={20} color="#EF4444" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1D2E', marginBottom: 6 }}>
              {selected?.type === 'sheet' ? 'Delete this sheet?' : 'Delete this item?'}
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24, lineHeight: 1.5 }}>
              This will remove it to the trash.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => { deleteNote(confirmDeleteId); setConfirmDeleteId(null); }}
                style={{ flex: 1, height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
