import process from 'process';
import { Buffer } from 'buffer';

window.global = window; // Polyfill `global`
window.process = process; // Polyfill `process`
window.Buffer = Buffer; // Polyfill `Buffer`



import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
