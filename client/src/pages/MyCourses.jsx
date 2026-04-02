import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyEnrollments } from '../api/enrollmentService';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { BookOpen, PlayCircle, Clock, Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyCourses = () => {
    const navigate = useNavigate();
    const { data: enrollments, isLoading, isError } = useQuery({
        queryKey: ['my-enrollments'],
        queryFn: getMyEnrollments
    });

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading your classrooms...</p>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container className="py-5">
                <Alert variant="danger">Failed to load your courses. Please try again later.</Alert>
            </Container>
        );
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5159';

    return (
        <Container className="py-4" style={{ maxWidth: '1000px' }}>
            <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 shadow-sm">
                    <BookOpen size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="fw-bold mb-0">My Classrooms</h2>
                    <p className="text-muted mb-0">Continue where you left off in your enrolled subjects.</p>
                </div>
            </div>

            {enrollments?.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-4 text-center p-5">
                    <div className="py-4">
                        <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
                            <BookOpen size={48} className="text-muted" />
                        </div>
                        <h4 className="fw-bold">No Enrollments Yet</h4>
                        <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                            You haven't enrolled in any courses yet. Explore our course catalog to find something that interests you!
                        </p>
                        <Button variant="primary" className="fw-bold px-4 rounded-pill" onClick={() => navigate('/courses')}>
                            Browse Subjects
                        </Button>
                    </div>
                </Card>
            ) : (
                <Row className="g-4">
                    {enrollments?.map((enrollment) => (
                        <Col key={enrollment.id} lg={6}>
                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100 position-relative hover-lift">
                                <Row className="g-0 h-100">
                                    <Col md={5}>
                                        <div className="h-100 position-relative" style={{ minHeight: '180px' }}>
                                            {enrollment.thumbnailUrl ? (
                                                <img 
                                                    src={enrollment.thumbnailUrl.startsWith('http') ? enrollment.thumbnailUrl : `${apiBase}${enrollment.thumbnailUrl}`} 
                                                    alt="Thumbnail" 
                                                    className="w-100 h-100" 
                                                    style={{ objectFit: 'cover' }} 
                                                />
                                            ) : (
                                                <div className="w-100 h-100 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center">
                                                    <BookOpen size={40} className="text-primary opacity-25" />
                                                </div>
                                            )}
                                            <div className="position-absolute top-0 start-0 m-2">
                                                <Badge bg="primary" className="shadow-sm">{enrollment.category || 'General'}</Badge>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={7}>
                                        <Card.Body className="d-flex flex-column justify-content-between p-4 h-100">
                                            <div>
                                                <h5 className="fw-bold mb-2 text-truncate-2" style={{ lineHeight: '1.4' }}>{enrollment.title}</h5>
                                                <p className="text-muted small mb-3 text-truncate-2" style={{ fontSize: '0.8rem' }}>{enrollment.instructorName || 'Dawn Instructor'}</p>
                                                
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="small text-muted fw-medium">Progress</span>
                                                        <span className="small fw-bold text-primary">{enrollment.progress || 0}%</span>
                                                    </div>
                                                    <ProgressBar now={enrollment.progress || 0} variant="primary" style={{ height: '6px' }} className="rounded-pill shadow-sm" />
                                                </div>
                                            </div>

                                            <div className="d-grid">
                                                <Button 
                                                    variant="primary" 
                                                    className="rounded-3 fw-bold d-flex align-items-center justify-content-center"
                                                    onClick={() => navigate(`/courses/${enrollment.id}`)}
                                                >
                                                    <PlayCircle size={18} className="me-2" /> Continue Subject
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <style>{`
                .text-truncate-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .hover-lift { transition: transform 0.2s; }
                .hover-lift:hover { transform: translateY(-5px); }
            `}</style>
        </Container>
    );
};

export default MyCourses;
