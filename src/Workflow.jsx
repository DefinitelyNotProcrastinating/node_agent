import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from 'reactflow';


// You need to import the CSS for ReactFlow to work
import 'reactflow/dist/style.css';

import MultiInputNode from './MultiInputNode';
import ApiNode from './ApiNode'; 

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Workflow' },
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    data: { label: 'Process Data' },
    position: { x: 250, y: 125 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'End Workflow' },
    position: { x: 250, y: 250 },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
];
const nodeTypes = {
  multiInput: MultiInputNode, 
  apiNode: ApiNode
};


let id = 4;
const getId = () => `${id++}`;

const Workflow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Required for the drag-and-drop to work
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle dropping a new node from the sidebar
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }
      
      // Project the drop position to the ReactFlow coordinate system
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="workflow-container" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes} // <-- 3. PASS the nodeTypes prop
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

// We wrap the Workflow component in a ReactFlowProvider
// to have access to the ReactFlow instance via hooks
export default () => (
  <ReactFlowProvider>
    <Workflow />
  </ReactFlowProvider>
);