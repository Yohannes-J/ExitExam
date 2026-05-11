import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/Pagination";
import PasswordInput from "../../components/PasswordInput";
import { validatePassword } from "../../utils/password";
import SchoolDeptSelect from "../../components/SchoolDeptSelect";
import SchoolMultiDeptSelect from "../../components/SchoolMultiDeptSelect";

const emptyStudent = { name: "", studentId: "", school: "", department: "", password: "" };
const emptyAdmin = { name: "", email: "", school: "", department: "", departments: [], role: "teacher" };

const PAGE_SIZE = 10;

export default function AdminStudents() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'admin';
  const [tab, setTab] = useState("students");
  const [viewMode, setViewMode] = useState("table"); 
  const [activeDept, setActiveDept] = useState(null); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortAZ, setSortAZ] = useState(true); 
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [resetPwd, setResetPwd] = useState({ password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newAdminCreds, setNewAdminCreds] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/students").then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const students = users.filter((u) => u.role === "student");
  const admins = users.filter((u) => u.role === "admin" || u.role === "teacher");
  const list = tab === "students" ? students : admins;

  const filtered = list.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  
  useEffect(() => { setPage(1); }, [tab, search]);

  const sorted = [...filtered].sort((a, b) =>
    sortAZ ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const closeModal = () => { setModal(null); setSelected(null); setError(""); setNewAdminCreds(null); setResetDone(null); };
  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };

  const handleCreateStudent = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    const pwdErr = validatePassword(studentForm.password);
    if (pwdErr) { setError(pwdErr); setSaving(false); return; }
    try {
      await api.post("/admin/students", studentForm);
      showSuccess("Student created successfully");
      setStudentForm(emptyStudent);
      closeModal(); load();
    } catch (err) { setError(err.response?.data?.message || "Failed to create student"); }
    finally { setSaving(false); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    if (adminForm.role === 'teacher' && adminForm.departments.length === 0) {
      setError("Please select at least one department for the teacher");
      setSaving(false); return;
    }
    try {
      const payload = {
        ...adminForm,
        department: adminForm.departments[0] || adminForm.department,
      };
      const { data } = await api.post("/admin/admins", payload);
      setNewAdminCreds({ email: data.email, password: data.defaultPassword, name: data.name });
      showSuccess("Admin/Teacher created");
      setAdminForm(emptyAdmin);
      load();
    } catch (err) { setError(err.response?.data?.message || "Failed to create admin"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete("/admin/students/" + selected._id);
      showSuccess("User deleted");
      closeModal(); load();
    } catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
    finally { setSaving(false); }
  };

  const [resetDone, setResetDone] = useState(null); 

  const handleReset = async (e) => {
    e.preventDefault(); setError("");
    const pwdErr = validatePassword(resetPwd.password);
    if (pwdErr) { setError(pwdErr); return; }
    if (resetPwd.password !== resetPwd.confirm) { setError("Passwords do not match"); return; }
    setSaving(true);
    try {
      await api.put("/admin/students/" + selected._id, { password: resetPwd.password });
      
      setResetDone({ name: selected.name, password: resetPwd.password, id: selected.studentId || selected.email });
    } catch (err) { setError(err.response?.data?.message || "Failed to reset password"); }
    finally { setSaving(false); }
  };

  const openEdit = (u) => {
    setSelected(u);
    setError("");
    if (u.role === "student") {
      setStudentForm({ name: u.name, studentId: u.studentId, department: u.department || "", password: "" });
      setModal("editStudent");
    } else {
      setAdminForm({ name: u.name, email: u.email || "", school: u.school || "", department: u.department || "", departments: u.departments || [], role: u.role });
      setModal("editAdmin");
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await api.put("/admin/students/" + selected._id, {
        name: studentForm.name,
        studentId: studentForm.studentId,
        department: studentForm.department,
      });
      showSuccess("Student updated successfully");
      closeModal(); load();
    } catch (err) { setError(err.response?.data?.message || "Failed to update student"); }
    finally { setSaving(false); }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await api.put("/admin/students/" + selected._id, {
        name: adminForm.name,
        email: adminForm.email,
        departments: adminForm.departments || [],
        department: (adminForm.departments || [])[0] || "",
        role: adminForm.role,
      });
      showSuccess("Profile updated successfully");
      closeModal(); load();
    } catch (err) { setError(err.response?.data?.message || "Failed to update profile"); }
    finally { setSaving(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Users</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{students.length} students · {admins.length} admins</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {}
            {tab === "students" && (
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button onClick={() => { setViewMode("table"); setActiveDept(null); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode === "table" ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>
                  ☰ List
                </button>
                <button onClick={() => { setViewMode("departments"); setActiveDept(null); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode === "departments" ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>
                  🏛 By Dept
                </button>
              </div>
            )}
            <button onClick={() => { setStudentForm(emptyStudent); setError(""); setModal("student"); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
              + Add Student
            </button>
            {isSuperAdmin && (
              <button onClick={() => { setAdminForm(emptyAdmin); setError(""); setModal("admin"); }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                + Add Admin/Teacher
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✓ {success}</div>
        )}

        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "students", label: "🎓 Students", count: students.length },
            ...(isSuperAdmin ? [{ key: "admins", label: "👑 Admins / Teachers", count: admins.length }] : []),
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={"px-4 py-2 rounded-lg text-sm font-semibold transition " + (tab === key ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700")}>
              {label} <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input type="text" placeholder={"Search " + (tab === "students" ? "students" : "admins") + "..."}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <button
            onClick={() => setSortAZ(p => !p)}
            title={sortAZ ? "Sorted A→Z, click for Z→A" : "Sorted Z→A, click for A→Z"}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-600 shrink-0"
          >
            <span>{sortAZ ? "A→Z" : "Z→A"}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortAZ
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 8l4-4m0 0l4 4m-4-4V8" />
              }
            </svg>
          </button>
        </div>

        {}
        {tab === "students" && viewMode === "departments" && (
          activeDept ? (
            
            <div>
              <button onClick={() => setActiveDept(null)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 text-sm font-medium transition mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Departments / <span className="text-indigo-600 font-semibold">{activeDept}</span>
              </button>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{activeDept}</h3>
                  <span className="text-xs text-gray-400">{students.filter(s => s.department === activeDept).length} students</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">#</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student ID</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.filter(s => s.department === activeDept)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((s, i) => (
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
                          <td className="px-5 py-3 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            
            (() => {
              const deptMap = {};
              students.forEach(s => {
                if (s.department) {
                  deptMap[s.department] = (deptMap[s.department] || 0) + 1;
                }
              });
              const depts = Object.entries(deptMap).sort(([a], [b]) => a.localeCompare(b));
              return depts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm text-gray-400">
                  <div className="text-5xl mb-3">🏛</div>
                  <p>No departments found. Add students with departments first.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {depts.map(([dept, count]) => (
                    <button key={dept} onClick={() => setActiveDept(dept)}
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
                  ))}
                </div>
              );
            })()
          )
        )}

        {}
        {(tab !== "students" || viewMode === "table") && (
          <>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3">{tab === "students" ? "🎓" : "👑"}</div>
            <p className="font-medium">No {tab === "students" ? "students" : "admins"} found</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    {tab === "students" ? (
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Student ID</th>
                    ) : (
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    )}
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={"w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 " + (u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700")}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{tab === "students" ? u.studentId : u.email}</td>
                      <td className="px-4 py-3 text-xs">
                        {u.role === "teacher" && u.departments?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.departments.map(d => (
                              <span key={d} className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-xs">{d}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">{u.department || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + (u.role === "admin" ? "bg-purple-100 text-purple-700" : u.role === "teacher" ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700")}>
                          {u.role === "admin" ? "👑 Admin" : u.role === "teacher" ? "🏫 Teacher" : "🎓 Student"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(u)}
                            className="text-xs px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">Edit</button>
                          <button onClick={() => { setSelected(u); setResetPwd({ password: "", confirm: "" }); setError(""); setModal("reset"); }}
                            className="text-xs px-2.5 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition">🔑 Reset</button>
                          <button onClick={() => { setSelected(u); setError(""); setModal("delete"); }}
                            className="text-xs px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-3">
              {paginated.map((u) => (
                <div key={u._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 " + (u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700")}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{tab === "students" ? u.studentId : u.email}</p>
                    </div>
                    <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (u.role === "admin" ? "bg-purple-100 text-purple-700" : u.role === "teacher" ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700")}>
                      {u.role === "admin" ? "👑" : u.role === "teacher" ? "🏫" : "🎓"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    🏛 {u.role === "teacher" && u.departments?.length > 0
                      ? u.departments.join(", ")
                      : u.department || "—"} · 📅 {formatDate(u.createdAt)}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => openEdit(u)}
                      className="text-xs py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition">Edit</button>
                    <button onClick={() => { setSelected(u); setResetPwd({ password: "", confirm: "" }); setError(""); setModal("reset"); }}
                      className="text-xs py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition">🔑 Reset</button>
                    <button onClick={() => { setSelected(u); setError(""); setModal("delete"); }}
                      className="text-xs py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {}
        {filtered.length > PAGE_SIZE && (
          <div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )}
          </>
        )}
      </div>

      {modal === "student" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl">🎓</div>
              <div><h2 className="text-lg font-bold text-gray-800">Add New Student</h2><p className="text-xs text-gray-500">Login with Student ID + Password</p></div>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Abebe Kebede" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input required value={studentForm.studentId} onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono" placeholder="UGR/12345/15" /></div>
              <SchoolDeptSelect
                school={studentForm.school}
                onSchoolChange={v => setStudentForm(prev => ({ ...prev, school: v, department: '' }))}
                department={studentForm.department}
                onDeptChange={v => setStudentForm(prev => ({ ...prev, department: v }))}
              />
              <PasswordInput
                label="Password"
                required
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? "Creating..." : "Create Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "admin" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            {newAdminCreds ? (
              <div>
                <div className="text-center mb-4"><div className="text-4xl mb-2">✅</div>
                  <h2 className="text-lg font-bold text-gray-800">Admin Created!</h2>
                  <p className="text-sm text-gray-500">Share these credentials with {newAdminCreds.name}</p></div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="font-mono font-semibold text-gray-800">{newAdminCreds.email}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Password</span><span className="font-mono font-semibold text-indigo-700">{newAdminCreds.password}</span></div>
                  <p className="text-xs text-yellow-600 mt-2">⚠️ Ask them to change this password after first login.</p>
                </div>
                <button onClick={closeModal} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-sm transition">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl">👑</div>
                  <div><h2 className="text-lg font-bold text-gray-800">Add Admin / Teacher</h2><p className="text-xs text-gray-500">Login with Email + default password</p></div>
                </div>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" placeholder="Dr. Yohannes" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input required type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" placeholder="teacher@university.edu" /></div>
                  <SchoolMultiDeptSelect
                    school={adminForm.school}
                    onSchoolChange={v => setAdminForm(prev => ({ ...prev, school: v, department: '', departments: [] }))}
                    departments={adminForm.departments}
                    onDeptsChange={v => setAdminForm(prev => ({ ...prev, departments: v }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ value: "teacher", label: "🏫 Teacher", desc: "Dept only access" }, { value: "admin", label: "👑 Admin", desc: "Full access" }].map(r => (
                        <button key={r.value} type="button" onClick={() => setAdminForm({ ...adminForm, role: r.value })}
                          className={"py-2.5 px-3 rounded-lg border-2 text-sm font-semibold transition text-left " + (adminForm.role === r.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                          <div>{r.label}</div>
                          <div className="text-xs font-normal opacity-70">{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                    🔑 Default password <strong>admin123</strong> will be assigned. Share it with the teacher and ask them to change it.
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                      {saving ? "Creating..." : "Create Admin"}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {modal === "reset" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6">
            {resetDone ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">Password Reset!</h2>
                <p className="text-sm text-gray-500 mb-5">Share these credentials with <strong>{resetDone.name}</strong></p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-3 mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0">Login ID</span>
                    <span className="font-mono font-semibold text-gray-800 text-sm">{resetDone.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0">New Password</span>
                    <span className="font-mono font-bold text-indigo-700 text-lg tracking-widest">{resetDone.password}</span>
                  </div>
                </div>
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 text-left">
                  ⚠️ Ask <strong>{resetDone.name}</strong> to log in with this password and change it from their Profile page.
                </p>
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
                    onChange={(e) => setResetPwd({ ...resetPwd, password: e.target.value })} />
                  <PasswordInput label="Confirm Password" showStrength={false} hint=""
                    value={resetPwd.confirm} placeholder="Repeat new password"
                    onChange={(e) => setResetPwd({ ...resetPwd, confirm: e.target.value })} />
                  {resetPwd.confirm && (
                    <p className={`text-xs -mt-2 ${resetPwd.password !== resetPwd.confirm ? 'text-red-500' : 'text-green-600'}`}>
                      {resetPwd.password !== resetPwd.confirm ? 'Passwords do not match' : '✓ Passwords match'}
                    </p>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                      {saving ? "Resetting..." : "Reset Password"}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {modal === "delete" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete User?</h2>
            <p className="text-gray-500 text-sm mb-1">Delete <strong>{selected?.name}</strong>?</p>
            <p className="text-red-500 text-xs mb-5">This cannot be undone.</p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                {saving ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {}
      {modal === "editStudent" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl">✏️</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Edit Student</h2>
                <p className="text-xs text-gray-500">{selected?.name}</p>
              </div>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input required value={studentForm.studentId} onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input value={studentForm.department} onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Computer Science" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {modal === "editAdmin" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl">✏️</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Edit {selected?.role === "admin" ? "Admin" : "Teacher"}</h2>
                <p className="text-xs text-gray-500">{selected?.name}</p>
              </div>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
            <form onSubmit={handleEditAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              {}
              {adminForm.role === "teacher" ? (
                <SchoolMultiDeptSelect
                  school={adminForm.school || ""}
                  onSchoolChange={v => setAdminForm(prev => ({ ...prev, school: v, departments: [] }))}
                  departments={adminForm.departments || []}
                  onDeptsChange={v => setAdminForm(prev => ({ ...prev, departments: v }))}
                />
              ) : null}
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: "teacher", label: "🏫 Teacher", desc: "Dept only" }, { value: "admin", label: "👑 Admin", desc: "Full access" }].map(r => (
                      <button key={r.value} type="button" onClick={() => setAdminForm({ ...adminForm, role: r.value })}
                        className={"py-2.5 px-3 rounded-lg border-2 text-sm font-semibold transition text-left " + (adminForm.role === r.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                        <div>{r.label}</div>
                        <div className="text-xs font-normal opacity-70">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
