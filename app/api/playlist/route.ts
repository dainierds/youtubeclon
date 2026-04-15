import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { playlistId, isSabado } = await request.json();
    if (!playlistId) {
      return NextResponse.json({ message: 'Se requiere ID de lista' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'Falta clave de API de YouTube' }, { status: 500 });
    }

    // 1. Obtener datos de la propia lista de reproducción para el título
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
    );
    const playlistData = await playlistRes.json();
    if (playlistData.error) {
      return NextResponse.json({ message: `Error YouTube API: ${playlistData.error.message}` }, { status: 400 });
    }
    const playlistTitle = playlistData.items?.[0]?.snippet?.title || 'Lista sin nombre';

    // 2. Obtener todos los videos de la lista (hasta 50 por página, iterando con nextPageToken)
    let videoIds: string[] = [];
    let nextPageToken = '';
    do {
      const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const itemsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${pageParam}&key=${apiKey}`
      );
      const itemsData = await itemsRes.json();
      if (itemsData.error) break;
      const ids = (itemsData.items || [])
        .map((item: any) => item.snippet?.resourceId?.videoId)
        .filter(Boolean);
      videoIds.push(...ids);
      nextPageToken = itemsData.nextPageToken || '';
    } while (nextPageToken);

    if (videoIds.length === 0) {
      return NextResponse.json({ message: 'No se encontraron videos en la lista' }, { status: 404 });
    }

    // 3. Obtener metadatos de todos los videos (en lotes de 50)
    const videosCol = collection(db, 'videos');
    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50).join(',');
      const metaRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch}&key=${apiKey}`
      );
      const metaData = await metaRes.json();
      if (metaData.error || !metaData.items) continue;

      for (const item of metaData.items) {
        // Verificar si el video ya existe en Firestore
        const q = query(videosCol, where('youtubeId', '==', item.id));
        const existing = await getDocs(q);
        if (!existing.empty) { skippedCount++; continue; }

        const snippet = item.snippet;
        await addDoc(videosCol, {
          youtubeId: item.id,
          title: snippet.title,
          channel: snippet.channelTitle,
          thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
          isSabado: isSabado === true,
          playlistId,
          playlistTitle,
          addedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    return NextResponse.json({
      message: `✅ ${addedCount} videos agregados de "${playlistTitle}". ${skippedCount > 0 ? `(${skippedCount} ya existían)` : ''}`,
      added: addedCount,
      skipped: skippedCount,
      playlistTitle,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// GET: Preview de una playlist (cuántos videos tiene, su título) sin agregarlos aún
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('id');
    if (!playlistId) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`
    );
    const data = await playlistRes.json();
    if (data.error) return NextResponse.json({ message: data.error.message }, { status: 400 });
    if (!data.items?.length) return NextResponse.json({ message: 'Lista no encontrada' }, { status: 404 });

    const pl = data.items[0];
    return NextResponse.json({
      title: pl.snippet.title,
      channel: pl.snippet.channelTitle,
      thumbnail: pl.snippet.thumbnails?.high?.url,
      videoCount: pl.contentDetails.itemCount,
      playlistId,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
