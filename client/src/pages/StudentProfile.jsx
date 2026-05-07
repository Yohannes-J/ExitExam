import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (pwdForm.newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (pwdForm.newPassword !== pwdForm.confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setSuccess('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Profile</h1>

        {/* Profile info card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg leading-tight">{user?.name}</h2>
              <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">
                🎓 {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: '🪪', label: 'Full Name', value: user?.name },
              { icon: '🆔', label: 'Student ID', value: user?.studentId, mono: true },
              { icon: '🏛', label: 'Department', value: user?.department || '—' },
              { icon: '✉️', label: 'Email', value: user?.email },
            ].map(({ icon, label, value, mono }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-lg w-7 shrink-0">{icon}</span>
                <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
                <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 mb-5">Update your login password.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <span>✓</span> {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password', show: showCurrent, toggle: () => setShowCurrent(!showCurrent), placeholder: 'Enter current password' },
              { key: 'newPassword', label: 'New Password', show: showNew, toggle: () => setShowNew(!showNew), placeholder: 'Min 6 characters', hint: 'Minimum 6 characters' },
              { key: 'confirm', label: 'Confirm New Password', show: showConfirm, toggle: () => setShowConfirm(!showConfirm), placeholder: 'Repeat new password' },
            ].map(({ key, label, show, toggle, placeholder, hint }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
                <div className="relative">
                  <input
                    required
                    type={show ? 'text' : 'password'}
                    value={pwdForm[key]}
                    onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition ${
                      key === 'confirm' && pwdForm.confirm
                        ? pwdForm.newPassword !== pwdForm.confirm
                          ? 'border-red-300 focus:ring-red-300 bg-red-50'
                          : 'border-green-300 focus:ring-green-300 bg-green-50'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder={placeholder}
                    minLength={key !== 'currentPassword' ? 6 : undefined}
                  />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                    {show ? '🙈' : '👁️'}
                  </button>
                </div>
                {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
                {key === 'confirm' && pwdForm.confirm && (
                  <p className={`text-xs mt-1 ${pwdForm.newPassword !== pwdForm.confirm ? 'text-red-500' : 'text-green-600'}`}>
                    {pwdForm.newPassword !== pwdForm.confirm ? 'Passwords do not match' : '✓ Passwords match'}
                  </p>
                )}
              </div>
            ))}

            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm">
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
