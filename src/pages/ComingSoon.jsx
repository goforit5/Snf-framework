import { Construction } from 'lucide-react';

export default function ComingSoon({ title = 'Coming Soon', section = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Construction size={32} className="text-gray-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
      {section && <p className="text-sm text-gray-500 mb-1">{section}</p>}
      <p className="text-sm text-gray-400 max-w-md">
        This module is part of the agentic platform roadmap. Agent framework and data connections are being configured.
      </p>
    </div>
  );
}
