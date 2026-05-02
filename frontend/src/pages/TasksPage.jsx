import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tasksAPI, projectsAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badges';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, isOverdue, getInitials, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const defaultForm = {
  title: '', description: '', status: 'todo', priority: 'medium',
  project: '', assignedTo: '', dueDate: '',
};

function TaskForm({ initial = defaultForm, projects, users, onSubmit, loading, isAdmin }) {
  const [form, setForm] = useState({ ...defaultForm, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Filter users to members of selected project
  const selectedProject = projects.find(p => p._id === form.project);
  const projectMembers = selectedProject?.members || users;

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" placeholder="Task title" value={form.title}
          onChange={e => set('title', e.target.value)} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} placeholder="Task details..."
          value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Project *</label>
          <select className="select" value={form.project} onChange={e => set('project', e.target.value)} disabled={!isAdmin}>
            <option value="">Select project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Assign To</label>
          <select className="select" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} disabled={!isAdmin}>
            <option value="">Unassigned</option>
            {projectMembers.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)} disabled={!isAdmin}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" value={form.dueDate ? form.dueDate.slice(0, 10) : ''}
          onChange={e => set('dueDate', e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => onSubmit(form)} disabled={loading || !form.title.trim() || (isAdmin && !form.project)}
          className="btn-primary">
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Task'}
        </button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { isAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    project: searchParams.get('project') || '',
    status: searchParams.get('status') || '',
    priority: '',
    search: '',
    overdue: searchParams.get('overdue') || '',
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.project) params.project = filters.project;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.overdue) params.overdue = filters.overdue;

      const res = await tasksAPI.getAll(params);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    projectsAPI.getAll().then(r => setProjects(r.data.projects)).catch(() => {});
    authAPI.getUsers().then(r => setUsers(r.data.users)).catch(() => {});
  }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await tasksAPI.create({ ...form, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined });
      toast.success('Task created!');
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      const payload = isAdmin
        ? { ...form, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined }
        : { status: form.status };
      await tasksAPI.update(editTask._id, payload);
      toast.success('Task updated!');
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tasksAPI.delete(deleteTarget._id);
      toast.success('Task deleted.');
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const quickStatusUpdate = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      toast.success('Status updated');
      fetchTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ project: '', status: '', priority: '', search: '', overdue: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  const canEditTask = (task) => isAdmin || (task.assignedTo && task.assignedTo._id === user._id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <input className="input" placeholder="🔍 Search tasks..." value={filters.search}
            onChange={e => setFilter('search', e.target.value)} />
          <select className="select" value={filters.project} onChange={e => setFilter('project', e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
          <select className="select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('overdue', filters.overdue ? '' : 'true')}
              className={`flex-1 text-sm px-3 py-2 rounded-lg border transition-all ${filters.overdue ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
            >
              ⚠️ Overdue
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg hover:border-slate-600 transition-all">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-32"><LoadingSpinner /></div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          title={hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={hasFilters ? 'Try adjusting your filters.' : isAdmin ? 'Create your first task to get started.' : 'No tasks assigned to you yet.'}
          action={isAdmin && !hasFilters && <button className="btn-primary" onClick={() => setModalOpen(true)}>Create Task</button>}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const overdue = isOverdue(task.dueDate, task.status);
            const canEdit = canEditTask(task);
            return (
              <div key={task._id}
                className={`card hover:border-slate-700/80 transition-all duration-200 group ${overdue ? 'border-red-500/20 bg-red-500/5' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Quick complete checkbox */}
                  <button
                    onClick={() => canEdit && quickStatusUpdate(task._id, task.status === 'completed' ? 'todo' : 'completed')}
                    disabled={!canEdit}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                      task.status === 'completed'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'border-slate-600 hover:border-brand-500 hover:bg-brand-500/10'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {task.status === 'completed' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {canEdit && (
                          <button onClick={() => setEditTask(task)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setDeleteTarget(task)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.project && (
                        <span className="badge text-xs font-medium"
                          style={{ background: (task.project.color || '#6366f1') + '22', color: task.project.color || '#6366f1' }}>
                          {task.project.name}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                            {getInitials(task.assignedTo.name)}
                          </span>
                          {task.assignedTo.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                          {overdue && '⚠️'}
                          {overdue ? 'Overdue: ' : 'Due: '}{formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Task" size="lg">
        <TaskForm
          projects={projects}
          users={users}
          onSubmit={handleCreate}
          loading={saving}
          isAdmin={isAdmin}
          initial={{ ...defaultForm, project: filters.project || '' }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && (
          <TaskForm
            initial={{
              title: editTask.title, description: editTask.description,
              status: editTask.status, priority: editTask.priority,
              project: editTask.project?._id || '', assignedTo: editTask.assignedTo?._id || '',
              dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : '',
            }}
            projects={projects}
            users={users}
            onSubmit={handleUpdate}
            loading={saving}
            isAdmin={isAdmin}
          />
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Task"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
