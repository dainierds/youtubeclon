import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// GET: returns the current app settings
export async function GET() {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
    if (!settingsDoc.exists()) {
      return NextResponse.json({ sabadoMode: false });
    }
    return NextResponse.json(settingsDoc.data());
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST: update a setting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settingsRef = doc(db, 'settings', 'app');
    await setDoc(settingsRef, body, { merge: true });
    return NextResponse.json({ message: 'Configuración guardada', ...body });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
