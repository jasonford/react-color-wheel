import React from 'react';
import './App.css';
import ColorWheel from './color-wheel';

function App() {
  return <div style={{position: 'absolute', width: '100vw', height: '100vh'}}>
    <ColorWheel hueSegments={36} saturationSegments={9} lightnessSegments={18}/>
  </div>
}

export default App;
