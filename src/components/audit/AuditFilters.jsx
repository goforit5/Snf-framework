import { Download, Printer } from 'lucide-react';
import { SearchInput, QuickFilter, DateRangeFilter } from '../FilterComponents';
import { exportCSV, exportPDF, exportJSON } from './AuditExport';

export default function AuditFilters({
  searchQuery, setSearchQuery,
  actorFilters, setActorFilters,
  actionFilters, setActionFilters,
  dateRange, setDateRange,
  actorFilterOptions, actionFilterOptions,
  filtered, auditLog,
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm flex items-center gap-2">
          <SearchInput placeholder="Search actions, actors, targets, policies, traces..." value={searchQuery} onChange={setSearchQuery} />
          <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} results</span>
        </div>
        <div><QuickFilter filters={actorFilterOptions} active={actorFilters} onChange={setActorFilters} /></div>
        <div><QuickFilter filters={actionFilterOptions} active={actionFilters} onChange={setActionFilters} /></div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => exportCSV(filtered.map(e => auditLog.find(a => a.id === e.id) || e))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
            title="Export as CSV"
          >
            <Download size={12} />CSV
          </button>
          <button
            onClick={() => exportPDF(filtered.map(e => auditLog.find(a => a.id === e.id) || e))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
            title="Export as PDF"
          >
            <Printer size={12} />PDF
          </button>
          <button
            onClick={() => exportJSON(filtered.map(e => auditLog.find(a => a.id === e.id) || e))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
            title="Export as JSON"
          >
            <Download size={12} />JSON
          </button>
          <span className="text-xs text-gray-400">Showing {filtered.length} of {auditLog.length}</span>
        </div>
      </div>
      <DateRangeFilter startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
    </div>
  );
}
