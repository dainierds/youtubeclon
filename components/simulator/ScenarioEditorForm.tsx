"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import SimulatorCanvas from '@/components/simulator/SimulatorCanvas';
import { saveScenarioAction } from '@/app/admin/escenarios/actions';

export default function ScenarioEditorForm({
  scenario,
}: {
  scenario: any | null; // null si es nuevo
}) {
  const { nodes, edges, setMode, addNode, setInitialState } = useSimulatorStore();
  
  const [title, setTitle] = useState(scenario?.title || '');
  const [description, setDescription] = useState(scenario?.description || '');
  const [type, setType] = useState<string>(scenario?.type || 'guided');
  const [difficulty, setDifficulty] = useState<number>(scenario?.difficulty_level || 1);
  const [isPublished, setIsPublished] = useState<boolean>(scenario?.is_published || false);
  
  // Soporte para modo diagnóstico
  const [isFaultMode, setIsFaultMode] = useState(false);
  const [correctEdgesList, setCorrectEdgesList] = useState<any[]>([]);
  const [faultEdgesList, setFaultEdgesList] = useState<any[]>([]);

  // Activar modo edición en el store al montar
  useEffect(() => {
    setMode('edit');
    if (scenario) {
      const initNodes = scenario.hardware_config?.nodes || [];
      const initEdges = scenario.hardware_config?.initial_wiring || [];
      setInitialState(initNodes, initEdges);
    }
  }, [scenario]);

  const handleAddHardwareNode = (nodeType: 'powerSupply' | 'electricStrike') => {
    const id = `${nodeType === 'powerSupply' ? 'altronix' : 'hes5000'}-${Date.now()}`;
    addNode({
      id,
      type: nodeType,
      position: { x: 100 + nodes.length * 40, y: 150 },
      data: {},
    });
  };

  const handleToggleFaultInjectionMode = () => {
    if (!isFaultMode) {
      // Guardar el cableado correcto actual antes de mutar
      setCorrectEdgesList(edges);
      setIsFaultMode(true);
    } else {
      // Guardar el cableado con la falla inyectada y retornar al correcto
      setFaultEdgesList(edges);
      setInitialState(nodes, correctEdgesList);
      setIsFaultMode(false);
    }
  };

  const handleSubmitForm = async (publishedState: boolean) => {
    const nodesData = JSON.stringify(nodes);
    
    // Si estamos guardando en modo diagnóstico, el cableado correcto es el original
    const correctWiringData = JSON.stringify(isFaultMode ? correctEdgesList : edges);
    const faultWiringData = isFaultMode ? JSON.stringify(edges) : JSON.stringify(faultEdgesList);

    const formData = new FormData();
    if (scenario?.id) {
      formData.append('id', scenario.id);
    }
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('difficulty_level', difficulty.toString());
    formData.append('is_published', publishedState.toString());
    formData.append('nodesJson', nodesData);
    formData.append('edgesJson', correctWiringData);
    formData.append('faultWiringJson', faultWiringData);

    try {
      await saveScenarioAction(formData);
    } catch (err: any) {
      if (!err.message?.includes('NEXT_REDIRECT')) {
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/escenarios" className="text-xs text-slate-400 hover:text-white transition">
            &larr; Volver a Escenarios
          </Link>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            {scenario ? 'Editar Escenario' : 'Nuevo Escenario'}
          </h1>
          <p className="text-sm text-slate-400">Configura los componentes de hardware y las reglas lógicas del circuito.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Formulario lateral */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4 h-fit">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Parámetros</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Título</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs placeholder-slate-500 focus:border-blue-500"
                placeholder="Ej: Cableado HES 5000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-xs placeholder-slate-500 focus:border-blue-500"
                placeholder="Detalla las instrucciones de cableado..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-white text-xs"
                >
                  <option value="guided">Guiado</option>
                  <option value="diagnostic">Diagnóstico</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Dificultad</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-white text-xs"
                >
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <option key={lvl} value={lvl}>Lvl {lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selector de Hardware a inyectar */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <span className="block text-xs font-bold text-white uppercase tracking-wider">Añadir Componentes</span>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleAddHardwareNode('powerSupply')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold py-2 rounded border border-slate-700 transition"
                >
                  + Fuente de Poder
                </button>
                <button
                  type="button"
                  onClick={() => handleAddHardwareNode('electricStrike')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold py-2 rounded border border-slate-700 transition"
                >
                  + Cerradero Eléctrico
                </button>
              </div>
            </div>

            {/* Control de inyección de fallas */}
            {type === 'diagnostic' && (
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <span className="block text-xs font-bold text-white uppercase tracking-wider">Inyección de Fallas</span>
                <button
                  type="button"
                  onClick={handleToggleFaultInjectionMode}
                  className={`w-full text-[11px] font-bold py-2 rounded border transition ${
                    isFaultMode 
                      ? 'bg-red-950/40 border-red-800 text-red-400' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  {isFaultMode ? '✓ Guardar Falla Inyectada' : '⚠️ Definir Falla en Cable'}
                </button>
                {isFaultMode && (
                  <span className="block text-[10px] text-red-400 leading-normal">
                    Conecta un cable incorrecto ahora en el canvas para inyectar el error de diagnóstico.
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSubmitForm(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-350 font-semibold text-xs py-2 rounded border border-slate-700 transition"
              >
                Guardar Borrador
              </button>
              <button
                type="button"
                onClick={() => handleSubmitForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 rounded transition"
              >
                Publicar Escenario
              </button>
            </div>
          </div>
        </div>

        {/* Canvas del Editor */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
            <span className="text-xs text-slate-400">
              Instrucción: {isFaultMode 
                ? 'Modifica un cable de la conexión correcta para simular el daño.' 
                : 'Arrastra y conecta los cables que representan el funcionamiento correcto del circuito.'}
            </span>
            {isFaultMode && (
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </div>

          <SimulatorCanvas />
        </div>
      </div>
    </div>
  );
}
