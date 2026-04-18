"use client";

import { useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import YouTube from 'react-youtube';
import { Suspense } from 'react';

function WatchContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef<any>(null);

  // Cola de reproducción
  const queueParam = searchParams.get('queue');
  const queueIndex = parseInt(searchParams.get('qi') || '0', 10);
  const queue: string[] = queueParam ? queueParam.split(',') : [];
  const hasNext = queue.length > 0 && queueIndex < queue.length - 1;
  const hasPrev = queue.length > 0 && queueIndex > 0;

  const goToNext = () => {
    if (!hasNext) { router.back(); return; }
    const nextId = queue[queueIndex + 1];
    router.push(`/watch/${nextId}?queue=${queueParam}&qi=${queueIndex + 1}`);
  };

  const goToPrev = () => {
    if (!hasPrev) return;
    const prevId = queue[queueIndex - 1];
    router.push(`/watch/${prevId}?queue=${queueParam}&qi=${queueIndex - 1}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const exitKeys = ['Backspace', 'Escape', 'BrowserBack'];
      if (exitKeys.includes(e.key)) { router.back(); return; }
      if (e.key === 'Enter' || e.key === 'MediaPlayPause') {
        const player = playerRef.current;
        if (player) {
          player.getPlayerState().then((state: number) => {
            if (state === 1) player.pauseVideo();
            else player.playVideo();
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      fs: 0,
    },
  };

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    background: 'rgba(0,0,0,0.75)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '12px 22px',
    borderRadius: '50px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backdropFilter: 'blur(6px)',
    transition: 'background 0.2s, transform 0.2s',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>

      {/* Botón Volver */}
      <button
        onClick={() => router.back()}
        style={{ ...btnStyle, top: '30px', left: '40px' }}
        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,0,0,0.85)')}
        onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.75)')}
      >
        <svg fill="currentColor" width="18" height="18" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        {queue.length > 0 ? 'Salir de la lista' : 'Volver a Biblioteca'}
      </button>

      {/* Contador de posición en la cola */}
      {queue.length > 0 && (
        <div style={{
          position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, background: 'rgba(0,0,0,0.75)', color: '#aaa',
          padding: '12px 24px', borderRadius: '50px', fontSize: '0.95rem',
          backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          🎬 Video <strong style={{ color: '#fff' }}>{queueIndex + 1}</strong> de <strong style={{ color: '#fff' }}>{queue.length}</strong>
        </div>
      )}

      {/* Botón Video Anterior */}
      {hasPrev && (
        <button
          onClick={goToPrev}
          style={{ ...btnStyle, bottom: '40px', left: '40px' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.75)')}
        >
          <svg fill="currentColor" width="18" height="18" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          Anterior
        </button>
      )}

      {/* Botón Siguiente Video */}
      {hasNext && (
        <button
          onClick={goToNext}
          style={{ ...btnStyle, bottom: '40px', right: '40px' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,0,0,0.85)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.75)')}
        >
          Siguiente
          <svg fill="currentColor" width="18" height="18" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
        </button>
      )}

      <YouTube
        videoId={id}
        opts={opts}
        onReady={e => { playerRef.current = e.target; }}
        onEnd={goToNext}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div style={{ background: '#000', width: '100vw', height: '100vh' }} />}>
      <WatchContent id={id} />
    </Suspense>
  );
}
