// src/pages/FolderPage.tsx
import { useEffect, useState } from 'react';
import { listFolderDocuments, getFolderAccess } from '@/api/folders';
import type { DocumentListItem, FolderAccess } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ShareFolderDialog } from '@/components/ShareFolderDialog';

type Props = { folderId: string };

export default function FolderPage({ folderId }: Props) {
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [access, setAccess] = useState<FolderAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [d, a] = await Promise.all([
          listFolderDocuments(folderId),
          getFolderAccess(folderId),
        ]);
        console.log("Folder access: ", a, d);
        setDocs(d);
        setAccess(a);
      } finally {
        setLoading(false);
      }
    })();
  }, [folderId]);

  if (loading) return <div className="p-6">Loading...</div>;

  const canWrite = !!access?.canWrite;
  const isOwner = !!access?.isOwner;
  console.log("isOwner: ", isOwner);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          Folder
          {!canWrite && <span className="text-xs rounded-full bg-muted px-3 py-1">Read only</span>}
          {!isOwner && <span className="text-xs rounded-full bg-muted px-3 py-1">Shared</span>}
        </h1>

        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <Button onClick={() => { /* open upload */ }}>Upload</Button>
              <Button variant="secondary" onClick={() => { /* new folder */ }}>New Folder</Button>
            </>
          )}

          {isOwner && (
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Share</Button>
              </DialogTrigger>
              <DialogContent className="p-0">
                <ShareFolderDialog folderId={folderId} onClose={() => setShareOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Nu există documente aici încă.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(d => (
            <Card key={d.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="font-medium truncate" title={d.title}>{d.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {d.mimeType ?? 'file'} • {d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : '-'}
                </div>
                {d.expiresAt && (
                  <div className="text-xs mt-1">
                    Expires: {new Date(d.expiresAt).toLocaleDateString()}
                  </div>
                )}
                {canWrite && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary">Rename</Button>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
