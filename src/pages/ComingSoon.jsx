import { Bot, CheckCircle2, Circle, Database, Shield, Wifi, Zap, Server, Clock, Loader } from 'lucide-react';
import { PageHeader, Card, ProgressBar } from '../components/Widgets';

const systemIcons = {
  PCC: Database,
  Workday: Shield,
  'Microsoft 365': Wifi,
  SharePoint: Server,
  CMS: Database,
  'GL Systems': Zap,
};

const defaultSystems = ['PCC', 'Workday', 'Microsoft 365'];

const defaultTimeline = [
  { label: 'Data connectors authenticated', status: 'complete', detail: 'OAuth2 + SFTP channels verified' },
  { label: 'Historical data ingestion', status: 'complete', detail: '3 years of facility records indexed' },
  { label: 'Agent policy rules loaded', status: 'complete', detail: 'Governance levels 1-6 configured' },
  { label: 'Model training on facility patterns', status: 'active', detail: 'Learning baseline metrics and anomaly thresholds' },
  { label: 'Deployment authorization', status: 'pending', detail: 'Awaiting executive sign-off' },
];

export default function ComingSoon({
  title = 'Module Deploying',
  section = '',
  systems = defaultSystems,
  capability = '',
  timeline = defaultTimeline,
}) {
  const completedSteps = timeline.filter(s => s.status === 'complete').length;
  const progressPct = Math.round((completedSteps / timeline.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={section || 'Agent deployment in progress'}
        aiSummary={`This module is being configured to connect to ${systems.join(', ')} and begin autonomous monitoring. ${capability || 'Agent training is underway — deployment will activate once authorization is granted.'}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployment Timeline */}
        <div className="lg:col-span-2">
          <Card title="Deployment Progress">
            <div className="mb-5">
              <ProgressBar value={progressPct} label="Overall Readiness" color="blue" />
            </div>
            <div className="space-y-1">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex flex-col items-center pt-0.5">
                    {step.status === 'complete' ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : step.status === 'active' ? (
                      <Loader size={18} className="text-blue-500 animate-spin" />
                    ) : (
                      <Circle size={18} className="text-gray-300" />
                    )}
                    {i < timeline.length - 1 && (
                      <div className={`w-px h-full min-h-[16px] mt-1 ${step.status === 'complete' ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.status === 'complete' ? 'text-gray-700' : step.status === 'active' ? 'text-blue-700' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.detail}</p>
                  </div>
                  {step.status === 'active' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
                      IN PROGRESS
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Connected Systems */}
        <div className="space-y-6">
          <Card title="Connected Systems">
            <div className="space-y-3">
              {systems.map((sys) => {
                const Icon = systemIcons[sys] || Database;
                return (
                  <div key={sys} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{sys}</p>
                      <p className="text-[11px] text-gray-400">API connected</p>
                    </div>
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Agent Status">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Bot size={20} className="text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Training</p>
                <p className="text-xs text-gray-400">Learning facility patterns</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Records analyzed</span>
                <span className="font-mono font-medium text-gray-700">847,231</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Patterns identified</span>
                <span className="font-mono font-medium text-gray-700">1,284</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. time remaining</span>
                <span className="font-mono font-medium text-amber-600">~4 hrs</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
