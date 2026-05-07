import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function AdminProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (form.newPassword !== form.confirm) { setError('New passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{user?.name}</h2>
              <p className="text-sm text-indigo-600 font-medium capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-24 shrink-0">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-24 shrink-0">Student ID</span>
              <span className="font-medium font-mono">{user?.studentId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-24 shrink-0">Department</span>
              <span className="font-medium">{user?.department || '—'}</span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 mb-5">Update your admin password here.</p>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
              <div className="relative">
                <input required type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Enter current password" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showCurrent ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
              <div className="relative">
                <input required type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Enter new password" minLength={6} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
              <div className="relative">
                <input required type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition ${
                    form.confirm && form.newPassword !== form.confirm
                      ? 'border-red-300 focus:ring-red-300 bg-red-50'
                      : form.confirm && form.newPassword === form.confirm
                      ? 'border-green-300 focus:ring-green-300 bg-green-50'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Confirm new password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {form.confirm && form.newPassword !== form.confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {form.confirm && form.newPassword === form.confirm && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-lg transition font-semibold text-sm mt-2">
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
