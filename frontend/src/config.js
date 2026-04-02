const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' 
  ? 'https://beatchat-backend.onrender.com' 
  : 'http://localhost:5000')).replace(/\/$/, ''); // Remove trailing slash if any

export default API_URL;
