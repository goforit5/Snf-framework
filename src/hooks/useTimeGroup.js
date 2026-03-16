import { useMemo } from 'react';

function getTimeGroup(timestamp) {
  const now = new Date();
  const itemDate = new Date(timestamp);
  const diffMs = now - itemDate;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Today: check if same calendar day
  const isToday = itemDate.toDateString() === now.toDateString();

  if (isToday && diffHours < 12 && now.getHours() < 12) {
    return 'This Morning';
  }
  if (isToday) {
    return 'Today';
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (itemDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // This week (within 7 days)
  if (diffDays < 7) {
    return 'This Week';
  }

  return 'Older';
}

export function useTimeGroup(items = [], timeKey = 'timestamp') {
  return useMemo(() => {
    const groups = {};
    const order = ['This Morning', 'Today', 'Yesterday', 'This Week', 'Older'];

    for (const item of items) {
      const ts = item[timeKey];
      if (!ts) continue;
      const group = getTimeGroup(ts);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    }

    // Return in temporal order, omitting empty groups
    const ordered = {};
    for (const key of order) {
      if (groups[key] && groups[key].length > 0) {
        ordered[key] = groups[key];
      }
    }
    return ordered;
  }, [items, timeKey]);
}
