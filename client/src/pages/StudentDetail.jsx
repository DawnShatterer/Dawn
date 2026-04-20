import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Container, Card, Badge, ProgressBar, Alert, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import GlobalSpinner from '../components/GlobalSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: student, isLoading, isError } = useQuery({
        queryKey: ['student-detail', id],
        queryFn: async () => {
            const res = await api.get(`/Auth/student/${id}`);
            return res.data;
        },
        enabled: !!id
    });

    if (isLoading) return <GlobalSpinner message="Loading student details..." />;
    if (isError || !student) return <Container className="py-5"><Alert variant="warning">Student not found.</Alert></Container>;

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <Button variant="link" onClick={() => navigate(-1)} className="text-decoration-none mb-3 p-0 d-flex align-items-center">
                <i className="bi bi-arrow-left me-1" style={{ fontSize: '18px' }}></i> Back
            </Button>

            {/* Student Profile Card */}
            <Card className="border-0 shadow-sm overflow-hidden mb-4">
                <div className="bg-primary bg-gradient text-white p-4 d-flex align-items-center">
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', fontSize: '1.4rem', fontWeight: 'bold' }}>
                        {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                        <h3 className="fw-bold mb-1">{student.fullName}</h3>
                        <Badge bg="light" text="dark" className="me-2">{student.role}</Badge>
                        {student.institutionName && <Badge bg="light" text="dark">{student.institutionName}</Badge>}
                    </div>
                </div>
                <Card.Body className="p-4">
                    <Row>
                        <Col md={6} className="mb-3">
                            <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-envelope me-2" style={{ fontSize: '16px' }}></i>
                                <span>{student.email}</span>
                            </div>
                        </Col>
                        <Col md={6} className="mb-3">
                            <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-calendar me-2" style={{ fontSize: '16px' }}></i>
                                <span>Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Enrolled Courses */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-body border-bottom-0 pt-4 px-4 pb-0">
                    <h5 className="fw-bold d-flex align-items-center mb-1">
                        <i className="bi bi-book text-primary me-2" style={{ fontSize: '20px' }}></i>
                        Enrolled Courses ({student.enrollments?.length || 0})
                    </h5>
                </Card.Header>
                <Card.Body className="p-4">
                    {(!student.enrollments || student.enrollments.length === 0) ? (
                        <p className="text-muted mb-0">No enrollments yet.</p>
                    ) : (
                        student.enrollments.map((e, i) => (
                            <div key={i} className="d-flex justify-content-between align-items-center p-3 bg-body-tertiary rounded mb-2">
                                <div>
                                    <h6 className="fw-bold mb-1">{e.courseName}</h6>
                                    <small className="text-muted">Enrolled {new Date(e.enrolledAt).toLocaleDateString()}</small>
                                </div>
                                <div className="text-end" style={{ minWidth: '150px' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <ProgressBar now={e.progress} variant={e.progress === 100 ? 'success' : 'primary'} className="flex-grow-1" style={{ height: '8px' }} />
                                        <Badge bg={e.progress === 100 ? 'success' : 'primary'}>{e.progress}%</Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default StudentDetail;
