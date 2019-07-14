import React from 'react';
import './App.css';
import ReactColorWheel from './react-color-wheel';

function App() {
  return <div>
    <ReactColorWheel radius={256} onChange={ (color)=>document.body.style.background = color }/>
  </div>
}

export default App;
