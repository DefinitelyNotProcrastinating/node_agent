// src/nodes/TextDisplayNode/TextDisplayNode.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from '../../core/BaseNode';
import BaseNodeComponent from '../../core/BaseNodeComponent';

// Logic Class
export class TextDisplayNodeLogic extends BaseNode {
  static type = 'textDisplayNode';
  static inputs = { in_text: { dtype: 'string' } };
  static outputs = {}; // No outputs

  async update(inputs) {
    // Pass the input text to the runtime output so the component can display it.
    return { text: inputs.in_text || '' };
  }
}

// UI Component
const TextDisplayNodeComponent = ({ id, data }) => {
  const displayText = data.runtime?.output?.text ?? '(Waiting for input...)';

  return (
    <BaseNodeComponent id={id} data={data} type={TextDisplayNodeLogic.type}>
      <div className="node-output">
        <pre>{displayText}</pre>
      </div>
      <Handle type="target" position={Position.Left} id="in_text" data-dtype={TextDisplayNodeLogic.inputs.in_text.dtype} />
    </BaseNodeComponent>
  );
};

// Configuration
export const TextDisplayNodeConfig = {
  type: TextDisplayNodeLogic.type,
  label: 'Text Display',
  logic: TextDisplayNodeLogic,
  component: memo(TextDisplayNodeComponent),
  defaultData: {},
};