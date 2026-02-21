import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authService';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // React Query Mutation
    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            // Save token and user info to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role (Teacher/Student/Admin)
            navigate('/dashboard');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ email, password });
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={5}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <LogIn size={48} className="text-primary mb-2" />
                                <h2 className="fw-bold">Welcome Back</h2>
                                <p className="text-muted">Login to your Dawn account</p>
                            </div>

                            {mutation.isError && (
                                <Alert variant="danger">
                                    {mutation.error.response?.data?.Message || "Invalid credentials"}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 py-2 fw-bold"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <><Spinner animation="border" size="sm" /> Logging in...</>
                                    ) : "Login"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;