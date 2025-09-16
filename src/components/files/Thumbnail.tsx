// src/components/files/Thumbnail.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { httpClient } from '@/api/http';
import { cn } from '@/lib/utils';

type Props = {
  documentId: string;
  title: string;
  mimeType?: string | null;
  width?: number;     // px
  height?: number;    // px
  className?: string;
  rounded?: string;   // ex: 'rounded-md'
};

export function Thumbnail({
  documentId,
  title,
  mimeType,
  width = 160,
  height = 120,
  className,
  rounded = 'rounded-md',
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Lazy-load la intrarea în viewport (simplu, fără dependențe)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setShouldLoad(true);
          io.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    httpClient.get(`/files/${documentId}/thumbnail`, {
      params: { w: width, h: height },
      responseType: 'blob',
    })
    .then(res => {
      if (!mounted) return;
      const url = URL.createObjectURL(res.data);
      objectUrlRef.current = url;
      setSrc(url);
    })
    .catch((err) => {
      if (!mounted) return;
      setError(err?.response?.data?.message || 'thumbnail_failed');
    })
    .finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [shouldLoad, documentId, width, height]);

  const isPreviewable = useMemo(() => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }, [mimeType]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted flex items-center justify-center',
        rounded,
        className
      )}
      style={{ width, height }}
      aria-label={`Preview ${title}`}
    >
      {/* Dacă nu este un tip “previewable”, rămâne doar placeholder-ul */}
      {isPreviewable ? (
        loading ? (
          <div className="w-full h-full animate-pulse bg-muted-foreground/10" />
        ) : error || !src ? (
          <div className="text-xs text-muted-foreground px-2 text-center">no preview</div>
        ) : (
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        )
      ) : (
        <div className="text-xs text-muted-foreground px-2 text-center">no preview</div>
      )}
    </div>
  );
}
