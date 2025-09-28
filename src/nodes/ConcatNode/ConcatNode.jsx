// src/nodes/ConcatNode/ConcatNode.jsx (No changes needed, but shown for context)
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from '../../core/BaseNode';
import BaseNodeComponent from '../../core/BaseNodeComponent';

// Logic Class
export class ConcatNodeLogic extends BaseNode {
  static type = 'concatNode';
  static outputs = { text: { dtype: 'string' } };
  
  // No static 'inputs' property because it's instance-specific.
  
  async update(inputs) {
    // The received 'inputs' object will have keys like 'in_1', 'in_2' etc.
    // Object.values() correctly grabs all incoming data regardless of the key.
    const concatenatedText = Object.values(inputs).join('\n');
    return { text: concatenatedText };
  }
}

// UI Component
const ConcatNodeComponent = ({ id, data }) => {
  const { numInputs = 2, onUpdateNodeData } = data;

  const addInput = () => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { numInputs: numInputs + 1 });
    }
  };

  const removeInput = () => {
    if (onUpdateNodeData && numInputs > 1) {
      onUpdateNodeData(id, { numInputs: numInputs - 1 });
    }
  };
  
  const inputHandles = Array.from({ length: numInputs }, (_, i) => (
    <div className="dynamic-handle" key={`in_${i + 1}`}>
      <Handle
        type="target"
        position={Position.Left}
        id={`in_${i + 1}`}
        data-dtype="string" // The UI handle knows its type
        style={{ top: `${(i + 1) * 20 + 20}px` }}
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