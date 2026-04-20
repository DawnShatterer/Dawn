import React from 'react';
import { Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getStudentProgress } from '../api/analyticsService';
import GlobalSpinner from '../components/GlobalSpinner';

const StudentProgress = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({
        queryKey: ['student-progress'],
        queryFn: getStudentProgress
    });

    if (isLoading) {
        return <GlobalSpinner message="Loading your progress..." />;
    }

    const { stats, courseProgress } = data || {
        stats: { coursesCompleted: 0, coursesInProgress: 0, totalHoursLearned: 0, averageQuizScore: 0 },
        courseProgress: []
    };

    return (
        <div className="container-fluid py-4 font-sans">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h2 className="fw-bold mb-1 d-flex align-items-center">
                        <i className="bi bi-graph-up-arrow text-primary me-2" style={{ fontSize: '30px' }}></i> My Learning Progress
                    </h2>
                    <p className="text-muted mb-0">Track your milestones and recent activity</p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <Row className="g-4 mb-5">
                {[
                    { label: 'Courses Completed', value: stats.coursesCompleted, icon: 'bi-trophy', color: 'success' },
                    { label: 'In Progress', value: stats.coursesInProgress, icon: 'bi-bullseye', color: 'primary' },
                    { label: 'Hours Learned', value: stats.totalHoursLearned, icon: 'bi-clock', color: 'warning' },
                    { label: 'Avg Quiz Score', value: `${stats.averageQuizScore}%`, icon: 'bi-book', color: 'info' }
                ].map((stat, idx) => (
                    <Col xs={12} sm={6} lg={3} key={idx}>
                        <Card className="border-0 shadow-sm rounded-4 hover-lift">
                            <Card.Body className="p-4 d-flex align-items-center">
                                <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded-circle me-3`}>
                                    <i className={`bi ${stat.icon} text-${stat.color}`} style={{ fontSize: '24px' }}></i>
                                </div>
                                <div>
                                    <p className="text-muted small mb-1 fw-medium text-uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="fw-bold m-0">{stat.value}</h3>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                {/* Active Courses Progress */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Header className="bg-body border-0 pt-4 pb-0 px-4">
                            <h5 className="fw-bold">Current Course Trajectories</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {courseProgress.map((course, idx) => (
                                <div key={course.id} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="fw-bold mb-0">{course.title}</h6>
                                        <Badge bg={course.color} className="bg-opacity-10 border-0">{course.progress}% Complete</Badge>
                                    </div>
                                    <ProgressBar variant={course.color} now={course.progress} className="rounded-pill mb-2 shadow-sm" style={{ height: '8px' }} />
                                    <small className="text-muted d-flex align-items-center">
                                        <i className="bi bi-clock me-1" style={{ fontSize: '12px' }}></i> Enrolled: {new Date(course.lastAccessed).toLocaleDateString()}
                                    </small>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Recent Achievements / To-do */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #20c997 0%, #0dcaf0 100%)' }}>
                        <Card.Body className="p-4 d-flex flex-column justify-content-between">
                            <div>
                                <div className="bg-body bg-opacity-25 d-inline-block p-3 rounded-circle mb-3">
                                    <i className="bi bi-trophy text-white" style={{ fontSize: '32px' }}></i>
                                </div>
                                <h4 className="fw-bold">Keep going!</h4>
                                <p className="opacity-75">You are doing great. Keep tracking your progress to achieve your goals!</p>
                            </div>
                            <button 
                                className="btn btn-light fw-bold text-success rounded-pill py-2 shadow-sm w-100"
                                onClick={() => courseProgress?.length > 0 ? navigate(`/courses/${courseProgress[0].id}`) : navigate('/my-courses')}
                            >
                                Resume Course Now
                            </button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StudentProgress;
