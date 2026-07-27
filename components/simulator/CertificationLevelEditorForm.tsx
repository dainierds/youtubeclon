"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { saveCertificationLevelAction } from '@/app/admin/certificaciones/actions';

export default function CertificationLevelEditorForm({
  level,
  scenarios,
  associatedScenarios,
}: {
  level: any | null; // null si es nuevo
  scenarios: any[];
  associatedScenarios: any[];
}) {
  const [levelNumber, setLevelNumber] = useState<number>(level?.level_number || 1);
  const [title, setTitle] = useState(level?.title || '');
  const [description, setDescription] = useState(level?.description || '');
  const [timeLimit, setTimeLimit] = useState<number>(level?.time_limit_minutes || 60);
  const [passingScore, setPassingScore] = useState<number>(level?.passing_score_percent || 80);
  
  // Lista ordenada de escenarios asignados
  const [selectedScenarios, setSelectedScenarios] = useState<any[]>(
    associatedScenarios.sort((a, b) => a.order_index - b.order_index).map((s) => s.scenario_id) || []
  );

  const handleToggleScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter((sid) => sid !== id));
    } else {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedScenarios];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setSelectedScenarios(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedScenarios.length - 1) return;
    const newOrder = [...selectedScenarios];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setSelectedScenarios(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScenarios.length === 0) {
      alert('Debes seleccionar al menos un escenario para este nivel.');
      return;
    }

    const formData = new FormData();
    if (level?.id) {
      formData.append('id', level.id);
    }
    formData.append('level_number', levelNumber.toString());
    formData.append('title', title);
    formData.append('description', description);
    formData.append('time_limit_minutes', timeLimit.toString());
    formData.append('passing_score_percent', passingScore.toString());
    formData.append('scenariosJson', JSON.stringify(selectedScenarios));

    try {
      await saveCertificationLevelAction(formData);
    } catch (err: any) {
      if (!err.message?.includes('NEXT_REDIRECT')) {
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  const getScenarioTitle = (id: string) => {
    return scenarios.find((s) => s.id === id)?.title || 'Escenario Desconocido';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/certificaciones" className="text-xs text-slate-400 hover:text-white transition">
            &larr; Volver a Certificaciones
          </Link>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            {level ? 'Editar Nivel de Certificación' : 'Nuevo Nivel de Certificación'}
          </h1>
          <p className="text-sm text-slate-400">Configura los parámetros del examen y los escenarios que componen la evaluación.</p>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-lg"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario Izquierdo */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4 h-fit">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Configuración Básica</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Número de Nivel</label>
              <input
                type="number"
                required
                min={1}
                value={levelNumber}
                onChange={(e) => setLevelNumber(parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs placeholder-slate-500"
                placeholder="Ej: 1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Título</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs placeholder-slate-500"
                placeholder="Ej: Cableado PACS Básico"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs placeholder-slate-500"
                placeholder="Detalla qué habilidades evalúa este examen..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Tiempo Límite (min)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Aprobación (%)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel Selección Escenarios */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Listado disponible */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Escenarios Disponibles</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {scenarios.map((s) => {
                const isChecked = selectedScenarios.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer bg-slate-950/45 transition">
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-white">{s.title}</span>
                      <span className="block text-[10px] text-slate-500 font-mono capitalize">{s.type} - Lvl {s.difficulty_level}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleScenario(s.id)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Listado asignado y orden */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Orden de Examen</h3>
            
            {selectedScenarios.length > 0 ? (
              <div className="space-y-2">
                {selectedScenarios.map((sid, idx) => (
                  <div key={sid} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
                    <div className="space-y-0.5">
                      <span className="block text-[10px] text-blue-400 font-mono font-bold">Paso {idx + 1}</span>
                      <span className="block text-xs font-semibold text-white max-w-[140px] truncate">{getScenarioTitle(sid)}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-800 disabled:opacity-35 text-slate-300 text-xs rounded transition"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === selectedScenarios.length - 1}
                        className="p-1 hover:bg-slate-800 disabled:opacity-35 text-slate-300 text-xs rounded transition"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500 font-medium">
                Selecciona escenarios de la lista para agregarlos al orden del examen.
              </div>
            )}
          </div>

        </div>
      </div>
    </form>
  );
}
