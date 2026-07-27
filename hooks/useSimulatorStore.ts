import { create } from 'zustand';
import { Connection, Edge, EdgeChange, Node, NodeChange, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';

interface SimulatorState {
  nodes: Node[];
  edges: Edge[];
  validationResult: {
    isValid: boolean;
    correctEdges: string[];
    errors: { edgeId: string; message: string }[];
  } | null;
  mode: 'play' | 'edit';
  validationRules: { correctWiring: any[] } | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  validateCircuit: () => void;
  resetSimulator: () => void;
  setValidationRules: (rules: { correctWiring: any[] }) => void;
  setInitialState: (nodes: Node[], edges?: Edge[]) => void;
  setMode: (mode: 'play' | 'edit') => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  nodes: [],
  edges: [],
  validationResult: null,
  validationRules: null,
  mode: 'play',

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    // Determinar el color del cable según los puertos que se están conectando
    let wireColor = '#3b82f6'; // Azul por defecto (Datos/Señal)
    const sourceHandle = connection.sourceHandle || '';
    const targetHandle = connection.targetHandle || '';

    if (sourceHandle.includes('12v') || sourceHandle.includes('24v') || targetHandle.includes('12v') || targetHandle.includes('24v')) {
      wireColor = '#ef4444'; // Rojo (Energía Positiva)
    } else if (sourceHandle.includes('gnd') || sourceHandle.includes('com') || targetHandle.includes('gnd') || targetHandle.includes('com')) {
      wireColor = '#000000'; // Negro (GND/Común)
    }

    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      data: { color: wireColor, status: 'pending' },
    } as Edge;

    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  resetSimulator: () => {
    set({
      nodes: [],
      edges: [],
      validationResult: null,
      validationRules: null,
      mode: 'play',
    });
  },

  setValidationRules: (rules) => {
    set({ validationRules: rules });
  },

  setMode: (mode) => {
    set({ mode });
  },

  updateNodePosition: (id, x, y) => {
    set({
      nodes: get().nodes.map((node) => 
        node.id === id ? { ...node, position: { x, y } } : node
      ),
    });
  },

  setInitialState: (nodes, edges = []) => {
    set({
      nodes,
      edges,
      validationResult: null,
    });
  },

  validateCircuit: () => {
    const edges = get().edges;
    const correctEdges: string[] = [];
    const errors: { edgeId: string; message: string }[] = [];
    const rules = get().validationRules;

    // Si existen reglas dinámicas provistas por el escenario, validar contra ellas
    if (rules && rules.correctWiring && rules.correctWiring.length > 0) {
      edges.forEach((edge) => {
        const sourcePort = edge.sourceHandle || '';
        const targetPort = edge.targetHandle || '';

        // Buscar coincidencia en la configuración de cables correctos
        const isMatch = rules.correctWiring.some((rule: any) => 
          (rule.sourcePort === sourcePort && rule.targetPort === targetPort) ||
          (rule.sourcePort === targetPort && rule.targetPort === sourcePort)
        );

        if (isMatch) {
          correctEdges.push(edge.id);
          edge.data = { ...edge.data, status: 'correct' };
        } else {
          errors.push({
            edgeId: edge.id,
            message: `Conexión incorrecta o no válida para el escenario actual.`,
          });
          edge.data = { ...edge.data, status: 'incorrect' };
        }
      });

      const isValid = errors.length === 0 && correctEdges.length >= rules.correctWiring.length;

      set({
        edges: [...edges],
        validationResult: {
          isValid,
          correctEdges,
          errors,
        },
      });
      return;
    }

    // LÓGICA DE VALIDACIÓN POR DEFECTO (HISTÓRICA / SANDBOX)
    edges.forEach((edge) => {
      const sourcePort = edge.sourceHandle || '';
      const targetPort = edge.targetHandle || '';

      if (sourcePort === 'altronix-12v-out' && targetPort === 'hes5000-pos') {
        correctEdges.push(edge.id);
        edge.data = { ...edge.data, status: 'correct' };
      } else if (sourcePort === 'altronix-gnd-out' && targetPort === 'hes5000-neg') {
        correctEdges.push(edge.id);
        edge.data = { ...edge.data, status: 'correct' };
      } else {
        errors.push({
          edgeId: edge.id,
          message: `Conexión incorrecta entre puerto '${sourcePort}' y puerto '${targetPort}'.`,
        });
        edge.data = { ...edge.data, status: 'incorrect' };
      }
    });

    const isValid = errors.length === 0 && correctEdges.length >= 2;

    set({
      edges: [...edges],
      validationResult: {
        isValid,
        correctEdges,
        errors,
      },
    });
  },
}));
