import { NextResponse } from 'next/server';

// Estructura de placeholder, porque falta inicializar Firebase Admin con credenciales
// let db: any = null; // import db from firebase-admin ...

// Endpoint temporal para manejar datos en memoria mientras se configura Firebase
let temporaryWhitelist: any[] = [];

export async function GET() {
  try {
    // Cuando esté Firebase:
    // const snapshot = await db.collection('videos').get();
    // const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ videos: temporaryWhitelist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();
    if (!videoId) {
      return NextResponse.json({ message: 'Se requiere ID de video' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'Falta clave de API de YouTube' }, { status: 500 });
    }

    // Llamada a la API de YouTube Data v3
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const ytData = await ytResponse.json();

    // Debuggear exactamente qué devuelve Google en caso de no estar habilitado:
    if (ytData.error) {
       return NextResponse.json({ message: `Error YouTube API: ${ytData.error.message}` }, { status: 400 });
    }

    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({ message: 'Video de YouTube no encontrado en la API' }, { status: 404 });
    }

    const snippet = ytData.items[0].snippet;
    const newVideo = {
      id: videoId, // Firebase ID o YouTube ID (Usaremos el de YT para simplificar ahora)
      youtubeId: videoId,
      title: snippet.title,
      channel: snippet.channelTitle,
      thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      addedAt: new Date().toISOString(),
    };

    // Verificar si ya existe
    const exists = temporaryWhitelist.find(v => v.youtubeId === videoId);
    if (!exists) {
      temporaryWhitelist.push(newVideo);
    } else {
      return NextResponse.json({ message: 'El video ya está en la lista blanca' }, { status: 400 });
    }

    // Cuando esté Firebase:
    // await db.collection('videos').doc(videoId).set(newVideo);

    return NextResponse.json({ message: 'Video agregado', video: newVideo }, { status: 201 });
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

    // Cuando esté Firebase:
    // await db.collection('videos').doc(id).delete();
    
    temporaryWhitelist = temporaryWhitelist.filter(v => v.id !== id);

    return NextResponse.json({ message: 'Video eliminado' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
