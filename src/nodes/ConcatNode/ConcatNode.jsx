// src/nodes/ConcatNode/ConcatNode.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from '../../core/BaseNode';
import BaseNodeComponent from '../../core/BaseNodeComponent';
import './ConcatNode.css'; // Import the required CSS

// Logic Class
export class ConcatNodeLogic extends BaseNode {
  static type = 'concatNode';
  static outputs = { text: { dtype: 'string' } };
  
  constructor(nodeData, ...args) {
    super(nodeData, ...args);
    // Initialize inputs based on data at creation time
    this.inputs = this._generateInputs(this.data.numInputs || 2);
  }

  _generateInputs(count) {
    const inputs = {};
    const num = Math.max(1, Math.floor(count));
    for (let i = 1; i <= num; i++) {
      inputs[`in_${i}`] = { dtype: 'string' };
    }
    return inputs;
  }

  /**
   * Overridden execute method to ensure the logic instance is in sync with UI data.
   * This is a robust pattern that handles updates without needing instance recreation.
   */
  async execute(abortSignal) {
    const currentNumInputs = this.data.numInputs || 2;
    if (Object.keys(this.inputs).length !== currentNumInputs) {
      // The number of inputs in our data has changed since this instance was created.
      // We regenerate the inputs definition before executing.
      this.inputs = this._generateInputs(currentNumInputs);
    }
    
    // Proceed with the standard execution logic from the parent class.
    return super.execute(abortSignal);
  }
  
  async update(inputs) {
    // Sort keys to ensure concatenation order is predictable (in_1, in_2, ..., in_10)
    const sortedKeys = Object.keys(inputs).sort((a, b) => {
      const numA = parseInt(a.split('_')[1], 10);
      const numB = parseInt(b.split('_')[1], 10);
      return numA - numB;
    });
    
    const concatenatedText = sortedKeys.map(key => inputs[key]).join('\n');
    return { text: concatenatedText };
  }
}

// UI Component
const ConcatNodeComponent = ({ id, data }) => {
  // THE FIX: Use `onNodeConfigChange` which is provided by App.js
  const { numInputs = 2, onNodeConfigChange } = data;

  const addInput = () => {
    // Check if the callback exists before calling it
    if (onNodeConfigChange) {
      onNodeConfigChange(id, { numInputs: numInputs + 1 });
    }
  };

  const removeInput = () => {
    if (onNodeConfigChange && numInputs > 1) {
      onNodeConfigChange(id, { numInputs: numInputs - 1 });
    }
  };
  
  const inputHandles = Array.from({ length: numInputs }, (_, i) => (
    <div className="dynamic-handle" key={`in_${i + 1}`}>
      <Handle
        type="target"
        position={Position.Left}
        id={`in_${i + 1}`}
        data-dtype="string"
      />
      <label>Text {i + 1}</label>
    </div>
  ));

  return (
    <BaseNodeComponent id={id} data={data} type={ConcatNodeLogic.type}>
      <div className="concat-controls">
        <button onClick={addInput}>+ Add Input</button>
        <button onClick={removeInput} disabled={numInputs <= 1}>- Remove</button>
      </div>
      <div className="dynamic-handles-container">
        {inputHandles}
      </div>
      <Handle type="source" position={Position.Right} id="text" data-dtype="string" />
    </BaseNodeComponent>
  );
};

// Configuration
export const ConcatNodeConfig = {
  type: ConcatNodeLogic.type,
  label: 'Concatenate Text',
  logic: ConcatNodeLogic,
  component: memo(ConcatNodeComponent),
  defaultData: { numInputs: 2 },
};