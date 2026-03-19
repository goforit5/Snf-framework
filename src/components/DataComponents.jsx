import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Bot } from 'lucide-react';
import { StatCard } from './Widgets';

/* ─── AI Analysis Card ─── */
export function AIAnalysisCard({ title = 'AI Analysis', children, icon: Icon = Bot, variant = 'blue' }) {
  const variantMap = {
    blue: { bg: 'bg-blue-50/50', border: 'border-blue-100', header: 'text-blue-600', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    green: { bg: 'bg-green-50/50', border: 'border-green-100', header: 'text-green-600', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    amber: { bg: 'bg-amber-50/50', border: 'border-amber-100', header: 'text-amber-600', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    red: { bg: 'bg-red-50/50', border: 'border-red-100', header: 'text-red-600', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', header: 'text-purple-600', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  };
  const v = variantMap[variant] || variantMap.blue;

  return (
    <div className={`${v.bg} rounded-xl p-3 border ${v.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-lg ${v.iconBg} flex items-center justify-center`}>
          <Icon size={13} className={v.iconColor} />
        </div>
        <p className={`text-[10px] font-semibold ${v.header} uppercase tracking-wider`}>{title}</p>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

/* ─── Health Score Card ─── */
export function HealthScoreCard({ score, label = 'Health Score', size = 'md', showBar = false }) {
  const color = score >= 80 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-600';
  const barBg = score >= 80 ? 'bg-green-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500';
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };
  const textSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div>
      <span className={`${textSize} font-bold ${color}`}>{score}</span>
      {label && <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>}
      {showBar && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
          <div className={`h-full rounded-full ${barBg} transition-all`} style={{ width: `${score}%` }} />
        </div>
      )}
    </div>
  );
}

/* ─── Stat Grid ─── */
export function StatGrid({ stats = [], columns = 5 }) {
  const colClasses = {
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  return (
    <div className={`grid gap-4 ${colClasses[columns] || colClasses[5]}`}>
      {stats.map((stat, i) => (
        <StatCard key={stat.key || i} {...stat} />
      ))}
    </div>
  );
}

/* ─── Data Table ─── */
export function DataTable({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No data available',
  sortable = true,
  searchable = false,
  pageSize = 10,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleSort(key) {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  }

  function handleSearch(val) {
    setSearchQuery(val);
    setCurrentPage(1);
  }

  return (
    <div>
      {searchable && (
        <div className="mb-3 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search table"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    sortable && col.sortable !== false ? 'cursor-pointer select-none hover:text-gray-700 transition-colors' : ''
                  }`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortable && col.sortable !== false && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={12} className="text-blue-600" aria-hidden="true" />
                        : <ChevronDown size={12} className="text-blue-600" aria-hidden="true" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50/80 active:bg-gray-100/50' : ''} transition-colors`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-gray-400">
            {sortedData.length} item{sortedData.length !== 1 ? 's' : ''}
            {' '}&middot; Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1" role="navigation" aria-label="Table pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} className="text-gray-500" aria-hidden="true" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} className="text-gray-500" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Detail Row ─── */
export function DetailRow({ label, value, badge, trend }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        {trend && <TrendIndicator {...trend} />}
        {badge && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
            {badge}
          </span>
        )}
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}

/* ─── Trend Indicator ─── */
export function TrendIndicator({ value, direction = 'flat', sentiment = 'neutral' }) {
  const sentimentColors = {
    positive: 'text-green-600',
    negative: 'text-red-500',
    neutral: 'text-gray-400',
  };
  const color = sentimentColors[sentiment] || sentimentColors.neutral;

  const icons = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    flat: Minus,
  };
  const Icon = icons[direction] || icons.flat;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={12} />
      {value}
    </span>
  );
}

/* ─── Metric Sparkline ─── */
export function MetricSparkline({ data = [], height = 40, width: svgWidth = 120, color = '#3B82F6', showLast = false, trend }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = showLast ? 6 : 2;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = height - 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * plotWidth;
    const y = 2 + plotHeight - ((val - min) / range) * plotHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const lastPoint = points[points.length - 1]?.split(',');

  // Auto-detect trend from data if not provided
  const resolvedTrend = trend ?? (data[data.length - 1] > data[0] ? 'up' : data[data.length - 1] < data[0] ? 'down' : 'flat');
  const trendConfig = {
    up: { icon: ArrowUpRight, color: 'text-green-600' },
    down: { icon: ArrowDownRight, color: 'text-red-500' },
    flat: { icon: Minus, color: 'text-gray-400' },
  };
  const tc = trendConfig[resolvedTrend] || trendConfig.flat;
  const TrendIcon = tc.icon;

  return (
    <div className="inline-flex items-center gap-1.5">
      <svg width={svgWidth} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showLast && lastPoint && (
          <circle
            cx={parseFloat(lastPoint[0])}
            cy={parseFloat(lastPoint[1])}
            r={3}
            fill={color}
          />
        )}
      </svg>
      <TrendIcon size={14} className={tc.color} />
    </div>
  );
}

/* ─── Time Grouped List ─── */
export function TimeGroupedList({ items = [], renderItem, getTimestamp }) {
  const groups = useMemo(() => {
    if (!items.length || !getTimestamp) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const buckets = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    const sorted = [...items].sort((a, b) => new Date(getTimestamp(b)) - new Date(getTimestamp(a)));

    for (const item of sorted) {
      const ts = new Date(getTimestamp(item));
      if (ts >= todayStart) {
        buckets.Today.push(item);
      } else if (ts >= yesterdayStart) {
        buckets.Yesterday.push(item);
      } else if (ts >= weekStart) {
        buckets['This Week'].push(item);
      } else {
        buckets.Older.push(item);
      }
    }

    return Object.entries(buckets).filter(([, arr]) => arr.length > 0);
  }, [items, getTimestamp]);

  if (!groups.length) return null;

  return (
    <div className="space-y-5">
      {groups.map(([label, groupItems]) => (
        <div key={label}>
          <div className="flex items-center gap-3 mb-2.5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</h3>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 tabular-nums">{groupItems.length}</span>
          </div>
          <div className="space-y-1.5">
            {groupItems.map((item, i) => (
              <div key={item.id ?? i}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
