import { useState, useEffect, useCallback } from 'react';

export function useKeyboardNav(items = [], { onSelect, onApprove, onEscalate } = {}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Clamp index when items change
  useEffect(() => {
    if (items.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= items.length) {
      setSelectedIndex(items.length - 1);
    }
  }, [items.length, selectedIndex]);

  const handleKeyDown = useCallback((e) => {
    if (items.length === 0) return;

    // Ignore if user is typing in an input/textarea
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (onSelect && items[selectedIndex]) {
          onSelect(items[selectedIndex]);
        }
        break;
      case 'a':
        e.preventDefault();
        if (onApprove && items[selectedIndex]) {
          onApprove(items[selectedIndex].id || items[selectedIndex]);
        }
        break;
      case 'e':
        e.preventDefault();
        if (onEscalate && items[selectedIndex]) {
          onEscalate(items[selectedIndex].id || items[selectedIndex]);
        }
        break;
      default:
        break;
    }
  }, [items, selectedIndex, onSelect, onApprove, onEscalate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
    selectedItem: items[selectedIndex] || null,
    setSelectedIndex,
  };
}
