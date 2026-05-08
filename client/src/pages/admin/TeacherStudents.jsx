import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('');
  const [search, setSearch] = useState('');

  // Teacher's departments
  const myDepts = user?.departments?.length > 0
    ? user.departments
    : user?.department ? [user.department] : [];

  useEffect(() => {
    api.get('/admin/students')
      .then(r => setStudents(r.data.filter(u => u.role === 'student')))
      .finally(() => setLoading(false));
  }, []);

  // Set dept from URL param or default to first
  useEffect(() => {
    const deptParam = searchParams.get('dept');
    if (deptParam && myDepts.includes(deptParam)) {
      setActiveDept(deptParam);
    } else if (myDepts.length > 0 && !activeDept) {
      setActiveDept(myDepts[0]);
    }
  }, [myDepts]);

  const deptStudents = students.filter(s => s.department === activeDept);
  const filtered = deptStudents.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto xl:px-8">

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {students.filter(s => myDepts.includes(s.department)).length} students across {myDepts.length} department{myDepts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {myDepts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm text-gray-400">
            <div className="text-5xl mb-3">🏛</div>
            <p className="font-medium">No departments assigned</p>
            <p className="text-sm mt-1">Contact the admin to assign departments to your account</p>
          </div>
        ) : (
          <>
            {/* Department tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
              {myDepts.map(dept => {
                const count = students.filter(s => s.department === dept).length;
                return (
                  <button key={dept} onClick={() => { setActiveDept(dept); setSearch(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      activeDept === dept
                        ? 'bg-white shadow text-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {dept}
                    <span className="ml-1.5 text-xs opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <input type="text" placeholder={`Search ${activeDept} students...`}
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4" />

            {/* Stats for active dept */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Students', value: deptStudents.length, color: 'indigo' },
                { label: 'Department', value: activeDept, color: 'purple', small: true },
                { label: 'Showing', value: filtered.length, color: 'green' },
              ].map(({ label, value, color, small }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center border border-gray-100">
                  <div className={`${small ? 'text-sm' : 'text-2xl'} font-bold text-${color}-600 truncate`}>{loading ? '...' : value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm text-gray-400">
                <div className="text-4xl mb-2">🎓</div>
                <p>{search ? 'No students match your search' : `No students in ${activeDept} yet`}</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student ID</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Department</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((s, i) => (
                        <tr key={s._id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {s.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-800">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600 font-mono text-xs">{s.studentId}</td>
                          <td className="px-5 py-3">
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{s.department}</span>
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {filtered.map((s, i) => (
                    <div key={s._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{s.studentId}</p>
                        </div>
                        <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium shrink-0">{s.department}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
