import type { UpdateLog } from '../types';
import { History, ExternalLink, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface HistorySectionProps {
  logs: UpdateLog[];
  spreadsheetId: string | null;
}

export function HistorySection({ logs, spreadsheetId }: HistorySectionProps) {
  if (logs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Historia wykonanych aktualizacji (Bieżąca sesja)
            </h2>
            <p className="text-xs text-slate-500">
              Zarejestrowane operacje dopisania danych do arkusza Google Sheets
            </p>
          </div>
        </div>

        {spreadsheetId && (
          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition"
          >
            <span>Otwórz zaktualizowany arkusz</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="p-6 space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              log.status === 'success'
                ? 'bg-emerald-50/30 border-emerald-200/70 text-slate-800'
                : 'bg-red-50/50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              {log.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <span>Dopisano {log.rowsCount} wierszy do &bdquo;{log.spreadsheetName}&rdquo;</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    (zakładka: {log.sheetTitle})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {log.timestamp}
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    +{log.totalPoints} punktów
                  </span>
                  <span>&bull;</span>
                  <span>
                    Marki:{' '}
                    {Object.entries(log.brands)
                      .map(([b, c]) => `${b} (${c})`)
                      .join(', ')}
                  </span>
                </div>
                {log.errorMessage && (
                  <p className="text-red-600 mt-1 font-mono text-[11px]">
                    Błąd: {log.errorMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-auto">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                Pomyślnie dopisano
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
