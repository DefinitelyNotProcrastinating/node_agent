import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import './core/styles.css';

import Sidebar from './core/Sidebar';
import nodeRegistry from './nodes';

const getNodeTypes = () => {
  console.log('[Setup] Building nodeTypes map from registry.');
  const allNodeKeys = Object.keys(nodeRegistry);
  return allNodeKeys.reduce((acc, type) => {
    const config = nodeRegistry[type];
    if (config && config.component) {
      acc[type] = config.component;
    }
    return acc;
  }, {});
};

let id = 1;
const getId = () => `node_${id++}`;

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const abortControllerRef = useRef(null);
  // Refs to hold live state for the orchestrator, accessible from callbacks
  const liveNodesRef = useRef(new Map());
  const readyQueueRef = useRef([]);

  const nodeTypes = useMemo(() => getNodeTypes(), []);
  
  // Callback for the WORKFLOW to update a node's RUNTIME state (status, output).
  const updateNodeState = useCallback((nodeId, newData) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Callback for the UI to update a node's CONFIGURATION data.
  // This is the key for "live" updates during a workflow run.
  const onNodeConfigChange = useCallback((nodeId, configData) => {
    // 1. Update the React state for the UI
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...configData } } : node
      )
    );
    
    // 2. If a workflow is running, notify the orchestrator
    if (isRunning) {
      const liveNodeInstance = liveNodesRef.current.get(nodeId);
      if (liveNodeInstance) {
        console.log(`[Orchestrator] Live-updating config for node ${nodeId}`);
        // Update the instance's internal data
        liveNodeInstance.data = { ...liveNodeInstance.data, ...configData };
        
        // If the node is a "root" node (like TextNode), it should re-run immediately.
        // For others, their parents will trigger them. isInputReady is a good proxy.
        if (liveNodeInstance.isInputReady()) {
          liveNodeInstance.setState('pending'); // Reset state
          if (!readyQueueRef.current.includes(liveNodeInstance)) {
            readyQueueRef.current.push(liveNodeInstance);
          }
        }
      }
    }
  }, [isRunning, setNodes]);


  const stopWorkflow = () => {
    if (abortControllerRef.current) {
      console.log('[Workflow] Sending stop signal...');
      abortControllerRef.current.abort();
    }
  };

  const startWorkflow = async () => {
    console.log('--- [Workflow] Start command received. ---');
    setIsRunning(true);
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setTimeout(async () => {
      try {
        if (!reactFlowInstance) throw new Error("ReactFlow instance not ready.");

        const initialNodes = reactFlowInstance.getNodes();
        const initialEdges = reactFlowInstance.getEdges();

        // Reset all node UI states
        setNodes((nds) =>
          nds.map((n) => ({ ...n, data: { ...n.data, runtime: { status: 'pending' } } }))
        );

        const graphContext = {
          getAllNodes: () => reactFlowInstance.getNodes(),
          getAllEdges: () => initialEdges,
        };
        
        const orchestrator = {
          addToQueue: (instance) => {
            if (!readyQueueRef.current.includes(instance)) {
              readyQueueRef.current.push(instance);
            }
          }
        };

        liveNodesRef.current.clear();
        initialNodes.forEach(node => {
          const LogicClass = nodeRegistry[node.type]?.logic;
          if (LogicClass) {
            const instance = new LogicClass(node.data, node.id, updateNodeState, graphContext, liveNodesRef.current, orchestrator);
            liveNodesRef.current.set(node.id, instance);
          }
        });

        readyQueueRef.current = [];
        for (const instance of liveNodesRef.current.values()) {
          instance.runtime.status = 'pending';
          if (instance.isInputReady()) {
            readyQueueRef.current.push(instance);
          }
        }
        
        const runningPromises = new Map();
        while (!signal.aborted) {
          while (readyQueueRef.current.length > 0) {
            const instanceToRun = readyQueueRef.current.shift();
            
            const promise = instanceToRun.execute(signal)
              .then(() => {
                if (signal.aborted) return;
                const childEdges = initialEdges.filter(edge => edge.source === instanceToRun.id);
                const children = childEdges.map(edge => liveNodesRef.current.get(edge.target)).filter(Boolean);

                for (const child of children) {
                  if (child.isInputReady() && !readyQueueRef.current.includes(child) && child.runtime.status === 'pending') {
                       readyQueueRef.current.push(child);
                  }
                }
              })
              .catch(err => {
                if (err.name !== 'AbortError') {
                  console.error(`[Workflow] Node ${instanceToRun.id} failed. Stopping workflow.`, err);
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                }
              })
              .finally(() => {
                runningPromises.delete(instanceToRun.id);
              });
            runningPromises.set(instanceToRun.id, promise);
          }

          if (runningPromises.size === 0) {
            console.log('[Workflow] Execution finished successfully (or no runnable nodes left).');
            break; 
          }
          await Promise.race(Array.from(runningPromises.values()));
        }

        if (signal.aborted) console.log('[Workflow] Execution was stopped.');
      } catch (e) {
        console.error("[Workflow] A critical orchestrator error occurred.", e);
        alert(`Workflow failed: ${e.message}`);
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
        liveNodesRef.current.clear();
        readyQueueRef.current = [];
      }
    }, 0);
  };

  // --- RE-IMPLEMENTED: Helper function for onConnect ---
  const getTargetDtype = (targetNode, targetHandle) => {
    if (targetNode.type === 'concatNode') {
      const handleIndex = parseInt(targetHandle.replace('in_', ''), 10);
      const numInputs = targetNode.data.numInputs || 0;
      if (handleIndex > 0 && handleIndex <= numInputs) return 'string';
    } else {
      const targetConfig = nodeRegistry[targetNode.type];
      return targetConfig?.logic.inputs?.[targetHandle]?.dtype;
    }
    return null;
  };

  // --- RE-IMPLEMENTED: onConnect with correct dependencies ---
  const onConnect = useCallback((params) => {
    const { source, sourceHandle, target, targetHandle } = params;
    const sourceNode = reactFlowInstance.getNode(source);
    const targetNode = reactFlowInstance.getNode(target);

    if (!sourceNode || !targetNode) return;

    const sourceConfig = nodeRegistry[sourceNode.type];
    const sourceDtype = sourceConfig?.logic.outputs[sourceHandle]?.dtype;
    const targetDtype = getTargetDtype(targetNode, targetHandle);

    if (sourceDtype && targetDtype && sourceDtype === targetDtype) {
      setEdges((eds) => addEdge(params, eds));
    } else {
      console.warn(`Type mismatch: Cannot connect ${sourceDtype} to ${targetDtype}.`);
    }
  }, [reactFlowInstance, setEdges]); // Depends on the instance being available

  // --- RE-IMPLEMENTED: onDrop with correct dependencies and new callback ---
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const config = nodeRegistry[type];
    
    if (!config || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
    const newNode = {
      id: getId(),
      type,
      position,
      data: {
        ...(config.defaultData || {}),
        runtime: { status: 'pending', output: null, error: null },
        // Pass the NEW callback for live configuration changes
        onNodeConfigChange: onNodeConfigChange,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes, onNodeConfigChange]); // Crucially depends on onNodeConfigChange

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
            <button onClick={isRunning ? stopWorkflow : startWorkflow} disabled={!reactFlowInstance}>
              {isRunning ? 'Stop Workflow' : 'Run Workflow'}
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