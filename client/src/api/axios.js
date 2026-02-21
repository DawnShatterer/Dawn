import axios from 'axios';

const api = axios.create({
    // Your ASP.NET API URL
    baseURL: 'http://localhost:5159/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Automatically add JWT to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;