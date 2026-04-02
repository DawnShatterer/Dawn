import api from './axios';

export const getCourseThreads = async (courseId) => {
    const response = await api.get(`/Discussions/course/${courseId}`);
    return response.data;
};

export const getThreadDetails = async (threadId) => {
    const response = await api.get(`/Discussions/${threadId}`);
    return response.data;
};

export const createThread = async (data) => {
    const response = await api.post('/Discussions', data);
    return response.data;
};

export const createReply = async (threadId, content) => {
    const response = await api.post(`/Discussions/${threadId}/reply`, { content, threadId });
    return response.data;
};

export const deleteThread = async (threadId) => {
    const response = await api.delete(`/Discussions/${threadId}`);
    return response.data;
};

export const deleteReply = async (replyId) => {
    const response = await api.delete(`/Discussions/reply/${replyId}`);
    return response.data;
};
