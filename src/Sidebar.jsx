import React from 'react';

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h3>Nodes Panel</h3>
      <p>Drag nodes to the canvas.</p>
      
      <div className="dnd-node" onDragStart={(event) => onDragStart(event, 'textInputTrigger')} draggable>
        Text Input Trigger
      </div>
      
      <div className="dnd-node" onDragStart={(event) => onDragStart(event, 'llmNode')} draggable>
        LLM Node
      </div>

      <div className="dnd-node" onDragStart={(event) => onDragStart(event, 'multiInput')} draggable>
        Concatenate Node
      </div>
      
      <div className="dnd-node" onDragStart={(event) => onDragStart(event, 'apiNode')} draggable>
        API Call Node
      </div>

      <div className="dnd-node" onDragStart={(event) => onDragStart(event, 'textDisplayNode')} draggable>
        Text Display Node
      </div>

    </aside>
  );
};

export default Sidebar;