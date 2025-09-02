import React from 'react';
import Sidebar from './Sidebar';
import Workflow from './Workflow';

import './index.css'; // Import our custom styles

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <Workflow />
    </div>
  );
}

export default App;