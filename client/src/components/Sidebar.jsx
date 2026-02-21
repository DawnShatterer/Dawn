import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, PlusCircle } from 'lucide-react';
import { getUserInfo } from '../utils/authUtils';

const Sidebar = () => {
    const user = getUserInfo();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Helper function to check if a link is active
    const getLinkClass = (path) => {
        return location.pathname === path
            ? "nav-link active mb-2"
            : "nav-link link-dark mb-2";
    };

    // Normalize role check to handle 'Teacher', 'teacher', etc.
    const isTeacher = user?.role?.toLowerCase() === 'teacher';

    return (
        <div className="d-flex flex-column vh-100 p-3 bg-white border-end shadow-sm" style={{ width: '250px' }}>
            <div className="text-center mb-4">
                <h3 className="fw-bold text-primary">DAWN</h3>
                <span className="badge bg-light text-primary border text-uppercase">
                    {user?.role || 'User'}
                </span>
            </div>

            <hr />

            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                        <LayoutDashboard size={20} className="me-2" /> Dashboard
                    </Link>
                </li>

                <li>
                    <Link to="/courses" className={getLinkClass('/courses')}>
                        <BookOpen size={20} className="me-2" /> All Courses
                    </Link>
                </li>

                {/* Teacher Only Links - Checks for case-insensitive 'teacher' */}
                {isTeacher && (
                    <li>
                        <Link to="/create-course" className={getLinkClass('/create-course')}>
                            <PlusCircle size={20} className="me-2" /> Create Course
                        </Link>
                    </li>
                )}
            </ul>

            <hr />

            <div className="px-2 pb-2">
                <div className="small text-muted mb-2 text-truncate text-center">
                    {user?.email}
                </div>
                <button
                    className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                    onClick={handleLogout}
                >
                    <LogOut size={18} className="me-2" /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;