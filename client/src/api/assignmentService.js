import api from './axios';

export const getCourseAssignments = async (courseId) => {
    const response = await api.get(`/Assignments/course/${courseId}`);
    return response.data;
};

export const createAssignment = async (data) => {
    const response = await api.post('/Assignments', data);
    return response.data;
};

export const deleteAssignment = async (id) => {
    const response = await api.delete(`/Assignments/${id}`);
    return response.data;
};

export const submitAssignmentFile = async (data) => {
    const response = await api.post('/Assignments/submit', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getAssignmentSubmissions = async (assignmentId) => {
    const response = await api.get(`/Assignments/assignment/${assignmentId}/all`);
    return response.data;
};

export const gradeSubmission = async (submissionId, data) => {
    const response = await api.post(`/Assignments/grade/${submissionId}`, data);
    return response.data;
};
