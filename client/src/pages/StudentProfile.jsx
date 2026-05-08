import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { validatePassword } from '../utils/password';
import PasswordInput from '../components/PasswordInput';

export default function StudentProfile() {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState('');

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      await api.put('/auth/profile', { phone });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, phone }));
      setPhoneSuccess('Phone number saved');
      setTimeout(() => setPhoneSuccess(''), 3000);
    } catch {
      // silent
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!pwdForm.currentPassword) { setError('Current password is required'); return; }
    const pwdErr = validatePassword(pwdForm.newPassword);
    if (pwdErr) { setError(pwdErr); return; }
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

        {/* Profile info */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{user?.name}</h2>
              <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">
                🎓 {user?.role}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { icon: '🪪', label: 'Full Name', value: user?.name },
              { icon: '🆔', label: 'Student ID', value: user?.studentId, mono: true },
              { icon: '🏛', label: 'Department', value: user?.department || '—' },
              { icon: '✉️', label: 'Email', value: user?.email || '—' },
              { icon: '📞', label: 'Phone', value: user?.phone || '—' },
            ].map(({ icon, label, value, mono }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-lg w-7 shrink-0">{icon}</span>
                <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
                <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone number */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-1">Phone Number</h2>
          <p className="text-sm text-gray-500 mb-4">Optional — for contact purposes.</p>
          {phoneSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✓ {phoneSuccess}</div>
          )}
          <form onSubmit={handleSavePhone} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0912 345 678"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <button type="submit" disabled={savingPhone}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shrink-0">
              {savingPhone ? 'Saving...' : 'Save'}
            </button>
          </form>
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

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <PasswordInput
              label="Current Password"
              showStrength={false}
              hint=""
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
            <PasswordInput
              label="New Password"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              placeholder="Enter new password"
            />
            <PasswordInput
              label="Confirm New Password"
              showStrength={false}
              hint=""
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              placeholder="Repeat new password"
            />
            {pwdForm.confirm && (
              <p className={`text-xs -mt-2 ${pwdForm.newPassword !== pwdForm.confirm ? 'text-red-500' : 'text-green-600'}`}>
                {pwdForm.newPassword !== pwdForm.confirm ? 'Passwords do not match' : '✓ Passwords match'}
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
