import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import NodeStatus from './NodeStatus';

const TextDisplayNode = ({ data }) => {
  const { runtime } = data;
  return (
    <div className="react-flow__node-default">
      <div className="node-header">
        Text Display
        <NodeStatus status={runtime?.status} />
      </div>
      <div className="node-body">
        {runtime?.status === 'completed' && <div className="node-output"><pre>{typeof runtime.output === 'object' ? JSON.stringify(runtime.output, null, 2) : runtime.output}</pre></div>}
        {runtime?.status === 'error' && <div className="node-error">Error: {runtime.error}</div>}
        {runtime?.status !== 'completed' && runtime?.status !== 'error' && <div className="node-placeholder">Output will appear here...</div>}
      </div>
      <Handle type="target" position={Position.Left} id="input" />
    </div>
  );
};

export default memo(TextDisplayNode);