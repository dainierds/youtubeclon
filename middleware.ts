import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request,
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Obtener la sesión del usuario
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Rutas públicas que no requieren autenticación
  const isPublicRoute = url.pathname === '/login' || url.pathname === '/';

  // 1. Si el usuario NO está autenticado
  if (!user) {
    // Si NO está en una ruta pública, redirigir a /login
    if (!isPublicRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Si ya está en una ruta pública, permitir el acceso libre
    return response;
  }

  // 2. Si el usuario SÍ está autenticado
  if (user) {
    // Consultar el perfil del usuario utilizando la conexión
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Si hay sesión activa pero NO existe perfil en la base de datos (cookie vieja/invalida)
    // Forzamos el cierre de sesión para limpiar las cookies locales del navegador
    if (profileError || !profile) {
      await supabase.auth.signOut();
      if (url.pathname !== '/login') {
        url.pathname = '/login';
        const redirectResponse = NextResponse.redirect(url);
        // Limpiamos de forma explícita las cookies de sesión vieja
        redirectResponse.cookies.delete('sb-access-token');
        redirectResponse.cookies.delete('sb-refresh-token');
        return redirectResponse;
      }
      return response;
    }

    const role = profile.role;

    // Si está autenticado e intenta ir a /login o a la raíz /, redirigir a su dashboard correspondiente
    if (isPublicRoute) {
      if (role === 'super_admin') {
        url.pathname = '/admin';
      } else if (role === 'company_admin') {
        url.pathname = '/empresa';
      } else if (role === 'creator') {
        url.pathname = '/creador';
      } else {
        url.pathname = '/simulador';
      }
      return NextResponse.redirect(url);
    }

    // Proteger rutas según el rol
    if (url.pathname.startsWith('/admin') && role !== 'super_admin') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith('/empresa') && role !== 'company_admin') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith('/creador') && role !== 'creator') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith('/simulador') && role !== 'technician') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (archivo de icono)
     * - archivos con extensiones comunes (png, jpg, svg, js, css, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff|woff2|ttf|eot)).*)',
  ],
};
