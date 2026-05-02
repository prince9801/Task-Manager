import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/Badges';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, getInitials, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await projectsAPI.getOne(id);
      setProject(res.data.project);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  useEffect(() => {
    if (isAdmin) {
      authAPI.getUsers().then(res => setAllUsers(res.data.users)).catch(() => {});
    }
  }, [isAdmin]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setAdding(true);
    try {
      await projectsAPI.addMember(id, selectedUser);
      toast.success('Member added!');
      setAddMemberOpen(false);
      setSelectedUser('');
      fetchProject();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      await projectsAPI.removeMember(id, userId);
      toast.success(`${name} removed.`);
      fetchProject();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64"><LoadingSpinner size="lg" /></div>;
  if (!project) return null;

  const nonMembers = allUsers.filter(u => !project.members.some(m => m._id === u._id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/projects" className="hover:text-slate-300 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-slate-300">{project.name}</span>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: (project.color || '#6366f1') + '22', border: `1px solid ${project.color || '#6366f1'}44` }}>
              <div className="w-5 h-5 rounded-md" style={{ background: project.color || '#6366f1' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              {project.description && <p className="text-slate-400 mt-1 text-sm">{project.description}</p>}
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={project.status} />
                {project.dueDate && (
                  <span className="text-xs text-slate-500">Due {formatDate(project.dueDate)}</span>
                )}
                <span className="text-xs text-slate-500">by {project.owner?.name}</span>
              </div>
            </div>
          </div>
          <Link to={`/tasks?project=${project._id}`} className="btn-secondary text-sm whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            View Tasks
          </Link>
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-200">Team Members ({project.members?.length || 0})</h2>
          {isAdmin && (
            <button className="btn-primary text-sm" onClick={() => setAddMemberOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Member
            </button>
          )}
        </div>

        <div className="space-y-2">
          {(project.members || []).map(member => (
            <div key={member._id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-sm font-medium text-brand-300">
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{member.name}</p>
                    {project.owner?._id === member._id && (
                      <span className="badge bg-amber-500/20 text-amber-300 text-xs">Owner</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-slate-700/60 text-slate-400 capitalize">{member.role}</span>
                {isAdmin && project.owner?._id !== member._id && (
                  <button
                    onClick={() => handleRemoveMember(member._id, member.name)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={addMemberOpen} onClose={() => { setAddMemberOpen(false); setSelectedUser(''); }} title="Add Member" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select User</label>
            <select className="select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Choose a user...</option>
              {nonMembers.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email}) — {u.role}</option>
              ))}
            </select>
            {nonMembers.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">All users are already members.</p>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setAddMemberOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAddMember} disabled={!selectedUser || adding}>
              {adding ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
