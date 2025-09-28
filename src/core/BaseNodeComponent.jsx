// src/core/BaseNodeComponent.jsx
import React from 'react';
import nodeRegistry from '../nodes';

// A simple component to show the node's current execution status
const NodeStatus = ({ status }) => {
  return <div className={`status-indicator ${status || 'pending'}`} title={status} />;
};

const BaseNodeComponent = ({ id, data, type, children }) => {
  const nodeConfig = nodeRegistry[type];

  return (
    <div className="react-flow__node-default">
      <div className="node-header">
        {nodeConfig?.label || 'Node'}
        <NodeStatus status={data.runtime?.status} />
      </div>
      <div className="node-body">
        {children}
        {data.runtime?.status === 'error' && (
          <div className="node-error">Error: {data.runtime.error}</div>
        )}
      </div>
    </div>
  );
};

export default BaseNodeComponent;