import { getAccessToken } from '../lib/firebase';
import type { GoogleDriveFile, SpreadsheetSheet } from '../types';

/**
 * Searches Google Drive for spreadsheet files matching a query (defaults to 'euro-incentive')
 */
export async function searchDriveSpreadsheets(query: string = 'euro-incentive'): Promise<GoogleDriveFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Brak aktywnego tokenu autoryzacji Google. Zaloguj się ponownie.');

  const q = `name contains '${query.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.append('q', q);
  url.searchParams.append('fields', 'files(id, name, mimeType, modifiedTime, webViewLink)');
  url.searchParams.append('pageSize', '15');
  url.searchParams.append('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd wyszukiwania na Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Lists recently accessed or modified spreadsheets from Google Drive
 */
export async function listRecentSpreadsheets(): Promise<GoogleDriveFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Brak aktywnego tokenu autoryzacji Google.');

  const q = `mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.append('q', q);
  url.searchParams.append('fields', 'files(id, name, mimeType, modifiedTime, webViewLink)');
  url.searchParams.append('pageSize', '15');
  url.searchParams.append('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd pobierania arkuszy (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches spreadsheet metadata and list of sheet tabs
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<{
  id: string;
  title: string;
  sheets: SpreadsheetSheet[];
}> {
  const token = await getAccessToken();
  if (!token) throw new Error('Brak aktywnego tokenu autoryzacji Google.');

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=spreadsheetId,properties.title,sheets.properties`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd pobierania informacji o arkuszu (${response.status})`);
  }

  const data = await response.json();
  const sheets: SpreadsheetSheet[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
    rowCount: s.properties.gridProperties?.rowCount,
    columnCount: s.properties.gridProperties?.columnCount,
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Arkusz bez nazwy',
    sheets,
  };
}

/**
 * Reads existing values from a sheet (e.g. for previewing existing structure and headers)
 */
export async function getSheetValues(spreadsheetId: string, sheetTitle: string, limit: number = 10): Promise<{
  headers: string[];
  recentRows: string[][];
  totalRows: number;
}> {
  const token = await getAccessToken();
  if (!token) throw new Error('Brak aktywnego tokenu autoryzacji Google.');

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `${sheetTitle}!A1:Z${limit + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd odczytu danych z arkusza (${response.status})`);
  }

  const data = await response.json();
  const values: string[][] = data.values || [];

  if (values.length === 0) {
    return { headers: [], recentRows: [], totalRows: 0 };
  }

  const headers = values[0] || [];
  const recentRows = values.slice(1);

  return {
    headers,
    recentRows,
    totalRows: values.length,
  };
}

/**
 * Appends rows to a spreadsheet sheet using Google Sheets API
 */
export async function appendRowsToSpreadsheet(
  spreadsheetId: string,
  sheetTitle: string,
  rows: (string | number)[][]
): Promise<{
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
}> {
  const token = await getAccessToken();
  if (!token) throw new Error('Brak aktywnego tokenu autoryzacji Google. Zaloguj się ponownie.');

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `${sheetTitle}!A:E`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd dopisywania danych do arkusza (${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    updatedRange: data.updates?.updatedRange || range,
    updatedRows: data.updates?.updatedRows || rows.length,
  };
}

/**
 * Helper to extract spreadsheet ID if user enters a full Google Sheets URL or raw ID
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return trimmed;
}

/**
 * Creates a brand new Google Spreadsheet initialized with headers and initial reference rows
 */
export async function createSpreadsheetWithReferenceData(
  title: string = 'euro-incentive',
  headers: string[],
  rows: (string | number)[][]
): Promise<{ id: string; title: string; url: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Brak aktywnego tokenu autoryzacji Google.');

  // 1. Create the spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Arkusz1',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Błąd tworzenia nowego arkusza (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const webViewUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Populate header and rows in batch
  const allValues = [headers, ...rows];
  const range = 'Arkusz1!A1:E' + allValues.length;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Wypełnianie wierszy zakończyło się z ostrzeżeniem');
  }

  return {
    id: spreadsheetId,
    title: sheetData.properties?.title || title,
    url: webViewUrl,
  };
}

/**
 * Searches and identifies the spreadsheet matching the attachment headers
 */
export async function findSpreadsheetMatchingAttachment(): Promise<{
  file: GoogleDriveFile;
  matchReason: string;
} | null> {
  const token = await getAccessToken();
  if (!token) return null;

  // 1. Search for euro-incentive or incentive
  const candidates = await searchDriveSpreadsheets('euro-incentive');
  if (candidates.length > 0) {
    return {
      file: candidates[0],
      matchReason: 'Znaleziono plik o nazwie "euro-incentive"',
    };
  }

  const secondary = await searchDriveSpreadsheets('incentive');
  if (secondary.length > 0) {
    return {
      file: secondary[0],
      matchReason: 'Znaleziono plik zawierający "incentive"',
    };
  }

  // 2. Check recent files
  const recent = await listRecentSpreadsheets();
  for (const file of recent.slice(0, 10)) {
    try {
      const sample = await getSheetValues(file.id, 'Arkusz1', 1);
      const headers = sample.headers.map((h) => h.toLowerCase());
      const hasTimestamp = headers.some((h) => h.includes('time') || h.includes('data') || h.includes('godzina'));
      const hasMarka = headers.some((h) => h.includes('marka'));
      const hasModel = headers.some((h) => h.includes('model'));
      if ((hasTimestamp && hasMarka) || (hasMarka && hasModel)) {
        return {
          file,
          matchReason: `Zgodne nagłówki: ${sample.headers.join(', ')}`,
        };
      }
    } catch {
      // Continue searching next candidate
    }
  }

  return null;
}
