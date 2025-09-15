import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'

// TARGETED FIX: Block only the specific problematic /admin/avatar.png path
document.addEventListener('DOMContentLoaded', () => {
  // Global error handler for the specific problematic path
  document.addEventListener('error', (event) => {
    if (event.target.tagName === 'IMG' && event.target.src && event.target.src.includes('/admin/avatar.png')) {
      console.warn('Blocked problematic /admin/avatar.png request:', event.target.src);
      event.target.onerror = null; // Prevent infinite loop
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNlZWUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMmM0IDAgNCAyIDQgNGgtOGMwLTIgMC00IDQtNFptMC0xYzEuNjU2IDAgMy0xLjM0NCAzLTNTMTMuNjU2IDUgMTIgNSA5IDYuMzQ0IDkgOHMxLjM0NCAzIDMgM1oiIGZpbGw9IiM5OTkiLz4KPHN2Zz4KPHN2Zz4K';
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
