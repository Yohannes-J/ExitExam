import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function SchoolMultiDeptSelect({ school, onSchoolChange, departments = [], onDeptsChange }) {
  const [schools, setSchools] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    api.get('/schools').then(r => setSchools(r.data)).finally(() => setLoadingSchools(false));
  }, []);

  useEffect(() => {
    if (!school) { setDepts([]); return; }
    setLoadingDepts(true);
    api.get(`/schools/${school}/departments`)
      .then(r => setDepts(r.data))
      .finally(() => setLoadingDepts(false));
  }, [school]);

  const toggle = (name) => {
    if (departments.includes(name)) {
      onDeptsChange(departments.filter(d => d !== name));
    } else {
      onDeptsChange([...departments, name]);
    }
  };

  return (
    <div className="space-y-3">
      {}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
        <select required disabled={loadingSchools} value={school || ''}
          onChange={e => { onSchoolChange(e.target.value); onDeptsChange([]); }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white disabled:bg-gray-50">
          <option value="">— Select School —</option>
          {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {}
      {school && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departments * <span className="text-gray-400 font-normal">(select all that apply)</span>
          </label>
          {loadingDepts ? (
            <p className="text-xs text-gray-400">Loading departments...</p>
          ) : depts.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No departments in this school yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {depts.map(d => (
                <label key={d._id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-sm ${
                    departments.includes(d.name)
                      ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}>
                  <input type="checkbox" checked={departments.includes(d.name)}
                    onChange={() => toggle(d.name)}
                    className="w-4 h-4 accent-purple-600 shrink-0" />
                  {d.name}
                </label>
              ))}
            </div>
          )}
          {departments.length > 0 && (
            <p className="text-xs text-purple-600 mt-1.5">
              ✓ {departments.length} department{departments.length !== 1 ? 's' : ''} selected: {departments.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
