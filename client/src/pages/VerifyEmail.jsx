import React, { useEffect, useState } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MailCheck, XCircle } from 'lucide-react';
import api from '../api/axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyAccount = async () => {
            try {
                const res = await api.get(`/Auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
                setStatus('success');
                setMessage(res.data.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        verifyAccount();
    }, [token, email]);

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden d-flex align-items-center justify-content-center">
            <Container className="position-relative z-1" style={{ maxWidth: '500px' }}>
                <Card className="shadow-lg border-0 rounded-4 text-center p-5">
                    {status === 'verifying' && (
                        <div className="py-4">
                            <Spinner animation="border" variant="primary" className="mb-4" style={{ width: '3rem', height: '3rem' }} />
                            <h3 className="fw-bold tracking-tight">Verifying Email</h3>
                            <p className="text-muted">Please wait while we confirm your email address...</p>
                        </div>
                    )}
                    
                    {status === 'success' && (
                        <div className="py-4">
                            <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-4">
                                <MailCheck size={48} />
                            </div>
                            <h3 className="fw-bold tracking-tight text-success mb-3">Verified!</h3>
                            <p className="text-muted mb-4">{message}</p>
                            <Button variant="primary" size="lg" className="w-100 rounded-pill fw-bold shadow-sm" onClick={() => navigate('/login')}>
                                Proceed to Login
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4">
                            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex p-3 mb-4">
                                <XCircle size={48} />
                            </div>
                            <h3 className="fw-bold tracking-tight text-danger mb-3">Verification Failed</h3>
                            <p className="text-muted mb-4">{message}</p>
                            <Link to="/login" className="btn btn-outline-secondary w-100 rounded-pill fw-bold">
                                Back to Login
                            </Link>
                        </div>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default VerifyEmail;
