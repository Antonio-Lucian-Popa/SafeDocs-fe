export type Folder = {
  id: string;
  name: string;
  parentId?: string | null;
};

export type DocumentResponse = {
  id: string;
  title: string;
  folderId?: string | null;
  filePath?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  expiresAt?: string | null;
  tags?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentVersion = {
  id: string;
  versionNo: number;
  filePath: string;
  mimeType?: string | null;
  fileSize?: number | null;
  checksumSha256?: string | null;
  createdAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type ExpiringSoon = {
  documentId: string;
  userId: string;
  title: string;
  expiresAt: string;
  daysLeft: number;
};

export type CreateDocumentRequest = {
  title: string;
  folderId?: string | null;
  expiresAt?: string | null;
  tags?: Record<string, any> | null;
};

export type CreateFolderRequest = {
  name: string;
  parentId?: string | null;
};


// src/api/types.ts
export type Permission = 'READ' | 'WRITE';

export interface DocumentListItem {
  id: string;
  title: string;
  folderId: string | null;
  mimeType: string | null;
  fileSize: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ShareItem {
  id: string;                 // id-ul share-ului (nu-l folosim la revoke)
  sharedWithUserId: string;   // ✅ ăsta e necesar pentru revoke
  sharedWithEmail: string;
  permission: 'READ' | 'WRITE';
  createdAt: string;
}

export interface CreateShareRequest {
  targetEmail: string;
  permission: Permission;
}

export interface FolderAccess {
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
}
