/**
 * Validation utility functions for OCHMS
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Ethiopian format)
 */
export function isValidPhone(phone: string): boolean {
  // Ethiopian phone format: +251XXXXXXXXX or 09XXXXXXXX
  const phoneRegex = /^(\+251|0)[9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 */
export function isRequired(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Validate payment amount (must be at least 1200 Birr)
 */
export function isValidPaymentAmount(amount: number): boolean {
  return amount >= 1200;
}

/**
 * Validate years of service
 */
export function isValidYearsOfService(years: number): boolean {
  return years >= 0 && years <= 50;
}

/**
 * Validate house number format
 */
export function isValidHouseNumber(houseNumber: string): boolean {
  // Format: A-101, B-205, etc.
  const houseRegex = /^[A-Z]-\d{3}$/;
  return houseRegex.test(houseNumber);
}
