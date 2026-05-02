import { getStatusConfig, getPriorityConfig } from '../../utils/helpers';

export const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span className={`badge ${config.color} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const config = getPriorityConfig(priority);
  return (
    <span className={`badge ${config.color} gap-1`}>
      <span className="font-mono text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const config = role === 'admin'
    ? { color: 'bg-indigo-500/10 text-indigo-400', label: 'Admin' }
    : { color: 'bg-slate-700 text-slate-300', label: 'Member' };
  return <span className={`badge ${config.color}`}>{config.label}</span>;
};
