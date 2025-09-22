import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import NodeStatus from './NodeStatus.jsx';

// --- THE FIX ---
// The SettingsModal component is now defined OUTSIDE of the LLMNode component.
// This gives it a stable identity, preventing React from unmounting and remounting it
// on every parent re-render, which preserves input focus.
const SettingsModal = ({ isOpen, onClose, config, onLocalChange, onGlobalUpdate }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="node-settings-modal-overlay">
      <div className="node-settings-modal-content">
        <h3>Ollama Node Settings</h3>
        
        <div className="form-grid">
            <label>API Endpoint:</label>
            <input 
              type="text" 
              name="endpoint" 
              value={config.endpoint} 
              onChange={onLocalChange} 
              onBlur={onGlobalUpdate} 
              className="nodrag" 
            />
            
            <label>Model Name:</label>
            <input 
              type="text" 
              name="model" 
              value={config.model} 
              onChange={onLocalChange} 
              onBlur={onGlobalUpdate} 
              className="nodrag" 
              placeholder="e.g., llama3, mistral" 
            />
            
            <label>Temperature:</label>
            <input 
              type="range" 
              name="temperature" 
              value={config.temperature} 
              min="0" max="1" step="0.1" 
              onChange={onLocalChange} 
              onMouseUp={onGlobalUpdate}
              onTouchEnd={onGlobalUpdate}
              className="nodrag" 
            />
            <span>{config.temperature}</span>

            <label>Top P:</label>
            <input 
              type="range" 
              name="top_p" 
              value={config.top_p} 
              min="0" max="1" step="0.1" 
              onChange={onLocalChange} 
              onMouseUp={onGlobalUpdate} 
              onTouchEnd={onGlobalUpdate}
              className="nodrag" 
            />
            <span>{config.top_p}</span>

            <label>Top K:</label>
            <input 
              type="number" 
              name="top_k" 
              value={config.top_k} 
              min="0" step="1" 
              onChange={onLocalChange} 
              onBlur={onGlobalUpdate} 
              className="nodrag" 
            />
        </div>

        <p className="modal-info">
          Input values are saved when you click away from the field.
        </p>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};


const LLMNode = ({ id, data }) => {
  const { onUpdate, runtime } = data;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    endpoint: data.endpoint,
    model: data.model,
    temperature: data.temperature,
    top_p: data.top_p,
    top_k: data.top_k,
  });

  // Syncs local state if the global props change (e.g., on load)
  useEffect(() => {
    setLocalConfig({
      endpoint: data.endpoint,
      model: data.model,
      temperature: data.temperature,
      top_p: data.top_p,
      top_k: data.top_k,
    });
  }, [data.endpoint, data.model, data.temperature, data.top_p, data.top_k]);

  // Updates the fast, local state on every keystroke
  const handleLocalChange = (evt) => {
    const { name, value } = evt.target;
    setLocalConfig(prev => ({ ...prev, [name]: value }));
  };

  // Updates the slow, global state only on blur or mouse up
  const handleGlobalUpdate = (evt) => {
    const { name, value } = evt.target;
    onUpdate(id, { [name]: value });
  };

  return (
    <div className="react-flow__node-default">
       <div className="node-header">
        Ollama LLM Node
        <NodeStatus status={runtime?.status} />
      </div>
      <div className="node-body">
        <div className="node-config-summary">
          <strong>Model:</strong> {data.model || 'Not set'}
        </div>
        <button onClick={() => setIsSettingsOpen(true)}>Settings</button>

        {runtime?.status === 'completed' && <div className="node-output">Output: <pre>{runtime.output}</pre></div>}
        {runtime?.status === 'error' && <div className="node-error">Error: {runtime.error}</div>}
      </div>
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />

      {/* The LLMNode now renders the stable, external SettingsModal component */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={localConfig}
        onLocalChange={handleLocalChange}
        onGlobalUpdate={handleGlobalUpdate}
      />
    </div>
  );
};

export default memo(LLMNode);