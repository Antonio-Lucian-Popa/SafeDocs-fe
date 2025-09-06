import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  History, 
  Calendar,
  Tag,
  FileText,
  Image,
  File
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VersionListDialog } from '@/components/drive/VersionListDialog';
import { documentsApi, downloadBlob } from '@/api/documents';
import { toast } from 'sonner';

const getFileIcon = (mimeType?: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const queryClient = useQueryClient();

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', id],
    queryFn: () => documentsApi.getVersions(id!),
    enabled: !!id,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!document) return;
      const blob = await documentsApi.download(document.id);
      const filename = `${document.title}.${document.mimeType?.split('/')[1] || 'file'}`;
      downloadBlob(filename, blob);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to download document');
    },
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!document) throw new Error('No document');
      return documentsApi.addVersion(document.id, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('New version uploaded successfully');
      setUploadingVersion(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload new version');
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadVersionMutation.mutate(file);
    }
    event.target.value = ''; // Reset input
  };

  const FileIcon = document ? getFileIcon(document.mimeType) : File;
  const isExpired = document?.expiresAt && new Date(document.expiresAt) < new Date();
  const isExpiringSoon = document?.expiresAt && 
    new Date(document.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded loading-shimmer" />
        <div className="h-64 bg-muted rounded-lg loading-shimmer" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-4">
            The document you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{document.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {document.createdAt && (
                  <span>Created {format(new Date(document.createdAt), 'MMM dd, yyyy')}</span>
                )}
                {document.fileSize && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(document.fileSize)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            id="version-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.doc,.docx"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('version-upload')?.click()}
            disabled={uploadVersionMutation.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadVersionMutation.isPending ? 'Uploading...' : 'Upload New Version'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setVersionsOpen(true)}
          >
            <History className="mr-2 h-4 w-4" />
            Versions ({versions.length})
          </Button>
          <Button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloadMutation.isPending ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Document Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <p className="text-sm text-muted-foreground mt-1">{document.title}</p>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium">File Information</label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Type: {document.mimeType || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Size: {formatFileSize(document.fileSize)}
                      </p>
                    </div>
                  </div>

                  {document.tags && Object.keys(document.tags).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags
                        </label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(document.tags).map(([key, value]) => (
                            <Badge key={key} variant="secondary">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Expiration Status */}
              {document.expiresAt && (
                <Card className={isExpired ? 'border-red-200' : isExpiringSoon ? 'border-yellow-200' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Expiration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {format(new Date(document.expiresAt), 'MMM dd, yyyy')}
                      </span>
                      <Badge variant={isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'outline'}>
                        {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => downloadMutation.mutate()}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadMutation.isPending ? 'Downloading...' : 'Download'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setVersionsOpen(true)}
                  >
                    <History className="mr-2 h-4 w-4" />
                    View Versions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No versions found
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Version {version.versionNo}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm')} •{' '}
                            {formatFileSize(version.fileSize)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VersionListDialog
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        documentId={document.id}
        documentTitle={document.title}
      />
    </div>
  );
}