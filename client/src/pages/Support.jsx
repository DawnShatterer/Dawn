import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';

const Support = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSumbit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            // Use direct axios call without authentication interceptor for public endpoint
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';
            const res = await axios.post(`${apiBase}/api/SupportInquiry`, formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setSuccessMsg(res.data.message || 'Message sent successfully! Our team will get back to you soon.');
            setFormData({ fullName: '', email: '', subject: 'General Inquiry', message: '' });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <Helmet>
                <title>Support | Dawn Platform</title>
                <meta name="description" content="Reach out to Dawn platform's dedicated support team." />
            </Helmet>
            <div className="position-fixed w-100 h-100 top-0 start-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
                <ParticleCanvas />
            </div>
            <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(13,110,253,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(13,202,240,0.05) 0%, transparent 40%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <PublicNavbar />
            <Container className="position-relative z-1" style={{ paddingTop: '140px', paddingBottom: '100px' }}>
                <div className="text-center mb-5 pb-3">
                    <span className="text-success fw-bold text-uppercase tracking-wider small d-block mb-2">Help & Assistance</span>
                    <h1 className="fw-bolder display-4 tracking-tight">Our Dedicated Support</h1>
                    <p className="lead text-muted mx-auto mb-5" style={{ maxWidth: '600px' }}>
                        Need help with a course, payment, or technical issue? Our team is available 24/7 to ensure your learning experience is seamless.
                    </p>
                </div>

                <Row className="g-5">
                    <Col lg={4}>
                        <div className="d-flex flex-column gap-4">
                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                                <Card.Body className="p-4 d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-4 text-primary">
                                        <i className="bi bi-envelope" style={{ fontSize: '24px' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Email us</h6>
                                        <p className="text-muted small mb-0">support@dawn.com</p>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                                <Card.Body className="p-4 d-flex align-items-center">
                                    <div className="bg-success bg-opacity-10 p-3 rounded-circle me-4 text-success">
                                        <i className="bi bi-chat-dots" style={{ fontSize: '24px' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Live Chat</h6>
                                        <p className="text-muted small mb-0">Average response: 2 mins</p>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                                <Card.Body className="p-4 d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-4 text-warning">
                                        <i className="bi bi-telephone" style={{ fontSize: '24px' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Call Tech Support</h6>
                                        <p className="text-muted small mb-0">+1 (800) DAWN-HELP</p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>

                    <Col lg={8}>
                        <Card className="border-0 shadow-lg rounded-4 overflow-hidden p-3 p-md-5">
                                <h3 className="fw-bold mb-4">Send us a Message</h3>
                            
                                {successMsg && <div className="alert alert-success">{successMsg}</div>}
                                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

                            <Form onSubmit={handleSumbit}>
                                <Row className="g-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small text-muted">Full Name</Form.Label>
                                            <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Aayush Sharma" className="py-3 px-4 rounded-3 border bg-body" required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small text-muted">Email Address</Form.Label>
                                            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="user@dawn.com" className="py-3 px-4 rounded-3 border bg-body" required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small text-muted">Subject</Form.Label>
                                            <Form.Select name="subject" value={formData.subject} onChange={handleChange} className="py-3 px-4 rounded-3 border bg-body">
                                                <option>General Inquiry</option>
                                                <option>Course Access Issue</option>
                                                <option>Payment/Billing Problem</option>
                                                <option>Instructor Partnership</option>
                                                <option>Technical Error</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small text-muted">Your Message</Form.Label>
                                            <Form.Control as="textarea" name="message" value={formData.message} onChange={handleChange} rows={5} placeholder="How can we help you?" className="py-3 px-4 rounded-3 border bg-body" required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Button type="submit" variant="primary" disabled={loading} className="fw-bold px-5 py-3 rounded-pill shadow-sm d-flex align-items-center gap-2 mt-2">
                                            {loading ? <Spinner size="sm"/> : <i className="bi bi-send" style={{ fontSize: '18px' }}></i>} 
                                            {loading ? 'Sending...' : 'Send Inquiry'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Support;
