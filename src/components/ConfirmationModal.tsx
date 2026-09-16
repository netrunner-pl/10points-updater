import type { ExtractedRow } from '../types';
import {
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  rows: ExtractedRow[];
  spreadsheetName: string;
  sheetTab: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  rows,
  spreadsheetName,
  sheetTab,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const totalPoints = rows.reduce((sum, r) => sum + r.points, 0);

  // Group by brand
  const brandSummary: Record<string, number> = {};
  rows.forEach((r) => {
    brandSummary[r.brand] = (brandSummary[r.brand] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Potwierdzenie zapisu do Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Wymagana autoryzacja dopisania danych
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Czy na pewno chcesz dopisać {rows.length} {rows.length === 1 ? 'rekord' : 'rekordów'} do arkusza?
              </p>
              <p className="text-amber-800/90">
                Dane zostaną dopisane na końcu pliku <strong>&bdquo;{spreadsheetName}&rdquo;</strong> w zakładce <strong>&bdquo;{sheetTab}&rdquo;</strong> na Twoim Google Drive.
              </p>
            </div>
          </div>

          {/* Details recap */}
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50 text-xs">
            <div className="px-4 py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Liczba rekordów do dodania:</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{rows.length}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Łączna suma punktów:</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">{totalPoints} pkt</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Format wiersza:</span>
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                [Timestamp, Marka, Model, Punkty, SerialDate]
              </span>
            </div>
          </div>

          {/* Brands distribution in modal */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Zestawienie marek:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(brandSummary).map(([brand, count]) => (
                <span
                  key={brand}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                >
                  <strong className="mr-1">{brand}:</strong> {count} {count === 1 ? 'szt.' : 'szt.'}
                </span>
              ))}
            </div>
          </div>

          {/* Sample rows preview */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Przykładowe pozycje:
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-2 text-[11px] font-mono">
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} className="flex justify-between text-slate-700">
                  <span className="truncate mr-2">
                    {r.brand} &bull; {r.model}
                  </span>
                  <span className="font-bold text-emerald-700 shrink-0">
                    +{r.points} pkt
                  </span>
                </div>
              ))}
              {rows.length > 5 && (
                <div className="text-center text-slate-400 text-[10px] pt-1">
                  ...oraz {rows.length - 5} innych pozycji
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            id="btn-cancel-confirm-modal"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            Anuluj
          </button>

          <button
            id="btn-execute-append-sheets"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-700/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dopisywanie do Google Sheets...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Zatwierdź i dopisz do arkusza</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
