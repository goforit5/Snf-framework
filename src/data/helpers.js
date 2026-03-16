// Shared utility functions for data formatting and lookups

import { facilityMap } from './entities/facilities';
import { residentMap } from './entities/residents';
import { staffMap } from './entities/staff';

// ── Formatting ────────────────────────────────────────────────────────────

/**
 * Format cents as dollar string: 123400 -> "$1,234"
 * Also handles raw dollar amounts for the demo (no cents conversion).
 */
export function formatCurrency(amount) {
  if (amount == null) return '$0';
  return '$' + Math.round(amount).toLocaleString('en-US');
}

/**
 * Format ISO date string: "2026-03-11" -> "Mar 11, 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format ISO datetime string: "2026-03-11T08:14:00Z" -> "Mar 11, 2026 8:14 AM"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/**
 * Relative time: "2026-03-11T06:00:00Z" -> "2 hours ago"
 * Uses March 11, 2026 08:15 AM as the reference "now" for the demo.
 */
export function timeAgo(isoString) {
  if (!isoString) return '—';
  // Demo reference time: March 11, 2026 08:15:00 UTC
  const now = new Date('2026-03-11T08:15:00Z');
  const then = new Date(isoString);
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

// ── Color Utilities ───────────────────────────────────────────────────────

/**
 * Status -> Tailwind classes (bg + text)
 */
export function getStatusColor(status) {
  const map = {
    'completed': 'bg-emerald-500/10 text-emerald-400',
    'approved': 'bg-emerald-500/10 text-emerald-400',
    'auto-approved': 'bg-emerald-500/10 text-emerald-400',
    'active': 'bg-emerald-500/10 text-emerald-400',
    'in-progress': 'bg-blue-500/10 text-blue-400',
    'pending': 'bg-amber-500/10 text-amber-400',
    'pending-approval': 'bg-amber-500/10 text-amber-400',
    'overdue': 'bg-red-500/10 text-red-400',
    'exception': 'bg-red-500/10 text-red-400',
    'critical': 'bg-red-500/10 text-red-400',
    'terminated': 'bg-zinc-500/10 text-zinc-400',
    'leave': 'bg-violet-500/10 text-violet-400',
  };
  return map[status?.toLowerCase()] || 'bg-zinc-500/10 text-zinc-400';
}

/**
 * Priority -> Tailwind classes
 */
export function getPriorityColor(priority) {
  const map = {
    'Critical': 'bg-red-500/10 text-red-400 border-red-500/30',
    'High': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Medium': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return map[priority] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
}

/**
 * Risk score (0-100) -> Tailwind text color
 */
export function getRiskColor(score) {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-blue-400';
  return 'text-emerald-400';
}

// ── Entity Lookups ────────────────────────────────────────────────────────

export function facilityById(id) {
  return facilityMap[id] || null;
}

export function facilityName(id) {
  return facilityMap[id]?.name || id;
}

export function residentById(id) {
  return residentMap[id] || null;
}

export function staffById(id) {
  return staffMap[id] || null;
}

// ── ID Generation ─────────────────────────────────────────────────────────

let _counter = 0;

/**
 * Generate a unique ID string for runtime use.
 */
export function generateId() {
  _counter += 1;
  return `gen-${Date.now()}-${_counter}`;
}
