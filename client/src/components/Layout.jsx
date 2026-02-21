import React from 'react';
import Sidebar from './Sidebar'; // Check this import!

const Layout = ({ children }) => {
    return (
        <div className="d-flex">
            {/* This puts the sidebar on the left */}
            <Sidebar />

            {/* This puts your dashboard content on the right */}
            <main className="flex-grow-1 p-4 bg-light" style={{ minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;