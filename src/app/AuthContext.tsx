import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TokenPair } from '@/api/types';
import { authApi } from '@/api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (tokens: TokenPair) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored refresh token on mount
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
      // Try to refresh the access token
      authApi.refresh(storedRefreshToken)
        .then((tokens) => {
          setAccessToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          // Decode user info from access token (simplified)
          decodeUserFromToken(tokens.accessToken);
        })
        .catch(() => {
          localStorage.removeItem('refreshToken');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const decodeUserFromToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  const login = async (idToken: string) => {
    try {
      const tokens = await authApi.loginWithGoogle(idToken);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      decodeUserFromToken(tokens.accessToken);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('refreshToken');
  };

  const setTokens = (tokens: TokenPair) => {
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      refreshToken,
      isLoading,
      login,
      logout,
      setTokens,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}