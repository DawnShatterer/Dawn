import api from './axios';

export const uploadCertificate = async (formData) => {
    const response = await api.post('/Certificates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getMyCertificates = async () => {
    const response = await api.get('/Certificates/my');
    return response.data;
};

export const getStudentCertificates = async (studentId) => {
    const response = await api.get(`/Certificates/student/${studentId}`);
    return response.data;
};

export const deleteCertificate = async (id) => {
    const response = await api.delete(`/Certificates/${id}`);
    return response.data;
};

export const getStudentDetails = async (studentId) => {
    const response = await api.get(`/Auth/student/${studentId}`);
    return response.data;
};
