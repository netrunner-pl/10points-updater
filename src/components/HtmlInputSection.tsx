import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { SAMPLE_HTML_REPORT } from '../data/sampleHtml';
import {
  Upload,
  FileCode2,
  Sparkles,
  ClipboardCheck,
  Info,
  Lock,
  RotateCw,
} from 'lucide-react';

interface HtmlInputSectionProps {
  onHtmlParsed: (html: string) => void;
  isLoading: boolean;
  totalParsedRows: number;
  isLocked?: boolean;
}

export function HtmlInputSection({
  onHtmlParsed,
  isLoading,
  totalParsedRows,
  isLocked = false,
}: HtmlInputSectionProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedHtml, setPastedHtml] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (isLocked) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onHtmlParsed(content);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (isLocked || !pastedHtml.trim()) return;
    setFileName('Wklejony kod HTML');
    onHtmlParsed(pastedHtml);
  };

  const handleLoadSample = () => {
    if (isLocked) return;
    setFileName('Przykładowy raport (Kartoteka magazynowa)');
    setPastedHtml(SAMPLE_HTML_REPORT);
    onHtmlParsed(SAMPLE_HTML_REPORT);
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition ${
      isLocked ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80'
    }`}>
      {/* Tab Switcher & Rules Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
            isLocked ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isLocked ? <Lock className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>Wczytanie tabeli HTML (Kartoteka magazynowa)</span>
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Zablokowane po zapisie
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {isLocked
                ? 'Dane zostały już wysłane do arkusza. Aby wgrać nowy plik, przeładuj stronę.'
                : 'Wgraj plik z raportem lub wklej bezpośredni kod źródłowy tabelki'}
            </p>
          </div>
        </div>

        {/* Action button to load sample / Reload button when locked */}
        <div className="flex items-center space-x-2">
          {isLocked ? (
            <button
              id="btn-reload-app"
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-100 hover:bg-amber-200 text-xs font-semibold text-amber-900 transition cursor-pointer shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-800" />
              <span>Przeładuj aplikację</span>
            </button>
          ) : (
            <button
              id="btn-load-sample-html"
              type="button"
              onClick={handleLoadSample}
              disabled={isLoading || isLocked}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Załaduj przykładowy plik z załącznika</span>
            </button>
          )}
        </div>
      </div>

      {/* Rules Notice Pill Bar */}
      <div className="bg-slate-100/70 border-b border-slate-200/70 px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Zasady ekstrakcji:
        </span>
        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
          <strong className="text-slate-700">Marki:</strong> TCL, HISENSE, SAMSUNG, LG, PHILIPS, SONY, SHARP
        </span>
        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
          <strong className="text-slate-700">Model:</strong> Kolumna 1 od 5. znaku
        </span>
        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
          <strong className="text-slate-700">Punkty:</strong> Kolumna 4 (Punkty)
        </span>
      </div>

      {/* Body tabs */}
      <div className="p-6">
        {isLocked ? (
          <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center text-amber-800">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">
                Wgrywanie zostało zablokowane
              </h3>
              <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                Pozycje z bieżącego raportu zostały pomyślnie dopisane do arkusza Google. Aby zapobiec przypadkowemu zdublowaniu danych, wgranie nowego pliku wymaga przeładowania aplikacji.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Przeładuj aplikację, aby wgrać nowy plik</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex space-x-2 mb-4 border-b border-slate-200 pb-2">
              <button
                id="tab-upload"
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'upload'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Przeciągnij lub wybierz plik (.html)
              </button>
              <button
                id="tab-paste"
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'paste'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Wklej kod HTML
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs mx-auto flex items-center justify-center text-slate-600 mb-3">
                  <Upload className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  {fileName ? `Załadowano: ${fileName}` : 'Przeciągnij plik HTML lub kliknij, aby wybrać'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Obsługiwane formaty: .html, .htm lub pliki tekstowe zawierające tabelę &lt;table&gt;
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  id="textarea-pasted-html"
                  value={pastedHtml}
                  onChange={(e) => setPastedHtml(e.target.value)}
                  placeholder="Wklej tutaj kod źródłowy tabelki HTML (np. <table><tr>...</tr></table>)..."
                  rows={7}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
                />
                <div className="flex justify-end">
                  <button
                    id="btn-process-pasted-html"
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pastedHtml.trim() || isLoading}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Przetwórz i wyodrębnij dane</span>
                  </button>
                </div>
              </div>
            )}

            {/* Summary note after extraction */}
            {totalParsedRows > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center space-x-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Pomyślnie wyodrębniono <strong>{totalParsedRows}</strong> pozycji spełniających kryteria marek!
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Przejdź do weryfikacji poniżej &darr;
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
