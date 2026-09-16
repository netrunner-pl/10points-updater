import { useState } from 'react';
import type { User } from 'firebase/auth';
import { googleSignIn, logout } from '../lib/firebase';
import {
  FileSpreadsheet,
  LogOut,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  X,
  Globe,
  Zap,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { DEFAULT_SPREADSHEET_ID } from '../services/googleSheets';

interface NavbarProps {
  user: User | null;
  hasToken: boolean;
  onAuthChange: (user: User | null, token: string | null) => void;
  isWebhookConfigured?: boolean;
}

export function Navbar({ user, hasToken, onAuthChange, isWebhookConfigured }: NavbarProps) {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);
  const [showLoginOption, setShowLoginOption] = useState(false);

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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-950/40 text-white font-bold shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-white">
                GS 10-points Updater
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Arkusz euro-incentive
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-md">
              Dopisywanie pozycji HTML bez wymogu logowania do pliku 1VQP4XoYoKU2PyKV97aIp8Akg83-semTGS3HOgCBJuBo
            </p>
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center space-x-3">
          {/* Direct link to Spreadsheet */}
          <a
            href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Otwórz plik na Google Drive"
          >
            <span>Otwórz arkusz</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Mode status badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span className="text-slate-200 font-medium hidden sm:inline">Tryb dla każdego</span>
            <span className="text-[11px] text-emerald-400 font-mono">Brak logowania</span>
          </div>

          {/* Optional OAuth profile / login for admin */}
          {user && hasToken ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Użytkownik'}
                    className="w-5 h-5 rounded-full ring-1 ring-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs text-slate-300 hidden lg:inline max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>
              <button
                id="btn-logout"
                type="button"
                onClick={handleLogout}
                title="Wyloguj się"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              {showLoginOption ? (
                <div className="flex items-center space-x-2">
                  <button
                    id="btn-google-login"
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-800 hover:bg-slate-100 font-medium text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                    ) : (
                      <span>Zaloguj (opcjonalnie)</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLoginOption(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLoginOption(true)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 transition cursor-pointer"
                  title="Opcjonalne logowanie przez konto Google"
                >
                  OAuth
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-amber-950/90 border-b border-amber-600/40 px-4 py-3 text-xs text-amber-200">
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
                      Firebase blokuje logowanie z domen nieautoryzowanych. Aby logować się bezpośrednio z{' '}
                      <strong className="underline text-white">
                        {typeof window !== 'undefined' ? window.location.hostname : 'netrunner-pl.github.io'}
                      </strong>
                      , dodaj tę domenę w Firebase Console projektu{' '}
                      <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-amber-300">
                        {firebaseConfig.projectId}
                      </span>
                      . W trybie Webhook (bez logowania) ten krok nie jest potrzebny!
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
