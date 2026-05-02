import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/projects', label: 'Projects', icon: '◉' },
  { to: '/tasks', label: 'Tasks', icon: '◎' },
];

const Navbar = () => {
  const { user, logoutUser, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-display font-bold text-sm text-white group-hover:bg-indigo-500 transition-colors">
              T
            </div>
            <span className="font-display font-semibold text-white text-lg tracking-tight">TaskFlow</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs opacity-70">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="hidden sm:flex badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">
                Admin
              </span>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-200 leading-none">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-sm px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="sm:hidden flex border-t border-slate-800 py-2 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                location.pathname === link.to
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
