import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Container, Card, Table, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { Trophy, Medal, Award, User, Star } from 'lucide-react';

const Leaderboard = () => {
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const res = await api.get('/Points/leaderboard');
            return res.data;
        }
    });

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Trophy className="text-warning" size={24} />;
            case 1: return <Medal className="text-secondary" size={22} />;
            case 2: return <Medal className="text-danger" size={20} style={{ color: '#cd7f32' }} />;
            default: return <span className="fw-bold text-muted">{index + 1}</span>;
        }
    };

    const getBadgeColor = (points) => {
        if (points >= 5000) return 'warning';
        if (points >= 2500) return 'info';
        return 'success';
    };

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Calculating rankings...</p>
            </Container>
        );
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5159';

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 shadow-sm">
                    <Trophy size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="fw-bold mb-0">Dawn Hall of Fame</h2>
                    <p className="text-muted mb-0">Top learners earning Dawn Points through consistency and excellence.</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <Card.Body className="p-0">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="bg-body-tertiary">
                            <tr className="border-bottom">
                                <th className="ps-4 py-3 text-uppercase small fw-bold text-muted" style={{ width: '80px' }}>Rank</th>
                                <th className="py-3 text-uppercase small fw-bold text-muted">Learner</th>
                                <th className="py-3 text-uppercase small fw-bold text-muted text-center">Grade</th>
                                <th className="py-3 text-uppercase small fw-bold text-muted text-end pe-4">Dawn Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard?.map((user, index) => (
                                <tr key={user.id} className={index < 3 ? 'bg-primary bg-opacity-05' : ''}>
                                    <td className="ps-4 py-3 fw-bold align-middle">
                                        <div className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            {getRankIcon(index)}
                                        </div>
                                    </td>
                                    <td className="py-3 align-middle">
                                        <div className="d-flex align-items-center">
                                            {user.profilePictureUrl ? (
                                                <img 
                                                    src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${apiBase}${user.profilePictureUrl}`} 
                                                    alt="Avatar" 
                                                    className="rounded-circle me-3 shadow-sm border border-2 border-white" 
                                                    style={{ width: '42px', height: '42px', objectFit: 'cover' }} 
                                                />
                                            ) : (
                                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3 shadow-sm border border-2 border-white" style={{ width: '42px', height: '42px' }}>
                                                    <User size={20} className="text-muted" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="fw-bold text-body">{user.fullName || 'Anonymous User'}</div>
                                                {index === 0 && <small className="text-primary fw-bold" style={{ fontSize: '0.7rem' }}>TOP ACHIEVER</small>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center align-middle">
                                        <Badge bg="light" text="dark" className="border px-3 py-2 fw-medium rounded-pill shadow-sm">
                                            {user.grade || 'N/A'}
                                        </Badge>
                                    </td>
                                    <td className="py-3 text-end pe-4 align-middle">
                                        <div className="d-inline-flex align-items-center">
                                            <Star size={14} className="text-warning me-2" fill="currentColor" />
                                            <span className={`fw-bolder fs-5 text-${getBadgeColor(user.totalPoints)}`}>
                                                {user.totalPoints.toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leaderboard?.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted">
                                        No data available yet. Start earning points!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Row className="g-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 p-3 h-100 text-center">
                        <Award size={32} className="text-warning mx-auto mb-2" />
                        <h6 className="fw-bold">Redeem Rewards</h6>
                        <p className="text-muted small mb-0">Use your points to get huge discounts on course enrollments.</p>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 p-3 h-100 text-center">
                        <medallion size={32} className="text-info mx-auto mb-2" />
                        <medallion size={32} className="text-info mx-auto mb-2" />
                        <medallion size={32} className="text-info mx-auto mb-2" />
                        < medal size={32} className="text-info mx-auto mb-2" />
                        <Medal size={32} className="text-info mx-auto mb-2" />
                        <h6 className="fw-bold">Climb Higher</h6>
                        <p className="text-muted small mb-0">Complete daily tasks and assignments to boost your rank.</p>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 p-3 h-100 text-center">
                        <Award size={32} className="text-success mx-auto mb-2" />
                        <h6 className="fw-bold">Exclusive Access</h6>
                        <p className="text-muted small mb-0">Top rankers get early access to new subjects and features.</p>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .bg-primary-bg-opacity-05 { background-color: rgba(var(--bs-primary-rgb), 0.05); }
                [data-bs-theme="dark"] .bg-body-tertiary { background-color: rgba(255, 255, 255, 0.03) !important; }
            `}</style>
        </Container>
    );
};

export default Leaderboard;
