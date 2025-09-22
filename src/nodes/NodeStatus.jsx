import React from 'react';

const NodeStatus = ({ status }) => {
  // Corrected the closing tag from ">" to "/>"
  return <div className={`status-indicator ${status || 'pending'}`} title={`Status: ${status}`} />;
};

export default NodeStatus;