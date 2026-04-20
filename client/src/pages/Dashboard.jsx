import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { getMyEnrollments } from '../api/enrollmentService';
import { getUserInfo } from '../utils/authUtils';
import api from '../api/axios';
import { Row, Col } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import SkeletonDashboardStats from '../components/SkeletonDashboardStats';

const Dashboard = () => {
    const user = getUserInfo();
    const navigate = useNavigate();
    const userRole = user?.role?.toLowerCase();
    const isStudent = userRole === 'student';
    const isTeacher = userRole === 'teacher';
    const isAdmin = userRole === 'admin';

    const [dashboardSearch, setDashboardSearch] = React.useState('');

    const handleDashboardSearch = (e) => {
        e.preventDefault();
        if (dashboardSearch.trim()) {
            navigate(`/courses?q=${encodeURIComponent(dashboardSearch.trim())}`);
        }
    };

    if (isAdmin) {
        return <Navigate to="/admin-home" replace />;
    }

    if (userRole === 'staff') {
        return <Navigate to="/admin-home" replace />;
    }

    const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({ queryKey: ['my-enrollments'], queryFn: getMyEnrollments, enabled: isStudent });
    const { data: studentStats } = useQuery({ queryKey: ['student-analytics'], queryFn: async () => { const res = await api.get('/Analytics/student'); return res.data; }, enabled: isStudent });
    const { data: teacherStats } = useQuery({ queryKey: ['teacher-analytics'], queryFn: async () => { const res = await api.get('/Analytics/teacher'); return res.data; }, enabled: isTeacher });
    
    // Fetch teacher's courses directly
    const { data: teacherCourses } = useQuery({ 
        queryKey: ['teacher-courses'], 
        queryFn: async () => { 
            const res = await api.get('/Courses?limit=100'); 
            const allCourses = res.data?.items || res.data?.data || res.data || [];
            return Array.isArray(allCourses) ? allCourses.filter(c => c.instructorId === user?.id) : [];
        }, 
        enabled: isTeacher 
    });

    // Removed full-page blocking spinner to allow smooth PageTransition entry.

    // ═══════════════════════════════════════
    // ═══ STUDENT DASHBOARD — Refined Clean ═══
    // ═══════════════════════════════════════
    if (isStudent) {
        if (!user?.batchId) {
            return (
                <div className="sd-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                        <i className="bi bi-book" style={{ marginBottom: '1rem', fontSize: '48px' }}></i>
                        <h3 className="fw-bold">No Batch Assigned</h3>
                        <p>Your account has been verified, but you have not been assigned to an academic batch yet.<br/>Please contact the administration office to be assigned to a batch.</p>
                        <p className="text-muted small mt-3">Student ID: {user?.email}</p>
                    </div>
                </div>
            );
        }
        const completedCount = studentStats?.stats?.coursesCompleted || 0;
        const inProgressCount = studentStats?.stats?.coursesInProgress || enrollments?.length || 0;
        const hoursStudied = studentStats?.stats?.totalHoursStudied || studentStats?.stats?.hoursStudied || 0;

        return (
            <div className="sd-wrapper">
                <Row className="g-4">
                    {/* ══════ LEFT MAIN CONTENT ══════ */}
                    <Col lg={8} xl={9}>

                        {/* ── Greeting ── */}
                        <div className="sd-greeting mb-4">
                            <h2>
                                Welcome back,
                                <span>{user?.name || 'Student'}</span>
                            </h2>
                        </div>

                        {/* ── Stat Pills ── */}
                        {enrollmentsLoading ? (
                            <SkeletonDashboardStats count={4} />
                        ) : (
                            <div className="sd-stat-row mb-4">
                                <div className="sd-stat-pill">
                                    <div className="sd-stat-icon" style={{ background: 'rgba(52,130,82,0.1)' }}>
                                        <i className="bi bi-book" style={{ color: '#348252', fontSize: '16px' }}></i>
                                    </div>
                                    <div>
                                        <div className="sd-stat-label">Active Courses</div>
                                        <div className="sd-stat-value">{inProgressCount}</div>
                                    </div>
                                </div>
                                <div className="sd-stat-pill">
                                    <div className="sd-stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                        <i className="bi bi-mortarboard" style={{ color: '#3b82f6', fontSize: '16px' }}></i>
                                    </div>
                                    <div>
                                        <div className="sd-stat-label">Completed</div>
                                        <div className="sd-stat-value">{completedCount}</div>
                                    </div>
                                </div>
                                <div className="sd-stat-pill">
                                    <div className="sd-stat-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>
                                        <i className="bi bi-clock" style={{ color: '#8b5cf6', fontSize: '16px' }}></i>
                                    </div>
                                    <div>
                                        <div className="sd-stat-label">Hours Studied</div>
                                        <div className="sd-stat-value">{hoursStudied}h</div>
                                    </div>
                                </div>
                                <div className="sd-stat-pill">
                                    <div className="sd-stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
                                        <i className="bi bi-clipboard-check" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
                                    </div>
                                    <div>
                                        <div className="sd-stat-label">Achievements</div>
                                        <div className="sd-stat-value">{completedCount}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Action Grid (2 rows × 3 cols) ── */}
                        <div className="sd-action-grid mb-4">
                            {/* Row 1 */}
                            <div className="sd-action-card" onClick={() => navigate('/my-courses')}>
                                <div className="sd-action-icon" style={{ background: 'rgba(52,130,82,0.08)' }}>
                                    <i className="bi bi-book" style={{ color: '#348252', fontSize: '20px' }}></i>
                                </div>
                                <p className="sd-action-title">Active Courses</p>
                                <p className="sd-action-desc">Track and manage your ongoing courses.</p>
                            </div>

                            <div className="sd-action-card sd-action-highlight" onClick={() => navigate('/my-courses')}>
                                <div className="sd-action-icon" style={{ background: 'rgba(52,130,82,0.15)' }}>
                                    <i className="bi bi-bullseye" style={{ color: '#348252', fontSize: '22px' }}></i>
                                </div>
                                <p className="sd-action-title">My Learning</p>
                                <p className="sd-action-desc">Resume videos and course materials.</p>
                            </div>

                            <div className="sd-action-card" onClick={() => navigate('/my-courses')}>
                                <div className="sd-action-icon" style={{ background: 'rgba(59,130,246,0.08)' }}>
                                    <i className="bi bi-clipboard-check" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
                                </div>
                                <p className="sd-action-title">Quizzes</p>
                                <p className="sd-action-desc">Take assessments and view your scores.</p>
                            </div>



                            <div className="sd-action-card" onClick={() => navigate('/messages')}>
                                <div className="sd-action-icon" style={{ background: 'rgba(139,92,246,0.08)' }}>
                                    <i className="bi bi-chat-dots" style={{ color: '#8b5cf6', fontSize: '20px' }}></i>
                                </div>
                                <p className="sd-action-title">Community Hub</p>
                                <p className="sd-action-desc">Connect with peers and instructors.</p>
                            </div>

                            <div className="sd-action-card" onClick={() => navigate('/courses')}>
                                <div className="sd-action-icon" style={{ background: 'rgba(236,72,153,0.08)' }}>
                                    <i className="bi bi-compass" style={{ color: '#ec4899', fontSize: '20px' }}></i>
                                </div>
                                <p className="sd-action-title">Explore</p>
                                <p className="sd-action-desc">Discover new courses and resources.</p>
                            </div>

                            <div className="sd-action-card" onClick={() => navigate('/support')}>
                                <div className="sd-action-icon" style={{ background: 'rgba(239,68,68,0.08)' }}>
                                    <i className="bi bi-question-circle" style={{ color: '#ef4444', fontSize: '20px' }}></i>
                                </div>
                                <p className="sd-action-title">Support Service</p>
                                <p className="sd-action-desc">Get academic or technical help.</p>
                            </div>
                        </div>




                    </Col>

                    {/* ══════ RIGHT SIDEBAR ══════ */}
                    <Col lg={4} xl={3}>

                        {/* ── Quick Search ── */}
                        <form onSubmit={handleDashboardSearch} className="sd-search-bar mb-4">
                            <i className="bi bi-search" style={{ opacity: 0.35, flexShrink: 0, fontSize: '15px' }}></i>
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={dashboardSearch}
                                onChange={(e) => setDashboardSearch(e.target.value)}
                            />
                            <button type="submit" className="sd-search-btn">Find</button>
                        </form>

                        {/* ── Module Completion ── */}
                        <div className="sd-sidebar-section">
                            <div className="sd-sidebar-title">Module Completion</div>
                            {enrollments?.length > 0 ? (
                                enrollments.slice(0, 5).map(e => (
                                    <div key={e.id} className="sd-progress-item">
                                        <div className="sd-progress-label">
                                            <span className="sd-course-code">{e.courseTitle}</span>
                                            <span className="sd-progress-text">{e.progress}% Progress</span>
                                        </div>
                                        <div className="sd-progress-bar-track">
                                            <div className="sd-progress-bar-fill" style={{ width: `${Math.min(e.progress, 100)}%` }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0', opacity: 0.35 }}>
                                    <i className="bi bi-bullseye" style={{ marginBottom: '0.5rem', fontSize: '32px' }}></i>
                                    <p style={{ fontSize: '0.78rem', margin: 0 }}>No courses enrolled yet.</p>
                                </div>
                            )}
                        </div>


                    </Col>
                </Row>
            </div>
        );
    }

    // ═════════════════════════════════════
    // ═══ TEACHER VIEW — Refined Clean ═══
    // ═════════════════════════════════════
    const myCourses = teacherCourses || [];

    return (
        <div className="td-wrapper">

            {/* ── Header ── */}
            <div className="td-header">
                <div>
                    <h2>
                        Instructor Studio
                        <span style={{ display: 'inline', marginLeft: '0.5rem', fontSize: '0.55rem', background: '#1a1d23', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, verticalAlign: 'middle' }}>Creator Mode</span>
                    </h2>
                    <p style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: '0.3rem', margin: 0 }}>Manage your course portfolio and track student engagement.</p>
                </div>
                <div className="td-header-actions">
                    <form onSubmit={handleDashboardSearch} className="sd-search-bar">
                        <i className="bi bi-search" style={{ opacity: 0.35, flexShrink: 0, fontSize: '15px' }}></i>
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={dashboardSearch}
                            onChange={(e) => setDashboardSearch(e.target.value)}
                        />
                        <button type="submit" className="sd-search-btn">Find</button>
                    </form>
                </div>
            </div>

            {/* ── Stat Pills ── */}
            <div className="td-stat-row">
                <div className="td-stat-pill">
                    <div className="td-stat-icon" style={{ background: 'rgba(52,130,82,0.1)' }}>
                        <i className="bi bi-people" style={{ color: '#348252', fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div className="td-stat-label">Total Audience</div>
                        <div className="td-stat-value">{teacherStats?.overview?.totalStudents || 0}</div>
                        <div className="td-stat-sub">
                            <i className="bi bi-check-circle" style={{ marginRight: '3px', fontSize: '10px' }}></i>
                            {teacherStats?.overview?.recentEnrollments || 0} new this week
                        </div>
                    </div>
                </div>
                <div className="td-stat-pill">
                    <div className="td-stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <i className="bi bi-book" style={{ color: '#3b82f6', fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div className="td-stat-label">Assigned Courses</div>
                        <div className="td-stat-value">{myCourses.length}</div>
                        <div className="td-stat-sub" style={{ color: '#3b82f6' }}>Active in catalog</div>
                    </div>
                </div>
                <div className="td-stat-pill">
                    <div className="td-stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <i className="bi bi-trophy" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div className="td-stat-label">Avg. Progress</div>
                        <div className="td-stat-value">{teacherStats?.overview?.averageProgress ? Math.round(teacherStats.overview.averageProgress) + '%' : '0%'}</div>
                        <div className="td-stat-sub" style={{ color: '#f59e0b' }}>Across all batches</div>
                    </div>
                </div>
            </div>

            {/* ── Course Portfolio ── */}
            <div className="td-section-title">Your Course Portfolio</div>

            {myCourses.length > 0 ? (
                Object.entries(
                    myCourses.reduce((acc, course) => {
                        const cat = course.category || 'General';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(course);
                        return acc;
                    }, {})
                ).map(([category, courses]) => (
                    <div key={category} style={{ marginBottom: '2rem' }}>
                        <div className="td-category-label">{category}<span className="ms-2 fw-normal" style={{ fontSize: '0.85rem', opacity: 0.7 }}>({courses.length})</span></div>
                        <Row className="g-3">
                            {courses.map(course => (
                                <Col key={course.id} xs={12} md={6} lg={4}>
                                    <div className="td-course-card" onClick={() => navigate(`/courses/${course.id}`)}>
                                        <div className="td-card-status">Active</div>
                                        <p className="td-card-title">{course.title}</p>
                                        <p className="td-card-desc">
                                            {course.description ? (course.description.length > 80 ? course.description.substring(0, 80) + '...' : course.description) : 'No description.'}
                                        </p>
                                        <div className="td-card-footer">
                                            <span className="td-card-price" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Module</span>
                                            <button className="td-manage-btn" onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}>
                                                <i className="bi bi-eye" style={{ fontSize: '12px' }}></i> Manage
                                            </button>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))
            ) : (
                <div className="td-empty">
                    <i className="bi bi-book" style={{ opacity: 0.3, fontSize: '42px' }}></i>
                    <h5>No Modules Assigned</h5>
                    <p>You have not been assigned to any modules yet. Please contact the administration.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;