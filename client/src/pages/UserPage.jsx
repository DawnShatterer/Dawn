import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Users, Star, TrendingUp, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserPage = () => {
    return (
        <div className="bg-body-tertiary min-vh-100 font-sans pt-5">
            <Container className="py-5">
                <div className="text-center mb-5 pb-3">
                    <Users size={48} className="text-primary mb-3" />
                    <h1 className="fw-bolder display-5 text-body tracking-tight">Our Global Community</h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '650px' }}>
                        Join over 10,000 ambitious students and hundreds of expert teachers who are transforming the future of education on Dawn.
                    </p>
                </div>

                <Row className="g-4 mb-5">
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center bg-white">
                            <Card.Body className="p-5">
                                <h1 className="display-4 fw-bolder text-primary mb-2">10K+</h1>
                                <h5 className="fw-bold mb-3">Active Students</h5>
                                <p className="text-muted small">
                                    Learners from over 15 countries are actively completing assignments and earning verified certificates.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center bg-primary text-white">
                            <Card.Body className="p-5">
                                <h1 className="display-4 fw-bolder mb-2">500+</h1>
                                <h5 className="fw-bold mb-3">Expert Teachers</h5>
                                <p className="text-white-50 small">
                                    Industry leaders and professors from top universities around the world bringing you premium content.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center bg-white">
                            <Card.Body className="p-5">
                                <h1 className="display-4 fw-bolder text-success mb-2">98%</h1>
                                <h5 className="fw-bold mb-3">Completion Rate</h5>
                                <p className="text-muted small">
                                    Our interactive UI and AI-driven recommendations keep user retention at an industry-leading high.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5 bg-white p-5">
                    <h3 className="fw-bold mb-4 text-center">What Our Users Are Saying</h3>
                    <Row className="g-4">
                        {[
                            { name: "Sarah Jenkins", role: "Software Engineer", review: "The C# course on Dawn completely changed my career trajectory. The UI is incredibly smooth.", rating: 5 },
                            { name: "Rahul Sharma", role: "University Student", review: "The live classes and discussion forums make it feel exactly like a real physical university.", rating: 5 },
                            { name: "David Chen", role: "Instructor", review: "Teaching on Dawn is a breeze. The analytics and auto-grading save me hundreds of hours.", rating: 5 }
                        ].map((rev, i) => (
                            <Col md={4} key={i}>
                                <div className="p-4 bg-body-tertiary rounded-4 h-100">
                                    <div className="d-flex mb-3 text-warning">
                                        {[...Array(rev.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                                    </div>
                                    <p className="fst-italic text-muted small mb-4">"{rev.review}"</p>
                                    <div className="d-flex align-items-center mt-auto">
                                        <div className="bg-primary rounded-circle me-3" style={{ width: '40px', height: '40px', backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 20})`, backgroundSize: 'cover' }}></div>
                                        <div>
                                            <h6 className="fw-bold mb-0">{rev.name}</h6>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{rev.role}</small>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card>

                <div className="text-center mt-5 mb-5">
                    <h4 className="fw-bold mb-4">Ready to become a Dawn User?</h4>
                    <Link to="/register" className="btn btn-primary px-5 py-3 fw-bold rounded-pill mx-2 shadow-sm">Join as Student</Link>
                    <Link to="/register" className="btn btn-outline-dark px-5 py-3 fw-bold rounded-pill mx-2 bg-white">Apply as Teacher</Link>
                </div>
            </Container>
        </div>
    );
};

export default UserPage;
