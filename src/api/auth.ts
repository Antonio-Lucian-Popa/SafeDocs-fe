import { httpClient } from './http';
import { TokenPair } from './types';

export const authApi = {
  async loginWithGoogle(idToken: string): Promise<TokenPair> {
    const response = await httpClient.post('/auth/google', { idToken });
    return response.data;
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const response = await httpClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await httpClient.post('/auth/logout', { refreshToken });
  },
};