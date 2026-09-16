import { useState, useEffect, type FormEvent } from 'react';
import {
  DEFAULT_SPREADSHEET_ID,
  RECOMMENDED_APPS_SCRIPT_CODE,
  testWebhookConnection,
} from '../services/googleSheets';

import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Link2,
  Copy,
  Check,
  Zap,
  Globe,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCw,
} from 'lucide-react';

interface SheetSelectorProps {
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  selectedSheetTab: string;
  onSelectSheetTab: (tab: string) => void;
  hasToken?: boolean;
}

export function SheetSelector({
  webhookUrl,
  onWebhookUrlChange,
  selectedSheetTab,
  onSelectSheetTab,
  hasToken,
}: SheetSelectorProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!webhookUrl);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [editUrl, setEditUrl] = useState(webhookUrl);

  useEffect(() => {
    setEditUrl(webhookUrl);
  }, [webhookUrl]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // Fallback
      setCopiedCode(true);
    }
  };

  const handleSaveUrl = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = editUrl.trim();
    onWebhookUrlChange(clean);
    if (clean) {
      handleTestConnection(clean);
    }
  };

  const handleTestConnection = async (urlToTest: string) => {
    setTestLoading(true);
    setTestStatus(null);
    const result = await testWebhookConnection(urlToTest);
    setTestStatus(result);
    setTestLoading(false);
  };

  const isConfigured = Boolean(webhookUrl && webhookUrl.trim().length > 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Połączenie z arkuszem &bdquo;euro-incentive&rdquo;
              </h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  isConfigured
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isConfigured ? (
                  <>
                    <Zap className="w-3 h-3 mr-1 text-emerald-600 fill-emerald-600" />
                    Tryb bez logowania (Aktywny)
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 mr-1 text-amber-600" />
                    Wymaga jednorazowej konfiguracji Webhooka
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Każdy użytkownik z linkiem może dopisywać pozycje bezpośrednio do Twojego arkusza bez konieczności logowania
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{showInstructions ? 'Zwiń instrukcję' : 'Instrukcja 1-minutowa'}</span>
            {showInstructions ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 space-y-5">
        {/* Active Target Info Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Docelowy plik w Google Sheets:
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm">
                euro-incentive
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-medium ml-2"
              >
                Otwórz plik w Google Sheets
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <div className="text-[11px] font-mono text-slate-500 select-all">
              ID: {DEFAULT_SPREADSHEET_ID}
            </div>
          </div>

          {/* Sheet tab selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="sheet-tab-input" className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Zakładka docelowa:
            </label>
            <input
              id="sheet-tab-input"
              type="text"
              value={selectedSheetTab}
              onChange={(e) => onSelectSheetTab(e.target.value)}
              placeholder="Arkusz1"
              className="w-32 text-xs font-medium px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Webhook Configuration Input */}
        <div className="space-y-2">
          <label htmlFor="webhook-url-input" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              Adres URL aplikacji internetowej Google Apps Script (Webhook):
            </span>
            {isConfigured && (
              <span className="text-emerald-700 font-normal flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Zapisany w przeglądarce
              </span>
            )}
          </label>

          <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
            <input
              id="webhook-url-input"
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                Zapisz URL
              </button>
              {editUrl && (
                <button
                  type="button"
                  onClick={() => handleTestConnection(editUrl)}
                  disabled={testLoading}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Sprawdź czy skrypt odpowiada"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                  <span>{testLoading ? 'Testowanie...' : 'Testuj'}</span>
                </button>
              )}
            </div>
          </form>

          {/* Test Status Feedback */}
          {testStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>

        {/* 1-Minute Setup Guide & Copy-Paste Script */}
        {showInstructions && (
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 space-y-4 shadow-sm border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  !
                </span>
                <h3 className="font-semibold text-sm text-white">
                  Jak uruchomić dopisywanie bez logowania (1 minuta w Google Sheets):
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Skopiowano kod!' : 'Kopiuj kod skryptu'}</span>
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Otwórz swój arkusz w Google:{' '}
                <a
                  href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline font-medium"
                >
                  euro-incentive
                </a>
              </li>
              <li>
                W menu u góry kliknij: <strong className="text-white">Rozszerzenia &rarr; Apps Script</strong>.
              </li>
              <li>
                Skasuj domyślną treść, kliknij powyższy przycisk <strong className="text-emerald-300">&bdquo;Kopiuj kod skryptu&rdquo;</strong> i wklej w edytorze.
              </li>
              <li>
                W prawym górnym rogu kliknij <strong className="text-white">Wdróż (Deploy) &rarr; Nowe wdrożenie (New deployment)</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-400">
                  <li>Wybierz typ (ikona koła zębatego): <span className="text-slate-200">Aplikacja internetowa (Web app)</span></li>
                  <li>Wykonaj jako (Execute as): <span className="text-slate-200">Ja (rafal.zadara@tcl.com)</span></li>
                  <li>Kto ma dostęp (Who has access): <strong className="text-emerald-400">Każdy (Anyone)</strong></li>
                </ul>
              </li>
              <li>
                Kliknij <strong className="text-white">Wdróż</strong>, zezwól na uprawnienia i skopiuj wygenerowany <strong className="text-white">Adres URL aplikacji internetowej</strong> (kończy się na <code className="text-emerald-300">/exec</code>).
              </li>
              <li>
                Wklej ten adres w powyższe pole w tej aplikacji i kliknij <strong className="text-white">Zapisz URL</strong>. Gotowe!
              </li>
            </ol>

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400">
                🔒 <strong>Dlaczego to idealne rozwiązanie?</strong> Skrypt działa wewnątrz Twojego arkusza jako Twój użytkownik. Żaden użytkownik aplikacji nie musi się logować, ani posiadać konta Google, a dane bezpiecznie trafiają do Twojego pliku.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
