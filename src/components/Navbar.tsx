import { FileSpreadsheet } from 'lucide-react';

export function Navbar() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            GS 10-points Updater
          </span>
        </div>
      </div>
    </header>
  );
}
