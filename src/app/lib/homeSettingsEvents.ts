import {
  normalizeHomeSettings,
  type HomeSettings,
} from './homeContent';

export const HOME_SETTINGS_UPDATED_EVENT = 'mooncci:home-settings-updated';
export const HOME_SETTINGS_UPDATED_STORAGE_KEY = 'mooncci-home-settings-updated-at';
export const HOME_SETTINGS_BROADCAST_CHANNEL = 'mooncci-home-settings';
export const HOME_SETTINGS_CACHE_KEY = 'mooncci-home-settings-cache-v1';

type HomeSettingsUpdatedDetail = {
  updatedAt: string;
  settings?: HomeSettings;
};

export function readCachedHomeSettings(): HomeSettings | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(HOME_SETTINGS_CACHE_KEY);
    if (!raw) return null;
    return normalizeHomeSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function cacheHomeSettings(settings: unknown): HomeSettings | null {
  if (typeof window === 'undefined') return null;

  try {
    const normalized = normalizeHomeSettings(settings);
    window.localStorage.setItem(HOME_SETTINGS_CACHE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function notifyHomeSettingsUpdated(settings?: unknown) {
  const updatedAt = new Date().toISOString();
  const normalizedSettings = settings ? cacheHomeSettings(settings) || undefined : undefined;
  const detail: HomeSettingsUpdatedDetail = { updatedAt, settings: normalizedSettings };

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent<HomeSettingsUpdatedDetail>(HOME_SETTINGS_UPDATED_EVENT, { detail }));

  try {
    window.localStorage.setItem(HOME_SETTINGS_UPDATED_STORAGE_KEY, updatedAt);
  } catch {
    // localStorage may be unavailable in private / strict mode.
  }

  try {
    const channel = new BroadcastChannel(HOME_SETTINGS_BROADCAST_CHANNEL);
    channel.postMessage({ type: 'updated', updatedAt, settings: normalizedSettings });
    channel.close();
  } catch {
    // BroadcastChannel is optional; localStorage + custom event still work.
  }
}
