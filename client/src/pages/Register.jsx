import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { BookOpen, LogIn, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'Student' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/Auth/register', formData);
            navigate('/login', { state: { message: 'Registration successful! Please check your email to verify your account before logging in.' } });
        } catch (err) {
            if (err.response?.data && Array.isArray(err.response.data)) {
                setError(err.response.data.map(e => e.description || JSON.stringify(e)).join(' | '));
            } else if (err.response?.data?.errors) {
                // Unpack deep ASP.NET ProblemDetails structures
                setError(Object.values(err.response.data.errors).flat().join(' | '));
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                const debugStr = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                setError(`Registration failed. Trace: ${debugStr}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(13,110,253,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(13,202,240,0.05) 0%, transparent 40%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <Container className="position-relative z-1 d-flex flex-column align-items-center justify-content-center" style={{ paddingTop: '60px', paddingBottom: '60px', minHeight: '100vh' }}>
                <div className="text-center mb-5 w-100">
                    <h2 className="fw-bold text-body tracking-tight mt-3">Create your Dawn Account</h2>
                    <p className="text-muted">Join the next generation of e-learning platforms.</p>
                </div>

                <div className="row justify-content-center w-100">
                    <div className="col-12 col-md-8 col-lg-5">
                        <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
                            <Card.Body className="p-5">
                                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                                
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold small text-muted">Full Name</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Aarav Sharma" 
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            required 
                                            className="px-4 py-3 bg-body-tertiary border-0"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold small text-muted">Email Address</Form.Label>
                                        <Form.Control 
                                            type="email" 
                                            placeholder="name@example.com" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required 
                                            className="px-4 py-3 bg-body-tertiary border-0"
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold small text-muted">Account Type</Form.Label>
                                        <Form.Select 
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className="px-4 py-3 bg-body-tertiary border-0"
                                        >
                                            <option value="Student">Student (Learn)</option>
                                            <option value="Teacher">Teacher (Instruct)</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="fw-bold small text-muted mb-0">Password</Form.Label>
                                        </div>
                                        <div className="position-relative">
                                            <Form.Control 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="Must be at least 6 characters" 
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                required 
                                                className="px-4 py-3 bg-body-tertiary border-0"
                                                style={{ paddingRight: '3rem' }}
                                                minLength={6}
                                            />
                                            <Button 
                                                variant="link" 
                                                className="position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none shadow-none"
                                                onClick={() => setShowPassword(!showPassword)}
                                                type="button"
                                                tabIndex="-1"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </Button>
                                        </div>
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100 py-3 fw-bold rounded-3 mb-4 d-flex align-items-center justify-content-center" disabled={isLoading}>
                                        <UserPlus size={18} className="me-2" />
                                        {isLoading ? 'Creating Account...' : 'Sign Up for Free'}
                                    </Button>

                                    <p className="text-center text-muted small mb-0 fw-medium">
                                        Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold ms-1 hover-opacity">Sign in</Link>
                                    </p>
                                </Form>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default Register;
