import { httpClient } from './http';
import { Folder, CreateFolderRequest } from './types';

export const foldersApi = {
  async list(parentId?: string): Promise<Folder[]> {
    const params = parentId ? { parentId } : {};
    const response = await httpClient.get('/folders', { params });
    return response.data;
  },

  async create(data: CreateFolderRequest): Promise<Folder> {
    const response = await httpClient.post('/folders', data);
    return response.data;
  },
};