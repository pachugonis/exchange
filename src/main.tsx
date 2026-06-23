import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Admin credentials are provisioned server-side (see server/ — ADMIN_EMAIL /
// ADMIN_PASSWORD seed). No default password is shipped to the client anymore.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
