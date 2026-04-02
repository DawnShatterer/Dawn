import api from './axios';

export const getCourseLiveClasses = async (courseId) => {
    const response = await api.get(`/LiveClasses/course/${courseId}`);
    return response.data;
};

export const createLiveClass = async (data) => {
    const response = await api.post('/LiveClasses', data);
    return response.data;
};

export const deleteLiveClass = async (id) => {
    const response = await api.delete(`/LiveClasses/${id}`);
    return response.data;
};
