import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PublicNavbar = () => {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

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
                    <div className="position-relative d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                        <span style={{ 
                            fontSize: '2.5rem', 
                            fontWeight: '900', 
                            color: isDark ? '#fff' : '#000',
                            fontFamily: 'Arial Black, sans-serif',
                            lineHeight: '1'
                        }}>D</span>
                        <span style={{ 
                            position: 'absolute',
                            fontSize: '1.2rem',
                            fontWeight: '900',
                            color: isDark ? '#fff' : '#000',
                            fontFamily: 'Arial Black, sans-serif',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}>A</span>
                    </div>
                    <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>Dawn</span>
                </Link>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#homeNavbar">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="homeNavbar">
                    <ul className="navbar-nav ms-5 mb-2 mb-lg-0 fw-semibold gap-lg-4" style={{ fontSize: '0.95rem' }}>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/about-us">About us</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/contact">Contact</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/blog">Blog</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link hover-primary transition px-3 ${isDark ? 'text-white-50' : 'text-secondary'}`} to="/faq">FAQ</Link>
                        </li>
                    </ul>

                    <div className="d-flex align-items-center gap-4 ms-auto mt-3 mt-lg-0">
                        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`btn btn-link p-0 text-decoration-none ${isDark ? 'text-white-50 hover-white' : 'text-secondary hover-dark'} transition`} aria-label="Toggle theme">
                            {isDark ? <i className="bi bi-sun" style={{ fontSize: '20px' }}></i> : <i className="bi bi-moon" style={{ fontSize: '20px' }}></i>}
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
