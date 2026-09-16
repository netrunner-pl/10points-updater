export interface ExtractedRow {
  id: string;
  selected: boolean;
  timestamp: string;
  brand: string;
  model: string;
  points: number;
  column5?: number | string;
  rawSymbol: string;
  rawDescription: string;
  originalRowIndex: number;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SpreadsheetSheet {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface UpdateLog {
  id: string;
  timestamp: string;
  spreadsheetName: string;
  sheetTitle: string;
  rowsCount: number;
  totalPoints: number;
  brands: Record<string, number>;
  status: 'success' | 'error';
  errorMessage?: string;
}

export type AllowedBrand = 'TCL' | 'HISENSE' | 'SAMSUNG' | 'LG' | 'PHILIPS' | 'SONY' | 'SHARP';

export const ALLOWED_BRANDS: AllowedBrand[] = [
  'TCL',
  'HISENSE',
  'SAMSUNG',
  'LG',
  'PHILIPS',
  'SONY',
  'SHARP',
];
