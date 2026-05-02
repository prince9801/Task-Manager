import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4 text-slate-500">
        {icon}
      </div>
      <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
