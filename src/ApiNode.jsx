import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

import './nodes.css';

const ApiNode = ({ id, data }) => {
  const [apiState, setApiState] = useState({ status: 'idle', message: 'Ready' });

  const handleApiCall = async () => {
    setApiState({ status: 'loading', message: 'Sending request...' });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node_id: id,
          message: 'Hello from ReactFlow!',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setApiState({ status: 'success', message: result.processed_message });

    } catch (error) {
      console.error("API Call failed:", error);
      setApiState({ status: 'error', message: 'Request Failed!' });
    }
  };

  return (
    <div className="react-flow__node-apiNode">
      <Handle type="target" position={Position.Left} id="input" />
      <div className="api-node-body">
        <div>API Call Node</div>
        <button onClick={handleApiCall} disabled={apiState.status === 'loading'}>
          {apiState.status === 'loading' ? 'Processing...' : 'Send Request'}
        </button>
        <div className={`api-node-status ${apiState.status}`}>
          {apiState.message}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default memo(ApiNode);