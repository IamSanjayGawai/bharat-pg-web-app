import axios from 'axios';

const api = axios.create({
  // Use VITE_API_URL if available, otherwise default to the production Render URL
  baseURL: import.meta.env.VITE_API_URL || 'https://pg-h20i.onrender.com/api', 
});

// Request interceptor to add the token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
