import React, { useState, useEffect } from 'react';
import { apiFetch, getStoredToken, setStoredToken } from './api.ts';
import { type Language } from './i18n.ts';
import { PublicPortal } from './portals/PublicPortal.tsx';
import { SuperAdminPortal } from './portals/SuperAdminPortal.tsx';
import { SocietyAdminPortal } from './portals/SocietyAdminPortal.tsx';
import { MemberPortal } from './portals/MemberPortal.tsx';

interface ToastMsg {
  id: number;
  text: string;
  type: 'success' | 'error';
}

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authData, setAuthData] = useState<{
    user: any;
    society: any;
    permissions: Record<string, boolean> | null;
  } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const [initialEnrollCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('enroll');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (window.location.search.includes('enroll=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  function notify(text: string, type: 'success' | 'error' = 'success') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }

  async function loadCurrentSession() {
    const token = getStoredToken();
    if (!token) {
      setAuthData(null);
      setCheckingAuth(false);
      return;
    }
    try {
      const res = await apiFetch('/api/auth/me');
      setAuthData({
        user: res.user,
        society: res.society,
        permissions: res.permissions,
      });
      setLang('en');
    } catch {
      setStoredToken(null);
      setAuthData(null);
    } finally {
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    loadCurrentSession();
  }, []);

  function handleLogout() {
    setStoredToken(null);
    setAuthData(null);
    notify('Signed out successfully.');
  }

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 600 }}>Loading SocietyOS Multi-Tenant Platform...</div>
      </div>
    );
  }

  return (
    <>
      {!authData ? (
        <PublicPortal
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          onAuthenticated={loadCurrentSession}
          notify={notify}
          initialEnrollCode={initialEnrollCode}
        />
      ) : authData.user.role === 'SUPER_ADMIN' ? (
        <SuperAdminPortal
          user={authData.user}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
          notify={notify}
        />
      ) : authData.user.role === 'SOCIETY_ADMIN' || authData.user.role === 'STAFF' ? (
        <SocietyAdminPortal
          user={authData.user}
          society={authData.society}
          permissions={authData.permissions}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
          notify={notify}
        />
      ) : (
        <MemberPortal
          user={authData.user}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {/* Global Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </>
  );
};
