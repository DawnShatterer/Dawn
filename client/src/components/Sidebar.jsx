import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getUserInfo } from '../utils/authUtils';
import { useQuery } from '@tanstack/react-query';
import { getMyBranding } from '../api/institutionService';
import { getUnreadMessageCount } from '../api/messageService';

const Sidebar = () => {
    const user = getUserInfo();
    const navigate = useNavigate();
    const location = useLocation();

    const { data: branding } = useQuery({ queryKey: ['branding'], queryFn: getMyBranding });
    const { data: unreadMsgCount } = useQuery({ queryKey: ['unread-messages'], queryFn: getUnreadMessageCount, refetchInterval: 5000 });

    const isActive = (path) => location.pathname === path;
    const getLinkClass = (path) => {
        const base = "nav-link d-flex align-items-center py-2 px-3 mb-2 rounded-3 fw-bold transition ";
        return isActive(path) 
            ? base + "active text-white shadow-lg" 
            : base + "text-secondary hover-bg-dark opacity-100";
    };

    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isStaff = user?.role?.toLowerCase() === 'staff';
    const isStudent = user?.role?.toLowerCase() === 'student';

    // The explicit request asks for standard bootstrap primary blue, so we'll enforce the blue color on the active state.
    const activeStyle = { background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', border: '1px solid rgba(255,255,255,0.1)' };

    return (
        <div className="d-flex flex-column vh-100 position-sticky top-0 shadow-lg border-end" style={{ width: '250px', flexShrink: 0, zIndex: 10, background: '#111318', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            {/* Logo Section */}
            <div className="p-4 d-flex flex-column align-items-start border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="d-flex align-items-center w-100 mb-3">
                    <div className="position-relative d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                        <span style={{ 
                            fontSize: '3rem', 
                            fontWeight: '900', 
                            color: '#fff',
                            fontFamily: 'Arial Black, sans-serif',
                            lineHeight: '1'
                        }}>D</span>
                        <span style={{ 
                            position: 'absolute',
                            fontSize: '1.5rem',
                            fontWeight: '900',
                            color: '#fff',
                            fontFamily: 'Arial Black, sans-serif',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}>A</span>
                    </div>
                    <div className="text-start overflow-hidden">
                        <h3 className="fw-bolder mb-0 lh-1 text-white text-truncate" style={{ letterSpacing: '-0.5px' }}>Dawn</h3>
                        <small className="fw-bold d-block text-uppercase text-truncate" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', marginTop: '4px', color: '#8b949e' }}>Learning Platform</small>
                    </div>
                </div>
                
                {/* Role Badge (Pill) */}
                <div className="w-100 text-center">
                    <span 
                        className="badge text-uppercase w-100 py-2 rounded-2" 
                        style={{ 
                            fontSize: '0.75rem', 
                            letterSpacing: '0.5px',
                            background: 'rgba(13, 110, 253, 0.1)',
                            color: '#0d6efd',
                            border: '1px solid rgba(13, 110, 253, 0.2)'
                        }}
                    >
                        {isAdmin ? 'ADMIN' : (isStaff ? 'STAFF' : (isTeacher ? 'INSTRUCTOR' : 'STUDENT'))}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-3 flex-grow-1 overflow-auto">
                <ul className="nav nav-pills flex-column mb-auto">
                    {/* Common Links */}
                    <li>
                        <Link to={isAdmin || isStaff ? '/admin-home' : '/dashboard'} className={getLinkClass(isAdmin || isStaff ? '/admin-home' : '/dashboard')} style={isActive(isAdmin || isStaff ? '/admin-home' : '/dashboard') ? activeStyle : {}}>
                            <i className="bi bi-grid me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                            <span style={{ fontSize: '0.95rem' }}>Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/courses" className={getLinkClass('/courses')} style={isActive('/courses') ? activeStyle : {}}>
                            <i className="bi bi-book me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                            <span style={{ fontSize: '0.95rem' }}>Modules</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/messages" className={getLinkClass('/messages')} style={isActive('/messages') ? activeStyle : {}}>
                            <div className="position-relative me-3 d-inline-flex flex-shrink-0">
                                <i className="bi bi-chat-dots" style={{ fontSize: '20px' }}></i>
                                {unreadMsgCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem', padding: '3px 5px' }}>
                                        {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.95rem' }}>Chat Rooms</span>
                        </Link>
                    </li>

                    {/* Student Links */}
                    {isStudent && (
                        <>
                            <div className="text-uppercase fw-bolder mt-4 mb-3 ps-3" style={{ fontSize: '0.7rem', letterSpacing: '1px', color: '#8b949e' }}>
                                MY LEARNING
                            </div>
                            <li>
                                <Link to="/my-courses" className={getLinkClass('/my-courses')} style={isActive('/my-courses') ? activeStyle : {}}>
                                    <i className="bi bi-mortarboard me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                    <span style={{ fontSize: '0.95rem' }}>Classrooms</span>
                                </Link>
                            </li>

                            <li>
                                <Link to="/tuition" className={getLinkClass('/tuition')} style={isActive('/tuition') ? activeStyle : {}}>
                                    <i className="bi bi-credit-card me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                    <span style={{ fontSize: '0.95rem' }}>Tuition & Billing</span>
                                </Link>
                            </li>
                        </>
                    )}

                    {/* Admin & Staff Management Links */}
                    {(isAdmin || isStaff) && (
                        <>
                            <div className="text-uppercase fw-bolder mt-4 mb-3 ps-3" style={{ fontSize: '0.7rem', letterSpacing: '1px', color: '#8b949e' }}>
                                MANAGEMENT
                            </div>
                            
                            {isStaff && (
                                <li>
                                    <Link to="/admissions" className={getLinkClass('/admissions')} style={isActive('/admissions') ? activeStyle : {}}>
                                        <i className="bi bi-people me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                        <span style={{ fontSize: '0.95rem' }}>Admissions</span>
                                    </Link>
                                </li>
                            )}
                            
                            {(isAdmin || isStaff) && (
                                <li>
                                    <Link to="/admin-queries" className={getLinkClass('/admin-queries')} style={isActive('/admin-queries') ? activeStyle : {}}>
                                        <i className="bi bi-chat-dots me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                        <span style={{ fontSize: '0.95rem' }}>User Queries</span>
                                    </Link>
                                </li>
                            )}
                            
                            {(isAdmin || isStaff) && (
                                <li>
                                    <Link to="/create-course" className={getLinkClass('/create-course')} style={isActive('/create-course') ? activeStyle : {}}>
                                        <i className="bi bi-plus-circle me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                        <span style={{ fontSize: '0.95rem' }}>Create Module</span>
                                    </Link>
                                </li>
                            )}
                            
                            {(isAdmin || isStaff) && (
                                <li>
                                    <Link to="/admin-invoices" className={getLinkClass('/admin-invoices')} style={isActive('/admin-invoices') ? activeStyle : {}}>
                                        <i className="bi bi-receipt me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                        <span style={{ fontSize: '0.95rem' }}>Invoice Management</span>
                                    </Link>
                                </li>
                            )}
                            
                            {(isAdmin || isStaff) && (
                                <li>
                                    <Link to="/platform-analytics" className={getLinkClass("/platform-analytics")} style={isActive("/platform-analytics") ? activeStyle : {}}>
                                        <i className="bi bi-pie-chart me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                        <span style={{ fontSize: '0.95rem' }}>Platform Analytics</span>
                                    </Link>
                                </li>
                            )}
                        </>
                    )}

                    {/* Admin Only */}
                    {isAdmin && (
                        <>
                            <div className="text-uppercase fw-bolder mt-4 mb-3 ps-3" style={{ fontSize: '0.7rem', letterSpacing: '1px', color: '#8b949e' }}>
                                CONFIGURATION
                            </div>
                            <li>
                                <Link to="/admin" className={getLinkClass('/admin')} style={isActive('/admin') ? activeStyle : {}}>
                                    <i className="bi bi-shield-exclamation me-3 flex-shrink-0" style={{ fontSize: '20px' }}></i>
                                    <span style={{ fontSize: '0.95rem' }}>Site Admin</span>
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
