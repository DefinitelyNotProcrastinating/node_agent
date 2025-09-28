// src/core/Sidebar.jsx
import React from 'react';
import nodeRegistry from '../nodes'; // Import the central registry

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h3>Nodes Panel</h3>
      <p>Drag nodes to the canvas.</p>
      
      {/* Dynamically generate node buttons from the registry */}
      {Object.values(nodeRegistry).map((config) => (
        <div
          key={config.type}
          className="dnd-node"
          onDragStart={(event) => onDragStart(event, config.type)}
          draggable
        >
          {config.label}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;