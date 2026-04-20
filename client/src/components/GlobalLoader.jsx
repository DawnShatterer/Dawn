import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

const GlobalLoader = ({ children }) => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 700); // Minimum 0.7s delay as requested

        return () => clearTimeout(timer);
    }, [location.pathname]); // Re-run effect on route change

    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 9999,
                backdropFilter: 'blur(4px)'
            }}>
                <Spinner animation="border" style={{ color: '#348252', width: '3rem', height: '3rem' }} />
                <div style={{ marginTop: '1rem', color: '#348252', fontWeight: 'bold' }}>Loading Dawn...</div>
            </div>
        );
    }

    return <>{children}</>;
};

export default GlobalLoader;
