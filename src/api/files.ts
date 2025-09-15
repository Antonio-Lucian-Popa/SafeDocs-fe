// src/api/files.ts
import { httpClient } from './http';

export function fileViewUrl(documentId: string) {
  // folosește baseURL din httpClient; dacă ai gateway separat, compune absolut
  return `${httpClient.defaults.baseURL}/files/${documentId}/view`;
}

export function fileThumbUrl(documentId: string, w = 320, h = 200) {
  return `${httpClient.defaults.baseURL}/files/${documentId}/thumbnail?w=${w}&h=${h}`;
}

export async function getDocumentMeta(id: string) {
  // dacă nu ai un endpoint dedicat, poți folosi /documents/:id (îl ai deja)
  const { data } = await httpClient.get(`/documents/${id}`);
  return data as {
    id: string;
    title: string;
    folderId?: string | null;
    filePath?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    expiresAt?: string | null;
  };
}
