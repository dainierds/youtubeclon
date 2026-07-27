"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import SimulatorCanvas from '@/components/simulator/SimulatorCanvas';
import { saveAttemptAction } from '@/app/simulador/actions';

export default function SimulatorSessionWrapper({
  userId,
  scenario,
}: {
  userId: string;
  scenario: any | null; // null si es sandbox
}) {
  const { nodes, edges, validationResult, validateCircuit } = useSimulatorStore();
  
  const [submitting, setSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isCorrectState, setIsCorrectState] = useState(false);
  const [errorMessageList, setErrorMessageList] = useState<string[]>([]);
  
  // Guardar tiempo de inicio
  const startTimeRef = useRef<number>(Date.now());

  // Determinar nodos del hardware config
  const initialNodes = scenario?.hardware_config?.nodes || [];
  
  // Soporte para cableado inicial (Inyección de fallas en modo Diagnóstico)
  const initialEdges = scenario?.hardware_config?.initial_wiring || 
                       scenario?.fault_injection?.wiring || [];

  const validationRules = scenario?.correct_wiring ? { correctWiring: scenario.correct_wiring } : undefined;

  const handleVerifyAndFinalize = async () => {
    // 1. Ejecutar validación interna en el store
    validateCircuit();
  };

  // Observar cambios en el resultado de validación para gatillar el guardado
  useEffect(() => {
    if (!validationResult) return;

    const executeSave = async () => {
      setSubmitting(true);
      
      const timeSpent = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const isCorrect = validationResult.isValid;
      const errors = validationResult.errors || [];
      
      setIsCorrectState(isCorrect);
      setErrorMessageList(errors.map((e) => e.message));

      try {
        // Solo guardar en base de datos si hay un escenario real asignado
        if (scenario?.id) {
          await saveAttemptAction(
            userId,
            scenario.id,
            { nodes, edges },
            isCorrect,
            errors,
            timeSpent
          );
        }
        setShowResultModal(true);
      } catch (err) {
        console.error('Error al guardar intento:', err);
        alert('Ocurrió un error al guardar tu práctica en el servidor.');
      } finally {
        setSubmitting(false);
      }
    };

    executeSave();
  }, [validationResult]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col justify-center items-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link href="/simulador" className="text-xs text-slate-400 hover:text-white transition">
              &larr; Volver al Panel
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">
              {scenario ? scenario.title : 'Práctica Libre (Sandbox)'}
            </h1>
            <p className="text-xs text-slate-400">
              {scenario ? `Tipo: ${scenario.type} - Sigue el plano y conecta los terminales.` : 'Modo libre para realizar simulaciones de cableado.'}
            </p>
          </div>

          <button
            onClick={handleVerifyAndFinalize}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-55 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition"
          >
            {submitting ? 'Guardando...' : 'Verificar y Finalizar'}
          </button>
        </div>

        {/* Simulador */}
        <SimulatorCanvas
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          validationRules={validationRules}
        />

        {/* Modal de Feedback */}
        {showResultModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              
              <div className="flex justify-center">
                {isCorrectState ? (
                  <div className="w-16 h-16 bg-green-950 border border-green-800 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-950 border border-red-800 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {isCorrectState ? '¡Escenario Completado!' : 'Fallas en el Cableado'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isCorrectState 
                    ? 'El circuito se encuentra enlazado y energizado correctamente.' 
                    : 'Se detectaron los siguientes errores de conexión en el circuito:'}
                </p>
              </div>

              {!isCorrectState && errorMessageList.length > 0 && (
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-left max-h-40 overflow-y-auto space-y-2">
                  {errorMessageList.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-[11px] text-red-300">
                      <span className="text-red-500">•</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Corregir Circuitos
                </button>
                <Link
                  href="/simulador"
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg text-center transition"
                >
                  Volver al Panel
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
