export const SITE_VARIANT: string = (() => {
  if (typeof window === 'undefined') {
    const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : { VITE_VARIANT: process.env.VITE_VARIANT };
    return env?.VITE_VARIANT || 'full';
  }

  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  if (isTauri) {
    const stored = localStorage.getItem('worldmonitor-variant');
    if (stored === 'tech' || stored === 'full' || stored === 'finance' || stored === 'happy' || stored === 'commodity') return stored;
    return import.meta.env.VITE_VARIANT || 'full';
  }

  const h = location.hostname;
  if (h.startsWith('tech.')) return 'tech';
  if (h.startsWith('finance.')) return 'finance';
  if (h.startsWith('happy.')) return 'happy';
  if (h.startsWith('commodity.')) return 'commodity';

  if (h === 'localhost' || h === '127.0.0.1') {
    const stored = localStorage.getItem('worldmonitor-variant');
    if (stored === 'tech' || stored === 'full' || stored === 'finance' || stored === 'happy' || stored === 'commodity') return stored;
    return import.meta.env.VITE_VARIANT || 'full';
  }

  return 'full';
})();
