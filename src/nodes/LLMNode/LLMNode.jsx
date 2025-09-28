// src/nodes/LLMNode/LLMNode.jsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from '../../core/BaseNode';
import BaseNodeComponent from '../../core/BaseNodeComponent';
import './LLMNode.css'; // We'll create this file for specific styling

// 1. The LOGIC class
// ===========================================
export class LLMNodeLogic extends BaseNode {
  static type = 'llmNode';
  
  static inputs = { prompt: { dtype: 'string' } };
  static outputs = { text: { dtype: 'string' } };

  async update(inputs) {
    const { prompt } = inputs;
    const { model, endpoint, temperature, top_p, top_k } = this.data;

    if (!prompt) throw new Error("Input prompt is empty.");
    if (!model) throw new Error("Ollama model name is missing.");
    if (!endpoint) throw new Error("Ollama API endpoint is missing.");

    const payload = {
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        temperature: parseFloat(temperature),
        top_p: parseFloat(top_p),
        top_k: parseInt(top_k, 10),
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.message?.content;
    if (typeof content !== 'string') {
      throw new Error("Invalid response structure from Ollama API.");
    }
    this.reReady();

    return { text: content };
  }
}


// 2. The UI component (No Modal)
// ===========================================
const LLMNodeComponent = ({ id, data }) => {
  const { onUpdateNodeData } = data;

  // Local state for fast input updates without re-rendering the whole graph
  const [localConfig, setLocalConfig] = useState({
    endpoint: data.endpoint,
    model: data.model,
    temperature: data.temperature,
    top_p: data.top_p,
    top_k: data.top_k,
  });

  // Sync local state if global props change (e.g., on load)
  useEffect(() => {
    setLocalConfig({
      endpoint: data.endpoint,
      model: data.model,
      temperature: data.temperature,
      top_p: data.top_p,
      top_k: data.top_k,
    });
  }, [data.endpoint, data.model, data.temperature, data.top_p, data.top_k]);

  // Updates the fast, local state on every keystroke/change
  const handleLocalChange = (evt) => {
    const { name, value } = evt.target;
    setLocalConfig(prev => ({ ...prev, [name]: value }));
  };

  // Updates the slow, global state on blur or mouse up
  const handleGlobalUpdate = (evt) => {
    if (onUpdateNodeData) {
      const { name, value } = evt.target;
      onUpdateNodeData(id, { [name]: value });
    }
  };

  const outputText = data.runtime?.output?.text || '';

  return (
    <BaseNodeComponent id={id} data={data} type={LLMNodeLogic.type}>
      <div className="llm-node-form">
        <label>Endpoint:</label>
        <input
          type="text"
          name="endpoint"
          value={localConfig.endpoint}
          onChange={handleLocalChange}
          onBlur={handleGlobalUpdate}
          className="nodrag"
        />
        
        <label>Model:</label>
        <input
          type="text"
          name="model"
          value={localConfig.model}
          onChange={handleLocalChange}
          onBlur={handleGlobalUpdate}
          className="nodrag"
        />
        
        <label>Temperature:</label>
        <div className="range-container">
          <input
            type="range"
            name="temperature"
            value={localConfig.temperature}
            min="0" max="1" step="0.1"
            onChange={handleLocalChange}
            onMouseUp={handleGlobalUpdate}
            onTouchEnd={handleGlobalUpdate}
            className="nodrag"
          />
          <span>{localConfig.temperature}</span>
        </div>

        <label>Top P:</label>
        <div className="range-container">
          <input
            type="range"
            name="top_p"
            value={localConfig.top_p}
            min="0" max="1" step="0.1"
            onChange={handleLocalChange}
            onMouseUp={handleGlobalUpdate}
            onTouchEnd={handleGlobalUpdate}
            className="nodrag"
          />
          <span>{localConfig.top_p}</span>
        </div>

        <label>Top K:</label>
        <div className="range-container">
          <input
            type="number"
            name="top_k"
            value={localConfig.top_k}
            min="0" step="1"
            onChange={handleLocalChange}
            onBlur={handleGlobalUpdate}
            className="nodrag"
          />
        </div>
      </div>

      {outputText && (
        <div className="node-output">
          <pre>{outputText}</pre>
        </div>
      )}

      <Handle type="target" position={Position.Left} id="prompt" data-dtype={LLMNodeLogic.inputs.prompt.dtype} />
      <Handle type="source" position={Position.Right} id="text" data-dtype={LLMNodeLogic.outputs.text.dtype} />
    </BaseNodeComponent>
  );
};


// 3. The Configuration object
// ===========================================
export const LLMNodeConfig = {
  type: LLMNodeLogic.type,
  label: 'Ollama LLM Node',
  logic: LLMNodeLogic,
  component: memo(LLMNodeComponent),
  defaultData: {
    endpoint: 'http://localhost:11434/api/chat',
    model: 'llama3',
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
  },
};