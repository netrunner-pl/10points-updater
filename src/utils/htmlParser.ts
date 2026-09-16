import { ALLOWED_BRANDS, type ExtractedRow } from '../types';

/**
 * Format date to M/D/YYYY HH:mm:ss matching the euro-incentive file convention
 * e.g., 6/13/2026 18:48:00
 */
export function formatTimestamp(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Calculate Excel/Google Sheets serial date number (e.g., 46186)
 */
export function getExcelSerialDate(date: Date = new Date()): number {
  const epoch = new Date(1899, 11, 30).getTime();
  const diffDays = Math.floor((date.getTime() - epoch) / (24 * 60 * 60 * 1000));
  return diffDays;
}

/**
 * Canonical brand display name
 */
export function getCanonicalBrand(matchedBrand: string): string {
  const upper = matchedBrand.toUpperCase();
  if (upper === 'TCL') return 'TCL';
  if (upper === 'LG') return 'LG';
  if (upper === 'SAMSUNG' || upper === 'SAMS') return 'Samsung';
  if (upper === 'HISENSE' || upper === 'HISN') return 'Hisense';
  if (upper === 'SHARP' || upper === 'SHA1' || upper === 'SHAR') return 'Sharp';
  if (upper === 'PHILIPS' || upper === 'PHIL') return 'Philips';
  if (upper === 'SONY') return 'Sony';
  return upper;
}

/**
 * Brand abbreviation map used in Polish warehouse system (RT column)
 */
const WAREHOUSE_RT_MAP: Record<string, string> = {
  SAMS: 'Samsung',
  HISN: 'Hisense',
  SHA1: 'Sharp',
  SHAR: 'Sharp',
  PHIL: 'Philips',
  SONY: 'Sony',
  TCL: 'TCL',
  LG: 'LG',
};

/**
 * Parses raw HTML string and extracts rows according to the specified rules:
 * - Filter only rows containing target brands: TCL, HISENSE, SAMSUNG, LG, PHILIPS, SONY, SHARP
 * - Model: Column 1 from character 5 to end (0-based slice(4))
 * - Points: Column 4 (or header 'Punkty')
 * - Timestamp: current date and time
 */
export function parseHtmlTable(htmlContent: string): {
  rows: ExtractedRow[];
  totalTableRows: number;
  skippedRows: number;
  detectedHeaders: string[];
} {
  if (!htmlContent || !htmlContent.trim()) {
    return { rows: [], totalTableRows: 0, skippedRows: 0, detectedHeaders: [] };
  }

  // Create DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Find all tables, prefer the one with most rows or with <th>
  const tables = Array.from(doc.querySelectorAll('table'));
  if (tables.length === 0) {
    return { rows: [], totalTableRows: 0, skippedRows: 0, detectedHeaders: [] };
  }

  // Sort tables by number of rows descending
  tables.sort((a, b) => b.querySelectorAll('tr').length - a.querySelectorAll('tr').length);
  const targetTable = tables[0];

  const allTrs = Array.from(targetTable.querySelectorAll('tr'));
  const detectedHeaders: string[] = [];

  // Look for header row
  let headerRowIndex = -1;
  let symbolColIndex = 0;
  let descColIndex = 1;
  let pointsColIndex = 3; // Column 4 in 1-based index

  for (let i = 0; i < allTrs.length; i++) {
    const ths = Array.from(allTrs[i].querySelectorAll('th'));
    if (ths.length > 0) {
      headerRowIndex = i;
      ths.forEach((th, colIdx) => {
        const text = (th.textContent || '').replace(/\u00a0/g, ' ').trim();
        detectedHeaders.push(text);
        const lower = text.toLowerCase();
        if (lower.includes('symbol')) {
          symbolColIndex = colIdx;
        } else if (lower.includes('opis')) {
          descColIndex = colIdx;
        } else if (lower.includes('punkt')) {
          pointsColIndex = colIdx;
        }
      });
      break;
    }
  }

  const extracted: ExtractedRow[] = [];
  let skippedCount = 0;
  let dataRowCount = 0;

  const now = new Date();
  const baseTimestamp = formatTimestamp(now);
  const serialDay = getExcelSerialDate(now);

  for (let i = 0; i < allTrs.length; i++) {
    if (i === headerRowIndex) continue;

    const tr = allTrs[i];
    const tds = Array.from(tr.querySelectorAll('td'));
    if (tds.length === 0) continue;

    dataRowCount++;

    // Extract all text content from the row for brand detection
    const rowFullText = (tr.textContent || '').replace(/\u00a0/g, ' ');
    const symbolText = (tds[symbolColIndex]?.textContent || '').replace(/\u00a0/g, ' ').trim();
    const descText = (tds[descColIndex]?.textContent || '').replace(/\u00a0/g, ' ').trim();
    const lastCellText = (tds[tds.length - 1]?.textContent || '').replace(/\u00a0/g, ' ').trim();

    // Check if the row belongs to one of the target brands
    let matchedBrandName: string | null = null;

    // 1. Direct check against allowed brands in row text
    for (const brand of ALLOWED_BRANDS) {
      const regex = new RegExp(`\\b${brand}\\b`, 'i');
      if (regex.test(rowFullText) || rowFullText.toUpperCase().includes(brand)) {
        matchedBrandName = getCanonicalBrand(brand);
        break;
      }
    }

    // 2. Check RT warehouse abbreviation in the last cell or description
    if (!matchedBrandName) {
      for (const [code, brand] of Object.entries(WAREHOUSE_RT_MAP)) {
        if (lastCellText.toUpperCase() === code || rowFullText.toUpperCase().includes(code)) {
          matchedBrandName = brand;
          break;
        }
      }
    }

    // If no target brand found, skip this row
    if (!matchedBrandName) {
      skippedCount++;
      continue;
    }

    // Extract model: content of 1st column from 5th character to the end (0-based index 4)
    // E.g., prefixes like 'TV43' or 'VL24' are stripped so model begins at 5th character
    let model = '';
    if (symbolText.length >= 5) {
      model = symbolText.slice(4).trim();
    } else {
      model = symbolText;
    }

    // Extract points: from column 4 (pointsColIndex)
    let points = 0;
    const rawPointsText = (tds[pointsColIndex]?.textContent || '').replace(/\u00a0/g, '').trim();
    const parsedPoints = parseFloat(rawPointsText.replace(',', '.'));
    if (!isNaN(parsedPoints)) {
      points = parsedPoints;
    }

    extracted.push({
      id: `row-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      selected: true,
      timestamp: baseTimestamp,
      brand: matchedBrandName,
      model: model,
      points: points,
      column5: serialDay,
      rawSymbol: symbolText,
      rawDescription: descText,
      originalRowIndex: i + 1,
    });
  }

  return {
    rows: extracted,
    totalTableRows: dataRowCount,
    skippedRows: skippedCount,
    detectedHeaders,
  };
}
