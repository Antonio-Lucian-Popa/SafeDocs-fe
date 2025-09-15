import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Image,
  File,
  MoreVertical,
  Download,
  Clock,
  Calendar,
  Tag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentResponse } from '@/api/types';
import { documentsApi, downloadBlob } from '@/api/documents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { fileViewUrl } from '@/api/files';

interface DocumentCardProps {
  document: DocumentResponse;
}

const getFileIcon = (mimeType?: string | null) => {
  if (!mimeType) return File;

  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
};

const getFileTypeColor = (mimeType?: string | null) => {
  if (!mimeType) return 'text-muted-foreground';

  if (mimeType.startsWith('image/')) return 'text-green-600';
  if (mimeType === 'application/pdf') return 'text-red-600';
  return 'text-blue-600';
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
  const queryClient = useQueryClient();

  const FileIcon = getFileIcon(document.mimeType);
  const fileTypeColor = getFileTypeColor(document.mimeType);

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

  const isExpiringSoon = document.expiresAt &&
    new Date(document.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  const isExpired = document.expiresAt && new Date(document.expiresAt) < new Date();

  const openPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Deschide view endpoint într-un tab nou. BE returnează Content-Disposition:inline
    const file = fileViewUrl(document.id);
    window.open(file, '_blank', 'noopener,noreferrer');
  };

  const openThumbnailInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${import.meta.env.VITE_API_BASE || ''}/files/${document.id}/thumbnail?w=1200&h=800`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={cn(
      'group hover:shadow-md transition-all duration-200 cursor-pointer',
      isExpired && 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
      isExpiringSoon && !isExpired && 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800'
    )}>
      <CardContent className="p-4">
        <div
          className="flex items-start gap-3"
          onClick={() => navigate(`/doc/${document.id}`)}
        >
          <div className={cn('mt-1', fileTypeColor)}>
            <FileIcon className="h-8 w-8" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight truncate">
              {document.title}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {document.fileSize && (
                <span>{formatFileSize(document.fileSize)}</span>
              )}
              {document.createdAt && (
                <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
              )}
            </div>

            {/* Tags */}
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

            {/* Expiration Status */}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-8 w-8"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Preview */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openPreview(e);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>

              {/* Download */}
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

              {/* View details (existing) */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/doc/${document.id}`);
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>

              {/* optional: open large thumbnail */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openThumbnailInNewTab(e);
                }}
              >
                <Image className="mr-2 h-4 w-4" />
                Open thumbnail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}