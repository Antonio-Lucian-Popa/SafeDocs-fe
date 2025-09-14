// src/api/folders.ts
import { httpClient } from './http';
import type {
  Folder,
  CreateFolderRequest,
  DocumentListItem,
  ShareItem,
  CreateShareRequest,
  FolderAccess,
} from './types';

// GET /folders?parentId=...
export async function listFolders(parentId?: string): Promise<Folder[]> {
  const params = parentId ? { parentId } : undefined;
  const { data, status } = await httpClient.get<Folder[]>('/folders', { params });
  return status === 204 ? [] : data;
}

// POST /folders
export async function createFolder(body: CreateFolderRequest): Promise<Folder> {
  const { data } = await httpClient.post<Folder>('/folders', body);
  return data;
}

// GET /documents?folderId=...
export async function listFolderDocuments(folderId: string): Promise<DocumentListItem[]> {
  if (!folderId) throw new Error('folderId is required');
  const { data, status } = await httpClient.get<DocumentListItem[]>('/documents', {
    params: { folderId },
  });
  return status === 204 ? [] : data;
}

// GET /folders/:folderId/access
export async function getFolderAccess(folderId: string): Promise<FolderAccess> {
  const { data } = await httpClient.get<FolderAccess>(`/folders/${folderId}/access`);
  return data;
}

// GET /folders/:folderId/shares (owner)
export async function listShares(folderId: string): Promise<ShareItem[]> {
  const { data, status } = await httpClient.get<ShareItem[]>(`/folders/${folderId}/shares`);
  return status === 204 ? [] : data;
}

// POST /folders/:folderId/shares (owner)
export async function createShare(folderId: string, body: CreateShareRequest): Promise<ShareItem> {
  const { data } = await httpClient.post<ShareItem>(`/folders/${folderId}/shares`, body);
  return data;
}

// DELETE /folders/:folderId/shares/:targetUserId (owner)
export async function revokeShare(folderId: string, targetUserId: string): Promise<void> {
  await httpClient.delete(`/folders/${folderId}/shares/${targetUserId}`);
}

// DELETE /folders/:folderId/shares/by-email?email=... (doar dacă există în BE)
export async function revokeShareByEmail(folderId: string, email: string): Promise<void> {
  await httpClient.delete(`/folders/${folderId}/shares/by-email`, { params: { email } });
}

// GET /shared/folders (opțional)
export async function listSharedFolders(): Promise<Folder[]> {
  const { data, status } = await httpClient.get<Folder[]>('/shared/folders');
  return status === 204 ? [] : data;
}

// GET /shared/documents (opțional)
export async function listSharedDocuments(): Promise<DocumentListItem[]> {
  const { data, status } = await httpClient.get<DocumentListItem[]>('/shared/documents');
  return status === 204 ? [] : data;
}

export const foldersApi = {
  list: listFolders,
  create: createFolder,
  listDocuments: listFolderDocuments,
  getAccess: getFolderAccess,
  listShares,
  createShare,
  revokeShare,
  revokeShareByEmail, // folosește doar dacă BE a expus ruta
  listSharedFolders,
  listSharedDocuments,
};
