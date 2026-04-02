import api from './axios';

/**
 * Get all lessons for a specific course.
 * @param {number} courseId
 */
export const getCourseLessons = async (courseId) => {
    const response = await api.get(`/Lessons/course/${courseId}`);
    return response.data;
};

/**
 * Create a new lesson (teacher only).
 * FormData must contain: title, description, order, courseId, videoFile, pdfFile.
 * @param {FormData} formData
 */
export const createLesson = async (formData) => {
    const response = await api.post('/Lessons', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Delete a lesson (teacher only).
 * @param {number} lessonId
 */
export const deleteLesson = async (lessonId) => {
    const response = await api.delete(`/Lessons/${lessonId}`);
    return response.data;
};
