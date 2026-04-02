import api from './axios';

/**
 * Enroll the current student in a course.
 * @param {number} courseId
 */
export const enrollInCourse = async (courseId) => {
    const response = await api.post('/Enrollments', { courseId });
    return response.data;
};

/**
 * Unenroll the current student from a course.
 * @param {number} courseId
 */
export const unenrollFromCourse = async (courseId) => {
    const response = await api.delete(`/Enrollments/${courseId}`);
    return response.data;
};

/**
 * Get all courses the current student is enrolled in.
 */
export const getMyEnrollments = async () => {
    const response = await api.get('/Enrollments/my');
    return response.data;
};

/**
 * Get all students enrolled in a specific course (teacher view).
 * @param {number} courseId
 */
export const getCourseStudents = async (courseId) => {
    const response = await api.get(`/Enrollments/course/${courseId}`);
    return response.data;
};

/**
 * Check if the current user is enrolled in a specific course.
 * @param {number} courseId
 */
export const checkEnrollment = async (courseId) => {
    const response = await api.get(`/Enrollments/check/${courseId}`);
    return response.data;
};
