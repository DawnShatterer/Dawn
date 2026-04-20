import React from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import AITutorChatbot from './AITutorChatbot';
import { getUserInfo } from '../utils/authUtils';
import { getFileUrl } from '../utils/fileUtils';
import { useQuery } from '@tanstack/react-query';
import { getMyBranding } from '../api/institutionService';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Dropdown } from 'react-bootstrap';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSessionTracker } from '../hooks/useSessionTracker';

import { Helmet } from 'react-helmet-async';

const Layout = ({ children }) => {
    const user = getUserInfo();
    const navigate = useNavigate();
    useSessionTracker();
    const location = useLocation();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const isStudent = user?.role?.toLowerCase() === 'student';
    const isDark = resolvedTheme === 'dark';

    const { data: branding } = useQuery({
        queryKey: ['branding'],
        queryFn: getMyBranding,
        staleTime: 5 * 60 * 1000
    });

    const handleLogoutClick = () => {
        doLogout();
    };
    
    const doLogout = () => { localStorage.clear(); navigate('/login'); };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <>
        <Helmet>
            <title>{branding?.name || 'Dawn Platform'} - Secure Learning</title>
            <meta name="description" content={branding?.description || "A Professional Learning Management System for the modern age."} />
        </Helmet>
        
        <div className="d-flex bg-body-tertiary text-body" style={{ minHeight: '100vh' }}>
            <Sidebar />

            <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: 'hidden' }}>
                {/* ─── Top Navigation Bar ─── */}
                <header className="px-4 py-0 d-flex justify-content-between align-items-center sticky-top" style={{ height: '65px', zIndex: 1020, background: isDark ? 'rgba(17, 19, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, transition: 'all 0.3s' }}>
                    
                    {/* Left: Empty space since Logo is in Sidebar */}
                    <div className="d-flex align-items-center">
                    </div>

                    {/* Right: Greetings + Search + Theme + Notifications + Profile */}
                    <div className="d-flex align-items-center gap-4">
                        <span className="text-muted d-none d-lg-block" style={{ fontSize: '0.85rem' }}>
                            Welcome back, <span className="fw-bold text-body">{user?.name}</span>
                        </span>

                        {isStudent && (
                            <form onSubmit={handleSearch} className="d-none d-md-flex align-items-center rounded-pill px-3 py-2 ms-2" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', transition: 'all 0.3s' }}>
                                <i className="bi bi-search text-muted me-2" style={{ fontSize: '16px' }}></i>
                                <input 
                                    type="text" 
                                    className="form-control border-0 bg-transparent shadow-none p-0 focus-ring focus-ring-light" 
                                    placeholder="Search courses..." 
                                    style={{ width: '200px', fontSize: '0.85rem' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        )}

                        {/* Direct Theme Toggle Button (like Homepage request) */}
                        <button 
                            onClick={() => setTheme(isDark ? 'light' : 'dark')} 
                            className={`btn btn-link p-1 text-decoration-none transition ${isDark ? 'text-white-50 hover-white' : 'text-secondary hover-dark'}`} 
                            aria-label="Toggle theme"
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            {isDark ? <i className="bi bi-sun" style={{ fontSize: '20px' }}></i> : <i className="bi bi-moon" style={{ fontSize: '20px' }}></i>}
                        </button>

                        {/* Custom minimal rendering for Bell to match the style */}
                        <div style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>
                            <NotificationBell />
                        </div>

                        {/* Profile Dropdown */}
                        <Dropdown align="end">
                            <Dropdown.Toggle
                                as="button"
                                id="profile-dropdown"
                                className="btn p-0 border-0 shadow-none d-flex align-items-center ms-2 no-caret"
                                style={{ background: 'none' }}
                            >
                                {user?.profilePictureUrl ? (
                                    <img
                                        src={getFileUrl(user.profilePictureUrl)}
                                        alt="Avatar"
                                        className="rounded-circle"
                                        style={{ width: '38px', height: '38px', objectFit: 'cover', border: `2px solid ${isDark ? '#333' : '#0d6efd'}` }}
                                    />
                                ) : (
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                        style={{ width: '38px', height: '38px', fontSize: '1rem', border: `2px solid ${isDark ? '#333' : '#0d6efd'}`, color: '#0d6efd', background: '#e6f0ff' }}
                                    >
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <i className="bi bi-chevron-down ms-1 text-muted" style={{ fontSize: '14px' }}></i>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="shadow border-0 rounded-4 mt-2 p-0 overflow-hidden" style={{ minWidth: '260px' }}>
                                <div className="px-4 py-3 d-flex align-items-center gap-3 border-bottom" style={{ background: 'var(--bs-body-bg)' }}>
                                    {user?.profilePictureUrl ? (
                                        <img src={getFileUrl(user.profilePictureUrl)} alt="Avatar" className="rounded-circle flex-shrink-0" style={{ width: '52px', height: '52px', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '52px', height: '52px' }}>
                                            <i className="bi bi-person text-primary" style={{ fontSize: '26px' }}></i>
                                        </div>
                                    )}
                                    <div className="overflow-hidden">
                                        <p className="fw-bold mb-0 text-body text-truncate" style={{ fontSize: '0.95rem' }}>{user?.name || 'User'}</p>
                                        <p className="text-muted mb-0 text-truncate" style={{ fontSize: '0.75rem' }}>{user?.nickName || user?.email}</p>
                                    </div>
                                </div>

                                <div className="px-4 py-2 border-bottom">
                                    <div className="d-flex align-items-center gap-2 py-1">
                                        <i className="bi bi-envelope text-muted flex-shrink-0" style={{ fontSize: '14px' }}></i>
                                        <span className="small text-muted text-truncate">{user?.email}</span>
                                    </div>
                                    {user?.location && (
                                        <div className="d-flex align-items-center gap-2 py-1">
                                            <i className="bi bi-geo-alt text-muted flex-shrink-0" style={{ fontSize: '14px' }}></i>
                                            <span className="small text-muted">{user.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="px-2 py-2">
                                    <Dropdown.Item onClick={() => navigate('/profile')} className="rounded-3 d-flex align-items-center gap-2 py-2 px-3 fw-medium">
                                        <i className="bi bi-person text-primary" style={{ fontSize: '16px' }}></i> My Profile
                                    </Dropdown.Item>
                                    <Dropdown.Divider className="my-1" />
                                    <Dropdown.Item onClick={handleLogoutClick} className="rounded-3 d-flex align-items-center gap-2 py-2 px-3 fw-medium text-danger">
                                        <i className="bi bi-box-arrow-right" style={{ fontSize: '16px' }}></i> Logout
                                    </Dropdown.Item>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-grow-1 p-4 position-relative bg-body-tertiary">
                    {children}
                </main>
                <AITutorChatbot />
            </div>
        </div>

        </>
    );
};

export default Layout;