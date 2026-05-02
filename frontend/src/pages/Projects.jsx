import { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject, addMember, removeMember } from '../api/projects';
import { getUsers } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { RoleBadge } from '../components/common/StatusBadge';
import { formatDate, getInitials } from '../utils/helpers';

const PROJECT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const ProjectCard = ({ project, isAdmin, onDelete, onManageMembers }) => (
  <div className="card p-6 hover:border-slate-700 transition-all duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold"
          style={{ backgroundColor: project.color || '#6366f1' }}
        >
          {project.name[0]}
        </div>
        <div>
          <h3 className="font-semibold text-white">{project.name}</h3>
          <p className="text-xs text-slate-400">by {project.owner?.name}</p>
        </div>
      </div>
      <span className={`badge ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
        {project.status}
      </span>
    </div>

    {project.description && (
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
    )}

    {/* Members */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {project.members?.slice(0, 4).map((m) => (
            <div
              key={m._id}
              title={m.name}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white"
            >
              {getInitials(m.name)}
            </div>
          ))}
          {project.members?.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-slate-300">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-500 ml-1">{project.members?.length || 0} members</span>
      </div>
      <p className="text-xs text-slate-500">{formatDate(project.createdAt)}</p>
    </div>

    {isAdmin && (
      <div className="flex gap-2 pt-4 border-t border-slate-800">
        <button
          onClick={() => onManageMembers(project)}
          className="btn-secondary flex-1 justify-center text-sm py-1.5"
        >
          Manage Members
        </button>
        <button
          onClick={() => onDelete(project._id)}
          className="btn-danger px-3 py-1.5 text-sm"
        >
          Delete
        </button>
      </div>
    )}
  </div>
);

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [submitting, setSubmitting] = useState(false);
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [pRes, uRes] = await Promise.allSettled([
        getProjects(),
        isAdmin ? getUsers() : Promise.resolve({ data: { users: [] } }),
      ]);
      if (pRes.status === 'fulfilled') setProjects(pRes.value.data.projects);
      if (uRes.status === 'fulfilled' && uRes.value) setUsers(uRes.value.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createProject(form);
      setProjects([res.data.project, ...projects]);
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete project and all its tasks?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await addMember(selectedProject._id, userId);
      const updatedProject = res.data.project;
      setProjects(projects.map((p) => p._id === updatedProject._id ? updatedProject : p));
      setSelectedProject(updatedProject);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await removeMember(selectedProject._id, userId);
      const updatedProject = res.data.project;
      setProjects(projects.map((p) => p._id === updatedProject._id ? updatedProject : p));
      setSelectedProject(updatedProject);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const nonMembers = users.filter(
    (u) => !selectedProject?.members?.some((m) => m._id === u._id)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text="Loading projects..." />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Project
          </button>
        )}
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">◉</p>
          <p className="text-slate-300 font-medium mb-1">No projects yet</p>
          <p className="text-slate-500 text-sm">
            {isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onManageMembers={(p) => { setSelectedProject(p); setShowMembers(true); }}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What's this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal isOpen={showMembers} onClose={() => setShowMembers(false)} title={`Members — ${selectedProject?.name}`} size="lg">
        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <p className="label">Current Members ({selectedProject?.members?.length || 0})</p>
            {selectedProject?.members?.length === 0 ? (
              <p className="text-slate-500 text-sm">No members yet</p>
            ) : (
              <div className="space-y-2">
                {selectedProject?.members?.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={m.role} />
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Members */}
          {nonMembers.length > 0 && (
            <div>
              <p className="label">Add Members</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nonMembers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(u._id)}
                      className="text-indigo-400 hover:text-indigo-300 text-sm px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Projects;
