import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';

const ForcePasswordChange = () => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword === 'dawnuser1090') {
            setError('You cannot reuse the default system password.');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/Auth/force-change-password', { newPassword, recoveryEmail: recoveryEmail.trim() || null });

            // Update local storage to reflect the change
            const updatedUser = { ...user, forcePasswordChange: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <Helmet>
                <title>Change Password | Dawn</title>
            </Helmet>

            <div className="auth-bg-glow"></div>
            <div className="auth-bg-glow-2"></div>

            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #348252, #2a6b43)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="bi bi-shield-check" style={{ fontSize: '28px', color: '#fff' }}></i>
                        </div>
                    </div>
                    <div className="auth-title">Set Your Password</div>
                    <div className="auth-subtitle">
                        Welcome to Dawn, <strong>{user.fullName || 'Student'}</strong>!<br />
                        For security, you must change the default password before accessing your account.
                    </div>
                </div>

                {error && <Alert variant="danger" style={{ fontSize: '0.8rem', padding: '0.75rem', textAlign: 'center', border: 'none', borderRadius: '12px' }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-label">New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="auth-input"
                                placeholder="At least 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button type="button" className="auth-pw-eye" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <i className="bi bi-eye-slash" style={{ fontSize: '16px' }}></i> : <i className="bi bi-eye" style={{ fontSize: '16px' }}></i>}
                            </button>
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <label className="auth-label">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="auth-input"
                            placeholder="Repeat your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="auth-form-group">
                        <label className="auth-label">Recovery Email <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="Your personal Gmail for password recovery"
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                        />
                        <small style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '4px', display: 'block' }}>If you forget your password, a reset code will be sent here.</small>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : 'Set Password & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForcePasswordChange;
