import { useState, useEffect } from 'react';
import api from '../../api/axios';

const emptyForm = { name: '', studentId: '', email: '', department: '', password: '' };

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/students').then((res) => setStudents(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (s) => { setSelected(s); setForm({ name: s.name, studentId: s.studentId, email: s.email, department: s.department || '', password: '' }); setError(''); setModal('edit'); };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await api.post('/admin/students', form); setSuccess('Student created'); closeModal(); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { setError(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await api.put(`/admin/students/${selected._id}`, form); setSuccess('Student updated'); closeModal(); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await api.delete(`/admin/students/${selected._id}`); setSuccess('Student deleted'); closeModal(); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Students</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-1.5">
            <span>+</span> Add Student
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✓ {success}</div>
        )}

        <input type="text" placeholder="Search by name, ID, email, or department..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4" />

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
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(s)}
                            className="text-xs px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">Edit</button>
                          <button onClick={() => openDelete(s)}
                            className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">Delete</button>
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
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mb-3">
                    <p>📧 {s.email}</p>
                    <p>🏛 {s.department || '—'}</p>
                    <p>📅 {formatDate(s.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)}
                      className="flex-1 text-xs py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">Edit</button>
                    <button onClick={() => openDelete(s)}
                      className="flex-1 text-xs py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {modal === 'edit' ? <span className="text-gray-400 font-normal text-xs">(blank = keep current)</span> : '*'}
                </label>
                <input required={modal === 'create'} type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="••••••••" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? 'Saving...' : modal === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Student?</h2>
            <p className="text-gray-500 text-sm mb-1">Delete <strong>{selected?.name}</strong>?</p>
            <p className="text-red-500 text-xs mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={closeModal}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
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
