import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import NodeStatus from './NodeStatus';

const ApiNode = ({ id, data }) => {
  const { onUpdate, url = 'http://127.0.0.1:8000/api/process', runtime } = data;

  const handleChange = (evt) => {
    onUpdate(id, { url: evt.target.value });
  };

  return (
    <div className="react-flow__node-default">
      <Handle type="target" position={Position.Left} id="input" />
      <div className="node-header">
        API Call Node
        <NodeStatus status={runtime?.status} />
      </div>
      <div className="node-body">
        <label>API Endpoint URL:</label>
        <input type="text" value={url} onChange={handleChange} className="nodrag" />

        {runtime?.status === 'completed' && <div className="node-output">Output: <pre>{JSON.stringify(runtime.output, null, 2)}</pre></div>}
        {runtime?.status === 'error' && <div className="node-error">Error: {runtime.error}</div>}
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default memo(ApiNode);