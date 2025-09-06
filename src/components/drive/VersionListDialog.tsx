import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Download, RotateCcw, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { documentsApi, downloadBlob } from '@/api/documents';
import { toast } from 'sonner';

interface VersionListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

export function VersionListDialog({ 
  open, 
  onOpenChange, 
  documentId, 
  documentTitle 
}: VersionListDialogProps) {
  const [revertConfirm, setRevertConfirm] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => documentsApi.getVersions(documentId),
    enabled: open,
  });

  const revertMutation = useMutation({
    mutationFn: (versionNo: number) => documentsApi.revertVersion(documentId, versionNo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success(`Reverted to version ${data.versionSetTo}`);
      setRevertConfirm(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revert version');
    },
  });

  const downloadVersion = async (version: any) => {
    try {
      const blob = await documentsApi.download(documentId);
      const filename = `${documentTitle}_v${version.versionNo}.${version.mimeType?.split('/')[1] || 'file'}`;
      downloadBlob(filename, blob);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download version');
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History - {documentTitle}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg loading-shimmer" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No versions found
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div key={version.id}>
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Version {version.versionNo}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                            {version.fileSize && (
                              <span>{formatFileSize(version.fileSize)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadVersion(version)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevertConfirm(version.versionNo)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>
                    {index < versions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revertConfirm !== null} onOpenChange={() => setRevertConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to Version {revertConfirm}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make version {revertConfirm} the current version of the document. 
              The current version will be preserved in the version history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revertConfirm && revertMutation.mutate(revertConfirm)}
              disabled={revertMutation.isPending}
            >
              {revertMutation.isPending ? 'Reverting...' : 'Revert'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}