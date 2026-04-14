"use client";

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // En la implementación real esto llamará a /api/videos (Firebase)
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      if (res.ok) {
        setVideos(data.videos || []);
      }
    } catch (e) {
      console.error('Error fetching videos:', e);
    }
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const videoId = extractYoutubeId(url);
    if (!videoId) {
      setError('Enlace de YouTube no válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al agregar el video');
      }

      setSuccess('Video agregado correctamente a la lista blanca.');
      setUrl('');
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este video de la lista blanca?')) return;
    
    try {
      const res = await fetch(`/api/videos?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchVideos();
      } else {
        const data = await res.json();
        setError(data.message || 'Error al eliminar el video');
      }
    } catch (e) {
      console.error('Error deleting:', e);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1>Panel de Administración</h1>
      </header>

      <main className={styles.mainPanel}>
        <section className={styles.card}>
          <h2>Agregar a Lista Blanca</h2>
          <form className={styles.formGroup} onSubmit={handleAddVideo}>
            <input 
              type="text" 
              placeholder="Pega el enlace de YouTube aquí..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={styles.input}
              disabled={loading}
              required
            />
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Agregando...' : 'Aprobar Video'}
            </button>
          </form>
          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}
        </section>

        <section className={styles.card}>
          <h2>Videos Aprobados</h2>
          {videos.length === 0 ? (
            <p style={{ color: '#aaa' }}>No hay videos en la lista blanca todavía.</p>
          ) : (
            <div className={styles.videoList}>
              {videos.map((video) => (
                <div key={video.id} className={styles.videoItem}>
                  <img src={video.thumbnailUrl} alt={video.title} className={styles.thumbnail} />
                  <div className={styles.videoInfo}>
                    <h3 className={styles.videoTitle}>{video.title}</h3>
                    <p className={styles.videoChannel}>{video.channel}</p>
                  </div>
                  <button onClick={() => handleDelete(video.id)} className={styles.deleteBtn}>
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
