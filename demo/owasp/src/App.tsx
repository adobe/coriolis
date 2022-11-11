import React from 'react';
import logo from './coriolis-logo.svg';
import './App.css';
import CoriolisIframe from './CoriolisIframe';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <textarea id="html-input"></textarea>
        <CoriolisIframe html='ABCD' coriolisUrl='http://localhost:3000/' />
        {/* <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </header>
    </div>
  );
}

export default App;
