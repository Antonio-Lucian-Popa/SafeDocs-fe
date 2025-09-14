// src/components/files/FileGrid.tsx
import { useState, KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Folder, FolderOpen, Plus, Users, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentCard } from './DocumentCard';
import { CreateFolderDialog } from './CreateFolderDialog';
import { EmptyState } from '../common/EmptyState';
import { foldersApi } from '@/api/folders';
import { documentsApi } from '@/api/documents';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ShareFolderDialog } from '@/components/ShareFolderDialog';

interface FileGridProps {
  searchQuery?: string;
}

export function FileGrid({ searchQuery }: FileGridProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const currentFolderId = searchParams.get('folderId') || undefined;
  const inFolder = !!currentFolderId;

  // My folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentFolderId],
    queryFn: () => foldersApi.list(currentFolderId),
    enabled: !searchQuery,
  });

  // Shared with me (doar în rădăcină și când nu se caută)
  const { data: sharedFolders = [], isLoading: sharedLoading } = useQuery({
    queryKey: ['shared-folders'],
    queryFn: () => foldersApi.listSharedFolders(),
    enabled: !searchQuery && !inFolder,
  });

  // Folder access (pentru butoane Upload/New/Share)
  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ['folder-access', currentFolderId],
    queryFn: () => foldersApi.getAccess(currentFolderId as string),
    enabled: inFolder, // doar când ești într-un folder
  });

  const canWrite = !!access?.canWrite;
  const isOwner = !!access?.isOwner;

  // Documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', currentFolderId, searchQuery],
    queryFn: async () => {
      if (searchQuery && searchQuery.trim().length > 0) {
        return documentsApi.search(searchQuery.trim());
      }
      if (inFolder) {
        // BE ține cont de share
        return foldersApi.listDocuments(currentFolderId as string);
      }
      // rădăcină: fallback “ultimele 50” (implementarea ta existentă)
      return documentsApi.search();
    },
  });

  const isLoading = foldersLoading || documentsLoading || sharedLoading || accessLoading;
  const hasAnyAtRoot =
    (!searchQuery && !inFolder && (folders.length > 0 || sharedFolders.length > 0)) ||
    (documents?.length ?? 0) > 0;

  const openFolder = (folderId: string) => setSearchParams({ folderId });

  const onKeyActivate = (e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
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

  if (!hasAnyAtRoot && !searchQuery && !inFolder) {
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

  if ((documents?.length ?? 0) === 0 && !!searchQuery) {
    return (
      <EmptyState
        title="No documents found"
        description={`No documents match "${searchQuery}". Try a different search term.`}
      />
    );
  }

  return (
    <>
      {/* Header acțiuni când ești într-un folder */}
      {inFolder && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Current folder</span>
            {!canWrite && (
              <span className="text-xs rounded-full bg-muted px-2 py-0.5 inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Read only
              </span>
            )}
            {!isOwner && (
              <span className="text-xs rounded-full bg-muted px-2 py-0.5">Shared</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canWrite && (
              <>
                <Button onClick={() => {/* open upload */}}>Upload</Button>
                <Button variant="secondary" onClick={() => setCreateFolderOpen(true)}>
                  New Folder
                </Button>
              </>
            )}
            {isOwner && (
              <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Share</Button>
                </DialogTrigger>
                <DialogContent className="p-0">
                  <ShareFolderDialog
                    folderId={currentFolderId as string}
                    onClose={() => setShareOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}

      {/* My folders + New Folder (doar în rădăcină) */}
      {!searchQuery && !inFolder && (
        <>
          <div className="mb-2 text-sm font-semibold">My folders</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors group">
              <CardContent
                role="button"
                tabIndex={0}
                onClick={() => setCreateFolderOpen(true)}
                onKeyDown={(e) => onKeyActivate(e, () => setCreateFolderOpen(true))}
                className="p-6 flex flex-col items-center justify-center text-center h-32"
              >
                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  New Folder
                </span>
              </CardContent>
            </Card>

            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <CardContent
                  role="button"
                  tabIndex={0}
                  onClick={() => openFolder(folder.id)}
                  onKeyDown={(e) => onKeyActivate(e, () => openFolder(folder.id))}
                  className="p-4 h-32 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-primary mb-2">
                    <Folder className="h-8 w-8 group-hover:hidden" />
                    <FolderOpen className="h-8 w-8 hidden group-hover:block" />
                  </div>
                  <h3 className="font-medium text-sm truncate w-full">{folder.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Shared with me — doar în rădăcină */}
      {!searchQuery && !inFolder && sharedFolders.length > 0 && (
        <>
          <div className="mt-6 mb-2 text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Shared with me
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sharedFolders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <CardContent
                  role="button"
                  tabIndex={0}
                  onClick={() => openFolder(folder.id)}
                  onKeyDown={(e) => onKeyActivate(e, () => openFolder(folder.id))}
                  className="p-4 h-32 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-primary mb-2">
                    <Folder className="h-8 w-8 group-hover:hidden" />
                    <FolderOpen className="h-8 w-8 hidden group-hover:block" />
                  </div>
                  <h3 className="font-medium text-sm truncate w-full">{folder.name}</h3>
                  <span className="mt-1 text-[10px] rounded-full bg-muted px-2 py-0.5">
                    Shared
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Documents (în folderul curent sau rezultate căutare) */}
      {documents.length > 0 && (
        <>
          {!searchQuery && inFolder && (
            <div className="mt-6 mb-2 text-sm font-semibold">Documents</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </>
      )}

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={currentFolderId}
      />
    </>
  );
}
