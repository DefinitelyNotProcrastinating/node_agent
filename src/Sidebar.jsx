import React from 'react';

// This function is triggered when a drag operation starts
const onDragStart = (event, nodeType) => {
  // We store the node type in the dataTransfer object
  // This allows the onDrop handler in the main workflow to know what kind of node to create
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h3>Nodes Panel</h3>
      <div
        className="dnd-node input"
        onDragStart={(event) => onDragStart(event, 'input')}
        draggable
      >
        Input Node
      </div>
      <div
        className="dnd-node default"
        onDragStart={(event) => onDragStart(event, 'default')}
        draggable
      >
        Process Node
      </div>
      <div
        className="dnd-node output"
        onDragStart={(event) => onDragStart(event, 'output')}
        draggable
      >
        Output Node
      </div>
      <div
        className="dnd-node"
        onDragStart={(event) => onDragStart(event, 'multiInput')}
        draggable
        style={{ borderColor: '#6a1b9a', color: '#6a1b9a' }} // Give it a unique color
      >
        Multi-Input Node
      </div>
    <div
        className="dnd-node"
        onDragStart={(event) => onDragStart(event, 'apiNode')}
        draggable
      >
        API Call Node
      </div>
    </aside>
  );
};

export default Sidebar;