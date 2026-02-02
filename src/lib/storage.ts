import { License, LicenseStore, GameSettings } from '@/types';

const STORAGE_KEYS = {
  LICENSES: 'trivia_licenses',
  ADMIN_PIN: 'trivia_admin_pin',
  GAME_SETTINGS: 'trivia_game_settings',
  UNLOCKED: 'trivia_unlocked',
} as const;

const DEFAULT_PIN = '1234';

// License Management
export function getLicenseStore(): LicenseStore {
  const stored = localStorage.getItem(STORAGE_KEYS.LICENSES);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return {
        licenses: data.licenses || [],
        adminPin: data.adminPin || DEFAULT_PIN,
      };
    } catch {
      return { licenses: [], adminPin: DEFAULT_PIN };
    }
  }
  return { licenses: [], adminPin: DEFAULT_PIN };
}

export function saveLicenseStore(store: LicenseStore): void {
  localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(store));
}

export function addLicense(license: Omit<License, 'createdAt' | 'usedActivations' | 'isActive'>): License {
  const store = getLicenseStore();
  const newLicense: License = {
    ...license,
    usedActivations: 0,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  store.licenses.push(newLicense);
  saveLicenseStore(store);
  return newLicense;
}

export function validateLicense(code: string): { valid: boolean; message: string } {
  const store = getLicenseStore();
  const license = store.licenses.find(l => l.code.toUpperCase() === code.toUpperCase());
  
  if (!license) {
    return { valid: false, message: 'קוד רישיון לא תקין' };
  }
  
  if (!license.isActive) {
    return { valid: false, message: 'קוד רישיון לא פעיל' };
  }
  
  if (license.usedActivations >= license.maxActivations) {
    return { valid: false, message: 'קוד הרישיון מוצה את מספר ההפעלות המותר' };
  }
  
  return { valid: true, message: 'קוד רישיון תקין' };
}

export function useLicense(code: string): boolean {
  const store = getLicenseStore();
  const licenseIndex = store.licenses.findIndex(l => l.code.toUpperCase() === code.toUpperCase());
  
  if (licenseIndex === -1) return false;
  
  const license = store.licenses[licenseIndex];
  if (license.usedActivations >= license.maxActivations || !license.isActive) {
    return false;
  }
  
  store.licenses[licenseIndex] = {
    ...license,
    usedActivations: license.usedActivations + 1,
    lastUsedAt: new Date().toISOString(),
  };
  
  saveLicenseStore(store);
  setUnlocked(true);
  return true;
}

export function deleteLicense(code: string): void {
  const store = getLicenseStore();
  store.licenses = store.licenses.filter(l => l.code !== code);
  saveLicenseStore(store);
}

export function toggleLicenseActive(code: string): void {
  const store = getLicenseStore();
  const licenseIndex = store.licenses.findIndex(l => l.code === code);
  if (licenseIndex !== -1) {
    store.licenses[licenseIndex].isActive = !store.licenses[licenseIndex].isActive;
    saveLicenseStore(store);
  }
}

// Admin PIN
export function getAdminPin(): string {
  const store = getLicenseStore();
  return store.adminPin;
}

export function setAdminPin(pin: string): void {
  const store = getLicenseStore();
  store.adminPin = pin;
  saveLicenseStore(store);
}

export function validateAdminPin(pin: string): boolean {
  return pin === getAdminPin();
}

// Unlock State
export function isUnlocked(): boolean {
  return localStorage.getItem(STORAGE_KEYS.UNLOCKED) === 'true';
}

export function setUnlocked(value: boolean): void {
  localStorage.setItem(STORAGE_KEYS.UNLOCKED, String(value));
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
}

// Game Settings
export function getGameSettings(): GameSettings {
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultSettings();
    }
  }
  return getDefaultSettings();
}

function getDefaultSettings(): GameSettings {
  return {
    defaultTimeLimit: 30,
    showPoints: true,
  };
}

export function saveGameSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings));
}

// Generate random license code
export function generateLicenseCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}