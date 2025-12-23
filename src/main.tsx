import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize admin credentials from server configuration if available
(async () => {
  try {
    // Check if admin password is already set
    const adminStorage = localStorage.getItem('admin-storage');
    
    console.log('[Admin Init] Current admin storage:', adminStorage ? 'exists' : 'not found');
    
    // Only initialize if no admin storage exists or password is default
    if (!adminStorage || JSON.parse(adminStorage)?.state?.password === 'admin123') {
      console.log('[Admin Init] Fetching initialization config...');
      // Try to fetch initialization config from server
      const response = await fetch('/.admin-storage-init.json');
      console.log('[Admin Init] Fetch response:', response.status, response.ok);
      
      if (response.ok) {
        const initConfig = await response.json();
        console.log('[Admin Init] Loaded config:', { hasPassword: !!initConfig.state?.password });
        
        // Merge with existing storage or create new
        const existingStorage = adminStorage ? JSON.parse(adminStorage) : { version: 0 };
        const newStorage = {
          ...existingStorage,
          state: {
            ...existingStorage.state,
            ...initConfig.state,
            isAuthenticated: false,
            username: null,
          },
          version: initConfig.version || 0,
        };
        
        localStorage.setItem('admin-storage', JSON.stringify(newStorage));
        console.log('[Admin Init] ✅ Admin credentials initialized from server configuration');
      } else {
        console.log('[Admin Init] ⚠️ Init file not found, using defaults');
      }
    } else {
      console.log('[Admin Init] Admin already configured, skipping initialization');
    }
  } catch (error) {
    // Silently fail if initialization file doesn't exist (development mode)
    console.log('[Admin Init] ❌ Initialization error:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    // Always render the app, even if initialization fails
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
})();
