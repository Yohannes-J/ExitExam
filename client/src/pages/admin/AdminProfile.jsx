import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { validatePassword } from '../../utils/password';
import PasswordInput from '../../components/PasswordInput';

export default function AdminProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.currentPassword) { setError('Current password is required'); return; }
    const pwdErr = validatePassword(form.newPassword);
    if (pwdErr) { setError(pwdErr); return; }
    if (form.newPassword !== form.confirm) { setError('Passwords do not match'); return; }
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
          <div className="space-y-2">
            {[
              { label: 'Email', value: user?.email || '—' },
              { label: 'Admin ID', value: user?.studentId, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 w-28 shrink-0 text-sm">{label}</span>
                <span className={`font-medium text-gray-800 text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 mb-5">Enter your current password to set a new one.</p>

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
            <PasswordInput
              label="Current Password"
              showStrength={false}
              hint=""
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
            <PasswordInput
              label="New Password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Enter new password"
            />
            <PasswordInput
              label="Confirm New Password"
              showStrength={false}
              hint=""
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat new password"
            />
            {form.confirm && (
              <p className={`text-xs -mt-2 ${form.newPassword !== form.confirm ? 'text-red-500' : 'text-green-600'}`}>
                {form.newPassword !== form.confirm ? 'Passwords do not match' : '✓ Passwords match'}
              </p>
            )}
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
