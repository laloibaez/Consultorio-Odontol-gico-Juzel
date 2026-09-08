import { useEffect } from 'react';
import { api } from '../../shared/services/api';
export function useInactivityTimer(token: string, logout: (reason?: string) => void) {
  useEffect(() => {
    if (!token) return;
    let lastRefresh = Date.now(),
      refreshing = false;
    const expire = () => logout('Tu sesión expiró por inactividad');
    const activity = () => {
      const last = Number(localStorage.getItem('juzel-activity') || 0);
      if (Date.now() - last >= 15 * 60000) {
        expire();
        return;
      }
      localStorage.setItem('juzel-activity', String(Date.now()));
    };
    const sync = (e: StorageEvent) => {
      if (e.key === 'juzel-token' && !e.newValue) logout();
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, activity, {
      passive: true
    }));
    window.addEventListener('session-expired', expire);
    window.addEventListener('storage', sync);
    const t = setInterval(async () => {
      const last = Number(localStorage.getItem('juzel-activity') || 0);
      if (Date.now() - last >= 15 * 60000) {
        expire();
        return;
      }
      if (!refreshing && Date.now() - last < 60000 && Date.now() - lastRefresh > 60000) {
        refreshing = true;
        try {
          const r = await api.post('/auth/refresh');
          localStorage.setItem('juzel-token', r.data.data.token);
          lastRefresh = Date.now();
        } catch {} finally {
          refreshing = false;
        }
      }
    }, 10000);
    return () => {
      clearInterval(t);
      events.forEach(e => window.removeEventListener(e, activity));
      window.removeEventListener('session-expired', expire);
      window.removeEventListener('storage', sync);
    };
  }, [token, logout]);
}
