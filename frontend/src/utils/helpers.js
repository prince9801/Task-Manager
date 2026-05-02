import { format, isPast, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (status === 'completed') return false;
  return isPast(new Date(dueDate));
};

export const getStatusConfig = (status) => {
  const configs = {
    todo: { label: 'To Do', color: 'bg-slate-700 text-slate-300', dot: 'bg-slate-400' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400', dot: 'bg-blue-400' },
    review: { label: 'Review', color: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
    completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  };
  return configs[status] || configs.todo;
};

export const getPriorityConfig = (priority) => {
  const configs = {
    low: { label: 'Low', color: 'bg-slate-700 text-slate-300', icon: '↓' },
    medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-400', icon: '→' },
    high: { label: 'High', color: 'bg-red-500/10 text-red-400', icon: '↑' },
  };
  return configs[priority] || configs.medium;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};
