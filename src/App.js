import React from 'react';
import './App.css';
import ColorWheel from './color-wheel';

function App() {
  return <div style={{position: 'absolute', width: '100vw', height: '100vh'}}>
    <ColorWheel />
    <input type="range" min={0} max={360} />
  </div>
}

export default App;
