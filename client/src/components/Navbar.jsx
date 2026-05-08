import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStudentsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isTeacher = user?.role === 'teacher';
  const myDepts = isTeacher
    ? (user?.departments?.length > 0 ? user.departments : user?.department ? [user.department] : [])
    : [];
  const hasMultipleDepts = myDepts.length > 1;

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/exams', label: 'Exams' },
    { to: '/admin/students', label: 'Users' },
    { to: '/admin/schools', label: 'Schools' },
    { to: '/admin/results', label: 'Results' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/profile', label: 'Profile' },
  ];

  const teacherLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/exams', label: 'Exams' },
    // My Students handled separately below
    { to: '/admin/results', label: 'Results' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/profile', label: 'Profile' },
  ];

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/results', label: 'My Results' },
    { to: '/profile', label: 'Profile' },
  ];

  const navLinks = user?.role === 'admin' ? adminLinks
    : isTeacher ? teacherLinks
    : studentLinks;

  return (
    <nav className="bg-indigo-700 text-white shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            <span className="text-2xl">🎓</span>
            <span>ExitExam</span>
          </Link>

          {user && (
            <>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-5">
                {navLinks.map(({ to, label }) => (
                  <Link key={to} to={to} className="hover:text-indigo-200 text-sm font-medium transition">
                    {label}
                  </Link>
                ))}

                {/* My Students — dropdown for multi-dept teachers, plain link for single */}
                {isTeacher && (
                  hasMultipleDepts ? (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setStudentsOpen(p => !p)}
                        className="flex items-center gap-1 hover:text-indigo-200 text-sm font-medium transition"
                      >
                        My Students
                        <svg className={`w-3.5 h-3.5 transition-transform ${studentsOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {studentsOpen && (
                        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                          <Link to="/admin/my-students"
                            onClick={() => setStudentsOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition font-medium">
                            <span>👥</span> All Departments
                          </Link>
                          <div className="border-t border-gray-100 my-1" />
                          {myDepts.map(dept => (
                            <Link
                              key={dept}
                              to={`/admin/my-students?dept=${encodeURIComponent(dept)}`}
                              onClick={() => setStudentsOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
                            >
                              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                              {dept}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to="/admin/my-students" className="hover:text-indigo-200 text-sm font-medium transition">
                      My Students
                    </Link>
                  )
                )}

                <div className="flex items-center gap-2 border-l border-indigo-500 pl-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm hidden lg:block max-w-[120px] truncate">{user.name}</span>
                  <button onClick={handleLogout}
                    className="ml-1 bg-red-600 hover:bg-red-700 active:bg-red-800 px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm">
                    Logout
                  </button>
                </div>
              </div>

              {/* Mobile hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-indigo-600 transition" aria-label="Toggle menu">
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        {user && menuOpen && (
          <div className="md:hidden border-t border-indigo-600 py-3 space-y-1">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-indigo-300 text-xs">{user.role}</p>
              </div>
            </div>

            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg hover:bg-indigo-600 text-sm font-medium transition">
                {label}
              </Link>
            ))}

            {/* My Students mobile */}
            {isTeacher && (
              hasMultipleDepts ? (
                <div>
                  <p className="px-3 py-1.5 text-xs text-indigo-300 font-semibold uppercase tracking-wide">My Students</p>
                  <Link to="/admin/my-students" onClick={() => setMenuOpen(false)}
                    className="block px-5 py-2 rounded-lg hover:bg-indigo-600 text-sm transition text-indigo-200">
                    👥 All Departments
                  </Link>
                  {myDepts.map(dept => (
                    <Link key={dept}
                      to={`/admin/my-students?dept=${encodeURIComponent(dept)}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg hover:bg-indigo-600 text-sm transition">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                      {dept}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link to="/admin/my-students" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg hover:bg-indigo-600 text-sm font-medium transition">
                  My Students
                </Link>
              )
            )}

            <button onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-sm font-medium text-red-300 transition mt-1">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
