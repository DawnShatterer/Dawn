import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyEnrollments } from '../api/enrollmentService';
import { getStudentEngagement } from '../api/analyticsService';
import { Row, Col, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import { getFileUrl } from '../utils/fileUtils';
import SkeletonCourseCard from '../components/SkeletonCourseCard';

const MyCourses = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    
    const { data: enrollments, isLoading, isError } = useQuery({
        queryKey: ['my-enrollments'],
        queryFn: getMyEnrollments
    });
    
    const { data: engagementData } = useQuery({ 
        queryKey: ['student-engagement'], 
        queryFn: getStudentEngagement 
    });

    // Pagination logic
    const totalPages = Math.ceil((enrollments?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentEnrollments = enrollments?.slice(startIndex, endIndex) || [];

    if (isError) {
        return (
            <div className="rc-page">
                <Alert variant="danger">Failed to load your courses. Please try again later.</Alert>
            </div>
        );
    }

    const chartTextColor = 'var(--chart-text-color)';

    return (
        <div className="rc-page">
            {/* ── Header ── */}
            <div className="rc-page-header">
                <h2>My Classrooms</h2>
                <p>Continue where you left off in your enrolled subjects.</p>
            </div>

            {/* ── Study Analysis Stats ── */}
            <div className="rc-section-title">
                Study Analysis
                <span className="rc-badge" style={{ background: 'var(--stat-bg-success)', color: 'var(--stat-color-success)', marginLeft: 'auto' }}>Last 7 Days</span>
            </div>

            <Row className="g-3 mb-4">
                <Col lg={8}>
                    <div className="rc-chart-card">
                        <div className="rc-chart-header">
                            <div className="rc-chart-title">
                                <i className="bi bi-graph-up" style={{ fontSize: '16px', color: 'var(--stat-color-success)' }}></i>
                                Learning Velocity
                            </div>
                            <span style={{ fontSize: '0.72rem', opacity: 0.4 }}>Daily study minutes</span>
                        </div>
                        <div style={{ height: '220px' }}>
                            {engagementData?.dailyActivity && engagementData.dailyActivity.length > 0 ? (
                                <Bar 
                                    data={{
                                        labels: engagementData.dailyActivity.map(d => d.day || d.Day),
                                        datasets: [{
                                            label: 'Minutes',
                                            data: engagementData.dailyActivity.map(d => d.minutes || d.Minutes || 0),
                                            backgroundColor: 'var(--stat-bg-success)',
                                            borderColor: 'var(--stat-color-success)',
                                            borderWidth: 2,
                                            borderRadius: 8,
                                            borderSkipped: false,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: { 
                                            y: { beginAtZero: true, grid: { color: 'var(--chart-grid-color)' }, ticks: { color: chartTextColor, font: { size: 10 } } },
                                            x: { grid: { display: false }, ticks: { color: chartTextColor, font: { size: 10, weight: '600' } } }
                                        },
                                        plugins: { legend: { display: false }, tooltip: { cornerRadius: 8, padding: 12, backgroundColor: '#1a1d23' } }
                                    }}
                                />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                    <i className="bi bi-clock" style={{ fontSize: '36px', marginBottom: '0.5rem' }}></i>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>No activity tracked this week yet.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Col>
                <Col lg={4}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                        <div className="rc-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div className="rc-stat-icon" style={{ background: 'var(--stat-bg-warning)' }}>
                                    <i className="bi bi-fire" style={{ fontSize: '20px', color: 'var(--stat-color-warning)' }}></i>
                                </div>
                                <div>
                                    <div className="rc-stat-value">{engagementData?.streak || 0}</div>
                                    <div className="rc-stat-label">Day Streak</div>
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '0.72rem', opacity: 0.4, margin: 0, lineHeight: 1.4 }}>
                                Consistent learning increases retention by <span style={{ color: 'var(--stat-color-success)', fontWeight: 700 }}>40%</span>.
                            </p>
                        </div>
                        <div className="rc-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div className="rc-stat-icon" style={{ background: 'var(--stat-bg-info)' }}>
                                    <i className="bi bi-clock" style={{ fontSize: '20px', color: 'var(--stat-color-info)' }}></i>
                                </div>
                                <div>
                                    <div className="rc-stat-value">{engagementData?.recentSessionCount || 0}</div>
                                    <div className="rc-stat-label">Sessions Logged</div>
                                </div>
                            </div>
                            <div className="rc-progress-wrap" style={{ marginBottom: 0 }}>
                                <div className="rc-progress-label">
                                    <span>Weekly Goal</span>
                                    <span>5 Hrs</span>
                                </div>
                                <div className="rc-progress-bar">
                                    <div className="rc-progress-fill" style={{ width: `${engagementData?.totalMinutes ? Math.min((engagementData.totalMinutes / 300) * 100, 100) : 0}%`, background: 'var(--stat-color-info)' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* ── Enrolled Courses ── */}
            <div className="rc-section-title">Enrolled Courses</div>

            {isLoading ? (
                <Row className="g-3">
                    <SkeletonCourseCard count={6} />
                </Row>
            ) : enrollments?.length === 0 ? (
                <div className="rc-empty">
                    <i className="bi bi-book" style={{ fontSize: '42px', opacity: 0.3 }}></i>
                    <h5>No Enrollments Yet</h5>
                    <p>You haven't enrolled in any courses yet. Explore our catalog to find something that interests you!</p>
                    <button className="rc-pill-btn primary" onClick={() => navigate('/courses')}>Browse Subjects</button>
                </div>
            ) : (
                <>
                    <Row className="g-3">
                        {currentEnrollments.map((enrollment) => (
                            <Col key={enrollment.id} lg={6} xl={4}>
                                <div className="rc-enrollment-card" onClick={() => navigate(`/courses/${enrollment.courseId}`)}>
                                    <div className="rc-enroll-thumb">
                                        {enrollment.thumbnailUrl ? (
                                            <img src={getFileUrl(enrollment.thumbnailUrl)} alt="Thumbnail" />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'var(--stat-bg-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="bi bi-book" style={{ fontSize: '32px', opacity: 0.15 }}></i>
                                            </div>
                                        )}
                                        <span className="rc-badge" style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--stat-color-success)', color: '#fff' }}>
                                            {enrollment.category || 'General'}
                                        </span>
                                    </div>
                                    <div className="rc-enroll-body">
                                        <div className="rc-enroll-title">{enrollment.title}</div>
                                        <div className="rc-enroll-meta">{enrollment.instructorName || 'Dawn Instructor'}</div>
                                        
                                        <div className="rc-progress-wrap">
                                            <div className="rc-progress-label">
                                                <span>Progress</span>
                                                <span style={{ color: 'var(--stat-color-success)' }}>{enrollment.progress || 0}%</span>
                                            </div>
                                            <div className="rc-progress-bar">
                                                <div className="rc-progress-fill" style={{ width: `${enrollment.progress || 0}%`, background: 'var(--stat-color-success)' }}></div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <button className="rc-continue-btn" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/courses/${enrollment.courseId}`); }}>
                                                <i className="bi bi-play-circle" style={{ fontSize: '16px' }}></i> Continue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                            <button 
                                className="rc-pill-btn secondary" 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                            >
                                <i className="bi bi-chevron-left"></i> Previous
                            </button>
                            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                className="rc-pill-btn secondary" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                            >
                                Next <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}


        </div>
    );
};

export default MyCourses;
