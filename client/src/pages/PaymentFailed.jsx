import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../api/axios';

const PaymentFailed = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);
    const [failureDetails, setFailureDetails] = useState(null);
    
    const reason = searchParams.get('reason') || 'unknown';
    
    useEffect(() => {
        const verifyFailure = async () => {
            try {
                // Optional: verify failure reason with backend
                const response = await api.get(`/Payment/verify-failure`, {
                    params: { reason }
                });
                
                setFailureDetails(response.data);
            } catch (err) {
                setFailureDetails({
                    success: false,
                    reason: reason,
                    message: 'The payment could not be processed.',
                    retryable: true
                });
            } finally {
                setVerifying(false);
            }
        };
        
        verifyFailure();
    }, [reason]);
    
    if (verifying) {
        return (
            <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-3 text-muted">Loading...</p>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="mb-4">
                    <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-x-circle text-danger" style={{ fontSize: '40px' }}></i>
                    </div>
                </div>
                <h3 className="fw-bold text-danger mb-2">Payment Failed</h3>
                <p className="text-muted mb-4">
                    {failureDetails?.message || 'The payment could not be processed.'}
                </p>
                <div className="d-flex gap-3 justify-content-center">
                    {failureDetails?.retryable && (
                        <Button variant="danger" className="px-4 py-2 fw-bold rounded-3 shadow-sm" onClick={() => navigate('/tuition')}>
                            <i className="bi bi-arrow-clockwise me-2" style={{ fontSize: '18px' }}></i> Try Again
                        </Button>
                    )}
                    <Button variant="outline-secondary" className="px-4 py-2 rounded-3" onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Button>
                </div>
            </Card>
        </Container>
    );
};

export default PaymentFailed;
