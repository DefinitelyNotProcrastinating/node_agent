import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './nodes/nodes.css';

// Import all nodes
import Sidebar from './Sidebar';
import MultiInputNode from './nodes/MultiInputNode';
import ApiNode from './nodes/ApiNode';
import TextInputTriggerNode from './nodes/TextInputTriggerNode';
import LLMNode from './nodes/LLMNode';

// Register all custom node types
const nodeTypes = {
  multiInput: MultiInputNode,
  apiNode: ApiNode,
  textInputTrigger: TextInputTriggerNode,
  llmNode: LLMNode,
};

// Initial state for demonstration
const initialNodes = [];
const initialEdges = [];
let id = 1;
const getId = () => `${id++}`;

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // --- Core State & Engine Logic ---

  const onUpdateNodeData = useCallback((nodeId, newConfig) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: newConfig } }
          : node
      )
    );
  }, [setNodes]);

  const updateNodeRuntimeState = (nodeId, newRuntimeState) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                runtime: { ...node.data.runtime, ...newRuntimeState },
              },
            }
          : node
      )
    );
  };

  const resetAllNodeStatus = () => {
     setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, runtime: { status: 'pending', input: null, output: null, error: null } },
      }))
    );
  };

  const runWorkflow = async (startNodeId) => {
    resetAllNodeStatus();
    const processingQueue = [startNodeId];
    const completedNodes = new Set();
    
    while (processingQueue.length > 0) {
      const currentNodeId = processingQueue.shift();
      const currentNode = nodes.find(n => n.id === currentNodeId);
      
      if (!currentNode || completedNodes.has(currentNodeId)) continue;
      
      // "Go Condition": Check if all parent nodes are completed
      const parentEdges = edges.filter(e => e.target === currentNodeId);
      const parentNodeIds = parentEdges.map(e => e.source);
      const areParentsReady = parentNodeIds.every(id => completedNodes.has(id));

      if (!areParentsReady) {
          // If parents not ready, push to back of queue and try again later
          processingQueue.push(currentNodeId);
          // Simple safeguard against infinite loops in this demo
          if (processingQueue.filter(id => id === currentNodeId).length > 2) continue; 
          continue;
      }

      // --- Execute Node Logic ---
      updateNodeRuntimeState(currentNodeId, { status: 'running' });
      
      try {
        let output = null;
        const parentOutputs = parentNodeIds.map(id => nodes.find(n => n.id === id).data.runtime.output);
        
        switch (currentNode.type) {
          case 'textInputTrigger':
            output = currentNode.data.config.text;
            break;
            
          case 'llmNode':
            const prompt = parentOutputs.join('\n'); // Combine outputs from parents
            const config = currentNode.data.config;
            
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
              },
              body: JSON.stringify({
                model: config.model,
                messages: [{ role: "user", content: prompt }],
                temperature: parseFloat(config.temperature)
              })
            });
            if(!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            output = result.choices[0].message.content;
            break;
        }

        updateNodeRuntimeState(currentNodeId, { status: 'completed', output });
        completedNodes.add(currentNodeId);
        
        // Add children to the queue
        const childEdges = edges.filter(e => e.source === currentNodeId);
        childEdges.forEach(edge => processingQueue.push(edge.target));

      } catch (error) {
        console.error("Error running node:", currentNodeId, error);
        updateNodeRuntimeState(currentNodeId, { status: 'error', error: error.message });
      }
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        const defaultNode = nodes.find(n => n.data.config?.isDefault && n.data.config?.enabled);
        if (defaultNode) {
          runWorkflow(defaultNode.id);
        } else {
          alert("No enabled, default trigger node found to run.");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, runWorkflow]); // Re-bind if nodes change

  // --- ReactFlow Setup (onDrop, onConnect, etc.) ---
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          config: {}, // For storing user settings
          runtime: { status: 'pending' }, // For execution state
          callbacks: { onUpdate: onUpdateNodeData, onTriggerRun: runWorkflow },
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, onUpdateNodeData, runWorkflow]
  );
  
  // Wrapper required for ReactFlow hooks
  return (
    <div className="app-container">
      <Sidebar />
      <div className="workflow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          fitView
          nodeTypes={nodeTypes}
        >
          <Controls />
          <Background />
          <Panel position="top-right">Agentic Workflow Runner</Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);