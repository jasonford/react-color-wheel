import React from 'react';
import './App.css';
import ReactColorWheel from './react-color-wheel';

function App() {
  return (
    <div>
      <ReactColorWheel
        radius={Math.min(window.innerHeight/2, window.innerWidth/2)}
        onChange={ (color)=>document.body.style.background = color }
      />
    </div>
  );
}

export default App;
