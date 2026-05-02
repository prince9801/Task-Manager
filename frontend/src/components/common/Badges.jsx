import React from 'react';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/helpers';

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['todo'];
  return (
    <span className={`badge ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['medium'];
  return (
    <span className={`badge ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
