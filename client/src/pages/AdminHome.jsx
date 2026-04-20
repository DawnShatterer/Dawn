import React, { useMemo } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminHome = () => {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/Analytics/admin');
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    const { data: allUsers } = useQuery({
        queryKey: ['admin-all-users-breakdown'],
        queryFn: async () => {
            const res = await api.get('/Auth/all-users');
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    const statCards = [
        { label: 'Semester Collections', value: `Rs. ${(stats?.totalRevenue || 0).toFixed(0)}`, textClass: 'text-success', icon: 'bi-cash-stack', color: '#198754' },
        { label: 'Total Users', value: stats?.totalUsers ?? '—', textClass: 'text-primary', icon: 'bi-people', color: '#0d6efd' },
        { label: 'Active Enrollments', value: stats?.totalEnrollments ?? '—', textClass: 'text-info', icon: 'bi-journal-check', color: '#0dcaf0' },
        { label: 'Active Modules', value: stats?.activeCourses ?? '—', textClass: 'text-warning', icon: 'bi-book', color: '#ffc107' },
    ];

    // Stable user breakdown from real API data — no Math.random()
    const roleBreakdown = useMemo(() => {
        if (!allUsers) return { students: 0, teachers: 0, staff: 0 };
        return {
            students: allUsers.filter(u => u.role === 'Student').length,
            teachers: allUsers.filter(u => u.role === 'Teacher').length,
            staff: allUsers.filter(u => u.role === 'Staff').length,
        };
    }, [allUsers]);

    const doughnutData = {
        labels: ['Students', 'Teachers', 'Staff'],
        datasets: [{
            data: [roleBreakdown.students, roleBreakdown.teachers, roleBreakdown.staff],
            backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(168,85,247,0.8)'],
            borderColor: ['#3b82f6', '#22c55e', '#a855f7'],
            borderWidth: 2,
        }]
    };

    // Stable bar chart from real stats
    const barData = useMemo(() => ({
        labels: ['Total Users', 'Active Modules', 'Total Enrollments'],
        datasets: [{
            label: 'Count',
            data: [
                stats?.totalUsers || 0,
                stats?.activeCourses || 0,
                stats?.totalEnrollments || 0,
            ],
            backgroundColor: [
                'rgba(59,130,246,0.75)',
                'rgba(251,191,36,0.75)',
                'rgba(34,197,94,0.75)',
            ],
            borderColor: ['#3b82f6', '#fbbf24', '#22c55e'],
            borderWidth: 2,
            borderRadius: 8,
        }]
    }), [stats]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { position: 'bottom' } },
    };

    if (isLoading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    );

    if (isError) return <Alert variant="danger" className="m-4">Failed to load dashboard data. Please try again.</Alert>;

    return (
        <div className="container-fluid py-4 w-100 h-100">
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Admin Dashboard</h2>
                <p className="text-muted">Overview of platform metrics and growth.</p>
            </div>

            <Row className="g-4 mb-4">
                {statCards.map((stat, i) => (
                    <Col md={3} key={i}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${stat.color}` }}>
                            <Card.Body className="p-4 d-flex align-items-center gap-3">
                                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{ width: 48, height: 48, background: `${stat.color}20` }}>
                                    <i className={`bi ${stat.icon}`} style={{ fontSize: '1.4rem', color: stat.color }}></i>
                                </div>
                                <div>
                                    <p className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>{stat.label}</p>
                                    <h3 className={`fw-bold mb-0 ${stat.textClass}`}>{stat.value}</h3>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4">Platform Overview</h5>
                            <div style={{ height: '300px' }}>
                                <Bar data={barData} options={chartOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={5}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4">User Role Distribution</h5>
                            <div style={{ height: '300px' }}>
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminHome;
