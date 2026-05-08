import { useState } from 'react';
import { passwordStrength } from '../utils/password';

const strengthConfig = {
  weak:   { label: 'Weak',   color: 'bg-red-500',    text: 'text-red-500',    width: 'w-1/3' },
  medium: { label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-600', width: 'w-2/3' },
  strong: { label: 'Strong', color: 'bg-green-500',  text: 'text-green-600',  width: 'w-full' },
};

export default function PasswordInput({
  value, onChange, required = true, placeholder = '••••••••',
  label = 'Password', hint = 'Min 6 characters, at least 1 letter',
  showStrength = true, className = '',
}) {
  const [show, setShow] = useState(false);
  const strength = value ? passwordStrength(value) : null;
  const cfg = strength ? strengthConfig[strength] : null;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      )}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minLength={6}
          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm select-none">
          {show ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Strength bar */}
      {showStrength && value && cfg && (
        <div className="mt-1.5">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${cfg.color} ${cfg.width}`} />
          </div>
          <p className={`text-xs mt-0.5 ${cfg.text}`}>{cfg.label} password</p>
        </div>
      )}

      {hint && !value && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}
