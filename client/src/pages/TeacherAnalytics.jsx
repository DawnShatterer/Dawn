import React from 'react';
import { Row, Col, Card, Badge, Table, Spinner } from 'react-bootstrap';
import { PieChart, Users, DollarSign, Activity, ArrowUpRight, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeacherAnalytics } from '../api/analyticsService';
import { deleteCourse } from '../api/courseService';
import { useNavigate } from 'react-router-dom';

const TeacherAnalytics = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['teacher-analytics'],
        queryFn: getTeacherAnalytics
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            queryClient.invalidateQueries(['teacher-analytics']);
            queryClient.invalidateQueries(['courses']);
        }
    });

    const handleDelete = (id, title) => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
    }

    const { overview, recentActivity, courseStats } = data || {
        overview: { totalStudents: 0, recentEnrollments: 0, totalRevenue: 0, averageRating: 0 },
        recentActivity: [],
        courseStats: []
    };

    return (
        <div className="container-fluid py-4 font-sans">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h2 className="fw-bold text-body mb-1 d-flex align-items-center">
                        <PieChart className="text-primary me-2" size={30} /> Performance Analytics
                    </h2>
                    <p className="text-muted mb-0">Overview of your teaching impact and revenue</p>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <Row className="g-4 mb-5">
                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 border border-light">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <Users size={24} className="text-primary" />
                                <Badge bg="primary" className="rounded-pill px-2 py-1"><ArrowUpRight size={12}/> +12%</Badge>
                            </div>
                            <h3 className="fw-bold text-body mb-1">{overview.totalStudents}</h3>
                            <p className="text-muted small fw-medium mb-0">Total Active Students</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 border border-light">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <DollarSign size={24} className="text-success" />
                                <Badge bg="success" className="rounded-pill px-2 py-1"><ArrowUpRight size={12}/> +New</Badge>
                            </div>
                            <h3 className="fw-bold text-body mb-1">${(overview.totalRevenue || 0).toLocaleString()}</h3>
                            <p className="text-muted small fw-medium mb-0">Total Earnings</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 border border-light">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <Activity size={24} className="text-info" />
                            </div>
                            <h3 className="fw-bold text-body mb-1">{overview.recentEnrollments}</h3>
                            <p className="text-muted small fw-medium mb-0">New Enrollments (This Week)</p>
                        </Card.Body>
                    </Card>
                </Col>

            </Row>

        <Row className="g-4">
                {/* Course Breakdown Table */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 border border-light">
                        <Card.Header className="bg-body border-bottom-0 pt-4 pb-0 px-4">
                            <h5 className="fw-bold text-body">Top Performing Courses</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0 text-body" borderless>
                                    <thead className="border-bottom text-muted small text-uppercase">
                                        <tr>
                                            <th className="fw-bold pb-3">Course Name</th>
                                            <th className="fw-bold pb-3 text-center">Students</th>
                                            <th className="fw-bold pb-3 text-center">Revenue</th>
                                            <th className="fw-bold pb-3 text-center">Manage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courseStats.map(stat => (
                                            <tr key={stat.id} className="border-bottom">
                                                <td className="py-3">
                                                    <span className="fw-bold text-body">{stat.title}</span>
                                                </td>
                                                <td className="py-3 text-center fw-medium text-secondary">{stat.students}</td>
                                                <td className="py-3 text-center fw-bold text-success">${stat.revenue.toLocaleString()}</td>
                                                <td className="py-3 text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                            onClick={() => navigate(`/edit-course/${stat.id}`)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger rounded-pill px-2 d-flex align-items-center"
                                                            onClick={() => handleDelete(stat.id, stat.title)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Recent Activity Feed */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 border border-light">
                        <Card.Header className="bg-body border-bottom-0 pt-4 pb-0 px-4">
                            <h5 className="fw-bold text-body">Recent Activity</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="position-relative">
                                {/* Vertical Line timeline */}
                                <div className="position-absolute h-100 border-start ms-2" style={{ borderColor: '#e9ecef', zIndex: 0 }}></div>
                                
                                {recentActivity.map(item => (
                                    <div key={item.id} className="d-flex mb-4 position-relative z-1">
                                        <div className={`bg-${item.type} rounded-circle mt-1 flex-shrink-0 shadow-sm`} style={{ width: '16px', height: '16px' }}></div>
                                        <div className="ms-3">
                                            <p className="fw-bold text-body mb-1 small">{item.action}</p>
                                            <p className="text-muted small mb-1">{item.detail}</p>
                                            <small className="text-secondary opacity-75" style={{ fontSize: '11px' }}>{new Date(item.time).toLocaleString()}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TeacherAnalytics;
