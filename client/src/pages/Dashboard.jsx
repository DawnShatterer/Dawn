import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '../api/courseService';
import { getUserInfo } from '../utils/authUtils';
import { Spinner, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { BookOpen, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const user = getUserInfo();

    // React Query magic: Handles loading, error, and caching automatically
    const { data: courses, isLoading, isError } = useQuery({
        queryKey: ['courses'],
        queryFn: getCourses
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="alert alert-danger m-5">
                Error loading courses. Please check if your Backend API is running!
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <header className="mb-4">
                <h2 className="fw-bold text-dark">Welcome back, {user?.name || 'User'}!</h2>
                <p className="text-muted">You are logged in as a <strong>{user?.role}</strong>.</p>
            </header>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Explore Available Courses</h4>
                <Badge bg="primary" className="px-3 py-2">{courses?.length} Courses Found</Badge>
            </div>

            <Row>
                {courses?.map((course) => (
                    <Col key={course.id} xs={12} sm={6} lg={4} xl={3} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm hover-shadow transition">
                            <Card.Body className="d-flex flex-column">
                                <div className="mb-3">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle d-inline-block">
                                        <BookOpen className="text-primary" size={20} />
                                    </div>
                                </div>
                                <Card.Title className="fw-bold text-truncate">{course.title}</Card.Title>
                                <Card.Text className="text-muted small flex-grow-1">
                                    {course.description ? course.description.substring(0, 80) + '...' : 'No description provided.'}
                                </Card.Text>
                                <div className="mt-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center text-success fw-bold">
                                        <DollarSign size={16} />
                                        <span>{course.price || 'Free'}</span>
                                    </div>
                                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                                        View
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default Dashboard;