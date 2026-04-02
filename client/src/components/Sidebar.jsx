import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, PlusCircle, User, GraduationCap, PieChart, ShieldAlert, MessageCircle, BellRing, Trophy } from 'lucide-react';
import { getUserInfo } from '../utils/authUtils';
import { useQuery } from '@tanstack/react-query';
import { getMyBranding } from '../api/institutionService';
import { getUnreadMessageCount } from '../api/messageService';
import { submitPlatformRating } from '../api/feedbackService';
import PlatformRatingModal from './PlatformRatingModal';

const Sidebar = () => {
    const user = getUserInfo();
    const navigate = useNavigate();
    const location = useLocation();
    const [showRatingModal, setShowRatingModal] = useState(false);

    const { data: branding } = useQuery({ queryKey: ['branding'], queryFn: getMyBranding });
    const { data: unreadMsgCount } = useQuery({ queryKey: ['unread-messages'], queryFn: getUnreadMessageCount, refetchInterval: 5000 });

    const hexToRgb = (hex) => {
        if (!hex) return "13, 110, 253";
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const bigint = parseInt(hex, 16);
        return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
    };

    const handleLogoutClick = () => {
        const isStudent = user?.role?.toLowerCase() === 'student';
        const loginCount = user?.loginCount || 0;
        
        if (isStudent && loginCount >= 4) {
            setShowRatingModal(true);
        } else {
            handleSkip();
        }
    };

    const handleRatingSubmit = async (score) => {
        try {
            await submitPlatformRating({ score });
        } catch (e) {
            // Silently fail - don't block logout
        }
        localStorage.clear();
        navigate('/login');
    };

    const handleSkip = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;
    const getLinkClass = (path) => {
        const base = "nav-link d-flex align-items-center py-2 px-3 mb-1 rounded-2 fw-medium ";
        return isActive(path) ? base + "active bg-primary text-white shadow-sm" : base + "text-body hover-bg-tertiary";
    };

    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isStudent = user?.role?.toLowerCase() === 'student';

    return (
        <>
            {branding && (
                <style>{`
                    :root {
                        --bs-primary: ${branding.primaryColor} !important;
                        --bs-primary-rgb: ${hexToRgb(branding.primaryColor)} !important;
                        --bs-secondary: ${branding.secondaryColor} !important;
                        --bs-secondary-rgb: ${hexToRgb(branding.secondaryColor)} !important;
                    }
                    .text-primary { color: var(--bs-primary) !important; }
                    .bg-primary { background-color: var(--bs-primary) !important; color: white !important; }
                    .btn-primary { background-color: var(--bs-primary) !important; border-color: var(--bs-primary) !important; color: white !important; }
                    .btn-outline-primary { color: var(--bs-primary) !important; border-color: var(--bs-primary) !important; }
                    .btn-outline-primary:hover { background-color: var(--bs-primary) !important; color: white !important; }
                    .nav-link.active { background-color: var(--bs-primary) !important; }
                    .hover-bg-tertiary:hover { background-color: var(--bs-secondary-bg); }
                `}</style>
            )}
            <div className="d-flex flex-column vh-100 bg-body border-end shadow-sm" style={{ width: '240px', flexShrink: 0 }}>
                {/* Logo */}
                <div className="text-center py-3 border-bottom">
                    {branding?.logoUrl && branding.logoUrl !== "/logo.png" ? (
                        <img src={branding.logoUrl} alt="Logo" style={{ maxHeight: '36px' }} className="mb-1" />
                    ) : (
                        <h4 className="fw-bold mb-0" style={{ letterSpacing: '-0.5px', color: 'var(--bs-primary)' }}>{branding?.name || 'DAWN'}</h4>
                    )}
                    <div className="mt-1">
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-uppercase px-2" style={{ fontSize: '0.6rem' }}>
                            {user?.role || 'User'}
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-3 flex-grow-1 overflow-auto">
                    <ul className="nav nav-pills flex-column mb-auto">
                        {/* Common Links */}
                        <li>
                            <Link to={isAdmin ? '/admin-home' : '/dashboard'} className={getLinkClass(isAdmin ? '/admin-home' : '/dashboard')}>
                                <LayoutDashboard size={17} className="me-2 flex-shrink-0" />
                                <span className="small">Home</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/courses" className={getLinkClass('/courses')}>
                                <BookOpen size={17} className="me-2 flex-shrink-0" />
                                <span className="small">Subjects</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/messages" className={getLinkClass('/messages')}>
                                <div className="position-relative me-2 d-inline-flex flex-shrink-0">
                                    <MessageCircle size={17} />
                                    {unreadMsgCount > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem', padding: '2px 4px' }}>
                                            {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                                        </span>
                                    )}
                                </div>
                                <span className="small">Chat Rooms</span>
                            </Link>
                        </li>

                        {/* Student Links */}
                        {isStudent && (
                            <>
                                <div className="text-uppercase text-muted fw-bold mt-3 mb-2 ps-2" style={{ fontSize: '0.6rem', letterSpacing: '0.06rem' }}>
                                    My Learning
                                </div>
                                <li>
                                    <Link to="/my-courses" className={getLinkClass('/my-courses')}>
                                        <GraduationCap size={17} className="me-2 flex-shrink-0" />
                                        <span className="small">Classrooms</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/leaderboard" className={getLinkClass('/leaderboard')}>
                                        <Trophy size={17} className="me-2 flex-shrink-0" />
                                        <span className="small">Hall of Fame</span>
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Teacher & Admin Links */}
                        {(isTeacher || isAdmin) && (
                            <>
                                <div className="text-uppercase text-muted fw-bold mt-3 mb-2 ps-2" style={{ fontSize: '0.6rem', letterSpacing: '0.06rem' }}>
                                    Management
                                </div>
                                <li>
                                    <Link to="/create-course" className={getLinkClass('/create-course')}>
                                        <PlusCircle size={17} className="me-2 flex-shrink-0" />
                                        <span className="small">Create Course</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to={isAdmin ? "/admin-home" : "/analytics"} className={getLinkClass(isAdmin ? "/admin-home" : "/analytics")}>
                                        <PieChart size={17} className="me-2 flex-shrink-0" />
                                        <span className="small">{isAdmin ? "Platform Analytics" : "Analytics"}</span>
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Admin Only */}
                        {isAdmin && (
                            <>
                                <div className="text-uppercase text-muted fw-bold mt-3 mb-2 ps-2" style={{ fontSize: '0.6rem', letterSpacing: '0.06rem' }}>
                                    Configuration
                                </div>
                                <li>
                                    <Link to="/admin" className={getLinkClass('/admin')}>
                                        <ShieldAlert size={17} className="me-2 flex-shrink-0" />
                                        <span className="small">Site Admin</span>
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Profile Link (Universal) */}
                        <div className="text-uppercase text-muted fw-bold mt-3 mb-2 ps-2" style={{ fontSize: '0.6rem', letterSpacing: '0.06rem' }}>
                            Account
                        </div>
                        <li>
                            <Link to="/profile" className={getLinkClass('/profile')}>
                                <User size={17} className="me-2 flex-shrink-0" />
                                <span className="small">My Profile</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Footer: Profile & Logout */}
                <div className="px-3 pb-3 border-top pt-3">
                    <div className="d-flex align-items-center mb-3">
                        {user?.profilePictureUrl ? (
                            <img src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${user.profilePictureUrl}`} alt="Avatar" className="rounded-circle me-2 flex-shrink-0" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                        ) : (
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0" style={{ width: '32px', height: '32px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="small fw-bold mb-0 text-truncate text-body">{user?.name || 'User Account'}</p>
                            <p className="text-muted mb-0 text-truncate" style={{ fontSize: '0.7rem' }}>{user?.email}</p>
                        </div>
                    </div>
                    <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center py-2 rounded-2 small" onClick={handleLogoutClick}>
                        <LogOut size={14} className="me-2" />
                        <span className="fw-bold">Logout</span>
                    </button>
                </div>
            </div>

            {/* Rating Modal */}
            <PlatformRatingModal
                show={showRatingModal}
                onSubmit={handleRatingSubmit}
                onSkip={handleSkip}
            />
        </>
    );
};

export default Sidebar;
