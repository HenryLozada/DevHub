const SECURITY_KEY = "ph_devhub_password_security";

export interface PasswordSecurity {
  enabled: boolean;
  pin?: string;
  recoveryCode?: string;
}

export function getPasswordSecurity(): PasswordSecurity {
  try {
    return JSON.parse(localStorage.getItem(SECURITY_KEY) || "null") || { enabled: false };
  } catch {
    return { enabled: false };
  }
}

export function savePasswordSecurity(security: PasswordSecurity): void {
  localStorage.setItem(SECURITY_KEY, JSON.stringify(security));
  window.dispatchEvent(new Event("ph:password-security-update"));
}

export function createRecoveryCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
