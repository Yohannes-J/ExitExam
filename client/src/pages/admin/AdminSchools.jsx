import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminSchools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // school id expanded
  const [depts, setDepts] = useState({}); // { schoolId: [dept, ...] }
  const [loadingDepts, setLoadingDepts] = useState({});

  // School form
  const [schoolModal, setSchoolModal] = useState(null); // 'add' | 'edit'
  const [schoolForm, setSchoolForm] = useState({ name: '', code: '' });
  const [editSchool, setEditSchool] = useState(null);

  // Dept form
  const [deptModal, setDeptModal] = useState(null); // schoolId
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [editDept, setEditDept] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const loadSchools = () => {
    setLoading(true);
    api.get('/schools').then(r => setSchools(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadSchools(); }, []);

  const loadDepts = async (schoolId) => {
    if (depts[schoolId]) return;
    setLoadingDepts(p => ({ ...p, [schoolId]: true }));
    const r = await api.get(`/schools/${schoolId}/departments`);
    setDepts(p => ({ ...p, [schoolId]: r.data }));
    setLoadingDepts(p => ({ ...p, [schoolId]: false }));
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadDepts(id);
  };

  // ── School CRUD ──
  const handleAddSchool = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/schools', schoolForm);
      showSuccess('School added');
      setSchoolModal(null); setSchoolForm({ name: '', code: '' });
      loadSchools();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleEditSchool = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.put(`/schools/${editSchool._id}`, schoolForm);
      showSuccess('School updated');
      setSchoolModal(null); setEditSchool(null);
      loadSchools();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteSchool = async (id) => {
    if (!window.confirm('Delete this school and ALL its departments?')) return;
    await api.delete(`/schools/${id}`);
    showSuccess('School deleted');
    loadSchools();
    setDepts(p => { const n = { ...p }; delete n[id]; return n; });
  };

  // ── Department CRUD ──
  const handleAddDept = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const r = await api.post(`/schools/${deptModal}/departments`, deptForm);
      setDepts(p => ({ ...p, [deptModal]: [...(p[deptModal] || []), r.data] }));
      showSuccess('Department added');
      setDeptModal(null); setDeptForm({ name: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleEditDept = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const r = await api.put(`/schools/departments/${editDept._id}`, deptForm);
      setDepts(p => ({
        ...p,
        [editDept.school]: p[editDept.school]?.map(d => d._id === editDept._id ? r.data : d),
      }));
      showSuccess('Department updated');
      setEditDept(null); setDeptForm({ name: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    await api.delete(`/schools/departments/${dept._id}`);
    setDepts(p => ({ ...p, [dept.school]: p[dept.school]?.filter(d => d._id !== dept._id) }));
    showSuccess('Department deleted');
  };

  const closeModal = () => {
    setSchoolModal(null); setDeptModal(null);
    setEditSchool(null); setEditDept(null);
    setSchoolForm({ name: '', code: '' }); setDeptForm({ name: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto xl:px-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Schools & Departments</h1>
            <p className="text-sm text-gray-500 mt-0.5">{schools.length} school{schools.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setSchoolForm({ name: '', code: '' }); setError(''); setSchoolModal('add'); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Add School
          </button>
        </div>

        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✓ {success}</div>}

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm text-gray-400">
            <div className="text-5xl mb-3">🏫</div>
            <p className="font-medium">No schools yet</p>
            <p className="text-sm mt-1">Click "Add School" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schools.map(school => (
              <div key={school._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* School row */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button onClick={() => toggleExpand(school._id)}
                    className="text-gray-400 hover:text-indigo-600 transition text-lg w-6 shrink-0">
                    {expanded === school._id ? '▾' : '▸'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">🏫 {school.name}</span>
                      {school.code && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{school.code}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {depts[school._id] ? `${depts[school._id].length} department${depts[school._id].length !== 1 ? 's' : ''}` : 'Click to view departments'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setDeptModal(school._id); setDeptForm({ name: '' }); setError(''); loadDepts(school._id); setExpanded(school._id); }}
                      className="text-xs px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">
                      + Dept
                    </button>
                    <button onClick={() => { setEditSchool(school); setSchoolForm({ name: school.name, code: school.code || '' }); setError(''); setSchoolModal('edit'); }}
                      className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteSchool(school._id)}
                      className="text-xs px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Departments */}
                {expanded === school._id && (
                  <div className="border-t border-gray-50 bg-gray-50/50">
                    {loadingDepts[school._id] ? (
                      <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div></div>
                    ) : (depts[school._id] || []).length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-4">No departments yet — click "+ Dept" to add one</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(depts[school._id] || []).map(dept => (
                          <div key={dept._id} className="flex items-center gap-3 px-8 py-3">
                            <span className="text-gray-400 text-sm">📂</span>
                            <span className="flex-1 text-sm text-gray-700 font-medium">{dept.name}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditDept({ ...dept, school: school._id }); setDeptForm({ name: dept.name }); setError(''); }}
                                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition">Edit</button>
                              <button onClick={() => handleDeleteDept({ ...dept, school: school._id })}
                                className="text-xs px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit School Modal */}
      {(schoolModal === 'add' || schoolModal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{schoolModal === 'add' ? '🏫 Add School' : '✏️ Edit School'}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={schoolModal === 'add' ? handleAddSchool : handleEditSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input required value={schoolForm.name} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. College of Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code (optional)</label>
                <input value={schoolForm.code} onChange={e => setSchoolForm({ ...schoolForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  placeholder="e.g. CoE" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? 'Saving...' : schoolModal === 'add' ? 'Add School' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {deptModal && !editDept && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📂 Add Department</h2>
            <p className="text-sm text-gray-500 mb-4">to <strong>{schools.find(s => s._id === deptModal)?.name}</strong></p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input required value={deptForm.name} onChange={e => setDeptForm({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. Computer Science" autoFocus />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">✏️ Edit Department</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={handleEditDept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input required value={deptForm.name} onChange={e => setDeptForm({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" autoFocus />
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
    </div>
  );
}
