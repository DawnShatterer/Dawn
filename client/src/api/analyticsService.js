import api from './axios';

export const getTeacherAnalytics = async () => {
    const response = await api.get('/Analytics/teacher');
    return response.data;
};

export const getStudentProgress = async () => {
    const response = await api.get('/Analytics/student');
    return response.data;
};
