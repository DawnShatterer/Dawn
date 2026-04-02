import React from 'react';
import { Container } from 'react-bootstrap';
import { BookOpen, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PublicNavbar = () => {
    const { theme, setTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <nav
            className={`navbar navbar-expand-lg fixed-top shadow-sm w-100 ${isDark ? 'navbar-dark' : 'navbar-light'}`}
            style={{
                background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                padding: '15px 0',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}
        >
            <Container>
                <Link className="navbar-brand d-flex align-items-center fw-bolder text-body me-5" to="/" style={{ letterSpacing: '-0.5px' }}>
                    <div className="bg-primary text-white p-2 rounded me-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                        <BookOpen size={20} />
                    </div>
                    <div className="d-flex flex-column">
                        <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>Dawn</span>
                        <span className="text-muted" style={{ fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.5px' }}>LEARNING PLATFORM</span>
                    </div>
                </Link>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#homeNavbar">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="homeNavbar">
                    <ul className="navbar-nav ms-5 mb-2 mb-lg-0 fw-semibold gap-lg-4" style={{ fontSize: '0.95rem' }}>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/dawn-platform">Products</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/content">Solutions</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/help">Community</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/about-us">Company</Link>
                        </li>
                    </ul>

                    <div className="d-flex align-items-center gap-4 ms-auto mt-3 mt-lg-0">
                        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`btn btn-link p-0 text-decoration-none ${isDark ? 'text-white-50 hover-white' : 'text-secondary hover-dark'} transition`} aria-label="Toggle theme">
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link to="/login" className={`fw-semibold text-decoration-none hover-primary transition ${isDark ? 'text-white-50' : 'text-secondary'}`}>Log in</Link>
                        <Link to="/register" className="btn fw-bold px-4 py-2 rounded-pill shadow-sm text-white" style={{ fontSize: '0.9rem', backgroundColor: '#e84c6c', border: 'none' }}>
                            Get demo
                        </Link>
                    </div>
                </div>
            </Container>
        </nav>
    );
};

export default PublicNavbar;
