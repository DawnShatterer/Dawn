import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { getCourses, getRecommendedCourses } from '../api/courseService';
import { getMyEnrollments } from '../api/enrollmentService';
import { getUserInfo } from '../utils/authUtils';
import api from '../api/axios';
import { Spinner, Row, Col, Card, Badge, Button, ProgressBar, Nav, Tab } from 'react-bootstrap';
import { BookOpen, GraduationCap, Users, Trophy, Sparkles, Target, CheckCircle, Eye, MessageSquare, ClipboardList, BellRing, Calendar, ArrowRight } from 'lucide-react';

const Dashboard = () => {
    const user = getUserInfo();
    const navigate = useNavigate();
    const userRole = user?.role?.toLowerCase();
    const isStudent = userRole === 'student';
    const isTeacher = userRole === 'teacher';
    const isAdmin = userRole === 'admin';

    // Route Admins — use Navigate component instead of navigate() during render
    if (isAdmin) {
        return <Navigate to="/admin-home" replace />;
    }

    // ─── Queries ───
    const { data: courses, isLoading: coursesLoading } = useQuery({ queryKey: ['courses'], queryFn: getCourses });
    const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({ queryKey: ['my-enrollments'], queryFn: getMyEnrollments, enabled: isStudent });
    const { data: studentStats } = useQuery({ queryKey: ['student-analytics'], queryFn: async () => { const res = await api.get('/Analytics/student'); return res.data; }, enabled: isStudent });
    const { data: teacherStats } = useQuery({ queryKey: ['teacher-analytics'], queryFn: async () => { const res = await api.get('/Analytics/teacher'); return res.data; }, enabled: isTeacher });
    const { data: recommendedCourses } = useQuery({ queryKey: ['recommended-courses'], queryFn: getRecommendedCourses, enabled: isStudent });

    // Fetch recent announcements from all enrolled courses
    const { data: recentAnnouncements } = useQuery({
        queryKey: ['all-announcements'],
        queryFn: async () => {
            if (!enrollments?.length) return [];
            const courseIds = [...new Set(enrollments.map(e => e.courseId))];
            const promises = courseIds.slice(0, 5).map(id => api.get(`/Announcements/course/${id}`).then(r => r.data).catch(() => []));
            const results = await Promise.all(promises);
            return results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
        },
        enabled: isStudent && !!enrollments?.length
    });

    if (coursesLoading || (isStudent && enrollmentsLoading)) {
        return <div className="d-flex justify-content-center align-items-center vh-100 bg-body-tertiary"><Spinner animation="grow" variant="primary" /></div>;
    }

    // ═══════════════════════════════════════
    // ═══ STUDENT DASHBOARD (MST-Inspired) ═══
    // ═══════════════════════════════════════
    if (isStudent) {
        const completedCount = studentStats?.stats?.coursesCompleted || 0;
        const inProgressCount = studentStats?.stats?.coursesInProgress || enrollments?.length || 0;

        return (
            <div className="container-fluid py-4 min-vh-100 bg-body-tertiary font-sans">
                
                {/* ─── Dawn Unique Asymmetrical Layout ─── */}
                <Row className="g-4 mb-5">
                    {/* LEFT COLUMN: Hero + Action Cards (8 cols) */}
                    <Col lg={8}>
                        
                        {/* Hero Stats Banner */}
                        <Card className="border-0 shadow-sm mb-4 overflow-hidden position-relative bg-primary text-white">
                            <div className="position-absolute top-0 end-0 h-100 opacity-25 pe-none" style={{ width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8))' }}></div>
                            <Card.Body className="p-4 p-md-5 position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                                <div className="mb-4 mb-md-0">
                                    <Badge bg="light" text="primary" className="mb-3 px-3 py-2 rounded-pill fw-bold shadow-sm">
                                        <Sparkles size={14} className="me-1" /> Student Portal
                                    </Badge>
                                    <h3 className="fw-bold mb-2">Welcome back, {user?.name || 'Student'}!</h3>
                                    <p className="mb-0 opacity-75" style={{ maxWidth: '400px' }}>
                                        Continue your learning journey. You have completed {completedCount} {completedCount === 1 ? 'course' : 'courses'} so far.
                                    </p>
                                </div>
                                <div className="d-flex gap-3 text-center">
                                    <div className="bg-body bg-opacity-25 rounded-4 p-3 shadow-sm" style={{ backdropFilter: 'blur(10px)', minWidth: '100px' }}>
                                        <h2 className="fw-bold mb-0">{inProgressCount}</h2>
                                        <small className="fw-medium opacity-75">Active</small>
                                    </div>
                                    <div className="bg-body bg-opacity-25 rounded-4 p-3 shadow-sm" style={{ backdropFilter: 'blur(10px)', minWidth: '100px' }}>
                                        <h2 className="fw-bold mb-0">{studentStats?.stats?.totalHoursLearned || 0}</h2>
                                        <small className="fw-medium opacity-75">Hours</small>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Action Cards Grid */}
                        <h6 className="fw-bold text-muted text-uppercase mb-3" style={{ letterSpacing: '0.5px', fontSize: '0.8rem' }}>Quick Actions</h6>
                        <Row className="g-4">
                            <Col md={6}>
                                <Card 
                                    className="border-0 shadow-sm h-100 position-relative overflow-hidden hover-lift bg-body"
                                    onClick={() => navigate('/my-courses')}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                                >
                                    <Card.Body className="p-4">
                                        <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-4 mb-3">
                                            <BookOpen size={24} className="text-primary" />
                                        </div>
                                        <h5 className="fw-bold text-body mb-2">My Learning Journey</h5>
                                        <p className="text-muted small mb-0 lh-lg">Access your enrolled classrooms, resume videos, and review course materials.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card 
                                    className="border-0 shadow-sm h-100 position-relative overflow-hidden hover-lift bg-body"
                                    onClick={() => navigate('/my-courses')}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                                >
                                    <Card.Body className="p-4">
                                        <div className="bg-danger bg-opacity-10 d-inline-flex p-3 rounded-4 mb-3">
                                            <Target size={24} className="text-danger" />
                                        </div>
                                        <h5 className="fw-bold text-body mb-2">Quizzes & Assessments</h5>
                                        <p className="text-muted small mb-0 lh-lg">Test your knowledge, submit pending assignments, and view your grades.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={12}>
                                <Card 
                                    className="border-0 shadow-sm hover-lift bg-body overflow-hidden"
                                    onClick={() => navigate('/messages')}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                                >
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-success bg-opacity-10 d-inline-flex p-3 rounded-4 me-4 flex-shrink-0">
                                            <MessageSquare size={26} className="text-success" />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold text-body mb-1">Community Hub & Chat Rooms</h5>
                                            <p className="text-muted small mb-0">Connect with your peers and instructors in real-time chat spaces.</p>
                                        </div>
                                        <div className="ms-auto flex-shrink-0 d-none d-sm-block">
                                            <Button variant="light" className="rounded-circle p-2 text-success shadow-sm">
                                                <ArrowRight size={20} />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>

                    {/* RIGHT COLUMN: Notice Board (4 cols) */}
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100 bg-body d-flex flex-column">
                            <Card.Header className="bg-transparent border-bottom-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold text-body mb-0 d-flex align-items-center">
                                    <BellRing size={20} className="me-2 text-warning" /> Updates
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-0 flex-grow-1 d-flex flex-column">
                                <Tab.Container defaultActiveKey="notices">
                                    <Nav variant="pills" className="px-4 py-3 gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                                        <Nav.Item>
                                            <Nav.Link eventKey="notices" className="rounded-pill px-3 py-1 small fw-bold">Notices</Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="progress" className="rounded-pill px-3 py-1 small fw-bold">Progress</Nav.Link>
                                        </Nav.Item>
                                    </Nav>
                                    
                                    <Tab.Content className="flex-grow-1 position-relative" style={{ minHeight: '300px' }}>
                                        {/* NOTICES TAB */}
                                        <Tab.Pane eventKey="notices" className="h-100 px-4 pb-4">
                                            {(!recentAnnouncements || recentAnnouncements.length === 0) ? (
                                                <div className="text-center py-5 text-muted h-100 d-flex flex-column justify-content-center">
                                                    <ClipboardList size={40} className="mb-3 mx-auto opacity-25" />
                                                    <p className="small mb-0">You're all caught up!</p>
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-3">
                                                    {recentAnnouncements.map((a, idx) => (
                                                        <div key={a.id || idx} className="p-3 bg-body-tertiary rounded-4 border">
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <small className="fw-bold text-body text-truncate pe-2">"{a.title}"</small>
                                                                <small className="text-muted flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                                                                    {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                </small>
                                                            </div>
                                                            <p className="text-muted mb-2 lh-sm" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                                                                {a.content?.length > 100 ? a.content.substring(0, 100) + '...' : a.content}
                                                            </p>
                                                            <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem' }}>
                                                                <div className="bg-secondary bg-opacity-25 rounded-circle me-1" style={{ width: '16px', height: '16px' }}></div>
                                                                {a.authorName}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Tab.Pane>

                                        {/* PROGRESS TAB */}
                                        <Tab.Pane eventKey="progress" className="h-100 px-4 pb-4">
                                            {enrollments?.length > 0 ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {enrollments.map(e => (
                                                        <div key={e.id} className="p-3 bg-body-tertiary rounded-4 border">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold text-body text-truncate pe-2" style={{ fontSize: '0.85rem' }}>{e.courseTitle}</span>
                                                                <span className="fw-bold text-primary small">{e.progress}%</span>
                                                            </div>
                                                            <ProgressBar variant={e.progress >= 100 ? 'success' : 'primary'} now={e.progress} style={{ height: '6px' }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5 text-muted h-100 d-flex flex-column justify-content-center">
                                                    <Target size={40} className="mb-3 mx-auto opacity-25" />
                                                    <p className="small mb-0">No courses enrolled yet.</p>
                                                </div>
                                            )}
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Tab.Container>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* ─── AI Recommended Courses ─── */}
                {recommendedCourses?.length > 0 && (
                    <>
                        <h5 className="fw-bold mb-4 d-flex align-items-center">
                            <Sparkles className="me-2 text-warning" size={22} />
                            Recommended for You
                            <Badge bg="dark" className="ms-2 px-2 py-1 rounded-pill fw-medium" style={{ fontSize: '0.7rem' }}>AI</Badge>
                        </h5>
                        <Row className="g-4 mb-4">
                            {recommendedCourses.slice(0, 4).map(course => (
                                <Col key={`rec-${course.id}`} xs={12} md={6} lg={3}>
                                    <Card className="h-100 border-0 shadow-sm" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Card.Body className="p-3 d-flex flex-column">
                                            <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 align-self-start mb-2" style={{ fontSize: '0.7rem' }}>Top Match</Badge>
                                            <h6 className="fw-bold text-body mb-2">{course.title}</h6>
                                            <p className="text-muted mb-0 flex-grow-1" style={{ fontSize: '0.75rem' }}>
                                                {course.description ? (course.description.length > 60 ? course.description.substring(0, 60) + '...' : course.description) : ''}
                                            </p>
                                            <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                                                <span className="fw-bold text-success small">{course.price > 0 ? `Rs. ${Number(course.price).toFixed(2)}` : 'Free'}</span>
                                                <ArrowRight size={14} className="text-primary" />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </>
                )}
            </div>
        );
    }

    // ═════════════════════════
    // ═══ TEACHER VIEW ═══
    // ═════════════════════════
    const myCourses = courses?.filter(c => c.instructorId === user?.id) || [];

    return (
        <div className="container-fluid py-4 min-vh-100 bg-body-tertiary font-sans">
            <Row className="mb-4 align-items-center">
                <Col>
                    <h4 className="fw-bold text-body mb-1 d-flex align-items-center">
                        Instructor Studio <Badge bg="dark" className="ms-2 px-2 py-1 rounded-pill fw-medium" style={{ fontSize: '0.7rem' }}>Creator Mode</Badge>
                    </h4>
                    <p className="text-muted mb-0 small">Manage your course portfolio and track student engagement.</p>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center" onClick={() => navigate('/create-course')}>
                        <BookOpen size={16} className="me-2" /> Publish New Course
                    </Button>
                </Col>
            </Row>

            <Row className="g-4 mb-5">
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Audience</small>
                                <div className="bg-success bg-opacity-10 p-2 rounded-circle"><Users className="text-success" size={18} /></div>
                            </div>
                            <h2 className="fw-bold text-body mb-0">{teacherStats?.overview?.totalStudents || 0}</h2>
                            <small className="text-success fw-bold"><CheckCircle size={12} className="me-1" />{teacherStats?.overview?.recentEnrollments || 0} new this week</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Published Courses</small>
                                <div className="bg-primary bg-opacity-10 p-2 rounded-circle"><BookOpen className="text-primary" size={18} /></div>
                            </div>
                            <h2 className="fw-bold text-body mb-0">{myCourses.length}</h2>
                            <small className="text-muted fw-medium">Active in catalog</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Total Revenue</small>
                                <div className="bg-warning bg-opacity-10 p-2 rounded-circle"><Trophy className="text-warning" size={18} /></div>
                            </div>
                            <h2 className="fw-bold text-body mb-0">${teacherStats?.overview?.totalRevenue ? Number(teacherStats.overview.totalRevenue).toFixed(0) : '0'}</h2>
                            <small className="text-muted fw-medium">From all enrollments</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <h5 className="fw-bold mb-4 border-bottom pb-2">Your Course Portfolio</h5>
            {myCourses.length > 0 ? (
                <Row className="g-4">
                    {myCourses.map(course => (
                        <Col key={course.id} xs={12} md={6} lg={4}>
                            <Card className="h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
                                onClick={() => navigate(`/courses/${course.id}`)}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Card.Body className="p-4 d-flex flex-column">
                                    <Badge bg="primary" className="align-self-start mb-2 px-2 py-1" style={{ fontSize: '0.7rem' }}>Active</Badge>
                                    <h5 className="fw-bold text-body mb-2">{course.title}</h5>
                                    <p className="text-muted small flex-grow-1">
                                        {course.description ? (course.description.length > 80 ? course.description.substring(0, 80) + '...' : course.description) : 'No description.'}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                        <span className="fw-bold text-success">{course.price > 0 ? `Rs. ${Number(course.price).toFixed(2)}` : 'Free'}</span>
                                        <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold" onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}>
                                            Manage <Eye size={12} className="ms-1" />
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Card className="border-0 shadow-sm text-center p-5 bg-body">
                    <BookOpen size={48} className="text-muted mx-auto mb-3 opacity-50" />
                    <h5 className="fw-bold text-body">No Courses Published</h5>
                    <p className="text-muted mb-0">Share your knowledge with the world by creating your first course today!</p>
                </Card>
            )}
        </div>
    );
};

export default Dashboard;