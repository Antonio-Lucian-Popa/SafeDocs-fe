import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Folder, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentCard } from './DocumentCard';
import { CreateFolderDialog } from './CreateFolderDialog';
import { EmptyState } from '../common/EmptyState';
import { foldersApi } from '@/api/folders';
import { documentsApi } from '@/api/documents';
import { cn } from '@/lib/utils';

interface FileGridProps {
  searchQuery?: string;
}

export function FileGrid({ searchQuery }: FileGridProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const currentFolderId = searchParams.get('folderId');

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentFolderId],
    queryFn: () => foldersApi.list(currentFolderId || undefined),
    enabled: !searchQuery, // Don't fetch folders when searching
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', currentFolderId, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return documentsApi.search(searchQuery);
      }
      // For now, we'll use search without query to get all documents
      // In a real API, there might be a separate endpoint for folder contents
      return documentsApi.search();
    },
  });

  // Filter documents by folder if not searching
  const filteredDocuments = searchQuery 
    ? documents 
    : documents.filter(doc => doc.folderId === currentFolderId);

  const isLoading = foldersLoading || documentsLoading;
  const hasContent = folders.length > 0 || filteredDocuments.length > 0;

  const handleFolderClick = (folderId: string) => {
    setSearchParams({ folderId });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg loading-shimmer" />
        ))}
      </div>
    );
  }

  if (!hasContent && !searchQuery) {
    return (
      <EmptyState
        title="This folder is empty"
        description="Upload your first document or create a folder to get started."
        actionLabel="Create Folder"
        onAction={() => setCreateFolderOpen(true)}
      >
        <CreateFolderDialog 
          open={createFolderOpen} 
          onOpenChange={setCreateFolderOpen}
          parentId={currentFolderId}
        />
      </EmptyState>
    );
  }

  if (!hasContent && searchQuery) {
    return (
      <EmptyState
        title="No documents found"
        description={`No documents match "${searchQuery}". Try a different search term.`}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {/* New Folder Button (only when not searching) */}
        {!searchQuery && (
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors group">
            <CardContent 
              className="p-6 flex flex-col items-center justify-center text-center h-32"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                New Folder
              </span>
            </CardContent>
          </Card>
        )}

        {/* Folders */}
        {!searchQuery && folders.map((folder) => (
          <Card 
            key={folder.id}
            className="hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => handleFolderClick(folder.id)}
          >
            <CardContent className="p-4 h-32 flex flex-col items-center justify-center text-center">
              <div className="text-primary mb-2">
                <Folder className="h-8 w-8 group-hover:hidden" />
                <FolderOpen className="h-8 w-8 hidden group-hover:block" />
              </div>
              <h3 className="font-medium text-sm truncate w-full">
                {folder.name}
              </h3>
            </CardContent>
          </Card>
        ))}

        {/* Documents */}
        {filteredDocuments.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>

      <CreateFolderDialog 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
        parentId={currentFolderId}
      />
    </>
  );
}