import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, User, PlusCircle } from 'lucide-react';
import { getUserInfo } from '../utils/authUtils';

const Sidebar = () => {
    const user = getUserInfo();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="d-flex flex-column vh-100 p-3 bg-light border-end" style={{ width: '250px' }}>
            <h3 className="fw-bold text-primary mb-4 text-center">DAWN</h3>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <Link to="/dashboard" className="nav-link active mb-2">
                        <LayoutDashboard size={20} className="me-2" /> Dashboard
                    </Link>
                </li>
                <li>
                    <Link to="/courses" className="nav-link link-dark mb-2">
                        <BookOpen size={20} className="me-2" /> All Courses
                    </Link>
                </li>
                {/* Teacher Only Links */}
                {user?.role === 'Teacher' && (
                    <li>
                        <Link to="/create-course" className="nav-link link-dark mb-2">
                            <PlusCircle size={20} className="me-2" /> Create Course
                        </Link>
                    </li>
                )}
            </ul>
            <hr />
            <div className="dropdown">
                <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center" onClick={handleLogout}>
                    <LogOut size={18} className="me-2" /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;