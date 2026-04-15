"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';

export default function TVHome() {
  const [videos, setVideos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sabadoMode, setSabadoMode] = useState(false);
  const { focusedId } = useSpatialNavigation();
  const router = useRouter();

  // Filter by sabadoMode first, then by search
  const modeFiltered = sabadoMode ? videos.filter(v => v.isSabado) : videos;
  const filteredVideos = modeFiltered.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.channel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close search with Back button
  useEffect(() => {
    if (!isSearchOpen) return;
    
    const handleBack = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleBack);
    return () => window.removeEventListener('keydown', handleBack);
  }, [isSearchOpen]);

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => { if (data && data.videos) setVideos(data.videos); })
      .catch(console.error);

    // Leer el Modo Sábado desde la base de datos
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSabadoMode(!!data.sabadoMode))
      .catch(console.error);
  }, []);

  const HomeIcon = () => (
    <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  );

  const SettingsIcon = () => (
    <svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
  );

  const SearchIcon = () => (
    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
  );

  return (
    <div className={`${styles.tvLayout} tv-root`}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#ff0000"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/></svg>
        </div>
        
        <button 
          id="btn-home"
          data-focusable="true"
          className={styles.iconButton}
          data-focused={focusedId === 'btn-home'}
          onClick={() => setIsSearchOpen(false)}
        >
          <HomeIcon />
        </button>

        <button 
          id="btn-search"
          data-focusable="true"
          className={styles.iconButton}
          data-focused={focusedId === 'btn-search'}
          onClick={() => setIsSearchOpen(true)}
        >
          <SearchIcon />
        </button>

        <button 
          id="btn-settings"
          data-focusable="true"
          className={styles.iconButton}
          data-focused={focusedId === 'btn-settings'}
          onClick={() => setIsSearchOpen(false)}
        >
          <SettingsIcon />
        </button>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.mainTitle}>
            <span className={styles.ytBadge}>TV</span> Clone
          </h1>
        </header>

        {isSearchOpen && (
          <div className={styles.searchOverlay}>
            <button
              className={styles.searchBackBtn}
              onClick={() => setIsSearchOpen(false)}
            >
              <svg fill="currentColor" width="22" height="22" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              Volver
            </button>
            <h2>Buscar videos</h2>
            <input
              id="search-input"
              data-focusable="true"
              type="text"
              autoFocus
              className={styles.overlayInput}
              data-focused={focusedId === 'search-input'}
              placeholder="Escribe el nombre del video..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <p className={styles.searchHint}>Presiona "Atrás" en tu control para cerrar</p>
          </div>
        )}

        <div className={styles.videoGrid}>
          {videos.length === 0 ? (
            <p style={{ color: '#aaa' }}>Cargando videos aprobados...</p>
          ) : filteredVideos.length === 0 ? (
            <p style={{ color: '#aaa' }}>No se encontraron videos para buscar: "{searchQuery}".</p>
          ) : filteredVideos.map((video) => (
            <div 
              key={video.id}
              id={`video-${video.id}`}
              data-focusable="true"
              className={styles.videoCard}
              data-focused={focusedId === `video-${video.id}`}
              onClick={() => router.push(`/watch/${video.youtubeId}`)}
            >
              <div className={styles.thumbnailWrapper}>
                <img src={video.thumbnailUrl} alt={video.title} className={styles.thumbnail} />
              </div>
              <div className={styles.videoInfo}>
                <h3>{video.title}</h3>
                <p>{video.channel}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
