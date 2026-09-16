import { useState, useMemo } from 'react';
import type { ExtractedRow } from '../types';
import {
  CheckSquare,
  Square,
  Search,
  Filter,
  Trash2,
  Edit2,
  Plus,
  ArrowUpDown,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

interface DataPreviewTableProps {
  rows: ExtractedRow[];
  onToggleRow: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onUpdateRow: (id: string, updated: Partial<ExtractedRow>) => void;
  onDeleteRow: (id: string) => void;
  onAddNewRow: () => void;
  onRequestConfirm: () => void;
  targetSpreadsheetName: string | null;
  targetSheetTab: string;
  isReadyToSubmit?: boolean;
}

export function DataPreviewTable({
  rows,
  onToggleRow,
  onToggleAll,
  onUpdateRow,
  onDeleteRow,
  onAddNewRow,
  onRequestConfirm,
  targetSpreadsheetName,
  targetSheetTab,
  isReadyToSubmit = true,
}: DataPreviewTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Brand statistics
  const brandStats = useMemo(() => {
    const stats: Record<string, { count: number; points: number }> = {};
    rows.forEach((r) => {
      if (!stats[r.brand]) {
        stats[r.brand] = { count: 0, points: 0 };
      }
      stats[r.brand].count++;
      stats[r.brand].points += r.points;
    });
    return stats;
  }, [rows]);

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);
  const totalSelectedPoints = useMemo(
    () => selectedRows.reduce((sum, r) => sum + r.points, 0),
    [selectedRows]
  );

  // Filtered rows for table view
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesBrand =
        selectedBrandFilter === 'ALL' || r.brand.toUpperCase() === selectedBrandFilter.toUpperCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        r.model.toLowerCase().includes(query) ||
        r.brand.toLowerCase().includes(query) ||
        r.rawSymbol.toLowerCase().includes(query) ||
        r.rawDescription.toLowerCase().includes(query);
      return matchesBrand && matchesSearch;
    });
  }, [rows, selectedBrandFilter, searchQuery]);

  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((r) => r.selected);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header bar with primary action */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span>Weryfikacja i zatwierdzenie danych</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {rows.length} wyodrębnionych pozycji
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Sprawdź i zatwierdź modele przed zapisaniem do pliku &bdquo;{targetSpreadsheetName || 'euro-incentive'}&rdquo; ({targetSheetTab})
          </p>
        </div>

        {/* Big Action Button */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-add-row"
            type="button"
            onClick={onAddNewRow}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Dodaj pozycję</span>
          </button>

          <button
            id="btn-request-confirmation"
            type="button"
            onClick={onRequestConfirm}
            disabled={selectedRows.length === 0 || !isReadyToSubmit}
            title={!isReadyToSubmit ? 'Wprowadź i zapisz adres URL Webhooka powyżej' : undefined}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              Zatwierdź i dopisz ({selectedRows.length} {selectedRows.length === 1 ? 'wiersz' : 'wierszy'})
            </span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards & Brand Distribution */}
      <div className="p-6 bg-slate-50/30 border-b border-slate-100 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Do dopisania:
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-800 font-mono">
                {selectedRows.length}
              </span>
              <span className="text-xs text-slate-400">/ {rows.length} poz.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Suma punktów:
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-700 font-mono">
                {totalSelectedPoints}
              </span>
              <span className="text-xs text-slate-400">pkt</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Data dopisania:
            </span>
            <div className="mt-1 text-xs font-semibold text-slate-700 font-mono truncate">
              {rows[0]?.timestamp || 'Bieżący czas'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Docelowy arkusz:
            </span>
            <div className="mt-1 text-xs font-semibold text-slate-700 truncate" title={targetSpreadsheetName || 'euro-incentive'}>
              {targetSpreadsheetName || 'euro-incentive'}
            </div>
          </div>
        </div>

        {/* Brand Chips Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filtruj markę:
          </span>
          <button
            type="button"
            onClick={() => setSelectedBrandFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedBrandFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Wszystkie ({rows.length})
          </button>
          {(Object.entries(brandStats) as [string, { count: number; points: number }][]).map(([brand, stat]) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrandFilter(brand)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedBrandFilter.toUpperCase() === brand.toUpperCase()
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {brand} <span className="opacity-75 font-mono text-[11px]">({stat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Bulk selection bar */}
      <div className="px-6 py-3 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onToggleAll(!allFilteredSelected)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Zaznacz wszystkie widoczne ({filteredRows.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po modelu, opisie..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table of extracted data */}
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="min-w-full text-xs divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <span className="sr-only">Wybierz</span>
              </th>
              <th className="px-3 py-3 text-left">Timestamp (Kolumna 1)</th>
              <th className="px-3 py-3 text-left">Marka produktu (Kolumna 2)</th>
              <th className="px-3 py-3 text-left">Model (Kolumna 3, od 5. znaku)</th>
              <th className="px-3 py-3 text-right">Ilość punktów (Kolumna 4)</th>
              <th className="px-3 py-3 text-left hidden lg:table-cell">Oryginalny opis z magazynu</th>
              <th className="w-20 px-3 py-3 text-center">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                  Nie znaleziono wierszy spełniających kryteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isEditing = editingRowId === row.id;

                return (
                  <tr
                    key={row.id}
                    className={`transition hover:bg-slate-50/80 ${
                      row.selected ? 'bg-indigo-50/15' : 'opacity-60 bg-slate-50/30'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleRow(row.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {row.selected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* Timestamp */}
                    <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.timestamp}
                          onChange={(e) =>
                            onUpdateRow(row.id, { timestamp: e.target.value })
                          }
                          className="w-full text-xs font-mono p-1 border border-slate-300 rounded"
                        />
                      ) : (
                        row.timestamp
                      )}
                    </td>

                    {/* Marka */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.brand}
                          onChange={(e) =>
                            onUpdateRow(row.id, { brand: e.target.value })
                          }
                          className="w-28 text-xs p-1 border border-slate-300 rounded font-semibold"
                        />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {row.brand}
                        </span>
                      )}
                    </td>

                    {/* Model */}
                    <td className="px-3 py-2.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.model}
                          onChange={(e) =>
                            onUpdateRow(row.id, { model: e.target.value })
                          }
                          className="w-full text-xs font-mono p-1 border border-slate-300 rounded font-bold"
                        />
                      ) : (
                        <span>{row.model}</span>
                      )}
                      {row.rawSymbol && row.rawSymbol !== row.model && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Symbol: {row.rawSymbol}
                        </span>
                      )}
                    </td>

                    {/* Punkty */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={row.points}
                          onChange={(e) =>
                            onUpdateRow(row.id, {
                              points: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 text-right text-xs font-mono p-1 border border-slate-300 rounded font-bold"
                        />
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {row.points}
                        </span>
                      )}
                    </td>

                    {/* Original description */}
                    <td className="px-3 py-2.5 text-slate-500 truncate max-w-xs hidden lg:table-cell" title={row.rawDescription}>
                      {row.rawDescription}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingRowId(isEditing ? null : row.id)
                          }
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title={isEditing ? 'Zapisz edycję' : 'Edytuj wiersz'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Usuń z listy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Zaznaczono <strong>{selectedRows.length}</strong> z <strong>{rows.length}</strong> wierszy (Suma punktów: <strong>{totalSelectedPoints}</strong>)
        </div>
        <div className="flex items-center space-x-2">
          <span>Struktura docelowa euro-incentive: [Timestamp, Marka, Model, Punkty, Column 5]</span>
        </div>
      </div>
    </div>
  );
}
