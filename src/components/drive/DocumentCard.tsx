import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Image, File, MoreVertical, Download, Clock, Calendar, Tag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DocumentResponse } from '@/api/types';
import { documentsApi, downloadBlob } from '@/api/documents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '@/api/http';
import { Thumbnail } from '../files/Thumbnail';

interface DocumentCardProps {
  document: DocumentResponse;
}

const getFileIcon = (mimeType?: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
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

export function DocumentCard({ document }: DocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  const downloadMutation = useMutation({
    mutationFn: async () => {
      setIsDownloading(true);
      const blob = await documentsApi.download(document.id);
      const filename = `${document.title}.${document.mimeType?.split('/')[1] || 'file'}`;
      downloadBlob(filename, blob);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to download document');
    },
    onSettled: () => {
      setIsDownloading(false);
    },
  });

  const isExpiringSoon =
    document.expiresAt &&
    new Date(document.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  const isExpired = document.expiresAt && new Date(document.expiresAt) < new Date();

  const openPreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await httpClient.get(`/files/${document.id}/view`, { responseType: 'blob' });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
    }
  };

  // icon fallback pentru Thumbnail (doar când nu avem preview)
  const FallbackIcon = getFileIcon(document.mimeType);

  return (
    <Card
      className={cn(
        'group hover:shadow-md transition-all duration-200 cursor-pointer'
      )}
      onClick={(e) => {
        e.stopPropagation();
        openPreview(e);
      }}
    >
      <CardContent className="p-0">
        {/* THUMBNAIL SUS (full width, aspect 4:3) */}
        <Thumbnail
          documentId={document.id}
          title={document.title}
          mimeType={document.mimeType}
          className="w-full aspect-[4/3]"
          rounded="rounded-t-md"
          fallbackIcon={<FallbackIcon className="h-10 w-10 text-muted-foreground" />}
        />

        {/* DESCRIERE JOS */}
        <div className={cn(
          'p-4',
          isExpired && 'border-t border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
          isExpiringSoon && !isExpired && 'border-t border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800'
        )}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight truncate">{document.title}</h3>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {document.fileSize && <span>{formatFileSize(document.fileSize)}</span>}
                {document.createdAt && (
                  <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
                )}
              </div>

              {/* Tags scurte */}
              {document.tags && Object.keys(document.tags).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(document.tags).slice(0, 2).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {key}: {String(value)}
                    </Badge>
                  ))}
                  {Object.keys(document.tags).length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{Object.keys(document.tags).length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Expiration */}
              {document.expiresAt && (
                <div className={cn(
                  'mt-2 flex items-center gap-1 text-xs',
                  isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'
                )}>
                  <Calendar className="h-3 w-3" />
                  {isExpired ? (
                    <span>Expired {format(new Date(document.expiresAt), 'MMM dd, yyyy')}</span>
                  ) : (
                    <span>Expires {format(new Date(document.expiresAt), 'MMM dd, yyyy')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(e);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadMutation.mutate();
                  }}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/doc/${document.id}`);
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
