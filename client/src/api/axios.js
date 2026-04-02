import axios from 'axios';

const api = axios.create({
    // DOUBLE CHECK: Ensure this matches your ASP.NET Running Port (Swagger URL)
    baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159'}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Attach JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the server returns 401 (Unauthorized), the session is dead
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;