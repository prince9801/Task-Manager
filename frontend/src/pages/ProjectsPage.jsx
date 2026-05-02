import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/Badges';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, getInitials, PROJECT_COLORS, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const defaultForm = { name: '', description: '', status: 'active', dueDate: '', color: '#6366f1' };

function ProjectForm({ initial = defaultForm, onSubmit, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Project Name *</label>
        <input className="input" placeholder="e.g. Website Redesign" value={form.name}
          onChange={e => set('name', e.target.value)} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} placeholder="What is this project about?"
          value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate ? form.dueDate.slice(0, 10) : ''}
            onChange={e => set('dueDate', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {PROJECT_COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)}
              className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => onSubmit(form)} disabled={loading || !form.name.trim()}
          className="btn-primary" >
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Project'}
        </button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await projectsAPI.create(form);
      toast.success('Project created!');
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await projectsAPI.update(editProject._id, form);
      toast.success('Project updated!');
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectsAPI.delete(deleteTarget._id);
      toast.success('Project deleted.');
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
          title="No projects yet"
          description={isAdmin ? "Create your first project to get started." : "You haven't been added to any projects yet."}
          action={isAdmin && <button className="btn-primary" onClick={() => setModalOpen(true)}>Create Project</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card hover:border-slate-700/80 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: (project.color || '#6366f1') + '22', border: `1px solid ${project.color || '#6366f1'}44` }}>
                    <div className="w-full h-full rounded-xl flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm" style={{ background: project.color || '#6366f1' }} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Link to={`/projects/${project._id}`} className="font-semibold text-slate-100 hover:text-brand-400 transition-colors truncate block">
                      {project.name}
                    </Link>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditProject(project)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteTarget(project)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{project.completedTaskCount || 0}/{project.taskCount || 0} tasks</span>
                  <span>{project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0}%`,
                      background: project.color || '#6366f1',
                    }} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {(project.members || []).slice(0, 4).map(m => (
                    <div key={m._id} className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-slate-300"
                      title={m.name}>
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-slate-400">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                {project.dueDate && (
                  <span className="text-xs text-slate-500">Due {formatDate(project.dueDate)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Project">
        <ProjectForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && (
          <ProjectForm
            initial={{ name: editProject.name, description: editProject.description, status: editProject.status, dueDate: editProject.dueDate || '', color: editProject.color || '#6366f1' }}
            onSubmit={handleUpdate}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks in this project will be permanently deleted.`}
      />
    </div>
  );
}
