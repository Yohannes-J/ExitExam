import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-2xl">🎓</span>
          <span>ExitExam</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            {user.role === 'admin' ? (
              <>
                <Link to="/admin" className="hover:text-indigo-200 text-sm font-medium">Dashboard</Link>
                <Link to="/admin/exams" className="hover:text-indigo-200 text-sm font-medium">Exams</Link>
                <Link to="/admin/results" className="hover:text-indigo-200 text-sm font-medium">Results</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="hover:text-indigo-200 text-sm font-medium">Dashboard</Link>
                <Link to="/results" className="hover:text-indigo-200 text-sm font-medium">My Results</Link>
              </>
            )}
            <div className="flex items-center gap-2 border-l border-indigo-500 pl-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm hidden sm:block">{user.name}</span>
              <button
                onClick={handleLogout}
                className="ml-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-sm transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
