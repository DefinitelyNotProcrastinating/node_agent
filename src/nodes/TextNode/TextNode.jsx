// src/nodes/TextNode/TextNode.jsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from '../../core/BaseNode';
import BaseNodeComponent from '../../core/BaseNodeComponent';

// Logic Class
export class TextNodeLogic extends BaseNode {
  static type = 'textNode';
  static inputs = { in_text: { dtype: 'string' } };
  static outputs = { out_text: { dtype: 'string' } };

  // This node can always run, as its input is optional.
  isInputReady() {
    return true;
  }

  async update(inputs) {
    const inputText = inputs.in_text || '';
    const ownText = this.data.text || '';
    
    // Concatenate input text with its own text.
    const combinedText = `${inputText}${inputText && ownText ? '\n' : ''}${ownText}`;
    
    return { out_text: combinedText };
  }

}


const TextNodeComponent = ({ id, data }) => {
  const [currentText, setCurrentText] = useState(data.text || '');

  useEffect(() => {
    setCurrentText(data.text || '');
  }, [data.text]);

  const handleTextChange = (evt) => {
    setCurrentText(evt.target.value);
  };

  const handleBlur = () => {
    // --- UPDATED: Use the new, more powerful callback ---
    // This will update the UI and also notify the running orchestrator.
    if (data.onNodeConfigChange) {
      data.onNodeConfigChange(id, { text: currentText });
    }
  };

  return (
    <BaseNodeComponent id={id} data={data} type={TextNodeLogic.type}>
      <textarea
        value={currentText}
        onChange={handleTextChange}
        onBlur={handleBlur} // The trigger for live updates
        className="nodrag"
        rows="3"
        placeholder="Enter text here..."
      />
      <Handle type="target" position={Position.Left} id="in_text" data-dtype={TextNodeLogic.inputs.in_text.dtype} />
      <Handle type="source" position={Position.Right} id="out_text" data-dtype={TextNodeLogic.outputs.out_text.dtype} />
    </BaseNodeComponent>
  );
};

// Configuration
export const TextNodeConfig = {
  type: TextNodeLogic.type,
  label: 'Text Node',
  logic: TextNodeLogic,
  component: memo(TextNodeComponent),
  defaultData: { text: '' },
};