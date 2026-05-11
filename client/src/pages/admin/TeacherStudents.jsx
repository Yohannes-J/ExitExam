import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import PasswordInput from '../../components/PasswordInput';
import { validatePassword } from '../../utils/password';

const PAGE_SIZE = 10;

export default function TeacherStudents() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortAZ, setSortAZ] = useState(true);
  const [page, setPage] = useState(1);

  
  const [modal, setModal] = useState(null); 
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', studentId: '', department: '' });
  const [resetPwd, setResetPwd] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetDone, setResetDone] = useState(null);

  const myDepts = user?.departments?.length > 0
    ? user.departments
    : user?.department ? [user.department] : [];

  const activeDept = searchParams.get('dept') || null;

  const load = () => {
    api.get('/admin/students')
      .then(r => setStudents(r.data.filter(u => u.role === 'student')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); setSearch(''); }, [activeDept]);
  useEffect(() => { setPage(1); }, [search, sortAZ]);

  const deptStudents = activeDept ? students.filter(s => s.department === activeDept) : [];
  const filtered = deptStudents.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) =>
    sortAZ ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const closeModal = () => { setModal(null); setSelected(null); setError(''); setResetDone(null); };
  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const openEdit = (s) => {
    setSelected(s);
    setEditForm({ name: s.name, studentId: s.studentId, department: s.department || '' });
    setError(''); setModal('edit');
  };
  const openReset = (s) => { setSelected(s); setResetPwd({ password: '', confirm: '' }); setError(''); setModal('reset'); };
  const openDelete = (s) => { setSelected(s); setError(''); setModal('delete'); };

  const handleEdit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.put(`/admin/students/${selected._id}`, editForm);
      showSuccess('Student updated');
      closeModal(); load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError('');
    const pwdErr = validatePassword(resetPwd.password);
    if (pwdErr) { setError(pwdErr); return; }
    if (resetPwd.password !== resetPwd.confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put(`/admin/students/${selected._id}`, { password: resetPwd.password });
      setResetDone({ name: selected.name, id: selected.studentId, password: resetPwd.password });
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/students/${selected._id}`);
      showSuccess('Student deleted');
      closeModal(); load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
    finally { setSaving(false); }
  };

  
  if (!activeDept) {
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
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {myDepts.map(dept => {
                const count = students.filter(s => s.department === dept).length;
                return (
                  <button key={dept} onClick={() => setSearchParams({ dept })}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition p-6 text-left group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">🎓</div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{dept}</h3>
                    <p className="text-sm text-gray-500">{count} student{count !== 1 ? 's' : ''}</p>
                    <div className="mt-4 flex items-center gap-1 text-indigo-600 text-sm font-medium">
                      View students
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto xl:px-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 text-sm font-medium transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Departments
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-800">{activeDept}</h1>
        </div>

        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✓ {success}</div>}

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total', value: deptStudents.length, color: 'indigo' },
            { label: 'Showing', value: sorted.length, color: 'green' },
            { label: 'Department', value: activeDept, color: 'purple', small: true },
          ].map(({ label, value, color, small }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center border border-gray-100">
              <div className={`${small ? 'text-xs sm:text-sm' : 'text-2xl'} font-bold text-${color}-600 truncate`}>{loading ? '...' : value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input type="text" placeholder={`Search ${activeDept} students...`}
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <button onClick={() => setSortAZ(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-600 shrink-0">
            <span>{sortAZ ? 'A→Z' : 'Z→A'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortAZ
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 8l4-4m0 0l4 4m-4-4V8" />
              }
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm text-gray-400">
            <div className="text-4xl mb-2">🎓</div>
            <p>{search ? 'No students match your search' : `No students in ${activeDept} yet`}</p>
          </div>
        ) : (
          <>
            {}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Registered</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((s, i) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.studentId}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(s)}
                            className="text-xs px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">Edit</button>
                          <button onClick={() => openReset(s)}
                            className="text-xs px-2.5 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition">🔑 Reset</button>
                          <button onClick={() => openDelete(s)}
                            className="text-xs px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {}
            <div className="sm:hidden space-y-3">
              {paginated.map((s, i) => (
                <div key={s._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-400 w-5 shrink-0">{(page - 1) * PAGE_SIZE + i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.studentId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => openEdit(s)}
                      className="text-xs py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">Edit</button>
                    <button onClick={() => openReset(s)}
                      className="text-xs py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition">🔑 Reset</button>
                    <button onClick={() => openDelete(s)}
                      className="text-xs py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {sorted.length > PAGE_SIZE && (
              <div className="mt-4">
                <p className="text-center text-xs text-gray-400 mb-2">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </p>
                <Pagination page={page} totalPages={totalPages} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {}
      {modal === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">✏️ Edit Student</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input required value={editForm.studentId} onChange={e => setEditForm(p => ({ ...p, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {modal === 'reset' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            {resetDone ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">Password Reset!</h2>
                <p className="text-sm text-gray-500 mb-4">Share with <strong>{resetDone.name}</strong></p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2 mb-5">
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Login ID</span><span className="font-mono font-semibold text-gray-800">{resetDone.id}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Password</span><span className="font-mono font-bold text-indigo-700 text-lg">{resetDone.password}</span></div>
                </div>
                <button onClick={closeModal} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-sm transition">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl shrink-0">🔑</div>
                  <div><h2 className="text-lg font-bold text-gray-800">Reset Password</h2>
                    <p className="text-sm text-gray-500">for <strong>{selected?.name}</strong></p></div>
                </div>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
                <form onSubmit={handleReset} className="space-y-4">
                  <PasswordInput label="New Password" value={resetPwd.password}
                    onChange={e => setResetPwd(p => ({ ...p, password: e.target.value }))} />
                  <PasswordInput label="Confirm Password" showStrength={false} hint=""
                    value={resetPwd.confirm} placeholder="Repeat new password"
                    onChange={e => setResetPwd(p => ({ ...p, confirm: e.target.value }))} />
                  {resetPwd.confirm && (
                    <p className={`text-xs -mt-2 ${resetPwd.password !== resetPwd.confirm ? 'text-red-500' : 'text-green-600'}`}>
                      {resetPwd.password !== resetPwd.confirm ? 'Passwords do not match' : '✓ Passwords match'}
                    </p>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                      {saving ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {}
      {modal === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Student?</h2>
            <p className="text-gray-500 text-sm mb-1">Delete <strong>{selected?.name}</strong>?</p>
            <p className="text-red-500 text-xs mb-5">This cannot be undone.</p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
