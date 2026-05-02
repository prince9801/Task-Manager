import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-2xl tracking-tight">TaskFlow</span>
        </div>

        <div className="card shadow-2xl border-slate-700/60">
          <h1 className="text-2xl font-semibold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-6">Sign in to your workspace</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Signing in...</span></>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 card border-slate-800/40 bg-slate-900/40">
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium mb-1">Admin</p>
              <p className="text-slate-500 font-mono">admin@demo.com</p>
              <p className="text-slate-500 font-mono">demo123</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Member</p>
              <p className="text-slate-500 font-mono">member@demo.com</p>
              <p className="text-slate-500 font-mono">demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
