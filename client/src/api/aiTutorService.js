import api from './axios';

export const askTutor = async (message, courseId = null) => {
    const res = await api.post('/AITutor/ask', { message, courseId });
    // Return full object with response + suggestions
    return { response: res.data.response, suggestions: res.data.suggestions || [] };
};
