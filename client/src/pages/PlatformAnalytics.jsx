import React, { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import PaginationControls from '../components/PaginationControls';
import 'bootstrap-icons/font/bootstrap-icons.css';
import SkeletonChartCard from '../components/SkeletonChartCard';
import SkeletonDashboardStats from '../components/SkeletonDashboardStats';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend);

const PlatformAnalytics = () => {
    const queryClient = useQueryClient();
    const [usersPage, setUsersPage] = useState(1);
    
    // Fetch admin statistics with error handling and retry
    const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/Analytics/admin');
            return res.data;
        },
        retry: 2,
        staleTime: 60000 // 1 minute
    });

    const { data: allUsers, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-all-users', usersPage],
        queryFn: async () => {
            const res = await api.get(`/Auth/users?page=${usersPage}&limit=5`);
            return res.data;
        }
    });

    const { data: allCourses, isLoading: coursesLoading, error: coursesError } = useQuery({
        queryKey: ['admin-all-courses'],
        queryFn: async () => {
            const res = await api.get('/Courses?limit=1000');
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

    const deleteUserMutation = useMutation({
        mutationFn: async (userId) => {
            const res = await api.delete(`/Auth/users/${userId}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-all-users']);
        },
        onError: (err) => {
            alert(err.response?.data?.message || "Failed to delete user.");
        }
    });

    // Error state rendering
    if (statsError || coursesError) {
        return (
            <div className="rc-page">
                <div className="rc-page-header">
                    <h2>Platform Analytics</h2>
                    <p>Unable to load analytics data</p>
                </div>
                <div className="alert alert-danger" style={{ margin: '2rem', padding: '1.5rem', borderRadius: '8px' }}>
                    <i className="bi bi-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                    {statsError && 'Failed to load statistics. '}
                    {coursesError && 'Failed to load course data. '}
                    Please try refreshing the page.
                </div>
            </div>
        );
    }

    // Loading state
    if (statsLoading || coursesLoading) {
        return (
            <div className="rc-page">
                <div className="rc-page-header">
                    <h2>Platform Analytics</h2>
                    <p>Loading analytics data...</p>
                </div>
                <SkeletonDashboardStats count={4} />
                <Row className="g-3 mt-3">
                    <Col lg={6}>
                        <SkeletonChartCard count={1} />
                    </Col>
                    <Col lg={6}>
                        <SkeletonChartCard count={1} />
                    </Col>
                </Row>
            </div>
        );
    }

    // Compute course categories dynamically from API (no hardcoded fallback)
    const courseCategories = {};
    if (allCourses?.items) {
        allCourses.items.forEach(c => {
            const cat = c.category || 'Uncategorized';
            courseCategories[cat] = (courseCategories[cat] || 0) + 1;
        });
    }
    
    const catLabels = Object.keys(courseCategories);
    const catValues = Object.values(courseCategories);

    // Use stats data for accurate role distribution (no hardcoded fallback)
    const pieChartData = {
        labels: ['Students', 'Teachers', 'Admins'],
        datasets: [{
            data: stats 
                ? [stats.totalStudents, stats.totalTeachers, stats.totalUsers - stats.totalStudents - stats.totalTeachers]
                : [0, 0, 0],
            backgroundColor: ['#348252', '#3b82f6', '#dc2626'],
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0)',
            hoverOffset: 12,
        }]
    };

    // Empty state for categories
    const doughnutData = catLabels.length > 0 ? {
        labels: catLabels,
        datasets: [{
            data: catValues,
            backgroundColor: ['#348252', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'],
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0)',
            hoverOffset: 12,
        }]
    } : null;

    const chartTextColor = 'var(--chart-text-color)';

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: chartTextColor, font: { size: 11, weight: '600' }, padding: 15, usePointStyle: true } },
            tooltip: { backgroundColor: '#1a1d23', padding: 12, cornerRadius: 10 }
        }
    };

    const getRoleBadgeStyle = (role) => {
        if (role === 'Admin') return { background: 'var(--stat-bg-danger)', color: 'var(--stat-color-danger)' };
        if (role === 'Teacher') return { background: 'var(--stat-bg-info)', color: 'var(--stat-color-info)' };
        return { background: 'var(--stat-bg-success)', color: 'var(--stat-color-success)' };
    };

    return (
        <div className="rc-page">
            {/* ── Header ── */}
            <div className="rc-page-header">
                <h2>Platform Analytics</h2>
                <p>In-depth insights, demographics, and user management.</p>
            </div>

            {/* ── New Metrics Cards ── */}
            {stats && (
                <Row className="g-3 mb-4">
                    <Col lg={3}>
                        <div className="rc-chart-card" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--stat-color-success)', marginBottom: '0.5rem' }}>
                                {stats.activeUsersLast24Hours}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--chart-text-color)', fontWeight: 500 }}>
                                Active Users (24h)
                            </div>
                        </div>
                    </Col>
                    <Col lg={3}>
                        <div className="rc-chart-card" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--stat-color-info)', marginBottom: '0.5rem' }}>
                                {stats.newEnrollmentsLast7Days}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--chart-text-color)', fontWeight: 500 }}>
                                New Enrollments (7d)
                            </div>
                        </div>
                    </Col>
                    <Col lg={3}>
                        <div className="rc-chart-card" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--stat-color-purple)', marginBottom: '0.5rem' }}>
                                {stats.totalTeachers}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--chart-text-color)', fontWeight: 500 }}>
                                Total Teachers
                            </div>
                        </div>
                    </Col>
                    <Col lg={3}>
                        <div className="rc-chart-card" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--stat-color-warning)', marginBottom: '0.5rem' }}>
                                {stats.totalStudents}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--chart-text-color)', fontWeight: 500 }}>
                                Total Students
                            </div>
                        </div>
                    </Col>
                </Row>
            )}

            {/* ── Charts Row ── */}
            <Row className="g-3 mb-4">
                <Col lg={6}>
                    <div className="rc-chart-card">
                        <div className="rc-chart-header">
                            <div className="rc-chart-title">
                                <i className="bi bi-people" style={{ color: 'var(--stat-color-info)', fontSize: '16px', marginRight: '6px' }}></i>
                                User Distribution
                            </div>
                        </div>
                        <div style={{ height: '240px' }}>
                            <Pie data={pieChartData} options={pieOptions} />
                        </div>
                    </div>
                </Col>
                <Col lg={6}>
                    <div className="rc-chart-card">
                        <div className="rc-chart-header">
                            <div className="rc-chart-title">
                                <i className="bi bi-book" style={{ color: 'var(--stat-color-warning)', fontSize: '16px', marginRight: '6px' }}></i>
                                Course Categories
                            </div>
                        </div>
                        <div style={{ height: '240px' }}>
                            {doughnutData ? (
                                <Doughnut data={doughnutData} options={pieOptions} />
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    height: '100%',
                                    opacity: 0.6,
                                    fontSize: '0.9rem',
                                    color: 'var(--chart-text-color)'
                                }}>
                                    No course categories available
                                </div>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            {/* ── Users Table + Quick Stats ── */}
            <Row className="g-3">
                <Col lg={12}>
                    <div className="rc-table">
                        <div className="rc-table-header">
                            <div className="rc-table-title">
                                <i className="bi bi-people" style={{ color: 'var(--stat-color-info)', fontSize: '16px', marginRight: '6px' }}></i>
                                Registered Users
                            </div>
                            <span className="rc-badge" style={{ background: 'var(--stat-bg-info)', color: 'var(--stat-color-info)' }}>
                                {allUsers?.totalCount || 0} Total
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersLoading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}><Spinner animation="border" size="sm" style={{ opacity: 0.3 }} /></td></tr>
                                    ) : allUsers?.items?.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--stat-bg-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--stat-color-success)', flexShrink: 0 }}>
                                                        {u.fullName?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{u.fullName}</span>
                                                </div>
                                            </td>
                                            <td style={{ opacity: 0.8, fontSize: '0.78rem' }}>{u.email}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <span className="rc-badge" style={getRoleBadgeStyle(u.role)}>{u.role}</span>
                                                    {u.isSuspended && (
                                                        <span className="rc-badge" style={{ background: 'var(--stat-bg-danger)', color: 'var(--stat-color-danger)' }}>Suspended</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ opacity: 0.7, fontSize: '0.78rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className={`rc-pill-btn ${u.isSuspended ? 'outline' : 'danger-outline'}`}
                                                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
                                                        onClick={() => toggleSuspendMutation.mutate(u.id)}
                                                        disabled={u.role === 'Admin' || toggleSuspendMutation.isPending}
                                                    >
                                                        {u.isSuspended ? <><i className="bi bi-check-circle" style={{ fontSize: '12px' }}></i> Reactivate</> : <><i className="bi bi-slash-circle" style={{ fontSize: '12px' }}></i> Suspend</>}
                                                    </button>
                                                    <button
                                                        className="rc-pill-btn danger-outline"
                                                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem', background: 'var(--stat-bg-danger)', borderColor: 'var(--stat-color-danger)', color: 'var(--stat-color-danger)' }}
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to permanently delete "${u.fullName}"? This cannot be undone.`)) {
                                                                deleteUserMutation.mutate(u.id);
                                                            }
                                                        }}
                                                        disabled={u.role === 'Admin' || deleteUserMutation.isPending}
                                                        title="Permanently delete user"
                                                    >
                                                        <i className="bi bi-trash" style={{ fontSize: '12px' }}></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!usersLoading && (!allUsers?.items || allUsers.items.length === 0)) && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', opacity: 0.6, fontSize: '0.82rem' }}>No users found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="rc-table-footer">
                            <PaginationControls page={usersPage} setPage={setUsersPage} totalPages={allUsers?.totalPages || 1} />
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default PlatformAnalytics;
