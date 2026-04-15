"use client";

import { useState, useEffect, useMemo } from 'react';
import styles from './admin.module.css';

type Video = {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  isSabado?: boolean;
  playlistId?: string;
  playlistTitle?: string;
};

type PlaylistPreview = {
  title: string;
  channel: string;
  thumbnail: string;
  videoCount: number;
  playlistId: string;
};

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [isSabado, setIsSabado] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sabadoMode, setSabadoMode] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [playlistPreview, setPlaylistPreview] = useState<PlaylistPreview | null>(null);
  const [checkingPlaylist, setCheckingPlaylist] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVideos();
    fetchSettings();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      if (res.ok) setVideos(data.videos || []);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSabadoMode(!!data.sabadoMode);
    } catch (e) { console.error(e); }
  };

  const toggleSabadoMode = async () => {
    setSavingMode(true);
    const newValue = !sabadoMode;
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sabadoMode: newValue }),
      });
      setSabadoMode(newValue);
    } catch (e) { console.error(e); }
    finally { setSavingMode(false); }
  };

  // Parse any YouTube URL type
  const parseYoutubeUrl = (url: string) => {
    try {
      const u = new URL(url);
      const videoId = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null);
      const playlistId = u.searchParams.get('list');
      return { videoId, playlistId };
    } catch { return { videoId: null, playlistId: null }; }
  };

  // When URL changes, check if it's a playlist
  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);
    setPlaylistPreview(null);
    setError('');
    if (!newUrl.trim()) return;

    const { playlistId } = parseYoutubeUrl(newUrl);
    if (playlistId) {
      setCheckingPlaylist(true);
      try {
        const res = await fetch(`/api/playlist?id=${playlistId}`);
        const data = await res.json();
        if (res.ok) setPlaylistPreview(data);
        else setError(data.message);
      } catch (e) { console.error(e); }
      finally { setCheckingPlaylist(false); }
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const { videoId } = parseYoutubeUrl(url);
    if (!videoId) { setError('Enlace de YouTube no válido. Usa un enlace como: https://www.youtube.com/watch?v=...'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, isSabado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(`Video agregado${isSabado ? ' (🕊️ Sábado)' : ''}.`);
      setUrl(''); setIsSabado(false); setPlaylistPreview(null);
      fetchVideos();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleImportPlaylist = async () => {
    if (!playlistPreview) return;
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlistPreview.playlistId, isSabado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setUrl(''); setIsSabado(false); setPlaylistPreview(null);
      fetchVideos();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este video de la lista blanca?')) return;
    try {
      const res = await fetch(`/api/videos?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchVideos();
      else { const d = await res.json(); setError(d.message); }
    } catch (e) { console.error(e); }
  };

  // Group videos by playlistTitle or channel
  const groupedVideos = useMemo(() => {
    const filtered = videos.filter(v =>
      v.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      v.channel.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (v.playlistTitle || '').toLowerCase().includes(adminSearch.toLowerCase())
    );
    return filtered.reduce((acc, video) => {
      const key = video.playlistTitle || video.channel || 'Sin grupo';
      if (!acc[key]) acc[key] = [];
      acc[key].push(video);
      return acc;
    }, {} as Record<string, Video[]>);
  }, [videos, adminSearch]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1>Panel de Administración</h1>
      </header>

      <main className={styles.mainPanel}>

        {/* MODO SÁBADO */}
        <section className={`${styles.card} ${styles.sabadoCard}`}>
          <div className={styles.sabadoHeader}>
            <div>
              <h2>🕊️ Modo Sábado</h2>
              <p className={styles.sabadoDesc}>Cuando está activo, la TV solo muestra los videos clasificados como aptos para el Sábado.</p>
            </div>
            <button
              className={`${styles.sabadoToggle} ${sabadoMode ? styles.sabadoOn : styles.sabadoOff}`}
              onClick={toggleSabadoMode} disabled={savingMode}
            >
              {savingMode ? '...' : sabadoMode ? '✅ ACTIVO' : '⭕ INACTIVO'}
            </button>
          </div>
        </section>

        {/* AGREGAR VIDEO / PLAYLIST */}
        <section className={styles.card}>
          <h2>Agregar a Lista Blanca</h2>
          <form className={styles.formGroup} onSubmit={handleAddVideo}>
            <input
              type="text"
              placeholder="Pega el enlace de YouTube (video o lista de reproducción)..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
            {!playlistPreview && (
              <button type="submit" className={styles.button} disabled={loading || !url.trim()}>
                {loading ? 'Agregando...' : 'Aprobar Video'}
              </button>
            )}
          </form>

          {/* PLAYLIST PREVIEW CARD */}
          {checkingPlaylist && <p className={styles.checkingMsg}>🔍 Analizando lista de reproducción...</p>}
          {playlistPreview && !checkingPlaylist && (
            <div className={styles.playlistPreview}>
              {playlistPreview.thumbnail && (
                <img src={playlistPreview.thumbnail} alt={playlistPreview.title} className={styles.playlistThumb} />
              )}
              <div className={styles.playlistInfo}>
                <h3>📋 Lista detectada</h3>
                <p className={styles.playlistTitle}>{playlistPreview.title}</p>
                <p className={styles.playlistMeta}>{playlistPreview.channel} · {playlistPreview.videoCount} videos</p>
              </div>
              <div className={styles.playlistActions}>
                <button className={styles.button} onClick={handleImportPlaylist} disabled={loading}>
                  {loading ? 'Importando...' : `⬇️ Importar ${playlistPreview.videoCount} videos`}
                </button>
                <button className={styles.cancelBtn} onClick={() => { setPlaylistPreview(null); setUrl(''); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Checkbox Sábado */}
          <label className={styles.sabadoCheck}>
            <input type="checkbox" checked={isSabado} onChange={(e) => setIsSabado(e.target.checked)} />
            <span>🕊️ Este video/lista es apto para el <strong>Sábado</strong></span>
          </label>

          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}
        </section>

        {/* VIDEOS AGRUPADOS */}
        <section className={styles.card}>
          <div className={styles.videosHeader}>
            <h2>Videos Aprobados <span className={styles.videosCount}>({videos.length})</span></h2>
            <input
              type="text"
              placeholder="🔍 Buscar por título, canal o lista..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className={styles.adminSearchInput}
            />
          </div>

          {videos.length === 0 ? (
            <p style={{ color: '#aaa' }}>No hay videos en la lista blanca todavía.</p>
          ) : Object.keys(groupedVideos).length === 0 ? (
            <p style={{ color: '#aaa' }}>No se encontraron resultados para "{adminSearch}".</p>
          ) : (
            <div className={styles.groups}>
              {Object.entries(groupedVideos).map(([groupName, groupVideos]) => {
                const isOpen = expandedGroups.has(groupName);
                return (
                  <div key={groupName} className={styles.group}>
                    <button className={styles.groupHeader} onClick={() => toggleGroup(groupName)}>
                      <span className={styles.groupArrow}>{isOpen ? '▼' : '▶'}</span>
                      <span className={styles.groupName}>{groupName}</span>
                      <span className={styles.groupCount}>{groupVideos.length} video{groupVideos.length !== 1 ? 's' : ''}</span>
                      {groupVideos.some(v => v.isSabado) && <span className={styles.sabadoBadge}>🕊️ Sábado</span>}
                    </button>
                    {isOpen && (
                      <div className={styles.videoList}>
                        {groupVideos.map((video) => (
                          <div key={video.id} className={styles.videoItem}>
                            <img src={video.thumbnailUrl} alt={video.title} className={styles.thumbnail} />
                            <div className={styles.videoInfo}>
                              <h3 className={styles.videoTitle}>{video.title}</h3>
                              <p className={styles.videoChannel}>{video.channel}</p>
                            </div>
                            {video.isSabado && <span className={styles.sabadoBadge}>🕊️</span>}
                            <button onClick={() => handleDelete(video.id)} className={styles.deleteBtn}>Eliminar</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
