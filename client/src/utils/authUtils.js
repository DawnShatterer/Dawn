import { jwtDecode } from 'jwt-decode';

export const getUserInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // ASP.NET Core uses specific claim names
        return {
            id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            name: decoded.FullName || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.email,
            nickName: decoded.NickName || '',
            phone: decoded.Phone || '',
            location: decoded.Location || '',
            grade: decoded.Grade || '',
            profilePictureUrl: decoded.ProfilePictureUrl || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.profilePictureUrl : '') || ''
        };
    } catch (error) {
        return null;
    }
};