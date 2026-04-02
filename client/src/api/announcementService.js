import api from './axios';

export const getCourseAnnouncements = async (courseId) => {
    const res = await api.get(`/Announcements/course/${courseId}`);
    return res.data;
};

export const createAnnouncement = async (courseId, announcementData) => {
    const res = await api.post(`/Announcements/course/${courseId}`, announcementData);
    return res.data;
};
