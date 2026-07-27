"use client";

import React, { useState } from 'react';

export default function ConnectOnboardingButton() {
  const [loading, setLoading] = useState(false);

  const handleStartOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Ocurrió un error al iniciar onboarding de Stripe Connect.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con la pasarela de pagos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartOnboarding}
      disabled={loading}
      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition"
    >
      {loading ? 'Cargando...' : 'Configurar Cuenta de Cobros (Stripe Connect)'}
    </button>
  );
}
