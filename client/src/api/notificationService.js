import api from './axios';

export const getMyNotifications = async () => {
    const response = await api.get('/Notifications');
    return response.data;
};

export const getUnreadCount = async () => {
    const response = await api.get('/Notifications/unread-count');
    return response.data;
};

export const markAsRead = async (id) => {
    const response = await api.post(`/Notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await api.post('/Notifications/read-all');
    return response.data;
};
