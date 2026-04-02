import api from './axios';

export const getMyBranding = async () => {
    const response = await api.get('/Institutions/my-branding');
    return response.data;
};
