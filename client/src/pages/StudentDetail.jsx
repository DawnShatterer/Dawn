import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentDetails } from '../api/certificateService';
import { Container, Card, Badge, ProgressBar, Spinner, Alert, Row, Col, Button } from 'react-bootstrap';
import { ArrowLeft, User, BookOpen, Award, Mail, Calendar, Building2, FileText } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: student, isLoading, isError } = useQuery({
        queryKey: ['student-detail', id],
        queryFn: () => getStudentDetails(id),
        enabled: !!id
    });

    if (isLoading) return <div className="text-center mt-5 pt-5"><Spinner animation="border" variant="primary" /></div>;
    if (isError || !student) return <Container className="py-5"><Alert variant="warning">Student not found.</Alert></Container>;

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <Button variant="link" onClick={() => navigate(-1)} className="text-decoration-none mb-3 p-0 d-flex align-items-center">
                <ArrowLeft size={18} className="me-1" /> Back
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
                                <Mail size={16} className="me-2" />
                                <span>{student.email}</span>
                            </div>
                        </Col>
                        <Col md={6} className="mb-3">
                            <div className="d-flex align-items-center text-muted">
                                <Calendar size={16} className="me-2" />
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
                        <BookOpen size={20} className="text-primary me-2" />
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

            {/* Uploaded Certificates */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-body border-bottom-0 pt-4 px-4 pb-0">
                    <h5 className="fw-bold d-flex align-items-center mb-1">
                        <Award size={20} className="text-warning me-2" />
                        Certificates ({student.certificates?.length || 0})
                    </h5>
                </Card.Header>
                <Card.Body className="p-4">
                    {(!student.certificates || student.certificates.length === 0) ? (
                        <p className="text-muted mb-0">No certificates uploaded yet.</p>
                    ) : (
                        student.certificates.map(cert => (
                            <div key={cert.id} className="d-flex justify-content-between align-items-center p-3 bg-body-tertiary rounded mb-2">
                                <div className="d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-10 p-2 rounded me-3 text-warning"><FileText size={20} /></div>
                                    <div>
                                        <h6 className="fw-bold mb-0">{cert.title}</h6>
                                        <small className="text-muted">Uploaded {new Date(cert.createdAt).toLocaleString()}</small>
                                    </div>
                                </div>
                                {cert.fileUrl && (
                                    <Button variant="outline-primary" size="sm" href={getFullUrl(cert.fileUrl)} target="_blank" rel="noopener noreferrer">
                                        View
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default StudentDetail;
