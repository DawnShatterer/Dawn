import api from './axios';

/**
 * Fetches all courses from the database.
 * Accessible by: Students, Teachers, Admins
 */
export const getCourses = async (page = 1, limit = 10, search = "") => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    const response = await api.get(`/Courses?${params.toString()}`);
    return response.data;
};

export const getRecommendedCourses = async () => {
    const response = await api.get('/Courses/recommended');
    return response.data;
};

export const getCourseById = async (id) => {
    const response = await api.get(`/Courses/${id}`);
    return response.data;
};

/**
 * Creates a new course.
 * Accessible by: Teachers, Admins
 * @param {Object} courseData - { title, description, price }
 */
export const createCourse = async (formData) => {
    const response = await api.post('/Courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateCourse = async (id, formData) => {
    const response = await api.put(`/Courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Deletes a specific course by ID.
 * Accessible by: Teachers (Owner), Admins
 * @param {number} id - The ID of the course to delete
 */
export const deleteCourse = async (id) => {
    const response = await api.delete(`/Courses/${id}`);
    return response.data;
};



/**
 * Phase 3: Enroll a student in a course
 * Accessible by: Students
 * @param {number} courseId - The ID of the course to join
 */
export const enrollInCourse = async (courseId) => {
    // This assumes your backend has an Enrollment endpoint
    const response = await api.post(`/Enrollments`, { courseId });
    return response.data;
};