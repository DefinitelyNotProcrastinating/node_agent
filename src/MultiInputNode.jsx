import React, { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

import './nodes.css';

const MultiInputNode = ({ id, data }) => {
  const { setNodes } = useReactFlow();
  const inputCount = data.inputCount || 1;

  const onAddInput = () => {
    // We update the nodes state with the new input count for this specific node
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputCount: (node.data.inputCount || 1) + 1,
            },
          };
        }
        return node;
      })
    );
  };

  // Calculate dynamic height based on the number of inputs
  // Base height + extra space for each additional input
  const nodeHeight = 60 + (inputCount - 1) * 25;

  return (
    <div className="react-flow__node-multiInput" style={{ height: `${nodeHeight}px` }}>
      {/* Create a handle for each input */}
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={{ top: `${40 + i * 25}px` }} // Space out handles vertically
        />
      ))}
      <div className="multi-input-node-body">
        <div>Multi-Input Node</div>
        <button onClick={onAddInput}>Add Input</button>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default memo(MultiInputNode);