import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Button, Form } from 'react-bootstrap';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../api/axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [status, setStatus] = useState('input'); // input, verifying, success, error
    const [message, setMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (!email) {
            setStatus('error');
            setMessage('No email provided. Please try registering or logging in again.');
        }
    }, [email]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setMessage('');
        
        if (!code || code.length !== 6) {
            setMessage('Please enter a valid 6-digit code.');
            return;
        }

        setStatus('verifying');

        try {
            const res = await api.post('/Auth/verify-code', { email, code });
            setStatus('success');
            setMessage(res.data.message || 'Email verified successfully!');
        } catch (err) {
            setStatus('input');
            setMessage(err.response?.data?.message || 'Verification failed. Please check your code.');
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        
        try {
            await api.post('/Auth/resend-verification', { email });
            setMessage('A new verification code has been sent to your email.');
            setResendCooldown(60); // 60 seconds cooldown
        } catch (err) {
            setMessage('Failed to resend code. Please try again later.');
        }
    };

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden d-flex align-items-center justify-content-center">
            <Container className="position-relative z-1" style={{ maxWidth: '450px' }}>
                <Card className="shadow-lg border-0 rounded-4 p-5 text-center">
                    {(status === 'input' || status === 'verifying') && (
                        <div>
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-4">
                                <i className="bi bi-shield-check" style={{ fontSize: '48px' }}></i>
                            </div>
                            <h3 className="fw-bold tracking-tight mb-2">Verify your email</h3>
                            <p className="text-muted mb-4">
                                We've sent a 6-digit verification code to <br />
                                <strong>{email}</strong>
                            </p>

                            <Form onSubmit={handleVerify}>
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                        className="text-center fw-bold fs-4 py-2 bg-body-secondary border-0"
                                        style={{ letterSpacing: '8px' }}
                                        maxLength={6}
                                        autoFocus
                                    />
                                </Form.Group>

                                {message && (
                                    <div className={`mb-3 small fw-medium ${message.includes('sent') ? 'text-success' : 'text-danger'}`}>
                                        {message}
                                    </div>
                                )}

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg" 
                                    className="w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
                                    disabled={status === 'verifying' || code.length !== 6}
                                >
                                    {status === 'verifying' ? <Spinner size="sm" /> : 'Verify Account'}
                                </Button>
                            </Form>

                            <div className="mt-4">
                                <span className="text-muted small me-2">Didn't receive the code?</span>
                                <Button 
                                    variant="link" 
                                    className="p-0 text-decoration-none fw-bold small" 
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-4">
                            <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-4">
                                <i className="bi bi-envelope-check" style={{ fontSize: '48px' }}></i>
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
                                <i className="bi bi-x-circle" style={{ fontSize: '48px' }}></i>
                            </div>
                            <h3 className="fw-bold tracking-tight text-danger mb-3">Error</h3>
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
