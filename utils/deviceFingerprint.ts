/**
 * Generate a device fingerprint based on browser characteristics
 * This is stored client-side and used to validate table access
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 0,
    // deviceMemory is experimental API not in TypeScript types
    (navigator as any).deviceMemory || 0,
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Get or create device fingerprint from localStorage
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem('device_fingerprint');
  if (stored) {
    return stored;
  }
  
  const fingerprint = generateDeviceFingerprint();
  localStorage.setItem('device_fingerprint', fingerprint);
  return fingerprint;
}

/**
 * Store table access with timestamp
 */
export function recordTableAccess(tableId: number): void {
  if (typeof window === 'undefined') return;
  
  const fingerprint = getDeviceFingerprint();
  const accessData = {
    tableId,
    fingerprint,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(`table_access_${tableId}`, JSON.stringify(accessData));
  
  // Also store in a general access log (for rate limiting)
  const accessLog = JSON.parse(localStorage.getItem('order_access_log') || '[]');
  accessLog.push({
    tableId,
    fingerprint,
    timestamp: Date.now(),
  });
  
  // Keep only last 10 entries
  if (accessLog.length > 10) {
    accessLog.shift();
  }
  
  localStorage.setItem('order_access_log', JSON.stringify(accessLog));
}

/**
 * Get table access data
 */
export function getTableAccess(tableId: number): { tableId: number; fingerprint: string; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(`table_access_${tableId}`);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Get the original table this device first accessed
 */
export function getOriginalTable(): number | null {
  if (typeof window === 'undefined') return null;
  
  const log = JSON.parse(localStorage.getItem('order_access_log') || '[]');
  if (log.length === 0) return null;
  
  // Return the first table accessed (oldest entry)
  const firstAccess = log[0];
  return firstAccess?.tableId || null;
}

/**
 * Check if device has accessed a table recently
 */
export function hasRecentTableAccess(tableId: number, maxAgeMinutes: number = 10): boolean {
  if (typeof window === 'undefined') return false;
  
  const access = getTableAccess(tableId);
  if (!access) return false;
  
  const maxAge = maxAgeMinutes * 60 * 1000;
  return (Date.now() - access.timestamp) < maxAge;
}

