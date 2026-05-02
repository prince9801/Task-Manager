import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badges';
import { formatDate, isOverdue, formatDateRelative } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'text-slate-100' ? 'bg-slate-700/60' : ''} ${color === 'text-emerald-400' ? 'bg-emerald-500/10' : ''} ${color === 'text-blue-400' ? 'bg-blue-500/10' : ''} ${color === 'text-red-400' ? 'bg-red-500/10' : ''} ${color === 'text-amber-400' ? 'bg-amber-500/10' : ''}`}>
        <span className={`text-xl ${color}`}>{icon}</span>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardAPI.getStats();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <LoadingSpinner size="lg" />
    </div>
  );

  const { stats, recentTasks = [], overdueTasksList = [] } = data || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Here's what's happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats?.tasks?.total || 0} icon="📋" color="text-slate-100" />
        <StatCard label="Completed" value={stats?.tasks?.completed || 0} icon="✅" color="text-emerald-400"
          sub={`${stats?.tasks?.completionRate || 0}% completion rate`} />
        <StatCard label="In Progress" value={stats?.tasks?.inProgress || 0} icon="⚡" color="text-blue-400" />
        <StatCard label="Overdue" value={stats?.tasks?.overdue || 0} icon="⚠️" color="text-red-400" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats?.projects?.total || 0} icon="📁" color="text-slate-100" />
        <StatCard label="Active Projects" value={stats?.projects?.active || 0} icon="🚀" color="text-emerald-400" />
        <StatCard label="To Do" value={stats?.tasks?.todo || 0} icon="📝" color="text-amber-400" />
        {isAdmin && <StatCard label="Team Members" value={stats?.users || 0} icon="👥" color="text-blue-400" />}
      </div>

      {/* Completion progress */}
      {stats?.tasks?.total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Overall Completion</span>
            <span className="text-sm font-mono text-brand-400">{stats.tasks.completionRate}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full transition-all duration-700"
              style={{ width: `${stats.tasks.completionRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Overdue Tasks
            </h2>
            <Link to="/tasks?overdue=true" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
          </div>
          {overdueTasksList.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">🎉 No overdue tasks!</p>
          ) : (
            <div className="space-y-3">
              {overdueTasksList.map(task => (
                <div key={task._id} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-red-400">Due {formatDate(task.dueDate)}</span>
                      {task.project && (
                        <span className="text-xs text-slate-500">• {task.project.name}</span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Recent Activity</h2>
            <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task._id} className="flex items-start justify-between gap-3 p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.project && (
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{ background: (task.project.color || '#6366f1') + '22', color: task.project.color || '#6366f1' }}
                        >
                          {task.project.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatDateRelative(task.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
