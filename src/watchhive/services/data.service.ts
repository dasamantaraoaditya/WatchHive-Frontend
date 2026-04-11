import apiClient from './api.js';

export type ExportFormat = 'json' | 'csv';

export interface ImportResult {
    message: string;
    // Entries
    entriesImported?: number;
    entriesSkipped?: number;
    entriesErrors?: string[];
    // Lists
    listsImported?: number;
    listsSkipped?: number;
    itemsImported?: number;
    itemsSkipped?: number;
}

export interface ExportOptions {
    includeEntries: boolean;
    includeLists: boolean;
    format: ExportFormat;
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export async function exportData(options: ExportOptions): Promise<void> {
    const { includeEntries, includeLists, format } = options;

    const includeParts: string[] = [];
    if (includeEntries) includeParts.push('entries');
    if (includeLists) includeParts.push('lists');
    if (includeParts.length === 0) throw new Error('Select at least one data type to export.');

    const response = await apiClient.client.get('/data/export', {
        params: { format, include: includeParts.join(',') },
        responseType: 'blob',
    });

    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([response.data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const label = includeParts.length === 2 ? 'export' : includeParts[0];
    const filename = `watchhive_${label}_${date}.${format}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── IMPORT ──────────────────────────────────────────────────────────────────

export async function importData(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;

                let payload: Record<string, unknown>;
                try {
                    payload = JSON.parse(text);
                } catch {
                    reject(new Error('Invalid JSON file. Please upload a valid WatchHive export file.'));
                    return;
                }

                // Accept either the combined file { entries: [...], lists: [...] }
                // or a legacy single-kind file { entries: [...] } or { lists: [...] }
                const body: Record<string, unknown> = {};

                if (Array.isArray(payload.entries)) body.entries = payload.entries;
                if (Array.isArray(payload.lists)) body.lists = payload.lists;

                if (!body.entries && !body.lists) {
                    reject(new Error('File must contain an "entries" and/or "lists" array.'));
                    return;
                }

                const result = await apiClient.post<ImportResult>('/data/import', body);
                resolve(result);
            } catch (err: any) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.readAsText(file);
    });
}

// Convenience aliases kept for legacy callers
export const exportEntries = (format: ExportFormat) =>
    exportData({ includeEntries: true, includeLists: false, format });

export const exportLists = (format: ExportFormat) =>
    exportData({ includeEntries: false, includeLists: true, format });

export const importEntries = (file: File) => importData(file);
export const importLists = (file: File) => importData(file);

export const dataService = {
    exportData,
    exportEntries,
    exportLists,
    importData,
    importEntries,
    importLists,
};

export default dataService;
