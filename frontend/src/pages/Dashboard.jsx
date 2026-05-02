import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { formatDate, isOverdue } from '../utils/helpers';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="card p-6 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-xl flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="font-display text-3xl font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getStats();
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
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text="Loading dashboard..." />
    </div>
  );

  const { stats, recentTasks } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-indigo-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats?.totalTasks || 0}
          icon="◎"
          color="bg-indigo-500/10 text-indigo-400"
        />
        <StatCard
          label="Completed"
          value={stats?.completedTasks || 0}
          sub={`${stats?.completionRate || 0}% completion rate`}
          icon="✓"
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="In Progress"
          value={stats?.pendingTasks || 0}
          icon="↻"
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Overdue"
          value={stats?.overdueTasks || 0}
          icon="⚠"
          color={stats?.overdueTasks > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'}
        />
      </div>

      {/* Second row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Projects"
          value={stats?.totalProjects || 0}
          icon="◉"
          color="bg-purple-500/10 text-purple-400"
        />
        {isAdmin && (
          <StatCard
            label="Team Members"
            value={stats?.totalUsers || 0}
            icon="◈"
            color="bg-amber-500/10 text-amber-400"
          />
        )}
        {/* Completion bar */}
        <div className="card p-6 col-span-1">
          <p className="text-slate-400 text-sm mb-3">Completion Rate</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="font-display text-3xl font-bold text-white">{stats?.completionRate || 0}%</span>
            <span className="text-slate-400 text-sm mb-1">done</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats?.completionRate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="font-display font-semibold text-white">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
        </div>

        {recentTasks?.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-4xl mb-3">◎</p>
            <p>No tasks yet. <Link to="/tasks" className="text-indigo-400">Create one</Link></p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentTasks?.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <div
                  key={task._id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors ${overdue ? 'border-l-2 border-red-500' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium truncate ${overdue ? 'text-red-300' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      {overdue && <span className="badge bg-red-500/10 text-red-400 text-xs">Overdue</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {task.project?.name} · Due {formatDate(task.dueDate)}
                      {task.assignedTo && ` · ${task.assignedTo.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/projects" className="card p-6 hover:border-indigo-500/40 hover:bg-slate-800/30 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl">◉</div>
            <div>
              <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">View Projects</p>
              <p className="text-sm text-slate-400">Manage your projects and teams</p>
            </div>
          </div>
        </Link>
        <Link to="/tasks" className="card p-6 hover:border-indigo-500/40 hover:bg-slate-800/30 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">◎</div>
            <div>
              <p className="font-medium text-white group-hover:text-emerald-300 transition-colors">View Tasks</p>
              <p className="text-sm text-slate-400">Track and update task progress</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
