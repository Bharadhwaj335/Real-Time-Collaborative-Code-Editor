// Frontend validation patterns and utilities

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{2,50}$/,
  PASSWORD_MIN_LENGTH: 6,
  ROOM_ID: /^[A-Z0-9]{4,10}$/
};

export const validateEmail = (email) => {
  const trimmed = String(email || "").trim().toLowerCase();
  return VALIDATION_PATTERNS.EMAIL.test(trimmed) ? trimmed : null;
};

export const validatePassword = (password) => {
  const str = String(password || "").trim();
  return str.length >= VALIDATION_PATTERNS.PASSWORD_MIN_LENGTH ? str : null;
};

export const validateUsername = (username) => {
  const trimmed = String(username || "").trim();
  return trimmed.length >= 2 && trimmed.length <= 50 ? trimmed : null;
};

export const getPasswordStrength = (password) => {
  const score = {
    length: (password?.length || 0) >= 8 ? 1 : 0,
    uppercase: /[A-Z]/.test(password || "") ? 1 : 0,
    lowercase: /[a-z]/.test(password || "") ? 1 : 0,
    number: /[0-9]/.test(password || "") ? 1 : 0,
    special: /[!@#$%^&*]/.test(password || "") ? 1 : 0
  };

  const total = Object.values(score).reduce((a, b) => a + b, 0);
  
  if (total <= 1) return { level: "weak", color: "red" };
  if (total <= 2) return { level: "fair", color: "orange" };
  if (total <= 3) return { level: "good", color: "yellow" };
  if (total <= 4) return { level: "strong", color: "green" };
  return { level: "very-strong", color: "emerald" };
};

export const getPasswordError = (password) => {
  if (!password) return "Password is required";
  if (password.length < VALIDATION_PATTERNS.PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${VALIDATION_PATTERNS.PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
};

export const getEmailError = (email) => {
  if (!email) return "Email is required";
  if (!validateEmail(email)) return "Invalid email format";
  return null;
};

export const getUsernameError = (username) => {
  if (!username) return "Username is required";
  if (username.length < 2) return "Username must be at least 2 characters";
  if (username.length > 50) return "Username must be less than 50 characters";
  return null;
};
