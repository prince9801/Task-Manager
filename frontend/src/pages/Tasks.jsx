import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { getProjects } from '../api/projects';
import { getUsers } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { formatDate, isOverdue, getInitials } from '../utils/helpers';

const STATUSES = ['todo', 'in-progress', 'review', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

const TaskRow = ({ task, isAdmin, onEdit, onDelete, onStatusChange }) => {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors border-l-2 ${overdue ? 'border-red-500' : 'border-transparent'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-medium truncate ${overdue ? 'text-red-300' : 'text-slate-200'}`}>{task.title}</p>
          {overdue && <span className="badge bg-red-500/10 text-red-400 text-xs">Overdue</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span
            className="inline-flex items-center gap-1"
            style={{ color: task.project?.color }}
          >
            ◉ {task.project?.name}
          </span>
          <span>Due {formatDate(task.dueDate)}</span>
          {task.assignedTo && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-indigo-600 inline-flex items-center justify-center text-white" style={{ fontSize: '8px' }}>
                {getInitials(task.assignedTo.name)}
              </span>
              {task.assignedTo.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityBadge priority={task.priority} />

        {/* Status dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
          ))}
        </select>

        {isAdmin && (
          <>
            <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors text-sm">
              Edit
            </button>
            <button onClick={() => onDelete(task._id)} className="text-slate-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors text-sm">
              Del
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const emptyForm = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', project: '', assignedTo: '' };

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '', search: '', overdue: '' });
  const { isAdmin } = useAuth();

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;
      if (filters.search) params.search = filters.search;
      if (filters.overdue) params.overdue = filters.overdue;
      const res = await getTasks(params);
      setTasks(res.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    }
  }, [filters]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchTasks(),
        getProjects().then((r) => setProjects(r.data.projects)),
        isAdmin ? getUsers().then((r) => setUsers(r.data.users)) : Promise.resolve(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreate = () => { setEditingTask(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      project: task.project?._id || '',
      assignedTo: task.assignedTo?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form, assignedTo: form.assignedTo || null };
      if (editingTask) {
        const res = await updateTask(editingTask._id, data);
        setTasks(tasks.map((t) => t._id === editingTask._id ? res.data.task : t));
      } else {
        const res = await createTask(data);
        setTasks([res.data.task, ...tasks]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await updateTask(id, { status });
      setTasks(tasks.map((t) => t._id === id ? res.data.task : t));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text="Loading tasks..." />
    </div>
  );

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} overdue</span>}
          </p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary">+ New Task</button>}
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            className="input flex-1 min-w-[180px]"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input w-auto" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input w-auto" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-400 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={filters.overdue === 'true'}
              onChange={(e) => setFilters({ ...filters, overdue: e.target.checked ? 'true' : '' })}
              className="rounded"
            />
            Overdue only
          </label>
        </div>
      </div>

      {/* Task List */}
      <div className="card overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-5xl mb-4">◎</p>
            <p className="text-slate-300 font-medium mb-1">No tasks found</p>
            <p className="text-slate-500 text-sm">
              {isAdmin ? 'Create your first task.' : 'No tasks assigned to you yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Task description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Project *</label>
              <select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
