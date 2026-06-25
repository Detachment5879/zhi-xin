'use client';

import { useEffect, useRef, useState } from 'react';

interface MindMapViewerProps {
  content: string;
}

export default function MindMapViewer({ content }: MindMapViewerProps) {
  const refSvg = useRef<SVGSVGElement>(null);
  const refMm = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    
    async function render() {
      try {
        const { Transformer } = await import('markmap-lib');
        const { Markmap } = await import('markmap-view');

        const transformer = new Transformer();
        const { root } = transformer.transform(content);

        if (!cancelled && refSvg.current) {
          refSvg.current.innerHTML = '';
          const mm = Markmap.create(refSvg.current, {
            autoFit: true,
            colorFreezeLevel: 2,
            duration: 500,
            maxWidth: 300,
            paddingX: 16,
            spacingVertical: 8,
            spacingHorizontal: 80,
          }, root);
          refMm.current = mm;
          setReady(true);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || '渲染失败');
      }
    }

    render();
    return () => { cancelled = true; };
  }, [content]);

  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>;

  return (
    <div className="w-full rounded-xl overflow-hidden bg-slate-50" style={{ minHeight: 400 }}>
      <svg ref={refSvg} className="w-full" style={{ height: 500 }} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
