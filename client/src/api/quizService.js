import api from './axios';

export const getCourseQuizzes = async (courseId) => {
    const response = await api.get(`/Quizzes/course/${courseId}`);
    return response.data;
};

export const getQuizDetails = async (quizId) => {
    const response = await api.get(`/Quizzes/${quizId}`);
    return response.data;
};

export const createQuiz = async (data) => {
    const response = await api.post('/Quizzes', data);
    return response.data;
};

export const deleteQuiz = async (quizId) => {
    const response = await api.delete(`/Quizzes/${quizId}`);
    return response.data;
};

export const submitQuiz = async (quizId, submissionData) => {
    const response = await api.post(`/Quizzes/${quizId}/submit`, submissionData);
    return response.data;
};
