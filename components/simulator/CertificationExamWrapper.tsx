"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import SimulatorCanvas from '@/components/simulator/SimulatorCanvas';
import { submitCertificationAttemptAction } from '@/app/simulador/certificacion/actions';

export default function CertificationExamWrapper({
  attemptId,
  level,
  scenarios,
}: {
  attemptId: string;
  level: any;
  scenarios: any[];
}) {
  const router = useRouter();
  const { nodes, edges, validationResult, validateCircuit } = useSimulatorStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.time_limit_minutes * 60);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [scorePercent, setScorePercent] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  // Registro interno de resultados por escenario
  const [examResults, setExamResults] = useState<{ scenarioId: string; isCorrect: boolean; timeSpent: number }[]>([]);
  const stepStartTimeRef = useRef<number>(Date.now());
  const examSubmittingRef = useRef(false);

  const currentScenario = scenarios[currentStep];

  // 1. Cronómetro Global del Examen
  useEffect(() => {
    if (timeLeft <= 0 || isExamFinished) {
      if (timeLeft <= 0) {
        handleTimeoutFinish();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isExamFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Finalización por expiración del tiempo
  const handleTimeoutFinish = async () => {
    if (examSubmittingRef.current) return;
    examSubmittingRef.current = true;

    // Completar el paso actual como incorrecto por falta de tiempo
    const timeSpent = Math.max(1, Math.floor((Date.now() - stepStartTimeRef.current) / 1000));
    const stepResults = [
      ...examResults,
      { scenarioId: currentScenario.id, isCorrect: false, timeSpent }
    ];

    // Rellenar los pasos restantes del examen no realizados como incorrectos
    for (let i = currentStep + 1; i < scenarios.length; i++) {
      stepResults.push({ scenarioId: scenarios[i].id, isCorrect: false, timeSpent: 0 });
    }

    const result = await submitCertificationAttemptAction(attemptId, stepResults);
    setScorePercent(result.scorePercent);
    setPassed(result.passed);
    setIsExamFinished(true);
  };

  const handleNextStep = () => {
    validateCircuit();
  };

  // 3. Evaluar e integrar el resultado del circuito del paso actual
  useEffect(() => {
    if (!validationResult) return;

    const executeStepSave = async () => {
      const isCorrect = validationResult.isValid;
      const timeSpent = Math.max(1, Math.floor((Date.now() - stepStartTimeRef.current) / 1000));

      const updatedResults = [
        ...examResults,
        { scenarioId: currentScenario.id, isCorrect, timeSpent }
      ];

      setExamResults(updatedResults);

      if (currentStep < scenarios.length - 1) {
        // Pasar al siguiente escenario
        setCurrentStep((prev) => prev + 1);
        stepStartTimeRef.current = Date.now();
      } else {
        // Enviar examen completo
        if (examSubmittingRef.current) return;
        examSubmittingRef.current = true;

        const result = await submitCertificationAttemptAction(attemptId, updatedResults);
        setScorePercent(result.scorePercent);
        setPassed(result.passed);
        setIsExamFinished(true);
      }
    };

    executeStepSave();
  }, [validationResult]);

  if (isExamFinished) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl">
          
          <div className="flex justify-center">
            {passed ? (
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
            <h3 className="text-2xl font-bold text-white">
              {passed ? '¡Examen Aprobado!' : 'Examen Reprobado'}
            </h3>
            <p className="text-sm text-slate-400">
              Obtuviste un puntaje del <strong className="text-white">{scorePercent}%</strong> (Puntaje mínimo requerido: {level.passing_score_percent}%).
            </p>
          </div>

          {!passed && (
            <p className="text-xs text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/35">
              No cumpliste con el porcentaje mínimo requerido. Podrás volver a intentar la evaluación de este nivel en 24 horas.
            </p>
          )}

          <button
            onClick={() => router.push('/simulador/certificacion')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition"
          >
            Volver a Certificaciones
          </button>

        </div>
      </div>
    );
  }

  const initialNodes = currentScenario?.hardware_config?.nodes || [];
  const initialEdges = currentScenario?.hardware_config?.initial_wiring || 
                       currentScenario?.fault_injection?.wiring || [];

  const validationRules = currentScenario?.correct_wiring ? { correctWiring: currentScenario.correct_wiring } : undefined;

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col justify-center items-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest font-mono">
              Evaluación: {level.title}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              Paso {currentStep + 1} de {scenarios.length}: {currentScenario.title}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tiempo Restante</span>
              <span className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={handleNextStep}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition"
            >
              {currentStep < scenarios.length - 1 ? 'Siguiente Escenario' : 'Finalizar Examen'}
            </button>
          </div>
        </div>

        {/* Canvas del Simulador */}
        <SimulatorCanvas
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          validationRules={validationRules}
        />

      </div>
    </div>
  );
}
