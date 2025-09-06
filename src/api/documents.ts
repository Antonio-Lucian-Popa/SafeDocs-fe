import { httpClient, API_BASE_URL } from './http';
import { DocumentResponse, DocumentVersion, CreateDocumentRequest, ExpiringSoon } from './types';

export const documentsApi = {
  async create(data: CreateDocumentRequest): Promise<DocumentResponse> {
    const response = await httpClient.post('/documents', data);
    return response.data;
  },

  async get(id: string): Promise<DocumentResponse> {
    const response = await httpClient.get(`/documents/${id}`);
    return response.data;
  },

  async uploadFile(documentId: string, file: File): Promise<{ path: string; mime: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.post(`/documents/${documentId}/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const response = await httpClient.get(`/documents/${documentId}/versions`);
    return response.data;
  },

  async addVersion(documentId: string, file: File): Promise<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.post(`/documents/${documentId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async revertVersion(documentId: string, versionNo: number): Promise<{ currentPath: string; versionSetTo: number }> {
    const response = await httpClient.post(`/documents/${documentId}/versions/${versionNo}/revert`);
    return response.data;
  },

  async download(documentId: string): Promise<Blob> {
    const response = await httpClient.get(`/files/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async search(query?: string, tagKey?: string, tagValue?: string): Promise<DocumentResponse[]> {
    const params: any = {};
    if (query) params.q = query;
    if (tagKey) params.tagKey = tagKey;
    if (tagValue) params.tagValue = tagValue;

    const response = await httpClient.get('/documents/search', { params });
    return response.data;
  },

  async expiringSoon(): Promise<ExpiringSoon[]> {
    const response = await httpClient.get('/documents/expiring-soon');
    return response.data;
  },
};

export const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};