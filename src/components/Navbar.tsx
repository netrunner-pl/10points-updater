import { useState } from 'react';
import type { User } from 'firebase/auth';
import { googleSignIn, logout } from '../lib/firebase';
import { FileSpreadsheet, LogOut, CheckCircle2, Loader2, AlertTriangle, ExternalLink, X } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface NavbarProps {
  user: User | null;
  hasToken: boolean;
  onAuthChange: (user: User | null, token: string | null) => void;
  targetSheetName?: string;
}

export function Navbar({ user, hasToken, onAuthChange }: NavbarProps) {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      onAuthChange(result.user, result.accessToken);
    } catch (err: any) {
      console.error(err);
      const isUnauthorizedDomain =
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('auth/unauthorized-domain');

      if (isUnauthorizedDomain) {
        setAuthError({
          code: 'auth/unauthorized-domain',
          message: `Domena "${typeof window !== 'undefined' ? window.location.hostname : 'github.io'}" nie jest dodana do autoryzowanych domen w Firebase Console.`,
        });
      } else {
        setAuthError({
          code: err.code,
          message: err.message || 'Logowanie nie powiodło się',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onAuthChange(null, null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-950/40 text-white font-bold">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-white">
                GS Form &amp; Sheet Updater
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              HTML Kartoteka &rarr; Arkusz Google &bdquo;euro-incentive&rdquo;
            </p>
          </div>
        </div>

        {/* User Account / Auth Actions */}
        <div className="flex items-center space-x-3">
          {user && hasToken ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Użytkownik'}
                    className="w-6 h-6 rounded-full ring-1 ring-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="text-xs font-medium text-slate-200 truncate max-w-[150px]">
                    {user.email}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Drive &amp; Sheets aktywne</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={handleLogout}
                title="Wyloguj się z Google"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="btn-google-login"
                onClick={handleLogin}
                disabled={loading}
                className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-lg bg-white text-slate-800 hover:bg-slate-100 font-medium text-sm transition shadow-sm hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                )}
                <span>Zaloguj się przez Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {authError && (
        <div className="bg-amber-950/80 border-b border-amber-600/40 px-4 py-3 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  {authError.code === 'auth/unauthorized-domain'
                    ? 'Wymagana autoryzacja domeny w Firebase Console (auth/unauthorized-domain)'
                    : 'Błąd logowania'}
                </p>
                <p className="text-amber-200/90 leading-relaxed">
                  {authError.code === 'auth/unauthorized-domain' ? (
                    <>
                      Firebase blokuje logowanie z nieznanych domen. Aby zezwolić na logowanie z{' '}
                      <strong className="underline text-white">
                        {typeof window !== 'undefined' ? window.location.hostname : 'netrunner-pl.github.io'}
                      </strong>
                      , dodaj tę domenę do listy autoryzowanych domen w projekcie Firebase{' '}
                      <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-amber-300">
                        {firebaseConfig.projectId}
                      </span>
                      .
                    </>
                  ) : (
                    authError.message
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
              {authError.code === 'auth/unauthorized-domain' && (
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
                >
                  <span>Otwórz ustawienia Firebase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="p-1 rounded-md text-amber-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
