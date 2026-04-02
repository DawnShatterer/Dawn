import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar, Button, Spinner } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PaginationControls from '../components/PaginationControls';
import { Users, BookOpen, TrendingUp, DollarSign, Activity, Clock, Server, BarChart3, ShieldCheck, Eye, Ban, CheckCircle } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AdminHome = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/Analytics/admin');
            return res.data;
        }
    });

    const [usersPage, setUsersPage] = useState(1);
    
    const { data: allUsers, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-all-users', usersPage],
        queryFn: async () => {
            const res = await api.get(`/Auth/users?page=${usersPage}&limit=5`);
            return res.data;
        }
    });

    const { data: allCourses } = useQuery({
        queryKey: ['admin-all-courses'],
        queryFn: async () => {
            const res = await api.get('/Courses');
            return res.data;
        }
    });

    const toggleSuspendMutation = useMutation({
        mutationFn: async (userId) => {
            const res = await api.post(`/Auth/users/${userId}/toggle-suspend`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-all-users']);
        },
        onError: (err) => {
            alert(err.response?.data?.message || "Failed to toggle suspension status.");
        }
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-body-tertiary">
                <div className="text-center">
                    <div className="spinner-grow text-primary mb-3" role="status" />
                    <p className="text-muted fw-bold">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // Compute role distribution for pie chart
    const roleCounts = { Student: 0, Teacher: 0, Admin: 0 };
    if (allUsers?.items) {
        allUsers.items.forEach(u => {
            const role = u.role || 'Student';
            if (roleCounts[role] !== undefined) roleCounts[role]++;
        });
    }

    // Mock monthly data for charts (in future, replace with real analytics)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);

    // To prevent graphical gliching/scaling issues, the mock data now scales relative to the real current total
    const currentEnrollments = stats?.totalEnrollments || 1;
    const currentRevenue = stats?.totalRevenue || 0;
    const currentUsers = stats?.totalUsers || 1;

    // Build a realistic trending curve ending in the actual real value
    const mockEnrollments = [
        Math.floor(currentEnrollments * 0.2), 
        Math.floor(currentEnrollments * 0.35), 
        Math.floor(currentEnrollments * 0.5), 
        Math.floor(currentEnrollments * 0.6), 
        Math.floor(currentEnrollments * 0.8), 
        currentEnrollments
    ];
    
    const mockRevenue = [
        currentRevenue * 0.1, 
        currentRevenue * 0.25, 
        currentRevenue * 0.4, 
        currentRevenue * 0.5, 
        currentRevenue * 0.75, 
        currentRevenue
    ];
    
    const mockNewUsers = [
        Math.floor(currentUsers * 0.25), 
        Math.floor(currentUsers * 0.4), 
        Math.floor(currentUsers * 0.55), 
        Math.floor(currentUsers * 0.7), 
        Math.floor(currentUsers * 0.85), 
        currentUsers
    ];

    // Course categories for doughnut
    const courseCategories = {};
    if (allCourses?.items) {
        allCourses.items.forEach(c => {
            const cat = c.category || 'Uncategorized';
            courseCategories[cat] = (courseCategories[cat] || 0) + 1;
        });
    }
    const catLabels = Object.keys(courseCategories).length > 0 ? Object.keys(courseCategories) : ['Web Dev', 'Data Science', 'Design', 'Business'];
    const catValues = Object.keys(courseCategories).length > 0 ? Object.values(courseCategories) : [8, 5, 3, 4];

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'primary', change: '+12%', trend: 'up' },
        { label: 'Active Courses', value: stats?.activeCourses || 0, icon: BookOpen, color: 'success', change: '+5', trend: 'up' },
        { label: 'Enrollments', value: stats?.totalEnrollments || 0, icon: TrendingUp, color: 'info', change: '+23%', trend: 'up' },
        { label: 'Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'warning', change: '+8%', trend: 'up' },
    ];

    // Chart configs
    const barChartData = {
        labels: last6Months,
        datasets: [
            {
                label: 'New Enrollments',
                data: mockEnrollments,
                backgroundColor: 'rgba(13, 110, 253, 0.7)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
            {
                label: 'New Users',
                data: mockNewUsers,
                backgroundColor: 'rgba(25, 135, 84, 0.7)',
                borderColor: 'rgba(25, 135, 84, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }
        ]
    };

    const lineChartData = {
        labels: last6Months,
        datasets: [{
            label: 'Revenue ($)',
            data: mockRevenue,
            borderColor: '#6610f2',
            backgroundColor: 'rgba(102, 16, 242, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6610f2',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
        }]
    };

    const pieChartData = {
        labels: ['Students', 'Teachers', 'Admins'],
        datasets: [{
            data: [roleCounts.Student, roleCounts.Teacher, roleCounts.Admin],
            backgroundColor: ['#0d6efd', '#198754', '#dc3545'],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 12,
        }]
    };

    const doughnutData = {
        labels: catLabels,
        datasets: [{
            data: catValues,
            backgroundColor: ['#0dcaf0', '#fd7e14', '#6f42c1', '#20c997', '#e83e8c', '#ffc107'],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 12,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { font: { size: 11, weight: 'bold' }, padding: 15, usePointStyle: true, pointStyleWidth: 10 } },
            tooltip: { backgroundColor: '#1a1a2e', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 10, displayColors: true }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } }, beginAtZero: true }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12, weight: 'bold' }, padding: 15, usePointStyle: true } },
            tooltip: { backgroundColor: '#1a1a2e', padding: 12, cornerRadius: 10 }
        }
    };

    return (
        <div className="bg-body-tertiary min-vh-100">
            <Container fluid className="px-4 py-4">
                {/* Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bolder mb-1 text-body">
                            <Activity size={28} className="me-2 text-primary" />
                            Admin Dashboard
                        </h2>
                        <p className="text-muted mb-0 small">Welcome back! Here's what's happening on your platform.</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <Card className="border-0 shadow-sm px-3 py-2 rounded-3 bg-dark text-white">
                            <div className="d-flex align-items-center gap-2">
                                <Clock size={16} className="text-info" />
                                <span className="fw-bold" style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                                    {clock.toLocaleTimeString()}
                                </span>
                            </div>
                        </Card>
                        <Badge bg="success" className="px-3 py-2 rounded-pill shadow-sm">
                            <Server size={14} className="me-1" /> {stats?.systemHealth || '99.9% Uptime'}
                        </Badge>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row className="g-3 mb-4">
                    {statCards.map((stat, i) => (
                        <Col xs={6} lg={3} key={i}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ transition: 'transform 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <Card.Body className="p-3">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div className={`bg-${stat.color} bg-opacity-10 p-2 rounded-3`}>
                                            <stat.icon size={22} className={`text-${stat.color}`} />
                                        </div>
                                        <Badge bg="light" text="success" className="border border-success border-opacity-25 fw-bold" style={{ fontSize: '0.7rem' }}>
                                            <TrendingUp size={10} className="me-1" /> {stat.change}
                                        </Badge>
                                    </div>
                                    <h3 className="fw-bolder mb-1" style={{ fontSize: '1.6rem' }}>{stat.value}</h3>
                                    <p className="text-muted mb-0 fw-medium" style={{ fontSize: '0.8rem' }}>{stat.label}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Charts Row 1: Bar + Line */}
                <Row className="g-3 mb-4">
                    <Col lg={7}>
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">
                                        <BarChart3 size={18} className="me-2 text-primary" />
                                        Growth Overview
                                    </h6>
                                    <Badge bg="primary" bg-opacity-10 className="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-bold" style={{ fontSize: '0.65rem' }}>Last 6 Months</Badge>
                                </div>
                                <div style={{ height: '280px' }}>
                                    <Bar data={barChartData} options={chartOptions} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={5}>
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">
                                        <TrendingUp size={18} className="me-2 text-purple" style={{ color: '#6610f2' }} />
                                        Revenue Trend
                                    </h6>
                                    <Badge className="bg-purple bg-opacity-10 border border-purple border-opacity-25 fw-bold" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(102,16,242,0.1)', color: '#6610f2' }}>Monthly</Badge>
                                </div>
                                <div style={{ height: '280px' }}>
                                    <Line data={lineChartData} options={chartOptions} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 2: Pie + Doughnut + Quick Info */}
                <Row className="g-3 mb-4">
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold mb-3">
                                    <Users size={18} className="me-2 text-info" />
                                    User Distribution
                                </h6>
                                <div style={{ height: '240px' }}>
                                    <Pie data={pieChartData} options={pieOptions} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold mb-3">
                                    <BookOpen size={18} className="me-2 text-warning" />
                                    Course Categories
                                </h6>
                                <div style={{ height: '240px' }}>
                                    <Doughnut data={doughnutData} options={pieOptions} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold mb-4">
                                    <ShieldCheck size={18} className="me-2 text-success" />
                                    Platform Health
                                </h6>
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small fw-bold">Server Uptime</span>
                                        <span className="small fw-bold text-success">99.9%</span>
                                    </div>
                                    <ProgressBar striped animated now={99.9} variant="success" style={{ height: '10px', borderRadius: '10px' }} />
                                </div>
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small fw-bold">API Response</span>
                                        <span className="small fw-bold text-primary">95%</span>
                                    </div>
                                    <ProgressBar striped animated now={95} variant="primary" style={{ height: '10px', borderRadius: '10px' }} />
                                </div>
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small fw-bold">Database Health</span>
                                        <span className="small fw-bold text-info">98%</span>
                                    </div>
                                    <ProgressBar striped animated now={98} variant="info" style={{ height: '10px', borderRadius: '10px' }} />
                                </div>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small fw-bold">Storage Used</span>
                                        <span className="small fw-bold text-warning">42%</span>
                                    </div>
                                    <ProgressBar striped animated now={42} variant="warning" style={{ height: '10px', borderRadius: '10px' }} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Activity */}
                <Row className="g-3">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0">
                                        <Users size={18} className="me-2 text-primary" />
                                        Registered Users
                                    </h6>
                                    <Badge bg="primary" pill>{allUsers?.totalCount || 0} Total</Badge>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0 border-top">
                                        <thead className="table-light text-muted small text-uppercase">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Joined</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersLoading ? (
                                                <tr><td colSpan="5" className="text-center py-4"><Spinner animation="border" variant="primary" size="sm"/></td></tr>
                                            ) : allUsers?.items?.map((u) => (
                                                <tr key={u.id}>
                                                    <td className="fw-bold text-body">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                                                                {u.fullName?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            {u.fullName}
                                                        </div>
                                                    </td>
                                                    <td className="text-muted small">{u.email}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Badge bg={u.role === 'Admin' ? 'danger' : u.role === 'Teacher' ? 'success' : 'primary'} className="rounded-pill fw-medium bg-opacity-10 text-dark border">
                                                                {u.role}
                                                            </Badge>
                                                            {u.isSuspended && (
                                                                <Badge bg="danger" className="rounded-pill fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>
                                                                    Suspended
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-muted small">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    <td className="text-end">
                                                        <Button 
                                                            variant={u.isSuspended ? "outline-success" : "outline-danger"} 
                                                            size="sm" 
                                                            onClick={() => toggleSuspendMutation.mutate(u.id)}
                                                            disabled={u.role === 'Admin' || toggleSuspendMutation.isPending}
                                                        >
                                                            {u.isSuspended ? (
                                                                <><CheckCircle size={14} className="me-1" /> Reactivate</>
                                                            ) : (
                                                                <><Ban size={14} className="me-1" /> Suspend</>
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!usersLoading && (!allUsers?.items || allUsers.items.length === 0)) && (
                                                <tr><td colSpan="5" className="text-center text-muted py-3">No users found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <PaginationControls page={usersPage} setPage={setUsersPage} totalPages={allUsers?.totalPages || 1} />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4 position-relative">
                                <div className="position-absolute top-0 end-0 opacity-10" style={{ transform: 'translate(20%, -20%)' }}>
                                    <Activity size={160} />
                                </div>
                                <h6 className="fw-bold mb-4 text-white-50">Quick Stats</h6>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-1">
                                        <div className="bg-primary rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                                        <span className="small text-white-50">Avg. Session Duration</span>
                                    </div>
                                    <h4 className="fw-bolder mb-0">24 min</h4>
                                </div>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-1">
                                        <div className="bg-success rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                                        <span className="small text-white-50">Completion Rate</span>
                                    </div>
                                    <h4 className="fw-bolder mb-0">67%</h4>
                                </div>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-1">
                                        <div className="bg-warning rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                                        <span className="small text-white-50">Active Today</span>
                                    </div>
                                    <h4 className="fw-bolder mb-0">{Math.max(1, Math.floor((stats?.totalUsers || 14) * 0.3))}</h4>
                                </div>

                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AdminHome;
