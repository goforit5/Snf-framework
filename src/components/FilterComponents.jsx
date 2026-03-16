import { useState, useRef, useEffect } from 'react';
import { Search, X, Calendar, ChevronDown, Building2, MapPin, Globe } from 'lucide-react';

/* ─── Quick Filter ─── */
export function QuickFilter({ filters = [], active = [], onChange }) {
  function toggleFilter(value) {
    if (!onChange) return;
    if (active.includes(value)) {
      onChange(active.filter((v) => v !== value));
    } else {
      onChange([...active, value]);
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map((filter) => {
        const isActive = active.includes(filter.value);
        return (
          <button
            key={filter.value}
            onClick={() => toggleFilter(filter.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
            {filter.count != null && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Search Input ─── */
export function SearchInput({ placeholder = 'Search...', value = '', onChange, onClear }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
      />
      {value && (
        <button
          onClick={() => { onClear ? onClear() : onChange?.(''); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={13} className="text-gray-400" />
        </button>
      )}
    </div>
  );
}

/* ─── Date Range Filter ─── */
const defaultPresets = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this-week' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Last 30 Days', value: 'last-30' },
  { label: 'This Quarter', value: 'this-quarter' },
];

function resolvePreset(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today':
      return { start: today.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) };
    case 'this-week': {
      const day = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - day);
      return { start: start.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) };
    }
    case 'this-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: start.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) };
    }
    case 'last-30': {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return { start: start.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) };
    }
    case 'this-quarter': {
      const qMonth = Math.floor(today.getMonth() / 3) * 3;
      const start = new Date(today.getFullYear(), qMonth, 1);
      return { start: start.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) };
    }
    default:
      return null;
  }
}

export function DateRangeFilter({ startDate, endDate, onChange, presets = defaultPresets }) {
  const [activePreset, setActivePreset] = useState(null);

  function handlePreset(preset) {
    const range = resolvePreset(preset.value);
    if (range && onChange) {
      setActivePreset(preset.value);
      onChange(range);
    }
  }

  function handleDateChange(field, value) {
    setActivePreset(null);
    if (onChange) {
      onChange({
        start: field === 'start' ? value : startDate,
        end: field === 'end' ? value : endDate,
      });
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => handlePreset(preset)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
            activePreset === preset.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {preset.label}
        </button>
      ))}
      <div className="flex items-center gap-1.5 ml-1">
        <Calendar size={13} className="text-gray-400" />
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => handleDateChange('start', e.target.value)}
          className="px-2 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => handleDateChange('end', e.target.value)}
          className="px-2 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        />
      </div>
    </div>
  );
}

/* ─── Scope Selector ─── */
export function ScopeSelector({ currentScope, facilities = [], regions = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const scopeIcon = () => {
    if (!currentScope) return <Globe size={14} className="text-blue-600" />;
    switch (currentScope.type) {
      case 'enterprise': return <Globe size={14} className="text-blue-600" />;
      case 'region': return <MapPin size={14} className="text-violet-600" />;
      case 'facility': return <Building2 size={14} className="text-emerald-600" />;
      default: return <Globe size={14} className="text-blue-600" />;
    }
  };

  const filteredFacilities = search.trim()
    ? facilities.filter((f) =>
        f.label?.toLowerCase().includes(search.toLowerCase()) ||
        f.id?.toLowerCase().includes(search.toLowerCase())
      )
    : facilities;

  const filteredRegions = search.trim()
    ? regions.filter((r) =>
        r.label?.toLowerCase().includes(search.toLowerCase()) ||
        r.id?.toLowerCase().includes(search.toLowerCase())
      )
    : regions;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
      >
        {scopeIcon()}
        <span className="text-sm font-medium text-gray-700">
          {currentScope?.label || 'Enterprise'}
        </span>
        <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="p-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-2 pb-2 scrollbar-thin">
            {/* Enterprise */}
            <button
              onClick={() => { onChange?.({ type: 'enterprise', id: null, label: 'Enterprise' }); setIsOpen(false); setSearch(''); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                currentScope?.type === 'enterprise' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Globe size={13} />
              Enterprise (All)
            </button>

            {/* Regions */}
            {filteredRegions.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Regions</p>
                {filteredRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => { onChange?.({ type: 'region', id: region.id, label: region.label }); setIsOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      currentScope?.type === 'region' && currentScope?.id === region.id
                        ? 'bg-violet-50 text-violet-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin size={13} />
                    {region.label}
                  </button>
                ))}
              </>
            )}

            {/* Facilities */}
            {filteredFacilities.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Facilities</p>
                {filteredFacilities.map((facility) => (
                  <button
                    key={facility.id}
                    onClick={() => { onChange?.({ type: 'facility', id: facility.id, label: facility.label }); setIsOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      currentScope?.type === 'facility' && currentScope?.id === facility.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 size={13} />
                    {facility.label}
                  </button>
                ))}
              </>
            )}

            {filteredRegions.length === 0 && filteredFacilities.length === 0 && search.trim() && (
              <p className="text-xs text-gray-400 text-center py-4">No matches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
