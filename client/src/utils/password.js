
export function validatePassword(pwd) {
  if (!pwd || pwd.length < 6) return 'Password must be at least 6 characters';
  if (!/[a-zA-Z]/.test(pwd)) return 'Password must contain at least 1 letter';
  return null;
}

export function passwordStrength(pwd) {
  if (!pwd || pwd.length < 6) return 'weak';
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const score = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  if (pwd.length >= 10 && score >= 3) return 'strong';
  if (pwd.length >= 8 && score >= 2) return 'medium';
  return 'weak';
}
