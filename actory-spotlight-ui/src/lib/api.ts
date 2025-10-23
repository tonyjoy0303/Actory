import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for Render cold starts
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // We will store the token in localStorage after login
    const token = localStorage.getItem('token'); 

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic for network errors
API.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Retry logic for network errors (no response received)
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Only retry for critical requests (not file uploads)
      if (!originalRequest.url?.includes('/photo') && !originalRequest.url?.includes('/video')) {
        console.log('Retrying request due to network error:', originalRequest.url);
        
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          return await API(originalRequest);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;