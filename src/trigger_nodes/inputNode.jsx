import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './nodes.css';

const TextInputTriggerNode = ({ id, data }) => {
  // onUpdate is a function passed from the parent to update the node's data
  const { onUpdate, onTriggerRun } = data.callbacks;
  const config = data.config || {};
  const runtime = data.runtime || {};

  const handleConfigChange = (evt) => {
    const { name, value, type, checked } = evt.target;
    onUpdate(id, {
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  return (
    <div className="node-base">
      <div className="node-title">Text Input Trigger</div>
      <div className="node-body">
        <label>
          <input
            type="checkbox"
            name="enabled"
            checked={config.enabled || false}
            onChange={handleConfigChange}
          />
          Enable Trigger
        </label>
        <label>
          <input
            type="checkbox"
            name="isDefault"
            checked={config.isDefault || false}
            onChange={handleConfigChange}
          />
          Set as Default (Ctrl+Enter)
        </label>
        <textarea
          name="text"
          rows="4"
          placeholder="Enter initial text..."
          value={config.text || ''}
          onChange={handleConfigChange}
        />
        <button onClick={() => onTriggerRun(id)} disabled={!config.enabled}>
          Run Workflow
        </button>
      </div>
      <div className={`node-runtime-status ${runtime.status || ''}`}>
        Status: {runtime.status || 'pending'}
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default memo(TextInputTriggerNode);