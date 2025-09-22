import React, { useState, useCallback } from 'react';
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

import Sidebar from './Sidebar.jsx';
import TextInputTriggerNode from './nodes/TextInputTriggerNode.jsx';
import LLMNode from './nodes/LLMNode.jsx';
import ApiNode from './nodes/ApiNode.jsx';
import TextDisplayNode from './nodes/TextDisplayNode.jsx';
import MultiInputNode from './nodes/MultiInputNode.jsx';

const nodeTypes = {
  textInputTrigger: TextInputTriggerNode,
  llmNode: LLMNode,
  apiNode: ApiNode,
  textDisplayNode: TextDisplayNode,
  multiInput: MultiInputNode,
};

let id = 1;
const getId = () => `node_${id++}`;

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const onUpdateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
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
        data: { ...node.data, runtime: { status: 'pending', output: null, error: null } },
      }))
    );
  };

  const runWorkflow = async () => {
    const startNode = nodes.find(n => n.data.isStartNode);
    if (!startNode) {
      alert("Please mark one 'Text Input Trigger' node as the 'Start Node'.");
      return;
    }
    
    setIsRunning(true);
    resetAllNodeStatus();
    
    const processingQueue = [startNode.id];
    const completedNodes = new Set();
    const nodeDependencies = new Map(nodes.map(n => [n.id, edges.filter(e => e.target === n.id).map(e => e.source)]));
    
    while (processingQueue.length > 0) {
      const currentNodeId = processingQueue.shift();
      const currentNode = nodes.find(n => n.id === currentNodeId);
      
      if (!currentNode || completedNodes.has(currentNodeId)) continue;
      
      const parents = nodeDependencies.get(currentNodeId) || [];
      const areParentsReady = parents.every(parentId => completedNodes.has(parentId));

      if (!areParentsReady) {
          if(!processingQueue.includes(currentNodeId)) processingQueue.push(currentNodeId);
          continue;
      }

      updateNodeRuntimeState(currentNodeId, { status: 'running' });
      
      try {
        let output = null;
        const parentOutputs = parents.map(id => nodes.find(n => n.id === id).data.runtime.output);
        const config = currentNode.data;

        switch (currentNode.type) {
          // --- THIS IS THE FIX ---
          // The logic now correctly uses the node's own configured text as its primary output.
          // It also handles cases where it might be in the middle of a flow.
          case 'textInputTrigger':
            const parentText = parentOutputs.join('\n');
            const ownText = config.text || '';
            // If there's parent text, add a space before appending its own text.
            output = parentText ? `${parentText}\n${ownText}` : ownText;
            break;
            
          case 'llmNode':
            if (!config.model) throw new Error("Ollama model name is missing.");
            if (!config.endpoint) throw new Error("Ollama API endpoint is missing.");

            const prompt = parentOutputs.join('\n');
            if (!prompt) {
                // If there's no input, we shouldn't call the API.
                // We'll mark it as a warning/error state instead.
                throw new Error("Input prompt is empty.");
            }
            const options = {
              temperature: parseFloat(config.temperature),
              top_p: parseFloat(config.top_p),
              top_k: parseInt(config.top_k, 10),
            };

            const payload = {
              model: config.model,
              messages: [{ role: "user", content: prompt }],
              stream: false,
              options: options
            };

            const response = await fetch(config.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            if (!result.message || !result.message.content) {
              throw new Error("Invalid response structure from Ollama API.");
            }
            output = result.message.content;
            break;
            
          case 'apiNode':
             if (!config.url) throw new Error("API URL is missing.");
             const apiResponse = await fetch(config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: parentOutputs }),
             });
             if(!apiResponse.ok) throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
             output = await apiResponse.json();
             break;
             
          case 'multiInput':
             output = parentOutputs.join('\n');
             break;
             
          case 'textDisplayNode':
             output = parentOutputs.join('\n');
             break;
        }

        updateNodeRuntimeState(currentNodeId, { status: 'completed', output });
        completedNodes.add(currentNodeId);
        
        const childEdges = edges.filter(e => e.source === currentNodeId);
        childEdges.forEach(edge => {
            if(!processingQueue.includes(edge.target)) {
                processingQueue.push(edge.target);
            }
        });

      } catch (error) {
        console.error("Error running node:", currentNodeId, error);
        updateNodeRuntimeState(currentNodeId, { status: 'error', error: error.message });
        setIsRunning(false);
        return; 
      }
    }
    setIsRunning(false);
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      const baseData = {
        onUpdate: onUpdateNodeData,
        runtime: { status: 'pending', output: null, error: null },
      };

      let specificData = {};
      switch (type) {
        case 'llmNode':
          specificData = {
            endpoint: 'http://localhost:11434/api/chat',
            model: 'llama3',
            temperature: 0.8,
            top_p: 0.9,
            top_k: 40,
          };
          break;
        case 'apiNode':
          specificData = {
            url: 'http://127.0.0.1:8000/api/process',
          };
          break;
        case 'textInputTrigger':
            specificData = {
                text: '',
                isStartNode: false,
            };
            break;
        default:
          specificData = {};
          break;
      }

      const newNode = {
        id: getId(),
        type,
        position,
        data: { ...baseData, ...specificData },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, onUpdateNodeData]
  );
  
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
          <Panel position="top-right">
             <button onClick={runWorkflow} disabled={isRunning}>
                {isRunning ? 'Running...' : 'Run Workflow'}
             </button>
          </Panel>
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