import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, googleLogin } from '../api/authService';
import { getPublicBranding } from '../api/institutionService';
import { Alert, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

const Login = () => {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resendStatus, setResendStatus] = useState(null); // 'loading', 'success', 'error'
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');
    const navigate = useNavigate();

    const { data: branding } = useQuery({
        queryKey: ['public-branding'],
        queryFn: getPublicBranding
    });
    
    // Check for session expiration message on mount
    useEffect(() => {
        const message = sessionStorage.getItem('sessionExpiredMessage');
        if (message) {
            setSessionExpiredMessage(message);
            // Clear message from sessionStorage after reading
            sessionStorage.removeItem('sessionExpiredMessage');
        }
    }, []);

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.sessionId) localStorage.setItem('sessionId', data.sessionId);
            
            // Check for redirect path after login
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else if (data.user.forcePasswordChange) {
                navigate('/force-password-change');
            } else {
                navigate('/dashboard');
            }
        },
    });

    const googleMutation = useMutation({
        mutationFn: ({ credential, role }) => googleLogin(credential, role),
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.sessionId) localStorage.setItem('sessionId', data.sessionId);
            navigate('/dashboard');
        },
    });

    const handleGoogleSuccess = (credentialResponse) => {
        googleMutation.mutate({ credential: credentialResponse.credential, role: 'Student' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            email: email.trim(),
            password: password
        });
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
        <div className="auth-wrapper">
            <div className="auth-bg-glow"></div>
            <div className="auth-bg-glow-2"></div>
            
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div className="auth-logo">Dawn</div>
                    </Link>
                    <div className="auth-title">Welcome Back</div>
                    <div className="auth-subtitle">Sign in to continue your journey</div>
                </div>



                {location.state?.message && (
                    <Alert variant="success" style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'center', border: 'none', borderRadius: '12px' }}>
                        {location.state.message}
                    </Alert>
                )}
                
                {/* Display session expiration message */}
                {sessionExpiredMessage && (
                    <Alert variant="warning" style={{ fontSize: '0.8rem', padding: '0.75rem', textAlign: 'center', border: 'none', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 600 }}>
                            {sessionExpiredMessage}
                        </div>
                    </Alert>
                )}

                {mutation.isError && (
                    <Alert variant="danger" style={{ fontSize: '0.8rem', padding: '0.75rem', textAlign: 'center', border: 'none', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 600 }}>
                            {mutation.error.response?.data?.message || 
                             mutation.error.response?.data?.Message || 
                             (typeof mutation.error.response?.data === 'string' ? mutation.error.response.data : "") ||
                             "Invalid email or password"}
                        </div>
                        {needsVerification && (
                            <button 
                                onClick={handleResendVerification}
                                disabled={resendStatus === 'loading'}
                                className="rc-pill-btn outline"
                                style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                            >
                                {resendStatus === 'loading' ? <Spinner size="sm" /> : <><i className="bi bi-send" style={{ fontSize: '12px' }}></i> Resend Verification Code</>}
                            </button>
                        )}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-label">Email Address</label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#348252', textDecoration: 'none' }}>
                                Forgot?
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="auth-input"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="button" className="auth-pw-eye" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <i className="bi bi-eye-slash" style={{ fontSize: '16px' }}></i> : <i className="bi bi-eye" style={{ fontSize: '16px' }}></i>}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={mutation.isPending}>
                        {mutation.isPending ? <Spinner size="sm" /> : 'Log In'}
                    </button>
                </form>

                <div className="auth-separator"><span>OR</span></div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {}}
                        useOneTap
                        shape="pill"
                        text="signin_with"
                        locale="en"
                    />
                </div>
                {googleMutation.isError && (
                    <Alert variant="danger" style={{ fontSize: '0.75rem', padding: '0.5rem', textAlign: 'center', border: 'none', borderRadius: '12px' }}>
                        Google login failed. Please try again.
                    </Alert>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Don't have an account? <Link to="/register" style={{ color: '#348252', fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link></div>
                </div>
            </div>

            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1050 }}>
                <Toast show={resendStatus === 'success'} bg="success" onClose={() => setResendStatus(null)}>
                    <Toast.Body className="text-white fw-bold">Verification link sent!</Toast.Body>
                </Toast>
                <Toast show={resendStatus === 'error'} bg="danger" onClose={() => setResendStatus(null)}>
                    <Toast.Body className="text-white fw-bold">Failed to send link.</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Login;
