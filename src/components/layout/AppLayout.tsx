import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from '../nav/Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/app/AuthContext';
import { setAuthTokens } from '@/api/http';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { accessToken, refreshToken, setTokens } = useAuth();

  useEffect(() => {
    setAuthTokens({ accessToken, refreshToken });
  }, [accessToken, refreshToken]);

  useEffect(() => {
    const handleTokensRefreshed = (event: any) => {
      setTokens(event.detail);
    };

    window.addEventListener('tokens-refreshed', handleTokensRefreshed);
    return () => window.removeEventListener('tokens-refreshed', handleTokensRefreshed);
  }, [setTokens]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 lg:pl-64">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}