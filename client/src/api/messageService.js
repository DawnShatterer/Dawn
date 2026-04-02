import api from './axios';

export const getConversations = async () => {
    const res = await api.get('/Messages/conversations');
    return res.data;
};

export const getHistory = async (userId) => {
    const res = await api.get(`/Messages/history/${userId}`);
    return res.data;
};

export const markMessagesRead = async (userId) => {
    const res = await api.post(`/Messages/mark-read/${userId}`);
    return res.data;
};

export const searchUsers = async (query) => {
    const res = await api.get(`/Messages/users/search?q=${encodeURIComponent(query)}`);
    return res.data;
};

export const getUnreadMessageCount = async () => {
    const res = await api.get('/Messages/unread-count');
    return res.data;
};
