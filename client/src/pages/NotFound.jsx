import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container className="d-flex flex-column justify-content-center align-items-center py-5 h-100 text-center" style={{ minHeight: '60vh' }}>
            <h1 className="display-1 fw-bold text-primary mb-2">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="text-muted mb-4" style={{ maxWidth: '500px' }}>
                Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Button 
                variant="primary" 
                size="lg" 
                onClick={() => navigate('/')} 
                className="d-flex align-items-center gap-2 rounded-pill px-4"
            >
                <i className="bi bi-house" style={{ fontSize: '20px' }}></i>
                Back to Home
            </Button>
        </Container>
    );
};

export default NotFound;
