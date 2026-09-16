import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { initAuth, getAccessToken, setCachedAccessToken } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { SheetSelector } from './components/SheetSelector';
import { HtmlInputSection } from './components/HtmlInputSection';
import { DataPreviewTable } from './components/DataPreviewTable';
import { ConfirmationModal } from './components/ConfirmationModal';
import { HistorySection } from './components/HistorySection';
import { parseHtmlTable, formatTimestamp, getExcelSerialDate } from './utils/htmlParser';
import { appendRowsToSpreadsheet } from './services/googleSheets';
import type { ExtractedRow, UpdateLog } from './types';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Target Spreadsheet State with localStorage persistence
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('target_spreadsheet_id') : null;
  });
  const [selectedSpreadsheetTitle, setSelectedSpreadsheetTitle] = useState<string | null>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('target_spreadsheet_title') : null) || 'euro-incentive';
  });
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('target_spreadsheet_tab') : null) || 'Arkusz1';
  });

  // Extracted Data State
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStats, setParseStats] = useState<{
    totalTableRows: number;
    skippedRows: number;
  } | null>(null);

  // Appending & Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    count: number;
    spreadsheetTitle: string;
    sheetTab: string;
    timestamp: string;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // History logs
  const [logs, setLogs] = useState<UpdateLog[]>([]);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setHasToken(!!token);
        setLoadingAuth(false);
      },
      () => {
        setUser(null);
        setHasToken(false);
        setLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAuthChange = (newUser: User | null, token: string | null) => {
    setUser(newUser);
    setHasToken(!!token);
    setCachedAccessToken(token);
  };

  // Parse HTML
  const handleHtmlParsed = (html: string) => {
    setIsParsing(true);
    setSubmissionSuccess(null);
    setSubmissionError(null);
    try {
      const result = parseHtmlTable(html);
      setRows(result.rows);
      setParseStats({
        totalTableRows: result.totalTableRows,
        skippedRows: result.skippedRows,
      });
    } catch (err: any) {
      console.error('Błąd parsowania HTML:', err);
      setSubmissionError('Wystąpił błąd podczas analizy tabeli HTML: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // Row operations
  const handleToggleRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleToggleAll = (selectAll: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: selectAll })));
  };

  const handleUpdateRow = (id: string, updated: Partial<ExtractedRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddNewRow = () => {
    const now = new Date();
    const newRow: ExtractedRow = {
      id: `manual-${Date.now()}`,
      selected: true,
      timestamp: formatTimestamp(now),
      brand: 'Samsung',
      model: '',
      points: 10,
      column5: getExcelSerialDate(now),
      rawSymbol: '',
      rawDescription: 'Ręcznie dodana pozycja',
      originalRowIndex: rows.length + 1,
    };
    setRows((prev) => [newRow, ...prev]);
  };

  // Trigger confirmation modal
  const handleOpenConfirm = () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;
    if (!selectedSpreadsheetId) {
      setSubmissionError('Wybierz docelowy arkusz Google przed zatwierdzeniem danych.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Execute Append to Google Sheets after confirmation
  const handleExecuteAppend = async () => {
    if (!selectedSpreadsheetId) return;
    const selectedRows = rows.filter((r) => r.selected);
    if (selectedRows.length === 0) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Build 2D values array: [Timestamp, Marka, Model, Ilość punktów, Column 5]
      const valuesToAppend: (string | number)[][] = selectedRows.map((r) => [
        r.timestamp,
        r.brand,
        r.model,
        r.points,
        r.column5 !== undefined ? r.column5 : getExcelSerialDate(),
      ]);

      await appendRowsToSpreadsheet(
        selectedSpreadsheetId,
        selectedSheetTab || 'Arkusz1',
        valuesToAppend
      );

      // Record success
      const brandCounts: Record<string, number> = {};
      selectedRows.forEach((r) => {
        brandCounts[r.brand] = (brandCounts[r.brand] || 0) + 1;
      });

      const totalPoints = selectedRows.reduce((sum, r) => sum + r.points, 0);

      const newLog: UpdateLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        spreadsheetName: selectedSpreadsheetTitle || 'euro-incentive',
        sheetTitle: selectedSheetTab,
        rowsCount: selectedRows.length,
        totalPoints,
        brands: brandCounts,
        status: 'success',
      };

      setLogs((prev) => [newLog, ...prev]);
      setSubmissionSuccess({
        count: selectedRows.length,
        spreadsheetTitle: selectedSpreadsheetTitle || 'euro-incentive',
        sheetTab: selectedSheetTab,
        timestamp: newLog.timestamp,
      });

      setIsConfirmModalOpen(false);
    } catch (err: any) {
      console.error('Błąd dopisywania do arkusza:', err);
      setSubmissionError(err.message || 'Wystąpił nieoczekiwany błąd podczas zapisu do Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        hasToken={hasToken}
        onAuthChange={handleAuthChange}
        targetSheetName={selectedSpreadsheetTitle || undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro / Instructions Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automatyczny Updater Euro-Incentive</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Konwerter tabeli HTML &rarr; Google Sheets &bdquo;euro-incentive&rdquo;
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Aplikacja filtruje pozycje marek <strong>TCL, HISENSE, SAMSUNG, LG, PHILIPS, SONY, SHARP</strong>, wyodrębnia model z kolumny 1 od 3. znaku, punkty z kolumny 4, generuje bieżący znacznik czasu i umożliwia zatwierdzenie przed bezpośrednim dopisaniem do Twojego arkusza na Google Drive.
            </p>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {submissionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start space-x-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Błąd operacji</p>
              <p className="text-xs">{submissionError}</p>
            </div>
          </div>
        )}

        {/* Success Toast / Card */}
        {submissionSuccess && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-900">
                  Pomyślnie dopisano {submissionSuccess.count} {submissionSuccess.count === 1 ? 'wiersz' : 'wierszy'} do arkusza!
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Plik: <strong>&bdquo;{submissionSuccess.spreadsheetTitle}&rdquo;</strong> &bull; Zakładka: <strong>{submissionSuccess.sheetTab}</strong> &bull; Godzina: {submissionSuccess.timestamp}
                </p>
              </div>
            </div>

            {selectedSpreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer"
              >
                <span>Otwórz arkusz w Google</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Step 1: Google Sheet Target Selector */}
        <SheetSelector
          hasToken={hasToken}
          selectedSpreadsheetId={selectedSpreadsheetId}
          selectedSpreadsheetTitle={selectedSpreadsheetTitle}
          selectedSheetTitle={selectedSheetTab}
          onSelectSpreadsheet={(id, title) => {
            setSelectedSpreadsheetId(id);
            setSelectedSpreadsheetTitle(title);
            if (typeof window !== 'undefined') {
              localStorage.setItem('target_spreadsheet_id', id);
              localStorage.setItem('target_spreadsheet_title', title);
            }
          }}
          onSelectSheetTab={(tab) => {
            setSelectedSheetTab(tab);
            if (typeof window !== 'undefined') {
              localStorage.setItem('target_spreadsheet_tab', tab);
            }
          }}
        />

        {/* Step 2: HTML Table Input & Parser */}
        <HtmlInputSection
          onHtmlParsed={handleHtmlParsed}
          isLoading={isParsing}
          totalParsedRows={rows.length}
        />

        {/* Step 3: Verification, Editing & Confirmation Table */}
        {rows.length > 0 && (
          <DataPreviewTable
            rows={rows}
            onToggleRow={handleToggleRow}
            onToggleAll={handleToggleAll}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
            onAddNewRow={handleAddNewRow}
            onRequestConfirm={handleOpenConfirm}
            targetSpreadsheetName={selectedSpreadsheetTitle}
            targetSheetTab={selectedSheetTab}
            hasToken={hasToken}
          />
        )}

        {/* Step 4: History of Appended Batches */}
        <HistorySection
          logs={logs}
          spreadsheetId={selectedSpreadsheetId}
        />
      </main>

      {/* Confirmation Modal (Required for Workspace write operations) */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteAppend}
        isSubmitting={isSubmitting}
        rows={rows.filter((r) => r.selected)}
        spreadsheetName={selectedSpreadsheetTitle || 'euro-incentive'}
        sheetTab={selectedSheetTab}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          GS Form &amp; Sheet Updater &bull; Bezpieczna integracja z Google Workspace API (Drive &amp; Sheets v4)
        </div>
      </footer>
    </div>
  );
}
