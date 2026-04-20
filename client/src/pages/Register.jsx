import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { googleLogin } from '../api/authService';
import { getPublicBranding } from '../api/institutionService';
import { Alert, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { GoogleLogin } from '@react-oauth/google';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'Student' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { data: branding } = useQuery({
        queryKey: ['public-branding'],
        queryFn: getPublicBranding
    });

    const googleMutation = useMutation({
        mutationFn: ({ credential, role }) => googleLogin(credential, role),
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.sessionId) localStorage.setItem('sessionId', data.sessionId);
            navigate('/dashboard');
        },
        onError: () => setError('Google sign-up failed. Please try again.')
    });

    const handleGoogleSuccess = (credentialResponse) => {
        googleMutation.mutate({ credential: credentialResponse.credential, role: formData.role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/Auth/register', formData);
            navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } catch (err) {
            if (err.response?.data && Array.isArray(err.response.data)) {
                setError(err.response.data.map(e => e.description || JSON.stringify(e)).join(' | '));
            } else if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors).flat().join(' | '));
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <Helmet>
                <title>Create Account | Dawn</title>
            </Helmet>
            
            <div className="auth-bg-glow"></div>
            <div className="auth-bg-glow-2"></div>
            
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div className="auth-title">Create Account</div>
                    <div className="auth-subtitle">Join the modern learning ecosystem</div>
                </div>

                {error && <Alert variant="danger" style={{ fontSize: '0.8rem', padding: '0.75rem', textAlign: 'center', border: 'none', borderRadius: '12px' }}>{error}</Alert>}



                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Enter Full Name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label className="auth-label">Email Address</label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label className="auth-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="auth-input"
                                placeholder="At least 6 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                            <button type="button" className="auth-pw-eye" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <i className="bi bi-eye-slash" style={{ fontSize: '16px' }}></i> : <i className="bi bi-eye" style={{ fontSize: '16px' }}></i>}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : `Create Account`}
                    </button>
                </form>

                <div className="auth-separator"><span>OR</span></div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign-Up failed.')}
                        shape="pill"
                        text="signup_with"
                        locale="en"
                    />
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        Already have an account? <Link to="/login" style={{ color: '#348252', fontWeight: 700, textDecoration: 'none', marginLeft: '4px' }}>Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
