import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

export async function GET() {
  try {
    const videosCol = collection(db, 'videos');
    const videoSnapshot = await getDocs(videosCol);
    const videoList = videoSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ videos: videoList });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { videoId, isSabado } = await request.json();
    if (!videoId) {
      return NextResponse.json({ message: 'Se requiere ID de video' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'Falta clave de API de YouTube' }, { status: 500 });
    }

    // 1. Verificar si ya existe en Firestore para evitar duplicados
    const videosCol = collection(db, 'videos');
    const q = query(videosCol, where("youtubeId", "==", videoId));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      return NextResponse.json({ message: 'El video ya está en la lista blanca' }, { status: 400 });
    }

    // 2. Llamada a la API de YouTube Data v3
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const ytData = await ytResponse.json();

    if (ytData.error) {
       return NextResponse.json({ message: `Error YouTube API: ${ytData.error.message}` }, { status: 400 });
    }

    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({ message: 'Video no encontrado en YouTube' }, { status: 404 });
    }

    // 3. Preparar datos y guardar en Firestore (incluyendo clasificación de Sábado)
    const snippet = ytData.items[0].snippet;
    const newVideo = {
      youtubeId: videoId,
      title: snippet.title,
      channel: snippet.channelTitle,
      thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      isSabado: isSabado === true, // clasificación para Modo Sábado
      addedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(videosCol, newVideo);

    return NextResponse.json({ message: 'Video agregado correctamente', id: docRef.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID no proporcionado' }, { status: 400 });
    }

    await deleteDoc(doc(db, 'videos', id));

    return NextResponse.json({ message: 'Video eliminado de la base de datos' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
