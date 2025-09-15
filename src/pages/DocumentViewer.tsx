// src/pages/DocumentViewer.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocumentMeta, fileViewUrl } from '@/api/files';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
// OPTIONAL: npm i react-pdf
import { Document as PdfDoc, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs`;

export default function DocumentViewer() {
  const { id = '' } = useParams();
  const { data: meta, isLoading, error } = useQuery({
    queryKey: ['doc-meta', id],
    queryFn: () => getDocumentMeta(id),
  });

  if (isLoading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;
  if (error || !meta) return <div className="p-6 text-destructive">Failed to load</div>;

  const viewUrl = fileViewUrl(id);
  const mime = meta.mimeType || 'application/octet-stream';

  if (mime.startsWith('image/')) {
    return (
      <div className="p-4">
        <img src={viewUrl} alt={meta.title} className="max-w-full max-h-[85vh] mx-auto rounded-lg shadow" />
      </div>
    );
  }

  if (mime === 'application/pdf') {
    return (
      <div className="p-4 flex justify-center">
        <div className="w-full max-w-5xl border rounded-lg bg-background">
          <PdfDoc file={viewUrl} loading={<div className="p-10 text-center">Loading PDF…</div>}>
            <Page pageNumber={1} width={900} />
          </PdfDoc>
          {/* Poți adăuga pager pentru pagini multiple */}
        </div>
      </div>
    );
  }

  if (mime.startsWith('video/')) {
    return (
      <div className="p-4">
        <video src={viewUrl} controls className="w-full max-h-[85vh] rounded-lg shadow" />
      </div>
    );
  }

  if (mime.startsWith('audio/')) {
    return (
      <div className="p-6">
        <audio src={viewUrl} controls className="w-full" />
      </div>
    );
  }

  // Quick text preview (doar pt text/plain)
  if (mime.startsWith('text/')) {
    return (
      <iframe
        src={viewUrl}
        className="w-full h-[85vh] border rounded-lg"
        title={meta.title}
      />
    );
  }

  // Fallback – oferă download
  return (
    <div className="p-6 space-y-2">
      <div>Preview not available for this type ({mime}).</div>
      <Button asChild>
        <a href={viewUrl} download>Download</a>
      </Button>
    </div>
  );
}
