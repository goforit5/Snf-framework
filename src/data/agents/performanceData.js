// Agent Performance Metrics — time-series data for trending and anomaly detection
// 30-day history for all 30 agents, with response time, accuracy, and throughput

const days30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-02-14');
  d.setDate(d.getDate() + i);
  return d.toISOString().split('T')[0];
});

// Generate realistic metrics with occasional anomalies
function generateMetrics(baseResponseMs, baseAccuracy, baseThroughput, anomalyDays = []) {
  return days30.map((date, i) => {
    const isAnomaly = anomalyDays.includes(i);
    const jitter = () => (Math.random() - 0.5) * 0.1;
    return {
      date,
      responseMs: Math.round(
        baseResponseMs * (1 + jitter() + (isAnomaly ? 0.8 + Math.random() * 0.5 : 0))
      ),
      accuracy: Math.min(1, Math.max(0.5,
        baseAccuracy + jitter() * 0.05 - (isAnomaly ? 0.12 + Math.random() * 0.08 : 0)
      )),
      throughput: Math.round(
        baseThroughput * (1 + jitter() * 0.3 + (isAnomaly ? -0.4 - Math.random() * 0.2 : 0))
      ),
    };
  });
}

export const agentPerformance = {
  'clinical-monitor': generateMetrics(1200, 0.91, 142, [22, 27]),
  'pharmacy-agent': generateMetrics(1800, 0.94, 87, [18]),
  'therapy-agent': generateMetrics(1500, 0.89, 63, []),
  'infection-control': generateMetrics(900, 0.92, 34, [25]),
  'mds-agent': generateMetrics(2200, 0.87, 28, [14]),
  'wound-care-agent': generateMetrics(1600, 0.86, 19, []),
  'ap-processing': generateMetrics(800, 0.94, 47, [10, 26]),
  'billing-claims': generateMetrics(2100, 0.91, 34, []),
  'ar-management': generateMetrics(1400, 0.88, 22, [20]),
  'payroll-audit': generateMetrics(600, 0.96, 892, [8]),
  'revenue-optimization': generateMetrics(3200, 0.85, 15, []),
  'monthly-close': generateMetrics(2800, 0.90, 12, [28]),
  'hr-compliance': generateMetrics(700, 0.97, 56, []),
  'recruiting-agent': generateMetrics(1900, 0.83, 18, [15]),
  'scheduling-agent': generateMetrics(500, 0.90, 38, [12]),
  'training-agent': generateMetrics(800, 0.93, 24, []),
  'supply-chain': generateMetrics(1100, 0.91, 31, []),
  'maintenance-agent': generateMetrics(1300, 0.88, 17, [23]),
  'census-forecast': generateMetrics(2500, 0.82, 11, []),
  'survey-readiness': generateMetrics(3500, 0.89, 45, [19]),
  'quality-measures': generateMetrics(2000, 0.90, 22, []),
  'risk-management': generateMetrics(2400, 0.86, 14, [21]),
  'contract-agent': generateMetrics(1700, 0.92, 8, []),
  'ma-diligence': generateMetrics(4500, 0.84, 6, [13]),
  'vendor-compliance': generateMetrics(400, 0.97, 234, []),
  'procurement-agent': generateMetrics(1200, 0.93, 19, [24]),
  'enterprise-orchestrator': generateMetrics(300, 0.95, 67, []),
  'facility-orchestrator': generateMetrics(250, 0.93, 145, []),
  'escalation-manager': generateMetrics(150, 0.98, 23, []),
  'platform-monitor': generateMetrics(100, 0.99, 288, []),
};

// Compute anomaly detection thresholds (mean +/- 2 standard deviations)
export function detectAnomalies(metrics) {
  if (!metrics || metrics.length < 7) return [];

  const responseValues = metrics.map(m => m.responseMs);
  const accuracyValues = metrics.map(m => m.accuracy);
  const throughputValues = metrics.map(m => m.throughput);

  function stats(arr) {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  const rStats = stats(responseValues);
  const aStats = stats(accuracyValues);
  const tStats = stats(throughputValues);

  return metrics.map((m, i) => {
    const anomalies = [];
    if (m.responseMs > rStats.mean + 2 * rStats.stdDev) {
      anomalies.push({ metric: 'responseMs', severity: m.responseMs > rStats.mean + 3 * rStats.stdDev ? 'critical' : 'high', value: m.responseMs, threshold: Math.round(rStats.mean + 2 * rStats.stdDev) });
    }
    if (m.accuracy < aStats.mean - 2 * aStats.stdDev) {
      anomalies.push({ metric: 'accuracy', severity: m.accuracy < aStats.mean - 3 * aStats.stdDev ? 'critical' : 'high', value: m.accuracy, threshold: +(aStats.mean - 2 * aStats.stdDev).toFixed(3) });
    }
    if (m.throughput < tStats.mean - 2 * tStats.stdDev) {
      anomalies.push({ metric: 'throughput', severity: m.throughput < tStats.mean - 3 * tStats.stdDev ? 'critical' : 'high', value: m.throughput, threshold: Math.round(tStats.mean - 2 * tStats.stdDev) });
    }
    return { ...m, index: i, anomalies };
  }).filter(m => m.anomalies.length > 0);
}

// Agent dependency graph data
export const agentDependencies = [
  // Clinical cascade
  { from: 'clinical-monitor', to: 'enterprise-orchestrator', type: 'triggers' },
  { from: 'enterprise-orchestrator', to: 'pharmacy-agent', type: 'cascades' },
  { from: 'enterprise-orchestrator', to: 'mds-agent', type: 'cascades' },
  { from: 'enterprise-orchestrator', to: 'survey-readiness', type: 'cascades' },
  { from: 'enterprise-orchestrator', to: 'risk-management', type: 'cascades' },
  { from: 'enterprise-orchestrator', to: 'facility-orchestrator', type: 'coordinates' },

  // Revenue cycle
  { from: 'ap-processing', to: 'procurement-agent', type: 'triggers' },
  { from: 'procurement-agent', to: 'contract-agent', type: 'triggers' },
  { from: 'billing-claims', to: 'ar-management', type: 'triggers' },
  { from: 'mds-agent', to: 'billing-claims', type: 'triggers' },
  { from: 'mds-agent', to: 'revenue-optimization', type: 'triggers' },

  // Workforce
  { from: 'hr-compliance', to: 'scheduling-agent', type: 'triggers' },
  { from: 'payroll-audit', to: 'scheduling-agent', type: 'triggers' },
  { from: 'scheduling-agent', to: 'recruiting-agent', type: 'triggers' },
  { from: 'payroll-audit', to: 'recruiting-agent', type: 'triggers' },

  // Vendor
  { from: 'vendor-compliance', to: 'ap-processing', type: 'blocks' },
  { from: 'procurement-agent', to: 'vendor-compliance', type: 'triggers' },

  // Quality
  { from: 'survey-readiness', to: 'quality-measures', type: 'feeds' },
  { from: 'risk-management', to: 'quality-measures', type: 'feeds' },
  { from: 'infection-control', to: 'survey-readiness', type: 'triggers' },

  // Operations
  { from: 'census-forecast', to: 'scheduling-agent', type: 'triggers' },
  { from: 'census-forecast', to: 'revenue-optimization', type: 'feeds' },
  { from: 'supply-chain', to: 'procurement-agent', type: 'triggers' },

  // Platform
  { from: 'platform-monitor', to: 'escalation-manager', type: 'triggers' },
  { from: 'escalation-manager', to: 'enterprise-orchestrator', type: 'triggers' },
  { from: 'facility-orchestrator', to: 'escalation-manager', type: 'triggers' },

  // Data sources (virtual nodes, not agents)
  { from: 'ds-pcc', to: 'clinical-monitor', type: 'data-source' },
  { from: 'ds-pcc', to: 'pharmacy-agent', type: 'data-source' },
  { from: 'ds-pcc', to: 'mds-agent', type: 'data-source' },
  { from: 'ds-pcc', to: 'wound-care-agent', type: 'data-source' },
  { from: 'ds-pcc', to: 'therapy-agent', type: 'data-source' },
  { from: 'ds-pcc', to: 'infection-control', type: 'data-source' },
  { from: 'ds-workday', to: 'payroll-audit', type: 'data-source' },
  { from: 'ds-workday', to: 'hr-compliance', type: 'data-source' },
  { from: 'ds-workday', to: 'scheduling-agent', type: 'data-source' },
  { from: 'ds-workday', to: 'recruiting-agent', type: 'data-source' },
  { from: 'ds-workday', to: 'training-agent', type: 'data-source' },
  { from: 'ds-m365', to: 'ap-processing', type: 'data-source' },
  { from: 'ds-m365', to: 'contract-agent', type: 'data-source' },
  { from: 'ds-sharepoint', to: 'survey-readiness', type: 'data-source' },
  { from: 'ds-sharepoint', to: 'ma-diligence', type: 'data-source' },
  { from: 'ds-sharepoint', to: 'vendor-compliance', type: 'data-source' },
  { from: 'ds-erp', to: 'ap-processing', type: 'data-source' },
  { from: 'ds-erp', to: 'monthly-close', type: 'data-source' },
  { from: 'ds-erp', to: 'ar-management', type: 'data-source' },
  { from: 'ds-erp', to: 'revenue-optimization', type: 'data-source' },
];

// Data source definitions (virtual nodes in dependency graph)
export const dataSources = [
  { id: 'ds-pcc', name: 'PointClickCare', shortName: 'PCC', color: '#EF4444' },
  { id: 'ds-workday', name: 'Workday', shortName: 'Workday', color: '#F59E0B' },
  { id: 'ds-m365', name: 'Microsoft 365', shortName: 'M365', color: '#3B82F6' },
  { id: 'ds-sharepoint', name: 'SharePoint', shortName: 'SharePoint', color: '#8B5CF6' },
  { id: 'ds-erp', name: 'ERP / GL System', shortName: 'ERP', color: '#10B981' },
];
