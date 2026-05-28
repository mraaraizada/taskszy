/**
 * notify — centralized toast helper with professional Lucide icons.
 * Import this instead of calling toast() directly.
 */
import { toast } from 'sonner';
import { createElement } from 'react';
import {
  CheckCircle, Trash2, Wallet, Plus, RefreshCw, PauseCircle, Hourglass,
  Calendar, UserPlus, UserCheck, User, StickyNote, Lock,
  Send, MessageSquare, RotateCcw, Archive, X, AlertCircle,
  ClipboardCheck, Shield,
} from 'lucide-react';

const SIZE = 16;
const icon = (Icon, color) => createElement(Icon, { size: SIZE, color, strokeWidth: 2.5 });

// ⭐ Custom Rupee icon component
const RupeeIcon = ({ size = 16, color = '#7C3AED' }) => 
  createElement('span', { 
    style: { 
      fontSize: size, 
      fontWeight: 700, 
      color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
    } 
  }, '₹');

const rupeeIcon = (color) => createElement(RupeeIcon, { size: SIZE, color });

const OPTS = (extra = {}) => ({ duration: 3000, ...extra });

export const notify = {
  // ── Task actions ──────────────────────────────────────────────────────────
  taskCreated:   (desc)  => toast.success('Task created',           { description: desc, icon: icon(CheckCircle, '#12C479'), ...OPTS() }),
  taskUpdated:   (desc)  => toast.success('Task updated',           { description: desc, icon: icon(ClipboardCheck, '#3B5BFC'), ...OPTS() }),
  taskDeleted:   (desc)  => toast.error('Task deleted',             { description: desc, icon: icon(Trash2, '#EF4444'), ...OPTS() }),
  taskStage:     (stage, desc) => toast('Stage updated',            { description: desc, icon: icon(RefreshCw, '#3B5BFC'), ...OPTS() }),
  taskPaused:    (desc)  => toast('Task hold',                    { description: desc, icon: icon(Hourglass, '#F97316'), ...OPTS() }),
  taskResumed:   (desc)  => toast.success('Task active',           { description: desc, icon: icon(CheckCircle, '#12C479'), ...OPTS() }),
  taskScheduled: (desc)  => toast.success('Task scheduled',         { description: desc, icon: icon(Calendar, '#7C3AED'), ...OPTS() }),
  taskUnscheduled: ()    => toast('Scheduled task removed',         { icon: icon(X, '#6B7280'), ...OPTS({ duration: 2500 }) }),

  // ── Payment actions ───────────────────────────────────────────────────────
  paymentProcessed: (desc) => toast.success('Payment processed',   { description: desc, icon: icon(Wallet, '#12C479'), ...OPTS({ duration: 3500 }) }),
  paymentAdded:     (desc) => toast.success('Payment added',       { description: desc, icon: rupeeIcon('#7C3AED'), ...OPTS() }),
  paymentsProcessed: (count, desc) => toast.success(`${count} payment${count > 1 ? 's' : ''} processed`, { description: desc, icon: icon(Wallet, '#12C479'), ...OPTS({ duration: 3500 }) }),

  // ── Member actions ────────────────────────────────────────────────────────
  memberAdded:       (desc) => toast.success('Member added',       { description: desc, icon: icon(UserPlus, '#3B5BFC'), ...OPTS() }),
  memberUpdated:     (desc) => toast.success('Member updated',     { description: desc, icon: icon(UserCheck, '#3B5BFC'), ...OPTS() }),
  memberActivated:   (desc) => toast.success('Member activated',   { description: desc, icon: icon(User, '#12C479'), ...OPTS() }),
  memberDeactivated: (desc) => toast('Member deactivated',         { description: desc, icon: icon(User, '#9CA3AF'), ...OPTS() }),

  // ── Note actions ──────────────────────────────────────────────────────────
  noteSaved:   (desc) => toast.success('Note saved',               { description: desc, icon: icon(StickyNote, '#7C3AED'), ...OPTS({ duration: 2500 }) }),
  noteDeleted: (desc) => toast.error('Note deleted',               { description: desc, icon: icon(Trash2, '#EF4444'), ...OPTS({ duration: 2500 }) }),
  sheetDeleted: (desc) => toast.error('Sheet deleted',             { description: desc, icon: icon(Trash2, '#EF4444'), ...OPTS({ duration: 2500 }) }),

  // ── Auth / profile actions ────────────────────────────────────────────────
  profileUpdated:    () => toast.success('Profile updated',        { icon: icon(User, '#3B5BFC'), ...OPTS({ duration: 2500 }) }),
  avatarUpdated:     () => toast.success('Avatar updated',         { icon: icon(User, '#3B5BFC'), ...OPTS({ duration: 2500 }) }),
  passwordUpdated:   () => toast.success('Password updated',       { icon: icon(Lock, '#7C3AED'), ...OPTS({ duration: 2500 }) }),
  adminPwdUpdated:   () => toast.success('Admin password updated', { icon: icon(Shield, '#3B5BFC'), ...OPTS({ duration: 2500 }) }),
  mgmtPwdUpdated:    () => toast.success('Management password updated', { icon: icon(Shield, '#3B5BFC'), ...OPTS({ duration: 2500 }) }),
  accountPwdUpdated: () => toast.success('Account password updated', { icon: icon(Lock, '#7C3AED'), ...OPTS({ duration: 2500 }) }),

  // ── Help actions ──────────────────────────────────────────────────────────
  helpSubmitted: (desc) => toast.success('Help request submitted', { description: desc, icon: icon(Send, '#3B5BFC'), ...OPTS({ duration: 3500 }) }),
  helpResolved:  ()     => toast.success('Response sent',          { description: 'Help request marked as solved', icon: icon(MessageSquare, '#12C479'), ...OPTS() }),

  // ── Task request actions ──────────────────────────────────────────────────
  requestApproved:  (desc) => toast.success('Request approved',    { description: desc, icon: icon(CheckCircle, '#12C479'), ...OPTS() }),
  requestCompleted: (desc) => toast.success('Request completed',   { description: desc, icon: icon(ClipboardCheck, '#12C479'), ...OPTS() }),
  requestDismissed: ()     => toast('Request dismissed',           { icon: icon(X, '#6B7280'), ...OPTS({ duration: 2500 }) }),
  taskRequestSubmitted: (desc) => toast.success('Task request submitted', { description: desc, icon: icon(Send, '#3B5BFC'), ...OPTS({ duration: 3500 }) }),

  // ── Trash / archive actions ───────────────────────────────────────────────
  itemRestored:    (desc) => toast.success('Item restored',        { description: desc, icon: icon(RotateCcw, '#3B5BFC'), ...OPTS() }),
  itemDeleted:     ()     => toast.error('Permanently deleted',    { icon: icon(Trash2, '#EF4444'), ...OPTS({ duration: 2500 }) }),
  archiveCleared:  ()     => toast('Archive cleared',              { icon: icon(Archive, '#6B7280'), ...OPTS({ duration: 2500 }) }),
  // ── Generic ───────────────────────────────────────────────────────────────
  success: (desc) => toast.success(desc, { icon: icon(CheckCircle, '#12C479'), ...OPTS() }),
  info:    (desc) => toast(desc,         { icon: icon(Send, '#3B5BFC'),        ...OPTS() }),
  error:   (desc) => toast.error(desc,   { icon: icon(AlertCircle, '#EF4444'), ...OPTS() }),
};
