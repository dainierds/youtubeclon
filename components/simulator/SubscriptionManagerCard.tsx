"use client";

import React, { useState } from 'react';
import { PLANS } from '@/lib/stripe/plans';

export default function SubscriptionManagerCard({
  plan,
  status,
  isCompany,
  hasSubscription,
}: {
  plan: string;
  status: string;
  isCompany: boolean;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, isCompany }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Ocurrió un error al crear la sesión de cobro.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en conexión con pasarela de cobros.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompany }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Ocurrió un error al cargar el portal de facturación.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en conexión con el portal de facturación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Suscripción y Facturación</h3>
          <p className="text-xs text-slate-400">Administra los métodos de pago y asientos del plan corporativo.</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider ${
          status === 'active' || status === 'trialing'
            ? 'bg-green-950/60 border border-green-800 text-green-300'
            : 'bg-red-950/60 border border-red-800 text-red-300'
        }`}>
          {status || 'Borrador / Trial'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/45 p-4 rounded-xl border border-slate-850">
        <div>
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Plan Actual</span>
          <span className="text-base font-bold text-white capitalize">{plan}</span>
        </div>
        
        {hasSubscription ? (
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-lg border border-slate-750 transition"
          >
            {loading ? 'Cargando...' : 'Gestionar Facturación (Stripe)'}
          </button>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {Object.values(PLANS)
              .filter((p) => p.target === (isCompany ? 'company' : 'individual') && p.priceId !== null)
              .map((planOption) => (
                <button
                  key={planOption.id}
                  onClick={() => handleCheckout(planOption.priceId!)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                >
                  {loading ? 'Cargando...' : `Suscribir a ${planOption.label}`}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
