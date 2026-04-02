import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, googleLogin } from '../api/authService';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup, Toast, ToastContainer } from 'react-bootstrap';
import { LogIn, Eye, EyeOff, Send } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

const Login = () => {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Toggle state
    const [resendStatus, setResendStatus] = useState(null); // 'loading', 'success', 'error'
    const navigate = useNavigate();

    // Standard Login Mutation
    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');
        },
    });

    // Google Login Mutation
    const googleMutation = useMutation({
        mutationFn: googleLogin,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');
        },
    });

    const handleGoogleSuccess = (credentialResponse) => {
        googleMutation.mutate(credentialResponse.credential);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Clear whitespace from inputs
        mutation.mutate({
            email: email.trim(),
            password: password
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleResendVerification = async () => {
        setResendStatus('loading');
        try {
            await api.post('/Auth/resend-verification', { email: email.trim() });
            setResendStatus('success');
            setTimeout(() => setResendStatus(null), 5000);
        } catch (err) {
            setResendStatus('error');
            setTimeout(() => setResendStatus(null), 5000);
        }
    };

    const needsVerification = mutation.isError && mutation.error.response?.data?.needsVerification === true;

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(13,110,253,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(13,202,240,0.05) 0%, transparent 40%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <Container className="position-relative z-1 d-flex align-items-center justify-content-center" style={{ paddingTop: '60px', paddingBottom: '60px', minHeight: '100vh' }}>
                <Row className="justify-content-md-center w-100">
                    <Col md={6} lg={5}>
                        <Card className="shadow-lg border-0 rounded-4">
                            <Card.Body className="p-5">
                                <div className="text-center mb-4">
                                    <Link to="/" className="text-decoration-none d-inline-block mb-3">
                                        <h1 className="fw-bolder mb-0 display-5" style={{ background: 'linear-gradient(45deg, #0d6efd, #6610f2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                                            Dawn.
                                        </h1>
                                    </Link>
                                    <h2 className="fw-bold text-body tracking-tight fs-4">Welcome Back</h2>
                                <p className="text-muted mb-3">Login to your Dawn account</p>

                                {/* Demo Quick Fill */}
                                <div className="d-flex justify-content-center gap-2 mb-2">
                                    <Button variant="outline-danger" size="sm" onClick={() => { setEmail('admin@dawn.com'); setPassword('Admin@123'); }} style={{ fontSize: '0.75rem' }} className="rounded-pill px-3 fw-bold">Admin</Button>
                                    <Button variant="outline-primary" size="sm" onClick={() => { setEmail('teacher@dawn.com'); setPassword('Teacher@123'); }} style={{ fontSize: '0.75rem' }} className="rounded-pill px-3 fw-bold">Teacher</Button>
                                    <Button variant="outline-success" size="sm" onClick={() => { setEmail('student@dawn.com'); setPassword('Student@123'); }} style={{ fontSize: '0.75rem' }} className="rounded-pill px-3 fw-bold">Student</Button>
                                </div>
                            </div>

                            {location.state?.message && (
                                <Alert variant="success" className="border-0 shadow-sm py-2 text-center small fw-bold mt-3">
                                    {location.state.message}
                                </Alert>
                            )}

                            {mutation.isError && (
                                <Alert variant="danger" className="border-0 shadow-sm py-2 text-center small fw-bold mt-3 d-flex flex-column align-items-center">
                                    <span>
                                        {mutation.error.response?.data?.message || 
                                         mutation.error.response?.data?.Message || 
                                         mutation.error.response?.data?.title || 
                                         (typeof mutation.error.response?.data === 'string' ? mutation.error.response.data : "") ||
                                         "Invalid email or password"}
                                    </span>
                                    {needsVerification && (
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            className="mt-2 rounded-pill px-3"
                                            onClick={handleResendVerification}
                                            disabled={resendStatus === 'loading'}
                                        >
                                            {resendStatus === 'loading' ? <Spinner size="sm" /> : <><Send size={14} className="me-1" /> Resend Verification Email</>}
                                        </Button>
                                    )}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Label className="small fw-bold mb-0">Password</Form.Label>
                                        <Link to="/forgot-password" className="text-decoration-none small text-primary fw-bold" tabIndex="-1">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <InputGroup className="mt-2">
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter password" style={{ fontFamily: "system-ui, sans-serif" }}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={togglePasswordVisibility}
                                            className="border-start-0"
                                            style={{ borderColor: '#dee2e6' }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 py-2 fw-bold shadow-sm"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <><Spinner animation="border" size="sm" className="me-2" /> Logging in...</>
                                    ) : "Login"}
                                </Button>

                                <div className="mt-4 text-center">
                                    <div className="d-flex align-items-center mb-3">
                                        <hr className="flex-grow-1" />
                                        <span className="mx-3 text-muted small fw-bold">OR</span>
                                        <hr className="flex-grow-1" />
                                    </div>
                                    <div className="d-flex justify-content-center mb-3">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => console.error('Google Login Failed')}
                                            useOneTap
                                            shape="pill"
                                            width="300px"
                                        />
                                    </div>
                                    {googleMutation.isError && (
                                        <Alert variant="danger" className="border-0 shadow-sm py-2 text-center small mb-3">
                                            {googleMutation.error.response?.data?.message || googleMutation.error.response?.data?.Message || "Google login failed. Please try again."}
                                        </Alert>
                                    )}
                                    <p className="small text-muted fw-medium mb-0 mt-4">
                                        Don't have an account? <a href="/register" className="text-primary text-decoration-none fw-bold hover-opacity">Create one here</a>
                                    </p>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            </Container>
            
            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1050 }}>
                <Toast show={resendStatus === 'success'} bg="success" onClose={() => setResendStatus(null)}>
                    <Toast.Body className="text-white fw-bold">Verification link sent to your email!</Toast.Body>
                </Toast>
                <Toast show={resendStatus === 'error'} bg="danger" onClose={() => setResendStatus(null)}>
                    <Toast.Body className="text-white fw-bold">Failed to send verification link.</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Login;
