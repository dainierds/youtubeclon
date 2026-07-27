import { Handle, Position } from '@xyflow/react';
import { Zap, Lock } from 'lucide-react';

export function PowerSupplyNode({ data }: any) {
  // Un componente se considera huérfano/pendiente si no tiene conexiones asociadas en el canvas
  const isOrphan = data?.isOrphan ?? false;

  return (
    <div className={`relative bg-slate-900 border-2 rounded-xl p-4 shadow-2xl text-white w-64 transition-all duration-300 ${
      isOrphan ? 'border-dashed border-slate-700 hover:border-slate-500' : 'border-slate-800'
    }`}>
      {isOrphan && (
        <span className="absolute -top-3 right-4 bg-yellow-600/90 text-yellow-100 border border-yellow-500 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-lg animate-pulse">
          Pendiente de conexión
        </span>
      )}

      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-orange-400">Fuente de Poder</h4>
        </div>
        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">Altronix AL175</span>
      </div>
      
      {/* Visualización de la fuente */}
      <div className="flex justify-center items-center py-2 bg-slate-950/70 rounded border border-slate-800/80 mb-4 h-16 shadow-inner">
        <div className="w-12 h-12 rounded bg-slate-900 border-2 border-slate-750 flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold text-red-500">AC/DC</span>
        </div>
      </div>

      {/* Terminales de conexión */}
      <div className="space-y-3.5 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-950 border border-red-700 relative flex items-center justify-center">
              <Handle
                type="source"
                position={Position.Left}
                id="altronix-12v-out"
                className="!bg-orange-500 !text-orange-500"
              />
            </div>
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">+12VDC</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">GND (-)</span>
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <Handle
                type="source"
                position={Position.Right}
                id="altronix-gnd-out"
                className="!bg-slate-500 !text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ElectricStrikeNode({ data }: any) {
  const isOrphan = data?.isOrphan ?? false;

  return (
    <div className={`relative bg-slate-900 border-2 rounded-xl p-4 shadow-2xl text-white w-64 transition-all duration-300 ${
      isOrphan ? 'border-dashed border-slate-700 hover:border-slate-500' : 'border-slate-800'
    }`}>
      {isOrphan && (
        <span className="absolute -top-3 right-4 bg-yellow-600/90 text-yellow-100 border border-yellow-500 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-lg animate-pulse">
          Pendiente de conexión
        </span>
      )}

      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-blue-400">Cerradero</h4>
        </div>
        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">HES 5000</span>
      </div>

      {/* Visualización del herraje */}
      <div className="flex justify-center items-center py-2 bg-slate-950/70 rounded border border-slate-800/80 mb-4 h-16 shadow-inner">
        <div className="w-8 h-12 rounded bg-zinc-700 border border-zinc-650 flex items-center justify-center shadow-inner">
          <div className="w-4 h-6 bg-zinc-800 rounded"></div>
        </div>
      </div>

      {/* Terminales de conexión */}
      <div className="space-y-3.5 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-950 border border-red-700 relative flex items-center justify-center">
              <Handle
                type="target"
                position={Position.Left}
                id="hes5000-pos"
                className="!bg-orange-500 !text-orange-500"
              />
            </div>
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">POS (+)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">NEG (-)</span>
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <Handle
                type="target"
                position={Position.Right}
                id="hes5000-neg"
                className="!bg-slate-500 !text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
