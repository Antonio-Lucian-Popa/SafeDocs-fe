import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { httpClient } from '@/api/http';
import { cn } from '@/lib/utils';

type Props = {
  documentId: string;
  title: string;
  mimeType?: string | null;
  /** Dacă vrei proporții fluide, pune className cu `aspect-[4/3]` și `w-full`,
   * iar width/height pot rămâne nefolosite. Dacă vrei dimensiuni fixe, folosește width/height. */
  width?: number;     // px (opțional)
  height?: number;    // px (opțional)
  className?: string; // ex: "w-full aspect-[4/3]"
  rounded?: string;   // ex: "rounded-md"
  fallbackIcon?: ReactNode; // ⇦ icon-ul afișat dacă nu există preview
};

export function Thumbnail({
  documentId,
  title,
  mimeType,
  width,
  height,
  className,
  rounded = 'rounded-md',
  fallbackIcon,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Lazy-load
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
      params: {
        // dacă nu dai width/height, backend-ul poate avea default; altfel le trimitem
        ...(width ? { w: width } : {}),
        ...(height ? { h: height } : {}),
      },
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

  const style = width || height ? { width: width ?? 'auto', height: height ?? 'auto' } : undefined;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted flex items-center justify-center', rounded, className)}
      style={style}
      aria-label={`Preview ${title}`}
    >
      {isPreviewable ? (
        loading ? (
          <div className="w-full h-full animate-pulse bg-muted-foreground/10" />
        ) : error || !src ? (
          <div className="w-full h-full flex items-center justify-center">
            {fallbackIcon ?? <div className="text-xs text-muted-foreground px-2 text-center">no preview</div>}
          </div>
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
        <div className="w-full h-full flex items-center justify-center">
          {fallbackIcon ?? <div className="text-xs text-muted-foreground px-2 text-center">no preview</div>}
        </div>
      )}
    </div>
  );
}
