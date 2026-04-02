import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { KeyRound, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const mutation = useMutation({
        mutationFn: async (emailData) => {
            const res = await api.post('/Auth/forgot-password', emailData);
            return res.data;
        },
        onSuccess: (data) => {
            setSuccessMessage(data.message || "Reset link sent to your email.");
            setErrorMessage('');
            setEmail('');
        },
        onError: (err) => {
            setErrorMessage(err.response?.data?.message || err.message || "Failed to send reset link.");
            setSuccessMessage('');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        mutation.mutate({ email: email.trim() });
    };

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden d-flex align-items-center justify-content-center">
            <Container className="position-relative z-1" style={{ maxWidth: '450px' }}>
                <Card className="shadow-lg border-0 rounded-4">
                    <Card.Body className="p-5">
                        <div className="text-center mb-4">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-3">
                                <KeyRound size={32} />
                            </div>
                            <h2 className="fw-bold text-body tracking-tight fs-3">Forgot Password?</h2>
                            <p className="text-muted small">No worries, we'll send you reset instructions.</p>
                        </div>

                        {successMessage && <Alert variant="success" className="border-0 shadow-sm py-2 text-center small fw-bold">{successMessage}</Alert>}
                        {errorMessage && <Alert variant="danger" className="border-0 shadow-sm py-2 text-center small fw-bold">{errorMessage}</Alert>}

                        <Form onSubmit={handleSubmit} className={successMessage ? 'd-none' : ''}>
                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold">Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Button 
                                variant="primary" 
                                type="submit" 
                                className="w-100 py-2 fw-bold shadow-sm rounded-pill mb-3"
                                disabled={mutation.isPending || !email}
                            >
                                {mutation.isPending ? <Spinner size="sm" /> : 'Reset Password'}
                            </Button>
                        </Form>

                        <div className="text-center mt-3">
                            <Link to="/login" className="text-decoration-none text-muted small fw-bold d-inline-flex align-items-center">
                                <ArrowLeft size={16} className="me-1" /> Back to Login
                            </Link>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ForgotPassword;
