import api from './axios';

export const getCourses = async () => {
    const response = await api.get('/Courses');
    return response.data;
};


export const createCourse = async (courseData) => {
    const response = await api.post('/Courses', courseData);
    return response.data;
};