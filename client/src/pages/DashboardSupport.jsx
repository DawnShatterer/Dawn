import React from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Helmet } from 'react-helmet-async';
import { getUserInfo } from '../utils/authUtils';

const DashboardSupport = () => {
    const user = getUserInfo();

    const handleSumbit = (e) => {
        e.preventDefault();
        alert('Your support request has been submitted. Academic staff will respond shortly.');
    };

    return (
        <div className="p-4 w-100">
            <Helmet>
                <title>Support Services | Dawn LMS</title>
            </Helmet>

            <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                <i className="bi bi-info-circle text-primary me-3" style={{ fontSize: '28px' }}></i>
                <div>
                    <h3 className="fw-bolder mb-0">Dawn Academic Support</h3>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Submit technical or academic inquiries directly to the campus administration.</p>
                </div>
            </div>

            <Row className="g-4 mt-2">
                <Col lg={4}>
                    <div className="d-flex flex-column gap-3">
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                            <Card.Body className="p-3 d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3 text-primary">
                                    <i className="bi bi-envelope" style={{ fontSize: '20px' }}></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>Email us</h6>
                                    <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>admissions@dawn.edu.np</p>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                            <Card.Body className="p-3 d-flex align-items-center">
                                <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3 text-success">
                                    <i className="bi bi-chat-square-text" style={{ fontSize: '20px' }}></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>IT Helpdesk</h6>
                                    <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>Average response: 24h</p>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <Card.Body className="p-3 d-flex align-items-center">
                                <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3 text-warning">
                                    <i className="bi bi-telephone" style={{ fontSize: '20px' }}></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>Call Registrar</h6>
                                    <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>+977 1 4400000</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>

                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
                        <h5 className="fw-bold mb-4">Open a Ticket</h5>
                        <Form onSubmit={handleSumbit}>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Student ID / Email</Form.Label>
                                        <Form.Control type="text" value={user?.email || ''} readOnly className="border bg-body-secondary" style={{ fontSize: '0.85rem' }} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Full Name</Form.Label>
                                        <Form.Control type="text" value={user?.name || ''} readOnly className="border bg-body-secondary" style={{ fontSize: '0.85rem' }} />
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Primary Issue</Form.Label>
                                        <Form.Select className="border bg-body" style={{ fontSize: '0.85rem' }}>
                                            <option>Transcript Correction</option>
                                            <option>Module Registration Issue</option>
                                            <option>Tuition Query</option>
                                            <option>Platform Bug / Error</option>
                                            <option>Other Academic Matter</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Description</Form.Label>
                                        <Form.Control as="textarea" rows={4} placeholder="Please provide specific details..." className="border bg-body" required style={{ fontSize: '0.85rem' }} />
                                    </Form.Group>
                                </Col>
                                <Col md={12} className="text-end mt-3">
                                    <Button type="submit" variant="primary" className="fw-bold px-4 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                        <i className="bi bi-send" style={{ fontSize: '16px' }}></i> Submit Ticket
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardSupport;
