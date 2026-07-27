import { BaseEdge, getBezierPath, EdgeProps } from '@xyflow/react';

export default function WireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  // Calculamos la distancia horizontal
  const dx = Math.abs(targetX - sourceX);
  
  // Agregar "sag" (colgado) incrementando la curva hacia abajo proporcional a la distancia horizontal
  const sagOffset = Math.min(dx * 0.25, 120);
  
  // Modificamos el path para simular gravedad de cable física
  const controlY1 = sourceY + sagOffset;
  const controlY2 = targetY + sagOffset;
  const edgePath = `M ${sourceX},${sourceY} C ${sourceX},${controlY1} ${targetX},${controlY2} ${targetX},${targetY}`;

  // Colores dinámicos basados en polaridad y validación
  let wireColor = '#64748b'; // Color base por defecto
  
  const isPositive = id.includes('12v') || id.includes('pos') || (data as any)?.sourceHandle?.includes('12v') || (data as any)?.sourceHandle?.includes('pos');
  const isNegative = id.includes('gnd') || id.includes('neg') || (data as any)?.sourceHandle?.includes('gnd') || (data as any)?.sourceHandle?.includes('neg');

  if (isPositive) {
    wireColor = '#f97316'; // Naranja-rojizo para +12VDC/POS
  } else if (isNegative) {
    wireColor = '#475569'; // Slate gris azulado para GND/NEG
  }

  // Sobrescribir con estados de validación final correct/incorrect
  if (data?.status === 'correct') {
    wireColor = '#10b981'; // Verde brillante
  } else if (data?.status === 'incorrect') {
    wireColor = '#ef4444'; // Rojo vibrante
  }

  const isIncorrect = data?.status === 'incorrect';
  const isCorrect = data?.status === 'correct';

  return (
    <>
      {/* Sombra de profundidad en el fondo */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={7}
        style={{
          filter: 'blur(3px)',
        }}
      />
      
      {/* Glow de error pulsante si aplica */}
      {isIncorrect && (
        <path
          d={edgePath}
          fill="none"
          stroke="#f87171"
          strokeWidth={10}
          style={{
            opacity: 0.6,
            filter: 'blur(4px)',
            animation: 'wirePulse 1.2s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Cable principal */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...(style as React.CSSProperties),
          stroke: wireColor as string,
          strokeWidth: 5.5,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.5))',
        }}
      />

      {/* Flujo eléctrico si es correcto */}
      {isCorrect && (
        <path
          d={edgePath}
          fill="none"
          stroke="#4ade80"
          strokeWidth={2.5}
          strokeDasharray="12,12"
          style={{
            animation: 'wireFlow 0.6s linear infinite',
            filter: 'drop-shadow(0px 0px 3px #22c55e)',
          }}
        />
      )}
    </>
  );
}
