import API from './axios';

export const submitPlatformRating = async ({ score, comment }) => {
    const response = await API.post('/Public/rating', { score, comment });
    return response.data;
};
