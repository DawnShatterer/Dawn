import api from './axios';

export const getTeacherAnalytics = async () => {
    const response = await api.get('/Analytics/teacher');
    return response.data;
};

export const getStudentProgress = async () => {
    const response = await api.get('/Analytics/student');
    return response.data;
};

export const sendHeartbeat = async (sessionId, courseId = null, lessonId = null) => {
    let url = `/Analytics/heartbeat/${sessionId}?`;
    if (courseId) url += `courseId=${courseId}&`;
    if (lessonId) url += `lessonId=${lessonId}`;
    await api.post(url);
};

export const getStudentEngagement = async () => {
    const response = await api.get('/Analytics/student/engagement');
    return response.data;
};
