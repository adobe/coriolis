import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Coriolis } from '@adobe/coriolis';

const coriolis = new Coriolis(window.parent, 'http://localhost:8080');
(window as any).coriolis = coriolis;
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App coriolis={coriolis}/>
  </React.StrictMode>
);
