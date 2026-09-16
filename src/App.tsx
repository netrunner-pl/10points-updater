import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HtmlInputSection } from './components/HtmlInputSection';
import { DataPreviewTable } from './components/DataPreviewTable';
import { ConfirmationModal } from './components/ConfirmationModal';
import { HistorySection } from './components/HistorySection';
import { parseHtmlTable, formatTimestamp, getExcelSerialDate } from './utils/htmlParser';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_WEBHOOK_URL,
  appendRowsViaAppsScript,
} from './services/googleSheets';
import type { ExtractedRow, UpdateLog } from './types';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const targetSpreadsheetTitle = 'euro-incentive';
  const targetSheetTab = 'Arkusz1';

  // Extracted Data State
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [, setParseStats] = useState<{
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
    setIsConfirmModalOpen(true);
  };

  // Execute Append to Google Sheets after confirmation
  const handleExecuteAppend = async () => {
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

      // Direct write via pre-configured Google Apps Script Webhook
      await appendRowsViaAppsScript(
        DEFAULT_WEBHOOK_URL,
        valuesToAppend,
        targetSheetTab
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
        spreadsheetName: targetSpreadsheetTitle,
        sheetTitle: targetSheetTab,
        rowsCount: selectedRows.length,
        totalPoints,
        brands: brandCounts,
        status: 'success',
      };

      setLogs((prev) => [newLog, ...prev]);
      setSubmissionSuccess({
        count: selectedRows.length,
        spreadsheetTitle: targetSpreadsheetTitle,
        sheetTab: targetSheetTab,
        timestamp: newLog.timestamp,
      });

      setIsConfirmModalOpen(false);
    } catch (err: any) {
      console.error('Błąd dopisywania do arkusza:', err);
      setSubmissionError(err.message || 'Wystąpił błąd podczas zapisu do Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Minimalist Top Navigation */}
      <Navbar />

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Banner */}
        {submissionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Błąd operacji</p>
              <p className="text-xs">{submissionError}</p>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {submissionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-900">
                  Dopisano {submissionSuccess.count} {submissionSuccess.count === 1 ? 'wiersz' : 'wierszy'} do arkusza
                </span>
                <span className="text-emerald-700 ml-2">
                  ({submissionSuccess.timestamp})
                </span>
              </div>
            </div>

            <a
              href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-medium underline shrink-0"
            >
              <span>Otwórz arkusz</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* HTML Input Section */}
        <HtmlInputSection
          onHtmlParsed={handleHtmlParsed}
          isLoading={isParsing}
          totalParsedRows={rows.length}
        />

        {/* Verification, Editing & Confirmation Table */}
        {rows.length > 0 && (
          <DataPreviewTable
            rows={rows}
            onToggleRow={handleToggleRow}
            onToggleAll={handleToggleAll}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
            onAddNewRow={handleAddNewRow}
            onRequestConfirm={handleOpenConfirm}
            targetSpreadsheetName={targetSpreadsheetTitle}
            targetSheetTab={targetSheetTab}
            isReadyToSubmit={true}
          />
        )}

        {/* History of Appended Batches */}
        {logs.length > 0 && (
          <HistorySection
            logs={logs}
            spreadsheetId={DEFAULT_SPREADSHEET_ID}
          />
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteAppend}
        isSubmitting={isSubmitting}
        rows={rows.filter((r) => r.selected)}
        spreadsheetName={targetSpreadsheetTitle}
        sheetTab={targetSheetTab}
      />
    </div>
  );
}
