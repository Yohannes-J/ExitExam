import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function SchoolDeptSelect({
  school, onSchoolChange,
  department, onDeptChange,
  required = false,
  disableSchool = false,
}) {
  const [schools, setSchools] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    api.get('/schools')
      .then(r => setSchools(r.data))
      .finally(() => setLoadingSchools(false));
  }, []);

  useEffect(() => {
    if (!school) { setDepts([]); return; }
    setLoadingDepts(true);
    api.get(`/schools/${school}/departments`)
      .then(r => setDepts(r.data))
      .finally(() => setLoadingDepts(false));
  }, [school]);

  return (
    <div className="space-y-3">
      {}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          School {required && '*'}
        </label>
        <select
          required={required}
          disabled={disableSchool || loadingSchools}
          value={school || ''}
          onChange={e => { onSchoolChange(e.target.value); onDeptChange(''); }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">— Select School —</option>
          {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department {required && '*'}
        </label>
        <select
          required={required}
          disabled={!school || loadingDepts}
          value={department || ''}
          onChange={e => onDeptChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">
            {!school ? '— Select school first —' : loadingDepts ? 'Loading...' : '— Select Department —'}
          </option>
          {depts.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>
      </div>
    </div>
  );
}
