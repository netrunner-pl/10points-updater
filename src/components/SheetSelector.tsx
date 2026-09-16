import { useState, useEffect, type FormEvent } from 'react';
import {
  searchDriveSpreadsheets,
  listRecentSpreadsheets,
  getSpreadsheetDetails,
  getSheetValues,
  extractSpreadsheetId,
  createSpreadsheetWithReferenceData,
  findSpreadsheetMatchingAttachment,
} from '../services/googleSheets';
import {
  ATTACHED_SHEET_HEADERS,
  ATTACHED_SHEET_SAMPLE_ROWS,
} from '../data/attachedSheetReference';
import type { GoogleDriveFile, SpreadsheetSheet } from '../types';
import {
  FileSpreadsheet,
  Search,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  FolderOpen,
  Eye,
  EyeOff,
  Link2,
  PlusCircle,
  Sparkles,
  Check,
  FileCheck2,
} from 'lucide-react';

interface SheetSelectorProps {
  hasToken: boolean;
  selectedSpreadsheetId: string | null;
  selectedSpreadsheetTitle: string | null;
  selectedSheetTitle: string;
  onSelectSpreadsheet: (id: string, title: string) => void;
  onSelectSheetTab: (title: string) => void;
}

export function SheetSelector({
  hasToken,
  selectedSpreadsheetId,
  selectedSpreadsheetTitle,
  selectedSheetTitle,
  onSelectSpreadsheet,
  onSelectSheetTab,
}: SheetSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [availableSheets, setAvailableSheets] = useState<SpreadsheetSheet[]>([]);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('euro-incentive');
  const [customInput, setCustomInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    recentRows: string[][];
    totalRows: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Auto-search for euro-incentive when token becomes available
  useEffect(() => {
    if (hasToken && !selectedSpreadsheetId) {
      handleAutoDiscover();
    }
  }, [hasToken]);

  // When spreadsheet changes, fetch its sheet tabs
  useEffect(() => {
    if (hasToken && selectedSpreadsheetId) {
      loadSpreadsheetDetails(selectedSpreadsheetId);
    }
  }, [hasToken, selectedSpreadsheetId]);

  // Load preview data when sheet tab changes
  useEffect(() => {
    if (hasToken && selectedSpreadsheetId && selectedSheetTitle && showPreview) {
      loadSheetPreview(selectedSpreadsheetId, selectedSheetTitle);
    }
  }, [hasToken, selectedSpreadsheetId, selectedSheetTitle, showPreview]);

  const handleAutoDiscover = async () => {
    if (!hasToken) return;
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      // 1. Try smart attachment matching
      const matchResult = await findSpreadsheetMatchingAttachment();
      if (matchResult) {
        onSelectSpreadsheet(matchResult.file.id, matchResult.file.name);
        setActionSuccess(`Automatycznie połączono z plikiem: ${matchResult.file.name} (${matchResult.matchReason})`);
        return;
      }

      // 2. Try search with 'euro-incentive'
      const files = await searchDriveSpreadsheets('euro-incentive');
      setDriveFiles(files);

      if (files.length > 0) {
        onSelectSpreadsheet(files[0].id, files[0].name);
        setActionSuccess(`Połączono z plikiem "${files[0].name}"`);
      } else {
        // Fallback to recent spreadsheets
        const recent = await listRecentSpreadsheets();
        setDriveFiles(recent);
        if (recent.length > 0) {
          const match = recent.find(
            (f) =>
              f.name.toLowerCase().includes('euro') ||
              f.name.toLowerCase().includes('incentive')
          );
          if (match) {
            onSelectSpreadsheet(match.id, match.name);
            setActionSuccess(`Połączono z plikiem "${match.name}"`);
          }
        }
      }
    } catch (err: any) {
      console.warn('Auto discover note:', err);
      setError(err.message || 'Nie udało się automatycznie zlokalizować pliku na Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const loadSpreadsheetDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const details = await getSpreadsheetDetails(id);
      setAvailableSheets(details.sheets);
      if (details.sheets.length > 0) {
        const currentExists = details.sheets.some((s) => s.title === selectedSheetTitle);
        if (!currentExists || !selectedSheetTitle) {
          onSelectSheetTab(details.sheets[0].title);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Błąd ładowania zakładek arkusza.');
    } finally {
      setLoading(false);
    }
  };

  const loadSheetPreview = async (id: string, tab: string) => {
    setPreviewLoading(true);
    try {
      const data = await getSheetValues(id, tab, 5);
      setPreviewData(data);
    } catch (err: any) {
      console.error('Preview error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleManualSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasToken) return;
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const clean = extractSpreadsheetId(searchQuery);
      if (clean.length > 25 && !clean.includes(' ')) {
        const details = await getSpreadsheetDetails(clean);
        onSelectSpreadsheet(details.id, details.title);
        setActionSuccess(`Wybrano arkusz: ${details.title}`);
        setShowDrivePicker(false);
      } else {
        const files = await searchDriveSpreadsheets(searchQuery);
        setDriveFiles(files);
        if (files.length === 0) {
          setError(`Nie znaleziono arkuszy pasujących do zapytania: "${searchQuery}"`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił problem podczas wyszukiwania');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomInput = async (e: FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const cleanId = extractSpreadsheetId(customInput);
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const details = await getSpreadsheetDetails(cleanId);
      onSelectSpreadsheet(details.id, details.title);
      setActionSuccess(`Pomyślnie podłączono: ${details.title}`);
      setCustomInput('');
      setShowDrivePicker(false);
    } catch (err: any) {
      setError(err.message || 'Nieprawidłowy link lub ID arkusza Google');
    } finally {
      setLoading(false);
    }
  };

  // Helper to create the exact reference spreadsheet from attachment on user's Google Drive
  const handleCreateAttachmentSheetOnDrive = async () => {
    if (!hasToken) return;
    setIsCreatingSheet(true);
    setError(null);
    setActionSuccess(null);
    try {
      const result = await createSpreadsheetWithReferenceData(
        'euro-incentive',
        ATTACHED_SHEET_HEADERS,
        ATTACHED_SHEET_SAMPLE_ROWS
      );
      onSelectSpreadsheet(result.id, result.title);
      onSelectSheetTab('Arkusz1');
      setActionSuccess(
        `Utworzono plik "${result.title}" na Twoim Google Drive i zainicjowano ${ATTACHED_SHEET_SAMPLE_ROWS.length} wierszy z załącznika!`
      );
    } catch (err: any) {
      console.error('Błąd tworzenia arkusza:', err);
      setError(err.message || 'Nie udało się utworzyć arkusza na Google Drive');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              Docelowy arkusz Google Sheets
              {selectedSpreadsheetId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Połączono
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Plik z załącznika na Google Drive, do którego dopisywane są nowe wiersze
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center space-x-2">
          {hasToken && (
            <>
              <button
                id="btn-toggle-drive-picker"
                type="button"
                onClick={() => setShowDrivePicker(!showDrivePicker)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>{showDrivePicker ? 'Schowaj listę plików' : 'Wybierz / Wyszukaj plik'}</span>
              </button>
              <button
                id="btn-refresh-sheets"
                type="button"
                onClick={handleAutoDiscover}
                disabled={loading}
                title="Wyszukaj ponownie plik na Google Drive"
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-4">
        {/* Reference File Info Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">Wzorzec z załącznika:</span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px]">
                  euro-incentive
                </span>
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded">
                  {ATTACHED_SHEET_SAMPLE_ROWS.length} wierszy
                </span>
              </div>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Struktura kolumn: <strong>Timestamp</strong> (M/D/YYYY HH:mm:ss) &bull; <strong>Marka produktu</strong> &bull; <strong>Model</strong> &bull; <strong>Ilość punktów</strong> &bull; <strong>Column 5</strong> (data Excel)
              </p>
            </div>
          </div>

          {hasToken && (
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={handleAutoDiscover}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium transition cursor-pointer text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Wykryj ten plik na Drive</span>
              </button>
              <button
                type="button"
                onClick={handleCreateAttachmentSheetOnDrive}
                disabled={isCreatingSheet || loading}
                title="Tworzy nowy arkusz 'euro-incentive' z 237 wierszami z załącznika na Twoim Google Drive"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isCreatingSheet ? 'Tworzenie...' : 'Utwórz na Drive'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {!hasToken ? (
          <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">
              Wymagane logowanie do konta Google
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Zaloguj się powyżej, aby aplikacja mogła odnaleźć plik &bdquo;euro-incentive&rdquo; na Twoim Google Drive i zapisać do niego dane.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active file status card */}
            {selectedSpreadsheetId ? (
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      Podłączony plik docelowy:
                    </span>
                    <span className="font-semibold text-slate-900 text-base">
                      {selectedSpreadsheetTitle || 'euro-incentive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">
                      ID: {selectedSpreadsheetId.slice(0, 18)}...
                    </span>
                    <span>&bull;</span>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                    >
                      Otwórz arkusz w Google Sheets
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>

                {/* Tab selector */}
                <div className="flex items-center space-x-3 self-start md:self-auto">
                  <label htmlFor="sheet-tab-select" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                    Zakładka:
                  </label>
                  <div className="relative">
                    <select
                      id="sheet-tab-select"
                      value={selectedSheetTitle}
                      onChange={(e) => onSelectSheetTab(e.target.value)}
                      className="appearance-none bg-white border border-slate-300 text-slate-800 text-xs rounded-lg pl-3 pr-8 py-2 font-medium shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {availableSheets.map((s) => (
                        <option key={s.sheetId} value={s.title}>
                          {s.title} {s.rowCount ? `(${s.rowCount} wierszy)` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    id="btn-toggle-preview"
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 transition cursor-pointer"
                    title="Podgląd ostatnich wierszy w arkuszu"
                  >
                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPreview ? 'Ukryj podgląd' : 'Podgląd'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">Plik &bdquo;euro-incentive&rdquo; nie został jeszcze wybrany</p>
                  <p>
                    Kliknij <strong>„Wykryj ten plik na Drive”</strong> lub wklej bezpośredni link do arkusza poniżej.
                  </p>
                </div>
              </div>
            )}

            {/* Collapsible preview of existing sheet rows */}
            {showPreview && selectedSpreadsheetId && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Ostatnie wiersze z zakładki &bdquo;{selectedSheetTitle}&rdquo;:
                  </span>
                  {previewLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>

                {previewData && previewData.headers.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                    <table className="min-w-full text-[11px] divide-y divide-slate-200">
                      <thead className="bg-slate-100">
                        <tr>
                          {previewData.headers.map((h, i) => (
                            <th key={i} className="px-3 py-1.5 text-left font-semibold text-slate-700">
                              {h || `Kol. ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                        {previewData.recentRows.slice(-3).map((r, ri) => (
                          <tr key={ri} className="hover:bg-slate-50">
                            {previewData.headers.map((_, ci) => (
                              <td key={ci} className="px-3 py-1 truncate max-w-[200px]">
                                {r[ci] !== undefined ? String(r[ci]) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {previewLoading ? 'Wczytywanie podglądu...' : 'Brak danych do wyświetlenia lub arkusz jest pusty.'}
                  </p>
                )}
              </div>
            )}

            {/* Drive Picker & Manual Search */}
            {showDrivePicker && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Search by query */}
                  <form onSubmit={handleManualSearch} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Szukaj po nazwie na Google Drive:
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="np. euro-incentive"
                          className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        Szukaj
                      </button>
                    </div>
                  </form>

                  {/* Direct URL or ID */}
                  <form onSubmit={handleApplyCustomInput} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Albo wklej link do arkusza Google:
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !customInput.trim()}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 cursor-pointer"
                      >
                        Połącz
                      </button>
                    </div>
                  </form>
                </div>

                {/* Drive files list */}
                {driveFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Arkusze na Twoim Google Drive:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => {
                            onSelectSpreadsheet(file.id, file.name);
                            setActionSuccess(`Wybrano arkusz: ${file.name}`);
                            setShowDrivePicker(false);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            selectedSpreadsheetId === file.id
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
