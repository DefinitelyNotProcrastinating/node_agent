import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import NodeStatus from './NodeStatus';

const MultiInputNode = ({ data }) => {
  const { runtime } = data;
  return (
    <div className="react-flow__node-default">
      <div className="node-header">
        Concatenate Text
        <NodeStatus status={runtime?.status} />
      </div>
      <div className="node-body">
        <p>This node joins all inputs with a newline.</p>
        {runtime?.status === 'completed' && <div className="node-output"><pre>{runtime.output}</pre></div>}
        {runtime?.status === 'error' && <div className="node-error">Error: {runtime.error}</div>}
      </div>
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default memo(MultiInputNode);