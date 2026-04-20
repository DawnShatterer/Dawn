import api from './axios';

export const getMyBranding = async () => {
    const response = await api.get('/Institutions/my-branding');
    return response.data;
};

export const getPublicBranding = async () => {
    const response = await api.get('/Institutions/public');
    return response.data;
};
