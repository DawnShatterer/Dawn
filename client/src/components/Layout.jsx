import React from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import AITutorChatbot from './AITutorChatbot';
import { getUserInfo } from '../utils/authUtils';
import { useQuery } from '@tanstack/react-query';
import { getMyBranding } from '../api/institutionService';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

const Layout = ({ children }) => {
    const user = getUserInfo();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/my-courses?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const { data: branding } = useQuery({
        queryKey: ['branding'],
        queryFn: getMyBranding
    });

    const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

    return (
        <div className="d-flex bg-body-tertiary text-body" style={{ minHeight: '100vh' }}>
            <Sidebar />

            <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: 'hidden' }}>
                {/* ─── Top Navigation Bar ─── */}
                <header className="bg-body border-bottom px-4 py-0 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{ height: '60px', zIndex: 1020, transition: 'background-color 0.3s' }}>
                    
                    {/* Left: Platform Name */}
                    <div className="d-flex align-items-center">
                        {branding?.logoUrl && branding.logoUrl !== "/logo.png" && (
                            <img src={branding.logoUrl} alt="" style={{ height: '32px' }} className="me-2" />
                        )}
                        <span className="fw-bold d-none d-md-block" style={{ fontSize: '1rem' }}>
                            {branding?.name || 'DAWN Platform'}
                        </span>
                    </div>

                    {/* Right: Search + Theme + Notifications + Profile */}
                    <div className="d-flex align-items-center gap-3">
                        <span className="text-muted fw-medium d-none d-lg-block small me-3">
                            Welcome back, <span className="fw-bold">{user?.name}</span>
                        </span>

                        {user?.role?.toLowerCase() === 'student' && (
                            <form onSubmit={handleSearch} className="d-none d-md-flex align-items-center bg-body-tertiary rounded-pill px-3 py-1 border border-opacity-10 me-2" style={{ transition: 'all 0.3s' }}>
                                <Search size={14} className="text-muted me-2" />
                                <input 
                                    type="text" 
                                    className="form-control border-0 bg-transparent shadow-none p-0 focus-ring focus-ring-light" 
                                    placeholder="Search courses..." 
                                    style={{ width: '180px', fontSize: '0.85rem' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        )}

                        {/* Theme Toggle */}
                        <Dropdown>
                            <Dropdown.Toggle variant="link" className="text-muted p-1 d-flex align-items-center text-decoration-none border-0 shadow-none" id="theme-dropdown">
                                <ThemeIcon size={18} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" className="shadow-sm border-0 mt-2" style={{ minWidth: '150px' }}>
                                <Dropdown.Item className={`d-flex align-items-center py-2 ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                                    <Sun size={14} className="me-2" /> Light
                                </Dropdown.Item>
                                <Dropdown.Item className={`d-flex align-items-center py-2 ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                                    <Moon size={14} className="me-2" /> Dark
                                </Dropdown.Item>
                                <Dropdown.Item className={`d-flex align-items-center py-2 ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}>
                                    <Monitor size={14} className="me-2" /> System
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>

                        <NotificationBell />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-grow-1 p-4 position-relative bg-body-tertiary">
                    {children}
                </main>
                <AITutorChatbot />
            </div>
        </div>
    );
};

export default Layout;