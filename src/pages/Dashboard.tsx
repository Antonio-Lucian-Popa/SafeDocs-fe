import { useSearchParams } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileGrid } from '@/components/drive/FileGrid';
import { foldersApi } from '@/api/folders';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const currentFolderId = searchParams.get('folderId');
  const searchQuery = searchParams.get('search');

  // Get current folder info for breadcrumb
  const { data: currentFolder } = useQuery({
    queryKey: ['folder', currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return null;
      // For now, we'll need to get this from the folders list
      // In a real API, there would be a GET /folders/:id endpoint
      const allFolders = await foldersApi.list();
      return allFolders.find(f => f.id === currentFolderId) || null;
    },
    enabled: !!currentFolderId,
  });

  const getFolderPath = async (folderId: string): Promise<string[]> => {
    // This would need to be implemented properly with parent folder traversal
    // For now, just return the current folder name
    return currentFolder ? [currentFolder.name] : [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {searchQuery ? (
            <div>
              <h1 className="text-2xl font-bold">Search Results</h1>
              <p className="text-muted-foreground">Results for "{searchQuery}"</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold">My Documents</h1>
              <nav className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Button variant="ghost" size="sm" className="h-auto p-0">
                  <Home className="h-4 w-4" />
                </Button>
                {currentFolder && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span>{currentFolder.name}</span>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* File Grid */}
      <FileGrid searchQuery={searchQuery || undefined} />
    </div>
  );
}