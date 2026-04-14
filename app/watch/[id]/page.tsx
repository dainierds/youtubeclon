"use client";

import { useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import YouTube from 'react-youtube';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Las TVs utilizan estos mapeos al botón de "Atras/Back" del control remoto
      const exitKeys = ['Backspace', 'Escape', 'BrowserBack'];
      if(exitKeys.includes(e.key)) {
        router.back();
        return;
      }

      // Controles basicos de reproduccion usando el boton central
      if (e.key === 'Enter' || e.key === 'MediaPlayPause') {
        const player = playerRef.current;
        if (player) {
           player.getPlayerState().then((state: number) => {
             if (state === 1) player.pauseVideo();  // Si reproduce, pausa
             else player.playVideo();               // Si pausa, reproduce
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
      controls: 1, // Controles habilitados para usar con mouse
      modestbranding: 1,
      rel: 0,
      fs: 0
    },
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      
      {/* Botón Flotante para ir atrás (Aparece sobre el reproductor) */}
      <button 
        onClick={() => router.back()}
        style={{
          position: 'absolute',
          top: '30px',
          left: '40px',
          zIndex: 50,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(5px)',
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.8)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
      >
        <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Volver a Biblioteca
      </button>

      <YouTube 
        videoId={id} 
        opts={opts} 
        onReady={(e) => { playerRef.current = e.target; }}
        onEnd={() => router.back()} 
        style={{ width: '100%', height: '100%' }} // Permitir interacciones en mouse
      />
    </div>
  );
}
