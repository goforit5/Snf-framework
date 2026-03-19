/* ─── JSON Export ─── */
export function exportJSON(entries) {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-trail-export-' + new Date().toISOString().split('T')[0] + '.json';
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── CSV Export ─── */
export function exportCSV(entries) {
  const headers = ['ID', 'Trace ID', 'Timestamp', 'Actor', 'Actor Type', 'Action', 'Target', 'Confidence', 'Policies Checked', 'Disposition', 'Facility ID', 'Governance Level'];
  const rows = entries.map(e => [
    e.id,
    e.traceId || '',
    e.timestamp,
    e.actorName,
    e.actorType,
    '"' + (e.action || '').replace(/"/g, '""') + '"',
    '"' + (e.target || '').replace(/"/g, '""') + '"',
    e.confidence != null ? (e.confidence * 100).toFixed(0) + '%' : '',
    '"' + (e.policiesChecked || []).join('; ') + '"',
    '"' + (e.disposition || '').replace(/"/g, '""') + '"',
    e.facilityId || '',
    e.governanceLevel != null ? e.governanceLevel : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-trail-export-' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── PDF Export ─── */
export function exportPDF(entries) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const doc = printWindow.document;
  doc.open();
  doc.close();

  const style = doc.createElement('style');
  style.textContent = [
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:24px;color:#111827}',
    'h1{font-size:18px;margin-bottom:4px}',
    'h2{font-size:13px;color:#6b7280;font-weight:normal;margin-top:0}',
    'table{width:100%;border-collapse:collapse;margin-top:16px}',
    'th{text-align:left;padding:8px;border-bottom:2px solid #111827;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#374151}',
    'td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}',
    '@media print{body{margin:12px}}',
  ].join('\n');
  doc.head.appendChild(style);
  doc.title = 'Audit Trail Export';

  const h1 = doc.createElement('h1');
  h1.textContent = 'Audit Trail Report';
  doc.body.appendChild(h1);

  const h2 = doc.createElement('h2');
  h2.textContent = 'Generated ' + new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) + ' \u2014 ' + entries.length + ' entries';
  doc.body.appendChild(h2);

  const table = doc.createElement('table');
  const thead = doc.createElement('thead');
  const headerRow = doc.createElement('tr');
  ['Time', 'Actor', 'Action', 'Target', 'Confidence', 'Disposition'].forEach(text => {
    const th = doc.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement('tbody');
  entries.forEach(e => {
    const tr = doc.createElement('tr');
    const cells = [
      new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
      e.actorName,
      e.action,
      e.target,
      e.confidence != null ? (e.confidence * 100).toFixed(0) + '%' : '\u2014',
      e.disposition || '',
    ];
    cells.forEach((text, i) => {
      const td = doc.createElement('td');
      td.textContent = text;
      if (i === 3) td.style.color = '#6b7280';
      if (i === 4) td.style.textAlign = 'center';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  doc.body.appendChild(table);

  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}
