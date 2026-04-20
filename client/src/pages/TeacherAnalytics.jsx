import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getTeacherAnalytics } from '../api/analyticsService';
import { deleteCourse } from '../api/courseService';
import { useNavigate } from 'react-router-dom';
import SkeletonDashboardStats from '../components/SkeletonDashboardStats';
import SkeletonChartCard from '../components/SkeletonChartCard';
import { getUserInfo } from '../utils/authUtils';
import api from '../api/axios';

const TeacherAnalytics = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = getUserInfo();

    const { data, isLoading } = useQuery({
        queryKey: ['teacher-analytics'],
        queryFn: getTeacherAnalytics
    });
    
    // Fetch teacher's courses directly
    const { data: teacherCoursesData, isLoading: coursesLoading } = useQuery({
        queryKey: ['teacher-courses'],
        queryFn: async () => {
            const res = await api.get('/Courses?limit=100');
            const allCourses = res.data?.items || res.data?.data || res.data || [];
            return Array.isArray(allCourses) ? allCourses.filter(c => c.instructorId === user?.id) : [];
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            queryClient.invalidateQueries(['teacher-analytics']);
            queryClient.invalidateQueries(['teacher-courses']);
            queryClient.invalidateQueries(['courses']);
        }
    });

    const handleDelete = (id, title) => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    const { overview, recentActivity, courseStats } = data || {
        overview: { totalStudents: 0, recentEnrollments: 0, totalNetEarnings: 0, averageRating: 0 },
        recentActivity: [],
        courseStats: []
    };
    
    // Use directly fetched courses instead of courseStats from analytics
    const displayCourses = teacherCoursesData || courseStats;

    if (isLoading || coursesLoading) {
        return (
            <div className="rc-page">
                <div className="rc-page-header">
                    <h2>Performance Analytics</h2>
                    <p>Loading your analytics...</p>
                </div>
                <SkeletonDashboardStats count={3} />
                <Row className="g-3 mt-3">
                    <Col lg={8}>
                        <SkeletonChartCard count={1} />
                    </Col>
                    <Col lg={4}>
                        <SkeletonChartCard count={1} />
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div className="rc-page">
            {/* ── Header ── */}
            <div className="rc-page-header">
                <h2>Performance Analytics</h2>
                <p>Overview of your teaching impact and student engagement.</p>
            </div>

            {/* ── Stat Pills ── */}
            <div className="rc-stat-row">
                <div className="rc-stat-item">
                    <div className="rc-stat-icon" style={{ background: 'var(--stat-bg-success)' }}>
                        <i className="bi bi-people" style={{ color: 'var(--stat-color-success)', fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div className="rc-stat-label">Total Students</div>
                        <div className="rc-stat-value">{overview.totalStudents}</div>
                        <div className="rc-stat-sub" style={{ color: 'var(--stat-color-success)' }}>Active learners</div>
                    </div>
                </div>
                <div className="rc-stat-item">
                    <div className="rc-stat-icon" style={{ background: 'var(--stat-bg-warning)' }}>
                        <i className="bi bi-book" style={{ color: 'var(--stat-color-warning)', fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div className="rc-stat-label">Avg. Attendance</div>
                        <div className="rc-stat-value">{(overview.averageRating * 16).toFixed(0)}%</div>
                        <div className="rc-stat-sub" style={{ color: 'var(--stat-color-warning)' }}>Current semester</div>
                    </div>
                </div>
                <div className="rc-stat-item">
                    <div className="rc-stat-icon" style={{ background: 'var(--stat-bg-info)' }}>
                        <i className="bi bi-graph-up" style={{ color: 'var(--stat-color-info)', fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div className="rc-stat-label">New Enrollments</div>
                        <div className="rc-stat-value">{overview.recentEnrollments}</div>
                        <div className="rc-stat-sub" style={{ color: 'var(--stat-color-info)' }}>This week</div>
                    </div>
                </div>
            </div>

            <Row className="g-3">
                {/* ── Course Table ── */}
                <Col lg={8}>
                    <div className="rc-table">
                        <div className="rc-table-header">
                            <div className="rc-table-title">
                                <i className="bi bi-pie-chart" style={{ color: 'var(--stat-color-success)', fontSize: '16px', marginRight: '6px' }}></i>
                                Top Performing Courses
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Course Name</th>
                                        <th style={{ textAlign: 'center' }}>Students</th>
                                        <th style={{ textAlign: 'center' }}>Avg. Progress</th>
                                        <th style={{ textAlign: 'center' }}>Manage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayCourses.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem' }}>
                                                <i className="bi bi-book" style={{ opacity: 0.15, fontSize: '32px', marginBottom: '0.5rem' }}></i>
                                                <p style={{ opacity: 0.4, fontSize: '0.82rem', margin: 0 }}>No courses yet. Create your first course to see analytics here.</p>
                                            </td>
                                        </tr>
                                    ) : displayCourses.map(stat => (
                                        <tr key={stat.id} style={{ opacity: stat.isArchived ? 0.6 : 1 }}>
                                            <td style={{ fontWeight: 700 }}>
                                                {stat.title}
                                                {stat.isArchived && <span className="rc-badge" style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: '#ef4444', color: '#fff' }}>Archived</span>}
                                            </td>
                                            <td style={{ textAlign: 'center', opacity: 0.6 }}>{stat.students || stat.enrollmentCount || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--stat-color-success)' }}>{stat.averageRating ? (stat.averageRating * 18).toFixed(0) : 0}%</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                                                    <button className="rc-pill-btn outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }} onClick={() => navigate(`/edit-course/${stat.id}`)}>
                                                        <i className="bi bi-eye" style={{ fontSize: '12px' }}></i> Edit
                                                    </button>
                                                    {!stat.isArchived && (
                                                        <button className="rc-pill-btn danger-outline" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleDelete(stat.id, stat.title)} disabled={deleteMutation.isPending}>
                                                            <i className="bi bi-trash" style={{ fontSize: '12px' }}></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Col>

                {/* ── Activity Feed ── */}
                <Col lg={4}>
                    <div className="rc-feed" style={{ height: '100%' }}>
                        <div className="rc-section-title" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem' }}>Recent Activity</div>
                        {recentActivity.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                                <i className="bi bi-graph-up" style={{ opacity: 0.15, fontSize: '28px', marginBottom: '0.5rem' }}></i>
                                <p style={{ opacity: 0.4, fontSize: '0.78rem', margin: 0 }}>Activity will appear here as students engage.</p>
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                {/* Timeline line */}
                                <div style={{ position: 'absolute', left: '4px', top: '10px', bottom: '10px', width: '1px', background: 'rgba(128,128,128,0.12)' }}></div>
                                {recentActivity.map(item => (
                                    <div className="rc-feed-item" key={item.id}>
                                        <div className="rc-feed-dot" style={{ background: item.type === 'success' ? 'var(--stat-color-success)' : item.type === 'info' ? 'var(--stat-color-info)' : item.type === 'warning' ? 'var(--stat-color-warning)' : 'var(--stat-color-purple)' }}></div>
                                        <div>
                                            <div className="rc-feed-text">{item.action}</div>
                                            <div className="rc-feed-detail">{item.detail}</div>
                                            <div className="rc-feed-time">{new Date(item.time).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default TeacherAnalytics;
