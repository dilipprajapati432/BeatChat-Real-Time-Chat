const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' 
  ? 'https://beatchat-backend.onrender.com' // Example Render URL
  : 'http://localhost:5000');

export default API_URL;
