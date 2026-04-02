import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const mutation = useMutation({
        mutationFn: async (resetData) => {
            const res = await api.post('/Auth/reset-password', resetData);
            return res.data;
        },
        onSuccess: (data) => {
            setSuccessMessage(data.message || "Password successfully reset!");
            setErrorMessage('');
            setTimeout(() => navigate('/login'), 3000);
        },
        onError: (err) => {
            setErrorMessage(err.response?.data?.message || "Failed to reset password.");
            setSuccessMessage('');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }

        mutation.mutate({
            email: email,
            token: token,
            newPassword: password
        });
    };

    if (!token || !email) {
        return (
            <div className="bg-body-tertiary min-vh-100 font-sans d-flex align-items-center justify-content-center">
                <Alert variant="danger">Invalid password reset link.</Alert>
            </div>
        );
    }

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden d-flex align-items-center justify-content-center">
            <Container className="position-relative z-1" style={{ maxWidth: '450px' }}>
                <Card className="shadow-lg border-0 rounded-4">
                    <Card.Body className="p-5">
                        <div className="text-center mb-4">
                            <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-3">
                                <KeyRound size={32} />
                            </div>
                            <h2 className="fw-bold text-body tracking-tight fs-3">Set New Password</h2>
                            <p className="text-muted small">Your new password must be securely chosen.</p>
                        </div>

                        {successMessage && <Alert variant="success" className="border-0 shadow-sm py-2 text-center small fw-bold">{successMessage} Redirecting...</Alert>}
                        {errorMessage && <Alert variant="danger" className="border-0 shadow-sm py-2 text-center small fw-bold">{errorMessage}</Alert>}

                        <Form onSubmit={handleSubmit} className={successMessage ? 'd-none' : ''}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">New Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold">Confirm Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <Button variant="outline-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            <Button 
                                variant="primary" 
                                type="submit" 
                                className="w-100 py-2 fw-bold shadow-sm rounded-pill mb-3"
                                disabled={mutation.isPending || !password || !confirmPassword}
                            >
                                {mutation.isPending ? <Spinner size="sm" /> : 'Confirm Reset'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ResetPassword;
