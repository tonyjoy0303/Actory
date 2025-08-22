import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Your backend API URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to every request if it exists
API.interceptors.request.use((config) => {
  // We will store the token in localStorage after login
  const token = localStorage.getItem('token'); 

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;