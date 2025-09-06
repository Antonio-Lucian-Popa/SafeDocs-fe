import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { documentsApi } from '@/api/documents';
import { cn } from '@/lib/utils';

export default function ExpiringSoon() {
  const navigate = useNavigate();

  const { data: expiringDocs = [], isLoading } = useQuery({
    queryKey: ['expiring-soon'],
    queryFn: documentsApi.expiringSoon,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded loading-shimmer" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg loading-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const expiredDocs = expiringDocs.filter(doc => doc.daysLeft < 0);
  const expiringSoonDocs = expiringDocs.filter(doc => doc.daysLeft >= 0);

  if (expiringDocs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Expiring Documents</h1>
          <p className="text-muted-foreground">Monitor documents that are expiring soon</p>
        </div>

        <EmptyState
          title="No expiring documents"
          description="All your documents are up to date! Documents will appear here when they're approaching their expiration date."
          actionLabel="Browse Documents"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Expiring Documents
        </h1>
        <p className="text-muted-foreground">
          {expiringDocs.length} document{expiringDocs.length !== 1 ? 's' : ''} requiring attention
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredDocs.length}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringSoonDocs.length}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expired Documents */}
      {expiredDocs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600">Expired Documents</h2>
          <div className="space-y-3">
            {expiredDocs.map((doc) => (
              <Card key={doc.documentId} className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Expired {format(new Date(doc.expiresAt), 'MMM dd, yyyy')}</span>
                        <Badge variant="destructive" className="text-xs">
                          {Math.abs(doc.daysLeft)} day{Math.abs(doc.daysLeft) !== 1 ? 's' : ''} overdue
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/doc/${doc.documentId}`)}
                      className="ml-4"
                    >
                      View Document
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon Documents */}
      {expiringSoonDocs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-yellow-600">Expiring Soon</h2>
          <div className="space-y-3">
            {expiringSoonDocs.map((doc) => (
              <Card key={doc.documentId} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Expires {format(new Date(doc.expiresAt), 'MMM dd, yyyy')}</span>
                        <Badge 
                          variant={doc.daysLeft <= 3 ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {doc.daysLeft} day{doc.daysLeft !== 1 ? 's' : ''} left
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/doc/${doc.documentId}`)}
                      className="ml-4"
                    >
                      View Document
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}