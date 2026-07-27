"use client";

import React, { useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSimulatorStore } from '../../hooks/useSimulatorStore';
import { PowerSupplyNode, ElectricStrikeNode } from './NodeTypes/HardwareNodes';
import WireEdge from './EdgeTypes/WireEdge';

const nodeTypes = {
  powerSupply: PowerSupplyNode,
  electricStrike: ElectricStrikeNode,
};

const edgeTypes = {
  wire: WireEdge,
};

export default function SimulatorCanvas({
  initialNodes,
  initialEdges = [],
  validationRules,
}: {
  initialNodes?: any[];
  initialEdges?: any[];
  validationRules?: { correctWiring: any[] };
}) {
  const {
    nodes,
    edges,
    validationResult,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    validateCircuit,
    resetSimulator,
    setValidationRules,
    setInitialState,
    mode,
    setMode,
  } = useSimulatorStore();

  // Serializar objetos para evitar bucles de renderizado infinito en el array de dependencias
  const nodesString = JSON.stringify(initialNodes);
  const edgesString = JSON.stringify(initialEdges);
  const rulesString = JSON.stringify(validationRules);

  useEffect(() => {
    resetSimulator();
    
    if (validationRules) {
      setValidationRules(validationRules);
    }

    if (initialNodes && initialNodes.length > 0) {
      setInitialState(initialNodes, initialEdges);
    } else {
      // Configuración de Sandbox libre por defecto (Altronix + HES 5000)
      addNode({
        id: 'altronix-1',
        type: 'powerSupply',
        position: { x: 100, y: 150 },
        data: {},
      });
      addNode({
        id: 'hes5000-1',
        type: 'electricStrike',
        position: { x: 500, y: 150 },
        data: {},
      });
    }
  }, [nodesString, edgesString, rulesString]);

  return (
    <div className="flex flex-col h-[600px] w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Barra de herramientas */}
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            {mode === 'edit' ? 'Modo Edición - Configurando Escenario' : 'Simulador de Cableado PACS'}
          </h3>
          <p className="text-xs text-slate-400">
            {mode === 'edit' 
              ? 'Agrega componentes, ordénalos en el canvas y traza las conexiones que serán correctas.' 
              : 'Conecta la salida de la fuente de poder al cerradero eléctrico HES 5000.'}
          </p>
        </div>
        <div className="flex gap-3">
          {mode === 'edit' && nodes.length > 0 && (
            <div className="flex gap-1.5 max-h-9 overflow-hidden">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    removeNode(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-red-950/20 hover:bg-red-900/30 border border-red-800 text-red-400 text-xs px-3 py-1.5 rounded-lg transition"
              >
                <option value="">Eliminar Nodo...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.id} ({n.type})</option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={resetSimulator}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            Reiniciar
          </button>
          
          {mode !== 'edit' && (
            <button
              onClick={validateCircuit}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg hover:shadow-blue-500/20 transition"
            >
              Verificar Conexión
            </button>
          )}
        </div>
      </div>

      {/* Área del Canvas */}
      <div className="flex-1 relative bg-slate-950">
        {/* Gradiente radial oscuro superpuesto para dar profundidad visual */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.1)_0%,rgba(2,6,23,0.75)_100%)] pointer-events-none z-10" />

        <ReactFlow
          nodes={nodes.map((node) => {
            // Verificar si el nodo no tiene ninguna conexión activa (huerfano/pendiente)
            const hasConnection = edges.some(
              (edge) => edge.source === node.id || edge.target === node.id
            );
            return {
              ...node,
              data: {
                ...node.data,
                isOrphan: !hasConnection,
              },
            };
          })}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background color="#334155" gap={20} size={1.5} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-white !shadow-2xl z-20" />
          {nodes.length > 3 && (
            <MiniMap 
              className="!bg-slate-900 !border-slate-800 !shadow-2xl !rounded-xl overflow-hidden z-20" 
              nodeColor={(node) => {
                if (node.type === 'powerSupply') return '#f97316';
                if (node.type === 'electricStrike') return '#3b82f6';
                return '#94a3b8';
              }} 
              maskColor="rgba(15, 23, 42, 0.75)" 
            />
          )}
        </ReactFlow>

        {/* Panel de resultados / Feedback flotante */}
        {validationResult && (
          <div className={`absolute bottom-6 right-6 p-4 rounded-xl shadow-xl border w-80 transition duration-300 ${
            validationResult.isValid 
              ? 'bg-green-950/90 border-green-800 text-green-200' 
              : 'bg-red-950/90 border-red-800 text-red-200'
          }`}>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
              {validationResult.isValid ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Circuito Correcto
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Fallo en el Circuito
                </>
              )}
            </h4>
            <p className="text-xs">
              {validationResult.isValid 
                ? 'El cerradero está recibiendo energía correctamente. ¡Buen trabajo!' 
                : validationResult.errors[0]?.message || 'El cableado está incompleto o tiene fallas de polaridad.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
