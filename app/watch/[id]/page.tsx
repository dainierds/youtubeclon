"use client";

import { useEffect, useRef, useState, use, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import YouTube from 'react-youtube';

function WatchContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef<any>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [seekFeedback, setSeekFeedback] = useState<string | null>(null);
  const seekFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queue support
  const queueParam = searchParams.get('queue');
  const queueIndex = parseInt(searchParams.get('qi') || '0', 10);
  const queue: string[] = queueParam ? queueParam.split(',') : [];
  const hasNext = queue.length > 0 && queueIndex < queue.length - 1;
  const hasPrev = queue.length > 0 && queueIndex > 0;

  const goToNext = useCallback(() => {
    if (!hasNext) { router.back(); return; }
    router.push(`/watch/${queue[queueIndex + 1]}?queue=${queueParam}&qi=${queueIndex + 1}`);
  }, [hasNext, queue, queueIndex, queueParam, router]);

  const goToPrev = useCallback(() => {
    if (!hasPrev) return;
    router.push(`/watch/${queue[queueIndex - 1]}?queue=${queueParam}&qi=${queueIndex - 1}`);
  }, [hasPrev, queue, queueIndex, queueParam, router]);

  const showSeekFeedback = (msg: string) => {
    setSeekFeedback(msg);
    if (seekFeedbackTimer.current) clearTimeout(seekFeedbackTimer.current);
    seekFeedbackTimer.current = setTimeout(() => setSeekFeedback(null), 900);
  };

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const seek = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    const current = player.getCurrentTime();
    player.seekTo(current + seconds, true);
    showSeekFeedback(seconds > 0 ? `+${seconds}s ▶▶` : `${seconds}s ◀◀`);
    revealControls();
  }, [revealControls]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState();
    if (state === 1) { player.pauseVideo(); setIsPlaying(false); }
    else { player.playVideo(); setIsPlaying(true); }
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (seekFeedbackTimer.current) clearTimeout(seekFeedbackTimer.current);
    };
  }, [revealControls]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Back button
      if (['Backspace', 'Escape', 'BrowserBack', 'GoBack'].includes(e.key)) {
        e.preventDefault();
        router.back();
        return;
      }

      // Seek forward
      if (['ArrowRight', 'MediaFastForward', 'FastForward'].includes(e.key)) {
        e.preventDefault();
        seek(10);
        return;
      }

      // Seek back
      if (['ArrowLeft', 'MediaRewind', 'Rewind'].includes(e.key)) {
        e.preventDefault();
        seek(-10);
        return;
      }

      // Play/Pause
      if (['Enter', ' ', 'MediaPlayPause', 'MediaPlay', 'MediaPause'].includes(e.key)) {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Next video
      if (e.key === 'MediaTrackNext' || (e.key === 'ArrowDown' && hasNext)) {
        e.preventDefault();
        goToNext();
        return;
      }

      // Prev video
      if (e.key === 'MediaTrackPrevious' || (e.key === 'ArrowUp' && hasPrev)) {
        e.preventDefault();
        goToPrev();
        return;
      }

      revealControls();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, seek, togglePlay, goToNext, goToPrev, hasNext, hasPrev, revealControls]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Custom controls
      modestbranding: 1,
      rel: 0,
      fs: 0,
      disablekb: 1, // We handle keyboard ourselves
    },
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative', cursor: showControls ? 'default' : 'none' }}
      onMouseMove={revealControls}
      onClick={togglePlay}
    >
      {/* YouTube Player */}
      <YouTube
        videoId={id}
        opts={opts}
        onReady={e => {
          playerRef.current = e.target;
          e.target.playVideo();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnd={goToNext}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      />

      {/* Seek Feedback OSD */}
      {seekFeedback && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)', color: 'white',
          fontSize: '2rem', fontWeight: 700,
          padding: '20px 40px', borderRadius: '16px',
          pointerEvents: 'none', zIndex: 60,
          backdropFilter: 'blur(10px)',
          animation: 'fadeInOut 0.9s ease',
        }}>
          {seekFeedback}
        </div>
      )}

      {/* Controls Overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 35%, rgba(0,0,0,0.5) 100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '28px 40px' }}>
          <button onClick={e => { e.stopPropagation(); router.back(); }} style={topBtnStyle}>
            <svg fill="currentColor" width="22" height="22" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            {queue.length > 0 ? 'Salir de lista' : 'Volver'}
          </button>
          {queue.length > 0 && (
            <div style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.6)', color: '#ccc', padding: '10px 20px', borderRadius: '50px', fontSize: '0.95rem', backdropFilter: 'blur(6px)' }}>
              🎬 <strong style={{ color: '#fff' }}>{queueIndex + 1}</strong> / <strong style={{ color: '#fff' }}>{queue.length}</strong>
            </div>
          )}
        </div>

        {/* CENTER CONTROLS */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', alignItems: 'center', gap: 32,
        }}
          onClick={e => e.stopPropagation()}
        >
          {hasPrev && (
            <button onClick={goToPrev} style={centerBtnStyle} title="Video anterior">
              <svg fill="currentColor" width="32" height="32" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); seek(-10); }} style={centerBtnStyle} title="Retroceder 10s">
            <svg fill="currentColor" width="36" height="36" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="9.5" y="14.5" fontSize="5" fill="currentColor" fontWeight="bold">10</text></svg>
            <span style={{ fontSize: '0.75rem', marginTop: 4 }}>-10s</span>
          </button>
          <button onClick={e => { e.stopPropagation(); togglePlay(); }} style={{ ...centerBtnStyle, width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} title="Play/Pause">
            {isPlaying
              ? <svg fill="currentColor" width="40" height="40" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg fill="currentColor" width="40" height="40" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>
          <button onClick={e => { e.stopPropagation(); seek(10); }} style={centerBtnStyle} title="Adelantar 10s">
            <svg fill="currentColor" width="36" height="36" viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="9.5" y="14.5" fontSize="5" fill="currentColor" fontWeight="bold">10</text></svg>
            <span style={{ fontSize: '0.75rem', marginTop: 4 }}>+10s</span>
          </button>
          {hasNext && (
            <button onClick={goToNext} style={centerBtnStyle} title="Siguiente video">
              <svg fill="currentColor" width="32" height="32" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
            </button>
          )}
        </div>

        {/* BOTTOM: hint */}
        <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, color: '#aaa', fontSize: '0.9rem' }}>
          <span>◀▶ Saltar 10s</span>
          <span>⏎ Play/Pausa</span>
          {queue.length > 0 && <span>▲▼ Video anterior/siguiente</span>}
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const topBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(0,0,0,0.6)', color: 'white',
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '12px 22px', borderRadius: '50px',
  fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
  backdropFilter: 'blur(6px)', transition: 'background 0.2s',
};

const centerBtnStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  width: 60, height: 60,
  background: 'rgba(255,255,255,0.1)', color: 'white',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '50%', cursor: 'pointer',
  backdropFilter: 'blur(6px)',
  transition: 'background 0.2s, transform 0.15s',
  fontSize: '0.7rem',
};

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div style={{ background: '#000', width: '100vw', height: '100vh' }} />}>
      <WatchContent id={id} />
    </Suspense>
  );
}
