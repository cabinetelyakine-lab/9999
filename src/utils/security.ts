/**
 * Security utilities and Supervisor (مشرف) permissions
 */
export const SUPERVISOR_CODE_PRIMARY = 'mohamed 44000';
export const SUPERVISOR_STORAGE_KEY = 'elections_app_is_supervisor_v2';
export const SECURITY_PIN = '123258';

/**
 * Checks if the input query matches the supervisor passcode
 * Supports: 'mohamed 44000', 'Mohamed 44000', 'mohamed44000', 'Mohamed44000', 'محمد 44000'
 */
export function isSupervisorCode(query: string): boolean {
  if (!query) return false;
  const raw = query.trim().toLowerCase();
  
  // Normalized without multiple spaces
  const normalizedSpaces = raw.replace(/\s+/g, ' ');
  // Normalized without any spaces
  const noSpaces = raw.replace(/\s+/g, '');

  if (normalizedSpaces === 'mohamed 44000' || noSpaces === 'mohamed44000') {
    return true;
  }

  // Also support common Arabic typing
  if (normalizedSpaces === 'محمد 44000' || noSpaces === 'محمد44000') {
    return true;
  }

  return false;
}

/**
 * Check if the user is currently authenticated as a supervisor
 */
export function getSupervisorStatus(): boolean {
  try {
    return localStorage.getItem(SUPERVISOR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Update the supervisor authentication state in storage
 */
export function setSupervisorStatus(status: boolean): void {
  try {
    if (status) {
      localStorage.setItem(SUPERVISOR_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(SUPERVISOR_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function verifySecurityPin(inputPin: string): boolean {
  if (!inputPin) return false;
  return inputPin.trim() === SECURITY_PIN;
}
