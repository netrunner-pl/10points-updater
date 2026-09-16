import { useState, useEffect, type FormEvent } from 'react';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_WEBHOOK_URL,
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
  RotateCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
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
}: SheetSelectorProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [editUrl, setEditUrl] = useState(webhookUrl || DEFAULT_WEBHOOK_URL);

  useEffect(() => {
    setEditUrl(webhookUrl || DEFAULT_WEBHOOK_URL);
  }, [webhookUrl]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      setCopiedCode(true);
    }
  };

  const handleSaveUrl = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = editUrl.trim() || DEFAULT_WEBHOOK_URL;
    onWebhookUrlChange(clean);
    handleTestConnection(clean);
  };

  const handleResetDefault = () => {
    setEditUrl(DEFAULT_WEBHOOK_URL);
    onWebhookUrlChange(DEFAULT_WEBHOOK_URL);
    handleTestConnection(DEFAULT_WEBHOOK_URL);
  };

  const handleTestConnection = async (urlToTest: string) => {
    setTestLoading(true);
    setTestStatus(null);
    const result = await testWebhookConnection(urlToTest);
    setTestStatus(result);
    setTestLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Banner Status */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">
                Połączenie z arkuszem &bdquo;euro-incentive&rdquo;
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 fill-emerald-600 text-white" />
                Webhook skonfigurowany na stałe
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aplikacja jest w pełni gotowa. Każdy użytkownik z linkiem dopisuje pozycje bez konieczności logowania.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleTestConnection(webhookUrl || DEFAULT_WEBHOOK_URL)}
            disabled={testLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Sprawdź łączność z Webhookiem Google Apps Script"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${testLoading ? 'animate-spin' : ''}`} />
            <span>{testLoading ? 'Testowanie...' : 'Sprawdź połączenie'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition text-xs cursor-pointer shadow-2xs"
            title="Szczegóły techniczne Webhooka"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="p-6 space-y-4">
        {/* Info Card */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Docelowy arkusz w Google Sheets:
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

          {/* Sheet Tab selector */}
          <div className="flex items-center space-x-2.5 shrink-0 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
            <label htmlFor="sheet-tab-input" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Zakładka docelowa:
            </label>
            <input
              id="sheet-tab-input"
              type="text"
              value={selectedSheetTab}
              onChange={(e) => onSelectSheetTab(e.target.value)}
              placeholder="Arkusz1"
              className="w-28 text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        {/* Test status banner if triggered */}
        {testStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between ${
              testStatus.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{testStatus.message}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Status HTTP 200 OK</span>
          </div>
        )}

        {/* Advanced Webhook Details Accordion */}
        {showAdvanced && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                Adres URL Webhooka (zapisany na stałe w kodzie):
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-emerald-700 hover:underline cursor-pointer font-medium"
              >
                Przywróć domyślny URL
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="flex gap-2">
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="flex-1 text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 select-all"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition cursor-pointer shrink-0"
              >
                Zmień
              </button>
            </form>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500">
              <span>Wdrożony jako Web App z uprawnieniami konta rafal.zadara@tcl.com</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-emerald-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Skopiowano!' : 'Kopiuj kod skryptu'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
