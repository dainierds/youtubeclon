"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Consultar el rol del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role;
        if (role === 'super_admin') {
          router.push('/admin');
        } else if (role === 'company_admin') {
          router.push('/empresa');
        } else if (role === 'creator') {
          router.push('/creador');
        } else {
          router.push('/simulador');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 transition-colors duration-300 ${
      darkMode 
        ? 'bg-slate-950 text-slate-100 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.15)_0%,rgba(15,23,42,0.95)_100%)]' 
        : 'bg-slate-50 text-slate-900 bg-[radial-gradient(circle_at_center,rgba(241,245,249,0.5)_0%,rgba(226,232,240,0.8)_100%)]'
    }`}>
      
      {/* Tarjeta de login */}
      <div className={`w-full max-w-[440px] rounded-2xl p-10 shadow-2xl transition-all duration-300 border ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800' 
          : 'bg-white border-slate-150'
      }`}>
        
        {/* Shield Icon Badge */}
        <div className="flex justify-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            darkMode ? 'bg-blue-950/70 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <Shield className="w-8 h-8" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight">AccessTech Simulator</h2>
          <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-405' : 'text-slate-500'}`}>
            Training Platform
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-xs text-red-200 mb-6">
            {errorMsg}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          
          {/* Email input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className={`flex items-center gap-1.5 text-xs font-bold ${
              darkMode ? 'text-slate-350' : 'text-slate-700'
            }`}>
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </label>
            <input
              id="email"
              type="email"
              required
              className={`block w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                darkMode 
                  ? 'border border-slate-700 bg-slate-800 text-white placeholder-slate-500' 
                  : 'border border-blue-100 bg-blue-50/40 text-slate-900 placeholder-slate-400'
              }`}
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className={`flex items-center gap-1.5 text-xs font-bold ${
              darkMode ? 'text-slate-350' : 'text-slate-700'
            }`}>
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`block w-full rounded-xl pl-4 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  darkMode 
                    ? 'border border-slate-700 bg-slate-800 text-white placeholder-slate-500' 
                    : 'border border-blue-100 bg-blue-50/40 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition ${
                  darkMode ? 'hover:text-white' : ''
                }`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
              />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Remember me for 30 days</span>
            </label>
            <a 
              href="#forgot" 
              onClick={(e) => {
                e.preventDefault();
                alert('Funcionalidad de recuperación (Fase futura).');
              }}
              className="font-bold text-blue-600 hover:text-blue-500 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm py-3.5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition duration-250 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Cargando...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-slate-500">
            Don't have access?{' '}
            <a 
              href="mailto:support@accesstech.com?subject=Solicitud de acceso simulador" 
              className="font-bold text-blue-600 hover:text-blue-500 hover:underline"
            >
              Request access
            </a>
          </p>
          
          <div className="text-[10px] text-slate-450/70 font-mono tracking-wide uppercase">
            Secure system with SSL encryption
          </div>
        </div>

      </div>

      {/* Dark/Light mode selector flotante */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed bottom-6 right-6 p-3 rounded-full border shadow-xl transition-all duration-300 hover:scale-115 ${
          darkMode 
            ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
        aria-label="Toggle Theme"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

    </div>
  );
}

