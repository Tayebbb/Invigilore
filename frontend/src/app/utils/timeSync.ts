import api from '../api';

/**
 * Global offset in milliseconds between server time and local time.
 * Accurate Now = Local Now + offset
 */
let timeOffset = 0;
let isSynced = false;
let syncBaseLocal = 0;
let syncBaseServer = 0;

/**
 * Fetches current server time and calculates the offset.
 */
export async function syncWithServer() {
  try {
    const startTime = performance.now();
    const res = await api.get('/system/time');
    const endTime = performance.now();
    
    // Estimate network latency (round trip time / 2)
    const latency = (endTime - startTime) / 2;
    
    syncBaseServer = res.data.timestamp;
    syncBaseLocal = endTime - latency;
    
    // Legacy offset for backward compatibility
    timeOffset = syncBaseServer - Date.now();
    isSynced = true;
    
    console.log(`[TimeSync] Server time synced. Latency: ${latency.toFixed(2)}ms`);
  } catch (error) {
    console.error('[TimeSync] Failed to sync with server time:', error);
  }
}

/**
 * Returns the current standardized server time as a Date object.
 * Uses high-resolution performance clock to prevent tampering via system clock changes.
 */
export function getServerNow(): Date {
  if (!isSynced) return new Date();
  
  const elapsed = performance.now() - syncBaseLocal;
  return new Date(syncBaseServer + elapsed);
}

// Auto-resync every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    void syncWithServer();
  }, 5 * 60 * 1000);
}

/**
 * Returns whether the time has been successfully synchronized.
 */
export function isTimeSynced(): boolean {
  return isSynced;
}

/**
 * Formats a given ISO date string or Date object using the server-synced current time
 * to determine relative status (e.g., remaining time).
 */
export function getRemainingSeconds(targetDate: string | Date): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = getServerNow();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}
