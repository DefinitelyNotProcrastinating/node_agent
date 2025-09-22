import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import NodeStatus from './NodeStatus';

const TextInputTriggerNode = ({ id, data }) => {
  const { onUpdate, isStartNode = false, text = '' } = data;

  const handleTextChange = (evt) => {
    onUpdate(id, { text: evt.target.value });
  };

  const handleCheckboxChange = (evt) => {
    onUpdate(id, { isStartNode: evt.target.checked });
  };

  return (
    <div className="react-flow__node-default">
      <div className="node-header">
        Text Input Trigger
        <NodeStatus status={data.runtime?.status} />
      </div>
      <div className="node-body">
        <label>
          <input
            type="checkbox"
            checked={isStartNode}
            onChange={handleCheckboxChange}
          />
          Start Node
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          className="nodrag"
          rows="4"
          placeholder="Enter your starting text or prompt here..."
        />
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default memo(TextInputTriggerNode);