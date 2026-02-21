import api from './axios';

export const loginUser = async (credentials) => {
    const response = await api.post('/Auth/login', credentials);
    return response.data; // This returns the { token, expiration, user } object we built in C#
};

export const registerUser = async (userData) => {
    const response = await api.post('/Auth/register', userData);
    return response.data;
};