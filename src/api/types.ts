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