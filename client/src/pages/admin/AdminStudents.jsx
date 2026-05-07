import { useState, useEffect } from 'react';
import api from '../../api/axios';

const emptyForm = { name: '', studentId: '', email: '', department: '', password: '', role: 'student' };

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete' | 'reset'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/students').then((res) => setStudents(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (s) => {
    setSelected(s);
    setForm({ name: s.name, studentId: s.studentId, email: s.email, department: s.department || '', password: '', role: s.role || 'student' });
    setError(''); setModal('edit');
  };
  const openDelete = (s) => { setSelected(s); setError(''); setModal('delete'); };
  const openReset = (s) => { setSelected(s); setResetForm({ password: '', confirm: '' }); setError(''); setShowPwd(false); setShowConfirm(false); setModal('reset'); };
  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/admin/students', form);
      setSuccess('Student created successfully');
      closeModal(); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create student'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.put(`/admin/students/${selected._id}`, form);
      setSuccess('Student updated successfully');
      closeModal(); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update student'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/students/${selected._id}`);
      setSuccess('Student deleted');
      closeModal(); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
    finally { setSaving(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError('');
    if (resetForm.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (resetForm.password !== resetForm.confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put(`/admin/students/${selected._id}`, { ...selected, password: resetForm.password });
      setSuccess(`Password reset for ${selected.name}`);
      closeModal(); setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password'); }
    finally { setSaving(false); }
  };

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Users</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{students.length} user{students.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-1.5">
            <span>+</span> Add Student
          </button>
        </div>

        {/* Success banner */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        {/* Search */}
        <input type="text" placeholder="Search by name, ID, email, or department..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4" />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-medium">No students found</p>
            <p className="text-sm mt-1">Click "Add Student" to create the first account</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Student ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.studentId}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.department || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          s.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {s.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(s)}
                            className="text-xs px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">
                            Edit
                          </button>
                          <button onClick={() => openReset(s)}
                            className="text-xs px-2.5 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition">
                            🔑 Reset
                          </button>
                          <button onClick={() => openDelete(s)}
                            className="text-xs px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map((s) => (
                <div key={s._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.studentId}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {s.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mb-3">
                    <p>📧 {s.email}</p>
                    <p>🏛 {s.department || '—'}</p>
                    <p>📅 {formatDate(s.createdAt)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => openEdit(s)}
                      className="text-xs py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">
                      Edit
                    </button>
                    <button onClick={() => openReset(s)}
                      className="text-xs py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition">
                      🔑 Reset
                    </button>
                    <button onClick={() => openDelete(s)}
                      className="text-xs py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              {modal === 'create' ? '➕ Add New Student' : '✏️ Edit Student'}
            </h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="space-y-3 sm:space-y-4">
              {[
                { key: 'name', label: 'Full Name *', required: true, type: 'text', placeholder: 'Abebe Kebede' },
                { key: 'studentId', label: 'Student ID *', required: true, type: 'text', placeholder: 'UGR/12345/15' },
                { key: 'email', label: 'Email *', required: true, type: 'email', placeholder: 'student@university.edu' },
                { key: 'department', label: 'Department', required: false, type: 'text', placeholder: 'Computer Science' },
              ].map(({ key, label, required, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input required={required} type={type} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder={placeholder} />
                </div>
              ))}
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input required type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="••••••••" />
                </div>
              )}
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['student', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                        form.role === r
                          ? r === 'admin'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span>{r === 'admin' ? '👑' : '🎓'}</span>
                      <span className="capitalize">{r}</span>
                    </button>
                  ))}
                </div>
                {form.role === 'admin' && (
                  <p className="text-xs text-purple-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> This user will have full admin access.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Student' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {modal === 'reset' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-2xl shrink-0">
                🔑
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Reset Password</h2>
                <p className="text-sm text-gray-500">for <span className="font-semibold text-gray-700">{selected?.name}</span></p>
              </div>
            </div>

            {/* Student info pill */}
            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {selected?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{selected?.name}</p>
                <p className="text-xs text-gray-400 truncate">{selected?.email} · {selected?.studentId}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={resetForm.password}
                    onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showConfirm ? 'text' : 'password'}
                    value={resetForm.confirm}
                    onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition ${
                      resetForm.confirm && resetForm.password !== resetForm.confirm
                        ? 'border-red-300 focus:ring-red-300 bg-red-50'
                        : resetForm.confirm && resetForm.password === resetForm.confirm
                        ? 'border-green-300 focus:ring-green-300 bg-green-50'
                        : 'border-gray-300 focus:ring-yellow-400'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {resetForm.confirm && resetForm.password !== resetForm.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {resetForm.confirm && resetForm.password === resetForm.confirm && (
                  <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? 'Resetting...' : '🔑 Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {modal === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Student?</h2>
            <p className="text-gray-500 text-sm mb-1">
              You are about to delete <strong>{selected?.name}</strong>.
            </p>
            <p className="text-red-500 text-xs mb-5">This action cannot be undone.</p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={closeModal}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
