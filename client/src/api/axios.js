import axios from 'axios';
import { isTokenExpired, handleSessionExpiration } from '../utils/authUtils';

const api = axios.create({
    // DOUBLE CHECK: Ensure this matches your ASP.NET Running Port (Swagger URL)
    baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159'}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Attach JWT with expiration check
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
        // Check if token is expired before attaching
        if (isTokenExpired(token)) {
            // Prevent request from being sent
            handleSessionExpiration();
            return Promise.reject(new Error('Token expired'));
        }
        
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
            // Do not clear and redirect if we are already trying to login/register,
            // otherwise login error messages (like suspended accounts) get wiped by the refresh!
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                handleSessionExpiration('Your session has expired. Please log in again.');
            }
        }
        return Promise.reject(error);
    }
);

export default api;